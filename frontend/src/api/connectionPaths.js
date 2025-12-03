import api from './axios';

// Find connection paths to a target company/person
export const findConnectionPaths = async (params) => {
  const response = await api.get('/api/contacts/connection-paths', { params });
  return response.data;
};

// Path type labels
export const PATH_TYPE_LABELS = {
  direct: 'Direct Connection',
  indirect: 'Through Mutual Connection',
  alumni_network: 'Alumni Network',
  industry_group: 'Industry Group'
};

// Strength colors
export const STRENGTH_COLORS = {
  strong: 'text-green-600 bg-green-100',
  medium: 'text-yellow-600 bg-yellow-100',
  weak: 'text-gray-600 bg-gray-100'
};

// Degree labels
export const DEGREE_LABELS = {
  1: '1st Degree',
  2: '2nd Degree',
  3: '3rd Degree'
};

export default {
  findConnectionPaths,
  PATH_TYPE_LABELS,
  STRENGTH_COLORS,
  DEGREE_LABELS
};
