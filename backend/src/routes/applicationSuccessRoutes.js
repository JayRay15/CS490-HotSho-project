import express from 'express';
import { checkJwt } from '../middleware/checkJwt.js';
import {
  getSuccessAnalysis,
  getSuccessPatterns,
  getOptimizationRecommendations,
  getTimingAnalysis,
  getMaterialsImpact,
} from '../controllers/applicationSuccessController.js';

const router = express.Router();

// ============================================================================
// UC-097: Application Success Rate Analysis Routes
// ============================================================================

/**
 * @route   GET /api/application-success/analysis
 * @desc    Get comprehensive application success analysis
 * @access  Protected
 */
router.get('/analysis', checkJwt, getSuccessAnalysis);

/**
 * @route   GET /api/application-success/patterns
 * @desc    Identify success patterns and correlations
 * @access  Protected
 */
router.get('/patterns', checkJwt, getSuccessPatterns);

/**
 * @route   GET /api/application-success/recommendations
 * @desc    Get personalized optimization recommendations
 * @access  Protected
 */
router.get('/recommendations', checkJwt, getOptimizationRecommendations);

/**
 * @route   GET /api/application-success/timing
 * @desc    Analyze timing patterns for optimal submission
 * @access  Protected
 */
router.get('/timing', checkJwt, getTimingAnalysis);

/**
 * @route   GET /api/application-success/materials-impact
 * @desc    Analyze impact of resume and cover letter customization
 * @access  Protected
 */
router.get('/materials-impact', checkJwt, getMaterialsImpact);

export default router;
