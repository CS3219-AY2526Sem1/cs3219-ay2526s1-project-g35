import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { UserRepository } from "../model/user-repository.js";
import { formatUserResponse } from "./user-controller.js";
import { generateToken, generateRefreshToken } from "../middleware/jwtAuth.js";
import { redisService } from "../services/redis-service.js";


function secondsToMs(seconds) {
  return parseInt(seconds) * 1000;
}

export async function handleLogin(req, res) {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ 
      message: "Missing email and/or password",
      error: "MISSING_CREDENTIALS" 
    });
  }

  try {
    const user = await UserRepository.findByEmail(email.toLowerCase());
    if (!user) {
      return res.status(401).json({ 
        message: "Invalid email or password",
        error: "INVALID_CREDENTIALS" 
      });
    }

    const match = await argon2.verify(user.password, password);
    if (!match) {
      return res.status(401).json({ 
        message: "Invalid email or password",
        error: "INVALID_CREDENTIALS" 
      });
    }

    // Update lastLogin timestamp
    const updatedUser = await UserRepository.updateById(user.id, {
      lastLogin: new Date()
    });

    // Generate tokens
    const accessToken = generateToken(updatedUser || user);
    const refreshToken = generateRefreshToken(updatedUser || user);

    // Set httpOnly cookie for refresh token 
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,                               
      secure: process.env.COOKIE_SECURE === 'true',     
      sameSite: process.env.COOKIE_SAME_SITE || 'lax', 
      maxAge: secondsToMs(process.env.JWT_REFRESH_EXPIRES_IN || 604800),
      path: '/',                                        // Available for all paths
      domain: process.env.COOKIE_DOMAIN                 
    });

    // ONLY return access token in response (SECURE)
    return res.status(200).json({ 
      message: "User logged in successfully", 
      data: { 
        accessToken,
        expiresIn: parseInt(process.env.JWT_EXPIRES_IN || 900),
        user: formatUserResponse(updatedUser || user)
      } 
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ 
      message: "Internal server error",
      error: "SERVER_ERROR" 
    });
  }
}

export async function handleVerifyToken(req, res) {
  try {
    const verifiedUser = req.user;
    return res.status(200).json({ 
      message: "Token verified successfully", 
      data: verifiedUser 
    });
  } catch (err) {
    console.error("Token verification error:", err);
    return res.status(500).json({ 
      message: "Internal server error",
      error: "SERVER_ERROR" 
    });
  }
}

export async function handleRefreshToken(req, res) {
  try {

    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({ 
        message: "Refresh token not provided. Please login again.",
        error: "MISSING_REFRESH_TOKEN" 
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ 
        message: "Invalid token type",
        error: "INVALID_TOKEN_TYPE" 
      });
    }

    // Get user from database
    const user = await UserRepository.findById(decoded.id);
    if (!user) {
      res.clearCookie('refreshToken', { path: '/auth' });
      return res.status(401).json({ 
        message: "User not found. Please login again.",
        error: "USER_NOT_FOUND" 
      });
    }

    const newAccessToken = generateToken(user);
    
    const newRefreshToken = generateRefreshToken(user);
    
    // Update refresh token cookie with new token
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: process.env.COOKIE_SAME_SITE || 'lax',
      maxAge: secondsToMs(process.env.JWT_REFRESH_EXPIRES_IN || 604800),
      path: '/',
      domain: process.env.COOKIE_DOMAIN
    });
    
    return res.status(200).json({
      message: "Token refreshed successfully",
      data: {
        accessToken: newAccessToken,
        expiresIn: parseInt(process.env.JWT_EXPIRES_IN || 900),
        user: formatUserResponse(user)
      }
    });
  } catch (err) {
    console.error("Refresh token error:", err);
    
    res.clearCookie('refreshToken', { path: '/auth' });
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: "Refresh token expired. Please login again.",
        error: "REFRESH_TOKEN_EXPIRED" 
      });
    }
    
    return res.status(401).json({ 
      message: "Invalid refresh token. Please login again.",
      error: "INVALID_REFRESH_TOKEN" 
    });
  }
}

export async function handleLogout(req, res) {
  try {
    // Get access token from Authorization header to blacklist it
    const authHeader = req.headers["authorization"];
    let accessToken = null;
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      accessToken = authHeader.split(" ")[1];
    }

    if (accessToken) {
      try {
        const decoded = jwt.decode(accessToken);
        const currentTime = Math.floor(Date.now() / 1000);
        const expiryTime = decoded?.exp || currentTime + 900; // Default 15 min (900 seconds)
        const ttlSeconds = Math.max(expiryTime - currentTime, 60); // At least 1 minute
        
        const blacklisted = await redisService.blacklistToken(accessToken, ttlSeconds);
        if (blacklisted) {
          console.log('Access token blacklisted successfully');
        } else {
          console.warn('Failed to blacklist access token - Redis may not be available');
        }
      } catch (tokenError) {
        console.error('Error processing access token for blacklisting:', tokenError);
      }
    }

    // Clear refresh token cookie with correct path and domain settings
    res.clearCookie('refreshToken', { 
      path: '/',
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: process.env.COOKIE_SAME_SITE || 'lax',
      domain: process.env.COOKIE_DOMAIN
    });
    
    return res.status(200).json({ 
      message: "Logged out successfully",
      data: {
        message: "Access token invalidated. You have been logged out securely."
      }
    });
  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).json({ 
      message: "Internal server error",
      error: "SERVER_ERROR" 
    });
  }
}
