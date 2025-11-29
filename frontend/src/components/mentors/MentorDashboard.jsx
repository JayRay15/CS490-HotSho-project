import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import InviteMentorModal from "./InviteMentorModal";
import MenteeDetailView from "./MenteeDetailView";
import MessagingModal from "./MessagingModal";

export default function MentorDashboard() {
    const [mentors, setMentors] = useState([]);
    const [mentees, setMentees] = useState([]);
    const [feedback, setFeedback] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("mentors"); // 'mentors', 'mentees', 'feedback', 'recommendations'
    const [userRole, setUserRole] = useState(null); // 'mentee' or 'mentor' or both

    const [mentorDashboardData, setMentorDashboardData] = useState(null);
    const [selectedMenteeId, setSelectedMenteeId] = useState(null);
    const [pendingInvitations, setPendingInvitations] = useState({ sent: [], received: [] });
    const [messagingModal, setMessagingModal] = useState({ isOpen: false, relationshipId: null, recipientName: "", recipientId: null });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        setError("");
        try {
            const token = localStorage.getItem("token");
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            // Fetch mentors (current user as mentee)
            const mentorsRes = await fetch("/api/mentors/my-mentors", { headers });
            let mentorData = { data: [] };
            if (mentorsRes.ok) {
                const text = await mentorsRes.text();
                try {
                    mentorData = JSON.parse(text);
                } catch (parseErr) {
                    console.error("Failed to parse mentors response:", text);
                    throw new Error("Server returned invalid response");
                }
            }

            // Fetch mentees (current user as mentor)
            const menteesRes = await fetch("/api/mentors/my-mentees", { headers });
            let menteeData = { data: [] };
            if (menteesRes.ok) {
                const text = await menteesRes.text();
                try {
                    menteeData = JSON.parse(text);
                } catch (parseErr) {
                    console.error("Failed to parse mentees response:", text);
                    menteeData = { data: [] };
                }
            }

            // Fetch received feedback
            const feedbackRes = await fetch("/api/mentors/feedback/received", { headers });
            let feedbackData = { data: [] };
            if (feedbackRes.ok) {
                const text = await feedbackRes.text();
                try {
                    feedbackData = JSON.parse(text);
                } catch (parseErr) {
                    console.error("Failed to parse feedback response:", text);
                    feedbackData = { data: [] };
                }
            }

            // Fetch recommendations
            const recommendationsRes = await fetch("/api/mentors/recommendations", { headers });
            let recommendationsData = { data: [] };
            if (recommendationsRes.ok) {
                const text = await recommendationsRes.text();
                try {
                    recommendationsData = JSON.parse(text);
                } catch (parseErr) {
                    console.error("Failed to parse recommendations response:", text);
                    recommendationsData = { data: [] };
                }
            }

            // Fetch pending invitations
            const pendingRes = await fetch("/api/mentors/pending", { headers });
            let pendingData = { data: { sent: [], received: [] } };
            if (pendingRes.ok) {
                const text = await pendingRes.text();
                try {
                    pendingData = JSON.parse(text);
                } catch (parseErr) {
                    console.error("Failed to parse pending invitations response:", text);
                    pendingData = { data: { sent: [], received: [] } };
                }
            }

            setMentors(Array.isArray(mentorData.data) ? mentorData.data : []);
            setMentees(Array.isArray(menteeData.data) ? menteeData.data : []);
            setFeedback(Array.isArray(feedbackData.data) ? feedbackData.data : []);
            setRecommendations(Array.isArray(recommendationsData.data) ? recommendationsData.data : []);
            
            const pendingInvitationsData = pendingData.data || { sent: [], received: [] };
            setPendingInvitations(pendingInvitationsData);

            // Auto-switch to pending tab if there are received invitations
            if (pendingInvitationsData.received && pendingInvitationsData.received.length > 0) {
                setActiveTab("pending");
            }

            // Determine user role
            if (Array.isArray(mentorData.data) && mentorData.data?.length > 0) setUserRole("mentee");
            if (Array.isArray(menteeData.data) && menteeData.data?.length > 0) {
                setUserRole((prev) => (prev ? "both" : "mentor"));
                
                // Fetch specialized mentor dashboard data if user is a mentor
                fetchMentorDashboard(headers);
            }
        } catch (err) {
            console.error("Dashboard fetch error:", err);
            setError("Failed to load mentor dashboard: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchMentorDashboard = async (headers) => {
        try {
            const dashboardRes = await fetch("/api/mentors/dashboard", { headers });
            if (dashboardRes.ok) {
                const dashboardData = await dashboardRes.json();
                setMentorDashboardData(dashboardData.data);
            }
        } catch (err) {
            console.error("Error fetching mentor dashboard data:", err);
        }
    };

    const handleAcceptInvitation = async (relationshipId) => {
        try {
            const token = localStorage.getItem("token");
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            
            const response = await fetch(`/api/mentors/accept/${relationshipId}`, {
                method: "POST",
                headers,
            });

            if (response.ok) {
                // Refresh dashboard data
                fetchDashboardData();
            } else {
                const data = await response.json();
                setError(data.message || "Failed to accept invitation");
            }
        } catch (err) {
            console.error("Error accepting invitation:", err);
            setError("Failed to accept invitation");
        }
    };

    const handleDeclineInvitation = async (relationshipId) => {
        try {
            const token = localStorage.getItem("token");
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            
            const response = await fetch(`/api/mentors/reject/${relationshipId}`, {
                method: "POST",
                headers,
            });

            if (response.ok) {
                // Refresh dashboard data
                fetchDashboardData();
            } else {
                const data = await response.json();
                setError(data.message || "Failed to decline invitation");
            }
        } catch (err) {
            console.error("Error declining invitation:", err);
            setError("Failed to decline invitation");
        }
    };

    const handleInviteSent = () => {
        fetchDashboardData();
    };

    const handleAcknowledgeFeedback = async (feedbackId) => {
        try {
            const response = await fetch(`/api/mentors/feedback/${feedbackId}/acknowledge`, {
                method: "PUT",
            });

            if (response.ok) {
                setFeedback((prev) =>
                    prev.map((f) =>
                        f._id === feedbackId ? { ...f, acknowledged: true } : f
                    )
                );
            }
        } catch (err) {
            console.error("Error acknowledging feedback:", err);
        }
    };

    const handleUpdateRecommendation = async (
        recommendationId,
        newStatus,
        progressNotes
    ) => {
        try {
            const response = await fetch(
                `/api/mentors/recommendations/${recommendationId}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: newStatus, progressNotes }),
                }
            );

            if (response.ok) {
                setRecommendations((prev) =>
                    prev.map((r) =>
                        r._id === recommendationId ? { ...r, status: newStatus } : r
                    )
                );
            }
        } catch (err) {
            console.error("Error updating recommendation:", err);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mx-auto mb-4" style={{ borderTopColor: '#777C6D', borderBottomColor: '#777C6D' }}></div>
                    <p className="text-gray-600">Loading mentor dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={{ backgroundColor: "#E4E6E0" }}>
            <div className="max-w-7xl mx-auto pt-12 pb-12 px-4">
                {/* Header */}
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold mb-2" style={{ color: "#4F5348" }}>Mentor Hub</h1>
                        <p style={{ color: "#656A5C" }}>
                            Collaborate with mentors and coaches to guide your job search
                        </p>
                    </div>
                    <button
                        onClick={() => setIsInviteModalOpen(true)}
                        className="px-4 py-2 text-white rounded-lg transition font-medium"
                        style={{ backgroundColor: '#777C6D' }}
                        onMouseOver={e => e.currentTarget.style.backgroundColor = '#656A5C'}
                        onMouseOut={e => e.currentTarget.style.backgroundColor = '#777C6D'}
                    >
                        + Invite Mentor
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Pending Invitations Alert */}
                {pendingInvitations.received.length > 0 && activeTab !== "pending" && (
                    <div className="mb-4 p-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">🌟</span>
                            <div>
                                <p className="font-semibold text-yellow-900">
                                    You have {pendingInvitations.received.length} pending mentor invitation{pendingInvitations.received.length > 1 ? 's' : ''}!
                                </p>
                                <p className="text-sm text-yellow-700">
                                    Someone wants you to be their mentor. Review and respond to the invitation.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setActiveTab("pending")}
                            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition font-medium whitespace-nowrap"
                        >
                            View Invitations
                        </button>
                    </div>
                )}

                {/* Tab Navigation */}
                <div className="mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                            <button
                                onClick={() => setActiveTab("mentors")}
                                className={`${activeTab === "mentors"
                                        ? "border-[#777C6D] text-[#777C6D]"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                            >
                                My Mentors ({mentors.length})
                            </button>
                            {pendingInvitations.received.length > 0 && (
                                <button
                                    onClick={() => setActiveTab("pending")}
                                    className={`${activeTab === "pending"
                                            ? "border-[#777C6D] text-[#777C6D]"
                                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors relative`}
                                >
                                    Pending Invitations ({pendingInvitations.received.length})
                                    <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                                        {pendingInvitations.received.length}
                                    </span>
                                </button>
                            )}
                            {userRole === "mentor" || userRole === "both" ? (
                                <button
                                    onClick={() => setActiveTab("mentees")}
                                    className={`${activeTab === "mentees"
                                            ? "border-[#777C6D] text-[#777C6D]"
                                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                                >
                                    My Mentees ({mentees.length})
                                </button>
                            ) : null}
                            {feedback.length > 0 && (
                                <button
                                    onClick={() => setActiveTab("feedback")}
                                    className={`${activeTab === "feedback"
                                            ? "border-[#777C6D] text-[#777C6D]"
                                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                                >
                                    Feedback ({feedback.length})
                                </button>
                            )}
                            {recommendations.length > 0 && (
                                <button
                                    onClick={() => setActiveTab("recommendations")}
                                    className={`${activeTab === "recommendations"
                                            ? "border-[#777C6D] text-[#777C6D]"
                                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                                >
                                    Recommendations ({recommendations.length})
                                </button>
                            )}
                        </nav>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="mt-6">
                    {/* My Mentors Tab */}
                    {activeTab === "mentors" && (
                        <div>
                            {mentors.length === 0 ? (
                                <div className="bg-white rounded-lg shadow p-12 text-center">
                                    <p className="text-gray-600 mb-4">
                                        You haven't invited any mentors yet
                                    </p>
                                    <button
                                        onClick={() => setIsInviteModalOpen(true)}
                                        className="px-4 py-2 text-white rounded-lg transition"
                                        style={{ backgroundColor: '#777C6D' }}
                                        onMouseOver={e => e.currentTarget.style.backgroundColor = '#656A5C'}
                                        onMouseOut={e => e.currentTarget.style.backgroundColor = '#777C6D'}
                                    >
                                        Invite Your First Mentor
                                    </button>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {mentors.map((mentor) => (
                                        <MentorCard 
                                            key={mentor._id} 
                                            mentor={mentor}
                                            onMessage={(relationshipId, recipientName, recipientId) => 
                                                setMessagingModal({ isOpen: true, relationshipId, recipientName, recipientId })
                                            }
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Pending Invitations Tab */}
                    {activeTab === "pending" && (
                        <div>
                            {pendingInvitations.received.length === 0 ? (
                                <div className="bg-white rounded-lg shadow p-12 text-center">
                                    <p className="text-gray-600">No pending invitations</p>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {pendingInvitations.received.map((invitation) => (
                                        <PendingInvitationCard 
                                            key={invitation._id} 
                                            invitation={invitation}
                                            onAccept={handleAcceptInvitation}
                                            onDecline={handleDeclineInvitation}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* My Mentees Tab */}
                    {activeTab === "mentees" && (
                        <div>
                            {/* Mentor Dashboard Overview */}
                            {mentorDashboardData && (
                                <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="bg-white rounded-lg shadow p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-gray-600">Total Mentees</p>
                                                <p className="text-2xl font-bold" style={{ color: '#4F5348' }}>
                                                    {mentorDashboardData.menteeCount}
                                                </p>
                                            </div>
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E8EAE5' }}>
                                                <span className="text-xl">👥</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-lg shadow p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-gray-600">Unread Messages</p>
                                                <p className="text-2xl font-bold" style={{ color: '#4F5348' }}>
                                                    {mentorDashboardData.unreadMessages}
                                                </p>
                                            </div>
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E8EAE5' }}>
                                                <span className="text-xl">💬</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-lg shadow p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-gray-600">Pending Recommendations</p>
                                                <p className="text-2xl font-bold" style={{ color: '#4F5348' }}>
                                                    {mentorDashboardData.pendingRecommendations}
                                                </p>
                                            </div>
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E8EAE5' }}>
                                                <span className="text-xl">💡</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-lg shadow p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-gray-600">Recent Feedback</p>
                                                <p className="text-2xl font-bold" style={{ color: '#4F5348' }}>
                                                    {mentorDashboardData.recentFeedback?.length || 0}
                                                </p>
                                            </div>
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E8EAE5' }}>
                                                <span className="text-xl">📝</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Recent Activity */}
                            {mentorDashboardData?.recentActivity && mentorDashboardData.recentActivity.length > 0 && (
                                <div className="mb-6 bg-white rounded-lg shadow p-4">
                                    <h3 className="text-lg font-semibold mb-4" style={{ color: '#4F5348' }}>Recent Activity</h3>
                                    <div className="space-y-3">
                                        {mentorDashboardData.recentActivity.slice(0, 5).map((activity, idx) => (
                                            <div key={idx} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#E8EAE5' }}>
                                                    <span className="text-sm">
                                                        {activity.type === 'feedback' ? '📝' : '💡'}
                                                    </span>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm text-gray-800">{activity.description}</p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {new Date(activity.date).toLocaleDateString()} at {new Date(activity.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {mentees.length === 0 ? (
                                <div className="bg-white rounded-lg shadow p-12 text-center">
                                    <p className="text-gray-600">No mentees yet</p>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {mentees.map((mentee) => (
                                        <MenteeCard 
                                            key={mentee._id} 
                                            mentee={mentee}
                                            onViewDetails={(menteeId) => setSelectedMenteeId(menteeId)}
                                            onMessage={(relationshipId, recipientName, recipientId) => 
                                                setMessagingModal({ isOpen: true, relationshipId, recipientName, recipientId })
                                            }
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Feedback Tab */}
                    {activeTab === "feedback" && (
                        <div>
                            {feedback.length === 0 ? (
                                <div className="bg-white rounded-lg shadow p-12 text-center">
                                    <p className="text-gray-600">No feedback yet</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {feedback.map((item) => (
                                        <FeedbackCard
                                            key={item._id}
                                            feedback={item}
                                            onAcknowledge={handleAcknowledgeFeedback}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Recommendations Tab */}
                    {activeTab === "recommendations" && (
                        <div>
                            {recommendations.length === 0 ? (
                                <div className="bg-white rounded-lg shadow p-12 text-center">
                                    <p className="text-gray-600">No recommendations yet</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {recommendations.map((rec) => (
                                        <RecommendationCard
                                            key={rec._id}
                                            recommendation={rec}
                                            onUpdate={handleUpdateRecommendation}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Invite Modal */}
                <InviteMentorModal
                    isOpen={isInviteModalOpen}
                    onClose={() => setIsInviteModalOpen(false)}
                    onInviteSent={handleInviteSent}
                />

                {/* Mentee Detail View Modal */}
                {selectedMenteeId && (
                    <MenteeDetailView
                        menteeId={selectedMenteeId}
                        onClose={() => setSelectedMenteeId(null)}
                    />
                )}

                {/* Messaging Modal */}
                {messagingModal.isOpen && (
                    <MessagingModal
                        relationshipId={messagingModal.relationshipId}
                        recipientName={messagingModal.recipientName}
                        recipientId={messagingModal.recipientId}
                        onClose={() => setMessagingModal({ isOpen: false, relationshipId: null, recipientName: "", recipientId: null })}
                    />
                )}
            </div>
        </div>
    );
}

// Mentor Card Component
function MentorCard({ mentor, onMessage }) {
    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                    {mentor.mentorId?.profilePicture ? (
                        <img
                            src={mentor.mentorId.profilePicture}
                            alt={mentor.mentorId.firstName}
                            className="w-12 h-12 rounded-full"
                        />
                    ) : (
                        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E8EAE5' }}>
                            <span className="font-bold" style={{ color: '#777C6D' }}>
                                {mentor.mentorId?.firstName?.charAt(0) || "M"}
                            </span>
                        </div>
                    )}
                    <div>
                        <h3 className="font-semibold text-gray-800">
                            {mentor.mentorId?.firstName} {mentor.mentorId?.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">{mentor.mentorId?.email}</p>
                        <div className="mt-2 flex gap-2">
                            {mentor.focusAreas?.map((area) => (
                                <span
                                    key={area}
                                    className="inline-block px-2 py-1 text-xs rounded"
                                    style={{ backgroundColor: '#E8EAE5', color: '#4F5348' }}
                                >
                                    {area.replace(/_/g, " ")}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full font-medium text-center">
                        Connected
                    </span>
                    <button
                        onClick={() => onMessage(
                            mentor._id,
                            mentor.mentorId?.firstName && mentor.mentorId?.lastName 
                                ? `${mentor.mentorId.firstName} ${mentor.mentorId.lastName}` 
                                : mentor.mentorId?.email || "Your Mentor",
                            mentor.mentorId?._id
                        )}
                        className="px-3 py-1 text-white text-sm rounded transition"
                        style={{ backgroundColor: '#777C6D' }}
                        onMouseOver={e => e.currentTarget.style.backgroundColor = '#656A5C'}
                        onMouseOut={e => e.currentTarget.style.backgroundColor = '#777C6D'}
                    >
                        Message
                    </button>
                </div>
            </div>
        </div>
    );
}

MentorCard.propTypes = {
    mentor: PropTypes.object.isRequired,
    onMessage: PropTypes.func.isRequired,
};

// Mentee Card Component
function MenteeCard({ mentee, onViewDetails, onMessage }) {
    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                    {mentee.menteeId?.profilePicture ? (
                        <img
                            src={mentee.menteeId.profilePicture}
                            alt={mentee.menteeId.firstName}
                            className="w-12 h-12 rounded-full"
                        />
                    ) : (
                        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E8EAE5' }}>
                            <span className="font-bold" style={{ color: '#777C6D' }}>
                                {mentee.menteeId?.firstName?.charAt(0) || "M"}
                            </span>
                        </div>
                    )}
                    <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">
                            {mentee.menteeId?.firstName} {mentee.menteeId?.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">{mentee.menteeId?.email}</p>
                        <p className="text-sm text-gray-700 mt-1">
                            Type: mentee
                        </p>
                        <div className="mt-2 flex gap-2">
                            {mentee.focusAreas?.map((area) => (
                                <span
                                    key={area}
                                    className="inline-block px-2 py-1 text-xs rounded"
                                    style={{ backgroundColor: '#E8EAE5', color: '#4F5348' }}
                                >
                                    {area.replace(/_/g, " ")}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => onViewDetails && onViewDetails(mentee.menteeId._id)}
                        className="px-3 py-1 border border-[#777C6D] text-[#777C6D] text-sm rounded transition hover:bg-[#E8EAE5]"
                    >
                        View Progress
                    </button>
                    <button
                        onClick={() => onMessage(
                            mentee._id,
                            mentee.menteeId?.firstName && mentee.menteeId?.lastName 
                                ? `${mentee.menteeId.firstName} ${mentee.menteeId.lastName}` 
                                : mentee.menteeId?.email || "Your Mentee",
                            mentee.menteeId?._id
                        )}
                        className="px-3 py-1 text-white text-sm rounded transition"
                        style={{ backgroundColor: '#777C6D' }}
                        onMouseOver={e => e.currentTarget.style.backgroundColor = '#656A5C'}
                        onMouseOut={e => e.currentTarget.style.backgroundColor = '#777C6D'}
                    >
                        Message
                    </button>
                </div>
            </div>
        </div>
    );
}

// Feedback Card Component
function FeedbackCard({ feedback, onAcknowledge }) {
    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
            <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-800">
                    Feedback on {feedback.type?.replace(/_/g, " ")}
                </h3>
                {feedback.rating && (
                    <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                            <span
                                key={i}
                                className={
                                    i < feedback.rating ? "text-yellow-400" : "text-gray-300"
                                }
                            >
                                ★
                            </span>
                        ))}
                    </div>
                )}
            </div>
            <p className="text-gray-700 mb-3">{feedback.content}</p>

            {feedback.suggestions?.length > 0 && (
                <div className="mb-4 p-3 rounded" style={{ backgroundColor: '#E8EAE5' }}>
                    <h4 className="font-medium text-gray-800 mb-2">Suggestions:</h4>
                    <ul className="space-y-1">
                        {feedback.suggestions.map((suggestion, idx) => (
                            <li key={idx} className="text-sm text-gray-700">
                                • {suggestion.title}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {!feedback.acknowledged && (
                <button
                    onClick={() => onAcknowledge(feedback._id)}
                    className="px-3 py-1 text-white text-sm rounded transition"
                    style={{ backgroundColor: '#777C6D' }}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = '#656A5C'}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = '#777C6D'}
                >
                    Acknowledge
                </button>
            )}
            {feedback.acknowledged && (
                <span className="text-sm text-green-600 font-medium">
                    ✓ Acknowledged
                </span>
            )}
        </div>
    );
}

// Recommendation Card Component
function RecommendationCard({ recommendation, onUpdate }) {
    const [isUpdating, setIsUpdating] = useState(false);
    const [notes, setNotes] = useState(recommendation.progressNotes || "");

    const handleStatusChange = async (newStatus) => {
        setIsUpdating(true);
        await onUpdate(recommendation._id, newStatus, notes);
        setIsUpdating(false);
    };

    const priorityColor = {
        high: "bg-red-100 text-red-700",
        medium: "bg-yellow-100 text-yellow-700",
        low: "bg-green-100 text-green-700",
    };

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
            <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-800">{recommendation.title}</h3>
                <span
                    className={`px-3 py-1 text-sm rounded-full font-medium ${priorityColor[recommendation.priority] || priorityColor.medium
                        }`}
                >
                    {recommendation.priority}
                </span>
            </div>

            <p className="text-gray-700 mb-3">{recommendation.description}</p>

            {recommendation.targetDate && (
                <p className="text-sm text-gray-600 mb-3">
                    Target: {new Date(recommendation.targetDate).toLocaleDateString()}
                </p>
            )}

            <div className="mb-3">
                <p className="text-sm font-medium text-gray-700 mb-1">Status:</p>
                <div className="flex gap-2">
                    {["pending", "in_progress", "completed"].map((status) => {
                        const isActive = recommendation.status === status;
                        return (
                            <button
                                key={status}
                                onClick={() => handleStatusChange(status)}
                                disabled={isUpdating}
                                className={`px-3 py-1 text-sm rounded transition ${isActive ? "text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
                                style={isActive ? { backgroundColor: '#777C6D' } : {}}
                                onMouseOver={e => isActive && (e.currentTarget.style.backgroundColor = '#656A5C')}
                                onMouseOut={e => isActive && (e.currentTarget.style.backgroundColor = '#777C6D')}
                            >
                                {status.replace(/_/g, " ")}
                            </button>
                        );
                    })}
                </div>
            </div>

            <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add progress notes..."
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2"
                style={{ focusRingColor: '#777C6D' }}
                rows="2"
            />
        </div>
    );
}

// Pending Invitation Card Component
function PendingInvitationCard({ invitation, onAccept, onDecline }) {
    const [isProcessing, setIsProcessing] = useState(false);

    const handleAccept = async () => {
        setIsProcessing(true);
        await onAccept(invitation._id);
        setIsProcessing(false);
    };

    const handleDecline = async () => {
        setIsProcessing(true);
        await onDecline(invitation._id);
        setIsProcessing(false);
    };

    return (
        <div className="bg-white border-2 border-yellow-200 rounded-lg p-6 hover:shadow-md transition">
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">🌟</span>
                        <h3 className="text-lg font-semibold" style={{ color: '#4F5348' }}>
                            Mentorship Invitation
                        </h3>
                    </div>
                    <p className="text-gray-700 mb-2">
                        <strong>{invitation.menteeId?.firstName} {invitation.menteeId?.lastName}</strong> has invited you to be their mentor
                    </p>
                    {invitation.invitationMessage && (
                        <div className="bg-gray-50 border-l-4 border-[#777C6D] p-3 mb-3">
                            <p className="text-sm text-gray-600 italic">"{invitation.invitationMessage}"</p>
                        </div>
                    )}
                    {invitation.focusAreas && invitation.focusAreas.length > 0 && (
                        <div className="mb-3">
                            <p className="text-sm font-medium text-gray-700 mb-1">Focus Areas:</p>
                            <div className="flex flex-wrap gap-2">
                                {invitation.focusAreas.map((area, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                                        {area.replace(/_/g, ' ')}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    <p className="text-xs text-gray-500">
                        Relationship Type: <span className="font-medium">{invitation.relationshipType.replace(/_/g, ' ')}</span>
                    </p>
                </div>
            </div>
            
            <div className="flex gap-3">
                <button
                    onClick={handleAccept}
                    disabled={isProcessing}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                    {isProcessing ? "Processing..." : "✓ Accept Invitation"}
                </button>
                <button
                    onClick={handleDecline}
                    disabled={isProcessing}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                    {isProcessing ? "Processing..." : "✗ Decline"}
                </button>
            </div>
        </div>
    );
}

MentorCard.propTypes = {
    mentor: PropTypes.object.isRequired,
};

MenteeCard.propTypes = {
    mentee: PropTypes.object.isRequired,
    onViewDetails: PropTypes.func,
    onMessage: PropTypes.func.isRequired,
};

FeedbackCard.propTypes = {
    feedback: PropTypes.object.isRequired,
    onAcknowledge: PropTypes.func.isRequired,
};

RecommendationCard.propTypes = {
    recommendation: PropTypes.object.isRequired,
    onUpdate: PropTypes.func.isRequired,
};

PendingInvitationCard.propTypes = {
    invitation: PropTypes.object.isRequired,
    onAccept: PropTypes.func.isRequired,
    onDecline: PropTypes.func.isRequired,
};
