import express from "express";
import {
  createCoverLetter,
  getAllCoverLetters,
  getCoverLetterById,
  updateCoverLetter,
  deleteCoverLetter,
  setDefaultCoverLetter,
} from "../controllers/coverLetterController.js";
import { checkJwt } from "../middleware/checkJwt.js";

const router = express.Router();

// All routes require authentication
router.use(checkJwt);

// Create a new cover letter
router.post("/", createCoverLetter);

// Get all cover letters
router.get("/", getAllCoverLetters);

// Get a single cover letter by ID
router.get("/:id", getCoverLetterById);

// Update a cover letter
router.put("/:id", updateCoverLetter);

// Delete a cover letter
router.delete("/:id", deleteCoverLetter);

// Set a cover letter as default
router.patch("/:id/default", setDefaultCoverLetter);

export default router;
