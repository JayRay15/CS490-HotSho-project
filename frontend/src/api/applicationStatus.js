import axiosInstance from './axios';

// ===============================================
// Application Status Tracking API
// ===============================================

/**
 * Get application status for a specific job
 * @param {string} jobId - Job ID
 * @returns {Promise<Object>} Application status with history and timeline
 */
export const getApplicationStatus = async (jobId) => {
  const response = await axiosInstance.get(`/api/status/${jobId}`);
  return response.data;
};

/**
 * Get all application statuses for the user
 * @param {Object} filters - { status?, sortBy?, order? }
 * @returns {Promise<Array>} List of application statuses
 */
export const getAllApplicationStatuses = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.order) params.append('order', filters.order);
  
  const response = await axiosInstance.get(`/api/status?${params.toString()}`);
  return response.data;
};

/**
 * Update application status manually
 * @param {string} jobId - Job ID
 * @param {Object} updateData - { status, notes?, nextAction?, nextActionDate?, tags?, priority? }
 * @returns {Promise<Object>} Updated application status
 */
export const updateApplicationStatus = async (jobId, updateData) => {
  const response = await axiosInstance.put(`/api/status/${jobId}`, updateData);
  return response.data;
};

/**
 * Get status timeline and history for a job
 * @param {string} jobId - Job ID
 * @returns {Promise<Object>} Timeline with status history and events
 */
export const getStatusTimeline = async (jobId) => {
  const response = await axiosInstance.get(`/api/status/${jobId}/timeline`);
  return response.data;
};

/**
 * Add custom timeline event
 * @param {string} jobId - Job ID
 * @param {Object} eventData - { eventType, description, metadata? }
 * @returns {Promise<Object>} Created timeline event
 */
export const addTimelineEvent = async (jobId, eventData) => {
  const response = await axiosInstance.post(`/api/status/${jobId}/timeline`, eventData);
  return response.data;
};

/**
 * Bulk update application statuses
 * @param {Object} bulkData - { jobIds: string[], status: string, notes?: string }
 * @returns {Promise<Object>} Bulk operation results { successful, failed }
 */
export const bulkUpdateStatuses = async (bulkData) => {
  const response = await axiosInstance.put('/api/status/bulk', bulkData);
  return response.data;
};

/**
 * Get status statistics for user
 * @returns {Promise<Object>} Statistics including status breakdown, metrics, and stalled apps
 */
export const getStatusStatistics = async () => {
  const response = await axiosInstance.get('/api/status/stats');
  return response.data;
};

/**
 * Detect status from email (manual trigger)
 * @param {string} jobId - Job ID
 * @param {Object} emailData - { emailSubject, emailBody, emailFrom?, receivedAt? }
 * @returns {Promise<Object>} Detection results { detectedStatus, confidence, reason }
 */
export const detectStatusFromEmail = async (jobId, emailData) => {
  const response = await axiosInstance.post(`/api/status/${jobId}/detect-from-email`, emailData);
  return response.data;
};

/**
 * Confirm auto-detected status change
 * @param {string} jobId - Job ID
 * @param {Object} confirmData - { detectedStatus, notes? }
 * @returns {Promise<Object>} Updated application status
 */
export const confirmStatusDetection = async (jobId, confirmData) => {
  const response = await axiosInstance.post(`/api/status/${jobId}/confirm-detection`, confirmData);
  return response.data;
};

/**
 * Update automation settings for a job
 * @param {string} jobId - Job ID
 * @param {Object} automation - Automation settings object
 * @returns {Promise<Object>} Updated application status
 */
export const updateAutomationSettings = async (jobId, automation) => {
  const response = await axiosInstance.put(`/api/status/${jobId}/automation`, { automation });
  return response.data;
};

/**
 * Delete application status
 * @param {string} jobId - Job ID
 * @returns {Promise<Object>} Success response
 */
export const deleteApplicationStatus = async (jobId) => {
  const response = await axiosInstance.delete(`/api/status/${jobId}`);
  return response.data;
};

// Helper function to format status for display
export const formatStatus = (status) => {
  const statusMap = {
    'Not Applied': { label: 'Not Applied', color: 'gray', icon: '📋' },
    'Applied': { label: 'Applied', color: 'blue', icon: '✉️' },
    'Under Review': { label: 'Under Review', color: 'yellow', icon: '👀' },
    'Phone Screen': { label: 'Phone Screen', color: 'indigo', icon: '📞' },
    'Technical Interview': { label: 'Technical Interview', color: 'purple', icon: '💻' },
    'Onsite Interview': { label: 'Onsite Interview', color: 'violet', icon: '🏢' },
    'Final Interview': { label: 'Final Interview', color: 'pink', icon: '🎯' },
    'Offer Extended': { label: 'Offer Extended', color: 'green', icon: '🎉' },
    'Offer Accepted': { label: 'Offer Accepted', color: 'emerald', icon: '✅' },
    'Offer Declined': { label: 'Offer Declined', color: 'orange', icon: '❌' },
    'Rejected': { label: 'Rejected', color: 'red', icon: '⛔' },
    'Withdrawn': { label: 'Withdrawn', color: 'slate', icon: '↩️' },
    'Ghosted': { label: 'Ghosted', color: 'gray', icon: '👻' }
  };
  
  return statusMap[status] || { label: status, color: 'gray', icon: '❓' };
};

// Helper to get status badge classes
export const getStatusBadgeClasses = (status) => {
  const colorMap = {
    gray: 'bg-gray-100 text-gray-800',
    blue: 'bg-blue-100 text-blue-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    indigo: 'bg-indigo-100 text-indigo-800',
    purple: 'bg-purple-100 text-purple-800',
    violet: 'bg-violet-100 text-violet-800',
    pink: 'bg-pink-100 text-pink-800',
    green: 'bg-green-100 text-green-800',
    emerald: 'bg-emerald-100 text-emerald-800',
    orange: 'bg-orange-100 text-orange-800',
    red: 'bg-red-100 text-red-800',
    slate: 'bg-slate-100 text-slate-800'
  };
  
  const formatted = formatStatus(status);
  return colorMap[formatted.color] || colorMap.gray;
};

export default {
  getApplicationStatus,
  getAllApplicationStatuses,
  updateApplicationStatus,
  getStatusTimeline,
  addTimelineEvent,
  bulkUpdateStatuses,
  getStatusStatistics,
  detectStatusFromEmail,
  confirmStatusDetection,
  updateAutomationSettings,
  deleteApplicationStatus,
  formatStatus,
  getStatusBadgeClasses
};
