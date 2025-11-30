import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import InviteAdvisorModal from "./InviteAdvisorModal";
import AdvisorSessionManagement from "./AdvisorSessionManagement";
import AdvisorEvaluationForm from "./AdvisorEvaluationForm";
import AdvisorMessaging from "./AdvisorMessaging";

const ADVISOR_TYPE_LABELS = {
    career_coach: "Career Coach",
    executive_coach: "Executive Coach",
    resume_writer: "Resume Writer",
    interview_coach: "Interview Coach",
    salary_negotiator: "Salary Negotiator",
    industry_expert: "Industry Expert",
    linkedin_specialist: "LinkedIn Specialist",
    recruiter_advisor: "Recruiter Advisor",
    other: "Other",
};

export default function AdvisorDashboard() {
    const [advisors, setAdvisors] = useState([]);
    const [clients, setClients] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [pendingInvitations, setPendingInvitations] = useState({ sent: [], received: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("advisors");
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [selectedAdvisor, setSelectedAdvisor] = useState(null);
    const [selectedClient, setSelectedClient] = useState(null);
    const [showMessaging, setShowMessaging] = useState(null);
    const [showEvaluation, setShowEvaluation] = useState(null);
    const [showSessionManager, setShowSessionManager] = useState(null);
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        setError("");
        try {
            const token = localStorage.getItem("token");
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            // Fetch advisors (current user as job seeker)
            const advisorsRes = await fetch("/api/external-advisors/my-advisors", { headers });
            let advisorData = { data: [] };
            if (advisorsRes.ok) {
                advisorData = await advisorsRes.json();
            }

            // Fetch clients (current user as advisor)
            const clientsRes = await fetch("/api/external-advisors/my-clients", { headers });
            let clientData = { data: [] };
            if (clientsRes.ok) {
                clientData = await clientsRes.json();
            }

            // Fetch recommendations
            const recommendationsRes = await fetch("/api/external-advisors/recommendations", { headers });
            let recData = { data: [] };
            if (recommendationsRes.ok) {
                recData = await recommendationsRes.json();
            }

            // Fetch sessions
            const sessionsRes = await fetch("/api/external-advisors/sessions?upcoming=true", { headers });
            let sessionData = { data: [] };
            if (sessionsRes.ok) {
                sessionData = await sessionsRes.json();
            }

            // Fetch pending invitations
            const pendingRes = await fetch("/api/external-advisors/pending", { headers });
            let pendingData = { data: { sent: [], received: [] } };
            if (pendingRes.ok) {
                pendingData = await pendingRes.json();
            }

            setAdvisors(Array.isArray(advisorData.data) ? advisorData.data : []);
            setClients(Array.isArray(clientData.data) ? clientData.data : []);
            setRecommendations(Array.isArray(recData.data) ? recData.data : []);
            setSessions(Array.isArray(sessionData.data) ? sessionData.data : []);
            setPendingInvitations(pendingData.data || { sent: [], received: [] });

            // Determine user role
            const hasAdvisors = advisorData.data?.length > 0 || pendingData.data?.sent?.length > 0;
            const hasClients = clientData.data?.length > 0 || pendingData.data?.received?.length > 0;

            if (hasAdvisors && hasClients) {
                setUserRole("both");
            } else if (hasClients) {
                setUserRole("advisor");
                setActiveTab("clients");
            } else {
                setUserRole("seeker");
            }

            // Auto-switch to pending tab if there are received invitations
            if (pendingData.data?.received?.length > 0) {
                setActiveTab("pending");
            }
        } catch (err) {
            console.error("Dashboard fetch error:", err);
            setError("Failed to load advisor dashboard: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptInvitation = async (relationshipId) => {
        try {
            const token = localStorage.getItem("token");
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            const response = await fetch(`/api/external-advisors/accept/${relationshipId}`, {
                method: "POST",
                headers,
            });

            if (response.ok) {
                fetchDashboardData();
            } else {
                const data = await response.json();
                setError(data.message || "Failed to accept invitation");
            }
        } catch (err) {
            setError("Failed to accept invitation: " + err.message);
        }
    };

    const handleRejectInvitation = async (relationshipId) => {
        try {
            const token = localStorage.getItem("token");
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            const response = await fetch(`/api/external-advisors/reject/${relationshipId}`, {
                method: "POST",
                headers,
            });

            if (response.ok) {
                fetchDashboardData();
            } else {
                const data = await response.json();
                setError(data.message || "Failed to reject invitation");
            }
        } catch (err) {
            setError("Failed to reject invitation: " + err.message);
        }
    };

    const handleCancelRelationship = async (relationshipId) => {
        if (!window.confirm("Are you sure you want to end this advisor relationship?")) {
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            const response = await fetch(`/api/external-advisors/cancel/${relationshipId}`, {
                method: "POST",
                headers,
            });

            if (response.ok) {
                fetchDashboardData();
            } else {
                const data = await response.json();
                setError(data.message || "Failed to end relationship");
            }
        } catch (err) {
            setError("Failed to end relationship: " + err.message);
        }
    };

    const handleUpdateRecommendation = async (recommendationId, status, progressNotes) => {
        try {
            const token = localStorage.getItem("token");
            const headers = {
                "Content-Type": "application/json",
                ...(token && { Authorization: `Bearer ${token}` }),
            };

            const response = await fetch(`/api/external-advisors/recommendations/${recommendationId}`, {
                method: "PUT",
                headers,
                body: JSON.stringify({ status, progressNotes }),
            });

            if (response.ok) {
                fetchDashboardData();
            } else {
                const data = await response.json();
                setError(data.message || "Failed to update recommendation");
            }
        } catch (err) {
            setError("Failed to update recommendation: " + err.message);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    const renderAdvisorCard = (advisor, isPending = false) => (
        <div
            key={advisor._id}
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
            <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-semibold">
                        {advisor.advisorId?.firstName?.[0] || advisor.advisorEmail?.[0]?.toUpperCase() || "A"}
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 text-lg">
                            {advisor.advisorId
                                ? `${advisor.advisorId.firstName} ${advisor.advisorId.lastName}`
                                : advisor.advisorEmail}
                        </h3>
                        <p className="text-sm text-gray-500">
                            {ADVISOR_TYPE_LABELS[advisor.advisorType] || advisor.advisorType}
                        </p>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${advisor.status === "accepted"
                                ? "bg-green-100 text-green-700"
                                : advisor.status === "pending"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-gray-100 text-gray-700"
                            }`}>
                            {advisor.status.charAt(0).toUpperCase() + advisor.status.slice(1)}
                        </span>
                    </div>
                </div>

                {!isPending && advisor.status === "accepted" && (
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setShowMessaging(advisor)}
                            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Message"
                        >
                            💬
                        </button>
                        <button
                            onClick={() => setShowSessionManager(advisor)}
                            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Schedule Session"
                        >
                            📅
                        </button>
                        <button
                            onClick={() => setShowEvaluation(advisor)}
                            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Evaluate"
                        >
                            ⭐
                        </button>
                    </div>
                )}
            </div>

            {advisor.focusAreas?.length > 0 && (
                <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">Focus Areas:</p>
                    <div className="flex flex-wrap gap-2">
                        {advisor.focusAreas.slice(0, 4).map((area) => (
                            <span
                                key={area}
                                className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full"
                            >
                                {area.replace(/_/g, " ")}
                            </span>
                        ))}
                        {advisor.focusAreas.length > 4 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                +{advisor.focusAreas.length - 4} more
                            </span>
                        )}
                    </div>
                </div>
            )}

            {advisor.status === "accepted" && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                        Connected since {new Date(advisor.acceptedAt).toLocaleDateString()}
                    </div>
                    <button
                        onClick={() => handleCancelRelationship(advisor._id)}
                        className="text-sm text-red-600 hover:text-red-700"
                    >
                        End Relationship
                    </button>
                </div>
            )}
        </div>
    );

    const renderClientCard = (client) => (
        <div
            key={client._id}
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
            <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white text-xl font-semibold">
                        {client.userId?.firstName?.[0] || "C"}
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 text-lg">
                            {client.userId
                                ? `${client.userId.firstName} ${client.userId.lastName}`
                                : "Client"}
                        </h3>
                        <p className="text-sm text-gray-500">{client.userId?.email}</p>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${client.status === "accepted"
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}>
                            {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                        </span>
                    </div>
                </div>

                {client.status === "accepted" && (
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setShowMessaging(client)}
                            className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Message"
                        >
                            💬
                        </button>
                        <button
                            onClick={() => setShowSessionManager(client)}
                            className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Schedule Session"
                        >
                            📅
                        </button>
                        <button
                            onClick={() => setSelectedClient(client)}
                            className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="View Profile"
                        >
                            👤
                        </button>
                    </div>
                )}
            </div>

            {client.focusAreas?.length > 0 && (
                <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">Focus Areas:</p>
                    <div className="flex flex-wrap gap-2">
                        {client.focusAreas.map((area) => (
                            <span
                                key={area}
                                className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full"
                            >
                                {area.replace(/_/g, " ")}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {client.contractTerms?.completedSessions > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="text-sm text-gray-600">
                        <span className="font-medium">{client.contractTerms.completedSessions}</span> sessions completed
                        {client.contractTerms.totalSessions && (
                            <span> of {client.contractTerms.totalSessions}</span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );

    const renderPendingInvitation = (invitation, type) => (
        <div
            key={invitation._id}
            className="bg-white rounded-xl border-2 border-yellow-200 p-6"
        >
            <div className="flex items-center space-x-2 text-yellow-600 mb-4">
                <span className="text-2xl">📨</span>
                <span className="font-medium">
                    {type === "received" ? "Invitation to Advise" : "Pending Invitation"}
                </span>
            </div>

            <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 text-lg font-semibold">
                    {type === "received"
                        ? invitation.userId?.firstName?.[0] || "U"
                        : invitation.advisorEmail?.[0]?.toUpperCase() || "A"}
                </div>
                <div>
                    <h3 className="font-semibold text-gray-900">
                        {type === "received"
                            ? `${invitation.userId?.firstName} ${invitation.userId?.lastName}`
                            : invitation.advisorEmail}
                    </h3>
                    <p className="text-sm text-gray-500">
                        {ADVISOR_TYPE_LABELS[invitation.advisorType]}
                    </p>
                </div>
            </div>

            {invitation.invitationMessage && (
                <div className="bg-gray-50 border-l-4 border-yellow-400 p-3 mb-4">
                    <p className="text-sm text-gray-700 italic">"{invitation.invitationMessage}"</p>
                </div>
            )}

            {invitation.focusAreas?.length > 0 && (
                <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Focus Areas:</p>
                    <div className="flex flex-wrap gap-2">
                        {invitation.focusAreas.map((area) => (
                            <span
                                key={area}
                                className="px-2 py-1 bg-yellow-50 text-yellow-700 text-xs rounded-full"
                            >
                                {area.replace(/_/g, " ")}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {type === "received" && (
                <div className="flex space-x-3">
                    <button
                        onClick={() => handleAcceptInvitation(invitation._id)}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        ✓ Accept
                    </button>
                    <button
                        onClick={() => handleRejectInvitation(invitation._id)}
                        className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                        ✗ Decline
                    </button>
                </div>
            )}

            {type === "sent" && (
                <div className="text-sm text-gray-500">
                    Sent {new Date(invitation.createdAt).toLocaleDateString()}
                </div>
            )}
        </div>
    );

    const renderRecommendations = () => (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recommendations from Advisors</h3>
                <div className="text-sm text-gray-500">
                    {recommendations.filter(r => r.status === "completed").length} / {recommendations.length} completed
                </div>
            </div>

            {recommendations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    No recommendations yet. Your advisors will add recommendations after your sessions.
                </div>
            ) : (
                <div className="space-y-4">
                    {recommendations.map((rec) => (
                        <div
                            key={rec._id}
                            className={`bg-white rounded-xl border p-5 ${rec.status === "completed"
                                    ? "border-green-200"
                                    : rec.priority === "critical"
                                        ? "border-red-200"
                                        : rec.priority === "high"
                                            ? "border-orange-200"
                                            : "border-gray-200"
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${rec.priority === "critical"
                                                ? "bg-red-100 text-red-700"
                                                : rec.priority === "high"
                                                    ? "bg-orange-100 text-orange-700"
                                                    : rec.priority === "medium"
                                                        ? "bg-yellow-100 text-yellow-700"
                                                        : "bg-gray-100 text-gray-700"
                                            }`}>
                                            {rec.priority}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                                    {rec.advisorId && (
                                        <p className="text-xs text-gray-400 mt-2">
                                            From: {rec.advisorId.firstName} {rec.advisorId.lastName}
                                        </p>
                                    )}
                                </div>
                                <select
                                    value={rec.status}
                                    onChange={(e) => handleUpdateRecommendation(rec._id, e.target.value)}
                                    className={`px-3 py-1 rounded-lg text-sm border ${rec.status === "completed"
                                            ? "bg-green-50 border-green-200 text-green-700"
                                            : rec.status === "in_progress"
                                                ? "bg-blue-50 border-blue-200 text-blue-700"
                                                : "bg-gray-50 border-gray-200 text-gray-700"
                                        }`}
                                >
                                    <option value="pending">Pending</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                    <option value="dismissed">Dismissed</option>
                                </select>
                            </div>

                            {rec.targetDate && (
                                <div className="mt-3 text-sm text-gray-500">
                                    Target: {new Date(rec.targetDate).toLocaleDateString()}
                                </div>
                            )}

                            {rec.resources?.length > 0 && (
                                <div className="mt-3">
                                    <p className="text-sm text-gray-600 mb-1">Resources:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {rec.resources.map((resource, idx) => (
                                            <a
                                                key={idx}
                                                href={resource.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-indigo-600 hover:underline"
                                            >
                                                📎 {resource.title}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderUpcomingSessions = () => (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Sessions</h3>

            {sessions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    No upcoming sessions scheduled.
                </div>
            ) : (
                <div className="space-y-3">
                    {sessions.slice(0, 5).map((session) => (
                        <div
                            key={session._id}
                            className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between"
                        >
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 text-lg">
                                    📅
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-900">{session.title}</h4>
                                    <p className="text-sm text-gray-500">
                                        {new Date(session.scheduledAt).toLocaleDateString()} at{" "}
                                        {new Date(session.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${session.status === "confirmed"
                                        ? "bg-green-100 text-green-700"
                                        : "bg-yellow-100 text-yellow-700"
                                    }`}>
                                    {session.status}
                                </span>
                                {session.meetingLink && (
                                    <a
                                        href={session.meetingLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
                                    >
                                        Join
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const pendingReceivedCount = pendingInvitations.received?.length || 0;

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Career Advisors</h1>
                    <p className="text-gray-600 mt-1">
                        Connect with external career coaches and advisors for personalized guidance
                    </p>
                </div>
                <button
                    onClick={() => setIsInviteModalOpen(true)}
                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
                >
                    <span>+</span>
                    <span>Invite Advisor</span>
                </button>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                    {error}
                    <button onClick={() => setError("")} className="ml-2 font-bold">×</button>
                </div>
            )}

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="flex space-x-8">
                    <button
                        onClick={() => setActiveTab("advisors")}
                        className={`pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === "advisors"
                                ? "border-indigo-500 text-indigo-600"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        My Advisors ({advisors.filter(a => a.status === "accepted").length})
                    </button>
                    {(userRole === "advisor" || userRole === "both") && (
                        <button
                            onClick={() => setActiveTab("clients")}
                            className={`pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === "clients"
                                    ? "border-indigo-500 text-indigo-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            My Clients ({clients.filter(c => c.status === "accepted").length})
                        </button>
                    )}
                    <button
                        onClick={() => setActiveTab("pending")}
                        className={`pb-4 px-1 border-b-2 font-medium text-sm relative ${activeTab === "pending"
                                ? "border-indigo-500 text-indigo-600"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        Pending
                        {pendingReceivedCount > 0 && (
                            <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                                {pendingReceivedCount}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab("recommendations")}
                        className={`pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === "recommendations"
                                ? "border-indigo-500 text-indigo-600"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        Recommendations ({recommendations.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("sessions")}
                        className={`pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === "sessions"
                                ? "border-indigo-500 text-indigo-600"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        Sessions ({sessions.length})
                    </button>
                </nav>
            </div>

            {/* Tab Content */}
            {activeTab === "advisors" && (
                <div>
                    {advisors.filter(a => a.status === "accepted").length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">🎓</div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No advisors yet</h3>
                            <p className="text-gray-600 mb-6">
                                Invite career coaches and advisors to help guide your job search journey.
                            </p>
                            <button
                                onClick={() => setIsInviteModalOpen(true)}
                                className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                            >
                                Invite Your First Advisor
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {advisors
                                .filter(a => a.status === "accepted")
                                .map((advisor) => renderAdvisorCard(advisor))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === "clients" && (
                <div>
                    {clients.filter(c => c.status === "accepted").length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">👥</div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No clients yet</h3>
                            <p className="text-gray-600">
                                When job seekers invite you as their advisor, they'll appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {clients
                                .filter(c => c.status === "accepted")
                                .map((client) => renderClientCard(client))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === "pending" && (
                <div className="space-y-8">
                    {pendingInvitations.received?.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Invitations to Review</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {pendingInvitations.received.map((inv) =>
                                    renderPendingInvitation(inv, "received")
                                )}
                            </div>
                        </div>
                    )}

                    {pendingInvitations.sent?.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sent Invitations</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {pendingInvitations.sent.map((inv) =>
                                    renderPendingInvitation(inv, "sent")
                                )}
                            </div>
                        </div>
                    )}

                    {pendingInvitations.received?.length === 0 && pendingInvitations.sent?.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            No pending invitations
                        </div>
                    )}
                </div>
            )}

            {activeTab === "recommendations" && renderRecommendations()}

            {activeTab === "sessions" && renderUpcomingSessions()}

            {/* Modals */}
            <InviteAdvisorModal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                onInviteSent={fetchDashboardData}
            />

            {showMessaging && (
                <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: "rgba(0,0,0,0.48)" }}>
                    <div className="max-w-2xl w-full mx-4">
                        <AdvisorMessaging
                            relationship={showMessaging}
                            onClose={() => setShowMessaging(null)}
                        />
                    </div>
                </div>
            )}

            {showEvaluation && (
                <AdvisorEvaluationForm
                    relationship={showEvaluation}
                    onClose={() => setShowEvaluation(null)}
                    onSubmitted={fetchDashboardData}
                />
            )}

            {showSessionManager && (
                <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: "rgba(0,0,0,0.48)" }}>
                    <div className="max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <AdvisorSessionManagement
                            relationship={showSessionManager}
                            onClose={() => setShowSessionManager(null)}
                            onSessionCreated={fetchDashboardData}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

AdvisorDashboard.propTypes = {};
