import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import Card from "../../components/Card";
import Button from "../../components/Button";
import LoadingSpinner from "../../components/LoadingSpinner";
import { getCompetitiveAnalysis } from "../../api/competitiveAnalysis";
import { setAuthToken } from "../../api/axios";

// ============================================================================
// UC-104: Competitive Analysis and Benchmarking
// ============================================================================

export default function CompetitiveAnalysis() {
    const { getToken } = useAuth();
    const [loading, setLoading] = useState(true);
    const [analysis, setAnalysis] = useState(null);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("overview");

    useEffect(() => {
        loadAnalysis();
    }, []);

    const loadAnalysis = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = await getToken();
            setAuthToken(token);
            const data = await getCompetitiveAnalysis();
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
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-center h-64">
                    <LoadingSpinner size="lg" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Card className="bg-red-50 border-red-200">
                    <div className="text-center py-8">
                        <p className="text-red-600 mb-4">{error}</p>
                        <Button onClick={loadAnalysis}>Retry</Button>
                    </div>
                </Card>
            </div>
        );
    }

    const tabs = [
        { id: "overview", label: "Overview", icon: "📊" },
        { id: "benchmarks", label: "Peer Benchmarks", icon: "📈" },
        { id: "skills", label: "Skill Analysis", icon: "🎯" },
        { id: "positioning", label: "Market Position", icon: "🏆" },
        { id: "career", label: "Career Path", icon: "🚀" },
        { id: "recommendations", label: "Recommendations", icon: "💡" },
    ];

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    🏆 Competitive Analysis
                </h1>
                <p className="text-gray-600">
                    Understand your market position and get insights to stand out from the competition
                </p>
            </div>

            {/* Competitive Score Card */}
            {analysis?.overview && (
                <div className="mb-8">
                    <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                        <div className="flex items-center justify-between flex-wrap gap-6">
                            <div>
                                <h2 className="text-lg font-medium opacity-90">Your Competitive Score</h2>
                                <div className="flex items-baseline gap-2 mt-2">
                                    <span className="text-5xl font-bold">{analysis.overview.competitiveScore}</span>
                                    <span className="text-2xl opacity-80">/100</span>
                                </div>
                                <p className="mt-2 opacity-90">
                                    {analysis.overview.competitiveScore >= 80 ? "Excellent! You're highly competitive" :
                                        analysis.overview.competitiveScore >= 60 ? "Good positioning with room to grow" :
                                            analysis.overview.competitiveScore >= 40 ? "Average - focus on key improvements" :
                                                "Building competitive edge - follow recommendations"}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="opacity-80">Industry: <span className="font-semibold">{analysis.overview.industry}</span></p>
                                <p className="opacity-80">Level: <span className="font-semibold">{analysis.overview.experienceLevel}</span></p>
                                <p className="text-sm opacity-70 mt-2">Last updated: {new Date(analysis.overview.lastUpdated).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-4">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === tab.id
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && <OverviewTab analysis={analysis} />}
            {activeTab === "benchmarks" && <BenchmarksTab peerComparison={analysis?.peerComparison} benchmarks={analysis?.peerBenchmarks} />}
            {activeTab === "skills" && <SkillsTab skillGapAnalysis={analysis?.skillGapAnalysis} />}
            {activeTab === "positioning" && <PositioningTab positioning={analysis?.positioning} marketPositioning={analysis?.marketPositioning} />}
            {activeTab === "career" && <CareerTab careerProgression={analysis?.careerProgressionAnalysis} />}
            {activeTab === "recommendations" && <RecommendationsTab recommendations={analysis?.recommendations} strategies={analysis?.differentiationStrategies} />}
        </div>
    );
}

// ============================================================================
// Overview Tab
// ============================================================================
function OverviewTab({ analysis }) {
    if (!analysis) return null;

    const { userMetrics, peerComparison, positioning } = analysis;

    return (
        <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid md:grid-cols-4 gap-4">
                <MetricCard
                    title="Applications/Month"
                    value={userMetrics?.applicationsThisMonth || 0}
                    comparison={peerComparison?.applicationVolume}
                    icon="📝"
                />
                <MetricCard
                    title="Response Rate"
                    value={`${userMetrics?.responseRate || 0}%`}
                    comparison={peerComparison?.responseRate}
                    icon="📬"
                />
                <MetricCard
                    title="Interview Rate"
                    value={`${userMetrics?.interviewRate || 0}%`}
                    comparison={peerComparison?.interviewRate}
                    icon="🎤"
                />
                <MetricCard
                    title="Offer Rate"
                    value={`${userMetrics?.offerRate || 0}%`}
                    comparison={peerComparison?.offerRate}
                    icon="🎉"
                />
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <h3 className="text-lg font-semibold mb-4 text-green-700">💪 Your Strengths</h3>
                    {positioning?.strengths?.length > 0 ? (
                        <ul className="space-y-3">
                            {positioning.strengths.map((strength, idx) => (
                                <li key={idx} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                                    <span className="text-green-500 text-xl">✓</span>
                                    <div>
                                        <p className="font-medium text-green-800">{strength.area}</p>
                                        <p className="text-sm text-green-600">{strength.description}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500 italic">Keep building your profile to identify strengths</p>
                    )}
                </Card>

                <Card>
                    <h3 className="text-lg font-semibold mb-4 text-orange-700">📈 Areas to Improve</h3>
                    {positioning?.weaknesses?.length > 0 ? (
                        <ul className="space-y-3">
                            {positioning.weaknesses.map((weakness, idx) => (
                                <li key={idx} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                                    <span className="text-orange-500 text-xl">!</span>
                                    <div>
                                        <p className="font-medium text-orange-800">{weakness.area}</p>
                                        <p className="text-sm text-orange-600">{weakness.description}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500 italic">Great job! No significant weaknesses detected</p>
                    )}
                </Card>
            </div>

            {/* Unique Value Proposition */}
            {positioning?.uniqueValueProposition && (
                <Card className="bg-gradient-to-r from-purple-50 to-indigo-50">
                    <h3 className="text-lg font-semibold mb-4 text-purple-800">✨ Your Unique Value Proposition</h3>
                    <p className="text-lg text-purple-700 font-medium mb-4">
                        {positioning.uniqueValueProposition.summary}
                    </p>
                    {positioning.uniqueValueProposition.keyDifferentiators?.length > 0 && (
                        <div className="mt-4">
                            <p className="text-sm font-medium text-purple-600 mb-2">Key Differentiators:</p>
                            <div className="flex flex-wrap gap-2">
                                {positioning.uniqueValueProposition.keyDifferentiators.map((diff, idx) => (
                                    <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                                        {diff}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </Card>
            )}

            {/* Profile Stats */}
            <div className="grid md:grid-cols-4 gap-4">
                <StatCard title="Skills" value={userMetrics?.skillsCount || 0} comparison={peerComparison?.skillsCount} />
                <StatCard title="Projects" value={userMetrics?.projectsCount || 0} comparison={peerComparison?.projectsCount} />
                <StatCard title="Certifications" value={userMetrics?.certificationsCount || 0} comparison={peerComparison?.certificationsCount} />
                <StatCard title="Experience (Years)" value={userMetrics?.experienceYears || 0} />
            </div>
        </div>
    );
}

function MetricCard({ title, value, comparison, icon }) {
    const getStatusColor = (status) => {
        switch (status) {
            case 'top_performer': return 'text-green-600 bg-green-50';
            case 'above_average': return 'text-blue-600 bg-blue-50';
            case 'average': return 'text-yellow-600 bg-yellow-50';
            case 'below_average': return 'text-red-600 bg-red-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'top_performer': return 'Top Performer';
            case 'above_average': return 'Above Average';
            case 'average': return 'Average';
            case 'below_average': return 'Below Average';
            default: return 'N/A';
        }
    };

    return (
        <Card className="text-center">
            <div className="text-3xl mb-2">{icon}</div>
            <p className="text-sm text-gray-600 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {comparison && (
                <div className={`mt-3 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(comparison.status)}`}>
                    {getStatusLabel(comparison.status)}
                    {comparison.vsBenchmark !== 0 && (
                        <span className="ml-1">
                            ({comparison.vsBenchmark > 0 ? '+' : ''}{comparison.vsBenchmark}%)
                        </span>
                    )}
                </div>
            )}
        </Card>
    );
}

function StatCard({ title, value, comparison }) {
    return (
        <Card className="text-center p-4">
            <p className="text-sm text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {comparison && (
                <p className="text-xs text-gray-500 mt-1">
                    Benchmark: {comparison.benchmark}
                </p>
            )}
        </Card>
    );
}

// ============================================================================
// Benchmarks Tab
// ============================================================================
function BenchmarksTab({ peerComparison, benchmarks }) {
    if (!peerComparison || !benchmarks) return null;

    const metrics = [
        { key: 'applicationVolume', label: 'Application Volume', unit: '/month' },
        { key: 'responseRate', label: 'Response Rate', unit: '%' },
        { key: 'interviewRate', label: 'Interview Rate', unit: '%' },
        { key: 'offerRate', label: 'Offer Rate', unit: '%' },
        { key: 'skillsCount', label: 'Skills Count', unit: '' },
        { key: 'projectsCount', label: 'Projects', unit: '' },
        { key: 'certificationsCount', label: 'Certifications', unit: '' },
    ];

    return (
        <div className="space-y-6">
            <Card>
                <h3 className="text-lg font-semibold mb-6">📊 Your Performance vs Peer Benchmarks</h3>
                <div className="space-y-6">
                    {metrics.map((metric) => {
                        const data = peerComparison[metric.key];
                        if (!data) return null;

                        return (
                            <BenchmarkBar
                                key={metric.key}
                                label={metric.label}
                                unit={metric.unit}
                                user={data.user}
                                benchmark={data.benchmark}
                                topPerformer={data.topPerformer}
                                status={data.status}
                                percentile={data.percentile}
                            />
                        );
                    })}
                </div>
            </Card>

            {/* Industry Benchmarks Reference */}
            <Card>
                <h3 className="text-lg font-semibold mb-4">📚 Industry Benchmarks Reference</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <BenchmarkReference
                        title="Avg Response Rate"
                        value={`${benchmarks.adjustedForExperience?.avgResponseRate?.toFixed(1)}%`}
                        topValue={`${benchmarks.adjustedForExperience?.topPerformerResponseRate?.toFixed(1)}%`}
                    />
                    <BenchmarkReference
                        title="Avg Interview Rate"
                        value={`${benchmarks.adjustedForExperience?.avgInterviewRate?.toFixed(1)}%`}
                        topValue={`${benchmarks.adjustedForExperience?.topPerformerInterviewRate?.toFixed(1)}%`}
                    />
                    <BenchmarkReference
                        title="Avg Offer Rate"
                        value={`${benchmarks.adjustedForExperience?.avgOfferRate?.toFixed(1)}%`}
                        topValue={`${benchmarks.adjustedForExperience?.topPerformerOfferRate?.toFixed(1)}%`}
                    />
                    <BenchmarkReference
                        title="Avg Applications/Month"
                        value={benchmarks.adjustedForExperience?.avgApplicationsPerMonth}
                    />
                    <BenchmarkReference
                        title="Avg Skills Count"
                        value={benchmarks.adjustedForExperience?.avgSkillsCount}
                    />
                    <BenchmarkReference
                        title="Avg Time to Offer"
                        value={`${benchmarks.adjustedForExperience?.avgTimeToOffer} days`}
                    />
                </div>
                <p className="text-sm text-gray-500 mt-4 italic">
                    * Benchmarks are adjusted for your experience level
                </p>
            </Card>
        </div>
    );
}

function BenchmarkBar({ label, unit, user, benchmark, topPerformer, status, percentile }) {
    const maxValue = Math.max(user, topPerformer) * 1.2;
    const userWidth = (user / maxValue) * 100;
    const benchmarkPos = (benchmark / maxValue) * 100;
    const topPos = (topPerformer / maxValue) * 100;

    const getBarColor = () => {
        switch (status) {
            case 'top_performer': return 'bg-green-500';
            case 'above_average': return 'bg-blue-500';
            case 'average': return 'bg-yellow-500';
            default: return 'bg-red-500';
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">{label}</span>
                <span className="text-sm text-gray-500">
                    You: <span className="font-bold text-gray-900">{user}{unit}</span>
                    {' | '}
                    Avg: {benchmark}{unit}
                    {' | '}
                    Top: {topPerformer}{unit}
                </span>
            </div>
            <div className="relative h-8 bg-gray-100 rounded-full overflow-visible">
                {/* User bar */}
                <div
                    className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${getBarColor()}`}
                    style={{ width: `${Math.min(userWidth, 100)}%` }}
                />
                {/* Benchmark marker */}
                <div
                    className="absolute top-0 h-full w-0.5 bg-gray-400"
                    style={{ left: `${benchmarkPos}%` }}
                    title={`Average: ${benchmark}${unit}`}
                />
                {/* Top performer marker */}
                <div
                    className="absolute top-0 h-full w-0.5 bg-green-600"
                    style={{ left: `${topPos}%` }}
                    title={`Top Performer: ${topPerformer}${unit}`}
                />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
                <span>Percentile: {percentile}th</span>
                <span className={`font-medium ${status === 'top_performer' ? 'text-green-600' :
                        status === 'above_average' ? 'text-blue-600' :
                            status === 'average' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                    {status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </span>
            </div>
        </div>
    );
}

function BenchmarkReference({ title, value, topValue }) {
    return (
        <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">{title}</p>
            <p className="text-xl font-bold text-gray-900">{value}</p>
            {topValue && (
                <p className="text-xs text-green-600 mt-1">Top: {topValue}</p>
            )}
        </div>
    );
}

// ============================================================================
// Skills Tab
// ============================================================================
function SkillsTab({ skillGapAnalysis }) {
    if (!skillGapAnalysis) return null;

    const { matchScore, matchingSkills, partialMatches, missingSkills, topPriorityGaps, learningPath, estimatedTimeToClose } = skillGapAnalysis;

    return (
        <div className="space-y-6">
            {/* Match Score */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h3 className="text-lg font-semibold text-blue-800 mb-2">🎯 Skill Match Score</h3>
                        <p className="text-gray-600">How well your skills align with industry demand</p>
                    </div>
                    <div className="text-center">
                        <div className="text-5xl font-bold text-blue-600">{matchScore}%</div>
                        <p className="text-sm text-gray-500">Match with in-demand skills</p>
                    </div>
                </div>
                {topPriorityGaps.length > 0 && (
                    <div className="mt-4 p-3 bg-orange-100 rounded-lg">
                        <p className="text-sm text-orange-800">
                            ⚡ Estimated time to close priority gaps: <strong>{estimatedTimeToClose}</strong>
                        </p>
                    </div>
                )}
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Matching Skills */}
                <Card>
                    <h3 className="text-lg font-semibold mb-4 text-green-700">✅ Skills You Have</h3>
                    <div className="space-y-2">
                        {matchingSkills.length > 0 ? matchingSkills.map((skill, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                                <span className="font-medium text-green-800">{skill.skill}</span>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded text-xs ${skill.priority === 'High' ? 'bg-green-200 text-green-800' :
                                            skill.priority === 'Medium' ? 'bg-blue-200 text-blue-800' :
                                                'bg-gray-200 text-gray-800'
                                        }`}>
                                        {skill.priority} Priority
                                    </span>
                                    <span className="text-sm text-green-600">{skill.level}</span>
                                </div>
                            </div>
                        )) : (
                            <p className="text-gray-500 italic">Add skills to your profile</p>
                        )}
                    </div>
                </Card>

                {/* Missing Skills */}
                <Card>
                    <h3 className="text-lg font-semibold mb-4 text-red-700">❌ Skills to Develop</h3>
                    <div className="space-y-2">
                        {missingSkills.length > 0 ? missingSkills.slice(0, 8).map((skill, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                                <span className="font-medium text-red-800">{skill.skill}</span>
                                <span className={`px-2 py-0.5 rounded text-xs ${skill.priority === 'High' ? 'bg-red-200 text-red-800' :
                                        skill.priority === 'Medium' ? 'bg-orange-200 text-orange-800' :
                                            'bg-gray-200 text-gray-800'
                                    }`}>
                                    {skill.priority}
                                </span>
                            </div>
                        )) : (
                            <p className="text-green-600">🎉 You have all key skills!</p>
                        )}
                    </div>
                </Card>
            </div>

            {/* Learning Path */}
            {learningPath && learningPath.length > 0 && (
                <Card>
                    <h3 className="text-lg font-semibold mb-4">📚 Recommended Learning Path</h3>
                    <div className="space-y-4">
                        {learningPath.map((item, idx) => (
                            <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">
                                        {item.order}
                                    </span>
                                    <div>
                                        <h4 className="font-semibold text-gray-900">{item.skill}</h4>
                                        <p className="text-sm text-gray-500">Estimated time: {item.timeEstimate}</p>
                                    </div>
                                </div>
                                <div className="ml-11">
                                    <p className="text-sm text-gray-700 mb-2">{item.resources[0]}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {item.milestones.map((milestone, mIdx) => (
                                            <span key={mIdx} className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                                                {milestone}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Partial Matches */}
            {partialMatches && partialMatches.length > 0 && (
                <Card>
                    <h3 className="text-lg font-semibold mb-4 text-yellow-700">🔄 Related Skills</h3>
                    <p className="text-sm text-gray-600 mb-4">You have related skills that partially match industry demands</p>
                    <div className="flex flex-wrap gap-2">
                        {partialMatches.map((skill, idx) => (
                            <span key={idx} className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                                {skill.skill} ↔ {skill.relatedUserSkill}
                            </span>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
}

// ============================================================================
// Positioning Tab
// ============================================================================
function PositioningTab({ positioning, marketPositioning }) {
    if (!positioning || !marketPositioning) return null;

    return (
        <div className="space-y-6">
            {/* Overall Position */}
            <Card className={`${positioning.overallPosition?.level === 'Strong' ? 'bg-green-50 border-green-200' :
                    positioning.overallPosition?.level === 'Good' ? 'bg-blue-50 border-blue-200' :
                        positioning.overallPosition?.level === 'Average' ? 'bg-yellow-50 border-yellow-200' :
                            'bg-orange-50 border-orange-200'
                }`}>
                <div className="flex items-center gap-4">
                    <div className={`text-4xl ${positioning.overallPosition?.level === 'Strong' ? '🏆' :
                            positioning.overallPosition?.level === 'Good' ? '⭐' :
                                positioning.overallPosition?.level === 'Average' ? '📊' : '📈'
                        }`}></div>
                    <div>
                        <h3 className="text-xl font-bold">
                            {positioning.overallPosition?.level} Competitive Position
                        </h3>
                        <p className="text-gray-600">{positioning.overallPosition?.description}</p>
                    </div>
                </div>
            </Card>

            {/* Competitive Advantages */}
            {positioning.competitiveAdvantages?.length > 0 && (
                <Card>
                    <h3 className="text-lg font-semibold mb-4">🏅 Your Competitive Advantages</h3>
                    <ul className="space-y-2">
                        {positioning.competitiveAdvantages.map((advantage, idx) => (
                            <li key={idx} className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                                <span className="text-green-500">✓</span>
                                <span className="text-green-800">{advantage}</span>
                            </li>
                        ))}
                    </ul>
                </Card>
            )}

            {/* Positioning Statement */}
            <Card className="bg-gradient-to-r from-indigo-50 to-purple-50">
                <h3 className="text-lg font-semibold mb-4 text-indigo-800">💬 Your Positioning Statement</h3>
                <blockquote className="text-lg text-indigo-700 italic border-l-4 border-indigo-400 pl-4">
                    "{marketPositioning.positioningStatement}"
                </blockquote>
            </Card>

            {/* Key Messages */}
            <Card>
                <h3 className="text-lg font-semibold mb-4">📢 Key Messages to Highlight</h3>
                <ul className="space-y-2">
                    {marketPositioning.keyMessages?.map((message, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            <span className="text-gray-700">{message}</span>
                        </li>
                    ))}
                </ul>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Networking Strategy */}
                <Card>
                    <h3 className="text-lg font-semibold mb-4">🤝 Networking Strategy</h3>
                    <ul className="space-y-2">
                        {marketPositioning.networkingStrategy?.map((strategy, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-gray-700">
                                <span className="text-purple-500 mt-1">→</span>
                                {strategy}
                            </li>
                        ))}
                    </ul>
                </Card>

                {/* Content Strategy */}
                <Card>
                    <h3 className="text-lg font-semibold mb-4">✍️ Content Strategy</h3>
                    <ul className="space-y-2">
                        {marketPositioning.contentStrategy?.map((strategy, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-gray-700">
                                <span className="text-blue-500 mt-1">→</span>
                                {strategy}
                            </li>
                        ))}
                    </ul>
                </Card>
            </div>

            {/* Target Roles */}
            <Card>
                <h3 className="text-lg font-semibold mb-4">🎯 Target Role Guidance</h3>
                <ul className="space-y-2">
                    {marketPositioning.targetRoles?.map((role, idx) => (
                        <li key={idx} className="p-3 bg-gray-50 rounded-lg text-gray-700">
                            {role}
                        </li>
                    ))}
                </ul>
            </Card>
        </div>
    );
}

// ============================================================================
// Career Tab
// ============================================================================
function CareerTab({ careerProgression }) {
    if (!careerProgression) return null;

    const { currentLevel, nextLevel, readinessScore, readinessFactors, successPatterns, recommendations, milestones } = careerProgression;

    return (
        <div className="space-y-6">
            {/* Career Level Progress */}
            <Card className="bg-gradient-to-r from-blue-50 to-cyan-50">
                <div className="flex items-center justify-between flex-wrap gap-6">
                    <div>
                        <h3 className="text-lg font-semibold text-blue-800">🚀 Career Progression</h3>
                        <div className="flex items-center gap-4 mt-4">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                    {currentLevel}
                                </div>
                                <p className="text-sm text-gray-500 mt-1">Current</p>
                            </div>
                            <div className="text-3xl text-gray-300">→</div>
                            {nextLevel && (
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-bold text-lg border-2 border-dashed border-gray-400">
                                        {nextLevel}
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">Next</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-5xl font-bold text-blue-600">{readinessScore}%</div>
                        <p className="text-sm text-gray-500">Readiness for {nextLevel || 'advancement'}</p>
                    </div>
                </div>
            </Card>

            {/* Readiness Factors */}
            <Card>
                <h3 className="text-lg font-semibold mb-4">📋 Readiness Assessment</h3>
                <div className="space-y-4">
                    {readinessFactors?.map((factor, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <span className={`w-8 h-8 rounded-full flex items-center justify-center ${factor.ready ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                                    }`}>
                                    {factor.ready ? '✓' : '!'}
                                </span>
                                <div>
                                    <p className="font-medium">{factor.factor}</p>
                                    <p className="text-sm text-gray-500">
                                        {factor.current} / {factor.required} required
                                    </p>
                                </div>
                            </div>
                            {factor.gap > 0 && (
                                <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                                    Need {factor.gap} more
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </Card>

            {/* Career Milestones */}
            <Card>
                <h3 className="text-lg font-semibold mb-4">🏁 Career Milestones</h3>
                <div className="space-y-3">
                    {milestones?.map((milestone, idx) => (
                        <div key={idx} className={`flex items-center gap-3 p-3 rounded-lg ${milestone.status === 'completed' ? 'bg-green-50' : 'bg-gray-50'
                            }`}>
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${milestone.status === 'completed'
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-300 text-gray-600'
                                }`}>
                                {milestone.status === 'completed' ? '✓' : idx + 1}
                            </span>
                            <span className={milestone.status === 'completed' ? 'text-green-800' : 'text-gray-700'}>
                                {milestone.milestone}
                            </span>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Success Patterns */}
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50">
                <h3 className="text-lg font-semibold mb-4 text-purple-800">⭐ Success Patterns for {currentLevel} Level</h3>
                <ul className="space-y-2">
                    {successPatterns?.map((pattern, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-purple-700">
                            <span className="mt-1">→</span>
                            {pattern}
                        </li>
                    ))}
                </ul>
            </Card>

            {/* Progression Recommendations */}
            {recommendations?.length > 0 && (
                <Card>
                    <h3 className="text-lg font-semibold mb-4">💡 Advancement Recommendations</h3>
                    <div className="space-y-3">
                        {recommendations.filter(r => r.priority !== 'Low').map((rec, idx) => (
                            <div key={idx} className={`p-4 rounded-lg border-l-4 ${rec.priority === 'High' ? 'border-red-500 bg-red-50' :
                                    rec.priority === 'Medium' ? 'border-yellow-500 bg-yellow-50' :
                                        'border-blue-500 bg-blue-50'
                                }`}>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${rec.priority === 'High' ? 'bg-red-200 text-red-800' :
                                            rec.priority === 'Medium' ? 'bg-yellow-200 text-yellow-800' :
                                                'bg-blue-200 text-blue-800'
                                        }`}>
                                        {rec.priority}
                                    </span>
                                    <span className="text-sm text-gray-500">{rec.timeline}</span>
                                </div>
                                <p className="font-medium text-gray-800">{rec.action}</p>
                                <p className="text-sm text-gray-600 mt-1">{rec.impact}</p>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
}

// ============================================================================
// Recommendations Tab
// ============================================================================
function RecommendationsTab({ recommendations, strategies }) {
    if (!recommendations) return null;

    const priorityGroups = {
        High: recommendations.filter(r => r.priority === 'High'),
        Medium: recommendations.filter(r => r.priority === 'Medium'),
        Low: recommendations.filter(r => r.priority === 'Low'),
    };

    return (
        <div className="space-y-6">
            {/* Priority Recommendations */}
            {Object.entries(priorityGroups).map(([priority, recs]) => (
                recs.length > 0 && (
                    <div key={priority}>
                        <h3 className={`text-lg font-semibold mb-4 ${priority === 'High' ? 'text-red-700' :
                                priority === 'Medium' ? 'text-yellow-700' :
                                    'text-blue-700'
                            }`}>
                            {priority === 'High' ? '🔴' : priority === 'Medium' ? '🟡' : '🔵'} {priority} Priority
                        </h3>
                        <div className="space-y-4">
                            {recs.map((rec, idx) => (
                                <Card key={idx} className={`border-l-4 ${priority === 'High' ? 'border-red-500' :
                                        priority === 'Medium' ? 'border-yellow-500' :
                                            'border-blue-500'
                                    }`}>
                                    <div className="flex items-start justify-between gap-4 mb-3">
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase tracking-wide">{rec.category}</span>
                                            <h4 className="text-lg font-semibold text-gray-900">{rec.title}</h4>
                                        </div>
                                        <span className="text-sm text-gray-500 whitespace-nowrap">{rec.timeframe}</span>
                                    </div>
                                    <p className="text-gray-600 mb-4">{rec.description}</p>
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-gray-700">Actions:</p>
                                        <ul className="grid md:grid-cols-2 gap-2">
                                            {rec.actions?.map((action, aIdx) => (
                                                <li key={aIdx} className="flex items-start gap-2 text-sm text-gray-600">
                                                    <span className="text-green-500 mt-0.5">✓</span>
                                                    {action}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    {rec.expectedImpact && (
                                        <div className="mt-4 p-3 bg-green-50 rounded-lg">
                                            <p className="text-sm text-green-700">
                                                <strong>Expected Impact:</strong> {rec.expectedImpact}
                                            </p>
                                        </div>
                                    )}
                                </Card>
                            ))}
                        </div>
                    </div>
                )
            ))}

            {/* Differentiation Strategies */}
            {strategies?.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold mb-4 text-purple-700">✨ Differentiation Strategies</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        {strategies.map((strategy, idx) => (
                            <Card key={idx} className="bg-gradient-to-br from-purple-50 to-indigo-50">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${strategy.type === 'leverage_strength' ? 'bg-green-200 text-green-800' :
                                            strategy.type === 'specialization' ? 'bg-blue-200 text-blue-800' :
                                                'bg-purple-200 text-purple-800'
                                        }`}>
                                        {strategy.type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                    </span>
                                </div>
                                <h4 className="font-semibold text-gray-900 mb-2">{strategy.title}</h4>
                                <p className="text-sm text-gray-600 mb-3">{strategy.description}</p>
                                <div className="space-y-1">
                                    {strategy.tactics?.map((tactic, tIdx) => (
                                        <p key={tIdx} className="text-xs text-gray-500 flex items-center gap-1">
                                            <span>→</span> {tactic}
                                        </p>
                                    ))}
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
