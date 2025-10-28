import { UserRepository } from '../model/user-repository.js';
import { emailService } from './email-service.js';
import { otpService } from './otp-service.js';
import { otpRedisService } from './redis/redis-otp-service.js';

const OTP_PURPOSE = 'verification';
const LOGIN_2FA_PURPOSE = 'login-2fa';

/**
 * Check if user can send a new OTP
 * Returns error info if they can't, null if they can
 */
function checkOTPCooldown(otpData) {
  if (!otpData) {
    return null;
  }

  const remainingTTL = otpService.getRemainingTTL(otpData);

  if (remainingTTL > 60) {
    const minutes = Math.floor(remainingTTL / 60);
    const seconds = remainingTTL % 60;
    const timeString = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

    return {
      canSend: false,
      message: `Please wait ${timeString} before requesting a new OTP`,
      retryAfterSeconds: remainingTTL,
    };
  }

  return null;
}

/**
 * Generate and send verification OTP to user's email
 *
 * @param {string} userId - User ID
 * @param {Object} user - User object
 * @returns {Object} { success, email, expiryMinutes }
 * @throws {Error} If user is already verified, OTP cooldown active, or sending fails
 */
export async function sendVerificationOTP(userId, user) {
  if (user.isVerified) {
    throw new Error('ALREADY_VERIFIED');
  }

  const normalizedEmail = user.email.toLowerCase();
  const existingOTP = await otpRedisService.getOTP(userId, OTP_PURPOSE);
  const cooldownCheck = checkOTPCooldown(existingOTP);

  if (cooldownCheck && !cooldownCheck.canSend) {
    const error = new Error('OTP_COOLDOWN');
    error.cooldownInfo = cooldownCheck;
    throw error;
  }

  const otpData = otpService.generateOTPData(normalizedEmail, OTP_PURPOSE);
  const storeResult = await otpRedisService.storeOTP(userId, otpData, OTP_PURPOSE);
  if (!storeResult) {
    console.error('Failed to store OTP in Cache');
    throw new Error('STORAGE_ERROR');
  }

  const emailResult = await emailService.sendRegistrationOTP(normalizedEmail, otpData.otp, {
    username: user.username,
  });

  if (!emailResult.success) {
    console.error('Failed to send OTP email:', emailResult.error);
    await otpRedisService.deleteOTP(userId, OTP_PURPOSE);
    throw new Error('EMAIL_ERROR');
  }

  console.log(`Verification OTP generated and sent for user ${userId} (${normalizedEmail})`);

  return {
    success: true,
    email: normalizedEmail,
    expiryMinutes: Math.floor(otpData.ttl / 60),
  };
}

/**
 * Verify OTP and mark user as verified
 *
 * @param {string} userId - User ID
 * @param {Object} user - User object
 * @param {string} otp - OTP code to verify
 * @returns {Object} { success, user, verifiedAt }
 * @throws {Error} If OTP is invalid or user update fails
 */
export async function verifyOTP(userId, user, otp) {
  if (!otp) {
    throw new Error('MISSING_OTP');
  }

  if (user.isVerified) {
    throw new Error('ALREADY_VERIFIED');
  }

  const storedOTPData = await otpRedisService.getOTP(userId, OTP_PURPOSE);
  const validationResult = otpService.validateOTP(
    storedOTPData,
    otp,
    user.email.toLowerCase(),
    OTP_PURPOSE,
  );

  if (!validationResult.isValid) {
    if (storedOTPData && !validationResult.shouldDelete) {
      await otpRedisService.incrementOTPAttempts(userId, OTP_PURPOSE);
    }
    if (validationResult.shouldDelete) {
      await otpRedisService.deleteOTP(userId, OTP_PURPOSE);
    }

    const error = new Error('INVALID_OTP');
    error.validationResult = validationResult;
    throw error;
  }
  console.log(`Attempting to update user ${user.id} with isVerified: true`);

  const updatedUser = await UserRepository.updateById(user.id, {
    isVerified: true,
  });

  if (!updatedUser) {
    console.error('Update returned null - user may not exist');
    throw new Error('USER_NOT_FOUND_UPDATE');
  }

  console.log(`User update successful. isVerified is now: ${updatedUser.isVerified}`);
  await otpRedisService.deleteOTP(userId, OTP_PURPOSE);

  console.log(`User ${userId} (${user.email}) successfully verified via OTP`);

  return {
    success: true,
    user: updatedUser,
    verifiedAt: new Date().toISOString(),
  };
}

/**
 * Get user's current verification status
 */
export async function getVerificationStatus(userId, user) {
  const hasOTP = await otpRedisService.hasOTP(userId, OTP_PURPOSE);
  const otpData = hasOTP ? await otpRedisService.getOTP(userId, OTP_PURPOSE) : null;

  return {
    email: user.email,
    username: user.username,
    isVerified: user.isVerified,
    hasActivePendingOTP: hasOTP,
    otpExpiresIn: otpData ? otpService.getRemainingTTL(otpData) : 0,
    canSendOTP: !user.isVerified && (!otpData || otpService.getRemainingTTL(otpData) <= 60),
  };
}

/**
 * ============================================================================
 * LOGIN 2FA FUNCTIONS (separate from email verification)
 * ============================================================================
 */

/**
 * Generate and send 2FA OTP for login authentication
 * This is different from email verification - it's used for two-factor authentication on login
 * Can be sent to already verified users
 *
 * @param {string} userId - User ID
 * @param {Object} user - User object
 * @returns {Object} { success, email, expiryMinutes }
 * @throws {Error} If OTP cooldown active or sending fails
 */
export async function sendLogin2FAOTP(userId, user) {
  const normalizedEmail = user.email.toLowerCase();
  const existingOTP = await otpRedisService.getOTP(userId, LOGIN_2FA_PURPOSE);
  const cooldownCheck = checkOTPCooldown(existingOTP);

  if (cooldownCheck && !cooldownCheck.canSend) {
    const error = new Error('OTP_COOLDOWN');
    error.cooldownInfo = cooldownCheck;
    throw error;
  }

  const otpData = otpService.generateOTPData(normalizedEmail, LOGIN_2FA_PURPOSE);
  const storeResult = await otpRedisService.storeOTP(userId, otpData, LOGIN_2FA_PURPOSE);
  if (!storeResult) {
    console.error('Failed to store login 2FA OTP in Cache');
    throw new Error('STORAGE_ERROR');
  }

  const emailResult = await emailService.sendOTP(
    normalizedEmail,
    otpData.otp,
    'Two-Factor Authentication',
    {
      username: user.username,
      expiryMinutes: Math.floor(otpData.ttl / 60),
    },
  );

  if (!emailResult.success) {
    console.error('Failed to send login 2FA OTP email:', emailResult.error);
    await otpRedisService.deleteOTP(userId, LOGIN_2FA_PURPOSE);
    throw new Error('EMAIL_ERROR');
  }

  console.log(`Login 2FA OTP generated and sent for user ${userId} (${normalizedEmail})`);

  return {
    success: true,
    email: normalizedEmail,
    expiryMinutes: Math.floor(otpData.ttl / 60),
  };
}

/**
 * Verify 2FA OTP for login authentication
 * Does NOT modify user.isVerified - only validates the OTP for this login session
 *
 * @param {string} userId - User ID
 * @param {Object} user - User object
 * @param {string} otp - OTP code to verify
 * @returns {Object} { success, user, verifiedAt }
 * @throws {Error} If OTP is invalid
 */
export async function verifyLogin2FAOTP(userId, user, otp) {
  if (!otp) {
    throw new Error('MISSING_OTP');
  }

  const storedOTPData = await otpRedisService.getOTP(userId, LOGIN_2FA_PURPOSE);
  const validationResult = otpService.validateOTP(
    storedOTPData,
    otp,
    user.email.toLowerCase(),
    LOGIN_2FA_PURPOSE,
  );

  if (!validationResult.isValid) {
    if (storedOTPData && !validationResult.shouldDelete) {
      await otpRedisService.incrementOTPAttempts(userId, LOGIN_2FA_PURPOSE);
    }
    if (validationResult.shouldDelete) {
      await otpRedisService.deleteOTP(userId, LOGIN_2FA_PURPOSE);
    }

    const error = new Error('INVALID_OTP');
    error.validationResult = validationResult;
    throw error;
  }

  // Delete the OTP after successful verification
  await otpRedisService.deleteOTP(userId, LOGIN_2FA_PURPOSE);

  console.log(`User ${userId} (${user.email}) successfully completed login 2FA`);

  return {
    success: true,
    user: user, // Return user as-is, don't modify isVerified
    verifiedAt: new Date().toISOString(),
  };
}
