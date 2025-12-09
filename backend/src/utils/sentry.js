/**
 * Sentry Error Tracking Configuration
 * 
 * Integrates Sentry for error tracking, performance monitoring,
 * and alerting on critical errors.
 * 
 * Features:
 * - Automatic error capturing and reporting
 * - Performance transaction monitoring
 * - Release tracking
 * - Environment-based configuration
 * - User context attachment
 * - Breadcrumb logging for debugging
 * 
 * Setup Instructions:
 * 1. Create a free Sentry account at https://sentry.io
 * 2. Create a new project (Node.js)
 * 3. Copy the DSN from Project Settings > Client Keys
 * 4. Add SENTRY_DSN to your .env file
 */

import logger from './logger.js';

// Sentry placeholder - will be initialized when the package is installed
let Sentry = null;

/**
 * Initialize Sentry error tracking
 * Call this at application startup
 */
export async function initializeSentry() {
    const dsn = process.env.SENTRY_DSN;

    if (!dsn) {
        logger.info('Sentry DSN not configured - error tracking disabled', {
            hint: 'Set SENTRY_DSN environment variable to enable Sentry'
        });
        return null;
    }

    try {
        // Dynamic import to handle cases where Sentry is not installed
        const SentryModule = await import('@sentry/node');
        Sentry = SentryModule;

        Sentry.init({
            dsn,
            environment: process.env.NODE_ENV || 'development',
            release: process.env.APP_VERSION || '1.0.0',

            // Enable tracing for performance monitoring
            tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

            // Enable profiling in production
            profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,

            // Configure which errors to ignore
            ignoreErrors: [
                // Ignore common non-critical errors
                'TokenExpiredError',
                'JsonWebTokenError',
                'ECONNRESET',
                'ENOTFOUND'
            ],

            // Before sending event to Sentry
            beforeSend(event, hint) {
                // Filter out certain errors
                const error = hint?.originalException;

                // Don't send 4xx client errors
                if (error?.statusCode >= 400 && error?.statusCode < 500) {
                    return null;
                }

                // Add additional context
                event.tags = event.tags || {};
                event.tags.service = 'jobhunter-api';

                return event;
            },

            // Breadcrumb configuration
            beforeBreadcrumb(breadcrumb) {
                // Filter out noisy breadcrumbs
                if (breadcrumb.category === 'http' && breadcrumb.data?.url?.includes('/health')) {
                    return null;
                }
                return breadcrumb;
            }
        });

        // Make Sentry available globally for the logger
        global.Sentry = Sentry;

        logger.info('Sentry error tracking initialized', {
            environment: process.env.NODE_ENV,
            release: process.env.APP_VERSION || '1.0.0'
        });

        return Sentry;
    } catch (error) {
        // Sentry package not installed - this is fine
        if (error.code === 'ERR_MODULE_NOT_FOUND') {
            logger.info('Sentry package not installed - error tracking disabled', {
                hint: 'Run: npm install @sentry/node to enable Sentry'
            });
        } else {
            logger.warn('Failed to initialize Sentry', {
                error: error.message
            });
        }
        return null;
    }
}

/**
 * Sentry Express error handler middleware
 * Must be added BEFORE any other error-handling middleware
 */
export function sentryErrorHandler() {
    return (err, req, res, next) => {
        if (Sentry) {
            // Set user context
            if (req.user || req.auth) {
                Sentry.setUser({
                    id: req.user?.id || req.auth?.userId,
                    email: req.user?.email
                });
            }

            // Add request context
            Sentry.setContext('request', {
                method: req.method,
                path: req.path,
                query: req.query,
                headers: {
                    'user-agent': req.headers['user-agent'],
                    'content-type': req.headers['content-type']
                }
            });

            // Capture the exception
            Sentry.captureException(err);
        }
        next(err);
    };
}

/**
 * Sentry request handler middleware
 * Must be added BEFORE all routes
 */
export function sentryRequestHandler() {
    return (req, res, next) => {
        // Generate a unique request ID for tracing
        const requestId = req.headers['x-request-id'] ||
            `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        req.requestId = requestId;
        res.setHeader('X-Request-ID', requestId);

        // In Sentry SDK v8+, tracing is automatic when tracesSampleRate > 0
        // No manual transaction creation needed
        next();
    };
}

/**
 * Create a Sentry breadcrumb for debugging
 */
export function addBreadcrumb(message, category = 'app', level = 'info', data = {}) {
    if (Sentry) {
        Sentry.addBreadcrumb({
            message,
            category,
            level,
            data,
            timestamp: Date.now() / 1000
        });
    }
}

/**
 * Set user context for Sentry
 */
export function setUser(user) {
    if (Sentry && user) {
        Sentry.setUser({
            id: user.id || user._id,
            email: user.email,
            username: user.username || user.name
        });
    }
}

/**
 * Capture a custom message in Sentry
 */
export function captureMessage(message, level = 'info', extra = {}) {
    if (Sentry) {
        Sentry.captureMessage(message, {
            level,
            extra
        });
    }
}

/**
 * Capture an exception in Sentry
 */
export function captureException(error, extra = {}) {
    if (Sentry) {
        Sentry.captureException(error, {
            extra
        });
    }

    // Also log to our logger
    logger.error(error.message || 'Unknown error', {
        error: error.message,
        stack: error.stack,
        ...extra
    });
}

/**
 * Get Sentry instance (for advanced usage)
 */
export function getSentry() {
    return Sentry;
}

export default {
    initializeSentry,
    sentryErrorHandler,
    sentryRequestHandler,
    addBreadcrumb,
    setUser,
    captureMessage,
    captureException,
    getSentry
};
