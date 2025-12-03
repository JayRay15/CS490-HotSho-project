import api from './axios';

// Get team benchmarks
export const getTeamBenchmarks = async (teamId, period = 'weekly') => {
  const response = await api.get(`/api/teams/${teamId}/benchmarks`, {
    params: { period }
  });
  return response.data;
};

// Generate fresh benchmark
export const generateBenchmark = async (teamId, period = 'weekly') => {
  const response = await api.post(`/api/teams/${teamId}/benchmarks/generate`, { period });
  return response.data;
};

// Get benchmark history
export const getBenchmarkHistory = async (teamId, period = 'weekly', limit = 12) => {
  const response = await api.get(`/api/teams/${teamId}/benchmarks/history`, {
    params: { period, limit }
  });
  return response.data;
};

// Get member benchmark
export const getMemberBenchmark = async (teamId, memberId, period = 'weekly') => {
  const response = await api.get(`/api/teams/${teamId}/benchmarks/members/${memberId}`, {
    params: { period }
  });
  return response.data;
};

// Get leaderboard
export const getLeaderboard = async (teamId, period = 'weekly', metric = 'overall') => {
  const response = await api.get(`/api/teams/${teamId}/leaderboard`, {
    params: { period, metric }
  });
  return response.data;
};

// Metric display helpers
export const PERIOD_LABELS = {
  weekly: 'This Week',
  monthly: 'This Month',
  quarterly: 'This Quarter'
};

export const METRIC_LABELS = {
  overall: 'Overall Score',
  applications: 'Applications',
  interviews: 'Interviews',
  offers: 'Offers',
  responseRate: 'Response Rate'
};

export const TREND_ICONS = {
  improving: '📈',
  stable: '➡️',
  declining: '📉'
};

export const INSIGHT_ICONS = {
  strength: '💪',
  improvement: '🎯',
  trend: '📊',
  milestone: '🏆'
};

export default {
  getTeamBenchmarks,
  generateBenchmark,
  getBenchmarkHistory,
  getMemberBenchmark,
  getLeaderboard,
  PERIOD_LABELS,
  METRIC_LABELS,
  TREND_ICONS,
  INSIGHT_ICONS
};
