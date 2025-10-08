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

// Create new user
router.post(
  "/",
  normalizeEmail,
  normalizeUsername,
  validateCreateUser,
  createUser
);

// Get current user's profile (authenticated users)
router.get("/profile", verifyToken, getUserProfile);

// Get specific user (authenticated users & only access own data)
router.get("/:id", validateUserIdParam, verifyToken, getUser);

// Update user (authenticated users only)
router.patch( "/:id", validateUserIdParam, verifyToken, normalizeEmail, normalizeUsername, validateUpdateUser, updateUser );

// Update user privilege (admin only)
router.patch( "/:id/privilege", validateUserIdParam, verifyToken, isAdmin, validateUpdatePrivilege, updateUserPrivilege );

// Delete user (admin only)
router.delete("/:id", validateUserIdParam, verifyToken, isAdmin, deleteUser);

export default router;
