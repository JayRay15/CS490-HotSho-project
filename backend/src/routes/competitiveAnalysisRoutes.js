import express from 'express';
import { checkJwt } from '../middleware/checkJwt.js';
import {
    getCompetitiveAnalysis,
    getSkillGapAnalysis,
    getMarketPositioning,
    getCareerProgressionAnalysis,
} from '../controllers/competitiveAnalysisController.js';

const router = express.Router();

// ============================================================================
// UC-104: Competitive Analysis and Benchmarking Routes
// ============================================================================

/**
 * @route   GET /api/competitive-analysis
 * @desc    Get comprehensive competitive analysis with peer benchmarks
 * @access  Protected
 */
router.get('/', checkJwt, getCompetitiveAnalysis);

/**
 * @route   GET /api/competitive-analysis/skill-gaps
 * @desc    Get detailed skill gap analysis compared to top performers
 * @access  Protected
 */
router.get('/skill-gaps', checkJwt, getSkillGapAnalysis);

/**
 * @route   GET /api/competitive-analysis/positioning
 * @desc    Get market positioning analysis and recommendations
 * @access  Protected
 */
router.get('/positioning', checkJwt, getMarketPositioning);

/**
 * @route   GET /api/competitive-analysis/career-progression
 * @desc    Get career progression patterns and analysis
 * @access  Protected
 */
router.get('/career-progression', checkJwt, getCareerProgressionAnalysis);

export default router;
