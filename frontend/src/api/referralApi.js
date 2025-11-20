import api from './axios';

/**
 * Referral API Service
 * Handles all API calls related to referral requests
 */

/**
 * Create a new referral request
 * @param {Object} referralData - The referral data
 * @returns {Promise<Object>} The created referral
 */
export const createReferral = async (referralData) => {
  const response = await api.post('/api/referrals', referralData);
  return response.data;
};

/**
 * Get all referrals for the authenticated user
 * @param {Object} filters - Optional filters (status, jobId, contactId)
 * @returns {Promise<Array>} List of referrals
 */
export const getReferrals = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const url = params.toString() ? `/api/referrals?${params.toString()}` : '/api/referrals';
  const response = await api.get(url);
  return response.data;
};

/**
 * Get a single referral by ID
 * @param {string} referralId - The referral ID
 * @returns {Promise<Object>} The referral details
 */
export const getReferralById = async (referralId) => {
  const response = await api.get(`/api/referrals/${referralId}`);
  return response.data;
};

/**
 * Update a referral
 * @param {string} referralId - The referral ID
 * @param {Object} updates - The fields to update
 * @returns {Promise<Object>} The updated referral
 */
export const updateReferral = async (referralId, updates) => {
  const response = await api.put(`/api/referrals/${referralId}`, updates);
  return response.data;
};

/**
 * Delete a referral
 * @param {string} referralId - The referral ID
 * @returns {Promise<Object>} Success message
 */
export const deleteReferral = async (referralId) => {
  const response = await api.delete(`/api/referrals/${referralId}`);
  return response.data;
};

/**
 * Generate AI-powered referral template
 * @param {Object} data - Job ID, Contact ID, and tone
 * @returns {Promise<Object>} Generated template with guidance
 */
export const generateReferralTemplate = async ({ jobId, contactId, tone = 'professional' }) => {
  const response = await api.post('/api/referrals/generate-template', {
    jobId,
    contactId,
    tone
  });
  return response.data;
};

/**
 * Get referral analytics
 * @returns {Promise<Object>} Analytics data
 */
export const getReferralAnalytics = async () => {
  const response = await api.get('/api/referrals/analytics');
  return response.data;
};
