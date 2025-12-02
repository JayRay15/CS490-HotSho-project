import express from "express";
import { checkJwt } from "../middleware/checkJwt.js";
import {
  getInterviewPerformanceAnalytics,
  getImprovementTrends,
  getCoachingRecommendations,
  getPerformanceBenchmarks
} from "../controllers/interviewPerformanceController.js";

const router = express.Router();

// All routes require authentication
router.use(checkJwt);

/**
 * @route   GET /api/interview-performance/analytics
 * @desc    Get comprehensive interview performance analytics
 * @access  Private
 */
router.get("/analytics", getInterviewPerformanceAnalytics);

/**
 * @route   GET /api/interview-performance/trends
 * @desc    Get improvement trends over time
 * @access  Private
 */
router.get("/trends", getImprovementTrends);

/**
 * @route   GET /api/interview-performance/coaching
 * @desc    Get personalized coaching recommendations
 * @access  Private
 */
router.get("/coaching", getCoachingRecommendations);

/**
 * @route   GET /api/interview-performance/benchmarks
 * @desc    Get performance benchmarks
 * @access  Private
 */
router.get("/benchmarks", getPerformanceBenchmarks);

export default router;
