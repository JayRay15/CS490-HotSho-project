import api, { retryRequest } from "./axios";

export const fetchResumes = () => retryRequest(() => api.get("/api/resume/resumes"));
export const createResume = (payload) => retryRequest(() => api.post("/api/resume/resumes", payload));
export const updateResume = (id, payload) => retryRequest(() => api.put(`/api/resume/resumes/${id}`, payload));
export const deleteResume = (id) => retryRequest(() => api.delete(`/api/resume/resumes/${id}`));

// UC-51: Export resume in different formats
export const exportResumePDF = (id, watermark = null) => 
  retryRequest(() => api.get(`/api/resume/resumes/${id}/pdf`, { 
    responseType: 'blob',
    params: watermark ? { watermark: watermark.text, watermarkEnabled: watermark.enabled } : {}
  }));

export const exportResumeDOCX = (id, watermark = null) => 
  retryRequest(() => api.get(`/api/resume/resumes/${id}/docx`, { 
    responseType: 'blob',
    params: watermark ? { watermark: watermark.text, watermarkEnabled: watermark.enabled } : {}
  }));

export const exportResumeHTML = (id) => 
  retryRequest(() => api.get(`/api/resume/resumes/${id}/html`, { responseType: 'blob' }));

export const exportResumeText = (id) => 
  retryRequest(() => api.get(`/api/resume/resumes/${id}/txt`, { responseType: 'blob' }));

// UC-52: Version management
export const cloneResume = (id, newName, description = '') => 
  retryRequest(() => api.post(`/api/resume/resumes/${id}/clone`, { name: newName, description }));

export const compareResumes = (id1, id2) => 
  retryRequest(() => api.get(`/api/resume/resumes/${id1}/compare`, { params: { resumeId2: id2 } }));

export const setDefaultResume = (id) => 
  retryRequest(() => api.put(`/api/resume/resumes/${id}/set-default`));

export const archiveResume = (id) => 
  retryRequest(() => api.put(`/api/resume/resumes/${id}/archive`));

export const unarchiveResume = (id) => 
  retryRequest(() => api.put(`/api/resume/resumes/${id}/unarchive`));

export const mergeResumes = (targetId, sourceId, selectedChanges) => 
  retryRequest(() => api.post(`/api/resume/resumes/${targetId}/merge`, { sourceId, selectedChanges }));
