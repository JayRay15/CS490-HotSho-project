import apiClient from "./apiClient";

// Get comprehensive predictive analytics dashboard
export const getPredictiveAnalyticsDashboard = async () => {
  const response = await apiClient.get("/predictive-analytics/dashboard");
  return response.data;
};

// Get interview success predictions
export const getInterviewSuccessPredictions = async () => {
  const response = await apiClient.get("/predictive-analytics/interview-success");
  return response.data;
};

// Get job search timeline forecast
export const getJobSearchTimelineForecast = async () => {
  const response = await apiClient.get("/predictive-analytics/job-search-timeline");
  return response.data;
};

// Get salary negotiation predictions
export const getSalaryPredictions = async () => {
  const response = await apiClient.get("/predictive-analytics/salary-predictions");
  return response.data;
};

// Get optimal timing predictions
export const getOptimalTimingPredictions = async () => {
  const response = await apiClient.get("/predictive-analytics/optimal-timing");
  return response.data;
};

// Get scenario planning analysis
export const getScenarioPlanning = async () => {
  const response = await apiClient.get("/predictive-analytics/scenarios");
  return response.data;
};

// Get improvement recommendations
export const getImprovementRecommendations = async () => {
  const response = await apiClient.get("/predictive-analytics/recommendations");
  return response.data;
};

// Get prediction accuracy tracking
export const getAccuracyTracking = async () => {
  const response = await apiClient.get("/predictive-analytics/accuracy");
  return response.data;
};
