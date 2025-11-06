import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getSalaryResearch,
  compareSalaries,
  exportSalaryReport
} from '../api/salary';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import Card from './Card';
import Button from './Button';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

/**
 * UC-067: Salary Research and Benchmarking Component
 * 
 * Features:
 * - Display salary ranges for similar positions
 * - Factor in location, experience level, and company size
 * - Show total compensation including benefits
 * - Compare salary across different companies
 * - Historical salary trend data
 * - Negotiation recommendations based on market data
 * - Salary comparison with user's current compensation
 * - Export salary research reports
 */
const SalaryResearch = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [salaryData, setSalaryData] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [comparisonData, setComparisonData] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);

  const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  useEffect(() => {
    fetchSalaryResearch();
  }, [jobId]);

  const fetchSalaryResearch = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getSalaryResearch(jobId);
      setSalaryData(response.data.data);
    } catch (err) {
      console.error('Error fetching salary research:', err);
      setError(err.response?.data?.message || 'Failed to load salary research');
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async () => {
    if (selectedJobs.length === 0) {
      alert('Please select at least one job to compare');
      return;
    }

    try {
      setLoading(true);
      const jobIdsToCompare = [jobId, ...selectedJobs];
      const response = await compareSalaries(jobIdsToCompare);
      setComparisonData(response.data.data);
      setCompareMode(true);
    } catch (err) {
      console.error('Error comparing salaries:', err);
      setError(err.response?.data?.message || 'Failed to compare salaries');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format = 'json') => {
    try {
      setExportLoading(true);
      const response = await exportSalaryReport(jobId, format);
      const data = response.data.data;

      // Create download
      const content = format === 'markdown' ? data.content : JSON.stringify(data.data, null, 2);
      const blob = new Blob([content], { 
        type: format === 'markdown' ? 'text/markdown' : 'application/json' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting report:', err);
      setError(err.response?.data?.message || 'Failed to export report');
    } finally {
      setExportLoading(false);
    }
  };

  if (loading && !salaryData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error && !salaryData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorMessage message={error} />
        <Button onClick={() => navigate('/jobs')} className="mt-4">
          Back to Jobs
        </Button>
      </div>
    );
  }

  if (!salaryData) return null;

  const { job, marketData, factors, similarPositions, historicalTrends, recommendations, salaryComparison } = salaryData;

  // Prepare data for charts
  const salaryBreakdownData = [
    { name: 'Minimum', value: marketData.companySizeAdjusted.min },
    { name: 'Median', value: marketData.companySizeAdjusted.median },
    { name: 'Maximum', value: marketData.companySizeAdjusted.max },
  ];

  const totalCompData = [
    { name: 'Base Salary', value: marketData.companySizeAdjusted.median },
    { name: 'Benefits', value: marketData.companySizeAdjusted.benefits },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Salary Research & Benchmarking
            </h1>
            <p className="text-gray-600">
              {job.title} at {job.company}
            </p>
            <p className="text-sm text-gray-500">
              {job.location} • {job.industry}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => handleExport('json')}
              variant="outline"
              disabled={exportLoading}
            >
              {exportLoading ? 'Exporting...' : 'Export JSON'}
            </Button>
            <Button
              onClick={() => handleExport('markdown')}
              variant="outline"
              disabled={exportLoading}
            >
              Export Report
            </Button>
            <Button onClick={() => navigate('/jobs')} variant="outline">
              Back to Jobs
            </Button>
          </div>
        </div>
      </div>

      {error && <ErrorMessage message={error} className="mb-4" />}

      {/* Market Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6 bg-linear-to-br from-blue-50 to-blue-100">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Median Salary</h3>
          <p className="text-3xl font-bold text-blue-600">
            ${marketData.companySizeAdjusted.median.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">Base compensation</p>
        </Card>

        <Card className="p-6 bg-linear-to-br from-green-50 to-green-100">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Compensation</h3>
          <p className="text-3xl font-bold text-green-600">
            ${marketData.totalCompensation.median.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">Including benefits</p>
        </Card>

        <Card className="p-6 bg-linear-to-br from-purple-50 to-purple-100">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Salary Range</h3>
          <p className="text-xl font-bold text-purple-600">
            ${marketData.companySizeAdjusted.min.toLocaleString()} - ${marketData.companySizeAdjusted.max.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">Market range</p>
        </Card>
      </div>

      {/* Adjustment Factors */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Adjustment Factors</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border-l-4 border-blue-500 pl-4">
            <p className="text-sm text-gray-600">Experience Level</p>
            <p className="text-lg font-semibold">{factors.experienceLevel}</p>
          </div>
          <div className="border-l-4 border-green-500 pl-4">
            <p className="text-sm text-gray-600">Location</p>
            <p className="text-lg font-semibold">{factors.location}</p>
            <p className="text-xs text-gray-500">{factors.locationMultiplier}x multiplier</p>
          </div>
          <div className="border-l-4 border-purple-500 pl-4">
            <p className="text-sm text-gray-600">Company Size</p>
            <p className="text-lg font-semibold">{factors.companySize}</p>
            <p className="text-xs text-gray-500">{factors.companySizeMultiplier}x multiplier</p>
          </div>
          <div className="border-l-4 border-orange-500 pl-4">
            <p className="text-sm text-gray-600">Industry</p>
            <p className="text-lg font-semibold">{job.industry}</p>
          </div>
        </div>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Salary Breakdown */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Salary Range Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salaryBreakdownData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Total Compensation Breakdown */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Total Compensation Breakdown</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={totalCompData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: $${(value / 1000).toFixed(0)}k`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {totalCompData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Historical Trends */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Historical Salary Trends (5 Years)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={historicalTrends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
            <Legend />
            <Line type="monotone" dataKey="min" stroke="#ef4444" name="Minimum" />
            <Line type="monotone" dataKey="median" stroke="#3b82f6" name="Median" strokeWidth={2} />
            <Line type="monotone" dataKey="max" stroke="#10b981" name="Maximum" />
          </LineChart>
        </ResponsiveContainer>
        <p className="text-sm text-gray-500 mt-4 text-center">
          Data shows approximately 4% annual growth in compensation
        </p>
      </Card>

      {/* Similar Positions */}
      {similarPositions.count > 0 && (
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Similar Positions You're Tracking</h2>
          <p className="text-gray-600 mb-4">
            Based on {similarPositions.count} similar position(s) in your job tracker
          </p>
          
          {similarPositions.average && (
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <h3 className="font-semibold text-blue-900 mb-2">Average from Your Tracked Jobs</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-blue-700">Minimum</p>
                  <p className="text-lg font-bold text-blue-900">
                    ${similarPositions.average.min.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-blue-700">Median</p>
                  <p className="text-lg font-bold text-blue-900">
                    ${similarPositions.average.median.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-blue-700">Maximum</p>
                  <p className="text-lg font-bold text-blue-900">
                    ${similarPositions.average.max.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Salary Range</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {similarPositions.data.slice(0, 10).map((pos, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{pos.company}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{pos.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{pos.location}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      ${pos.min.toLocaleString()} - ${pos.max.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Salary Comparison with Current */}
      {salaryComparison && (
        <Card className="p-6 mb-8 bg-linear-to-r from-purple-50 to-pink-50">
          <h2 className="text-xl font-bold mb-4">Comparison with Current Compensation</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Your Current Salary</p>
              <p className="text-2xl font-bold text-gray-900">
                ${salaryComparison.current.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Target Salary</p>
              <p className="text-2xl font-bold text-blue-600">
                ${salaryComparison.target.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Potential Increase</p>
              <p className={`text-2xl font-bold ${salaryComparison.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {salaryComparison.difference >= 0 ? '+' : ''}${salaryComparison.difference.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">
                ({salaryComparison.percentageIncrease}% change)
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Negotiation Recommendations */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Negotiation Recommendations</h2>
        <div className="space-y-4">
          {recommendations.map((rec, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-l-4 ${
                rec.confidence === 'High'
                  ? 'bg-green-50 border-green-500'
                  : rec.confidence === 'Medium'
                  ? 'bg-blue-50 border-blue-500'
                  : 'bg-gray-50 border-gray-500'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900">{rec.category}</h3>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  rec.confidence === 'High'
                    ? 'bg-green-200 text-green-800'
                    : rec.confidence === 'Medium'
                    ? 'bg-blue-200 text-blue-800'
                    : 'bg-gray-200 text-gray-800'
                }`}>
                  {rec.confidence} Confidence
                </span>
              </div>
              <p className="text-gray-700 mb-2">{rec.recommendation}</p>
              <p className="text-sm text-gray-600 italic">{rec.rationale}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Data Sources Note */}
      <Card className="p-4 bg-yellow-50 border border-yellow-200">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> Salary data is based on industry benchmarks and market research. 
          Actual salaries may vary based on specific circumstances, company policies, and individual qualifications. 
          Use this information as a guide for your salary negotiations.
        </p>
      </Card>
    </div>
  );
};

export default SalaryResearch;
