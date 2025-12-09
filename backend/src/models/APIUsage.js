import mongoose from 'mongoose';

/**
 * UC-117: API Rate Limiting and Error Handling Dashboard
 * 
 * Tracks API usage statistics for all integrated external services
 * Monitors rate limits, errors, and performance metrics
 */

// Schema for individual API calls
const apiCallSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now, required: true },
    endpoint: { type: String, required: true },
    method: { type: String, enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], default: 'GET' },
    responseTime: { type: Number, required: true }, // in milliseconds
    statusCode: { type: Number },
    success: { type: Boolean, required: true },
    errorMessage: { type: String },
    errorCode: { type: String },
    requestSize: { type: Number, default: 0 }, // bytes
    responseSize: { type: Number, default: 0 }, // bytes
    userId: { type: String }, // optional - track per-user usage
    metadata: { type: mongoose.Schema.Types.Mixed } // additional context
}, { _id: false });

// Schema for error logs with full details
const errorLogSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now, required: true, index: true },
    service: { type: String, required: true },
    endpoint: { type: String, required: true },
    method: { type: String },
    statusCode: { type: Number },
    errorCode: { type: String },
    errorMessage: { type: String, required: true },
    errorStack: { type: String },
    requestData: { type: mongoose.Schema.Types.Mixed },
    responseData: { type: mongoose.Schema.Types.Mixed },
    userId: { type: String },
    resolved: { type: Boolean, default: false },
    resolvedAt: { type: Date },
    resolvedBy: { type: String },
    notes: { type: String }
});

// Schema for tracking alerts
const alertSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now, required: true },
    alertType: {
        type: String,
        enum: ['RATE_LIMIT_WARNING', 'RATE_LIMIT_EXCEEDED', 'ERROR_SPIKE', 'SERVICE_DOWN', 'SLOW_RESPONSE', 'QUOTA_WARNING'],
        required: true
    },
    service: { type: String, required: true },
    message: { type: String, required: true },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    threshold: { type: Number },
    currentValue: { type: Number },
    acknowledged: { type: Boolean, default: false },
    acknowledgedAt: { type: Date },
    acknowledgedBy: { type: String }
});

// Main API Usage Schema - aggregated per service per day
const apiUsageSchema = new mongoose.Schema({
    // Service identification
    service: {
        type: String,
        required: true,
        enum: [
            'gemini',
            'eventbrite',
            'bls',
            'openalex',
            'wikidata',
            'wikipedia',
            'github',
            'clerk',
            'geocoding',
            'other'
        ]
    },
    date: { type: Date, required: true }, // Date only (no time) for daily aggregation

    // Usage statistics
    totalRequests: { type: Number, default: 0 },
    successfulRequests: { type: Number, default: 0 },
    failedRequests: { type: Number, default: 0 },

    // Rate limiting
    rateLimitHits: { type: Number, default: 0 },
    quotaUsed: { type: Number, default: 0 },
    quotaLimit: { type: Number, default: null }, // null if no limit
    quotaResetDate: { type: Date },

    // Performance metrics
    totalResponseTime: { type: Number, default: 0 }, // sum of all response times
    minResponseTime: { type: Number, default: null },
    maxResponseTime: { type: Number, default: null },
    avgResponseTime: { type: Number, default: 0 },

    // Bandwidth
    totalRequestSize: { type: Number, default: 0 },
    totalResponseSize: { type: Number, default: 0 },

    // Detailed logs (limited to recent entries)
    recentCalls: {
        type: [apiCallSchema],
        default: [],
        validate: [v => v.length <= 100, 'Recent calls limited to 100 entries']
    },

    // Hourly breakdown for more granular analysis
    hourlyStats: {
        type: Map,
        of: {
            requests: { type: Number, default: 0 },
            errors: { type: Number, default: 0 },
            avgResponseTime: { type: Number, default: 0 }
        },
        default: {}
    }
}, {
    timestamps: true
});

// Compound index for efficient querying
apiUsageSchema.index({ service: 1, date: -1 });
apiUsageSchema.index({ date: -1 });

// Static method to record an API call
apiUsageSchema.statics.recordAPICall = async function (callData) {
    const {
        service,
        endpoint,
        method = 'GET',
        responseTime,
        statusCode,
        success,
        errorMessage,
        errorCode,
        requestSize = 0,
        responseSize = 0,
        userId,
        metadata
    } = callData;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const hour = new Date().getHours().toString();

    // Find or create today's record for this service
    let usageRecord = await this.findOne({ service, date: today });

    if (!usageRecord) {
        usageRecord = new this({ service, date: today });
    }

    // Update counters
    usageRecord.totalRequests += 1;
    if (success) {
        usageRecord.successfulRequests += 1;
    } else {
        usageRecord.failedRequests += 1;
    }

    // Update response time stats
    usageRecord.totalResponseTime += responseTime;
    usageRecord.avgResponseTime = usageRecord.totalResponseTime / usageRecord.totalRequests;

    if (usageRecord.minResponseTime === null || responseTime < usageRecord.minResponseTime) {
        usageRecord.minResponseTime = responseTime;
    }
    if (usageRecord.maxResponseTime === null || responseTime > usageRecord.maxResponseTime) {
        usageRecord.maxResponseTime = responseTime;
    }

    // Update bandwidth stats
    usageRecord.totalRequestSize += requestSize;
    usageRecord.totalResponseSize += responseSize;

    // Update hourly stats
    const hourStats = usageRecord.hourlyStats.get(hour) || { requests: 0, errors: 0, avgResponseTime: 0 };
    const newRequests = hourStats.requests + 1;
    hourStats.avgResponseTime = ((hourStats.avgResponseTime * hourStats.requests) + responseTime) / newRequests;
    hourStats.requests = newRequests;
    if (!success) hourStats.errors += 1;
    usageRecord.hourlyStats.set(hour, hourStats);

    // Add to recent calls (keep last 100)
    const callEntry = {
        timestamp: new Date(),
        endpoint,
        method,
        responseTime,
        statusCode,
        success,
        errorMessage,
        errorCode,
        requestSize,
        responseSize,
        userId,
        metadata
    };

    usageRecord.recentCalls.push(callEntry);
    if (usageRecord.recentCalls.length > 100) {
        usageRecord.recentCalls = usageRecord.recentCalls.slice(-100);
    }

    // Check if rate limited
    if (statusCode === 429) {
        usageRecord.rateLimitHits += 1;
    }

    await usageRecord.save();

    return usageRecord;
};

// Static method to get usage summary for a date range
apiUsageSchema.statics.getUsageSummary = async function (startDate, endDate, services = null) {
    const matchQuery = {
        date: { $gte: startDate, $lte: endDate }
    };

    if (services && services.length > 0) {
        matchQuery.service = { $in: services };
    }

    const summary = await this.aggregate([
        { $match: matchQuery },
        {
            $group: {
                _id: '$service',
                totalRequests: { $sum: '$totalRequests' },
                successfulRequests: { $sum: '$successfulRequests' },
                failedRequests: { $sum: '$failedRequests' },
                rateLimitHits: { $sum: '$rateLimitHits' },
                avgResponseTime: { $avg: '$avgResponseTime' },
                minResponseTime: { $min: '$minResponseTime' },
                maxResponseTime: { $max: '$maxResponseTime' },
                totalRequestSize: { $sum: '$totalRequestSize' },
                totalResponseSize: { $sum: '$totalResponseSize' }
            }
        },
        { $sort: { totalRequests: -1 } }
    ]);

    return summary;
};

// Static method to get daily trends
apiUsageSchema.statics.getDailyTrends = async function (days = 7, service = null) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const matchQuery = { date: { $gte: startDate } };
    if (service) matchQuery.service = service;

    const trends = await this.aggregate([
        { $match: matchQuery },
        {
            $group: {
                _id: { date: '$date', service: '$service' },
                totalRequests: { $sum: '$totalRequests' },
                failedRequests: { $sum: '$failedRequests' },
                avgResponseTime: { $avg: '$avgResponseTime' }
            }
        },
        { $sort: { '_id.date': 1 } }
    ]);

    return trends;
};

// Error Log Model
const APIErrorLog = mongoose.model('APIErrorLog', errorLogSchema);

// Alert Model
const APIAlert = mongoose.model('APIAlert', alertSchema);

// Main API Usage Model
const APIUsage = mongoose.model('APIUsage', apiUsageSchema);

// Service-specific quota configurations
const SERVICE_QUOTAS = {
    gemini: {
        name: 'Google Gemini AI',
        dailyLimit: 1500, // requests per day for free tier
        minuteLimit: 15, // requests per minute
        monthlyLimit: null,
        warningThreshold: 0.8 // Alert at 80% usage
    },
    eventbrite: {
        name: 'Eventbrite API',
        dailyLimit: null,
        minuteLimit: 500,
        hourlyLimit: 2000,
        warningThreshold: 0.8
    },
    bls: {
        name: 'Bureau of Labor Statistics',
        dailyLimit: 500,
        warningThreshold: 0.8
    },
    github: {
        name: 'GitHub API',
        hourlyLimit: 60, // unauthenticated
        authenticatedHourlyLimit: 5000,
        warningThreshold: 0.8
    },
    openalex: {
        name: 'OpenAlex API',
        dailyLimit: null,
        rateLimit: '100 requests per second',
        warningThreshold: 0.9
    },
    wikidata: {
        name: 'Wikidata Query Service',
        dailyLimit: null,
        concurrent: 5,
        warningThreshold: 0.9
    },
    wikipedia: {
        name: 'Wikipedia API',
        dailyLimit: null,
        warningThreshold: 0.9
    },
    clerk: {
        name: 'Clerk Authentication',
        monthlyLimit: 10000, // free tier MAU
        warningThreshold: 0.8
    },
    geocoding: {
        name: 'Geocoding Service',
        dailyLimit: 2500, // typical free tier
        warningThreshold: 0.8
    }
};

export { APIUsage, APIErrorLog, APIAlert, SERVICE_QUOTAS };
export default APIUsage;
