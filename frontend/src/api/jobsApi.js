import apiClient from './apiClient';

/**
 * Get all jobs for the authenticated user
 * @param {Object} params - Query parameters (archived, status, etc.)
 * @returns {Promise} API response with jobs data
 */
export const getJobs = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const url = queryString ? `/jobs?${queryString}` : '/jobs';
  const response = await apiClient.get(url);
  
  // Handle both response formats
  if (response.data?.data?.jobs) {
    return { data: response.data.data.jobs };
  }
  return response;
};
