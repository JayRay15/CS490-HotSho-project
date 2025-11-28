import React, { useState, useEffect } from 'react';
import Card from './Card';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import MarketIntelligencePreferences from './MarketIntelligencePreferences';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
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
import {
  getMarketIntelligence,
  getJobMarketTrends,
  getSkillDemand,
  getSalaryTrends,
  getCompanyGrowth,
  getRecommendations,
  getMarketOpportunities,
  updateRecommendation
} from '../api/marketIntelligence';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

export default function MarketIntelligenceDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPreferences, setShowPreferences] = useState(false);
  
  // Data states
  const [intelligence, setIntelligence] = useState(null);
  const [jobTrends, setJobTrends] = useState([]);
  const [skillDemand, setSkillDemand] = useState([]);
  const [salaryTrends, setSalaryTrends] = useState([]);
  const [companyGrowth, setCompanyGrowth] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [opportunities, setOpportunities] = useState([]);

  useEffect(() => {
    loadMarketData();
  }, []);

  const loadMarketData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        intelligenceRes,
        jobTrendsRes,
        skillDemandRes,
        salaryTrendsRes,
        companyGrowthRes,
        recommendationsRes,
        opportunitiesRes
      ] = await Promise.all([
        getMarketIntelligence(),
        getJobMarketTrends(),
        getSkillDemand(),
        getSalaryTrends(),
        getCompanyGrowth(),
        getRecommendations(),
        getMarketOpportunities()
      ]);

      console.log('Market Intelligence Data:', {
        intelligence: intelligenceRes.data,
        jobTrends: jobTrendsRes.data,
        skillDemand: skillDemandRes.data,
        salaryTrends: salaryTrendsRes.data,
        companyGrowth: companyGrowthRes.data,
        recommendations: recommendationsRes.data,
        opportunities: opportunitiesRes.data
      });

      setIntelligence(intelligenceRes.data);
      setJobTrends(jobTrendsRes.data.trends || []);
      setSkillDemand(skillDemandRes.data.skills || []);
      setSalaryTrends(salaryTrendsRes.data.trends || []);
      setCompanyGrowth(companyGrowthRes.data.companies || []);
      setRecommendations(recommendationsRes.data.recommendations || []);
      setOpportunities(opportunitiesRes.data.opportunities || []);
    } catch (err) {
      console.error('Failed to load market data:', err);
      setError('Failed to load market intelligence data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesUpdate = (newPreferences) => {
    setIntelligence(prev => ({
      ...prev,
      preferences: newPreferences
    }));
    loadMarketData();
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'jobs', label: 'Job Market' },
    { id: 'skills', label: 'Skill Demand' },
    { id: 'salary', label: 'Salary Trends' },
    { id: 'companies', label: 'Company Growth' },
    { id: 'recommendations', label: 'Recommendations' },
    { id: 'opportunities', label: 'Opportunities' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorMessage message={error} />
        <Button onClick={loadMarketData} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-gray-900">
              Market Intelligence
            </h1>
            <p className="text-gray-600 mt-1">
              Track trends, analyze opportunities, and make informed career decisions
            </p>
          </div>
          <Button onClick={() => setShowPreferences(true)} variant="outline">
            Preferences
            Preferences
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-gray-200 gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-4 py-3 font-medium text-sm whitespace-nowrap transition-colors
                ${activeTab === tab.id
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600 hover:text-gray-900 hover:border-gray-300 border-b-2 border-transparent'
                }
              `}
            >
              {/* Removed icon */}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <OverviewTab
            intelligence={intelligence}
            jobTrends={jobTrends}
            skillDemand={skillDemand}
            recommendations={recommendations}
            opportunities={opportunities}
          />
        )}
        {activeTab === 'jobs' && <JobTrendsTab trends={jobTrends} />}
        {activeTab === 'skills' && <SkillDemandTab skills={skillDemand} />}
        {activeTab === 'salary' && <SalaryTrendsTab trends={salaryTrends} />}
        {activeTab === 'companies' && <CompanyGrowthTab companies={companyGrowth} />}
        {activeTab === 'recommendations' && (
          <RecommendationsTab
            recommendations={recommendations}
            onUpdate={loadMarketData}
          />
        )}
        {activeTab === 'opportunities' && <OpportunitiesTab opportunities={opportunities} />}
      </div>

      {/* Preferences Modal */}
      {showPreferences && (
        <MarketIntelligencePreferences
          currentPreferences={intelligence?.preferences}
          onClose={() => setShowPreferences(false)}
          onUpdate={handlePreferencesUpdate}
        />
      )}
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ intelligence, jobTrends, skillDemand, recommendations, opportunities }) {
  const priorityActions = recommendations.filter(r => r.priority === 'high').length;
  const urgentOpportunities = opportunities.filter(o => o.urgency === 'high').length;
  const trendingSkills = skillDemand.filter(s => s.trend === 'rising').length;

  // Calculate data quality score
  const dataQuality = intelligence?.lastUpdated
    ? Math.round((1 - (Date.now() - new Date(intelligence.lastUpdated).getTime()) / (7 * 24 * 60 * 60 * 1000)) * 100)
    : 0;

  const qualityLabel = dataQuality > 80 ? 'Excellent' : dataQuality > 60 ? 'Good' : dataQuality > 40 ? 'Fair' : 'Needs Update';

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm font-medium">Priority Actions</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{priorityActions}</div>
          <p className="text-sm text-gray-500 mt-1">High-priority recommendations</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm font-medium">Urgent Opportunities</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{urgentOpportunities}</div>
          <p className="text-sm text-gray-500 mt-1">Time-sensitive opportunities</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm font-medium">Trending Skills</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{trendingSkills}</div>
          <p className="text-sm text-gray-500 mt-1">Rising in demand</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm font-medium">Data Quality</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{qualityLabel}</div>
          <p className="text-sm text-gray-500 mt-1">{dataQuality}% current</p>
        </Card>
      </div>

      {/* Quick Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Growing Industries</h3>
          {jobTrends.length > 0 ? (
            <div className="space-y-3">
              {jobTrends.slice(0, 5).map((trend, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-gray-700">{trend.industry}</span>
                  <span className={`font-medium ${trend.growthRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {trend.growthRate > 0 ? '+' : ''}{trend.growthRate}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No industry data available</p>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Skills in Demand</h3>
          {skillDemand.length > 0 ? (
            <div className="space-y-3">
              {skillDemand
                .filter(s => s.trend === 'rising')
                .slice(0, 5)
                .map((skill, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-gray-700">{skill.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full"
                          style={{ width: `${skill.demandScore}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">{skill.demandScore}%</span>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No skill data available</p>
          )}
        </Card>
      </div>
    </div>
  );
}

// Job Trends Tab Component
function JobTrendsTab({ trends }) {
  if (!trends || trends.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center text-gray-500">
          <p className="text-lg">No job market trend data available</p>
          <p className="text-sm mt-2">Data will appear here once it's collected</p>
        </div>
      </Card>
    );
  }

  // Prepare chart data
  const chartData = trends.map(trend => ({
    name: trend.industry,
    openings: trend.openings,
    growth: trend.growthRate
  }));

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Job Openings by Industry</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="openings" fill="#6366f1" name="Job Openings" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Growth Rate by Industry</h3>
        <div className="space-y-4">
          {trends
            .sort((a, b) => b.growthRate - a.growthRate)
            .map((trend, index) => (
              <div key={index} className="border-b border-gray-200 pb-4 last:border-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{trend.industry}</span>
                  <span className={`text-lg font-bold ${trend.growthRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {trend.growthRate > 0 ? '+' : ''}{trend.growthRate}%
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Openings:</span>
                    <span className="ml-2 font-medium">{trend.openings.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Avg Salary:</span>
                    <span className="ml-2 font-medium">${trend.averageSalary.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Competition:</span>
                    <span className="ml-2 font-medium capitalize">{trend.competitionLevel}</span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
}

// Skill Demand Tab Component
function SkillDemandTab({ skills }) {
  const [filter, setFilter] = useState('all');

  if (!skills || skills.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center text-gray-500">
          <p className="text-lg">No skill demand data available</p>
          <p className="text-sm mt-2">Data will appear here once it's collected</p>
        </div>
      </Card>
    );
  }

  const filteredSkills = filter === 'all' 
    ? skills 
    : skills.filter(skill => skill.trend === filter);

  // Group skills by category
  const skillsByCategory = filteredSkills.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
    acc[skill.category].push(skill);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <span className="text-gray-700 font-medium">Filter by trend:</span>
          <div className="flex gap-2">
            {['all', 'rising', 'stable', 'declining'].map(trend => (
              <Button
                key={trend}
                size="sm"
                variant={filter === trend ? 'primary' : 'outline'}
                onClick={() => setFilter(trend)}
              >
                {trend.charAt(0).toUpperCase() + trend.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Skills by Category */}
      {Object.keys(skillsByCategory).length > 0 ? (
        Object.entries(skillsByCategory).map(([category, categorySkills]) => (
          <Card key={category} className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 capitalize">{category}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categorySkills.map((skill, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{skill.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{skill.relatedJobs.toLocaleString()} jobs</p>
                    </div>
                    <span className={`
                      px-2 py-1 rounded text-xs font-medium
                      ${skill.trend === 'rising' ? 'bg-green-100 text-green-700' : ''}
                      ${skill.trend === 'stable' ? 'bg-blue-100 text-blue-700' : ''}
                      ${skill.trend === 'declining' ? 'bg-red-100 text-red-700' : ''}
                    `}>
                      {skill.trend === 'rising' ? '↑' : skill.trend === 'declining' ? '↓' : '→'} {skill.trend}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600">Demand</span>
                        <span className="font-medium">{skill.demandScore}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full"
                          style={{ width: `${skill.demandScore}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Growth:</span>
                      <span className={`font-medium ${skill.growthRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {skill.growthRate > 0 ? '+' : ''}{skill.growthRate}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))
      ) : (
        <Card className="p-8">
          <div className="text-center text-gray-500">
            <p>No skills match the selected filter</p>
          </div>
        </Card>
      )}
    </div>
  );
}

// Salary Trends Tab Component
function SalaryTrendsTab({ trends }) {
  if (!trends || trends.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center text-gray-500">
          <p className="text-lg">No salary trend data available</p>
          <p className="text-sm mt-2">Data will appear here once it's collected</p>
        </div>
      </Card>
    );
  }

  // Prepare chart data
  const chartData = trends.map(trend => ({
    name: trend.role,
    entry: trend.salaryRanges.entry.median,
    mid: trend.salaryRanges.mid.median,
    senior: trend.salaryRanges.senior.median
  }));

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Salary Comparison by Role & Level</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
            <Legend />
            <Bar dataKey="entry" fill="#6366f1" name="Entry Level" />
            <Bar dataKey="mid" fill="#8b5cf6" name="Mid Level" />
            <Bar dataKey="senior" fill="#ec4899" name="Senior Level" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Detailed Salary Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {trends.map((trend, index) => (
          <Card key={index} className="p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">{trend.role}</h4>
            <div className="space-y-4">
              {Object.entries(trend.salaryRanges).map(([level, range]) => (
                <div key={level} className="border-b border-gray-200 pb-3 last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-700 capitalize">{level} Level</span>
                    <span className="text-lg font-bold text-gray-900">
                      ${range.median.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Range: ${range.min.toLocaleString()} - ${range.max.toLocaleString()}</span>
                    <span className={`font-medium ${trend.growthRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {trend.growthRate > 0 ? '+' : ''}{trend.growthRate}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Location:</span> {trend.location}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Company Growth Tab Component
function CompanyGrowthTab({ companies }) {
  if (!companies || companies.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center text-gray-500">
          <p className="text-lg">No company growth data available</p>
          <p className="text-sm mt-2">Data will appear here once it's collected</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {companies.map((company, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{company.name}</h3>
                <p className="text-gray-600">{company.industry}</p>
              </div>
              <span className={`
                px-3 py-1 rounded-full text-sm font-medium
                ${company.hiringTrend === 'increasing' ? 'bg-green-100 text-green-700' : ''}
                ${company.hiringTrend === 'stable' ? 'bg-blue-100 text-blue-700' : ''}
                ${company.hiringTrend === 'decreasing' ? 'bg-red-100 text-red-700' : ''}
              `}>
                {company.hiringTrend}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-2xl font-bold text-gray-900">{company.openPositions}</div>
                <div className="text-sm text-gray-600">Open Positions</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{company.growthRate}%</div>
                <div className="text-sm text-gray-600">Growth Rate</div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Top Hiring Roles</div>
                <div className="flex flex-wrap gap-2">
                  {company.topHiringRoles.map((role, i) => (
                    <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                      {role}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Key Skills</div>
                <div className="flex flex-wrap gap-2">
                  {company.keySkills.map((skill, i) => (
                    <span key={i} className="px-2 py-1 bg-primary-50 text-primary-700 rounded text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Recommendations Tab Component
function RecommendationsTab({ recommendations, onUpdate }) {
  const [filter, setFilter] = useState('all');

  if (!recommendations || recommendations.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center text-gray-500">
          <p className="text-lg">No recommendations available</p>
          <p className="text-sm mt-2">Recommendations will appear here based on market analysis</p>
        </div>
      </Card>
    );
  }

  const filteredRecommendations = filter === 'all'
    ? recommendations
    : recommendations.filter(rec => rec.priority === filter);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <span className="text-gray-700 font-medium">Filter by priority:</span>
          <div className="flex gap-2">
            {['all', 'high', 'medium', 'low'].map(priority => (
              <Button
                key={priority}
                size="sm"
                variant={filter === priority ? 'primary' : 'outline'}
                onClick={() => setFilter(priority)}
              >
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Recommendations List */}
      <div className="space-y-4">
        {filteredRecommendations.length > 0 ? (
          filteredRecommendations.map((rec) => (
            <Card key={rec._id} className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{rec.title}</h3>
                    <span className={`
                      px-2 py-1 rounded text-xs font-medium
                      ${rec.priority === 'high' ? 'bg-red-100 text-red-700' : ''}
                      ${rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : ''}
                      ${rec.priority === 'low' ? 'bg-green-100 text-green-700' : ''}
                    `}>
                      {rec.priority} priority
                    </span>
                  </div>
                  <p className="text-gray-700 mb-3">{rec.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Category: {rec.category}</span>
                    <span>Impact: {rec.impact}</span>
                    {rec.estimatedTimeframe && <span>Timeframe: {rec.estimatedTimeframe}</span>}
                  </div>
                  {rec.actionItems && rec.actionItems.length > 0 && (
                    <div className="mt-3">
                      <div className="text-sm font-medium text-gray-700 mb-2">Action Items:</div>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                        {rec.actionItems.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-8">
            <div className="text-center text-gray-500">
              <p>No recommendations match the selected filter</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

// Opportunities Tab Component
function OpportunitiesTab({ opportunities }) {
  if (!opportunities || opportunities.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center text-gray-500">
          <p className="text-lg">No market opportunities available</p>
          <p className="text-sm mt-2">Opportunities will appear here based on market analysis</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {opportunities.map((opp, index) => (
        <Card key={index} className="p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{opp.title}</h3>
                <span className={`
                  px-2 py-1 rounded text-xs font-medium
                  ${opp.urgency === 'high' ? 'bg-red-100 text-red-700' : ''}
                  ${opp.urgency === 'medium' ? 'bg-yellow-100 text-yellow-700' : ''}
                  ${opp.urgency === 'low' ? 'bg-green-100 text-green-700' : ''}
                `}>
                  {opp.urgency} urgency
                </span>
              </div>
              <p className="text-gray-700 mb-3">{opp.description}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-600">Type</div>
                  <div className="font-medium text-gray-900 capitalize">{opp.type}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Growth Potential</div>
                  <div className="font-medium text-gray-900">{opp.potentialGrowth}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Market Size</div>
                  <div className="font-medium text-gray-900">{opp.marketSize}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Competition</div>
                  <div className="font-medium text-gray-900 capitalize">{opp.competitionLevel}</div>
                </div>
              </div>

              {opp.requiredSkills && opp.requiredSkills.length > 0 && (
                <div className="mb-3">
                  <div className="text-sm font-medium text-gray-700 mb-2">Required Skills:</div>
                  <div className="flex flex-wrap gap-2">
                    {opp.requiredSkills.map((skill, i) => (
                      <span key={i} className="px-2 py-1 bg-primary-50 text-primary-700 rounded text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {opp.timeline && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Timeline:</span> {opp.timeline}
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
