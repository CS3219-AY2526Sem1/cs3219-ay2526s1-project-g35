/**
 * Authentication related error definitions
 * Centralized error messages and codes for better maintainability
 */

export const AUTH_ERRORS = {
  MISSING_CREDENTIALS: {
    code: 'MISSING_CREDENTIALS',
    message: 'Missing email and/or password',
    status: 400,
  },
  INVALID_CREDENTIALS: {
    code: 'INVALID_CREDENTIALS',
    message: 'Invalid email or password',
    status: 401,
  },

  MISSING_TOKEN: {
    code: 'MISSING_TOKEN',
    message: 'No access token provided in cookie',
    status: 401,
  },
  INVALID_TOKEN: {
    code: 'INVALID_TOKEN',
    message: 'Invalid token',
    status: 401,
  },
  INVALID_SIGNATURE: {
    code: 'INVALID_SIGNATURE',
    message: 'Invalid token signature',
    status: 401,
  },
  TOKEN_NOT_WHITELISTED: {
    code: 'TOKEN_NOT_WHITELISTED',
    message: 'Token is not authorized. Please login again.',
    status: 401,
  },
  MISSING_REFRESH_TOKEN: {
    code: 'MISSING_REFRESH_TOKEN',
    message: 'Refresh token not provided. Please login again.',
    status: 401,
  },
  INVALID_TOKEN_TYPE: {
    code: 'INVALID_TOKEN_TYPE',
    message: 'Invalid token type',
    status: 401,
  },
  USER_NOT_FOUND: {
    code: 'USER_NOT_FOUND',
    message: 'User not found. Please login again.',
    status: 401,
  },
  REFRESH_TOKEN_EXPIRED: {
    code: 'REFRESH_TOKEN_EXPIRED',
    message: 'Refresh token expired. Please login again.',
    status: 401,
  },
  INVALID_REFRESH_TOKEN: {
    code: 'INVALID_REFRESH_TOKEN',
    message: 'Invalid refresh token. Please login again.',
    status: 401,
  },
  TOKEN_EXPIRED: {
    code: 'TOKEN_EXPIRED',
    message: 'Token has expired',
    status: 401,
  },
  TTL_RESET_FAILED: {
    code: 'TTL_RESET_FAILED',
    message: 'Failed to reset token TTL. Please try refreshing your session.',
    status: 500,
  },

  ALREADY_VERIFIED: {
    code: 'ALREADY_VERIFIED',
    message: 'User is already verified',
    status: 400,
  },
  OTP_ALREADY_SENT: {
    code: 'OTP_ALREADY_SENT',
    message: (timeString) =>
      `OTP already sent. Please wait ${timeString} before requesting a new one.`,
    status: 400,
  },
  MISSING_OTP: {
    code: 'MISSING_OTP',
    message: 'OTP is required',
    status: 400,
  },
  STORAGE_ERROR: {
    code: 'STORAGE_ERROR',
    message: 'Failed to generate OTP. Please try again later.',
    status: 500,
  },
  EMAIL_ERROR: {
    code: 'EMAIL_ERROR',
    message: 'Failed to send OTP email. Please try again later.',
    status: 500,
  },
  UPDATE_ERROR: {
    code: 'UPDATE_ERROR',
    message: 'Verification completed but failed to update user status',
    status: 500,
  },
  USER_NOT_FOUND_UPDATE: {
    code: 'USER_NOT_FOUND',
    message: 'Failed to update user - user not found',
    status: 500,
  },

  SERVER_ERROR: {
    code: 'SERVER_ERROR',
    message: 'Internal server error',
    status: 500,
  },
  VERIFICATION_SERVER_ERROR: {
    code: 'SERVER_ERROR',
    message: 'Internal server error. Please try again later.',
    status: 500,
  },
  TOKEN_VERIFICATION_ERROR: {
    code: 'SERVER_ERROR',
    message: 'Internal server error',
    status: 500,
  },

  DATABASE_ERROR: {
    code: 'DATABASE_ERROR',
    message: 'Internal server error',
    status: 500,
  },

  NOT_AUTHENTICATED: {
    code: 'NOT_AUTHENTICATED',
    message: 'Authentication required',
    status: 401,
  },
  NOT_ADMIN: {
    code: 'NOT_ADMIN',
    message: 'Admin access required',
    status: 403,
  },
};

/**
 * Helper function to create error response
 * @param {Object} error - Error object from AUTH_ERRORS
 * @param {Object} additionalData - Additional data to include in response
 * @returns {Object} Formatted error response
 */
export function createErrorResponse(error, additionalData = {}) {
  const response = {
    message: typeof error.message === 'function' ? error.message() : error.message,
    error: error.code,
    ...additionalData,
  };

  return response;
}

/**
 * Helper function to send error response
 * @param {Object} res - Express response object
 * @param {Object} error - Error object from AUTH_ERRORS
 * @param {Object} additionalData - Additional data to include in response
 */
export function sendErrorResponse(res, error, additionalData = {}) {
  const errorResponse = createErrorResponse(error, additionalData);
  return res.status(error.status).json(errorResponse);
}
