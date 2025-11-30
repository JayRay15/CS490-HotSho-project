import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

export default function AdvisorMessagingPage() {
    const [relationships, setRelationships] = useState([]);
    const [selectedRelationship, setSelectedRelationship] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");
    const [currentUserId, setCurrentUserId] = useState(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        fetchRelationships();
        fetchCurrentUser();
    }, []);

    useEffect(() => {
        if (selectedRelationship) {
            fetchMessages(selectedRelationship._id);
            // Poll for new messages every 3 seconds
            const interval = setInterval(() => {
                fetchMessages(selectedRelationship._id);
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [selectedRelationship]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchCurrentUser = async () => {
        try {
            const token = localStorage.getItem("token");
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            // Use the correct endpoint
            const response = await fetch("/api/users/me", { headers });
            if (response.ok) {
                const data = await response.json();
                setCurrentUserId(data.user?._id || data._id);
            }
        } catch (err) {
            console.error("Error fetching user:", err);
        }
    };

    const fetchRelationships = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            // Fetch both advisors and clients
            const [advisorsRes, clientsRes] = await Promise.all([
                fetch("/api/external-advisors/my-advisors", { headers }),
                fetch("/api/external-advisors/my-clients", { headers })
            ]);

            const advisorsData = advisorsRes.ok ? await advisorsRes.json() : { data: [] };
            const clientsData = clientsRes.ok ? await clientsRes.json() : { data: [] };

            // Mark each relationship with role for display
            const advisors = (advisorsData.data || []).map(r => ({ ...r, role: "advisor" }));
            const clients = (clientsData.data || []).map(r => ({ ...r, role: "client" }));

            // Deduplicate: if same relationship appears in both (self-invitation), keep only one
            const seen = new Set();
            const allRelationships = [];
            for (const rel of [...advisors, ...clients]) {
                if (!seen.has(rel._id)) {
                    seen.add(rel._id);
                    allRelationships.push(rel);
                }
            }

            setRelationships(allRelationships);

            if (allRelationships.length > 0 && !selectedRelationship) {
                setSelectedRelationship(allRelationships[0]);
            }
        } catch (err) {
            console.error("Error fetching relationships:", err);
            setError("Failed to load conversations: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (relationshipId) => {
        try {
            const token = localStorage.getItem("token");
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            const response = await fetch(
                `/api/external-advisors/messages/${relationshipId}`,
                { headers }
            );
            if (response.ok) {
                const data = await response.json();
                setMessages(data.messages || []);
            }
        } catch (err) {
            console.error("Error fetching messages:", err);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedRelationship) return;

        setSending(true);
        setError("");

        try {
            const token = localStorage.getItem("token");
            const headers = {
                "Content-Type": "application/json",
                ...(token && { Authorization: `Bearer ${token}` }),
            };

            const response = await fetch("/api/external-advisors/messages", {
                method: "POST",
                headers,
                body: JSON.stringify({
                    relationshipId: selectedRelationship._id,
                    content: newMessage.trim(),
                }),
            });

            if (response.ok) {
                setNewMessage("");
                await fetchMessages(selectedRelationship._id);
            } else {
                const data = await response.json();
                if (data.message?.includes("yourself")) {
                    setError("This is a self-referencing test relationship. To test messaging, invite a different user as your advisor.");
                } else {
                    setError(data.message || "Failed to send message");
                }
            }
        } catch (err) {
            setError("Failed to send message: " + err.message);
        } finally {
            setSending(false);
        }
    };

    const getDisplayName = (relationship) => {
        if (relationship.role === "advisor") {
            // We are the client, show advisor name
            return relationship.advisorName
                || (relationship.advisorId?.name)
                || (relationship.advisorId?.firstName && relationship.advisorId?.lastName
                    ? `${relationship.advisorId.firstName} ${relationship.advisorId.lastName}`
                    : null)
                || relationship.advisorEmail
                || "Advisor";
        } else {
            // We are the advisor, show client name
            return relationship.senderName
                || (relationship.userId?.name)
                || (relationship.userId?.firstName && relationship.userId?.lastName
                    ? `${relationship.userId.firstName} ${relationship.userId.lastName}`
                    : null)
                || relationship.senderEmail
                || "Client";
        }
    };

    const getInitial = (relationship) => {
        const name = getDisplayName(relationship);
        return name.charAt(0).toUpperCase();
    };

    const getProfilePicture = (relationship) => {
        if (relationship.role === "advisor") {
            return relationship.advisorId?.profilePicture;
        } else {
            return relationship.userId?.profilePicture;
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading messages...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Breadcrumb */}
            <div className="mb-4">
                <Link to="/advisors" className="text-indigo-600 hover:text-indigo-800 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Advisors
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow-lg h-[600px] flex overflow-hidden">
                {/* Conversations List */}
                <div className="w-72 border-r border-gray-200 flex flex-col">
                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                        <h2 className="font-semibold text-gray-800">Messages</h2>
                        <p className="text-xs text-gray-500 mt-1">
                            {relationships.length} conversation{relationships.length !== 1 ? "s" : ""}
                        </p>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {relationships.length === 0 ? (
                            <div className="p-4 text-center text-gray-600">
                                <span className="text-4xl mb-2 block">💬</span>
                                <p className="text-sm">No conversations yet</p>
                                <Link
                                    to="/advisors"
                                    className="text-indigo-600 text-sm hover:underline mt-2 inline-block"
                                >
                                    Invite an advisor
                                </Link>
                            </div>
                        ) : (
                            relationships.map((rel) => (
                                <button
                                    key={rel._id}
                                    onClick={() => setSelectedRelationship(rel)}
                                    className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition ${selectedRelationship?._id === rel._id ? "bg-indigo-50 border-l-4 border-l-indigo-600" : ""
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        {getProfilePicture(rel) ? (
                                            <img
                                                src={getProfilePicture(rel)}
                                                alt={getDisplayName(rel)}
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                                <span className="text-indigo-600 font-bold">
                                                    {getInitial(rel)}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-800 truncate">
                                                {getDisplayName(rel)}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {rel.role === "advisor" ? (
                                                    <span className="text-indigo-600">Your Advisor</span>
                                                ) : (
                                                    <span className="text-green-600">Your Client</span>
                                                )}
                                                {" · "}
                                                {rel.advisorType?.replace(/_/g, " ") || "General"}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 flex flex-col">
                    {selectedRelationship ? (
                        <>
                            {/* Header */}
                            <div className="p-4 border-b border-gray-200 flex items-center gap-3 bg-gray-50">
                                {getProfilePicture(selectedRelationship) ? (
                                    <img
                                        src={getProfilePicture(selectedRelationship)}
                                        alt={getDisplayName(selectedRelationship)}
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                        <span className="text-indigo-600 font-bold">
                                            {getInitial(selectedRelationship)}
                                        </span>
                                    </div>
                                )}
                                <div>
                                    <p className="font-semibold text-gray-800">
                                        {getDisplayName(selectedRelationship)}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {selectedRelationship.role === "advisor" ? "Your Advisor" : "Your Client"}
                                        {" · "}
                                        {selectedRelationship.advisorType?.replace(/_/g, " ") || "General"}
                                    </p>
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="px-4 pt-4">
                                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                                        {error}
                                        <button
                                            onClick={() => setError("")}
                                            className="float-right font-bold"
                                        >
                                            ×
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                                {messages.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-gray-500">
                                        <div className="text-center">
                                            <span className="text-5xl mb-3 block">💬</span>
                                            <p className="font-medium">No messages yet</p>
                                            <p className="text-sm">Start the conversation!</p>
                                        </div>
                                    </div>
                                ) : (
                                    messages.map((msg) => {
                                        const messageSenderId = msg.senderId?._id || msg.senderId;
                                        const isOwnMessage = messageSenderId === currentUserId;

                                        return (
                                            <div
                                                key={msg._id}
                                                className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                                            >
                                                <div
                                                    className={`max-w-[70%] px-4 py-2 rounded-2xl ${isOwnMessage
                                                            ? "bg-indigo-600 text-white rounded-br-md"
                                                            : "bg-white text-gray-800 rounded-bl-md shadow-sm"
                                                        }`}
                                                >
                                                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                                    <p
                                                        className={`text-xs mt-1 ${isOwnMessage ? "text-indigo-200" : "text-gray-400"
                                                            }`}
                                                    >
                                                        {formatTime(msg.createdAt)}
                                                        {isOwnMessage && msg.read && (
                                                            <span className="ml-1">✓✓</span>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Message Input */}
                            <form
                                onSubmit={handleSendMessage}
                                className="p-4 border-t border-gray-200 bg-white"
                            >
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        disabled={sending}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
                                    />
                                    <button
                                        type="submit"
                                        disabled={sending || !newMessage.trim()}
                                        className="px-6 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {sending ? (
                                            <>
                                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                Send
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                                </svg>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-500">
                            <div className="text-center">
                                <span className="text-5xl mb-3 block">👈</span>
                                <p className="font-medium">Select a conversation</p>
                                <p className="text-sm">Choose someone to message</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
