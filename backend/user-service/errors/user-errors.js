export const USER_ERRORS = {
  USER_EXISTS: {
    code: "USER_EXISTS",
    message: field => `User with this ${field} already exists`,
    status: 409,
  },
  DUPLICATE_KEY: {
    code: "DUPLICATE_KEY",
    message: field => `User with this ${field} already exists`,
    status: 409,
  },
  USERNAME_EXISTS: {
    code: "USERNAME_EXISTS",
    message: "Username already exists",
    status: 409,
  },
  EMAIL_EXISTS: {
    code: "EMAIL_EXISTS",
    message: "Email already exists",
    status: 409,
  },

  USER_NOT_FOUND: {
    code: "USER_NOT_FOUND",
    message: "User not found",
    status: 404,
  },
  MISSING_USERNAME: {
    code: "MISSING_USERNAME",
    message: "Username is required",
    status: 400,
  },
  UNAUTHORIZED_ACCESS: {
    code: "UNAUTHORIZED_ACCESS",
    message: "Access denied. You can only access your own user data.",
    status: 403,
  },

  SERVER_ERROR: {
    code: "SERVER_ERROR",
    message: "Failed to create user",
    status: 500,
  },
  UPDATE_SERVER_ERROR: {
    code: "SERVER_ERROR",
    message: "Failed to update user",
    status: 500,
  },
  DELETE_SERVER_ERROR: {
    code: "SERVER_ERROR",
    message: "Failed to delete user",
    status: 500,
  },
  PRIVILEGE_SERVER_ERROR: {
    code: "SERVER_ERROR",
    message: "Failed to update user privilege",
    status: 500,
  },
  INTERNAL_SERVER_ERROR: {
    code: "INTERNAL_SERVER_ERROR",
    message: "Database or server error",
    status: 500,
  },
  RETRIEVE_SERVER_ERROR: {
    code: "SERVER_ERROR",
    message: "Failed to retrieve user",
    status: 500,
  },
};

/**
 * Helper function to create user error response
 * @param {Object} error - Error object from USER_ERRORS
 * @param {string|Object} param - Parameter for dynamic messages or additional data
 * @param {Object} additionalData - Additional data to include in response
 * @returns {Object} Formatted error response
 */
export function createUserErrorResponse(
  error,
  param = null,
  additionalData = {}
) {
  let message = error.message;

  if (typeof error.message === "function" && param) {
    message = error.message(param);
  }

  const response = {
    message,
    error: error.code,
    ...additionalData,
  };

  return response;
}

/**
 * Helper function to send user error response
 * @param {Object} res - Express response object
 * @param {Object} error - Error object from USER_ERRORS
 * @param {string|Object} param - Parameter for dynamic messages
 * @param {Object} additionalData - Additional data to include in response
 */
export function sendUserErrorResponse(
  res,
  error,
  param = null,
  additionalData = {}
) {
  const errorResponse = createUserErrorResponse(error, param, additionalData);
  return res.status(error.status).json(errorResponse);
}
