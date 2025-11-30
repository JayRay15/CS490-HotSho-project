import express from 'express';
import { checkJwt } from '../middleware/checkJwt.js';
import {
  createCampaign,
  getCampaigns,
  getCampaign,
  updateCampaign,
  deleteCampaign,
  addOutreach,
  updateOutreach,
  deleteOutreach,
  createABTest,
  completeABTest,
  getCampaignAnalytics,
  getOverviewAnalytics,
  linkJobToCampaign
} from '../controllers/networkingCampaignController.js';

const router = express.Router();

// ============================================================================
// UC-094: Networking Campaign Management Routes
// ============================================================================

/**
 * @route   GET /api/networking-campaigns/analytics/overview
 * @desc    Get aggregate analytics across all campaigns
 * @access  Protected
 */
router.get('/analytics/overview', checkJwt, getOverviewAnalytics);

/**
 * @route   POST /api/networking-campaigns
 * @desc    Create a new networking campaign
 * @access  Protected
 */
router.post('/', checkJwt, createCampaign);

/**
 * @route   GET /api/networking-campaigns
 * @desc    Get all campaigns for user
 * @access  Protected
 * @query   status (optional) - Filter by status
 * @query   campaignType (optional) - Filter by campaign type
 * @query   page (optional) - Page number
 * @query   limit (optional) - Items per page
 */
router.get('/', checkJwt, getCampaigns);

/**
 * @route   GET /api/networking-campaigns/:id
 * @desc    Get single campaign by ID
 * @access  Protected
 */
router.get('/:id', checkJwt, getCampaign);

/**
 * @route   PUT /api/networking-campaigns/:id
 * @desc    Update campaign
 * @access  Protected
 */
router.put('/:id', checkJwt, updateCampaign);

/**
 * @route   DELETE /api/networking-campaigns/:id
 * @desc    Delete campaign
 * @access  Protected
 */
router.delete('/:id', checkJwt, deleteCampaign);

// ============================================================================
// Outreach Management Routes
// ============================================================================

/**
 * @route   POST /api/networking-campaigns/:id/outreach
 * @desc    Add outreach to campaign
 * @access  Protected
 */
router.post('/:id/outreach', checkJwt, addOutreach);

/**
 * @route   PUT /api/networking-campaigns/:id/outreach/:outreachId
 * @desc    Update outreach status
 * @access  Protected
 */
router.put('/:id/outreach/:outreachId', checkJwt, updateOutreach);

/**
 * @route   DELETE /api/networking-campaigns/:id/outreach/:outreachId
 * @desc    Delete outreach
 * @access  Protected
 */
router.delete('/:id/outreach/:outreachId', checkJwt, deleteOutreach);

// ============================================================================
// A/B Testing Routes
// ============================================================================

/**
 * @route   POST /api/networking-campaigns/:id/ab-test
 * @desc    Create A/B test for campaign
 * @access  Protected
 */
router.post('/:id/ab-test', checkJwt, createABTest);

/**
 * @route   PUT /api/networking-campaigns/:id/ab-test/:testId/complete
 * @desc    Complete A/B test and determine winner
 * @access  Protected
 */
router.put('/:id/ab-test/:testId/complete', checkJwt, completeABTest);

// ============================================================================
// Analytics Routes
// ============================================================================

/**
 * @route   GET /api/networking-campaigns/:id/analytics
 * @desc    Get campaign performance analytics
 * @access  Protected
 */
router.get('/:id/analytics', checkJwt, getCampaignAnalytics);

// ============================================================================
// Job Integration Routes
// ============================================================================

/**
 * @route   POST /api/networking-campaigns/:id/link-job
 * @desc    Link job to campaign
 * @access  Protected
 */
router.post('/:id/link-job', checkJwt, linkJobToCampaign);

export default router;
