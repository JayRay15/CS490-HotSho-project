import express from "express";
import { register, login, logout, forgotPassword } from "../controllers/authController.js";
import { checkJwt } from "../middleware/checkJwt.js";

const router = express.Router();

// POST /api/auth/register - Create new user (protected)
router.post("/register", checkJwt, register);

// POST /api/auth/login - Authenticate user (protected)
router.post("/login", checkJwt, login);

// POST /api/auth/logout - End user session (protected)
router.post("/logout", checkJwt, logout);

// POST /api/auth/forgot-password - Password reset request (public, for tracking only)
router.post("/forgot-password", forgotPassword);

export default router;
