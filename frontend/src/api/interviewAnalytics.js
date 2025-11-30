import api from './axios';

/**
 * Get comprehensive interview performance analytics
 */
export const getInterviewPerformanceAnalytics = async () => {
  try {
    const response = await api.get('/api/interviews/analytics/performance');
    return response;
  } catch (error) {
    console.error('Error fetching interview analytics:', error);
    throw error;
  }
};

/**
 * Generate test data for analytics
 */
export const generateTestData = async () => {
  try {
    const response = await api.post('/api/interviews/analytics/seed');
    return response;
  } catch (error) {
    console.error('Error generating test data:', error);
    throw error;
  }
};

/**
 * Clear all test data
 */
export const clearTestData = async () => {
  try {
    const response = await api.delete('/api/interviews/analytics/clear');
    return response;
  } catch (error) {
    console.error('Error clearing test data:', error);
    throw error;
  }
};

export default {
  getInterviewPerformanceAnalytics,
  generateTestData,
  clearTestData,
};
