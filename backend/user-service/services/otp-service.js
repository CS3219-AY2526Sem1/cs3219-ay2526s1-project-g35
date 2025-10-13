import crypto from "crypto";
import { getOTPErrorMessage } from "../errors/otp-errors.js";

/**
 * OTP Service for handling One-Time Password generation, validation, and management
 * Provides secure OTP generation with configurable length and TTL
 */
class OTPService {
  constructor() {
    this.defaultOTPLength = parseInt(process.env.OTP_LENGTH);
    this.defaultTTL = parseInt(process.env.OTP_TTL_SECONDS);
    this.maxAttempts = parseInt(process.env.OTP_MAX_ATTEMPTS);
  }

  /**
   * Generate a secure OTP with specified length
   */
  generateOTP(length = this.defaultOTPLength) {
    const minValue = 10 ** (length - 1);
    const maxValue = 10 ** length - 1;

    let otp;
    do {
      const randomBytes = crypto.randomBytes(4);
      const randomNumber = randomBytes.readUInt32BE(0);
      otp = (randomNumber % (maxValue - minValue + 1)) + minValue;
    } while (otp.toString().length !== length);

    return otp.toString();
  }

  /**
   * Validate OTP format
   */
  isValidOTPFormat(otp, expectedLength = this.defaultOTPLength) {
    if (!otp || typeof otp !== "string") {
      return false;
    }
    const otpRegex = new RegExp(`^\\d{${expectedLength}}$`);
    return otpRegex.test(otp);
  }

  /**
   * Generate OTP data object with metadata
   */
  generateOTPData(
    email,
    purpose = "registration",
    length = this.defaultOTPLength,
    ttl = this.defaultTTL
  ) {
    const otp = this.generateOTP(length);
    const timestamp = Date.now();
    const expiresAt = timestamp + ttl * 1000;

    return {
      otp,
      email: email.toLowerCase(),
      purpose,
      attempts: 0,
      maxAttempts: this.maxAttempts,
      createdAt: timestamp,
      expiresAt,
      ttl,
    };
  }

  /**
   * Validate OTP attempt and check constraints
   */
  validateOTP(storedOTPData, providedOTP, email, purpose = "registration") {
    const result = {
      isValid: false,
      reason: null,
      attemptsRemaining: 0,
      shouldDelete: false,
    };
    if (!storedOTPData) {
      result.reason = "OTP_NOT_FOUND";
      return result;
    }
    if (Date.now() > storedOTPData.expiresAt) {
      result.reason = "OTP_EXPIRED";
      result.shouldDelete = true;
      return result;
    }
    if (storedOTPData.attempts >= storedOTPData.maxAttempts) {
      result.reason = "MAX_ATTEMPTS_EXCEEDED";
      result.shouldDelete = true;
      return result;
    }
    if (storedOTPData.purpose !== purpose) {
      result.reason = "PURPOSE_MISMATCH";
      return result;
    }

    if (!this.isValidOTPFormat(providedOTP, storedOTPData.otp.length)) {
      result.reason = "INVALID_FORMAT";
      result.attemptsRemaining =
        storedOTPData.maxAttempts - storedOTPData.attempts - 1;
      return result;
    }
    const isOTPMatch = crypto.timingSafeEqual(
      Buffer.from(storedOTPData.otp, "utf8"),
      Buffer.from(providedOTP, "utf8")
    );

    if (isOTPMatch) {
      result.isValid = true;
      result.shouldDelete = true;
      return result;
    } else {
      result.reason = "OTP_MISMATCH";
      result.attemptsRemaining =
        storedOTPData.maxAttempts - storedOTPData.attempts - 1;
      return result;
    }
  }

  /**
   * Get Redis key for OTP storage
   */
  getOTPKey(email, purpose = "registration") {
    return `otp:${purpose}:${email.toLowerCase()}`;
  }

  /**
   * Get user-friendly error message for validation result

   */
  getErrorMessage(validationResult) {
    return getOTPErrorMessage(validationResult, this.defaultOTPLength);
  }

  /**
   * Calculate remaining TTL for display purposes
   */
  getRemainingTTL(otpData) {
    if (!otpData || !otpData.expiresAt) {
      return 0;
    }

    const remaining = Math.max(
      0,
      Math.floor((otpData.expiresAt - Date.now()) / 1000)
    );
    return remaining;
  }
}
export const otpService = new OTPService();
export { OTPService };
