import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  getResponseTimePrediction,
  getFollowUpSuggestions,
  recordResponse
} from '../api/responseTimePrediction';

/**
 * ResponseTimePrediction Component
 * Displays predicted response time with confidence intervals and follow-up suggestions
 */
const ResponseTimePrediction = ({ jobId, companyName, applicationDate, compact = false, onResponseRecorded }) => {
  const [prediction, setPrediction] = useState(null);
  const [followUpSuggestions, setFollowUpSuggestions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRecordResponse, setShowRecordResponse] = useState(false);
  const [responseDate, setResponseDate] = useState(new Date().toISOString().split('T')[0]);
  const [responseType, setResponseType] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadPrediction = async () => {
    try {
      setLoading(true);
      setError(null);

      const [predictionData, suggestionsData] = await Promise.all([
        getResponseTimePrediction(jobId),
        getFollowUpSuggestions(jobId).catch(() => null)
      ]);

      setPrediction(predictionData);
      setFollowUpSuggestions(suggestionsData);
    } catch (err) {
      console.error('Error loading prediction:', err);
      setError('Unable to load prediction');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (jobId) {
      loadPrediction();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const handleRecordResponse = async () => {
    if (!responseType) {
      alert('Please select a response type');
      return;
    }

    try {
      setSubmitting(true);
      await recordResponse(jobId, responseDate, responseType);
      setShowRecordResponse(false);
      if (onResponseRecorded) {
        onResponseRecorded();
      }
      // Reload prediction to show updated status
      loadPrediction();
    } catch (err) {
      console.error('Error recording response:', err);
      alert('Failed to record response');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getProgressWidth = () => {
    if (!prediction?.prediction || !prediction.daysSinceApplication) return 0;
    const { predictedDaysMax } = prediction.prediction;
    const progress = Math.min(100, (prediction.daysSinceApplication / predictedDaysMax) * 100);
    return progress;
  };

  const getProgressColor = () => {
    if (!prediction?.prediction) return 'bg-blue-500';
    const { predictedDaysMedian, predictedDaysMax } = prediction.prediction;
    const days = prediction.daysSinceApplication || 0;
    
    if (days > predictedDaysMax) return 'bg-red-500';
    if (days > predictedDaysMedian) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className={`${compact ? 'p-2' : 'p-4'} bg-gray-50 rounded-lg animate-pulse`}>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${compact ? 'p-2' : 'p-4'} bg-red-50 rounded-lg text-red-600 text-sm`}>
        {error}
      </div>
    );
  }

  if (!prediction?.prediction) {
    return null;
  }

  const { 
    predictedDaysMin, 
    predictedDaysMax, 
    predictedDaysMedian, 
    confidenceLevel,
    suggestedFollowUpDate,
    isOverdue,
    daysOverdue,
    industryBenchmark
  } = prediction.prediction;

  // Compact view for job cards
  if (compact) {
    return (
      <div className="mt-2 text-xs">
        <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
          <span className="font-medium">
            {isOverdue ? (
              <>⚠️ Response overdue by {daysOverdue} days</>
            ) : (
              <>📊 Typically responds in {predictedDaysMin}-{predictedDaysMax} days</>
            )}
          </span>
        </div>
        {suggestedFollowUpDate && !isOverdue && (
          <div className="text-gray-500 mt-0.5">
            Follow up: {formatDate(suggestedFollowUpDate)}
          </div>
        )}
        {/* Progress bar */}
        <div className="mt-1.5 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full ${getProgressColor()} transition-all duration-300`}
            style={{ width: `${getProgressWidth()}%` }}
          ></div>
        </div>
      </div>
    );
  }

  // Full view
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <span>📊</span>
          Response Time Prediction
        </h3>
        {isOverdue && (
          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
            ⚠️ Overdue
          </span>
        )}
      </div>

      {/* Main Prediction */}
      <div className="mb-4">
        <div className="text-2xl font-bold text-gray-900 mb-1">
          {predictedDaysMin}-{predictedDaysMax} days
        </div>
        <div className="text-sm text-gray-600">
          Expected response time ({confidenceLevel}% confidence)
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Applied: {formatDate(prediction.applicationDate || applicationDate)}</span>
          <span>{prediction.daysSinceApplication || 0} days ago</span>
        </div>
        <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full ${getProgressColor()} transition-all duration-300`}
            style={{ width: `${getProgressWidth()}%` }}
          ></div>
          {/* Markers */}
          <div 
            className="absolute top-0 h-full border-l-2 border-yellow-500"
            style={{ left: `${(predictedDaysMedian / predictedDaysMax) * 100}%` }}
            title={`Median: ${predictedDaysMedian} days`}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Day 0</span>
          <span className="text-yellow-600">~{predictedDaysMedian}d (typical)</span>
          <span>{predictedDaysMax}d (max)</span>
        </div>
      </div>

      {/* Overdue Alert */}
      {isOverdue && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-700 font-medium mb-1">
            Response is {daysOverdue} days overdue
          </div>
          <div className="text-red-600 text-sm">
            Consider sending a follow-up email or reaching out via LinkedIn.
          </div>
        </div>
      )}

      {/* Follow-up Suggestions */}
      {followUpSuggestions && (
        <div className={`mb-4 p-3 rounded-lg border ${getUrgencyColor(followUpSuggestions.urgency)}`}>
          <div className="font-medium mb-1">
            Follow-up Recommendation
          </div>
          <div className="text-sm mb-2">
            {followUpSuggestions.recommendation}
          </div>
          {followUpSuggestions.urgency !== 'none' && suggestedFollowUpDate && (
            <div className="text-sm">
              <span className="font-medium">Suggested follow-up date:</span>{' '}
              {formatDate(suggestedFollowUpDate)}
            </div>
          )}
        </div>
      )}

      {/* Industry Benchmark */}
      {industryBenchmark && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm font-medium text-gray-700 mb-2">
            Industry Benchmark
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div>
              <div className="text-gray-500">Fast</div>
              <div className="font-medium">{industryBenchmark.percentile25}d</div>
            </div>
            <div>
              <div className="text-gray-500">Average</div>
              <div className="font-medium">{industryBenchmark.averageDays}d</div>
            </div>
            <div>
              <div className="text-gray-500">Slow</div>
              <div className="font-medium">{industryBenchmark.percentile75}d</div>
            </div>
          </div>
          {industryBenchmark.sampleSize > 0 && (
            <div className="text-xs text-gray-500 text-center mt-2">
              Based on {industryBenchmark.sampleSize} similar applications
            </div>
          )}
        </div>
      )}

      {/* Prediction Factors */}
      {prediction.prediction.factors && prediction.prediction.factors.length > 0 && (
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700 mb-2">
            Factors Affecting Timeline
          </div>
          <div className="space-y-1">
            {prediction.prediction.factors.map((factor, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <span className={
                  factor.impact === 'faster' ? 'text-green-600' :
                  factor.impact === 'slower' ? 'text-red-600' : 'text-gray-600'
                }>
                  {factor.impact === 'faster' ? '⬆️' : factor.impact === 'slower' ? '⬇️' : '➡️'}
                </span>
                <span className="text-gray-700">{factor.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-200">
        <button
          onClick={() => setShowRecordResponse(!showRecordResponse)}
          className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
        >
          📝 Record Response
        </button>
        {followUpSuggestions?.followUpTemplates && (
          <button
            onClick={() => {
              const template = followUpSuggestions.followUpTemplates;
              const body = template.body
                .replace('[Position]', prediction.jobTitle || 'the position')
                .replace('[Company]', companyName || 'your company');
              navigator.clipboard.writeText(body);
              alert('Follow-up template copied to clipboard!');
            }}
            className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            📋 Copy Follow-up Template
          </button>
        )}
      </div>

      {/* Record Response Form */}
      {showRecordResponse && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-700 mb-3">
            Record Company Response
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Response Date</label>
              <input
                type="date"
                value={responseDate}
                onChange={(e) => setResponseDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Response Type</label>
              <select
                value={responseType}
                onChange={(e) => setResponseType(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select response type...</option>
                <option value="interview_invite">Interview Invitation</option>
                <option value="rejection">Rejection</option>
                <option value="follow_up_needed">Need More Information</option>
                <option value="offer">Job Offer</option>
                <option value="ghosted">No Response (Ghosted)</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRecordResponse}
                disabled={submitting}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Saving...' : 'Save Response'}
              </button>
              <button
                onClick={() => setShowRecordResponse(false)}
                className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

ResponseTimePrediction.propTypes = {
  jobId: PropTypes.string.isRequired,
  companyName: PropTypes.string,
  applicationDate: PropTypes.string,
  compact: PropTypes.bool,
  onResponseRecorded: PropTypes.func
};

export default ResponseTimePrediction;
