import express from "express";
import { checkJwt } from "../middleware/checkJwt.js";
import {
  getMarketIntelligence,
  updatePreferences,
  getJobMarketTrends,
  getSkillDemand,
  getSalaryTrends,
  getCompanyGrowth,
  getIndustryInsights,
  getRecommendations,
  updateRecommendation,
  getMarketOpportunities,
  getCompetitiveLandscape,
  generateMarketReport,
} from "../controllers/marketIntelligenceController.js";

const router = express.Router();

// Main intelligence routes
router.get("/", checkJwt, getMarketIntelligence);
router.put("/preferences", checkJwt, updatePreferences);

// Market trend routes
router.get("/job-trends", checkJwt, getJobMarketTrends);
router.get("/skill-demand", checkJwt, getSkillDemand);
router.get("/salary-trends", checkJwt, getSalaryTrends);
router.get("/company-growth", checkJwt, getCompanyGrowth);
router.get("/industry-insights", checkJwt, getIndustryInsights);

// Recommendations and opportunities
router.get("/recommendations", checkJwt, getRecommendations);
router.put("/recommendations/:recommendationId", checkJwt, updateRecommendation);
router.get("/opportunities", checkJwt, getMarketOpportunities);

// Analysis routes
router.get("/competitive-landscape", checkJwt, getCompetitiveLandscape);
router.post("/generate-report", checkJwt, generateMarketReport);

export default router;
