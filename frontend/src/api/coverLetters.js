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

// UC-054: Cover letter export functions
export const exportCoverLetterAsPdf = (id, payload) =>
  retryRequest(() => api.post(`/api/cover-letters/${id}/export/pdf`, payload, {
    responseType: 'blob'
  }));

export const exportCoverLetterAsDocx = (id, payload) =>
  retryRequest(() => api.post(`/api/cover-letters/${id}/export/docx`, payload, {
    responseType: 'blob'
  }));

export const exportCoverLetterAsHtml = (id, payload) =>
  retryRequest(() => api.post(`/api/cover-letters/${id}/export/html`, payload, {
    responseType: 'blob'
  }));

export const exportCoverLetterAsText = (id, payload) =>
  retryRequest(() => api.post(`/api/cover-letters/${id}/export/text`, payload, {
    responseType: 'blob'
  }));

export const generateEmailTemplate = (id, payload) =>
  retryRequest(() => api.post(`/api/cover-letters/${id}/email-template`, payload));
