import { AUTH_ERRORS, sendErrorResponse } from '../errors/index.js';
import { UserRepository } from '../model/user-repository.js';
import * as authService from '../services/auth-service.js';
import { otpService } from '../services/otp-service.js';
import * as tokenService from '../services/token-service.js';
import * as verificationService from '../services/verification-service.js';
import { clearAuthCookies, setAuthCookies } from '../utils/cookie-helper.js';
import { formatUserResponse } from './user-controller.js';

export async function handleLogin(req, res) {
  const { email, password } = req.body;

  try {
    const user = await authService.performLogin(email, password);

    const tokens = await tokenService.createAndStoreTokenPair(user);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    return res.status(200).json({
      message: 'User logged in successfully',
      data: {
        expiresIn: tokens.expiresIn,
        tokenReused: tokens.wasReused,
        user: formatUserResponse(user),
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    if (err.message === 'MISSING_CREDENTIALS') {
      return sendErrorResponse(res, AUTH_ERRORS.MISSING_CREDENTIALS);
    }
    if (err.message === 'INVALID_CREDENTIALS') {
      return sendErrorResponse(res, AUTH_ERRORS.INVALID_CREDENTIALS);
    }

    return sendErrorResponse(res, AUTH_ERRORS.SERVER_ERROR);
  }
}

export async function handleVerifyToken(req, res) {
  try {
    const verifiedUser = req.user;
    return res.status(200).json({
      message: 'Token verified successfully',
      data: verifiedUser,
    });
  } catch (err) {
    console.error('Token verification error:', err);
    return sendErrorResponse(res, AUTH_ERRORS.TOKEN_VERIFICATION_ERROR);
  }
}

export async function handleRefreshToken(req, res) {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return sendErrorResponse(res, AUTH_ERRORS.MISSING_REFRESH_TOKEN);
    }
    const user = await UserRepository.findById(req.userId);
    if (!user) {
      res.clearCookie('refreshToken', { path: '/auth' });
      return sendErrorResponse(res, AUTH_ERRORS.USER_NOT_FOUND);
    }

    const tokens = await tokenService.refreshAccessToken(refreshToken, user);

    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    return res.status(200).json({
      message: 'Token refreshed successfully',
      data: {
        expiresIn: tokens.expiresIn,
        user: formatUserResponse(user),
      },
    });
  } catch (err) {
    console.error('Refresh token error:', err);
    res.clearCookie('refreshToken', { path: '/auth' });
    if (err.name === 'TokenExpiredError') {
      return sendErrorResponse(res, AUTH_ERRORS.REFRESH_TOKEN_EXPIRED);
    }
    if (err.message === 'INVALID_TOKEN_TYPE') {
      return sendErrorResponse(res, AUTH_ERRORS.INVALID_TOKEN_TYPE);
    }

    return sendErrorResponse(res, AUTH_ERRORS.INVALID_REFRESH_TOKEN);
  }
}

export async function handleLogout(req, res) {
  try {
    const userId = req.userId;
    if (userId) {
      await tokenService.invalidateToken(userId);
    }

    clearAuthCookies(res);

    return res.status(200).json({
      message: 'Logged out successfully',
      data: {
        message: 'Access token removed from whitelist. You have been logged out securely.',
      },
    });
  } catch (err) {
    console.error('Logout error:', err);
    return sendErrorResponse(res, AUTH_ERRORS.SERVER_ERROR);
  }
}

/**
 * Reset token TTL to full duration
 * For keeping very active users logged in
 */
export async function handleResetTokenTTL(req, res) {
  try {
    const userId = req.userId;
    const result = await tokenService.resetTokenTTL(userId);

    return res.status(200).json({
      message: 'Token TTL reset successfully',
      data: {
        newExpiryInSeconds: result.newExpiryInSeconds,
        message: `Session reset to full ${Math.floor(result.newExpiryInSeconds / 60)} minutes`,
      },
    });
  } catch (err) {
    console.error('Token TTL reset error:', err);

    if (err.message === 'TOKEN_EXPIRED') {
      return sendErrorResponse(res, AUTH_ERRORS.TOKEN_EXPIRED);
    }
    if (err.message === 'TTL_RESET_FAILED') {
      return sendErrorResponse(res, AUTH_ERRORS.TTL_RESET_FAILED);
    }

    return sendErrorResponse(res, AUTH_ERRORS.SERVER_ERROR);
  }
}

/**
 * Generate and send OTP for user verification
 * Uses access token from cookie to identify the user
 */
export async function handleSendVerificationOTP(req, res) {
  try {
    const userId = req.userId;
    const user = req.user;

    const result = await verificationService.sendVerificationOTP(userId, user);

    return res.status(200).json({
      message: 'OTP sent successfully to your email address.',
      data: {
        email: result.email,
        expiryMinutes: result.expiryMinutes,
      },
    });
  } catch (error) {
    console.error('Error generating verification OTP:', error);
    if (error.message === 'ALREADY_VERIFIED') {
      return sendErrorResponse(res, AUTH_ERRORS.ALREADY_VERIFIED);
    }

    if (error.message === 'OTP_COOLDOWN' && error.cooldownInfo) {
      const { message, retryAfterSeconds } = error.cooldownInfo;
      return res.status(400).json({
        message,
        error: AUTH_ERRORS.OTP_ALREADY_SENT.code,
        retryAfterSeconds,
      });
    }

    if (error.message === 'STORAGE_ERROR') {
      return sendErrorResponse(res, AUTH_ERRORS.STORAGE_ERROR);
    }

    if (error.message === 'EMAIL_ERROR') {
      return sendErrorResponse(res, AUTH_ERRORS.EMAIL_ERROR);
    }

    return sendErrorResponse(res, AUTH_ERRORS.VERIFICATION_SERVER_ERROR);
  }
}

/**
 * Verify OTP for user verification
 */
export async function handleVerifyOTP(req, res) {
  try {
    const { otp } = req.body;
    const userId = req.userId;
    const user = req.user;

    const result = await verificationService.verifyOTP(userId, user, otp);

    return res.status(200).json({
      message: 'Email verified successfully',
      data: {
        user: formatUserResponse(result.user),
        verifiedAt: result.verifiedAt,
      },
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    if (error.message === 'MISSING_OTP') {
      return sendErrorResponse(res, AUTH_ERRORS.MISSING_OTP);
    }

    if (error.message === 'ALREADY_VERIFIED') {
      return sendErrorResponse(res, AUTH_ERRORS.ALREADY_VERIFIED);
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

    if (error.message === 'USER_NOT_FOUND_UPDATE') {
      return sendErrorResponse(res, AUTH_ERRORS.USER_NOT_FOUND_UPDATE);
    }

    return sendErrorResponse(res, AUTH_ERRORS.SERVER_ERROR);
  }
}

/**
 * Check current user's verification status
 */
export async function handleCheckVerificationStatus(req, res) {
  try {
    const userId = req.userId;
    const user = req.user;

    const status = await verificationService.getVerificationStatus(userId, user);

    return res.status(200).json({
      message: 'Verification status retrieved',
      data: status,
    });
  } catch (error) {
    console.error('Check verification status error:', error);
    return sendErrorResponse(res, AUTH_ERRORS.SERVER_ERROR);
  }
}

/**
 * ============================================================================
 * LOGIN 2FA HANDLERS (separate from email verification)
 * ============================================================================
 */

/**
 * Generate and send login 2FA OTP
 * This is used for two-factor authentication during login
 * Works for all users (verified or not)
 */
export async function handleSendLogin2FAOTP(req, res) {
  try {
    const userId = req.userId;
    const user = req.user;

    const result = await verificationService.sendLogin2FAOTP(userId, user);

    return res.status(200).json({
      message: 'Login verification code sent successfully to your email address.',
      data: {
        email: result.email,
        expiryMinutes: result.expiryMinutes,
      },
    });
  } catch (error) {
    console.error('Error generating login 2FA OTP:', error);

    if (error.message === 'OTP_COOLDOWN' && error.cooldownInfo) {
      const { message, retryAfterSeconds } = error.cooldownInfo;
      return res.status(400).json({
        message,
        error: AUTH_ERRORS.OTP_ALREADY_SENT.code,
        retryAfterSeconds,
      });
    }

    if (error.message === 'STORAGE_ERROR') {
      return sendErrorResponse(res, AUTH_ERRORS.STORAGE_ERROR);
    }

    if (error.message === 'EMAIL_ERROR') {
      return sendErrorResponse(res, AUTH_ERRORS.EMAIL_ERROR);
    }

    return sendErrorResponse(res, AUTH_ERRORS.VERIFICATION_SERVER_ERROR);
  }
}

/**
 * Verify login 2FA OTP
 * Validates the OTP code for completing the login process
 */
export async function handleVerifyLogin2FAOTP(req, res) {
  try {
    const { otp } = req.body;
    const userId = req.userId;
    const user = req.user;

    const result = await verificationService.verifyLogin2FAOTP(userId, user, otp);

    return res.status(200).json({
      message: 'Login verification successful',
      data: {
        user: formatUserResponse(result.user),
        verifiedAt: result.verifiedAt,
      },
    });
  } catch (error) {
    console.error('Login 2FA OTP verification error:', error);

    if (error.message === 'MISSING_OTP') {
      return sendErrorResponse(res, AUTH_ERRORS.MISSING_OTP);
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
