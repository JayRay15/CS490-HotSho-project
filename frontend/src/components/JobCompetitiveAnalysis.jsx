import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import Card from "./Card";
import Button from "./Button";
import LoadingSpinner from "./LoadingSpinner";
import { getJobCompetitiveAnalysis } from "../api/jobCompetitiveAnalysis";
import { setAuthToken } from "../api/axios";

/**
 * UC-123: Job Competitive Analysis Component
 * Displays comprehensive competitive analysis for a specific job posting
 */
export default function JobCompetitiveAnalysis({ job, onClose }) {
    const { getToken } = useAuth();
    const [loading, setLoading] = useState(true);
    const [analysis, setAnalysis] = useState(null);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("overview");

    useEffect(() => {
        if (job?._id) {
            loadAnalysis();
        }
    }, [job?._id]);

    const loadAnalysis = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = await getToken();
            setAuthToken(token);
            const data = await getJobCompetitiveAnalysis(job._id);
            setAnalysis(data.data);
        } catch (err) {
            console.error("Failed to load competitive analysis:", err);
            setError(err.response?.data?.message || "Failed to load analysis");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 text-center">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-gray-600">Analyzing your competitiveness...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-red-50 rounded-lg border border-red-200">
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={loadAnalysis} variant="secondary">Retry</Button>
            </div>
        );
    }

    if (!analysis) return null;

    const tabs = [
        { id: "overview", label: "Overview", icon: "📊" },
        { id: "advantages", label: "Advantages", icon: "💪" },
        { id: "strategies", label: "Strategies", icon: "🎯" },
        { id: "comparison", label: "Profile Match", icon: "👤" },
    ];

    return (
        <div className="space-y-6">
            {/* Header with Summary */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold mb-2">
                            {analysis.summary?.headline || "Competitive Analysis"}
                        </h2>
                        <p className="text-white/80 text-sm">
                            Analysis for: {analysis.jobTitle} at {analysis.company}
                        </p>
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="text-white/80 hover:text-white"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="bg-white/10 rounded-lg p-4 text-center">
                        <div className="text-3xl font-bold">{analysis.competitiveScore?.overall || 0}</div>
                        <div className="text-sm text-white/80">Competitive Score</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4 text-center">
                        <div className="text-3xl font-bold capitalize">
                            {analysis.interviewLikelihood?.likelihood || "N/A"}
                        </div>
                        <div className="text-sm text-white/80">Interview Chance</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4 text-center">
                        <div className="text-3xl font-bold">
                            {analysis.applicantEstimate?.estimated || "~100"}
                        </div>
                        <div className="text-sm text-white/80">Est. Applicants</div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            activeTab === tab.id
                                ? "bg-indigo-600 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && <OverviewTab analysis={analysis} />}
            {activeTab === "advantages" && <AdvantagesTab analysis={analysis} />}
            {activeTab === "strategies" && <StrategiesTab analysis={analysis} />}
            {activeTab === "comparison" && <ComparisonTab analysis={analysis} />}

            {/* Action Recommendation */}
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <div className="flex items-start gap-4">
                    <div className="text-3xl">
                        {analysis.applicationPriority?.priority?.level === "Top Priority" ? "🚀" :
                         analysis.applicationPriority?.priority?.level === "High Priority" ? "⭐" :
                         analysis.applicationPriority?.priority?.level === "Medium Priority" ? "📋" : "📝"}
                    </div>
                    <div>
                        <h3 className="font-semibold text-green-800 text-lg">
                            {analysis.applicationPriority?.priority?.level}: {analysis.applicationPriority?.priority?.action}
                        </h3>
                        <p className="text-green-700 mt-1">
                            {analysis.applicationPriority?.recommendation}
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
}

// Overview Tab Component
function OverviewTab({ analysis }) {
    const { competitiveScore, applicantEstimate, interviewLikelihood } = analysis;

    return (
        <div className="space-y-6">
            {/* Competitive Score Breakdown */}
            <Card>
                <h3 className="text-lg font-semibold mb-4">📊 Score Breakdown</h3>
                <div className="space-y-4">
                    {competitiveScore?.breakdown && Object.entries(competitiveScore.breakdown).map(([key, data]) => (
                        <div key={key}>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-gray-700 capitalize">{key.replace(/_/g, ' ')}</span>
                                <span className="text-gray-900 font-medium">{data.score}/{data.maxScore}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full ${
                                        data.score / data.maxScore >= 0.7 ? 'bg-green-500' :
                                        data.score / data.maxScore >= 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${(data.score / data.maxScore) * 100}%` }}
                                ></div>
                            </div>
                            {data.details && typeof data.details === 'string' && (
                                <p className="text-xs text-gray-500 mt-1">{data.details}</p>
                            )}
                        </div>
                    ))}
                </div>
            </Card>

            {/* Applicant Estimate */}
            <Card>
                <h3 className="text-lg font-semibold mb-4">👥 Competition Landscape</h3>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-500">Estimated Total Applicants</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {applicantEstimate?.range?.min} - {applicantEstimate?.range?.max}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                            Competitive pool: ~{applicantEstimate?.competitivePool} qualified candidates
                        </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-500">Posting Status</p>
                        <p className="text-xl font-bold text-gray-900">
                            {applicantEstimate?.factors?.postingAge || "Active"}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                            {applicantEstimate?.daysSincePosted} days since posted
                        </p>
                    </div>
                </div>
                <p className="mt-4 text-sm text-gray-700 bg-blue-50 p-3 rounded-lg">
                    💡 {applicantEstimate?.insight}
                </p>
            </Card>

            {/* Interview Likelihood */}
            <Card>
                <h3 className="text-lg font-semibold mb-4">🎯 Interview Likelihood</h3>
                <div className="flex items-center gap-6">
                    <div className={`text-center p-4 rounded-xl ${
                        interviewLikelihood?.likelihood === 'high' ? 'bg-green-100' :
                        interviewLikelihood?.likelihood === 'medium' ? 'bg-yellow-100' : 'bg-red-100'
                    }`}>
                        <p className={`text-3xl font-bold ${
                            interviewLikelihood?.likelihood === 'high' ? 'text-green-700' :
                            interviewLikelihood?.likelihood === 'medium' ? 'text-yellow-700' : 'text-red-700'
                        }`}>
                            {interviewLikelihood?.confidencePercentage}%
                        </p>
                        <p className="text-sm text-gray-600 capitalize">
                            {interviewLikelihood?.likelihood} Likelihood
                        </p>
                    </div>
                    <div className="flex-1">
                        <p className="text-gray-700">{interviewLikelihood?.explanation}</p>
                        <div className="flex flex-wrap gap-2 mt-3">
                            {interviewLikelihood?.factors?.map((factor, idx) => (
                                <span
                                    key={idx}
                                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        factor.impact === 'positive' ? 'bg-green-100 text-green-700' :
                                        factor.impact === 'negative' ? 'bg-red-100 text-red-700' :
                                        'bg-gray-100 text-gray-700'
                                    }`}
                                >
                                    {factor.name}: {factor.impact === 'positive' ? '✓' : factor.impact === 'negative' ? '✗' : '○'}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}

// Advantages Tab Component
function AdvantagesTab({ analysis }) {
    const { competitiveAdvantages, competitiveDisadvantages } = analysis;

    return (
        <div className="space-y-6">
            {/* Competitive Advantages */}
            <Card>
                <h3 className="text-lg font-semibold text-green-700 mb-4">💪 Your Competitive Advantages</h3>
                {competitiveAdvantages?.length > 0 ? (
                    <div className="space-y-4">
                        {competitiveAdvantages.map((advantage, idx) => (
                            <div key={idx} className="p-4 bg-green-50 rounded-lg border border-green-100">
                                <div className="flex items-start gap-3">
                                    <span className="text-green-500 text-xl">✓</span>
                                    <div>
                                        <h4 className="font-semibold text-green-800">{advantage.title}</h4>
                                        <p className="text-green-700 text-sm mt-1">{advantage.description}</p>
                                        {advantage.skills && (
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {advantage.skills.map((skill, i) => (
                                                    <span key={i} className="px-2 py-0.5 bg-green-200 text-green-800 rounded text-xs">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        <span className={`mt-2 inline-block px-2 py-0.5 rounded text-xs ${
                                            advantage.impact === 'high' ? 'bg-green-200 text-green-800' :
                                            advantage.impact === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                                            'bg-gray-200 text-gray-800'
                                        }`}>
                                            {advantage.impact?.toUpperCase()} IMPACT
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 italic">
                        Complete your profile to identify your competitive advantages for this role.
                    </p>
                )}
            </Card>

            {/* Areas to Improve */}
            <Card>
                <h3 className="text-lg font-semibold text-orange-700 mb-4">📈 Areas to Improve</h3>
                {competitiveDisadvantages?.length > 0 ? (
                    <div className="space-y-4">
                        {competitiveDisadvantages.map((disadvantage, idx) => (
                            <div key={idx} className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                                <div className="flex items-start gap-3">
                                    <span className="text-orange-500 text-xl">!</span>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-orange-800">{disadvantage.title}</h4>
                                        <p className="text-orange-700 text-sm mt-1">{disadvantage.description}</p>
                                        
                                        {disadvantage.missingSkills && disadvantage.missingSkills.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {disadvantage.missingSkills.map((skill, i) => (
                                                    <span key={i} className="px-2 py-0.5 bg-orange-200 text-orange-800 rounded text-xs">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Mitigation Strategies */}
                                        {disadvantage.mitigation && (
                                            <div className="mt-3 p-3 bg-white rounded border border-orange-200">
                                                <p className="text-xs font-medium text-gray-600 mb-2">💡 How to address this:</p>
                                                <ul className="space-y-1">
                                                    {disadvantage.mitigation.map((strategy, i) => (
                                                        <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                                            <span className="text-orange-400">→</span>
                                                            {strategy}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 italic">
                        No significant gaps identified for this role. Great job!
                    </p>
                )}
            </Card>
        </div>
    );
}

// Strategies Tab Component
function StrategiesTab({ analysis }) {
    const { differentiationStrategies } = analysis;

    return (
        <div className="space-y-6">
            <Card>
                <h3 className="text-lg font-semibold mb-4">🎯 Differentiation Strategies</h3>
                <p className="text-gray-600 mb-6">
                    Stand out from other applicants with these targeted strategies:
                </p>
                <div className="space-y-6">
                    {differentiationStrategies?.map((strategy, idx) => (
                        <div 
                            key={idx} 
                            className={`p-5 rounded-xl border ${
                                strategy.priority === 'high' ? 'bg-purple-50 border-purple-200' :
                                strategy.priority === 'medium' ? 'bg-blue-50 border-blue-200' :
                                'bg-gray-50 border-gray-200'
                            }`}
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    strategy.priority === 'high' ? 'bg-purple-200 text-purple-800' :
                                    strategy.priority === 'medium' ? 'bg-blue-200 text-blue-800' :
                                    'bg-gray-200 text-gray-800'
                                }`}>
                                    {strategy.priority?.toUpperCase()} PRIORITY
                                </span>
                                <span className="text-lg font-semibold text-gray-800">
                                    {strategy.category}
                                </span>
                            </div>
                            
                            <p className="text-gray-700 font-medium mb-3">{strategy.strategy}</p>
                            
                            {strategy.tactics && (
                                <div className="bg-white rounded-lg p-4 border border-gray-100">
                                    <p className="text-xs font-medium text-gray-500 mb-2">Action Items:</p>
                                    <ul className="space-y-2">
                                        {strategy.tactics.map((tactic, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                                <span className="text-indigo-500 mt-0.5">☐</span>
                                                {tactic}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}

// Profile Comparison Tab Component
function ComparisonTab({ analysis }) {
    const { typicalHiredProfile } = analysis;

    if (!typicalHiredProfile) {
        return (
            <Card>
                <p className="text-gray-500 text-center py-8">
                    Profile comparison data not available for this role.
                </p>
            </Card>
        );
    }

    const getStatusIcon = (status) => {
        return status === 'meets' ? '✅' : '⚠️';
    };

    const getStatusColor = (status) => {
        return status === 'meets' ? 'text-green-600' : 'text-orange-600';
    };

    return (
        <div className="space-y-6">
            {/* Overall Match */}
            <Card className={`${
                typicalHiredProfile.overallMatch === 'Strong Match' ? 'bg-green-50 border-green-200' :
                typicalHiredProfile.overallMatch === 'Partial Match' ? 'bg-yellow-50 border-yellow-200' :
                'bg-orange-50 border-orange-200'
            }`}>
                <div className="text-center py-4">
                    <h3 className="text-2xl font-bold text-gray-800">
                        {typicalHiredProfile.overallMatch}
                    </h3>
                    <p className="text-gray-600 mt-1">
                        You meet {typicalHiredProfile.meetsCount} of {typicalHiredProfile.totalCriteria} typical criteria for {typicalHiredProfile.expectedLevel}-level candidates
                    </p>
                </div>
            </Card>

            {/* Detailed Comparison */}
            <Card>
                <h3 className="text-lg font-semibold mb-4">👤 Profile Comparison to Typical Hired Candidate</h3>
                <div className="space-y-4">
                    {typicalHiredProfile.comparison && Object.entries(typicalHiredProfile.comparison).map(([key, data]) => (
                        <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                                <p className="font-medium text-gray-800 capitalize">{key}</p>
                                <p className="text-sm text-gray-500">Typical: {data.typical}</p>
                            </div>
                            <div className="text-right">
                                <p className={`font-semibold ${getStatusColor(data.status)}`}>
                                    {getStatusIcon(data.status)} {data.yours}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {data.status === 'meets' ? 'Meets expectations' : 'Room to grow'}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Key Attributes */}
            <Card>
                <h3 className="text-lg font-semibold mb-4">🌟 Key Attributes Employers Look For</h3>
                <p className="text-gray-600 mb-4">
                    For {typicalHiredProfile.expectedLevel}-level roles, hiring managers typically prioritize:
                </p>
                <ul className="space-y-2">
                    {typicalHiredProfile.profile?.keyAttributes?.map((attr, idx) => (
                        <li key={idx} className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg">
                            <span className="text-indigo-500">★</span>
                            <span className="text-gray-700">{attr}</span>
                        </li>
                    ))}
                </ul>
            </Card>
        </div>
    );
}
