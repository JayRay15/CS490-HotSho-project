import axios from './axios';

// Get behavioral questions
export const getBehavioralQuestions = async (params = {}) => {
  const response = await axios.get('/api/writing-practice/questions', { params });
  return response.data;
};

// Get a specific behavioral question
export const getBehavioralQuestion = async (questionId) => {
  const response = await axios.get(`/api/writing-practice/questions/${questionId}`);
  return response.data;
};

// Create a new practice session
export const createPracticeSession = async (sessionData) => {
  const response = await axios.post('/api/writing-practice/sessions', sessionData);
  return response.data;
};

// Get user's practice sessions
export const getPracticeSessions = async (params = {}) => {
  const response = await axios.get('/api/writing-practice/sessions', { params });
  return response.data;
};

// Get a specific practice session
export const getPracticeSession = async (sessionId) => {
  const response = await axios.get(`/api/writing-practice/sessions/${sessionId}`);
  return response.data;
};

// Submit a response to a question
export const submitResponse = async (sessionId, questionId, responseData) => {
  const response = await axios.post(
    `/api/writing-practice/sessions/${sessionId}/questions/${questionId}/respond`,
    responseData
  );
  return response.data;
};

// Complete a practice session
export const completePracticeSession = async (sessionId) => {
  const response = await axios.post(`/api/writing-practice/sessions/${sessionId}/complete`);
  return response.data;
};

// Get performance tracking data
export const getPerformanceTracking = async () => {
  const response = await axios.get('/api/writing-practice/performance');
  return response.data;
};

// Compare practice sessions
export const compareSessions = async (sessionIds) => {
  const params = { sessionIds: sessionIds.join(',') };
  const response = await axios.get('/api/writing-practice/performance/compare', { params });
  return response.data;
};

// Update nerve management progress
export const updateNerveManagement = async (data) => {
  const response = await axios.put('/api/writing-practice/nerve-management', data);
  return response.data;
};

// Get writing tips
export const getWritingTips = async (category = null) => {
  const params = category ? { category } : {};
  const response = await axios.get('/api/writing-practice/tips', { params });
  return response.data;
};
