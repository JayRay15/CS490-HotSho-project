import api, { retryRequest } from "./axios";

// UC-52: Link resume to job application
export const linkResumeToJob = (jobId, resumeId) => 
  retryRequest(() => api.put(`/api/jobs/${jobId}/link-resume`, { resumeId }));
