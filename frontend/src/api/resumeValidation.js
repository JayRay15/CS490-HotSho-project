/**
 * Resume Validation API (UC-053)
 * API calls for resume validation functionality
 */

import api, { retryRequest } from "./axios";

/**
 * Validate a resume
 * @param {string} resumeId - Resume ID to validate
 * @returns {Promise} - Validation results
 */
export const validateResume = (resumeId) => 
  retryRequest(() => api.post(`/api/resume/resumes/${resumeId}/validate`));

/**
 * Get validation status of a resume
 * @param {string} resumeId - Resume ID
 * @returns {Promise} - Validation status
 */
export const getValidationStatus = (resumeId) => 
  retryRequest(() => api.get(`/api/resume/resumes/${resumeId}/validation-status`));
