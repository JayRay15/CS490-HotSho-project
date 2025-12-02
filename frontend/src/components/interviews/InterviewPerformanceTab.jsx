import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import {
  getInterviewPerformanceAnalytics,
  getImprovementTrends,
  getCoachingRecommendations,
  getPerformanceBenchmarks
} from "../../api/interviewPerformance";

export default function InterviewPerformanceTab() {
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
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading performance analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
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
      <div className="flex items-center justify-center py-16">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Interview Data Yet</h3>
          <p className="text-gray-600 mb-6">
            Start tracking your interviews to see comprehensive performance analytics and coaching insights.
          </p>
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
    <div>
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

      {/* Sub-Tabs */}
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
          <span className={`text-sm font-medium ${trendColors[trend] || trendColors.stable}`}>
            {trend === "improving" ? "↑" : trend === "declining" ? "↓" : "→"}
          </span>
        )}
      </div>
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
    </div>
  );
}

function OverviewTab({ data }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stage Performance */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-4">Stage Performance</h4>
          <div className="space-y-3">
            {Object.entries(data.stagePerformance || {}).map(([stage, perf]) => (
              <div key={stage} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 capitalize">{stage.replace(/_/g, " ")}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${perf.successRate || 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900">{perf.successRate || 0}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Question Performance */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-4">Question Performance</h4>
          <div className="space-y-3">
            {Object.entries(data.questionTypePerformance || {}).map(([type, perf]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 capitalize">{type.replace(/_/g, " ")}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${perf.averageScore || 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900">{perf.averageScore || 0}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Insights */}
      {data.insights && data.insights.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-3">💡 Key Insights</h4>
          <ul className="space-y-2">
            {data.insights.map((insight, idx) => (
              <li key={idx} className="text-sm text-blue-800 flex items-start gap-2">
                <span>•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ConversionTab({ data }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-500">Applications → Phone Screen</p>
          <p className="text-2xl font-bold text-gray-900">{data.applicationToPhoneScreen || 0}%</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-500">Phone → On-site</p>
          <p className="text-2xl font-bold text-gray-900">{data.phoneToOnsite || 0}%</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-500">On-site → Offer</p>
          <p className="text-2xl font-bold text-gray-900">{data.onsiteToOffer || 0}%</p>
        </div>
      </div>

      {data.byCompanyType && Object.keys(data.byCompanyType).length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-4">By Company Type</h4>
          <div className="space-y-3">
            {Object.entries(data.byCompanyType).map(([type, rate]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 capitalize">{type}</span>
                <span className="text-sm font-medium text-gray-900">{rate}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TrendsTab({ data, trends }) {
  const trendData = trends || data;
  
  return (
    <div className="space-y-6">
      {trendData?.monthlyProgress && trendData.monthlyProgress.length > 0 ? (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-4">Monthly Progress</h4>
          <div className="space-y-3">
            {trendData.monthlyProgress.map((month, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{month.month}</span>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">{month.interviews} interviews</span>
                  <span className="text-sm font-medium text-gray-900">{month.successRate}% success</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>No trend data available yet. Complete more interviews to see your progress over time.</p>
        </div>
      )}
    </div>
  );
}

function FormatsTab({ data }) {
  return (
    <div className="space-y-6">
      {data.formatPerformance && Object.keys(data.formatPerformance).length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(data.formatPerformance).map(([format, perf]) => (
            <div key={format} className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 capitalize mb-2">{format.replace(/_/g, " ")}</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Success Rate</span>
                  <span className="font-medium">{perf.successRate || 0}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Avg Score</span>
                  <span className="font-medium">{perf.averageScore || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Count</span>
                  <span className="font-medium">{perf.count || 0}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>No format data available yet.</p>
        </div>
      )}
    </div>
  );
}

function ConfidenceTab({ data }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-500">Current Confidence</p>
          <p className="text-3xl font-bold text-gray-900">{data.currentConfidence || 0}/100</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-500">Trend</p>
          <p className={`text-xl font-bold capitalize ${
            data.confidenceTrend === "improving" ? "text-green-600" :
            data.confidenceTrend === "declining" ? "text-red-600" : "text-gray-600"
          }`}>
            {data.confidenceTrend || "Stable"}
          </p>
        </div>
      </div>

      {data.confidenceByArea && Object.keys(data.confidenceByArea).length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-4">Confidence by Area</h4>
          <div className="space-y-3">
            {Object.entries(data.confidenceByArea).map(([area, confidence]) => (
              <div key={area} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 capitalize">{area.replace(/_/g, " ")}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: `${confidence}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900">{confidence}/100</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CoachingTab({ data, coaching }) {
  const coachingData = coaching || data;

  return (
    <div className="space-y-6">
      {coachingData?.recommendations && coachingData.recommendations.length > 0 ? (
        <div className="space-y-4">
          {coachingData.recommendations.map((rec, idx) => (
            <div key={idx} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🎯</span>
                <div>
                  <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                  {rec.actionItems && rec.actionItems.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {rec.actionItems.map((item, i) => (
                        <li key={i} className="text-sm text-gray-500 flex items-center gap-2">
                          <span>•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>No coaching recommendations available yet. Complete more interviews to get personalized advice.</p>
        </div>
      )}
    </div>
  );
}

function BenchmarksTab({ data, benchmarks }) {
  const benchmarkData = benchmarks || data;

  return (
    <div className="space-y-6">
      {benchmarkData?.comparisons && Object.keys(benchmarkData.comparisons).length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(benchmarkData.comparisons).map(([metric, comparison]) => (
            <div key={metric} className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 capitalize mb-3">{metric.replace(/_/g, " ")}</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Your Score</span>
                  <span className="font-medium">{comparison.yourScore}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Average</span>
                  <span className="font-medium">{comparison.average}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Percentile</span>
                  <span className={`font-medium ${comparison.percentile >= 50 ? "text-green-600" : "text-orange-600"}`}>
                    Top {100 - comparison.percentile}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>No benchmark data available yet. Complete more interviews to see how you compare.</p>
        </div>
      )}
    </div>
  );
}
