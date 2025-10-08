import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { UserRepository } from "../model/user-repository.js";
import { formatUserResponse } from "./user-controller.js";
import { generateToken, generateRefreshToken } from "../middleware/jwtAuth.js";
import { redisService } from "../services/redis-service.js";
import { otpService } from "../services/otp-service.js";
import { emailService } from "../services/email-service.js";
import { AUTH_ERRORS, sendErrorResponse } from "../errors/index.js";

function secondsToMs(seconds) {
  return parseInt(seconds) * 1000;
}

/**
 * Check if we should reuse an existing token or generate a new one
 * Returns existing token if it has sufficient remaining time, null otherwise
 */
async function shouldReuseToken(userId) {
  const MINIMUM_REMAINING_TIME = parseInt(
    process.env.MINIMUM_TOKEN_REUSE_TIME
  );

  try {
    const existingToken = await redisService.getWhitelistToken(userId);
    if (!existingToken) {
      return null;
    }

    const remainingTTL = await redisService.getWhitelistTokenTTL(userId);
    if (remainingTTL > MINIMUM_REMAINING_TIME) {
      console.log(
        `Reusing existing token for user ${userId} (${remainingTTL}s remaining)`
      );
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
    return sendErrorResponse(res, AUTH_ERRORS.MISSING_CREDENTIALS);
  }

  try {
    const user = await UserRepository.findByEmail(email.toLowerCase());
    if (!user) {
      return sendErrorResponse(res, AUTH_ERRORS.INVALID_CREDENTIALS);
    }

    const match = await argon2.verify(user.password, password);
    if (!match) {
      return sendErrorResponse(res, AUTH_ERRORS.INVALID_CREDENTIALS);
    }

    const updatedUser = await UserRepository.updateById(user.id, {
      lastLogin: new Date(),
    });

    const currentUser = updatedUser || user;
    const userId = currentUser.id.toString();
    const tokenTTL = parseInt(process.env.JWT_EXPIRES_IN);

    // Use atomic whitelist storage to prevent race conditions
    const minReuseTime = parseInt(process.env.MINIMUM_TOKEN_REUSE_TIME);
    
    // Prepare user data for caching
    const userData = {
      id: currentUser.id,
      username: currentUser.username,
      email: currentUser.email,
      isAdmin: currentUser.isAdmin,
      isVerified: currentUser.isVerified,
      createdAt: currentUser.createdAt,
      lastLogin: currentUser.lastLogin,
    };

    const newToken = generateToken(currentUser);

    // Atomically store or reuse token - prevents race conditions
    const result = await redisService.storeOrReuseWhitelistToken(
      userId,
      newToken,
      userData,
      tokenTTL,
      minReuseTime
    );

    const accessToken = result.token;
    const tokenWasReused = result.wasReused;

    const refreshToken = generateRefreshToken(currentUser);
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === "true",
      sameSite: process.env.COOKIE_SAME_SITE,
      maxAge: secondsToMs(process.env.JWT_EXPIRES_IN),
      path: "/",
      domain: process.env.COOKIE_DOMAIN,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === "true",
      sameSite: process.env.COOKIE_SAME_SITE,
      maxAge: secondsToMs(process.env.JWT_REFRESH_EXPIRES_IN),
      path: "/",
      domain: process.env.COOKIE_DOMAIN,
    });

    return res.status(200).json({
      message: "User logged in successfully",
      data: {
        expiresIn: parseInt(process.env.JWT_EXPIRES_IN),
        tokenReused: tokenWasReused,
        user: formatUserResponse(currentUser),
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return sendErrorResponse(res, AUTH_ERRORS.SERVER_ERROR);
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
    return sendErrorResponse(res, AUTH_ERRORS.TOKEN_VERIFICATION_ERROR);
  }
}

export async function handleRefreshToken(req, res) {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return sendErrorResponse(res, AUTH_ERRORS.MISSING_REFRESH_TOKEN);
    }
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );

    if (decoded.type !== "refresh") {
      return sendErrorResponse(res, AUTH_ERRORS.INVALID_TOKEN_TYPE);
    }

    const user = await UserRepository.findById(decoded.id);
    if (!user) {
      res.clearCookie("refreshToken", { path: "/auth" });
      return sendErrorResponse(res, AUTH_ERRORS.USER_NOT_FOUND);
    }

    const newAccessToken = generateToken(user);
    const tokenTTL = parseInt(process.env.JWT_EXPIRES_IN);
    const userId = user.id.toString();

    // Prepare user data for caching
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
    };

    // Store in whitelist with user data cache
    await redisService.storeWhitelistToken(userId, newAccessToken, tokenTTL, userData);

    const newRefreshToken = generateRefreshToken(user);
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === "true",
      sameSite: process.env.COOKIE_SAME_SITE,
      maxAge: secondsToMs(process.env.JWT_EXPIRES_IN),
      path: "/",
      domain: process.env.COOKIE_DOMAIN,
    });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === "true",
      sameSite: process.env.COOKIE_SAME_SITE,
      maxAge: secondsToMs(process.env.JWT_REFRESH_EXPIRES_IN),
      path: "/",
      domain: process.env.COOKIE_DOMAIN,
    });

    return res.status(200).json({
      message: "Token refreshed successfully",
      data: {
        expiresIn: parseInt(process.env.JWT_EXPIRES_IN),
        user: formatUserResponse(user),
      },
    });
  } catch (err) {
    console.error("Refresh token error:", err);

    res.clearCookie("refreshToken", { path: "/auth" });

    if (err.name === "TokenExpiredError") {
      return sendErrorResponse(res, AUTH_ERRORS.REFRESH_TOKEN_EXPIRED);
    }

    return sendErrorResponse(res, AUTH_ERRORS.INVALID_REFRESH_TOKEN);
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
      sameSite: process.env.COOKIE_SAME_SITE,
      domain: process.env.COOKIE_DOMAIN,
    });

    res.clearCookie("refreshToken", {
      path: "/",
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === "true",
      sameSite: process.env.COOKIE_SAME_SITE,
      domain: process.env.COOKIE_DOMAIN,
    });

    return res.status(200).json({
      message: "Logged out successfully",
      data: {
        message:
          "Access token removed from whitelist. You have been logged out securely.",
      },
    });
  } catch (err) {
    console.error("Logout error:", err);
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
    const fullTTL = parseInt(process.env.JWT_EXPIRES_IN);
    const currentTTL = await redisService.getWhitelistTokenTTL(userId);
    if (currentTTL <= 0) {
      return sendErrorResponse(res, AUTH_ERRORS.TOKEN_EXPIRED);
    }
    const reset = await redisService.resetWhitelistTokenTTL(userId, fullTTL);

    if (!reset) {
      return sendErrorResponse(res, AUTH_ERRORS.TTL_RESET_FAILED);
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
    return sendErrorResponse(res, AUTH_ERRORS.SERVER_ERROR);
  }
}

/**
 * Generate and send OTP for user verification
 * Uses access token from cookie to identify the user
 */
export async function handleSendVerificationOTP(req, res) {
  const otpPurpose = "verification";
  try {
    const userId = req.userId;
    const user = req.user;

    if (user.isVerified) {
      return sendErrorResponse(res, AUTH_ERRORS.ALREADY_VERIFIED);
    }

    const normalizedEmail = user.email.toLowerCase();

    const existingOTP = await redisService.getOTP(userId, otpPurpose);
    if (existingOTP) {
      const remainingTTL = otpService.getRemainingTTL(existingOTP);
      if (remainingTTL > 60) {
        const minutes = Math.floor(remainingTTL / 60);
        const seconds = remainingTTL % 60;
        const timeString =
          minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

        return res.status(400).json({
          message: AUTH_ERRORS.OTP_ALREADY_SENT.message(timeString),
          error: AUTH_ERRORS.OTP_ALREADY_SENT.code,
          retryAfterSeconds: remainingTTL,
        });
      }
    }
    const otpData = otpService.generateOTPData(normalizedEmail, otpPurpose);
    const storeResult = await redisService.storeOTP(
      userId,
      otpData,
      otpPurpose
    );
    if (!storeResult) {
      console.error("Failed to store OTP in Cache");
      return sendErrorResponse(res, AUTH_ERRORS.STORAGE_ERROR);
    }
    const emailResult = await emailService.sendRegistrationOTP(
      normalizedEmail,
      otpData.otp,
      { username: user.username }
    );

    if (!emailResult.success) {
      console.error("Failed to send OTP email:", emailResult.error);
      await redisService.deleteOTP(userId, otpPurpose);
      return sendErrorResponse(res, AUTH_ERRORS.EMAIL_ERROR);
    }

    console.log(
      `Verification OTP generated and sent for user ${userId} (${normalizedEmail})`
    );

    return res.status(200).json({
      message: "OTP sent successfully to your email address.",
      data: {
        email: normalizedEmail,
        expiryMinutes: Math.floor(otpData.ttl / 60),
      },
    });
  } catch (error) {
    console.error("Error generating verification OTP:", error);
    return sendErrorResponse(res, AUTH_ERRORS.VERIFICATION_SERVER_ERROR);
  }
}

/**
 * Verify OTP for user verification
 */
export async function handleVerifyOTP(req, res) {
  const otpPurpose = "verification";
  try {
    const { otp } = req.body;
    const userId = req.userId;
    const user = req.user;

    console.log(
      `Verifying OTP for user. userId: ${userId}, user._id: ${user._id}, user.id: ${user.id}`
    );

    if (!otp) {
      return sendErrorResponse(res, AUTH_ERRORS.MISSING_OTP);
    }

    if (user.isVerified) {
      return sendErrorResponse(res, AUTH_ERRORS.ALREADY_VERIFIED);
    }

    const storedOTPData = await redisService.getOTP(userId, otpPurpose);

    const validationResult = otpService.validateOTP(
      storedOTPData,
      otp,
      user.email.toLowerCase(),
      otpPurpose
    );

    if (!validationResult.isValid) {
      if (storedOTPData && !validationResult.shouldDelete) {
        await redisService.incrementOTPAttempts(userId, otpPurpose);
      }
      if (validationResult.shouldDelete) {
        await redisService.deleteOTP(userId, otpPurpose);
      }

      const errorMessage = otpService.getErrorMessage(validationResult);
      return res.status(400).json({
        message: errorMessage,
        error: validationResult.reason,
        attemptsRemaining: validationResult.attemptsRemaining,
      });
    }
    try {
      console.log(`Attempting to update user ${user.id} with isVerified: true`);
      const updatedUser = await UserRepository.updateById(user.id, {
        isVerified: true,
      });

      if (!updatedUser) {
        console.error("Update returned null - user may not exist");
        return sendErrorResponse(res, AUTH_ERRORS.USER_NOT_FOUND_UPDATE);
      }

      console.log(
        `User update successful. isVerified is now: ${updatedUser.isVerified}`
      );
      await redisService.deleteOTP(userId, "verification");

      console.log(
        `User ${userId} (${user.email}) successfully verified via OTP`
      );

      return res.status(200).json({
        message: "Email verified successfully",
        data: {
          user: formatUserResponse(updatedUser),
          verifiedAt: new Date().toISOString(),
        },
      });
    } catch (updateError) {
      console.error("Error updating user verification status:", updateError);
      return sendErrorResponse(res, AUTH_ERRORS.UPDATE_ERROR);
    }
  } catch (error) {
    console.error("OTP verification error:", error);
    return sendErrorResponse(res, AUTH_ERRORS.SERVER_ERROR);
  }
}

/**
 * Check current user's verification status
 */
export async function handleCheckVerificationStatus(req, res) {
  const otpPurpose = "verification";
  try {
    const userId = req.userId;
    const user = req.user;

    const hasOTP = await redisService.hasOTP(userId, otpPurpose);
    const otpData = hasOTP
      ? await redisService.getOTP(userId, otpPurpose)
      : null;

    return res.status(200).json({
      message: "Verification status retrieved",
      data: {
        email: user.email,
        username: user.username,
        isVerified: user.isVerified,
        hasActivePendingOTP: hasOTP,
        otpExpiresIn: otpData ? otpService.getRemainingTTL(otpData) : 0,
        canSendOTP:
          !user.isVerified &&
          (!otpData || otpService.getRemainingTTL(otpData) <= 60),
      },
    });
  } catch (error) {
    console.error("Check verification status error:", error);
    return sendErrorResponse(res, AUTH_ERRORS.SERVER_ERROR);
  }
}
