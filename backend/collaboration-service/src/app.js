const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const SessionManager = require('../models/SessionManager');
const { setupSocketHandlers } = require('../utils/socketHandlers');
const { socketAuthMiddleware, socketAuthMiddlewareDev } = require('../middleware/socketAuth');
const { httpAuthMiddleware, httpAuthMiddlewareDev } = require('../middleware/httpAuth');
const { initRedis, closeRedis } = require('../config/redis');
const ServiceIntegration = require('../utils/serviceIntegration');

const app = express();
const server = http.createServer(app);

// Initialize Session Manager and Service Integration
const sessionManager = new SessionManager();
const serviceIntegration = new ServiceIntegration();

// Socket.IO setup with CORS
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*', // Use environment variable or allow all
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Use authentication middleware for socket connections
// Use dev mode if NODE_ENV is not production
if (process.env.NODE_ENV === 'production') {
  io.use(socketAuthMiddleware);
  console.log('Using production authentication middleware');
} else {
  io.use(socketAuthMiddlewareDev);
  console.log('Using development authentication middleware');
}

// Setup socket event handlers
setupSocketHandlers(io, sessionManager);

const PORT = process.env.PORT || 8000;

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*', // Use environment variable or allow all
    credentials: true,
  }),
);
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Select auth middleware based on environment
const httpAuth = process.env.NODE_ENV === 'production' ? httpAuthMiddleware : httpAuthMiddlewareDev;

// Health check endpoint (public, no auth required)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'CollaborationService',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    stats: sessionManager.getStats(),
  });
});

// Get pending sessions (for debugging/admin) - MUST be before /api/sessions/:sessionId
app.get('/api/sessions/pending', httpAuth, (req, res) => {
  try {
    const pendingSessions = sessionManager.getPendingSessions();
    res.json({ success: true, pendingSessions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get session by user ID (for matched sessions) - MUST be before /api/sessions/:sessionId
app.get('/api/sessions/user/:userId', httpAuth, (req, res) => {
  try {
    const { userId } = req.params;
    const sessionId = sessionManager.getSessionByUserId(userId);

    if (!sessionId) {
      return res.status(404).json({ error: 'No session found for this user' });
    }

    const sessionData = sessionManager.getSessionData(sessionId);
    res.json({ success: true, sessionId, session: sessionData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get session info (REST endpoint) - MUST be after specific routes
app.get('/api/sessions/:sessionId', httpAuth, (req, res) => {
  try {
    const { sessionId } = req.params;
    const sessionData = sessionManager.getSessionData(sessionId);

    if (!sessionData) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ success: true, session: sessionData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all active sessions (admin endpoint)
app.get('/api/sessions', httpAuth, (req, res) => {
  try {
    const stats = sessionManager.getStats();
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new session (REST endpoint)
app.post('/api/sessions', httpAuth, (req, res) => {
  try {
    const { sessionId, code, language, problem } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const result = sessionManager.createSession(sessionId, {
      code,
      language,
      problem,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a matched session from matching service (requires auth)
app.post('/api/sessions/matched', httpAuth, async (req, res) => {
  try {
    const { userIds, questionId } = req.body;

    // Validate input
    if (!userIds || !Array.isArray(userIds) || userIds.length !== 2) {
      return res.status(400).json({ error: 'Exactly 2 user IDs are required' });
    }

    if (!questionId) {
      return res.status(400).json({ error: 'Question ID is required' });
    }

    // Fetch question details from question service
    const questionResult = await serviceIntegration.getQuestionDetails(questionId);
    let questionDetails = null;

    if (questionResult.success) {
      questionDetails = questionResult.question;
    } else {
      console.warn(`Could not fetch question details: ${questionResult.error}`);
      // Continue without question details - session can still be created
    }

    // Create the matched session (SessionManager will generate sessionId)
    const result = sessionManager.createMatchedSession(userIds, questionId, questionDetails);

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Notify matching service that session is ready with the generated sessionId
    const notifyResult = await serviceIntegration.notifySessionReady(
      result.sessionId,
      userIds,
      questionId,
    );
    if (!notifyResult.success) {
      console.warn(`Could not notify matching service: ${notifyResult.error}`);
    }

    res.status(201).json({
      ...result,
      questionDetails: questionDetails,
      notificationSent: notifyResult.success,
    });
  } catch (error) {
    console.error('Error creating matched session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Service health check endpoint
app.get('/api/services/health', async (req, res) => {
  try {
    const healthStatus = await serviceIntegration.healthCheck();
    res.json({ success: true, services: healthStatus });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize Redis and start server
const startServer = async () => {
  try {
    // Initialize Redis (optional)
    await initRedis();

    // Start server
    server.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════╗
║   Collaboration Service Started            ║
╠════════════════════════════════════════════╣
║   Port: ${PORT.toString().padEnd(36)}║
║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(27)}║
║   Socket.IO: Active                        ║
╚════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('\nShutting down gracefully...');

  // Close socket connections
  io.close(() => {
    console.log('Socket.IO closed');
  });

  // Close Redis
  await closeRedis();

  // Close server
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error('Forcing shutdown...');
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start the server
startServer();

// Export for testing
module.exports = { app, server, io, sessionManager, serviceIntegration };
