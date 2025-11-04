import express from "express";
import {
  linkMaterialsToJob,
  updateJobMaterials,
  getJobMaterialsHistory,
  getMaterialsUsageAnalytics,
  getDefaultMaterials,
  getAllResumes,
  getAllCoverLetters,
} from "../controllers/materialsController.js";
import { checkJwt } from "../middleware/checkJwt.js";

const router = express.Router();

// All routes require authentication
router.use(checkJwt);

// Link materials to job application
router.post("/link", linkMaterialsToJob);

// Update materials for existing application
router.put("/:jobId", updateJobMaterials);

// Get materials history for a job
router.get("/history/:jobId", getJobMaterialsHistory);

// Get materials usage analytics
router.get("/analytics", getMaterialsUsageAnalytics);

// Get default materials
router.get("/defaults", getDefaultMaterials);

// Get all resumes for selection
router.get("/resumes", getAllResumes);

// Get all cover letters for selection
router.get("/cover-letters", getAllCoverLetters);

export default router;
