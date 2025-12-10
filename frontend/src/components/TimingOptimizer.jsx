import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  getTimingRecommendation,
  getRealtimeRecommendation,
  scheduleSubmission,
  cancelScheduledSubmission,
  getTimingMetrics,
  getABTestResults,
  getCorrelations,
  getComprehensiveInsights
} from '../api/applicationTiming';

const TimingOptimizer = ({ job, onClose, onScheduled }) => {
  const [loading, setLoading] = useState(true);
  const [recommendation, setRecommendation] = useState(null);
  const [realtimeRec, setRealtimeRec] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [abTestResults, setAbTestResults] = useState(null);
  const [correlations, setCorrelations] = useState(null);
  const [insights, setInsights] = useState(null);
  const [activeTab, setActiveTab] = useState('recommendation');
  const [scheduledTime, setScheduledTime] = useState('');
  const [autoSubmit, setAutoSubmit] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    loadData();
  }, [job]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 8000); // Auto-dismiss after 8 seconds
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get timezone from browser
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'EST';

      // Load recommendation
      const recResponse = await getTimingRecommendation(job._id, userTimezone);
      setRecommendation(recResponse.recommendation);
      
      // Set default scheduled time to recommended time
      if (recResponse.recommendation?.recommendedTime) {
        const recTime = new Date(recResponse.recommendation.recommendedTime);
        setScheduledTime(recTime.toISOString().slice(0, 16));
      }

      // Load realtime recommendation
      try {
        const realtimeResponse = await getRealtimeRecommendation(job._id, userTimezone);
        setRealtimeRec(realtimeResponse);
      } catch (err) {
        console.error('Error loading realtime recommendation:', err);
      }

      // Load metrics
      try {
        const metricsResponse = await getTimingMetrics(job._id);
        setMetrics(metricsResponse.metrics);
      } catch (err) {
        console.error('Error loading metrics:', err);
      }

      // Load A/B test results
      try {
        const abResponse = await getABTestResults();
        setAbTestResults(abResponse.results);
      } catch (err) {
        console.error('Error loading A/B test results:', err);
      }

      // Load correlations
      try {
        const corrResponse = await getCorrelations();
        setCorrelations(corrResponse.correlations);
      } catch (err) {
        console.error('Error loading correlations:', err);
      }

      // Load comprehensive insights (always has data even for new users)
      try {
        const insightsResponse = await getComprehensiveInsights();
        setInsights(insightsResponse);
      } catch (err) {
        console.error('Error loading comprehensive insights:', err);
      }

    } catch (err) {
      console.error('Error loading timing data:', err);
      setError('Failed to load timing optimization data');
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async () => {
    console.log('🔔 Schedule button clicked');
    console.log('Scheduled time:', scheduledTime);
    console.log('Auto submit:', autoSubmit);
    
    if (!scheduledTime) {
      setError('Please select a time to schedule');
      return;
    }

    try {
      setScheduling(true);
      setError(null);

      console.log('Calling scheduleSubmission API...');
      const response = await scheduleSubmission(job._id, scheduledTime, autoSubmit);
      console.log('Schedule response:', response);

      if (onScheduled) {
        onScheduled();
      }

      // Reload data
      await loadData();

      setSuccessMessage({
        type: 'schedule',
        message: response.message || 'Application submission scheduled successfully!',
        details: autoSubmit ? 'The application will be automatically submitted at the scheduled time.' : 'You will receive a reminder email at the scheduled time.'
      });
      
      // Clear scheduledTime after successful scheduling
      setScheduledTime('');
      setAutoSubmit(false);
    } catch (err) {
      console.error('Error scheduling submission:', err);
      setError('Failed to schedule submission: ' + (err.response?.data?.error || err.message));
    } finally {
      setScheduling(false);
    }
  };

  const handleCancelSchedule = async () => {
    try {
      setScheduling(true);
      setError(null);

      await cancelScheduledSubmission(job._id);

      // Reload data
      await loadData();

      setSuccessMessage({
        type: 'cancel',
        message: 'Scheduled submission cancelled successfully!',
        details: 'Your scheduled application has been cancelled.'
      });
    } catch (err) {
      console.error('Error cancelling schedule:', err);
      setError('Failed to cancel scheduled submission');
    } finally {
      setScheduling(false);
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'submit_now':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'wait_briefly':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'schedule':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 75) return 'text-green-600';
    if (confidence >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getImpactIcon = (impact) => {
    switch (impact) {
      case 'positive':
        return '✅';
      case 'negative':
        return '⚠️';
      default:
        return 'ℹ️';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
          <p className="text-center mt-4 text-gray-600">Analyzing optimal timing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Application Timing Optimizer</h2>
            <p className="text-sm text-gray-600 mt-1">
              {job.title} at {job.company}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-300 rounded-lg text-red-800">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mx-6 mt-4 p-4 bg-green-50 border border-green-300 rounded-lg">
            <div className="flex items-start">
              <div className="shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-green-800">
                  {successMessage.message}
                </p>
                <p className="mt-1 text-sm text-green-700">
                  {successMessage.details}
                </p>
              </div>
              <button
                onClick={() => setSuccessMessage(null)}
                className="ml-3 inline-flex text-green-400 hover:text-green-600"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-4 px-6" aria-label="Tabs">
            {['recommendation', 'metrics', 'insights'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab === 'recommendation' && '📅 Recommendation'}
                {tab === 'metrics' && '📊 Your Metrics'}
                {tab === 'insights' && '💡 Insights & Analytics'}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'recommendation' && (
            <div className="space-y-6">
              {/* Real-time Recommendation */}
              {realtimeRec && (
                <div className={`border-2 rounded-lg p-6 ${getActionColor(realtimeRec.action)}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold">Right Now</h3>
                    <span className="text-2xl">
                      {realtimeRec.action === 'submit_now' && '🟢'}
                      {realtimeRec.action === 'wait_briefly' && '🟡'}
                      {realtimeRec.action === 'schedule' && '🔵'}
                    </span>
                  </div>
                  <p className="text-lg font-medium mb-2">{realtimeRec.message}</p>
                  {realtimeRec.hoursUntilOptimal > 0 && (
                    <p className="text-sm opacity-90">
                      {realtimeRec.hoursUntilOptimal} hours until optimal time
                    </p>
                  )}
                </div>
              )}

              {/* Detailed Recommendation */}
              {recommendation && (
                <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Optimal Submission Time</h3>
                      <p className="text-3xl font-bold text-blue-600">
                        {recommendation.dayOfWeek}
                      </p>
                      <p className="text-xl text-gray-700 mt-1">
                        {new Date(recommendation.recommendedTime).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </p>
                      <p className="text-sm text-gray-600 mt-2">
                        {formatDateTime(recommendation.recommendedTime)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 mb-1">Confidence Score</p>
                      <p className={`text-4xl font-bold ${getConfidenceColor(recommendation.confidence)}`}>
                        {recommendation.confidence}%
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-white rounded-lg border border-blue-200">
                    <p className="text-gray-800">{recommendation.reasoning}</p>
                  </div>
                </div>
              )}

              {/* Factors */}
              {recommendation?.factors && recommendation.factors.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900 p-4 border-b border-gray-200">
                    Contributing Factors
                  </h4>
                  <div className="p-4 space-y-3">
                    {recommendation.factors.map((factor, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <span className="text-xl">{getImpactIcon(factor.impact)}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900 capitalize">
                              {factor.factor.replace(/_/g, ' ')}
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-700 rounded">
                              Weight: {factor.weight}/10
                            </span>
                          </div>
                          {factor.description && (
                            <p className="text-sm text-gray-600">{factor.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {recommendation?.warnings && recommendation.warnings.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900 p-4 border-b border-gray-200">
                    ⚠️ Timing Warnings
                  </h4>
                  <div className="p-4 space-y-3">
                    {recommendation.warnings.map((warning, index) => (
                      <div
                        key={index}
                        className={`p-3 border-2 rounded-lg ${getSeverityColor(warning.severity)}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium capitalize">
                            {warning.type.replace(/_/g, ' ')}
                          </span>
                          <span className="text-xs uppercase font-bold">
                            {warning.severity}
                          </span>
                        </div>
                        <p className="text-sm">{warning.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Schedule Section */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Schedule Submission</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Schedule Time
                    </label>
                    {/* Debug info */}
                    <div className="text-xs text-gray-500 mb-1">
                      Current value: {scheduledTime || 'empty'}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={scheduledTime.split('T')[0] || ''}
                        onChange={(e) => {
                          const currentTime = scheduledTime.split('T')[1] || '09:00';
                          const timeOnly = currentTime.includes(':') ? currentTime.slice(0, 5) : '09:00';
                          setScheduledTime(`${e.target.value}T${timeOnly}`);
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min={new Date().toISOString().split('T')[0]}
                      />
                      <input
                        type="time"
                        value={scheduledTime.split('T')[1]?.slice(0, 5) || '09:00'}
                        onChange={(e) => {
                          console.log('Time input changed:', e.target.value);
                          const date = scheduledTime.split('T')[0] || new Date().toISOString().split('T')[0];
                          const newScheduledTime = `${date}T${e.target.value}`;
                          console.log('Setting new scheduled time:', newScheduledTime);
                          setScheduledTime(newScheduledTime);
                        }}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    {recommendation && (
                      <button
                        onClick={() => {
                          const recTime = new Date(recommendation.recommendedTime);
                          setScheduledTime(recTime.toISOString().slice(0, 16));
                        }}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                      >
                        Use recommended time
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="autoSubmit"
                      checked={autoSubmit}
                      onChange={(e) => setAutoSubmit(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="autoSubmit" className="text-sm text-gray-700">
                      Auto-submit at scheduled time (sends reminder if unchecked)
                    </label>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={(e) => {
                        console.log('Button clicked!', e);
                        handleSchedule();
                      }}
                      disabled={scheduling || !scheduledTime}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                    >
                      {scheduling ? 'Scheduling...' : 'Schedule Submission'}
                    </button>
                    {metrics?.scheduledSubmission?.status === 'scheduled' && (
                      <button
                        onClick={handleCancelSchedule}
                        disabled={scheduling}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:bg-gray-100 font-medium"
                      >
                        Cancel Schedule
                      </button>
                    )}
                  </div>

                  {metrics?.scheduledSubmission?.status === 'scheduled' && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm font-medium text-blue-900">
                        Currently scheduled for:{' '}
                        {formatDateTime(metrics.scheduledSubmission.scheduledTime)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'metrics' && (
            <div className="space-y-6">
              {metrics ? (
                <>
                  {/* Overall Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-linear-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                      <p className="text-sm text-gray-600 mb-1">Total Submissions</p>
                      <p className="text-3xl font-bold text-blue-600">{metrics.totalSubmissions}</p>
                    </div>
                    <div className="bg-linear-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                      <p className="text-sm text-gray-600 mb-1">Response Rate</p>
                      <p className="text-3xl font-bold text-green-600">
                        {metrics.responseRate.toFixed(1)}%
                      </p>
                    </div>
                    <div className="bg-linear-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                      <p className="text-sm text-gray-600 mb-1">Avg Response Time</p>
                      <p className="text-3xl font-bold text-purple-600">
                        {Math.round(metrics.averageResponseTime)}h
                      </p>
                    </div>
                    <div className="bg-linear-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
                      <p className="text-sm text-gray-600 mb-1">Optimal Time Success</p>
                      <p className="text-3xl font-bold text-yellow-600">
                        {metrics.optimalTimeSuccessRate.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Success Rate Comparison */}
                  {metrics.optimalTimeSuccessRate > 0 && metrics.nonOptimalTimeSuccessRate > 0 && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">
                        Impact of Optimal Timing
                      </h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-sm text-gray-600 mb-2">Optimal Time Submissions</p>
                          <p className="text-2xl font-bold text-green-600">
                            {metrics.optimalTimeSuccessRate.toFixed(1)}% success
                          </p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-sm text-gray-600 mb-2">Other Time Submissions</p>
                          <p className="text-2xl font-bold text-gray-600">
                            {metrics.nonOptimalTimeSuccessRate.toFixed(1)}% success
                          </p>
                        </div>
                      </div>
                      {metrics.optimalTimeSuccessRate > metrics.nonOptimalTimeSuccessRate && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-800">
                            Applying at optimal times improved your success rate by{' '}
                            <span className="font-bold">
                              {(metrics.optimalTimeSuccessRate - metrics.nonOptimalTimeSuccessRate).toFixed(1)}%
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg mb-2">No timing data yet</p>
                  <p className="text-sm text-gray-400">
                    Submit applications and track responses to see your metrics
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="space-y-6">
              {/* Recommendations */}
              {insights?.recommendations && insights.recommendations.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900 p-4 border-b border-gray-200">
                    💡 Personalized Recommendations
                  </h4>
                  <div className="p-4 space-y-3">
                    {insights.recommendations.map((rec, index) => (
                      <div 
                        key={index} 
                        className={`p-4 rounded-lg border ${
                          rec.priority === 'high' 
                            ? 'bg-blue-50 border-blue-200' 
                            : rec.priority === 'medium'
                            ? 'bg-yellow-50 border-yellow-200'
                            : 'bg-green-50 border-green-200'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">
                            {rec.type === 'get_started' && '🚀'}
                            {rec.type === 'best_day' && '📅'}
                            {rec.type === 'improvement' && '📈'}
                            {rec.type === 'success' && '🎉'}
                          </span>
                          <div>
                            <h5 className="font-semibold text-gray-900">{rec.title}</h5>
                            <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* User Stats Summary */}
              {insights?.userStats && insights.userStats.totalSubmissions > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">📊 Your Stats</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{insights.userStats.totalSubmissions}</p>
                      <p className="text-sm text-gray-600">Total Submissions</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{insights.userStats.totalResponses}</p>
                      <p className="text-sm text-gray-600">Responses</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">{insights.userStats.overallRate.toFixed(1)}%</p>
                      <p className="text-sm text-gray-600">Response Rate</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Industry Benchmarks - Always shown */}
              {insights?.industryBenchmarks && (
                <div className="bg-white rounded-lg border border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900 p-4 border-b border-gray-200">
                    🏢 Industry Timing Benchmarks
                  </h4>
                  <div className="p-4">
                    <p className="text-sm text-gray-600 mb-4">
                      Best practices for application timing based on industry research
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      {Object.entries(insights.industryBenchmarks)
                        .filter(([key]) => key !== 'default')
                        .map(([industry, data]) => (
                          <div key={industry} className="p-4 bg-gray-50 rounded-lg">
                            <h5 className="font-semibold text-gray-900 mb-2">{industry}</h5>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <span className="text-green-600">✓</span>
                                <span>Best days: {data.bestDays.join(', ')}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-blue-600">⏰</span>
                                <span>Best hours: {data.bestHours.join(', ')}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-purple-600">📈</span>
                                <span>Avg response rate: {data.avgResponseRate}%</span>
                              </div>
                            </div>
                            {data.insights && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <p className="text-xs text-gray-500 italic">
                                  💡 {data.insights[0]}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {/* User's Success Rate by Day - Only if has data */}
              {insights?.correlations?.byDayOfWeek && 
               Object.keys(insights.correlations.byDayOfWeek).length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900 p-4 border-b border-gray-200">
                    📆 Your Success Rate by Day
                  </h4>
                  <div className="p-4 space-y-2">
                    {Object.entries(insights.correlations.byDayOfWeek)
                      .sort((a, b) => b[1].rate - a[1].rate)
                      .map(([day, data]) => (
                        <div key={day} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-gray-900 w-24">{day}</span>
                            <span className="text-sm text-gray-600">
                              {data.total} application{data.total !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full transition-all"
                                style={{ width: `${Math.min(data.rate, 100)}%` }}
                              />
                            </div>
                            <span className="font-bold text-green-600 w-16 text-right">
                              {data.rate.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
              
              {/* A/B Test Results */}
              {abTestResults && Object.keys(abTestResults).some(key => abTestResults[key].submissions > 0) && (
                    <div className="bg-white rounded-lg border border-gray-200">
                      <h4 className="text-lg font-semibold text-gray-900 p-4 border-b border-gray-200">
                        🧪 A/B Test Results
                      </h4>
                      <div className="p-4">
                        <p className="text-sm text-gray-600 mb-4">
                          Compare the success rates of different timing strategies
                        </p>
                        <div className="space-y-3">
                          {Object.entries(abTestResults).map(([group, data]) => (
                            <div key={group} className="p-4 bg-gray-50 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-gray-900 capitalize">
                                  {group.replace(/_/g, ' ')}
                                </span>
                                <span className="text-lg font-bold text-blue-600">
                                  {data.rate.toFixed(1)}%
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span>{data.submissions} submissions</span>
                                <span>{data.responses} responses</span>
                              </div>
                              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full transition-all"
                                  style={{ width: `${data.rate}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Correlations */}
                  {correlations && (
                    <>
                      {/* Day of Week Correlation */}
                      {correlations.byDayOfWeek && Object.keys(correlations.byDayOfWeek).length > 0 && (
                    <div className="bg-white rounded-lg border border-gray-200">
                      <h4 className="text-lg font-semibold text-gray-900 p-4 border-b border-gray-200">
                        Success Rate by Day of Week
                      </h4>
                      <div className="p-4 space-y-2">
                        {Object.entries(correlations.byDayOfWeek)
                          .sort((a, b) => b[1].rate - a[1].rate)
                          .map(([day, data]) => (
                            <div key={day} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <span className="font-medium text-gray-900 w-24">{day}</span>
                                <span className="text-sm text-gray-600">
                                  {data.total} application{data.total !== 1 ? 's' : ''}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="w-32 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-green-600 h-2 rounded-full transition-all"
                                    style={{ width: `${data.rate}%` }}
                                  />
                                </div>
                                <span className="font-bold text-green-600 w-16 text-right">
                                  {data.rate.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Hour of Day Correlation */}
                  {correlations.byHourOfDay && Object.keys(correlations.byHourOfDay).length > 0 && (
                    <div className="bg-white rounded-lg border border-gray-200">
                      <h4 className="text-lg font-semibold text-gray-900 p-4 border-b border-gray-200">
                        Success Rate by Hour of Day
                      </h4>
                      <div className="p-4 space-y-2">
                        {Object.entries(correlations.byHourOfDay)
                          .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
                          .map(([hour, data]) => {
                            const hour12 = parseInt(hour) % 12 || 12;
                            const ampm = parseInt(hour) < 12 ? 'AM' : 'PM';
                            return (
                              <div key={hour} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <span className="font-medium text-gray-900 w-20">
                                    {hour12}:00 {ampm}
                                  </span>
                                  <span className="text-sm text-gray-600">
                                    {data.total} submission{data.total !== 1 ? 's' : ''}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="w-32 bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-blue-600 h-2 rounded-full transition-all"
                                      style={{ width: `${data.rate}%` }}
                                    />
                                  </div>
                                  <span className="font-bold text-blue-600 w-16 text-right">
                                    {data.rate.toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                    </>
                  )}

              {/* No Data Message - Only if truly nothing to show */}
              {!insights?.industryBenchmarks && 
               !abTestResults && 
               !correlations && (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg mb-2">Loading insights...</p>
                  <p className="text-sm text-gray-400">
                    Getting timing analytics and industry benchmarks
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

TimingOptimizer.propTypes = {
  job: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    company: PropTypes.string.isRequired,
    industry: PropTypes.string,
    workMode: PropTypes.string,
    location: PropTypes.string
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onScheduled: PropTypes.func
};

export default TimingOptimizer;
