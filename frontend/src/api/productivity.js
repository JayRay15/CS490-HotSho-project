import apiClient from './apiClient';

export const productivityApi = {
  getDashboard: async () => {
    const response = await apiClient.get('/productivity/dashboard');
    return response.data;
  },

  getTimeTrackingByDate: async (date) => {
    const response = await apiClient.get(`/productivity/time-tracking/${date}`);
    return response.data;
  },

  getTimeTrackingRange: async (startDate, endDate) => {
    const response = await apiClient.get('/productivity/time-tracking', {
      params: { startDate, endDate }
    });
    return response.data;
  },

  addTimeEntry: async (date, entryData) => {
    const response = await apiClient.post(`/productivity/time-tracking/${date}/entries`, entryData);
    return response.data;
  },

  updateTimeEntry: async (date, entryId, updateData) => {
    const response = await apiClient.put(`/productivity/time-tracking/${date}/entries/${entryId}`, updateData);
    return response.data;
  },

  deleteTimeEntry: async (date, entryId) => {
    const response = await apiClient.delete(`/productivity/time-tracking/${date}/entries/${entryId}`);
    return response.data;
  },

  getTimeStats: async (startDate, endDate) => {
    const response = await apiClient.get('/productivity/stats', {
      params: { startDate, endDate }
    });
    return response.data;
  },

  generateAnalysis: async (startDate, endDate, periodType = 'Custom') => {
    const response = await apiClient.post('/productivity/analysis', {
      startDate,
      endDate,
      periodType
    });
    return response.data;
  },

  getAnalysis: async (analysisId) => {
    const response = await apiClient.get(`/productivity/analysis/${analysisId}`);
    return response.data;
  },

  getUserAnalyses: async (periodType, limit = 10) => {
    const params = { limit };
    if (periodType) params.periodType = periodType;
    
    const response = await apiClient.get('/productivity/analyses', { params });
    return response.data;
  },

  getInsights: async (startDate, endDate) => {
    const response = await apiClient.post('/productivity/insights', {
      startDate,
      endDate
    });
    return response.data;
  },

  getOptimalSchedule: async () => {
    const response = await apiClient.get('/productivity/optimal-schedule');
    return response.data;
  },

  compareProductivity: async (period1Start, period1End, period2Start, period2End) => {
    const response = await apiClient.post('/productivity/compare', {
      period1Start,
      period1End,
      period2Start,
      period2End
    });
    return response.data;
  }
};

export default productivityApi;
