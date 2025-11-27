import api, { retryRequest } from './axios';

/**
 * UC-110: Collaborative Resume and Cover Letter Review
 * Cover Letter Share API - frontend API client for sharing and feedback
 */

// Owner endpoints (authenticated)
export const createCoverLetterShare = (coverLetterId, payload) =>
  retryRequest(() => api.post(`/api/cover-letters/${coverLetterId}/share`, payload));

export const listCoverLetterShares = (coverLetterId) =>
  retryRequest(() => api.get(`/api/cover-letters/${coverLetterId}/shares`));

export const revokeCoverLetterShare = (coverLetterId, token) =>
  retryRequest(() => api.patch(`/api/cover-letters/${coverLetterId}/shares/${token}/revoke`));

export const listCoverLetterFeedbackOwner = (coverLetterId) =>
  retryRequest(() => api.get(`/api/cover-letters/${coverLetterId}/feedback`));

export const resolveCoverLetterFeedback = (feedbackId, payload) =>
  retryRequest(() => api.patch(`/api/cover-letter-feedback/${feedbackId}/resolve`, payload));

export const exportCoverLetterFeedbackSummary = (coverLetterId, format = 'json') =>
  retryRequest(() => api.get(`/api/cover-letters/${coverLetterId}/feedback/export`, { 
    params: { format }, 
    responseType: format === 'csv' ? 'blob' : 'json' 
  }));

// Approval workflow
export const updateCoverLetterApproval = (coverLetterId, action) =>
  retryRequest(() => api.patch(`/api/cover-letters/${coverLetterId}/approval`, { action }));

// UC-110: Get pending cover letter review invitations for current user
export const getCoverLetterReviewInvitations = () =>
  retryRequest(() => api.get('/api/cover-letter-review-invitations'));

// Public endpoints (no auth token needed unless global auth header preset)
export const fetchSharedCoverLetter = (token, reviewerEmail = null) =>
  retryRequest(() => api.get(`/api/share/cover-letter/${token}`, { 
    headers: reviewerEmail ? { 'X-Reviewer-Email': reviewerEmail } : {} 
  }));

export const listFeedbackForCoverLetterShare = (token, reviewerEmail = null) =>
  retryRequest(() => api.get(`/api/share/cover-letter/${token}/feedback`, { 
    headers: reviewerEmail ? { 'X-Reviewer-Email': reviewerEmail } : {} 
  }));

export const postFeedbackForCoverLetterShare = (token, payload, reviewerEmail = null) =>
  retryRequest(() => api.post(`/api/share/cover-letter/${token}/feedback`, payload, { 
    headers: reviewerEmail ? { 'X-Reviewer-Email': reviewerEmail } : {} 
  }));
