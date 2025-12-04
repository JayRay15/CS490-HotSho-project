import api from './axios';

/**
 * Create a new informational interview
 */
export const createInformationalInterview = async (data) => {
  console.log('[API] Creating informational interview:', data);
  console.log('[API] Auth header:', api.defaults.headers.common['Authorization'] ? 'Set' : 'NOT SET');
  const response = await api.post('/api/informational-interviews', data);
  console.log('[API] Create response:', response.data);
  return response.data;
};

/**
 * Get all informational interviews
 */
export const getInformationalInterviews = async (status = null) => {
  const url = status 
    ? `/api/informational-interviews?status=${status}`
    : '/api/informational-interviews';
  console.log('[API] Fetching interviews from:', url);
  console.log('[API] Auth header:', api.defaults.headers.common['Authorization'] ? 'Set' : 'NOT SET');
  const response = await api.get(url);
  console.log('[API] Interviews response:', response.data);
  return response.data;
};

/**
 * Get a single informational interview by ID
 */
export const getInformationalInterviewById = async (id) => {
  console.log('[API] Fetching interview:', id);
  const response = await api.get(`/api/informational-interviews/${id}`);
  console.log('[API] Interview response:', response.data);
  return response.data;
};

/**
 * Generate outreach email template
 */
export const generateOutreachEmail = async (interviewId, context, userGoal) => {
  const response = await api.post(
    `/api/informational-interviews/${interviewId}/generate-outreach`,
    { context, userGoal }
  );
  return response.data;
};

/**
 * Generate preparation questions
 */
export const generatePrepQuestions = async (interviewId, specificGoal) => {
  const response = await api.post(
    `/api/informational-interviews/${interviewId}/generate-prep`,
    { specificGoal }
  );
  return response.data;
};

/**
 * Log meeting notes and update status
 */
export const logMeetingNotes = async (interviewId, data) => {
  const response = await api.put(
    `/api/informational-interviews/${interviewId}/log-meeting`,
    data
  );
  return response.data;
};

/**
 * Analyze meeting notes to extract insights
 */
export const analyzeInterviewNotes = async (interviewId) => {
  const response = await api.post(
    `/api/informational-interviews/${interviewId}/analyze-notes`
  );
  return response.data;
};

/**
 * Update informational interview
 */
export const updateInformationalInterview = async (id, data) => {
  const response = await api.put(`/api/informational-interviews/${id}`, data);
  return response.data;
};

/**
 * Delete informational interview
 */
export const deleteInformationalInterview = async (id) => {
  const response = await api.delete(`/api/informational-interviews/${id}`);
  return response.data;
};

/**
 * Mark outreach as sent
 */
export const markOutreachSent = async (interviewId, content = null) => {
  const response = await api.put(
    `/api/informational-interviews/${interviewId}/outreach-sent`,
    { content }
  );
  return response.data;
};

/**
 * Update follow-up status
 */
export const updateFollowUp = async (interviewId, data) => {
  const response = await api.put(
    `/api/informational-interviews/${interviewId}/follow-up`,
    data
  );
  return response.data;
};

/**
 * Get statistics for informational interviews
 */
export const getInterviewStats = async () => {
  console.log('[API] Fetching stats');
  console.log('[API] Auth header:', api.defaults.headers.common['Authorization'] ? 'Set' : 'NOT SET');
  const response = await api.get('/api/informational-interviews/stats');
  console.log('[API] Stats response:', response.data);
  return response.data;
};
