/**
 * Base Error Classes
 * Custom error classes for better error handling
 */

class AppError extends Error {
  constructor(message, statusCode, errorCode) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found', errorCode = 'NOT_FOUND') {
    super(message, 404, errorCode);
  }
}

class BadRequestError extends AppError {
  constructor(message = 'Bad request', errorCode = 'BAD_REQUEST') {
    super(message, 400, errorCode);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation failed', errorCode = 'VALIDATION_ERROR', details = null) {
    super(message, 400, errorCode);
    this.details = details;
  }
}

class InternalServerError extends AppError {
  constructor(message = 'Internal server error', errorCode = 'INTERNAL_ERROR') {
    super(message, 500, errorCode);
  }
}

module.exports = {
  AppError,
  NotFoundError,
  BadRequestError,
  ValidationError,
  InternalServerError,
};
