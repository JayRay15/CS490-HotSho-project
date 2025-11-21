import api, { retryRequest } from "./axios";

/**
 * UC-083: Salary Negotiation API Service
 * 
 * Frontend API service for salary negotiation features including:
 * - Creating and managing negotiation sessions
 * - Generating personalized talking points
 * - Accessing negotiation scenarios and scripts
 * - Evaluating counteroffers
 * - Tracking conversations and outcomes
 * - Monitoring salary progression
 */

/**
 * Create a new negotiation session
 * @param {Object} data - Negotiation data
 * @param {string} data.jobId - Optional job ID to link negotiation to
 * @param {Object} data.offerDetails - Offer details (company, position, initial offer, etc.)
 * @param {Object} data.context - Personal context (experience, skills, achievements, etc.)
 * @returns {Promise} Created negotiation session
 */
export const createNegotiation = (data) =>
  retryRequest(() => api.post('/api/negotiations', data));

/**
 * Get all negotiation sessions for current user
 * @param {Object} params - Query parameters
 * @param {string} params.status - Filter by status (in_progress, accepted, declined, etc.)
 * @param {boolean} params.includeArchived - Include archived negotiations
 * @returns {Promise} List of negotiation sessions
 */
export const getNegotiations = (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.status) queryParams.append('status', params.status);
  if (params.includeArchived) queryParams.append('includeArchived', 'true');
  
  const queryString = queryParams.toString();
  return retryRequest(() => api.get(`/api/negotiations${queryString ? '?' + queryString : ''}`));
};

/**
 * Get specific negotiation session by ID
 * @param {string} id - Negotiation ID
 * @returns {Promise} Negotiation session details
 */
export const getNegotiationById = (id) =>
  retryRequest(() => api.get(`/api/negotiations/${id}`));

/**
 * Update negotiation session
 * @param {string} id - Negotiation ID
 * @param {Object} updates - Fields to update
 * @returns {Promise} Updated negotiation session
 */
export const updateNegotiation = (id, updates) =>
  retryRequest(() => api.put(`/api/negotiations/${id}`, updates));

/**
 * Delete negotiation session
 * @param {string} id - Negotiation ID
 * @returns {Promise} Deletion confirmation
 */
export const deleteNegotiation = (id) =>
  retryRequest(() => api.delete(`/api/negotiations/${id}`));

/**
 * Generate or regenerate talking points for negotiation
 * @param {string} id - Negotiation ID
 * @param {Object} additionalContext - Additional context to consider
 * @returns {Promise} Generated talking points
 */
export const generateTalkingPoints = (id, additionalContext = {}) =>
  retryRequest(() => api.post(`/api/negotiations/${id}/talking-points`, { additionalContext }));

/**
 * Add a counteroffer to negotiation
 * @param {string} id - Negotiation ID
 * @param {Object} counterofferData - Counteroffer details
 * @returns {Promise} Added counteroffer with evaluation
 */
export const addCounteroffer = (id, counterofferData) =>
  retryRequest(() => api.post(`/api/negotiations/${id}/counteroffer`, counterofferData));

/**
 * Log a negotiation conversation
 * @param {string} id - Negotiation ID
 * @param {Object} conversationData - Conversation details
 * @returns {Promise} Logged conversation
 */
export const addConversation = (id, conversationData) =>
  retryRequest(() => api.post(`/api/negotiations/${id}/conversation`, conversationData));

/**
 * Get salary progression history
 * @returns {Promise} Salary progression data and metrics
 */
export const getSalaryProgression = () =>
  retryRequest(() => api.get('/api/negotiations/user/progression'));

/**
 * Get negotiation analytics
 * @returns {Promise} Analytics including success rate, confidence, satisfaction
 */
export const getNegotiationAnalytics = () =>
  retryRequest(() => api.get('/api/negotiations/user/analytics'));

/**
 * Helper: Update specific field in negotiation
 * @param {string} id - Negotiation ID
 * @param {string} field - Field path (e.g., 'confidenceLevel', 'outcome.status')
 * @param {any} value - New value
 * @returns {Promise} Updated negotiation
 */
export const updateNegotiationField = (id, field, value) => {
  const updates = {};
  const keys = field.split('.');
  let current = updates;
  
  for (let i = 0; i < keys.length - 1; i++) {
    current[keys[i]] = {};
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
  
  return updateNegotiation(id, updates);
};

/**
 * Helper: Mark preparation checklist item as completed
 * @param {string} id - Negotiation ID
 * @param {number} itemIndex - Index of checklist item
 * @param {boolean} completed - Completion status
 * @returns {Promise} Updated negotiation
 */
export const updateChecklistItem = async (id, itemIndex, completed) => {
  const negotiation = await getNegotiationById(id);
  const checklist = negotiation.data.negotiation.preparationChecklist;
  checklist[itemIndex].isCompleted = completed;
  return updateNegotiation(id, { preparationChecklist: checklist });
};

/**
 * Helper: Mark confidence exercise as completed
 * @param {string} id - Negotiation ID
 * @param {number} exerciseIndex - Index of exercise
 * @param {string} reflection - Optional reflection notes
 * @returns {Promise} Updated negotiation
 */
export const completeConfidenceExercise = async (id, exerciseIndex, reflection = '') => {
  const negotiation = await getNegotiationById(id);
  const exercises = negotiation.data.negotiation.confidenceExercises;
  exercises[exerciseIndex].isCompleted = true;
  exercises[exerciseIndex].completedDate = new Date();
  if (reflection) {
    exercises[exerciseIndex].reflection = reflection;
  }
  return updateNegotiation(id, { confidenceExercises: exercises });
};

/**
 * Helper: Mark scenario as practiced
 * @param {string} id - Negotiation ID
 * @param {number} scenarioIndex - Index of scenario
 * @returns {Promise} Updated negotiation
 */
export const markScenarioPracticed = async (id, scenarioIndex) => {
  const negotiation = await getNegotiationById(id);
  const scenarios = negotiation.data.negotiation.scenarios;
  scenarios[scenarioIndex].isPracticed = true;
  return updateNegotiation(id, { scenarios });
};

/**
 * Helper: Mark talking point as used
 * @param {string} id - Negotiation ID
 * @param {number} pointIndex - Index of talking point
 * @returns {Promise} Updated negotiation
 */
export const markTalkingPointUsed = async (id, pointIndex) => {
  const negotiation = await getNegotiationById(id);
  const talkingPoints = negotiation.data.negotiation.talkingPoints;
  talkingPoints[pointIndex].isUsed = true;
  return updateNegotiation(id, { talkingPoints });
};
