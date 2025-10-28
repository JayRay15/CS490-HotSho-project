import express from "express";
import { getCurrentUser, updateCurrentUser, uploadProfilePicture, deleteProfilePicture, upload, deleteAccount } from "../controllers/userController.js";
import { checkJwt } from "../middleware/checkJwt.js";

const router = express.Router();

// GET /api/users/me - Get current user profile
router.get("/me", checkJwt, getCurrentUser);

// PUT /api/users/me - Update current user profile
router.put("/me", checkJwt, updateCurrentUser);

// POST /api/users/profile-picture - Upload profile picture
router.post("/profile-picture", checkJwt, upload.single('picture'), uploadProfilePicture);

// DELETE /api/users/profile-picture - Remove profile picture
router.delete("/profile-picture", checkJwt, deleteProfilePicture);

// DELETE /api/users/delete - Soft-delete account
router.delete("/delete", checkJwt, deleteAccount);

export default router;
