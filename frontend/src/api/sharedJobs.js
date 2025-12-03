import api from './axios';

// Share a job with team
export const shareJobWithTeam = async (teamId, data) => {
  const response = await api.post(`/api/teams/${teamId}/shared-jobs`, data);
  return response.data;
};

// Get shared jobs for team
export const getSharedJobs = async (teamId, params = {}) => {
  const response = await api.get(`/api/teams/${teamId}/shared-jobs`, { params });
  return response.data;
};

// Get single shared job
export const getSharedJob = async (teamId, sharedJobId) => {
  const response = await api.get(`/api/teams/${teamId}/shared-jobs/${sharedJobId}`);
  return response.data;
};

// Add comment to shared job
export const addComment = async (teamId, sharedJobId, data) => {
  const response = await api.post(`/api/teams/${teamId}/shared-jobs/${sharedJobId}/comments`, data);
  return response.data;
};

// Update comment
export const updateComment = async (teamId, sharedJobId, commentId, data) => {
  const response = await api.put(`/api/teams/${teamId}/shared-jobs/${sharedJobId}/comments/${commentId}`, data);
  return response.data;
};

// Delete comment
export const deleteComment = async (teamId, sharedJobId, commentId) => {
  const response = await api.delete(`/api/teams/${teamId}/shared-jobs/${sharedJobId}/comments/${commentId}`);
  return response.data;
};

// Add reaction to comment
export const addReaction = async (teamId, sharedJobId, commentId, type) => {
  const response = await api.post(`/api/teams/${teamId}/shared-jobs/${sharedJobId}/comments/${commentId}/reactions`, { type });
  return response.data;
};

// Toggle pin status
export const togglePin = async (teamId, sharedJobId) => {
  const response = await api.put(`/api/teams/${teamId}/shared-jobs/${sharedJobId}/pin`);
  return response.data;
};

// Archive shared job
export const archiveSharedJob = async (teamId, sharedJobId) => {
  const response = await api.put(`/api/teams/${teamId}/shared-jobs/${sharedJobId}/archive`);
  return response.data;
};

// Category labels
export const SHARE_CATEGORIES = {
  opportunity: 'Opportunity',
  discussion: 'Discussion',
  feedback_request: 'Feedback Request',
  success_story: 'Success Story',
  learning: 'Learning'
};

// Priority labels
export const PRIORITY_LABELS = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
  urgent: 'Urgent'
};

// Comment type labels
export const COMMENT_TYPES = {
  comment: 'Comment',
  recommendation: 'Recommendation',
  feedback: 'Feedback',
  question: 'Question',
  tip: 'Tip'
};

// Reaction types
export const REACTION_TYPES = {
  like: '👍',
  helpful: '💡',
  insightful: '🎯',
  celebrate: '🎉'
};

export default {
  shareJobWithTeam,
  getSharedJobs,
  getSharedJob,
  addComment,
  updateComment,
  deleteComment,
  addReaction,
  togglePin,
  archiveSharedJob,
  SHARE_CATEGORIES,
  PRIORITY_LABELS,
  COMMENT_TYPES,
  REACTION_TYPES
};
