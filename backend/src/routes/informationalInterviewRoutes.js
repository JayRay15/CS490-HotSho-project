import express from 'express';
import { checkJwt } from '../middleware/checkJwt.js';
import {
  createInterview,
  getInterviews,
  getInterviewById,
  updateInterview,
  deleteInterview,
  generateOutreach,
  generatePreparation,
  generateFollowUp,
  getAnalytics
} from '../controllers/informationalInterviewController.js';

const router = express.Router();

// Apply JWT authentication to all routes
router.use(checkJwt);

// Analytics (must be before /:id to avoid treating 'analytics' as an ID)
router.get('/analytics', getAnalytics);

// AI-powered generation routes (must be before /:id)
router.post('/generate-outreach', generateOutreach);
router.post('/generate-preparation', generatePreparation);
router.post('/generate-follow-up', generateFollowUp);

// CRUD routes
router.get('/', getInterviews);
router.post('/', createInterview);
router.get('/:id', getInterviewById);
router.put('/:id', updateInterview);
router.delete('/:id', deleteInterview);

export default router;
