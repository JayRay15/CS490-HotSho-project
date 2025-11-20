import React, { useState, useEffect } from 'react';
import { 
  getPerformanceTracking, 
  getPracticeSessions, 
  compareSessions,
  updateNerveManagement 
} from '../api/writingPractice';
import { 
  TrendingUp, 
  TrendingDown, 
  Award, 
  Target, 
  Clock, 
  CheckCircle,
  BarChart2,
  Calendar,
  Brain
} from 'lucide-react';
import Card from './Card';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

const WritingPracticePerformance = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [selectedSessions, setSelectedSessions] = useState([]);
  
  // Nerve management
  const [showNerveTracking, setShowNerveTracking] = useState(false);
  const [confidenceLevel, setConfidenceLevel] = useState(5);
  const [preparednessLevel, setPreparednessLevel] = useState(5);

  useEffect(() => {
    loadPerformanceData();
  }, []);

  const loadPerformanceData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [perfData, sessionsData] = await Promise.all([
        getPerformanceTracking(),
        getPracticeSessions({ limit: 10, completed: true })
      ]);
      
      setPerformance(perfData);
      setRecentSessions(sessionsData.sessions);
      
      if (perfData.nerveManagementProgress) {
        setConfidenceLevel(perfData.nerveManagementProgress.confidenceLevel || 5);
        setPreparednessLevel(perfData.nerveManagementProgress.preparednessLevel || 5);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async () => {
    if (selectedSessions.length < 2) {
      setError('Please select at least 2 sessions to compare');
      return;
    }
    
    try {
      const comparisonData = await compareSessions(selectedSessions);
      setComparison(comparisonData);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to compare sessions');
    }
  };

  const handleUpdateNerveManagement = async () => {
    try {
      await updateNerveManagement({
        confidenceLevel,
        preparednessLevel
      });
      await loadPerformanceData();
      setShowNerveTracking(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update nerve management');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!performance) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <p className="text-gray-600 text-center py-8">
            No performance data available yet. Complete a practice session to get started!
          </p>
        </Card>
      </div>
    );
  }

  // Prepare chart data
  const improvementData = performance.improvementTrend?.map((item, idx) => ({
    session: idx + 1,
    score: item.score,
    date: new Date(item.date).toLocaleDateString()
  })) || [];

  const categoryData = performance.categoryPerformance?.map(cp => ({
    category: cp.category,
    score: cp.averageScore,
    questions: cp.questionsAnswered
  })) || [];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {error && <ErrorMessage message={error} onClose={() => setError(null)} />}

      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Award className="w-6 h-6 text-blue-600" />}
          label="Average Score"
          value={performance.averageScore?.toFixed(1) || 0}
          suffix="/100"
          trend={performance.improvementTrend?.length > 1 ? 
            performance.improvementTrend[performance.improvementTrend.length - 1].score - 
            performance.improvementTrend[0].score : 0}
        />
        <StatCard
          icon={<CheckCircle className="w-6 h-6 text-green-600" />}
          label="Sessions Completed"
          value={performance.totalSessions}
        />
        <StatCard
          icon={<Target className="w-6 h-6 text-purple-600" />}
          label="Questions Answered"
          value={performance.totalQuestionsAnswered}
        />
        <StatCard
          icon={<Clock className="w-6 h-6 text-orange-600" />}
          label="Total Practice Time"
          value={Math.round(performance.totalTimeSpent / 60)}
          suffix=" min"
        />
      </div>

      {/* Performance Trend */}
      {improvementData.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Performance Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={improvementData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="session" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#3B82F6" 
                strokeWidth={2}
                name="Score"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Category Performance */}
      {categoryData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-purple-600" />
              Category Performance
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="score" fill="#8B5CF6" name="Average Score" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              Strengths & Improvements
            </h3>
            
            {performance.strengthCategories && performance.strengthCategories.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-2">💪 Strength Areas</h4>
                <div className="flex flex-wrap gap-2">
                  {performance.strengthCategories.map((cat, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {performance.improvementCategories && performance.improvementCategories.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">🎯 Focus Areas</h4>
                <div className="flex flex-wrap gap-2">
                  {performance.improvementCategories.map((cat, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Nerve Management */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-600" />
            Confidence & Preparedness Tracking
          </h3>
          <Button
            onClick={() => setShowNerveTracking(!showNerveTracking)}
            variant="secondary"
            size="sm"
          >
            {showNerveTracking ? 'Hide' : 'Update'}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Confidence Level</span>
              <span className="text-2xl font-bold text-indigo-600">
                {performance.nerveManagementProgress?.confidenceLevel || 5}/10
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-indigo-600 h-3 rounded-full transition-all"
                style={{ width: `${(performance.nerveManagementProgress?.confidenceLevel || 5) * 10}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Preparedness Level</span>
              <span className="text-2xl font-bold text-blue-600">
                {performance.nerveManagementProgress?.preparednessLevel || 5}/10
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all"
                style={{ width: `${(performance.nerveManagementProgress?.preparednessLevel || 5) * 10}%` }}
              />
            </div>
          </div>
        </div>

        {showNerveTracking && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confidence Level: {confidenceLevel}/10
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={confidenceLevel}
                onChange={(e) => setConfidenceLevel(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preparedness Level: {preparednessLevel}/10
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={preparednessLevel}
                onChange={(e) => setPreparednessLevel(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <Button onClick={handleUpdateNerveManagement} variant="primary" size="sm">
              Save Update
            </Button>
          </div>
        )}

        {performance.nerveManagementProgress?.techniques && 
         performance.nerveManagementProgress.techniques.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium text-gray-700 mb-2">Techniques Used</h4>
            <div className="space-y-2">
              {performance.nerveManagementProgress.techniques.map((tech, idx) => (
                <div key={idx} className="flex items-center justify-between bg-white border border-gray-200 rounded p-3">
                  <span className="text-sm text-gray-700">{tech.technique}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      Effectiveness: {tech.effectiveness}/10
                    </span>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${tech.effectiveness * 10}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Recent Sessions */}
      {recentSessions.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-600" />
            Recent Practice Sessions
          </h3>
          
          <div className="space-y-3">
            {recentSessions.map((session) => (
              <div
                key={session._id}
                className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={selectedSessions.includes(session._id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSessions([...selectedSessions, session._id]);
                      } else {
                        setSelectedSessions(selectedSessions.filter(id => id !== session._id));
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <div>
                    <div className="font-medium text-gray-900">
                      {session.sessionType}
                      {session.targetRole && ` - ${session.targetRole}`}
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(session.createdAt).toLocaleDateString()} • {session.responses.length} questions
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {session.sessionScore?.toFixed(1) || 0}
                    </div>
                    <div className="text-xs text-gray-500">Score</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selectedSessions.length >= 2 && (
            <div className="mt-4">
              <Button onClick={handleCompare} variant="primary">
                Compare Selected Sessions ({selectedSessions.length})
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Session Comparison */}
      {comparison && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Comparison</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {comparison.trends.scoreImprovement > 0 ? '+' : ''}
                {comparison.trends.scoreImprovement.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Score Change</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {comparison.trends.timeEfficiency.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Time Efficiency</div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-1">
                {comparison.trends.consistency.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Consistency</div>
            </div>
          </div>

          {comparison.insights && comparison.insights.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">Key Insights</h4>
              <ul className="space-y-2">
                {comparison.insights.map((insight, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-700">
                    <span className="text-blue-600 mt-1">📊</span>
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {comparison.recommendations && comparison.recommendations.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Recommendations</h4>
              <ul className="space-y-2">
                {comparison.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-700 bg-yellow-50 border border-yellow-200 rounded p-3">
                    <span className="text-yellow-600 mt-0.5">💡</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

// Helper component for stat cards
const StatCard = ({ icon, label, value, suffix = '', trend }) => (
  <Card className="p-4">
    <div className="flex items-center justify-between mb-2">
      {icon}
      {trend !== undefined && trend !== 0 && (
        <div className={`flex items-center gap-1 text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
          {trend > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          <span>{trend > 0 ? '+' : ''}{trend.toFixed(1)}</span>
        </div>
      )}
    </div>
    <div className="text-2xl font-bold text-gray-900 mb-1">
      {value}{suffix}
    </div>
    <div className="text-sm text-gray-600">{label}</div>
  </Card>
);

export default WritingPracticePerformance;
