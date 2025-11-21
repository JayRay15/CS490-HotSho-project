import express from 'express';
import { checkJwt } from '../middleware/checkJwt.js';
import {
  getGoals,
  getGoalById,
  createGoal,
  updateGoal,
  deleteGoal,
  addProgressUpdate,
  completeMilestone,
  getGoalStats,
  getGoalRecommendations,
  analyzeGoal,
  celebrateGoal,
  getSuccessPatterns,
  linkGoalToEntities,
  updateImpactMetrics,
  getDashboardSummary
} from '../controllers/goalController.js';

const router = express.Router();

// Apply JWT authentication to all routes
router.use(checkJwt);

// Dashboard and statistics
router.get('/dashboard', getDashboardSummary);
router.get('/stats', getGoalStats);

// AI-powered features
router.post('/recommendations', getGoalRecommendations);
router.get('/patterns', getSuccessPatterns);

// Goal CRUD operations
router.get('/', getGoals);
router.post('/', createGoal);
router.get('/:id', getGoalById);
router.put('/:id', updateGoal);
router.delete('/:id', deleteGoal);

// Progress tracking
router.post('/:id/progress', addProgressUpdate);
router.post('/:id/milestones/:milestoneId/complete', completeMilestone);

// Analysis and insights
router.post('/:id/analyze', analyzeGoal);
router.post('/:id/celebrate', celebrateGoal);

// Relationships and impact
router.post('/:id/link', linkGoalToEntities);
router.post('/:id/impact', updateImpactMetrics);

export default router;
