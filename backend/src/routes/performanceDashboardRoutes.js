import express from 'express';
import { checkJwt } from '../middleware/checkJwt.js';
import {
  getPerformanceDashboard,
  getSearchGoals,
  updateSearchGoals,
  getTrendAnalysis
} from '../controllers/performanceDashboardController.js';

const router = express.Router();

// ============================================================================
// UC-096: Job Search Performance Dashboard Routes
// ============================================================================

/**
 * @route   GET /api/performance-dashboard
 * @desc    Get comprehensive performance dashboard with optional date filtering
 * @access  Protected
 * @query   { startDate?, endDate?, period?: 'week' | 'month' | 'quarter' | 'year' | 'all' }
 */
router.get('/', checkJwt, getPerformanceDashboard);

/**
 * @route   GET /api/performance-dashboard/goals
 * @desc    Get user's search goals
 * @access  Protected
 */
router.get('/goals', checkJwt, getSearchGoals);

/**
 * @route   PUT /api/performance-dashboard/goals
 * @desc    Update user's search goals
 * @access  Protected
 * @body    { goals: { weekly: {...}, monthly: {...}, overall: {...} } }
 */
router.put('/goals', checkJwt, updateSearchGoals);

/**
 * @route   GET /api/performance-dashboard/trends
 * @desc    Get detailed trend analysis
 * @access  Protected
 * @query   { granularity?: 'daily' | 'weekly' | 'monthly' }
 */
router.get('/trends', checkJwt, getTrendAnalysis);

export default router;
