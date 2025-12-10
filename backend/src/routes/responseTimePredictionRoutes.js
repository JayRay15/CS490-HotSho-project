import express from 'express';
import { checkJwt } from '../middleware/checkJwt.js';
import * as responseTimePredictionController from '../controllers/responseTimePredictionController.js';

const router = express.Router();

// All routes require authentication
router.use(checkJwt);

// Get response time prediction for a specific job
router.get('/prediction/:jobId', responseTimePredictionController.getPrediction);

// Get predictions for all user's applied jobs
router.get('/predictions', responseTimePredictionController.getAllPredictions);

// Get overdue applications
router.get('/overdue', responseTimePredictionController.getOverdueApplications);

// Get dashboard summary
router.get('/dashboard', responseTimePredictionController.getDashboardSummary);

// Get prediction accuracy statistics
router.get('/accuracy', responseTimePredictionController.getPredictionAccuracy);

// Get industry benchmarks
router.get('/benchmarks', responseTimePredictionController.getIndustryBenchmarks);

// Get follow-up suggestions for a job
router.get('/follow-up/:jobId', responseTimePredictionController.getFollowUpSuggestions);

// Record actual response for a job application
router.post('/record-response/:jobId', responseTimePredictionController.recordResponse);

// Mark overdue alert as sent
router.post('/alert-sent/:jobId', responseTimePredictionController.markOverdueAlertSent);

// Mark follow-up reminder as sent
router.post('/follow-up-sent/:jobId', responseTimePredictionController.markFollowUpReminderSent);

// Withdraw application (stop tracking)
router.post('/withdraw/:jobId', responseTimePredictionController.withdrawApplication);

export default router;
