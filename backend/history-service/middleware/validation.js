const Joi = require('joi');

/**
 * Request Validation Middleware
 * Validates request body, query parameters, and params using Joi schemas
 */

/**
 * Validation schemas for history service
 */
const schemas = {
  // Create history entry
  createHistory: Joi.object({
    user_id: Joi.string().trim().min(1).max(255).required().messages({
      'string.empty': 'User ID is required',
      'string.min': 'User ID must be at least 1 character',
      'string.max': 'User ID must not exceed 255 characters',
      'any.required': 'User ID is required',
    }),

    question_title: Joi.string().trim().min(1).max(500).required().messages({
      'string.empty': 'Question title is required',
      'string.min': 'Question title must be at least 1 character',
      'string.max': 'Question title must not exceed 500 characters',
      'any.required': 'Question title is required',
    }),

    difficulty: Joi.string().valid('Easy', 'Medium', 'Hard').required().messages({
      'any.only': 'Difficulty must be Easy, Medium, or Hard',
      'any.required': 'Difficulty is required',
    }),

    category: Joi.string().trim().min(1).max(255).required().messages({
      'string.empty': 'Category is required',
      'string.min': 'Category must be at least 1 character',
      'string.max': 'Category must not exceed 255 characters',
      'any.required': 'Category is required',
    }),
  }),

  // Get user history query parameters
  getUserHistory: Joi.object({
    user_id: Joi.string().trim().min(1).required().messages({
      'string.empty': 'User ID is required',
      'any.required': 'User ID is required',
    }),

    limit: Joi.number().integer().min(1).max(1000).default(100).optional().messages({
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit must not exceed 1000',
      'number.base': 'Limit must be a number',
    }),

    offset: Joi.number().integer().min(0).default(0).optional().messages({
      'number.min': 'Offset must be non-negative',
      'number.base': 'Offset must be a number',
    }),

    difficulty: Joi.string().valid('Easy', 'Medium', 'Hard').optional().messages({
      'any.only': 'Difficulty must be Easy, Medium, or Hard',
    }),

    category: Joi.string().trim().min(1).max(255).optional().messages({
      'string.min': 'Category must be at least 1 character',
      'string.max': 'Category must not exceed 255 characters',
    }),

    from_date: Joi.date().iso().optional().messages({
      'date.format': 'From date must be a valid ISO date',
    }),

    to_date: Joi.date().iso().min(Joi.ref('from_date')).optional().messages({
      'date.format': 'To date must be a valid ISO date',
      'date.min': 'To date must be after from date',
    }),
  }),
};

/**
 * Validate request body
 */
const validateBody = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Return all errors, not just the first one
      stripUnknown: true, // Remove unknown fields
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
      });
    }

    // Replace req.body with validated and sanitized value
    req.body = value;
    next();
  };
};

/**
 * Validate query parameters
 */
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
      });
    }

    req.query = value;
    next();
  };
};

/**
 * Validate URL parameters
 */
const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
      });
    }

    req.params = value;
    next();
  };
};

/**
 * Sanitize user input to prevent XSS and injection attacks
 */
const sanitizeInput = (req, res, next) => {
  // Sanitize body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  // Sanitize params
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

/**
 * Helper function to sanitize an object
 */
function sanitizeObject(obj) {
  const sanitized = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // Trim whitespace
      let sanitizedValue = value.trim();

      // Remove null bytes
      sanitizedValue = sanitizedValue.replace(/\0/g, '');

      sanitized[key] = sanitizedValue;
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

module.exports = {
  schemas,
  validateBody,
  validateQuery,
  validateParams,
  sanitizeInput,
};
