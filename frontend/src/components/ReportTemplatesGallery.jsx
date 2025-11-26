import React, { useState, useEffect } from 'react';
import Card from './Card';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import { getReportConfigs } from '../api/reports';

/**
 * ReportTemplatesGallery Component
 * Displays system templates and user's saved report configurations
 */
export default function ReportTemplatesGallery({ onSelectTemplate, onCreateNew }) {
  const [templates, setTemplates] = useState([]);
  const [userReports, setUserReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('templates'); // 'templates' or 'saved'

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const response = await getReportConfigs(true);
      
      // Backend returns {success, data: {userReports: [...], systemTemplates: [...]}}
      const data = response.data || response;
      const systemTemplates = data.systemTemplates || [];
      const savedReports = data.userReports || [];
      
      console.log('Fetched templates:', systemTemplates.length, 'user reports:', savedReports.length);
      
      setTemplates(systemTemplates);
      setUserReports(savedReports);
      setError(null);
    } catch (err) {
      console.error('Error fetching reports:', err);
      if (err.message?.includes('Network Error') || err.code === 'ERR_NETWORK') {
        setError('Cannot connect to server. Please ensure the backend is running on port 5000.');
      } else {
        setError(err.message || 'Failed to load reports');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getTemplateIcon = (category) => {
    const icons = {
      activity: '📊',
      performance: '📈',
      pipeline: '🔄',
      summary: '📋',
      industry: '🏢',
      company: '🏭',
      default: '📄',
    };
    return icons[category] || icons.default;
  };

  const formatDateRange = (dateRange) => {
    // Handle new object structure {type, startDate, endDate}
    const rangeType = typeof dateRange === 'object' ? dateRange?.type : dateRange;
    
    const ranges = {
      last7days: 'Last 7 Days',
      last30days: 'Last 30 Days',
      last90days: 'Last 90 Days',
      thisMonth: 'This Month',
      lastMonth: 'Last Month',
      thisYear: 'This Year',
      custom: 'Custom Range',
      allTime: 'All Time',
    };
    return ranges[rangeType] || rangeType || 'Last 30 Days';
  };

  const getMetricsCount = (metrics) => {
    if (!metrics) return 0;
    return Object.values(metrics).filter(Boolean).length;
  };

  const TemplateCard = ({ template, isUserReport = false }) => (
    <Card
      variant="interactive"
      className="h-full flex flex-col cursor-pointer transition-all hover:shadow-xl"
      onClick={() => onSelectTemplate(template)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center">
          <span className="text-3xl mr-3">
            {getTemplateIcon(template.templateCategory)}
          </span>
          <div>
            <h3 className="font-semibold text-gray-900">{template.name}</h3>
            {isUserReport && template.isFavorite && (
              <span className="text-yellow-500 text-sm">⭐ Favorite</span>
            )}
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-4 flex-grow">
        {template.description || 'No description available'}
      </p>

      <div className="space-y-2 text-xs text-gray-500">
        <div className="flex items-center justify-between">
          <span>📅 {formatDateRange(template.dateRange)}</span>
          <span>📊 {getMetricsCount(template.metrics)} metrics</span>
        </div>
        
        {template.includeAIInsights && (
          <div className="flex items-center text-primary">
            <span>🤖 AI Insights Enabled</span>
          </div>
        )}

        {isUserReport && (
          <div className="text-xs text-gray-400 mt-2">
            Created: {new Date(template.createdAt).toLocaleDateString()}
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <Button
          variant="primary"
          size="small"
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            onSelectTemplate(template);
          }}
        >
          {isUserReport ? 'Use Report' : 'Use Template'}
        </Button>
      </div>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Card variant="elevated">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">Unable to Load Reports</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
                {error.includes('backend') && (
                  <div className="mt-3 bg-white border border-red-200 rounded p-3">
                    <p className="font-medium text-gray-900 mb-2">To start the backend server:</p>
                    <ol className="list-decimal pl-5 space-y-1 text-gray-700">
                      <li>Open a terminal</li>
                      <li>Navigate to the backend folder: <code className="bg-gray-100 px-1">cd backend</code></li>
                      <li>Start the server: <code className="bg-gray-100 px-1">node src/server.js</code></li>
                    </ol>
                  </div>
                )}
              </div>
              <div className="mt-4 flex space-x-3">
                <Button
                  variant="primary"
                  size="small"
                  onClick={fetchReports}
                >
                  Retry Connection
                </Button>
                <Button
                  variant="outline"
                  size="small"
                  onClick={() => window.location.href = '/dashboard'}
                >
                  Back to Dashboard
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Custom Reports</h2>
          <p className="text-gray-600 mt-1">
            Choose from templates or create your own custom report
          </p>
        </div>
        <Button
          variant="primary"
          onClick={onCreateNew}
        >
          + Create New Report
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('templates')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'templates'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            System Templates
            <span className="ml-2 bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
              {templates.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'saved'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Saved Reports
            <span className="ml-2 bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
              {userReports.length}
            </span>
          </button>
        </nav>
      </div>

      {/* System Templates Tab */}
      {activeTab === 'templates' && (
        <div>
          {templates.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">No system templates available</p>
                <Button variant="primary" onClick={onCreateNew}>
                  Create Your First Report
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <TemplateCard key={template._id} template={template} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Saved Reports Tab */}
      {activeTab === 'saved' && (
        <div>
          {userReports.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">You haven't saved any reports yet</p>
                <Button variant="primary" onClick={onCreateNew}>
                  Create Your First Report
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userReports.map((report) => (
                <TemplateCard key={report._id} template={report} isUserReport />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Start Info Card */}
      <Card variant="info" className="mt-8">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className="text-2xl">💡</span>
          </div>
          <div className="ml-4">
            <h3 className="font-semibold text-gray-900 mb-2">Getting Started</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Use system templates for quick insights</li>
              <li>• Create custom reports tailored to your needs</li>
              <li>• Export reports as PDF or Excel</li>
              <li>• Share reports with others using secure links</li>
              <li>• Get AI-powered recommendations and analysis</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
