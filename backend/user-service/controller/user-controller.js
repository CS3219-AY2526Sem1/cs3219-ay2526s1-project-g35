import argon2 from "argon2";
import { isValidObjectId } from "mongoose";
import { UserRepository } from "../model/user-repository.js";

export async function createUser(req, res) {
  try {
    const { username, email, password, profile } = req.body;
    
    // Check if user already exists
    const existingUser = await _findUserByUsernameOrEmail(username, email);
    if (existingUser) {
      const conflict = existingUser.username === username ? "username" : "email";
      return res.status(409).json({ 
        message: `User with this ${conflict} already exists`,
        error: "USER_EXISTS",
        field: conflict
      });
    }

    // Hash password with Argon2id
    const hashedPassword = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: parseInt(process.env.ARGON2_MEMORY_COST) || 65536, // 64 MB
      timeCost: parseInt(process.env.ARGON2_TIME_COST) || 3,
      parallelism: parseInt(process.env.ARGON2_PARALLELISM) || 4,
      hashLength: parseInt(process.env.ARGON2_HASH_LENGTH) || 32,
      saltLength: parseInt(process.env.ARGON2_SALT_LENGTH) || 16
    });
    
    // Create user data object
    const userData = {
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      profile: profile || {}
    };

    const createdUser = await _createUser(userData.username, userData.email, userData.password);
    
    return res.status(201).json({
      message: `User ${username} created successfully`,
      data: formatUserResponse(createdUser),
    });
  } catch (err) {
    console.error("Create user error:", err);
    
    // Handle specific MongoDB errors
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(409).json({ 
        message: `User with this ${field} already exists`,
        error: "DUPLICATE_KEY",
        field 
      });
    }
    
    return res.status(500).json({ 
      message: "Failed to create user",
      error: "SERVER_ERROR" 
    });
  }
}

export async function getUser(req, res) {
  try {
    const userId = req.params.id;
    
    const user = await _findUserById(userId);
    if (!user) {
      return res.status(404).json({ 
        message: `User not found`,
        error: "USER_NOT_FOUND" 
      });
    }
    
    return res.status(200).json({ 
      message: "User found", 
      data: formatUserResponse(user) 
    });
  } catch (err) {
    console.error("Get user error:", err);
    return res.status(500).json({ 
      message: "Failed to retrieve user",
      error: "SERVER_ERROR" 
    });
  }
}

export async function updateUser(req, res) {
  try {
    const userId = req.params.id;
    const { username, email, password, profile, preferences } = req.body;
    
    const user = await _findUserById(userId);
    if (!user) {
      return res.status(404).json({ 
        message: "User not found",
        error: "USER_NOT_FOUND" 
      });
    }

    // Check for conflicts if updating username or email
    if (username && username !== user.username) {
      const existingUser = await _findUserByUsername(username);
      if (existingUser && existingUser.id !== userId) {
        return res.status(409).json({ 
          message: "Username already exists",
          error: "USERNAME_EXISTS" 
        });
      }
    }
    
    if (email && email !== user.email) {
      const existingUser = await _findUserByEmail(email);
      if (existingUser && existingUser.id !== userId) {
        return res.status(409).json({ 
          message: "Email already exists",
          error: "EMAIL_EXISTS" 
        });
      }
    }

    // Prepare update data
    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email.toLowerCase();
    if (profile) updateData.profile = { ...user.profile, ...profile };
    if (preferences) updateData.preferences = { ...user.preferences, ...preferences };

    // Handle password update separately for security
    let updatedUser;
    if (password) {
      const hashedPassword = await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: parseInt(process.env.ARGON2_MEMORY_COST) || 65536,
        timeCost: parseInt(process.env.ARGON2_TIME_COST) || 3,
        parallelism: parseInt(process.env.ARGON2_PARALLELISM) || 4,
        hashLength: parseInt(process.env.ARGON2_HASH_LENGTH) || 32,
        saltLength: parseInt(process.env.ARGON2_SALT_LENGTH) || 16
      });
      updatedUser = await UserRepository.updatePassword(userId, hashedPassword);
      
      // Update other fields if any
      if (Object.keys(updateData).length > 0) {
        updatedUser = await UserRepository.updateById(userId, updateData);
      }
    } else {
      updatedUser = await UserRepository.updateById(userId, updateData);
    }

    return res.status(200).json({
      message: "User updated successfully",
      data: formatUserResponse(updatedUser),
    });
  } catch (err) {
    console.error("Update user error:", err);
    return res.status(500).json({ 
      message: "Failed to update user",
      error: "SERVER_ERROR" 
    });
  }
}

export async function updateUserPrivilege(req, res) {
  try {
    const userId = req.params.id;
    const { isAdmin } = req.body;
    
    const user = await _findUserById(userId);
    if (!user) {
      return res.status(404).json({ 
        message: "User not found",
        error: "USER_NOT_FOUND" 
      });
    }

    const updatedUser = await UserRepository.updatePrivilege(userId, isAdmin);
    
    return res.status(200).json({
      message: `User privilege ${isAdmin ? 'granted' : 'revoked'} successfully`,
      data: formatUserResponse(updatedUser),
    });
  } catch (err) {
    console.error("Update user privilege error:", err);
    return res.status(500).json({ 
      message: "Failed to update user privilege",
      error: "SERVER_ERROR" 
    });
  }
}

export async function deleteUser(req, res) {
  try {
    const userId = req.params.id;
    
    const user = await _findUserById(userId);
    if (!user) {
      return res.status(404).json({ 
        message: "User not found",
        error: "USER_NOT_FOUND" 
      });
    }

    // Use soft delete in production, hard delete in development
    if (process.env.NODE_ENV === 'production') {
      await UserRepository.softDelete(userId);
      return res.status(200).json({ 
        message: "User deactivated successfully" 
      });
    } else {
      await _deleteUserById(userId);
      return res.status(200).json({ 
        message: "User deleted successfully" 
      });
    }
  } catch (err) {
    console.error("Delete user error:", err);
    return res.status(500).json({ 
      message: "Failed to delete user",
      error: "SERVER_ERROR" 
    });
  }
}

export function formatUserResponse(user) {
  if (!user) return null;
  
  return {
    id: user.id || user._id,
    username: user.username,
    email: user.email,
    isAdmin: user.isAdmin,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLogin: user.lastLogin,
    profile: {
      firstName: user.profile?.firstName,
      lastName: user.profile?.lastName,
      fullName: user.profile?.fullName || user.username,
      bio: user.profile?.bio,
      avatar: user.profile?.avatar,
    }
  };
}

// Helper functions for database operations
async function _findUserByUsernameOrEmail(username, email) {
  return await UserRepository.findByUsernameOrEmail(username, email);
}

async function _findUserById(userId) {
  return await UserRepository.findById(userId);
}

async function _findUserByUsername(username) {
  return await UserRepository.findByUsername(username);
}

async function _findUserByEmail(email) {
  return await UserRepository.findByEmail(email);
}

async function _createUser(username, email, hashedPassword) {
  return await UserRepository.createUser({
    username,
    email,
    password: hashedPassword
  });
}

async function _deleteUserById(userId) {
  return await UserRepository.deleteById(userId);
}
