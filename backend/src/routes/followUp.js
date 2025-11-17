import express from 'express';
import * as followUpController from '../controllers/followUpController.js';
import { checkJwt } from '../middleware/checkJwt.js';

const router = express.Router();

// All routes require authentication
router.use(checkJwt);

// Create follow-up
router.post('/', followUpController.createFollowUp);

// Get all follow-ups for user
router.get('/', followUpController.getAllFollowUps);

// Get follow-ups for specific job
router.get('/:jobId', followUpController.getJobFollowUps);

// Get follow-up statistics for specific job
router.get('/stats/:jobId', followUpController.getJobFollowUpStats);

// Get overall statistics
router.get('/stats', followUpController.getOverallStats);

// Update follow-up response status
router.put('/:followUpId/response', followUpController.updateFollowUpResponse);

// Delete follow-up
router.delete('/:followUpId', followUpController.deleteFollowUp);

export default router;
