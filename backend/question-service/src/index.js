const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();

// Import routes
const questionRoutes = require('./routes/question-routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true, // Allow cookies to be sent
}));
app.use(morgan('combined'));
app.use(cookieParser()); // Parse cookies from requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'QuestionService',
    timestamp: new Date().toISOString(),
  });
});

// Mount question routes
app.use('/api/questions', questionRoutes);

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
