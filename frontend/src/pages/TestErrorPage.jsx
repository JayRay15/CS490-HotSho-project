import { useState } from 'react';
import { captureException, captureMessage, addBreadcrumb } from '../utils/sentry';
import { AlertTriangle, Bug, Send, Zap, CheckCircle } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Test Error Page
 * 
 * This page allows testing of the error tracking and monitoring system.
 * Use this to verify that:
 * - Frontend errors are captured by Sentry
 * - Backend errors are logged and tracked
 * - Alerts are sent for critical errors
 * 
 * NOTE: This page should be disabled or protected in production
 */
export default function TestErrorPage() {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const addResult = (type, message, success = true) => {
        setResults(prev => [...prev, {
            type,
            message,
            success,
            timestamp: new Date().toISOString()
        }]);
    };

    const triggerFrontendError = () => {
        try {
            addBreadcrumb('User triggered test error', 'test', 'info');
            // This will throw an error
            throw new Error('Test frontend error - This is intentional for testing');
        } catch (error) {
            captureException(error, { test: true, triggered: 'manually' });
            addResult('Frontend Error', 'Error captured and sent to Sentry', true);
        }
    };

    const triggerUnhandledError = () => {
        addBreadcrumb('User triggered unhandled error', 'test', 'warning');
        addResult('Unhandled Error', 'About to throw unhandled error...', true);

        // This will be caught by the ErrorBoundary
        setTimeout(() => {
            throw new Error('Test unhandled error - This should trigger ErrorBoundary');
        }, 100);
    };

    const triggerBackendError = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/monitoring/test-error`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'error' })
            });
            const data = await response.json();

            if (data.success) {
                addResult('Backend Error', 'Backend error logged successfully', true);
            } else {
                addResult('Backend Error', data.error || 'Failed to trigger error', false);
            }
        } catch (error) {
            addResult('Backend Error', `Request failed: ${error.message}`, false);
        } finally {
            setLoading(false);
        }
    };

    const triggerBackendWarning = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/monitoring/test-error`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'warning' })
            });
            const data = await response.json();

            if (data.success) {
                addResult('Backend Warning', 'Backend warning logged successfully', true);
            } else {
                addResult('Backend Warning', data.error || 'Failed to trigger warning', false);
            }
        } catch (error) {
            addResult('Backend Warning', `Request failed: ${error.message}`, false);
        } finally {
            setLoading(false);
        }
    };

    const triggerBackendException = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/monitoring/test-error`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'exception' })
            });
            const data = await response.json();

            // If we get here, the server didn't throw
            addResult('Backend Exception', 'Server handled exception (check logs)', true);
        } catch (error) {
            // This is expected - the server threw an error
            addResult('Backend Exception', 'Server threw exception (check Sentry)', true);
        } finally {
            setLoading(false);
        }
    };

    const sendSentryMessage = () => {
        captureMessage('Test message from monitoring verification', 'info', {
            test: true,
            timestamp: new Date().toISOString()
        });
        addResult('Sentry Message', 'Test message sent to Sentry', true);
    };

    const checkHealthEndpoint = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/monitoring/health/detailed`);
            const data = await response.json();

            addResult('Health Check', `Status: ${data.status}, DB: ${data.checks?.database?.status}`, data.status === 'healthy');
        } catch (error) {
            addResult('Health Check', `Failed: ${error.message}`, false);
        } finally {
            setLoading(false);
        }
    };

    const clearResults = () => {
        setResults([]);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                        <span className="text-yellow-800 font-medium">Development/Testing Only</span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">
                        This page is for testing the error tracking and monitoring system.
                        Errors triggered here will be logged and may trigger alerts.
                    </p>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-6">Error Tracking Verification</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Frontend Tests */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Bug className="w-5 h-5 text-purple-500" />
                            Frontend Tests
                        </h2>
                        <div className="space-y-3">
                            <button
                                onClick={triggerFrontendError}
                                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2"
                            >
                                <Zap className="w-4 h-4" />
                                Trigger Captured Error
                            </button>
                            <button
                                onClick={triggerUnhandledError}
                                className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition flex items-center justify-center gap-2"
                            >
                                <AlertTriangle className="w-4 h-4" />
                                Trigger Unhandled Error
                            </button>
                            <button
                                onClick={sendSentryMessage}
                                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                            >
                                <Send className="w-4 h-4" />
                                Send Test Message
                            </button>
                        </div>
                    </div>

                    {/* Backend Tests */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Bug className="w-5 h-5 text-green-500" />
                            Backend Tests
                        </h2>
                        <div className="space-y-3">
                            <button
                                onClick={triggerBackendError}
                                disabled={loading}
                                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <Zap className="w-4 h-4" />
                                Log Backend Error
                            </button>
                            <button
                                onClick={triggerBackendWarning}
                                disabled={loading}
                                className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <AlertTriangle className="w-4 h-4" />
                                Log Backend Warning
                            </button>
                            <button
                                onClick={triggerBackendException}
                                disabled={loading}
                                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <Bug className="w-4 h-4" />
                                Trigger Backend Exception
                            </button>
                            <button
                                onClick={checkHealthEndpoint}
                                disabled={loading}
                                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <CheckCircle className="w-4 h-4" />
                                Check Health Endpoint
                            </button>
                        </div>
                    </div>
                </div>

                {/* Results */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Test Results</h2>
                        <button
                            onClick={clearResults}
                            className="text-sm text-gray-500 hover:text-gray-700"
                        >
                            Clear
                        </button>
                    </div>

                    {results.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">
                            No tests run yet. Click a button above to test error tracking.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {results.map((result, index) => (
                                <div
                                    key={index}
                                    className={`p-3 rounded-lg flex items-center justify-between ${result.success ? 'bg-green-50' : 'bg-red-50'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        {result.success ? (
                                            <CheckCircle className="w-4 h-4 text-green-500" />
                                        ) : (
                                            <AlertTriangle className="w-4 h-4 text-red-500" />
                                        )}
                                        <span className="font-medium text-gray-900">{result.type}</span>
                                        <span className="text-gray-600">- {result.message}</span>
                                    </div>
                                    <span className="text-xs text-gray-400">
                                        {new Date(result.timestamp).toLocaleTimeString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Instructions */}
                <div className="mt-8 bg-blue-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-3">Verification Steps</h3>
                    <ol className="list-decimal list-inside space-y-2 text-blue-800">
                        <li>Trigger a frontend error and check Sentry dashboard</li>
                        <li>Trigger a backend error and check server logs</li>
                        <li>Check the health endpoint returns "healthy" status</li>
                        <li>Verify the System Monitoring Dashboard shows the errors</li>
                        <li>If Sentry is configured, verify alerts are sent for critical errors</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}
