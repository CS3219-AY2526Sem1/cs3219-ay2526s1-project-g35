import jwt from "jsonwebtoken";
import { UserRepository } from "../model/user-repository.js";
import { redisService } from "../services/redis-service.js";

/**
 * Middleware to verify JWT token and extract user information
 */
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({
      message: "No token provided",
      error: "MISSING_TOKEN",
    });
  }

  // Extract token from "Bearer <token>" format
  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Invalid token format",
      error: "INVALID_TOKEN_FORMAT",
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      let message = "Invalid token";
      let error = "INVALID_TOKEN";

      if (err.name === "TokenExpiredError") {
        message = "Token has expired";
        error = "TOKEN_EXPIRED";
      } else if (err.name === "JsonWebTokenError") {
        message = "Invalid token signature";
        error = "INVALID_SIGNATURE";
      }

      return res.status(401).json({ message, error });
    }

    try {
      // Check if token is blacklisted (logout protection)
      const isBlacklisted = await redisService.isTokenBlacklisted(token);
      if (isBlacklisted) {
        return res.status(401).json({
          message: "Token has been invalidated. Please login again.",
          error: "TOKEN_BLACKLISTED",
        });
      }

      // Fetch the latest user data from database
      const user = await UserRepository.findById(decoded.id);

      if (!user) {
        return res.status(401).json({
          message: "User not found",
          error: "USER_NOT_FOUND",
        });
      }

      // Set user information in request object
      req.userId = user.id;
      req.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      };

      next();
    } catch (dbError) {
      console.error("Database error in token verification:", dbError);
      return res.status(500).json({
        message: "Internal server error",
        error: "DATABASE_ERROR",
      });
    }
  });
};

/**
 * Middleware to check if user is admin
 */
export const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Authentication required",
      error: "NOT_AUTHENTICATED",
    });
  }

  if (!req.user.isAdmin) {
    return res.status(403).json({
      message: "Admin access required",
      error: "NOT_ADMIN",
    });
  }

  next();
};

/**
 * Generate JWT token for user
 */
export const generateToken = (user, sessionId = null) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
      isVerified: user.isVerified,
      sessionId: sessionId || Date.now().toString(), // Unique per login
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN
        ? `${process.env.JWT_EXPIRES_IN}s`
        : "15m",
    }
  );
};

/**
 * Generate refresh token (longer expiry)
 */
export const generateRefreshToken = user => {
  return jwt.sign(
    {
      id: user.id,
      type: "refresh",
    },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN
        ? `${process.env.JWT_REFRESH_EXPIRES_IN}s`
        : "7d",
    }
  );
};
