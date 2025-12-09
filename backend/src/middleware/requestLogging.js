/**
 * Request Logging Middleware
 * 
 * Provides comprehensive HTTP request/response logging with:
 * - Request timing and duration tracking
 * - Structured logging with searchable fields
 * - API response time metrics
 * - Error rate tracking
 * - Request ID generation for tracing
 */

import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';
import { addBreadcrumb } from '../utils/sentry.js';

/**
 * Generate request ID middleware
 * Adds a unique request ID to each request for tracing
 */
export const requestIdMiddleware = (req, res, next) => {
    // Use existing request ID from header or generate new one
    const requestId = req.headers['x-request-id'] || uuidv4();

    req.requestId = requestId;
    res.setHeader('X-Request-ID', requestId);

    next();
};

/**
 * Request timing middleware
 * Tracks request duration and logs completion
 */
export const requestTimingMiddleware = (req, res, next) => {
    const startTime = process.hrtime.bigint();
    const startDate = new Date();

    // Store start time on request
    req.startTime = startTime;
    req.startDate = startDate;

    // Capture original end function
    const originalEnd = res.end;

    // Override res.end to capture timing
    res.end = function (...args) {
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

        // Log the request completion
        const logData = {
            requestId: req.requestId,
            method: req.method,
            path: req.path,
            url: req.originalUrl,
            statusCode: res.statusCode,
            duration: Math.round(duration),
            userAgent: req.headers['user-agent'],
            ip: req.ip || req.connection?.remoteAddress,
            userId: req.user?.id || req.auth?.userId,
            contentLength: res.get('content-length'),
            query: Object.keys(req.query).length > 0 ? req.query : undefined
        };

        // Determine log level based on status code
        if (res.statusCode >= 500) {
            logger.error('Request failed with server error', logData);
        } else if (res.statusCode >= 400) {
            logger.warn('Request failed with client error', logData);
        } else if (duration > 5000) {
            logger.warn('Slow request detected', { ...logData, slow: true });
        } else {
            logger.http('Request completed', logData);
        }

        // Record request in metrics
        logger.recordRequest(req, res, duration);

        // Add Sentry breadcrumb
        addBreadcrumb(
            `${req.method} ${req.path} - ${res.statusCode}`,
            'http',
            res.statusCode >= 400 ? 'error' : 'info',
            { duration, statusCode: res.statusCode }
        );

        // Call original end
        return originalEnd.apply(this, args);
    };

    next();
};

/**
 * Skip logging for certain paths (like health checks)
 */
const SKIP_PATHS = [
    '/api/health',
    '/api/monitoring/health',
    '/favicon.ico',
    '/_next',
    '/static'
];

/**
 * Combined request logging middleware
 * Includes request ID generation and timing
 */
export const requestLoggingMiddleware = (req, res, next) => {
    // Skip logging for certain paths
    if (SKIP_PATHS.some(path => req.path.startsWith(path))) {
        return next();
    }

    // Apply request ID
    const requestId = req.headers['x-request-id'] || uuidv4();
    req.requestId = requestId;
    res.setHeader('X-Request-ID', requestId);

    // Apply timing
    const startTime = process.hrtime.bigint();
    req.startTime = startTime;

    // Log request start in debug mode
    logger.debug('Request started', {
        requestId,
        method: req.method,
        path: req.path,
        query: Object.keys(req.query).length > 0 ? req.query : undefined,
        body: process.env.LOG_REQUEST_BODY === 'true' ? sanitizeBody(req.body) : undefined
    });

    // Override res.end for timing
    const originalEnd = res.end;
    res.end = function (...args) {
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000;

        const logData = {
            requestId,
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration: Math.round(duration),
            userId: req.user?.id || req.auth?.userId
        };

        // Log based on status code
        if (res.statusCode >= 500) {
            logger.error('Request completed with server error', logData);
        } else if (res.statusCode >= 400) {
            logger.warn('Request completed with client error', logData);
        } else {
            logger.http('Request completed', logData);
        }

        // Record metrics
        logger.recordRequest(req, res, duration);

        return originalEnd.apply(this, args);
    };

    next();
};

/**
 * Sanitize request body to remove sensitive fields
 */
function sanitizeBody(body) {
    if (!body || typeof body !== 'object') return body;

    const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'authorization'];
    const sanitized = { ...body };

    for (const field of sensitiveFields) {
        if (sanitized[field]) {
            sanitized[field] = '[REDACTED]';
        }
    }

    return sanitized;
}

/**
 * API performance monitoring middleware
 * Tracks response times and error rates per endpoint
 */
const endpointMetrics = new Map();

export const apiPerformanceMiddleware = (req, res, next) => {
    const startTime = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const endpoint = `${req.method} ${req.route?.path || req.path}`;

        // Get or create endpoint metrics
        if (!endpointMetrics.has(endpoint)) {
            endpointMetrics.set(endpoint, {
                totalRequests: 0,
                totalErrors: 0,
                totalDuration: 0,
                maxDuration: 0,
                minDuration: Infinity,
                recentDurations: []
            });
        }

        const metrics = endpointMetrics.get(endpoint);
        metrics.totalRequests++;
        metrics.totalDuration += duration;
        metrics.maxDuration = Math.max(metrics.maxDuration, duration);
        metrics.minDuration = Math.min(metrics.minDuration, duration);

        // Track recent durations (last 100)
        metrics.recentDurations.push(duration);
        if (metrics.recentDurations.length > 100) {
            metrics.recentDurations.shift();
        }

        // Track errors
        if (res.statusCode >= 400) {
            metrics.totalErrors++;
        }
    });

    next();
};

/**
 * Get API performance metrics
 */
export function getAPIPerformanceMetrics() {
    const results = {};

    endpointMetrics.forEach((metrics, endpoint) => {
        const avgDuration = metrics.totalRequests > 0
            ? Math.round(metrics.totalDuration / metrics.totalRequests)
            : 0;

        const errorRate = metrics.totalRequests > 0
            ? ((metrics.totalErrors / metrics.totalRequests) * 100).toFixed(2)
            : 0;

        // Calculate p95 from recent durations
        const sortedDurations = [...metrics.recentDurations].sort((a, b) => a - b);
        const p95Index = Math.floor(sortedDurations.length * 0.95);
        const p95 = sortedDurations[p95Index] || 0;

        results[endpoint] = {
            totalRequests: metrics.totalRequests,
            totalErrors: metrics.totalErrors,
            errorRate: parseFloat(errorRate),
            avgDuration,
            minDuration: metrics.minDuration === Infinity ? 0 : metrics.minDuration,
            maxDuration: metrics.maxDuration,
            p95Duration: p95
        };
    });

    return results;
}

/**
 * Clear API performance metrics (for testing)
 */
export function clearAPIPerformanceMetrics() {
    endpointMetrics.clear();
}

export default {
    requestIdMiddleware,
    requestTimingMiddleware,
    requestLoggingMiddleware,
    apiPerformanceMiddleware,
    getAPIPerformanceMetrics,
    clearAPIPerformanceMetrics
};
