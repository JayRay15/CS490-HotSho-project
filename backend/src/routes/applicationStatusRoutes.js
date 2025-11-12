import express from 'express';
import { checkJwt } from '../middleware/checkJwt.js';
import {
  getApplicationStatus,
  getAllApplicationStatuses,
  updateApplicationStatus,
  getStatusTimeline,
  addTimelineEvent,
  bulkUpdateStatuses,
  getStatusStatistics,
  detectStatusFromEmailEndpoint,
  confirmStatusDetection,
  updateAutomationSettings,
  deleteApplicationStatus
} from '../controllers/applicationStatusController.js';

const router = express.Router();

// All routes require authentication
router.use(checkJwt);

// ===============================================
// Application Status Routes
// ===============================================

// Get status statistics for user
router.get('/stats', getStatusStatistics);

// Bulk status update
router.put('/bulk', bulkUpdateStatuses);

// Get all statuses for user
router.get('/', getAllApplicationStatuses);

// Get status for specific job
router.get('/:jobId', getApplicationStatus);

// Update status for specific job
router.put('/:jobId', updateApplicationStatus);

// Delete status for specific job
router.delete('/:jobId', deleteApplicationStatus);

// ===============================================
// Timeline Routes
// ===============================================

// Get timeline and history for specific job
router.get('/:jobId/timeline', getStatusTimeline);

// Add custom timeline event
router.post('/:jobId/timeline', addTimelineEvent);

// ===============================================
// Email Detection Routes
// ===============================================

// Detect status from email (manual trigger)
router.post('/:jobId/detect-from-email', detectStatusFromEmailEndpoint);

// Confirm auto-detected status
router.post('/:jobId/confirm-detection', confirmStatusDetection);

// ===============================================
// Automation Settings Routes
// ===============================================

// Update automation settings
router.put('/:jobId/automation', updateAutomationSettings);

export default router;
