import express from 'express';
import { checkJwt } from '../middleware/checkJwt.js';
import {
  saveLinkedInProfile,
  getLinkedInProfile,
  generateNetworkingTemplates,
  getOptimizationSuggestions,
  getContentStrategies,
  createNetworkingCampaign,
  getNetworkingCampaigns,
  updateCampaignMetrics,
  deleteCampaign
} from '../controllers/linkedinController.js';

const router = express.Router();

// ============================================================================
// UC-089: LinkedIn Profile Integration & Networking Guidance Routes
// ============================================================================

/**
 * @route   POST /api/linkedin/save-profile
 * @desc    Save LinkedIn profile URL
 * @access  Protected
 */
router.post('/save-profile', checkJwt, saveLinkedInProfile);

/**
 * @route   GET /api/linkedin/profile
 * @desc    Get current user's LinkedIn profile info
 * @access  Protected
 */
router.get('/profile', checkJwt, getLinkedInProfile);

/**
 * @route   POST /api/linkedin/networking-templates
 * @desc    Generate networking message templates
 * @access  Protected
 * @body    { templateType: 'connectionRequest' | 'followUp' | 'informationalInterview' | 'referral' | 'thankYou', targetRole?, targetCompany?, context? }
 */
router.post('/networking-templates', checkJwt, generateNetworkingTemplates);

/**
 * @route   GET /api/linkedin/optimization-suggestions
 * @desc    Get profile optimization suggestions
 * @access  Protected
 */
router.get('/optimization-suggestions', checkJwt, getOptimizationSuggestions);

/**
 * @route   GET /api/linkedin/content-strategies
 * @desc    Get content sharing strategies
 * @access  Protected
 */
router.get('/content-strategies', checkJwt, getContentStrategies);

/**
 * @route   POST /api/linkedin/campaigns
 * @desc    Create a new networking campaign
 * @access  Protected
 * @body    { name, targetCompanies?, targetRoles?, goals?, duration?, notes? }
 */
router.post('/campaigns', checkJwt, createNetworkingCampaign);

/**
 * @route   GET /api/linkedin/campaigns
 * @desc    Get all networking campaigns
 * @access  Protected
 */
router.get('/campaigns', checkJwt, getNetworkingCampaigns);

/**
 * @route   PUT /api/linkedin/campaigns/:campaignId
 * @desc    Update campaign metrics and status
 * @access  Protected
 * @body    { metrics?: { connectionsSent?, connectionsAccepted?, messagesSent?, responses?, meetings? }, status?, notes? }
 */
router.put('/campaigns/:campaignId', checkJwt, updateCampaignMetrics);

/**
 * @route   DELETE /api/linkedin/campaigns/:campaignId
 * @desc    Delete a networking campaign
 * @access  Protected
 */
router.delete('/campaigns/:campaignId', checkJwt, deleteCampaign);

export default router;
