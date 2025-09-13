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

    // Update lastLogin timestamp and ensure tokenVersion is set
    const updatedUser = await UserRepository.updateById(user.id, {
      lastLogin: new Date(),
      tokenVersion: user.tokenVersion || 0
    });

    // Generate tokens (use updated user data)
    const accessToken = generateToken(updatedUser);
    const refreshToken = generateRefreshToken(updatedUser);

    // Set httpOnly cookie for refresh token (more secure)
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return res.status(200).json({ 
      message: "User logged in successfully", 
      data: { 
        accessToken, 
        user: formatUserResponse(updatedUser),
        // Optional: also return refresh token in response for non-cookie implementations
        refreshToken: process.env.INCLUDE_REFRESH_IN_RESPONSE === 'true' ? refreshToken : undefined
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
    // Get refresh token from cookie or request body
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({ 
        message: "Refresh token not provided",
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
      return res.status(401).json({ 
        message: "User not found",
        error: "USER_NOT_FOUND" 
      });
    }

    // Increment token version to invalidate all existing access tokens
    const updatedUser = await UserRepository.updateById(user.id, {
      tokenVersion: (user.tokenVersion || 0) + 1
    });

    // Generate new access token with updated version
    const newAccessToken = generateToken(updatedUser);
    
    return res.status(200).json({
      message: "Token refreshed successfully",
      data: {
        accessToken: newAccessToken,
        user: formatUserResponse(updatedUser)
      }
    });
  } catch (err) {
    console.error("Refresh token error:", err);
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: "Refresh token expired",
        error: "REFRESH_TOKEN_EXPIRED" 
      });
    }
    
    return res.status(401).json({ 
      message: "Invalid refresh token",
      error: "INVALID_REFRESH_TOKEN" 
    });
  }
}

export async function handleLogout(req, res) {
  try {
    // Clear refresh token cookie
    res.clearCookie('refreshToken');
    
    // Invalidate all access tokens by incrementing token version
    if (req.user && req.user.id) {
      await UserRepository.updateById(req.user.id, {
        tokenVersion: (req.user.tokenVersion || 0) + 1
      });
    }
    
    return res.status(200).json({ 
      message: "Logged out successfully" 
    });
  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).json({ 
      message: "Internal server error",
      error: "SERVER_ERROR" 
    });
  }
}
