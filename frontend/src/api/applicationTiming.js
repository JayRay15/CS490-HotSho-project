import apiClient from './apiClient';

/**
 * UC-124: Get timing recommendation for a job application
 */
export const getTimingRecommendation = async (jobId, userTimezone = 'EST') => {
  try {
    const response = await apiClient.get(`/application-timing/recommendation/${jobId}`, {
      params: { userTimezone }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting timing recommendation:', error);
    throw error;
  }
};

/**
 * UC-124: Get real-time recommendation (submit now vs wait)
 */
export const getRealtimeRecommendation = async (jobId, userTimezone = 'EST') => {
  try {
    const response = await apiClient.post(`/application-timing/realtime/${jobId}`, {
      userTimezone
    });
    return response.data;
  } catch (error) {
    console.error('Error getting realtime recommendation:', error);
    throw error;
  }
};

/**
 * UC-124: Schedule application submission for optimal time
 */
export const scheduleSubmission = async (jobId, scheduledTime, autoSubmit = false) => {
  try {
    const response = await apiClient.post(`/application-timing/schedule/${jobId}`, {
      scheduledTime,
      autoSubmit
    });
    return response.data;
  } catch (error) {
    console.error('Error scheduling submission:', error);
    throw error;
  }
};

/**
 * UC-124: Cancel scheduled submission
 */
export const cancelScheduledSubmission = async (jobId, reason = 'User cancelled') => {
  try {
    const response = await apiClient.delete(`/application-timing/schedule/${jobId}`, {
      data: { reason }
    });
    return response.data;
  } catch (error) {
    console.error('Error cancelling scheduled submission:', error);
    throw error;
  }
};

/**
 * UC-124: Record application submission
 */
export const recordSubmission = async (jobId, submissionData = {}) => {
  try {
    const response = await apiClient.post(`/application-timing/record-submission/${jobId}`, submissionData);
    return response.data;
  } catch (error) {
    console.error('Error recording submission:', error);
    throw error;
  }
};

/**
 * UC-124: Record response to application
 */
export const recordResponse = async (jobId, submissionIndex, responseType, respondedAt) => {
  try {
    const response = await apiClient.post(`/application-timing/record-response/${jobId}`, {
      submissionIndex,
      responseType,
      respondedAt
    });
    return response.data;
  } catch (error) {
    console.error('Error recording response:', error);
    throw error;
  }
};

/**
 * UC-124: Get timing metrics for a job
 */
export const getTimingMetrics = async (jobId) => {
  try {
    const response = await apiClient.get(`/application-timing/metrics/${jobId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting timing metrics:', error);
    throw error;
  }
};

/**
 * UC-124: Get A/B test results
 */
export const getABTestResults = async () => {
  try {
    const response = await apiClient.get('/application-timing/ab-test-results');
    return response.data;
  } catch (error) {
    console.error('Error getting A/B test results:', error);
    throw error;
  }
};

/**
 * UC-124: Get correlation data between timing and response rates
 */
export const getCorrelations = async () => {
  try {
    const response = await apiClient.get('/application-timing/correlations');
    return response.data;
  } catch (error) {
    console.error('Error getting correlations:', error);
    throw error;
  }
};

/**
 * UC-124: Get user's scheduled submissions
 */
export const getScheduledSubmissions = async () => {
  try {
    const response = await apiClient.get('/application-timing/scheduled');
    return response.data;
  } catch (error) {
    console.error('Error getting scheduled submissions:', error);
    throw error;
  }
};

/**
 * UC-124: Get industry and company size statistics
 */
export const getTimingStats = async (industry = null, companySize = null) => {
  try {
    const params = {};
    if (industry) params.industry = industry;
    if (companySize) params.companySize = companySize;

    const response = await apiClient.get('/application-timing/stats', { params });
    return response.data;
  } catch (error) {
    console.error('Error getting timing stats:', error);
    throw error;
  }
};
