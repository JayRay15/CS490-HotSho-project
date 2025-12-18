import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { setAuthToken } from '../api/axios';
import * as apiMonitoring from '../api/apiMonitoring';
import Container from '../components/Container';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import {
    Activity,
    AlertTriangle,
    AlertCircle,
    CheckCircle,
    Clock,
    Database,
    TrendingUp,
    TrendingDown,
    Zap,
    Server,
    RefreshCw,
    Filter,
    Download,
    Eye,
    EyeOff,
    ChevronDown,
    ChevronUp,
    Bell,
    BellOff,
    FileText,
    BarChart3,
    PieChart,
    Calendar,
    X,
    Check,
    Info
} from 'lucide-react';

/**
 * UC-117: API Rate Limiting and Error Handling Dashboard
 * Admin dashboard for monitoring API usage, errors, and performance
 */

// Status badge component
const StatusBadge = ({ status }) => {
    const styles = {
        healthy: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        'quota-warning': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
        'quota-critical': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        slow: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
        inactive: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
    };

    const labels = {
        healthy: 'Healthy',
        warning: 'Warning',
        critical: 'Critical',
        'quota-warning': 'Quota Warning',
        'quota-critical': 'Quota Critical',
        slow: 'Slow',
        inactive: 'Inactive'
    };

    return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || styles.inactive}`}>
            {labels[status] || status}
        </span>
    );
};

// Severity badge component
const SeverityBadge = ({ severity }) => {
    const styles = {
        low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
        critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    };

    return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[severity] || styles.low}`}>
            {severity}
        </span>
    );
};

// Metric card component
const MetricCard = ({ title, value, subtitle, icon: Icon, trend, trendValue, color = 'blue' }) => {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
        green: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
        red: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
        yellow: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400',
        purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
                    <Icon className="w-5 h-5" />
                </div>
                {trend && (
                    <div className={`flex items-center text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                        {trend === 'up' ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                        {trendValue}
                    </div>
                )}
            </div>
            <div className="mt-3">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{value}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
                {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</p>}
            </div>
        </div>
    );
};

// Quota progress bar component
const QuotaBar = ({ used, limit, label }) => {
    const percentage = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
    const getColor = (pct) => {
        if (pct >= 90) return 'bg-red-500';
        if (pct >= 75) return 'bg-orange-500';
        if (pct >= 50) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    return (
        <div className="space-y-1">
            <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">{label}</span>
                <span className="text-gray-900 dark:text-white font-medium">
                    {used.toLocaleString()} / {limit.toLocaleString()}
                </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                    className={`h-full ${getColor(percentage)} transition-all duration-300`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
                {percentage.toFixed(1)}% used
            </div>
        </div>
    );
};

// Overview Tab Component
const OverviewTab = ({ dashboard, loading, onRefresh }) => {
    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <LoadingSpinner />
            </div>
        );
    }

    if (!dashboard || !dashboard.overview) {
        return (
            <div className="text-center py-12 text-gray-500">
                No data available. Click refresh to load dashboard data.
            </div>
        );
    }

    const { overview, services = [], alerts = [], quotaStatuses = [] } = dashboard;
    const today = overview?.today || { requests: 0, successRate: 0 };
    const weekly = overview?.weekly || { requests: 0, successRate: 0 };

    return (
        <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard
                    title="Today's Requests"
                    value={(today.requests || 0).toLocaleString()}
                    subtitle={`${today.successRate || 0}% success rate`}
                    icon={Activity}
                    color="blue"
                />
                <MetricCard
                    title="Weekly Requests"
                    value={(weekly.requests || 0).toLocaleString()}
                    subtitle={`${weekly.successRate || 0}% success rate`}
                    icon={BarChart3}
                    color="purple"
                />
                <MetricCard
                    title="Recent Errors"
                    value={overview?.recentErrorCount || 0}
                    subtitle="Last 24 hours"
                    icon={AlertCircle}
                    color={(overview?.recentErrorCount || 0) > 10 ? 'red' : 'yellow'}
                />
                <MetricCard
                    title="Active Alerts"
                    value={overview?.activeAlertCount || 0}
                    subtitle="Unacknowledged"
                    icon={Bell}
                    color={(overview?.activeAlertCount || 0) > 0 ? 'red' : 'green'}
                />
            </div>

            {/* Services Grid */}
            <Card>
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Server className="w-5 h-5" />
                        Service Status
                    </h3>
                </div>
                <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {services.map((service) => (
                            <div
                                key={service.id}
                                className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-medium text-gray-900 dark:text-white">{service.name}</h4>
                                    <StatusBadge status={service.status} />
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-sm">
                                    <div>
                                        <p className="text-gray-500 dark:text-gray-400">Today</p>
                                        <p className="font-medium text-gray-900 dark:text-white">{service.today.requests}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 dark:text-gray-400">Errors</p>
                                        <p className={`font-medium ${service.today.errors > 0 ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                                            {service.today.errors}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 dark:text-gray-400">Avg Time</p>
                                        <p className="font-medium text-gray-900 dark:text-white">{service.today.avgResponseTime}ms</p>
                                    </div>
                                </div>
                                {service.quota?.daily && (
                                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                        <QuotaBar
                                            used={service.quota.daily.used}
                                            limit={service.quota.daily.limit}
                                            label="Daily Quota"
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </Card>

            {/* Active Alerts */}
            {alerts && alerts.length > 0 && (
                <Card>
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-yellow-500" />
                            Active Alerts ({alerts.length})
                        </h3>
                    </div>
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {alerts.slice(0, 5).map((alert) => (
                            <div key={alert._id} className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <SeverityBadge severity={alert.severity} />
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">{alert.message}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {alert.service} • {new Date(alert.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
};

// Errors Tab Component
const ErrorsTab = ({ getToken }) => {
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [filters, setFilters] = useState({
        service: '',
        resolved: '',
        page: 1
    });
    const [pagination, setPagination] = useState({});

    const fetchErrors = useCallback(async () => {
        try {
            setLoading(true);
            setFetchError(null);
            const token = await getToken();
            setAuthToken(token);

            const response = await apiMonitoring.getErrorLogs(filters);
            // Handle response structure
            const data = response?.data || response;
            setErrors(data?.errors || []);
            setPagination(data?.pagination || {});
        } catch (error) {
            console.error('Failed to fetch errors:', error);
            setFetchError(error?.message || 'Failed to load errors');
            setErrors([]);
        } finally {
            setLoading(false);
        }
    }, [getToken, filters]);

    useEffect(() => {
        fetchErrors();
    }, [fetchErrors]);

    const handleResolve = async (errorId) => {
        try {
            const token = await getToken();
            setAuthToken(token);
            await apiMonitoring.resolveError(errorId);
            fetchErrors();
        } catch (error) {
            console.error('Failed to resolve error:', error);
        }
    };

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <select
                    value={filters.service}
                    onChange={(e) => setFilters({ ...filters, service: e.target.value, page: 1 })}
                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                    <option value="">All Services</option>
                    <option value="gemini">Gemini AI</option>
                    <option value="eventbrite">Eventbrite</option>
                    <option value="bls">BLS</option>
                    <option value="github">GitHub</option>
                    <option value="openalex">OpenAlex</option>
                </select>
                <select
                    value={filters.resolved}
                    onChange={(e) => setFilters({ ...filters, resolved: e.target.value, page: 1 })}
                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                    <option value="">All Status</option>
                    <option value="false">Unresolved</option>
                    <option value="true">Resolved</option>
                </select>
            </div>

            {/* Error Display */}
            {fetchError && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <AlertCircle className="w-5 h-5" />
                        <span>{fetchError}</span>
                    </div>
                </div>
            )}

            {/* Errors List */}
            <Card>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {loading ? (
                        <div className="p-8 flex justify-center">
                            <LoadingSpinner />
                        </div>
                    ) : errors.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            No error logs found matching your filters.
                        </div>
                    ) : (
                        errors.map((error) => (
                            <div key={error._id} className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                                                {error.service}
                                            </span>
                                            {error.statusCode && (
                                                <span className={`px-2 py-0.5 text-xs font-medium rounded ${error.statusCode >= 500 ? 'bg-red-100 text-red-700' :
                                                        error.statusCode >= 400 ? 'bg-orange-100 text-orange-700' :
                                                            'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {error.statusCode}
                                                </span>
                                            )}
                                            {error.resolved ? (
                                                <span className="flex items-center gap-1 text-xs text-green-600">
                                                    <CheckCircle className="w-3 h-3" /> Resolved
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-xs text-red-600">
                                                    <AlertCircle className="w-3 h-3" /> Unresolved
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{error.errorMessage}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {error.endpoint} • {new Date(error.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                    {!error.resolved && (
                                        <button
                                            onClick={() => handleResolve(error._id)}
                                            className="px-3 py-1 text-sm bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition-colors"
                                        >
                                            Resolve
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <span className="text-sm text-gray-500">
                            Page {pagination.page} of {pagination.pages} ({pagination.total} total)
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                                disabled={filters.page <= 1}
                                className="px-3 py-1 text-sm border rounded-lg disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                                disabled={filters.page >= pagination.pages}
                                className="px-3 py-1 text-sm border rounded-lg disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};

// Alerts Tab Component
const AlertsTab = ({ getToken }) => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [filters, setFilters] = useState({
        acknowledged: 'false',
        severity: '',
        page: 1
    });

    const fetchAlerts = useCallback(async () => {
        try {
            setLoading(true);
            setFetchError(null);
            const token = await getToken();
            setAuthToken(token);

            const response = await apiMonitoring.getAlerts(filters);
            // Handle response structure
            const data = response?.data || response;
            setAlerts(data?.alerts || []);
        } catch (error) {
            console.error('Failed to fetch alerts:', error);
            setFetchError(error?.message || 'Failed to load alerts');
            setAlerts([]);
        } finally {
            setLoading(false);
        }
    }, [getToken, filters]);

    useEffect(() => {
        fetchAlerts();
    }, [fetchAlerts]);

    const handleAcknowledge = async (alertId) => {
        try {
            const token = await getToken();
            setAuthToken(token);
            await apiMonitoring.acknowledgeAlert(alertId);
            fetchAlerts();
        } catch (error) {
            console.error('Failed to acknowledge alert:', error);
        }
    };

    const getAlertIcon = (alertType) => {
        switch (alertType) {
            case 'RATE_LIMIT_WARNING':
            case 'RATE_LIMIT_EXCEEDED':
                return <Zap className="w-5 h-5 text-yellow-500" />;
            case 'ERROR_SPIKE':
                return <AlertTriangle className="w-5 h-5 text-red-500" />;
            case 'SERVICE_DOWN':
                return <Server className="w-5 h-5 text-red-500" />;
            case 'SLOW_RESPONSE':
                return <Clock className="w-5 h-5 text-purple-500" />;
            case 'QUOTA_WARNING':
                return <Database className="w-5 h-5 text-orange-500" />;
            default:
                return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <select
                    value={filters.acknowledged}
                    onChange={(e) => setFilters({ ...filters, acknowledged: e.target.value, page: 1 })}
                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                    <option value="">All Alerts</option>
                    <option value="false">Unacknowledged</option>
                    <option value="true">Acknowledged</option>
                </select>
                <select
                    value={filters.severity}
                    onChange={(e) => setFilters({ ...filters, severity: e.target.value, page: 1 })}
                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                    <option value="">All Severities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                </select>
            </div>

            {/* Error Display */}
            {fetchError && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <AlertCircle className="w-5 h-5" />
                        <span>{fetchError}</span>
                    </div>
                </div>
            )}

            {/* Alerts List */}
            <Card>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {loading ? (
                        <div className="p-8 flex justify-center">
                            <LoadingSpinner />
                        </div>
                    ) : alerts.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            No alerts found matching your filters.
                        </div>
                    ) : (
                        alerts.map((alert) => (
                            <div key={alert._id} className="p-4">
                                <div className="flex items-start gap-4">
                                    {getAlertIcon(alert.alertType)}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <SeverityBadge severity={alert.severity} />
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {alert.alertType.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{alert.message}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {alert.service} • {new Date(alert.timestamp).toLocaleString()}
                                        </p>
                                        {alert.acknowledged && (
                                            <p className="text-xs text-green-600 mt-1">
                                                Acknowledged {new Date(alert.acknowledgedAt).toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                    {!alert.acknowledged && (
                                        <button
                                            onClick={() => handleAcknowledge(alert._id)}
                                            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors flex items-center gap-1"
                                        >
                                            <Check className="w-4 h-4" />
                                            Acknowledge
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Card>
        </div>
    );
};

// Performance Tab Component
const PerformanceTab = ({ getToken }) => {
    const [performance, setPerformance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState(7);

    const fetchPerformance = useCallback(async () => {
        try {
            setLoading(true);
            const token = await getToken();
            setAuthToken(token);

            const response = await apiMonitoring.getPerformanceMetrics(days);
            // Handle response structure
            const data = response?.data || response;
            setPerformance(data);
        } catch (error) {
            console.error('Failed to fetch performance:', error);
            setPerformance(null);
        } finally {
            setLoading(false);
        }
    }, [getToken, days]);

    useEffect(() => {
        fetchPerformance();
    }, [fetchPerformance]);

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <LoadingSpinner />
            </div>
        );
    }

    if (!performance) {
        return (
            <div className="text-center py-12 text-gray-500">
                Failed to load performance data.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Time Range Selector */}
            <div className="flex gap-2">
                {[7, 14, 30].map((d) => (
                    <button
                        key={d}
                        onClick={() => setDays(d)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${days === d
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                    >
                        {d} Days
                    </button>
                ))}
            </div>

            {/* Slow Services Warning */}
            {performance.hasSlowServices && (
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
                        <Clock className="w-5 h-5" />
                        <span className="font-medium">Slow Services Detected</span>
                    </div>
                    <ul className="mt-2 space-y-1">
                        {performance.slowServices.map((s) => (
                            <li key={s.service} className="text-sm text-purple-600 dark:text-purple-300">
                                {s.serviceName}: {s.avgResponseTime}ms average response time
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Performance by Service */}
            <Card>
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Response Time by Service
                    </h3>
                </div>
                <div className="p-4">
                    <div className="space-y-4">
                        {performance.byService.map((service) => (
                            <div key={service.service} className="flex items-center gap-4">
                                <div className="w-32 text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {service.serviceName}
                                </div>
                                <div className="flex-1">
                                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden relative">
                                        <div
                                            className={`h-full rounded-full ${service.avgResponseTime > 2000 ? 'bg-red-500' :
                                                    service.avgResponseTime > 1000 ? 'bg-yellow-500' :
                                                        'bg-green-500'
                                                }`}
                                            style={{ width: `${Math.min((service.avgResponseTime / 3000) * 100, 100)}%` }}
                                        />
                                        <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-900 dark:text-white">
                                            {service.avgResponseTime}ms
                                        </span>
                                    </div>
                                </div>
                                <div className="w-24 text-sm text-gray-500 dark:text-gray-400 text-right">
                                    {service.totalRequests.toLocaleString()} req
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>

            {/* Daily Trends */}
            <Card>
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Daily Response Time Trend
                    </h3>
                </div>
                <div className="p-4">
                    <div className="grid grid-cols-7 gap-2">
                        {performance.dailyTrends.map((day, index) => {
                            const maxTime = Math.max(...performance.dailyTrends.map(d => parseInt(d.avgResponseTime) || 0));
                            const height = maxTime > 0 ? (parseInt(day.avgResponseTime) / maxTime) * 100 : 0;

                            return (
                                <div key={index} className="flex flex-col items-center">
                                    <div className="h-24 w-full flex items-end justify-center">
                                        <div
                                            className={`w-full max-w-8 rounded-t ${parseInt(day.avgResponseTime) > 2000 ? 'bg-red-500' :
                                                    parseInt(day.avgResponseTime) > 1000 ? 'bg-yellow-500' :
                                                        'bg-green-500'
                                                }`}
                                            style={{ height: `${height}%` }}
                                        />
                                    </div>
                                    <span className="text-xs text-gray-500 mt-1">
                                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                    </span>
                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                        {day.avgResponseTime}ms
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </Card>
        </div>
    );
};

// Reports Tab Component
const ReportsTab = ({ getToken }) => {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchReport = useCallback(async () => {
        try {
            setLoading(true);
            const token = await getToken();
            setAuthToken(token);

            const response = await apiMonitoring.getWeeklyReport();
            // Handle response structure
            const data = response?.data || response;
            setReport(data);
        } catch (error) {
            console.error('Failed to fetch report:', error);
            setReport(null);
        } finally {
            setLoading(false);
        }
    }, [getToken]);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <LoadingSpinner />
            </div>
        );
    }

    if (!report) {
        return (
            <div className="text-center py-12 text-gray-500">
                Failed to load weekly report.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Report Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">Weekly API Usage Report</h2>
                        <p className="text-blue-100 mt-1">
                            {new Date(report.period.start).toLocaleDateString()} - {new Date(report.period.end).toLocaleDateString()}
                        </p>
                    </div>
                    <FileText className="w-12 h-12 text-blue-200" />
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard
                    title="Total Requests"
                    value={report.summary.totalRequests.toLocaleString()}
                    icon={Activity}
                    color="blue"
                />
                <MetricCard
                    title="Success Rate"
                    value={`${report.summary.successRate}%`}
                    icon={CheckCircle}
                    color="green"
                />
                <MetricCard
                    title="Failed Requests"
                    value={report.summary.failedRequests.toLocaleString()}
                    icon={AlertCircle}
                    color="red"
                />
                <MetricCard
                    title="Rate Limit Hits"
                    value={report.summary.rateLimitHits}
                    icon={Zap}
                    color="yellow"
                />
            </div>

            {/* Service Breakdown */}
            <Card>
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <PieChart className="w-5 h-5" />
                        Usage by Service
                    </h3>
                </div>
                <div className="p-4">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Service</th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Requests</th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Errors</th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Success Rate</th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Avg Response</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.byService.map((service) => (
                                    <tr key={service.service} className="border-b border-gray-100 dark:border-gray-800">
                                        <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                                            {service.serviceName}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-right text-gray-700 dark:text-gray-300">
                                            {service.totalRequests.toLocaleString()}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-right">
                                            <span className={service.failedRequests > 0 ? 'text-red-600' : 'text-gray-700 dark:text-gray-300'}>
                                                {service.failedRequests.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-right">
                                            <span className={`px-2 py-0.5 rounded ${parseFloat(service.successRate) >= 95 ? 'bg-green-100 text-green-700' :
                                                    parseFloat(service.successRate) >= 80 ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                }`}>
                                                {service.successRate}%
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-right text-gray-700 dark:text-gray-300">
                                            {service.avgResponseTime?.toFixed(0) || 0}ms
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Card>

            {/* Alerts Summary */}
            <Card>
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Bell className="w-5 h-5" />
                        Alerts Summary
                    </h3>
                </div>
                <div className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{report.alerts.total}</p>
                            <p className="text-sm text-gray-500">Total Alerts</p>
                        </div>
                        <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <p className="text-2xl font-bold text-red-600">{report.alerts.bySeverity.critical}</p>
                            <p className="text-sm text-red-500">Critical</p>
                        </div>
                        <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                            <p className="text-2xl font-bold text-orange-600">{report.alerts.bySeverity.high}</p>
                            <p className="text-sm text-orange-500">High</p>
                        </div>
                        <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                            <p className="text-2xl font-bold text-yellow-600">{report.alerts.bySeverity.medium}</p>
                            <p className="text-sm text-yellow-500">Medium</p>
                        </div>
                        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <p className="text-2xl font-bold text-blue-600">{report.alerts.bySeverity.low}</p>
                            <p className="text-sm text-blue-500">Low</p>
                        </div>
                    </div>
                    {report.alerts.unacknowledged > 0 && (
                        <p className="mt-4 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            {report.alerts.unacknowledged} alerts still unacknowledged
                        </p>
                    )}
                </div>
            </Card>

            {/* Report Footer */}
            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                Report generated on {new Date(report.generatedAt).toLocaleString()}
            </div>
        </div>
    );
};

// Main Dashboard Component
export default function APIMonitoringDashboard() {
    const { getToken } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const fetchDashboard = useCallback(async () => {
        try {
            setRefreshing(true);
            setError(null);
            const token = await getToken();
            setAuthToken(token);

            const response = await apiMonitoring.getDashboard();
            // Handle both response structures: {data: {...}} or direct data
            const dashboardData = response?.data || response;
            if (dashboardData) {
                setDashboard(dashboardData);
            } else {
                setError('No data received from server');
            }
        } catch (error) {
            console.error('Failed to fetch dashboard:', error);
            setError(error?.message || 'Failed to load dashboard data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [getToken]);

    useEffect(() => {
        fetchDashboard();

        // Refresh every 5 minutes
        const interval = setInterval(fetchDashboard, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchDashboard]);

    const tabs = [
        { id: 'overview', label: 'Overview', icon: Activity },
        { id: 'errors', label: 'Errors', icon: AlertCircle },
        { id: 'alerts', label: 'Alerts', icon: Bell },
        { id: 'performance', label: 'Performance', icon: Zap },
        { id: 'reports', label: 'Reports', icon: FileText }
    ];

    return (
        <Container className="py-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">API Monitoring Dashboard</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Monitor API usage, errors, and performance across all integrated services
                    </p>
                </div>
                <button
                    onClick={fetchDashboard}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                <nav className="flex space-x-8 overflow-x-auto">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${activeTab === tab.id
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Tab Content */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <AlertCircle className="w-5 h-5" />
                        <span>{error}</span>
                    </div>
                </div>
            )}
            {activeTab === 'overview' && (
                <OverviewTab dashboard={dashboard} loading={loading} onRefresh={fetchDashboard} />
            )}
            {activeTab === 'errors' && <ErrorsTab getToken={getToken} />}
            {activeTab === 'alerts' && <AlertsTab getToken={getToken} />}
            {activeTab === 'performance' && <PerformanceTab getToken={getToken} />}
            {activeTab === 'reports' && <ReportsTab getToken={getToken} />}
        </Container>
    );
}
