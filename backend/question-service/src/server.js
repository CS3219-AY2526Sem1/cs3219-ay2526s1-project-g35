const app = require('./index');
const { connectDB } = require('./config/database');
const { initializeSecrets } = require('./config/secretManager');
require('dotenv').config();

const PORT = process.env.PORT || 8000;

/**
 * Start Server
 * Load secrets from Secret Manager, connect to MongoDB, then start the Express server
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

    // Start Express server
    app.listen(PORT, () => {
      console.log(`Question Service running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
