import api, { retryRequest } from "./axios";

export const fetchResumes = () => retryRequest(() => api.get("/api/resume/resumes"));
export const createResume = (payload) => retryRequest(() => api.post("/api/resume/resumes", payload));
export const updateResume = (id, payload) => retryRequest(() => api.put(`/api/resume/resumes/${id}`, payload));
export const deleteResume = (id) => retryRequest(() => api.delete(`/api/resume/resumes/${id}`));
