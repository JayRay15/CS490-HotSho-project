import api, { retryRequest } from "./axios";

/**
 * UC-067: Salary Research and Benchmarking API
 * 
 * Frontend API service for salary research features including:
 * - Market salary data and benchmarks
 * - Salary comparison across companies
 * - Negotiation recommendations
 * - Total compensation analysis
 * - Export salary reports
 */

/**
 * Get comprehensive salary research for a specific job
 * @param {string} jobId - Job ID to research
 * @returns {Promise} Salary research data
 */
export const getSalaryResearch = (jobId) =>
  retryRequest(() => api.get(`/api/salary/research/${jobId}`));

/**
 * Compare salaries across multiple jobs
 * @param {string[]} jobIds - Array of job IDs to compare
 * @returns {Promise} Salary comparison data
 */
export const compareSalaries = (jobIds) => {
  const jobIdsParam = Array.isArray(jobIds) ? jobIds.join(',') : jobIds;
  return retryRequest(() => api.get(`/api/salary/compare?jobIds=${jobIdsParam}`));
};

/**
 * Get general salary benchmarks by filters
 * @param {Object} filters - Filter parameters
 * @param {string} filters.industry - Industry name
 * @param {string} filters.experienceLevel - Experience level (Entry, Mid, Senior, Executive)
 * @param {string} filters.location - Location name
 * @returns {Promise} Salary benchmarks data
 */
export const getSalaryBenchmarks = (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.industry) params.append('industry', filters.industry);
  if (filters.experienceLevel) params.append('experienceLevel', filters.experienceLevel);
  if (filters.location) params.append('location', filters.location);
  
  const queryString = params.toString();
  return retryRequest(() => api.get(`/api/salary/benchmarks${queryString ? '?' + queryString : ''}`));
};

/**
 * Export salary research report
 * @param {string} jobId - Job ID to export report for
 * @param {string} format - Export format ('json' or 'markdown')
 * @returns {Promise} Export data with content and filename
 */
export const exportSalaryReport = (jobId, format = 'json') =>
  retryRequest(() => api.post('/api/salary/export', { jobId, format }));

/**
 * ========================================================================
 * UC-083: SALARY NEGOTIATION PREPARATION API
 * ========================================================================
 */

/**
 * Create new salary negotiation preparation
 * @param {Object} data - Negotiation data
 * @param {string} data.jobId - Job ID
 * @param {number} data.targetSalary - Target salary
 * @param {number} data.minimumAcceptable - Minimum acceptable salary
 * @param {number} data.idealSalary - Ideal salary (optional)
 * @returns {Promise} Created negotiation data
 */
export const createNegotiation = (data) =>
  retryRequest(() => api.post('/api/salary/negotiation', data));

/**
 * Get negotiation preparation for a specific job
 * @param {string} jobId - Job ID
 * @returns {Promise} Negotiation data
 */
export const getNegotiation = (jobId) =>
  retryRequest(() => api.get(`/api/salary/negotiation/${jobId}`));

/**
 * Get all negotiations for the user
 * @returns {Promise} All negotiations data
 */
export const getAllNegotiations = () =>
  retryRequest(() => api.get('/api/salary/negotiations'));

/**
 * Generate talking points for negotiation
 * @param {string} negotiationId - Negotiation ID
 * @param {Object} data - User achievements, skills, education, certifications
 * @returns {Promise} Generated talking points
 */
export const generateTalkingPoints = (negotiationId, data) =>
  retryRequest(() => api.post(`/api/salary/negotiation/${negotiationId}/talking-points`, data));

/**
 * Generate negotiation script for a scenario
 * @param {string} negotiationId - Negotiation ID
 * @param {Object} data - Script parameters
 * @param {string} data.scenario - Scenario type
 * @param {string} data.customScenario - Custom scenario description (if scenario is 'Custom')
 * @returns {Promise} Generated script
 */
export const generateNegotiationScript = (negotiationId, data) =>
  retryRequest(() => api.post(`/api/salary/negotiation/${negotiationId}/script`, data));

/**
 * Add an offer to the negotiation
 * @param {string} negotiationId - Negotiation ID
 * @param {Object} offerData - Offer details
 * @returns {Promise} Offer confirmation
 */
export const addOffer = (negotiationId, offerData) =>
  retryRequest(() => api.post(`/api/salary/negotiation/${negotiationId}/offer`, offerData));

/**
 * Evaluate current offer and get counteroffer recommendations
 * @param {string} negotiationId - Negotiation ID
 * @param {Object} data - Current offer data
 * @returns {Promise} Counteroffer evaluation and suggestions
 */
export const evaluateCounteroffer = (negotiationId, data) =>
  retryRequest(() => api.post(`/api/salary/negotiation/${negotiationId}/counteroffer`, data));

/**
 * Add confidence-building exercises
 * @param {string} negotiationId - Negotiation ID
 * @param {Object} data - Exercise parameters
 * @param {string} data.exerciseType - Type of exercise
 * @param {string} data.customDescription - Custom exercise description (if type is 'Custom')
 * @returns {Promise} Added exercises
 */
export const addConfidenceExercise = (negotiationId, data) =>
  retryRequest(() => api.post(`/api/salary/negotiation/${negotiationId}/confidence-exercise`, data));

/**
 * Mark an exercise as completed
 * @param {string} negotiationId - Negotiation ID
 * @param {string} exerciseId - Exercise ID
 * @param {Object} data - Completion data
 * @param {string} data.notes - Optional notes
 * @returns {Promise} Updated exercise
 */
export const completeExercise = (negotiationId, exerciseId, data) =>
  retryRequest(() => api.put(`/api/salary/negotiation/${negotiationId}/exercise/${exerciseId}`, data));

/**
 * Complete the negotiation with final outcome
 * @param {string} negotiationId - Negotiation ID
 * @param {Object} outcomeData - Final outcome data
 * @returns {Promise} Completed negotiation with outcome
 */
export const completeNegotiation = (negotiationId, outcomeData) =>
  retryRequest(() => api.post(`/api/salary/negotiation/${negotiationId}/complete`, outcomeData));

/**
 * Get timing strategy recommendations
 * @param {string} negotiationId - Negotiation ID
 * @returns {Promise} Timing strategies and recommendations
 */
export const getTimingStrategy = (negotiationId) =>
  retryRequest(() => api.get(`/api/salary/negotiation/${negotiationId}/timing`));

/**
 * ========================================================================
 * UC-100: SALARY PROGRESSION AND MARKET POSITIONING API
 * ========================================================================
 */

/**
 * Track a salary offer
 * @param {Object} offerData - Salary offer details
 * @returns {Promise} Tracked offer data with analytics
 */
export const trackSalaryOffer = (offerData) =>
  retryRequest(() => api.post('/api/salary/progression/offer', offerData));

/**
 * Get complete salary progression data
 * @returns {Promise} Complete progression history and analytics
 */
export const getSalaryProgression = () =>
  retryRequest(() => api.get('/api/salary/progression'));

/**
 * Get salary progression analytics
 * @returns {Promise} Comprehensive analytics on salary progression
 */
export const getProgressionAnalytics = () =>
  retryRequest(() => api.get('/api/salary/progression/analytics'));

/**
 * Add career milestone
 * @param {Object} milestoneData - Career milestone details
 * @returns {Promise} Added milestone
 */
export const addCareerMilestone = (milestoneData) =>
  retryRequest(() => api.post('/api/salary/progression/milestone', milestoneData));

/**
 * Add market positioning assessment
 * @param {Object} assessmentData - Market assessment details
 * @returns {Promise} Added assessment
 */
export const addMarketAssessment = (assessmentData) =>
  retryRequest(() => api.post('/api/salary/progression/market-assessment', assessmentData));

/**
 * Generate advancement recommendations
 * @returns {Promise} Career advancement recommendations
 */
export const generateAdvancementRecommendations = () =>
  retryRequest(() => api.post('/api/salary/progression/recommendations'));

/**
 * Track negotiation outcome
 * @param {Object} data - Negotiation outcome data
 * @param {string} data.negotiationId - Negotiation ID
 * @param {Object} data.outcome - Outcome details
 * @returns {Promise} Tracked outcome with success metrics
 */
export const trackNegotiationOutcome = (data) =>
  retryRequest(() => api.post('/api/salary/progression/negotiation-outcome', data));
