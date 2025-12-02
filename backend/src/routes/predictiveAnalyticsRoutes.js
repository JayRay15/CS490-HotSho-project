import express from "express";
import { checkJwt } from "../middleware/checkJwt.js";
import {
  getPredictiveAnalyticsDashboard,
  getInterviewSuccessPredictions,
  getJobSearchTimelineForecast,
  getSalaryPredictions,
  getOptimalTimingPredictions,
  getScenarioPlanning,
  getImprovementRecommendations,
  getAccuracyTracking
} from "../controllers/predictiveAnalyticsController.js";

const router = express.Router();

// All routes require authentication
router.use(checkJwt);

// Main dashboard - comprehensive predictive analytics
router.get("/dashboard", getPredictiveAnalyticsDashboard);

// Interview success predictions
router.get("/interview-success", getInterviewSuccessPredictions);

// Job search timeline forecast
router.get("/job-search-timeline", getJobSearchTimelineForecast);

// Salary negotiation predictions
router.get("/salary-predictions", getSalaryPredictions);

// Optimal timing predictions
router.get("/optimal-timing", getOptimalTimingPredictions);

// Scenario planning
router.get("/scenarios", getScenarioPlanning);

// Improvement recommendations
router.get("/recommendations", getImprovementRecommendations);

// Accuracy tracking
router.get("/accuracy", getAccuracyTracking);

export default router;
