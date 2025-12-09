import React, { useState, useEffect } from 'react';
import { getJobBLSBenchmarks } from '../api/salary';
import Card from './Card';
import LoadingSpinner from './LoadingSpinner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

/**
 * UC-112: BLS Salary Benchmarks Component
 * 
 * Displays real salary data from the US Bureau of Labor Statistics API
 * with percentile breakdowns, appropriate disclaimers, and comparisons.
 */
const BLSSalaryBenchmarks = ({ jobId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [blsData, setBlsData] = useState(null);
  const [expanded, setExpanded] = useState(true);

  const CHART_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

  useEffect(() => {
    if (jobId) {
      fetchBLSBenchmarks();
    }
  }, [jobId]);

  const fetchBLSBenchmarks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getJobBLSBenchmarks(jobId);
      setBlsData(response.data.data);
    } catch (err) {
      console.error('Error fetching BLS benchmarks:', err);
      // Don't show error if data simply isn't available
      if (err.response?.status === 404) {
        setError(null);
        setBlsData(null);
      } else {
        setError(err.response?.data?.message || 'Failed to load BLS salary data');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6 mb-8">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
          <span className="ml-3 text-gray-600">Loading BLS salary data...</span>
        </div>
      </Card>
    );
  }

  // Don't show anything if there's no data and no error
  if (!blsData && !error) {
    return null;
  }

  if (error) {
    return (
      <Card className="p-6 mb-8 bg-yellow-50 border-yellow-200">
        <div className="flex items-start gap-4">
          <svg className="w-6 h-6 text-yellow-600 shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="flex-1">
            <h3 className="font-semibold text-yellow-900 mb-1">BLS Data Unavailable</h3>
            <p className="text-sm text-yellow-800">{error}</p>
          </div>
        </div>
      </Card>
    );
  }

  if (!blsData.benchmarkData) {
    return (
      <Card className="p-6 mb-8 bg-gray-50">
        <div className="flex items-start gap-4">
          <svg className="w-6 h-6 text-gray-400 shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-700 mb-1">No BLS Data Available</h3>
            <p className="text-sm text-gray-600">
              {blsData.message || 'Bureau of Labor Statistics data is not available for this position.'}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const { job, benchmarkData, comparison, disclaimer } = blsData;
  const { salaryRange, percentiles, source, dataYear, location, metadata } = benchmarkData;

  // Prepare percentile data for chart
  const percentileData = [
    { name: '10th', value: percentiles.p10 || 0, label: '10th Percentile' },
    { name: '25th', value: percentiles.p25 || 0, label: '25th Percentile' },
    { name: '50th (Median)', value: percentiles.p50 || 0, label: 'Median' },
    { name: '75th', value: percentiles.p75 || 0, label: '75th Percentile' },
    { name: '90th', value: percentiles.p90 || 0, label: '90th Percentile' },
  ].filter(item => item.value > 0);

  return (
    <Card className="p-6 mb-8 bg-linear-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-start gap-3">
          <div className="shrink-0">
            <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              Real Salary Data from BLS
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                Official Data
              </span>
            </h2>
            <p className="text-sm text-gray-600">
              {source} • {dataYear} Data • {location}
              {metadata.cached && (
                <span className="ml-2 text-gray-500">
                  (Cached {metadata.cacheAge} days ago)
                </span>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          <svg 
            className={`w-6 h-6 transform transition-transform ${expanded ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {expanded && (
        <>
          {/* Key Salary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600 mb-1">Median Salary</p>
              <p className="text-2xl font-bold text-emerald-600">
                ${salaryRange.median?.toLocaleString() || 'N/A'}
              </p>
              <p className="text-xs text-gray-500 mt-1">50th percentile</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600 mb-1">Salary Range</p>
              <p className="text-lg font-bold text-gray-900">
                ${salaryRange.min?.toLocaleString() || 'N/A'} - ${salaryRange.max?.toLocaleString() || 'N/A'}
              </p>
              <p className="text-xs text-gray-500 mt-1">10th to 90th percentile</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600 mb-1">Mean Salary</p>
              <p className="text-2xl font-bold text-blue-600">
                ${salaryRange.mean?.toLocaleString() || 'N/A'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Average across all data</p>
            </div>
          </div>

          {/* Percentile Breakdown Chart */}
          {percentileData.length > 0 && (
            <div className="bg-white rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Salary Percentile Distribution</h3>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={percentileData} 
                    margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 11 }}
                      stroke="#6b7280"
                      angle={-15}
                      textAnchor="end"
                    />
                    <YAxis 
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                      tick={{ fontSize: 11 }}
                      stroke="#6b7280"
                    />
                    <Tooltip 
                      formatter={(value) => [`$${value.toLocaleString()}`, 'Salary']}
                      contentStyle={{ 
                        borderRadius: '8px', 
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {percentileData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Comparison with Job Posting (if available) */}
          {comparison && (
            <div className="bg-white rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Comparison with Job Posting</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Job Posting Range</p>
                  <p className="text-xl font-bold text-gray-900">
                    ${comparison.jobMin?.toLocaleString()} - ${comparison.jobMax?.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">BLS Median</p>
                  <p className="text-xl font-bold text-emerald-600">
                    ${comparison.benchmarkMedian?.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Difference</p>
                  <p className={`text-xl font-bold ${comparison.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {comparison.difference >= 0 ? '+' : ''}${comparison.difference?.toLocaleString()}
                  </p>
                  <p className={`text-sm ${comparison.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ({comparison.percentageDiff}% {comparison.difference >= 0 ? 'above' : 'below'} median)
                  </p>
                </div>
              </div>
              
              {/* Visual indicator */}
              <div className="mt-4">
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden relative">
                  {comparison.jobMin && comparison.benchmarkMedian && (
                    <>
                      {/* BLS Median marker */}
                      <div 
                        className="absolute top-0 bottom-0 w-1 bg-emerald-500"
                        style={{ 
                          left: `${Math.min(100, Math.max(0, ((comparison.benchmarkMedian - comparison.jobMin) / (comparison.jobMax - comparison.jobMin)) * 100))}%` 
                        }}
                      >
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-emerald-600 font-medium whitespace-nowrap">
                          BLS Median
                        </div>
                      </div>
                      {/* Job range bar */}
                      <div className="h-full bg-blue-400 opacity-50"></div>
                    </>
                  )}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>${comparison.jobMin?.toLocaleString()}</span>
                  <span>${comparison.jobMax?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Percentile Details */}
          <div className="bg-white rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Percentile Breakdown</h3>
            <div className="space-y-3">
              {percentiles.p10 && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">10th Percentile (Entry Level)</span>
                  <span className="font-semibold text-gray-900">${percentiles.p10.toLocaleString()}/year</span>
                </div>
              )}
              {percentiles.p25 && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">25th Percentile (Lower Quartile)</span>
                  <span className="font-semibold text-gray-900">${percentiles.p25.toLocaleString()}/year</span>
                </div>
              )}
              {percentiles.p50 && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100 bg-emerald-50">
                  <span className="text-sm font-medium text-emerald-700">50th Percentile (Median)</span>
                  <span className="font-bold text-emerald-700">${percentiles.p50.toLocaleString()}/year</span>
                </div>
              )}
              {percentiles.p75 && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">75th Percentile (Upper Quartile)</span>
                  <span className="font-semibold text-gray-900">${percentiles.p75.toLocaleString()}/year</span>
                </div>
              )}
              {percentiles.p90 && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600">90th Percentile (Senior Level)</span>
                  <span className="font-semibold text-gray-900">${percentiles.p90.toLocaleString()}/year</span>
                </div>
              )}
            </div>
          </div>

          {/* Data Source & Disclaimer */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900 mb-1">About This Data</h4>
                <p className="text-sm text-blue-800 leading-relaxed">
                  {disclaimer}
                </p>
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <p className="text-xs text-blue-700">
                    <strong>Data Updated:</strong> This data is based on {dataYear} statistics and is cached for 30 days to optimize performance.
                    The data represents national averages and may not reflect specific company policies or regional variations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </Card>
  );
};

export default BLSSalaryBenchmarks;
