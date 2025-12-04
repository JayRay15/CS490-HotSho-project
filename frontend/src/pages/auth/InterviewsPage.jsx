import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import Card from "../../components/Card";
import Button from "../../components/Button";
import InterviewCard from "../../components/InterviewCard";
import InterviewChecklist from "../../components/InterviewChecklist";
import { getInterviews } from "../../api/interviews";
import { setAuthToken } from "../../api/axios";
import InterviewAnalyticsTab from "../../components/interviews/InterviewAnalyticsTab";
import InterviewPredictionsTab from "../../components/interviews/InterviewPredictionsTab";
import InterviewPerformanceTab from "../../components/interviews/InterviewPerformanceTab";
import { Calendar, BarChart3, Target, TrendingUp } from "lucide-react";

export default function InterviewsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { getToken } = useAuth();
  
  // Tab state - check URL param first
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabFromUrl || "interviews");
  
  const [loading, setLoading] = useState(true);
  const [interviews, setInterviews] = useState([]);
  const [filteredInterviews, setFilteredInterviews] = useState([]);
  const [filters, setFilters] = useState({
    status: "all",
    dateRange: "all",
    search: "",
  });
  const [showInterviewChecklist, setShowInterviewChecklist] = useState(false);
  const [selectedInterviewForChecklist, setSelectedInterviewForChecklist] = useState(null);

  // Tab definitions
  const tabs = [
    { id: "interviews", label: "My Interviews", icon: Calendar },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "predictions", label: "Success Predictions", icon: Target },
    { id: "performance", label: "Performance", icon: TrendingUp },
  ];

  // Handle tab change
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (tabId === "interviews") {
      setSearchParams({});
    } else {
      setSearchParams({ tab: tabId });
    }
  };

  useEffect(() => {
    // Sync tab state with URL
    const urlTab = searchParams.get("tab");
    if (urlTab && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (activeTab === "interviews") {
      loadInterviews();
    }
  }, [activeTab]);

  useEffect(() => {
    applyFilters();
  }, [interviews, filters]);

  const loadInterviews = async () => {
    try {
      setLoading(true);
      // Set auth token before making API call
      const token = await getToken();
      setAuthToken(token);
      const response = await getInterviews();
      // Backend wraps data in response.data.data structure
      const interviewList = response.data?.data?.interviews || response.data?.interviews || [];
      setInterviews(interviewList);
    } catch (error) {
      console.error("Error loading interviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...interviews];

    // Status filter
    if (filters.status !== "all") {
      filtered = filtered.filter((i) => i.status === filters.status);
    }

    // Date range filter
    const now = new Date();
    if (filters.dateRange === "upcoming") {
      filtered = filtered.filter((i) => new Date(i.scheduledDate) >= now);
    } else if (filters.dateRange === "past") {
      filtered = filtered.filter((i) => new Date(i.scheduledDate) < now);
    } else if (filters.dateRange === "week") {
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(
        (i) =>
          new Date(i.scheduledDate) >= now && new Date(i.scheduledDate) <= nextWeek
      );
    } else if (filters.dateRange === "month") {
      const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(
        (i) =>
          new Date(i.scheduledDate) >= now && new Date(i.scheduledDate) <= nextMonth
      );
    }

    // Search filter
    if (filters.search.trim()) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.title?.toLowerCase().includes(search) ||
          i.company?.toLowerCase().includes(search) ||
          i.interviewType?.toLowerCase().includes(search)
      );
    }

    // Sort by date (upcoming first, then past in reverse)
    filtered.sort((a, b) => {
      const dateA = new Date(a.scheduledDate);
      const dateB = new Date(b.scheduledDate);
      
      const aIsPast = dateA < now;
      const bIsPast = dateB < now;
      
      if (aIsPast && !bIsPast) return 1;
      if (!aIsPast && bIsPast) return -1;
      
      return aIsPast ? dateB - dateA : dateA - dateB;
    });

    setFilteredInterviews(filtered);
  };

  const handleUpdate = (updatedInterview) => {
    setInterviews((prev) =>
      prev.map((i) => (i._id === updatedInterview._id ? updatedInterview : i))
    );
  };

  const handleDelete = (interviewId) => {
    setInterviews((prev) => prev.filter((i) => i._id !== interviewId));
  };

  const handleEdit = (interview) => {
    // Navigate to job with interview scheduler
    if (interview.jobId) {
      const jobId = typeof interview.jobId === 'object' ? interview.jobId._id : interview.jobId;
      navigate(`/jobs?reschedule=${interview._id}`);
    }
  };

  const handleOpenInterviewChecklist = (interview) => {
    setSelectedInterviewForChecklist(interview);
    setShowInterviewChecklist(true);
  };

  const upcomingCount = interviews.filter((i) => new Date(i.scheduledDate) >= new Date()).length;
  const completedCount = interviews.filter((i) => i.status === "Completed").length;
  const ratedInterviews = interviews.filter((i) => i.outcome?.rating);
  const avgRating = ratedInterviews.length > 0
    ? ratedInterviews.reduce((sum, i) => sum + i.outcome.rating, 0) / ratedInterviews.length
    : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Interviews</h1>
          <p className="text-gray-600 mt-1">
            Manage your interview schedule, analytics, and predictions
          </p>
        </div>
        {activeTab === "interviews" && (
          <Button onClick={() => navigate("/jobs")}>Schedule Interview</Button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`
                  flex items-center py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }
                `}
              >
                <Icon className="h-5 w-5 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "interviews" && (
        <>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">📅</div>
                    <div>
                      <p className="text-sm text-gray-600">Upcoming</p>
                      <p className="text-2xl font-bold text-gray-900">{upcomingCount}</p>
                    </div>
                  </div>
                </Card>
                <Card>
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">✅</div>
                    <div>
                      <p className="text-sm text-gray-600">Completed</p>
                      <p className="text-2xl font-bold text-gray-900">{completedCount}</p>
                    </div>
                  </div>
                </Card>
                <Card>
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">⭐</div>
                    <div>
                      <p className="text-sm text-gray-600">Avg Rating</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {avgRating > 0 ? avgRating.toFixed(1) : "—"}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Filters */}
              <Card className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Search */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search
                    </label>
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      placeholder="Company, role, type..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {/* Status filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="all">All Statuses</option>
                      <option value="Scheduled">Scheduled</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Rescheduled">Rescheduled</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>

                  {/* Date range filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time Period
                    </label>
                    <select
                      value={filters.dateRange}
                      onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="all">All Time</option>
                      <option value="upcoming">Upcoming</option>
                      <option value="week">Next 7 Days</option>
                      <option value="month">Next 30 Days</option>
                      <option value="past">Past</option>
                    </select>
                  </div>
                </div>

                {filteredInterviews.length > 0 && (
                  <div className="mt-4 text-sm text-gray-600">
                    Showing {filteredInterviews.length} of {interviews.length} interview
                    {interviews.length !== 1 ? "s" : ""}
                  </div>
                )}
              </Card>

              {/* Interview List */}
              {filteredInterviews.length === 0 ? (
                <Card>
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📅</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {interviews.length === 0 ? "No Interviews Yet" : "No Matching Interviews"}
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {interviews.length === 0
                        ? "Schedule your first interview to get started with interview prep and calendar sync."
                        : "Try adjusting your filters to see more interviews."}
                    </p>
                    {interviews.length === 0 && (
                      <Button onClick={() => navigate("/jobs")}>Schedule Interview</Button>
                    )}
                  </div>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredInterviews.map((interview) => (
                    <InterviewCard
                      key={interview._id}
                      interview={interview}
                      onUpdate={handleUpdate}
                      onEdit={handleEdit}
                      onDelete={() => handleDelete(interview._id)}
                      onOpenInterviewChecklist={handleOpenInterviewChecklist}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {activeTab === "analytics" && <InterviewAnalyticsTab />}

      {activeTab === "predictions" && <InterviewPredictionsTab />}

      {activeTab === "performance" && <InterviewPerformanceTab />}

      {/* Interview Checklist Modal */}
      {showInterviewChecklist && selectedInterviewForChecklist && (
        <>
          {/* Full-screen backdrop providing blur without a dark overlay. */}
          <div className="fixed inset-0 z-40 pointer-events-none backdrop-blur-sm bg-white/5" />

          {/* Floating card (clickable) above the blurred backdrop */}
          <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 p-4 pointer-events-auto">
            <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-6">
                <InterviewChecklist 
                  job={
                    // If interview has a populated jobId object, use it
                    typeof selectedInterviewForChecklist.jobId === 'object' && selectedInterviewForChecklist.jobId
                      ? selectedInterviewForChecklist.jobId
                      // Otherwise, create a job-like object from interview data
                      : {
                          _id: typeof selectedInterviewForChecklist.jobId === 'string' 
                            ? selectedInterviewForChecklist.jobId 
                            : null,
                          title: selectedInterviewForChecklist.title || "",
                          company: selectedInterviewForChecklist.company || "",
                          description: "",
                        }
                  }
                  onClose={() => {
                    setShowInterviewChecklist(false);
                    setSelectedInterviewForChecklist(null);
                  }}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
