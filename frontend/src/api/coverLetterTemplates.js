import api, { retryRequest } from "./axios";

export const fetchCoverLetterTemplates = (params) => 
  retryRequest(() => api.get("/api/cover-letter-templates", { params }));

export const getCoverLetterTemplateById = (id) => 
  retryRequest(() => api.get(`/api/cover-letter-templates/${id}`));

export const createCoverLetterTemplate = (payload) => 
  retryRequest(() => api.post("/api/cover-letter-templates", payload));

export const updateCoverLetterTemplate = (id, payload) => 
  retryRequest(() => api.put(`/api/cover-letter-templates/${id}`, payload));

export const deleteCoverLetterTemplate = (id) => 
  retryRequest(() => api.delete(`/api/cover-letter-templates/${id}`));

export const trackCoverLetterTemplateUsage = (id) => 
  retryRequest(() => api.post(`/api/cover-letter-templates/${id}/use`));

export const getCoverLetterTemplateAnalytics = () => 
  retryRequest(() => api.get("/api/cover-letter-templates/analytics/stats"));

export const importCoverLetterTemplate = (templateData) => 
  retryRequest(() => api.post("/api/cover-letter-templates/import", { templateData }));

export const exportCoverLetterTemplate = (id) => 
  retryRequest(() => api.get(`/api/cover-letter-templates/${id}/export`));

export const shareCoverLetterTemplate = (id, payload) => 
  retryRequest(() => api.put(`/api/cover-letter-templates/${id}/share`, payload));

export const getIndustryGuidance = (industry) => 
  retryRequest(() => api.get("/api/cover-letter-templates/industry-guidance", { params: industry ? { industry } : {} }));

// AI Generation APIs
export const generateAICoverLetter = (payload) => 
  retryRequest(() => api.post("/api/cover-letter/ai/generate", payload));

export const analyzeCompanyCulture = (jobDescription) => 
  retryRequest(() => api.post("/api/cover-letter/ai/analyze-culture", { jobDescription }));


