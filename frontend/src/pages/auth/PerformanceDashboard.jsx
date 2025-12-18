import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import Card from "../../components/Card";
import Button from "../../components/Button";
import LoadingSpinner from "../../components/LoadingSpinner";
import {
  getPerformanceDashboard,
  getSearchGoals,
  updateSearchGoals,
  getTrendAnalysis,
} from "../../api/performanceDashboard";
import { setAuthToken } from "../../api/axios";

// ============================================================================
// UC-096: Job Search Performance Dashboard
// ============================================================================

export default function PerformanceDashboard() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [period, setPeriod] = useState("month");
  const [customDateRange, setCustomDateRange] = useState({ start: "", end: "" });
  const [showGoalEditor, setShowGoalEditor] = useState(false);
  const [editingGoals, setEditingGoals] = useState(null);
  const [savingGoals, setSavingGoals] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    loadDashboard();
  }, [period]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      setAuthToken(token);
      
      const options = period === "custom" && customDateRange.start && customDateRange.end
        ? { startDate: customDateRange.start, endDate: customDateRange.end }
        : { period };
      
      const data = await getPerformanceDashboard(options);
      setDashboard(data.data);
    } catch (err) {
      console.error("Failed to load dashboard:", err);
      setError(err.response?.data?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCustomDateRange = () => {
    if (customDateRange.start && customDateRange.end) {
      loadDashboard();
    }
  };

  const handleEditGoals = async () => {
    try {
      const token = await getToken();
      setAuthToken(token);
      const data = await getSearchGoals();
      setEditingGoals(data.data?.goals || getDefaultGoals());
      setShowGoalEditor(true);
    } catch (err) {
      console.error("Failed to load goals:", err);
    }
  };

  const handleSaveGoals = async () => {
    try {
      setSavingGoals(true);
      const token = await getToken();
      setAuthToken(token);
      await updateSearchGoals(editingGoals);
      setMessage({ type: "success", text: "Goals saved successfully!" });
      setShowGoalEditor(false);
      loadDashboard();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to save goals" });
    } finally {
      setSavingGoals(false);
    }
  };

  const getDefaultGoals = () => ({
    weekly: { applications: { target: 10 }, networking: { target: 5 } },
    monthly: { applications: { target: 40 }, interviews: { target: 4 }, offers: { target: 1 } },
    overall: { targetRole: "", targetSalary: null, targetDate: null }
  });

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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadDashboard}>Try Again</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Performance Dashboard</h1>
          <p className="text-gray-600 mt-1">Track your job search progress and make data-driven improvements</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2">
          <Button variant="outline" onClick={handleEditGoals}>
            🎯 Edit Goals
          </Button>
          <Button variant="outline" onClick={loadDashboard}>
            🔄 Refresh
          </Button>
        </div>
      </div>

      {message.text && (
        <div className={`mb-6 p-4 rounded-lg ${message.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
          {message.text}
        </div>
      )}

      {/* Date Range Filter */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Time Period:</span>
          <div className="flex flex-wrap gap-2">
            {[
              { value: "week", label: "Last 7 Days" },
              { value: "month", label: "Last 30 Days" },
              { value: "quarter", label: "Last 90 Days" },
              { value: "year", label: "Last Year" },
              { value: "all", label: "All Time" },
              { value: "custom", label: "Custom" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  period === opt.value
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {period === "custom" && (
            <div className="flex items-center gap-2 ml-4">
              <input
                type="date"
                value={customDateRange.start}
                onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                className="px-2 py-1 border rounded text-sm"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={customDateRange.end}
                onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                className="px-2 py-1 border rounded text-sm"
              />
              <Button size="sm" onClick={handleApplyCustomDateRange}>Apply</Button>
            </div>
          )}
        </div>
      </Card>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex flex-wrap gap-1 sm:gap-4 overflow-x-auto pb-1">
          {[
            { id: "overview", label: "Overview", icon: "📊" },
            { id: "funnel", label: "Conversion Funnel", icon: "🔄" },
            { id: "trends", label: "Trends", icon: "📈" },
            { id: "goals", label: "Goals", icon: "🎯" },
            { id: "insights", label: "Insights", icon: "💡" },
            { id: "patterns", label: "Success Patterns", icon: "✨" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 sm:py-4 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && <OverviewTab dashboard={dashboard} />}
      {activeTab === "funnel" && <FunnelTab funnel={dashboard?.conversionFunnel} benchmarks={dashboard?.benchmarks} />}
      {activeTab === "trends" && <TrendsTab trends={dashboard?.trends} timeMetrics={dashboard?.timeMetrics} />}
      {activeTab === "goals" && <GoalsTab goals={dashboard?.goals} onEditGoals={handleEditGoals} />}
      {activeTab === "insights" && <InsightsTab insights={dashboard?.insights} />}
      {activeTab === "patterns" && <PatternsTab patterns={dashboard?.successPatterns} />}

      {/* Goal Editor Modal */}
      {showGoalEditor && (
        <GoalEditorModal
          goals={editingGoals}
          onChange={setEditingGoals}
          onSave={handleSaveGoals}
          onCancel={() => setShowGoalEditor(false)}
          saving={savingGoals}
        />
      )}
    </div>
  );
}

// ============================================================================
// Overview Tab
// ============================================================================
function OverviewTab({ dashboard }) {
  const { keyMetrics, benchmarks, timeMetrics } = dashboard || {};

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MetricCard
          title="Applications"
          value={keyMetrics?.totalApplications || 0}
          icon="📝"
          color="blue"
        />
        <MetricCard
          title="Interviews"
          value={keyMetrics?.interviewsScheduled || 0}
          icon="🎤"
          color="purple"
        />
        <MetricCard
          title="Offers"
          value={keyMetrics?.offersReceived || 0}
          icon="🎉"
          color="green"
        />
        <MetricCard
          title="Accepted"
          value={keyMetrics?.acceptedOffers || 0}
          icon="✅"
          color="emerald"
        />
        <MetricCard
          title="Active"
          value={keyMetrics?.activeApplications || 0}
          icon="⏳"
          color="yellow"
        />
      </div>

      {/* Benchmark Comparison */}
      {benchmarks && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">📊 Performance vs Industry Benchmarks</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {["responseRate", "interviewRate", "offerRate"].map((metric) => {
              const userValue = parseFloat(benchmarks.userMetrics?.[metric] || 0);
              const industryValue = benchmarks.industryBenchmarks?.[metric] || 0;
              const comparison = benchmarks.comparison?.[metric];
              
              return (
                <div key={metric} className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2 capitalize">
                    {metric.replace("Rate", " Rate")}
                  </p>
                  <div className="flex items-center justify-center gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-500">You</p>
                      <p className="text-2xl font-bold text-blue-600">{userValue}%</p>
                    </div>
                    <span className="text-gray-400">vs</span>
                    <div>
                      <p className="text-xs text-gray-500">Industry</p>
                      <p className="text-2xl font-bold text-gray-600">{industryValue}%</p>
                    </div>
                  </div>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    comparison?.status === "above"
                      ? "bg-green-100 text-green-800"
                      : comparison?.status === "average"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}>
                    {comparison?.status === "above" ? "Above Average" : 
                     comparison?.status === "average" ? "On Par" : "Below Average"}
                    {" "}({comparison?.difference > 0 ? "+" : ""}{comparison?.difference}%)
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Time Metrics */}
      {timeMetrics && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">⏱️ Response Times</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <TimeMetricCard
              title="Time to Response"
              data={timeMetrics.responseTime}
              benchmark={14}
            />
            <TimeMetricCard
              title="Time to Interview"
              data={timeMetrics.interviewTime}
              benchmark={21}
            />
            <TimeMetricCard
              title="Time to Offer"
              data={timeMetrics.offerTime}
              benchmark={45}
            />
          </div>
        </Card>
      )}
    </div>
  );
}

function MetricCard({ title, value, icon, color }) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
    green: "bg-green-50 text-green-600 border-green-200",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-200",
    yellow: "bg-yellow-50 text-yellow-600 border-yellow-200",
  };

  return (
    <div className={`p-4 rounded-xl border ${colorClasses[color]}`}>
      <div className="text-2xl mb-2">{icon}</div>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm opacity-80">{title}</p>
    </div>
  );
}

function TimeMetricCard({ title, data, benchmark }) {
  if (!data || data.sampleSize === 0) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg text-center">
        <p className="font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-500 mt-2">No data yet</p>
      </div>
    );
  }

  const isGood = parseFloat(data.average) <= benchmark;

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <p className="font-medium text-gray-900 mb-3">{title}</p>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Average</span>
          <span className={`font-semibold ${isGood ? "text-green-600" : "text-orange-600"}`}>
            {data.average} days
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Median</span>
          <span className="font-medium text-gray-900">{data.median} days</span>
        </div>
        {data.fastest !== null && (
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Fastest</span>
            <span className="font-medium text-green-600">{data.fastest} days</span>
          </div>
        )}
        <div className="text-xs text-gray-500 mt-2">
          Based on {data.sampleSize} applications
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Funnel Tab
// ============================================================================
function FunnelTab({ funnel, benchmarks }) {
  if (!funnel || funnel.stages?.length === 0) {
    return (
      <Card className="text-center py-12">
        <div className="text-4xl mb-4">🔄</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Funnel Data Yet</h3>
        <p className="text-gray-600">Start applying to jobs to see your conversion funnel</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Visual Funnel */}
      <Card>
        <h3 className="text-lg font-semibold mb-6">Application Funnel</h3>
        <div className="space-y-4">
          {funnel.stages?.map((stage, index) => (
            <div key={stage.name} className="relative">
              <div className="flex items-center gap-4">
                <div className="w-32 text-right">
                  <span className="font-medium text-gray-900">{stage.name}</span>
                </div>
                <div className="flex-1 relative">
                  <div className="h-10 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        index === 0 ? "bg-blue-500" :
                        index === 1 ? "bg-blue-400" :
                        index === 2 ? "bg-purple-500" :
                        index === 3 ? "bg-purple-400" :
                        index === 4 ? "bg-green-500" :
                        "bg-green-600"
                      }`}
                      style={{ width: `${stage.percentage}%` }}
                    />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-bold text-gray-800">
                      {stage.count} ({stage.percentage}%)
                    </span>
                  </div>
                </div>
                {index > 0 && stage.conversionFromPrevious && (
                  <div className="w-24 text-center">
                    <span className={`text-sm font-medium ${
                      parseFloat(stage.conversionFromPrevious) >= 50 ? "text-green-600" :
                      parseFloat(stage.conversionFromPrevious) >= 25 ? "text-yellow-600" :
                      "text-red-600"
                    }`}>
                      {stage.conversionFromPrevious}% ↓
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Bottleneck Alert */}
      {funnel.bottleneck && (
        <Card className="border-orange-200 bg-orange-50">
          <div className="flex items-start gap-4">
            <span className="text-3xl">⚠️</span>
            <div>
              <h4 className="font-semibold text-orange-800">
                Bottleneck Detected: {funnel.bottleneck.from} → {funnel.bottleneck.to}
              </h4>
              <p className="text-orange-700 mt-1">
                {funnel.bottleneck.dropOffRate}% of applications drop off at this stage
              </p>
              <p className="text-sm text-orange-600 mt-2">
                💡 {funnel.bottleneck.suggestion}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Conversion Rates */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">Conversion Rates</h3>
        <div className="grid md:grid-cols-5 gap-4">
          {Object.entries(funnel.conversionRates || {}).map(([key, value]) => (
            <div key={key} className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{value}%</p>
              <p className="text-xs text-gray-600 capitalize mt-1">
                {key.replace(/([A-Z])/g, " $1").trim()}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ============================================================================
// Trends Tab
// ============================================================================
function TrendsTab({ trends, timeMetrics }) {
  if (!trends || trends.weekly?.length === 0) {
    return (
      <Card className="text-center py-12">
        <div className="text-4xl mb-4">📈</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Trend Data Yet</h3>
        <p className="text-gray-600">Apply to more jobs over time to see trends</p>
      </Card>
    );
  }

  const maxApps = Math.max(...trends.weekly.map(w => w.applications), 1);

  return (
    <div className="space-y-6">
      {/* Trend Indicators */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="text-center">
          <p className="text-sm text-gray-600 mb-1">Application Volume</p>
          <div className={`text-2xl font-bold ${
            trends.volumeTrend === "increasing" ? "text-green-600" :
            trends.volumeTrend === "decreasing" ? "text-red-600" :
            "text-gray-600"
          }`}>
            {trends.volumeTrend === "increasing" ? "📈 Increasing" :
             trends.volumeTrend === "decreasing" ? "📉 Decreasing" :
             "➡️ Stable"}
          </div>
        </Card>
        <Card className="text-center">
          <p className="text-sm text-gray-600 mb-1">Success Rate</p>
          <div className={`text-2xl font-bold ${
            trends.successTrend === "improving" ? "text-green-600" :
            trends.successTrend === "declining" ? "text-red-600" :
            "text-gray-600"
          }`}>
            {trends.successTrend === "improving" ? "🎯 Improving" :
             trends.successTrend === "declining" ? "⚠️ Declining" :
             "➡️ Stable"}
          </div>
        </Card>
        <Card className="text-center">
          <p className="text-sm text-gray-600 mb-1">Weekly Average</p>
          <div className="text-2xl font-bold text-blue-600">
            {trends.averageWeeklyApplications} apps/week
          </div>
        </Card>
      </div>

      {/* Weekly Chart */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">Weekly Application Trends</h3>
        <div className="space-y-3">
          {trends.weekly?.map((week, idx) => (
            <div key={idx} className="flex items-center gap-4">
              <div className="w-32 text-sm text-gray-600">{week.week}</div>
              <div className="flex-1">
                <div className="flex gap-1 h-8">
                  <div
                    className="bg-blue-500 rounded-l transition-all"
                    style={{ width: `${(week.applications / maxApps) * 100}%` }}
                    title={`${week.applications} applications`}
                  />
                  <div
                    className="bg-green-500 transition-all"
                    style={{ width: `${(week.responses / maxApps) * 100}%` }}
                    title={`${week.responses} responses`}
                  />
                  <div
                    className="bg-purple-500 rounded-r transition-all"
                    style={{ width: `${(week.interviews / maxApps) * 100}%` }}
                    title={`${week.interviews} interviews`}
                  />
                </div>
              </div>
              <div className="w-32 text-right text-sm">
                <span className="text-blue-600">{week.applications}</span>
                <span className="text-gray-400 mx-1">/</span>
                <span className="text-green-600">{week.responses}</span>
                <span className="text-gray-400 mx-1">/</span>
                <span className="text-purple-600">{week.interviews}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-4 text-xs text-gray-500">
          <span><span className="inline-block w-3 h-3 bg-blue-500 rounded mr-1"></span> Applications</span>
          <span><span className="inline-block w-3 h-3 bg-green-500 rounded mr-1"></span> Responses</span>
          <span><span className="inline-block w-3 h-3 bg-purple-500 rounded mr-1"></span> Interviews</span>
        </div>
      </Card>

      {/* Peak Week */}
      {trends.peakWeek && (
        <Card className="bg-blue-50 border-blue-200">
          <div className="flex items-center gap-4">
            <span className="text-3xl">🏆</span>
            <div>
              <p className="font-semibold text-blue-800">Peak Performance Week</p>
              <p className="text-blue-700">
                {trends.peakWeek.week}: {trends.peakWeek.applications} applications
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// Goals Tab
// ============================================================================
function GoalsTab({ goals, onEditGoals }) {
  if (!goals) {
    return (
      <Card className="text-center py-12">
        <div className="text-4xl mb-4">🎯</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Set Your Goals</h3>
        <p className="text-gray-600 mb-4">Define targets to track your progress</p>
        <Button onClick={onEditGoals}>Set Goals</Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Weekly Goals */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">📅 This Week</h3>
          <Button size="sm" variant="outline" onClick={onEditGoals}>Edit Goals</Button>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <GoalProgressCard
            title="Applications"
            current={goals.weekly?.applications?.current || 0}
            target={goals.weekly?.applications?.target || 10}
            percentage={goals.weekly?.applications?.percentage || 0}
            onTrack={goals.weekly?.applications?.onTrack}
          />
        </div>
      </Card>

      {/* Monthly Goals */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">📆 This Month</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <GoalProgressCard
            title="Applications"
            current={goals.monthly?.applications?.current || 0}
            target={goals.monthly?.applications?.target || 40}
            percentage={goals.monthly?.applications?.percentage || 0}
            onTrack={goals.monthly?.applications?.onTrack}
          />
          <GoalProgressCard
            title="Interviews"
            current={goals.monthly?.interviews?.current || 0}
            target={goals.monthly?.interviews?.target || 4}
            percentage={goals.monthly?.interviews?.percentage || 0}
            onTrack={goals.monthly?.interviews?.onTrack}
          />
          <GoalProgressCard
            title="Offers"
            current={goals.monthly?.offers?.current || 0}
            target={goals.monthly?.offers?.target || 1}
            percentage={goals.monthly?.offers?.percentage || 0}
            onTrack={goals.monthly?.offers?.onTrack}
          />
        </div>
      </Card>

      {/* Overall Goals */}
      {(goals.overall?.targetRole || goals.overall?.targetSalary || goals.overall?.targetDate) && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">🎯 Overall Targets</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {goals.overall?.targetRole && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Target Role</p>
                <p className="text-lg font-semibold text-gray-900">{goals.overall.targetRole}</p>
              </div>
            )}
            {goals.overall?.targetSalary && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Target Salary</p>
                <p className="text-lg font-semibold text-gray-900">
                  ${goals.overall.targetSalary.toLocaleString()}
                </p>
              </div>
            )}
            {goals.overall?.targetDate && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Target Date</p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(goals.overall.targetDate).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

function GoalProgressCard({ title, current, target, percentage, onTrack }) {
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <span className="font-medium text-gray-900">{title}</span>
        <span className={`text-sm font-medium ${onTrack ? "text-green-600" : "text-orange-600"}`}>
          {onTrack ? "✓ On Track" : "⚠️ Behind"}
        </span>
      </div>
      <div className="flex items-end gap-2 mb-2">
        <span className="text-3xl font-bold text-gray-900">{current}</span>
        <span className="text-gray-500 mb-1">/ {target}</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${percentage >= 100 ? "bg-green-500" : percentage >= 50 ? "bg-blue-500" : "bg-orange-500"}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <p className="text-sm text-gray-500 mt-1">{percentage}% complete</p>
    </div>
  );
}

// ============================================================================
// Insights Tab
// ============================================================================
function InsightsTab({ insights }) {
  if (!insights || insights.length === 0) {
    return (
      <Card className="text-center py-12">
        <div className="text-4xl mb-4">💡</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Insights Yet</h3>
        <p className="text-gray-600">Continue your job search to receive personalized insights</p>
      </Card>
    );
  }

  const priorityStyles = {
    high: "border-red-200 bg-red-50",
    medium: "border-yellow-200 bg-yellow-50",
    low: "border-green-200 bg-green-50",
  };

  const typeIcons = {
    warning: "⚠️",
    success: "✅",
    info: "ℹ️",
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Actionable Insights</h3>
      {insights.map((insight, idx) => (
        <Card key={idx} className={`border ${priorityStyles[insight.priority]}`}>
          <div className="flex items-start gap-4">
            <span className="text-2xl">{typeIcons[insight.type]}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  insight.priority === "high" ? "bg-red-100 text-red-700" :
                  insight.priority === "medium" ? "bg-yellow-100 text-yellow-700" :
                  "bg-green-100 text-green-700"
                }`}>
                  {insight.priority} priority
                </span>
              </div>
              <p className="text-gray-700 mb-3">{insight.description}</p>
              {insight.actions && insight.actions.length > 0 && (
                <div className="bg-white bg-opacity-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Recommended Actions:</p>
                  <ul className="space-y-1">
                    {insight.actions.map((action, i) => (
                      <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-blue-500">→</span>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ============================================================================
// Patterns Tab
// ============================================================================
function PatternsTab({ patterns }) {
  if (!patterns?.hasEnoughData) {
    return (
      <Card className="text-center py-12">
        <div className="text-4xl mb-4">✨</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Building Your Success Profile</h3>
        <p className="text-gray-600">{patterns?.message || "Need more successful applications to identify patterns"}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Industries */}
      {patterns.topIndustries?.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">🏢 Best Industries for You</h3>
          <div className="space-y-3">
            {patterns.topIndustries.map((ind, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-medium text-gray-900">{ind.industry}</span>
                  <span className="text-sm text-gray-500 ml-2">({ind.applications} applications)</span>
                </div>
                <span className={`font-bold ${parseFloat(ind.successRate) >= 30 ? "text-green-600" : "text-gray-600"}`}>
                  {ind.successRate}% success
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Work Mode Analysis */}
      {patterns.topWorkModes?.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">🏠 Work Mode Success</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {patterns.topWorkModes.map((mode, idx) => (
              <div key={idx} className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl mb-2">
                  {mode.mode === "Remote" ? "🏠" : mode.mode === "Hybrid" ? "🔄" : "🏢"}
                </p>
                <p className="font-medium text-gray-900">{mode.mode}</p>
                <p className="text-2xl font-bold text-blue-600 mt-2">{mode.successRate}%</p>
                <p className="text-sm text-gray-500">{mode.applications} apps</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Best Days */}
      {patterns.bestDays?.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">📅 Best Days to Apply</h3>
          <div className="flex flex-wrap gap-3">
            {patterns.bestDays.map((day, idx) => (
              <div key={idx} className={`px-4 py-2 rounded-lg ${idx === 0 ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}`}>
                <span className="font-medium">{day.day}</span>
                <span className="ml-2">{day.successRate}% success</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recommendations */}
      {patterns.recommendations?.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <h3 className="text-lg font-semibold mb-3 text-blue-800">💡 Pattern-Based Recommendations</h3>
          <ul className="space-y-2">
            {patterns.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-2 text-blue-700">
                <span>✓</span>
                {rec}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// Goal Editor Modal
// ============================================================================
function GoalEditorModal({ goals, onChange, onSave, onCancel, saving }) {
  const handleChange = (path, value) => {
    const newGoals = JSON.parse(JSON.stringify(goals));
    const keys = path.split(".");
    let obj = newGoals;
    for (let i = 0; i < keys.length - 1; i++) {
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
    onChange(newGoals);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Edit Search Goals</h2>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Weekly Goals */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Weekly Goals</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="goal-weekly-applications" className="block text-sm font-medium text-gray-700 mb-1">
                  Applications per Week
                </label>
                <input
                  id="goal-weekly-applications"
                  type="number"
                  min="0"
                  value={goals.weekly?.applications?.target || 10}
                  onChange={(e) => handleChange("weekly.applications.target", parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label htmlFor="goal-weekly-networking" className="block text-sm font-medium text-gray-700 mb-1">
                  Networking Activities per Week
                </label>
                <input
                  id="goal-weekly-networking"
                  type="number"
                  min="0"
                  value={goals.weekly?.networking?.target || 5}
                  onChange={(e) => handleChange("weekly.networking.target", parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Monthly Goals */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Monthly Goals</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="goal-monthly-applications" className="block text-sm font-medium text-gray-700 mb-1">
                  Applications
                </label>
                <input
                  id="goal-monthly-applications"
                  type="number"
                  min="0"
                  value={goals.monthly?.applications?.target || 40}
                  onChange={(e) => handleChange("monthly.applications.target", parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label htmlFor="goal-monthly-interviews" className="block text-sm font-medium text-gray-700 mb-1">
                  Interviews
                </label>
                <input
                  id="goal-monthly-interviews"
                  type="number"
                  min="0"
                  value={goals.monthly?.interviews?.target || 4}
                  onChange={(e) => handleChange("monthly.interviews.target", parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label htmlFor="goal-monthly-offers" className="block text-sm font-medium text-gray-700 mb-1">
                  Offers
                </label>
                <input
                  id="goal-monthly-offers"
                  type="number"
                  min="0"
                  value={goals.monthly?.offers?.target || 1}
                  onChange={(e) => handleChange("monthly.offers.target", parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Overall Targets */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Overall Targets</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="goal-target-role" className="block text-sm font-medium text-gray-700 mb-1">
                  Target Role
                </label>
                <input
                  id="goal-target-role"
                  type="text"
                  value={goals.overall?.targetRole || ""}
                  onChange={(e) => handleChange("overall.targetRole", e.target.value)}
                  placeholder="e.g., Software Engineer"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label htmlFor="goal-target-salary" className="block text-sm font-medium text-gray-700 mb-1">
                  Target Salary
                </label>
                <input
                  id="goal-target-salary"
                  type="number"
                  min="0"
                  value={goals.overall?.targetSalary || ""}
                  onChange={(e) => handleChange("overall.targetSalary", parseInt(e.target.value) || null)}
                  placeholder="e.g., 100000"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label htmlFor="goal-target-date" className="block text-sm font-medium text-gray-700 mb-1">
                  Target Date
                </label>
                <input
                  id="goal-target-date"
                  type="date"
                  value={goals.overall?.targetDate ? new Date(goals.overall.targetDate).toISOString().split('T')[0] : ""}
                  onChange={(e) => handleChange("overall.targetDate", e.target.value || null)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={saving}>
            {saving ? "Saving..." : "Save Goals"}
          </Button>
        </div>
      </div>
    </div>
  );
}
