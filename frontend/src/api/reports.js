import api from './axios';

/**
 * Reports API Service
 * Handles all custom reports API requests
 */

/**
 * Get all report configurations for the current user
 * @param {boolean} includeTemplates - Include system templates
 * @returns {Promise<Object>} Report configurations array
 */
export const getReportConfigs = async (includeTemplates = true) => {
  const params = includeTemplates ? '?includeTemplates=true' : '';
  const response = await api.get(`/api/reports/config${params}`);
  return response.data;
};

/**
 * Get a specific report configuration by ID
 * @param {string} configId - Report configuration ID
 * @returns {Promise<Object>} Report configuration
 */
export const getReportConfigById = async (configId) => {
  const response = await api.get(`/api/reports/config/${configId}`);
  return response.data;
};

/**
 * Create a new report configuration
 * @param {Object} configData - Report configuration data
 * @returns {Promise<Object>} Created report configuration
 */
export const createReportConfig = async (configData) => {
  const response = await api.post('/api/reports/config', configData);
  return response.data;
};

/**
 * Update an existing report configuration
 * @param {string} configId - Report configuration ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated report configuration
 */
export const updateReportConfig = async (configId, updates) => {
  const response = await api.put(`/api/reports/config/${configId}`, updates);
  return response.data;
};

/**
 * Delete a report configuration
 * @param {string} configId - Report configuration ID
 * @returns {Promise<Object>} Success message
 */
export const deleteReportConfig = async (configId) => {
  const response = await api.delete(`/api/reports/config/${configId}`);
  return response.data;
};

/**
 * Generate a report from a saved configuration or ad-hoc config
 * @param {Object} params - Generation parameters
 * @param {string} params.configId - (Optional) Saved configuration ID
 * @param {Object} params.adHocConfig - (Optional) Ad-hoc configuration object
 * @returns {Promise<Object>} Generated report data
 */
export const generateReport = async ({ configId, adHocConfig }) => {
  const payload = configId ? { configId } : { adHocConfig };
  const response = await api.post('/api/reports/generate', payload);
  return response.data;
};

/**
 * Export report as PDF
 * @param {string} reportId - Report configuration ID
 * @param {Object} reportData - Report data to export
 * @returns {Promise<Blob>} PDF file blob
 */
export const exportReportPDF = async (reportId, reportData) => {
  const response = await api.post(`/api/reports/${reportId}/export/pdf`, reportData, {
    responseType: 'blob',
    headers: {
      'Content-Type': 'application/json',
    }
  });
  return response.data;
};

/**
 * Export report as Excel
 * @param {string} reportId - Report configuration ID
 * @param {Object} reportData - Report data to export
 * @returns {Promise<Blob>} Excel file blob
 */
export const exportReportExcel = async (reportId, reportData) => {
  const response = await api.post(`/api/reports/${reportId}/export/excel`, reportData, {
    responseType: 'blob',
    headers: {
      'Content-Type': 'application/json',
    }
  });
  return response.data;
};

/**
 * Share a report
 * @param {string} reportId - Report configuration ID
 * @param {Object} shareOptions - Sharing options
 * @returns {Promise<Object>} Share link and details
 */
export const shareReport = async (reportId, shareOptions) => {
  const response = await api.post(`/api/reports/${reportId}/share`, shareOptions);
  return response.data;
};

/**
 * Get user's shared reports
 * @returns {Promise<Object>} Array of shared reports
 */
export const getUserSharedReports = async () => {
  const response = await api.get('/api/reports/shared');
  return response.data;
};

/**
 * Revoke a shared report
 * @param {string} sharedReportId - Shared report ID
 * @returns {Promise<Object>} Success message
 */
export const revokeSharedReport = async (sharedReportId) => {
  const response = await api.delete(`/api/reports/shared/${sharedReportId}`);
  return response.data;
};

/**
 * View a publicly shared report (no authentication required)
 * @param {string} token - Share token
 * @param {string} password - Optional password for protected reports
 * @returns {Promise<Object>} Report data
 */
export const viewSharedReport = async (token, password = null) => {
  const url = `/api/public/reports/${token}`;
  const response = await api.post(url, password ? { password } : {});
  return response.data;
};

/**
 * Download helper - Creates a download link from blob
 * @param {Blob} blob - File blob
 * @param {string} filename - Desired filename
 */
export const downloadFile = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
