import api, { retryRequest } from "./axios";

// Get all interviews for current user
export const getInterviews = (params) =>
  retryRequest(() => api.get('/api/interviews', { params }));

// Get a single interview
export const getInterview = (interviewId) =>
  retryRequest(() => api.get(`/api/interviews/${interviewId}`));

// Schedule a new interview
export const scheduleInterview = (interviewData) =>
  retryRequest(() => api.post('/api/interviews', interviewData));

// Update interview details
export const updateInterview = (interviewId, updates) =>
  retryRequest(() => api.put(`/api/interviews/${interviewId}`, updates));

// Reschedule an interview
export const rescheduleInterview = (interviewId, newDate, reason) =>
  retryRequest(() => api.put(`/api/interviews/${interviewId}/reschedule`, { newDate, reason }));

// Cancel an interview
export const cancelInterview = (interviewId, reason, cancelledBy = 'User') =>
  retryRequest(() => api.put(`/api/interviews/${interviewId}/cancel`, { reason, cancelledBy }));

// Confirm an interview
export const confirmInterview = (interviewId) =>
  retryRequest(() => api.put(`/api/interviews/${interviewId}/confirm`));

// Record interview outcome
export const recordOutcome = (interviewId, outcomeData) =>
  retryRequest(() => api.put(`/api/interviews/${interviewId}/outcome`, outcomeData));

// Get upcoming interviews
export const getUpcomingInterviews = (days = 7) =>
  retryRequest(() => api.get('/api/interviews/upcoming', { params: { days } }));

// Check for scheduling conflicts
export const checkConflicts = (date, duration = 60, excludeId = null) =>
  retryRequest(() => api.get('/api/interviews/conflicts', { 
    params: { date, duration, excludeId } 
  }));

// Delete an interview
export const deleteInterview = (interviewId) =>
  retryRequest(() => api.delete(`/api/interviews/${interviewId}`));

// Preparation tasks management
export const addPreparationTask = (interviewId, taskData) =>
  retryRequest(() => api.post(`/api/interviews/${interviewId}/tasks`, taskData));

export const updatePreparationTask = (interviewId, taskId, updates) =>
  retryRequest(() => api.put(`/api/interviews/${interviewId}/tasks/${taskId}`, updates));

export const deletePreparationTask = (interviewId, taskId) =>
  retryRequest(() => api.delete(`/api/interviews/${interviewId}/tasks/${taskId}`));

export const generatePreparationTasks = (interviewId) =>
  retryRequest(() => api.post(`/api/interviews/${interviewId}/generate-tasks`));

// Download ICS file for an interview
export const downloadInterviewICS = async (interviewId) => {
  // Use raw axios instance to get text content
  const res = await api.get(`/api/interviews/${interviewId}/ics`, { responseType: 'text' });
  const blob = new Blob([res.data], { type: 'text/calendar' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `interview-${interviewId}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
  return true;
};
