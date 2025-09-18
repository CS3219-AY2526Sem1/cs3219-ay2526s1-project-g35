import crypto from "crypto";

/**
 * OTP Service for handling One-Time Password generation, validation, and management
 * Provides secure OTP generation with configurable length and TTL
 */
class OTPService {
  constructor() {
    // Default configuration - can be overridden by environment variables
    this.defaultOTPLength = parseInt(process.env.OTP_LENGTH) || 6;
    this.defaultTTL = parseInt(process.env.OTP_TTL_SECONDS) || 300; // 5 minutes
    this.maxAttempts = parseInt(process.env.OTP_MAX_ATTEMPTS) || 3;
  }

  /**
   * Generate a secure OTP with specified length
   * @param {number} length - Length of OTP (default: 6 digits)
   * @returns {string} Generated OTP
   */
  generateOTP(length = this.defaultOTPLength) {
    // Validate length
    if (length < 4 || length > 8) {
      throw new Error("OTP length must be between 4 and 8 digits");
    }

    // For consistent 6-digit OTP, ensure we always generate exactly 6 digits
    if (length === 6) {
      // Generate a number between 100000 and 999999 (6 digits)
      let otp;
      do {
        const randomBytes = crypto.randomBytes(4);
        const randomNumber = randomBytes.readUInt32BE(0);
        otp = (randomNumber % 900000) + 100000;
      } while (otp.toString().length !== 6);
      
      return otp.toString();
    }
    const maxValue = Math.pow(10, length) - 1;
    const minValue = Math.pow(10, length - 1);
    
    let otp;
    do {
      // Generate random bytes and convert to number
      const randomBytes = crypto.randomBytes(4);
      const randomNumber = randomBytes.readUInt32BE(0);
      otp = randomNumber % (maxValue - minValue + 1) + minValue;
    } while (otp.toString().length !== length);

    return otp.toString().padStart(length, '0');
  }

  /**
   * Validate OTP format
   * @param {string} otp - OTP to validate
   * @param {number} expectedLength - Expected OTP length
   * @returns {boolean} True if OTP format is valid
   */
  isValidOTPFormat(otp, expectedLength = this.defaultOTPLength) {
    if (!otp || typeof otp !== 'string') {
      return false;
    }

    // Check if OTP contains only digits and has correct length
    const otpRegex = new RegExp(`^\\d{${expectedLength}}$`);
    return otpRegex.test(otp);
  }

  /**
   * Generate OTP data object with metadata
   * @param {string} email - User email
   * @param {string} purpose - Purpose of OTP (e.g., 'registration', 'password-reset')
   * @param {number} length - OTP length
   * @param {number} ttl - TTL in seconds
   * @returns {Object} OTP data object
   */
  generateOTPData(email, purpose = 'registration', length = this.defaultOTPLength, ttl = this.defaultTTL) {
    const otp = this.generateOTP(length);
    const timestamp = Date.now();
    const expiresAt = timestamp + (ttl * 1000);

    return {
      otp,
      email: email.toLowerCase(),
      purpose,
      attempts: 0,
      maxAttempts: this.maxAttempts,
      createdAt: timestamp,
      expiresAt,
      ttl
    };
  }

  /**
   * Validate OTP attempt and check constraints
   * @param {Object} storedOTPData - Stored OTP data from Redis
   * @param {string} providedOTP - OTP provided by user
   * @param {string} email - User email
   * @param {string} purpose - Expected purpose
   * @returns {Object} Validation result
   */
  validateOTP(storedOTPData, providedOTP, email, purpose = 'registration') {
    const result = {
      isValid: false,
      reason: null,
      attemptsRemaining: 0,
      shouldDelete: false
    };

    // Check if OTP data exists
    if (!storedOTPData) {
      result.reason = 'OTP_NOT_FOUND';
      return result;
    }

    // Check if OTP has expired
    if (Date.now() > storedOTPData.expiresAt) {
      result.reason = 'OTP_EXPIRED';
      result.shouldDelete = true;
      return result;
    }

    // Check if maximum attempts exceeded
    if (storedOTPData.attempts >= storedOTPData.maxAttempts) {
      result.reason = 'MAX_ATTEMPTS_EXCEEDED';
      result.shouldDelete = true;
      return result;
    }

    // Check email match
    if (storedOTPData.email.toLowerCase() !== email.toLowerCase()) {
      result.reason = 'EMAIL_MISMATCH';
      return result;
    }

    // Check purpose match
    if (storedOTPData.purpose !== purpose) {
      result.reason = 'PURPOSE_MISMATCH';
      return result;
    }

    // Validate OTP format
    if (!this.isValidOTPFormat(providedOTP, storedOTPData.otp.length)) {
      result.reason = 'INVALID_FORMAT';
      result.attemptsRemaining = storedOTPData.maxAttempts - storedOTPData.attempts - 1;
      return result;
    }

    // Check OTP match (constant-time comparison to prevent timing attacks)
    const isOTPMatch = crypto.timingSafeEqual(
      Buffer.from(storedOTPData.otp, 'utf8'),
      Buffer.from(providedOTP, 'utf8')
    );

    if (isOTPMatch) {
      result.isValid = true;
      result.shouldDelete = true; // Delete OTP after successful validation
      return result;
    } else {
      result.reason = 'OTP_MISMATCH';
      result.attemptsRemaining = storedOTPData.maxAttempts - storedOTPData.attempts - 1;
      return result;
    }
  }

  /**
   * Get Redis key for OTP storage
   * @param {string} email - User email
   * @param {string} purpose - OTP purpose
   * @returns {string} Redis key
   */
  getOTPKey(email, purpose = 'registration') {
    return `otp:${purpose}:${email.toLowerCase()}`;
  }

  /**
   * Get user-friendly error message for validation result
   * @param {Object} validationResult - Result from validateOTP
   * @returns {string} User-friendly error message
   */
  getErrorMessage(validationResult) {
    const errorMessages = {
      'OTP_NOT_FOUND': 'OTP not found or has expired. Please request a new OTP.',
      'OTP_EXPIRED': 'OTP has expired. Please request a new OTP.',
      'MAX_ATTEMPTS_EXCEEDED': 'Maximum verification attempts exceeded. Please request a new OTP.',
      'EMAIL_MISMATCH': 'Invalid request. Please ensure you are using the correct email.',
      'PURPOSE_MISMATCH': 'Invalid OTP type. Please use the correct verification link.',
      'INVALID_FORMAT': `Invalid OTP format. Please enter a ${this.defaultOTPLength}-digit number.`,
      'OTP_MISMATCH': `Incorrect OTP. ${validationResult.attemptsRemaining} attempt(s) remaining.`
    };

    return errorMessages[validationResult.reason] || 'OTP validation failed. Please try again.';
  }

  /**
   * Calculate remaining TTL for display purposes
   * @param {Object} otpData - OTP data object
   * @returns {number} Remaining seconds until expiry
   */
  getRemainingTTL(otpData) {
    if (!otpData || !otpData.expiresAt) {
      return 0;
    }
    
    const remaining = Math.max(0, Math.floor((otpData.expiresAt - Date.now()) / 1000));
    return remaining;
  }
}

// Export singleton instance
export const otpService = new OTPService();
export { OTPService };