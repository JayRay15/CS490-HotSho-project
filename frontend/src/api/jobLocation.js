/**
 * Job Location API Client
 * Handles API calls for job location mapping, geocoding, and commute calculations
 */

import api, { setAuthToken } from "./axios";

/**
 * Get all jobs with their geocoded locations for map display
 * @param {Object} options - Filter options
 * @param {string} options.workMode - Filter by work mode (Remote, Hybrid, On-site)
 * @param {number} options.maxDistance - Filter by maximum distance from home (km)
 * @param {number} options.maxCommuteTime - Filter by maximum commute time (minutes)
 * @param {string} options.status - Filter by job status
 * @param {Function} getToken - Clerk getToken function
 */
export const getJobsWithLocations = async (options = {}, getToken) => {
  if (getToken) {
    const token = await getToken();
    setAuthToken(token);
  }

  const params = new URLSearchParams();
  if (options.workMode) params.append("workMode", options.workMode);
  if (options.maxDistance) params.append("maxDistance", options.maxDistance);
  if (options.maxCommuteTime) params.append("maxCommuteTime", options.maxCommuteTime);
  if (options.status) params.append("status", options.status);

  const response = await api.get(`/api/job-locations?${params.toString()}`);
  return response.data;
};

/**
 * Geocode a specific job's location
 * @param {string} jobId - The job ID to geocode
 * @param {Function} getToken - Clerk getToken function
 */
export const geocodeJobLocation = async (jobId, getToken) => {
  if (getToken) {
    const token = await getToken();
    setAuthToken(token);
  }

  const response = await api.post(`/api/job-locations/${jobId}/geocode`);
  return response.data;
};

/**
 * Batch geocode all jobs without coordinates
 * @param {Function} getToken - Clerk getToken function
 */
export const geocodeAllJobs = async (getToken) => {
  if (getToken) {
    const token = await getToken();
    setAuthToken(token);
  }

  const response = await api.post("/api/job-locations/geocode-all");
  return response.data;
};

/**
 * Set user's home location
 * @param {string} address - The home address to geocode
 * @param {Function} getToken - Clerk getToken function
 */
export const setHomeLocation = async (address, getToken) => {
  if (getToken) {
    const token = await getToken();
    setAuthToken(token);
  }

  const response = await api.put("/api/job-locations/home-location", { address });
  return response.data;
};

/**
 * Get user's home location
 * @param {Function} getToken - Clerk getToken function
 */
export const getHomeLocation = async (getToken) => {
  if (getToken) {
    const token = await getToken();
    setAuthToken(token);
  }

  const response = await api.get("/api/job-locations/home-location");
  return response.data;
};

/**
 * Compare multiple job locations
 * @param {string[]} jobIds - Array of job IDs to compare
 * @param {Function} getToken - Clerk getToken function
 */
export const compareJobLocations = async (jobIds, getToken) => {
  if (getToken) {
    const token = await getToken();
    setAuthToken(token);
  }

  const response = await api.post("/api/job-locations/compare", { jobIds });
  return response.data;
};

/**
 * Get commute details for a specific job
 * @param {string} jobId - The job ID
 * @param {Function} getToken - Clerk getToken function
 */
export const getCommuteDetails = async (jobId, getToken) => {
  if (getToken) {
    const token = await getToken();
    setAuthToken(token);
  }

  const response = await api.get(`/api/job-locations/${jobId}/commute`);
  return response.data;
};

export default {
  getJobsWithLocations,
  geocodeJobLocation,
  geocodeAllJobs,
  setHomeLocation,
  getHomeLocation,
  compareJobLocations,
  getCommuteDetails,
};
