import express from 'express';
import * as writingPracticeController from '../controllers/writingPracticeController.js';
import { checkJwt } from '../middleware/checkJwt.js';

const router = express.Router();

// All routes require authentication
router.use(checkJwt);

// Behavioral questions
router.get('/questions', writingPracticeController.getBehavioralQuestions);
router.get('/questions/:id', writingPracticeController.getBehavioralQuestion);

// Practice sessions
router.post('/sessions', writingPracticeController.createPracticeSession);
router.get('/sessions', writingPracticeController.getPracticeSessions);
router.get('/sessions/:id', writingPracticeController.getPracticeSession);
router.post('/sessions/:sessionId/questions/:questionId/respond', writingPracticeController.submitResponse);
router.post('/sessions/:sessionId/complete', writingPracticeController.completePracticeSession);

// Performance tracking
router.get('/performance', writingPracticeController.getPerformanceTracking);
router.get('/performance/compare', writingPracticeController.compareSessions);

// Nerve management
router.put('/nerve-management', writingPracticeController.updateNerveManagement);

// Tips and guidance
router.get('/tips', writingPracticeController.getWritingTips);

export default router;
