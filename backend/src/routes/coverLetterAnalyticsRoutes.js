import express from "express";
import { checkJwt } from "../middleware/checkJwt.js";
import {
  getCoverLetterPerformance,
  getAllCoverLetterAnalytics,
  trackApplicationOutcome,
  getResponseRates,
  getTemplateEffectiveness,
  getSuccessPatterns,
  exportPerformanceReport
} from "../controllers/coverLetterAnalyticsController.js";

const router = express.Router();

/**
 * UC-62: Cover Letter Performance Analytics Routes
 * All routes require authentication
 */

// Get performance analytics for a specific cover letter
router.get("/cover-letter-analytics/:coverLetterId", checkJwt, getCoverLetterPerformance);

// Get analytics for all user's cover letters
router.get("/cover-letter-analytics", checkJwt, getAllCoverLetterAnalytics);

// Track application outcome (called when job status changes)
router.put("/cover-letter-analytics/track/:jobId", checkJwt, trackApplicationOutcome);

// Get response rates analysis
router.get("/cover-letter-analytics/analysis/response-rates", checkJwt, getResponseRates);

// Get template effectiveness analysis
router.get("/cover-letter-analytics/analysis/template-effectiveness", checkJwt, getTemplateEffectiveness);

// Get success patterns and insights
router.get("/cover-letter-analytics/analysis/success-patterns", checkJwt, getSuccessPatterns);

// Export performance report (PDF or JSON)
router.get("/cover-letter-analytics/export/report", checkJwt, exportPerformanceReport);

export default router;
