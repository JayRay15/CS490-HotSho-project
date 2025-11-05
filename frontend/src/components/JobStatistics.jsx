import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import api, { setAuthToken } from "../api/axios";
import Card from "./Card";
import Button from "./Button";
import LoadingSpinner from "./LoadingSpinner";

export default function JobStatistics({ onClose }) {
  const { getToken } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      setAuthToken(token);
      const response = await api.get("/api/jobs/analytics");
      console.log('📊 Analytics Response:', response.data.data);
      console.log('🔍 Data Check:', {
        funnelAnalytics: response.data.data.funnelAnalytics,
        companyAnalytics: response.data.data.companyAnalytics,
        industryAnalytics: response.data.data.industryAnalytics,
        goalTracking: response.data.data.goalTracking
      });
      setAnalytics(response.data.data);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
      setError(error.response?.data?.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!analytics) return;

    const csvRows = [];
    
    // Header
    csvRows.push("Job Search Analytics Report");
    csvRows.push(`Generated: ${new Date().toLocaleDateString()}`);
    csvRows.push("");
    
    // Overview Section
    csvRows.push("OVERVIEW");
    csvRows.push("Metric,Value");
    csvRows.push(`Total Applications,${analytics.overview.totalApplications}`);
    csvRows.push(`Active Applications,${analytics.overview.activeApplications}`);
    csvRows.push(`Archived Applications,${analytics.overview.archivedApplications}`);
    csvRows.push(`Response Rate,${analytics.overview.responseRate}%`);
    csvRows.push(`Interview Rate,${analytics.overview.interviewRate}%`);
    csvRows.push(`Offer Rate,${analytics.overview.offerRate}%`);
    csvRows.push("");

    // Funnel Analytics
    if (analytics.funnelAnalytics) {
      csvRows.push("APPLICATION FUNNEL");
      csvRows.push("Stage,Count,Conversion Rate");
      csvRows.push(`Applied,${analytics.funnelAnalytics.applied},-`);
  // Only show conversion rates in CSV if not 0 or 100
  const conv = analytics.funnelAnalytics.conversionRates;
  csvRows.push(`Phone Screen,${analytics.funnelAnalytics.phoneScreen},${(conv.applyToScreen !== 0 && conv.applyToScreen !== 100) ? conv.applyToScreen + '%' : ''}`);
  csvRows.push(`Interview,${analytics.funnelAnalytics.interview},${(conv.screenToInterview !== 0 && conv.screenToInterview !== 100) ? conv.screenToInterview + '%' : ''}`);
  csvRows.push(`Offer,${analytics.funnelAnalytics.offer},${(conv.interviewToOffer !== 0 && conv.interviewToOffer !== 100) ? conv.interviewToOffer + '%' : ''}`);
      csvRows.push("");
    }

    // Company Analytics
    if (analytics.companyAnalytics && analytics.companyAnalytics.length > 0) {
      csvRows.push("TOP COMPANIES");
      csvRows.push("Company,Applications,Avg Response Time (days),Success Rate");
      analytics.companyAnalytics.forEach(item => {
        csvRows.push(`${item.company},${item.applications},${item.avgResponseTime},${item.successRate}%`);
      });
      csvRows.push("");
    }

    // Industry Analytics
    if (analytics.industryAnalytics && analytics.industryAnalytics.length > 0) {
      csvRows.push("INDUSTRY ANALYTICS");
      csvRows.push("Industry,Applications,Avg Response Time (days),Success Rate");
      analytics.industryAnalytics.forEach(item => {
        csvRows.push(`${item.industry},${item.applications},${item.avgResponseTime},${item.successRate}%`);
      });
      csvRows.push("");
    }

    // Approach Analytics
    if (analytics.approachAnalytics) {
      csvRows.push("SUCCESS BY WORK MODE");
      csvRows.push("Work Mode,Applications,Response Rate,Interview Rate,Offer Rate");
      Object.entries(analytics.approachAnalytics).forEach(([mode, data]) => {
        csvRows.push(`${mode},${data.applications},${data.responseRate}%,${data.interviewRate}%,${data.offerRate}%`);
      });
      csvRows.push("");
    }

    // Status Counts
    csvRows.push("APPLICATIONS BY STATUS");
    csvRows.push("Status,Count,Percentage");
    analytics.statusDistribution.forEach(item => {
      csvRows.push(`${item.status},${item.count},${item.percentage}%`);
    });
    csvRows.push("");

    // Average Time by Stage
    csvRows.push("AVERAGE TIME IN EACH STAGE");
    csvRows.push("Stage,Days");
    Object.entries(analytics.avgTimeByStage).forEach(([stage, days]) => {
      csvRows.push(`${stage},${days}`);
    });
    csvRows.push("");

    // Weekly Trends
    if (analytics.weeklyTrends && analytics.weeklyTrends.length > 0) {
      csvRows.push("WEEKLY APPLICATION TRENDS");
      csvRows.push("Week,Applications,Responses");
      analytics.weeklyTrends.forEach(item => {
        csvRows.push(`${item.week},${item.applications},${item.responses}`);
      });
      csvRows.push("");
    }

    // Monthly Volume
    csvRows.push("MONTHLY APPLICATION VOLUME");
    csvRows.push("Month,Applications");
    analytics.monthlyVolume.forEach(item => {
      csvRows.push(`${item.month},${item.count}`);
    });
    csvRows.push("");

    // Deadline Tracking
    csvRows.push("DEADLINE ADHERENCE");
    csvRows.push("Metric,Value");
    csvRows.push(`Total with Deadlines,${analytics.deadlineTracking.total}`);
    csvRows.push(`Met Deadlines,${analytics.deadlineTracking.met}`);
    csvRows.push(`Missed Deadlines,${analytics.deadlineTracking.missed}`);
    csvRows.push(`Upcoming Deadlines,${analytics.deadlineTracking.upcoming}`);
    csvRows.push(`Adherence Rate,${analytics.deadlineTracking.adherenceRate}%`);
    csvRows.push("");

    // Time to Offer
    csvRows.push("TIME TO OFFER");
    csvRows.push("Metric,Value");
    csvRows.push(`Average Days,${analytics.timeToOffer.average}`);
    csvRows.push(`Total Offers,${analytics.timeToOffer.count}`);
    csvRows.push("");

    // Benchmarks
    if (analytics.benchmarks) {
      csvRows.push("PERFORMANCE BENCHMARKS");
      csvRows.push("Metric,Your Performance,Industry Average,Status");
      csvRows.push(`Response Rate,${analytics.benchmarks.userPerformance.responseRate}%,${analytics.benchmarks.industryAverages.responseRate}%,${analytics.benchmarks.comparison.responseRate}`);
      csvRows.push(`Interview Rate,${analytics.benchmarks.userPerformance.interviewRate}%,${analytics.benchmarks.industryAverages.interviewRate}%,${analytics.benchmarks.comparison.interviewRate}`);
      csvRows.push(`Offer Rate,${analytics.benchmarks.userPerformance.offerRate}%,${analytics.benchmarks.industryAverages.offerRate}%,${analytics.benchmarks.comparison.offerRate}`);
      csvRows.push("");
    }

    // Goal Tracking
    if (analytics.goalTracking) {
      csvRows.push("MONTHLY GOALS");
      csvRows.push("Category,Goal,Current,Progress");
      csvRows.push(`Applications,${analytics.goalTracking.applications.goal},${analytics.goalTracking.applications.current},${analytics.goalTracking.applications.percentage}%`);
      csvRows.push(`Interviews,${analytics.goalTracking.interviews.goal},${analytics.goalTracking.interviews.current},${analytics.goalTracking.interviews.percentage}%`);
      csvRows.push(`Offers,${analytics.goalTracking.offers.goal},${analytics.goalTracking.offers.current},${analytics.goalTracking.offers.percentage}%`);
      csvRows.push("");
    }

    // Recommendations
    if (analytics.recommendations && analytics.recommendations.length > 0) {
      csvRows.push("OPTIMIZATION RECOMMENDATIONS");
      csvRows.push("Type,Category,Message,Action");
      analytics.recommendations.forEach(rec => {
        csvRows.push(`${rec.type},${rec.category},"${rec.message}","${rec.action}"`);
      });
    }

    // Create CSV blob and download
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `job-analytics-complete-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <LoadingSpinner size="lg" text="Loading analytics..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <h2 className="text-xl font-bold text-red-600 mb-4">Error Loading Analytics</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <div className="flex gap-3">
            <Button onClick={fetchAnalytics} variant="primary">Retry</Button>
            <Button onClick={onClose} variant="secondary">Close</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-7xl w-full h-[90vh] flex flex-col">
        {/* Header */}
        <div className="shrink-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 leading-tight">Application Analytics Dashboard</h2>
              <p className="text-sm text-gray-600 mt-1">Comprehensive insights to optimize your job search strategy</p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={exportToCSV} variant="primary" size="small">
                📥 Export Report
              </Button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition"
                aria-label="Close analytics"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="shrink-0 border-b border-gray-200 bg-gray-50 px-6">
          <nav className="flex space-x-1 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'funnel', label: 'Funnel', icon: '🔀' },
              { id: 'industries', label: 'Industries', icon: '🏭' },
              { id: 'trends', label: 'Trends', icon: '📈' },
              { id: 'goals', label: 'Goals', icon: '🎯' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 hover:bg-gray-100'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {/* Key Metrics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Card variant="elevated" className="text-center hover:shadow-lg transition">
                  <p className="text-xs text-gray-600 mb-1">Total Apps</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {analytics.overview.totalApplications}
                  </p>
                </Card>
                <Card variant="elevated" className="text-center hover:shadow-lg transition">
                  <p className="text-xs text-gray-600 mb-1">Active</p>
                  <p className="text-3xl font-bold text-green-600">
                    {analytics.overview.activeApplications}
                  </p>
                </Card>
                <Card variant="elevated" className="text-center hover:shadow-lg transition">
                  <p className="text-xs text-gray-600 mb-1">Response</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {analytics.overview.responseRate}%
                  </p>
                </Card>
                <Card variant="elevated" className="text-center hover:shadow-lg transition">
                  <p className="text-xs text-gray-600 mb-1">Interview</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {analytics.overview.interviewRate}%
                  </p>
                </Card>
                <Card variant="elevated" className="text-center hover:shadow-lg transition">
                  <p className="text-xs text-gray-600 mb-1">Offer</p>
                  <p className="text-3xl font-bold text-green-600">
                    {analytics.overview.offerRate}%
                  </p>
                </Card>
                <Card variant="elevated" className="text-center hover:shadow-lg transition">
                  <p className="text-xs text-gray-600 mb-1">Archived</p>
                  <p className="text-3xl font-bold text-gray-600">
                    {analytics.overview.archivedApplications}
                  </p>
                </Card>
              </div>

              {/* Performance Benchmarking */}
              {analytics.benchmarks && (
                <Card variant="elevated" title="📊 Performance Benchmarking">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {['responseRate', 'interviewRate', 'offerRate'].map(metric => (
                      <div key={metric} className="text-center">
                        <p className="text-sm text-gray-600 mb-2 capitalize">
                          {metric.replace('Rate', ' Rate')}
                        </p>
                        <div className="flex items-end justify-center gap-4 mb-2">
                          <div>
                            <p className="text-xs text-gray-500">You</p>
                            <p className="text-2xl font-bold text-blue-600">
                              {analytics.benchmarks.userPerformance[metric]}%
                            </p>
                          </div>
                          <div className="text-2xl text-gray-400">vs</div>
                          <div>
                            <p className="text-xs text-gray-500">Industry</p>
                            <p className="text-2xl font-bold text-gray-600">
                              {analytics.benchmarks.industryAverages[metric]}%
                            </p>
                          </div>
                        </div>
                        <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          analytics.benchmarks.comparison[metric] === 'above' 
                            ? 'bg-green-100 text-green-800'
                            : analytics.benchmarks.comparison[metric] === 'average'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {analytics.benchmarks.comparison[metric] === 'above' ? '✓ Above Average' :
                           analytics.benchmarks.comparison[metric] === 'average' ? '≈ Average' :
                           '⚠ Below Average'}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Status Distribution */}
              <Card variant="elevated" title="Applications by Status">
                <div className="space-y-3">
                  {analytics.statusDistribution.map((item) => (
                    <div key={item.status}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">{item.status}</span>
                        <span className="text-sm text-gray-600">
                          {item.count} ({item.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all ${
                            item.status === "Interested" ? "bg-gray-500" :
                            item.status === "Applied" ? "bg-blue-500" :
                            item.status === "Phone Screen" ? "bg-yellow-500" :
                            item.status === "Interview" ? "bg-purple-500" :
                            item.status === "Offer" ? "bg-green-500" :
                            "bg-red-500"
                          }`}
                          style={{ width: `${Math.max(item.percentage, 2)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Optimization Recommendations */}
              {analytics.recommendations && analytics.recommendations.length > 0 && (
                <Card variant="info" title="💡 Optimization Recommendations">
                  <div className="space-y-3">
                    {analytics.recommendations.map((rec, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg border-l-4 ${
                          rec.type === 'critical' ? 'bg-red-50 border-red-500' :
                          rec.type === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                          rec.type === 'success' ? 'bg-green-50 border-green-500' :
                          'bg-blue-50 border-blue-500'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">
                            {rec.type === 'critical' ? '🔴' :
                             rec.type === 'warning' ? '⚠️' :
                             rec.type === 'success' ? '✅' : 'ℹ️'}
                          </span>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 mb-1">{rec.category}</p>
                            <p className="text-sm text-gray-700 mb-2">{rec.message}</p>
                            <p className="text-xs text-gray-600 italic">💡 Action: {rec.action}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Average Time by Stage */}
              <Card variant="elevated" title="⏱️ Average Time in Each Stage">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {Object.entries(analytics.avgTimeByStage).map(([stage, days]) => (
                    <div key={stage} className="text-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg hover:shadow-md transition">
                      <p className="text-xs text-gray-600 mb-2">{stage}</p>
                      <p className="text-3xl font-bold text-gray-900">{days}</p>
                      <p className="text-xs text-gray-500 mt-1">days</p>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}

          {/* Funnel Tab */}
          {activeTab === 'funnel' && (
            <>
              {analytics.funnelAnalytics && analytics.funnelAnalytics.applied > 0 ? (
                <Card variant="elevated" title="🔀 Application Funnel Analytics">
                  <div className="space-y-0">
                    {/* Visual Funnel */}
                    <div className="flex flex-col items-center gap-0">
                      {(() => {
                        const stages = [
                          { label: 'Applied', count: analytics.funnelAnalytics.applied, color: 'blue', width: 100 },
                          { label: 'Phone Screen', count: analytics.funnelAnalytics.phoneScreen, color: 'yellow', width: 75 },
                          { label: 'Interview', count: analytics.funnelAnalytics.interview, color: 'purple', width: 50 },
                          { label: 'Offer', count: analytics.funnelAnalytics.offer, color: 'green', width: 25 },
                        ];
                        const conversions = [
                          analytics.funnelAnalytics.conversionRates.applyToScreen,
                          analytics.funnelAnalytics.conversionRates.screenToInterview,
                          analytics.funnelAnalytics.conversionRates.interviewToOffer
                        ];
                        return stages.map((stage, idx) => {
                          const nextStage = stages[idx + 1];
                          const showArrow = idx < stages.length - 1; // Always show arrow between stages
                          const conversion = conversions[idx];
                          const showConversion = showArrow && conversion && !isNaN(Number(conversion)) && Number(conversion) > 0 && Number(conversion) < 100;
                          return (
                            <div key={stage.label} className="w-full flex flex-col items-center">
                              <div className="flex items-center justify-center gap-4 w-full">
                                <div
                                  className={`relative h-16 bg-${stage.color}-500 rounded-lg shadow-lg flex items-center justify-center text-white font-bold transition-all hover:scale-105`}
                                  style={{ width: `${stage.width}%` }}
                                >
                                  <div className="text-center w-full">
                                    <p className="text-sm">{stage.label}</p>
                                    <p className="text-2xl">{stage.count}</p>
                                  </div>
                                </div>
                              </div>
                              {/* Show arrow between all stages except after the last one */}
                              {showArrow && (
                                <div className="flex flex-col items-center my-3">
                                  <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.22-3.22a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-4.5-4.5a.75.75 0 111.06-1.06l3.22 3.22V3.75A.75.75 0 0110 3z" clipRule="evenodd" />
                                  </svg>
                                  {/* Show conversion rate if meaningful */}
                                  {showConversion && (
                                    <div className="text-xs text-gray-600 font-medium text-center mt-1">
                                      {conversion}%
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </Card>
              ) : (
                <Card variant="info" title="🔀 No Funnel Data Yet">
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">
                      Start tracking applications to see your funnel analytics!
                    </p>
                    <p className="text-sm text-gray-500">
                      Add jobs at different stages (Applied, Phone Screen, Interview, Offer) to visualize your application funnel.
                    </p>
                  </div>
                </Card>
              )}

              {/* Success Rate by Approach */}
              {analytics.approachAnalytics && Object.keys(analytics.approachAnalytics).length > 0 && (
                <Card variant="elevated" title="💼 Success Rate by Application Approach">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {Object.entries(analytics.approachAnalytics).map(([mode, data]) => (
                      <div key={mode} className="p-5 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 hover:shadow-lg transition">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">{mode}</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Applications</span>
                            <span className="font-bold text-gray-900">{data.applications}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Response Rate</span>
                            <span className="font-bold text-purple-600">{data.responseRate}%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Interview Rate</span>
                            <span className="font-bold text-yellow-600">{data.interviewRate}%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Offer Rate</span>
                            <span className="font-bold text-green-600">{data.offerRate}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}


          {/* Industries Tab */}
          {activeTab === 'industries' && (
            <Card variant="elevated" title="🏭 Industry Performance Analytics">
              {analytics.industryAnalytics && analytics.industryAnalytics.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {analytics.industryAnalytics.map((industry, idx) => (
                    <div key={idx} className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-gray-200 hover:shadow-lg transition">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">{industry.industry}</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Applications</span>
                          <span className="text-lg font-bold text-blue-600">{industry.applications}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Avg Response</span>
                          <span className="text-lg font-bold text-purple-600">{industry.avgResponseTime} days</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Success Rate</span>
                          <span className="text-lg font-bold text-green-600">{industry.successRate}%</span>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-300">
                          <div className={`text-center py-2 rounded-lg font-medium ${
                            parseFloat(industry.successRate) >= 25 ? 'bg-green-100 text-green-800' :
                            parseFloat(industry.successRate) >= 15 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {parseFloat(industry.successRate) >= 25 ? '🔥 Hot Market' :
                             parseFloat(industry.successRate) >= 15 ? '📊 Average' :
                             '🎯 Keep Trying'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No industry data available yet. Add industry information to your applications!</p>
              )}
            </Card>
          )}

          {/* Trends Tab */}
          {activeTab === 'trends' && (
            <>
              {/* Weekly Trends */}
              {analytics.weeklyTrends && analytics.weeklyTrends.length > 0 && (
                <Card variant="elevated" title="📈 Weekly Application Trends (Last 4 Weeks)">
                  <div className="space-y-4">
                    {analytics.weeklyTrends.map((week, idx) => (
                      <div key={idx} className="flex items-center gap-4">
                        <div className="w-32 text-sm font-medium text-gray-700">{week.week}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-gray-600 w-20">Applications:</span>
                            <div className="flex-1 bg-blue-100 rounded-full h-6 relative">
                              <div
                                className="bg-blue-500 h-6 rounded-full flex items-center justify-end pr-2"
                                style={{ width: `${Math.max((week.applications / 20) * 100, 5)}%` }}
                              >
                                <span className="text-xs font-bold text-white">{week.applications}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600 w-20">Responses:</span>
                            <div className="flex-1 bg-green-100 rounded-full h-6 relative">
                              <div
                                className="bg-green-500 h-6 rounded-full flex items-center justify-end pr-2"
                                style={{ width: `${Math.max((week.responses / 20) * 100, 5)}%` }}
                              >
                                <span className="text-xs font-bold text-white">{week.responses}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Monthly Volume */}
              <Card variant="elevated" title="📅 Monthly Application Volume (Last 12 Months)">
                <div className="space-y-2">
                  {analytics.monthlyVolume.map((item) => (
                    <div key={item.timestamp} className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-700 w-28">
                        {item.month}
                      </span>
                      <div className="flex-1 bg-gray-200 rounded-full h-10 relative">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-10 rounded-full flex items-center justify-end pr-4 shadow-md"
                          style={{
                            width: `${Math.max((item.count / Math.max(...analytics.monthlyVolume.map(m => m.count))) * 100, 5)}%`
                          }}
                        >
                          <span className="text-sm font-bold text-white">{item.count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Time Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card variant="elevated" title="⏰ Deadline Adherence">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total with Deadlines</span>
                      <span className="text-lg font-bold text-gray-900">
                        {analytics.deadlineTracking.total}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Met on Time</span>
                      <span className="text-lg font-bold text-green-600">
                        {analytics.deadlineTracking.met}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Missed</span>
                      <span className="text-lg font-bold text-red-600">
                        {analytics.deadlineTracking.missed}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Upcoming</span>
                      <span className="text-lg font-bold text-yellow-600">
                        {analytics.deadlineTracking.upcoming}
                      </span>
                    </div>
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Adherence Rate</span>
                        <span className="text-2xl font-bold text-blue-600">
                          {analytics.deadlineTracking.adherenceRate}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all"
                          style={{ width: `${analytics.deadlineTracking.adherenceRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card variant="elevated" title="🏆 Time to Offer">
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-600 mb-3">Average Time to Offer</p>
                    <p className="text-6xl font-bold text-green-600 mb-3">
                      {analytics.timeToOffer.average}
                    </p>
                    <p className="text-xl text-gray-700 mb-6">days</p>
                    <div className="pt-6 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        Based on <span className="font-bold text-gray-900">{analytics.timeToOffer.count}</span> offer{analytics.timeToOffer.count !== 1 ? 's' : ''}
                      </p>
                    </div>
                    {analytics.timeToOffer.count === 0 && (
                      <p className="mt-6 text-sm text-gray-500 italic">
                        No offers received yet. Keep applying!
                      </p>
                    )}
                    {analytics.timeToOffer.count > 0 && parseFloat(analytics.timeToOffer.average) < 30 && (
                      <div className="mt-4 inline-block px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        ⚡ Fast Track Success!
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </>
          )}

          {/* Goals Tab */}
          {activeTab === 'goals' && (
            <>
              {analytics.goalTracking ? (
                <>
                  <Card variant="elevated" title="🎯 Monthly Goals & Progress">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {Object.entries(analytics.goalTracking).map(([key, data]) => (
                    <div key={key} className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 capitalize">{key}</h3>
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-600">Progress</span>
                          <span className="text-sm font-medium text-gray-900">
                            {data.current} / {data.goal}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                          <div
                            className={`h-4 rounded-full transition-all ${
                              parseFloat(data.percentage) >= 100 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                              parseFloat(data.percentage) >= 75 ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                              parseFloat(data.percentage) >= 50 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                              'bg-gradient-to-r from-red-500 to-red-600'
                            }`}
                            style={{ width: `${Math.min(data.percentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className={`text-4xl font-bold ${
                          parseFloat(data.percentage) >= 100 ? 'text-green-600' :
                          parseFloat(data.percentage) >= 75 ? 'text-blue-600' :
                          parseFloat(data.percentage) >= 50 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {data.percentage}%
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {parseFloat(data.percentage) >= 100 ? '🎉 Goal Achieved!' :
                           parseFloat(data.percentage) >= 75 ? '💪 Almost There!' :
                           parseFloat(data.percentage) >= 50 ? '📈 Good Progress' :
                           '🚀 Keep Going!'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

                  <Card variant="info" title="💡 Goal Setting Tips">
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>✅ <strong>Applications:</strong> Aim for 15-25 quality applications per month for active job search</li>
                      <li>✅ <strong>Interviews:</strong> Target 3-5 interviews monthly - focus on conversion quality</li>
                      <li>✅ <strong>Offers:</strong> Even 1-2 offers per month shows strong performance</li>
                      <li>💡 <strong>Tip:</strong> Quality beats quantity - tailor each application to the role</li>
                      <li>📊 <strong>Strategy:</strong> Review and adjust goals quarterly based on market conditions</li>
                    </ul>
                  </Card>
                </>
              ) : (
                <Card variant="info" title="🎯 No Goal Data Yet">
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">
                      Start tracking applications to see your monthly goal progress!
                    </p>
                    <p className="text-sm text-gray-500">
                      We track your progress towards monthly goals: 20 applications, 5 interviews, and 1 offer.
                    </p>
                  </div>
                </Card>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 bg-gray-50 border-t border-gray-200 px-6 py-3 rounded-b-lg">
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-600">
              📅 Report generated on {new Date().toLocaleString()} • Data refreshes automatically
            </p>
            <Button onClick={onClose} variant="secondary" size="small">
              Close Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
