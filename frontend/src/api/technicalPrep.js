import api from './axios';

export const technicalPrepAPI = {
  // Get technical prep profile
  getTechnicalPrep: async () => {
    const response = await api.get('/technical-prep/profile');
    return response.data;
  },

  // Update technical prep settings
  updateTechnicalPrep: async (data) => {
    const response = await api.put('/technical-prep/profile', data);
    return response.data;
  },

  // Coding Challenges
  getCodingChallenges: async (params = {}) => {
    const response = await api.get('/api/technical-prep/coding-challenges', { params });
    return response.data;
  },

  getCodingChallenge: async (id) => {
    const response = await api.get(`/api/technical-prep/coding-challenges/${id}`);
    return response.data;
  },

  submitCodingSolution: async (challengeId, data) => {
    const response = await api.post(`/api/technical-prep/coding-challenges/${challengeId}/submit`, data);
    return response.data;
  },

  getHint: async (challengeId, hintIndex) => {
    const response = await api.get(`/api/technical-prep/coding-challenges/${challengeId}/hint`, {
      params: { hintIndex }
    });
    return response.data;
  },

  getSolution: async (challengeId) => {
    const response = await api.get(`/api/technical-prep/coding-challenges/${challengeId}/solution`);
    return response.data;
  },

  deleteCodingChallenge: async (id) => {
    const response = await api.delete(`/api/technical-prep/coding-challenges/${id}`);
    return response.data;
  },

  // System Design Questions
  getSystemDesignQuestions: async (params = {}) => {
    const response = await api.get('/api/technical-prep/system-design', { params });
    return response.data;
  },

  getSystemDesignQuestion: async (id) => {
    const response = await api.get(`/api/technical-prep/system-design/${id}`);
    return response.data;
  },

  submitSystemDesignSolution: async (questionId, data) => {
    const response = await api.post(`/api/technical-prep/system-design/${questionId}/submit`, data);
    return response.data;
  },

  deleteSystemDesignQuestion: async (id) => {
    const response = await api.delete(`/api/technical-prep/system-design/${id}`);
    return response.data;
  },

  // Case Studies
  getCaseStudies: async (params = {}) => {
    const response = await api.get('/api/technical-prep/case-studies', { params });
    return response.data;
  },

  getCaseStudy: async (id) => {
    const response = await api.get(`/api/technical-prep/case-studies/${id}`);
    return response.data;
  },

  submitCaseStudy: async (caseStudyId, data) => {
    const response = await api.post(`/api/technical-prep/case-studies/${caseStudyId}/submit`, data);
    return response.data;
  },

  deleteCaseStudy: async (id) => {
    const response = await api.delete(`/api/technical-prep/case-studies/${id}`);
    return response.data;
  },

  // Job-specific challenges
  getJobSpecificChallenges: async (jobId) => {
    const response = await api.get(`/api/technical-prep/job/${jobId}/challenges`);
    return response.data;
  },

  // Performance Analytics
  getPerformanceAnalytics: async () => {
    const response = await api.get('/api/technical-prep/performance');
    return response.data;
  },

  // Bookmarks
  bookmarkChallenge: async (data) => {
    const response = await api.post('/api/technical-prep/bookmark', data);
    return response.data;
  },

  removeBookmark: async (challengeId) => {
    const response = await api.delete(`/api/technical-prep/bookmark/${challengeId}`);
    return response.data;
  },

  getBookmarkedChallenges: async () => {
    const response = await api.get('/api/technical-prep/bookmarks');
    return response.data;
  }
};

export default technicalPrepAPI;
