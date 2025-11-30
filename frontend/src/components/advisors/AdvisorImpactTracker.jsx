import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";

const IMPACT_CATEGORIES = [
    { key: "applications", label: "Job Applications", icon: "📝", color: "blue" },
    { key: "interviews", label: "Interviews", icon: "🎯", color: "purple" },
    { key: "offers", label: "Job Offers", icon: "🎉", color: "green" },
    { key: "networking", label: "Networking Events", icon: "🤝", color: "orange" },
    { key: "skills", label: "Skills Developed", icon: "📚", color: "indigo" },
];

const TIME_PERIODS = [
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "quarter", label: "This Quarter" },
    { value: "year", label: "This Year" },
    { value: "all", label: "All Time" },
];

export default function AdvisorImpactTracker({ relationship, isAdvisor }) {
    const [metrics, setMetrics] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [timePeriod, setTimePeriod] = useState("month");
    const [showAddMetric, setShowAddMetric] = useState(false);

    // New metric form
    const [newMetric, setNewMetric] = useState({
        metricType: "applications",
        value: 1,
        description: "",
        relatedJobId: "",
        milestone: "",
    });

    useEffect(() => {
        fetchImpactData();
    }, [relationship, timePeriod]);

    const fetchImpactData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            // Fetch impact metrics
            const metricsRes = await fetch(
                `/api/external-advisors/impact/${relationship._id}?period=${timePeriod}`,
                { headers }
            );
            if (metricsRes.ok) {
                const data = await metricsRes.json();
                setMetrics(data.metrics || []);
                setSummary(data.summary || null);
            }
        } catch (err) {
            setError("Failed to load impact data: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddMetric = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const headers = {
                "Content-Type": "application/json",
                ...(token && { Authorization: `Bearer ${token}` }),
            };

            const response = await fetch("/api/external-advisors/impact", {
                method: "POST",
                headers,
                body: JSON.stringify({
                    relationshipId: relationship._id,
                    ...newMetric,
                }),
            });

            if (response.ok) {
                setShowAddMetric(false);
                setNewMetric({
                    metricType: "applications",
                    value: 1,
                    description: "",
                    relatedJobId: "",
                    milestone: "",
                });
                fetchImpactData();
            } else {
                const data = await response.json();
                setError(data.message || "Failed to add metric");
            }
        } catch (err) {
            setError("Failed to add metric: " + err.message);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const getImpactScore = () => {
        if (!summary) return 0;
        // Calculate a weighted impact score
        const weights = {
            applications: 1,
            interviews: 3,
            offers: 10,
            networking: 2,
            skills: 1.5,
        };
        let score = 0;
        Object.entries(summary).forEach(([key, value]) => {
            if (weights[key]) {
                score += value * weights[key];
            }
        });
        return Math.round(score);
    };

    const getProgressPercentage = (category) => {
        if (!summary || !summary[category]) return 0;
        // Arbitrary goals for visualization
        const goals = {
            applications: 20,
            interviews: 10,
            offers: 3,
            networking: 15,
            skills: 10,
        };
        return Math.min((summary[category] / goals[category]) * 100, 100);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    const otherPartyName = isAdvisor
        ? `${relationship.clientId?.firstName || ""} ${relationship.clientId?.lastName || ""}`
        : `${relationship.advisorId?.firstName || ""} ${relationship.advisorId?.lastName || ""}`;

    return (
        <div className="bg-white rounded-xl shadow-sm border">
            {/* Header */}
            <div className="border-b px-6 py-4 flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Impact Tracker</h2>
                    <p className="text-sm text-gray-500">
                        Track how {isAdvisor ? otherPartyName : "your advisor"} is helping your job search
                    </p>
                </div>

                <div className="flex items-center space-x-3">
                    <select
                        value={timePeriod}
                        onChange={(e) => setTimePeriod(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                    >
                        {TIME_PERIODS.map((period) => (
                            <option key={period.value} value={period.value}>
                                {period.label}
                            </option>
                        ))}
                    </select>

                    {!isAdvisor && (
                        <button
                            onClick={() => setShowAddMetric(true)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                        >
                            + Log Progress
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                    {error}
                    <button onClick={() => setError("")} className="ml-2 text-red-500 hover:text-red-700">
                        ✕
                    </button>
                </div>
            )}

            <div className="p-6">
                {/* Impact Score Card */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-indigo-100 text-sm font-medium">Total Impact Score</p>
                            <p className="text-5xl font-bold mt-1">{getImpactScore()}</p>
                            <p className="text-indigo-200 text-sm mt-2">
                                Based on activities tracked {TIME_PERIODS.find((p) => p.value === timePeriod)?.label.toLowerCase()}
                            </p>
                        </div>
                        <div className="text-6xl opacity-50">🚀</div>
                    </div>
                </div>

                {/* Category Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {IMPACT_CATEGORIES.map((category) => (
                        <div key={category.key} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                    <span className="text-2xl">{category.icon}</span>
                                    <span className="font-medium text-gray-900">{category.label}</span>
                                </div>
                                <span className="text-2xl font-bold text-gray-900">
                                    {summary?.[category.key] || 0}
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full transition-all duration-500 ${category.color === "blue"
                                            ? "bg-blue-500"
                                            : category.color === "purple"
                                                ? "bg-purple-500"
                                                : category.color === "green"
                                                    ? "bg-green-500"
                                                    : category.color === "orange"
                                                        ? "bg-orange-500"
                                                        : "bg-indigo-500"
                                        }`}
                                    style={{ width: `${getProgressPercentage(category.key)}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Recent Activity */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>

                    {metrics.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-lg">
                            <p className="text-gray-500 text-4xl mb-3">📊</p>
                            <p className="text-gray-600">No activity tracked yet</p>
                            <p className="text-sm text-gray-400 mt-2">
                                Start logging your progress to see the impact of your advisor
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {metrics.slice(0, 10).map((metric) => {
                                const category = IMPACT_CATEGORIES.find((c) => c.key === metric.metricType);
                                return (
                                    <div
                                        key={metric._id}
                                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex items-center space-x-4">
                                            <span className="text-2xl">{category?.icon || "📌"}</span>
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {category?.label || metric.metricType}
                                                    {metric.value > 1 && (
                                                        <span className="ml-2 text-indigo-600">×{metric.value}</span>
                                                    )}
                                                </p>
                                                {metric.description && (
                                                    <p className="text-sm text-gray-500">{metric.description}</p>
                                                )}
                                                {metric.milestone && (
                                                    <span className="inline-block mt-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                                        🏆 {metric.milestone}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <span className="text-sm text-gray-400">
                                            {formatDate(metric.createdAt)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Milestones Section */}
                {summary?.milestones && summary.milestones.length > 0 && (
                    <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <h3 className="font-semibold text-yellow-800 mb-3">🏆 Milestones Achieved</h3>
                        <div className="flex flex-wrap gap-2">
                            {summary.milestones.map((milestone, index) => (
                                <span
                                    key={index}
                                    className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium"
                                >
                                    {milestone}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Add Metric Modal */}
            {showAddMetric && (
                <div
                    className="fixed inset-0 flex items-center justify-center z-50"
                    style={{ backgroundColor: "rgba(0,0,0,0.48)" }}
                >
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-900">Log Progress</h3>
                            <button
                                onClick={() => setShowAddMetric(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleAddMetric} className="space-y-4">
                            <div>
                                <label className="block text-gray-700 font-medium mb-2">
                                    Category <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={newMetric.metricType}
                                    onChange={(e) =>
                                        setNewMetric({ ...newMetric, metricType: e.target.value })
                                    }
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                >
                                    {IMPACT_CATEGORIES.map((category) => (
                                        <option key={category.key} value={category.key}>
                                            {category.icon} {category.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-gray-700 font-medium mb-2">
                                    Count
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={newMetric.value}
                                    onChange={(e) =>
                                        setNewMetric({ ...newMetric, value: parseInt(e.target.value) || 1 })
                                    }
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-700 font-medium mb-2">
                                    Description
                                </label>
                                <input
                                    type="text"
                                    value={newMetric.description}
                                    onChange={(e) =>
                                        setNewMetric({ ...newMetric, description: e.target.value })
                                    }
                                    placeholder="e.g., Applied to Google, Completed interview prep..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-700 font-medium mb-2">
                                    Milestone (optional)
                                </label>
                                <input
                                    type="text"
                                    value={newMetric.milestone}
                                    onChange={(e) =>
                                        setNewMetric({ ...newMetric, milestone: e.target.value })
                                    }
                                    placeholder="e.g., First interview, Job offer received..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddMetric(false)}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                    Log Progress
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

AdvisorImpactTracker.propTypes = {
    relationship: PropTypes.object.isRequired,
    isAdvisor: PropTypes.bool,
};

AdvisorImpactTracker.defaultProps = {
    isAdvisor: false,
};
