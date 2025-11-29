import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";

export default function MenteeDetailView({ menteeId, onClose }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("overview"); // 'overview', 'progress', 'insights', 'materials'
    const [profile, setProfile] = useState(null);
    const [progress, setProgress] = useState(null);
    const [insights, setInsights] = useState(null);
    const [engagement, setEngagement] = useState(null);

    useEffect(() => {
        fetchMenteeDetails();
    }, [menteeId]);

    const fetchMenteeDetails = async () => {
        setLoading(true);
        setError("");
        try {
            const token = localStorage.getItem("token");
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            // Fetch mentee profile
            const profileRes = await fetch(`/api/mentors/mentee/${menteeId}/profile`, { headers });
            if (profileRes.ok) {
                const profileData = await profileRes.json();
                setProfile(profileData.data);
            }

            // Fetch mentee progress
            const progressRes = await fetch(`/api/mentors/mentee/${menteeId}/progress`, { headers });
            if (progressRes.ok) {
                const progressData = await progressRes.json();
                setProgress(progressData.data);
            }

            // Fetch mentee insights
            const insightsRes = await fetch(`/api/mentors/mentee/${menteeId}/insights`, { headers });
            if (insightsRes.ok) {
                const insightsData = await insightsRes.json();
                setInsights(insightsData.data);
            }

            // Fetch engagement metrics
            const engagementRes = await fetch(`/api/mentors/mentee/${menteeId}/engagement`, { headers });
            if (engagementRes.ok) {
                const engagementData = await engagementRes.json();
                setEngagement(engagementData.data);
            }
        } catch (err) {
            console.error("Error fetching mentee details:", err);
            setError("Failed to load mentee details");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mx-auto mb-4" style={{ borderTopColor: '#777C6D', borderBottomColor: '#777C6D' }}></div>
                            <p className="text-gray-600">Loading mentee details...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex items-start justify-between">
                    <div className="flex items-start gap-4">
                        {profile?.mentee?.profilePicture ? (
                            <img
                                src={profile.mentee.profilePicture}
                                alt={profile.mentee.firstName}
                                className="w-16 h-16 rounded-full"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E8EAE5' }}>
                                <span className="text-2xl font-bold" style={{ color: '#777C6D' }}>
                                    {profile?.mentee?.firstName?.charAt(0) || "M"}
                                </span>
                            </div>
                        )}
                        <div>
                            <h2 className="text-2xl font-bold" style={{ color: '#4F5348' }}>
                                {profile?.mentee?.firstName} {profile?.mentee?.lastName}
                            </h2>
                            <p className="text-gray-600">{profile?.mentee?.email}</p>
                            {profile?.mentee?.headline && (
                                <p className="text-sm text-gray-700 mt-1">{profile.mentee.headline}</p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                    >
                        ×
                    </button>
                </div>

                {error && (
                    <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Tabs */}
                <div className="px-6 border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        {["overview", "progress", "insights", "materials"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`${
                                    activeTab === tab
                                        ? "border-[#777C6D] text-[#777C6D]"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors capitalize`}
                            >
                                {tab}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === "overview" && (
                        <OverviewTab 
                            profile={profile} 
                            progress={progress} 
                            engagement={engagement} 
                        />
                    )}
                    {activeTab === "progress" && <ProgressTab progress={progress} profile={profile} />}
                    {activeTab === "insights" && <InsightsTab insights={insights} />}
                    {activeTab === "materials" && <MaterialsTab profile={profile} />}
                </div>
            </div>
        </div>
    );
}

// Overview Tab Component
function OverviewTab({ profile, progress, engagement }) {
    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            {progress && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">Applications</span>
                            <span className="text-2xl">📋</span>
                        </div>
                        <p className="text-2xl font-bold" style={{ color: '#4F5348' }}>
                            {progress.kpis.applications.total}
                        </p>
                        {progress.kpis.applications.change > 0 && (
                            <p className="text-sm text-green-600 mt-1">
                                +{progress.kpis.applications.change} in last {progress.period} days
                            </p>
                        )}
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">Interviews</span>
                            <span className="text-2xl">🎤</span>
                        </div>
                        <p className="text-2xl font-bold" style={{ color: '#4F5348' }}>
                            {progress.kpis.interviews.total}
                        </p>
                        {progress.kpis.interviews.change > 0 && (
                            <p className="text-sm text-green-600 mt-1">
                                +{progress.kpis.interviews.change} in last {progress.period} days
                            </p>
                        )}
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">Goal Completion</span>
                            <span className="text-2xl">🎯</span>
                        </div>
                        <p className="text-2xl font-bold" style={{ color: '#4F5348' }}>
                            {progress.kpis.goals.completionRate.toFixed(0)}%
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                            {progress.kpis.goals.completed} of {progress.kpis.goals.total} goals
                        </p>
                    </div>
                </div>
            )}

            {/* Engagement Score */}
            {engagement && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4" style={{ color: '#4F5348' }}>
                        Engagement Score
                    </h3>
                    <div className="flex items-center gap-4">
                        <div className="relative w-24 h-24">
                            <svg className="w-24 h-24 transform -rotate-90">
                                <circle
                                    cx="48"
                                    cy="48"
                                    r="40"
                                    stroke="#E8EAE5"
                                    strokeWidth="8"
                                    fill="none"
                                />
                                <circle
                                    cx="48"
                                    cy="48"
                                    r="40"
                                    stroke="#777C6D"
                                    strokeWidth="8"
                                    fill="none"
                                    strokeDasharray={`${(engagement.engagementScore.score / 100) * 251.2} 251.2`}
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-2xl font-bold" style={{ color: '#4F5348' }}>
                                    {engagement.engagementScore.score}
                                </span>
                            </div>
                        </div>
                        <div className="flex-1">
                            <p className="text-lg font-semibold" style={{ color: '#4F5348' }}>
                                {engagement.engagementScore.rating}
                            </p>
                            <div className="mt-2 space-y-1 text-sm text-gray-600">
                                <p>💬 {engagement.messageCount} messages</p>
                                <p>✓ {engagement.acknowledgmentRate}% feedback acknowledged</p>
                                <p>🎯 {engagement.recommendationCompletionRate}% recommendations completed</p>
                            </div>
                            {engagement.lastActive && (
                                <p className="mt-2 text-xs text-gray-500">
                                    Last active: {new Date(engagement.lastActive).toLocaleDateString()}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Mentee Summary */}
            {profile?.mentee?.summary && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-3" style={{ color: '#4F5348' }}>
                        About
                    </h3>
                    <p className="text-gray-700">{profile.mentee.summary}</p>
                </div>
            )}
        </div>
    );
}

// Progress Tab Component
function ProgressTab({ progress, profile }) {
    if (!progress) {
        return <div className="text-center text-gray-600">No progress data available</div>;
    }

    const { sharedData } = profile || {};

    return (
        <div className="space-y-6">
            {/* KPIs Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Total Applications</p>
                    <p className="text-3xl font-bold mt-2" style={{ color: '#4F5348' }}>
                        {progress.kpis?.applications?.total || 0}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        +{progress.kpis?.applications?.change || 0} in last {progress.period} days
                    </p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Total Interviews</p>
                    <p className="text-3xl font-bold mt-2" style={{ color: '#4F5348' }}>
                        {progress.kpis?.interviews?.total || 0}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        +{progress.kpis?.interviews?.change || 0} in last {progress.period} days
                    </p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Goals Completed</p>
                    <p className="text-3xl font-bold mt-2" style={{ color: '#4F5348' }}>
                        {progress.kpis?.goals?.completed || 0}/{progress.kpis?.goals?.total || 0}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        {Math.round(progress.kpis?.goals?.completionRate || 0)}% completion rate
                    </p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Engagement Score</p>
                    <p className="text-3xl font-bold mt-2" style={{ color: '#4F5348' }}>
                        {progress.kpis?.engagement?.activityScore || 0}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Activity level</p>
                </div>
            </div>

            {/* Active Goals Detail */}
            {sharedData?.goals && sharedData.goals.length > 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4" style={{ color: '#4F5348' }}>
                        Active Goals ({sharedData.goals.length})
                    </h3>
                    <div className="space-y-3">
                        {sharedData.goals.map((goal) => (
                            <div key={goal._id} className="border-l-4 border-[#777C6D] pl-4 py-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-800">{goal.title}</p>
                                        {goal.description && (
                                            <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                                        )}
                                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                            <span>Target: {new Date(goal.targetDate).toLocaleDateString()}</span>
                                            {goal.milestones && (
                                                <span>• {goal.milestones.filter(m => m.completed).length}/{goal.milestones.length} milestones</span>
                                            )}
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                                        goal.status === 'completed' ? 'bg-green-100 text-green-800' :
                                        goal.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {goal.status?.replace(/_/g, ' ')}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-500">
                    <p>No active goals shared</p>
                </div>
            )}

            {/* Recent Applications Detail */}
            {sharedData?.applications && sharedData.applications.length > 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4" style={{ color: '#4F5348' }}>
                        Recent Applications ({sharedData.applications.length})
                    </h3>
                    <div className="space-y-3">
                        {sharedData.applications.map((app) => (
                            <div key={app._id} className="flex items-center justify-between p-3 rounded" style={{ backgroundColor: '#E8EAE5' }}>
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-800">{app.title}</p>
                                    <p className="text-sm text-gray-600">{app.company}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Applied: {new Date(app.dateApplied || app.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                                    app.status === 'Offer' ? 'bg-green-100 text-green-800' :
                                    app.status === 'Interview' ? 'bg-blue-100 text-blue-800' :
                                    app.status === 'Applied' ? 'bg-yellow-100 text-yellow-800' :
                                    app.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                }`}>
                                    {app.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-500">
                    <p>No applications shared</p>
                </div>
            )}

            {/* Upcoming Interviews Detail */}
            {sharedData?.interviews && sharedData.interviews.length > 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4" style={{ color: '#4F5348' }}>
                        Interview Schedule ({sharedData.interviews.length})
                    </h3>
                    <div className="space-y-3">
                        {sharedData.interviews.map((interview) => (
                            <div key={interview._id} className="border-l-4 border-blue-500 pl-4 py-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-800">{interview.title || 'Interview'}</p>
                                        <p className="text-sm text-gray-600">{interview.company}</p>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                            <span>📅 {new Date(interview.scheduledDate).toLocaleDateString()}</span>
                                            <span>🕐 {new Date(interview.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            {interview.interviewType && <span>• {interview.interviewType}</span>}
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 text-xs rounded-full font-medium bg-purple-100 text-purple-800">
                                        {interview.status || 'Scheduled'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-500">
                    <p>No interviews shared</p>
                </div>
            )}

            {/* Recent Milestones */}
            {progress.achievedMilestones && progress.achievedMilestones.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4" style={{ color: '#4F5348' }}>
                        Recent Milestones Achieved
                    </h3>
                    <div className="space-y-3">
                        {progress.achievedMilestones.map((milestone, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-3 rounded" style={{ backgroundColor: '#E8EAE5' }}>
                                <span className="text-2xl">🏆</span>
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-800">{milestone.milestoneTitle}</p>
                                    <p className="text-sm text-gray-600">{milestone.goalTitle}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Completed: {new Date(milestone.completedDate).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Activity Trends */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4" style={{ color: '#4F5348' }}>
                    Activity Trends (Last {progress.period} days)
                </h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded" style={{ backgroundColor: '#E8EAE5' }}>
                        <span className="text-gray-700">Applications</span>
                        <span className={`font-semibold ${progress.trends.applications === 'up' ? 'text-green-600' : 'text-gray-600'}`}>
                            {progress.trends.applications === 'up' ? '📈 Increasing' : '➡️ Stable'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded" style={{ backgroundColor: '#E8EAE5' }}>
                        <span className="text-gray-700">Interviews</span>
                        <span className={`font-semibold ${progress.trends.interviews === 'up' ? 'text-green-600' : 'text-gray-600'}`}>
                            {progress.trends.interviews === 'up' ? '📈 Increasing' : '➡️ Stable'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Insights Tab Component
function InsightsTab({ insights }) {
    if (!insights) {
        return <div className="text-center text-gray-600">No insights available</div>;
    }

    return (
        <div className="space-y-6">
            {/* Strengths */}
            {insights.strengths.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: '#4F5348' }}>
                        <span className="text-2xl">💪</span> Strengths
                    </h3>
                    <div className="space-y-3">
                        {insights.strengths.map((strength, idx) => (
                            <div key={idx} className="p-4 rounded-lg bg-green-50 border border-green-200">
                                <p className="font-semibold text-green-800">{strength.area}</p>
                                <p className="text-sm text-green-700 mt-1">{strength.description}</p>
                                <span className="inline-block mt-2 px-2 py-1 text-xs font-medium rounded bg-green-200 text-green-800">
                                    {strength.impact} impact
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Areas for Improvement */}
            {insights.areasForImprovement.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: '#4F5348' }}>
                        <span className="text-2xl">🎯</span> Areas for Improvement
                    </h3>
                    <div className="space-y-3">
                        {insights.areasForImprovement.map((area, idx) => (
                            <div key={idx} className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                                <p className="font-semibold text-yellow-800">{area.area}</p>
                                <p className="text-sm text-yellow-700 mt-1">{area.description}</p>
                                <span className="inline-block mt-2 px-2 py-1 text-xs font-medium rounded bg-yellow-200 text-yellow-800">
                                    {area.impact} impact
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Actionable Recommendations */}
            {insights.actionableRecommendations.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: '#4F5348' }}>
                        <span className="text-2xl">💡</span> Actionable Recommendations
                    </h3>
                    <div className="space-y-4">
                        {insights.actionableRecommendations.map((rec, idx) => (
                            <div key={idx} className="p-4 rounded-lg border-2 border-[#777C6D]" style={{ backgroundColor: '#E8EAE5' }}>
                                <div className="flex items-start justify-between mb-2">
                                    <p className="font-semibold text-gray-800">{rec.title}</p>
                                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                                        rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                                        rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-green-100 text-green-800'
                                    }`}>
                                        {rec.priority}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-700 mb-2">{rec.description}</p>
                                <p className="text-xs text-gray-600 italic">
                                    Expected impact: {rec.estimatedImpact}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Achievement Patterns */}
            {insights.achievementPatterns.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: '#4F5348' }}>
                        <span className="text-2xl">📊</span> Achievement Patterns
                    </h3>
                    <div className="space-y-3">
                        {insights.achievementPatterns.map((pattern, idx) => (
                            <div key={idx} className="p-4 rounded" style={{ backgroundColor: '#E8EAE5' }}>
                                <p className="font-semibold text-gray-800">{pattern.pattern}</p>
                                <p className="text-sm text-gray-600 mt-1">{pattern.description}</p>
                                <p className="text-sm text-gray-700 mt-2 italic">{pattern.insight}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// Materials Tab Component
function MaterialsTab({ profile }) {
    const [selectedResume, setSelectedResume] = React.useState(null);

    if (!profile) {
        return <div className="text-center text-gray-600">No materials available</div>;
    }

    const { sharedData } = profile;

    const handleViewResume = (resume) => {
        setSelectedResume(resume);
    };

    return (
        <div className="space-y-6">
            {/* Resumes */}
            {sharedData?.resumes && sharedData.resumes.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4" style={{ color: '#4F5348' }}>
                        Resumes ({sharedData.resumes.length})
                    </h3>
                    <div className="space-y-2">
                        {sharedData.resumes.map((resume) => (
                            <div key={resume._id} className="flex items-center justify-between p-3 rounded" style={{ backgroundColor: '#E8EAE5' }}>
                                <div>
                                    <p className="font-medium text-gray-800">{resume.name || 'Resume'}</p>
                                    <p className="text-xs text-gray-600">
                                        Updated: {new Date(resume.updatedAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => handleViewResume(resume)}
                                    className="px-3 py-1 text-sm text-white rounded transition hover:opacity-80" 
                                    style={{ backgroundColor: '#777C6D' }}
                                >
                                    View
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Resume Preview Modal */}
            {selectedResume && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="text-xl font-bold" style={{ color: '#4F5348' }}>
                                {selectedResume.name}
                            </h3>
                            <button
                                onClick={() => setSelectedResume(null)}
                                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                            >
                                ×
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {/* Summary */}
                            {selectedResume.sections?.summary && (
                                <div className="mb-6">
                                    <h4 className="text-lg font-semibold mb-2" style={{ color: '#4F5348' }}>Summary</h4>
                                    <p className="text-gray-700 whitespace-pre-wrap">{selectedResume.sections.summary}</p>
                                </div>
                            )}

                            {/* Experience */}
                            {selectedResume.sections?.experience && selectedResume.sections.experience.length > 0 && (
                                <div className="mb-6">
                                    <h4 className="text-lg font-semibold mb-3" style={{ color: '#4F5348' }}>Experience</h4>
                                    <div className="space-y-4">
                                        {selectedResume.sections.experience.map((exp, idx) => (
                                            <div key={idx} className="border-l-2 border-gray-300 pl-4">
                                                <p className="font-semibold text-gray-800">{exp.title}</p>
                                                <p className="text-sm text-gray-600">{exp.company}</p>
                                                <p className="text-xs text-gray-500">{exp.startDate} - {exp.endDate || 'Present'}</p>
                                                {exp.description && <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{exp.description}</p>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Education */}
                            {selectedResume.sections?.education && selectedResume.sections.education.length > 0 && (
                                <div className="mb-6">
                                    <h4 className="text-lg font-semibold mb-3" style={{ color: '#4F5348' }}>Education</h4>
                                    <div className="space-y-4">
                                        {selectedResume.sections.education.map((edu, idx) => (
                                            <div key={idx} className="border-l-2 border-gray-300 pl-4">
                                                <p className="font-semibold text-gray-800">{edu.degree}</p>
                                                <p className="text-sm text-gray-600">{edu.school}</p>
                                                <p className="text-xs text-gray-500">{edu.graduationDate}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Skills */}
                            {selectedResume.sections?.skills && selectedResume.sections.skills.length > 0 && (
                                <div className="mb-6">
                                    <h4 className="text-lg font-semibold mb-3" style={{ color: '#4F5348' }}>Skills</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedResume.sections.skills.map((skill, idx) => (
                                            <span 
                                                key={idx} 
                                                className="px-3 py-1 text-sm rounded"
                                                style={{ backgroundColor: '#E8EAE5', color: '#4F5348' }}
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Projects */}
                            {selectedResume.sections?.projects && selectedResume.sections.projects.length > 0 && (
                                <div className="mb-6">
                                    <h4 className="text-lg font-semibold mb-3" style={{ color: '#4F5348' }}>Projects</h4>
                                    <div className="space-y-4">
                                        {selectedResume.sections.projects.map((project, idx) => (
                                            <div key={idx} className="border-l-2 border-gray-300 pl-4">
                                                <p className="font-semibold text-gray-800">{project.name}</p>
                                                {project.description && <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{project.description}</p>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-gray-200 flex justify-end">
                            <button
                                onClick={() => setSelectedResume(null)}
                                className="px-4 py-2 text-white rounded transition"
                                style={{ backgroundColor: '#777C6D' }}
                                onMouseOver={e => e.currentTarget.style.backgroundColor = '#656A5C'}
                                onMouseOut={e => e.currentTarget.style.backgroundColor = '#777C6D'}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Applications */}
            {sharedData?.applications && sharedData.applications.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4" style={{ color: '#4F5348' }}>
                        Recent Applications ({sharedData.applications.length})
                    </h3>
                    <div className="space-y-2">
                        {sharedData.applications.map((app) => (
                            <div key={app._id} className="flex items-center justify-between p-3 rounded" style={{ backgroundColor: '#E8EAE5' }}>
                                <div>
                                    <p className="font-medium text-gray-800">{app.title}</p>
                                    <p className="text-sm text-gray-600">{app.company}</p>
                                    <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800 mt-1 inline-block">
                                        {app.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Goals */}
            {sharedData?.goals && sharedData.goals.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4" style={{ color: '#4F5348' }}>
                        Active Goals ({sharedData.goals.length})
                    </h3>
                    <div className="space-y-2">
                        {sharedData.goals.map((goal) => (
                            <div key={goal._id} className="flex items-center justify-between p-3 rounded" style={{ backgroundColor: '#E8EAE5' }}>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-800">{goal.title}</p>
                                    <p className="text-xs text-gray-600">
                                        Target: {new Date(goal.targetDate).toLocaleDateString()}
                                    </p>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded ${
                                    goal.status === 'completed' ? 'bg-green-100 text-green-800' :
                                    goal.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                    'bg-gray-100 text-gray-800'
                                }`}>
                                    {goal.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Interviews */}
            {sharedData?.interviews && sharedData.interviews.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4" style={{ color: '#4F5348' }}>
                        Interview Schedule ({sharedData.interviews.length})
                    </h3>
                    <div className="space-y-2">
                        {sharedData.interviews.map((interview) => (
                            <div key={interview._id} className="flex items-center justify-between p-3 rounded" style={{ backgroundColor: '#E8EAE5' }}>
                                <div>
                                    <p className="font-medium text-gray-800">{interview.title}</p>
                                    <p className="text-sm text-gray-600">{interview.company}</p>
                                    <p className="text-xs text-gray-600 mt-1">
                                        {new Date(interview.scheduledDate).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

MenteeDetailView.propTypes = {
    menteeId: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
};

OverviewTab.propTypes = {
    profile: PropTypes.object,
    progress: PropTypes.object,
    engagement: PropTypes.object,
};

ProgressTab.propTypes = {
    progress: PropTypes.object,
    profile: PropTypes.object,
};

InsightsTab.propTypes = {
    insights: PropTypes.object,
};

MaterialsTab.propTypes = {
    profile: PropTypes.object,
};
