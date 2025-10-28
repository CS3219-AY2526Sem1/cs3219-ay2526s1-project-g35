import { AUTH_ERRORS, sendErrorResponse } from '../errors/index.js';
import { UserRepository } from '../model/user-repository.js';
import * as authService from '../services/auth-service.js';
import * as tokenService from '../services/token-service.js';
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
