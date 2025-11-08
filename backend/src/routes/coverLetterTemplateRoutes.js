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
  getIndustryGuidance
} from "../controllers/coverLetterTemplateController.js";

const router = express.Router();

// Public/User routes - IMPORTANT: Specific routes must come before parameterized routes
router.get("/cover-letter-templates/industry-guidance", checkJwt, getIndustryGuidance);
router.get("/cover-letter-templates/analytics/stats", checkJwt, getTemplateAnalytics);
router.get("/cover-letter-templates", checkJwt, listTemplates);
router.get("/cover-letter-templates/:id", checkJwt, getTemplateById);
router.post("/cover-letter-templates/:id/use", checkJwt, trackTemplateUsage);

// Import route (must come before POST /cover-letter-templates)
router.post("/cover-letter-templates/import", checkJwt, importTemplate);

// Protected routes (require authentication)
router.post("/cover-letter-templates", checkJwt, createTemplate);
router.put("/cover-letter-templates/:id", checkJwt, updateTemplate);
router.delete("/cover-letter-templates/:id", checkJwt, deleteTemplate);

// Export route (must come before GET /:id)
router.get("/cover-letter-templates/:id/export", checkJwt, exportTemplate);

// Sharing routes
router.put("/cover-letter-templates/:id/share", checkJwt, shareTemplate);

export default router;
