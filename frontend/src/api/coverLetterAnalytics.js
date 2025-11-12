import api, { retryRequest } from "./axios";

/**
 * UC-62: Cover Letter Performance Analytics API Functions
 * Functions to interact with cover letter analytics endpoints
 */

// Get performance analytics for a specific cover letter
export const getCoverLetterPerformance = (coverLetterId) =>
  retryRequest(() => api.get(`/api/cover-letter-analytics/${coverLetterId}`));

// Get analytics for all user's cover letters
export const getAllCoverLetterAnalytics = () =>
  retryRequest(() => api.get("/api/cover-letter-analytics"));

// Track application outcome for a job
export const trackApplicationOutcome = (jobId, outcomeData) =>
  retryRequest(() => api.put(`/api/cover-letter-analytics/track/${jobId}`, outcomeData));

// Get response rates analysis
export const getResponseRates = () =>
  retryRequest(() => api.get("/api/cover-letter-analytics/analysis/response-rates"));

// Get template effectiveness analysis
export const getTemplateEffectiveness = () =>
  retryRequest(() => api.get("/api/cover-letter-analytics/analysis/template-effectiveness"));

// Get success patterns and insights
export const getSuccessPatterns = () =>
  retryRequest(() => api.get("/api/cover-letter-analytics/analysis/success-patterns"));

// Export performance report (format: 'pdf' or 'json')
export const exportPerformanceReport = (format = 'pdf') =>
  retryRequest(() => api.get(`/api/cover-letter-analytics/export/report?format=${format}`, {
    responseType: format === 'pdf' ? 'blob' : 'json'
  }));
