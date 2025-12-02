import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import {
  getInterviewPerformanceAnalytics,
  getImprovementTrends,
  getCoachingRecommendations,
  getPerformanceBenchmarks
} from "../../api/interviewPerformance";

export default function InterviewPerformance() {
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [data, setData] = useState(null);
  const [trends, setTrends] = useState(null);
  const [coaching, setCoaching] = useState(null);
  const [benchmarks, setBenchmarks] = useState(null);

  useEffect(() => {
    if (isLoaded && user) {
      loadAllData();
    }
  }, [isLoaded, user]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [analyticsRes, trendsRes, coachingRes, benchmarksRes] = await Promise.all([
        getInterviewPerformanceAnalytics(),
        getImprovementTrends("6months"),
        getCoachingRecommendations(),
        getPerformanceBenchmarks()
      ]);

      setData(analyticsRes.data);
      setTrends(trendsRes.data);
      setCoaching(coachingRes.data);
      setBenchmarks(benchmarksRes.data);
    } catch (err) {
      console.error("Error loading interview performance data:", err);
      setError(err.response?.data?.error?.message || "Failed to load performance data");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading performance analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full">
          <div className="text-red-600 text-center">
            <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold mb-2">Error Loading Data</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={loadAllData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data?.hasData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Interview Data Yet</h3>
          <p className="text-gray-600 mb-6">
            Start tracking your interviews to see comprehensive performance analytics and coaching insights.
          </p>
          <button
            onClick={() => window.location.href = "/interviews"}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Track Your First Interview
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "conversion", label: "Conversion Rates", icon: "📈" },
    { id: "trends", label: "Improvement Trends", icon: "📉" },
    { id: "formats", label: "Format Analysis", icon: "💻" },
    { id: "confidence", label: "Confidence Tracking", icon: "💪" },
    { id: "coaching", label: "Coaching", icon: "🎯" },
    { id: "benchmarks", label: "Benchmarks", icon: "🏆" }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Interview Performance Analytics</h1>
          <p className="mt-2 text-gray-600">
            Track your interview performance, identify improvement areas, and get personalized coaching
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <SummaryCard
            title="Total Interviews"
            value={data.summary.totalInterviews}
            subtitle={`${data.summary.totalMockInterviews} mock interviews`}
            icon="📝"
            trend={null}
          />
          <SummaryCard
            title="Conversion Rate"
            value={`${data.summary.overallConversionRate}%`}
            subtitle={data.conversionRates.trend === "improving" ? "Improving" : data.conversionRates.trend === "declining" ? "Declining" : "Stable"}
            icon="✨"
            trend={data.conversionRates.trend}
          />
          <SummaryCard
            title="Confidence Level"
            value={`${data.summary.averageConfidence}/100`}
            subtitle={data.confidenceTracking.confidenceTrend}
            icon="💪"
            trend={data.confidenceTracking.confidenceTrend}
          />
          <SummaryCard
            title="Improvement Score"
            value={`${data.summary.improvementScore > 0 ? '+' : ''}${data.summary.improvementScore}%`}
            subtitle="Overall improvement"
            icon="📈"
            trend={parseFloat(data.summary.improvementScore) > 0 ? "improving" : "declining"}
          />
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === "overview" && <OverviewTab data={data} />}
            {activeTab === "conversion" && <ConversionTab data={data.conversionRates} />}
            {activeTab === "trends" && <TrendsTab data={data.improvementTrends} trends={trends} />}
            {activeTab === "formats" && <FormatsTab data={data} />}
            {activeTab === "confidence" && <ConfidenceTab data={data.confidenceTracking} />}
            {activeTab === "coaching" && <CoachingTab data={data.coachingRecommendations} coaching={coaching} />}
            {activeTab === "benchmarks" && <BenchmarksTab data={data.benchmarking} benchmarks={benchmarks} />}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function SummaryCard({ title, value, subtitle, icon, trend }) {
  const trendColors = {
    improving: "text-green-600",
    declining: "text-red-600",
    stable: "text-gray-600"
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        {trend && (
          <span className={`text-xs font-medium ${trendColors[trend] || "text-gray-600"}`}>
            {trend === "improving" ? "↗" : trend === "declining" ? "↘" : "→"}
          </span>
        )}
      </div>
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
    </div>
  );
}

function OverviewTab({ data }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Interview Activity</h4>
            <div className="space-y-2">
              <StatRow label="Total Real Interviews" value={data.summary.totalInterviews} />
              <StatRow label="Total Mock Interviews" value={data.summary.totalMockInterviews} />
              <StatRow label="Total Offers" value={data.conversionRates.totalOffers} />
              <StatRow label="In Progress" value={data.conversionRates.currentInProgress} />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Top Industries</h4>
            {data.industryPerformance.slice(0, 5).map((industry, idx) => (
              <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                <span className="text-sm text-gray-700">{industry.industry}</span>
                <span className="text-sm font-medium text-gray-900">{industry.successRate}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Feedback Themes</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {data.feedbackThemes.commonThemes.slice(0, 10).map((theme, idx) => (
              <div key={idx} className="text-center">
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <p className="text-sm font-medium text-gray-900">{theme.theme}</p>
                  <p className="text-xs text-gray-500 mt-1">{theme.mentions} mentions</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {data.improvementTrends.strengthAreas.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Strengths</h3>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <ul className="space-y-2">
              {data.improvementTrends.strengthAreas.map((strength, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {data.improvementTrends.improvementAreas.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Areas for Growth</h3>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <ul className="space-y-2">
              {data.improvementTrends.improvementAreas.map((area, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="text-blue-600 mr-2">→</span>
                  <span className="text-gray-700">{area}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function ConversionTab({ data }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Conversion</h3>
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6">
          <div className="text-center">
            <p className="text-5xl font-bold text-blue-600">{data.overall}%</p>
            <p className="text-gray-700 mt-2">Interview to Offer Conversion Rate</p>
            <p className="text-sm text-gray-600 mt-1">
              {data.totalOffers} offers from {data.totalInterviews} interviews
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion by Stage</h3>
        <div className="space-y-4">
          <StageCard
            stage="Phone Screen"
            data={data.byStage.phoneScreen}
            color="blue"
          />
          <StageCard
            stage="Technical Interview"
            data={data.byStage.technical}
            color="purple"
          />
          <StageCard
            stage="Behavioral Interview"
            data={data.byStage.behavioral}
            color="green"
          />
          <StageCard
            stage="Final Round"
            data={data.byStage.finalRound}
            color="orange"
          />
        </div>
      </div>

      {data.timeSeriesData.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Conversion Trend</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="space-y-3">
              {data.timeSeriesData.map((month, idx) => (
                <div key={idx} className="flex items-center">
                  <span className="text-sm text-gray-600 w-24">{month.month}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full flex items-center justify-end pr-2"
                      style={{ width: `${month.rate}%` }}
                    >
                      <span className="text-xs text-white font-medium">{month.rate}%</span>
                    </div>
                  </div>
                  <span className="text-sm text-gray-600 ml-4 w-20 text-right">
                    {month.successful}/{month.total}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StageCard({ stage, data, color }) {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 text-blue-600",
    purple: "bg-purple-50 border-purple-200 text-purple-600",
    green: "bg-green-50 border-green-200 text-green-600",
    orange: "bg-orange-50 border-orange-200 text-orange-600"
  };

  return (
    <div className={`border rounded-lg p-4 ${colorClasses[color]}`}>
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-semibold text-gray-900">{stage}</h4>
          <p className="text-sm text-gray-600 mt-1">
            {data.advanced || data.offers} advanced from {data.total} interviews
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold">{data.rate}%</p>
          <p className="text-xs text-gray-600">success rate</p>
        </div>
      </div>
    </div>
  );
}

function TrendsTab({ data, trends }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quarterly Performance</h3>
        <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-4 text-sm font-medium text-gray-700">Quarter</th>
                <th className="text-left py-2 px-4 text-sm font-medium text-gray-700">Real Interviews</th>
                <th className="text-left py-2 px-4 text-sm font-medium text-gray-700">Mock Practice</th>
                <th className="text-left py-2 px-4 text-sm font-medium text-gray-700">Success Rate</th>
                <th className="text-left py-2 px-4 text-sm font-medium text-gray-700">Avg Score</th>
              </tr>
            </thead>
            <tbody>
              {data.quarterlyPerformance.map((quarter, idx) => (
                <tr key={idx} className="border-b border-gray-100 last:border-0">
                  <td className="py-3 px-4 text-sm text-gray-900">Q{quarter.quarter}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{quarter.realInterviews}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{quarter.mockInterviews}</td>
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{quarter.realSuccessRate}%</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{quarter.averageScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Mock Practice Impact</h3>
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-purple-600">{data.mockPracticeImpact.totalMockPractice}</p>
              <p className="text-sm text-gray-700 mt-1">Mock Interviews</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-purple-600">{data.mockPracticeImpact.correlationStrength}</p>
              <p className="text-sm text-gray-700 mt-1">Correlation Strength</p>
            </div>
            <div>
              <p className="text-lg font-medium text-purple-600">{data.mockPracticeImpact.estimatedImpact}</p>
              <p className="text-sm text-gray-700 mt-1">Estimated Impact</p>
            </div>
          </div>
          <p className="text-sm text-gray-700 mt-4 text-center">{data.mockPracticeImpact.recommendation}</p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Improvement</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-center">
            <p className="text-4xl font-bold text-gray-900">
              {data.overallImprovement > 0 ? '+' : ''}{data.overallImprovement}%
            </p>
            <p className="text-sm text-gray-600 mt-2">
              {parseFloat(data.overallImprovement) > 0 
                ? "Your performance is improving over time" 
                : "Focus on consistent practice to improve"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormatsTab({ data }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance by Format</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.formatAnalysis.map((format, idx) => (
            <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">{format.format}</h4>
              <div className="space-y-2">
                <StatRow label="Total Interviews" value={format.total} />
                <StatRow label="Successful" value={format.successful} />
                <StatRow label="Success Rate" value={`${format.successRate}%`} />
                <StatRow label="Avg Preparation" value={format.averagePreparation} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance by Type</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="space-y-3">
            {data.typeAnalysis.map((type, idx) => (
              <div key={idx} className="flex items-center">
                <span className="text-sm text-gray-700 w-40">{type.type}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                  <div
                    className="bg-green-600 h-full flex items-center justify-end pr-2"
                    style={{ width: `${type.successRate}%` }}
                  >
                    <span className="text-xs text-white font-medium">{type.successRate}%</span>
                  </div>
                </div>
                <span className="text-sm text-gray-600 ml-4 w-20 text-right">
                  {type.successful}/{type.total}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {data.industryPerformance.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance by Industry</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="space-y-3">
              {data.industryPerformance.slice(0, 8).map((industry, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{industry.industry}</p>
                    <p className="text-xs text-gray-500">{industry.total} interviews</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{industry.successRate}%</p>
                    <p className="text-xs text-gray-500">{industry.offers} offers</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ConfidenceTab({ data }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Average Confidence</h3>
          <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
            <div className="text-center">
              <p className="text-5xl font-bold text-green-600">{data.averageConfidence}</p>
              <p className="text-gray-700 mt-2">out of 100</p>
              <p className="text-sm text-gray-600 mt-1">Trend: {data.confidenceTrend}</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Average Anxiety</h3>
          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-6">
            <div className="text-center">
              <p className="text-5xl font-bold text-yellow-600">{data.averageAnxiety}</p>
              <p className="text-gray-700 mt-2">out of 100</p>
              <p className="text-sm text-gray-600 mt-1">Trend: {data.anxietyTrend}</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Improvement Progress</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">
              {data.improvementProgress > 0 ? '+' : ''}{data.improvementProgress}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Combined confidence increase and anxiety reduction
            </p>
          </div>
        </div>
      </div>

      {data.timeSeriesData.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Confidence Levels</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="space-y-3">
              {data.timeSeriesData.map((point, idx) => (
                <div key={idx} className="flex items-center">
                  <span className="text-sm text-gray-600 w-32">
                    {new Date(point.date).toLocaleDateString()}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    point.type === "real" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                  }`}>
                    {point.type}
                  </span>
                  <div className="flex-1 mx-4 bg-gray-200 rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-green-400 to-green-600 h-full flex items-center justify-end pr-2"
                      style={{ width: `${point.level}%` }}
                    >
                      <span className="text-xs text-white font-medium">{point.level}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CoachingTab({ data, coaching }) {
  const priorityColors = {
    high: "border-red-200 bg-red-50",
    medium: "border-yellow-200 bg-yellow-50",
    low: "border-blue-200 bg-blue-50"
  };

  const priorityBadges = {
    high: "bg-red-100 text-red-700",
    medium: "bg-yellow-100 text-yellow-700",
    low: "bg-blue-100 text-blue-700"
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2">💡 Personalized Coaching</h3>
        <p className="text-sm text-gray-700">
          Based on your interview performance, we've identified key areas for improvement and created
          personalized action plans to help you succeed.
        </p>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>Great job! No major areas for improvement detected.</p>
          <p className="text-sm mt-2">Keep up the excellent work!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((rec, idx) => (
            <div key={idx} className={`border rounded-lg p-6 ${priorityColors[rec.priority]}`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-gray-900 text-lg">{rec.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{rec.category}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${priorityBadges[rec.priority]}`}>
                  {rec.priority.toUpperCase()}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-1">Issue:</p>
                  <p className="text-sm text-gray-700">{rec.issue}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-900 mb-1">Recommendation:</p>
                  <p className="text-sm text-gray-700">{rec.recommendation}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-900 mb-2">Action Items:</p>
                  <ul className="space-y-1">
                    {rec.actionItems.map((item, itemIdx) => (
                      <li key={itemIdx} className="flex items-start text-sm text-gray-700">
                        <span className="text-green-600 mr-2">→</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BenchmarksTab({ data, benchmarks }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Performance Ranking</h3>
        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-4xl font-bold text-yellow-600">{data.overallRanking}</p>
          <p className="text-gray-700 mt-2">Compared to industry benchmarks</p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance vs. Industry Benchmarks</h3>
        <div className="space-y-4">
          <BenchmarkCard
            title="Overall Conversion Rate"
            userValue={data.comparison.overallConversion.user}
            benchmark={data.comparison.overallConversion.benchmark}
            difference={data.comparison.overallConversion.difference}
            status={data.comparison.overallConversion.status}
            unit="%"
          />
          <BenchmarkCard
            title="Phone Screen Pass Rate"
            userValue={data.comparison.phoneScreen.user}
            benchmark={data.comparison.phoneScreen.benchmark}
            difference={data.comparison.phoneScreen.difference}
            status={data.comparison.phoneScreen.status}
            unit="%"
          />
          <BenchmarkCard
            title="Technical Interview Pass Rate"
            userValue={data.comparison.technical.user}
            benchmark={data.comparison.technical.benchmark}
            difference={data.comparison.technical.difference}
            status={data.comparison.technical.status}
            unit="%"
          />
          <BenchmarkCard
            title="Final Round Offer Rate"
            userValue={data.comparison.finalRound.user}
            benchmark={data.comparison.finalRound.benchmark}
            difference={data.comparison.finalRound.difference}
            status={data.comparison.finalRound.status}
            unit="%"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Strengths</h3>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            {data.strengthAreas.length > 0 ? (
              <ul className="space-y-2">
                {data.strengthAreas.map((area, idx) => (
                  <li key={idx} className="flex items-center text-sm text-gray-700">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>{area.replace(/([A-Z])/g, ' $1').trim()}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-600">Work on improving your performance to exceed benchmarks</p>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Focus Areas</h3>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            {data.improvementAreas.length > 0 ? (
              <ul className="space-y-2">
                {data.improvementAreas.map((area, idx) => (
                  <li key={idx} className="flex items-center text-sm text-gray-700">
                    <span className="text-blue-600 mr-2">→</span>
                    <span>{area.replace(/([A-Z])/g, ' $1').trim()}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-600">Excellent! You're meeting or exceeding all benchmarks</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BenchmarkCard({ title, userValue, benchmark, difference, status, unit }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <h4 className="font-medium text-gray-900 mb-3">{title}</h4>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-baseline">
            <span className="text-2xl font-bold text-gray-900">{userValue}{unit}</span>
            <span className="text-sm text-gray-500 ml-2">You</span>
          </div>
          <div className="flex items-baseline mt-2">
            <span className="text-lg text-gray-600">{benchmark}{unit}</span>
            <span className="text-xs text-gray-500 ml-2">Benchmark</span>
          </div>
        </div>
        <div className={`text-right ${status === "above" ? "text-green-600" : "text-red-600"}`}>
          <p className="text-2xl font-bold">
            {parseFloat(difference) > 0 ? '+' : ''}{difference}{unit}
          </p>
          <p className="text-xs font-medium mt-1">
            {status === "above" ? "Above" : "Below"} avg
          </p>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}
