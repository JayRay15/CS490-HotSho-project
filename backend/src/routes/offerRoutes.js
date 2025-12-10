import express from "express";
import { checkJwt } from "../middleware/checkJwt.js";
import {
  compareOffers,
  scenarioAnalysis,
  getCostOfLivingComparison,
  archiveDeclinedOffer,
  getArchivedOffers,
  calculateTotalBenefits
} from "../controllers/offerComparisonController.js";

const router = express.Router();

/**
 * UC-127: Offer Evaluation & Comparison Tool Routes
 * 
 * Provides routes for:
 * - Side-by-side offer comparison with weighted scores
 * - Scenario analysis (what-if negotiation calculations)
 * - Cost of living comparison between locations
 * - Archive declined offers with reasons
 * - Calculate total benefits value
 */

// POST /api/offers/compare - Compare multiple job offers side-by-side
router.post("/compare", checkJwt, compareOffers);

// POST /api/offers/scenario-analysis - Analyze negotiation scenarios
router.post("/scenario-analysis", checkJwt, scenarioAnalysis);

// GET /api/offers/cost-of-living - Get cost of living comparison
router.get("/cost-of-living", checkJwt, getCostOfLivingComparison);

// POST /api/offers/archive - Archive a declined offer
router.post("/archive", checkJwt, archiveDeclinedOffer);

// GET /api/offers/archived - Get all archived offers
router.get("/archived", checkJwt, getArchivedOffers);

// POST /api/offers/calculate-benefits - Calculate benefits value
router.post("/calculate-benefits", checkJwt, calculateTotalBenefits);

export default router;
