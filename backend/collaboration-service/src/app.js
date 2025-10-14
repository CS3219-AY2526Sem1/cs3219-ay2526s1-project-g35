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
const { initRedis, closeRedis } = require('../config/redis');

const app = express();
const server = http.createServer(app);

// Initialize Session Manager
const sessionManager = new SessionManager();

// Socket.IO setup with CORS
const io = socketIo(server, {
  cors: {
    origin: '*', // Allow all origins for development/testing
    methods: ['GET', 'POST'],
    credentials: false,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Use authentication middleware for socket connections
// Use dev mode if NODE_ENV is not production
if (process.env.NODE_ENV === 'production') io.use(socketAuthMiddleware);
// } else {
//   io.use(socketAuthMiddlewareDev);
// }

// Setup socket event handlers
setupSocketHandlers(io, sessionManager);

const PORT = process.env.PORT || 8000;

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: '*', // Allow all origins for development/testing
    credentials: false,
  }),
);
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'CollaborationService',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    stats: sessionManager.getStats(),
  });
});

// Get session info (REST endpoint)
app.get('/api/sessions/:sessionId', (req, res) => {
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
app.get('/api/sessions', (req, res) => {
  try {
    const stats = sessionManager.getStats();
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new session (REST endpoint)
app.post('/api/sessions', (req, res) => {
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
  console.log('\n🔴 Shutting down gracefully...');

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
module.exports = { app, server, io, sessionManager };
