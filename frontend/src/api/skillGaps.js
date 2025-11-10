import api from './axios';

/**
 * Analyze skill gap for a specific job
 * @param {string} jobId - Job ID to analyze
 * @returns {Promise} Skill gap analysis results
 */
export const analyzeJobSkillGap = async (jobId) => {
  const response = await api.get(`/api/skill-gaps/analyze/${jobId}`);
  return response.data;
};

/**
 * Get skill trends across all user's jobs
 * @returns {Promise} Skill trends analysis
 */
export const getSkillTrends = async () => {
  const response = await api.get('/api/skill-gaps/trends');
  return response.data;
};

/**
 * Compare skills across multiple jobs
 * @param {Array<string>} jobIds - Array of job IDs to compare
 * @returns {Promise} Comparison results
 */
export const compareJobsSkills = async (jobIds) => {
  const response = await api.post('/api/skill-gaps/compare', { jobIds });
  return response.data;
};

/**
 * Start tracking a skill development
 * @param {Object} skillData - Skill tracking data
 * @returns {Promise} Updated skill tracking list
 */
export const startSkillTracking = async (skillData) => {
  const response = await api.post('/api/skill-gaps/track', skillData);
  return response.data;
};

/**
 * Update skill development progress
 * @param {string} skillName - Name of skill being tracked
 * @param {Object} progressData - Progress update data
 * @returns {Promise} Updated skill tracking
 */
export const updateSkillProgress = async (skillName, progressData) => {
  const response = await api.put(`/api/skill-gaps/track/${encodeURIComponent(skillName)}`, progressData);
  return response.data;
};

/**
 * Get all skill development tracking
 * @returns {Promise} List of tracked skills
 */
export const getSkillTracking = async () => {
  const response = await api.get('/api/skill-gaps/track');
  return response.data;
};

/**
 * Delete skill tracking
 * @param {string} skillName - Name of skill to stop tracking
 * @returns {Promise} Deletion confirmation
 */
export const deleteSkillTracking = async (skillName) => {
  const response = await api.delete(`/api/skill-gaps/track/${encodeURIComponent(skillName)}`);
  return response.data;
};
