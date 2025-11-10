import argon2 from 'argon2';
import { UserRepository } from '../model/user-repository.js';
import { emailService } from './email-service.js';
import { otpService } from './otp-service.js';
import { otpRedisService } from './redis/redis-otp-service.js';

const OTP_PURPOSE = 'password-reset';

export async function initiatePasswordReset(email) {
  const normalizedEmail = email.toLowerCase();

  const user = await UserRepository.findByEmail(normalizedEmail);
  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  const existingOTP = await otpRedisService.getOTP(normalizedEmail, OTP_PURPOSE);
  if (existingOTP) {
    const remainingTime = Math.max(0, Math.floor((existingOTP.expiresAt - Date.now()) / 1000));
    if (remainingTime > 240) {
      const error = new Error('OTP_COOLDOWN');
      error.remainingSeconds = remainingTime;
      throw error;
    }
  }

  const otpData = otpService.generateOTPData(normalizedEmail, OTP_PURPOSE);
  const otpStored = await otpRedisService.storeOTP(normalizedEmail, otpData, OTP_PURPOSE);
  if (!otpStored) {
    throw new Error('STORAGE_ERROR');
  }

  try {
    await emailService.sendOTP(normalizedEmail, otpData.otp, 'Password Reset', {
      username: user.username,
      expiryMinutes: Math.floor(otpData.ttl / 60),
    });
  } catch (error) {
    console.error('Failed to send password reset OTP email:', error);
    throw new Error('EMAIL_ERROR');
  }

  return {
    email: normalizedEmail,
    expiryMinutes: Math.floor(otpData.ttl / 60),
  };
}

export async function verifyPasswordResetOTP(email, otp) {
  if (!otp) {
    throw new Error('MISSING_OTP');
  }

  const normalizedEmail = email.toLowerCase();

  const user = await UserRepository.findByEmail(normalizedEmail);
  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  const storedOTPData = await otpRedisService.getOTP(normalizedEmail, OTP_PURPOSE);
  const validationResult = otpService.validateOTP(storedOTPData, otp, normalizedEmail, OTP_PURPOSE);

  if (!validationResult.isValid) {
    if (storedOTPData && !validationResult.shouldDelete) {
      await otpRedisService.incrementOTPAttempts(normalizedEmail, OTP_PURPOSE);
    }
    if (validationResult.shouldDelete) {
      await otpRedisService.deleteOTP(normalizedEmail, OTP_PURPOSE);
    }

    const error = new Error('INVALID_OTP');
    error.validationResult = validationResult;
    throw error;
  }

  await otpRedisService.deleteOTP(normalizedEmail, OTP_PURPOSE);

  return {
    email: normalizedEmail,
    verified: true,
  };
}

export async function resetPassword(email, otp, newPassword) {
  if (!otp) {
    throw new Error('MISSING_OTP');
  }

  if (!newPassword) {
    throw new Error('MISSING_PASSWORD');
  }

  const normalizedEmail = email.toLowerCase();

  const user = await UserRepository.findByEmail(normalizedEmail);
  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  const storedOTPData = await otpRedisService.getOTP(normalizedEmail, OTP_PURPOSE);
  const validationResult = otpService.validateOTP(storedOTPData, otp, normalizedEmail, OTP_PURPOSE);

  if (!validationResult.isValid) {
    if (storedOTPData && !validationResult.shouldDelete) {
      await otpRedisService.incrementOTPAttempts(normalizedEmail, OTP_PURPOSE);
    }
    if (validationResult.shouldDelete) {
      await otpRedisService.deleteOTP(normalizedEmail, OTP_PURPOSE);
    }

    const error = new Error('INVALID_OTP');
    error.validationResult = validationResult;
    throw error;
  }

  const hashedPassword = await argon2.hash(newPassword, {
    type: argon2.argon2id,
    memoryCost: parseInt(process.env.ARGON2_MEMORY_COST),
    timeCost: parseInt(process.env.ARGON2_TIME_COST),
    parallelism: parseInt(process.env.ARGON2_PARALLELISM),
    hashLength: parseInt(process.env.ARGON2_HASH_LENGTH),
    saltLength: parseInt(process.env.ARGON2_SALT_LENGTH),
  });

  await UserRepository.updatePassword(user._id, hashedPassword);

  await otpRedisService.deleteOTP(normalizedEmail, OTP_PURPOSE);

  console.log(`Password reset successful for user ${normalizedEmail}`);

  return {
    success: true,
    email: normalizedEmail,
  };
}

export async function resendPasswordResetOTP(email) {
  const normalizedEmail = email.toLowerCase();

  const user = await UserRepository.findByEmail(normalizedEmail);
  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  const existingOTP = await otpRedisService.getOTP(normalizedEmail, OTP_PURPOSE);
  if (existingOTP) {
    const remainingTime = Math.max(0, Math.floor((existingOTP.expiresAt - Date.now()) / 1000));
    if (remainingTime > 240) {
      const error = new Error('OTP_COOLDOWN');
      error.remainingSeconds = remainingTime;
      throw error;
    }
  }

  const otpData = otpService.generateOTPData(normalizedEmail, OTP_PURPOSE);
  const otpStored = await otpRedisService.storeOTP(normalizedEmail, otpData, OTP_PURPOSE);
  if (!otpStored) {
    throw new Error('STORAGE_ERROR');
  }

  try {
    await emailService.sendOTP(normalizedEmail, otpData.otp, 'Password Reset', {
      username: user.username,
      expiryMinutes: Math.floor(otpData.ttl / 60),
    });
  } catch (error) {
    console.error('Failed to resend password reset OTP email:', error);
    throw new Error('EMAIL_ERROR');
  }

  return {
    email: normalizedEmail,
    expiryMinutes: Math.floor(otpData.ttl / 60),
  };
}
