import api from './axios';

/**
 * Get or create market intelligence data for user
 * @returns {Promise} Market intelligence data
 */
export const getMarketIntelligence = async () => {
  const response = await api.get('/api/market-intelligence');
  return response.data;
};

/**
 * Update user preferences for market intelligence
 * @param {Object} preferences - User preferences
 * @returns {Promise} Updated preferences
 */
export const updatePreferences = async (preferences) => {
  const response = await api.put('/api/market-intelligence/preferences', preferences);
  return response.data;
};

/**
 * Get job market trends
 * @param {Object} params - Query parameters (industry, location)
 * @returns {Promise} Job market trends data
 */
export const getJobMarketTrends = async (params = {}) => {
  const response = await api.get('/api/market-intelligence/job-trends', { params });
  return response.data;
};

/**
 * Get skill demand analysis
 * @param {Object} params - Query parameters (category, trendType)
 * @returns {Promise} Skill demand data
 */
export const getSkillDemand = async (params = {}) => {
  const response = await api.get('/api/market-intelligence/skill-demand', { params });
  return response.data;
};

/**
 * Get salary trends
 * @param {Object} params - Query parameters (jobTitle, industry, location, experienceLevel)
 * @returns {Promise} Salary trends data
 */
export const getSalaryTrends = async (params = {}) => {
  const response = await api.get('/api/market-intelligence/salary-trends', { params });
  return response.data;
};

/**
 * Get company growth patterns
 * @param {Object} params - Query parameters (industry, hiringTrend)
 * @returns {Promise} Company growth data
 */
export const getCompanyGrowth = async (params = {}) => {
  const response = await api.get('/api/market-intelligence/company-growth', { params });
  return response.data;
};

/**
 * Get industry insights and disruption analysis
 * @param {Object} params - Query parameters (industry)
 * @returns {Promise} Industry insights data
 */
export const getIndustryInsights = async (params = {}) => {
  const response = await api.get('/api/market-intelligence/industry-insights', { params });
  return response.data;
};

/**
 * Get personalized recommendations
 * @param {Object} params - Query parameters (type, priority, status)
 * @returns {Promise} Recommendations data
 */
export const getRecommendations = async (params = {}) => {
  const response = await api.get('/api/market-intelligence/recommendations', { params });
  return response.data;
};

/**
 * Update recommendation status
 * @param {string} recommendationId - Recommendation ID
 * @param {string} status - New status
 * @returns {Promise} Updated recommendation
 */
export const updateRecommendation = async (recommendationId, status) => {
  const response = await api.put(`/api/market-intelligence/recommendations/${recommendationId}`, { status });
  return response.data;
};

/**
 * Get market opportunities
 * @param {Object} params - Query parameters (industry, location, urgency)
 * @returns {Promise} Market opportunities data
 */
export const getMarketOpportunities = async (params = {}) => {
  const response = await api.get('/api/market-intelligence/opportunities', { params });
  return response.data;
};

/**
 * Get competitive landscape analysis
 * @returns {Promise} Competitive landscape data
 */
export const getCompetitiveLandscape = async () => {
  const response = await api.get('/api/market-intelligence/competitive-landscape');
  return response.data;
};

/**
 * Generate market intelligence report
 * @param {Object} options - Report options
 * @returns {Promise} Generated report
 */
export const generateMarketReport = async (options = {}) => {
  const response = await api.post('/api/market-intelligence/generate-report', options);
  return response.data;
};
