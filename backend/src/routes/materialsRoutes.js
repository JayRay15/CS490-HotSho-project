import express from "express";
import { checkJwt } from "../middleware/checkJwt.js";
import {
  listMaterials,
  linkMaterialsToJob,
  getMaterialsHistory,
  getMaterialsAnalytics,
} from "../controllers/materialsController.js";

const router = express.Router();

router.get("/materials/list", checkJwt, listMaterials);
router.post("/materials/jobs/:jobId/link", checkJwt, linkMaterialsToJob);
router.get("/materials/jobs/:jobId/history", checkJwt, getMaterialsHistory);
router.get("/materials/analytics", checkJwt, getMaterialsAnalytics);

export default router;
