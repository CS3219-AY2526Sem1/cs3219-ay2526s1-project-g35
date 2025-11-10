const app = require('./index');
const { connectDB, closeDB } = require('../config/database');
const { initializeSecrets } = require('../config/secretManager');
require('dotenv').config();

const PORT = process.env.PORT || 8004;

const startServer = async () => {
  try {
    if (process.env.USE_SECRET_MANAGER === 'true') {
      console.log('USE_SECRET_MANAGER is enabled, loading secrets...');
      await initializeSecrets();
    } else {
      console.log('USE_SECRET_MANAGER is not enabled, using local environment variables');
    }

    console.log('Connecting to PostgreSQL...');
    await connectDB();

    require('../models/History');
    console.log('Models initialized successfully');

    const server = app.listen(PORT, () => {
      console.log(`✓ History Service running on port ${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✓ API Documentation: http://localhost:${PORT}/api-docs`);
      console.log(`✓ Health Check: http://localhost:${PORT}/health`);
    });

    const gracefulShutdown = async (signal) => {
      console.log(`\n${signal} received, closing server gracefully...`);

      server.close(async () => {
        console.log('HTTP server closed');

        try {
          await closeDB();
          console.log('Database connection closed');
          process.exit(0);
        } catch (error) {
          console.error('Error during graceful shutdown:', error);
          process.exit(1);
        }
      });

      setTimeout(() => {
        console.error('Forcing shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
