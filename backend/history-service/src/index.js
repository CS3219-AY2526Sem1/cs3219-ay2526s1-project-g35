const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const historyRoutes = require('../routes/historyRoutes');
const { errorHandler, notFoundHandler } = require('../middleware/errorHandler');
const { setupSwagger } = require('../config/swagger');

/**
 * Express Application Setup
 * Configures middleware and routes for the History Service
 */

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com'],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com'],
        imgSrc: ["'self'", 'data:', 'https://validator.swagger.io'],
      },
    },
  })
);

const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

setupSwagger(app);

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'History Service is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * @swagger
 * /:
 *   get:
 *     summary: Root endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service information
 */
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'History Service',
    version: '1.0.0',
    description: 'Tracks user question attempts and provides statistics',
    endpoints: {
      health: '/health',
      docs: '/api-docs',
      history: {
        create: 'POST /history',
        getUserHistory: 'GET /history?user_id=:userId',
      },
      admin: {
        stats: 'GET /admin/stats',
        statsByCategory: 'GET /admin/stats/category',
        statsByDifficulty: 'GET /admin/stats/difficulty',
        statsByUser: 'GET /admin/stats/user',
      },
    },
  });
});

// API Routes
app.use('/', historyRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
