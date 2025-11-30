import api from './axios';

/**
 * UC-094: Networking Campaign Management API
 * 
 * API functions for managing targeted networking campaigns.
 */

// ============================================================================
// Campaign CRUD Operations
// ============================================================================

/**
 * Create a new networking campaign
 * @param {Object} campaignData - Campaign data
 * @returns {Promise<Object>} Created campaign
 */
export const createCampaign = async (campaignData) => {
  const response = await api.post('/api/networking-campaigns', campaignData);
  return response.data;
};

/**
 * Get all campaigns with optional filters
 * @param {Object} params - Query parameters
 * @param {string} [params.status] - Filter by status
 * @param {string} [params.campaignType] - Filter by campaign type
 * @param {number} [params.page=1] - Page number
 * @param {number} [params.limit=10] - Items per page
 * @returns {Promise<Object>} Paginated campaigns list with summary
 */
export const getCampaigns = async (params = {}) => {
  const response = await api.get('/api/networking-campaigns', { params });
  return response.data;
};

/**
 * Get a single campaign by ID
 * @param {string} campaignId - Campaign ID
 * @returns {Promise<Object>} Campaign details
 */
export const getCampaign = async (campaignId) => {
  const response = await api.get(`/api/networking-campaigns/${campaignId}`);
  return response.data;
};

/**
 * Update a campaign
 * @param {string} campaignId - Campaign ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<Object>} Updated campaign
 */
export const updateCampaign = async (campaignId, updates) => {
  const response = await api.put(`/api/networking-campaigns/${campaignId}`, updates);
  return response.data;
};

/**
 * Delete a campaign
 * @param {string} campaignId - Campaign ID
 * @returns {Promise<Object>} Deletion confirmation
 */
export const deleteCampaign = async (campaignId) => {
  const response = await api.delete(`/api/networking-campaigns/${campaignId}`);
  return response.data;
};

// ============================================================================
// Outreach Management
// ============================================================================

/**
 * Add an outreach to a campaign
 * @param {string} campaignId - Campaign ID
 * @param {Object} outreachData - Outreach data
 * @returns {Promise<Object>} Created outreach with updated metrics
 */
export const addOutreach = async (campaignId, outreachData) => {
  const response = await api.post(`/api/networking-campaigns/${campaignId}/outreach`, outreachData);
  return response.data;
};

/**
 * Update an outreach status
 * @param {string} campaignId - Campaign ID
 * @param {string} outreachId - Outreach ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<Object>} Updated outreach with metrics
 */
export const updateOutreach = async (campaignId, outreachId, updates) => {
  const response = await api.put(`/api/networking-campaigns/${campaignId}/outreach/${outreachId}`, updates);
  return response.data;
};

/**
 * Delete an outreach
 * @param {string} campaignId - Campaign ID
 * @param {string} outreachId - Outreach ID
 * @returns {Promise<Object>} Deletion confirmation with updated metrics
 */
export const deleteOutreach = async (campaignId, outreachId) => {
  const response = await api.delete(`/api/networking-campaigns/${campaignId}/outreach/${outreachId}`);
  return response.data;
};

// ============================================================================
// A/B Testing
// ============================================================================

/**
 * Create an A/B test for a campaign
 * @param {string} campaignId - Campaign ID
 * @param {Object} testData - A/B test data
 * @returns {Promise<Object>} Created A/B test
 */
export const createABTest = async (campaignId, testData) => {
  const response = await api.post(`/api/networking-campaigns/${campaignId}/ab-test`, testData);
  return response.data;
};

/**
 * Complete an A/B test and determine winner
 * @param {string} campaignId - Campaign ID
 * @param {string} testId - Test ID
 * @returns {Promise<Object>} Completed test with analysis
 */
export const completeABTest = async (campaignId, testId) => {
  const response = await api.put(`/api/networking-campaigns/${campaignId}/ab-test/${testId}/complete`);
  return response.data;
};

// ============================================================================
// Analytics
// ============================================================================

/**
 * Get analytics for a specific campaign
 * @param {string} campaignId - Campaign ID
 * @returns {Promise<Object>} Campaign analytics
 */
export const getCampaignAnalytics = async (campaignId) => {
  const response = await api.get(`/api/networking-campaigns/${campaignId}/analytics`);
  return response.data;
};

/**
 * Get overview analytics across all campaigns
 * @returns {Promise<Object>} Overview analytics with recommendations
 */
export const getOverviewAnalytics = async () => {
  const response = await api.get('/api/networking-campaigns/analytics/overview');
  return response.data;
};

// ============================================================================
// Job Integration
// ============================================================================

/**
 * Link a job to a campaign
 * @param {string} campaignId - Campaign ID
 * @param {string} jobId - Job ID to link
 * @returns {Promise<Object>} Updated linked jobs
 */
export const linkJobToCampaign = async (campaignId, jobId) => {
  const response = await api.post(`/api/networking-campaigns/${campaignId}/link-job`, { jobId });
  return response.data;
};

export default {
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
};
