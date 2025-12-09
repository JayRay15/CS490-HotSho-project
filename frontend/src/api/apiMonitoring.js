import api from "./axios";

/**
 * UC-117: API Rate Limiting and Error Handling Dashboard
 * Frontend API client for API monitoring endpoints
 */

/**
 * Get comprehensive API monitoring dashboard data
 * @returns {Promise} Dashboard overview with all services
 */
export const getDashboard = async () => {
    const response = await api.get('/api/api-monitoring/dashboard');
    return response.data;
};

/**
 * Get list of all monitored services with configurations
 * @returns {Promise} Services list with quota configurations
 */
export const getServices = async () => {
    const response = await api.get('/api/api-monitoring/services');
    return response.data;
};

/**
 * Get detailed usage statistics for a specific service
 * @param {string} service - Service identifier
 * @param {number} days - Number of days to fetch (default: 7)
 * @returns {Promise} Service usage data and trends
 */
export const getServiceUsage = async (service, days = 7) => {
    const response = await api.get(`/api/api-monitoring/usage/${service}`, {
        params: { days }
    });
    return response.data;
};

/**
 * Get quota status for all services
 * @returns {Promise} Quota status with warnings
 */
export const getQuotaStatus = async () => {
    const response = await api.get('/api/api-monitoring/quotas');
    return response.data;
};

/**
 * Get error logs with filtering and pagination
 * @param {Object} options - Filter options
 * @param {string} options.service - Filter by service
 * @param {string} options.startDate - Filter from date (ISO string)
 * @param {string} options.endDate - Filter to date (ISO string)
 * @param {boolean} options.resolved - Filter by resolved status
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Items per page (default: 50)
 * @returns {Promise} Error logs with pagination
 */
export const getErrorLogs = async (options = {}) => {
    const params = {};
    if (options.service) params.service = options.service;
    if (options.startDate) params.startDate = options.startDate;
    if (options.endDate) params.endDate = options.endDate;
    if (options.resolved !== undefined) params.resolved = options.resolved;
    if (options.page) params.page = options.page;
    if (options.limit) params.limit = options.limit;

    const response = await api.get('/api/api-monitoring/errors', { params });
    return response.data;
};

/**
 * Mark an error as resolved
 * @param {string} errorId - Error log ID
 * @param {string} notes - Optional resolution notes
 * @returns {Promise} Updated error log
 */
export const resolveError = async (errorId, notes = '') => {
    const response = await api.put(`/api/api-monitoring/errors/${errorId}/resolve`, { notes });
    return response.data;
};

/**
 * Get alerts with filtering
 * @param {Object} options - Filter options
 * @param {string} options.service - Filter by service
 * @param {string} options.alertType - Filter by alert type
 * @param {string} options.severity - Filter by severity
 * @param {boolean} options.acknowledged - Filter by acknowledged status
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Items per page (default: 50)
 * @returns {Promise} Alerts with pagination
 */
export const getAlerts = async (options = {}) => {
    const params = {};
    if (options.service) params.service = options.service;
    if (options.alertType) params.alertType = options.alertType;
    if (options.severity) params.severity = options.severity;
    if (options.acknowledged !== undefined) params.acknowledged = options.acknowledged;
    if (options.page) params.page = options.page;
    if (options.limit) params.limit = options.limit;

    const response = await api.get('/api/api-monitoring/alerts', { params });
    return response.data;
};

/**
 * Acknowledge an alert
 * @param {string} alertId - Alert ID
 * @returns {Promise} Updated alert
 */
export const acknowledgeAlert = async (alertId) => {
    const response = await api.put(`/api/api-monitoring/alerts/${alertId}/acknowledge`);
    return response.data;
};

/**
 * Get API response time analytics
 * @param {number} days - Number of days to analyze (default: 7)
 * @returns {Promise} Performance metrics
 */
export const getPerformanceMetrics = async (days = 7) => {
    const response = await api.get('/api/api-monitoring/performance', {
        params: { days }
    });
    return response.data;
};

/**
 * Get weekly API usage report
 * @returns {Promise} Weekly report data
 */
export const getWeeklyReport = async () => {
    const response = await api.get('/api/api-monitoring/reports/weekly');
    return response.data;
};

// Export all functions
export default {
    getDashboard,
    getServices,
    getServiceUsage,
    getQuotaStatus,
    getErrorLogs,
    resolveError,
    getAlerts,
    acknowledgeAlert,
    getPerformanceMetrics,
    getWeeklyReport
};
