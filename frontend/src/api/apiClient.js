// Minimal apiClient.js for axios instance
import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

export default apiClient;
