import express from "express";
import { getCurrentUser, updateCurrentUser, uploadProfilePicture, deleteProfilePicture, upload, deleteAccount, addEmployment, updateEmployment, deleteEmployment } from "../controllers/userController.js";
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

// DELETE /api/users/delete - Permanently delete account (immediate deletion)
router.delete("/delete", checkJwt, deleteAccount);

// POST /api/users/employment - Add employment entry
router.post("/employment", checkJwt, addEmployment);

// PUT /api/users/employment/:employmentId - Update employment entry
router.put("/employment/:employmentId", checkJwt, updateEmployment);

// DELETE /api/users/employment/:employmentId - Delete employment entry
router.delete("/employment/:employmentId", checkJwt, deleteEmployment);

// Note: education endpoints are defined in profileRoutes and mounted under /api/profile and /api/users

export default router;
