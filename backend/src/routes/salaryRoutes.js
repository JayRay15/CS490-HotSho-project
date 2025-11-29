import express from "express";
import { checkJwt } from "../middleware/checkJwt.js";
import {
  getSalaryResearch,
  compareSalaries,
  getSalaryBenchmarks,
  exportSalaryReport,
  // UC-083: Salary Negotiation Preparation endpoints
  createNegotiation,
  getNegotiation,
  getAllNegotiations,
  generateTalkingPoints,
  generateNegotiationScript,
  addOffer,
  evaluateCounteroffer,
  addConfidenceExercise,
  completeExercise,
  completeNegotiation,
  getTimingStrategy,
  // UC-100: Salary Progression and Market Positioning endpoints
  trackSalaryOffer,
  updateSalaryOffer,
  deleteSalaryOffer,
  getSalaryProgression,
  getProgressionAnalytics,
  addCareerMilestone,
  addMarketAssessment,
  generateAdvancementRecommendations,
  trackNegotiationOutcome
} from "../controllers/salaryController.js";

const router = express.Router();

// UC-067: GET /api/salary/benchmarks - Get general salary benchmarks
router.get("/benchmarks", checkJwt, getSalaryBenchmarks);

// UC-067: GET /api/salary/compare - Compare salaries across multiple jobs
router.get("/compare", checkJwt, compareSalaries);

// UC-067: GET /api/salary/research/:jobId - Get salary research for specific job
router.get("/research/:jobId", checkJwt, getSalaryResearch);

// UC-067: POST /api/salary/export - Export salary research report
router.post("/export", checkJwt, exportSalaryReport);

// UC-083: Salary Negotiation Preparation Routes
// GET /api/salary/negotiations - Get all negotiations for user
router.get("/negotiations", checkJwt, getAllNegotiations);

// POST /api/salary/negotiation - Create new negotiation preparation
router.post("/negotiation", checkJwt, createNegotiation);

// GET /api/salary/negotiation/:jobId - Get negotiation for specific job
router.get("/negotiation/:jobId", checkJwt, getNegotiation);

// POST /api/salary/negotiation/:id/talking-points - Generate talking points
router.post("/negotiation/:id/talking-points", checkJwt, generateTalkingPoints);

// POST /api/salary/negotiation/:id/script - Generate negotiation script
router.post("/negotiation/:id/script", checkJwt, generateNegotiationScript);

// POST /api/salary/negotiation/:id/offer - Add offer to negotiation
router.post("/negotiation/:id/offer", checkJwt, addOffer);

// POST /api/salary/negotiation/:id/counteroffer - Evaluate and generate counteroffer
router.post("/negotiation/:id/counteroffer", checkJwt, evaluateCounteroffer);

// POST /api/salary/negotiation/:id/confidence-exercise - Add confidence exercise
router.post("/negotiation/:id/confidence-exercise", checkJwt, addConfidenceExercise);

// PUT /api/salary/negotiation/:id/exercise/:exerciseId - Mark exercise as completed
router.put("/negotiation/:id/exercise/:exerciseId", checkJwt, completeExercise);

// POST /api/salary/negotiation/:id/complete - Complete negotiation with outcome
router.post("/negotiation/:id/complete", checkJwt, completeNegotiation);

// GET /api/salary/negotiation/:id/timing - Get timing strategy recommendations
router.get("/negotiation/:id/timing", checkJwt, getTimingStrategy);

// UC-100: Salary Progression and Market Positioning Routes
// POST /api/salary/progression/offer - Track a salary offer
router.post("/progression/offer", checkJwt, trackSalaryOffer);

// PUT /api/salary/progression/offer/:offerId - Update a tracked salary offer
router.put("/progression/offer/:offerId", checkJwt, updateSalaryOffer);

// DELETE /api/salary/progression/offer/:offerId - Delete a tracked salary offer
router.delete("/progression/offer/:offerId", checkJwt, deleteSalaryOffer);

// GET /api/salary/progression - Get complete salary progression data
router.get("/progression", checkJwt, getSalaryProgression);

// GET /api/salary/progression/analytics - Get salary progression analytics
router.get("/progression/analytics", checkJwt, getProgressionAnalytics);

// POST /api/salary/progression/milestone - Add career milestone
router.post("/progression/milestone", checkJwt, addCareerMilestone);

// POST /api/salary/progression/market-assessment - Add market positioning assessment
router.post("/progression/market-assessment", checkJwt, addMarketAssessment);

// POST /api/salary/progression/recommendations - Generate advancement recommendations
router.post("/progression/recommendations", checkJwt, generateAdvancementRecommendations);

// POST /api/salary/progression/negotiation-outcome - Track negotiation outcome
router.post("/progression/negotiation-outcome", checkJwt, trackNegotiationOutcome);

export default router;
