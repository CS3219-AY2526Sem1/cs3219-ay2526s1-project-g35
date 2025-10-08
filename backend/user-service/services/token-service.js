import jwt from "jsonwebtoken";
import { generateToken, generateRefreshToken } from "../middleware/jwtAuth.js";
import { whitelistRedisService } from "./redis/redis-whitelist-service.js";

/**
 * Prepare user data for caching
 * Extracts only the necessary fields to store with the token
 */
export function prepareUserDataForCache(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    isAdmin: user.isAdmin,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin,
  };
}

/**
 * Create and store a new token pair (access + refresh)
 * Uses atomic operation to handle concurrent logins and token reuse
 * 
 * @param {Object} user - User object
 * @returns {Object} { accessToken, refreshToken, wasReused }
 */
export async function createAndStoreTokenPair(user) {
  const userId = user.id.toString();
  const tokenTTL = parseInt(process.env.JWT_EXPIRES_IN);
  const minReuseTime = parseInt(process.env.MINIMUM_TOKEN_REUSE_TIME);

  const userData = prepareUserDataForCache(user);
  const newToken = generateToken(user);
  const refreshToken = generateRefreshToken(user);

  const result = await whitelistRedisService.storeOrReuseWhitelistToken(
    userId,
    newToken,
    userData,
    tokenTTL,
    minReuseTime
  );

  return {
    accessToken: result.token,
    refreshToken: refreshToken,
    wasReused: result.wasReused,
    expiresIn: tokenTTL,
  };
}

/**
 * Refresh access token using refresh token
 * 
 * @param {string} refreshToken - Refresh token from cookie
 * @param {Object} user - User object
 * @returns {Object} { accessToken, refreshToken }
 */
export async function refreshAccessToken(refreshToken, user) {
  const decoded = jwt.verify(
    refreshToken,
    process.env.JWT_REFRESH_SECRET
  );

  if (decoded.type !== "refresh") {
    throw new Error("INVALID_TOKEN_TYPE");
  }

  const newAccessToken = generateToken(user);
  const newRefreshToken = generateRefreshToken(user);

  const tokenTTL = parseInt(process.env.JWT_EXPIRES_IN);
  const userId = user.id.toString();
  const userData = prepareUserDataForCache(user);

  await whitelistRedisService.storeWhitelistToken(userId, newAccessToken, tokenTTL, userData);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    expiresIn: tokenTTL,
  };
}

/**
 * Invalidate user's token (logout)
 * 
 * @param {string} userId - User ID
 * @returns {boolean} Whether token was removed
 */
export async function invalidateToken(userId) {
  const removed = await whitelistRedisService.removeWhitelistToken(userId);
  
  if (removed) {
    console.log(`Token removed from whitelist for user ${userId}`);
  } else {
    console.warn(`Failed to remove token from whitelist for user ${userId}`);
  }
  
  return removed;
}

/**
 * Reset token TTL to full duration
 * Keeps very active users logged in
 * 
 * @param {string} userId - User ID
 * @returns {Object} { success, newExpiryInSeconds }
 */
export async function resetTokenTTL(userId) {
  const fullTTL = parseInt(process.env.JWT_EXPIRES_IN || "900");
  const currentTTL = await whitelistRedisService.getWhitelistTokenTTL(userId);

  if (currentTTL <= 0) {
    throw new Error("TOKEN_EXPIRED");
  }

  const reset = await whitelistRedisService.resetWhitelistTokenTTL(userId, fullTTL);

  if (!reset) {
    throw new Error("TTL_RESET_FAILED");
  }

  return {
    success: true,
    newExpiryInSeconds: fullTTL,
  };
}
