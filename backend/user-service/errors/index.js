export * from "./auth-errors.js";
export * from "./user-errors.js";
export * from "./validation-errors.js";
export * from "./otp-errors.js";

export {
  AUTH_ERRORS,
  createErrorResponse,
  sendErrorResponse,
} from "./auth-errors.js";
export {
  USER_ERRORS,
  createUserErrorResponse,
  sendUserErrorResponse,
} from "./user-errors.js";
export {
  VALIDATION_ERRORS,
  createValidationErrorResponse,
  sendValidationErrorResponse,
} from "./validation-errors.js";
export {
  OTP_ERROR_MESSAGES,
  getOTPErrorMessage,
  createOTPErrorResponse,
  sendOTPErrorResponse,
} from "./otp-errors.js";
