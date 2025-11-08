import api from './axios';

/**
 * Employment API
 */
export const addEmployment = async (employmentData) => {
  const response = await api.post('/api/profile/employment', employmentData);
  return response.data;
};

export const updateEmployment = async (employmentId, employmentData) => {
  const response = await api.put(`/api/profile/employment/${employmentId}`, employmentData);
  return response.data;
};

export const deleteEmployment = async (employmentId) => {
  const response = await api.delete(`/api/profile/employment/${employmentId}`);
  return response.data;
};

/**
 * Skills API
 */
export const addSkill = async (skillData) => {
  const response = await api.post('/api/profile/skills', skillData);
  return response.data;
};

export const updateSkill = async (skillId, skillData) => {
  const response = await api.put(`/api/profile/skills/${skillId}`, skillData);
  return response.data;
};

export const deleteSkill = async (skillId) => {
  const response = await api.delete(`/api/profile/skills/${skillId}`);
  return response.data;
};

export const reorderSkills = async (skills) => {
  const response = await api.put('/api/profile/skills/reorder', { skills });
  return response.data;
};

/**
 * Education API
 */
export const addEducation = async (educationData) => {
  const response = await api.post('/api/profile/education', educationData);
  return response.data;
};

export const updateEducation = async (educationId, educationData) => {
  const response = await api.put(`/api/profile/education/${educationId}`, educationData);
  return response.data;
};

export const deleteEducation = async (educationId) => {
  const response = await api.delete(`/api/profile/education/${educationId}`);
  return response.data;
};

/**
 * Projects API
 */
export const addProject = async (projectData) => {
  const response = await api.post('/api/profile/projects', projectData);
  return response.data;
};

export const updateProject = async (projectId, projectData) => {
  const response = await api.put(`/api/profile/projects/${projectId}`, projectData);
  return response.data;
};

export const deleteProject = async (projectId) => {
  const response = await api.delete(`/api/profile/projects/${projectId}`);
  return response.data;
};

/**
 * Certifications API
 */
export const addCertification = async (certificationData) => {
  const response = await api.post('/api/profile/certifications', certificationData);
  return response.data;
};

export const updateCertification = async (certificationId, certificationData) => {
  const response = await api.put(`/api/profile/certifications/${certificationId}`, certificationData);
  return response.data;
};

export const deleteCertification = async (certificationId) => {
  const response = await api.delete(`/api/profile/certifications/${certificationId}`);
  return response.data;
};
