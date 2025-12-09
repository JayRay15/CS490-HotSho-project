import api from "./axios";

/**
 * UC-123: Job-Specific Competitive Analysis API
 * Analyze user's competitiveness for specific job postings
 */

/**
 * Get competitive analysis for a specific job
 * @param {string} jobId - The job ID to analyze
 * @returns {Promise} - Analysis data including:
 *   - applicantEstimate: Estimated number of applicants
 *   - competitiveScore: User's competitive score (0-100)
 *   - competitiveAdvantages: User's advantages for this role
 *   - competitiveDisadvantages: Areas to improve with mitigation strategies
 *   - interviewLikelihood: Low/Medium/High with confidence percentage
 *   - differentiationStrategies: Strategies to stand out
 *   - typicalHiredProfile: Comparison to typical hired candidates
 *   - applicationPriority: Priority recommendation for this application
 */
export const getJobCompetitiveAnalysis = async (jobId) => {
    const response = await api.get(`/api/jobs/${jobId}/competitive-analysis`);
    return response.data;
};

export default {
    getJobCompetitiveAnalysis,
};
