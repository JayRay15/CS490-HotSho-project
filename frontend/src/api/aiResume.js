import api from "./axios";

/**
 * Generate resume with AI based on job posting
 * @param {string} jobId - Job ID to tailor resume for
 * @param {string} templateId - Template ID to use
 * @param {string} name - Resume name
 * @returns {Promise} API response with generated resume
 */
export const generateAIResume = async (jobId, templateId, name) => {
  // AI generation can take longer, so increase timeout to 60 seconds
  return await api.post("/api/resume/resumes/generate", {
    jobId,
    templateId,
    name,
  }, {
    timeout: 60000 // 60 seconds
  });
};

/**
 * Regenerate a specific section of a resume
 * @param {string} resumeId - Resume ID
 * @param {string} section - Section to regenerate (summary, experience, skills)
 * @returns {Promise} API response with updated resume
 */
export const regenerateResumeSection = async (resumeId, section) => {
  // Section regeneration can also take time, use 45 second timeout
  return await api.post(`/api/resume/resumes/${resumeId}/regenerate`, {
    section,
  }, {
    timeout: 45000 // 45 seconds
  });
};

/**
 * Analyze ATS compatibility of a resume
 * @param {string} resumeId - Resume ID
 * @returns {Promise} API response with ATS analysis
 */
export const analyzeATSCompatibility = async (resumeId) => {
  return await api.get(`/api/resume/resumes/${resumeId}/ats-analysis`);
};
