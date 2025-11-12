import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Award, 
  FileText, 
  Download,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Briefcase,
  Star,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import {
  getAllCoverLetterAnalytics,
  getResponseRates,
  getTemplateEffectiveness,
  getSuccessPatterns,
  exportPerformanceReport
} from '../../api/coverLetterAnalytics';

/**
 * UC-62: Cover Letter Performance Analytics Dashboard
 * Comprehensive analytics showing performance metrics, success patterns,
 * template effectiveness, and actionable recommendations
 */
const CoverLetterAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState([]);
  const [responseRates, setResponseRates] = useState(null);
  const [templateEffectiveness, setTemplateEffectiveness] = useState(null);
  const [successPatterns, setSuccessPatterns] = useState(null);
  const [selectedView, setSelectedView] = useState('overview'); // overview, response-rates, effectiveness, patterns
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Load all analytics data in parallel
      const [analyticsRes, ratesRes, effectivenessRes, patternsRes] = await Promise.all([
        getAllCoverLetterAnalytics(),
        getResponseRates(),
        getTemplateEffectiveness(),
        getSuccessPatterns()
      ]);

      setAnalytics(analyticsRes.data.data.analytics || []);
      setResponseRates(ratesRes.data.data);
      setTemplateEffectiveness(effectivenessRes.data.data);
      setSuccessPatterns(patternsRes.data.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      alert('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      setExporting(true);
      const response = await exportPerformanceReport(format);
      
      if (format === 'pdf') {
        // Create blob and download
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `cover-letter-performance-${Date.now()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        // JSON download
        const dataStr = JSON.stringify(response.data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `cover-letter-performance-${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
      
      alert(`Report exported successfully as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Failed to export report:', error);
      alert('Failed to export report. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cover Letter Performance Analytics</h1>
          <p className="text-gray-600 mt-1">Track and improve your application success rate</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('pdf')}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
          <button
            onClick={() => handleExport('json')}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export JSON
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'response-rates', label: 'Response Rates', icon: TrendingUp },
          { id: 'effectiveness', label: 'Template Effectiveness', icon: Target },
          { id: 'patterns', label: 'Success Patterns', icon: Star }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedView(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                selectedView === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Overview Tab */}
      {selectedView === 'overview' && (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={FileText}
              label="Total Cover Letters"
              value={analytics.length}
              color="blue"
            />
            <StatCard
              icon={Briefcase}
              label="Total Applications"
              value={analytics.reduce((sum, a) => sum + a.metrics.totalApplications, 0)}
              color="green"
            />
            <StatCard
              icon={TrendingUp}
              label="Avg Response Rate"
              value={`${(analytics.length > 0 
                ? analytics.reduce((sum, a) => sum + a.metrics.responseRate, 0) / analytics.length 
                : 0).toFixed(1)}%`}
              color="purple"
            />
            <StatCard
              icon={Award}
              label="Avg Success Score"
              value={Math.round(analytics.length > 0 
                ? analytics.reduce((sum, a) => sum + a.metrics.successScore, 0) / analytics.length 
                : 0)}
              color="yellow"
            />
          </div>

          {/* Top Performing Cover Letters */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-600" />
              Top Performing Cover Letters
            </h2>
            
            {analytics.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No cover letter data available yet.</p>
                <p className="text-sm mt-1">Start applying to jobs with your cover letters to see analytics!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {analytics
                  .sort((a, b) => b.metrics.successScore - a.metrics.successScore)
                  .slice(0, 5)
                  .map((item, index) => (
                    <div
                      key={item.coverLetterId}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                          index === 0 ? 'bg-yellow-100 text-yellow-700' :
                          index === 1 ? 'bg-gray-200 text-gray-700' :
                          index === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{item.coverLetterName}</h3>
                          <p className="text-sm text-gray-600">Style: {item.style || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Applications</p>
                          <p className="font-semibold text-gray-900">{item.metrics.totalApplications}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Response Rate</p>
                          <p className="font-semibold text-gray-900">{item.metrics.responseRate}%</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Success Score</p>
                          <p className="text-2xl font-bold text-blue-600">{item.metrics.successScore}</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Quick Insights */}
          {successPatterns?.insights && successPatterns.insights.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-purple-600" />
                Quick Insights
              </h2>
              <div className="space-y-3">
                {successPatterns.insights.slice(0, 4).map((insight, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-gray-900">{insight.message}</p>
                      {insight.actionable && (
                        <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          Actionable
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Response Rates Tab */}
      {selectedView === 'response-rates' && responseRates && (
        <div className="space-y-6">
          {/* Overall Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-600">Overall Response Rate</h3>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{responseRates.overall.avgResponseRate}%</p>
              <p className="text-sm text-gray-500 mt-1">Across {responseRates.overall.totalCoverLetters} cover letters</p>
            </div>
          </div>

          {/* By Style */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Response Rates by Style</h2>
            <div className="space-y-3">
              {Object.entries(responseRates.byStyle).map(([style, data]) => (
                <div key={style} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-gray-900 capitalize">{style}</h3>
                    <p className="text-sm text-gray-600">{data.count} cover letter(s)</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Applications</p>
                      <p className="font-semibold text-gray-900">{data.totalApplications}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Responses</p>
                      <p className="font-semibold text-gray-900">{data.totalResponses}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Rate</p>
                      <p className="text-2xl font-bold text-blue-600">{data.responseRate}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* By Template */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Response Rates by Template</h2>
            <div className="space-y-3">
              {Object.entries(responseRates.byTemplate).map(([template, data]) => (
                <div key={template} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-gray-900">{template}</h3>
                    <p className="text-sm text-gray-600">{data.count} cover letter(s)</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Applications</p>
                      <p className="font-semibold text-gray-900">{data.totalApplications}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Responses</p>
                      <p className="font-semibold text-gray-900">{data.totalResponses}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Rate</p>
                      <p className="text-2xl font-bold text-green-600">{data.responseRate}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Template Effectiveness Tab */}
      {selectedView === 'effectiveness' && templateEffectiveness && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-600">Total Templates</h3>
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{templateEffectiveness.summary.totalTemplates}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-600">Excellent Templates</h3>
                <Award className="w-5 h-5 text-yellow-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{templateEffectiveness.summary.excellentTemplates}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-600">Need Improvement</h3>
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{templateEffectiveness.summary.needsImprovementTemplates}</p>
            </div>
          </div>

          {/* Template List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Template Effectiveness Rankings</h2>
            <div className="space-y-3">
              {templateEffectiveness.effectiveness.map((template, index) => (
                <div key={template.templateId} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                        template.recommendation === 'excellent' ? 'bg-green-100 text-green-700' :
                        template.recommendation === 'good' ? 'bg-blue-100 text-blue-700' :
                        template.recommendation === 'fair' ? 'bg-yellow-100 text-yellow-700' :
                        template.recommendation === 'insufficient_data' ? 'bg-gray-100 text-gray-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{template.templateName}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>{template.style || 'N/A'}</span>
                          <span>•</span>
                          <span>{template.industry || 'General'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-blue-600">{template.effectivenessScore}</p>
                      <p className="text-sm text-gray-600">Effectiveness Score</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-gray-600">Data Points</p>
                      <p className="font-semibold text-gray-900">{template.dataPoints}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Avg Response Rate</p>
                      <p className="font-semibold text-gray-900">{template.metrics.avgResponseRate}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Avg Success Score</p>
                      <p className="font-semibold text-gray-900">{template.metrics.avgSuccessScore}</p>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      template.recommendation === 'excellent' ? 'bg-green-100 text-green-800' :
                      template.recommendation === 'good' ? 'bg-blue-100 text-blue-800' :
                      template.recommendation === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                      template.recommendation === 'insufficient_data' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {template.recommendation === 'insufficient_data' ? 'Insufficient Data' : 
                       template.recommendation.charAt(0).toUpperCase() + template.recommendation.slice(1).replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Success Patterns Tab */}
      {selectedView === 'patterns' && successPatterns && (
        <div className="space-y-6">
          {/* By Industry */}
          {Object.keys(successPatterns.patterns.byIndustry).length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-600" />
                Performance by Industry
              </h2>
              <div className="space-y-3">
                {Object.entries(successPatterns.patterns.byIndustry)
                  .sort(([, a], [, b]) => parseFloat(b.responseRate) - parseFloat(a.responseRate))
                  .map(([industry, data]) => (
                    <div key={industry} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold text-gray-900">{industry}</h3>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Applications</p>
                          <p className="font-semibold text-gray-900">{data.applications}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Response Rate</p>
                          <p className="text-xl font-bold text-blue-600">{data.responseRate}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* By Company Size */}
          {Object.keys(successPatterns.patterns.byCompanySize).length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Performance by Company Size
              </h2>
              <div className="space-y-3">
                {Object.entries(successPatterns.patterns.byCompanySize)
                  .sort(([, a], [, b]) => parseFloat(b.successRate) - parseFloat(a.successRate))
                  .map(([size, data]) => (
                    <div key={size} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold text-gray-900">{size} employees</h3>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Applications</p>
                          <p className="font-semibold text-gray-900">{data.applications}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Success Rate</p>
                          <p className="text-xl font-bold text-purple-600">{data.successRate}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* By Style */}
          {Object.keys(successPatterns.patterns.byStyle).length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-600" />
                Performance by Cover Letter Style
              </h2>
              <div className="space-y-3">
                {Object.entries(successPatterns.patterns.byStyle)
                  .sort(([, a], [, b]) => parseFloat(b.avgSuccessScore) - parseFloat(a.avgSuccessScore))
                  .map(([style, data]) => (
                    <div key={style} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold text-gray-900 capitalize">{style}</h3>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Usage Count</p>
                          <p className="font-semibold text-gray-900">{data.usageCount}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Avg Success Score</p>
                          <p className="text-xl font-bold text-green-600">{data.avgSuccessScore}</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* All Insights */}
          {successPatterns.insights && successPatterns.insights.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-600" />
                Insights & Recommendations
              </h2>
              <div className="space-y-3">
                {successPatterns.insights.map((insight, index) => (
                  <div key={index} className={`flex items-start gap-3 p-4 rounded-lg ${
                    insight.type === 'overall' ? 'bg-blue-50' :
                    insight.type === 'style' ? 'bg-green-50' :
                    insight.type === 'industry' ? 'bg-purple-50' :
                    'bg-yellow-50'
                  }`}>
                    <CheckCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                      insight.type === 'overall' ? 'text-blue-600' :
                      insight.type === 'style' ? 'text-green-600' :
                      insight.type === 'industry' ? 'text-purple-600' :
                      'text-yellow-600'
                    }`} />
                    <div className="flex-1">
                      <p className="text-gray-900">{insight.message}</p>
                      {insight.actionable && (
                        <span className="inline-block mt-2 text-xs bg-white px-2 py-1 rounded shadow-sm">
                          💡 Actionable Insight
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600'
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-gray-600 text-sm font-medium">{label}</h3>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
};

export default CoverLetterAnalytics;
