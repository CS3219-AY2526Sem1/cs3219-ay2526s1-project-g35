const mongoose = require('mongoose');

/**
 * MongoDB Database Configuration
 */

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/questiondb';

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('MongoDB Connected Successfully!');
    console.log(`Database: ${mongoose.connection.name}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    // Handle application termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed due to app termination');
      process.exit(0);
    });
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    throw error;
  }
};

module.exports = { connectDB };
