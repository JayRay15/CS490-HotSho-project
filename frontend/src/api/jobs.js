import api, { retryRequest } from "./axios";

// GET single job details
export const getJob = (jobId) =>
  retryRequest(() => api.get(`/api/jobs/${jobId}`));

// GET all jobs (for selection)
export const getJobs = (params) =>
  retryRequest(() => api.get('/api/jobs', { params }));

// UC-52: Link resume to job application
export const linkResumeToJob = (jobId, resumeId) =>
  retryRequest(() => api.put(`/api/jobs/${jobId}/link-resume`, { resumeId }));

// UC-042: Link cover letter to job application
export const linkCoverLetterToJob = (jobId, coverLetterId) =>
  retryRequest(() => api.put(`/api/jobs/${jobId}/link-cover-letter`, { coverLetterId }));

// Archive a single job
export const archiveJob = (jobId, reason, notes) =>
  retryRequest(() => api.post(`/api/jobs/${jobId}/archive`, { reason, notes }));

// Restore an archived job
export const restoreJob = (jobId) =>
  retryRequest(() => api.post(`/api/jobs/${jobId}/restore`));

// Bulk archive jobs
export const bulkArchiveJobs = (jobIds, reason, notes) =>
  retryRequest(() => api.post('/api/jobs/bulk-archive', { jobIds, reason, notes }));

// Bulk restore jobs
export const bulkRestoreJobs = (jobIds) =>
  retryRequest(() => api.post('/api/jobs/bulk-restore', { jobIds }));

// Auto-archive old jobs
export const autoArchiveJobs = (daysInactive, statuses) =>
  retryRequest(() => api.post('/api/jobs/auto-archive', { daysInactive, statuses }));

// UC-68: Get interview insights for a company
export const getInterviewInsights = (jobId) =>
  retryRequest(() => api.get(`/api/jobs/${jobId}/interview-insights`));
