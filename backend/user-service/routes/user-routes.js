import express from "express";

import {
  createUser,
  deleteUser,
  getUser,
  getUserProfile,
  updateUser,
  updateUserPrivilege,
} from "../controller/user-controller.js";
import { verifyToken, isAdmin } from "../middleware/jwtAuth.js";
import {
  validateCreateUser,
  validateUpdateUser,
  validateUpdatePrivilege,
  validateUserIdParam,
  normalizeEmail,
  normalizeUsername,
} from "../middleware/validation.js";

const router = express.Router();

// Create new user (public endpoint for registration)
router.post("/", normalizeEmail, normalizeUsername, validateCreateUser, createUser);

// Get current user's profile (authenticated users only)
router.get("/profile", verifyToken, getUserProfile);

// Get specific user (admin only)
router.get("/:id", validateUserIdParam, verifyToken, isAdmin, getUser);

// Update user (authenticated users only)
router.patch("/:id", validateUserIdParam, verifyToken, normalizeEmail, normalizeUsername, validateUpdateUser, updateUser);

// Update user privilege (admin only)
router.patch("/:id/privilege", validateUserIdParam, verifyToken, isAdmin, validateUpdatePrivilege, updateUserPrivilege);

// Delete user (admin only)
router.delete("/:id", validateUserIdParam, verifyToken, isAdmin, deleteUser);

export default router;
