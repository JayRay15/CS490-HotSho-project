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
  getJobAnalytics,
  linkResumeToJob,
  linkCoverLetterToJob,
  archiveJob,
  restoreJob,
  bulkArchiveJobs,
  bulkRestoreJobs,
  autoArchiveJobs,
  getJobById
} from "../controllers/jobController.js";
import { scrapeJobFromURL } from "../controllers/jobScraperController.js";
import { getInterviewInsights } from "../controllers/interviewInsightsController.js";

const router = express.Router();

// GET /api/jobs/stats - Get job statistics (must be before /:jobId route)
router.get("/stats", checkJwt, getJobStats);

// GET /api/jobs/analytics - Get detailed job analytics (must be before /:jobId route)
router.get("/analytics", checkJwt, getJobAnalytics);

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

// GET /api/jobs/:jobId - Get single job
router.get("/:jobId", checkJwt, getJobById);

// POST /api/jobs/:jobId/restore - Restore an archived job
router.post("/:jobId/restore", checkJwt, restoreJob);

// UC-68: GET /api/jobs/:jobId/interview-insights - Get interview insights for a company
router.get("/:jobId/interview-insights", checkJwt, getInterviewInsights);

// PUT /api/jobs/:jobId - Update a job
router.put("/:jobId", checkJwt, updateJob);

// PUT /api/jobs/:jobId/status - Update job status
router.put("/:jobId/status", checkJwt, updateJobStatus);

// UC-52: PUT /api/jobs/:jobId/link-resume - Link resume to job
router.put("/:jobId/link-resume", checkJwt, linkResumeToJob);

// UC-042: PUT /api/jobs/:jobId/link-cover-letter - Link cover letter to job
router.put("/:jobId/link-cover-letter", checkJwt, linkCoverLetterToJob);

// DELETE /api/jobs/:jobId - Delete a job
router.delete("/:jobId", checkJwt, deleteJob);

export default router;
