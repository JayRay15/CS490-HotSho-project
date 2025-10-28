import axios from "axios";

// Create axios instance with base configuration
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000",
    timeout: 15000, // 15 second timeout
});

// Function to set the Auth0 token in axios headers
// This will be called from components after getting the token from Auth0
export const setAuthToken = (token) => {
    if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete api.defaults.headers.common['Authorization'];
    }
};

// Response interceptor for handling errors consistently
api.interceptors.response.use(
    (response) => {
        // Return successful responses as-is
        return response;
    },
    async (error) => {
        // Create standardized error object
        const customError = {
            message: "An unexpected error occurred",
            errorCode: null,
            errors: [],
            statusCode: 500,
            isNetworkError: false,
            canRetry: false
        };

        if (error.response) {
            // Server responded with error status
            const { data, status } = error.response;
            
            customError.statusCode = status;
            customError.message = data?.message || error.message || "Server error occurred";
            customError.errorCode = data?.errorCode || null;
            customError.errors = data?.errors || [];
            
            // Determine if error is retryable
            customError.canRetry = status >= 500 || status === 408 || status === 429;
            
        } else if (error.request) {
            // Request made but no response received (network error)
            customError.isNetworkError = true;
            customError.canRetry = true;
            customError.message = "Network error. Please check your internet connection.";
            customError.errorCode = 6001; // NETWORK_ERROR code
            
        } else {
            // Error in request setup
            customError.message = error.message || "Failed to make request";
        }

        // Attach custom error to original error object
        error.customError = customError;
        
        return Promise.reject(error);
    }
);

// Request interceptor for adding common headers
api.interceptors.request.use(
    (config) => {
        // Add timestamp to prevent caching issues
        config.headers['X-Request-Time'] = new Date().toISOString();
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

/**
 * Retry a failed request
 * @param {Function} requestFn - The function that makes the API request
 * @param {number} maxRetries - Maximum number of retry attempts
 * @returns {Promise} - The response from the successful request
 */
export const retryRequest = async (requestFn, maxRetries = 3) => {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await requestFn();
        } catch (error) {
            lastError = error;
            
            // Only retry if error is retryable
            if (!error.customError?.canRetry || i === maxRetries - 1) {
                throw error;
            }
            
            // Exponential backoff: wait 1s, 2s, 4s, etc.
            const delay = Math.pow(2, i) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    throw lastError;
};

/**
 * Extract user-friendly error message from error object
 * @param {Error} error - The error object from axios
 * @returns {string} - User-friendly error message
 */
export const getErrorMessage = (error) => {
    return error.customError?.message || error.message || "An unexpected error occurred";
};

/**
 * Extract field-specific validation errors
 * @param {Error} error - The error object from axios
 * @returns {Array} - Array of field errors {field, message, value}
 */
export const getValidationErrors = (error) => {
    return error.customError?.errors || [];
};

/**
 * Check if error is a specific type
 * @param {Error} error - The error object from axios
 * @param {number} errorCode - The error code to check
 * @returns {boolean}
 */
export const isErrorCode = (error, errorCode) => {
    return error.customError?.errorCode === errorCode;
};

export default api;
