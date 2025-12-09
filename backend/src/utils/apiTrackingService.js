import axios from 'axios';
import { APIUsage, APIErrorLog, APIAlert, SERVICE_QUOTAS } from '../models/APIUsage.js';

/**
 * UC-117: API Rate Limiting and Error Handling
 * 
 * Service to track, monitor, and manage all external API calls
 * Provides centralized tracking, rate limiting, and fallback mechanisms
 */

// In-memory rate limit tracking for real-time enforcement
const rateLimitState = new Map();

/**
 * Create a tracked axios instance for a specific service
 * Wraps axios to automatically track all API calls
 */
export function createTrackedAxios(serviceName, baseConfig = {}) {
    const instance = axios.create(baseConfig);

    // Request interceptor - record start time
    instance.interceptors.request.use(
        (config) => {
            config.metadata = {
                startTime: Date.now(),
                service: serviceName
            };
            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );

    // Response interceptor - track successful calls
    instance.interceptors.response.use(
        async (response) => {
            const endTime = Date.now();
            const startTime = response.config.metadata?.startTime || endTime;
            const responseTime = endTime - startTime;

            // Track the successful call
            await trackAPICall({
                service: serviceName,
                endpoint: response.config.url,
                method: response.config.method?.toUpperCase() || 'GET',
                responseTime,
                statusCode: response.status,
                success: true,
                requestSize: JSON.stringify(response.config.data || '').length,
                responseSize: JSON.stringify(response.data || '').length,
                userId: response.config.metadata?.userId
            });

            return response;
        },
        async (error) => {
            const endTime = Date.now();
            const startTime = error.config?.metadata?.startTime || endTime;
            const responseTime = endTime - startTime;

            // Track the failed call
            await trackAPICall({
                service: serviceName,
                endpoint: error.config?.url || 'unknown',
                method: error.config?.method?.toUpperCase() || 'GET',
                responseTime,
                statusCode: error.response?.status,
                success: false,
                errorMessage: error.message,
                errorCode: error.code,
                requestSize: JSON.stringify(error.config?.data || '').length,
                userId: error.config?.metadata?.userId
            });

            // Log error details
            await logAPIError({
                service: serviceName,
                endpoint: error.config?.url || 'unknown',
                method: error.config?.method?.toUpperCase() || 'GET',
                statusCode: error.response?.status,
                errorCode: error.code,
                errorMessage: error.message,
                errorStack: error.stack,
                requestData: error.config?.data,
                responseData: error.response?.data,
                userId: error.config?.metadata?.userId
            });

            // Check for rate limiting
            if (error.response?.status === 429) {
                await createAlert({
                    alertType: 'RATE_LIMIT_EXCEEDED',
                    service: serviceName,
                    message: `Rate limit exceeded for ${serviceName}`,
                    severity: 'high',
                    currentValue: error.response?.headers?.['x-ratelimit-remaining'] || 0
                });
            }

            return Promise.reject(error);
        }
    );

    return instance;
}

/**
 * Track an API call (core tracking function)
 */
export async function trackAPICall(callData) {
    try {
        await APIUsage.recordAPICall(callData);

        // Update in-memory rate limit state
        updateRateLimitState(callData.service, callData.success);

        // Check for alerts
        await checkAlertThresholds(callData.service);

    } catch (error) {
        console.error('Failed to track API call:', error.message);
        // Don't throw - tracking failures shouldn't break the main flow
    }
}

/**
 * Log an API error with full details
 */
export async function logAPIError(errorData) {
    try {
        const errorLog = new APIErrorLog(errorData);
        await errorLog.save();

        // Check for error spike
        await checkErrorSpike(errorData.service);

    } catch (error) {
        console.error('Failed to log API error:', error.message);
    }
}

/**
 * Create an alert
 */
export async function createAlert(alertData) {
    try {
        const alert = new APIAlert(alertData);
        await alert.save();

        console.warn(`[API Alert] ${alertData.severity.toUpperCase()}: ${alertData.message}`);

    } catch (error) {
        console.error('Failed to create alert:', error.message);
    }
}

/**
 * Update in-memory rate limit tracking
 */
function updateRateLimitState(service, success) {
    const now = Date.now();
    const minuteKey = Math.floor(now / 60000);
    const state = rateLimitState.get(service) || {
        minuteKey: minuteKey,
        minuteCount: 0,
        hourCount: 0,
        dayCount: 0,
        lastReset: now
    };

    // Reset if new minute
    if (state.minuteKey !== minuteKey) {
        state.minuteKey = minuteKey;
        state.minuteCount = 0;
    }

    // Reset hourly/daily counts as needed
    const hoursSinceReset = (now - state.lastReset) / (1000 * 60 * 60);
    if (hoursSinceReset >= 1) {
        state.hourCount = 0;
        if (hoursSinceReset >= 24) {
            state.dayCount = 0;
            state.lastReset = now;
        }
    }

    state.minuteCount++;
    state.hourCount++;
    state.dayCount++;

    rateLimitState.set(service, state);
}

/**
 * Check if service is approaching rate limits
 */
export async function checkRateLimit(service) {
    const quota = SERVICE_QUOTAS[service];
    if (!quota) return { allowed: true, remaining: null };

    const state = rateLimitState.get(service);
    if (!state) return { allowed: true, remaining: quota.dailyLimit || quota.minuteLimit || null };

    const checks = [];

    if (quota.minuteLimit) {
        const remaining = quota.minuteLimit - state.minuteCount;
        checks.push({
            type: 'minute',
            remaining,
            limit: quota.minuteLimit,
            exceeded: remaining <= 0
        });
    }

    if (quota.hourlyLimit) {
        const remaining = quota.hourlyLimit - state.hourCount;
        checks.push({
            type: 'hour',
            remaining,
            limit: quota.hourlyLimit,
            exceeded: remaining <= 0
        });
    }

    if (quota.dailyLimit) {
        const remaining = quota.dailyLimit - state.dayCount;
        checks.push({
            type: 'day',
            remaining,
            limit: quota.dailyLimit,
            exceeded: remaining <= 0
        });
    }

    const exceeded = checks.some(c => c.exceeded);
    const mostRestrictive = checks.reduce((min, c) =>
        c.remaining < min.remaining ? c : min,
        { remaining: Infinity }
    );

    return {
        allowed: !exceeded,
        remaining: mostRestrictive.remaining,
        limits: checks,
        warningThreshold: quota.warningThreshold
    };
}

/**
 * Check and create alerts for threshold breaches
 */
async function checkAlertThresholds(service) {
    const quota = SERVICE_QUOTAS[service];
    if (!quota) return;

    const state = rateLimitState.get(service);
    if (!state) return;

    // Check daily limit warning
    if (quota.dailyLimit) {
        const usageRatio = state.dayCount / quota.dailyLimit;

        if (usageRatio >= quota.warningThreshold && usageRatio < 1) {
            // Check if we already have an unacknowledged warning today
            const existingAlert = await APIAlert.findOne({
                service,
                alertType: 'QUOTA_WARNING',
                acknowledged: false,
                timestamp: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
            });

            if (!existingAlert) {
                await createAlert({
                    alertType: 'QUOTA_WARNING',
                    service,
                    message: `${quota.name} usage at ${Math.round(usageRatio * 100)}% of daily limit`,
                    severity: 'medium',
                    threshold: quota.dailyLimit * quota.warningThreshold,
                    currentValue: state.dayCount
                });
            }
        }
    }
}

/**
 * Check for error spike and create alert
 */
async function checkErrorSpike(service) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const recentErrors = await APIErrorLog.countDocuments({
        service,
        timestamp: { $gte: oneHourAgo }
    });

    // Alert if more than 10 errors in the last hour
    if (recentErrors >= 10) {
        const existingAlert = await APIAlert.findOne({
            service,
            alertType: 'ERROR_SPIKE',
            acknowledged: false,
            timestamp: { $gte: oneHourAgo }
        });

        if (!existingAlert) {
            await createAlert({
                alertType: 'ERROR_SPIKE',
                service,
                message: `${recentErrors} errors in the last hour for ${service}`,
                severity: 'high',
                currentValue: recentErrors
            });
        }
    }
}

/**
 * Get remaining quota for a service
 */
export async function getRemainingQuota(service) {
    const quota = SERVICE_QUOTAS[service];
    if (!quota) {
        return { service, hasQuota: false, message: 'No quota limits defined' };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayUsage = await APIUsage.findOne({ service, date: today });
    const totalRequests = todayUsage?.totalRequests || 0;

    const result = {
        service,
        serviceName: quota.name,
        hasQuota: true,
        limits: {}
    };

    if (quota.dailyLimit) {
        result.limits.daily = {
            limit: quota.dailyLimit,
            used: totalRequests,
            remaining: Math.max(0, quota.dailyLimit - totalRequests),
            percentUsed: Math.round((totalRequests / quota.dailyLimit) * 100)
        };
    }

    if (quota.monthlyLimit) {
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthUsage = await APIUsage.aggregate([
            { $match: { service, date: { $gte: monthStart } } },
            { $group: { _id: null, total: { $sum: '$totalRequests' } } }
        ]);
        const monthlyUsed = monthUsage[0]?.total || 0;

        result.limits.monthly = {
            limit: quota.monthlyLimit,
            used: monthlyUsed,
            remaining: Math.max(0, quota.monthlyLimit - monthlyUsed),
            percentUsed: Math.round((monthlyUsed / quota.monthlyLimit) * 100)
        };
    }

    // Get in-memory rate limit state for minute/hour limits
    const state = rateLimitState.get(service);
    if (state) {
        if (quota.minuteLimit) {
            result.limits.perMinute = {
                limit: quota.minuteLimit,
                used: state.minuteCount,
                remaining: Math.max(0, quota.minuteLimit - state.minuteCount)
            };
        }
        if (quota.hourlyLimit) {
            result.limits.perHour = {
                limit: quota.hourlyLimit,
                used: state.hourCount,
                remaining: Math.max(0, quota.hourlyLimit - state.hourCount)
            };
        }
    }

    return result;
}

/**
 * Fallback handler - wraps API call with fallback mechanisms
 */
export async function withFallback(primaryCall, fallbackCall = null, options = {}) {
    const {
        service = 'unknown',
        maxRetries = 3,
        retryDelay = 1000,
        fallbackMessage = 'Service temporarily unavailable'
    } = options;

    // Check rate limit before calling
    const rateLimitCheck = await checkRateLimit(service);
    if (!rateLimitCheck.allowed) {
        if (fallbackCall) {
            console.warn(`Rate limit reached for ${service}, using fallback`);
            return await fallbackCall();
        }
        throw new Error(`Rate limit exceeded for ${service}. ${fallbackMessage}`);
    }

    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await primaryCall();
        } catch (error) {
            lastError = error;

            // Don't retry on 4xx errors (except 429)
            if (error.response?.status >= 400 && error.response?.status < 500 && error.response?.status !== 429) {
                break;
            }

            // Wait before retry with exponential backoff
            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt - 1)));
            }
        }
    }

    // Try fallback if available
    if (fallbackCall) {
        console.warn(`Primary call failed for ${service}, using fallback`);
        try {
            return await fallbackCall();
        } catch (fallbackError) {
            console.error(`Fallback also failed for ${service}:`, fallbackError.message);
        }
    }

    throw lastError;
}

/**
 * Get user-friendly error message for API failures
 */
export function getUserFriendlyMessage(service, error) {
    const messages = {
        429: `We've reached our limit for ${SERVICE_QUOTAS[service]?.name || service} requests. Please try again in a few minutes.`,
        503: `${SERVICE_QUOTAS[service]?.name || service} is temporarily unavailable. We're using cached data where possible.`,
        500: `There was a problem connecting to ${SERVICE_QUOTAS[service]?.name || service}. Please try again later.`,
        timeout: `The request to ${SERVICE_QUOTAS[service]?.name || service} took too long. Please try again.`,
        network: `Unable to connect to ${SERVICE_QUOTAS[service]?.name || service}. Please check your connection.`
    };

    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        return messages.timeout;
    }

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        return messages.network;
    }

    return messages[error.response?.status] ||
        `There was an issue with ${SERVICE_QUOTAS[service]?.name || service}. Please try again later.`;
}

/**
 * Generate weekly usage report
 */
export async function generateWeeklyReport() {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    startDate.setHours(0, 0, 0, 0);

    // Get usage summary
    const usageSummary = await APIUsage.getUsageSummary(startDate, endDate);

    // Get error counts by service
    const errorCounts = await APIErrorLog.aggregate([
        { $match: { timestamp: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: '$service', count: { $sum: 1 } } }
    ]);

    // Get alerts
    const alerts = await APIAlert.find({
        timestamp: { $gte: startDate, $lte: endDate }
    }).sort({ timestamp: -1 });

    // Get daily trends
    const dailyTrends = await APIUsage.getDailyTrends(7);

    // Calculate totals
    const totals = usageSummary.reduce((acc, service) => ({
        totalRequests: acc.totalRequests + service.totalRequests,
        successfulRequests: acc.successfulRequests + service.successfulRequests,
        failedRequests: acc.failedRequests + service.failedRequests,
        rateLimitHits: acc.rateLimitHits + service.rateLimitHits
    }), { totalRequests: 0, successfulRequests: 0, failedRequests: 0, rateLimitHits: 0 });

    const report = {
        period: {
            start: startDate,
            end: endDate
        },
        summary: {
            ...totals,
            successRate: totals.totalRequests > 0
                ? ((totals.successfulRequests / totals.totalRequests) * 100).toFixed(2)
                : 0,
            servicesUsed: usageSummary.length
        },
        byService: usageSummary.map(s => ({
            service: s._id,
            serviceName: SERVICE_QUOTAS[s._id]?.name || s._id,
            ...s,
            successRate: s.totalRequests > 0
                ? ((s.successfulRequests / s.totalRequests) * 100).toFixed(2)
                : 0
        })),
        errorsByService: errorCounts.map(e => ({
            service: e._id,
            count: e.count
        })),
        alerts: {
            total: alerts.length,
            bySeverity: {
                critical: alerts.filter(a => a.severity === 'critical').length,
                high: alerts.filter(a => a.severity === 'high').length,
                medium: alerts.filter(a => a.severity === 'medium').length,
                low: alerts.filter(a => a.severity === 'low').length
            },
            unacknowledged: alerts.filter(a => !a.acknowledged).length
        },
        dailyTrends,
        generatedAt: new Date()
    };

    return report;
}

export { SERVICE_QUOTAS };
