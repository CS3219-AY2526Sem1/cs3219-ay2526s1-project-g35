import argon2 from 'argon2';
import { isValidObjectId } from 'mongoose';
import { UserRepository } from '../model/user-repository.js';
import { USER_ERRORS, sendUserErrorResponse, sendErrorResponse } from '../errors/index.js';
import * as tokenService from '../services/token-service.js';
import { setAuthCookies } from '../utils/cookie-helper.js';

export async function createUser(req, res) {
  try {
    const { username, email, password, profile } = req.body;
    const existingUser = await _findUserByUsernameOrEmail(username, email);
    if (existingUser) {
      const conflict = existingUser.username === username ? 'username' : 'email';
      return sendUserErrorResponse(res, USER_ERRORS.USER_EXISTS, conflict, {
        field: conflict,
      });
    }
    const hashedPassword = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: parseInt(process.env.ARGON2_MEMORY_COST),
      timeCost: parseInt(process.env.ARGON2_TIME_COST),
      parallelism: parseInt(process.env.ARGON2_PARALLELISM),
      hashLength: parseInt(process.env.ARGON2_HASH_LENGTH),
      saltLength: parseInt(process.env.ARGON2_SALT_LENGTH),
    });

    const userData = {
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      profile: profile || {},
    };

    const createdUser = await _createUser(userData.username, userData.email, userData.password);

    // Automatically log the user in by creating tokens
    const tokens = await tokenService.createAndStoreTokenPair(createdUser);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    return res.status(201).json({
      message: `User ${username} created successfully. Please verify your email address.`,
      data: {
        expiresIn: tokens.expiresIn,
        tokenReused: tokens.wasReused,
        user: formatUserResponse(createdUser),
      },
    });
  } catch (err) {
    console.error('Create user error:', err);

    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return sendUserErrorResponse(res, USER_ERRORS.DUPLICATE_KEY, field, {
        field,
      });
    }

    return sendUserErrorResponse(res, USER_ERRORS.SERVER_ERROR);
  }
}

export async function getUserProfile(req, res) {
  try {
    const userId = req.userId;

    const user = await _findUserById(userId);
    if (!user) {
      return sendErrorResponse(res, USER_ERRORS.USER_NOT_FOUND);
    }

    return res.status(200).json({
      message: 'Profile retrieved successfully',
      data: formatUserResponse(user),
    });
  } catch (err) {
    console.error('Error in getUserProfile:', err);
    return sendErrorResponse(res, USER_ERRORS.INTERNAL_SERVER_ERROR);
  }
}

export async function getUserIdByUsername(req, res) {
  try {
    const { username } = req.params;

    if (!username) {
      return sendErrorResponse(res, USER_ERRORS.MISSING_USERNAME);
    }

    const user = await _findUserByUsername(username);
    if (!user) {
      return sendErrorResponse(res, USER_ERRORS.USER_NOT_FOUND);
    }

    return res.status(200).json({
      message: 'User ID retrieved successfully',
      data: {
        id: user.id || user._id,
        username: user.username,
      },
    });
  } catch (err) {
    console.error('Get userId by username error:', err);
    return sendErrorResponse(res, USER_ERRORS.INTERNAL_SERVER_ERROR);
  }
}

export async function getUser(req, res) {
  try {
    const userId = req.params.id;
    const tokenUserId = req.userId;
    if (userId !== tokenUserId) {
      return sendErrorResponse(res, USER_ERRORS.UNAUTHORIZED_ACCESS);
    }

    const user = await _findUserById(userId);
    if (!user) {
      return sendErrorResponse(res, USER_ERRORS.USER_NOT_FOUND);
    }

    return res.status(200).json({
      message: 'User found',
      data: formatUserResponse(user),
    });
  } catch (err) {
    console.error('Get user error:', err);
    return sendErrorResponse(res, USER_ERRORS.RETRIEVE_SERVER_ERROR);
  }
}

export async function updateUser(req, res) {
  try {
    const userId = req.params.id;
    const { username, email, password, profile, preferences } = req.body;

    const user = await _findUserById(userId);
    if (!user) {
      return sendErrorResponse(res, USER_ERRORS.USER_NOT_FOUND);
    }
    if (username && username !== user.username) {
      const existingUser = await _findUserByUsername(username);
      if (existingUser && existingUser.id !== userId) {
        return sendErrorResponse(res, USER_ERRORS.USERNAME_EXISTS);
      }
    }

    if (email && email !== user.email) {
      const existingUser = await _findUserByEmail(email);
      if (existingUser && existingUser.id !== userId) {
        return sendErrorResponse(res, USER_ERRORS.EMAIL_EXISTS);
      }
    }
    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email.toLowerCase();
    if (profile) {
      // Convert Mongoose subdocument to plain object and merge
      const existingProfile = user.profile ? user.profile.toObject() : {};
      updateData.profile = { ...existingProfile, ...profile };
    }
    if (preferences) updateData.preferences = { ...user.preferences, ...preferences };

    let updatedUser;
    if (password) {
      const hashedPassword = await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: parseInt(process.env.ARGON2_MEMORY_COST),
        timeCost: parseInt(process.env.ARGON2_TIME_COST),
        parallelism: parseInt(process.env.ARGON2_PARALLELISM),
        hashLength: parseInt(process.env.ARGON2_HASH_LENGTH),
        saltLength: parseInt(process.env.ARGON2_SALT_LENGTH),
      });
      updatedUser = await UserRepository.updatePassword(userId, hashedPassword);
      if (Object.keys(updateData).length > 0) {
        updatedUser = await UserRepository.updateById(userId, updateData);
      }
    } else {
      updatedUser = await UserRepository.updateById(userId, updateData);
    }

    return res.status(200).json({
      message: 'User updated successfully',
      data: formatUserResponse(updatedUser),
    });
  } catch (err) {
    console.error('Update user error:', err);
    return sendErrorResponse(res, USER_ERRORS.UPDATE_SERVER_ERROR);
  }
}

export async function updateUserPrivilege(req, res) {
  try {
    const userId = req.params.id;
    const { isAdmin } = req.body;

    const user = await _findUserById(userId);
    if (!user) {
      return sendErrorResponse(res, USER_ERRORS.USER_NOT_FOUND);
    }

    const updatedUser = await UserRepository.updatePrivilege(userId, isAdmin);

    return res.status(200).json({
      message: `User privilege ${isAdmin ? 'granted' : 'revoked'} successfully`,
      data: formatUserResponse(updatedUser),
    });
  } catch (err) {
    console.error('Update user privilege error:', err);
    return sendErrorResponse(res, USER_ERRORS.PRIVILEGE_SERVER_ERROR);
  }
}

export async function deleteUser(req, res) {
  try {
    const userId = req.params.id;

    const user = await _findUserById(userId);
    if (!user) {
      return sendErrorResponse(res, USER_ERRORS.USER_NOT_FOUND);
    }
    if (process.env.NODE_ENV === 'production') {
      await UserRepository.softDelete(userId);
      return res.status(200).json({
        message: 'User deactivated successfully',
      });
    } else {
      await _deleteUserById(userId);
      return res.status(200).json({
        message: 'User deleted successfully',
      });
    }
  } catch (err) {
    console.error('Delete user error:', err);
    return sendErrorResponse(res, USER_ERRORS.DELETE_SERVER_ERROR);
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
    isVerified: user.isVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLogin: user.lastLogin,
    profile: {
      firstName: user.profile?.firstName || '',
      lastName: user.profile?.lastName || '',
      fullName: user.profile?.fullName || user.username,
      bio: user.profile?.bio || '',
      avatar: user.profile?.avatar || null,
    },
  };
}

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
    password: hashedPassword,
  });
}

async function _deleteUserById(userId) {
  return await UserRepository.deleteById(userId);
}
