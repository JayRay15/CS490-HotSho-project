import api, { retryRequest } from "./axios";

export const fetchTemplates = () => retryRequest(() => api.get("/api/resume/templates"));
export const createTemplate = (payload) => retryRequest(() => api.post("/api/resume/templates", payload));
export const updateTemplate = (id, payload) => retryRequest(() => api.put(`/api/resume/templates/${id}`, payload));
export const deleteTemplate = (id) => retryRequest(() => api.delete(`/api/resume/templates/${id}`));
export const importTemplate = (payload) => retryRequest(() => api.post("/api/resume/templates/import", payload));
