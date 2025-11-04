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

    // Create CSV blob and download
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `job-statistics-${new Date().toISOString().split('T')[0]}.csv`);
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
      <div className="bg-white rounded-lg max-w-6xl w-full h-[90vh] flex flex-col">
        <div className="shrink-0 bg-white border-b border-gray-200 px-4 py-2 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 leading-tight">Job Search Analytics</h2>
              <p className="text-xs text-gray-600 mt-0.5">Comprehensive insights into your job search progress</p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={exportToCSV} variant="primary" size="small">
                Export to CSV
              </Button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 ml-2"
                aria-label="Close statistics"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Overview Cards */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Card variant="elevated" className="text-center">
                <p className="text-sm text-gray-600 mb-1">Total Apps</p>
                <p className="text-3xl font-bold text-blue-600">
                  {analytics.overview.totalApplications}
                </p>
              </Card>
              <Card variant="elevated" className="text-center">
                <p className="text-sm text-gray-600 mb-1">Active</p>
                <p className="text-3xl font-bold text-green-600">
                  {analytics.overview.activeApplications}
                </p>
              </Card>
              <Card variant="elevated" className="text-center">
                <p className="text-sm text-gray-600 mb-1">Response Rate</p>
                <p className="text-3xl font-bold text-purple-600">
                  {analytics.overview.responseRate}%
                </p>
              </Card>
              <Card variant="elevated" className="text-center">
                <p className="text-sm text-gray-600 mb-1">Interview Rate</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {analytics.overview.interviewRate}%
                </p>
              </Card>
              <Card variant="elevated" className="text-center">
                <p className="text-sm text-gray-600 mb-1">Offer Rate</p>
                <p className="text-3xl font-bold text-green-600">
                  {analytics.overview.offerRate}%
                </p>
              </Card>
              <Card variant="elevated" className="text-center">
                <p className="text-sm text-gray-600 mb-1">Archived</p>
                <p className="text-3xl font-bold text-gray-600">
                  {analytics.overview.archivedApplications}
                </p>
              </Card>
            </div>
          </div>

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
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${
                        item.status === "Interested" ? "bg-gray-500" :
                        item.status === "Applied" ? "bg-blue-500" :
                        item.status === "Phone Screen" ? "bg-yellow-500" :
                        item.status === "Interview" ? "bg-purple-500" :
                        item.status === "Offer" ? "bg-green-500" :
                        "bg-red-500"
                      }`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Average Time by Stage */}
          <Card variant="elevated" title="Average Time in Each Stage">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(analytics.avgTimeByStage).map(([stage, days]) => (
                <div key={stage} className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">{stage}</p>
                  <p className="text-2xl font-bold text-gray-900">{days}</p>
                  <p className="text-xs text-gray-500">days</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Monthly Application Volume */}
          <Card variant="elevated" title="Monthly Application Volume (Last 12 Months)">
            <div className="space-y-2">
              {analytics.monthlyVolume.map((item) => (
                <div key={item.timestamp} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700 w-24">
                    {item.month}
                  </span>
                  <div className="flex-1 bg-gray-200 rounded-full h-8 relative">
                    <div
                      className="bg-blue-500 h-8 rounded-full flex items-center justify-end pr-3"
                      style={{
                        width: `${Math.max((item.count / Math.max(...analytics.monthlyVolume.map(m => m.count))) * 100, 5)}%`
                      }}
                    >
                      <span className="text-xs font-bold text-white">{item.count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Deadline Adherence */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card variant="elevated" title="Deadline Adherence">
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
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Adherence Rate</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {analytics.deadlineTracking.adherenceRate}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
                    <div
                      className="bg-blue-500 h-3 rounded-full"
                      style={{ width: `${analytics.deadlineTracking.adherenceRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Time to Offer */}
            <Card variant="elevated" title="Time to Offer Analytics">
              <div className="text-center py-8">
                <p className="text-sm text-gray-600 mb-2">Average Time to Offer</p>
                <p className="text-5xl font-bold text-green-600 mb-2">
                  {analytics.timeToOffer.average}
                </p>
                <p className="text-lg text-gray-700">days</p>
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Based on {analytics.timeToOffer.count} offer{analytics.timeToOffer.count !== 1 ? 's' : ''}
                  </p>
                </div>
                {analytics.timeToOffer.count === 0 && (
                  <p className="mt-4 text-sm text-gray-500 italic">
                    No offers received yet. Keep applying!
                  </p>
                )}
              </div>
            </Card>
          </div>

          {/* Insights and Recommendations */}
          <Card variant="info" title="Insights & Recommendations">
            <ul className="space-y-2 text-sm text-gray-700">
              {analytics.overview.responseRate < 20 && (
                <li>• Your response rate is low. Consider refining your applications or targeting more relevant positions.</li>
              )}
              {analytics.overview.interviewRate > 50 && (
                <li>• Great interview rate! Your applications are resonating with employers.</li>
              )}
              {analytics.deadlineTracking.adherenceRate < 70 && analytics.deadlineTracking.total > 0 && (
                <li>• Consider setting earlier internal deadlines to improve adherence.</li>
              )}
              {analytics.timeToOffer.average > 0 && analytics.timeToOffer.average < 30 && (
                <li>• Excellent! Your average time to offer is quite fast.</li>
              )}
              {analytics.monthlyVolume[analytics.monthlyVolume.length - 1].count === 0 && (
                <li>• No applications this month. Stay consistent with your job search!</li>
              )}
              {analytics.overview.totalApplications < 10 && (
                <li>• Track more applications to get better insights and improve your job search strategy.</li>
              )}
            </ul>
          </Card>
        </div>

        <div className="shrink-0 bg-gray-50 border-t border-gray-200 px-4 py-2 rounded-b-lg">
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-600">
              Data generated on {new Date().toLocaleString()}
            </p>
            <Button onClick={onClose} variant="secondary" size="small">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
