import api from './axios';

// Get all documents with optional filters
export const getDocuments = async (params = {}) => {
  const response = await api.get('/api/documents', { params });
  return response.data;
};

// Get single document with version history
export const getDocument = async (id) => {
  const response = await api.get(`/api/documents/${id}`);
  return response.data;
};

// Get document statistics
export const getDocumentStats = async () => {
  const response = await api.get('/api/documents/stats');
  return response.data;
};

// Get documents linked to a job
export const getDocumentsByJob = async (jobId) => {
  const response = await api.get(`/api/documents/job/${jobId}`);
  return response.data;
};

// Create new document
export const createDocument = async (data) => {
  const response = await api.post('/api/documents', data);
  return response.data;
};

// Update document metadata
export const updateDocument = async (id, data) => {
  const response = await api.put(`/api/documents/${id}`, data);
  return response.data;
};

// Add new version to document
export const addDocumentVersion = async (id, versionData) => {
  const response = await api.post(`/api/documents/${id}/versions`, versionData);
  return response.data;
};

// Get specific version
export const getDocumentVersion = async (id, versionNumber) => {
  const response = await api.get(`/api/documents/${id}/versions/${versionNumber}`);
  return response.data;
};

// Restore version
export const restoreDocumentVersion = async (id, versionNumber) => {
  const response = await api.post(`/api/documents/${id}/versions/${versionNumber}/restore`);
  return response.data;
};

// Delete document (soft delete)
export const deleteDocument = async (id) => {
  const response = await api.delete(`/api/documents/${id}`);
  return response.data;
};

// Permanently delete document
export const permanentlyDeleteDocument = async (id) => {
  const response = await api.delete(`/api/documents/${id}/permanent`);
  return response.data;
};

// Link document to job
export const linkDocumentToJob = async (documentId, jobId) => {
  const response = await api.post(`/api/documents/${documentId}/link-job`, { jobId });
  return response.data;
};

// Unlink document from job
export const unlinkDocumentFromJob = async (documentId, jobId) => {
  const response = await api.delete(`/api/documents/${documentId}/link-job/${jobId}`);
  return response.data;
};

// Import existing documents from resume/cover letter system
export const importExistingDocuments = async () => {
  const response = await api.post('/api/documents/import');
  return response.data;
};

// Helper to convert file to base64
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

// Category display names
export const DOCUMENT_CATEGORIES = {
  resume: 'Resume',
  cover_letter: 'Cover Letter',
  certificate: 'Certificate',
  transcript: 'Transcript',
  portfolio: 'Portfolio',
  reference_letter: 'Reference Letter',
  writing_sample: 'Writing Sample',
  presentation: 'Presentation',
  other: 'Other'
};

// Category icons (for UI)
export const CATEGORY_ICONS = {
  resume: '📄',
  cover_letter: '✉️',
  certificate: '🏆',
  transcript: '📜',
  portfolio: '💼',
  reference_letter: '📝',
  writing_sample: '✍️',
  presentation: '📊',
  other: '📁'
};

export default {
  getDocuments,
  getDocument,
  getDocumentStats,
  getDocumentsByJob,
  createDocument,
  updateDocument,
  addDocumentVersion,
  getDocumentVersion,
  restoreDocumentVersion,
  deleteDocument,
  permanentlyDeleteDocument,
  linkDocumentToJob,
  unlinkDocumentFromJob,
  importExistingDocuments,
  fileToBase64,
  DOCUMENT_CATEGORIES,
  CATEGORY_ICONS
};
