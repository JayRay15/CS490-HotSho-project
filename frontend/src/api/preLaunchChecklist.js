import api from './axios';

/**
 * Pre-Launch Checklist API
 * Handles all API calls for the pre-launch checklist feature
 */

/**
 * Get the current checklist state
 * @returns {Promise} The checklist data
 */
export const getChecklist = async () => {
  const response = await api.get('/api/pre-launch-checklist');
  return response.data;
};

/**
 * Toggle a checklist item's completion status
 * @param {string} sectionKey - The section key (e.g., 'criticalBugs')
 * @param {string} itemId - The item ID (e.g., 'bug1')
 * @param {string} userName - The name of the user making the change
 * @returns {Promise} The updated checklist data
 */
export const toggleItem = async (sectionKey, itemId, userName) => {
  const response = await api.put(`/api/pre-launch-checklist/${sectionKey}/${itemId}`, {
    userName
  });
  return response.data;
};

/**
 * Admin sign-off on the checklist
 * @param {string} userName - The name of the admin signing off
 * @returns {Promise} The updated checklist data
 */
export const signOff = async (userName) => {
  const response = await api.post('/api/pre-launch-checklist/signoff', {
    userName
  });
  return response.data;
};

/**
 * Make a launch decision (GO or NO-GO)
 * @param {string} decision - 'go' or 'no-go'
 * @param {string} reason - Optional reason for the decision
 * @param {string} userName - The name of the user making the decision
 * @returns {Promise} The updated checklist data
 */
export const makeLaunchDecision = async (decision, reason, userName) => {
  const response = await api.post('/api/pre-launch-checklist/decision', {
    decision,
    reason,
    userName
  });
  return response.data;
};

/**
 * Reset the entire checklist
 * @param {string} userName - The name of the admin resetting
 * @returns {Promise} The reset checklist data
 */
export const resetChecklist = async (userName) => {
  const response = await api.post('/api/pre-launch-checklist/reset', {
    userName
  });
  return response.data;
};

export default {
  getChecklist,
  toggleItem,
  signOff,
  makeLaunchDecision,
  resetChecklist
};
