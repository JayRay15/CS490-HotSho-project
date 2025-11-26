import React, { useState, useEffect } from 'react';
import Card from './Card';
import Button from './Button';
import ErrorMessage from './ErrorMessage';
import LoadingSpinner from './LoadingSpinner';

/**
 * ReportBuilder Component
 * Allows users to configure custom reports with metrics, filters, and visualizations
 */
export default function ReportBuilder({ 
  initialConfig = null, 
  onSave, 
  onCancel,
  isTemplate = false 
}) {
  const [config, setConfig] = useState({
    name: '',
    description: '',
    dateRange: {
      type: 'last30days',
      startDate: null,
      endDate: null,
    },
    metrics: {
      totalApplications: true,
      applicationsByStatus: true,
      applicationsByIndustry: false,
      applicationsByCompany: false,
      interviewConversionRate: true,
      offerConversionRate: true,
      averageResponseTime: false,
      applicationTrend: false,
      interviewTrend: false,
      topCompanies: false,
      topIndustries: false,
      statusDistribution: true,
      ghostedApplications: false,
      followUpNeeded: false,
    },
    filters: {
      companies: [],
      industries: [],
      roles: [],
      statuses: [],
      locations: [],
      excludeArchived: true,
      excludeGhosted: false,
    },
    visualizations: {
      showCharts: true,
      chartTypes: {
        statusBreakdown: 'pie',
        applicationTrend: 'line',
        industryDistribution: 'bar',
      },
      colorScheme: 'default',
    },
    includeAIInsights: true,
    insightsFocus: ['trends', 'recommendations'],
    isTemplate: isTemplate,
    isPublic: false,
    isFavorite: false,
  });

  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialConfig) {
      // Merge initialConfig with default structure, ensuring dateRange is properly structured
      const mergedConfig = {
        ...config,
        ...initialConfig,
        dateRange: initialConfig.dateRange || config.dateRange,
        metrics: { ...config.metrics, ...(initialConfig.metrics || {}) },
        filters: { ...config.filters, ...(initialConfig.filters || {}) },
        visualizations: { ...config.visualizations, ...(initialConfig.visualizations || {}) },
      };
      setConfig(mergedConfig);
    }
  }, [initialConfig]);

  const dateRangeOptions = [
    { value: 'last7Days', label: 'Last 7 Days' },
    { value: 'last30Days', label: 'Last 30 Days' },
    { value: 'last90Days', label: 'Last 90 Days' },
    { value: 'thisMonth', label: 'This Month' },
    { value: 'lastMonth', label: 'Last Month' },
    { value: 'thisYear', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' },
  ];

  const metricOptions = [
    { key: 'totalApplications', label: 'Total Applications', description: 'Total number of applications submitted' },
    { key: 'applicationsByStatus', label: 'Applications by Status', description: 'Breakdown by application status' },
    { key: 'applicationsByIndustry', label: 'Applications by Industry', description: 'Breakdown by industry' },
    { key: 'applicationsByCompany', label: 'Applications by Company', description: 'Breakdown by company' },
    { key: 'interviewConversionRate', label: 'Interview Rate', description: 'Percentage of applications that led to interviews' },
    { key: 'offerConversionRate', label: 'Offer Rate', description: 'Percentage of applications that resulted in offers' },
    { key: 'averageResponseTime', label: 'Avg Response Time', description: 'Average time to hear back from companies' },
    { key: 'applicationTrend', label: 'Application Trend', description: 'Application activity over time' },
    { key: 'interviewTrend', label: 'Interview Trend', description: 'Interview activity over time' },
    { key: 'topCompanies', label: 'Top Companies', description: 'Companies you applied to most' },
    { key: 'topIndustries', label: 'Top Industries', description: 'Industries you targeted most' },
    { key: 'statusDistribution', label: 'Status Distribution', description: 'Distribution of application statuses' },
    { key: 'ghostedApplications', label: 'Ghosting Rate', description: 'Percentage of applications with no response' },
    { key: 'followUpNeeded', label: 'Pending Applications', description: 'Applications awaiting response' },
  ];

  const insightFocusOptions = [
    { value: 'trends', label: 'Trends Analysis', description: 'Identify patterns in your job search' },
    { value: 'recommendations', label: 'Recommendations', description: 'Strategic advice for improvement' },
    { value: 'strengths', label: 'Strengths', description: 'What\'s working well' },
    { value: 'improvements', label: 'Improvements', description: 'Areas to enhance' },
    { value: 'patterns', label: 'Pattern Detection', description: 'Hidden correlations and insights' },
  ];

  const handleMetricToggle = (metricKey) => {
    setConfig({
      ...config,
      metrics: {
        ...config.metrics,
        [metricKey]: !config.metrics[metricKey],
      },
    });
  };

  const handleInsightFocusToggle = (focusValue) => {
    const currentFocus = config.insightsFocus || [];
    const newFocus = currentFocus.includes(focusValue)
      ? currentFocus.filter(f => f !== focusValue)
      : [...currentFocus, focusValue];
    
    setConfig({
      ...config,
      insightsFocus: newFocus,
    });
  };

  const validateConfig = () => {
    const newErrors = {};

    if (!config.name || config.name.trim().length === 0) {
      newErrors.name = 'Report name is required';
    }

    const selectedMetrics = Object.values(config.metrics).filter(Boolean).length;
    if (selectedMetrics === 0) {
      newErrors.metrics = 'Please select at least one metric';
    }

    if (config.dateRange?.type === 'custom') {
      if (!config.dateRange.startDate) {
        newErrors.startDate = 'Start date is required for custom range';
        isValid = false;
      }
      if (!config.dateRange.endDate) {
        newErrors.endDate = 'End date is required for custom range';
        isValid = false;
      }
      if (config.dateRange.startDate && config.dateRange.endDate && 
          new Date(config.dateRange.startDate) > new Date(config.dateRange.endDate)) {
        newErrors.endDate = 'End date must be after start date';
        isValid = false;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateConfig()) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave(config);
    } catch (error) {
      setErrors({ submit: error.message || 'Failed to save report configuration' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectAllMetrics = () => {
    const allSelected = {};
    metricOptions.forEach(option => {
      allSelected[option.key] = true;
    });
    setConfig({ ...config, metrics: allSelected });
  };

  const handleClearAllMetrics = () => {
    const allCleared = {};
    metricOptions.forEach(option => {
      allCleared[option.key] = false;
    });
    setConfig({ ...config, metrics: allCleared });
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card title="Report Configuration">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Name <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={config.name}
              onChange={(e) => setConfig({ ...config, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="e.g., Monthly Activity Report"
            />
            {errors.name && <ErrorMessage message={errors.name} />}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={config.description}
              onChange={(e) => setConfig({ ...config, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              rows="3"
              placeholder="Brief description of this report..."
            />
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.isFavorite}
                onChange={(e) => setConfig({ ...config, isFavorite: e.target.checked })}
                className="mr-2 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Mark as Favorite</span>
            </label>
          </div>
        </div>
      </Card>

      {/* Date Range */}
      <Card title="Time Period">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <select
              value={config.dateRange?.type || 'last30days'}
              onChange={(e) => setConfig({ ...config, dateRange: { ...config.dateRange, type: e.target.value } })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {dateRangeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {config.dateRange?.type === 'custom' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={config.dateRange?.startDate || ''}
                  onChange={(e) => setConfig({ ...config, dateRange: { ...config.dateRange, startDate: e.target.value } })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                {errors.startDate && <ErrorMessage message={errors.startDate} />}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={config.dateRange?.endDate || ''}
                  onChange={(e) => setConfig({ ...config, dateRange: { ...config.dateRange, endDate: e.target.value } })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                {errors.customEndDate && <ErrorMessage message={errors.customEndDate} />}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Metrics Selection */}
      <Card title="Metrics to Include">
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-600">
              Select the metrics you want to include in your report
            </p>
            <div className="space-x-2">
              <Button
                variant="ghost"
                size="small"
                onClick={handleSelectAllMetrics}
              >
                Select All
              </Button>
              <Button
                variant="ghost"
                size="small"
                onClick={handleClearAllMetrics}
              >
                Clear All
              </Button>
            </div>
          </div>

          {errors.metrics && <ErrorMessage message={errors.metrics} />}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metricOptions.map(option => (
              <label
                key={option.key}
                className="flex items-start p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition"
              >
                <input
                  type="checkbox"
                  checked={config.metrics[option.key]}
                  onChange={() => handleMetricToggle(option.key)}
                  className="mr-3 mt-1 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <div>
                  <div className="font-medium text-gray-900">{option.label}</div>
                  <div className="text-sm text-gray-600">{option.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </Card>

      {/* Visualization Options */}
      <Card title="Visualization Options">
        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.visualizations.showCharts}
              onChange={(e) => setConfig({
                ...config,
                visualizations: {
                  ...config.visualizations,
                  showCharts: e.target.checked,
                },
              })}
              className="mr-2 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <span className="text-sm font-medium text-gray-700">Include Charts</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.visualizations.showTables}
              onChange={(e) => setConfig({
                ...config,
                visualizations: {
                  ...config.visualizations,
                  showTables: e.target.checked,
                },
              })}
              className="mr-2 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <span className="text-sm font-medium text-gray-700">Include Data Tables</span>
          </label>
        </div>
      </Card>

      {/* AI Insights */}
      <Card title="AI-Powered Insights">
        <div className="space-y-4">
          <label className="flex items-start">
            <input
              type="checkbox"
              checked={config.includeAIInsights}
              onChange={(e) => setConfig({ ...config, includeAIInsights: e.target.checked })}
              className="mr-3 mt-1 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <div>
              <span className="text-sm font-medium text-gray-700">Enable AI Insights</span>
              <p className="text-sm text-gray-600">Get personalized recommendations and analysis</p>
            </div>
          </label>

          {config.includeAIInsights && (
            <div className="ml-7 space-y-3">
              <p className="text-sm font-medium text-gray-700 mb-2">Focus Areas:</p>
              {insightFocusOptions.map(option => (
                <label
                  key={option.value}
                  className="flex items-start p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition"
                >
                  <input
                    type="checkbox"
                    checked={config.insightsFocus?.includes(option.value)}
                    onChange={() => handleInsightFocusToggle(option.value)}
                    className="mr-3 mt-1 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{option.label}</div>
                    <div className="text-sm text-gray-600">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        {onCancel && (
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancel
          </Button>
        )}
        <Button
          variant="primary"
          onClick={handleSave}
          isLoading={isSaving}
        >
          {initialConfig ? 'Update Report' : 'Save Report'}
        </Button>
      </div>

      {errors.submit && <ErrorMessage message={errors.submit} />}
    </div>
  );
}
