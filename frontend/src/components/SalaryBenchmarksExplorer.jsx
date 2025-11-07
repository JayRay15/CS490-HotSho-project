import React, { useState, useEffect } from 'react';
import { getSalaryBenchmarks } from '../api/salary';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import Card from './Card';
import Button from './Button';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

/**
 * UC-067: Salary Benchmarks Explorer
 * 
 * Allows users to explore general salary benchmarks by industry, experience level, and location
 */
const SalaryBenchmarksExplorer = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [benchmarkData, setBenchmarkData] = useState(null);
  const [filters, setFilters] = useState({
    industry: 'Technology',
    experienceLevel: 'Mid',
    location: 'Other'
  });

  useEffect(() => {
    fetchBenchmarks();
  }, [filters]);

  const fetchBenchmarks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getSalaryBenchmarks(filters);
      setBenchmarkData(response.data.data);
    } catch (err) {
      console.error('Error fetching benchmarks:', err);
      setError(err.response?.data?.message || 'Failed to load salary benchmarks');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  if (loading && !benchmarkData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error && !benchmarkData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorMessage message={error} />
        <Button onClick={fetchBenchmarks} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  if (!benchmarkData) return null;

  // Prepare data for industry comparison chart
  const industryComparisonData = Object.entries(benchmarkData.allBenchmarks).map(([industry, levels]) => ({
    industry,
    median: levels[filters.experienceLevel]?.median || 0
  })).sort((a, b) => b.median - a.median);

  // Prepare data for experience level comparison
  const experienceLevelData = Object.entries(benchmarkData.allBenchmarks[filters.industry] || {}).map(([level, data]) => ({
    level,
    min: data.min,
    median: data.median,
    max: data.max,
    benefits: data.benefits
  }));

  // Prepare radar chart data for current selection
  const radarData = [
    { metric: 'Minimum', value: benchmarkData.benchmark.min / 1000 },
    { metric: 'Median', value: benchmarkData.benchmark.median / 1000 },
    { metric: 'Maximum', value: benchmarkData.benchmark.max / 1000 },
    { metric: 'Benefits', value: benchmarkData.benchmark.benefits / 1000 },
    { metric: 'Total', value: benchmarkData.totalCompensation / 1000 }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Salary Benchmarks Explorer
        </h1>
        <p className="text-gray-600">
          Explore salary data across industries, experience levels, and locations
        </p>
      </div>

      {error && <ErrorMessage message={error} className="mb-4" />}

      {/* Filters */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Industry Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Industry
            </label>
            <select
              value={filters.industry}
              onChange={(e) => handleFilterChange('industry', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {benchmarkData.availableIndustries.map(industry => (
                <option key={industry} value={industry}>{industry}</option>
              ))}
            </select>
          </div>

          {/* Experience Level Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Experience Level
            </label>
            <select
              value={filters.experienceLevel}
              onChange={(e) => handleFilterChange('experienceLevel', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {benchmarkData.availableLevels.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>

          {/* Location Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <select
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {benchmarkData.topLocations.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Current Selection Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6 bg-blue-50">
          <h3 className="text-sm font-medium text-gray-600 mb-3">Minimum</h3>
          <p className="text-2xl font-bold text-blue-600">
            ${benchmarkData.benchmark.min.toLocaleString()}
          </p>
        </Card>

        <Card className="p-6 bg-green-50">
          <h3 className="text-sm font-medium text-gray-600 mb-3">Median</h3>
          <p className="text-2xl font-bold text-green-600">
            ${benchmarkData.benchmark.median.toLocaleString()}
          </p>
        </Card>

        <Card className="p-6 bg-purple-50">
          <h3 className="text-sm font-medium text-gray-600 mb-3">Maximum</h3>
          <p className="text-2xl font-bold text-purple-600">
            ${benchmarkData.benchmark.max.toLocaleString()}
          </p>
        </Card>

        <Card className="p-6 bg-orange-50">
          <h3 className="text-sm font-medium text-gray-600 mb-3">Total Comp</h3>
          <p className="text-2xl font-bold text-orange-600">
            ${benchmarkData.totalCompensation.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-2">Inc. benefits</p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Industry Comparison */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-6">
            Median Salary by Industry ({filters.experienceLevel} Level)
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={industryComparisonData} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="industry" width={110} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Bar dataKey="median" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Experience Level Progression */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-6">
            Salary by Experience Level ({filters.industry})
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={experienceLevelData} margin={{ top: 5, right: 20, bottom: 5, left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="level" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="min" fill="#ef4444" name="Minimum" />
              <Bar dataKey="median" fill="#3b82f6" name="Median" />
              <Bar dataKey="max" fill="#10b981" name="Maximum" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Radar Chart */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-bold mb-6">Compensation Profile</h2>
        <div className="flex justify-center">
          <ResponsiveContainer width="100%" height={450}>
            <RadarChart data={radarData} margin={{ top: 20, right: 60, bottom: 20, left: 60 }}>
              <PolarGrid />
              <PolarAngleAxis 
                dataKey="metric" 
                tick={{ fontSize: 13, fontWeight: 500 }}
                dy={-5}
              />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 'auto']} 
                tick={{ fontSize: 11 }}
              />
              <Radar
                name="Salary (thousands)"
                dataKey="value"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.6}
              />
              <Tooltip formatter={(value) => `$${value}k`} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Details Table */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-bold mb-6">Detailed Breakdown</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Experience Level
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Minimum
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Median
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Maximum
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Benefits
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Comp
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {experienceLevelData.map((level, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{level.level}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right whitespace-nowrap">
                    ${level.min.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-blue-600 text-right whitespace-nowrap">
                    ${level.median.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right whitespace-nowrap">
                    ${level.max.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 text-right whitespace-nowrap">
                    ${level.benefits.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-green-600 text-right whitespace-nowrap">
                    ${(level.median + level.benefits).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Adjustment Info */}
      <Card className="p-5 bg-blue-50 border border-blue-200">
        <p className="text-sm text-blue-800 leading-relaxed">
          <strong>Location Adjustment:</strong> {filters.location} has a {benchmarkData.filters.locationMultiplier}x multiplier applied. 
          This accounts for cost of living differences across regions.
        </p>
      </Card>
    </div>
  );
};

export default SalaryBenchmarksExplorer;
