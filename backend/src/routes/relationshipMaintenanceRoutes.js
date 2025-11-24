import express from 'express';
import { checkJwt } from '../middleware/checkJwt.js';
import {
  getReminders,
  getReminderById,
  createReminder,
  updateReminder,
  completeReminder,
  snoozeReminder,
  dismissReminder,
  deleteReminder,
  generateReminders,
  getMessageTemplates,
  getActivities,
  createActivity,
  getRelationshipHealth,
  getRelationshipAnalytics
} from '../controllers/relationshipMaintenanceController.js';

const router = express.Router();

// Reminder routes
router.get('/reminders', checkJwt, getReminders);
router.get('/reminders/templates', checkJwt, getMessageTemplates);
router.post('/reminders/generate', checkJwt, generateReminders);
router.get('/reminders/:id', checkJwt, getReminderById);
router.post('/reminders', checkJwt, createReminder);
router.put('/reminders/:id', checkJwt, updateReminder);
router.post('/reminders/:id/complete', checkJwt, completeReminder);
router.post('/reminders/:id/snooze', checkJwt, snoozeReminder);
router.post('/reminders/:id/dismiss', checkJwt, dismissReminder);
router.delete('/reminders/:id', checkJwt, deleteReminder);

// Activity routes
router.get('/activities', checkJwt, getActivities);
router.post('/activities', checkJwt, createActivity);
router.get('/activities/health/:contactId', checkJwt, getRelationshipHealth);
router.get('/activities/analytics', checkJwt, getRelationshipAnalytics);

export default router;
