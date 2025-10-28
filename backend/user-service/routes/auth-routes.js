import express from 'express';

import {
  handleLogin,
  handleLogout,
  handleRefreshToken,
  handleResetTokenTTL,
  handleVerifyToken,
} from '../controller/auth-controller.js';
import {
  handleCompleteRegistration,
  handleInitiateRegistration,
  handleResendRegistrationOTP,
} from '../controller/registration-controller.js';
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

// New two-step registration endpoints
router.post(
  '/register/initiate',
  normalizeEmail,
  normalizeUsername,
  validateCreateUser,
  handleInitiateRegistration,
);
router.post(
  '/register/complete',
  normalizeEmail,
  validate(userSchemas.completeRegistration),
  handleCompleteRegistration,
);
router.post('/register/resend-otp', normalizeEmail, handleResendRegistrationOTP);

// Old registration endpoint (kept for backward compatibility)
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

export default router;
