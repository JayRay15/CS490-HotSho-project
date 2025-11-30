import React, { useState } from "react";
import PropTypes from "prop-types";

const ADVISOR_TYPES = [
    { id: "career_coach", label: "Career Coach", description: "Overall career guidance and strategy" },
    { id: "executive_coach", label: "Executive Coach", description: "Leadership and executive positioning" },
    { id: "resume_writer", label: "Resume Writer", description: "Professional resume optimization" },
    { id: "interview_coach", label: "Interview Coach", description: "Interview preparation and practice" },
    { id: "salary_negotiator", label: "Salary Negotiator", description: "Compensation and negotiation strategy" },
    { id: "industry_expert", label: "Industry Expert", description: "Industry-specific insights and connections" },
    { id: "linkedin_specialist", label: "LinkedIn Specialist", description: "LinkedIn profile and networking" },
    { id: "recruiter_advisor", label: "Recruiter Advisor", description: "Inside knowledge on recruitment" },
    { id: "other", label: "Other", description: "Other career support" },
];

const FOCUS_AREAS = [
    { id: "job_search_strategy", label: "Job Search Strategy" },
    { id: "resume_optimization", label: "Resume Optimization" },
    { id: "cover_letter_writing", label: "Cover Letter Writing" },
    { id: "interview_preparation", label: "Interview Preparation" },
    { id: "salary_negotiation", label: "Salary Negotiation" },
    { id: "career_transition", label: "Career Transition" },
    { id: "executive_positioning", label: "Executive Positioning" },
    { id: "personal_branding", label: "Personal Branding" },
    { id: "linkedin_optimization", label: "LinkedIn Optimization" },
    { id: "networking_strategy", label: "Networking Strategy" },
    { id: "industry_insights", label: "Industry Insights" },
    { id: "skill_development", label: "Skill Development" },
    { id: "work_life_balance", label: "Work-Life Balance" },
    { id: "leadership_development", label: "Leadership Development" },
    { id: "general_career_advice", label: "General Career Advice" },
];

const SHARED_DATA_OPTIONS = [
    { key: "shareResume", label: "Resume", description: "Your current resume" },
    { key: "shareCoverLetters", label: "Cover Letters", description: "Your cover letters" },
    { key: "shareApplications", label: "Applications", description: "Your job applications" },
    { key: "shareInterviewPrep", label: "Interview Prep", description: "Interview preparation materials" },
    { key: "shareGoals", label: "Goals", description: "Your career goals" },
    { key: "shareSkillGaps", label: "Skill Gaps", description: "Skill gap analysis" },
    { key: "shareProgress", label: "Progress", description: "Overall job search progress" },
    { key: "shareSalaryInfo", label: "Salary Info", description: "Salary expectations and history" },
    { key: "shareNetworkContacts", label: "Network Contacts", description: "Your professional contacts" },
];

export default function InviteAdvisorModal({ isOpen, onClose, onInviteSent }) {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        advisorName: "",
        advisorEmail: "",
        advisorType: "career_coach",
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
            shareSalaryInfo: false,
            shareNetworkContacts: false,
        },
        contractTerms: {
            isOpenEnded: true,
            totalSessions: null,
            startDate: null,
            endDate: null,
        },
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleNameChange = (e) => {
        setFormData({ ...formData, advisorName: e.target.value });
    };

    const handleEmailChange = (e) => {
        setFormData({ ...formData, advisorEmail: e.target.value });
        setError("");
    };

    const handleAdvisorTypeChange = (type) => {
        setFormData({ ...formData, advisorType: type });
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

    const handleContractChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            contractTerms: {
                ...prev.contractTerms,
                [field]: value,
            },
        }));
    };

    const validateStep = () => {
        if (step === 1) {
            if (!formData.advisorName || !formData.advisorName.trim()) {
                setError("Please enter the advisor's name");
                return false;
            }
            if (!formData.advisorEmail) {
                setError("Please enter an advisor email address");
                return false;
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.advisorEmail)) {
                setError("Please enter a valid email address");
                return false;
            }
        }
        setError("");
        return true;
    };

    const nextStep = () => {
        if (validateStep()) {
            setStep((prev) => Math.min(prev + 1, 4));
        }
    };

    const prevStep = () => {
        setStep((prev) => Math.max(prev - 1, 1));
        setError("");
    };

    const handleSubmit = async () => {
        if (!validateStep()) return;

        setLoading(true);
        setError("");
        setSuccess("");

        try {
            const token = localStorage.getItem("token");
            const headers = {
                "Content-Type": "application/json",
            };
            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }

            const response = await fetch("/api/external-advisors/invite", {
                method: "POST",
                headers,
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Failed to send invitation");
            }

            setSuccess("Advisor invitation sent successfully!");

            // Reset form
            setFormData({
                advisorName: "",
                advisorEmail: "",
                advisorType: "career_coach",
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
                    shareSalaryInfo: false,
                    shareNetworkContacts: false,
                },
                contractTerms: {
                    isOpenEnded: true,
                    totalSessions: null,
                    startDate: null,
                    endDate: null,
                },
            });
            setStep(1);

            if (onInviteSent) {
                onInviteSent();
            }

            setTimeout(() => {
                onClose();
                setSuccess("");
            }, 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const renderStepIndicator = () => (
        <div className="flex items-center justify-center mb-6">
            {[1, 2, 3, 4].map((s) => (
                <React.Fragment key={s}>
                    <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${s === step
                                ? "bg-indigo-600 text-white"
                                : s < step
                                    ? "bg-green-500 text-white"
                                    : "bg-gray-200 text-gray-600"
                            }`}
                    >
                        {s < step ? "✓" : s}
                    </div>
                    {s < 4 && (
                        <div
                            className={`w-12 h-1 ${s < step ? "bg-green-500" : "bg-gray-200"
                                }`}
                        />
                    )}
                </React.Fragment>
            ))}
        </div>
    );

    const renderStep1 = () => (
        <div className="space-y-6">
            <div>
                <label className="block text-gray-700 font-medium mb-2">
                    Advisor Name *
                </label>
                <input
                    type="text"
                    value={formData.advisorName}
                    onChange={handleNameChange}
                    placeholder="John Smith"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="mt-1 text-sm text-gray-500">
                    Enter the full name of the career advisor
                </p>
            </div>

            <div>
                <label className="block text-gray-700 font-medium mb-2">
                    Advisor Email *
                </label>
                <input
                    type="email"
                    value={formData.advisorEmail}
                    onChange={handleEmailChange}
                    placeholder="advisor@example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="mt-1 text-sm text-gray-500">
                    Enter the email of the career advisor you want to invite
                </p>
            </div>

            <div>
                <label className="block text-gray-700 font-medium mb-3">
                    Advisor Type
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {ADVISOR_TYPES.map((type) => (
                        <button
                            key={type.id}
                            type="button"
                            onClick={() => handleAdvisorTypeChange(type.id)}
                            className={`p-3 rounded-lg border-2 text-left transition-all ${formData.advisorType === type.id
                                    ? "border-indigo-500 bg-indigo-50"
                                    : "border-gray-200 hover:border-gray-300"
                                }`}
                        >
                            <div className="font-medium text-gray-900">{type.label}</div>
                            <div className="text-sm text-gray-500">{type.description}</div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6">
            <div>
                <label className="block text-gray-700 font-medium mb-3">
                    Focus Areas
                </label>
                <p className="text-sm text-gray-500 mb-3">
                    Select the areas where you need the most guidance
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {FOCUS_AREAS.map((area) => (
                        <button
                            key={area.id}
                            type="button"
                            onClick={() => toggleFocusArea(area.id)}
                            className={`px-3 py-2 rounded-lg text-sm transition-all ${formData.focusAreas.includes(area.id)
                                    ? "bg-indigo-600 text-white"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                        >
                            {area.label}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-gray-700 font-medium mb-2">
                    Personal Message
                </label>
                <textarea
                    value={formData.invitationMessage}
                    onChange={handleMessageChange}
                    placeholder="Introduce yourself and explain what you're looking for in a career advisor..."
                    rows={4}
                    maxLength={1000}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="mt-1 text-sm text-gray-500">
                    {formData.invitationMessage.length}/1000 characters
                </p>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-6">
            <div>
                <label className="block text-gray-700 font-medium mb-3">
                    What would you like to share with your advisor?
                </label>
                <p className="text-sm text-gray-500 mb-4">
                    Control what information your advisor can access. You can change these settings later.
                </p>
                <div className="space-y-3">
                    {SHARED_DATA_OPTIONS.map((option) => (
                        <label
                            key={option.key}
                            className="flex items-start p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                        >
                            <input
                                type="checkbox"
                                checked={formData.sharedData[option.key]}
                                onChange={() => toggleSharedData(option.key)}
                                className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <div className="ml-3">
                                <div className="font-medium text-gray-900">{option.label}</div>
                                <div className="text-sm text-gray-500">{option.description}</div>
                            </div>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderStep4 = () => (
        <div className="space-y-6">
            <div>
                <label className="block text-gray-700 font-medium mb-3">
                    Engagement Terms
                </label>

                <div className="space-y-4">
                    <label className="flex items-center p-3 rounded-lg border border-gray-200 cursor-pointer">
                        <input
                            type="radio"
                            checked={formData.contractTerms.isOpenEnded}
                            onChange={() => handleContractChange("isOpenEnded", true)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                        <div className="ml-3">
                            <div className="font-medium text-gray-900">Open-ended engagement</div>
                            <div className="text-sm text-gray-500">Continue until either party ends the relationship</div>
                        </div>
                    </label>

                    <label className="flex items-center p-3 rounded-lg border border-gray-200 cursor-pointer">
                        <input
                            type="radio"
                            checked={!formData.contractTerms.isOpenEnded}
                            onChange={() => handleContractChange("isOpenEnded", false)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                        <div className="ml-3">
                            <div className="font-medium text-gray-900">Fixed-term engagement</div>
                            <div className="text-sm text-gray-500">Set specific dates or number of sessions</div>
                        </div>
                    </label>
                </div>

                {!formData.contractTerms.isOpenEnded && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Number of Sessions (optional)
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={formData.contractTerms.totalSessions || ""}
                                onChange={(e) => handleContractChange("totalSessions", e.target.value ? parseInt(e.target.value) : null)}
                                placeholder="e.g., 10"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Start Date (optional)
                                </label>
                                <input
                                    type="date"
                                    value={formData.contractTerms.startDate || ""}
                                    onChange={(e) => handleContractChange("startDate", e.target.value || null)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    End Date (optional)
                                </label>
                                <input
                                    type="date"
                                    value={formData.contractTerms.endDate || ""}
                                    onChange={(e) => handleContractChange("endDate", e.target.value || null)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Summary */}
            <div className="p-4 bg-indigo-50 rounded-lg">
                <h4 className="font-medium text-indigo-900 mb-3">Invitation Summary</h4>
                <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <dt className="text-indigo-700">Advisor Name:</dt>
                        <dd className="font-medium text-indigo-900">{formData.advisorName}</dd>
                    </div>
                    <div className="flex justify-between">
                        <dt className="text-indigo-700">Advisor Email:</dt>
                        <dd className="font-medium text-indigo-900">{formData.advisorEmail}</dd>
                    </div>
                    <div className="flex justify-between">
                        <dt className="text-indigo-700">Type:</dt>
                        <dd className="font-medium text-indigo-900">
                            {ADVISOR_TYPES.find(t => t.id === formData.advisorType)?.label}
                        </dd>
                    </div>
                    <div className="flex justify-between">
                        <dt className="text-indigo-700">Focus Areas:</dt>
                        <dd className="font-medium text-indigo-900">
                            {formData.focusAreas.length > 0 ? formData.focusAreas.length + " selected" : "None selected"}
                        </dd>
                    </div>
                    <div className="flex justify-between">
                        <dt className="text-indigo-700">Shared Data:</dt>
                        <dd className="font-medium text-indigo-900">
                            {Object.values(formData.sharedData).filter(Boolean).length} categories
                        </dd>
                    </div>
                </dl>
            </div>
        </div>
    );

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{ backgroundColor: "rgba(0,0,0,0.48)" }}
            onClick={handleBackdropClick}
        >
            <div
                className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Invite Career Advisor</h2>
                        <p className="text-sm text-gray-500">
                            Step {step} of 4: {
                                step === 1 ? "Advisor Details" :
                                    step === 2 ? "Focus & Message" :
                                        step === 3 ? "Data Sharing" :
                                            "Terms & Review"
                            }
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-xl"
                        aria-label="Close modal"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {renderStepIndicator()}

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

                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}
                    {step === 4 && renderStep4()}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-between">
                    <button
                        type="button"
                        onClick={step === 1 ? onClose : prevStep}
                        className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        {step === 1 ? "Cancel" : "Back"}
                    </button>

                    {step < 4 ? (
                        <button
                            type="button"
                            onClick={nextStep}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            Continue
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Sending..." : "Send Invitation"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

InviteAdvisorModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onInviteSent: PropTypes.func,
};
