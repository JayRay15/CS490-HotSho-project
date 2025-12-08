import express from 'express';
import { checkJwt } from '../middleware/checkJwt.js';
import {
  getAllReminders,
  getJobReminders,
  getPendingReminders,
  createReminder,
  snoozeReminder,
  dismissReminder,
  completeReminder,
  getReminderStats,
  getEtiquetteTipsEndpoint,
  getCompanyResponsivenessEndpoint,
  triggerStatusChangeReminders,
  markResponseReceived,
  deleteReminder,
  dismissRejectedReminders
} from '../controllers/followUpReminderController.js';

const router = express.Router();

// All routes require authentication
router.use(checkJwt);

// ===============================================
// Follow-Up Reminder Routes
// ===============================================

// Get reminder statistics
router.get('/stats', getReminderStats);

// Get pending reminders (due within X days)
router.get('/pending', getPendingReminders);

// Bulk dismiss reminders for rejected applications
router.post('/dismiss-rejected', dismissRejectedReminders);

// Get all reminders for user
router.get('/', getAllReminders);

// Get etiquette tips for a reminder type
router.get('/tips/:type', getEtiquetteTipsEndpoint);

// Get company responsiveness data
router.get('/responsiveness/:company', getCompanyResponsivenessEndpoint);

// Get reminders for a specific job
router.get('/job/:jobId', getJobReminders);

// Create a new reminder
router.post('/', createReminder);

// Trigger reminder creation for a status change
router.post('/job/:jobId/status-change', triggerStatusChangeReminders);

// Snooze a reminder
router.put('/:reminderId/snooze', snoozeReminder);

// Dismiss a reminder
router.put('/:reminderId/dismiss', dismissReminder);

// Complete a reminder
router.put('/:reminderId/complete', completeReminder);

// Mark response received for a reminder
router.put('/:reminderId/response', markResponseReceived);

// Delete a reminder
router.delete('/:reminderId', deleteReminder);

export default router;
