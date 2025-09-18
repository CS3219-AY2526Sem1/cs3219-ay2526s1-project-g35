import Joi from "joi";

/**
 * Validation schemas for user service
 */
export const userSchemas = {
  createUser: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required().messages({
      "string.alphanum": "Username must only contain alphanumeric characters",
      "string.min": "Username must be at least 3 characters long",
      "string.max": "Username cannot exceed 30 characters",
      "any.required": "Username is required",
    }),
    email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),
    password: Joi.string()
      .min(6)
      .max(128)
      .pattern(
        new RegExp(
          "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]"
        )
      )
      .required()
      .messages({
        "string.min": "Password must be at least 6 characters long",
        "string.max": "Password cannot exceed 128 characters",
        "string.pattern.base":
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
        "any.required": "Password is required",
      }),
    profile: Joi.object({
      firstName: Joi.string().max(50).optional(),
      lastName: Joi.string().max(50).optional(),
      bio: Joi.string().max(500).optional(),
    }).optional(),
  }),

  updateUser: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).optional(),
    email: Joi.string().email().optional(),
    password: Joi.string()
      .min(6)
      .max(128)
      .pattern(
        new RegExp(
          "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]"
        )
      )
      .optional(),
    profile: Joi.object({
      firstName: Joi.string().max(50).optional(),
      lastName: Joi.string().max(50).optional(),
      bio: Joi.string().max(500).optional(),
      avatar: Joi.string().uri().optional(),
    }).optional(),
  }).min(1),
  updatePrivilege: Joi.object({
    isAdmin: Joi.boolean().required(),
  }),

  // Login validation
  login: Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),
    password: Joi.string().required().messages({
      "any.required": "Password is required",
    }),
  }),
  getUsersQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string()
      .valid("createdAt", "username", "email", "updatedAt")
      .default("createdAt"),
    sortOrder: Joi.string().valid("asc", "desc").default("desc"),
    search: Joi.string().max(100).optional(),
    isAdmin: Joi.boolean().optional(),
  }),
  mongoId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid user ID format",
    }),

  // OTP validation schemas (cookie-based authentication)
  verifyOTPOnly: Joi.object({
    otp: Joi.string()
      .pattern(/^\d{6}$/)
      .required()
      .messages({
        "string.pattern.base": "OTP must be a 6-digit number",
        "any.required": "OTP is required",
      }),
  }),

  // Legacy OTP validation schemas (for backward compatibility if needed)
  verifyOTP: Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),
    otp: Joi.string()
      .pattern(/^\d{6}$/)
      .required()
      .messages({
        "string.pattern.base": "OTP must be a 6-digit number",
        "any.required": "OTP is required",
      }),
  }),

  resendOTP: Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),
  }),

  verificationStatus: Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),
  }),
};

/**
 * Validation middleware factory
 */
export const validate = (schema, property = "body") => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join("."),
        message: detail.message,
        value: detail.context?.value,
      }));

      return res.status(400).json({
        message: "Validation error",
        error: "VALIDATION_ERROR",
        details: errors,
      });
    }
    req[property] = value;
    next();
  };
};

/**
 * Specific validation middlewares
 */
export const validateCreateUser = validate(userSchemas.createUser);
export const validateUpdateUser = validate(userSchemas.updateUser);
export const validateUpdatePrivilege = validate(userSchemas.updatePrivilege);
export const validateLogin = validate(userSchemas.login);
export const validateUsersQuery = validate(userSchemas.getUsersQuery, "query");
export const validateMongoId = validate(userSchemas.mongoId, "params");

/**
 * Custom validation for user ID parameter
 */
export const validateUserIdParam = (req, res, next) => {
  const { error } = userSchemas.mongoId.validate(req.params.id);

  if (error) {
    return res.status(400).json({
      message: "Invalid user ID format",
      error: "INVALID_USER_ID",
    });
  }

  next();
};

/**
 * Email normalization middleware
 */
export const normalizeEmail = (req, res, next) => {
  if (req.body.email) {
    req.body.email = req.body.email.toLowerCase().trim();
  }
  next();
};

/**
 * Username normalization middleware
 */
export const normalizeUsername = (req, res, next) => {
  if (req.body.username) {
    req.body.username = req.body.username.trim();
  }
  next();
};
