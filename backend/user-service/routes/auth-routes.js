import express from 'express';

import {
  handleCheckVerificationStatus,
  handleLogin,
  handleLogout,
  handleRefreshToken,
  handleResetTokenTTL,
  handleSendVerificationOTP,
  handleVerifyOTP,
  handleVerifyToken,
} from '../controller/auth-controller.js';
import { createUser } from '../controller/user-controller.js';
import { verifyToken } from '../middleware/jwtAuth.js';
import {
  normalizeEmail,
  normalizeUsername,
  userSchemas,
  validate,
  validateCreateUser,
} from '../middleware/validation.js';

const router = express.Router();

router.post('/register', normalizeEmail, normalizeUsername, validateCreateUser, createUser);

// Login endpoint
router.post('/login', normalizeEmail, validate(userSchemas.login), handleLogin);

// Token verification endpoint
router.get('/verify-token', verifyToken, handleVerifyToken);

// Refresh token endpoint
router.post('/refresh', handleRefreshToken);

// Logout endpoint
router.post('/logout', verifyToken, handleLogout);

// Reset token TTL to full duration
router.post('/reset-ttl', verifyToken, handleResetTokenTTL);

// Email verification endpoints (for new user registration)
router.post('/send-otp', verifyToken, handleSendVerificationOTP);
router.post('/verify-otp', verifyToken, validate(userSchemas.verifyOTPOnly), handleVerifyOTP);
router.get('/verification-status', verifyToken, handleCheckVerificationStatus);

export default router;
