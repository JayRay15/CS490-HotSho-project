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
