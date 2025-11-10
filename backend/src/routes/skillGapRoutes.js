import express from "express";
import { checkJwt } from "../middleware/checkJwt.js";
import {
  analyzeJobSkillGap,
  getSkillTrends,
  startSkillTracking,
  updateSkillProgress,
  getSkillTracking,
  deleteSkillTracking,
  compareJobsSkills
} from "../controllers/skillGapController.js";

const router = express.Router();

// Skill gap analysis routes
router.get("/analyze/:jobId", checkJwt, analyzeJobSkillGap);
router.get("/trends", checkJwt, getSkillTrends);
router.post("/compare", checkJwt, compareJobsSkills);

// Skill development tracking routes
router.get("/track", checkJwt, getSkillTracking);
router.post("/track", checkJwt, startSkillTracking);
router.put("/track/:skillName", checkJwt, updateSkillProgress);
router.delete("/track/:skillName", checkJwt, deleteSkillTracking);

export default router;
