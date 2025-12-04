import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";

export default function MessagingModal({ relationshipId, recipientName, recipientId, onClose }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");
    const messagesEndRef = useRef(null);

    useEffect(() => {
        fetchMessages();
    }, [relationshipId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchMessages = async () => {
        setLoading(true);
        setError("");
        try {
            const token = localStorage.getItem("token");
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            const response = await fetch(`/api/mentors/messages/${relationshipId}`, { headers });
            if (response.ok) {
                const data = await response.json();
                setMessages(data.data || []);
            } else {
                setError("Failed to load messages");
            }
        } catch (err) {
            console.error("Error fetching messages:", err);
            setError("Failed to load messages");
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        setSending(true);
        setError("");
        try {
            const token = localStorage.getItem("token");
            const headers = {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            };

            const response = await fetch("/api/mentors/messages", {
                method: "POST",
                headers,
                body: JSON.stringify({
                    relationshipId,
                    recipientId,
                    content: newMessage,
                    type: "text",
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setMessages([...messages, data.data]);
                setNewMessage("");
            } else {
                const errorData = await response.json();
                setError(errorData.message || "Failed to send message");
            }
        } catch (err) {
            console.error("Error sending message:", err);
            setError("Failed to send message");
        } finally {
            setSending(false);
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        } else if (diffInHours < 48) {
            return "Yesterday " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        } else {
            return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        }
    };

    return (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl h-[600px] flex flex-col shadow-xl">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-xl font-bold" style={{ color: "#4F5348" }}>
                        {recipientName && recipientName !== "undefined undefined" ? `Conversation with ${recipientName}` : "Messages"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                    >
                        ×
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <div
                                    className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 mx-auto mb-2"
                                    style={{ borderTopColor: "#777C6D", borderBottomColor: "#777C6D" }}
                                ></div>
                                <p className="text-gray-600">Loading messages...</p>
                            </div>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-gray-500">No messages yet. Start the conversation!</p>
                        </div>
                    ) : (
                        messages.map((message, index) => {
                            const isCurrentUser = message.senderId?._id !== recipientId;
                            return (
                                <div
                                    key={message._id || index}
                                    className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`max-w-[70%] rounded-lg p-3 ${isCurrentUser
                                                ? "bg-[#777C6D] text-white"
                                                : "bg-gray-100 text-gray-800"
                                            }`}
                                    >
                                        <p className="text-sm break-words">{message.content}</p>
                                        <p
                                            className={`text-xs mt-1 ${isCurrentUser ? "text-gray-200" : "text-gray-500"
                                                }`}
                                        >
                                            {formatTime(message.createdAt)}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Error Message */}
                {error && (
                    <div className="px-4 py-2 bg-red-50 border-t border-red-200">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                {/* Input Area */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type your message..."
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#777C6D] focus:border-transparent"
                            disabled={sending}
                        />
                        <button
                            type="submit"
                            disabled={sending || !newMessage.trim()}
                            className="px-6 py-2 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ backgroundColor: "#777C6D" }}
                            onMouseOver={(e) => !sending && (e.currentTarget.style.backgroundColor = "#656A5C")}
                            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#777C6D")}
                        >
                            {sending ? "Sending..." : "Send"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

MessagingModal.propTypes = {
    relationshipId: PropTypes.string.isRequired,
    recipientName: PropTypes.string.isRequired,
    recipientId: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
};
