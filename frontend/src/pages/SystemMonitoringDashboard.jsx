import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import {
    Activity,
    AlertTriangle,
    CheckCircle,
    Clock,
    Database,
    Server,
    TrendingUp,
    XCircle,
    RefreshCw,
    Zap
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

/**
 * System Monitoring Dashboard
 * 
 * Displays real-time metrics, health status, and performance data
 * for the application infrastructure.
 */
export default function SystemMonitoringDashboard() {
    const { getToken } = useAuth();
    const [healthData, setHealthData] = useState(null);
    const [metricsData, setMetricsData] = useState(null);
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const [autoRefresh, setAutoRefresh] = useState(true);

    const fetchData = async () => {
        try {
            setError(null);

            // Fetch detailed health data from monitoring routes
            const healthRes = await fetch(`${API_BASE_URL}/api/monitoring/health/detailed`);
            const health = await healthRes.json();
            setHealthData(health);
            
            // Fetch metrics data
            const metricsRes = await fetch(`${API_BASE_URL}/api/monitoring/metrics`);
            const metrics = await metricsRes.json();
            setMetricsData(metrics);
            
            // Fetch dashboard data
            const dashboardRes = await fetch(`${API_BASE_URL}/api/monitoring/dashboard`);
            const dashboard = await dashboardRes.json();
            setDashboardData(dashboard);

            setLastRefresh(new Date());
        } catch (err) {
            console.error('Failed to fetch monitoring data:', err);
            setError('Failed to connect to monitoring service');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        // Auto-refresh every 30 seconds
        let interval;
        if (autoRefresh) {
            interval = setInterval(fetchData, 30000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [autoRefresh]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'healthy':
                return 'text-green-500';
            case 'warning':
                return 'text-yellow-500';
            case 'unhealthy':
                return 'text-red-500';
            default:
                return 'text-gray-500';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'healthy':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'warning':
                return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
            case 'unhealthy':
                return <XCircle className="w-5 h-5 text-red-500" />;
            default:
                return <Clock className="w-5 h-5 text-gray-500" />;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading monitoring data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">System Monitoring</h1>
                        <p className="text-gray-600">Real-time application health and performance metrics</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-500">
                            Last updated: {lastRefresh.toLocaleTimeString()}
                        </div>
                        <label className="flex items-center gap-2 text-sm text-gray-600">
                            <input
                                type="checkbox"
                                checked={autoRefresh}
                                onChange={(e) => setAutoRefresh(e.target.checked)}
                                className="rounded border-gray-300"
                            />
                            Auto-refresh
                        </label>
                        <button
                            onClick={fetchData}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                        <XCircle className="w-5 h-5 text-red-500" />
                        <span className="text-red-700">{error}</span>
                    </div>
                )}

                {/* Health Status Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    {/* Overall Status */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 uppercase tracking-wide">System Status</p>
                                <p className={`text-2xl font-bold capitalize ${getStatusColor(healthData?.status)}`}>
                                    {healthData?.status || 'Unknown'}
                                </p>
                            </div>
                            {getStatusIcon(healthData?.status)}
                        </div>
                    </div>

                    {/* API Status */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 uppercase tracking-wide">API</p>
                                <p className={`text-2xl font-bold capitalize ${getStatusColor(healthData?.checks?.api?.status)}`}>
                                    {healthData?.checks?.api?.status || 'Unknown'}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {healthData?.checks?.api?.latency}ms latency
                                </p>
                            </div>
                            <Server className={`w-8 h-8 ${getStatusColor(healthData?.checks?.api?.status)}`} />
                        </div>
                    </div>

                    {/* Database Status */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 uppercase tracking-wide">Database</p>
                                <p className={`text-2xl font-bold capitalize ${getStatusColor(healthData?.checks?.database?.status)}`}>
                                    {healthData?.checks?.database?.status || 'Unknown'}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {healthData?.checks?.database?.state}
                                </p>
                            </div>
                            <Database className={`w-8 h-8 ${getStatusColor(healthData?.checks?.database?.status)}`} />
                        </div>
                    </div>

                    {/* Memory Status */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 uppercase tracking-wide">Memory</p>
                                <p className={`text-2xl font-bold ${getStatusColor(healthData?.checks?.memory?.status)}`}>
                                    {healthData?.checks?.memory?.usage?.usagePercent || '0%'}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {healthData?.checks?.memory?.usage?.heapUsed} / {healthData?.checks?.memory?.usage?.heapTotal}
                                </p>
                            </div>
                            <Activity className={`w-8 h-8 ${getStatusColor(healthData?.checks?.memory?.status)}`} />
                        </div>
                    </div>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Requests */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Zap className="w-5 h-5 text-blue-500" />
                            <h3 className="text-lg font-semibold text-gray-900">Requests (Last Hour)</h3>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Total Requests</span>
                                <span className="font-bold text-gray-900">
                                    {dashboardData?.dashboard?.performance?.requestsLastHour || 0}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Error Rate</span>
                                <span className={`font-bold ${parseFloat(dashboardData?.dashboard?.performance?.errorRate) > 5
                                        ? 'text-red-500'
                                        : 'text-green-500'
                                    }`}>
                                    {dashboardData?.dashboard?.performance?.errorRate || '0%'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Avg Response Time</span>
                                <span className="font-bold text-gray-900">
                                    {dashboardData?.dashboard?.performance?.avgResponseTime || '0ms'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Errors */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                            <h3 className="text-lg font-semibold text-gray-900">Errors</h3>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Last Hour</span>
                                <span className={`font-bold ${(dashboardData?.dashboard?.errors?.lastHour || 0) > 0
                                        ? 'text-red-500'
                                        : 'text-green-500'
                                    }`}>
                                    {dashboardData?.dashboard?.errors?.lastHour || 0}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Last 24 Hours</span>
                                <span className="font-bold text-gray-900">
                                    {dashboardData?.dashboard?.errors?.lastDay || 0}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Uptime */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <TrendingUp className="w-5 h-5 text-green-500" />
                            <h3 className="text-lg font-semibold text-gray-900">Uptime</h3>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Current Session</span>
                                <span className="font-bold text-gray-900">
                                    {dashboardData?.dashboard?.overview?.uptime || '0s'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Version</span>
                                <span className="font-bold text-gray-900">
                                    {dashboardData?.dashboard?.overview?.version || '1.0.0'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Environment</span>
                                <span className="font-bold text-blue-600 uppercase text-sm">
                                    {dashboardData?.dashboard?.overview?.environment || 'development'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Errors */}
                {dashboardData?.dashboard?.errors?.recentErrors?.length > 0 && (
                    <div className="bg-white rounded-lg shadow p-6 mb-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Errors</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-sm text-gray-500 border-b">
                                        <th className="pb-2">Timestamp</th>
                                        <th className="pb-2">Message</th>
                                        <th className="pb-2">Path</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dashboardData.dashboard.errors.recentErrors.map((error, index) => (
                                        <tr key={index} className="border-b last:border-0">
                                            <td className="py-3 text-sm text-gray-600">
                                                {new Date(error.timestamp).toLocaleString()}
                                            </td>
                                            <td className="py-3 text-sm text-red-600 font-mono">
                                                {error.message}
                                            </td>
                                            <td className="py-3 text-sm text-gray-600">
                                                {error.path || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Top Endpoints */}
                {dashboardData?.dashboard?.api?.topEndpoints?.length > 0 && (
                    <div className="bg-white rounded-lg shadow p-6 mb-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top API Endpoints</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-sm text-gray-500 border-b">
                                        <th className="pb-2">Endpoint</th>
                                        <th className="pb-2 text-right">Requests</th>
                                        <th className="pb-2 text-right">Avg Latency</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dashboardData.dashboard.api.topEndpoints.map((endpoint, index) => (
                                        <tr key={index} className="border-b last:border-0">
                                            <td className="py-3 text-sm font-mono text-gray-800">
                                                {endpoint.endpoint}
                                            </td>
                                            <td className="py-3 text-sm text-gray-600 text-right">
                                                {endpoint.requests}
                                            </td>
                                            <td className="py-3 text-sm text-gray-600 text-right">
                                                {endpoint.avgLatency}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Slow Endpoints */}
                {dashboardData?.dashboard?.api?.slowEndpoints?.length > 0 && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Slow Endpoints</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-sm text-gray-500 border-b">
                                        <th className="pb-2">Endpoint</th>
                                        <th className="pb-2 text-right">P95 Latency</th>
                                        <th className="pb-2 text-right">Max Latency</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dashboardData.dashboard.api.slowEndpoints.map((endpoint, index) => (
                                        <tr key={index} className="border-b last:border-0">
                                            <td className="py-3 text-sm font-mono text-gray-800">
                                                {endpoint.endpoint}
                                            </td>
                                            <td className="py-3 text-sm text-yellow-600 text-right font-medium">
                                                {endpoint.p95Latency}
                                            </td>
                                            <td className="py-3 text-sm text-red-600 text-right font-medium">
                                                {endpoint.maxLatency}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
