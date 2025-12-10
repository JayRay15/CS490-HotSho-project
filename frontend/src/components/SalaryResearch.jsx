import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getSalaryResearch,
  compareSalaries,
  exportSalaryReport,
  getProgressionAnalytics,
  generateAdvancementRecommendations,
  trackSalaryOffer,
  updateSalaryOffer,
  deleteSalaryOffer,
  getSalaryProgression
} from '../api/salary';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import Card from './Card';
import Button from './Button';
import BLSSalaryBenchmarks from './BLSSalaryBenchmarks';
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
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Area,
  AreaChart
} from 'recharts';

/**
 * UC-067: Salary Research and Benchmarking Component
 * UC-100: Salary Progression and Market Positioning
 * UC-112: BLS Salary Data Integration
 * 
 * Features:
 * - Display salary ranges for similar positions
 * - Real BLS salary data with percentiles
 * - Factor in location, experience level, and company size
 * - Show total compensation including benefits
 * - Compare salary across different companies
 * - Historical salary trend data
 * - Negotiation recommendations based on market data
 * - Salary comparison with user's current compensation
 * - Export salary research reports
 * - Track salary progression and career growth over time
 * - Analyze negotiation success rates and patterns
 * - Monitor market positioning and compensation evolution
 * - Generate advancement recommendations based on data
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
  
  // UC-100: Progression state
  const [progressionAnalytics, setProgressionAnalytics] = useState(null);
  const [advancementRecommendations, setAdvancementRecommendations] = useState(null);
  const [showProgressionSection, setShowProgressionSection] = useState(false);
  const [trackOfferModalOpen, setTrackOfferModalOpen] = useState(false);
  const [editOfferModalOpen, setEditOfferModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [trackedOffers, setTrackedOffers] = useState([]);
  const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState(false);
  const [offerToDelete, setOfferToDelete] = useState(null);

  const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  useEffect(() => {
    fetchSalaryResearch();
    fetchProgressionAnalytics();
  }, [jobId]);

  const fetchSalaryResearch = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getSalaryResearch(jobId);
      console.log('Salary research response:', response.data.data);
      setSalaryData(response.data.data);
    } catch (err) {
      console.error('Error fetching salary research:', err);
      console.error('Error details:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to load salary research');
    } finally {
      setLoading(false);
    }
  };

  const fetchProgressionAnalytics = async () => {
    try {
      const response = await getProgressionAnalytics();
      setProgressionAnalytics(response.data.data.analytics);
      
      // Also fetch the full progression data to get tracked offers
      try {
        const progressionResponse = await getSalaryProgression();
        setTrackedOffers(progressionResponse.data.data.progression.salaryOffers || []);
      } catch (err) {
        // Offers might not exist yet
        console.log('No tracked offers yet');
      }
    } catch (err) {
      console.error('Error fetching progression analytics:', err);
      // Don't show error if no progression data exists yet
      if (err.response?.status !== 404) {
        console.error('Progression analytics error:', err);
      }
    }
  };

  const fetchRecommendations = async () => {
    try {
      const response = await generateAdvancementRecommendations();
      setAdvancementRecommendations(response.data.data.recommendations);
    } catch (err) {
      console.error('Error generating recommendations:', err);
      setError(err.response?.data?.message || 'Failed to generate recommendations');
    }
  };

  const handleTrackOffer = async (offerData) => {
    try {
      await trackSalaryOffer({
        ...offerData,
        jobId: jobId
      });
      setTrackOfferModalOpen(false);
      // Refresh analytics
      await fetchProgressionAnalytics();
      setSuccessMessage('Salary offer tracked successfully!');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Error tracking offer:', err);
      setError(err.response?.data?.message || 'Failed to track offer');
    }
  };

  const handleEditOffer = (offer) => {
    setEditingOffer(offer);
    setEditOfferModalOpen(true);
  };

  const handleUpdateOffer = async (offerData) => {
    try {
      await updateSalaryOffer(editingOffer._id, offerData);
      setEditOfferModalOpen(false);
      setEditingOffer(null);
      // Refresh analytics
      await fetchProgressionAnalytics();
      setSuccessMessage('Salary offer updated successfully!');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Error updating offer:', err);
      setError(err.response?.data?.message || 'Failed to update offer');
    }
  };

  const handleDeleteOffer = async (offerId) => {
    setOfferToDelete(offerId);
    setDeleteConfirmModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!offerToDelete) return;
    
    try {
      await deleteSalaryOffer(offerToDelete);
      // Refresh analytics
      await fetchProgressionAnalytics();
      // Set frontend success message
      setSuccessMessage('Salary offer deleted successfully!');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Error deleting offer:', err);
      // Set frontend error message
      setError('Failed to delete offer. Please try again.');
      setTimeout(() => setError(null), 5000);
    } finally {
      setDeleteConfirmModalOpen(false);
      setOfferToDelete(null);
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
      <div className="flex flex-col justify-center items-center min-h-screen">
        <LoadingSpinner size="large" />
        <p className="mt-4 text-gray-600">Loading salary research data...</p>
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

  const { job = {}, marketData, factors, similarPositions, historicalTrends, recommendations, salaryComparison } = salaryData;

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
      {/* Success Message - Fixed at top */}
      {successMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md">
          <div className="mx-4 p-4 bg-green-50 border border-green-200 rounded-lg shadow-lg flex items-start">
            <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-green-800 font-medium">{successMessage}</p>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-green-600 hover:text-green-800 shrink-0 ml-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Error Message - Fixed at top */}
      {error && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md">
          <div className="mx-4 p-4 bg-red-50 border border-red-200 rounded-lg shadow-lg flex items-start">
            <svg className="w-5 h-5 text-red-600 mr-3 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-red-800 font-medium">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800 shrink-0 ml-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-600">
        <button onClick={() => navigate('/jobs')} className="hover:text-blue-600">Home</button>
        <span className="mx-2">›</span>
        <button onClick={() => navigate('/jobs')} className="hover:text-blue-600">Salary Research</button>
        <span className="mx-2">›</span>
        <span className="text-gray-900">{job?.title || jobId}</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Salary Research & Benchmarking
            </h1>
            {job && (
              <>
                <p className="text-gray-600">
                  {job.title} at {job.company}
                </p>
                <p className="text-sm text-gray-500">
                  {job.location} • {job.industry}
                </p>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => navigate(`/salary-negotiation/${jobId}`)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Prepare Negotiation
            </Button>
            <Button
              onClick={() => navigate('/offer-comparison')}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Compare Offers
            </Button>
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

      {/* UC-112: BLS Salary Benchmarks - Real Government Data */}
      <BLSSalaryBenchmarks jobId={jobId} />

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
            <p className="text-lg font-semibold">{job?.industry || 'N/A'}</p>
          </div>
        </div>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Salary Breakdown */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-6">Salary Range Distribution</h2>
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salaryBreakdownData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <YAxis 
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <Tooltip 
                  formatter={(value) => `$${value.toLocaleString()}`}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Total Compensation Breakdown */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-6">Total Compensation Breakdown</h2>
          <div className="w-full h-80 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={totalCompData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: $${(value / 1000).toFixed(0)}k`}
                  outerRadius={110}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={2}
                >
                  {totalCompData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => `$${value.toLocaleString()}`}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Historical Trends */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-bold mb-6">Historical Salary Trends (5 Years)</h2>
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historicalTrends} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="year" 
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
              <YAxis 
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
              <Tooltip 
                formatter={(value) => `$${value.toLocaleString()}`}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="line"
              />
              <Line type="monotone" dataKey="min" stroke="#ef4444" name="Minimum" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="median" stroke="#3b82f6" name="Median" strokeWidth={3} dot={{ r: 5 }} />
              <Line type="monotone" dataKey="max" stroke="#10b981" name="Maximum" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-sm text-gray-500 mt-6 text-center">
          Data shows approximately 4% annual growth in compensation
        </p>
      </Card>

      {/* Compare Salaries Across Companies */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Compare Salaries Across Companies</h2>
        <p className="text-gray-600 mb-4">
          Select similar positions from your job tracker to compare with this position
        </p>
        
        {!comparisonData && similarPositions.count > 0 ? (
          <>
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedJobs(similarPositions.data.map(pos => pos.id));
                        } else {
                          setSelectedJobs([]);
                        }
                      }}
                      className="rounded"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Salary Range</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {similarPositions.data.slice(0, 10).map((pos, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedJobs.includes(pos.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedJobs([...selectedJobs, pos.id]);
                          } else {
                            setSelectedJobs(selectedJobs.filter(id => id !== pos.id));
                          }
                        }}
                        className="rounded"
                      />
                    </td>
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

          <div className="mt-4 flex items-center gap-4">
            <Button
              onClick={handleCompare}
              disabled={selectedJobs.length === 0 || loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? 'Comparing...' : `Compare ${selectedJobs.length} Job${selectedJobs.length !== 1 ? 's' : ''}`}
            </Button>
            {selectedJobs.length > 0 && (
              <button
                onClick={() => setSelectedJobs([])}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Clear Selection
              </button>
            )}
          </div>

          {similarPositions.average && (
            <div className="bg-blue-50 p-4 rounded-lg mt-6">
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
          </>
        ) : comparisonData ? (
          <>
            {/* Comparison Results */}
            <div className="mb-4 flex items-center gap-2">
              <Button
                onClick={() => {
                  setComparisonData(null);
                  setCompareMode(false);
                  setSelectedJobs([]);
                }}
                variant="outline"
                className="text-sm"
              >
                ← Back to Selection
              </Button>
              <p className="text-sm text-gray-600">
                Showing comparison of {comparisonData.count} positions
              </p>
            </div>

            {/* Comparison Chart */}
            <div className="bg-linear-to-r from-blue-50 to-purple-50 p-6 rounded-lg mb-6">
              <h3 className="text-lg font-semibold mb-4">Total Compensation Comparison</h3>
              <div className="space-y-3">
                {comparisonData.comparisons.map((comp, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900">{comp.company}</h4>
                        <p className="text-sm text-gray-600">{comp.title}</p>
                        <p className="text-xs text-gray-500">{comp.location} • {comp.industry}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">
                          ${comp.totalCompensation.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">Total Comp</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-gray-200">
                      <div>
                        <p className="text-xs text-gray-500">Base Salary</p>
                        <p className="text-sm font-semibold text-gray-900">
                          ${comp.estimatedSalary.min.toLocaleString()} - ${comp.estimatedSalary.max.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-600">
                          Median: ${comp.estimatedSalary.median.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Benefits Value</p>
                        <p className="text-sm font-semibold text-green-600">
                          ${comp.estimatedSalary.benefits.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Company Size</p>
                        <p className="text-sm font-semibold text-gray-700">
                          {comp.companySize}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4 bg-green-50">
                <h4 className="text-sm font-medium text-gray-600 mb-1">Highest Offer</h4>
                <p className="text-xl font-bold text-green-600">
                  ${comparisonData.summary.highest.totalCompensation.toLocaleString()}
                </p>
                <p className="text-xs text-gray-600 mt-1">{comparisonData.summary.highest.company}</p>
              </Card>
              <Card className="p-4 bg-blue-50">
                <h4 className="text-sm font-medium text-gray-600 mb-1">Average</h4>
                <p className="text-xl font-bold text-blue-600">
                  ${comparisonData.summary.average.toLocaleString()}
                </p>
                <p className="text-xs text-gray-600 mt-1">Across all positions</p>
              </Card>
              <Card className="p-4 bg-orange-50">
                <h4 className="text-sm font-medium text-gray-600 mb-1">Lowest Offer</h4>
                <p className="text-xl font-bold text-orange-600">
                  ${comparisonData.summary.lowest.totalCompensation.toLocaleString()}
                </p>
                <p className="text-xs text-gray-600 mt-1">{comparisonData.summary.lowest.company}</p>
              </Card>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-2">No similar positions available for comparison at this time</p>
            <p className="text-sm">
              Save more jobs to your tracker to see salary comparisons
            </p>
          </div>
        )}
      </Card>

      {/* Salary Comparison with Current Compensation - Always visible */}
      <Card className="p-6 mb-8 bg-linear-to-r from-purple-50 to-pink-50">
        <h2 className="text-xl font-bold mb-4">Comparison with Your Current Compensation</h2>
        {salaryComparison ? (
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
        ) : (
          <div className="bg-white/50 border border-purple-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="shrink-0">
                <svg className="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Add Your Current Salary</h3>
                <p className="text-gray-600 mb-4">
                  To see how this position compares with your current compensation, please update your employment information in your profile settings with your current salary.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
                  <strong>💡 Tip:</strong> Adding your current salary helps you:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>See potential salary increases</li>
                    <li>Make informed career decisions</li>
                    <li>Negotiate more effectively</li>
                  </ul>
                </div>
                <Button
                  onClick={() => navigate('/profile')}
                  className="mt-4 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Update Profile
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Negotiation Preparation CTA */}
      <Card className="p-6 mb-8 bg-linear-to-r from-green-50 to-emerald-50 border-2 border-green-200">
        <div className="flex items-start gap-6">
          <div className="shrink-0">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Ready to Negotiate Your Offer?
            </h2>
            <p className="text-gray-700 mb-4">
              Use our comprehensive negotiation preparation tools to confidently negotiate your salary. 
              Get personalized talking points, negotiation scripts for different scenarios, counteroffer 
              evaluation, and confidence-building exercises based on your research and experience.
            </p>
            <div className="flex flex-wrap gap-3 mb-4">
              <span className="px-3 py-1 bg-white rounded-full text-sm font-medium text-gray-700 shadow-sm">
                ✓ Talking Points Generator
              </span>
              <span className="px-3 py-1 bg-white rounded-full text-sm font-medium text-gray-700 shadow-sm">
                ✓ Negotiation Scripts
              </span>
              <span className="px-3 py-1 bg-white rounded-full text-sm font-medium text-gray-700 shadow-sm">
                ✓ Counteroffer Evaluation
              </span>
              <span className="px-3 py-1 bg-white rounded-full text-sm font-medium text-gray-700 shadow-sm">
                ✓ Timing Strategy
              </span>
              <span className="px-3 py-1 bg-white rounded-full text-sm font-medium text-gray-700 shadow-sm">
                ✓ Confidence Exercises
              </span>
            </div>
            <Button
              onClick={() => navigate(`/salary-negotiation/${jobId}`)}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 text-lg"
            >
              Start Negotiation Preparation →
            </Button>
          </div>
        </div>
      </Card>

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

      {/* UC-100: Track Salary Offer CTA - Always visible */}
      <Card className="p-6 mb-8 border border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Track This Salary Offer
            </h3>
            <p className="text-gray-600 mb-4">
              Add this opportunity to your progression tracking to analyze your career growth and negotiate more effectively
            </p>
            <Button
              onClick={() => setTrackOfferModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Track Offer for This Position
            </Button>
          </div>
        </div>
      </Card>

      {/* UC-100: Salary Progression & Market Positioning Section */}
      {progressionAnalytics && progressionAnalytics.hasData && (
        <>
          {/* Section Header with Toggle */}
          <Card className="p-6 mb-8 border border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Salary Progression & Career Analytics
                </h2>
                <p className="text-gray-600">
                  Track your compensation growth, negotiation success, and career advancement over time
                </p>
              </div>
              <Button
                onClick={() => setShowProgressionSection(!showProgressionSection)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {showProgressionSection ? 'Hide Analytics' : 'View Analytics'}
              </Button>
            </div>
          </Card>

          {showProgressionSection && (
            <>
              {/* Key Metrics Dashboard */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="p-6 border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Total Offers</h3>
                  <p className="text-3xl font-bold text-blue-600">
                    {progressionAnalytics.offers.total}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {progressionAnalytics.offers.accepted} accepted • {progressionAnalytics.offers.declined} declined
                  </p>
                </Card>

                <Card className="p-6 border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Negotiation Success</h3>
                  <p className="text-3xl font-bold text-green-600">
                    {progressionAnalytics.negotiation.successRate}%
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Avg {parseFloat(progressionAnalytics.negotiation.averageIncrease) >= 0 ? '+' : ''}{progressionAnalytics.negotiation.averageIncrease}% increase
                  </p>
                </Card>

                <Card className="p-6 border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Total Growth</h3>
                  <p className="text-3xl font-bold text-purple-600">
                    {parseFloat(progressionAnalytics.compensation.totalGrowth) >= 0 ? '+' : ''}{progressionAnalytics.compensation.totalGrowth}%
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Career compensation growth
                  </p>
                </Card>

                <Card className="p-6 border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Career Velocity</h3>
                  <p className="text-3xl font-bold text-orange-600">
                    {progressionAnalytics.career.velocity}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {progressionAnalytics.career.milestones} milestones tracked
                  </p>
                </Card>
              </div>

              {/* Tracked Salary Offers */}
              {trackedOffers && trackedOffers.length > 0 && (
                <Card className="p-6 mb-8">
                  <h2 className="text-xl font-bold mb-6">Your Tracked Salary Offers</h2>
                  <div className="space-y-4">
                    {trackedOffers.slice().reverse().map((offer, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-gray-900">{offer.jobTitle}</h3>
                            <p className="text-sm text-gray-600">{offer.company} • {offer.location}</p>
                            <p className="text-xs text-gray-500 mt-1">{new Date(offer.offerDate).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                              offer.offerStatus === 'Accepted' ? 'bg-green-100 text-green-800' :
                              offer.offerStatus === 'Declined' ? 'bg-red-100 text-red-800' :
                              offer.offerStatus === 'Active' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {offer.offerStatus}
                            </span>
                            <button
                              onClick={() => handleEditOffer(offer)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit offer"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteOffer(offer._id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete offer"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          <div>
                            <p className="text-xs text-gray-500">Base Salary</p>
                            <p className="font-semibold text-gray-900">${offer.baseSalary.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Total Compensation</p>
                            <p className="font-semibold text-blue-600">${offer.totalCompensation.toLocaleString()}</p>
                          </div>
                          {offer.wasNegotiated && (
                            <div>
                              <p className="text-xs text-gray-500">Negotiated</p>
                              <p className="font-semibold text-green-600">
                                +{offer.increaseFromInitial?.percentage?.toFixed(1) || 0}%
                              </p>
                            </div>
                          )}
                          {offer.percentileRank && (
                            <div>
                              <p className="text-xs text-gray-500">Market Percentile</p>
                              <p className="font-semibold text-purple-600">{Math.round(offer.percentileRank)}th</p>
                            </div>
                          )}
                        </div>
                        
                        {offer.notes && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-sm text-gray-600">{offer.notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Compensation Growth Over Time */}
              {progressionAnalytics.compensation.yearOverYear.length > 0 && (
                <Card className="p-6 mb-8">
                  <h2 className="text-xl font-bold mb-6">Compensation Growth Over Time</h2>
                  <div className="w-full h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart 
                        data={progressionAnalytics.compensation.yearOverYear}
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                      >
                        <defs>
                          <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="year" 
                          tick={{ fontSize: 12 }}
                          stroke="#6b7280"
                        />
                        <YAxis 
                          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                          tick={{ fontSize: 12 }}
                          stroke="#6b7280"
                        />
                        <Tooltip 
                          formatter={(value) => `$${value.toLocaleString()}`}
                          contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="growth" 
                          stroke="#3b82f6" 
                          fillOpacity={1} 
                          fill="url(#colorGrowth)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Current Compensation</p>
                      <p className="text-lg font-bold text-blue-600">
                        ${progressionAnalytics.compensation.currentCompensation?.toLocaleString() || 'N/A'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Highest Offer</p>
                      <p className="text-lg font-bold text-green-600">
                        ${progressionAnalytics.compensation.highestOffer.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Average Offer</p>
                      <p className="text-lg font-bold text-purple-600">
                        ${parseFloat(progressionAnalytics.compensation.averageOffer).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Negotiation Performance */}
              <Card className="p-6 mb-8">
                <h2 className="text-xl font-bold mb-6">Negotiation Success Analytics</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-700">Success Metrics</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                        <span className="text-gray-700">Total Negotiations</span>
                        <span className="text-xl font-bold text-blue-600">
                          {progressionAnalytics.negotiation.totalNegotiated}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                        <span className="text-gray-700">Success Rate</span>
                        <span className="text-xl font-bold text-green-600">
                          {progressionAnalytics.negotiation.successRate}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                        <span className="text-gray-700">Average Increase</span>
                        <span className="text-xl font-bold text-purple-600">
                          {parseFloat(progressionAnalytics.negotiation.averageIncrease) >= 0 ? '+' : ''}{progressionAnalytics.negotiation.averageIncrease}%
                        </span>
                      </div>
                      {progressionAnalytics.negotiation.improvementPattern && (
                        <div className="flex justify-between items-center p-4 bg-orange-50 rounded-lg">
                          <span className="text-gray-700">Trend</span>
                          <span className={`text-xl font-bold ${
                            progressionAnalytics.negotiation.improvementPattern === 'Improving' 
                              ? 'text-green-600' 
                              : progressionAnalytics.negotiation.improvementPattern === 'Declining'
                              ? 'text-red-600'
                              : 'text-gray-600'
                          }`}>
                            {progressionAnalytics.negotiation.improvementPattern}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {progressionAnalytics.negotiation.bestNegotiation && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-gray-700">Best Negotiation</h3>
                      <div className="bg-linear-to-br from-yellow-50 to-orange-50 p-6 rounded-lg border-2 border-yellow-300">
                        <div className="flex items-center mb-3">
                          <svg className="w-8 h-8 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-lg font-bold text-gray-900">Top Achievement</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>{progressionAnalytics.negotiation.bestNegotiation.jobTitle}</strong> at{' '}
                          {progressionAnalytics.negotiation.bestNegotiation.company}
                        </p>
                        <div className="grid grid-cols-2 gap-3 mt-4">
                          <div>
                            <p className="text-xs text-gray-600">Initial Offer</p>
                            <p className="text-lg font-bold text-gray-800">
                              ${progressionAnalytics.negotiation.bestNegotiation.initialOffer?.toLocaleString() || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Final Salary</p>
                            <p className="text-lg font-bold text-green-600">
                              ${progressionAnalytics.negotiation.bestNegotiation.finalOffer?.toLocaleString() || 'N/A'}
                            </p>
                          </div>
                        </div>
                        {progressionAnalytics.negotiation.bestNegotiation.increaseFromInitial && (
                          <div className="mt-4 p-3 bg-white rounded">
                            <p className="text-sm text-gray-600">Increase Achieved</p>
                            <p className="text-2xl font-bold text-green-600">
                              {parseFloat(progressionAnalytics.negotiation.bestNegotiation.increaseFromInitial.percentage) >= 0 ? '+' : ''}{progressionAnalytics.negotiation.bestNegotiation.increaseFromInitial.percentage}%
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Market Positioning */}
              {progressionAnalytics.marketPosition.current && (
                <Card className="p-6 mb-8">
                  <h2 className="text-xl font-bold mb-6">Current Market Positioning</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className={`p-6 rounded-lg ${
                      progressionAnalytics.marketPosition.current.position === 'Above Market' 
                        ? 'bg-green-50 border-2 border-green-300' 
                        : progressionAnalytics.marketPosition.current.position === 'Below Market'
                        ? 'bg-red-50 border-2 border-red-300'
                        : 'bg-blue-50 border-2 border-blue-300'
                    }`}>
                      <p className="text-sm text-gray-600 mb-2">Market Position</p>
                      <p className={`text-2xl font-bold ${
                        progressionAnalytics.marketPosition.current.position === 'Above Market' 
                          ? 'text-green-600' 
                          : progressionAnalytics.marketPosition.current.position === 'Below Market'
                          ? 'text-red-600'
                          : 'text-blue-600'
                      }`}>
                        {progressionAnalytics.marketPosition.current.position}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {progressionAnalytics.marketPosition.trend}
                      </p>
                    </div>
                    
                    <div className="p-6 rounded-lg bg-purple-50 border-2 border-purple-300">
                      <p className="text-sm text-gray-600 mb-2">Percentile Rank</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {progressionAnalytics.marketPosition.current.percentileRank?.toFixed(0)}th
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Among peers in your field
                      </p>
                    </div>
                    
                    <div className="p-6 rounded-lg bg-orange-50 border-2 border-orange-300">
                      <p className="text-sm text-gray-600 mb-2">Gap from Market</p>
                      <p className={`text-2xl font-bold ${
                        progressionAnalytics.marketPosition.current.gapPercentage >= 0 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {progressionAnalytics.marketPosition.current.gapPercentage >= 0 ? '+' : ''}
                        {progressionAnalytics.marketPosition.current.gapPercentage?.toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        ${Math.abs(progressionAnalytics.marketPosition.current.gapFromMarket || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Career Advancement Recommendations */}
              <Card className="p-6 mb-8 border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Personalized Advancement Recommendations</h2>
                  <Button
                    onClick={fetchRecommendations}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={advancementRecommendations !== null}
                  >
                    {advancementRecommendations ? 'Recommendations Loaded' : 'Generate Recommendations'}
                  </Button>
                </div>

                {advancementRecommendations && advancementRecommendations.length > 0 ? (
                  <div className="space-y-4">
                    {advancementRecommendations.map((rec, index) => (
                      <div
                        key={index}
                        className={`p-5 bg-white rounded-lg shadow-sm border-l-4 ${
                          rec.priority === 'High'
                            ? 'border-red-500'
                            : rec.priority === 'Medium'
                            ? 'border-yellow-500'
                            : 'border-blue-500'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                rec.priority === 'High'
                                  ? 'bg-red-100 text-red-700'
                                  : rec.priority === 'Medium'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {rec.priority} Priority
                              </span>
                              <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-semibold text-gray-700">
                                {rec.recommendationType}
                              </span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">{rec.title}</h3>
                          </div>
                          {rec.potentialImpact && (
                            <div className="text-right ml-4">
                              <p className="text-2xl font-bold text-green-600">
                                +${(rec.potentialImpact.salaryIncrease || 0).toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-500">
                                +{rec.potentialImpact.percentage?.toFixed(1)}%
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <p className="text-gray-700 mb-4">{rec.description}</p>
                        
                        {rec.timeframe && (
                          <p className="text-sm text-gray-600 mb-3">
                            <strong>Timeframe:</strong> {rec.timeframe}
                          </p>
                        )}
                        
                        {rec.actionItems && rec.actionItems.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-semibold text-gray-700 mb-2">Action Items:</p>
                            <ul className="space-y-1">
                              {rec.actionItems.map((item, idx) => (
                                <li key={idx} className="text-sm text-gray-600 flex items-start">
                                  <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-lg mb-2">Click "Generate Recommendations" to get personalized career advice</p>
                    <p className="text-sm">Based on your salary progression and market trends</p>
                  </div>
                )}
              </Card>
            </>
          )}
        </>
      )}

      {/* Track Offer Modal */}
      {trackOfferModalOpen && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Track Salary Offer</h2>
                <button
                  onClick={() => setTrackOfferModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const offerData = {
                  jobTitle: job?.title || '',
                  company: job?.company || '',
                  industry: job?.industry || '',
                  location: job?.location || '',
                  baseSalary: parseFloat(formData.get('baseSalary')),
                  signingBonus: parseFloat(formData.get('signingBonus')) || 0,
                  performanceBonus: parseFloat(formData.get('performanceBonus')) || 0,
                  equityValue: parseFloat(formData.get('equityValue')) || 0,
                  benefitsValue: parseFloat(formData.get('benefitsValue')) || 0,
                  wasNegotiated: formData.get('wasNegotiated') === 'true',
                  initialOffer: parseFloat(formData.get('initialOffer')) || undefined,
                  finalOffer: parseFloat(formData.get('finalOffer')) || undefined,
                  negotiationRounds: parseInt(formData.get('negotiationRounds')) || 0,
                  offerStatus: formData.get('offerStatus'),
                  marketMedian: marketData?.companySizeAdjusted?.median,
                  experienceLevel: factors?.experienceLevel,
                  notes: formData.get('notes')
                };
                handleTrackOffer(offerData);
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Base Salary *
                    </label>
                    <input
                      type="number"
                      name="baseSalary"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="75000"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Signing Bonus
                      </label>
                      <input
                        type="number"
                        name="signingBonus"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Performance Bonus
                      </label>
                      <input
                        type="number"
                        name="performanceBonus"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Equity Value (Annual)
                      </label>
                      <input
                        type="number"
                        name="equityValue"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Benefits Value (Annual)
                      </label>
                      <input
                        type="number"
                        name="benefitsValue"
                        defaultValue={marketData?.companySizeAdjusted?.benefits || 0}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="15000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Was this negotiated?
                    </label>
                    <select
                      name="wasNegotiated"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Initial Offer (if negotiated)
                      </label>
                      <input
                        type="number"
                        name="initialOffer"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="70000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Final Offer (if negotiated)
                      </label>
                      <input
                        type="number"
                        name="finalOffer"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="75000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Negotiation Rounds
                    </label>
                    <input
                      type="number"
                      name="negotiationRounds"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Offer Status *
                    </label>
                    <select
                      name="offerStatus"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="Active">Active (Pending Decision)</option>
                      <option value="Accepted">Accepted</option>
                      <option value="Declined">Declined</option>
                      <option value="Expired">Expired</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes (Optional)
                    </label>
                    <textarea
                      name="notes"
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Any additional context about this offer..."
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Track Offer
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setTrackOfferModalOpen(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}

      {/* Edit Offer Modal */}
      {editOfferModalOpen && editingOffer && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Edit Salary Offer</h2>
                <button
                  onClick={() => {
                    setEditOfferModalOpen(false);
                    setEditingOffer(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const offerData = {
                  jobTitle: formData.get('jobTitle'),
                  company: formData.get('company'),
                  industry: formData.get('industry'),
                  location: formData.get('location'),
                  baseSalary: parseFloat(formData.get('baseSalary')),
                  signingBonus: parseFloat(formData.get('signingBonus')) || 0,
                  performanceBonus: parseFloat(formData.get('performanceBonus')) || 0,
                  equityValue: parseFloat(formData.get('equityValue')) || 0,
                  benefitsValue: parseFloat(formData.get('benefitsValue')) || 0,
                  wasNegotiated: formData.get('wasNegotiated') === 'true',
                  initialOffer: parseFloat(formData.get('initialOffer')) || undefined,
                  finalOffer: parseFloat(formData.get('finalOffer')) || undefined,
                  negotiationRounds: parseInt(formData.get('negotiationRounds')) || 0,
                  offerStatus: formData.get('offerStatus'),
                  notes: formData.get('notes')
                };
                handleUpdateOffer(offerData);
              }}>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Job Title *
                      </label>
                      <input
                        type="text"
                        name="jobTitle"
                        defaultValue={editingOffer.jobTitle}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company *
                      </label>
                      <input
                        type="text"
                        name="company"
                        defaultValue={editingOffer.company}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Industry
                      </label>
                      <input
                        type="text"
                        name="industry"
                        defaultValue={editingOffer.industry}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location
                      </label>
                      <input
                        type="text"
                        name="location"
                        defaultValue={editingOffer.location}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Base Salary *
                    </label>
                    <input
                      type="number"
                      name="baseSalary"
                      defaultValue={editingOffer.baseSalary}
                      required
                      min="0"
                      step="1000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Signing Bonus
                      </label>
                      <input
                        type="number"
                        name="signingBonus"
                        defaultValue={editingOffer.signingBonus || 0}
                        min="0"
                        step="1000"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Performance Bonus
                      </label>
                      <input
                        type="number"
                        name="performanceBonus"
                        defaultValue={editingOffer.performanceBonus || 0}
                        min="0"
                        step="1000"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Equity Value
                      </label>
                      <input
                        type="number"
                        name="equityValue"
                        defaultValue={editingOffer.equityValue || 0}
                        min="0"
                        step="1000"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Benefits Value
                      </label>
                      <input
                        type="number"
                        name="benefitsValue"
                        defaultValue={editingOffer.benefitsValue || 0}
                        min="0"
                        step="1000"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Was This Offer Negotiated?
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="wasNegotiated"
                          value="true"
                          defaultChecked={editingOffer.wasNegotiated}
                          className="mr-2"
                        />
                        Yes
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="wasNegotiated"
                          value="false"
                          defaultChecked={!editingOffer.wasNegotiated}
                          className="mr-2"
                        />
                        No
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Initial Offer Amount
                      </label>
                      <input
                        type="number"
                        name="initialOffer"
                        defaultValue={editingOffer.initialOffer || ''}
                        min="0"
                        step="1000"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="If negotiated"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Final Offer Amount
                      </label>
                      <input
                        type="number"
                        name="finalOffer"
                        defaultValue={editingOffer.finalOffer || ''}
                        min="0"
                        step="1000"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="If negotiated"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Negotiation Rounds
                    </label>
                    <input
                      type="number"
                      name="negotiationRounds"
                      defaultValue={editingOffer.negotiationRounds || 0}
                      min="0"
                      max="10"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Offer Status *
                    </label>
                    <select
                      name="offerStatus"
                      defaultValue={editingOffer.offerStatus}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="Active">Active (Pending Decision)</option>
                      <option value="Accepted">Accepted</option>
                      <option value="Declined">Declined</option>
                      <option value="Expired">Expired</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes (Optional)
                    </label>
                    <textarea
                      name="notes"
                      rows="3"
                      defaultValue={editingOffer.notes || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Any additional context about this offer..."
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Update Offer
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setEditOfferModalOpen(false);
                      setEditingOffer(null);
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmModalOpen && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Delete Salary Offer</h2>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete this salary offer? All associated data and analytics will be permanently removed.
              </p>

              <div className="flex gap-3">
                <Button
                  onClick={confirmDelete}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete Offer
                </Button>
                <Button
                  onClick={() => {
                    setDeleteConfirmModalOpen(false);
                    setOfferToDelete(null);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

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
