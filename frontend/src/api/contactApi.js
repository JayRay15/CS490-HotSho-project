import api from './axios';

export const getContacts = (params) => {
    return api.get('/api/contacts', { params });
};

export const getContactById = (id) => {
    return api.get(`/api/contacts/${id}`);
};

export const createContact = (data) => {
    return api.post('/api/contacts', data);
};

export const updateContact = (id, data) => {
    return api.put(`/api/contacts/${id}`, data);
};

export const deleteContact = (id) => {
    return api.delete(`/api/contacts/${id}`);
};

export const addInteraction = (id, data) => {
    return api.post(`/api/contacts/${id}/interactions`, data);
};

export const getContactStats = () => {
    return api.get('/api/contacts/stats');
};

export const batchCreateContacts = (contacts) => {
    return api.post('/api/contacts/batch', { contacts });
};

// Discovery API endpoints
export const discoverContacts = (params) => {
    return api.get('/api/contacts/discover', { params });
};

export const getDiscoveryFilters = () => {
    return api.get('/api/contacts/discover/filters');
};

export const getSuggestedContacts = (params) => {
    return api.get('/api/contacts/discover/suggestions', { params });
};

export const trackDiscoveryAction = (data) => {
    return api.post('/api/contacts/discover/track', data);
};
