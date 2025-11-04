import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';

import userRoutes from './routes/user-routes.js';
import authRoutes from './routes/auth-routes.js';

const app = express();

// Trust proxy - required when behind Google Cloud Load Balancer
app.set('trust proxy', true);

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Security middleware
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
  }),
);

// Rate limiting
const rateLimitWindowMs = Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '900000') || 900000; // 15 minutes default
const rateLimitMax = Number.parseInt(process.env.RATE_LIMIT_MAX ?? '100') || 100;
const authRateLimitMax = Number.parseInt(process.env.AUTH_RATE_LIMIT_MAX ?? '5') || 5;

const limiter = rateLimit({
  windowMs: rateLimitWindowMs,
  max: rateLimitMax,
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
});

const authLimiter = rateLimit({
  windowMs: rateLimitWindowMs,
  max: authRateLimitMax,
  message: {
    error: 'Too many authentication attempts, please try again later.',
  },
  skipSuccessfulRequests: true,
  validate: { trustProxy: false },
});

app.use(limiter);

// Cookie parser for handling cookies
app.use(cookieParser());

// Body parsing middleware
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'https://peerprep.com',
      // Add your frontend domains here
    ];

    // Add origins from environment variable (from ConfigMap)
    if (process.env.ALLOWED_ORIGINS) {
      const envOrigins = process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());
      allowedOrigins.push(...envOrigins);
    }

    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push(origin);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`CORS blocked origin: ${origin}. Allowed origins:`, allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Additional CORS headers for manual setup
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (corsOptions.origin(origin, () => {})) {
    res.header('Access-Control-Allow-Origin', origin);
  }

  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  );
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, PUT, PATCH');
    return res.status(200).json({});
  }

  next();
});

// Email service debug endpoint (for development)
app.get('/debug/email-status', async (req, res) => {
  try {
    const { emailService } = await import('./services/email-service.js');
    const status = emailService.getStatus();

    res.status(200).json({
      message: 'Email service status',
      data: {
        ...status,
        environment: {
          EMAIL_ENABLED: process.env.EMAIL_ENABLED,
          EMAIL_PROVIDER: process.env.EMAIL_PROVIDER,
          EMAIL_FROM: process.env.EMAIL_FROM,
          MAILTRAP_HOST: process.env.MAILTRAP_HOST,
          MAILTRAP_PORT: process.env.MAILTRAP_PORT,
          MAILTRAP_USER: process.env.MAILTRAP_USER ? 'SET' : 'NOT_SET',
          MAILTRAP_PASS: process.env.MAILTRAP_PASS ? 'SET' : 'NOT_SET',
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to get email service status',
      error: error.message,
    });
  }
});
// Routes - handle both /api prefix (from ingress) and direct paths (for local dev)
app.use('/api/users', userRoutes);
app.use('/api/auth', authLimiter, authRoutes);
// Legacy routes for backward compatibility
app.use('/users', userRoutes);
app.use('/auth', authLimiter, authRoutes);

// Root endpoint
app.get('/', (req, res) => {
  console.log('Sending Greetings!');
  res.json({
    message: 'Hello World from user-service',
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      users: '/users',
      auth: '/auth',
    },
  });
});

// 404 Handler
app.use((req, res, next) => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  error.status = 404;
  next(error);
});

// Global Error Handler
app.use((error, req, res, next) => {
  console.error(`Error ${error.status || 500}: ${error.message}`);
  console.error(error.stack);

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(error.status || 500).json({
    error: {
      message: error.message,
      status: error.status || 500,
      ...(isDevelopment && { stack: error.stack }),
      timestamp: new Date().toISOString(),
    },
  });
});

export default app;
