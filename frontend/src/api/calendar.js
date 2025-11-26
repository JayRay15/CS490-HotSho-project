import api from "./axios";

/**
 * Get calendar connection status and preferences
 */
export const getCalendarStatus = async () => {
  const response = await api.get('/api/calendar/status');
  return response.data;
};

/**
 * Initiate Google Calendar OAuth flow
 */
export const initiateGoogleAuth = async () => {
  const response = await api.get('/api/calendar/google/auth');
  return response.data;
};

/**
 * Initiate Outlook Calendar OAuth flow
 */
export const initiateOutlookAuth = async () => {
  const response = await api.get('/api/calendar/outlook/auth');
  return response.data;
};

/**
 * Disconnect a calendar provider
 */
export const disconnectCalendar = async (provider) => {
  const response = await api.post(`/api/calendar/disconnect/${provider}`);
  return response.data;
};

/**
 * Update calendar preferences
 */
export const updateCalendarPreferences = async (preferences) => {
  const response = await api.put('/api/calendar/preferences', preferences);
  return response.data;
};
