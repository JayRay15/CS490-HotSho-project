import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import Card from "../../components/Card";
import Button from "../../components/Button";
import LoadingSpinner from "../../components/LoadingSpinner";
import {
  getSuccessAnalysis,
  getSuccessPatterns,
  getOptimizationRecommendations,
  getSuccessPrediction,
  getPatternEvolution,
} from "../../api/applicationSuccess";
import { setAuthToken } from "../../api/axios";

// ============================================================================
// UC-097: Application Success Rate Analysis
// UC-105: Success Pattern Recognition
// ============================================================================

export default function ApplicationSuccessAnalysis() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [patterns, setPatterns] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [evolution, setEvolution] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [evolutionLoading, setEvolutionLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      setAuthToken(token);

      const [analysisData, patternsData, recommendationsData] = await Promise.all([
        getSuccessAnalysis(),
        getSuccessPatterns(),
        getOptimizationRecommendations(),
      ]);

      setAnalysis(analysisData.data);
      setPatterns(patternsData.data);
      setRecommendations(recommendationsData.data);
    } catch (err) {
      console.error("Failed to load success analysis:", err);
      setError(err.response?.data?.message || "Failed to load analysis");
    } finally {
      setLoading(false);
    }
  };

  const [predictionError, setPredictionError] = useState(null);

  const loadPrediction = async (params = {}) => {
    try {
      setPredictionLoading(true);
      setPredictionError(null);
      const token = await getToken();
      setAuthToken(token);
      const predictionData = await getSuccessPrediction(params);
      console.log("Prediction response:", predictionData);
      // The API returns { data: { hasData, prediction, basedOn } }
      setPrediction(predictionData.data || predictionData);
    } catch (err) {
      console.error("Failed to load prediction:", err);
      setPredictionError(err.response?.data?.message || "Failed to load prediction");
    } finally {
      setPredictionLoading(false);
    }
  };

  const loadEvolution = async () => {
    try {
      setEvolutionLoading(true);
      const token = await getToken();
      setAuthToken(token);
      const evolutionData = await getPatternEvolution();
      console.log("Evolution response:", evolutionData);
      setEvolution(evolutionData.data || evolutionData);
    } catch (err) {
      console.error("Failed to load evolution:", err);
    } finally {
      setEvolutionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="text-center py-12">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Analysis</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadData}>Try Again</Button>
        </Card>
      </div>
    );
  }

  if (!analysis?.hasData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Application Data Yet</h2>
          <p className="text-gray-600 mb-4">
            Start tracking your job applications to see success analysis and optimization recommendations.
          </p>
          <Button onClick={() => window.location.href = "/jobs"}>
            Add Your First Application
          </Button>
        </Card>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "industry", label: "Industry Analysis", icon: "🏢" },
    { id: "patterns", label: "Success Patterns", icon: "✨" },
    { id: "prediction", label: "Prediction", icon: "🔮" },
    { id: "evolution", label: "Strategy Evolution", icon: "📈" },
    { id: "materials", label: "Materials Impact", icon: "📄" },
    { id: "timing", label: "Timing Analysis", icon: "⏰" },
    { id: "recommendations", label: "Recommendations", icon: "💡" },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Application Success Analysis</h1>
          <p className="text-gray-600 mt-1">
            Understand what drives your application success and optimize your approach
          </p>
        </div>
        <Button variant="outline" onClick={loadData} className="mt-4 md:mt-0">
          🔄 Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          title="Total Applications"
          value={analysis.summary.totalApplications}
          icon="📝"
        />
        <SummaryCard
          title="Success Rate"
          value={`${analysis.summary.overallSuccessRate}%`}
          subtitle={analysis.summary.successfulApplications + " successful"}
          icon="🎯"
          color="green"
        />
        <SummaryCard
          title="Interview Rate"
          value={`${analysis.summary.interviewRate}%`}
          icon="🎤"
          color="blue"
        />
        <SummaryCard
          title="Offer Rate"
          value={`${analysis.summary.offerRate}%`}
          icon="🏆"
          color="purple"
        />
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-6 border-b pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium transition ${activeTab === tab.id
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === "overview" && <OverviewTab analysis={analysis} />}
        {activeTab === "industry" && <IndustryTab analysis={analysis} />}
        {activeTab === "patterns" && <PatternsTab patterns={patterns} analysis={analysis} />}
        {activeTab === "prediction" && (
          <PredictionTab
            prediction={prediction}
            onLoadPrediction={loadPrediction}
            loading={predictionLoading}
            error={predictionError}
            analysis={analysis}
          />
        )}
        {activeTab === "evolution" && (
          <EvolutionTab
            evolution={evolution}
            onLoadEvolution={loadEvolution}
            loading={evolutionLoading}
            analysis={analysis}
          />
        )}
        {activeTab === "materials" && <MaterialsTab analysis={analysis} />}
        {activeTab === "timing" && <TimingTab analysis={analysis} />}
        {activeTab === "recommendations" && <RecommendationsTab analysis={analysis} recommendations={recommendations} />}
      </div>
    </div>
  );
}

// ============================================================================
// Summary Card Component
// ============================================================================
function SummaryCard({ title, value, subtitle, icon, color = "gray" }) {
  const colorClasses = {
    gray: "bg-gray-50 text-gray-900",
    green: "bg-green-50 text-green-700",
    blue: "bg-blue-50 text-blue-700",
    purple: "bg-purple-50 text-purple-700",
  };

  return (
    <Card className={`${colorClasses[color]} text-center`}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-gray-600">{title}</div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
    </Card>
  );
}

// ============================================================================
// Overview Tab
// ============================================================================
function OverviewTab({ analysis }) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Quick Stats */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">📈 Performance Overview</h3>
        <div className="space-y-4">
          <StatBar
            label="Overall Success Rate"
            value={analysis.summary.overallSuccessRate}
            benchmark={15}
            color="green"
          />
          <StatBar
            label="Interview Rate"
            value={analysis.summary.interviewRate}
            benchmark={10}
            color="blue"
          />
          <StatBar
            label="Offer Rate"
            value={analysis.summary.offerRate}
            benchmark={5}
            color="purple"
          />
        </div>
      </Card>

      {/* Top Recommendations */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">🎯 Top Priorities</h3>
        {analysis.recommendations.length > 0 ? (
          <div className="space-y-3">
            {analysis.recommendations.slice(0, 3).map((rec, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border-l-4 ${rec.priority === "high"
                    ? "bg-red-50 border-red-500"
                    : rec.priority === "medium"
                      ? "bg-yellow-50 border-yellow-500"
                      : "bg-blue-50 border-blue-500"
                  }`}
              >
                <div className="font-medium">{rec.title}</div>
                <div className="text-sm text-gray-600">{rec.description}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No specific recommendations yet. Keep applying!</p>
        )}
      </Card>

      {/* Best Performers */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">🌟 Your Strengths</h3>
        <div className="space-y-3">
          {analysis.industryAnalysis.topPerforming.slice(0, 3).map((item, idx) => (
            <div key={idx} className="flex justify-between items-center p-2 bg-green-50 rounded">
              <span>{item.industry}</span>
              <span className="font-bold text-green-600">{item.successRate}%</span>
            </div>
          ))}
          {analysis.industryAnalysis.topPerforming.length === 0 && (
            <p className="text-gray-500">Apply to more roles to identify your strengths</p>
          )}
        </div>
      </Card>

      {/* Areas for Improvement */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">📉 Areas to Improve</h3>
        <div className="space-y-3">
          {analysis.industryAnalysis.needsImprovement.slice(0, 3).map((item, idx) => (
            <div key={idx} className="flex justify-between items-center p-2 bg-red-50 rounded">
              <span>{item.industry}</span>
              <span className="font-bold text-red-600">{item.successRate}%</span>
            </div>
          ))}
          {analysis.industryAnalysis.needsImprovement.length === 0 && (
            <p className="text-gray-500 text-center">Great job! No significant underperformance detected.</p>
          )}
        </div>
      </Card>
    </div>
  );
}

// ============================================================================
// Industry Tab
// ============================================================================
function IndustryTab({ analysis }) {
  const { industryAnalysis, companySizeAnalysis, roleTypeAnalysis, methodAnalysis } = analysis;

  return (
    <div className="space-y-6">
      {/* Industry Analysis */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">🏢 Success by Industry</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b">
                <th className="pb-2">Industry</th>
                <th className="pb-2 text-center">Applications</th>
                <th className="pb-2 text-center">Successful</th>
                <th className="pb-2 text-center">Success Rate</th>
                <th className="pb-2 text-center">vs Average</th>
                <th className="pb-2 text-center">Significance</th>
              </tr>
            </thead>
            <tbody>
              {industryAnalysis.byIndustry.map((item, idx) => (
                <tr key={idx} className="border-b last:border-0">
                  <td className="py-3 font-medium">{item.industry}</td>
                  <td className="py-3 text-center">{item.total}</td>
                  <td className="py-3 text-center">{item.successful}</td>
                  <td className="py-3 text-center">
                    <span className={`font-bold ${item.successRate >= 20 ? "text-green-600" : "text-gray-600"}`}>
                      {item.successRate}%
                    </span>
                  </td>
                  <td className="py-3 text-center">
                    <span className={item.vsAverage >= 0 ? "text-green-600" : "text-red-600"}>
                      {item.vsAverage >= 0 ? "+" : ""}{item.vsAverage}%
                    </span>
                  </td>
                  <td className="py-3 text-center">
                    <SignificanceBadge significance={item.statisticalSignificance} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Company Size Analysis */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">📏 Success by Company Size</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {companySizeAnalysis.bySize.map((item, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-lg text-center ${item.vsAverage > 0 ? "bg-green-50" : item.vsAverage < 0 ? "bg-red-50" : "bg-gray-50"
                }`}
            >
              <div className="text-sm text-gray-600 mb-1">{item.companySize}</div>
              <div className="text-2xl font-bold">{item.successRate}%</div>
              <div className="text-xs text-gray-500">{item.total} applications</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Role Type Analysis */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold mb-4">💼 Success by Role Type</h3>
          <div className="space-y-3">
            {roleTypeAnalysis.byRoleType.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span>{item.roleType}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${Math.min(item.successRate, 100)}%` }}
                    />
                  </div>
                  <span className="font-bold w-12 text-right">{item.successRate}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold mb-4">🏠 Success by Work Mode</h3>
          <div className="space-y-3">
            {methodAnalysis.byMethod.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  {item.method === "Remote" ? "🏠" : item.method === "Hybrid" ? "🔄" : "🏢"}
                  {item.method}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: `${Math.min(item.successRate, 100)}%` }}
                    />
                  </div>
                  <span className="font-bold w-12 text-right">{item.successRate}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ============================================================================
// Patterns Tab - UC-105 Success Pattern Recognition
// ============================================================================
function PatternsTab({ patterns, analysis }) {
  // Pattern type to icon mapping
  const patternIcons = {
    "Industry Strength": "🏢",
    "Optimal Timing": "⏰",
    "Interview Conversion": "🎤",
    "Application to Interview": "📝",
    "Preparation Impact": "📚",
    "Market Timing": "📅",
    "Response Velocity": "⚡",
    "Company Size Preference": "🏛️",
  };

  // Pattern type to color mapping
  const patternColors = {
    "Industry Strength": "from-blue-50 to-indigo-50 border-blue-200",
    "Optimal Timing": "from-amber-50 to-yellow-50 border-amber-200",
    "Interview Conversion": "from-green-50 to-emerald-50 border-green-200",
    "Application to Interview": "from-purple-50 to-pink-50 border-purple-200",
    "Preparation Impact": "from-cyan-50 to-teal-50 border-cyan-200",
    "Market Timing": "from-orange-50 to-red-50 border-orange-200",
    "Response Velocity": "from-violet-50 to-purple-50 border-violet-200",
    "Company Size Preference": "from-slate-50 to-gray-50 border-slate-200",
  };

  if (!patterns?.hasData) {
    return (
      <Card className="text-center py-12">
        <div className="text-4xl mb-4">✨</div>
        <h3 className="text-lg font-semibold mb-2">Building Your Success Profile</h3>
        <p className="text-gray-600">
          {patterns?.message || "Need more applications to identify patterns"}
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Minimum required: {patterns?.minimumRequired || 5} applications
        </p>
      </Card>
    );
  }

  // Group patterns by category
  const conversionPatterns = patterns.patterns.filter(p =>
    ["Interview Conversion", "Application to Interview"].includes(p.type)
  );
  const timingPatterns = patterns.patterns.filter(p =>
    ["Optimal Timing", "Market Timing", "Response Velocity"].includes(p.type)
  );
  const strategyPatterns = patterns.patterns.filter(p =>
    ["Industry Strength", "Company Size Preference", "Preparation Impact"].includes(p.type)
  );

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center bg-green-50">
          <div className="text-2xl mb-1">🎯</div>
          <div className="text-2xl font-bold text-green-700">{patterns.sampleSize}</div>
          <div className="text-sm text-gray-600">Applications Analyzed</div>
        </Card>
        <Card className="text-center bg-blue-50">
          <div className="text-2xl mb-1">✅</div>
          <div className="text-2xl font-bold text-blue-700">{patterns.successCount}</div>
          <div className="text-sm text-gray-600">Successful Outcomes</div>
        </Card>
        <Card className="text-center bg-purple-50">
          <div className="text-2xl mb-1">📊</div>
          <div className="text-2xl font-bold text-purple-700">{patterns.patterns.length}</div>
          <div className="text-sm text-gray-600">Patterns Identified</div>
        </Card>
        <Card className="text-center bg-amber-50">
          <div className="text-2xl mb-1">💡</div>
          <div className="text-2xl font-bold text-amber-700">
            {((patterns.successCount / patterns.sampleSize) * 100).toFixed(0)}%
          </div>
          <div className="text-sm text-gray-600">Success Rate</div>
        </Card>
      </div>

      {/* Conversion Patterns */}
      {conversionPatterns.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">🔄 Conversion Funnel Patterns</h3>
          <div className="space-y-4">
            {conversionPatterns.map((pattern, idx) => (
              <div key={idx} className={`p-4 rounded-lg border bg-gradient-to-r ${patternColors[pattern.type] || "from-gray-50 to-gray-100 border-gray-200"}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{patternIcons[pattern.type] || "📈"}</span>
                  <span className="px-2 py-1 bg-white/50 text-gray-700 text-xs font-medium rounded">
                    {pattern.type}
                  </span>
                </div>
                <p className="font-medium text-gray-900">{pattern.description}</p>
                {pattern.data && (
                  <div className="mt-3 flex gap-4 text-sm">
                    {pattern.data.conversionRate && (
                      <div className="bg-white/60 px-3 py-1 rounded">
                        <span className="text-gray-500">Rate:</span>{" "}
                        <span className="font-bold">{pattern.data.conversionRate}%</span>
                      </div>
                    )}
                    {pattern.data.totalInterviews !== undefined && (
                      <div className="bg-white/60 px-3 py-1 rounded">
                        <span className="text-gray-500">Interviews:</span>{" "}
                        <span className="font-bold">{pattern.data.totalInterviews}</span>
                      </div>
                    )}
                    {pattern.data.totalOffers !== undefined && (
                      <div className="bg-white/60 px-3 py-1 rounded">
                        <span className="text-gray-500">Offers:</span>{" "}
                        <span className="font-bold">{pattern.data.totalOffers}</span>
                      </div>
                    )}
                  </div>
                )}
                <p className="text-sm text-gray-600 mt-3 flex items-center gap-1">
                  <span>💡</span> {pattern.recommendation}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Timing Patterns */}
      {timingPatterns.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">⏱️ Timing & Market Patterns</h3>
          <div className="space-y-4">
            {timingPatterns.map((pattern, idx) => (
              <div key={idx} className={`p-4 rounded-lg border bg-gradient-to-r ${patternColors[pattern.type] || "from-gray-50 to-gray-100 border-gray-200"}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{patternIcons[pattern.type] || "📈"}</span>
                  <span className="px-2 py-1 bg-white/50 text-gray-700 text-xs font-medium rounded">
                    {pattern.type}
                  </span>
                </div>
                <p className="font-medium text-gray-900">{pattern.description}</p>
                <p className="text-sm text-gray-600 mt-3 flex items-center gap-1">
                  <span>💡</span> {pattern.recommendation}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Strategy Patterns */}
      {strategyPatterns.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">🎯 Strategy & Targeting Patterns</h3>
          <div className="space-y-4">
            {strategyPatterns.map((pattern, idx) => (
              <div key={idx} className={`p-4 rounded-lg border bg-gradient-to-r ${patternColors[pattern.type] || "from-gray-50 to-gray-100 border-gray-200"}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{patternIcons[pattern.type] || "📈"}</span>
                  <span className="px-2 py-1 bg-white/50 text-gray-700 text-xs font-medium rounded">
                    {pattern.type}
                  </span>
                </div>
                <p className="font-medium text-gray-900">{pattern.description}</p>
                {pattern.data?.improvement && (
                  <div className="mt-3 bg-white/60 px-3 py-1 rounded inline-block">
                    <span className="text-gray-500">Improvement:</span>{" "}
                    <span className="font-bold text-green-600">+{pattern.data.improvement}%</span>
                  </div>
                )}
                <p className="text-sm text-gray-600 mt-3 flex items-center gap-1">
                  <span>💡</span> {pattern.recommendation}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* All Patterns (if no categorization matched) */}
      {patterns.patterns.length > 0 && conversionPatterns.length === 0 && timingPatterns.length === 0 && strategyPatterns.length === 0 && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">✨ Identified Success Patterns</h3>
          <div className="space-y-4">
            {patterns.patterns.map((pattern, idx) => (
              <div key={idx} className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{patternIcons[pattern.type] || "📈"}</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                    {pattern.type}
                  </span>
                </div>
                <p className="font-medium text-gray-900">{pattern.description}</p>
                <p className="text-sm text-gray-600 mt-2">
                  💡 {pattern.recommendation}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Success vs Rejection Comparison */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">🔍 Success vs Rejection Analysis</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-green-700 mb-3">✅ Successful Application Traits</h4>
            {analysis.patternAnalysis.successfulCharacteristics.commonIndustries?.length > 0 ? (
              <ul className="space-y-2">
                {analysis.patternAnalysis.successfulCharacteristics.commonIndustries.map((item, idx) => (
                  <li key={idx} className="flex justify-between text-sm">
                    <span>{item.name}</span>
                    <span className="text-gray-500">{item.percentage}%</span>
                  </li>
                ))}
                {analysis.patternAnalysis.successfulCharacteristics.avgDaysToResponse && (
                  <li className="flex justify-between text-sm pt-2 border-t">
                    <span>Avg Response Time</span>
                    <span className="text-gray-500">
                      {analysis.patternAnalysis.successfulCharacteristics.avgDaysToResponse} days
                    </span>
                  </li>
                )}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No successful applications yet</p>
            )}
          </div>

          <div>
            <h4 className="font-medium text-red-700 mb-3">❌ Rejected Application Traits</h4>
            {analysis.patternAnalysis.rejectedCharacteristics.commonIndustries?.length > 0 ? (
              <ul className="space-y-2">
                {analysis.patternAnalysis.rejectedCharacteristics.commonIndustries.map((item, idx) => (
                  <li key={idx} className="flex justify-between text-sm">
                    <span>{item.name}</span>
                    <span className="text-gray-500">{item.percentage}%</span>
                  </li>
                ))}
                {analysis.patternAnalysis.rejectedCharacteristics.avgDaysToResponse && (
                  <li className="flex justify-between text-sm pt-2 border-t">
                    <span>Avg Response Time</span>
                    <span className="text-gray-500">
                      {analysis.patternAnalysis.rejectedCharacteristics.avgDaysToResponse} days
                    </span>
                  </li>
                )}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No rejected applications recorded</p>
            )}
          </div>
        </div>

        {/* Key Differences */}
        {analysis.patternAnalysis.keyDifferences.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <h4 className="font-medium mb-3">🔑 Key Differences</h4>
            <div className="space-y-2">
              {analysis.patternAnalysis.keyDifferences.map((diff, idx) => (
                <div key={idx} className="p-3 bg-yellow-50 rounded-lg">
                  <span className="font-medium">{diff.factor}:</span>{" "}
                  <span className="text-gray-700">{diff.insight}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// ============================================================================
// Materials Tab
// ============================================================================
function MaterialsTab({ analysis }) {
  const { materialsAnalysis } = analysis;

  return (
    <div className="space-y-6">
      {/* Materials Overview */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="text-center">
          <div className="text-3xl mb-2">📄</div>
          <div className="text-2xl font-bold">{materialsAnalysis.overview.totalResumes}</div>
          <div className="text-sm text-gray-600">Total Resumes</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl mb-2">✉️</div>
          <div className="text-2xl font-bold">{materialsAnalysis.overview.totalCoverLetters}</div>
          <div className="text-sm text-gray-600">Cover Letters</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl mb-2">🎯</div>
          <div className="text-2xl font-bold">{materialsAnalysis.overview.customizedResumes}</div>
          <div className="text-sm text-gray-600">Customized Resumes</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl mb-2">📝</div>
          <div className="text-2xl font-bold">{materialsAnalysis.overview.customizedCoverLetters}</div>
          <div className="text-sm text-gray-600">Tailored Letters</div>
        </Card>
      </div>

      {/* Impact Analysis */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">📊 Materials Impact on Success</h3>
        <div className="space-y-4">
          <ImpactRow
            label="With Resume Attached"
            stats={materialsAnalysis.impact.withResume}
            baseline={materialsAnalysis.impact.baseline.successRate}
          />
          <ImpactRow
            label="With Cover Letter"
            stats={materialsAnalysis.impact.withCoverLetter}
            baseline={materialsAnalysis.impact.baseline.successRate}
          />
          <ImpactRow
            label="With Both Materials"
            stats={materialsAnalysis.impact.withBothMaterials}
            baseline={materialsAnalysis.impact.baseline.successRate}
          />
          <ImpactRow
            label="Without Materials"
            stats={materialsAnalysis.impact.withoutMaterials}
            baseline={materialsAnalysis.impact.baseline.successRate}
          />
        </div>
      </Card>

      {/* Correlation Analysis */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">🔗 Customization Correlation</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="text-sm text-gray-600 mb-2">Correlation Strength</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${materialsAnalysis.customizationCorrelation.strength === "strong"
                      ? "bg-green-500"
                      : materialsAnalysis.customizationCorrelation.strength === "moderate"
                        ? "bg-yellow-500"
                        : "bg-gray-400"
                    }`}
                  style={{
                    width: `${Math.abs(materialsAnalysis.customizationCorrelation.correlation) * 100}%`,
                  }}
                />
              </div>
              <span className="font-bold">
                {(materialsAnalysis.customizationCorrelation.correlation * 100).toFixed(0)}%
              </span>
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {materialsAnalysis.customizationCorrelation.strength} correlation
            </div>
          </div>
        </div>
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-blue-800">{materialsAnalysis.recommendation}</p>
        </div>
      </Card>
    </div>
  );
}

// ============================================================================
// Timing Tab
// ============================================================================
function TimingTab({ analysis }) {
  const { timingAnalysis } = analysis;

  return (
    <div className="space-y-6">
      {/* Best Times Summary */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
          <div className="text-center">
            <div className="text-4xl mb-2">📅</div>
            <h3 className="text-lg font-semibold">Best Day to Apply</h3>
            <div className="text-3xl font-bold text-green-600 mt-2">
              {timingAnalysis.bestDay?.day || "N/A"}
            </div>
            {timingAnalysis.bestDay && (
              <p className="text-sm text-gray-600 mt-1">
                {timingAnalysis.bestDay.successRate}% success rate from {timingAnalysis.bestDay.total} applications
              </p>
            )}
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="text-center">
            <div className="text-4xl mb-2">⏰</div>
            <h3 className="text-lg font-semibold">Best Time to Apply</h3>
            <div className="text-3xl font-bold text-blue-600 mt-2">
              {timingAnalysis.bestTime?.timeRange?.split(" ")[0] || "N/A"}
            </div>
            {timingAnalysis.bestTime && (
              <p className="text-sm text-gray-600 mt-1">
                {timingAnalysis.bestTime.successRate}% success rate
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Day of Week Analysis */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">📆 Success by Day of Week</h3>
        <div className="grid grid-cols-7 gap-2">
          {timingAnalysis.byDayOfWeek.map((day, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg text-center ${day.successRate >= 20 ? "bg-green-100" : day.successRate >= 10 ? "bg-yellow-100" : "bg-gray-100"
                }`}
            >
              <div className="text-xs text-gray-600">{day.day.slice(0, 3)}</div>
              <div className="text-lg font-bold">{day.successRate}%</div>
              <div className="text-xs text-gray-500">{day.total} apps</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Time of Day Analysis */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">🌅 Success by Time of Day</h3>
        <div className="space-y-3">
          {timingAnalysis.byTimeOfDay.map((time, idx) => (
            <div key={idx} className="flex items-center gap-4">
              <div className="w-40 text-sm">{time.timeRange}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-6 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${time.successRate >= 20 ? "bg-green-500" : time.successRate >= 10 ? "bg-yellow-500" : "bg-gray-400"
                        }`}
                      style={{ width: `${Math.min(time.successRate, 100)}%` }}
                    />
                  </div>
                  <span className="font-bold w-12 text-right">{time.successRate}%</span>
                </div>
              </div>
              <div className="text-sm text-gray-500 w-20">{time.total} apps</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ============================================================================
// UC-105: Prediction Tab - Success Probability Prediction
// ============================================================================
function PredictionTab({ prediction, onLoadPrediction, loading, error, analysis }) {
  const [industry, setIndustry] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [roleType, setRoleType] = useState("");

  const handlePredict = () => {
    console.log("Predict button clicked", { industry, companySize, roleType });
    onLoadPrediction({ industry, companySize, roleType });
  };

  return (
    <div className="space-y-6">
      {/* Prediction Form */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">🔮 Success Prediction Tool</h3>
        <p className="text-gray-600 mb-4">
          Enter details about a potential application to predict your success probability based on historical patterns.
        </p>

        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g., Technology, Healthcare"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Size</label>
            <select
              value={companySize}
              onChange={(e) => setCompanySize(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select size</option>
              <option value="1-10">1-10 employees</option>
              <option value="11-50">11-50 employees</option>
              <option value="51-200">51-200 employees</option>
              <option value="201-500">201-500 employees</option>
              <option value="501-1000">501-1000 employees</option>
              <option value="1001-5000">1001-5000 employees</option>
              <option value="5001+">5001+ employees</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role Type</label>
            <select
              value={roleType}
              onChange={(e) => setRoleType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select type</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Internship">Internship</option>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </div>
        </div>

        <Button
          onClick={handlePredict}
          disabled={loading}
          className="flex items-center gap-2"
        >
          {loading ? (
            <>
              <LoadingSpinner size="sm" />
              Analyzing...
            </>
          ) : (
            <>🔮 Predict Success</>
          )}
        </Button>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            ⚠️ {error}
          </div>
        )}

        {/* Not enough data - inline message */}
        {prediction && prediction.hasData === false && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📊</span>
              <div>
                <p className="font-semibold text-yellow-800">{prediction.message || "Not enough data for prediction"}</p>
                <p className="text-sm text-yellow-700">
                  You have <strong>{prediction.currentCount || 0}</strong> applications.
                  Need at least <strong>{prediction.minimumRequired || 5}</strong> for predictions.
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Prediction Results */}
      {prediction?.prediction && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">📊 Prediction Results</h3>

          {/* Success Probability Gauge */}
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="16"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  fill="none"
                  stroke={prediction.prediction.successProbability >= 60 ? "#22c55e" :
                    prediction.prediction.successProbability >= 40 ? "#eab308" : "#ef4444"}
                  strokeWidth="16"
                  strokeDasharray={`${(prediction.prediction.successProbability / 100) * 502.4} 502.4`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-gray-900">
                  {prediction.prediction.successProbability}%
                </span>
                <span className="text-sm text-gray-600">Success Probability</span>
              </div>
            </div>
          </div>

          {/* Confidence Level */}
          <div className="text-center mb-6">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${prediction.prediction.confidence === "high" ? "bg-green-100 text-green-700" :
                prediction.prediction.confidence === "medium" ? "bg-yellow-100 text-yellow-700" :
                  "bg-gray-100 text-gray-700"
              }`}>
              {prediction.prediction.confidence.charAt(0).toUpperCase() + prediction.prediction.confidence.slice(1)} Confidence
            </span>
            <p className="text-sm text-gray-500 mt-2">
              Based on {prediction.basedOn?.totalApplications || 0} historical applications
            </p>
          </div>

          {/* Factors */}
          {prediction.prediction.factors?.length > 0 && (
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Contributing Factors</h4>
              <div className="space-y-2">
                {prediction.prediction.factors.map((factor, idx) => (
                  <div key={idx} className={`p-3 rounded-lg ${factor.impact === "positive" ? "bg-green-50 border border-green-200" :
                      factor.impact === "negative" ? "bg-red-50 border border-red-200" :
                        "bg-gray-50 border border-gray-200"
                    }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{factor.factor}</span>
                      <span className={`text-sm font-medium ${factor.score > 0 ? "text-green-600" : factor.score < 0 ? "text-red-600" : "text-gray-600"
                        }`}>
                        {factor.score > 0 ? "+" : ""}{factor.score}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{factor.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {prediction.prediction.recommendations?.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">💡 Recommendations to Improve Chances</h4>
              <div className="space-y-2">
                {prediction.prediction.recommendations.map((rec, idx) => (
                  <div key={idx} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${rec.priority === "high" ? "bg-red-100 text-red-700" :
                          rec.priority === "medium" ? "bg-yellow-100 text-yellow-700" :
                            "bg-blue-100 text-blue-700"
                        }`}>
                        {rec.priority.toUpperCase()}
                      </span>
                    </div>
                    <p className="font-medium text-gray-900">{rec.action}</p>
                    <p className="text-sm text-gray-600">{rec.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Not enough data message */}
      {prediction && prediction.hasData === false && (
        <Card className="text-center py-8 bg-yellow-50 border border-yellow-200">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Not Enough Data</h3>
          <p className="text-yellow-700 mb-2">{prediction.message}</p>
          <p className="text-sm text-yellow-600">
            You have <span className="font-bold">{prediction.currentCount || 0}</span> applications.
            Need at least <span className="font-bold">{prediction.minimumRequired || 5}</span> for predictions.
          </p>
        </Card>
      )}

      {!prediction && !loading && (
        <Card className="text-center py-8">
          <div className="text-4xl mb-4">🎯</div>
          <p className="text-gray-600">
            Enter application details above to see your predicted success probability
          </p>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// UC-105: Evolution Tab - Pattern Evolution Over Time
// ============================================================================
function EvolutionTab({ evolution, onLoadEvolution, loading, analysis }) {
  useEffect(() => {
    if (!evolution && !loading) {
      onLoadEvolution();
    }
  }, []);

  if (loading) {
    return (
      <Card className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </Card>
    );
  }

  if (!evolution?.hasEnoughData) {
    return (
      <Card className="text-center py-12">
        <div className="text-4xl mb-4">📈</div>
        <h3 className="text-lg font-semibold mb-2">Building Your Strategy History</h3>
        <p className="text-gray-600">
          {evolution?.message || "Need at least 10 applications to track pattern evolution"}
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Current applications: {analysis?.summary?.totalApplications || 0}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Timeline Overview */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">📈 Success Rate Evolution</h3>
        <div className="space-y-4">
          {evolution.evolution.periods.map((period, idx) => (
            <div key={idx} className="border-l-4 border-blue-400 pl-4 py-2">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-medium text-gray-900">{period.period}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    ({period.startDate} - {period.endDate})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-sm font-medium ${period.trend === "improving" ? "bg-green-100 text-green-700" :
                      period.trend === "declining" ? "bg-red-100 text-red-700" :
                        "bg-gray-100 text-gray-700"
                    }`}>
                    {period.trend === "improving" ? "↑ Improving" :
                      period.trend === "declining" ? "↓ Declining" :
                        "→ Stable"}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Applications:</span>
                  <span className="ml-1 font-medium">{period.totalApplications}</span>
                </div>
                <div>
                  <span className="text-gray-500">Success Rate:</span>
                  <span className={`ml-1 font-medium ${period.successRate >= 20 ? "text-green-600" : "text-gray-900"
                    }`}>
                    {period.successRate}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Weekly Avg:</span>
                  <span className="ml-1 font-medium">{period.avgApplicationsPerWeek}/week</span>
                </div>
              </div>
              {period.topSuccessfulIndustries?.length > 0 && (
                <div className="mt-2 text-sm">
                  <span className="text-gray-500">Top Industries:</span>
                  <span className="ml-1">{period.topSuccessfulIndustries.join(", ")}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Insights */}
      {evolution.evolution.insights?.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">💡 Key Insights</h3>
          <div className="space-y-3">
            {evolution.evolution.insights.map((insight, idx) => (
              <div key={idx} className={`p-4 rounded-lg ${insight.type === "positive_trend" ? "bg-green-50 border border-green-200" :
                  insight.type === "negative_trend" ? "bg-red-50 border border-red-200" :
                    "bg-blue-50 border border-blue-200"
                }`}>
                <p className="font-medium text-gray-900">{insight.message}</p>
                <p className="text-sm text-gray-600 mt-1">{insight.detail}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Strategy Changes */}
      {evolution.evolution.strategyAdaptation?.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">🔄 Strategy Adaptations</h3>
          <div className="space-y-3">
            {evolution.evolution.strategyAdaptation.map((change, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${change.impact === "positive" ? "bg-green-100 text-green-600" :
                    change.impact === "negative" ? "bg-red-100 text-red-600" :
                      "bg-gray-100 text-gray-600"
                  }`}>
                  {change.change === "increased_volume" ? "📊" :
                    change.change === "industry_shift" ? "🏢" : "🔄"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{change.period}</span>
                    <span className={`px-2 py-0.5 text-xs rounded ${change.impact === "positive" ? "bg-green-100 text-green-700" :
                        change.impact === "negative" ? "bg-red-100 text-red-700" :
                          "bg-gray-100 text-gray-700"
                      }`}>
                      {change.impact} impact
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{change.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Refresh Button */}
      <div className="text-center">
        <button
          onClick={onLoadEvolution}
          disabled={loading}
          className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition"
        >
          🔄 Refresh Evolution Data
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Recommendations Tab
// ============================================================================
function RecommendationsTab({ analysis, recommendations }) {
  const hasDetailedRecs = recommendations?.hasData && recommendations.recommendations?.length > 0;

  return (
    <div className="space-y-6">
      {/* Priority Recommendations */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">🎯 Priority Actions</h3>
        {analysis.recommendations.length > 0 ? (
          <div className="space-y-4">
            {analysis.recommendations.map((rec, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border-l-4 ${rec.priority === "high"
                    ? "bg-red-50 border-red-500"
                    : rec.priority === "medium"
                      ? "bg-yellow-50 border-yellow-500"
                      : "bg-blue-50 border-blue-500"
                  }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded ${rec.priority === "high" ? "bg-red-100 text-red-700" :
                      rec.priority === "medium" ? "bg-yellow-100 text-yellow-700" :
                        "bg-blue-100 text-blue-700"
                    }`}>
                    {rec.priority.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-500">{rec.category}</span>
                </div>
                <h4 className="font-medium text-gray-900">{rec.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                {rec.actionable && (
                  <p className="text-sm text-gray-700 mt-2">
                    <span className="font-medium">Action:</span> {rec.actionable}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">Keep applying to generate personalized recommendations!</p>
        )}
      </Card>

      {/* Detailed Recommendations */}
      {hasDetailedRecs && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">💡 Detailed Improvement Plan</h3>
          <div className="space-y-6">
            {recommendations.recommendations.map((rec, idx) => (
              <div key={idx} className="border-b last:border-0 pb-4 last:pb-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded ${rec.priority === "high" ? "bg-red-100 text-red-700" :
                      rec.priority === "medium" ? "bg-yellow-100 text-yellow-700" :
                        "bg-blue-100 text-blue-700"
                    }`}>
                    {rec.category}
                  </span>
                </div>
                <h4 className="font-medium text-gray-900 mb-1">{rec.title}</h4>
                <p className="text-sm text-gray-600 mb-3">{rec.description}</p>
                {rec.actionItems && (
                  <ul className="space-y-1">
                    {rec.actionItems.map((item, itemIdx) => (
                      <li key={itemIdx} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-green-500 mt-0.5">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* General Tips */}
      {!hasDetailedRecs && recommendations?.generalTips && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">📚 General Tips</h3>
          <ul className="space-y-2">
            {recommendations.generalTips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2 text-gray-700">
                <span className="text-blue-500 mt-0.5">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// Helper Components
// ============================================================================
function StatBar({ label, value, benchmark, color }) {
  const colorClasses = {
    green: "bg-green-500",
    blue: "bg-blue-500",
    purple: "bg-purple-500",
  };

  const isAboveBenchmark = value >= benchmark;

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className={isAboveBenchmark ? "text-green-600" : "text-gray-600"}>
          {value}% {isAboveBenchmark ? "✓" : ""} (benchmark: {benchmark}%)
        </span>
      </div>
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${colorClasses[color]}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}

function SignificanceBadge({ significance }) {
  if (!significance.significant) {
    return <span className="text-xs text-gray-400">-</span>;
  }

  const colors = {
    high: "bg-green-100 text-green-700",
    medium: "bg-yellow-100 text-yellow-700",
    low: "bg-blue-100 text-blue-700",
  };

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded ${colors[significance.level]}`}>
      {significance.confidence}%
    </span>
  );
}

function ImpactRow({ label, stats, baseline }) {
  const diff = stats.successRate - baseline;
  const isPositive = diff > 0;

  return (
    <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <div className="font-medium">{label}</div>
        <div className="text-sm text-gray-500">{stats.total} applications</div>
      </div>
      <div className="text-center">
        <div className="text-xl font-bold">{stats.successRate}%</div>
        <div className={`text-sm ${isPositive ? "text-green-600" : diff < 0 ? "text-red-600" : "text-gray-500"}`}>
          {diff > 0 ? "+" : ""}{diff.toFixed(1)}% vs avg
        </div>
      </div>
    </div>
  );
}
