import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import InviteAdvisorModal from "../components/advisors/InviteAdvisorModal";
import AdvisorBillingPanel from "../components/advisors/AdvisorBillingPanel";
import AdvisorSessionManagement from "../components/advisors/AdvisorSessionManagement";
import AdvisorMessaging from "../components/advisors/AdvisorMessaging";
import AdvisorEvaluationForm from "../components/advisors/AdvisorEvaluationForm";
import AdvisorImpactTracker from "../components/advisors/AdvisorImpactTracker";

/**
 * AdvisorsPage - Main page for the External Career Advisors feature
 */
export default function AdvisorsPage() {
    const [searchParams] = useSearchParams();
    const [advisors, setAdvisors] = useState([]);
    const [clients, setClients] = useState([]);
    const [pendingInvitations, setPendingInvitations] = useState({ sent: [], received: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("advisors");
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [tokenAcceptMessage, setTokenAcceptMessage] = useState("");

    // Modal states for advisor features
    const [selectedRelationship, setSelectedRelationship] = useState(null);
    const [isViewingAsAdvisor, setIsViewingAsAdvisor] = useState(false); // Track if viewing from clients tab
    const [showBilling, setShowBilling] = useState(false);
    const [showSessions, setShowSessions] = useState(false);
    const [showMessaging, setShowMessaging] = useState(false);
    const [showEvaluation, setShowEvaluation] = useState(false);
    const [showImpact, setShowImpact] = useState(false);
    const [advisorRatings, setAdvisorRatings] = useState({}); // Store ratings by advisorId

    // Handle pending advisor token from signup
    useEffect(() => {
        const pendingToken = localStorage.getItem("pendingAdvisorToken");
        if (pendingToken) {
            acceptInvitationByToken(pendingToken);
            localStorage.removeItem("pendingAdvisorToken");
        }
    }, []);

    // Show pending invitations tab if coming from invitation link
    useEffect(() => {
        const hasInvitation = searchParams.get("invitation") === "pending";
        if (hasInvitation) {
            setActiveTab("pending");
        }
    }, [searchParams]);

    const acceptInvitationByToken = async (token) => {
        try {
            const authToken = localStorage.getItem("token");
            const res = await fetch(`/api/external-advisors/accept-token/${token}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
                },
            });
            const data = await res.json();
            if (res.ok) {
                setTokenAcceptMessage("🎉 Invitation accepted successfully! You are now connected.");
                setActiveTab("clients");
                fetchData();
            } else {
                setTokenAcceptMessage(data.message || "Could not accept invitation automatically. Please check your pending invitations.");
                setActiveTab("pending");
            }
        } catch (e) {
            console.error("Token accept error:", e);
            setTokenAcceptMessage("Could not accept invitation automatically. Please check your pending invitations.");
            setActiveTab("pending");
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Fetch ratings for all advisors
    const fetchRatings = async (advisorsList) => {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const ratings = {};

        for (const advisor of advisorsList) {
            if (advisor.advisorId?._id) {
                try {
                    const res = await fetch(`/api/external-advisors/ratings/${advisor.advisorId._id}`, { headers });
                    if (res.ok) {
                        const data = await res.json();
                        ratings[advisor.advisorId._id] = data.data;
                    }
                } catch (e) {
                    console.log("Rating fetch failed for", advisor.advisorId._id);
                }
            }
        }
        setAdvisorRatings(ratings);
    };

    const fetchData = async () => {
        setLoading(true);
        setError("");
        try {
            const token = localStorage.getItem("token");
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            // Fetch advisors
            let advisorsList = [];
            try {
                const advisorsRes = await fetch("/api/external-advisors/my-advisors", { headers });
                if (advisorsRes.ok) {
                    const data = await advisorsRes.json();
                    advisorsList = data.data || [];
                    setAdvisors(advisorsList);
                }
            } catch (e) {
                console.log("Advisors fetch failed:", e);
            }

            // Fetch ratings for advisors
            if (advisorsList.length > 0) {
                fetchRatings(advisorsList);
            }

            // Fetch clients
            try {
                const clientsRes = await fetch("/api/external-advisors/my-clients", { headers });
                if (clientsRes.ok) {
                    const data = await clientsRes.json();
                    setClients(data.data || []);
                }
            } catch (e) {
                console.log("Clients fetch failed:", e);
            }

            // Fetch pending
            try {
                const pendingRes = await fetch("/api/external-advisors/pending", { headers });
                if (pendingRes.ok) {
                    const data = await pendingRes.json();
                    setPendingInvitations(data.data || { sent: [], received: [] });
                }
            } catch (e) {
                console.log("Pending fetch failed:", e);
            }
        } catch (err) {
            setError("Failed to load data: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptInvitation = async (id) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`/api/external-advisors/accept/${id}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
            });
            const data = await res.json();
            if (res.ok) {
                alert("Invitation accepted successfully!");
                fetchData();
            } else {
                alert(data.message || "Failed to accept invitation");
            }
        } catch (e) {
            console.error(e);
            alert("Failed to accept invitation. Please try again.");
        }
    };

    const handleRejectInvitation = async (id) => {
        if (!confirm("Are you sure you want to decline this invitation?")) {
            return;
        }
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`/api/external-advisors/reject/${id}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
            });
            const data = await res.json();
            if (res.ok) {
                alert("Invitation declined.");
                fetchData();
            } else {
                alert(data.message || "Failed to decline invitation");
            }
        } catch (e) {
            console.error(e);
            alert("Failed to decline invitation. Please try again.");
        }
    };

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Token acceptance message */}
            {tokenAcceptMessage && (
                <div className={`mb-4 p-4 rounded-lg flex items-center justify-between ${tokenAcceptMessage.includes("🎉")
                    ? "bg-green-50 border border-green-200 text-green-700"
                    : "bg-yellow-50 border border-yellow-200 text-yellow-700"
                    }`}>
                    <span>{tokenAcceptMessage}</span>
                    <button
                        onClick={() => setTokenAcceptMessage("")}
                        className="ml-2 font-bold hover:opacity-70"
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Career Advisors</h1>
                    <p className="text-gray-600 mt-1">
                        Connect with external career coaches and advisors for personalized guidance
                    </p>
                </div>
                <button
                    onClick={() => setShowInviteModal(true)}
                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
                >
                    <span>+</span>
                    <span>Invite Advisor</span>
                </button>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                    {error}
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
                    <button
                        onClick={() => setActiveTab("clients")}
                        className={`pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === "clients"
                            ? "border-indigo-500 text-indigo-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        My Clients ({clients.filter(c => c.status === "accepted").length})
                    </button>
                    <button
                        onClick={() => setActiveTab("pending")}
                        className={`pb-4 px-1 border-b-2 font-medium text-sm relative ${activeTab === "pending"
                            ? "border-indigo-500 text-indigo-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        Pending
                        {(pendingInvitations.received?.length > 0) && (
                            <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                                {pendingInvitations.received.length}
                            </span>
                        )}
                    </button>
                </nav>
            </div>

            {/* Content */}
            {activeTab === "advisors" && (
                <div>
                    {advisors.filter(a => a.status === "accepted").length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border">
                            <div className="text-6xl mb-4">🎓</div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No advisors yet</h3>
                            <p className="text-gray-600 mb-6">
                                Invite career coaches and advisors to help guide your job search journey.
                            </p>
                            <button
                                onClick={() => setShowInviteModal(true)}
                                className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                            >
                                Invite Your First Advisor
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {advisors.filter(a => a.status === "accepted").map((advisor) => {
                                const advisorName = advisor.advisorName
                                    || (advisor.advisorId?.firstName && advisor.advisorId?.lastName
                                        ? `${advisor.advisorId.firstName} ${advisor.advisorId.lastName}`
                                        : null)
                                    || advisor.advisorEmail;
                                const advisorInitial = advisor.advisorId?.firstName?.[0]
                                    || advisor.advisorName?.[0]
                                    || advisor.advisorEmail?.[0]?.toUpperCase()
                                    || "A";
                                const rating = advisor.advisorId?._id ? advisorRatings[advisor.advisorId._id] : null;

                                return (
                                    <div key={advisor._id} className="bg-white rounded-xl border p-6">
                                        <div className="flex items-center space-x-4 mb-4">
                                            <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xl font-bold">
                                                {advisorInitial}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900">
                                                    {advisorName}
                                                </h3>
                                                <div className="flex items-center space-x-2">
                                                    <p className="text-sm text-gray-500">{advisor.advisorType?.replace(/_/g, " ")}</p>
                                                    {rating?.averageRating && (
                                                        <span className="flex items-center text-sm">
                                                            <span className="text-yellow-500">★</span>
                                                            <span className="ml-1 font-medium text-gray-700">{rating.averageRating}</span>
                                                            <span className="text-gray-400 ml-1">({rating.totalReviews})</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="grid grid-cols-5 gap-2 pt-4 border-t">
                                            <button
                                                onClick={() => { setSelectedRelationship(advisor); setIsViewingAsAdvisor(false); setShowMessaging(true); }}
                                                className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                                title="Message"
                                            >
                                                <span className="text-xl">💬</span>
                                                <span className="text-xs text-gray-500 mt-1">Chat</span>
                                            </button>
                                            <button
                                                onClick={() => { setSelectedRelationship(advisor); setIsViewingAsAdvisor(false); setShowSessions(true); }}
                                                className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                                title="Sessions"
                                            >
                                                <span className="text-xl">📅</span>
                                                <span className="text-xs text-gray-500 mt-1">Sessions</span>
                                            </button>
                                            <button
                                                onClick={() => { setSelectedRelationship(advisor); setIsViewingAsAdvisor(false); setShowBilling(true); }}
                                                className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                                title="Billing"
                                            >
                                                <span className="text-xl">💳</span>
                                                <span className="text-xs text-gray-500 mt-1">Billing</span>
                                            </button>
                                            <button
                                                onClick={() => { setSelectedRelationship(advisor); setIsViewingAsAdvisor(false); setShowImpact(true); }}
                                                className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                                title="Impact"
                                            >
                                                <span className="text-xl">📈</span>
                                                <span className="text-xs text-gray-500 mt-1">Impact</span>
                                            </button>
                                            <button
                                                onClick={() => { setSelectedRelationship(advisor); setIsViewingAsAdvisor(false); setShowEvaluation(true); }}
                                                className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                                title="Evaluate"
                                            >
                                                <span className="text-xl">⭐</span>
                                                <span className="text-xs text-gray-500 mt-1">Rate</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {activeTab === "clients" && (
                <div>
                    {clients.filter(c => c.status === "accepted").length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border">
                            <div className="text-6xl mb-4">👥</div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No clients yet</h3>
                            <p className="text-gray-600">
                                When job seekers invite you as their advisor, they'll appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {clients.filter(c => c.status === "accepted").map((client) => {
                                const clientName = client.senderName
                                    || (client.userId?.firstName && client.userId?.lastName
                                        ? `${client.userId.firstName} ${client.userId.lastName}`
                                        : null)
                                    || client.senderEmail
                                    || client.userId?.email
                                    || "Client";
                                const clientInitial = client.userId?.firstName?.[0]
                                    || client.senderName?.[0]
                                    || client.senderEmail?.[0]?.toUpperCase()
                                    || "C";
                                const clientEmail = client.userId?.email || client.senderEmail || "";

                                return (
                                    <div key={client._id} className="bg-white rounded-xl border p-6">
                                        <div className="flex items-center space-x-4 mb-4">
                                            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xl font-bold">
                                                {clientInitial}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900">
                                                    {clientName}
                                                </h3>
                                                <p className="text-sm text-gray-500">{clientEmail}</p>
                                            </div>
                                        </div>

                                        {/* Action Buttons for Clients */}
                                        <div className="grid grid-cols-4 gap-2 pt-4 border-t">
                                            <button
                                                onClick={() => { setSelectedRelationship(client); setIsViewingAsAdvisor(true); setShowMessaging(true); }}
                                                className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                                title="Message"
                                            >
                                                <span className="text-xl">💬</span>
                                                <span className="text-xs text-gray-500 mt-1">Chat</span>
                                            </button>
                                            <button
                                                onClick={() => { setSelectedRelationship(client); setIsViewingAsAdvisor(true); setShowSessions(true); }}
                                                className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                                title="Sessions"
                                            >
                                                <span className="text-xl">📅</span>
                                                <span className="text-xs text-gray-500 mt-1">Sessions</span>
                                            </button>
                                            <button
                                                onClick={() => { setSelectedRelationship(client); setIsViewingAsAdvisor(true); setShowBilling(true); }}
                                                className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                                title="Billing"
                                            >
                                                <span className="text-xl">💳</span>
                                                <span className="text-xs text-gray-500 mt-1">Billing</span>
                                            </button>
                                            <button
                                                onClick={() => { setSelectedRelationship(client); setIsViewingAsAdvisor(true); setShowImpact(true); }}
                                                className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                                title="Impact"
                                            >
                                                <span className="text-xl">📈</span>
                                                <span className="text-xs text-gray-500 mt-1">Impact</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
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
                                {pendingInvitations.received.map((inv) => {
                                    const senderName = inv.senderName
                                        || (inv.userId?.firstName && inv.userId?.lastName
                                            ? `${inv.userId.firstName} ${inv.userId.lastName}`
                                            : null)
                                        || inv.senderEmail
                                        || inv.userId?.email
                                        || "A job seeker";
                                    const senderInitial = inv.senderName?.[0]
                                        || inv.userId?.firstName?.[0]
                                        || inv.senderEmail?.[0]?.toUpperCase()
                                        || "?";

                                    return (
                                        <div key={inv._id} className="bg-white rounded-xl border p-6">
                                            <div className="flex items-center space-x-4 mb-4">
                                                <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 text-lg font-bold">
                                                    {senderInitial}
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-gray-900">
                                                        {senderName}
                                                    </h4>
                                                    <p className="text-sm text-gray-500">wants you as their {inv.advisorType?.replace(/_/g, " ")}</p>
                                                </div>
                                            </div>
                                            <div className="flex space-x-3">
                                                <button
                                                    onClick={() => handleAcceptInvitation(inv._id)}
                                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                                >
                                                    Accept
                                                </button>
                                                <button
                                                    onClick={() => handleRejectInvitation(inv._id)}
                                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                                >
                                                    Decline
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {pendingInvitations.sent?.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sent Invitations</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {pendingInvitations.sent.map((inv) => {
                                    const displayName = inv.advisorName || inv.advisorEmail;
                                    const initial = inv.advisorName?.[0] || inv.advisorEmail?.[0]?.toUpperCase() || "?";
                                    return (
                                        <div key={inv._id} className="bg-white rounded-xl border p-6">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-lg font-bold">
                                                    {initial}
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-gray-900">{displayName}</h4>
                                                    <p className="text-sm text-gray-500">{inv.advisorType?.replace(/_/g, " ")} • Pending</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {pendingInvitations.received?.length === 0 && pendingInvitations.sent?.length === 0 && (
                        <div className="text-center py-12 bg-white rounded-xl border">
                            <div className="text-6xl mb-4">📬</div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No pending invitations</h3>
                            <p className="text-gray-600">All caught up!</p>
                        </div>
                    )}
                </div>
            )}

            {/* Invite Modal */}
            <InviteAdvisorModal
                isOpen={showInviteModal}
                onClose={() => setShowInviteModal(false)}
                onInviteSent={() => {
                    setShowInviteModal(false);
                    fetchData();
                }}
            />

            {/* Messaging Modal */}
            {showMessaging && selectedRelationship && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                        <AdvisorMessaging
                            relationship={selectedRelationship}
                            isAdvisor={isViewingAsAdvisor}
                            onClose={() => { setShowMessaging(false); setSelectedRelationship(null); }}
                        />
                    </div>
                </div>
            )}

            {/* Sessions Modal */}
            {showSessions && selectedRelationship && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-auto">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-xl font-semibold">📅 Sessions</h2>
                            <button onClick={() => { setShowSessions(false); setSelectedRelationship(null); }} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
                        </div>
                        <AdvisorSessionManagement relationship={selectedRelationship} isAdvisor={isViewingAsAdvisor} onClose={() => { setShowSessions(false); setSelectedRelationship(null); }} />
                    </div>
                </div>
            )}

            {/* Billing Modal */}
            {showBilling && selectedRelationship && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-auto">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-xl font-semibold">💳 Billing & Payments</h2>
                            <button onClick={() => { setShowBilling(false); setSelectedRelationship(null); }} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
                        </div>
                        <AdvisorBillingPanel relationship={selectedRelationship} isAdvisor={isViewingAsAdvisor} onClose={() => { setShowBilling(false); setSelectedRelationship(null); }} />
                    </div>
                </div>
            )}

            {/* Impact Tracker Modal */}
            {showImpact && selectedRelationship && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-auto">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-xl font-semibold">📈 Impact Metrics</h2>
                            <button onClick={() => { setShowImpact(false); setSelectedRelationship(null); }} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
                        </div>
                        <AdvisorImpactTracker relationship={selectedRelationship} isAdvisor={isViewingAsAdvisor} onClose={() => { setShowImpact(false); setSelectedRelationship(null); }} />
                    </div>
                </div>
            )}

            {/* Evaluation Modal */}
            {showEvaluation && selectedRelationship && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-auto">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-xl font-semibold">⭐ Rate Advisor</h2>
                            <button onClick={() => { setShowEvaluation(false); setSelectedRelationship(null); }} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
                        </div>
                        <AdvisorEvaluationForm
                            relationship={selectedRelationship}
                            isAdvisor={isViewingAsAdvisor}
                            onClose={() => { setShowEvaluation(false); setSelectedRelationship(null); }}
                            onSubmitted={() => { setShowEvaluation(false); setSelectedRelationship(null); fetchData(); }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
