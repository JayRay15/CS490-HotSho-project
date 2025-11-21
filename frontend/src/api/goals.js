import api from './axios';

/**
 * Goal API Service
 * Handles all goal-related API requests
 */

/**
 * Get all goals for the current user
 * @param {Object} filters - Optional filters (status, category, type, priority, includeCompleted)
 * @returns {Promise<Object>} Goals array and count
 */
export const getGoals = async (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value);
    }
  });
  
  const queryString = params.toString();
  const url = `/api/goals${queryString ? `?${queryString}` : ''}`;
  
  const response = await api.get(url);
  return response.data;
};

/**
 * Get a single goal by ID
 * @param {string} goalId - Goal ID
 * @returns {Promise<Object>} Goal object
 */
export const getGoalById = async (goalId) => {
  const response = await api.get(`/api/goals/${goalId}`);
  return response.data;
};

/**
 * Create a new goal
 * @param {Object} goalData - Goal data following SMART criteria
 * @returns {Promise<Object>} Created goal
 */
export const createGoal = async (goalData) => {
  const response = await api.post('/api/goals', goalData);
  return response.data;
};

/**
 * Update an existing goal
 * @param {string} goalId - Goal ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated goal
 */
export const updateGoal = async (goalId, updates) => {
  const response = await api.put(`/api/goals/${goalId}`, updates);
  return response.data;
};

/**
 * Delete a goal
 * @param {string} goalId - Goal ID
 * @returns {Promise<Object>} Success message
 */
export const deleteGoal = async (goalId) => {
  const response = await api.delete(`/api/goals/${goalId}`);
  return response.data;
};

/**
 * Add progress update to a goal
 * @param {string} goalId - Goal ID
 * @param {number} value - New progress value
 * @param {string} notes - Optional notes
 * @param {Object} metrics - Optional custom metrics
 * @returns {Promise<Object>} Updated goal
 */
export const addProgressUpdate = async (goalId, value, notes = '', metrics = {}) => {
  const response = await api.post(`/api/goals/${goalId}/progress`, {
    value,
    notes,
    metrics
  });
  return response.data;
};

/**
 * Complete a milestone
 * @param {string} goalId - Goal ID
 * @param {string} milestoneId - Milestone ID
 * @returns {Promise<Object>} Updated goal
 */
export const completeMilestone = async (goalId, milestoneId) => {
  const response = await api.post(`/api/goals/${goalId}/milestones/${milestoneId}/complete`);
  return response.data;
};

/**
 * Get goal statistics for the current user
 * @returns {Promise<Object>} Goal statistics
 */
export const getGoalStats = async () => {
  const response = await api.get('/api/goals/stats');
  return response.data;
};

/**
 * Get AI-powered goal recommendations
 * @returns {Promise<Object>} Goal recommendations
 */
export const getGoalRecommendations = async () => {
  const response = await api.post('/api/goals/recommendations');
  return response.data;
};

/**
 * Analyze a goal's progress with AI
 * @param {string} goalId - Goal ID
 * @returns {Promise<Object>} Analysis with insights and recommendations
 */
export const analyzeGoal = async (goalId) => {
  const response = await api.post(`/api/goals/${goalId}/analyze`);
  return response.data;
};

/**
 * Celebrate a completed goal
 * @param {string} goalId - Goal ID
 * @returns {Promise<Object>} Celebration message and insights
 */
export const celebrateGoal = async (goalId) => {
  const response = await api.post(`/api/goals/${goalId}/celebrate`);
  return response.data;
};

/**
 * Get success patterns across all goals
 * @returns {Promise<Object>} Success patterns analysis
 */
export const getSuccessPatterns = async () => {
  const response = await api.get('/api/goals/patterns');
  return response.data;
};

/**
 * Link goal to jobs or applications
 * @param {string} goalId - Goal ID
 * @param {Array<string>} jobIds - Job IDs to link
 * @param {Array<string>} applicationIds - Application IDs to link
 * @returns {Promise<Object>} Updated goal
 */
export const linkGoalToEntities = async (goalId, jobIds = [], applicationIds = []) => {
  const response = await api.post(`/api/goals/${goalId}/link`, {
    jobIds,
    applicationIds
  });
  return response.data;
};

/**
 * Update goal impact metrics
 * @param {string} goalId - Goal ID
 * @param {Object} impactMetrics - Impact metrics to update
 * @returns {Promise<Object>} Updated goal
 */
export const updateImpactMetrics = async (goalId, impactMetrics) => {
  const response = await api.post(`/api/goals/${goalId}/impact`, {
    impactMetrics
  });
  return response.data;
};

/**
 * Get dashboard summary with active goals, statistics, and insights
 * @returns {Promise<Object>} Dashboard data
 */
export const getDashboardSummary = async () => {
  const response = await api.get('/api/goals/dashboard');
  return response.data;
};

/**
 * Helper function to validate SMART goal data
 * @param {Object} goalData - Goal data to validate
 * @returns {Object} Validation result with isValid and errors
 */
export const validateSmartGoal = (goalData) => {
  const errors = [];
  
  if (!goalData.title || goalData.title.trim().length === 0) {
    errors.push('Goal title is required');
  }
  
  if (!goalData.description || goalData.description.trim().length === 0) {
    errors.push('Goal description is required');
  }
  
  if (!goalData.specific || goalData.specific.trim().length === 0) {
    errors.push('Specific criteria is required - What exactly do you want to accomplish?');
  }
  
  if (!goalData.measurable || !goalData.measurable.metric || !goalData.measurable.unit) {
    errors.push('Measurable criteria is required - Define metric, target value, and unit');
  }
  
  if (goalData.measurable && (!goalData.measurable.targetValue || goalData.measurable.targetValue <= 0)) {
    errors.push('Target value must be greater than 0');
  }
  
  if (!goalData.achievable || goalData.achievable.trim().length === 0) {
    errors.push('Achievable criteria is required - Explain why this goal is realistic');
  }
  
  if (!goalData.relevant || goalData.relevant.trim().length === 0) {
    errors.push('Relevant criteria is required - Explain why this goal matters');
  }
  
  if (!goalData.timeBound || !goalData.timeBound.targetDate) {
    errors.push('Time-bound criteria is required - Set a target completion date');
  }
  
  if (goalData.timeBound && goalData.timeBound.targetDate) {
    const targetDate = new Date(goalData.timeBound.targetDate);
    const startDate = goalData.timeBound.startDate ? new Date(goalData.timeBound.startDate) : new Date();
    
    if (targetDate <= startDate) {
      errors.push('Target date must be after start date');
    }
  }
  
  if (!goalData.category) {
    errors.push('Goal category is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Helper function to calculate progress percentage
 * @param {number} currentValue - Current value
 * @param {number} targetValue - Target value
 * @returns {number} Progress percentage (0-100)
 */
export const calculateProgress = (currentValue, targetValue) => {
  if (!targetValue || targetValue === 0) return 0;
  return Math.min(Math.round((currentValue / targetValue) * 100), 100);
};

/**
 * Helper function to calculate days remaining
 * @param {string|Date} targetDate - Target completion date
 * @returns {number} Days remaining
 */
export const calculateDaysRemaining = (targetDate) => {
  if (!targetDate) return null;
  const now = new Date();
  const target = new Date(targetDate);
  const diff = target - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

/**
 * Helper function to format goal status
 * @param {string} status - Goal status
 * @returns {Object} Status display properties (text, color, icon)
 */
export const formatGoalStatus = (status) => {
  const statusMap = {
    'Not Started': { text: 'Not Started', color: 'gray', icon: '⚪' },
    'In Progress': { text: 'In Progress', color: 'blue', icon: '🔵' },
    'On Track': { text: 'On Track', color: 'green', icon: '🟢' },
    'At Risk': { text: 'At Risk', color: 'orange', icon: '🟠' },
    'Completed': { text: 'Completed', color: 'success', icon: '✅' },
    'Abandoned': { text: 'Abandoned', color: 'red', icon: '🔴' }
  };
  
  return statusMap[status] || statusMap['Not Started'];
};

export default {
  getGoals,
  getGoalById,
  createGoal,
  updateGoal,
  deleteGoal,
  addProgressUpdate,
  completeMilestone,
  getGoalStats,
  getGoalRecommendations,
  analyzeGoal,
  celebrateGoal,
  getSuccessPatterns,
  linkGoalToEntities,
  updateImpactMetrics,
  getDashboardSummary,
  validateSmartGoal,
  calculateProgress,
  calculateDaysRemaining,
  formatGoalStatus
};
