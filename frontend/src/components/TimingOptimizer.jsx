import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  getTimingRecommendation,
  getRealtimeRecommendation,
  scheduleSubmission,
  cancelScheduledSubmission,
  getTimingMetrics,
  getABTestResults,
  getCorrelations
} from '../api/applicationTiming';

const TimingOptimizer = ({ job, onClose, onScheduled }) => {
  const [loading, setLoading] = useState(true);
  const [recommendation, setRecommendation] = useState(null);
  const [realtimeRec, setRealtimeRec] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [abTestResults, setAbTestResults] = useState(null);
  const [correlations, setCorrelations] = useState(null);
  const [activeTab, setActiveTab] = useState('recommendation');
  const [scheduledTime, setScheduledTime] = useState('');
  const [autoSubmit, setAutoSubmit] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, [job]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get timezone from browser
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'EST';

      // Load recommendation
      const recResponse = await getTimingRecommendation(job._id, userTimezone);
      setRecommendation(recResponse.recommendation);

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

    } catch (err) {
      console.error('Error loading timing data:', err);
      setError('Failed to load timing optimization data');
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async () => {
    if (!scheduledTime) {
      setError('Please select a time to schedule');
      return;
    }

    try {
      setScheduling(true);
      setError(null);

      await scheduleSubmission(job._id, scheduledTime, autoSubmit);

      if (onScheduled) {
        onScheduled();
      }

      // Reload data
      await loadData();

      alert('Application submission scheduled successfully!');
    } catch (err) {
      console.error('Error scheduling submission:', err);
      setError('Failed to schedule submission');
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

      alert('Scheduled submission cancelled successfully!');
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
                    <input
                      type="datetime-local"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min={new Date().toISOString().slice(0, 16)}
                    />
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
                      onClick={handleSchedule}
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
              {/* A/B Test Results */}
              {abTestResults && (
                <div className="bg-white rounded-lg border border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900 p-4 border-b border-gray-200">
                    A/B Test Results
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
