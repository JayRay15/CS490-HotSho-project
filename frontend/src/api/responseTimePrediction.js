import apiClient from './apiClient';

/**
 * Get response time prediction for a specific job
 * @param {string} jobId - The job ID
 * @returns {Promise<Object>} Prediction data
 */
export const getResponseTimePrediction = async (jobId) => {
  try {
    const response = await apiClient.get(`/response-time-prediction/prediction/${jobId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting response time prediction:', error);
    throw error;
  }
};

/**
 * Get predictions for all user's applied jobs
 * @returns {Promise<Object>} All predictions
 */
export const getAllPredictions = async () => {
  try {
    const response = await apiClient.get('/response-time-prediction/predictions');
    return response.data;
  } catch (error) {
    console.error('Error getting all predictions:', error);
    throw error;
  }
};

/**
 * Get overdue applications
 * @returns {Promise<Object>} Overdue applications
 */
export const getOverdueApplications = async () => {
  try {
    const response = await apiClient.get('/response-time-prediction/overdue');
    return response.data;
  } catch (error) {
    console.error('Error getting overdue applications:', error);
    throw error;
  }
};

/**
 * Get dashboard summary for response time predictions
 * @returns {Promise<Object>} Dashboard summary
 */
export const getDashboardSummary = async () => {
  try {
    const response = await apiClient.get('/response-time-prediction/dashboard');
    return response.data;
  } catch (error) {
    console.error('Error getting dashboard summary:', error);
    throw error;
  }
};

/**
 * Get prediction accuracy statistics
 * @returns {Promise<Object>} Accuracy statistics
 */
export const getPredictionAccuracy = async () => {
  try {
    const response = await apiClient.get('/response-time-prediction/accuracy');
    return response.data;
  } catch (error) {
    console.error('Error getting prediction accuracy:', error);
    throw error;
  }
};

/**
 * Get industry benchmarks
 * @param {string} [industry] - Optional specific industry
 * @returns {Promise<Object>} Industry benchmarks
 */
export const getIndustryBenchmarks = async (industry = null) => {
  try {
    const params = industry ? { industry } : {};
    const response = await apiClient.get('/response-time-prediction/benchmarks', { params });
    return response.data;
  } catch (error) {
    console.error('Error getting industry benchmarks:', error);
    throw error;
  }
};

/**
 * Get follow-up suggestions for a job
 * @param {string} jobId - The job ID
 * @returns {Promise<Object>} Follow-up suggestions
 */
export const getFollowUpSuggestions = async (jobId) => {
  try {
    const response = await apiClient.get(`/response-time-prediction/follow-up/${jobId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting follow-up suggestions:', error);
    throw error;
  }
};

/**
 * Record actual response for a job application
 * @param {string} jobId - The job ID
 * @param {string} responseDate - ISO date string of the response
 * @param {string} responseType - Type of response (interview_invite, rejection, etc.)
 * @returns {Promise<Object>} Recording result
 */
export const recordResponse = async (jobId, responseDate, responseType) => {
  try {
    const response = await apiClient.post(`/response-time-prediction/record-response/${jobId}`, {
      responseDate,
      responseType
    });
    return response.data;
  } catch (error) {
    console.error('Error recording response:', error);
    throw error;
  }
};

/**
 * Mark overdue alert as sent
 * @param {string} jobId - The job ID
 * @returns {Promise<Object>} Result
 */
export const markOverdueAlertSent = async (jobId) => {
  try {
    const response = await apiClient.post(`/response-time-prediction/alert-sent/${jobId}`);
    return response.data;
  } catch (error) {
    console.error('Error marking overdue alert:', error);
    throw error;
  }
};

/**
 * Mark follow-up reminder as sent
 * @param {string} jobId - The job ID
 * @returns {Promise<Object>} Result
 */
export const markFollowUpReminderSent = async (jobId) => {
  try {
    const response = await apiClient.post(`/response-time-prediction/follow-up-sent/${jobId}`);
    return response.data;
  } catch (error) {
    console.error('Error marking follow-up reminder:', error);
    throw error;
  }
};

/**
 * Withdraw application (stop tracking response)
 * @param {string} jobId - The job ID
 * @returns {Promise<Object>} Result
 */
export const withdrawApplication = async (jobId) => {
  try {
    const response = await apiClient.post(`/response-time-prediction/withdraw/${jobId}`);
    return response.data;
  } catch (error) {
    console.error('Error withdrawing application:', error);
    throw error;
  }
};
