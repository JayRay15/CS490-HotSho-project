import express from "express";
import { checkJwt } from "../middleware/checkJwt.js";
import {
  getJobs,
  addJob,
  updateJob,
  updateJobStatus,
  bulkUpdateStatus,
  bulkUpdateDeadline,
  sendDeadlineReminders,
  deleteJob,
  getJobStats,
  linkResumeToJob,
  archiveJob,
  restoreJob,
  bulkArchiveJobs,
  bulkRestoreJobs,
  autoArchiveJobs,
} from "../controllers/jobController.js";
import { scrapeJobFromURL } from "../controllers/jobScraperController.js";

const router = express.Router();

// GET /api/jobs/stats - Get job statistics (must be before /:jobId route)
router.get("/stats", checkJwt, getJobStats);

// GET /api/jobs - Get all jobs for current user
router.get("/", checkJwt, getJobs);

// POST /api/jobs/scrape - Scrape job details from URL
router.post("/scrape", checkJwt, scrapeJobFromURL);

// POST /api/jobs - Create a new job
router.post("/", checkJwt, addJob);

// POST /api/jobs/bulk-update-status - Bulk update job statuses
router.post("/bulk-update-status", checkJwt, bulkUpdateStatus);

// POST /api/jobs/bulk-update-deadline - Bulk update deadlines
router.post("/bulk-update-deadline", checkJwt, bulkUpdateDeadline);

// POST /api/jobs/send-deadline-reminders - Trigger reminders manually (auth required)
router.post("/send-deadline-reminders", checkJwt, sendDeadlineReminders);

// POST /api/jobs/bulk-archive - Bulk archive jobs
router.post("/bulk-archive", checkJwt, bulkArchiveJobs);

// POST /api/jobs/bulk-restore - Bulk restore archived jobs
router.post("/bulk-restore", checkJwt, bulkRestoreJobs);

// POST /api/jobs/auto-archive - Auto-archive old jobs
router.post("/auto-archive", checkJwt, autoArchiveJobs);

// POST /api/jobs/:jobId/archive - Archive a single job
router.post("/:jobId/archive", checkJwt, archiveJob);

// POST /api/jobs/:jobId/restore - Restore an archived job
router.post("/:jobId/restore", checkJwt, restoreJob);

// PUT /api/jobs/:jobId - Update a job
router.put("/:jobId", checkJwt, updateJob);

// PUT /api/jobs/:jobId/status - Update job status
router.put("/:jobId/status", checkJwt, updateJobStatus);

// UC-52: PUT /api/jobs/:jobId/link-resume - Link resume to job
router.put("/:jobId/link-resume", checkJwt, linkResumeToJob);

// DELETE /api/jobs/:jobId - Delete a job
router.delete("/:jobId", checkJwt, deleteJob);

export default router;
