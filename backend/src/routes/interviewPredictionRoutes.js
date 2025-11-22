import express from "express";
import { checkJwt } from "../middleware/checkJwt.js";
import {
  getPrediction,
  getAllUserPredictions,
  getUpcomingPredictions,
  recalculatePrediction,
  completeRecommendation,
  uncompleteRecommendation,
  recordOutcome,
  getAnalytics,
  compareInterviews,
} from "../controllers/interviewPredictionController.js";

console.log("✅ Interview Prediction Routes loaded");

const router = express.Router();

// All routes require authentication
router.use(checkJwt);

// Get all predictions for current user
router.get("/user/all", getAllUserPredictions);

// Get predictions for upcoming interviews only
router.get("/upcoming/list", getUpcomingPredictions);

// Get prediction accuracy analytics
router.get("/analytics/accuracy", getAnalytics);

// Compare success probabilities across multiple interviews
router.get("/comparison/interviews", compareInterviews);

// Get prediction for specific interview (or calculate if doesn't exist)
router.get("/:interviewId", getPrediction);

// Force recalculation of prediction
router.post("/:interviewId/recalculate", recalculatePrediction);

// Mark recommendation as completed
router.put("/:interviewId/recommendations/:recommendationId/complete", completeRecommendation);

// Undo completed recommendation
router.delete("/:interviewId/recommendations/:recommendationId/complete", uncompleteRecommendation);

// Record actual interview outcome for accuracy tracking
router.post("/:interviewId/outcome", recordOutcome);

export default router;
