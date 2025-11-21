import api, { retryRequest } from "./axios";

export const startMockInterview = (payload) =>
  retryRequest(() => api.post('/api/mock-interviews/start', payload));

export const getMockInterviewSession = (sessionId) =>
  retryRequest(() => api.get(`/api/mock-interviews/${sessionId}`));

export const answerMockInterviewQuestion = (sessionId, payload) =>
  retryRequest(() => api.post(`/api/mock-interviews/${sessionId}/answer`, payload));

export const finishMockInterviewSession = (sessionId) =>
  retryRequest(() => api.post(`/api/mock-interviews/${sessionId}/finish`));

export const getMockInterviewSummary = (sessionId) =>
  retryRequest(() => api.get(`/api/mock-interviews/${sessionId}/summary`));
