import express from 'express';
import { checkJwt } from '../middleware/checkJwt.js';
import {
  createABTest,
  getABTests,
  getABTest,
  assignVersion,
  recordOutcome,
  getTestResults,
  declareWinner,
  updateTestStatus,
  archiveLosingVersion,
  deleteABTest,
  syncFromJobs,
} from '../controllers/abTestController.js';

const router = express.Router();

// ============================================================================
// UC-120: A/B Testing Routes
// ============================================================================

/**
 * @route   POST /api/ab-tests
 * @desc    Create a new A/B test experiment
 * @access  Protected
 */
router.post('/', checkJwt, createABTest);

/**
 * @route   GET /api/ab-tests
 * @desc    Get all A/B tests for user
 * @access  Protected
 */
router.get('/', checkJwt, getABTests);

/**
 * @route   POST /api/ab-tests/sync-from-jobs
 * @desc    Sync A/B test metrics from job applications
 * @access  Protected
 */
router.post('/sync-from-jobs', checkJwt, syncFromJobs);

/**
 * @route   GET /api/ab-tests/:id
 * @desc    Get a specific A/B test with details
 * @access  Protected
 */
router.get('/:id', checkJwt, getABTest);

/**
 * @route   POST /api/ab-tests/:id/assign
 * @desc    Get a random version assignment for a new application
 * @access  Protected
 */
router.post('/:id/assign', checkJwt, assignVersion);

/**
 * @route   POST /api/ab-tests/:id/record-outcome
 * @desc    Record the outcome of an application for a version
 * @access  Protected
 */
router.post('/:id/record-outcome', checkJwt, recordOutcome);

/**
 * @route   GET /api/ab-tests/:id/results
 * @desc    Get detailed results and statistical analysis
 * @access  Protected
 */
router.get('/:id/results', checkJwt, getTestResults);

/**
 * @route   PATCH /api/ab-tests/:id/declare-winner
 * @desc    Declare a winning version
 * @access  Protected
 */
router.patch('/:id/declare-winner', checkJwt, declareWinner);

/**
 * @route   PATCH /api/ab-tests/:id/status
 * @desc    Update test status (pause, resume, archive)
 * @access  Protected
 */
router.patch('/:id/status', checkJwt, updateTestStatus);

/**
 * @route   POST /api/ab-tests/:id/archive-loser
 * @desc    Archive the underperforming version
 * @access  Protected
 */
router.post('/:id/archive-loser', checkJwt, archiveLosingVersion);

/**
 * @route   DELETE /api/ab-tests/:id
 * @desc    Delete an A/B test
 * @access  Protected
 */
router.delete('/:id', checkJwt, deleteABTest);

export default router;
