import express from "express";
import { checkJwt } from "../middleware/checkJwt.js";
import {
  listTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  trackTemplateUsage,
  getTemplateAnalytics,
  importTemplate,
  shareTemplate,
  exportTemplate,
  getIndustryGuidance,
  generateAICoverLetter,
  analyzeCulture
} from "../controllers/coverLetterTemplateController.js";

const router = express.Router();

// Public/User routes
router.get("/cover-letter-templates", checkJwt, listTemplates);
router.get("/cover-letter-templates/industry-guidance", checkJwt, getIndustryGuidance);
router.get("/cover-letter-templates/analytics/stats", checkJwt, getTemplateAnalytics);
router.get("/cover-letter-templates/:id", checkJwt, getTemplateById);
router.post("/cover-letter-templates/:id/use", checkJwt, trackTemplateUsage);

// Protected routes (require authentication)
router.post("/cover-letter-templates", checkJwt, createTemplate);
router.put("/cover-letter-templates/:id", checkJwt, updateTemplate);
router.delete("/cover-letter-templates/:id", checkJwt, deleteTemplate);

// Import/Export routes
router.post("/cover-letter-templates/import", checkJwt, importTemplate);
router.get("/cover-letter-templates/:id/export", checkJwt, exportTemplate);

// Sharing routes
router.put("/cover-letter-templates/:id/share", checkJwt, shareTemplate);

// AI Generation routes
router.post("/cover-letter/ai/generate", checkJwt, generateAICoverLetter);
router.post("/cover-letter/ai/analyze-culture", checkJwt, analyzeCulture);

export default router;
