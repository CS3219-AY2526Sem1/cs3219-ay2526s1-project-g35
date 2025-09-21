import jwt from "jsonwebtoken";
import { UserRepository } from "../model/user-repository.js";
import { redisService } from "../services/redis-service.js";
import { AUTH_ERRORS, sendErrorResponse } from "../errors/index.js";

/**
 * Middleware to verify JWT token and extract user information
 */
export const verifyToken = (req, res, next) => {
  const token = req.cookies.accessToken;

  if (!token) {
    return sendErrorResponse(res, AUTH_ERRORS.MISSING_TOKEN);
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      res.clearCookie("accessToken", {
        path: "/",
        httpOnly: true,
        secure: process.env.COOKIE_SECURE === "true",
        sameSite: process.env.COOKIE_SAME_SITE,
        domain: process.env.COOKIE_DOMAIN,
      });

      let errorToReturn = AUTH_ERRORS.INVALID_TOKEN;

      if (err.name === "TokenExpiredError") {
        errorToReturn = AUTH_ERRORS.TOKEN_EXPIRED;
      } else if (err.name === "JsonWebTokenError") {
        errorToReturn = AUTH_ERRORS.INVALID_SIGNATURE;
      }

      return sendErrorResponse(res, errorToReturn);
    }

    try {
      const isWhitelisted = await redisService.isTokenWhitelisted(
        decoded.id,
        token
      );
      if (!isWhitelisted) {
        res.clearCookie("accessToken", {
          path: "/",
          httpOnly: true,
          secure: process.env.COOKIE_SECURE === "true",
          sameSite: process.env.COOKIE_SAME_SITE || "lax",
          domain: process.env.COOKIE_DOMAIN,
        });

        return sendErrorResponse(res, AUTH_ERRORS.TOKEN_NOT_WHITELISTED);
      }

      const user = await UserRepository.findById(decoded.id);

      if (!user) {
        await redisService.removeWhitelistToken(decoded.id);
        return sendErrorResponse(res, AUTH_ERRORS.USER_NOT_FOUND);
      }

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
      return sendErrorResponse(res, AUTH_ERRORS.DATABASE_ERROR);
    }
  });
};

/**
 * Middleware to check if user is admin
 */
export const isAdmin = (req, res, next) => {
  if (!req.user) {
    return sendErrorResponse(res, AUTH_ERRORS.NOT_AUTHENTICATED);
  }

  if (!req.user.isAdmin) {
    return sendErrorResponse(res, AUTH_ERRORS.NOT_ADMIN);
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
      sessionId: sessionId || Date.now().toString(),
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
 * Generate refresh token
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
