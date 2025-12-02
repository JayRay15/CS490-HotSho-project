import api from "./axios";

/**
 * UC-104: Competitive Analysis and Benchmarking API
 */

/**
 * Get comprehensive competitive analysis data
 * Compares user performance against anonymous peer benchmarks
 */
export const getCompetitiveAnalysis = async () => {
    const response = await api.get('/api/competitive-analysis');
    return response.data;
};

/**
 * Get detailed skill gap analysis compared to top performers
 */
export const getSkillGapAnalysis = async () => {
    const response = await api.get('/api/competitive-analysis/skill-gaps');
    return response.data;
};

/**
 * Get market positioning analysis and recommendations
 */
export const getMarketPositioning = async () => {
    const response = await api.get('/api/competitive-analysis/positioning');
    return response.data;
};

/**
 * Get career progression patterns and analysis
 */
export const getCareerProgressionAnalysis = async () => {
    const response = await api.get('/api/competitive-analysis/career-progression');
    return response.data;
};
