import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import Card from './Card';

/**
 * ReportVisualization Component
 * Renders charts and data visualizations for report data
 */
export default function ReportVisualization({ reportData, config }) {
  if (!reportData) {
    return (
      <Card>
        <p className="text-gray-600 text-center py-8">No report data available</p>
      </Card>
    );
  }

  const COLORS = [
    '#3B82F6', // primary blue
    '#10B981', // green
    '#F59E0B', // amber
    '#EF4444', // red
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#14B8A6', // teal
    '#F97316', // orange
  ];

  // Format application trend data for line chart
  const formatTrendData = () => {
    if (!reportData.applicationTrend || !Array.isArray(reportData.applicationTrend)) return [];
    return reportData.applicationTrend.map(item => ({
      date: item?.date ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A',
      count: item?.count || 0,
    }));
  };

  // Format status breakdown for pie chart
  const formatStatusData = () => {
    if (!reportData.applicationsByStatus) return [];
    
    // Handle if it's an array (from backend aggregateByStatus)
    if (Array.isArray(reportData.applicationsByStatus)) {
      return reportData.applicationsByStatus.map(item => ({
        name: item?.status ? item.status.replace(/_/g, ' ') : 'Unknown',
        value: item?.count || 0,
      }));
    }
    
    // Handle if it's an object (key-value pairs)
    if (typeof reportData.applicationsByStatus === 'object') {
      return Object.entries(reportData.applicationsByStatus).map(([status, count]) => ({
        name: status ? status.replace(/_/g, ' ') : 'Unknown',
        value: count || 0,
      }));
    }
    
    return [];
  };

  // Format top companies for bar chart
  const formatTopCompaniesData = () => {
    if (!reportData.topCompanies || !Array.isArray(reportData.topCompanies)) return [];
    return reportData.topCompanies.map(item => ({
      name: item?.company ? (item.company.length > 20 ? item.company.substring(0, 20) + '...' : item.company) : 'Unknown',
      applications: item?.count || 0,
    }));
  };

  // Format top industries for bar chart
  const formatTopIndustriesData = () => {
    if (!reportData.topIndustries || !Array.isArray(reportData.topIndustries)) return [];
    return reportData.topIndustries.map(item => ({
      name: item?.industry ? (item.industry.length > 20 ? item.industry.substring(0, 20) + '...' : item.industry) : 'Unknown',
      applications: item?.count || 0,
    }));
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {config.metrics.totalApplications && (
          <Card variant="elevated">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">
                {reportData.totalApplications || 0}
              </div>
              <div className="text-sm text-gray-600">Total Applications</div>
            </div>
          </Card>
        )}

        {config.metrics.activeApplications && (
          <Card variant="elevated">
            <div className="text-center">
              <div className="text-3xl font-bold text-accent mb-2">
                {reportData.activeApplications || 0}
              </div>
              <div className="text-sm text-gray-600">Active Applications</div>
            </div>
          </Card>
        )}

        {config.metrics.responseRate && (
          <Card variant="elevated">
            <div className="text-center">
              <div className="text-3xl font-bold text-success mb-2">
                {reportData?.responseRate != null
                  ? `${typeof reportData.responseRate === 'number' ? reportData.responseRate.toFixed(1) : reportData.responseRate}%` 
                  : '0%'}
              </div>
              <div className="text-sm text-gray-600">Response Rate</div>
            </div>
          </Card>
        )}

        {config.metrics.interviewRate && (
          <Card variant="elevated">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {reportData?.interviewConversionRate?.rate 
                  ? `${reportData.interviewConversionRate.rate}%` 
                  : '0%'}
              </div>
              <div className="text-sm text-gray-600">Interview Rate</div>
            </div>
          </Card>
        )}

        {config.metrics.offerRate && (
          <Card variant="elevated">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {reportData?.offerConversionRate?.rate 
                  ? `${reportData.offerConversionRate.rate}%` 
                  : '0%'}
              </div>
              <div className="text-sm text-gray-600">Offer Rate</div>
            </div>
          </Card>
        )}

        {config.metrics.averageResponseTime && (
          <Card variant="elevated">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {reportData?.averageResponseTime?.averageDays 
                  ? `${reportData.averageResponseTime.averageDays} days` 
                  : 'N/A'}
              </div>
              <div className="text-sm text-gray-600">Avg Response Time</div>
            </div>
          </Card>
        )}

        {config.metrics.rejectionRate && (
          <Card variant="elevated">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 mb-2">
                {reportData?.rejectionRate != null
                  ? `${typeof reportData.rejectionRate === 'number' ? reportData.rejectionRate.toFixed(1) : reportData.rejectionRate}%` 
                  : '0%'}
              </div>
              <div className="text-sm text-gray-600">Rejection Rate</div>
            </div>
          </Card>
        )}

        {config.metrics.successRate && (
          <Card variant="elevated">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {reportData?.successRate != null
                  ? `${typeof reportData.successRate === 'number' ? reportData.successRate.toFixed(1) : reportData.successRate}%` 
                  : '0%'}
              </div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
          </Card>
        )}
      </div>

      {/* Application Trend Line Chart */}
      {config.metrics.applicationTrend && config.visualizations.showCharts && (
        <Card title="Application Activity Trend">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={formatTrendData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="date" 
                stroke="#6B7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#6B7280"
                style={{ fontSize: '12px' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="count" 
                name="Applications" 
                stroke="#3B82F6" 
                strokeWidth={2}
                dot={{ fill: '#3B82F6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Applications by Status Pie Chart */}
      {config.metrics.applicationsByStatus && config.visualizations.showCharts && (
        <Card title="Applications by Status">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={formatStatusData()}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {formatStatusData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Top Companies Bar Chart */}
      {config.metrics.topCompanies && config.visualizations.showCharts && (
        <Card title="Top Companies Applied To">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={formatTopCompaniesData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="name" 
                stroke="#6B7280"
                style={{ fontSize: '12px' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                stroke="#6B7280"
                style={{ fontSize: '12px' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="applications" 
                name="Applications" 
                fill="#3B82F6"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Top Industries Bar Chart */}
      {config.metrics.topIndustries && config.visualizations.showCharts && (
        <Card title="Top Industries Targeted">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={formatTopIndustriesData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="name" 
                stroke="#6B7280"
                style={{ fontSize: '12px' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                stroke="#6B7280"
                style={{ fontSize: '12px' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="applications" 
                name="Applications" 
                fill="#10B981"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Data Tables */}
      {config.visualizations.showTables && (
        <>
          {/* Top Companies Table */}
          {config.metrics.topCompanies && reportData.topCompanies && (
            <Card title="Top Companies (Detailed)">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rank
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Applications
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.topCompanies.map((company, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {company.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {company.count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Status Breakdown Table */}
          {config.metrics.applicationsByStatus && reportData.applicationsByStatus && (
            <Card title="Status Breakdown (Detailed)">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Count
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Percentage
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(reportData.applicationsByStatus).map(([status, count]) => (
                      <tr key={status} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {reportData.totalApplications 
                            ? ((count / reportData.totalApplications) * 100).toFixed(1)
                            : 0}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      {/* AI Insights Section */}
      {reportData?.aiInsights && Array.isArray(reportData.aiInsights) && reportData.aiInsights.length > 0 && (
        <Card title="🤖 AI-Powered Insights">
          <div className="space-y-4">
            {reportData.aiInsights.map((insight, index) => (
              <div key={index} className="border-l-4 border-primary pl-4 py-2">
                <h4 className="font-semibold text-gray-900 mb-2">{insight?.title || 'Insight'}</h4>
                <p className="text-gray-700 whitespace-pre-line">{insight?.content || insight?.text || ''}</p>
                {insight?.type && (
                  <span className="inline-block mt-2 px-2 py-1 text-xs bg-primary-100 text-primary-800 rounded">
                    {insight.type}
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
      
      {/* Show message if AI insights were requested but not available */}
      {config?.includeAIInsights && (!reportData?.aiInsights || reportData.aiInsights.length === 0) && (
        <Card>
          <div className="text-center py-4 text-gray-500">
            <p>AI insights are being generated or are not available for this report.</p>
          </div>
        </Card>
      )}
    </div>
  );
}
