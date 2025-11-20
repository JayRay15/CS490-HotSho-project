import api, { retryRequest } from './axios';

/**
 * Submit a practice interview response and get AI feedback
 * @param {Object} data - Response data
 * @returns {Promise} Response with feedback
 */
export const submitInterviewResponse = (data) =>
    retryRequest(() => api.post('/api/interview-coaching/responses', data));

/**
 * Get all interview responses for the user
 * @param {Object} params - Query parameters
 * @returns {Promise} List of responses
 */
export const getInterviewResponses = (params = {}) =>
    retryRequest(() => api.get('/api/interview-coaching/responses', { params }));

/**
 * Get a specific interview response by ID
 * @param {string} id - Response ID
 * @returns {Promise} Interview response details
 */
export const getInterviewResponseById = (id) =>
    retryRequest(() => api.get(`/api/interview-coaching/responses/${id}`));

/**
 * Update an interview response (add notes, tags, or archive)
 * @param {string} id - Response ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise} Updated response
 */
export const updateInterviewResponse = (id, updates) =>
    retryRequest(() => api.patch(`/api/interview-coaching/responses/${id}`, updates));

/**
 * Delete an interview response
 * @param {string} id - Response ID
 * @returns {Promise} Deletion confirmation
 */
export const deleteInterviewResponse = (id) =>
    retryRequest(() => api.delete(`/api/interview-coaching/responses/${id}`));

/**
 * Get practice statistics for the user
 * @returns {Promise} Practice statistics and improvement metrics
 */
export const getPracticeStats = () =>
    retryRequest(() => api.get('/api/interview-coaching/stats'));

/**
 * Generate sample interview questions
 * @param {Object} data - Generation parameters
 * @returns {Promise} Generated questions
 */
export const generateInterviewQuestions = (data) =>
    retryRequest(() => api.post('/api/interview-coaching/questions/generate', data));

/**
 * Compare multiple versions of the same response
 * @param {string} id - Response ID
 * @returns {Promise} Version comparison data
 */
export const compareResponseVersions = (id) =>
    retryRequest(() => api.get(`/api/interview-coaching/responses/${id}/compare`));
