/**
 * Monitoring Routes
 * 
 * Provides endpoints for:
 * - Health checks (for UptimeRobot and load balancers)
 * - Metrics dashboard data
 * - System status information
 * - Alert management
 */

import express from 'express';
import mongoose from 'mongoose';
import logger from '../utils/logger.js';
import { getAPIPerformanceMetrics } from '../middleware/requestLogging.js';

const router = express.Router();

/**
 * @route   GET /api/monitoring/health
 * @desc    Basic health check for uptime monitoring (UptimeRobot)
 * @access  Public
 */
router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

/**
 * @route   GET /api/monitoring/health/detailed
 * @desc    Detailed health check with service status
 * @access  Public
 */
router.get('/health/detailed', async (req, res) => {
    const startTime = Date.now();
    const checks = {
        api: { status: 'healthy', latency: 0 },
        database: { status: 'unknown', latency: 0 },
        memory: { status: 'unknown', usage: {} }
    };

    // Check MongoDB connection
    try {
        const dbStartTime = Date.now();
        const dbState = mongoose.connection.readyState;

        if (dbState === 1) {
            // Ping the database
            await mongoose.connection.db.admin().ping();
            checks.database = {
                status: 'healthy',
                latency: Date.now() - dbStartTime,
                state: 'connected'
            };
        } else {
            const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
            checks.database = {
                status: 'unhealthy',
                latency: Date.now() - dbStartTime,
                state: states[dbState] || 'unknown'
            };
        }
    } catch (error) {
        checks.database = {
            status: 'unhealthy',
            error: error.message,
            latency: Date.now() - startTime
        };
    }

    // Check memory usage
    const memUsage = process.memoryUsage();
    const totalMemoryMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    const usedMemoryMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const memoryUsagePercent = ((usedMemoryMB / totalMemoryMB) * 100).toFixed(1);

    checks.memory = {
        status: parseFloat(memoryUsagePercent) < 90 ? 'healthy' : 'warning',
        usage: {
            heapUsed: `${usedMemoryMB}MB`,
            heapTotal: `${totalMemoryMB}MB`,
            external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
            rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
            usagePercent: `${memoryUsagePercent}%`
        }
    };

    // Calculate overall status
    const isHealthy = Object.values(checks).every(
        check => check.status === 'healthy' || check.status === 'warning'
    );

    // Check API latency
    checks.api.latency = Date.now() - startTime;

    res.status(isHealthy ? 200 : 503).json({
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        checks
    });
});

/**
 * @route   GET /api/monitoring/ready
 * @desc    Readiness check - is the service ready to accept traffic?
 * @access  Public
 */
router.get('/ready', (req, res) => {
    const dbReady = mongoose.connection.readyState === 1;

    if (dbReady) {
        res.status(200).json({
            status: 'ready',
            timestamp: new Date().toISOString()
        });
    } else {
        res.status(503).json({
            status: 'not ready',
            reason: 'Database not connected',
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * @route   GET /api/monitoring/live
 * @desc    Liveness check - is the service alive?
 * @access  Public
 */
router.get('/live', (req, res) => {
    res.status(200).json({
        status: 'alive',
        timestamp: new Date().toISOString(),
        pid: process.pid
    });
});

/**
 * @route   GET /api/monitoring/metrics
 * @desc    Get application metrics for dashboard
 * @access  Public (but could be protected in production)
 */
router.get('/metrics', (req, res) => {
    try {
        const loggerMetrics = logger.getMetrics();
        const apiMetrics = getAPIPerformanceMetrics();

        // System metrics
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();

        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            metrics: {
                application: {
                    uptime: process.uptime(),
                    version: process.env.APP_VERSION || '1.0.0',
                    environment: process.env.NODE_ENV || 'development',
                    nodeVersion: process.version
                },
                system: {
                    memory: {
                        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
                        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
                        external: Math.round(memUsage.external / 1024 / 1024),
                        rss: Math.round(memUsage.rss / 1024 / 1024)
                    },
                    cpu: {
                        user: Math.round(cpuUsage.user / 1000),
                        system: Math.round(cpuUsage.system / 1000)
                    }
                },
                logging: loggerMetrics,
                api: {
                    endpoints: apiMetrics,
                    summary: summarizeAPIMetrics(apiMetrics)
                }
            }
        });
    } catch (error) {
        logger.error('Failed to get metrics', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve metrics'
        });
    }
});

/**
 * @route   GET /api/monitoring/dashboard
 * @desc    Get comprehensive dashboard data
 * @access  Public (should be protected in production)
 */
router.get('/dashboard', async (req, res) => {
    try {
        const loggerMetrics = logger.getMetrics();
        const apiMetrics = getAPIPerformanceMetrics();

        // Get database stats
        let dbStats = null;
        if (mongoose.connection.readyState === 1) {
            try {
                dbStats = await mongoose.connection.db.stats();
            } catch (e) {
                // Ignore DB stats error
            }
        }

        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            dashboard: {
                overview: {
                    status: 'healthy',
                    uptime: formatUptime(process.uptime()),
                    version: process.env.APP_VERSION || '1.0.0',
                    environment: process.env.NODE_ENV || 'development'
                },
                errors: {
                    lastHour: loggerMetrics.errors.lastHour,
                    lastDay: loggerMetrics.errors.lastDay,
                    recentErrors: loggerMetrics.errors.recent.map(e => ({
                        message: e.message,
                        timestamp: new Date(e.timestamp).toISOString(),
                        path: e.path
                    }))
                },
                performance: {
                    requestsLastHour: loggerMetrics.requests.lastHour,
                    errorRate: loggerMetrics.requests.errorRate + '%',
                    avgResponseTime: loggerMetrics.requests.avgResponseTime + 'ms',
                    slowOperations: loggerMetrics.performance.slowOperations
                },
                api: {
                    topEndpoints: getTopEndpoints(apiMetrics, 10),
                    errorProneEndpoints: getErrorProneEndpoints(apiMetrics, 5),
                    slowEndpoints: getSlowEndpoints(apiMetrics, 5)
                },
                database: dbStats ? {
                    collections: dbStats.collections,
                    documents: dbStats.objects,
                    storageSize: formatBytes(dbStats.storageSize),
                    avgObjSize: formatBytes(dbStats.avgObjSize)
                } : null,
                memory: {
                    used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
                    total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
                }
            }
        });
    } catch (error) {
        logger.error('Failed to get dashboard data', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve dashboard data'
        });
    }
});

/**
 * @route   POST /api/monitoring/test-error
 * @desc    Test endpoint to trigger an error for verification
 * @access  Public (should be disabled in production)
 */
router.post('/test-error', (req, res) => {
    if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_TEST_ERRORS) {
        return res.status(403).json({
            success: false,
            error: 'Test errors disabled in production'
        });
    }

    const { type = 'error' } = req.body;

    logger.info('Test error triggered', { type });

    if (type === 'warning') {
        logger.warn('Test warning generated', { source: 'test-error-endpoint' });
        return res.json({ success: true, message: 'Warning logged' });
    }

    if (type === 'exception') {
        throw new Error('Test exception from monitoring endpoint');
    }

    logger.error('Test error generated', {
        source: 'test-error-endpoint',
        error: 'This is a test error'
    });

    res.json({ success: true, message: 'Error logged' });
});

// ============================================================================
// Helper Functions
// ============================================================================

function summarizeAPIMetrics(metrics) {
    const endpoints = Object.values(metrics);
    if (endpoints.length === 0) {
        return {
            totalRequests: 0,
            totalErrors: 0,
            avgErrorRate: 0,
            avgLatency: 0
        };
    }

    const totalRequests = endpoints.reduce((acc, m) => acc + m.totalRequests, 0);
    const totalErrors = endpoints.reduce((acc, m) => acc + m.totalErrors, 0);
    const avgLatency = Math.round(
        endpoints.reduce((acc, m) => acc + m.avgDuration, 0) / endpoints.length
    );

    return {
        totalRequests,
        totalErrors,
        avgErrorRate: totalRequests > 0 ? ((totalErrors / totalRequests) * 100).toFixed(2) : 0,
        avgLatency
    };
}

function getTopEndpoints(metrics, limit = 10) {
    return Object.entries(metrics)
        .sort((a, b) => b[1].totalRequests - a[1].totalRequests)
        .slice(0, limit)
        .map(([endpoint, data]) => ({
            endpoint,
            requests: data.totalRequests,
            avgLatency: data.avgDuration + 'ms'
        }));
}

function getErrorProneEndpoints(metrics, limit = 5) {
    return Object.entries(metrics)
        .filter(([_, data]) => data.totalErrors > 0)
        .sort((a, b) => b[1].errorRate - a[1].errorRate)
        .slice(0, limit)
        .map(([endpoint, data]) => ({
            endpoint,
            errors: data.totalErrors,
            errorRate: data.errorRate + '%'
        }));
}

function getSlowEndpoints(metrics, limit = 5) {
    return Object.entries(metrics)
        .sort((a, b) => b[1].p95Duration - a[1].p95Duration)
        .slice(0, limit)
        .map(([endpoint, data]) => ({
            endpoint,
            p95Latency: data.p95Duration + 'ms',
            maxLatency: data.maxDuration + 'ms'
        }));
}

function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

    return parts.join(' ');
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default router;
