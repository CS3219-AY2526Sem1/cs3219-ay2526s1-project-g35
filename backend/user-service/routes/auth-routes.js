import express from "express";

import {
  handleLogin,
  handleVerifyToken,
  handleRefreshToken,
  handleLogout,
  handleResetTokenTTL,
} from "../controller/auth-controller.js";
import { verifyToken } from "../middleware/jwtAuth.js";

const router = express.Router();

// Login endpoint
router.post("/login", handleLogin);

// Token verification endpoint
router.get("/verify-token", verifyToken, handleVerifyToken);

// Refresh token endpoint
router.post("/refresh", handleRefreshToken);

// Logout endpoint
router.post("/logout", verifyToken, handleLogout);

// Reset token TTL to full duration (activity-based refresh)
router.post("/reset-ttl", verifyToken, handleResetTokenTTL);

export default router;
