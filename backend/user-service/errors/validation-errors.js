export const VALIDATION_ERRORS = {
  VALIDATION_ERROR: {
    code: "VALIDATION_ERROR",
    message: "Validation error",
    status: 400,
  },
  INVALID_USER_ID: {
    code: "INVALID_USER_ID",
    message: "Invalid user ID format",
    status: 400,
  },
};

/**
 * Helper function to create validation error response
 * @param {Object} error - Error object from VALIDATION_ERRORS
 * @param {Object} details - Validation error details
 * @param {Object} additionalData - Additional data to include in response
 * @returns {Object} Formatted error response
 */
export function createValidationErrorResponse(
  error,
  details = null,
  additionalData = {}
) {
  const response = {
    message: error.message,
    error: error.code,
    ...additionalData,
  };

  if (details) {
    response.details = details;
  }

  return response;
}

/**
 * Helper function to send validation error response
 * @param {Object} res - Express response object
 * @param {Object} error - Error object from VALIDATION_ERRORS
 * @param {Object} details - Validation error details
 * @param {Object} additionalData - Additional data to include in response
 */
export function sendValidationErrorResponse(
  res,
  error,
  details = null,
  additionalData = {}
) {
  const errorResponse = createValidationErrorResponse(
    error,
    details,
    additionalData
  );
  return res.status(error.status).json(errorResponse);
}
