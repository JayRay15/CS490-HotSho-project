import api from './axios';

// Get all AI recommendations
export const getAIRecommendations = async () => {
  const response = await api.get('/api/ai-recommendations');
  return response.data;
};

// Mark recommendation as complete
export const completeRecommendation = async (recommendationId) => {
  const response = await api.post(`/api/ai-recommendations/${recommendationId}/complete`);
  return response.data;
};

// Dismiss recommendation
export const dismissRecommendation = async (recommendationId, reason) => {
  const response = await api.post(`/api/ai-recommendations/${recommendationId}/dismiss`, { reason });
  return response.data;
};

// Refresh recommendations
export const refreshRecommendations = async () => {
  const response = await api.post('/api/ai-recommendations/refresh');
  return response.data;
};

// Category icons mapping
export const CATEGORY_ICONS = {
  briefcase: 'Briefcase',
  video: 'Video',
  users: 'Users',
  'trending-up': 'TrendingUp',
  clock: 'Clock'
};

// Priority colors
export const PRIORITY_COLORS = {
  high: 'text-red-600 bg-red-100 border-red-200',
  medium: 'text-yellow-600 bg-yellow-100 border-yellow-200',
  low: 'text-green-600 bg-green-100 border-green-200'
};

// Category colors
export const CATEGORY_COLORS = {
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  green: 'bg-green-500',
  orange: 'bg-orange-500',
  indigo: 'bg-indigo-500'
};

export default {
  getAIRecommendations,
  completeRecommendation,
  dismissRecommendation,
  refreshRecommendations,
  CATEGORY_ICONS,
  PRIORITY_COLORS,
  CATEGORY_COLORS
};
