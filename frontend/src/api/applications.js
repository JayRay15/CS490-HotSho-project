import axiosInstance from './axios';

// ===============================================
// Application Package APIs
// ===============================================

/**
 * Generate an application package for a job
 * @param {Object} packageData - { jobId, resumeId?, coverLetterId?, portfolioUrl?, autoTailor?, additionalDocuments? }
 * @returns {Promise<Object>} Generated application package
 */
export const generateApplicationPackage = async (packageData) => {
  const response = await axiosInstance.post('/api/applications/packages', packageData);
  return response.data;
};

/**
 * Get all application packages
 * @param {Object} filters - { status?, jobId? }
 * @returns {Promise<Array>} List of application packages
 */
export const getApplicationPackages = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await axiosInstance.get(`/api/applications/packages?${params}`);
  return response.data;
};

/**
 * Update an application package
 * @param {string} packageId - Package ID
 * @param {Object} updateData - Fields to update
 * @returns {Promise<Object>} Updated package
 */
export const updateApplicationPackage = async (packageId, updateData) => {
  const response = await axiosInstance.put(`/api/applications/packages/${packageId}`, updateData);
  return response.data;
};

/**
 * Delete an application package
 * @param {string} packageId - Package ID
 * @returns {Promise<Object>} Success response
 */
export const deleteApplicationPackage = async (packageId) => {
  const response = await axiosInstance.delete(`/api/applications/packages/${packageId}`);
  return response.data;
};

// ===============================================
// Application Scheduling APIs
// ===============================================

/**
 * Schedule an application for submission
 * @param {Object} scheduleData - { packageId, scheduledFor (Date/ISO string), autoSubmit? }
 * @returns {Promise<Object>} Scheduled package
 */
export const scheduleApplication = async (scheduleData) => {
  const response = await axiosInstance.post('/api/applications/schedule', scheduleData);
  return response.data;
};

/**
 * Get scheduled applications
 * @param {boolean} upcomingOnly - If true, only return future scheduled applications
 * @returns {Promise<Array>} List of scheduled applications
 */
export const getScheduledApplications = async (upcomingOnly = true) => {
  const params = upcomingOnly ? '?upcoming=true' : '';
  const response = await axiosInstance.get(`/api/applications/scheduled${params}`);
  return response.data;
};

// ===============================================
// Automation Rules APIs
// ===============================================

/**
 * Create an automation rule
 * @param {Object} ruleData - { name, description, active, triggers, actions, filters? }
 * @returns {Promise<Object>} Created automation rule
 */
export const createAutomationRule = async (ruleData) => {
  const response = await axiosInstance.post('/api/applications/automation/rules', ruleData);
  return response.data;
};

/**
 * Get all automation rules
 * @param {boolean} activeOnly - If true, only return active rules
 * @returns {Promise<Array>} List of automation rules
 */
export const getAutomationRules = async (activeOnly = null) => {
  const params = activeOnly !== null ? `?active=${activeOnly}` : '';
  const response = await axiosInstance.get(`/api/applications/automation/rules${params}`);
  return response.data;
};

/**
 * Update an automation rule
 * @param {string} ruleId - Rule ID
 * @param {Object} updateData - Fields to update
 * @returns {Promise<Object>} Updated rule
 */
export const updateAutomationRule = async (ruleId, updateData) => {
  const response = await axiosInstance.put(`/api/applications/automation/rules/${ruleId}`, updateData);
  return response.data;
};

/**
 * Delete an automation rule
 * @param {string} ruleId - Rule ID
 * @returns {Promise<Object>} Success response
 */
export const deleteAutomationRule = async (ruleId) => {
  const response = await axiosInstance.delete(`/api/applications/automation/rules/${ruleId}`);
  return response.data;
};

// ===============================================
// Application Templates APIs
// ===============================================

/**
 * Create an application template
 * @param {Object} templateData - { name, category, content, variables?, tags? }
 * @returns {Promise<Object>} Created template
 */
export const createApplicationTemplate = async (templateData) => {
  const response = await axiosInstance.post('/api/applications/templates', templateData);
  return response.data;
};

/**
 * Get all application templates
 * @param {string} category - Optional category filter (e.g., 'cover-letter-intro', 'follow-up')
 * @returns {Promise<Array>} List of templates
 */
export const getApplicationTemplates = async (category = null) => {
  const params = category ? `?category=${category}` : '';
  const response = await axiosInstance.get(`/api/applications/templates${params}`);
  return response.data;
};

/**
 * Update an application template
 * @param {string} templateId - Template ID
 * @param {Object} updateData - Fields to update
 * @returns {Promise<Object>} Updated template
 */
export const updateApplicationTemplate = async (templateId, updateData) => {
  const response = await axiosInstance.put(`/api/applications/templates/${templateId}`, updateData);
  return response.data;
};

/**
 * Delete an application template
 * @param {string} templateId - Template ID
 * @returns {Promise<Object>} Success response
 */
export const deleteApplicationTemplate = async (templateId) => {
  const response = await axiosInstance.delete(`/api/applications/templates/${templateId}`);
  return response.data;
};

// ===============================================
// Bulk Operations APIs
// ===============================================

/**
 * Apply to multiple jobs in bulk
 * @param {Object} bulkData - { jobIds: string[], resumeId?, coverLetterId?, scheduleDaysOffset?, autoTailor? }
 * @returns {Promise<Object>} Bulk operation results { successful: [], failed: [] }
 */
export const bulkApply = async (bulkData) => {
  const response = await axiosInstance.post('/api/applications/bulk-apply', bulkData);
  return response.data;
};

// ===============================================
// Application Checklists APIs
// ===============================================

/**
 * Create a checklist for a job application
 * @param {Object} checklistData - { jobId, items?, template? }
 * @returns {Promise<Object>} Created checklist
 */
export const createApplicationChecklist = async (checklistData) => {
  const response = await axiosInstance.post('/api/applications/checklists', checklistData);
  return response.data;
};

/**
 * Get all checklists for the user
 * @returns {Promise<Array>} List of checklists
 */
export const getAllChecklists = async () => {
  const response = await axiosInstance.get('/api/applications/checklists');
  return response.data;
};

/**
 * Get checklist for a specific job
 * @param {string} jobId - Job ID
 * @returns {Promise<Object>} Checklist for the job
 */
export const getApplicationChecklist = async (jobId) => {
  const response = await axiosInstance.get(`/api/applications/checklists/${jobId}`);
  return response.data;
};

/**
 * Update a checklist item (mark as complete, add notes, etc.)
 * @param {string} jobId - Job ID
 * @param {string} itemId - Checklist item ID
 * @param {Object} updateData - { completed?, autoCompleted?, notes? }
 * @returns {Promise<Object>} Updated checklist
 */
export const updateChecklistItem = async (jobId, itemId, updateData) => {
  const response = await axiosInstance.put(`/api/applications/checklists/${jobId}/items/${itemId}`, updateData);
  return response.data;
};

// ===============================================
// Application Package Quality Scoring APIs (UC-122)
// ===============================================

/**
 * Score an application package quality using AI
 * @param {Object} scoreData - { jobId, resumeId?, coverLetterId? }
 * @returns {Promise<Object>} Quality analysis with score and suggestions
 */
export const scoreApplicationPackage = async (scoreData) => {
  const response = await axiosInstance.post('/api/applications/packages/score', scoreData);
  return response.data;
};
