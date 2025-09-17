import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { UserRepository } from "../model/user-repository.js";
import { formatUserResponse } from "./user-controller.js";
import { generateToken, generateRefreshToken } from "../middleware/jwtAuth.js";
import { redisService } from "../services/redis-service.js";

function secondsToMs(seconds) {
  return parseInt(seconds) * 1000;
}

/**
 * Check if we should reuse an existing token or generate a new one
 * Returns existing token if it has sufficient remaining time, null otherwise
 */
async function shouldReuseToken(userId) {
  const MINIMUM_REMAINING_TIME = 300; // 5 minutes in seconds

  try {
    const existingToken = await redisService.getWhitelistToken(userId);
    if (!existingToken) {
      return null; // No existing token
    }

    const remainingTTL = await redisService.getWhitelistTokenTTL(userId);
    if (remainingTTL > MINIMUM_REMAINING_TIME) {
      console.log(
        `Reusing existing token for user ${userId} (${remainingTTL}s remaining)`
      );
      return existingToken;
    }

    return null; // Token expires soon, generate new one
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

    // Update lastLogin timestamp
    const updatedUser = await UserRepository.updateById(user.id, {
      lastLogin: new Date(),
    });

    // Check if we can reuse an existing token
    let accessToken = await shouldReuseToken((updatedUser || user).id);
    let tokenWasReused = !!accessToken;

    // Generate new tokens if no existing token to reuse
    if (!accessToken) {
      accessToken = generateToken(updatedUser || user);

      // Store new access token in Redis whitelist with TTL matching JWT expiration
      const tokenTTL = parseInt(process.env.JWT_EXPIRES_IN || 900);
      const whitelistStored = await redisService.storeWhitelistToken(
        (updatedUser || user).id,
        accessToken,
        tokenTTL
      );

      if (!whitelistStored) {
        console.warn(
          "Failed to store token in whitelist - Redis may not be available"
        );
      }
    }

    const refreshToken = generateRefreshToken(updatedUser || user);

    // Set httpOnly cookies for both tokens
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === "true",
      sameSite: process.env.COOKIE_SAME_SITE || "lax",
      maxAge: secondsToMs(process.env.JWT_EXPIRES_IN || 900),
      path: "/", // Available for all paths
      domain: process.env.COOKIE_DOMAIN,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === "true",
      sameSite: process.env.COOKIE_SAME_SITE || "lax",
      maxAge: secondsToMs(process.env.JWT_REFRESH_EXPIRES_IN || 604800),
      path: "/", // Available for all paths
      domain: process.env.COOKIE_DOMAIN,
    });

    // Return success response (tokens are in cookies)
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

    // Verify refresh token
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

    // Get user from database
    const user = await UserRepository.findById(decoded.id);
    if (!user) {
      res.clearCookie("refreshToken", { path: "/auth" });
      return res.status(401).json({
        message: "User not found. Please login again.",
        error: "USER_NOT_FOUND",
      });
    }

    // Generate new access token
    const newAccessToken = generateToken(user);

    // Store new access token in Redis whitelist (replaces old one)
    const tokenTTL = parseInt(process.env.JWT_EXPIRES_IN || 900);
    const whitelistStored = await redisService.storeWhitelistToken(
      user.id,
      newAccessToken,
      tokenTTL
    );

    if (!whitelistStored) {
      console.warn(
        "Failed to store new token in whitelist - Redis may not be available"
      );
    }

    const newRefreshToken = generateRefreshToken(user);

    // Update both access and refresh token cookies
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
    // Get user ID from the verified token
    const userId = req.userId;

    if (userId) {
      // Remove token from Redis whitelist
      const removed = await redisService.removeWhitelistToken(userId);
      if (removed) {
        console.log(`Token removed from whitelist for user ${userId}`);
      } else {
        console.warn(
          "Failed to remove token from whitelist - Redis may not be available"
        );
      }
    }

    // Clear both access and refresh token cookies
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
        message:
          "Access token removed from whitelist. You have been logged out securely.",
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
 * Reset token TTL to full duration (activity-based refresh)
 * Useful for keeping very active users logged in
 */
export async function handleResetTokenTTL(req, res) {
  try {
    const userId = req.userId;
    const fullTTL = parseInt(process.env.JWT_EXPIRES_IN || 900);

    // Check if token exists
    const currentTTL = await redisService.getWhitelistTokenTTL(userId);
    if (currentTTL <= 0) {
      return res.status(401).json({
        message: "Token has expired or does not exist",
        error: "TOKEN_EXPIRED",
      });
    }

    // Reset TTL to full duration
    const reset = await redisService.resetWhitelistTokenTTL(userId, fullTTL);

    if (!reset) {
      return res.status(500).json({
        message:
          "Failed to reset token TTL. Please try refreshing your session.",
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
