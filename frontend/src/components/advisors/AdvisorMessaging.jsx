import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";

export default function AdvisorMessaging({ relationship, isAdvisor, onClose }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        fetchMessages();
        // Poll for new messages every 10 seconds
        const interval = setInterval(fetchMessages, 10000);
        return () => clearInterval(interval);
    }, [relationship]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchMessages = async () => {
        try {
            const token = localStorage.getItem("token");
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            const response = await fetch(
                `/api/external-advisors/messages/${relationship._id}`,
                { headers }
            );

            if (response.ok) {
                const text = await response.text();
                try {
                    const data = JSON.parse(text);
                    setMessages(data.data || data.messages || []);
                } catch (parseErr) {
                    console.error("Failed to parse response:", text.substring(0, 200));
                }
            } else {
                console.error("Messages fetch failed with status:", response.status);
            }
        } catch (err) {
            console.error("Failed to fetch messages:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

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
                    relationshipId: relationship._id,
                    content: newMessage.trim(),
                }),
            });

            if (response.ok) {
                setNewMessage("");
                fetchMessages();
            } else {
                const data = await response.json();
                // Provide helpful message for self-invitation test scenario
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

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return date.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
            });
        } else if (diffDays === 1) {
            return "Yesterday";
        } else if (diffDays < 7) {
            return date.toLocaleDateString("en-US", { weekday: "short" });
        } else {
            return date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
            });
        }
    };

    // Determine names using the same fallback logic as other components
    const advisorDisplayName = relationship.advisorName
        || (relationship.advisorId?.firstName && relationship.advisorId?.lastName
            ? `${relationship.advisorId.firstName} ${relationship.advisorId.lastName}`
            : null)
        || relationship.advisorEmail
        || "Advisor";

    const clientDisplayName = relationship.senderName
        || (relationship.userId?.firstName && relationship.userId?.lastName
            ? `${relationship.userId.firstName} ${relationship.userId.lastName}`
            : null)
        || relationship.senderEmail
        || "Client";

    const otherPartyName = isAdvisor ? clientDisplayName : advisorDisplayName;

    // We don't need currentUserId for display - the backend determines message ownership
    // based on the authenticated user

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[500px] bg-white rounded-xl shadow-sm border">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50 rounded-t-xl">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-indigo-600 font-semibold">
                            {otherPartyName.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">{otherPartyName}</h3>
                        <p className="text-xs text-gray-500">
                            {isAdvisor ? "Client" : relationship.advisorType?.replace(/_/g, " ")}
                        </p>
                    </div>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-1"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <span className="text-4xl mb-2">💬</span>
                        <p>No messages yet</p>
                        <p className="text-sm">Start the conversation!</p>
                    </div>
                ) : (
                    messages.map((message) => {
                        // Determine if this is our message
                        const clientId = String(relationship.userId?._id || relationship.userId);
                        const advisorId = String(relationship.advisorId?._id || relationship.advisorId);
                        const messageSenderId = String(message.senderId?._id || message.senderId);

                        // Check if this is a self-messaging scenario (same user as client and advisor)
                        const isSelfRelationship = clientId === advisorId;

                        let isOwnMessage;
                        if (isSelfRelationship) {
                            // For self-messaging: Echo messages appear as received, others as sent
                            isOwnMessage = !message.content?.startsWith("Echo:");
                        } else {
                            // Normal case: check based on role
                            isOwnMessage = isAdvisor
                                ? messageSenderId === advisorId
                                : messageSenderId === clientId;
                        }

                        return (
                            <div
                                key={message._id}
                                className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-[75%] rounded-2xl px-4 py-2 ${isOwnMessage
                                            ? "bg-indigo-600 text-white rounded-br-md"
                                            : "bg-gray-100 text-gray-900 rounded-bl-md"
                                        }`}
                                >
                                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                    <p
                                        className={`text-xs mt-1 ${isOwnMessage ? "text-indigo-200" : "text-gray-500"
                                            }`}
                                    >
                                        {formatTime(message.createdAt)}
                                        {isOwnMessage && message.read && (
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

            {/* Error */}
            {error && (
                <div className="px-4 py-2 bg-red-50 border-t border-red-200">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 border-t bg-gray-50 rounded-b-xl">
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        disabled={sending}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={sending || !newMessage.trim()}
                        className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {sending ? (
                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                />
                            </svg>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

AdvisorMessaging.propTypes = {
    relationship: PropTypes.object.isRequired,
    isAdvisor: PropTypes.bool,
    onClose: PropTypes.func,
};

AdvisorMessaging.defaultProps = {
    isAdvisor: false,
    onClose: null,
};
