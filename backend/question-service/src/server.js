const app = require('./index');
const { connectDB } = require('./config/database');
const { initializeSecrets } = require('./config/secretManager');
const { initRedis, closeRedis } = require('./config/redis');
require('dotenv').config();

const PORT = process.env.PORT || 8000;

/**
 * Start Server
 * Load secrets from Secret Manager, connect to MongoDB and Redis, then start the Express server
 */
const startServer = async () => {
  try {
    // Load secrets from Google Secret Manager (if enabled)
    if (process.env.USE_SECRET_MANAGER === 'true') {
      console.log('USE_SECRET_MANAGER is enabled, loading secrets...');
      await initializeSecrets();
    } else {
      console.log('USE_SECRET_MANAGER is not enabled, skipping secret loading');
    }

    // Connect to MongoDB
    await connectDB();

    // Connect to Redis (graceful degradation if fails)
    try {
      await initRedis();
      console.log('✓ Redis caching enabled');
    } catch (error) {
      console.warn('⚠ Redis connection failed - running without cache:', error.message);
    }

    // Start Express server
    const server = app.listen(PORT, () => {
      console.log(`Question Service running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, closing server gracefully...');
      await closeRedis();
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      console.log('SIGINT received, closing server gracefully...');
      await closeRedis();
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
