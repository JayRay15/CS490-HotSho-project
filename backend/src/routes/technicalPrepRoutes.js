import express from 'express';
import * as technicalPrepController from '../controllers/technicalPrepController.js';
import { checkJwt } from '../middleware/checkJwt.js';

const router = express.Router();
// All routes require authentication
router.use(checkJwt);

// Technical prep profile
router.get('/profile', technicalPrepController.getTechnicalPrep);
router.put('/profile', technicalPrepController.updateTechnicalPrep);

// Coding challenges
router.get('/coding-challenges', technicalPrepController.getCodingChallenges);
router.get('/coding-challenges/:id', technicalPrepController.getCodingChallenge);
router.post('/coding-challenges/:challengeId/submit', technicalPrepController.submitCodingSolution);
router.delete('/coding-challenges/:id', technicalPrepController.deleteCodingChallenge);
router.get('/coding-challenges/:id/hint', technicalPrepController.getHint);
router.get('/coding-challenges/:id/solution', technicalPrepController.getSolution);

// System design questions
router.get('/system-design', technicalPrepController.getSystemDesignQuestions);
router.get('/system-design/:id', technicalPrepController.getSystemDesignQuestion);
router.post('/system-design/:questionId/submit', technicalPrepController.submitSystemDesignSolution);
router.delete('/system-design/:id', technicalPrepController.deleteSystemDesignQuestion);

// Case studies
router.get('/case-studies', technicalPrepController.getCaseStudies);
router.get('/case-studies/:id', technicalPrepController.getCaseStudy);
router.post('/case-studies/:caseStudyId/submit', technicalPrepController.submitCaseStudySolution);
router.delete('/case-studies/:id', technicalPrepController.deleteCaseStudy);

// Job-specific challenges
router.get('/job/:jobId/challenges', technicalPrepController.generateJobSpecificChallenges);

// Performance and analytics
router.get('/performance', technicalPrepController.getPerformanceAnalytics);

// Bookmarks
router.post('/bookmark', technicalPrepController.bookmarkChallenge);
router.get('/bookmarks', technicalPrepController.getBookmarkedChallenges);

export default router;
