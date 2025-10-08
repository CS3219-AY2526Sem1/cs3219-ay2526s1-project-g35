import express from "express";

import {
  handleLogin,
  handleVerifyToken,
  handleRefreshToken,
  handleLogout,
  handleResetTokenTTL,
  handleSendVerificationOTP,
  handleVerifyOTP,
  handleCheckVerificationStatus,
} from "../controller/auth-controller.js";
import { verifyToken } from "../middleware/jwtAuth.js";
import {
  validate,
  userSchemas,
  normalizeEmail,
} from "../middleware/validation.js";

const router = express.Router();

// Login endpoint
router.post("/login", normalizeEmail, validate(userSchemas.login), handleLogin);

// Token verification endpoint
router.get("/verify-token", verifyToken, handleVerifyToken);

// Refresh token endpoint
router.post("/refresh", handleRefreshToken);

// Logout endpoint
router.post("/logout", verifyToken, handleLogout);

// Reset token TTL to full duration
router.post("/reset-ttl", verifyToken, handleResetTokenTTL);

// OTP verification endpoints
router.post("/send-otp", verifyToken, handleSendVerificationOTP);
router.post("/verify-otp", verifyToken, validate(userSchemas.verifyOTPOnly), handleVerifyOTP);
router.get("/verification-status", verifyToken, handleCheckVerificationStatus);

export default router;
