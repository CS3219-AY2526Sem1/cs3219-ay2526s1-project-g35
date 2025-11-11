const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const historyRoutes = require('../routes/historyRoutes');
const { errorHandler, notFoundHandler } = require('../middleware/errorHandler');
const { setupSwagger } = require('../config/swagger');

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

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'History Service is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.use((req, res, next) => {
  console.log(`[History Service] ${req.method} ${req.path} - Query:`, req.query);
  next();
});

// API Routes - Ingress forwards full path, so we need /api/history
app.use('/api/history', historyRoutes);

app.use(notFoundHandler);

app.use(errorHandler);

module.exports = app;
