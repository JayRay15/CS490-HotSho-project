// Mock axios API module for testing
import { vi } from 'vitest';

// Create a mock axios instance
const mockAxiosInstance = {
  get: vi.fn(() => Promise.resolve({ data: {} })),
  post: vi.fn(() => Promise.resolve({ data: {} })),
  put: vi.fn(() => Promise.resolve({ data: {} })),
  delete: vi.fn(() => Promise.resolve({ data: {} })),
  patch: vi.fn(() => Promise.resolve({ data: {} })),
  interceptors: {
    request: {
      use: vi.fn(),
      eject: vi.fn(),
    },
    response: {
      use: vi.fn(),
      eject: vi.fn(),
    },
  },
  defaults: {
    headers: {
      common: {},
    },
  },
};

// Mock setAuthToken function
export const setAuthToken = vi.fn();

// Export the mock axios instance as default
export default mockAxiosInstance;
