import api, { retryRequest } from "./axios";

// Get prediction for a specific interview
export const getPrediction = (interviewId) =>
  retryRequest(() => api.get(`/api/interview-predictions/${interviewId}`));

// Get all predictions for current user
export const getAllUserPredictions = (params) =>
  retryRequest(() => api.get('/api/interview-predictions/user/all', { params }));

// Get predictions for upcoming interviews
export const getUpcomingPredictions = () =>
  retryRequest(() => api.get('/api/interview-predictions/upcoming/list'));

// Force recalculation of prediction
export const recalculatePrediction = (interviewId) =>
  retryRequest(() => api.post(`/api/interview-predictions/${interviewId}/recalculate`));

// Mark recommendation as completed
export const completeRecommendation = (interviewId, recommendationId) =>
  retryRequest(() => 
    api.put(`/api/interview-predictions/${interviewId}/recommendations/${recommendationId}/complete`)
  );

// Undo completed recommendation
export const uncompleteRecommendation = (interviewId, recommendationId) =>
  retryRequest(() => 
    api.delete(`/api/interview-predictions/${interviewId}/recommendations/${recommendationId}/complete`)
  );

// Record actual interview outcome
export const recordOutcome = (interviewId, outcomeData) =>
  retryRequest(() => 
    api.post(`/api/interview-predictions/${interviewId}/outcome`, outcomeData)
  );

// Get prediction accuracy analytics
export const getAnalytics = () =>
  retryRequest(() => api.get('/api/interview-predictions/analytics/accuracy'));

// Compare success probabilities across interviews
export const compareInterviews = (interviewIds) =>
  retryRequest(() => 
    api.get('/api/interview-predictions/comparison/interviews', {
      params: { interviewIds: interviewIds.join(',') }
    })
  );

export default {
  getPrediction,
  getAllUserPredictions,
  getUpcomingPredictions,
  recalculatePrediction,
  completeRecommendation,
  uncompleteRecommendation,
  recordOutcome,
  getAnalytics,
  compareInterviews,
};
