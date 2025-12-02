import api from "./axios";

/**
 * UC-097: Application Success Rate Analysis API
 */

/**
 * Get comprehensive application success analysis
 * Includes industry, company size, role type, methods, patterns, materials, and timing
 */
export const getSuccessAnalysis = async () => {
  const response = await api.get('/api/application-success/analysis');
  return response.data;
};

/**
 * Get success patterns and correlations
 */
export const getSuccessPatterns = async () => {
  const response = await api.get('/api/application-success/patterns');
  return response.data;
};

/**
 * Get personalized optimization recommendations
 */
export const getOptimizationRecommendations = async () => {
  const response = await api.get('/api/application-success/recommendations');
  return response.data;
};

/**
 * Get timing analysis for optimal application submission
 */
export const getTimingAnalysis = async () => {
  const response = await api.get('/api/application-success/timing');
  return response.data;
};

/**
 * Get analysis of resume and cover letter impact on success
 */
export const getMaterialsImpact = async () => {
  const response = await api.get('/api/application-success/materials-impact');
  return response.data;
};

// ============================================================================
// UC-105: Success Pattern Recognition API
// ============================================================================

/**
 * Get success prediction for a potential application
 * @param {Object} params - Prediction parameters
 * @param {string} params.industry - Target industry
 * @param {string} params.companySize - Target company size
 * @param {string} params.roleType - Target role type
 */
export const getSuccessPrediction = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.industry) queryParams.append('industry', params.industry);
  if (params.companySize) queryParams.append('companySize', params.companySize);
  if (params.roleType) queryParams.append('roleType', params.roleType);

  const query = queryParams.toString();
  const response = await api.get(`/api/application-success/prediction${query ? `?${query}` : ''}`);
  return response.data;
};

/**
 * Get pattern evolution and strategy adaptation over time
 */
export const getPatternEvolution = async () => {
  const response = await api.get('/api/application-success/evolution');
  return response.data;
};
