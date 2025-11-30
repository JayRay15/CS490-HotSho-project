import api from "./axios";

/**
 * UC-089: LinkedIn Profile Integration & Networking Guidance API
 */

/**
 * Save LinkedIn profile URL
 * @param {string} linkedinUrl - The LinkedIn profile URL
 */
export const saveLinkedInProfile = async (linkedinUrl) => {
  const response = await api.post('/api/linkedin/save-profile', { linkedinUrl });
  return response.data;
};

/**
 * Get current user's LinkedIn profile info
 */
export const getLinkedInProfile = async () => {
  const response = await api.get('/api/linkedin/profile');
  return response.data;
};

/**
 * Generate networking message templates
 * @param {Object} options - Template generation options
 * @param {string} options.templateType - Type: 'connectionRequest' | 'followUp' | 'informationalInterview' | 'referral' | 'thankYou'
 * @param {string} [options.targetRole] - Target role/position
 * @param {string} [options.targetCompany] - Target company name
 * @param {string} [options.context] - Additional context
 */
export const generateNetworkingTemplates = async (options) => {
  const response = await api.post('/api/linkedin/networking-templates', options);
  return response.data;
};

/**
 * Get profile optimization suggestions
 */
export const getOptimizationSuggestions = async () => {
  const response = await api.get('/api/linkedin/optimization-suggestions');
  return response.data;
};

/**
 * Get content sharing strategies
 */
export const getContentStrategies = async () => {
  const response = await api.get('/api/linkedin/content-strategies');
  return response.data;
};

/**
 * Create a new networking campaign
 * @param {Object} campaign - Campaign data
 * @param {string} campaign.name - Campaign name
 * @param {string[]} [campaign.targetCompanies] - Target companies
 * @param {string[]} [campaign.targetRoles] - Target roles
 * @param {string} [campaign.goals] - Campaign goals
 * @param {number} [campaign.duration] - Duration in days
 * @param {string} [campaign.notes] - Additional notes
 */
export const createNetworkingCampaign = async (campaign) => {
  const response = await api.post('/api/linkedin/campaigns', campaign);
  return response.data;
};

/**
 * Get all networking campaigns
 */
export const getNetworkingCampaigns = async () => {
  const response = await api.get('/api/linkedin/campaigns');
  return response.data;
};

/**
 * Update campaign metrics and status
 * @param {string} campaignId - Campaign ID
 * @param {Object} updates - Updates to apply
 * @param {Object} [updates.metrics] - Updated metrics
 * @param {string} [updates.status] - New status
 * @param {string} [updates.notes] - Updated notes
 */
export const updateCampaignMetrics = async (campaignId, updates) => {
  const response = await api.put(`/api/linkedin/campaigns/${campaignId}`, updates);
  return response.data;
};

/**
 * Delete a networking campaign
 * @param {string} campaignId - Campaign ID to delete
 */
export const deleteCampaign = async (campaignId) => {
  const response = await api.delete(`/api/linkedin/campaigns/${campaignId}`);
  return response.data;
};
