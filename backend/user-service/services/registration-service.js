import argon2 from 'argon2';
import { UserRepository } from '../model/user-repository.js';
import { emailService } from './email-service.js';
import { otpService } from './otp-service.js';
import { otpRedisService } from './redis/redis-otp-service.js';
import { registrationRedisService } from './redis/redis-registration-service.js';

const OTP_PURPOSE = 'registration';

/**
 * Initiate registration - validate data, send OTP, but don't create user yet
 */
export async function initiateRegistration(username, email, password, profile = {}) {
  // Check if user already exists
  const existingUser = await UserRepository.findByUsernameOrEmail(username, email.toLowerCase());
  if (existingUser) {
    const conflict = existingUser.username === username ? 'username' : 'email';
    const error = new Error('USER_EXISTS');
    error.conflict = conflict;
    throw error;
  }

  // Check if there's already a pending registration
  const hasPending = await registrationRedisService.hasPendingRegistration(email);
  if (hasPending) {
    // Check if OTP was recently sent
    const existingOTP = await otpRedisService.getOTP(email, OTP_PURPOSE);
    if (existingOTP) {
      const remainingTime = Math.max(0, Math.floor((existingOTP.expiresAt - Date.now()) / 1000));
      if (remainingTime > 240) {
        // More than 4 minutes remaining (out of 5 minute TTL)
        const error = new Error('OTP_COOLDOWN');
        error.remainingSeconds = remainingTime;
        throw error;
      }
    }
  }

  // Hash password
  const hashedPassword = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: parseInt(process.env.ARGON2_MEMORY_COST),
    timeCost: parseInt(process.env.ARGON2_TIME_COST),
    parallelism: parseInt(process.env.ARGON2_PARALLELISM),
    hashLength: parseInt(process.env.ARGON2_HASH_LENGTH),
    saltLength: parseInt(process.env.ARGON2_SALT_LENGTH),
  });

  // Store registration data temporarily
  const registrationData = {
    username,
    email: email.toLowerCase(),
    password: hashedPassword,
    profile,
    createdAt: new Date().toISOString(),
  };

  const stored = await registrationRedisService.storePendingRegistration(email, registrationData);
  if (!stored) {
    throw new Error('STORAGE_ERROR');
  }

  // Generate and send OTP
  const otpData = otpService.generateOTPData(email.toLowerCase(), OTP_PURPOSE);
  const otpStored = await otpRedisService.storeOTP(email, otpData, OTP_PURPOSE);
  if (!otpStored) {
    // Clean up registration data if OTP storage fails
    await registrationRedisService.deletePendingRegistration(email);
    throw new Error('STORAGE_ERROR');
  }

  // Send OTP email
  try {
    await emailService.sendRegistrationOTP(email, otpData.otp, {
      username,
    });
  } catch (error) {
    console.error('Failed to send registration OTP email:', error);
    // Don't clean up - allow user to retry
    throw new Error('EMAIL_ERROR');
  }

  return {
    email: email.toLowerCase(),
    expiryMinutes: Math.floor(otpData.ttl / 60),
  };
}

/**
 * Complete registration - verify OTP and create user
 */
export async function completeRegistration(email, otp) {
  if (!otp) {
    throw new Error('MISSING_OTP');
  }

  const normalizedEmail = email.toLowerCase();

  // Get pending registration data
  const registrationData = await registrationRedisService.getPendingRegistration(normalizedEmail);
  if (!registrationData) {
    throw new Error('REGISTRATION_NOT_FOUND');
  }

  // Validate OTP
  const storedOTPData = await otpRedisService.getOTP(normalizedEmail, OTP_PURPOSE);
  const validationResult = otpService.validateOTP(storedOTPData, otp, normalizedEmail, OTP_PURPOSE);

  if (!validationResult.isValid) {
    // Increment attempts if OTP exists and shouldn't be deleted
    if (storedOTPData && !validationResult.shouldDelete) {
      await otpRedisService.incrementOTPAttempts(normalizedEmail, OTP_PURPOSE);
    }
    // Delete if max attempts or expired
    if (validationResult.shouldDelete) {
      await otpRedisService.deleteOTP(normalizedEmail, OTP_PURPOSE);
      // Also delete registration data if OTP expired
      if (validationResult.reason === 'OTP_EXPIRED') {
        await registrationRedisService.deletePendingRegistration(normalizedEmail);
      }
    }

    const error = new Error('INVALID_OTP');
    error.validationResult = validationResult;
    throw error;
  }

  // Check again if user exists (in case they registered elsewhere)
  const existingUser = await UserRepository.findByUsernameOrEmail(
    registrationData.username,
    normalizedEmail,
  );
  if (existingUser) {
    // Clean up
    await otpRedisService.deleteOTP(normalizedEmail, OTP_PURPOSE);
    await registrationRedisService.deletePendingRegistration(normalizedEmail);
    throw new Error('USER_EXISTS');
  }

  // Create user in database
  const createdUser = await UserRepository.createUser({
    username: registrationData.username,
    email: registrationData.email,
    password: registrationData.password,
    profile: registrationData.profile,
    isVerified: true, // Mark as verified since OTP was validated
  });

  // Clean up temporary data
  await otpRedisService.deleteOTP(normalizedEmail, OTP_PURPOSE);
  await registrationRedisService.deletePendingRegistration(normalizedEmail);

  console.log(`User ${registrationData.username} (${normalizedEmail}) successfully registered`);

  return createdUser;
}

/**
 * Resend registration OTP
 */
export async function resendRegistrationOTP(email) {
  const normalizedEmail = email.toLowerCase();

  // Check if there's a pending registration
  const registrationData = await registrationRedisService.getPendingRegistration(normalizedEmail);
  if (!registrationData) {
    throw new Error('REGISTRATION_NOT_FOUND');
  }

  // Check OTP cooldown
  const existingOTP = await otpRedisService.getOTP(normalizedEmail, OTP_PURPOSE);
  if (existingOTP) {
    const remainingTime = Math.max(0, Math.floor((existingOTP.expiresAt - Date.now()) / 1000));
    if (remainingTime > 240) {
      // More than 4 minutes remaining
      const error = new Error('OTP_COOLDOWN');
      error.remainingSeconds = remainingTime;
      throw error;
    }
  }

  // Generate new OTP
  const otpData = otpService.generateOTPData(normalizedEmail, OTP_PURPOSE);
  const otpStored = await otpRedisService.storeOTP(normalizedEmail, otpData, OTP_PURPOSE);
  if (!otpStored) {
    throw new Error('STORAGE_ERROR');
  }

  // Send OTP email
  try {
    await emailService.sendRegistrationOTP(normalizedEmail, otpData.otp, {
      username: registrationData.username,
    });
  } catch (error) {
    console.error('Failed to resend registration OTP email:', error);
    throw new Error('EMAIL_ERROR');
  }

  return {
    email: normalizedEmail,
    expiryMinutes: Math.floor(otpData.ttl / 60),
  };
}
