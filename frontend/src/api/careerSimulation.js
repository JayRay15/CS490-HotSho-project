import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

/**
 * UC-128: Career Path Simulation API Client
 */

/**
 * Create a new career path simulation
 * @param {Object} data - Simulation data
 * @param {Object} data.currentRole - Current role info (title, salary, level, industry, yearsOfExperience)
 * @param {Array} data.targetRoles - Array of target roles (can include jobId for existing jobs)
 * @param {Number} data.timeHorizon - Years to simulate (default 10)
 * @param {Object} data.successCriteria - User-defined weights for success criteria
 * @param {String} token - Auth token
 */
export const createCareerSimulation = async (data, token) => {
  const response = await axios.post(
    `${API_URL}/api/career-simulation`,
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
};

/**
 * Get all user's career simulations
 * @param {String} token - Auth token
 */
export const getUserSimulations = async (token) => {
  const response = await axios.get(
    `${API_URL}/api/career-simulation`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  return response.data;
};

/**
 * Get specific simulation by ID
 * @param {String} simulationId - Simulation ID
 * @param {String} token - Auth token
 */
export const getCareerSimulation = async (simulationId, token) => {
  const response = await axios.get(
    `${API_URL}/api/career-simulation/${simulationId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  return response.data;
};

/**
 * Get detailed path information
 * @param {String} simulationId - Simulation ID
 * @param {String} pathId - Path ID
 * @param {String} token - Auth token
 */
export const getPathDetails = async (simulationId, pathId, token) => {
  const response = await axios.get(
    `${API_URL}/api/career-simulation/${simulationId}/path/${pathId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  return response.data;
};

/**
 * Compare multiple paths
 * @param {String} simulationId - Simulation ID
 * @param {Array} pathIds - Array of path IDs to compare (optional, compares all if not provided)
 * @param {String} token - Auth token
 */
export const comparePaths = async (simulationId, pathIds, token) => {
  const response = await axios.post(
    `${API_URL}/api/career-simulation/${simulationId}/compare`,
    { pathIds },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
};

/**
 * Delete a simulation
 * @param {String} simulationId - Simulation ID
 * @param {String} token - Auth token
 */
export const deleteCareerSimulation = async (simulationId, token) => {
  const response = await axios.delete(
    `${API_URL}/api/career-simulation/${simulationId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  return response.data;
};
