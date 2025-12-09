/**
 * Sentry Error Tracking Configuration for Frontend
 * 
 * Integrates Sentry for error tracking, performance monitoring,
 * and session replay in the React application.
 * 
 * Features:
 * - Automatic error capturing and reporting
 * - Performance transaction monitoring
 * - Session replay for debugging
 * - User context attachment
 * - Release tracking
 * 
 * Setup Instructions:
 * 1. Create a free Sentry account at https://sentry.io
 * 2. Create a new project (React)
 * 3. Copy the DSN from Project Settings > Client Keys
 * 4. Add VITE_SENTRY_DSN to your .env file
 */

let Sentry = null;
let isInitialized = false;

/**
 * Initialize Sentry error tracking
 * Call this at application startup in main.jsx
 */
export async function initializeSentry() {
    const dsn = import.meta.env.VITE_SENTRY_DSN;

    if (!dsn) {
        console.info('Sentry DSN not configured - error tracking disabled');
        console.info('Set VITE_SENTRY_DSN environment variable to enable Sentry');
        return null;
    }

    try {
        // Dynamic import to handle cases where Sentry is not installed
        const SentryModule = await import('@sentry/react');
        Sentry = SentryModule;

        Sentry.init({
            dsn,
            environment: import.meta.env.MODE || 'development',
            release: import.meta.env.VITE_APP_VERSION || '1.0.0',

            // Enable tracing for performance monitoring
            integrations: [
                Sentry.browserTracingIntegration(),
                Sentry.replayIntegration({
                    // Capture 10% of all sessions for replay
                    maskAllText: false,
                    blockAllMedia: false,
                }),
            ],

            // Sampling rates
            tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
            replaysSessionSampleRate: 0.1,
            replaysOnErrorSampleRate: 1.0,

            // Configure which errors to ignore
            ignoreErrors: [
                // Ignore common non-critical errors
                'ResizeObserver loop limit exceeded',
                'ResizeObserver loop completed with undelivered notifications',
                'Non-Error promise rejection captured',
                'Loading chunk',
                'Loading CSS chunk',
                // Network errors that are expected
                'Network request failed',
                'Failed to fetch'
            ],

            // Before sending event to Sentry
            beforeSend(event, hint) {
                // Filter out certain errors
                const error = hint?.originalException;

                // Don't send errors from browser extensions
                if (error?.stack?.includes('chrome-extension://')) {
                    return null;
                }

                // Add additional context
                event.tags = event.tags || {};
                event.tags.service = 'jobhunter-frontend';

                return event;
            },

            // Breadcrumb configuration
            beforeBreadcrumb(breadcrumb) {
                // Filter out noisy breadcrumbs
                if (breadcrumb.category === 'xhr' && breadcrumb.data?.url?.includes('/health')) {
                    return null;
                }
                return breadcrumb;
            }
        });

        isInitialized = true;
        console.info('Sentry error tracking initialized');

        return Sentry;
    } catch (error) {
        // Sentry package not installed - this is fine
        if (error.message?.includes('Failed to resolve') || error.code === 'ERR_MODULE_NOT_FOUND') {
            console.info('Sentry package not installed - error tracking disabled');
            console.info('Run: npm install @sentry/react to enable Sentry');
        } else {
            console.warn('Failed to initialize Sentry:', error.message);
        }
        return null;
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
 * Clear user context (on logout)
 */
export function clearUser() {
    if (Sentry) {
        Sentry.setUser(null);
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
    // Always log to console as well
    console.error('Error captured:', error, extra);
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
 * Add a breadcrumb for debugging
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
 * Start a performance transaction
 */
export function startTransaction(name, op = 'navigation') {
    if (Sentry) {
        return Sentry.startTransaction({ name, op });
    }
    return null;
}

/**
 * Set additional context
 */
export function setContext(name, context) {
    if (Sentry) {
        Sentry.setContext(name, context);
    }
}

/**
 * Set a tag for filtering
 */
export function setTag(key, value) {
    if (Sentry) {
        Sentry.setTag(key, value);
    }
}

/**
 * Get Sentry instance (for advanced usage)
 */
export function getSentry() {
    return Sentry;
}

/**
 * Check if Sentry is initialized
 */
export function isSentryInitialized() {
    return isInitialized;
}

/**
 * Sentry Error Boundary wrapper component
 * Use this to wrap components that might throw errors
 */
export function withSentryErrorBoundary(Component, fallback) {
    if (!Sentry) {
        return Component;
    }
    return Sentry.withErrorBoundary(Component, { fallback });
}

export default {
    initializeSentry,
    setUser,
    clearUser,
    captureException,
    captureMessage,
    addBreadcrumb,
    startTransaction,
    setContext,
    setTag,
    getSentry,
    isSentryInitialized,
    withSentryErrorBoundary
};
