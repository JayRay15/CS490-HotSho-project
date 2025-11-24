import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUpcomingPredictions, getAnalytics, recalculatePrediction } from "../api/interviewPredictions";
import { ArrowLeft, RefreshCw, TrendingUp, Target, CheckCircle, AlertCircle, Award, BarChart3 } from "lucide-react";

export default function InterviewSuccessPredictions() {
  const navigate = useNavigate();
  const [predictions, setPredictions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recalculating, setRecalculating] = useState(null);
  const [selectedView, setSelectedView] = useState("predictions"); // predictions | analytics

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [predictionsRes, analyticsRes] = await Promise.all([
        getUpcomingPredictions(),
        getAnalytics().catch(() => ({ data: { data: null } })), // Analytics might not exist yet
      ]);

      setPredictions(predictionsRes.data?.data?.predictions || []);
      setAnalytics(analyticsRes.data?.data || null);
    } catch (err) {
      console.error("Error fetching predictions:", err);
      setError(err.response?.data?.message || "Failed to load predictions");
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async (interviewId) => {
    setRecalculating(interviewId);
    try {
      await recalculatePrediction(interviewId);
      await fetchData(); // Refresh data
    } catch (err) {
      console.error("Error recalculating prediction:", err);
      alert("Failed to recalculate prediction");
    } finally {
      setRecalculating(null);
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

  const getConfidenceLabel = (score) => {
    if (score >= 80) return "Very High";
    if (score >= 60) return "High";
    if (score >= 40) return "Medium";
    return "Low";
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading predictions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </button>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Interview Success Predictions
              </h1>
              <p className="mt-2 text-gray-600">
                AI-powered predictions to optimize your interview preparation
              </p>
            </div>
            <button
              onClick={fetchData}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Predictions View */}
        <div>
            {predictions.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Upcoming Interviews
                </h3>
                <p className="text-gray-600 mb-6">
                  Schedule interviews to see success predictions and personalized recommendations.
                </p>
                <button
                  onClick={() => navigate("/interviews")}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  View Interviews
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Upcoming</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {predictions.length}
                        </p>
                      </div>
                      <div className="bg-blue-100 rounded-full p-3">
                        <Target className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Highest Success Rate</p>
                        <p className="text-2xl font-bold text-green-600 mt-1">
                          {predictions.length > 0
                            ? `${Math.max(...predictions.map((p) => p.successProbability))}%`
                            : "N/A"}
                        </p>
                      </div>
                      <div className="bg-green-100 rounded-full p-3">
                        <TrendingUp className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Avg Success Rate</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {predictions.length > 0
                            ? `${Math.round(
                                predictions.reduce((sum, p) => sum + p.successProbability, 0) /
                                  predictions.length
                              )}%`
                            : "N/A"}
                        </p>
                      </div>
                      <div className="bg-purple-100 rounded-full p-3">
                        <BarChart3 className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Predictions List */}
                <div className="space-y-4">
                  {predictions.map((prediction) => (
                    <div
                      key={prediction._id}
                      className={`bg-white rounded-lg shadow-sm border-2 p-6 hover:shadow-md transition-shadow cursor-pointer ${getSuccessBgColor(
                        prediction.successProbability
                      )}`}
                      onClick={() => navigate(`/interview-predictions/${prediction.interviewId._id}`)}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {prediction.interviewId?.title || "Interview"}
                          </h3>
                          <p className="text-gray-600 mt-1">
                            {prediction.interviewId?.company} •{" "}
                            {prediction.interviewId?.interviewType}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {formatDate(prediction.interviewId?.scheduledDate)}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRecalculate(prediction.interviewId._id);
                          }}
                          disabled={recalculating === prediction.interviewId._id}
                          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                          title="Recalculate prediction"
                        >
                          <RefreshCw
                            className={`h-5 w-5 ${
                              recalculating === prediction.interviewId._id ? "animate-spin" : ""
                            }`}
                          />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Success Probability */}
                        <div className="text-center p-4 bg-white rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Success Probability</p>
                          <p className={`text-3xl font-bold ${getSuccessColor(prediction.successProbability)}`}>
                            {prediction.successProbability}%
                          </p>
                          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
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

                        {/* Confidence Score */}
                        <div className="text-center p-4 bg-white rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Confidence</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {getConfidenceLabel(prediction.confidenceScore)}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {prediction.confidenceScore}% data complete
                          </p>
                        </div>

                        {/* Recommendations */}
                        <div className="text-center p-4 bg-white rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Action Items</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {prediction.recommendations?.filter((r) => !r.completed).length || 0}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {prediction.recommendations?.filter((r) => r.priority === "High" && !r.completed)
                              .length || 0}{" "}
                            high priority
                          </p>
                        </div>
                      </div>

                      {/* Top Recommendations Preview */}
                      {prediction.recommendations &&
                        prediction.recommendations.filter((r) => !r.completed).length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <p className="text-sm font-semibold text-gray-700 mb-2">
                              Top Recommendations:
                            </p>
                            <div className="space-y-1">
                              {prediction.recommendations
                                .filter((r) => !r.completed)
                                .slice(0, 2)
                                .map((rec, idx) => (
                                  <div key={idx} className="flex items-start">
                                    <span
                                      className={`text-xs px-2 py-1 rounded mr-2 ${
                                        rec.priority === "High"
                                          ? "bg-red-100 text-red-700"
                                          : "bg-yellow-100 text-yellow-700"
                                      }`}
                                    >
                                      {rec.priority}
                                    </span>
                                    <p className="text-sm text-gray-700">{rec.title}</p>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
      </div>
    </div>
  );
}
