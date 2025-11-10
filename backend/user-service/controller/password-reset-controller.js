import { AUTH_ERRORS, sendErrorResponse } from '../errors/index.js';
import { otpService } from '../services/otp-service.js';
import * as passwordResetService from '../services/password-reset-service.js';

export async function handleInitiatePasswordReset(req, res) {
  try {
    const { email } = req.body;

    const result = await passwordResetService.initiatePasswordReset(email);

    return res.status(200).json({
      message: 'Password reset code sent to your email.',
      data: {
        email: result.email,
        expiryMinutes: result.expiryMinutes,
      },
    });
  } catch (error) {
    console.error('Initiate password reset error:', error);

    if (error.message === 'USER_NOT_FOUND') {
      return res.status(200).json({
        message: 'If an account with this email exists, a password reset code has been sent.',
        data: {
          email: req.body.email,
        },
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

export async function handleVerifyPasswordResetOTP(req, res) {
  try {
    const { email, otp } = req.body;

    const result = await passwordResetService.verifyPasswordResetOTP(email, otp);

    return res.status(200).json({
      message: 'OTP verified successfully. You can now reset your password.',
      data: result,
    });
  } catch (error) {
    console.error('Verify password reset OTP error:', error);

    if (error.message === 'USER_NOT_FOUND') {
      return res.status(404).json({
        message: 'User not found',
        error: 'USER_NOT_FOUND',
      });
    }

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

export async function handleResetPassword(req, res) {
  try {
    const { email, otp, newPassword } = req.body;

    const result = await passwordResetService.resetPassword(email, otp, newPassword);

    return res.status(200).json({
      message: 'Password has been reset successfully. You can now log in with your new password.',
      data: result,
    });
  } catch (error) {
    console.error('Reset password error:', error);

    if (error.message === 'USER_NOT_FOUND') {
      return res.status(404).json({
        message: 'User not found',
        error: 'USER_NOT_FOUND',
      });
    }

    if (error.message === 'MISSING_OTP') {
      return sendErrorResponse(res, AUTH_ERRORS.MISSING_OTP);
    }

    if (error.message === 'MISSING_PASSWORD') {
      return res.status(400).json({
        message: 'New password is required',
        error: 'MISSING_PASSWORD',
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

export async function handleResendPasswordResetOTP(req, res) {
  try {
    const { email } = req.body;

    const result = await passwordResetService.resendPasswordResetOTP(email);

    return res.status(200).json({
      message: 'Password reset code resent successfully',
      data: {
        email: result.email,
        expiryMinutes: result.expiryMinutes,
      },
    });
  } catch (error) {
    console.error('Resend password reset OTP error:', error);

    if (error.message === 'USER_NOT_FOUND') {
      return res.status(200).json({
        message: 'If an account with this email exists, a password reset code has been sent.',
        data: {
          email: req.body.email,
        },
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
