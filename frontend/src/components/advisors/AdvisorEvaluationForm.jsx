import React, { useState } from "react";
import PropTypes from "prop-types";

const RATING_CATEGORIES = [
    { key: "overall", label: "Overall Experience", required: true },
    { key: "communication", label: "Communication" },
    { key: "expertise", label: "Expertise & Knowledge" },
    { key: "responsiveness", label: "Responsiveness" },
    { key: "actionableAdvice", label: "Actionable Advice" },
    { key: "professionalism", label: "Professionalism" },
    { key: "valueForMoney", label: "Value for Money" },
    { key: "goalProgress", label: "Progress Toward Goals" },
];

export default function AdvisorEvaluationForm({ relationship, sessionId = null, onClose, onSubmitted }) {
    const [formData, setFormData] = useState({
        evaluationType: sessionId ? "session_feedback" : "periodic_review",
        ratings: {
            overall: 0,
            communication: 0,
            expertise: 0,
            responsiveness: 0,
            actionableAdvice: 0,
            professionalism: 0,
            valueForMoney: 0,
            goalProgress: 0,
        },
        feedback: {
            strengths: "",
            improvements: "",
            highlights: "",
            additionalComments: "",
        },
        goalsAchieved: [],
        npsScore: null,
        wouldRecommend: null,
        wouldContinue: null,
        isPublic: false,
        isAnonymous: false,
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [step, setStep] = useState(1);

    const handleRatingChange = (category, value) => {
        setFormData((prev) => ({
            ...prev,
            ratings: {
                ...prev.ratings,
                [category]: value,
            },
        }));
    };

    const handleFeedbackChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            feedback: {
                ...prev.feedback,
                [field]: value,
            },
        }));
    };

    const handleSubmit = async () => {
        if (formData.ratings.overall === 0) {
            setError("Please provide an overall rating");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const token = localStorage.getItem("token");
            const headers = {
                "Content-Type": "application/json",
                ...(token && { Authorization: `Bearer ${token}` }),
            };

            // Only include ratings that are greater than 0 (user actually rated them)
            const filteredRatings = Object.fromEntries(
                Object.entries(formData.ratings).filter(([, value]) => value > 0)
            );

            const response = await fetch("/api/external-advisors/evaluations", {
                method: "POST",
                headers,
                body: JSON.stringify({
                    relationshipId: relationship._id,
                    sessionId,
                    ...formData,
                    ratings: filteredRatings,
                }),
            });

            if (response.ok) {
                setSuccess("Evaluation submitted successfully!");
                setTimeout(() => {
                    if (onSubmitted) onSubmitted();
                    onClose();
                }, 1500);
            } else {
                const data = await response.json();
                console.error("Evaluation submission error:", data);
                setError(data.message || data.error || "Failed to submit evaluation");
            }
        } catch (err) {
            console.error("Evaluation fetch error:", err);
            setError("Failed to submit evaluation: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const renderStars = (category, value) => (
        <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => handleRatingChange(category, star)}
                    className={`text-2xl transition-colors ${star <= value ? "text-yellow-400" : "text-gray-300 hover:text-yellow-200"
                        }`}
                >
                    ★
                </button>
            ))}
            <span className="ml-2 text-sm text-gray-500">
                {value > 0 ? `${value}/5` : "Not rated"}
            </span>
        </div>
    );

    const renderNPSScale = () => (
        <div className="space-y-2">
            <p className="text-sm text-gray-600">
                On a scale of 0-10, how likely are you to recommend this advisor to a friend or colleague?
            </p>
            <div className="flex items-center space-x-1">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                    <button
                        key={score}
                        type="button"
                        onClick={() => setFormData({ ...formData, npsScore: score })}
                        className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${formData.npsScore === score
                                ? score <= 6
                                    ? "bg-red-500 text-white"
                                    : score <= 8
                                        ? "bg-yellow-500 text-white"
                                        : "bg-green-500 text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                    >
                        {score}
                    </button>
                ))}
            </div>
            <div className="flex justify-between text-xs text-gray-400 px-1">
                <span>Not at all likely</span>
                <span>Extremely likely</span>
            </div>
        </div>
    );

    // Get advisor name with multiple fallbacks
    const advisorName = relationship.advisorName
        || relationship.advisorId?.name
        || (relationship.advisorId?.firstName && relationship.advisorId?.lastName
            ? `${relationship.advisorId.firstName} ${relationship.advisorId.lastName}`
            : null)
        || relationship.advisorEmail
        || "your advisor";

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: "rgba(0,0,0,0.48)" }}>
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Evaluate Your Advisor</h2>
                        <p className="text-sm text-gray-500">
                            Share your feedback about {advisorName}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
                            ✓ {success}
                        </div>
                    )}

                    {/* Step 1: Ratings */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Rate Your Experience</h3>
                                <div className="space-y-4">
                                    {RATING_CATEGORIES.map((category) => (
                                        <div key={category.key} className="flex items-center justify-between">
                                            <label className="text-gray-700">
                                                {category.label}
                                                {category.required && <span className="text-red-500 ml-1">*</span>}
                                            </label>
                                            {renderStars(category.key, formData.ratings[category.key])}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 border-t">
                                {renderNPSScale()}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Qualitative Feedback */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-gray-900">Share Your Thoughts</h3>

                            <div>
                                <label className="block text-gray-700 font-medium mb-2">
                                    What did {advisorName} do well?
                                </label>
                                <textarea
                                    value={formData.feedback.strengths}
                                    onChange={(e) => handleFeedbackChange("strengths", e.target.value)}
                                    placeholder="Describe the strengths and positive aspects..."
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-700 font-medium mb-2">
                                    What could be improved?
                                </label>
                                <textarea
                                    value={formData.feedback.improvements}
                                    onChange={(e) => handleFeedbackChange("improvements", e.target.value)}
                                    placeholder="Share constructive suggestions for improvement..."
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-700 font-medium mb-2">
                                    Session highlights or memorable moments
                                </label>
                                <textarea
                                    value={formData.feedback.highlights}
                                    onChange={(e) => handleFeedbackChange("highlights", e.target.value)}
                                    placeholder="Any specific advice or moments that stood out..."
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-700 font-medium mb-2">
                                    Additional comments
                                </label>
                                <textarea
                                    value={formData.feedback.additionalComments}
                                    onChange={(e) => handleFeedbackChange("additionalComments", e.target.value)}
                                    placeholder="Anything else you'd like to share..."
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 3: Final Questions */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-gray-900">Final Questions</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-gray-700 font-medium mb-3">
                                        Would you recommend {advisorName} to others?
                                    </label>
                                    <div className="flex space-x-4">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, wouldRecommend: true })}
                                            className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${formData.wouldRecommend === true
                                                    ? "border-green-500 bg-green-50 text-green-700"
                                                    : "border-gray-200 hover:border-gray-300"
                                                }`}
                                        >
                                            👍 Yes, definitely
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, wouldRecommend: false })}
                                            className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${formData.wouldRecommend === false
                                                    ? "border-red-500 bg-red-50 text-red-700"
                                                    : "border-gray-200 hover:border-gray-300"
                                                }`}
                                        >
                                            👎 Not really
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-gray-700 font-medium mb-3">
                                        Would you continue working with {advisorName}?
                                    </label>
                                    <div className="flex space-x-4">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, wouldContinue: true })}
                                            className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${formData.wouldContinue === true
                                                    ? "border-green-500 bg-green-50 text-green-700"
                                                    : "border-gray-200 hover:border-gray-300"
                                                }`}
                                        >
                                            ✓ Yes
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, wouldContinue: false })}
                                            className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${formData.wouldContinue === false
                                                    ? "border-red-500 bg-red-50 text-red-700"
                                                    : "border-gray-200 hover:border-gray-300"
                                                }`}
                                        >
                                            ✗ No
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t space-y-3">
                                <label className="flex items-center space-x-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.isPublic}
                                        onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                    />
                                    <span className="text-gray-700">
                                        Make this review public (visible to other users looking for advisors)
                                    </span>
                                </label>

                                {formData.isPublic && (
                                    <label className="flex items-center space-x-3 cursor-pointer ml-7">
                                        <input
                                            type="checkbox"
                                            checked={formData.isAnonymous}
                                            onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                        />
                                        <span className="text-gray-700">
                                            Post anonymously (your name won't be shown)
                                        </span>
                                    </label>
                                )}
                            </div>

                            {/* Summary */}
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <h4 className="font-medium text-gray-900 mb-3">Review Summary</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-600">Overall Rating:</span>
                                        <span className="ml-2 font-medium">
                                            {formData.ratings.overall > 0 ? `${formData.ratings.overall}/5 ★` : "Not rated"}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">NPS Score:</span>
                                        <span className="ml-2 font-medium">
                                            {formData.npsScore !== null ? formData.npsScore : "Not provided"}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Would Recommend:</span>
                                        <span className="ml-2 font-medium">
                                            {formData.wouldRecommend === true ? "Yes" : formData.wouldRecommend === false ? "No" : "—"}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Would Continue:</span>
                                        <span className="ml-2 font-medium">
                                            {formData.wouldContinue === true ? "Yes" : formData.wouldContinue === false ? "No" : "—"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-between">
                    <button
                        type="button"
                        onClick={step === 1 ? onClose : () => setStep(step - 1)}
                        className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        {step === 1 ? "Cancel" : "Back"}
                    </button>

                    <div className="flex items-center space-x-2">
                        {[1, 2, 3].map((s) => (
                            <div
                                key={s}
                                className={`w-2 h-2 rounded-full ${s === step ? "bg-indigo-600" : s < step ? "bg-indigo-300" : "bg-gray-300"
                                    }`}
                            />
                        ))}
                    </div>

                    {step < 3 ? (
                        <button
                            type="button"
                            onClick={() => setStep(step + 1)}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            Continue
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? "Submitting..." : "Submit Evaluation"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

AdvisorEvaluationForm.propTypes = {
    relationship: PropTypes.object.isRequired,
    sessionId: PropTypes.string,
    onClose: PropTypes.func.isRequired,
    onSubmitted: PropTypes.func,
};
