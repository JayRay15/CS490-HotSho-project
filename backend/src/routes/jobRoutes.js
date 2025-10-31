import express from "express";
import { checkJwt } from "../middleware/checkJwt.js";
import {
  getJobs,
  addJob,
  updateJob,
  updateJobStatus,
  bulkUpdateStatus,
  deleteJob,
  getJobStats,
} from "../controllers/jobController.js";

const router = express.Router();

// GET /api/jobs/stats - Get job statistics (must be before /:jobId route)
router.get("/stats", checkJwt, getJobStats);

// GET /api/jobs - Get all jobs for current user
router.get("/", checkJwt, getJobs);

// POST /api/jobs - Create a new job
router.post("/", checkJwt, addJob);

// POST /api/jobs/bulk-update-status - Bulk update job statuses
router.post("/bulk-update-status", checkJwt, bulkUpdateStatus);

// PUT /api/jobs/:jobId - Update a job
router.put("/:jobId", checkJwt, updateJob);

// PUT /api/jobs/:jobId/status - Update job status
router.put("/:jobId/status", checkJwt, updateJobStatus);

// DELETE /api/jobs/:jobId - Delete a job
router.delete("/:jobId", checkJwt, deleteJob);

export default router;
