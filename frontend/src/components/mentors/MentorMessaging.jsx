import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";

export default function MentorMessaging() {
    const [mentors, setMentors] = useState([]);
    const [selectedMentor, setSelectedMentor] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [unreadCounts, setUnreadCounts] = useState({});
    const messagesEndRef = useRef(null);

    useEffect(() => {
        fetchMentors();
    }, []);

    useEffect(() => {
        if (selectedMentor) {
            fetchMessages(selectedMentor._id);
            // Poll for new messages every 3 seconds
            const interval = setInterval(() => {
                fetchMessages(selectedMentor._id);
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [selectedMentor]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchMentors = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            const response = await fetch("/api/mentors/my-mentors", { headers });
            const data = response.ok ? await response.json() : { data: [] };
            const mentorsArray = Array.isArray(data.data) ? data.data : [];
            setMentors(mentorsArray);
            if (mentorsArray?.length > 0 && !selectedMentor) {
                setSelectedMentor(mentorsArray[0]);
            }
        } catch (err) {
            console.error("Error fetching mentors:", err);
            setError("Failed to load mentors: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (relationshipId) => {
        try {
            const token = localStorage.getItem("token");
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            const response = await fetch(
                `/api/mentors/messages/${relationshipId}`,
                { headers }
            );
            if (response.ok) {
                const data = await response.json();
                setMessages(Array.isArray(data.data) ? data.data : []);
            }
        } catch (err) {
            console.error("Error fetching messages:", err);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedMentor) return;

        try {
            const token = localStorage.getItem("token");
            const headers = {
                "Content-Type": "application/json",
            };
            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }

            const response = await fetch("/api/mentors/messages", {
                method: "POST",
                headers,
                body: JSON.stringify({
                    relationshipId: selectedMentor._id,
                    recipientId: selectedMentor.mentorId?._id,
                    content: newMessage,
                    type: "text",
                }),
            });

            if (response.ok) {
                setNewMessage("");
                await fetchMessages(selectedMentor._id);
            }
        } catch (err) {
            setError("Failed to send message: " + err.message);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading messages...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-lg h-[600px] flex overflow-hidden">
            {/* Mentors List */}
            <div className="w-64 border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="font-semibold text-gray-800">Messages</h2>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {mentors.length === 0 ? (
                        <div className="p-4 text-center text-gray-600">
                            <p className="text-sm">No mentors yet</p>
                        </div>
                    ) : (
                        mentors.map((mentor) => (
                            <button
                                key={mentor._id}
                                onClick={() => setSelectedMentor(mentor)}
                                className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition ${selectedMentor?._id === mentor._id ? "bg-blue-50" : ""
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    {mentor.mentorId?.profilePicture ? (
                                        <img
                                            src={mentor.mentorId.profilePicture}
                                            alt={mentor.mentorId.firstName}
                                            className="w-10 h-10 rounded-full"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                            <span className="text-blue-600 font-bold">
                                                {mentor.mentorId?.firstName?.charAt(0) || "M"}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-800 truncate">
                                            {mentor.mentorId?.firstName} {mentor.mentorId?.lastName}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                            {mentor.relationshipType?.replace(/_/g, " ")}
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
                {selectedMentor ? (
                    <>
                        {/* Header */}
                        <div className="p-4 border-b border-gray-200 flex items-center gap-3">
                            {selectedMentor.mentorId?.profilePicture ? (
                                <img
                                    src={selectedMentor.mentorId.profilePicture}
                                    alt={selectedMentor.mentorId.firstName}
                                    className="w-10 h-10 rounded-full"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                    <span className="text-blue-600 font-bold">
                                        {selectedMentor.mentorId?.firstName?.charAt(0) || "M"}
                                    </span>
                                </div>
                            )}
                            <div>
                                <p className="font-semibold text-gray-800">
                                    {selectedMentor.mentorId?.firstName}{" "}
                                    {selectedMentor.mentorId?.lastName}
                                </p>
                                <p className="text-xs text-gray-600">
                                    {selectedMentor.relationshipType?.replace(/_/g, " ")}
                                </p>
                            </div>
                        </div>

                        {error && (
                            <div className="px-4 pt-4">
                                <div className="p-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
                                    {error}
                                </div>
                            </div>
                        )}

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-gray-600">
                                    <p className="text-center">
                                        No messages yet. Start the conversation!
                                    </p>
                                </div>
                            ) : (
                                messages.map((msg) => (
                                    <div
                                        key={msg._id}
                                        className={`flex ${msg.senderId._id === msg.senderId._id
                                                ? "justify-end"
                                                : "justify-start"
                                            }`}
                                    >
                                        <div
                                            className={`max-w-xs px-4 py-2 rounded-lg ${msg.senderId._id === msg.senderId._id
                                                    ? "bg-blue-600 text-white"
                                                    : "bg-gray-100 text-gray-800"
                                                }`}
                                        >
                                            <p className="text-sm">{msg.content}</p>
                                            <p
                                                className={`text-xs mt-1 ${msg.senderId._id === msg.senderId._id
                                                        ? "text-blue-100"
                                                        : "text-gray-600"
                                                    }`}
                                            >
                                                {new Date(msg.createdAt).toLocaleTimeString([], {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <form
                            onSubmit={handleSendMessage}
                            className="p-4 border-t border-gray-200 bg-gray-50"
                        >
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                                >
                                    Send
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-600">
                        <p>Select a mentor to start messaging</p>
                    </div>
                )}
            </div>
        </div>
    );
}
