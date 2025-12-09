import { APIUsage, APIErrorLog, APIAlert, SERVICE_QUOTAS } from '../models/APIUsage.js';
import {
    getRemainingQuota,
    generateWeeklyReport,
    SERVICE_QUOTAS as QUOTA_CONFIG
} from '../utils/apiTrackingService.js';
import { successResponse, errorResponse, ERROR_CODES } from '../utils/responseFormat.js';

/**
 * UC-117: API Rate Limiting and Error Handling Dashboard
 * Controller for API monitoring endpoints
 */

/**
 * Get dashboard overview with all services summary
 * GET /api/api-monitoring/dashboard
 */
export const getDashboard = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);

        // Get today's usage for all services
        const todayUsage = await APIUsage.find({ date: today });

        // Get weekly summary
        const weeklySummary = await APIUsage.getUsageSummary(weekAgo, new Date());

        // Get recent errors (last 24 hours)
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentErrors = await APIErrorLog.countDocuments({
            timestamp: { $gte: yesterday }
        });

        // Get unacknowledged alerts
        const activeAlerts = await APIAlert.find({ acknowledged: false })
            .sort({ timestamp: -1 })
            .limit(10);

        // Get quota status for all services
        const quotaStatuses = await Promise.all(
            Object.keys(SERVICE_QUOTAS).map(service => getRemainingQuota(service))
        );

        // Calculate overall stats
        const todayTotals = todayUsage.reduce((acc, usage) => ({
            requests: acc.requests + usage.totalRequests,
            successful: acc.successful + usage.successfulRequests,
            failed: acc.failed + usage.failedRequests,
            rateLimitHits: acc.rateLimitHits + usage.rateLimitHits
        }), { requests: 0, successful: 0, failed: 0, rateLimitHits: 0 });

        const weeklyTotals = weeklySummary.reduce((acc, service) => ({
            requests: acc.requests + service.totalRequests,
            successful: acc.successful + service.successfulRequests,
            failed: acc.failed + service.failedRequests,
            rateLimitHits: acc.rateLimitHits + service.rateLimitHits
        }), { requests: 0, successful: 0, failed: 0, rateLimitHits: 0 });

        const dashboard = {
            overview: {
                today: {
                    ...todayTotals,
                    successRate: todayTotals.requests > 0
                        ? ((todayTotals.successful / todayTotals.requests) * 100).toFixed(1)
                        : 100
                },
                weekly: {
                    ...weeklyTotals,
                    successRate: weeklyTotals.requests > 0
                        ? ((weeklyTotals.successful / weeklyTotals.requests) * 100).toFixed(1)
                        : 100
                },
                recentErrorCount: recentErrors,
                activeAlertCount: activeAlerts.length
            },
            services: Object.keys(SERVICE_QUOTAS).map(serviceKey => {
                const todayData = todayUsage.find(u => u.service === serviceKey);
                const weeklyData = weeklySummary.find(s => s._id === serviceKey);
                const quotaStatus = quotaStatuses.find(q => q.service === serviceKey);

                return {
                    id: serviceKey,
                    name: SERVICE_QUOTAS[serviceKey].name,
                    today: {
                        requests: todayData?.totalRequests || 0,
                        errors: todayData?.failedRequests || 0,
                        avgResponseTime: todayData?.avgResponseTime?.toFixed(0) || 0
                    },
                    weekly: {
                        requests: weeklyData?.totalRequests || 0,
                        errors: weeklyData?.failedRequests || 0,
                        avgResponseTime: weeklyData?.avgResponseTime?.toFixed(0) || 0
                    },
                    quota: quotaStatus?.limits || null,
                    status: getServiceStatus(todayData, quotaStatus)
                };
            }),
            alerts: activeAlerts,
            quotaStatuses: quotaStatuses.filter(q => q.hasQuota)
        };

        res.json({
            success: true,
            message: 'Dashboard data retrieved successfully',
            data: dashboard
        });

    } catch (error) {
        console.error('Error fetching API monitoring dashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard data',
            error: error.message
        });
    }
};

/**
 * Get usage statistics for a specific service
 * GET /api/api-monitoring/usage/:service
 */
export const getServiceUsage = async (req, res) => {
    try {
        const { service } = req.params;
        const { days = 7 } = req.query;

        if (!SERVICE_QUOTAS[service]) {
            return res.status(400).json({
                success: false,
                message: 'Invalid service name',
                validServices: Object.keys(SERVICE_QUOTAS)
            });
        }

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));
        startDate.setHours(0, 0, 0, 0);

        const usageData = await APIUsage.find({
            service,
            date: { $gte: startDate }
        }).sort({ date: 1 });

        // Get quota status
        const quotaStatus = await getRemainingQuota(service);

        // Get recent errors
        const recentErrors = await APIErrorLog.find({
            service,
            timestamp: { $gte: startDate }
        })
            .sort({ timestamp: -1 })
            .limit(50);

        // Calculate trends
        const trends = usageData.map(day => ({
            date: day.date,
            requests: day.totalRequests,
            errors: day.failedRequests,
            avgResponseTime: day.avgResponseTime,
            successRate: day.totalRequests > 0
                ? ((day.successfulRequests / day.totalRequests) * 100).toFixed(1)
                : 100
        }));

        res.json({
            success: true,
            data: {
                service,
                serviceName: SERVICE_QUOTAS[service].name,
                quota: quotaStatus,
                trends,
                recentErrors: recentErrors.map(e => ({
                    timestamp: e.timestamp,
                    endpoint: e.endpoint,
                    statusCode: e.statusCode,
                    errorMessage: e.errorMessage,
                    resolved: e.resolved
                })),
                summary: {
                    totalRequests: usageData.reduce((sum, d) => sum + d.totalRequests, 0),
                    totalErrors: usageData.reduce((sum, d) => sum + d.failedRequests, 0),
                    avgResponseTime: usageData.length > 0
                        ? (usageData.reduce((sum, d) => sum + d.avgResponseTime, 0) / usageData.length).toFixed(0)
                        : 0
                }
            }
        });

    } catch (error) {
        console.error('Error fetching service usage:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch service usage',
            error: error.message
        });
    }
};

/**
 * Get all error logs with filtering and pagination
 * GET /api/api-monitoring/errors
 */
export const getErrorLogs = async (req, res) => {
    try {
        const {
            service,
            startDate,
            endDate,
            resolved,
            page = 1,
            limit = 50
        } = req.query;

        const query = {};

        if (service) query.service = service;
        if (resolved !== undefined) query.resolved = resolved === 'true';

        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) query.timestamp.$gte = new Date(startDate);
            if (endDate) query.timestamp.$lte = new Date(endDate);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [errors, total] = await Promise.all([
            APIErrorLog.find(query)
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            APIErrorLog.countDocuments(query)
        ]);

        // Group by service for summary
        const errorsByService = await APIErrorLog.aggregate([
            { $match: query },
            { $group: { _id: '$service', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        res.json({
            success: true,
            data: {
                errors,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                },
                summary: {
                    total,
                    byService: errorsByService
                }
            }
        });

    } catch (error) {
        console.error('Error fetching error logs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch error logs',
            error: error.message
        });
    }
};

/**
 * Mark an error as resolved
 * PUT /api/api-monitoring/errors/:errorId/resolve
 */
export const resolveError = async (req, res) => {
    try {
        const { errorId } = req.params;
        const { notes } = req.body;
        const userId = req.auth?.userId || req.auth?.payload?.sub;

        const error = await APIErrorLog.findByIdAndUpdate(
            errorId,
            {
                resolved: true,
                resolvedAt: new Date(),
                resolvedBy: userId,
                notes
            },
            { new: true }
        );

        if (!error) {
            return res.status(404).json({
                success: false,
                message: 'Error log not found'
            });
        }

        res.json({
            success: true,
            message: 'Error marked as resolved',
            data: error
        });

    } catch (error) {
        console.error('Error resolving error log:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to resolve error',
            error: error.message
        });
    }
};

/**
 * Get all alerts with filtering
 * GET /api/api-monitoring/alerts
 */
export const getAlerts = async (req, res) => {
    try {
        const {
            service,
            alertType,
            severity,
            acknowledged,
            page = 1,
            limit = 50
        } = req.query;

        const query = {};

        if (service) query.service = service;
        if (alertType) query.alertType = alertType;
        if (severity) query.severity = severity;
        if (acknowledged !== undefined) query.acknowledged = acknowledged === 'true';

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [alerts, total] = await Promise.all([
            APIAlert.find(query)
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            APIAlert.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                alerts,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });

    } catch (error) {
        console.error('Error fetching alerts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch alerts',
            error: error.message
        });
    }
};

/**
 * Acknowledge an alert
 * PUT /api/api-monitoring/alerts/:alertId/acknowledge
 */
export const acknowledgeAlert = async (req, res) => {
    try {
        const { alertId } = req.params;
        const userId = req.auth?.userId || req.auth?.payload?.sub;

        const alert = await APIAlert.findByIdAndUpdate(
            alertId,
            {
                acknowledged: true,
                acknowledgedAt: new Date(),
                acknowledgedBy: userId
            },
            { new: true }
        );

        if (!alert) {
            return res.status(404).json({
                success: false,
                message: 'Alert not found'
            });
        }

        res.json({
            success: true,
            message: 'Alert acknowledged',
            data: alert
        });

    } catch (error) {
        console.error('Error acknowledging alert:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to acknowledge alert',
            error: error.message
        });
    }
};

/**
 * Get quota status for all services
 * GET /api/api-monitoring/quotas
 */
export const getQuotaStatus = async (req, res) => {
    try {
        const quotaStatuses = await Promise.all(
            Object.keys(SERVICE_QUOTAS).map(service => getRemainingQuota(service))
        );

        // Identify services approaching limits
        const warnings = quotaStatuses
            .filter(q => q.hasQuota && q.limits?.daily?.percentUsed >= 80)
            .map(q => ({
                service: q.service,
                serviceName: q.serviceName,
                percentUsed: q.limits.daily.percentUsed,
                remaining: q.limits.daily.remaining
            }));

        res.json({
            success: true,
            data: {
                services: quotaStatuses,
                warnings,
                hasWarnings: warnings.length > 0
            }
        });

    } catch (error) {
        console.error('Error fetching quota status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch quota status',
            error: error.message
        });
    }
};

/**
 * Get response time analytics
 * GET /api/api-monitoring/performance
 */
export const getPerformanceMetrics = async (req, res) => {
    try {
        const { days = 7 } = req.query;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));
        startDate.setHours(0, 0, 0, 0);

        const performanceData = await APIUsage.aggregate([
            { $match: { date: { $gte: startDate } } },
            {
                $group: {
                    _id: '$service',
                    avgResponseTime: { $avg: '$avgResponseTime' },
                    minResponseTime: { $min: '$minResponseTime' },
                    maxResponseTime: { $max: '$maxResponseTime' },
                    totalRequests: { $sum: '$totalRequests' }
                }
            },
            { $sort: { avgResponseTime: -1 } }
        ]);

        // Get daily performance trends
        const dailyTrends = await APIUsage.aggregate([
            { $match: { date: { $gte: startDate } } },
            {
                $group: {
                    _id: '$date',
                    avgResponseTime: { $avg: '$avgResponseTime' },
                    totalRequests: { $sum: '$totalRequests' }
                }
            },
            { $sort: { '_id': 1 } }
        ]);

        // Identify slow services (avg > 1000ms)
        const slowServices = performanceData
            .filter(s => s.avgResponseTime > 1000)
            .map(s => ({
                service: s._id,
                serviceName: SERVICE_QUOTAS[s._id]?.name || s._id,
                avgResponseTime: s.avgResponseTime.toFixed(0)
            }));

        res.json({
            success: true,
            data: {
                byService: performanceData.map(s => ({
                    service: s._id,
                    serviceName: SERVICE_QUOTAS[s._id]?.name || s._id,
                    avgResponseTime: s.avgResponseTime?.toFixed(0) || 0,
                    minResponseTime: s.minResponseTime?.toFixed(0) || 0,
                    maxResponseTime: s.maxResponseTime?.toFixed(0) || 0,
                    totalRequests: s.totalRequests
                })),
                dailyTrends: dailyTrends.map(d => ({
                    date: d._id,
                    avgResponseTime: d.avgResponseTime?.toFixed(0) || 0,
                    requests: d.totalRequests
                })),
                slowServices,
                hasSlowServices: slowServices.length > 0
            }
        });

    } catch (error) {
        console.error('Error fetching performance metrics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch performance metrics',
            error: error.message
        });
    }
};

/**
 * Generate and return weekly report
 * GET /api/api-monitoring/reports/weekly
 */
export const getWeeklyReport = async (req, res) => {
    try {
        const report = await generateWeeklyReport();

        res.json({
            success: true,
            data: report
        });

    } catch (error) {
        console.error('Error generating weekly report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate weekly report',
            error: error.message
        });
    }
};

/**
 * Get available services list
 * GET /api/api-monitoring/services
 */
export const getServices = async (req, res) => {
    try {
        const services = Object.entries(SERVICE_QUOTAS).map(([key, config]) => ({
            id: key,
            name: config.name,
            hasQuota: !!(config.dailyLimit || config.monthlyLimit || config.hourlyLimit || config.minuteLimit),
            limits: {
                daily: config.dailyLimit,
                monthly: config.monthlyLimit,
                hourly: config.hourlyLimit,
                minute: config.minuteLimit
            },
            warningThreshold: config.warningThreshold
        }));

        res.json({
            success: true,
            data: services
        });

    } catch (error) {
        console.error('Error fetching services list:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch services list',
            error: error.message
        });
    }
};

/**
 * Helper function to determine service status
 */
function getServiceStatus(todayData, quotaStatus) {
    if (!todayData) return 'inactive';

    const errorRate = todayData.totalRequests > 0
        ? (todayData.failedRequests / todayData.totalRequests) * 100
        : 0;

    if (errorRate > 20) return 'critical';
    if (errorRate > 10) return 'warning';

    if (quotaStatus?.limits?.daily?.percentUsed >= 90) return 'quota-critical';
    if (quotaStatus?.limits?.daily?.percentUsed >= 80) return 'quota-warning';

    if (todayData.avgResponseTime > 2000) return 'slow';

    return 'healthy';
}
