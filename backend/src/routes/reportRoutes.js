import express from "express";
import { checkJwt } from "../middleware/checkJwt.js";
import {
  createReportConfig,
  getReportConfigs,
  getReportConfigById,
  updateReportConfig,
  deleteReportConfig,
  generateReport,
  exportReportPDF,
  exportReportExcel,
  shareReport,
  viewSharedReport,
  getUserSharedReports,
  revokeSharedReport,
} from "../controllers/reportController.js";

const router = express.Router();

// Report Configuration Management (Protected)
router.post("/config", checkJwt, createReportConfig);
router.get("/config", checkJwt, getReportConfigs);
router.get("/config/:id", checkJwt, getReportConfigById);
router.put("/config/:id", checkJwt, updateReportConfig);
router.delete("/config/:id", checkJwt, deleteReportConfig);

// Report Generation (Protected)
router.post("/generate", checkJwt, generateReport);

// Export Endpoints (Protected)
router.post("/:id/export/pdf", checkJwt, exportReportPDF);
router.post("/:id/export/excel", checkJwt, exportReportExcel);

// Sharing Management (Protected)
router.post("/:id/share", checkJwt, shareReport);
router.get("/shared", checkJwt, getUserSharedReports);
router.delete("/shared/:id", checkJwt, revokeSharedReport);

// Public Sharing Endpoint (No auth required)
// Note: This will be registered separately in server.js as /api/public/reports/:token

export default router;
