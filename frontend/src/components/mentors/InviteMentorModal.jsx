import React, { useState } from "react";
import PropTypes from "prop-types";

const FOCUS_AREAS = [
    { id: "job_search_strategy", label: "Job Search Strategy" },
    { id: "resume_review", label: "Resume Review" },
    { id: "interview_prep", label: "Interview Prep" },
    { id: "salary_negotiation", label: "Salary Negotiation" },
    { id: "career_direction", label: "Career Direction" },
    { id: "skill_development", label: "Skill Development" },
    { id: "networking", label: "Networking" },
    { id: "general_support", label: "General Support" },
];

const SHARED_DATA_OPTIONS = [
    { key: "shareResume", label: "Resume" },
    { key: "shareCoverLetters", label: "Cover Letters" },
    { key: "shareApplications", label: "Applications" },
    { key: "shareInterviewPrep", label: "Interview Prep" },
    { key: "shareGoals", label: "Goals" },
    { key: "shareSkillGaps", label: "Skill Gaps" },
    { key: "shareProgress", label: "Progress" },
];

export default function InviteMentorModal({ isOpen, onClose, onInviteSent }) {
    const [formData, setFormData] = useState({
        mentorEmail: "",
        relationshipType: "mentor",
        invitationMessage: "",
        focusAreas: [],
        sharedData: {
            shareResume: true,
            shareCoverLetters: true,
            shareApplications: true,
            shareInterviewPrep: true,
            shareGoals: true,
            shareSkillGaps: true,
            shareProgress: true,
        },
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleEmailChange = (e) => {
        setFormData({ ...formData, mentorEmail: e.target.value });
        setError("");
    };

    const handleRelationshipTypeChange = (e) => {
        setFormData({ ...formData, relationshipType: e.target.value });
    };

    const handleMessageChange = (e) => {
        setFormData({ ...formData, invitationMessage: e.target.value });
    };

    const toggleFocusArea = (areaId) => {
        setFormData((prev) => ({
            ...prev,
            focusAreas: prev.focusAreas.includes(areaId)
                ? prev.focusAreas.filter((id) => id !== areaId)
                : [...prev.focusAreas, areaId],
        }));
    };

    const toggleSharedData = (key) => {
        setFormData((prev) => ({
            ...prev,
            sharedData: {
                ...prev.sharedData,
                [key]: !prev.sharedData[key],
            },
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!formData.mentorEmail) {
            setError("Please enter a mentor email address");
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.mentorEmail)) {
            setError("Please enter a valid email address");
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const headers = {
                "Content-Type": "application/json",
            };
            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }

            const response = await fetch("/api/mentors/invite", {
                method: "POST",
                headers,
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Failed to send invitation");
            }

            setSuccess("Mentor invitation sent successfully!");
            setFormData({
                mentorEmail: "",
                relationshipType: "mentor",
                invitationMessage: "",
                focusAreas: [],
                sharedData: {
                    shareResume: true,
                    shareCoverLetters: true,
                    shareApplications: true,
                    shareInterviewPrep: true,
                    shareGoals: true,
                    shareSkillGaps: true,
                    shareProgress: true,
                },
            });

            if (onInviteSent) {
                onInviteSent();
            }

            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const handleBackdropClick = (e) => {
        // Only close if clicking directly on the backdrop, not the modal content
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{ backgroundColor: 'rgba(0,0,0,0.48)' }}
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900">Invite a Mentor</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                        aria-label="Close modal"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6">
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
                            {success}
                        </div>
                    )}

                    {/* Email Input */}
                    <div className="mb-6">
                        <label className="block text-gray-700 font-medium mb-2">
                            Mentor Email *
                        </label>
                        <input
                            type="text"
                            value={formData.mentorEmail}
                            onChange={handleEmailChange}
                            placeholder="mentor@example.com"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            required
                        />
                    </div>

                    {/* Relationship Type */}
                    <div className="mb-6">
                        <label className="block text-gray-700 font-medium mb-2">
                            Relationship Type
                        </label>
                        <select
                            value={formData.relationshipType}
                            onChange={handleRelationshipTypeChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="mentor">Mentor</option>
                            <option value="career_coach">Career Coach</option>
                            <option value="peer_mentor">Peer Mentor</option>
                        </select>
                    </div>

                    {/* Invitation Message */}
                    <div className="mb-6">
                        <label className="block text-gray-700 font-medium mb-2">
                            Personal Message (Optional)
                        </label>
                        <textarea
                            value={formData.invitationMessage}
                            onChange={handleMessageChange}
                            placeholder="Tell them why you'd like their guidance..."
                            maxLength={500}
                            rows="3"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                            {formData.invitationMessage.length}/500
                        </p>
                    </div>

                    {/* Focus Areas */}
                    <div className="mb-6">
                        <label className="block text-gray-700 font-medium mb-3">
                            Focus Areas (What you need help with)
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {FOCUS_AREAS.map((area) => (
                                <label
                                    key={area.id}
                                    className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        checked={formData.focusAreas.includes(area.id)}
                                        onChange={() => toggleFocusArea(area.id)}
                                        className="w-4 h-4 rounded"
                                        style={{ accentColor: '#777C6D' }}
                                    />
                                    <span className="ml-2 text-gray-700">{area.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Shared Data */}
                    <div className="mb-6">
                        <label className="block text-gray-700 font-medium mb-3">
                            What Data Would You Like to Share?
                        </label>
                        <div className="space-y-2">
                            {SHARED_DATA_OPTIONS.map((option) => (
                                <label
                                    key={option.key}
                                    className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        checked={formData.sharedData[option.key]}
                                        onChange={() => toggleSharedData(option.key)}
                                        className="w-4 h-4 rounded"
                                        style={{ accentColor: '#777C6D' }}
                                    />
                                    <span className="ml-2 text-gray-700">{option.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 mt-8">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 text-white rounded-lg transition font-medium disabled:opacity-50"
                            style={{ backgroundColor: '#777C6D' }}
                            onMouseOver={e => !loading && (e.currentTarget.style.backgroundColor = '#656A5C')}
                            onMouseOut={e => !loading && (e.currentTarget.style.backgroundColor = '#777C6D')}
                        >
                            {loading ? "Sending..." : "Send Invitation"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

InviteMentorModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onInviteSent: PropTypes.func,
};
