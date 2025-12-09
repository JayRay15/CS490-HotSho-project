import { trackAPICall, logAPIError, getUserFriendlyMessage, withFallback, checkRateLimit } from './apiTrackingService.js';

/**
 * UC-117: Tracked Gemini Service Wrapper
 * 
 * Provides wrapper functions to track Gemini API calls
 * without modifying the core geminiService.js file extensively
 */

/**
 * Wrap a Gemini API call with tracking
 * @param {Function} apiCall - The async function that makes the Gemini call
 * @param {Object} options - Tracking options
 * @returns {Promise} The result of the API call
 */
export async function trackGeminiCall(apiCall, options = {}) {
    const { endpoint = 'generateContent', userId = null, metadata = {} } = options;
    const startTime = Date.now();

    try {
        // Check rate limit before calling
        const rateLimitStatus = await checkRateLimit('gemini');
        if (!rateLimitStatus.allowed) {
            const error = new Error('Rate limit exceeded for Gemini API');
            error.isRateLimited = true;
            throw error;
        }

        const result = await apiCall();
        const responseTime = Date.now() - startTime;

        // Track successful call
        await trackAPICall({
            service: 'gemini',
            endpoint,
            method: 'POST',
            responseTime,
            statusCode: 200,
            success: true,
            userId,
            metadata
        });

        return result;
    } catch (error) {
        const responseTime = Date.now() - startTime;

        // Determine status code from error
        let statusCode = 500;
        if (error.isRateLimited) statusCode = 429;
        else if (error.status) statusCode = error.status;
        else if (error.message?.includes('RESOURCE_EXHAUSTED')) statusCode = 429;
        else if (error.message?.includes('INVALID_ARGUMENT')) statusCode = 400;
        else if (error.message?.includes('PERMISSION_DENIED')) statusCode = 403;

        // Track failed call
        await trackAPICall({
            service: 'gemini',
            endpoint,
            method: 'POST',
            responseTime,
            statusCode,
            success: false,
            errorMessage: error.message,
            errorCode: error.code,
            userId,
            metadata
        });

        // Log error details
        await logAPIError({
            service: 'gemini',
            endpoint,
            method: 'POST',
            statusCode,
            errorCode: error.code,
            errorMessage: error.message,
            errorStack: error.stack,
            userId
        });

        throw error;
    }
}

/**
 * Get a user-friendly error message for Gemini API failures
 * @param {Error} error - The error object
 * @returns {string} User-friendly message
 */
export function getGeminiUserMessage(error) {
    return getUserFriendlyMessage('gemini', error);
}

/**
 * Execute a Gemini call with automatic retry and fallback
 * @param {Function} primaryCall - The main API call
 * @param {Function} fallbackCall - Optional fallback function
 * @param {Object} options - Options for retry behavior
 * @returns {Promise} Result of the call
 */
export async function geminiWithFallback(primaryCall, fallbackCall = null, options = {}) {
    return withFallback(primaryCall, fallbackCall, {
        service: 'gemini',
        maxRetries: 3,
        retryDelay: 1000,
        fallbackMessage: 'AI generation is temporarily unavailable. Please try again in a few minutes.',
        ...options
    });
}

export default {
    trackGeminiCall,
    getGeminiUserMessage,
    geminiWithFallback
};
