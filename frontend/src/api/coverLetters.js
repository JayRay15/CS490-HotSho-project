import api, { retryRequest } from "./axios";

// Cover letter operations (actual cover letters, not templates)
export const fetchCoverLetters = () => 
  retryRequest(() => api.get("/api/cover-letters"));

export const createCoverLetter = (payload) => 
  retryRequest(() => api.post("/api/cover-letters", payload));

export const getCoverLetterById = (id) => 
  retryRequest(() => api.get(`/api/cover-letters/${id}`));

export const updateCoverLetter = (id, payload) => 
  retryRequest(() => api.put(`/api/cover-letters/${id}`, payload));

export const deleteCoverLetter = (id) => 
  retryRequest(() => api.delete(`/api/cover-letters/${id}`));

export const setDefaultCoverLetter = (id) => 
  retryRequest(() => api.put(`/api/cover-letters/${id}/set-default`));

export const archiveCoverLetter = (id) => 
  retryRequest(() => api.put(`/api/cover-letters/${id}/archive`));

export const unarchiveCoverLetter = (id) => 
  retryRequest(() => api.put(`/api/cover-letters/${id}/unarchive`));

export const cloneCoverLetter = (id, payload) => 
  retryRequest(() => api.post(`/api/cover-letters/${id}/clone`, payload));
