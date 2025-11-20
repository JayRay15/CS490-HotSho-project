import express from 'express';
import { requireAuth } from '@clerk/express';
import {
  submitInterviewResponse,
  getInterviewResponses,
  getInterviewResponseById,
  updateInterviewResponse,
  deleteInterviewResponse,
  getPracticeStats,
  generateQuestions,
  compareVersions
} from '../controllers/interviewCoachingController.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth());

// Submit a practice interview response and get AI feedback
router.post('/responses', submitInterviewResponse);

// Get all interview responses for a user
router.get('/responses', getInterviewResponses);

// Get a specific interview response by ID
router.get('/responses/:id', getInterviewResponseById);

// Update an interview response (add notes, tags, or archive)
router.patch('/responses/:id', updateInterviewResponse);

// Delete an interview response
router.delete('/responses/:id', deleteInterviewResponse);

// Get practice statistics for a user
router.get('/stats', getPracticeStats);

// Generate sample interview questions
router.post('/questions/generate', generateQuestions);

// Compare multiple versions of the same response
router.get('/responses/:id/compare', compareVersions);

export default router;
