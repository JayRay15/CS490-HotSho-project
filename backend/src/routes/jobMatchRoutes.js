import express from "express";
import { checkJwt } from "../middleware/checkJwt.js";
import {
    calculateMatch,
    getJobMatch,
    getAllMatches,
    compareMatches,
    updateMatchWeights,
    getMatchHistory,
    getMatchTrends,
    exportMatchReport,
    deleteMatch,
    calculateAllMatches,
} from "../controllers/jobMatchController.js";

const router = express.Router();

// All routes require authentication
router.use(checkJwt);

/**
 * UC-063: Job Matching Routes
 * 
 * IMPORTANT: Order matters! Specific routes must come before generic :jobId routes
 * to prevent path matching issues (e.g., /trends/all shouldn't match /:jobId)
 */

// Get all matches (must come before /:jobId)
router.get("/", getAllMatches);

// Get overall match trends (must come before /:jobId)
router.get("/trends/all", getMatchTrends);

// Compare multiple jobs
router.post("/compare", compareMatches);

// Calculate all matches
router.post("/calculate-all", calculateAllMatches);

// Calculate match for specific job
router.post("/calculate/:jobId", calculateMatch);

// Get match history for a job
router.get("/:jobId/history", getMatchHistory);

// Export match report
router.get("/:jobId/export", exportMatchReport);

// Update custom weights for a job
router.put("/:jobId/weights", updateMatchWeights);

// Get match for specific job (must come after specific GET routes)
router.get("/:jobId", getJobMatch);

// Delete match (must come after specific routes)
router.delete("/:jobId", deleteMatch);

export default router;
