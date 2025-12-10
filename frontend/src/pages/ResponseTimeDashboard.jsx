import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getDashboardSummary,
  getIndustryBenchmarks
} from '../api/responseTimePrediction';
import ResponseTimePrediction from '../components/ResponseTimePrediction';

/**
 * ResponseTimeDashboard Page
 * Shows overview of all application response time predictions with alerts
 */
const ResponseTimeDashboard = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [benchmarks, setBenchmarks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [filter, setFilter] = useState('all'); // all, overdue, follow-up

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [summaryData, benchmarkData] = await Promise.all([
        getDashboardSummary(),
        getIndustryBenchmarks()
      ]);

      setSummary(summaryData.summary);
      setBenchmarks(benchmarkData.benchmarks);
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError('Failed to load response time data');
    } finally {
      setLoading(false);
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

  const getFilteredApplications = () => {
    if (!summary?.pendingApplications) return [];
    
    switch (filter) {
      case 'overdue':
        return summary.pendingApplications.filter(app => app.prediction?.isOverdue);
      case 'follow-up':
        return summary.pendingApplications.filter(app => {
          if (!app.prediction?.suggestedFollowUpDate) return false;
          const followUpDate = new Date(app.prediction.suggestedFollowUpDate);
          return followUpDate <= new Date() && !app.prediction.isOverdue;
        });
      default:
        return summary.pendingApplications;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
            {error}
            <button
              onClick={loadData}
              className="ml-4 text-red-600 underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filteredApps = getFilteredApplications();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Response Time Predictions</h1>
            <p className="text-gray-600">Track expected response times and follow-up timing</p>
          </div>
          <button
            onClick={() => navigate('/jobs')}
            className="px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            ← Back to Jobs
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-3xl font-bold text-blue-600">
              {summary?.totalPending || 0}
            </div>
            <div className="text-sm text-gray-600">Awaiting Response</div>
          </div>

          <div 
            className={`bg-white rounded-lg shadow-sm border p-4 cursor-pointer hover:shadow-md transition-shadow ${
              summary?.overdueCount > 0 ? 'border-red-300 bg-red-50' : 'border-gray-200'
            }`}
            onClick={() => setFilter('overdue')}
          >
            <div className={`text-3xl font-bold ${summary?.overdueCount > 0 ? 'text-red-600' : 'text-gray-400'}`}>
              {summary?.overdueCount || 0}
            </div>
            <div className="text-sm text-gray-600">Overdue Responses</div>
            {summary?.overdueCount > 0 && (
              <div className="text-xs text-red-600 mt-1">⚠️ Needs attention</div>
            )}
          </div>

          <div 
            className={`bg-white rounded-lg shadow-sm border p-4 cursor-pointer hover:shadow-md transition-shadow ${
              summary?.needFollowUp > 0 ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'
            }`}
            onClick={() => setFilter('follow-up')}
          >
            <div className={`text-3xl font-bold ${summary?.needFollowUp > 0 ? 'text-yellow-600' : 'text-gray-400'}`}>
              {summary?.needFollowUp || 0}
            </div>
            <div className="text-sm text-gray-600">Ready for Follow-up</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-3xl font-bold text-gray-600">
              {summary?.avgExpectedWaitDays !== null ? `${summary.avgExpectedWaitDays}d` : '-'}
            </div>
            <div className="text-sm text-gray-600">Avg. Expected Wait</div>
          </div>
        </div>

        {/* Prediction Accuracy */}
        {summary?.predictionAccuracy && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Your Prediction Accuracy</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {summary.predictionAccuracy.accuracyRate}%
                </div>
                <div className="text-xs text-gray-500">Accurate (±3 days)</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {summary.predictionAccuracy.withinConfidenceIntervalRate}%
                </div>
                <div className="text-xs text-gray-500">Within Confidence</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-600">
                  {summary.predictionAccuracy.averageErrorDays}d
                </div>
                <div className="text-xs text-gray-500">Avg. Error</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-600">
                  {summary.predictionAccuracy.totalPredictions}
                </div>
                <div className="text-xs text-gray-500">Total Tracked</div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            All ({summary?.totalPending || 0})
          </button>
          <button
            onClick={() => setFilter('overdue')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'overdue'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Overdue ({summary?.overdueCount || 0})
          </button>
          <button
            onClick={() => setFilter('follow-up')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'follow-up'
                ? 'bg-yellow-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Ready for Follow-up ({summary?.needFollowUp || 0})
          </button>
        </div>

        {/* Applications List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {filter === 'all' ? 'All Pending Applications' :
               filter === 'overdue' ? 'Overdue Applications' :
               'Applications Ready for Follow-up'}
            </h2>
          </div>
          
          {filteredApps.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {filter === 'all' 
                ? 'No pending applications. Apply to some jobs to start tracking response times!'
                : `No ${filter === 'overdue' ? 'overdue' : 'follow-up ready'} applications.`}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredApps.map((app) => (
                <div 
                  key={app.jobId}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    app.prediction?.isOverdue ? 'bg-red-50' : ''
                  }`}
                  onClick={() => setSelectedJob(selectedJob === app.jobId ? null : app.jobId)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900">{app.jobTitle || 'Unknown Position'}</h3>
                      <p className="text-sm text-gray-600">{app.companyName}</p>
                    </div>
                    <div className="text-right">
                      {app.prediction?.isOverdue ? (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                          ⚠️ {app.prediction.daysOverdue}d overdue
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">
                          {app.daysSinceApplication}d since applied
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Compact prediction display */}
                  {app.prediction && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span>
                          Expected: {app.prediction.predictedDaysMin}-{app.prediction.predictedDaysMax} days
                          <span className="text-gray-400 ml-1">({app.prediction.confidenceLevel}% confidence)</span>
                        </span>
                        {app.prediction.suggestedFollowUpDate && (
                          <span>
                            Follow-up: {formatDate(app.prediction.suggestedFollowUpDate)}
                          </span>
                        )}
                      </div>
                      
                      {/* Progress bar */}
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${
                            app.prediction.isOverdue ? 'bg-red-500' :
                            app.daysSinceApplication > app.prediction.predictedDaysMedian ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ 
                            width: `${Math.min(100, (app.daysSinceApplication / app.prediction.predictedDaysMax) * 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Expanded view */}
                  {selectedJob === app.jobId && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <ResponseTimePrediction
                        jobId={app.jobId}
                        companyName={app.companyName}
                        applicationDate={app.applicationDate}
                        compact={false}
                        onResponseRecorded={loadData}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Industry Benchmarks */}
        {benchmarks && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Industry Benchmarks</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {Object.entries(benchmarks).map(([industry, data]) => (
                <div key={industry} className="p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium text-gray-900 text-sm mb-2">{industry}</div>
                  <div className="text-2xl font-bold text-blue-600">{data.averageDays}d</div>
                  <div className="text-xs text-gray-500">
                    Range: {data.percentile25}-{data.percentile75} days
                  </div>
                  {data.sampleSize > 0 && (
                    <div className="text-xs text-gray-400 mt-1">
                      ({data.sampleSize} samples)
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponseTimeDashboard;
