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

export default router;
