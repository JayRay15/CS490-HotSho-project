import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import Card from "../Card";
import Button from "../Button";
import { setAuthToken } from "../../api/axios";
import { getInterviewPerformanceAnalytics, generateTestData, clearTestData } from "../../api/interviewAnalytics";

export default function InterviewAnalyticsTab({ onDataChange }) {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState("overview");
  const [generatingData, setGeneratingData] = useState(false);
  const [clearingData, setClearingData] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      setAuthToken(token);
      const response = await getInterviewPerformanceAnalytics();
      setAnalytics(response.data?.data?.analytics || response.data?.analytics);
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTestData = async () => {
    if (!confirm('This will clear existing data and generate 25 test interviews. Continue?')) {
      return;
    }
    
    try {
      setGeneratingData(true);
      const token = await getToken();
      setAuthToken(token);
      await generateTestData();
      await loadAnalytics();
      if (onDataChange) onDataChange();
      alert('✅ Test data generated successfully! Explore the tabs to see your analytics.');
    } catch (error) {
      console.error("Error generating test data:", error);
      alert('Failed to generate test data. Check console for details.');
    } finally {
      setGeneratingData(false);
    }
  };

  const handleClearTestData = async () => {
    if (!confirm('This will delete ALL your interview data. Are you sure?')) {
      return;
    }
    
    try {
      setClearingData(true);
      const token = await getToken();
      setAuthToken(token);
      await clearTestData();
      await loadAnalytics();
      if (onDataChange) onDataChange();
      alert('✅ All data cleared successfully!');
    } catch (error) {
      console.error("Error clearing test data:", error);
      alert('Failed to clear data. Check console for details.');
    } finally {
      setClearingData(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!analytics || analytics.overview?.totalInterviews === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {!analytics ? "Unable to Load Analytics" : "No Interview Data Yet"}
          </h3>
          <p className="text-gray-600 mb-6">
            {!analytics 
              ? "There was an error loading your interview analytics."
              : "Get started by adding interview data or generating test data to explore the analytics."}
          </p>
          <div className="flex gap-3 justify-center">
            {!analytics && <Button onClick={loadAnalytics}>Try Again</Button>}
            <Button 
              onClick={handleGenerateTestData}
              disabled={generatingData}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {generatingData ? "Generating..." : "🎲 Generate Test Data"}
            </Button>
          </div>
          <div className="mt-6 p-4 bg-blue-50 rounded-lg text-left max-w-2xl mx-auto">
            <p className="text-sm text-blue-800 font-semibold mb-2">
              🎲 What happens when you generate test data?
            </p>
            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li>Creates 25 realistic interviews across major companies</li>
              <li>18 job postings in various industries</li>
              <li>8 mock interview sessions</li>
              <li>Mix of completed and scheduled interviews</li>
              <li>Realistic outcomes, ratings, and performance data</li>
              <li>Full analytics across all tabs</li>
            </ul>
            <p className="text-xs text-blue-600 mt-3">
              ⚠️ This will clear any existing interview data you have.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const subTabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "conversion", label: "Conversion Rates", icon: "🎯" },
    { id: "performance", label: "Performance", icon: "📈" },
    { id: "insights", label: "Insights", icon: "💡" },
    { id: "recommendations", label: "Recommendations", icon: "🎓" },
  ];

  return (
    <div>
      {/* Header Actions */}
      <div className="flex justify-end gap-2 mb-4">
        <Button 
          onClick={handleGenerateTestData}
          disabled={generatingData}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          {generatingData ? "Generating..." : "🎲 Generate Test Data"}
        </Button>
        <Button 
          onClick={handleClearTestData}
          disabled={clearingData}
          variant="secondary"
          className="text-red-600 border-red-300 hover:bg-red-50"
        >
          {clearingData ? "Clearing..." : "🗑️ Clear Data"}
        </Button>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex space-x-6 overflow-x-auto">
          {subTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`pb-3 px-1 font-medium text-sm whitespace-nowrap ${
                activeSubTab === tab.id
                  ? "border-b-2 border-primary text-primary"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeSubTab === "overview" && <OverviewTab analytics={analytics} />}
      {activeSubTab === "conversion" && <ConversionTab analytics={analytics} />}
      {activeSubTab === "performance" && <PerformanceTab analytics={analytics} />}
      {activeSubTab === "insights" && <InsightsTab analytics={analytics} />}
      {activeSubTab === "recommendations" && <RecommendationsTab analytics={analytics} />}
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ analytics }) {
  const { overview, conversionRates, improvementTracking } = analytics;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard icon="📅" label="Total Interviews" value={overview.totalInterviews} color="blue" />
        <MetricCard icon="✅" label="Completed" value={overview.completedInterviews} color="green" />
        <MetricCard icon="🎯" label="Success Rate" value={`${conversionRates.successRate}%`} color="purple" />
        <MetricCard icon="⭐" label="Avg Rating" value={overview.averageRating || "—"} color="yellow" />
      </div>

      {/* Conversion Funnel */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Interview Funnel</h3>
        <div className="space-y-3">
          <FunnelStage label="Scheduled" count={conversionRates.funnel.scheduled.count} percentage={conversionRates.funnel.scheduled.percentage} color="blue" />
          <FunnelStage label="Completed" count={conversionRates.funnel.completed.count} percentage={conversionRates.funnel.completed.percentage} color="green" />
          <FunnelStage label="Successful" count={conversionRates.funnel.successful.count} percentage={conversionRates.funnel.successful.percentage} color="purple" />
          <FunnelStage label="Offers" count={conversionRates.funnel.offers.count} percentage={conversionRates.funnel.offers.percentage} color="yellow" />
        </div>
      </Card>

      {/* Improvement Trend */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trend</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">{improvementTracking.recentPerformance.period}</p>
            <p className="text-2xl font-bold text-gray-900">{improvementTracking.recentPerformance.successRate}%</p>
            <p className="text-xs text-gray-500">{improvementTracking.recentPerformance.count} interviews</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Trend</p>
            <div className="flex items-center space-x-2">
              {improvementTracking.trend === "improving" && <span className="text-2xl">📈</span>}
              {improvementTracking.trend === "declining" && <span className="text-2xl">📉</span>}
              {improvementTracking.trend === "stable" && <span className="text-2xl">➡️</span>}
              <p className="text-lg font-semibold capitalize">{improvementTracking.trend}</p>
            </div>
            <p className="text-xs text-gray-500">{improvementTracking.improvementScore > 0 ? "+" : ""}{improvementTracking.improvementScore} points</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Practice Impact</p>
            <p className="text-lg font-semibold text-gray-900">{improvementTracking.mockSessionsCompleted} mock{improvementTracking.mockSessionsCompleted !== 1 ? "s" : ""}</p>
            <p className="text-xs text-gray-500">{improvementTracking.practiceImpact}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Conversion Rates Tab
function ConversionTab({ analytics }) {
  const { conversionRates, benchmarks } = analytics;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Rates</h3>
          <div className="space-y-4">
            <RateRow label="Completion Rate" value={conversionRates.completionRate} description={`${conversionRates.completed} of ${conversionRates.scheduled} scheduled`} />
            <RateRow label="Success Rate" value={conversionRates.successRate} description={`${conversionRates.successful} successful outcomes`} />
            <RateRow label="Offer Rate" value={conversionRates.offerRate} description={`${conversionRates.offers} offers received`} />
            <RateRow label="Progression Rate" value={conversionRates.progressionRate} description="Moved to next interview round" />
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Industry Benchmarks</h3>
          <div className="space-y-4">
            <BenchmarkRow label="Success Rate" userValue={benchmarks.user.successRate} industryValue={benchmarks.industry.successRate} comparison={benchmarks.comparison.successRate} />
            <BenchmarkRow label="Offer Rate" userValue={benchmarks.user.offerRate} industryValue={benchmarks.industry.interviewToOfferRate} comparison={benchmarks.comparison.offerRate} />
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Industry Standards</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg Interviews per Offer:</span>
                  <span className="font-semibold">{benchmarks.industry.avgInterviewsPerOffer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg Prep Time:</span>
                  <span className="font-semibold">{benchmarks.industry.avgPrepTime} hours</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion Funnel Visualization</h3>
        <div className="space-y-2">
          <FunnelBar label="Scheduled" count={conversionRates.funnel.scheduled.count} percentage={100} color="bg-blue-500" />
          <FunnelBar label="Completed" count={conversionRates.funnel.completed.count} percentage={conversionRates.funnel.completed.percentage} color="bg-green-500" />
          <FunnelBar label="Successful" count={conversionRates.funnel.successful.count} percentage={conversionRates.funnel.successful.percentage} color="bg-purple-500" />
          <FunnelBar label="Offers" count={conversionRates.funnel.offers.count} percentage={conversionRates.funnel.offers.percentage} color="bg-yellow-500" />
        </div>
      </Card>
    </div>
  );
}

// Performance Tab
function PerformanceTab({ analytics }) {
  const { strengthsWeaknesses, formatComparison, companyTypeAnalysis } = analytics;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-green-700 mb-4">💪 Your Strengths</h3>
          {strengthsWeaknesses.strongest.length > 0 ? (
            <div className="space-y-3">
              {strengthsWeaknesses.strongest.map((item, idx) => (
                <PerformanceItem key={idx} type={item.interviewType} successRate={item.successRate} total={item.total} avgRating={item.avgRating} isStrength={true} />
              ))}
            </div>
          ) : (
            <p className="text-gray-600">Complete more interviews to identify strengths</p>
          )}
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-orange-700 mb-4">🎯 Areas to Improve</h3>
          {strengthsWeaknesses.weakest.length > 0 ? (
            <div className="space-y-3">
              {strengthsWeaknesses.weakest.map((item, idx) => (
                <PerformanceItem key={idx} type={item.interviewType} successRate={item.successRate} total={item.total} avgRating={item.avgRating} isStrength={false} />
              ))}
            </div>
          ) : (
            <p className="text-gray-600">Complete more interviews for analysis</p>
          )}
        </Card>
      </div>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance by Interview Format</h3>
        {formatComparison.byFormat.length > 0 ? (
          <div className="space-y-3">
            {formatComparison.byFormat.map((format, idx) => (
              <div key={idx} className="border-b border-gray-200 pb-3 last:border-0">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-medium text-gray-900">{format.format}</span>
                    <span className="ml-2 text-sm text-gray-500">({format.total} interview{format.total !== 1 ? "s" : ""})</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">{format.successRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${format.successRate}%` }} />
                </div>
                <p className="text-xs text-gray-500 mt-1">Avg duration: {format.avgDuration} minutes</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No interview format data available</p>
        )}
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance by Industry</h3>
        {companyTypeAnalysis.byIndustry.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Industry</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Interviews</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Success Rate</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Offer Rate</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Rating</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {companyTypeAnalysis.byIndustry.map((industry, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{industry.industry}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{industry.total}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`font-semibold ${industry.successRate >= 50 ? 'text-green-600' : industry.successRate >= 30 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {industry.successRate}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{industry.offerRate}%</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{industry.avgRating || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600">No industry data available</p>
        )}
      </Card>
    </div>
  );
}

// Insights Tab
function InsightsTab({ analytics }) {
  const { insights, improvementTracking } = analytics;

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Strategic Insights</h3>
        {insights.length > 0 ? (
          <div className="space-y-4">
            {insights.map((insight, idx) => (
              <div key={idx} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">💡</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-900 mb-1">{insight.category}</p>
                    <p className="text-sm text-blue-800 mb-2">{insight.insight}</p>
                    <p className="text-sm text-blue-700"><strong>Recommendation:</strong> {insight.recommendation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">Complete more interviews to generate strategic insights</p>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Performance</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Period</p>
              <p className="text-lg font-semibold text-gray-900">{improvementTracking.recentPerformance.period}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Interviews Completed</p>
              <p className="text-lg font-semibold text-gray-900">{improvementTracking.recentPerformance.count}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-green-600">{improvementTracking.recentPerformance.successRate}%</p>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Historical Performance</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Period</p>
              <p className="text-lg font-semibold text-gray-900">{improvementTracking.olderPerformance.period}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Interviews Completed</p>
              <p className="text-lg font-semibold text-gray-900">{improvementTracking.olderPerformance.count}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-gray-600">{improvementTracking.olderPerformance.successRate}%</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Practice & Improvement</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-3xl font-bold text-purple-600">{improvementTracking.mockSessionsCompleted}</p>
            <p className="text-sm text-gray-600 mt-1">Mock Interviews</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-3xl font-bold text-blue-600 capitalize">{improvementTracking.trend}</p>
            <p className="text-sm text-gray-600 mt-1">Performance Trend</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className={`text-3xl font-bold ${improvementTracking.improvementScore > 0 ? 'text-green-600' : improvementTracking.improvementScore < 0 ? 'text-red-600' : 'text-gray-600'}`}>
              {improvementTracking.improvementScore > 0 ? '+' : ''}{improvementTracking.improvementScore}%
            </p>
            <p className="text-sm text-gray-600 mt-1">Change in Success Rate</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Recommendations Tab
function RecommendationsTab({ analytics }) {
  const { recommendations } = analytics;

  const priorityColors = {
    High: "bg-red-50 border-red-200",
    Medium: "bg-yellow-50 border-yellow-200",
    Low: "bg-blue-50 border-blue-200",
  };

  const priorityBadges = {
    High: "bg-red-100 text-red-800",
    Medium: "bg-yellow-100 text-yellow-800",
    Low: "bg-blue-100 text-blue-800",
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <div className="flex items-start space-x-3">
          <span className="text-3xl">🎓</span>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Personalized Recommendations</h3>
            <p className="text-gray-700">Based on your interview performance data, here are targeted recommendations to improve your success rate.</p>
          </div>
        </div>
      </Card>

      {recommendations.length > 0 ? (
        <div className="space-y-4">
          {recommendations.map((rec, idx) => (
            <Card key={idx} className={`border ${priorityColors[rec.priority]}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${priorityBadges[rec.priority]}`}>{rec.priority} Priority</span>
                    <span className="text-xs text-gray-500">{rec.category}</span>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-1">{rec.title}</h4>
                  <p className="text-sm text-gray-700 mb-3">{rec.description}</p>
                </div>
              </div>
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-900 mb-2">Action Steps:</p>
                <ul className="space-y-1">
                  {rec.actions.map((action, actionIdx) => (
                    <li key={actionIdx} className="text-sm text-gray-700 flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white bg-opacity-60 rounded p-2 text-xs">
                <span className="font-medium text-gray-700">Expected Impact:</span>{" "}
                <span className="text-gray-600">{rec.expectedImpact}</span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Recommendations Yet</h3>
            <p className="text-gray-600">Complete more interviews to receive personalized recommendations.</p>
          </div>
        </Card>
      )}
    </div>
  );
}

// Reusable Components
function MetricCard({ icon, label, value, color }) {
  const colorClasses = { blue: "text-blue-600", green: "text-green-600", purple: "text-purple-600", yellow: "text-yellow-600" };
  return (
    <Card>
      <div className="flex items-center space-x-3">
        <div className="text-3xl">{icon}</div>
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className={`text-2xl font-bold ${colorClasses[color]}`}>{value}</p>
        </div>
      </div>
    </Card>
  );
}

function FunnelStage({ label, count, percentage, color }) {
  const colorClasses = { blue: "bg-blue-500", green: "bg-green-500", purple: "bg-purple-500", yellow: "bg-yellow-500" };
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm text-gray-600">{count} ({percentage}%)</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div className={`h-3 rounded-full ${colorClasses[color]}`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function RateRow({ label, value, description }) {
  return (
    <div className="border-b border-gray-200 pb-3 last:border-0">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-xl font-bold text-gray-900">{value}%</span>
      </div>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
  );
}

function BenchmarkRow({ label, userValue, industryValue, comparison }) {
  return (
    <div className="border-b border-gray-200 pb-3 last:border-0">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <div className="text-right">
          <p className="text-lg font-bold text-gray-900">{userValue}%</p>
          <p className="text-xs text-gray-500">vs {industryValue}% industry</p>
        </div>
      </div>
      <p className={`text-xs font-medium ${comparison.includes('above') ? 'text-green-600' : comparison.includes('below') ? 'text-red-600' : 'text-gray-600'}`}>
        You are {comparison} industry average
      </p>
    </div>
  );
}

function FunnelBar({ label, count, percentage, color }) {
  return (
    <div className="flex items-center space-x-3">
      <div className="w-24 text-sm font-medium text-gray-700">{label}</div>
      <div className="flex-1">
        <div className="w-full bg-gray-200 rounded-full h-8 relative">
          <div className={`h-8 rounded-full ${color} transition-all duration-500`} style={{ width: `${percentage}%` }} />
          <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-gray-900">{count} ({percentage}%)</div>
        </div>
      </div>
    </div>
  );
}

function PerformanceItem({ type, successRate, total, avgRating, isStrength }) {
  return (
    <div className={`p-3 rounded-lg ${isStrength ? 'bg-green-50' : 'bg-orange-50'}`}>
      <div className="flex justify-between items-start mb-1">
        <span className="font-medium text-gray-900">{type}</span>
        <span className={`text-lg font-bold ${isStrength ? 'text-green-700' : 'text-orange-700'}`}>{successRate}%</span>
      </div>
      <div className="flex justify-between text-xs text-gray-600">
        <span>{total} interview{total !== 1 ? 's' : ''}</span>
        {avgRating && <span>Avg rating: {avgRating}/5</span>}
      </div>
    </div>
  );
}
