export const OTP_ERROR_MESSAGES = {
  OTP_NOT_FOUND: "OTP not found or has expired. Please request a new OTP.",
  OTP_EXPIRED: "OTP has expired. Please request a new OTP.",
  MAX_ATTEMPTS_EXCEEDED:
    "Maximum verification attempts exceeded. Please request a new OTP.",
  PURPOSE_MISMATCH:
    "Invalid OTP type. Please use the correct verification link.",
  INVALID_FORMAT: "Invalid OTP format. Please enter a {length}-digit number.",
  OTP_MISMATCH: "Incorrect OTP. {attemptsRemaining} attempt(s) remaining.",
  DEFAULT: "OTP validation failed. Please try again.",
};

export function getOTPErrorMessage(validationResult, otpLength) {
  const { reason, attemptsRemaining } = validationResult;

  if (!reason || !OTP_ERROR_MESSAGES[reason]) {
    return OTP_ERROR_MESSAGES.DEFAULT;
  }

  let message = OTP_ERROR_MESSAGES[reason];

  if (reason === "INVALID_FORMAT" && otpLength) {
    message = message.replace("{length}", otpLength);
  }

  if (reason === "OTP_MISMATCH" && attemptsRemaining !== undefined) {
    message = message.replace("{attemptsRemaining}", attemptsRemaining);
  }

  return message;
}

export function createOTPErrorResponse(validationResult, otpLength) {
  const message = getOTPErrorMessage(validationResult, otpLength);

  return {
    message,
    error: validationResult.reason || "OTP_VALIDATION_FAILED",
    attemptsRemaining: validationResult.attemptsRemaining,
  };
}
export function sendOTPErrorResponse(
  res,
  validationResult,
  otpLength,
  statusCode = 400
) {
  const errorResponse = createOTPErrorResponse(validationResult, otpLength);
  return res.status(statusCode).json(errorResponse);
}
