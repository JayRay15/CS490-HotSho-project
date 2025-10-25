import express from "express";
import { getCurrentUser, updateCurrentUser } from "../controllers/userController.js";
import { checkJwt } from "../middleware/checkJwt.js";

const router = express.Router();

// GET /api/users/me - Get current user profile
router.get("/me", checkJwt, getCurrentUser);

// PUT /api/users/me - Update current user profile
router.put("/me", checkJwt, updateCurrentUser);

export default router;
