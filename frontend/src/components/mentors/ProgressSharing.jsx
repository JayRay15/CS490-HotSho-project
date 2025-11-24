import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";

export default function ProgressSharing() {
    const [mentors, setMentors] = useState([]);
    const [selectedMentor, setSelectedMentor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportType, setReportType] = useState("monthly");
    const [reports, setReports] = useState([]);

    useEffect(() => {
        fetchMentorsAndReports();
    }, []);

    const fetchMentorsAndReports = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            // Fetch mentors
            const mentorsRes = await fetch("/api/mentors/my-mentors", { headers });
            const mentorsData = mentorsRes.ok ? await mentorsRes.json() : { data: [] };
            setMentors(Array.isArray(mentorsData.data) ? mentorsData.data : []);

            // Fetch progress reports
            const reportsRes = await fetch("/api/mentors/progress-reports", { headers });
            const reportsData = reportsRes.ok ? await reportsRes.json() : { data: [] };
            setReports(Array.isArray(reportsData.data) ? reportsData.data : []);
        } catch (err) {
            console.error("Fetch error:", err);
            setError("Failed to load progress information: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateReport = async (mentorRelationshipId) => {
        try {
            const token = localStorage.getItem("token");
            const headers = {
                "Content-Type": "application/json",
            };
            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }

            const response = await fetch("/api/mentors/progress-reports", {
                method: "POST",
                headers,
                body: JSON.stringify({
                    relationshipId: mentorRelationshipId,
                    reportType,
                }),
            });

            if (response.ok) {
                setShowReportModal(false);
                fetchMentorsAndReports();
            }
        } catch (err) {
            console.error("Error generating report:", err);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading progress sharing...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Share Progress with Mentors
            </h1>
            <p className="text-gray-600 mb-6">
                Generate and share regular progress reports with your mentors to receive
                targeted guidance
            </p>

            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                    {error}
                </div>
            )}

            {mentors.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-600 mb-4">
                        You don't have any mentors yet. Invite a mentor to start sharing
                        progress.
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Mentor Selection */}
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">
                            Select Mentor
                        </h2>
                        <div className="grid gap-4">
                            {mentors.map((mentor) => (
                                <div
                                    key={mentor._id}
                                    onClick={() => setSelectedMentor(mentor)}
                                    className={`border rounded-lg p-4 cursor-pointer transition ${selectedMentor?._id === mentor._id
                                            ? "border-blue-600 bg-blue-50"
                                            : "border-gray-200 hover:border-blue-300"
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
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
                                            <div>
                                                <p className="font-medium text-gray-800">
                                                    {mentor.mentorId?.firstName} {mentor.mentorId?.lastName}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    {mentor.relationshipType?.replace(/_/g, " ")}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedMentor(mentor);
                                                setShowReportModal(true);
                                            }}
                                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                                        >
                                            Generate Report
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Reports */}
                    {reports.length > 0 && (
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">
                                Recent Reports
                            </h2>
                            <div className="space-y-4">
                                {reports.map((report) => (
                                    <ReportCard key={report._id} report={report} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Report Generation Modal */}
            {showReportModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white flex justify-between items-center">
                            <h3 className="text-lg font-bold">Generate Progress Report</h3>
                            <button
                                onClick={() => setShowReportModal(false)}
                                className="text-white hover:bg-blue-800 p-2 rounded"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-6">
                            <label className="block text-gray-700 font-medium mb-2">
                                Report Type
                            </label>
                            <select
                                value={reportType}
                                onChange={(e) => setReportType(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                            >
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                                <option value="custom">Custom</option>
                            </select>

                            <p className="text-gray-600 text-sm mb-4">
                                Your progress report will be generated and shared with your
                                mentor for review and feedback.
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowReportModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        handleGenerateReport(selectedMentor._id);
                                    }}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Generate & Share
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ReportCard({ report }) {
    const formatDate = (date) => new Date(date).toLocaleDateString();

    const stats = [
        {
            label: "Applications",
            value: report.metrics?.jobsAppliedTo || 0,
            icon: "📝",
        },
        {
            label: "Interviews",
            value: report.metrics?.interviewsScheduled || 0,
            icon: "🎤",
        },
        {
            label: "Offers",
            value: report.metrics?.offersReceived || 0,
            icon: "🎉",
        },
    ];

    return (
        <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
            <div className="flex items-start justify-between mb-3">
                <div>
                    <h3 className="font-semibold text-gray-800">
                        {report.reportType?.charAt(0).toUpperCase() +
                            report.reportType?.slice(1)}{" "}
                        Report
                    </h3>
                    <p className="text-sm text-gray-600">
                        {formatDate(report.reportPeriod.startDate)} -{" "}
                        {formatDate(report.reportPeriod.endDate)}
                    </p>
                </div>
                {report.reviewedAt && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                        ✓ Reviewed
                    </span>
                )}
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
                {stats.map((stat) => (
                    <div
                        key={stat.label}
                        className="bg-gray-50 p-3 rounded text-center border border-gray-200"
                    >
                        <p className="text-2xl mb-1">{stat.icon}</p>
                        <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                        <p className="text-xs text-gray-600">{stat.label}</p>
                    </div>
                ))}
            </div>

            {report.progressScore && (
                <div className="mb-4 p-3 bg-blue-50 rounded">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-700 font-medium">Progress Score</span>
                        <span className="text-2xl font-bold text-blue-600">
                            {report.progressScore}/100
                        </span>
                    </div>
                </div>
            )}

            <button className="w-full px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 transition">
                View Full Report
            </button>
        </div>
    );
}

ReportCard.propTypes = {
    report: PropTypes.object.isRequired,
};
