import api from "./axios";

/**
 * UC-096: Job Search Performance Dashboard API
 */

/**
 * Get comprehensive performance dashboard data
 * @param {Object} options - Query options
 * @param {string} [options.startDate] - Start date for filtering (ISO string)
 * @param {string} [options.endDate] - End date for filtering (ISO string)
 * @param {string} [options.period] - Period: 'week' | 'month' | 'quarter' | 'year' | 'all'
 */
export const getPerformanceDashboard = async (options = {}) => {
  const params = new URLSearchParams();
  if (options.startDate) params.append('startDate', options.startDate);
  if (options.endDate) params.append('endDate', options.endDate);
  if (options.period) params.append('period', options.period);
  
  const queryString = params.toString();
  const url = `/api/performance-dashboard${queryString ? `?${queryString}` : ''}`;
  
  const response = await api.get(url);
  return response.data;
};

/**
 * Get user's search goals
 */
export const getSearchGoals = async () => {
  const response = await api.get('/api/performance-dashboard/goals');
  return response.data;
};

/**
 * Update user's search goals
 * @param {Object} goals - Goals object
 * @param {Object} goals.weekly - Weekly goals
 * @param {Object} goals.monthly - Monthly goals
 * @param {Object} goals.overall - Overall targets
 */
export const updateSearchGoals = async (goals) => {
  const response = await api.put('/api/performance-dashboard/goals', { goals });
  return response.data;
};

/**
 * Get detailed trend analysis
 * @param {string} [granularity='weekly'] - 'daily' | 'weekly' | 'monthly'
 */
export const getTrendAnalysis = async (granularity = 'weekly') => {
  const response = await api.get(`/api/performance-dashboard/trends?granularity=${granularity}`);
  return response.data;
};
