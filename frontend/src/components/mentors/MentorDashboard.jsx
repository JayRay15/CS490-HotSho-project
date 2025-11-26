import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import InviteMentorModal from "./InviteMentorModal";

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

            setMentors(Array.isArray(mentorData.data) ? mentorData.data : []);
            setMentees(Array.isArray(menteeData.data) ? menteeData.data : []);
            setFeedback(Array.isArray(feedbackData.data) ? feedbackData.data : []);
            setRecommendations(Array.isArray(recommendationsData.data) ? recommendationsData.data : []);

            // Determine user role
            if (Array.isArray(mentorData.data) && mentorData.data?.length > 0) setUserRole("mentee");
            if (Array.isArray(menteeData.data) && menteeData.data?.length > 0) {
                setUserRole((prev) => (prev ? "both" : "mentor"));
            }
        } catch (err) {
            console.error("Dashboard fetch error:", err);
            setError("Failed to load mentor dashboard: " + err.message);
        } finally {
            setLoading(false);
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
                                        <MentorCard key={mentor._id} mentor={mentor} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* My Mentees Tab */}
                    {activeTab === "mentees" && (
                        <div>
                            {mentees.length === 0 ? (
                                <div className="bg-white rounded-lg shadow p-12 text-center">
                                    <p className="text-gray-600">No mentees yet</p>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {mentees.map((mentee) => (
                                        <MenteeCard key={mentee._id} mentee={mentee} />
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
            </div>
        </div>
    );
}

// Mentor Card Component
function MentorCard({ mentor }) {
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
                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full font-medium">
                    Connected
                </span>
            </div>
        </div>
    );
}

// Mentee Card Component
function MenteeCard({ mentee }) {
    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
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
                    <div>
                        <h3 className="font-semibold text-gray-800">
                            {mentee.menteeId?.firstName} {mentee.menteeId?.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">{mentee.menteeId?.email}</p>
                        <p className="text-sm text-gray-700 mt-1">
                            Type: {mentee.relationshipType?.replace(/_/g, " ")}
                        </p>
                    </div>
                </div>
                <button
                    className="px-3 py-1 text-white text-sm rounded transition"
                    style={{ backgroundColor: '#777C6D' }}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = '#656A5C'}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = '#777C6D'}
                >
                    Send Message
                </button>
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

MentorCard.propTypes = {
    mentor: PropTypes.object.isRequired,
};

MenteeCard.propTypes = {
    mentee: PropTypes.object.isRequired,
};

FeedbackCard.propTypes = {
    feedback: PropTypes.object.isRequired,
    onAcknowledge: PropTypes.func.isRequired,
};

RecommendationCard.propTypes = {
    recommendation: PropTypes.object.isRequired,
    onUpdate: PropTypes.func.isRequired,
};
