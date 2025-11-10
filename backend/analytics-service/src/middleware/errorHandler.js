const createError = require('http-errors');

const notFoundHandler = (req, res, next) => {
  next(createError(404, 'Resource not found'));
};

const globalErrorHandler = (err, req, res, next) => {
  // eslint-disable-line @typescript-eslint/no-unused-vars
  const statusCode = err.status || 500;
  const message = err.message || 'Internal Server Error';

  if (statusCode >= 500) {
    console.error('Analytics service error:', err);
  }

  res.status(statusCode).json({
    success: false,
    error: err.name || 'Error',
    message,
    details: err.details || undefined,
  });
};

module.exports = {
  notFoundHandler,
  globalErrorHandler,
};
