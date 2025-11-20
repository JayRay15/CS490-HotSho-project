import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import technicalPrepAPI from '../api/technicalPrep';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import Button from '../components/Button';
import {
  ArrowLeftIcon,
  TrophyIcon,
  ClockIcon,
  FireIcon,
  CheckCircleIcon,
  ChartBarIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

const TechnicalPrepPerformance = () => {
  const navigate = useNavigate();
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPerformance();
  }, []);

  const loadPerformance = async () => {
    try {
      setLoading(true);
      const data = await technicalPrepAPI.getPerformanceAnalytics();
      setPerformance(data.performance);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/technical-prep')}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Technical Prep
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Performance Analytics
          </h1>
          <p className="text-gray-600">
            Track your progress and identify areas for improvement
          </p>
        </div>

        {error && <ErrorMessage message={error} className="mb-6" />}

        {!performance ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <ChartBarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Performance Data Yet</h2>
            <p className="text-gray-600 mb-6">
              Start completing technical challenges to see your performance analytics.
            </p>
            <Button onClick={() => navigate('/technical-prep')}>
              Start Practicing
            </Button>
          </div>
        ) : (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">Total Completed</p>
                  <CheckCircleIcon className="h-8 w-8 text-blue-600 opacity-20" />
                </div>
                <p className="text-3xl font-bold text-blue-600">
                  {performance.totalChallengesCompleted || 0}
                </p>
                <p className="text-sm text-gray-500 mt-1">Challenges</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">Average Score</p>
                  <TrophyIcon className="h-8 w-8 text-green-600 opacity-20" />
                </div>
                <p className="text-3xl font-bold text-green-600">
                  {Math.round(performance.averageScore || 0)}%
                </p>
                <p className="text-sm text-gray-500 mt-1">Success Rate</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">Time Spent</p>
                  <ClockIcon className="h-8 w-8 text-purple-600 opacity-20" />
                </div>
                <p className="text-3xl font-bold text-purple-600">
                  {Math.round((performance.totalTimeSpent || 0) / 60)}h
                </p>
                <p className="text-sm text-gray-500 mt-1">Practice Time</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">Current Streak</p>
                  <FireIcon className="h-8 w-8 text-orange-600 opacity-20" />
                </div>
                <p className="text-3xl font-bold text-orange-600">
                  {performance.currentStreak || 0}
                </p>
                <p className="text-sm text-gray-500 mt-1">Day Streak</p>
              </div>
            </div>

            {/* Category Breakdown */}
            {performance.categoryBreakdown && Object.keys(performance.categoryBreakdown).length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance by Category</h2>
                <div className="space-y-4">
                  {Object.entries(performance.categoryBreakdown).map(([category, data]) => (
                    <div key={category}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-700">{category}</span>
                        <span className="text-sm text-gray-600">
                          {data.completed} completed · {Math.round(data.averageScore)}% avg
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-blue-600 h-3 rounded-full transition-all"
                          style={{ width: `${data.averageScore}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Difficulty Breakdown */}
            {performance.difficultyBreakdown && Object.keys(performance.difficultyBreakdown).length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance by Difficulty</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(performance.difficultyBreakdown).map(([difficulty, data]) => (
                    <div key={difficulty} className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-600 mb-2">{difficulty}</p>
                      <p className="text-2xl font-bold text-gray-900 mb-1">{data.completed}</p>
                      <p className="text-sm text-gray-500">{Math.round(data.averageScore)}% avg</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Activity */}
            {performance.recentSubmissions && performance.recentSubmissions.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
                <div className="space-y-4">
                  {performance.recentSubmissions.map((submission, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <CalendarIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900">{submission.challengeTitle || 'Challenge'}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(submission.submittedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          submission.score >= 80 ? 'text-green-600' :
                          submission.score >= 60 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {Math.round(submission.score)}%
                        </p>
                        <p className="text-sm text-gray-500">
                          {submission.testsPassed}/{submission.totalTests} passed
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strengths and Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              {performance.strengths && performance.strengths.length > 0 && (
                <div className="bg-green-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-green-900 mb-3">💪 Strengths</h3>
                  <ul className="space-y-2">
                    {performance.strengths.map((strength, idx) => (
                      <li key={idx} className="text-green-800 flex items-start">
                        <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2 shrink-0 mt-0.5" />
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {performance.weaknesses && performance.weaknesses.length > 0 && (
                <div className="bg-orange-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-orange-900 mb-3">📈 Areas to Improve</h3>
                  <ul className="space-y-2">
                    {performance.weaknesses.map((weakness, idx) => (
                      <li key={idx} className="text-orange-800 flex items-start">
                        <ChartBarIcon className="h-5 w-5 text-orange-600 mr-2 shrink-0 mt-0.5" />
                        <span>{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TechnicalPrepPerformance;
