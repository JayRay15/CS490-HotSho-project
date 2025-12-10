import api from "./axios";

/**
 * UC-120: A/B Testing API
 * Manage A/B tests for resume and cover letter versions
 */

/**
 * Create a new A/B test experiment
 * @param {Object} data - Test configuration
 * @param {string} data.name - Test name
 * @param {string} data.description - Test description
 * @param {string} data.materialType - "resume" or "coverLetter"
 * @param {string[]} data.versionIds - Array of material IDs to test
 * @param {string[]} data.targetIndustries - Optional industries to target
 * @param {string[]} data.targetRoles - Optional roles to target
 * @param {number} data.minSampleSize - Minimum sample size (default 10)
 * @param {number} data.targetSampleSize - Target sample size (default 20)
 */
export const createABTest = async (data) => {
  const response = await api.post('/api/ab-tests', data);
  return response.data;
};

/**
 * Get all A/B tests for user
 * @param {Object} params - Optional filters
 * @param {string} params.status - Filter by status
 * @param {string} params.materialType - Filter by material type
 */
export const getABTests = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.status) queryParams.append('status', params.status);
  if (params.materialType) queryParams.append('materialType', params.materialType);
  
  const query = queryParams.toString();
  const response = await api.get(`/api/ab-tests${query ? `?${query}` : ''}`);
  return response.data;
};

/**
 * Get a specific A/B test with full details
 * @param {string} id - Test ID
 */
export const getABTest = async (id) => {
  const response = await api.get(`/api/ab-tests/${id}`);
  return response.data;
};

/**
 * Get a random version assignment for a new application
 * @param {string} id - Test ID
 */
export const assignVersion = async (id) => {
  const response = await api.post(`/api/ab-tests/${id}/assign`);
  return response.data;
};

/**
 * Record the outcome of an application for a specific version
 * @param {string} id - Test ID
 * @param {Object} data - Outcome data
 * @param {number} data.versionIndex - Index of the version (0 or 1)
 * @param {string} data.outcome - "response" | "interview" | "offer" | "rejection" | "noResponse"
 * @param {number} data.responseTimeDays - Days until response (optional)
 */
export const recordOutcome = async (id, data) => {
  const response = await api.post(`/api/ab-tests/${id}/record-outcome`, data);
  return response.data;
};

/**
 * Get detailed results and statistical analysis
 * @param {string} id - Test ID
 */
export const getTestResults = async (id) => {
  const response = await api.get(`/api/ab-tests/${id}/results`);
  return response.data;
};

/**
 * Declare a winning version
 * @param {string} id - Test ID
 * @param {Object} data - Winner data
 * @param {number} data.winningVersionIndex - Index of winning version
 * @param {string} data.reason - Reason for declaring winner
 */
export const declareWinner = async (id, data) => {
  const response = await api.patch(`/api/ab-tests/${id}/declare-winner`, data);
  return response.data;
};

/**
 * Update test status (pause, resume, archive)
 * @param {string} id - Test ID
 * @param {string} status - New status
 */
export const updateTestStatus = async (id, status) => {
  const response = await api.patch(`/api/ab-tests/${id}/status`, { status });
  return response.data;
};

/**
 * Archive the underperforming version
 * @param {string} id - Test ID
 * @param {number} losingVersionIndex - Index of version to archive
 */
export const archiveLosingVersion = async (id, losingVersionIndex) => {
  const response = await api.post(`/api/ab-tests/${id}/archive-loser`, { losingVersionIndex });
  return response.data;
};

/**
 * Delete an A/B test
 * @param {string} id - Test ID
 */
export const deleteABTest = async (id) => {
  const response = await api.delete(`/api/ab-tests/${id}`);
  return response.data;
};

/**
 * Sync A/B test metrics from job applications
 */
export const syncFromJobs = async () => {
  const response = await api.post('/api/ab-tests/sync-from-jobs');
  return response.data;
};
