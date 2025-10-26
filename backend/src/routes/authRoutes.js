import express from "express";
import { register, login, logout } from "../controllers/authController.js";
import { checkJwt } from "../middleware/checkJwt.js";

const router = express.Router();

// POST /api/auth/register - Create new user account (requires Auth0 token)
router.post("/register", checkJwt, register);

// POST /api/auth/login - Authenticate user
router.post("/login", checkJwt, login);

// POST /api/auth/logout - End user session
router.post("/logout", checkJwt, logout);

export default router;
