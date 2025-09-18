import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { UserRepository } from "../model/user-repository.js";
import { formatUserResponse } from "./user-controller.js";
import { generateToken, generateRefreshToken } from "../middleware/jwtAuth.js";
import { redisService } from "../services/redis-service.js";
import { otpService } from "../services/otp-service.js";
import { emailService } from "../services/email-service.js";

function secondsToMs(seconds) {
  return parseInt(seconds) * 1000;
}

/**
 * Check if we should reuse an existing token or generate a new one
 * Returns existing token if it has sufficient remaining time, null otherwise
 */
async function shouldReuseToken(userId) {
  const MINIMUM_REMAINING_TIME = 300; 
  
  try {
    const existingToken = await redisService.getWhitelistToken(userId);
    if (!existingToken) {
      return null; 
    }

    const remainingTTL = await redisService.getWhitelistTokenTTL(userId);
    if (remainingTTL > MINIMUM_REMAINING_TIME) {
      console.log(`Reusing existing token for user ${userId} (${remainingTTL}s remaining)`);
      return existingToken;
    }

    return null; 
  } catch (error) {
    console.error("Error checking token reuse:", error);
    return null;
  }
}

export async function handleLogin(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Missing email and/or password",
      error: "MISSING_CREDENTIALS",
    });
  }

  try {
    const user = await UserRepository.findByEmail(email.toLowerCase());
    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
        error: "INVALID_CREDENTIALS",
      });
    }

    const match = await argon2.verify(user.password, password);
    if (!match) {
      return res.status(401).json({
        message: "Invalid email or password",
        error: "INVALID_CREDENTIALS",
      });
    }

    const updatedUser = await UserRepository.updateById(user.id, {
      lastLogin: new Date(),
    });

    let accessToken = await shouldReuseToken((updatedUser || user).id);
    let tokenWasReused = !!accessToken;

    if (!accessToken) {
      accessToken = generateToken(updatedUser || user);

      const tokenTTL = parseInt(process.env.JWT_EXPIRES_IN || 900);
      const whitelistStored = await redisService.storeWhitelistToken(
        (updatedUser || user).id,
        accessToken,
        tokenTTL
      );

      if (!whitelistStored) {
        console.warn("Failed to store token in whitelist - Redis may not be available");
      }
    }

    const refreshToken = generateRefreshToken(updatedUser || user);
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === "true",
      sameSite: process.env.COOKIE_SAME_SITE || "lax",
      maxAge: secondsToMs(process.env.JWT_EXPIRES_IN || 900),
      path: "/",
      domain: process.env.COOKIE_DOMAIN,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === "true",
      sameSite: process.env.COOKIE_SAME_SITE || "lax",
      maxAge: secondsToMs(process.env.JWT_REFRESH_EXPIRES_IN || 604800),
      path: "/",
      domain: process.env.COOKIE_DOMAIN,
    });

    // Return success response
    return res.status(200).json({
      message: "User logged in successfully",
      data: {
        expiresIn: parseInt(process.env.JWT_EXPIRES_IN || 900),
        tokenReused: tokenWasReused,
        user: formatUserResponse(updatedUser || user),
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({
      message: "Internal server error",
      error: "SERVER_ERROR",
    });
  }
}

export async function handleVerifyToken(req, res) {
  try {
    const verifiedUser = req.user;
    return res.status(200).json({
      message: "Token verified successfully",
      data: verifiedUser,
    });
  } catch (err) {
    console.error("Token verification error:", err);
    return res.status(500).json({
      message: "Internal server error",
      error: "SERVER_ERROR",
    });
  }
}

export async function handleRefreshToken(req, res) {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        message: "Refresh token not provided. Please login again.",
        error: "MISSING_REFRESH_TOKEN",
      });
    }
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );

    if (decoded.type !== "refresh") {
      return res.status(401).json({
        message: "Invalid token type",
        error: "INVALID_TOKEN_TYPE",
      });
    }

    const user = await UserRepository.findById(decoded.id);
    if (!user) {
      res.clearCookie("refreshToken", { path: "/auth" });
      return res.status(401).json({
        message: "User not found. Please login again.",
        error: "USER_NOT_FOUND",
      });
    }

    const newAccessToken = generateToken(user);
    
    const tokenTTL = parseInt(process.env.JWT_EXPIRES_IN || 900);
    const whitelistStored = await redisService.storeWhitelistToken(
      user.id,
      newAccessToken,
      tokenTTL
    );

    if (!whitelistStored) {
      console.warn("Failed to store new token in whitelist - Redis may not be available");
    }

    const newRefreshToken = generateRefreshToken(user);
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === "true",
      sameSite: process.env.COOKIE_SAME_SITE || "lax",
      maxAge: secondsToMs(process.env.JWT_EXPIRES_IN || 900),
      path: "/",
      domain: process.env.COOKIE_DOMAIN,
    });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === "true",
      sameSite: process.env.COOKIE_SAME_SITE || "lax",
      maxAge: secondsToMs(process.env.JWT_REFRESH_EXPIRES_IN || 604800),
      path: "/",
      domain: process.env.COOKIE_DOMAIN,
    });

    return res.status(200).json({
      message: "Token refreshed successfully",
      data: {
        expiresIn: parseInt(process.env.JWT_EXPIRES_IN || 900),
        user: formatUserResponse(user),
      },
    });
  } catch (err) {
    console.error("Refresh token error:", err);

    res.clearCookie("refreshToken", { path: "/auth" });

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Refresh token expired. Please login again.",
        error: "REFRESH_TOKEN_EXPIRED",
      });
    }

    return res.status(401).json({
      message: "Invalid refresh token. Please login again.",
      error: "INVALID_REFRESH_TOKEN",
    });
  }
}

export async function handleLogout(req, res) {
  try {
    const userId = req.userId;

    if (userId) {
      const removed = await redisService.removeWhitelistToken(userId);
      if (removed) {
        console.log(`Token removed from whitelist for user ${userId}`);
      } else {
        console.warn("Failed to remove token from whitelist");
      }
    }


    res.clearCookie("accessToken", {
      path: "/",
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === "true",
      sameSite: process.env.COOKIE_SAME_SITE || "lax",
      domain: process.env.COOKIE_DOMAIN,
    });

    res.clearCookie("refreshToken", {
      path: "/",
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === "true",
      sameSite: process.env.COOKIE_SAME_SITE || "lax",
      domain: process.env.COOKIE_DOMAIN,
    });

    return res.status(200).json({
      message: "Logged out successfully",
      data: {
        message: "Access token removed from whitelist. You have been logged out securely.",
      },
    });
  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).json({
      message: "Internal server error",
      error: "SERVER_ERROR",
    });
  }
}

/**
 * Reset token TTL to full duration
 * For keeping very active users logged in
 */
export async function handleResetTokenTTL(req, res) {
  try {
    const userId = req.userId;
    const fullTTL = parseInt(process.env.JWT_EXPIRES_IN || 900);
    const currentTTL = await redisService.getWhitelistTokenTTL(userId);
    if (currentTTL <= 0) {
      return res.status(401).json({
        message: "Token has expired or does not exist",
        error: "TOKEN_EXPIRED",
      });
    }
    const reset = await redisService.resetWhitelistTokenTTL(userId, fullTTL);
    
    if (!reset) {
      return res.status(500).json({
        message: "Failed to reset token TTL. Please try refreshing your session.",
        error: "TTL_RESET_FAILED",
      });
    }

    return res.status(200).json({
      message: "Token TTL reset successfully",
      data: {
        newExpiryInSeconds: fullTTL,
        message: `Session reset to full ${Math.floor(fullTTL / 60)} minutes`,
      },
    });
  } catch (err) {
    console.error("Token TTL reset error:", err);
    return res.status(500).json({
      message: "Internal server error",
      error: "SERVER_ERROR",
    });
  }
}

// ===============================
// OTP Management Functions (Cookie-based verification)
// ===================================================

/**
 * Generate and send OTP for user verification (called by logged-in user)
 * Uses access token from cookie to identify the user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function handleSendVerificationOTP(req, res) {
  try {
    // User must be logged in (access token verified by middleware)
    const userId = req.userId;
    const user = req.user;

    // Check if user is already verified
    if (user.isVerified) {
      return res.status(400).json({
        message: "User is already verified",
        error: "ALREADY_VERIFIED"
      });
    }

    const normalizedEmail = user.email.toLowerCase();
    
    // Check if there's already an active OTP for this user
    const existingOTP = await redisService.getOTP(userId, 'verification');
    if (existingOTP) {
      const remainingTTL = otpService.getRemainingTTL(existingOTP);
      if (remainingTTL > 60) { // If more than 1 minute remaining
        return res.status(400).json({
          message: `OTP already sent. Please wait ${Math.ceil(remainingTTL / 60)} more minute(s) before requesting a new one.`,
          error: 'OTP_ALREADY_SENT',
          retryAfterSeconds: remainingTTL
        });
      }
    }

    // Generate new OTP (use userId as key instead of email)
    const otpData = otpService.generateOTPData(normalizedEmail, 'verification');
    
    // Store OTP in Redis using userId as key
    const storeResult = await redisService.storeOTP(userId, otpData, 'verification');
    if (!storeResult) {
      console.error('Failed to store OTP in Redis');
      return res.status(500).json({
        message: 'Failed to generate OTP. Please try again later.',
        error: 'STORAGE_ERROR'
      });
    }

    // Send OTP via email
    const emailResult = await emailService.sendRegistrationOTP(normalizedEmail, otpData.otp, { username: user.username });
    
    if (!emailResult.success) {
      console.error('Failed to send OTP email:', emailResult.error);
      // Clean up stored OTP if email failed
      await redisService.deleteOTP(userId, 'verification');
      return res.status(500).json({
        message: 'Failed to send OTP email. Please try again later.',
        error: 'EMAIL_ERROR'
      });
    }

    console.log(`Verification OTP generated and sent for user ${userId} (${normalizedEmail})`);
    
    return res.status(200).json({
      message: 'OTP sent successfully to your email address.',
      data: {
        email: normalizedEmail,
        expiryMinutes: Math.floor(otpData.ttl / 60)
      }
    });

  } catch (error) {
    console.error('Error generating verification OTP:', error);
    return res.status(500).json({
      message: 'Internal server error. Please try again later.',
      error: 'SERVER_ERROR'
    });
  }
}

/**
 * Verify OTP for user verification (uses access token from cookie)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function handleVerifyOTP(req, res) {
  try {
    const { otp } = req.body;
    
    // User must be logged in (access token verified by middleware)
    const userId = req.userId;
    const user = req.user;

    console.log(`Verifying OTP for user. userId: ${userId}, user._id: ${user._id}, user.id: ${user.id}`);

    if (!otp) {
      return res.status(400).json({
        message: "OTP is required",
        error: "MISSING_OTP"
      });
    }

    // Check if user is already verified
    if (user.isVerified) {
      return res.status(400).json({
        message: "User is already verified",
        error: "ALREADY_VERIFIED"
      });
    }

    // Get stored OTP data using userId
    const storedOTPData = await redisService.getOTP(userId, 'verification');
    
    // Validate OTP
    const validationResult = otpService.validateOTP(storedOTPData, otp, user.email.toLowerCase(), 'verification');
    
    if (!validationResult.isValid) {
      // Increment attempt counter if OTP exists and wasn't expired
      if (storedOTPData && !validationResult.shouldDelete) {
        await redisService.incrementOTPAttempts(userId, 'verification');
      }
      
      // Delete OTP if it should be deleted (expired, max attempts, etc.)
      if (validationResult.shouldDelete) {
        await redisService.deleteOTP(userId, 'verification');
      }

      const errorMessage = otpService.getErrorMessage(validationResult);
      return res.status(400).json({
        message: errorMessage,
        error: validationResult.reason,
        attemptsRemaining: validationResult.attemptsRemaining
      });
    }

    // OTP is valid - mark user as verified
    try {
      console.log(`Attempting to update user ${user.id} with isVerified: true`);
      const updatedUser = await UserRepository.updateById(user.id, { isVerified: true });
      
      if (!updatedUser) {
        console.error('Update returned null - user may not exist');
        return res.status(500).json({
          message: "Failed to update user - user not found",
          error: "USER_NOT_FOUND"
        });
      }
      
      console.log(`User update successful. isVerified is now: ${updatedUser.isVerified}`);
      
      // Delete OTP after successful verification
      await redisService.deleteOTP(userId, 'verification');
      
      console.log(`User ${userId} (${user.email}) successfully verified via OTP`);
      
      return res.status(200).json({
        message: "Email verified successfully",
        data: {
          user: formatUserResponse(updatedUser),
          verifiedAt: new Date().toISOString()
        }
      });

    } catch (updateError) {
      console.error('Error updating user verification status:', updateError);
      return res.status(500).json({
        message: "Verification completed but failed to update user status",
        error: "UPDATE_ERROR"
      });
    }

  } catch (error) {
    console.error('OTP verification error:', error);
    return res.status(500).json({
      message: "Internal server error",
      error: "SERVER_ERROR"
    });
  }
}

/**
 * Check current user's verification status (uses access token from cookie)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function handleCheckVerificationStatus(req, res) {
  try {
    // User must be logged in (access token verified by middleware)
    const userId = req.userId;
    const user = req.user;

    // Check if there's a pending OTP
    const hasOTP = await redisService.hasOTP(userId, 'verification');
    const otpData = hasOTP ? await redisService.getOTP(userId, 'verification') : null;
    
    return res.status(200).json({
      message: "Verification status retrieved",
      data: {
        email: user.email,
        username: user.username,
        isVerified: user.isVerified,
        hasActivePendingOTP: hasOTP,
        otpExpiresIn: otpData ? otpService.getRemainingTTL(otpData) : 0,
        canSendOTP: !user.isVerified && (!otpData || otpService.getRemainingTTL(otpData) <= 60)
      }
    });

  } catch (error) {
    console.error('Check verification status error:', error);
    return res.status(500).json({
      message: "Internal server error",
      error: "SERVER_ERROR"
    });
  }
}
