import express from "express";

import { handleLogin, handleVerifyToken, handleRefreshToken, handleLogout } from "../controller/auth-controller.js";
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

export default router;
