import express from "express";
import { register, login, logout, forgotPassword } from "../controllers/authController.js";
import { checkJwt } from "../middleware/checkJwt.js";
import { authRateLimiter, passwordResetLimiter } from "../middleware/securityMiddleware.js";

const router = express.Router();

// POST /api/auth/register - Create new user (protected)
// Rate limiting applied to prevent automated account creation
router.post("/register", authRateLimiter, checkJwt, register);

// POST /api/auth/login - Authenticate user (protected)
// Rate limiting applied to prevent brute force attacks
router.post("/login", authRateLimiter, checkJwt, login);

// POST /api/auth/logout - End user session (protected)
router.post("/logout", checkJwt, logout);

// POST /api/auth/forgot-password - Password reset request (public, for tracking only)
// Strict rate limiting to prevent email enumeration and abuse
router.post("/forgot-password", passwordResetLimiter, forgotPassword);

export default router;
