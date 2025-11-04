import api, { retryRequest } from "./axios";

// UC-52: Link resume to job application
export const linkResumeToJob = (jobId, resumeId) => 
  retryRequest(() => api.put(`/api/jobs/${jobId}/link-resume`, { resumeId }));

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
