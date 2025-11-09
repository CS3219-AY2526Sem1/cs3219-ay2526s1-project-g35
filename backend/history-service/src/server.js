const app = require('./index');
const { connectDB, closeDB } = require('../config/database');
const { initializeSecrets } = require('../config/secretManager');
require('dotenv').config();

const PORT = process.env.PORT || 8004;

/**
 * Start Server
 * Load secrets from Secret Manager, connect to PostgreSQL, then start the Express server
 */
const startServer = async () => {
  try {
    // Load secrets from Google Secret Manager (if enabled)
    if (process.env.USE_SECRET_MANAGER === 'true') {
      console.log('USE_SECRET_MANAGER is enabled, loading secrets...');
      await initializeSecrets();
    } else {
      console.log('USE_SECRET_MANAGER is not enabled, using local environment variables');
    }

    // Connect to PostgreSQL
    console.log('Connecting to PostgreSQL...');
    await connectDB();

    // Initialize the History model
    require('../models/History');
    console.log('Models initialized successfully');

    // Start Express server
    const server = app.listen(PORT, () => {
      console.log(`✓ History Service running on port ${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✓ API Documentation: http://localhost:${PORT}/api-docs`);
      console.log(`✓ Health Check: http://localhost:${PORT}/health`);
    });

    // Graceful shutdown handlers
    const gracefulShutdown = async (signal) => {
      console.log(`\n${signal} received, closing server gracefully...`);

      // Stop accepting new connections
      server.close(async () => {
        console.log('HTTP server closed');

        try {
          // Close database connection
          await closeDB();
          console.log('Database connection closed');
          process.exit(0);
        } catch (error) {
          console.error('Error during graceful shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('Forcing shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Handle termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
