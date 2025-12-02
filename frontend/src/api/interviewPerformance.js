import apiClient from "./apiClient";

/**
 * Get comprehensive interview performance analytics
 */
export const getInterviewPerformanceAnalytics = async () => {
  const response = await apiClient.get("/interview-performance/analytics");
  return response.data;
};

/**
 * Get improvement trends over time
 */
export const getImprovementTrends = async (period = "6months") => {
  const response = await apiClient.get("/interview-performance/trends", {
    params: { period }
  });
  return response.data;
};

/**
 * Get personalized coaching recommendations
 */
export const getCoachingRecommendations = async () => {
  const response = await apiClient.get("/interview-performance/coaching");
  return response.data;
};

/**
 * Get performance benchmarks
 */
export const getPerformanceBenchmarks = async () => {
  const response = await apiClient.get("/interview-performance/benchmarks");
  return response.data;
};
