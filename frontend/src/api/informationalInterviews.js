import api, { retryRequest } from './axios';

// CRUD operations
export const getInformationalInterviews = (params) =>
  retryRequest(() => api.get('/api/informational-interviews', { params }));

export const getInformationalInterviewById = (id) =>
  retryRequest(() => api.get(`/api/informational-interviews/${id}`));

export const createInformationalInterview = (data) =>
  retryRequest(() => api.post('/api/informational-interviews', data));

export const updateInformationalInterview = (id, data) =>
  retryRequest(() => api.put(`/api/informational-interviews/${id}`, data));

export const deleteInformationalInterview = (id) =>
  retryRequest(() => api.delete(`/api/informational-interviews/${id}`));

// AI-powered generation
export const generateOutreachEmail = (data) =>
  retryRequest(() => api.post('/api/informational-interviews/generate-outreach', data));

export const generatePreparationFramework = (data) =>
  retryRequest(() => api.post('/api/informational-interviews/generate-preparation', data));

export const generateFollowUpEmail = (data) =>
  retryRequest(() => api.post('/api/informational-interviews/generate-follow-up', data));

// Analytics
export const getInformationalInterviewAnalytics = () =>
  retryRequest(() => api.get('/api/informational-interviews/analytics'));
