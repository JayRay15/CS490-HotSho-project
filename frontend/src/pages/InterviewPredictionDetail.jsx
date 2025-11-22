import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getPrediction,
  recalculatePrediction,
} from "../api/interviewPredictions";
import {
  ArrowLeft,
  RefreshCw,
  TrendingUp,
  Target,
  CheckCircle,
  Clock,
  AlertCircle,
  Award,
  BookOpen,
  Briefcase,
  Code,
  MessageSquare,
  FileText,
  BarChart3,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function InterviewPredictionDetail() {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recalculating, setRecalculating] = useState(false);
  const [expandedSection, setExpandedSection] = useState("recommendations");

  useEffect(() => {
    fetchPrediction();
  }, [interviewId]);

  const fetchPrediction = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getPrediction(interviewId);
      setPrediction(response.data?.data?.prediction);
    } catch (err) {
      console.error("Error fetching prediction:", err);
      setError(err.response?.data?.message || "Failed to load prediction");
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      await recalculatePrediction(interviewId);
      await fetchPrediction();
    } catch (err) {
      console.error("Error recalculating:", err);
      alert("Failed to recalculate prediction");
    } finally {
      setRecalculating(false);
    }
  };

  const getSuccessColor = (probability) => {
    if (probability >= 75) return "text-green-600";
    if (probability >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getSuccessBgColor = (probability) => {
    if (probability >= 75) return "bg-green-50 border-green-200";
    if (probability >= 50) return "bg-yellow-50 border-yellow-200";
    return "bg-red-50 border-red-200";
  };

  const getCategoryIcon = (category) => {
    const iconClass = "h-5 w-5";
    switch (category) {
      case "Company Research":
        return <BookOpen className={iconClass} />;
      case "Technical Skills":
        return <Code className={iconClass} />;
      case "Behavioral Practice":
        return <MessageSquare className={iconClass} />;
      case "Mock Interviews":
        return <Briefcase className={iconClass} />;
      case "Resume":
        return <FileText className={iconClass} />;
      default:
        return <Target className={iconClass} />;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading prediction...</p>
        </div>
      </div>
    );
  }

  if (error || !prediction) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </button>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
            <p className="text-center text-red-800">{error || "Prediction not found"}</p>
          </div>
        </div>
      </div>
    );
  }

  const interview = prediction.interviewId;
  const job = prediction.jobId;
  const factors = prediction.preparationFactors;
  const performance = prediction.performancePattern;
  const recommendations = prediction.recommendations || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Predictions
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {interview?.title || "Interview"}
              </h1>
              <p className="text-xl text-gray-600 mt-2">
                {interview?.company} • {interview?.interviewType}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Scheduled: {formatDate(interview?.scheduledDate)}
              </p>
            </div>
            <button
              onClick={handleRecalculate}
              disabled={recalculating}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${recalculating ? "animate-spin" : ""}`} />
              {recalculating ? "Recalculating..." : "Recalculate"}
            </button>
          </div>
        </div>

        {/* Success Probability Card */}
        <div className={`rounded-lg border-2 p-8 mb-6 ${getSuccessBgColor(prediction.successProbability)}`}>
          <div className="text-center mb-6">
            <p className="text-lg text-gray-700 mb-2">Interview Success Probability</p>
            <p className={`text-6xl font-bold ${getSuccessColor(prediction.successProbability)}`}>
              {prediction.successProbability}%
            </p>
            <div className="mt-4 max-w-md mx-auto">
              <div className="w-full bg-white rounded-full h-4 shadow-inner">
                <div
                  className={`h-4 rounded-full ${
                    prediction.successProbability >= 75
                      ? "bg-green-600"
                      : prediction.successProbability >= 50
                      ? "bg-yellow-600"
                      : "bg-red-600"
                  }`}
                  style={{ width: `${prediction.successProbability}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 text-center">
              <Award className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Confidence Score</p>
              <p className="text-2xl font-bold text-gray-900">{prediction.confidenceScore}%</p>
            </div>
            
            {prediction.comparisonData && (
              <>
                <div className="bg-white rounded-lg p-4 text-center">
                  <TrendingUp className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Ranking</p>
                  <p className="text-2xl font-bold text-gray-900">
                    #{prediction.comparisonData.rankAmongUpcoming}
                  </p>
                  <p className="text-xs text-gray-500">
                    of {prediction.comparisonData.totalUpcomingInterviews}
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4 text-center">
                  <BarChart3 className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Percentile</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {prediction.comparisonData.percentile}th
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Recommendations Section */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <button
            onClick={() => toggleSection("recommendations")}
            className="w-full flex justify-between items-center p-6 hover:bg-gray-50 transition-colors"
          >
            <h2 className="text-xl font-semibold text-gray-900">
              Prioritized Recommendations ({recommendations.filter(r => !r.completed).length} active)
            </h2>
            {expandedSection === "recommendations" ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </button>

          {expandedSection === "recommendations" && (
            <div className="p-6 pt-0 space-y-4">
              {recommendations.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No recommendations available. Your preparation is complete!
                </p>
              ) : (
                recommendations.map((rec) => (
                  <div
                    key={rec._id}
                    className={`border-2 rounded-lg p-4 ${
                      rec.completed
                        ? "bg-gray-50 border-gray-200 opacity-60"
                        : rec.priority === "High"
                        ? "border-red-200 bg-red-50"
                        : rec.priority === "Medium"
                        ? "border-yellow-200 bg-yellow-50"
                        : "border-blue-200 bg-blue-50"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-start space-x-3 flex-1">
                        <div
                          className={`p-2 rounded-lg ${
                            rec.completed
                              ? "bg-gray-200"
                              : rec.priority === "High"
                              ? "bg-red-100"
                              : rec.priority === "Medium"
                              ? "bg-yellow-100"
                              : "bg-blue-100"
                          }`}
                        >
                          {getCategoryIcon(rec.category)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span
                              className={`text-xs px-2 py-1 rounded font-semibold ${
                                rec.priority === "High"
                                  ? "bg-red-600 text-white"
                                  : rec.priority === "Medium"
                                  ? "bg-yellow-600 text-white"
                                  : "bg-blue-600 text-white"
                              }`}
                            >
                              {rec.priority}
                            </span>
                            <span className="text-xs text-gray-500">{rec.category}</span>
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-1">{rec.title}</h3>
                          <p className="text-sm text-gray-700 mb-2">{rec.description}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-600">
                            <div className="flex items-center">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              <span>+{rec.estimatedImpact}% impact</span>
                            </div>
                            {rec.estimatedTimeMinutes && (
                              <div className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                <span>{rec.estimatedTimeMinutes} minutes</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {rec.completed && (
                        <div className="ml-4 flex items-center text-green-600">
                          <CheckCircle className="h-5 w-5 mr-1" />
                          <span className="text-sm font-semibold">Completed</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Preparation Factors */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <button
            onClick={() => toggleSection("factors")}
            className="w-full flex justify-between items-center p-6 hover:bg-gray-50 transition-colors"
          >
            <h2 className="text-xl font-semibold text-gray-900">Preparation Factors</h2>
            {expandedSection === "factors" ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </button>

          {expandedSection === "factors" && (
            <div className="p-6 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Role Match</span>
                    <span className="text-lg font-bold text-gray-900">
                      {factors.roleMatchScore}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${factors.roleMatchScore}%` }}
                    ></div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Company Research</span>
                    <span className="text-lg font-bold text-gray-900">
                      {factors.companyResearchCompleteness}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${factors.companyResearchCompleteness}%` }}
                    ></div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Technical Prep</span>
                    <span className="text-lg font-bold text-gray-900">
                      {factors.technicalPrepScore}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: `${factors.technicalPrepScore}%` }}
                    ></div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Behavioral Prep</span>
                    <span className="text-lg font-bold text-gray-900">
                      {factors.behavioralPrepScore}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: `${factors.behavioralPrepScore}%` }}
                    ></div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Practice Hours</span>
                    <span className="text-lg font-bold text-gray-900">
                      {factors.practiceHours}h
                    </span>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Mock Interviews</span>
                    <span className="text-lg font-bold text-gray-900">
                      {factors.mockInterviewsCompleted}
                    </span>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Tasks Completed</span>
                    <span className="text-lg font-bold text-gray-900">
                      {factors.preparationTasksCompleted} / {factors.totalPreparationTasks}
                    </span>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Resume & Cover Letter</span>
                    <div className="flex space-x-2">
                      {factors.resumeTailored && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                      {factors.coverLetterSubmitted && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                      {!factors.resumeTailored && !factors.coverLetterSubmitted && (
                        <span className="text-sm text-gray-500">None</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Historical Performance */}
        <div className="bg-white rounded-lg shadow-sm">
          <button
            onClick={() => toggleSection("performance")}
            className="w-full flex justify-between items-center p-6 hover:bg-gray-50 transition-colors"
          >
            <h2 className="text-xl font-semibold text-gray-900">Historical Performance</h2>
            {expandedSection === "performance" ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </button>

          {expandedSection === "performance" && (
            <div className="p-6 pt-0">
              {performance.previousInterviewCount === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No historical interview data available yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="border rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-600 mb-1">Past Interviews</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {performance.previousInterviewCount}
                    </p>
                  </div>

                  <div className="border rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-600 mb-1">Success Rate</p>
                    <p className="text-2xl font-bold text-green-600">
                      {performance.successRate}%
                    </p>
                  </div>

                  <div className="border rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-600 mb-1">Avg Rating</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {performance.averageRating > 0 ? performance.averageRating : "N/A"}
                    </p>
                  </div>

                  <div className="border rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-600 mb-1">Trend</p>
                    <p
                      className={`text-lg font-bold ${
                        performance.improvementTrend === "Improving"
                          ? "text-green-600"
                          : performance.improvementTrend === "Declining"
                          ? "text-red-600"
                          : "text-gray-900"
                      }`}
                    >
                      {performance.improvementTrend}
                    </p>
                  </div>

                  {performance.strongestInterviewType !== "None" && (
                    <div className="border rounded-lg p-4 col-span-full">
                      <p className="text-sm text-gray-600 mb-1">Strongest Interview Type</p>
                      <p className="text-lg font-bold text-blue-600">
                        {performance.strongestInterviewType}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
