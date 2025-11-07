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
