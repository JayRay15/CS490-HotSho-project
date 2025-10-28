import express from "express";
import { getCurrentUser, updateCurrentUser, uploadProfilePicture, deleteProfilePicture, upload, addEmployment, updateEmployment, deleteEmployment } from "../controllers/userController.js";
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

// POST /api/users/employment - Add employment entry
router.post("/employment", checkJwt, addEmployment);

// PUT /api/users/employment/:employmentId - Update employment entry
router.put("/employment/:employmentId", checkJwt, updateEmployment);

// DELETE /api/users/employment/:employmentId - Delete employment entry
router.delete("/employment/:employmentId", checkJwt, deleteEmployment);

export default router;
