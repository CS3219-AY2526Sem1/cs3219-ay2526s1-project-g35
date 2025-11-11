import express from 'express';

import {
  createUser,
  deleteSelf,
  deleteUser,
  getUser,
  getUserIdByUsername,
  getUserProfile,
  listUsers,
  updateUser,
  updateUserPrivilege,
  uploadAvatar,
} from '../controller/user-controller.js';
import { isAdmin, verifyToken } from '../middleware/jwtAuth.js';
import upload from '../middleware/upload.js';
import {
  normalizeEmail,
  normalizeUsername,
  validateCreateUser,
  validateUpdatePrivilege,
  validateUpdateUser,
  validateUserIdParam,
} from '../middleware/validation.js';

const router = express.Router();

// Create new user
router.post('/', normalizeEmail, normalizeUsername, validateCreateUser, createUser);

// Get userId by username (public endpoint - no auth required)
router.get('/username/:username', getUserIdByUsername);

// Get current user's profile (authenticated users)
router.get('/profile', verifyToken, getUserProfile);

// Admin: list users with pagination
router.get('/', verifyToken, isAdmin, listUsers);

// Get specific user (authenticated users & only access own data)
router.get('/:id', validateUserIdParam, verifyToken, getUser);

// Update user (authenticated users only)
router.patch(
  '/:id',
  validateUserIdParam,
  verifyToken,
  normalizeEmail,
  normalizeUsername,
  validateUpdateUser,
  updateUser,
);

// Update user privilege (admin only)
router.patch(
  '/:id/privilege',
  validateUserIdParam,
  verifyToken,
  isAdmin,
  validateUpdatePrivilege,
  updateUserPrivilege,
);

// Upload avatar (authenticated users)
router.post('/avatar', verifyToken, upload.single('avatar'), uploadAvatar);

// Delete account (authenticated users)
router.delete('/me', verifyToken, deleteSelf);

// Delete user (admin only)
router.delete('/:id', validateUserIdParam, verifyToken, isAdmin, deleteUser);

export default router;
