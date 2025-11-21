import api from './axios';

// Get all networking events
export const getNetworkingEvents = async (filters = {}) => {
  try {
    const response = await api.get('/api/networking-events', { params: filters });
    return response.data;
  } catch (error) {
    console.error('Error fetching networking events:', error);
    throw error;
  }
};

// Get single networking event by ID
export const getNetworkingEventById = async (id) => {
  try {
    const response = await api.get(`/api/networking-events/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching networking event:', error);
    throw error;
  }
};

// Create new networking event
export const createNetworkingEvent = async (eventData) => {
  try {
    const response = await api.post('/api/networking-events', eventData);
    return response.data;
  } catch (error) {
    console.error('Error creating networking event:', error);
    throw error;
  }
};

// Update networking event
export const updateNetworkingEvent = async (id, eventData) => {
  try {
    const response = await api.put(`/api/networking-events/${id}`, eventData);
    return response.data;
  } catch (error) {
    console.error('Error updating networking event:', error);
    throw error;
  }
};

// Delete networking event
export const deleteNetworkingEvent = async (id) => {
  try {
    const response = await api.delete(`/api/networking-events/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting networking event:', error);
    throw error;
  }
};

// Get networking statistics
export const getNetworkingStats = async () => {
  try {
    const response = await api.get('/api/networking-events/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching networking stats:', error);
    throw error;
  }
};

// Add connection to event
export const addConnection = async (eventId, connectionData) => {
  try {
    const response = await api.post(`/api/networking-events/${eventId}/connections`, connectionData);
    return response.data;
  } catch (error) {
    console.error('Error adding connection:', error);
    throw error;
  }
};

// Update connection
export const updateConnection = async (eventId, connectionId, connectionData) => {
  try {
    const response = await api.put(`/api/networking-events/${eventId}/connections/${connectionId}`, connectionData);
    return response.data;
  } catch (error) {
    console.error('Error updating connection:', error);
    throw error;
  }
};

// Delete connection
export const deleteConnection = async (eventId, connectionId) => {
  try {
    const response = await api.delete(`/api/networking-events/${eventId}/connections/${connectionId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting connection:', error);
    throw error;
  }
};

// Discover events from Eventbrite
export const discoverEvents = async (searchParams = {}) => {
  try {
    const response = await api.get('/api/networking-events/discover', { params: searchParams });
    return response.data;
  } catch (error) {
    console.error('Error discovering events:', error);
    throw error;
  }
};

// Get event categories
export const getEventCategories = async () => {
  try {
    const response = await api.get('/api/networking-events/categories');
    return response.data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};
