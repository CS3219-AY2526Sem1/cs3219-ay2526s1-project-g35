import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { UserRepository } from "../model/user-repository.js";
import { formatUserResponse } from "./user-controller.js";
import { generateToken, generateRefreshToken } from "../middleware/jwtAuth.js";

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
      httpOnly: true,                                    // Cannot be accessed by JavaScript
      secure: process.env.COOKIE_SECURE === 'true',     // Use environment setting
      sameSite: process.env.COOKIE_SAME_SITE || 'lax',  // Use environment setting
      maxAge: 7 * 24 * 60 * 60 * 1000,                 // 7 days
      path: '/',                                        // Available for all paths
      domain: process.env.COOKIE_DOMAIN                 // Use environment domain
    });

    // ONLY return access token in response (SECURE)
    return res.status(200).json({ 
      message: "User logged in successfully", 
      data: { 
        accessToken,
        user: formatUserResponse(updatedUser || user)
        // NOTE: No refresh token in response for security
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
    // Get refresh token ONLY from httpOnly cookie (SECURE)
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

    // Get user from database (refresh token only contains id)
    const user = await UserRepository.findById(decoded.id);
    if (!user) {
      // Clear invalid refresh token cookie
      res.clearCookie('refreshToken', { path: '/auth' });
      return res.status(401).json({ 
        message: "User not found. Please login again.",
        error: "USER_NOT_FOUND" 
      });
    }

    // Generate new access token (same user, no version increment needed)
    const newAccessToken = generateToken(user);
    
    // Optional: Generate new refresh token for rotation (more secure)
    const newRefreshToken = generateRefreshToken(user);
    
    // Update refresh token cookie with new token (TOKEN ROTATION)
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: process.env.COOKIE_SAME_SITE || 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
      domain: process.env.COOKIE_DOMAIN
    });
    
    return res.status(200).json({
      message: "Token refreshed successfully",
      data: {
        accessToken: newAccessToken,
        expiresIn: 15 * 60, // 15 minutes in seconds
        user: formatUserResponse(user)
      }
    });
  } catch (err) {
    console.error("Refresh token error:", err);
    
    // Clear potentially invalid refresh token cookie
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
    // Clear refresh token cookie (SECURE logout)
    res.clearCookie('refreshToken', { 
      path: '/auth',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    return res.status(200).json({ 
      message: "Logged out successfully",
      data: {
        message: "Please discard your access token on the client side"
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
