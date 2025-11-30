import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";

const SESSION_TYPES = [
    { id: "initial_consultation", label: "Initial Consultation", description: "First meeting to discuss goals" },
    { id: "follow_up", label: "Follow-up Session", description: "Regular check-in session" },
    { id: "resume_review", label: "Resume Review", description: "Deep dive into resume optimization" },
    { id: "mock_interview", label: "Mock Interview", description: "Practice interview session" },
    { id: "strategy_session", label: "Strategy Session", description: "Career strategy planning" },
    { id: "goal_setting", label: "Goal Setting", description: "Define and refine career goals" },
    { id: "progress_review", label: "Progress Review", description: "Review achievements and adjust plans" },
    { id: "salary_negotiation", label: "Salary Negotiation", description: "Prepare for salary discussions" },
    { id: "final_review", label: "Final Review", description: "Wrap-up and future planning" },
    { id: "other", label: "Other", description: "Custom session type" },
];

const MEETING_TYPES = [
    { id: "video", label: "Video Call", icon: "📹" },
    { id: "phone", label: "Phone Call", icon: "📞" },
    { id: "in_person", label: "In Person", icon: "🏢" },
    { id: "chat", label: "Chat", icon: "💬" },
];

const DURATION_OPTIONS = [
    { value: 30, label: "30 minutes" },
    { value: 45, label: "45 minutes" },
    { value: 60, label: "1 hour" },
    { value: 90, label: "1.5 hours" },
    { value: 120, label: "2 hours" },
];

export default function AdvisorSessionManagement({ relationship, onClose, onSessionCreated }) {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showNewSession, setShowNewSession] = useState(false);
    const [selectedSession, setSelectedSession] = useState(null);

    const [newSession, setNewSession] = useState({
        title: "",
        description: "",
        sessionType: "follow_up",
        scheduledAt: "",
        duration: 60,
        meetingType: "video",
        meetingLink: "",
        meetingLocation: "",
        agendaItems: [{ item: "", completed: false }],
    });

    useEffect(() => {
        fetchSessions();
    }, [relationship._id]);

    const fetchSessions = async () => {
        try {
            const token = localStorage.getItem("token");
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            const response = await fetch(
                `/api/external-advisors/sessions?relationshipId=${relationship._id}`,
                { headers }
            );

            if (response.ok) {
                const data = await response.json();
                setSessions(data.data || []);
            }
        } catch (err) {
            console.error("Error fetching sessions:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSession = async () => {
        if (!newSession.title || !newSession.scheduledAt) {
            setError("Please fill in the session title and date/time");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const headers = {
                "Content-Type": "application/json",
                ...(token && { Authorization: `Bearer ${token}` }),
            };

            const response = await fetch("/api/external-advisors/sessions", {
                method: "POST",
                headers,
                body: JSON.stringify({
                    relationshipId: relationship._id,
                    ...newSession,
                    agendaItems: newSession.agendaItems.filter(a => a.item.trim()),
                }),
            });

            if (response.ok) {
                setShowNewSession(false);
                setNewSession({
                    title: "",
                    description: "",
                    sessionType: "follow_up",
                    scheduledAt: "",
                    duration: 60,
                    meetingType: "video",
                    meetingLink: "",
                    meetingLocation: "",
                    agendaItems: [{ item: "", completed: false }],
                });
                fetchSessions();
                if (onSessionCreated) onSessionCreated();
            } else {
                const data = await response.json();
                setError(data.message || "Failed to create session");
            }
        } catch (err) {
            setError("Failed to create session: " + err.message);
        }
    };

    const handleUpdateSession = async (sessionId, updates) => {
        try {
            const token = localStorage.getItem("token");
            const headers = {
                "Content-Type": "application/json",
                ...(token && { Authorization: `Bearer ${token}` }),
            };

            const response = await fetch(`/api/external-advisors/sessions/${sessionId}`, {
                method: "PUT",
                headers,
                body: JSON.stringify(updates),
            });

            if (response.ok) {
                fetchSessions();
                setSelectedSession(null);
            } else {
                const data = await response.json();
                setError(data.message || "Failed to update session");
            }
        } catch (err) {
            setError("Failed to update session: " + err.message);
        }
    };

    const addAgendaItem = () => {
        setNewSession(prev => ({
            ...prev,
            agendaItems: [...prev.agendaItems, { item: "", completed: false }],
        }));
    };

    const updateAgendaItem = (index, value) => {
        setNewSession(prev => ({
            ...prev,
            agendaItems: prev.agendaItems.map((item, i) =>
                i === index ? { ...item, item: value } : item
            ),
        }));
    };

    const removeAgendaItem = (index) => {
        setNewSession(prev => ({
            ...prev,
            agendaItems: prev.agendaItems.filter((_, i) => i !== index),
        }));
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "confirmed": return "bg-green-100 text-green-700";
            case "completed": return "bg-blue-100 text-blue-700";
            case "cancelled": return "bg-red-100 text-red-700";
            case "no_show": return "bg-gray-100 text-gray-700";
            case "rescheduled": return "bg-yellow-100 text-yellow-700";
            default: return "bg-yellow-100 text-yellow-700";
        }
    };

    const upcomingSessions = sessions.filter(
        s => new Date(s.scheduledAt) >= new Date() && !["cancelled", "completed"].includes(s.status)
    );
    const pastSessions = sessions.filter(
        s => new Date(s.scheduledAt) < new Date() || ["cancelled", "completed"].includes(s.status)
    );

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: "rgba(0,0,0,0.48)" }}>
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Session Management</h2>
                        <p className="text-sm text-gray-500">
                            with {relationship.advisorId?.firstName || relationship.userId?.firstName || "Advisor"}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                            {error}
                            <button onClick={() => setError("")} className="ml-2 font-bold">×</button>
                        </div>
                    )}

                    {/* Schedule New Session Button */}
                    {!showNewSession && (
                        <button
                            onClick={() => setShowNewSession(true)}
                            className="w-full mb-6 p-4 border-2 border-dashed border-indigo-300 rounded-xl text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center justify-center space-x-2"
                        >
                            <span className="text-xl">+</span>
                            <span>Schedule New Session</span>
                        </button>
                    )}

                    {/* New Session Form */}
                    {showNewSession && (
                        <div className="mb-6 p-6 bg-indigo-50 rounded-xl space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-gray-900">Schedule New Session</h3>
                                <button
                                    onClick={() => setShowNewSession(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Session Title *
                                    </label>
                                    <input
                                        type="text"
                                        value={newSession.title}
                                        onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
                                        placeholder="e.g., Resume Review Session"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Session Type
                                    </label>
                                    <select
                                        value={newSession.sessionType}
                                        onChange={(e) => setNewSession({ ...newSession, sessionType: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    >
                                        {SESSION_TYPES.map((type) => (
                                            <option key={type.id} value={type.id}>{type.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Date & Time *
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={newSession.scheduledAt}
                                        onChange={(e) => setNewSession({ ...newSession, scheduledAt: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Duration
                                    </label>
                                    <select
                                        value={newSession.duration}
                                        onChange={(e) => setNewSession({ ...newSession, duration: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    >
                                        {DURATION_OPTIONS.map((opt) => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Meeting Type
                                </label>
                                <div className="flex flex-wrap gap-3">
                                    {MEETING_TYPES.map((type) => (
                                        <button
                                            key={type.id}
                                            type="button"
                                            onClick={() => setNewSession({ ...newSession, meetingType: type.id })}
                                            className={`px-4 py-2 rounded-lg border-2 transition-colors ${newSession.meetingType === type.id
                                                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                                    : "border-gray-200 hover:border-gray-300"
                                                }`}
                                        >
                                            {type.icon} {type.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {newSession.meetingType === "video" && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Meeting Link (Zoom, Google Meet, etc.)
                                    </label>
                                    <input
                                        type="url"
                                        value={newSession.meetingLink}
                                        onChange={(e) => setNewSession({ ...newSession, meetingLink: e.target.value })}
                                        placeholder="https://zoom.us/j/..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            )}

                            {newSession.meetingType === "in_person" && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Location
                                    </label>
                                    <input
                                        type="text"
                                        value={newSession.meetingLocation}
                                        onChange={(e) => setNewSession({ ...newSession, meetingLocation: e.target.value })}
                                        placeholder="e.g., Coffee Shop at 123 Main St"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={newSession.description}
                                    onChange={(e) => setNewSession({ ...newSession, description: e.target.value })}
                                    placeholder="What would you like to discuss in this session?"
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Agenda Items
                                </label>
                                {newSession.agendaItems.map((item, index) => (
                                    <div key={index} className="flex items-center space-x-2 mb-2">
                                        <input
                                            type="text"
                                            value={item.item}
                                            onChange={(e) => updateAgendaItem(index, e.target.value)}
                                            placeholder={`Agenda item ${index + 1}`}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        />
                                        {newSession.agendaItems.length > 1 && (
                                            <button
                                                onClick={() => removeAgendaItem(index)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button
                                    onClick={addAgendaItem}
                                    className="text-sm text-indigo-600 hover:text-indigo-700"
                                >
                                    + Add agenda item
                                </button>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    onClick={() => setShowNewSession(false)}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateSession}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                >
                                    Schedule Session
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Upcoming Sessions */}
                    {upcomingSessions.length > 0 && (
                        <div className="mb-8">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Sessions</h3>
                            <div className="space-y-4">
                                {upcomingSessions.map((session) => (
                                    <div
                                        key={session._id}
                                        className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3">
                                                    <h4 className="font-semibold text-gray-900">{session.title}</h4>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                                                        {session.status}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {SESSION_TYPES.find(t => t.id === session.sessionType)?.label}
                                                </p>
                                                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                                                    <span>📅 {new Date(session.scheduledAt).toLocaleDateString()}</span>
                                                    <span>🕐 {new Date(session.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                                                    <span>⏱ {session.duration} min</span>
                                                    <span>{MEETING_TYPES.find(m => m.id === session.meetingType)?.icon} {MEETING_TYPES.find(m => m.id === session.meetingType)?.label}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                {session.meetingLink && (
                                                    <a
                                                        href={session.meetingLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
                                                    >
                                                        Join
                                                    </a>
                                                )}
                                                <button
                                                    onClick={() => handleUpdateSession(session._id, { status: "cancelled" })}
                                                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>

                                        {session.agendaItems?.length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-gray-100">
                                                <p className="text-sm font-medium text-gray-700 mb-2">Agenda:</p>
                                                <ul className="text-sm text-gray-600 space-y-1">
                                                    {session.agendaItems.map((item, idx) => (
                                                        <li key={idx} className="flex items-center space-x-2">
                                                            <span className={item.completed ? "line-through text-gray-400" : ""}>
                                                                • {item.item}
                                                            </span>
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

                    {/* Past Sessions */}
                    {pastSessions.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Past Sessions</h3>
                            <div className="space-y-3">
                                {pastSessions.map((session) => (
                                    <div
                                        key={session._id}
                                        className="bg-gray-50 rounded-lg border border-gray-200 p-4"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="flex items-center space-x-3">
                                                    <h4 className="font-medium text-gray-900">{session.title}</h4>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                                                        {session.status}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {new Date(session.scheduledAt).toLocaleDateString()} • {session.duration} min
                                                </p>
                                            </div>
                                            {session.sessionNotes && (
                                                <button
                                                    onClick={() => setSelectedSession(session)}
                                                    className="text-sm text-indigo-600 hover:text-indigo-700"
                                                >
                                                    View Notes
                                                </button>
                                            )}
                                        </div>

                                        {session.keyTakeaways?.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-gray-200">
                                                <p className="text-sm font-medium text-gray-700">Key Takeaways:</p>
                                                <ul className="text-sm text-gray-600 mt-1">
                                                    {session.keyTakeaways.map((takeaway, idx) => (
                                                        <li key={idx}>✓ {takeaway}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {loading && (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                    )}

                    {!loading && sessions.length === 0 && !showNewSession && (
                        <div className="text-center py-12 text-gray-500">
                            <div className="text-4xl mb-3">📅</div>
                            <p>No sessions scheduled yet.</p>
                            <p className="text-sm mt-1">Schedule your first session with your advisor!</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Session Notes Modal */}
            {selectedSession && (
                <div className="fixed inset-0 flex items-center justify-center z-60" style={{ backgroundColor: "rgba(0,0,0,0.48)" }}>
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">{selectedSession.title} - Notes</h3>
                            <button onClick={() => setSelectedSession(null)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>

                        {selectedSession.sessionNotes && (
                            <div className="mb-4">
                                <h4 className="font-medium text-gray-700 mb-2">Session Notes</h4>
                                <p className="text-gray-600 whitespace-pre-wrap">{selectedSession.sessionNotes}</p>
                            </div>
                        )}

                        {selectedSession.keyTakeaways?.length > 0 && (
                            <div className="mb-4">
                                <h4 className="font-medium text-gray-700 mb-2">Key Takeaways</h4>
                                <ul className="space-y-1">
                                    {selectedSession.keyTakeaways.map((takeaway, idx) => (
                                        <li key={idx} className="text-gray-600">✓ {takeaway}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {selectedSession.actionItems?.length > 0 && (
                            <div>
                                <h4 className="font-medium text-gray-700 mb-2">Action Items</h4>
                                <ul className="space-y-2">
                                    {selectedSession.actionItems.map((item, idx) => (
                                        <li key={idx} className={`text-gray-600 ${item.completed ? "line-through text-gray-400" : ""}`}>
                                            {item.completed ? "☑" : "☐"} {item.item}
                                            {item.dueDate && (
                                                <span className="text-sm text-gray-400 ml-2">
                                                    Due: {new Date(item.dueDate).toLocaleDateString()}
                                                </span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

AdvisorSessionManagement.propTypes = {
    relationship: PropTypes.object.isRequired,
    onClose: PropTypes.func.isRequired,
    onSessionCreated: PropTypes.func,
};
