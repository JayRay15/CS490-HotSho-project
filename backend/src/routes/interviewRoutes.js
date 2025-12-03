import express from "express";
import { checkJwt } from "../middleware/checkJwt.js";
import {
  getInterviews,
  getInterview,
  scheduleInterview,
  updateInterview,
  rescheduleInterview,
  cancelInterview,
  recordOutcome,
  confirmInterview,
  updatePreparationTask,
  addPreparationTask,
  deletePreparationTask,
  generatePreparationTasks,
  getUpcomingInterviews,
  checkConflicts,
  deleteInterview,
  downloadInterviewICS,
  syncToCalendar,
} from "../controllers/interviewController.js";
import {
  getInterviewPerformanceAnalytics,
  seedInterviewData,
  clearInterviewData,
} from "../controllers/interviewAnalyticsController.js";

const router = express.Router();

// Analytics routes (must be before /:interviewId to avoid conflicts)
// GET /api/interviews/analytics/performance - Get comprehensive interview analytics
router.get("/analytics/performance", checkJwt, getInterviewPerformanceAnalytics);

// POST /api/interviews/analytics/seed - Generate test data for analytics
router.post("/analytics/seed", checkJwt, seedInterviewData);

// DELETE /api/interviews/analytics/clear - Clear all interview data
router.delete("/analytics/clear", checkJwt, clearInterviewData);

// GET /api/interviews/upcoming - Get upcoming interviews (must be before /:interviewId)
router.get("/upcoming", checkJwt, getUpcomingInterviews);

// GET /api/interviews/conflicts - Check for scheduling conflicts (must be before /:interviewId)
router.get("/conflicts", checkJwt, checkConflicts);

// GET /api/interviews - Get all interviews for current user
router.get("/", checkJwt, getInterviews);

// GET /api/interviews/:interviewId - Get a specific interview
router.get("/:interviewId", checkJwt, getInterview);

// GET /api/interviews/:interviewId/ics - Download ICS file for interview
router.get("/:interviewId/ics", checkJwt, downloadInterviewICS);

// POST /api/interviews/:interviewId/sync-calendar - Manually sync interview to calendar
router.post("/:interviewId/sync-calendar", checkJwt, syncToCalendar);

// POST /api/interviews - Schedule a new interview
router.post("/", checkJwt, scheduleInterview);

// PUT /api/interviews/:interviewId - Update interview details
router.put("/:interviewId", checkJwt, updateInterview);

// PUT /api/interviews/:interviewId/reschedule - Reschedule an interview
router.put("/:interviewId/reschedule", checkJwt, rescheduleInterview);

// PUT /api/interviews/:interviewId/cancel - Cancel an interview
router.put("/:interviewId/cancel", checkJwt, cancelInterview);

// PUT /api/interviews/:interviewId/confirm - Confirm an interview
router.put("/:interviewId/confirm", checkJwt, confirmInterview);

// PUT /api/interviews/:interviewId/outcome - Record interview outcome
router.put("/:interviewId/outcome", checkJwt, recordOutcome);

// POST /api/interviews/:interviewId/generate-tasks - Generate preparation tasks
router.post("/:interviewId/generate-tasks", checkJwt, generatePreparationTasks);

// POST /api/interviews/:interviewId/tasks - Add a preparation task
router.post("/:interviewId/tasks", checkJwt, addPreparationTask);

// PUT /api/interviews/:interviewId/tasks/:taskId - Update a preparation task
router.put("/:interviewId/tasks/:taskId", checkJwt, updatePreparationTask);

// DELETE /api/interviews/:interviewId/tasks/:taskId - Delete a preparation task
router.delete("/:interviewId/tasks/:taskId", checkJwt, deletePreparationTask);

// DELETE /api/interviews/:interviewId - Delete an interview
router.delete("/:interviewId", checkJwt, deleteInterview);

export default router;
