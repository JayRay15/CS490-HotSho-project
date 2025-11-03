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
  generateResumeDOCX,
} from "../controllers/resumeController.js";

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
router.get("/resumes/:id/pdf", checkJwt, generateResumePDF);
router.get("/resumes/:id/docx", checkJwt, generateResumeDOCX);

export default router;
