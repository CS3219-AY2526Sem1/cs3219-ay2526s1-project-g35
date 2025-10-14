const app = require('./index');
const { connectDB } = require('./config/database');
require('dotenv').config();

const PORT = process.env.PORT || 8000;

/**
 * Start Server
 * Connect to MongoDB first, then start the Express server
 */
const startServer = async () => {
  try {
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
