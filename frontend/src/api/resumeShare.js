import api, { retryRequest } from './axios';

// Owner endpoints
export const createShare = (resumeId, payload) =>
  retryRequest(() => api.post(`/api/resume/resumes/${resumeId}/share`, payload));

export const listShares = (resumeId) =>
  retryRequest(() => api.get(`/api/resume/resumes/${resumeId}/shares`));

export const revokeShare = (resumeId, token) =>
  retryRequest(() => api.patch(`/api/resume/resumes/${resumeId}/shares/${token}/revoke`));

export const listFeedbackOwner = (resumeId) =>
  retryRequest(() => api.get(`/api/resume/resumes/${resumeId}/feedback`));

export const resolveFeedback = (feedbackId, payload) =>
  retryRequest(() => api.patch(`/api/resume/feedback/${feedbackId}/resolve`, payload));

export const exportFeedbackSummary = (resumeId, format = 'json') =>
  retryRequest(() => api.get(`/api/resume/resumes/${resumeId}/feedback/export`, { params: { format }, responseType: format === 'csv' ? 'blob' : 'json' }));

// Public endpoints (no auth token needed unless global auth header preset)
export const fetchSharedResume = (token, reviewerEmail = null) =>
  retryRequest(() => api.get(`/api/resume/share/${token}`, { headers: reviewerEmail ? { 'X-Reviewer-Email': reviewerEmail } : {} }));

export const listFeedbackForShare = (token, reviewerEmail = null) =>
  retryRequest(() => api.get(`/api/resume/share/${token}/feedback`, { headers: reviewerEmail ? { 'X-Reviewer-Email': reviewerEmail } : {} }));

export const postFeedbackForShare = (token, payload, reviewerEmail = null) =>
  retryRequest(() => api.post(`/api/resume/share/${token}/feedback`, payload, { headers: reviewerEmail ? { 'X-Reviewer-Email': reviewerEmail } : {} }));
