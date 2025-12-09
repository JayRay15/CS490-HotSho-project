/**
 * Structured Logging Service
 * 
 * Provides structured logging with appropriate levels, searchable fields,
 * and integration points for external logging services like Sentry.
 * 
 * Log Levels:
 * - error: Critical errors that need immediate attention
 * - warn: Warning conditions that should be monitored
 * - info: Informational messages about normal operations
 * - http: HTTP request/response logging
 * - debug: Debug information for development
 * 
 * Features:
 * - Structured JSON logging with searchable fields
 * - Request context tracking (request ID, user ID, session)
 * - Performance timing for operations
 * - Error aggregation and metrics
 * - Integration with Sentry for error tracking
 */

import { v4 as uuidv4 } from 'uuid';

// Color codes for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m'
};

// Log level configuration
const LOG_LEVELS = {
    error: { priority: 0, color: colors.red, label: 'ERROR' },
    warn: { priority: 1, color: colors.yellow, label: 'WARN' },
    info: { priority: 2, color: colors.green, label: 'INFO' },
    http: { priority: 3, color: colors.cyan, label: 'HTTP' },
    debug: { priority: 4, color: colors.gray, label: 'DEBUG' }
};

// Get current log level from environment (default to 'info' in production, 'debug' in development)
const currentLogLevel = process.env.LOG_LEVEL ||
    (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

// In-memory metrics for monitoring dashboard
const metrics = {
    errors: [],
    warnings: [],
    requests: [],
    performance: [],
    startTime: Date.now()
};

// Maximum entries to keep in memory
const MAX_METRICS_ENTRIES = 1000;

/**
 * Format timestamp for logs
 */
function getTimestamp() {
    return new Date().toISOString();
}

/**
 * Determine if a message should be logged based on current level
 */
function shouldLog(level) {
    const levelConfig = LOG_LEVELS[level];
    const currentConfig = LOG_LEVELS[currentLogLevel] || LOG_LEVELS.info;
    return levelConfig.priority <= currentConfig.priority;
}

/**
 * Format log entry for console output
 */
function formatConsoleLog(level, message, meta = {}) {
    const levelConfig = LOG_LEVELS[level];
    const timestamp = getTimestamp();
    const prefix = `${colors.gray}[${timestamp}]${colors.reset} ${levelConfig.color}[${levelConfig.label}]${colors.reset}`;

    let output = `${prefix} ${message}`;

    if (Object.keys(meta).length > 0) {
        const metaStr = JSON.stringify(meta, null, process.env.NODE_ENV === 'development' ? 2 : 0);
        output += ` ${colors.gray}${metaStr}${colors.reset}`;
    }

    return output;
}

/**
 * Format log entry as structured JSON (for production/external services)
 */
function formatJsonLog(level, message, meta = {}) {
    return JSON.stringify({
        timestamp: getTimestamp(),
        level,
        message,
        ...meta,
        environment: process.env.NODE_ENV || 'development',
        service: 'jobhunter-api'
    });
}

/**
 * Add metrics entry (with max limit)
 */
function addMetricEntry(type, entry) {
    const collection = metrics[type];
    if (collection) {
        collection.push({ ...entry, timestamp: Date.now() });
        // Keep only the last MAX_METRICS_ENTRIES
        if (collection.length > MAX_METRICS_ENTRIES) {
            collection.shift();
        }
    }
}

/**
 * Core logging function
 */
function log(level, message, meta = {}) {
    if (!shouldLog(level)) return;

    const logEntry = {
        level,
        message,
        ...meta
    };

    // Console output (formatted for development, JSON for production)
    if (process.env.NODE_ENV === 'production') {
        console.log(formatJsonLog(level, message, meta));
    } else {
        console.log(formatConsoleLog(level, message, meta));
    }

    // Track metrics
    if (level === 'error') {
        addMetricEntry('errors', {
            message,
            ...meta
        });
    } else if (level === 'warn') {
        addMetricEntry('warnings', {
            message,
            ...meta
        });
    }

    return logEntry;
}

/**
 * Logger instance with all logging methods
 */
const logger = {
    /**
     * Log error level message
     * Use for critical errors that need immediate attention
     */
    error: (message, meta = {}) => {
        const entry = log('error', message, meta);

        // If Sentry is configured, capture the error
        if (global.Sentry && meta.error) {
            global.Sentry.captureException(meta.error, {
                tags: meta.tags || {},
                extra: meta
            });
        }

        return entry;
    },

    /**
     * Log warning level message
     * Use for warning conditions that should be monitored
     */
    warn: (message, meta = {}) => log('warn', message, meta),

    /**
     * Log info level message
     * Use for informational messages about normal operations
     */
    info: (message, meta = {}) => log('info', message, meta),

    /**
     * Log HTTP request/response
     * Use for API request tracking
     */
    http: (message, meta = {}) => log('http', message, meta),

    /**
     * Log debug level message
     * Use for detailed debugging information
     */
    debug: (message, meta = {}) => log('debug', message, meta),

    /**
     * Create a child logger with preset context
     */
    child: (context) => ({
        error: (message, meta = {}) => logger.error(message, { ...context, ...meta }),
        warn: (message, meta = {}) => logger.warn(message, { ...context, ...meta }),
        info: (message, meta = {}) => logger.info(message, { ...context, ...meta }),
        http: (message, meta = {}) => logger.http(message, { ...context, ...meta }),
        debug: (message, meta = {}) => logger.debug(message, { ...context, ...meta })
    }),

    /**
     * Create a request-scoped logger with request context
     */
    forRequest: (req) => {
        const requestId = req.requestId || req.headers['x-request-id'] || uuidv4();
        const context = {
            requestId,
            method: req.method,
            path: req.path,
            userId: req.user?.id || req.auth?.userId,
            ip: req.ip || req.connection?.remoteAddress
        };
        return logger.child(context);
    },

    /**
     * Time a function execution and log the result
     */
    time: async (operationName, fn, meta = {}) => {
        const startTime = Date.now();
        try {
            const result = await fn();
            const duration = Date.now() - startTime;
            logger.debug(`${operationName} completed`, {
                ...meta,
                duration,
                success: true
            });
            addMetricEntry('performance', {
                operation: operationName,
                duration,
                success: true,
                ...meta
            });
            return result;
        } catch (error) {
            const duration = Date.now() - startTime;
            logger.error(`${operationName} failed`, {
                ...meta,
                duration,
                success: false,
                error: error.message,
                stack: error.stack
            });
            addMetricEntry('performance', {
                operation: operationName,
                duration,
                success: false,
                error: error.message,
                ...meta
            });
            throw error;
        }
    },

    /**
     * Get current metrics for monitoring dashboard
     */
    getMetrics: () => {
        const now = Date.now();
        const oneHourAgo = now - 60 * 60 * 1000;
        const oneDayAgo = now - 24 * 60 * 60 * 1000;

        // Calculate error rates
        const recentErrors = metrics.errors.filter(e => e.timestamp > oneHourAgo);
        const dailyErrors = metrics.errors.filter(e => e.timestamp > oneDayAgo);

        // Calculate request metrics
        const recentRequests = metrics.requests.filter(r => r.timestamp > oneHourAgo);
        const errorRate = recentRequests.length > 0
            ? (recentErrors.length / recentRequests.length) * 100
            : 0;

        // Calculate average response time
        const avgResponseTime = recentRequests.length > 0
            ? recentRequests.reduce((acc, r) => acc + (r.duration || 0), 0) / recentRequests.length
            : 0;

        return {
            uptime: Math.floor((now - metrics.startTime) / 1000),
            errors: {
                lastHour: recentErrors.length,
                lastDay: dailyErrors.length,
                recent: recentErrors.slice(-10)
            },
            warnings: {
                lastHour: metrics.warnings.filter(w => w.timestamp > oneHourAgo).length,
                lastDay: metrics.warnings.filter(w => w.timestamp > oneDayAgo).length
            },
            requests: {
                lastHour: recentRequests.length,
                errorRate: errorRate.toFixed(2),
                avgResponseTime: Math.round(avgResponseTime)
            },
            performance: {
                slowOperations: metrics.performance
                    .filter(p => p.duration > 1000)
                    .slice(-10)
            }
        };
    },

    /**
     * Record a request for metrics
     */
    recordRequest: (req, res, duration) => {
        const entry = {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration,
            userId: req.user?.id || req.auth?.userId,
            success: res.statusCode < 400
        };
        addMetricEntry('requests', entry);

        // Log the HTTP request
        logger.http(`${req.method} ${req.path} ${res.statusCode}`, {
            duration,
            statusCode: res.statusCode,
            userId: entry.userId
        });
    },

    /**
     * Clear old metrics entries (for memory management)
     */
    clearOldMetrics: (maxAge = 24 * 60 * 60 * 1000) => {
        const cutoff = Date.now() - maxAge;
        Object.keys(metrics).forEach(key => {
            if (Array.isArray(metrics[key])) {
                metrics[key] = metrics[key].filter(entry => entry.timestamp > cutoff);
            }
        });
    }
};

// Set up periodic cleanup of old metrics (every hour)
setInterval(() => {
    logger.clearOldMetrics();
}, 60 * 60 * 1000);

export default logger;
export { logger, metrics };
