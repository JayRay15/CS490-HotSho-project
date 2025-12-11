import express from 'express';
import { checkJwt } from '../middleware/checkJwt.js';
import * as timingController from '../controllers/applicationTimingController.js';

const router = express.Router();

// All routes require authentication
router.use(checkJwt);

// UC-124: Get timing recommendation for a job
router.get('/recommendation/:jobId', timingController.getTimingRecommendation);

// UC-124: Get real-time recommendation (submit now vs wait)
router.post('/realtime/:jobId', timingController.getRealtimeRecommendation);

// UC-124: Schedule application submission
router.post('/schedule/:jobId', timingController.scheduleSubmission);

// UC-124: Cancel scheduled submission
router.delete('/schedule/:jobId', timingController.cancelScheduledSubmission);

// UC-124: Record application submission
router.post('/record-submission/:jobId', timingController.recordSubmission);

// UC-124: Record response to application
router.post('/record-response/:jobId', timingController.recordResponse);

// UC-124: Get timing metrics for a job
router.get('/metrics/:jobId', timingController.getTimingMetrics);

// UC-124: Get A/B test results
router.get('/ab-test-results', timingController.getABTestResults);

// UC-124: Get correlation data
router.get('/correlations', timingController.getCorrelations);

// UC-124: Get user's scheduled submissions
router.get('/scheduled', timingController.getScheduledSubmissions);

// UC-124: Get industry and company size statistics
router.get('/stats', timingController.getTimingStats);

// UC-124: Get comprehensive insights with industry benchmarks
router.get('/insights', timingController.getComprehensiveInsights);

export default router;
