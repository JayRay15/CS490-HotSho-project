import express from "express";
import { checkJwt } from "../middleware/checkJwt.js";
import {
  listTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  importTemplate,
  listResumes,
  createResumeFromTemplate,
  updateResume,
  deleteResume,
  generateAIResume,
  generateResumeVariations,
  regenerateResumeSection,
  analyzeATS,
  generateResumePDF,
  optimizeSkills,
  tailorExperienceForJob,
  cloneResume,
  compareResumes,
  mergeResumes,
  setDefaultResume,
  archiveResume,
  unarchiveResume,
  exportResumeDocx,
  exportResumeHtml,
  exportResumeText,
} from "../controllers/resumeController.js";
import {
  createShareLink,
  listShares,
  revokeShare,
  getSharedResume,
  createFeedback,
  listFeedbackForResume,
  listFeedbackForShare,
  resolveFeedback,
  exportFeedbackSummary,
} from "../controllers/resumeShareController.js";
import { ensureShareAccess } from "../middleware/shareAccess.js";
import {
  validateResumeEndpoint,
  getValidationStatus
} from "../controllers/resumeValidationController.js";

const router = express.Router();

// Template routes
router.get("/templates", checkJwt, listTemplates);
router.post("/templates", checkJwt, createTemplate);
router.put("/templates/:id", checkJwt, updateTemplate);
router.delete("/templates/:id", checkJwt, deleteTemplate);
router.post("/templates/import", checkJwt, importTemplate);

// Resume routes
router.get("/resumes", checkJwt, listResumes);
router.post("/resumes", checkJwt, createResumeFromTemplate);
router.put("/resumes/:id", checkJwt, updateResume);
router.delete("/resumes/:id", checkJwt, deleteResume);

// AI-powered resume generation routes
router.post("/resumes/generate", checkJwt, generateAIResume);
router.post("/resumes/generate-variations", checkJwt, generateResumeVariations);
router.post("/resumes/:id/regenerate", checkJwt, regenerateResumeSection);
router.get("/resumes/:id/ats-analysis", checkJwt, analyzeATS);

// UC-49: Skills optimization
router.get("/resumes/:id/optimize-skills", checkJwt, optimizeSkills);

// UC-50: Experience tailoring
router.get("/resumes/:id/tailor-experience", checkJwt, tailorExperienceForJob);

// UC-53: Resume validation routes
router.post("/resumes/:id/validate", checkJwt, validateResumeEndpoint);
router.get("/resumes/:id/validation-status", checkJwt, getValidationStatus);

// UC-51: Export routes
router.get("/resumes/:id/pdf", checkJwt, generateResumePDF);
router.get("/resumes/:id/docx", checkJwt, exportResumeDocx);
router.get("/resumes/:id/html", checkJwt, exportResumeHtml);
router.get("/resumes/:id/txt", checkJwt, exportResumeText);

// UC-52: Version management
router.post("/resumes/:id/clone", checkJwt, cloneResume);
router.get("/resumes/:id/compare", checkJwt, compareResumes);
router.post("/resumes/:id/merge", checkJwt, mergeResumes);
router.put("/resumes/:id/set-default", checkJwt, setDefaultResume);
router.put("/resumes/:id/archive", checkJwt, archiveResume);
router.put("/resumes/:id/unarchive", checkJwt, unarchiveResume);

// UC-054: Resume sharing & feedback
// Owner actions
router.post("/resumes/:id/share", checkJwt, createShareLink);
router.get("/resumes/:id/shares", checkJwt, listShares);
router.patch("/resumes/:id/shares/:token/revoke", checkJwt, revokeShare);
router.get("/resumes/:id/feedback", checkJwt, listFeedbackForResume);
router.patch("/feedback/:feedbackId/resolve", checkJwt, resolveFeedback);
router.get("/resumes/:id/feedback/export", checkJwt, exportFeedbackSummary);

// Public share endpoints
router.get("/share/:token", ensureShareAccess, getSharedResume);
router.get("/share/:token/feedback", ensureShareAccess, listFeedbackForShare);
router.post("/share/:token/feedback", ensureShareAccess, createFeedback);

export default router;
