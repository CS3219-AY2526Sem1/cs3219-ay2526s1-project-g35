import { AUTH_ERRORS, sendErrorResponse } from '../errors/index.js';
import { otpService } from '../services/otp-service.js';
import * as registrationService from '../services/registration-service.js';
import * as tokenService from '../services/token-service.js';
import { setAuthCookies } from '../utils/cookie-helper.js';
import { formatUserResponse } from './user-controller.js';

/**
 * Step 1: Initiate registration
 * Validates data, sends OTP, but doesn't create user yet
 */
export async function handleInitiateRegistration(req, res) {
  try {
    const { username, email, password, profile } = req.body;

    const result = await registrationService.initiateRegistration(
      username,
      email,
      password,
      profile,
    );

    return res.status(200).json({
      message: 'Verification code sent to your email. Please verify to complete registration.',
      data: {
        email: result.email,
        expiryMinutes: result.expiryMinutes,
      },
    });
  } catch (error) {
    console.error('Initiate registration error:', error);

    if (error.message === 'USER_EXISTS') {
      const field = error.conflict || 'email';
      return res.status(409).json({
        message: `A user with this ${field} already exists`,
        error: 'USER_EXISTS',
        field,
      });
    }

    if (error.message === 'OTP_COOLDOWN') {
      return res.status(400).json({
        message: `Please wait ${error.remainingSeconds} seconds before requesting a new code`,
        error: 'OTP_COOLDOWN',
        retryAfterSeconds: error.remainingSeconds,
      });
    }

    if (error.message === 'STORAGE_ERROR') {
      return sendErrorResponse(res, AUTH_ERRORS.STORAGE_ERROR);
    }

    if (error.message === 'EMAIL_ERROR') {
      return sendErrorResponse(res, AUTH_ERRORS.EMAIL_ERROR);
    }

    return sendErrorResponse(res, AUTH_ERRORS.SERVER_ERROR);
  }
}

/**
 * Step 2: Complete registration
 * Verifies OTP and creates user in database
 */
export async function handleCompleteRegistration(req, res) {
  try {
    const { email, otp } = req.body;

    const user = await registrationService.completeRegistration(email, otp);

    // Automatically log the user in
    const tokens = await tokenService.createAndStoreTokenPair(user);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    return res.status(201).json({
      message: 'Registration completed successfully. Welcome!',
      data: {
        expiresIn: tokens.expiresIn,
        tokenReused: tokens.wasReused,
        user: formatUserResponse(user),
      },
    });
  } catch (error) {
    console.error('Complete registration error:', error);

    if (error.message === 'MISSING_OTP') {
      return sendErrorResponse(res, AUTH_ERRORS.MISSING_OTP);
    }

    if (error.message === 'REGISTRATION_NOT_FOUND') {
      return res.status(404).json({
        message: 'No pending registration found. Please start the registration process again.',
        error: 'REGISTRATION_NOT_FOUND',
      });
    }

    if (error.message === 'USER_EXISTS') {
      return res.status(409).json({
        message: 'This user already exists',
        error: 'USER_EXISTS',
      });
    }

    if (error.message === 'INVALID_OTP' && error.validationResult) {
      const { validationResult } = error;
      const errorMessage = otpService.getErrorMessage(validationResult);

      return res.status(400).json({
        message: errorMessage,
        error: validationResult.reason,
        attemptsRemaining: validationResult.attemptsRemaining,
      });
    }

    return sendErrorResponse(res, AUTH_ERRORS.SERVER_ERROR);
  }
}

/**
 * Resend registration OTP
 */
export async function handleResendRegistrationOTP(req, res) {
  try {
    const { email } = req.body;

    const result = await registrationService.resendRegistrationOTP(email);

    return res.status(200).json({
      message: 'Verification code resent successfully',
      data: {
        email: result.email,
        expiryMinutes: result.expiryMinutes,
      },
    });
  } catch (error) {
    console.error('Resend registration OTP error:', error);

    if (error.message === 'REGISTRATION_NOT_FOUND') {
      return res.status(404).json({
        message: 'No pending registration found. Please start the registration process again.',
        error: 'REGISTRATION_NOT_FOUND',
      });
    }

    if (error.message === 'OTP_COOLDOWN') {
      return res.status(400).json({
        message: `Please wait ${error.remainingSeconds} seconds before requesting a new code`,
        error: 'OTP_COOLDOWN',
        retryAfterSeconds: error.remainingSeconds,
      });
    }

    if (error.message === 'STORAGE_ERROR') {
      return sendErrorResponse(res, AUTH_ERRORS.STORAGE_ERROR);
    }

    if (error.message === 'EMAIL_ERROR') {
      return sendErrorResponse(res, AUTH_ERRORS.EMAIL_ERROR);
    }

    return sendErrorResponse(res, AUTH_ERRORS.SERVER_ERROR);
  }
}
