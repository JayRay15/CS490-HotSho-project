import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import {
  getPredictiveAnalyticsDashboard,
  getInterviewSuccessPredictions,
  getJobSearchTimelineForecast,
  getSalaryPredictions,
  getOptimalTimingPredictions,
  getScenarioPlanning,
  getImprovementRecommendations,
  getAccuracyTracking
} from "../api/predictiveAnalytics";

const PredictiveAnalytics = () => {
  const { user, isLoaded } = useUser();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Data states
  const [dashboardData, setDashboardData] = useState(null);
  const [interviewPredictions, setInterviewPredictions] = useState(null);
  const [timelineForecast, setTimelineForecast] = useState(null);
  const [salaryPredictions, setSalaryPredictions] = useState(null);
  const [timingPredictions, setTimingPredictions] = useState(null);
  const [scenarios, setScenarios] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [accuracy, setAccuracy] = useState(null);

  useEffect(() => {
    if (isLoaded && user) {
      fetchAllData();
    }
  }, [isLoaded, user]);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all data in parallel
      const [
        dashboard,
        interviews,
        timeline,
        salary,
        timing,
        scenarioData,
        recs,
        acc
      ] = await Promise.all([
        getPredictiveAnalyticsDashboard().catch(e => ({ error: e.message })),
        getInterviewSuccessPredictions().catch(e => ({ error: e.message })),
        getJobSearchTimelineForecast().catch(e => ({ error: e.message })),
        getSalaryPredictions().catch(e => ({ error: e.message })),
        getOptimalTimingPredictions().catch(e => ({ error: e.message })),
        getScenarioPlanning().catch(e => ({ error: e.message })),
        getImprovementRecommendations().catch(e => ({ error: e.message })),
        getAccuracyTracking().catch(e => ({ error: e.message }))
      ]);

      setDashboardData(dashboard);
      setInterviewPredictions(interviews);
      setTimelineForecast(timeline);
      setSalaryPredictions(salary);
      setTimingPredictions(timing);
      setScenarios(scenarioData);
      setRecommendations(recs);
      setAccuracy(acc);
    } catch (err) {
      setError(err.message || "Failed to fetch predictive analytics");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: "" },
    { id: "interview", label: "Interview Success", icon: "" },
    { id: "timeline", label: "Job Search Timeline", icon: "" },
    { id: "salary", label: "Salary Predictions", icon: "" },
    { id: "timing", label: "Optimal Timing", icon: "" },
    { id: "scenarios", label: "Scenario Planning", icon: "" },
    { id: "recommendations", label: "Recommendations", icon: "" },
    { id: "accuracy", label: "Accuracy Tracking", icon: "" }
  ];

  // Helper function to get confidence color
  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return "text-green-600 bg-green-100";
    if (confidence >= 60) return "text-blue-600 bg-blue-100";
    if (confidence >= 40) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  // Helper function to get probability color
  const getProbabilityColor = (probability) => {
    if (probability >= 0.7) return "text-green-600";
    if (probability >= 0.5) return "text-blue-600";
    if (probability >= 0.3) return "text-yellow-600";
    return "text-red-600";
  };

  // Helper function to get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "critical": return "bg-red-100 text-red-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      default: return "bg-green-100 text-green-800";
    }
  };

  // Render Overview Tab
  const renderOverview = () => {
    const data = dashboardData?.data;
    if (!data) {
      return <div className="text-gray-500 text-center py-8">No dashboard data available</div>;
    }

    return (
      <div className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <h3 className="text-sm font-medium opacity-90">Interview Success Probability</h3>
            <p className="text-3xl font-bold mt-2">{(data.summary?.overallSuccessProbability * 100 || 0).toFixed(0)}%</p>
            <p className="text-sm opacity-75 mt-1">Based on your history</p>
          </div>
          
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
            <h3 className="text-sm font-medium opacity-90">Predicted Time to Offer</h3>
            <p className="text-3xl font-bold mt-2">{data.summary?.predictedTimeToOffer || "N/A"}</p>
            <p className="text-sm opacity-75 mt-1">Days until expected offer</p>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <h3 className="text-sm font-medium opacity-90">Salary Potential</h3>
            <p className="text-3xl font-bold mt-2">${(data.summary?.expectedSalaryRange?.median || 0).toLocaleString()}</p>
            <p className="text-sm opacity-75 mt-1">Expected median</p>
          </div>
          
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
            <h3 className="text-sm font-medium opacity-90">Prediction Accuracy</h3>
            <p className="text-3xl font-bold mt-2">{(data.summary?.predictionAccuracy || 0).toFixed(0)}%</p>
            <p className="text-sm opacity-75 mt-1">Historical accuracy</p>
          </div>
        </div>

        {/* Key Insights */}
        {data.keyInsights && data.keyInsights.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span></span> Key Insights
            </h3>
            <div className="space-y-3">
              {data.keyInsights.map((insight, index) => (
                <div key={index} className={`p-4 rounded-lg ${
                  insight.type === "positive" ? "bg-green-50 border border-green-200" :
                  insight.type === "warning" ? "bg-yellow-50 border border-yellow-200" :
                  "bg-blue-50 border border-blue-200"
                }`}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">
                      {insight.type === "positive" ? "" : insight.type === "warning" ? "" : "?"}
                    </span>
                    <div>
                      <h4 className="font-medium">{insight.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {data.quickActions && data.quickActions.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span></span> Quick Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.quickActions.map((action, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                  <span className="text-2xl">{action.icon}</span>
                  <div>
                    <h4 className="font-medium">{action.title}</h4>
                    <p className="text-sm text-gray-600">{action.expectedImpact}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render Interview Success Tab
  const renderInterviewSuccess = () => {
    const data = interviewPredictions?.data;
    if (!data) {
      return <div className="text-gray-500 text-center py-8">No interview prediction data available</div>;
    }

    // Map backend data to frontend expectations
    const overallSuccessRate = (data.overall?.historicalSuccessRate || 50) / 100;

    return (
      <div className="space-y-6">
        {/* Overall Prediction */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>📊</span> Overall Interview Success Rate
          </h3>
          
          <div className="flex items-center gap-6">
            <div className={`text-5xl font-bold ${getProbabilityColor(overallSuccessRate)}`}>
              {(overallSuccessRate * 100).toFixed(0)}%
            </div>
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className={`h-4 rounded-full ${
                    overallSuccessRate >= 0.7 ? "bg-green-500" :
                    overallSuccessRate >= 0.5 ? "bg-blue-500" :
                    overallSuccessRate >= 0.3 ? "bg-yellow-500" : "bg-red-500"
                  }`}
                  style={{ width: `${overallSuccessRate * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>Low</span>
                <span>Medium</span>
                <span>High</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-xl font-bold text-gray-800">{data.overall?.totalCompleted || 0}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg text-center">
              <p className="text-sm text-gray-600">Successful</p>
              <p className="text-xl font-bold text-green-600">{data.overall?.totalSuccessful || 0}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg text-center">
              <p className="text-sm text-gray-600">Upcoming</p>
              <p className="text-xl font-bold text-blue-600">{data.overall?.upcomingCount || 0}</p>
            </div>
          </div>
        </div>

        {/* Trend */}
        {data.trend && data.trend.direction !== "Insufficient Data" && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>📈</span> Performance Trend
            </h3>
            <div className={`text-center p-4 rounded-lg ${
              data.trend.direction === "Improving" ? "bg-green-50" :
              data.trend.direction === "Declining" ? "bg-red-50" : "bg-gray-50"
            }`}>
              <p className={`text-2xl font-bold ${
                data.trend.direction === "Improving" ? "text-green-600" :
                data.trend.direction === "Declining" ? "text-red-600" : "text-gray-600"
              }`}>
                {data.trend.direction} {data.trend.change > 0 ? "+" : ""}{data.trend.change}%
              </p>
              <p className="text-sm text-gray-600 mt-1">
                First period: {data.trend.firstPeriodRate}% → Recent: {data.trend.secondPeriodRate}%
              </p>
            </div>
          </div>
        )}

        {/* Upcoming Interview Predictions */}
        {data.predictions && data.predictions.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>🎯</span> Upcoming Interview Predictions
            </h3>
            <div className="space-y-4">
              {data.predictions.map((pred, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{pred.company}</h4>
                      <p className="text-sm text-gray-600">{pred.position} - {pred.interviewType}</p>
                      <p className="text-xs text-gray-500">{new Date(pred.scheduledDate).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${getProbabilityColor(pred.successProbability / 100)}`}>
                        {pred.successProbability}%
                      </p>
                      <p className="text-xs text-gray-500">
                        Range: {pred.confidenceInterval?.low}% - {pred.confidenceInterval?.high}%
                      </p>
                    </div>
                  </div>
                  {pred.recommendations && pred.recommendations.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm font-medium text-gray-700 mb-2">Recommendations:</p>
                      <ul className="space-y-1">
                        {pred.recommendations.map((rec, i) => (
                          <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                            <span className={`text-xs px-1 rounded ${
                              rec.priority === "High" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                            }`}>{rec.priority}</span>
                            {rec.action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render Job Search Timeline Tab
  const renderTimeline = () => {
    const data = timelineForecast?.data;
    if (!data) {
      return <div className="text-gray-500 text-center py-8">No timeline forecast data available</div>;
    }

    return (
      <div className="space-y-6">
        {/* Timeline Summary */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>📅</span> Estimated Job Search Timeline
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Estimated Weeks to Offer</p>
              <p className="text-4xl font-bold text-blue-600 mt-2">{data.forecast?.estimatedWeeksToOffer || "N/A"}</p>
              <p className="text-xs text-gray-500 mt-1">weeks</p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Target Date</p>
              <p className="text-2xl font-bold text-green-600 mt-2">{data.forecast?.estimatedOfferDate || "N/A"}</p>
              <p className="text-xs text-gray-500 mt-1">estimated offer date</p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600">Confidence Level</p>
              <p className="text-4xl font-bold text-purple-600 mt-2">{data.forecast?.confidenceLevel || "N/A"}</p>
              <p className="text-xs text-gray-500 mt-1">
                {data.forecast?.confidenceInterval?.optimistic} - {data.forecast?.confidenceInterval?.pessimistic} weeks
              </p>
            </div>
          </div>
        </div>

        {/* Current Velocity */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>🚀</span> Application Velocity
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-sm text-gray-600">Weekly Applications</p>
              <p className="text-2xl font-bold text-blue-600">{data.currentVelocity?.weeklyApplications || 0}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-sm text-gray-600">Monthly Applications</p>
              <p className="text-2xl font-bold text-blue-600">{data.currentVelocity?.monthlyApplications || 0}</p>
            </div>
            <div className={`p-4 rounded-lg text-center ${
              data.currentVelocity?.trend === "Good" ? "bg-green-50" :
              data.currentVelocity?.trend === "Moderate" ? "bg-yellow-50" : "bg-red-50"
            }`}>
              <p className="text-sm text-gray-600">Trend</p>
              <p className={`text-2xl font-bold ${
                data.currentVelocity?.trend === "Good" ? "text-green-600" :
                data.currentVelocity?.trend === "Moderate" ? "text-yellow-600" : "text-red-600"
              }`}>{data.currentVelocity?.trend || "N/A"}</p>
            </div>
          </div>
        </div>

        {/* Conversion Rates */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>📊</span> Conversion Rates
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Application → Interview</p>
              <p className="text-2xl font-bold text-blue-600">{data.conversionRates?.applicationToInterview || 0}%</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Interview → Offer</p>
              <p className="text-2xl font-bold text-green-600">{data.conversionRates?.interviewToOffer || 0}%</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600">Overall Funnel</p>
              <p className="text-2xl font-bold text-purple-600">{data.conversionRates?.overallFunnel || 0}%</p>
            </div>
          </div>
        </div>

        {/* Milestones */}
        {data.milestones && data.milestones.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>🎯</span> Weekly Milestones
            </h3>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
              <div className="space-y-4">
                {data.milestones.slice(0, 8).map((milestone, index) => (
                  <div key={index} className="relative flex items-start gap-4 pl-10">
                    <div className="absolute left-2 w-4 h-4 rounded-full bg-blue-500" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Week {milestone.week}</h4>
                        <span className="text-sm text-gray-500">{milestone.date}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{milestone.milestone}</p>
                      <div className="flex gap-4 text-xs text-gray-500 mt-1">
                        <span>Apps: {milestone.expectedApplications}</span>
                        <span>Interviews: {milestone.expectedInterviews}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {data.recommendations && data.recommendations.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>💡</span> Timeline Recommendations
            </h3>
            <div className="space-y-3">
              {data.recommendations.map((rec, index) => (
                <div key={index} className={`p-4 rounded-lg ${
                  rec.priority === "High" ? "bg-orange-50 border border-orange-200" : "bg-blue-50 border border-blue-200"
                }`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        rec.priority === "High" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
                      }`}>{rec.priority}</span>
                      <p className="font-medium mt-2">{rec.action}</p>
                      <p className="text-sm text-green-600 mt-1">{rec.expectedImpact}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render Salary Predictions Tab
  const renderSalary = () => {
    const data = salaryPredictions?.data;
    if (!data) {
      return <div className="text-gray-500 text-center py-8">No salary prediction data available</div>;
    }

    return (
      <div className="space-y-6">
        {/* Salary Overview */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>💰</span> Salary Range Analysis
          </h3>
          
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <p className="text-sm text-gray-600">Minimum</p>
              <p className="text-2xl font-bold text-gray-600">${(data.overview?.avgSalaryRangeMin || 0).toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Average</p>
              <p className="text-4xl font-bold text-green-600">
                ${Math.round((data.overview?.avgSalaryRangeMin + data.overview?.avgSalaryRangeMax) / 2 || 0).toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Maximum</p>
              <p className="text-2xl font-bold text-gray-600">${(data.overview?.avgSalaryRangeMax || 0).toLocaleString()}</p>
            </div>
          </div>
          
          <div className="mt-4 w-full bg-gray-200 rounded-full h-3 relative">
            <div 
              className="absolute h-3 bg-gradient-to-r from-gray-400 via-green-500 to-gray-400 rounded-full"
              style={{ left: "10%", right: "10%", width: "80%" }}
            />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Jobs Analyzed</p>
              <p className="text-xl font-bold text-gray-800">{data.overview?.jobsAnalyzed || 0}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Offers Received</p>
              <p className="text-xl font-bold text-green-600">{data.overview?.offersReceived || 0}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Performance Multiplier</p>
              <p className="text-xl font-bold text-blue-600">{data.overview?.performanceMultiplier || 1}x</p>
            </div>
          </div>
        </div>

        {/* Market Insights */}
        {data.marketInsights && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>📈</span> Market Insights
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Negotiation Success Rate</p>
                <p className="text-2xl font-bold text-blue-600">{data.marketInsights.negotiationSuccessRate}%</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Avg Negotiation Increase</p>
                <p className="text-2xl font-bold text-green-600">{data.marketInsights.avgNegotiationIncrease}</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">Best Time to Negotiate</p>
                <p className="text-sm font-bold text-purple-600 mt-1">{data.marketInsights.bestTimeToNegotiate}</p>
              </div>
            </div>
          </div>
        )}

        {/* Job Predictions */}
        {data.predictions && data.predictions.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>🎯</span> Salary Predictions by Job
            </h3>
            <div className="space-y-4">
              {data.predictions.map((pred, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{pred.company}</h4>
                      <p className="text-sm text-gray-600">{pred.position}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      pred.confidenceLevel === "High" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    }`}>{pred.confidenceLevel} Confidence</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <p className="text-xs text-gray-500">Range Min</p>
                      <p className="font-medium">${pred.salaryRange?.min?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Likely Offer</p>
                      <p className="font-medium text-blue-600">${pred.prediction?.likelyOffer?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">With Negotiation</p>
                      <p className="font-medium text-green-600">${pred.prediction?.withNegotiation?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Expected Gain</p>
                      <p className="font-medium text-purple-600">+{pred.prediction?.expectedGain}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {data.recommendations && data.recommendations.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>💡</span> Negotiation Tips
            </h3>
            <div className="space-y-3">
              {data.recommendations.map((rec, index) => (
                <div key={index} className={`p-4 rounded-lg ${
                  rec.priority === "High" ? "bg-orange-50 border border-orange-200" : "bg-blue-50 border border-blue-200"
                }`}>
                  <span className={`text-xs px-2 py-1 rounded ${
                    rec.priority === "High" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
                  }`}>{rec.priority}</span>
                  <p className="font-medium mt-2">{rec.action}</p>
                  <p className="text-sm text-green-600 mt-1">{rec.expectedImpact}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render Optimal Timing Tab
  const renderTiming = () => {
    const data = timingPredictions?.data;
    if (!data) {
      return <div className="text-gray-500 text-center py-8">No timing prediction data available</div>;
    }

    return (
      <div className="space-y-6">
        {/* Interview Timing */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>📅</span> Best Interview Times
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Best Days */}
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Best Days for Interviews</h4>
              {data.interviewTiming?.bestDays && data.interviewTiming.bestDays.length > 0 ? (
                <div className="space-y-2">
                  {data.interviewTiming.bestDays.map((day, index) => (
                    <div key={index} className={`p-3 rounded-lg ${index === 0 ? "bg-green-50" : "bg-gray-50"}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{day.day}</span>
                        <span className={`text-sm font-bold ${index === 0 ? "text-green-600" : "text-gray-600"}`}>
                          {day.successRate}% success
                        </span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        day.confidence === "High" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                      }`}>{day.confidence} confidence</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Need more interview data to determine best days</p>
              )}
            </div>
            
            {/* Best Time Slots */}
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Best Time Slots</h4>
              {data.interviewTiming?.bestTimeSlots && data.interviewTiming.bestTimeSlots.length > 0 ? (
                <div className="space-y-2">
                  {data.interviewTiming.bestTimeSlots.map((slot, index) => (
                    <div key={index} className={`p-3 rounded-lg ${index === 0 ? "bg-blue-50" : "bg-gray-50"}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{slot.timeSlot}</span>
                        <span className={`text-sm font-bold ${index === 0 ? "text-blue-600" : "text-gray-600"}`}>
                          {slot.successRate}% success
                        </span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        slot.confidence === "High" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                      }`}>{slot.confidence} confidence</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Need more interview data to determine best times</p>
              )}
            </div>
          </div>

          {/* Times to Avoid */}
          {data.interviewTiming?.avoidTimes && data.interviewTiming.avoidTimes.length > 0 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">
                <strong>Times to Avoid:</strong> {data.interviewTiming.avoidTimes.join(", ")}
              </p>
            </div>
          )}
        </div>

        {/* Application Timing */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>📤</span> Application Timing Analysis
          </h3>
          
          {/* Best Months */}
          {data.applicationTiming?.bestMonths && data.applicationTiming.bestMonths.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-3">Best Months for Applications</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {data.applicationTiming.bestMonths.map((month, index) => (
                  <div key={index} className={`p-3 rounded-lg ${index === 0 ? "bg-green-50" : "bg-gray-50"}`}>
                    <p className="font-medium">{month.month}</p>
                    <p className="text-sm text-gray-600">{month.applications} apps, {month.interviews} interviews</p>
                    <p className={`text-sm font-bold ${index === 0 ? "text-green-600" : "text-gray-600"}`}>
                      {month.conversionRate}% conversion
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Market Cycles */}
          {data.applicationTiming?.marketCycles && (
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Market Hiring Cycles</h4>
              <div className="space-y-2">
                {data.applicationTiming.marketCycles.map((cycle, index) => (
                  <div key={index} className={`p-3 rounded-lg ${
                    cycle.activity === "High" ? "bg-green-50" : "bg-orange-50"
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{cycle.period}</span>
                      <span className={`text-sm font-bold ${
                        cycle.activity === "High" ? "text-green-600" : "text-orange-600"
                      }`}>{cycle.activity} Activity</span>
                    </div>
                    <p className="text-sm text-gray-600">{cycle.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recommendations */}
        {data.careerMoveRecommendations && data.careerMoveRecommendations.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>💡</span> Timing Recommendations
            </h3>
            <div className="space-y-3">
              {data.careerMoveRecommendations.map((rec, index) => (
                <div key={index} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-blue-800">{rec.timing}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      rec.confidence === "High" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    }`}>{rec.confidence} confidence</span>
                  </div>
                  <p className="text-sm text-gray-700">{rec.recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render Scenarios Tab
  const renderScenarios = () => {
    const data = scenarios?.data;
    if (!data) {
      return <div className="text-gray-500 text-center py-8">No scenario data available</div>;
    }

    return (
      <div className="space-y-6">
        {/* Current State */}
        {data.currentState && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>📊</span> Current State
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-sm text-gray-600">Weekly Apps</p>
                <p className="text-xl font-bold text-blue-600">{data.currentState.weeklyApps?.toFixed(1) || 0}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-sm text-gray-600">Interview Rate</p>
                <p className="text-xl font-bold text-green-600">{data.currentState.interviewRate?.toFixed(1) || 0}%</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-xl font-bold text-purple-600">{data.currentState.successRate?.toFixed(1) || 0}%</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-sm text-gray-600">Prep Score</p>
                <p className="text-xl font-bold text-orange-600">{data.currentState.prepScore?.toFixed(0) || 50}</p>
              </div>
            </div>
          </div>
        )}

        {/* Recommendation */}
        {data.recommendation && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-green-800">
              <span>✨</span> Recommended Strategy: {data.recommendation.recommended}
            </h3>
            <p className="text-gray-700">{data.recommendation.reason}</p>
            {data.recommendation.alternativeIfUrgent && (
              <p className="text-sm text-gray-600 mt-2">
                <strong>If urgent:</strong> Consider "{data.recommendation.alternativeIfUrgent}" approach
              </p>
            )}
          </div>
        )}

        {/* Scenario Cards */}
        {data.scenarios && data.scenarios.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {data.scenarios.map((scenario, index) => (
              <div key={index} className={`bg-white rounded-xl shadow-sm border p-6 ${
                data.recommendation?.recommended === scenario.name ? "ring-2 ring-green-500" : ""
              }`}>
                {data.recommendation?.recommended === scenario.name && (
                  <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded mb-3">
                    Recommended
                  </span>
                )}
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  {scenario.name}
                </h3>
                <p className="text-sm text-gray-600 mt-2">{scenario.description}</p>
                
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Weeks to Offer</span>
                    <span className="font-bold text-blue-600">{scenario.projectedWeeksToOffer} weeks</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Target Date</span>
                    <span className="font-bold text-green-600">{scenario.projectedOfferDate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Effort Level</span>
                    <span className={`font-bold ${
                      scenario.effortLevel === "High" ? "text-red-600" :
                      scenario.effortLevel.includes("High") ? "text-orange-600" : "text-green-600"
                    }`}>{scenario.effortLevel}</span>
                  </div>
                </div>

                {/* Adjustments */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-700 mb-2">Projected Metrics:</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-gray-500">Weekly Apps</p>
                      <p className="font-bold">{scenario.adjustments?.weeklyApplications}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Interview Rate</p>
                      <p className="font-bold">{scenario.adjustments?.interviewRate}%</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Success Rate</p>
                      <p className="font-bold">{scenario.adjustments?.successRate}%</p>
                    </div>
                  </div>
                </div>

                {/* Benefits & Risks */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {scenario.benefits && scenario.benefits.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-green-700 mb-1">Benefits:</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {scenario.benefits.slice(0, 2).map((b, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span className="text-green-500">✓</span> {b}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {scenario.risks && scenario.risks.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-red-700 mb-1">Risks:</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {scenario.risks.slice(0, 2).map((r, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span className="text-red-500">!</span> {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render Recommendations Tab
  const renderRecommendations = () => {
    const data = recommendations?.data;
    if (!data) {
      return <div className="text-gray-500 text-center py-8">No recommendations available</div>;
    }

    return (
      <div className="space-y-6">
        {/* Overall Assessment */}
        {data.overallAssessment && (
          <div className={`rounded-xl p-6 ${
            data.overallAssessment.level === "Strong" ? "bg-green-50 border border-green-200" :
            data.overallAssessment.level === "Moderate" ? "bg-yellow-50 border border-yellow-200" :
            "bg-red-50 border border-red-200"
          }`}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">
                {data.overallAssessment.level === "Strong" ? "✅" :
                 data.overallAssessment.level === "Moderate" ? "⚠️" : "🔴"}
              </span>
              <div>
                <h3 className="text-lg font-semibold">
                  Overall Assessment: {data.overallAssessment.level}
                </h3>
                <p className="text-gray-700">{data.overallAssessment.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Potential Improvement */}
        {data.potentialImprovement && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-blue-800">
              <strong>Potential Improvement:</strong> Following these recommendations could improve your outcomes by{" "}
              <span className="font-bold">{data.potentialImprovement}</span>
            </p>
          </div>
        )}

        {/* Recommendations */}
        {data.recommendations && data.recommendations.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span>💡</span> Action Items
            </h3>
            {data.recommendations.map((rec, index) => (
              <div key={index} className={`bg-white rounded-xl shadow-sm border p-6 ${
                rec.priority === "High" ? "border-l-4 border-l-red-500" :
                "border-l-4 border-l-blue-500"
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      rec.priority === "High" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                    }`}>{rec.priority} Priority</span>
                    <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 ml-2">
                      {rec.category}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">{rec.timeframe}</span>
                </div>
                
                <h4 className="font-semibold text-lg mb-2">{rec.recommendation}</h4>
                
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Current:</strong> {rec.currentState}
                </p>
                
                <p className="text-sm text-green-600 font-medium mb-3">
                  Expected: {rec.expectedImprovement}
                </p>

                {rec.actionItems && rec.actionItems.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm font-medium text-gray-700 mb-2">Action Steps:</p>
                    <ul className="space-y-2">
                      {rec.actionItems.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                            {i + 1}
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render Accuracy Tab
  const renderAccuracy = () => {
    const data = accuracy?.data;
    if (!data) {
      return <div className="text-gray-500 text-center py-8">No accuracy data available</div>;
    }

    return (
      <div className="space-y-6">
        {/* Overall Accuracy */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>📊</span> Prediction Accuracy Metrics
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Overall Accuracy</p>
              <p className="text-4xl font-bold text-blue-600 mt-2">
                {data.overallAccuracy || 0}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {data.sampleSize || 0} predictions tracked
              </p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Close Accuracy</p>
              <p className="text-4xl font-bold text-green-600 mt-2">
                {data.closeAccuracy || 0}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Within 30% margin
              </p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600">Confidence Level</p>
              <p className="text-2xl font-bold text-purple-600 mt-2">
                {data.confidenceLevel || "N/A"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Trend: {data.trend || "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Calibration */}
        {data.calibration && (
          <div className={`rounded-xl p-6 ${
            data.calibration.isCalibrated ? "bg-green-50 border border-green-200" : "bg-yellow-50 border border-yellow-200"
          }`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{data.calibration.isCalibrated ? "✅" : "⚠️"}</span>
              <div>
                <h3 className="font-semibold">Calibration Status</h3>
                <p className="text-gray-700">{data.calibration.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Breakdown by Confidence */}
        {data.breakdown && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>📈</span> Accuracy by Confidence Level
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-800">High Confidence</h4>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  {data.breakdown.highConfidence?.accuracy || 0}%
                </p>
                <p className="text-sm text-gray-600">
                  {data.breakdown.highConfidence?.sampleSize || 0} predictions
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800">Medium Confidence</h4>
                <p className="text-2xl font-bold text-blue-600 mt-2">
                  {data.breakdown.mediumConfidence?.accuracy || 0}%
                </p>
                <p className="text-sm text-gray-600">
                  {data.breakdown.mediumConfidence?.sampleSize || 0} predictions
                </p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <h4 className="font-medium text-orange-800">Low Confidence</h4>
                <p className="text-2xl font-bold text-orange-600 mt-2">
                  {data.breakdown.lowConfidence?.accuracy || 0}%
                </p>
                <p className="text-sm text-gray-600">
                  {data.breakdown.lowConfidence?.sampleSize || 0} predictions
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Improvement Suggestions */}
        {data.improvementSuggestions && data.improvementSuggestions.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>💡</span> Improvement Suggestions
            </h3>
            <ul className="space-y-2">
              {data.improvementSuggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                  <span className="text-blue-500">💡</span>
                  <span className="text-gray-700">{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case "overview": return renderOverview();
      case "interview": return renderInterviewSuccess();
      case "timeline": return renderTimeline();
      case "salary": return renderSalary();
      case "timing": return renderTiming();
      case "scenarios": return renderScenarios();
      case "recommendations": return renderRecommendations();
      case "accuracy": return renderAccuracy();
      default: return renderOverview();
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading predictive analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-red-500 text-5xl mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Analytics</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchAllData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <span></span> Predictive Analytics
        </h1>
        <p className="text-gray-600 mt-2">
          AI-powered predictions to optimize your job search strategy
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex flex-wrap gap-1 sm:gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap pb-2 sm:pb-4 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm transition-colors flex-shrink-0 ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600 bg-blue-50 rounded-t-lg"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <span className="mr-1 sm:mr-2">{tab.icon}</span>
              <span className="hidden xs:inline">{tab.label}</span>
              <span className="xs:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="pb-8">
        {renderContent()}
      </div>
    </div>
  );
};

export default PredictiveAnalytics;
