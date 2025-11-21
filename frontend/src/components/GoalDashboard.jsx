import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { setAuthToken } from '../api/axios';
import {
  getDashboardSummary,
  getGoalRecommendations,
  getSuccessPatterns,
  formatGoalStatus,
  calculateDaysRemaining
} from '../api/goals';
import Card from './Card';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import toast from 'react-hot-toast';
import {
  Target,
  TrendingUp,
  Award,
  AlertCircle,
  Calendar,
  CheckCircle,
  Sparkles,
  BarChart3,
  Trophy,
  Lightbulb
} from 'lucide-react';

const GoalDashboard = () => {
  const { getToken } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [patterns, setPatterns] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [loadingPatterns, setLoadingPatterns] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      setAuthToken(token);
      const response = await getDashboardSummary();
      setDashboard(response.dashboard);
    } catch (err) {
      console.error('Load Dashboard Error:', err);
      setError(err.message || 'Failed to load dashboard');
      toast.error('Failed to load goal dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendations = async () => {
    try {
      setLoadingRecommendations(true);
      const token = await getToken();
      setAuthToken(token);
      const response = await getGoalRecommendations();
      setRecommendations(response.recommendations);
      toast.success('Goal recommendations generated!');
    } catch (err) {
      console.error('Load Recommendations Error:', err);
      toast.error('Failed to generate recommendations');
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const loadPatterns = async () => {
    try {
      setLoadingPatterns(true);
      const token = await getToken();
      setAuthToken(token);
      const response = await getSuccessPatterns();
      setPatterns(response.patterns);
      toast.success('Success patterns identified!');
    } catch (err) {
      console.error('Load Patterns Error:', err);
      toast.error(err.message || 'Failed to identify patterns');
    } finally {
      setLoadingPatterns(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!dashboard) {
    return <ErrorMessage message="No dashboard data available" />;
  }

  const { stats, activeGoals, recentCompletions, atRiskGoals, upcomingMilestones, totalImpact } = dashboard;

  // Empty state - no goals yet
  if (!stats || stats.total === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Target className="w-8 h-8 text-primary-600" />
              Career Goals
            </h1>
            <p className="text-gray-600 mt-1">Track your progress and achieve your career objectives</p>
          </div>
          <Link to="/goals/new">
            <Button variant="primary" size="md">
              <Target className="w-5 h-5 mr-2" />
              Create Your First Goal
            </Button>
          </Link>
        </div>

        {/* Empty State */}
        <Card className="text-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center">
              <Target className="w-12 h-12 text-primary-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Set Your First Career Goal</h2>
            <p className="text-gray-600 max-w-md">
              Start your journey to career success by creating SMART goals. Track your progress, 
              get AI-powered recommendations, and achieve your objectives.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <Link to="/goals/new">
                <Button variant="primary" size="lg">
                  <Target className="w-5 h-5 mr-2" />
                  Create Goal
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">AI Recommendations</h3>
              <p className="text-sm text-gray-600">
                Get personalized goal suggestions based on your profile and career path
              </p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="w-6 h-6 text-success-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Progress Tracking</h3>
              <p className="text-sm text-gray-600">
                Monitor your progress with milestones, metrics, and visual insights
              </p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Award className="w-6 h-6 text-accent-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Achievement Celebration</h3>
              <p className="text-sm text-gray-600">
                Celebrate your successes and learn from your achievement patterns
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Target className="w-8 h-8 text-primary-600" />
            Career Goals
          </h1>
          <p className="text-gray-600 mt-1">Track your progress and achieve your career objectives</p>
        </div>
        <Link to="/goals/new">
          <Button variant="primary" size="md">
            <Target className="w-5 h-5 mr-2" />
            Create New Goal
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-primary-700">Total Goals</p>
              <p className="text-3xl font-bold text-primary-900 mt-1">{stats.total}</p>
            </div>
            <Target className="w-10 h-10 text-primary-600 opacity-50 flex-shrink-0 ml-2" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-success-50 to-success-100 border-success-200">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-success-700">Completed</p>
              <p className="text-3xl font-bold text-success-900 mt-1">{stats.completed}</p>
              <p className="text-xs text-success-600 mt-1">{stats.completionRate}% success rate</p>
            </div>
            <CheckCircle className="w-10 h-10 text-success-600 opacity-50 flex-shrink-0 ml-2" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-accent-50 to-accent-100 border-accent-200">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-accent-700">In Progress</p>
              <p className="text-3xl font-bold text-accent-900 mt-1">{stats.inProgress}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-accent-600 opacity-50 flex-shrink-0 ml-2" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-error-50 to-error-100 border-error-200">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-error-700">At Risk</p>
              <p className="text-3xl font-bold text-error-900 mt-1">{stats.atRisk}</p>
            </div>
            <AlertCircle className="w-10 h-10 text-error-600 opacity-50 flex-shrink-0 ml-2" />
          </div>
        </Card>
      </div>

      {/* Impact Metrics */}
      {totalImpact && (
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-accent-600" />
            Total Career Impact
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="text-center p-2">
              <p className="text-2xl font-bold text-primary-600">{totalImpact.jobApplications}</p>
              <p className="text-sm text-gray-600">Applications</p>
            </div>
            <div className="text-center p-2">
              <p className="text-2xl font-bold text-primary-700">{totalImpact.interviewsSecured}</p>
              <p className="text-sm text-gray-600">Interviews</p>
            </div>
            <div className="text-center p-2">
              <p className="text-2xl font-bold text-success-600">{totalImpact.offersReceived}</p>
              <p className="text-sm text-gray-600">Offers</p>
            </div>
            <div className="text-center p-2">
              <p className="text-2xl font-bold text-accent-600">{totalImpact.skillsAcquired}</p>
              <p className="text-sm text-gray-600">Skills</p>
            </div>
            <div className="text-center p-2">
              <p className="text-2xl font-bold text-primary-500">{totalImpact.connectionsGained}</p>
              <p className="text-sm text-gray-600">Connections</p>
            </div>
          </div>
        </Card>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto">
          {['overview', 'active', 'completed', 'recommendations', 'insights'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`${
                activeTab === tab
                  ? 'border-primary-600 text-primary-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors flex-shrink-0`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* At Risk Goals */}
            {atRiskGoals && atRiskGoals.length > 0 && (
              <Card className="border-red-200 bg-red-50">
                <h2 className="text-lg font-bold text-red-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Goals At Risk ({atRiskGoals.length})
                </h2>
                <div className="space-y-3">
                  {atRiskGoals.map((goal) => (
                    <Link key={goal._id} to={`/goals/${goal._id}`}>
                      <div className="bg-white p-4 rounded-lg border border-red-200 hover:border-red-400 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{goal.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">{goal.category}</p>
                          </div>
                          <div className="text-right">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              {goal.progressPercentage}% Complete
                            </span>
                            <p className="text-xs text-gray-500 mt-1">
                              {calculateDaysRemaining(goal.timeBound?.targetDate)} days left
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </Card>
            )}

            {/* Upcoming Milestones */}
            {upcomingMilestones && upcomingMilestones.length > 0 && (
              <Card>
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary-600" />
                  Upcoming Milestones
                </h2>
                <div className="space-y-3">
                  {upcomingMilestones.slice(0, 5).map((milestone, index) => (
                    <Link key={`${milestone.goalId}-${index}`} to={`/goals/${milestone.goalId}`}>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div>
                          <p className="font-medium text-gray-900">{milestone.milestoneTitle}</p>
                          <p className="text-sm text-gray-600">Goal: {milestone.goalTitle}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(milestone.targetDate).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {calculateDaysRemaining(milestone.targetDate)} days
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </Card>
            )}

            {/* Recent Completions */}
            {recentCompletions && recentCompletions.length > 0 && (
              <Card className="border-green-200 bg-green-50">
                <h2 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Recent Achievements
                </h2>
                <div className="space-y-3">
                  {recentCompletions.map((goal) => (
                    <Link key={goal._id} to={`/goals/${goal._id}`}>
                      <div className="bg-white p-4 rounded-lg border border-green-200 hover:border-green-400 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                              {goal.title}
                              {!goal.celebrated && (
                                <span className="text-xs bg-warning-100 text-warning-800 px-2 py-0.5 rounded-full font-medium">
                                  Celebrate!
                                </span>
                              )}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">{goal.category}</p>
                          </div>
                          <p className="text-sm text-gray-500">
                            {new Date(goal.timeBound?.completedDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Active Goals Tab */}
        {activeTab === 'active' && (
          <div className="space-y-4">
            {activeGoals && activeGoals.length > 0 ? (
              activeGoals.map((goal) => {
                const statusInfo = formatGoalStatus(goal.status);
                const daysLeft = calculateDaysRemaining(goal.timeBound?.targetDate);
                return (
                  <Link key={goal._id} to={`/goals/${goal._id}`}>
                    <Card className="hover:shadow-lg transition-shadow">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                            <h3 className="text-lg font-bold text-gray-900">{goal.title}</h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${
                              goal.status === 'At Risk' ? 'bg-error-100 text-error-800' :
                              goal.status === 'On Track' ? 'bg-success-100 text-success-800' :
                              'bg-primary-100 text-primary-800'
                            }`}>
                              {statusInfo.icon} {statusInfo.text}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{goal.description}</p>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                            <span>{goal.category}</span>
                            <span>•</span>
                            <span>{goal.type}</span>
                            <span>•</span>
                            <span className="font-medium">{goal.priority} Priority</span>
                          </div>
                        </div>
                        <div className="text-left sm:text-right flex-shrink-0">
                          <div className="mb-2">
                            <div className="text-2xl font-bold text-primary-600">{goal.progressPercentage}%</div>
                            <div className="text-xs text-gray-500">Complete</div>
                          </div>
                          {daysLeft !== null && (
                            <div className={`text-sm ${daysLeft < 7 ? 'text-error-600 font-medium' : 'text-gray-600'}`}>
                              {daysLeft > 0 ? `${daysLeft} days left` : 'Overdue'}
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Progress Bar */}
                      <div className="mt-4">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              goal.status === 'At Risk' ? 'bg-error-600' : 'bg-primary-600'
                            }`}
                            style={{ width: `${goal.progressPercentage}%` }}
                          />
                        </div>
                      </div>
                      {/* Milestones Summary */}
                      {goal.milestones && goal.milestones.length > 0 && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4" />
                          <span>
                            {goal.milestones.filter(m => m.completed).length} / {goal.milestones.length} milestones completed
                          </span>
                        </div>
                      )}
                    </Card>
                  </Link>
                );
              })
            ) : (
              <Card className="text-center py-12">
                <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Goals</h3>
                <p className="text-gray-600 mb-6">Start achieving your career objectives by creating your first goal</p>
                <Link to="/goals/new">
                  <Button variant="primary">Create Your First Goal</Button>
                </Link>
              </Card>
            )}
          </div>
        )}

        {/* Completed Goals Tab */}
        {activeTab === 'completed' && (
          <div className="space-y-4">
            {recentCompletions && recentCompletions.length > 0 ? (
              recentCompletions.map((goal) => (
                <Link key={goal._id} to={`/goals/${goal._id}`}>
                  <Card className="hover:shadow-lg transition-shadow border-green-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <h3 className="text-lg font-bold text-gray-900">{goal.title}</h3>
                          {!goal.celebrated && (
                            <span className="text-xs bg-warning-100 text-warning-800 px-2 py-0.5 rounded-full font-medium">
                              Celebrate!
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{goal.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>{goal.category}</span>
                          <span>•</span>
                          <span>Completed {new Date(goal.timeBound?.completedDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Award className="w-12 h-12 text-warning-500 mx-auto" />
                      </div>
                    </div>
                  </Card>
                </Link>
              ))
            ) : (
              <Card className="text-center py-12">
                <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Completed Goals Yet</h3>
                <p className="text-gray-600">Keep working on your goals to see your achievements here</p>
              </Card>
            )}
          </div>
        )}

        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && (
          <div className="space-y-4">
            {!recommendations ? (
              <Card className="text-center py-12">
                <Sparkles className="w-16 h-16 text-primary-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">AI-Powered Goal Recommendations</h3>
                <p className="text-gray-600 mb-6">
                  Get personalized career goal suggestions based on your profile and current progress
                </p>
                <Button
                  variant="primary"
                  onClick={loadRecommendations}
                  disabled={loadingRecommendations}
                >
                  {loadingRecommendations ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Lightbulb className="w-5 h-5 mr-2" />
                      Generate Recommendations
                    </>
                  )}
                </Button>
              </Card>
            ) : (
              <>
                {recommendations.overallStrategy && (
                  <Card className="bg-primary-50 border-primary-200">
                    <h3 className="font-bold text-primary-900 mb-2">Strategic Overview</h3>
                    <p className="text-gray-700">{recommendations.overview}</p>
                  </Card>
                )}
                
                {recommendations.priorityActions && recommendations.priorityActions.length > 0 && (
                  <Card className="bg-warning-50 border-warning-200">
                    <h3 className="font-bold text-warning-900 mb-2 flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      Top Priority Actions
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      {recommendations.priorityActions.map((action, index) => (
                        <li key={index}>{action}</li>
                      ))}
                    </ul>
                  </Card>
                )}

                <div className="grid gap-4">
                  {recommendations.recommendations?.map((rec, index) => (
                    <Card key={index} className="hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-bold text-gray-900">{rec.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          rec.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                          rec.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                          rec.priority === 'Medium' ? 'bg-warning-100 text-warning-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {rec.priority} Priority
                        </span>
                      </div>
                      <div className="space-y-3 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Category:</span>
                          <span className="text-gray-600 ml-2">{rec.category} • {rec.type}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Goal:</span>
                          <p className="text-gray-600 mt-1">{rec.specific}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Target:</span>
                          <span className="text-gray-600 ml-2">
                            {rec.measurable?.targetValue} {rec.measurable?.unit} in {rec.timeline} days
                          </span>
                        </div>
                        {rec.milestones && rec.milestones.length > 0 && (
                          <div>
                            <span className="font-medium text-gray-700">Key Milestones:</span>
                            <ul className="list-disc list-inside mt-1 space-y-1 text-gray-600">
                              {rec.milestones.map((milestone, idx) => (
                                <li key={idx}>{milestone}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {rec.impact && (
                          <div className="bg-primary-50 p-3 rounded-lg">
                            <span className="font-medium text-primary-900">Why It Matters:</span>
                            <p className="text-primary-800 mt-1">{rec.impact}</p>
                          </div>
                        )}
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <Link to={`/goals/new?recommendation=${index}`} state={{ recommendation: rec }}>
                          <Button variant="outline" size="sm" className="w-full">
                            Create This Goal
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Insights Tab */}
        {activeTab === 'insights' && (
          <div className="space-y-4">
            {!patterns ? (
              <Card className="text-center py-12">
                <BarChart3 className="w-16 h-16 text-primary-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Success Pattern Analysis</h3>
                <p className="text-gray-600 mb-6">
                  Discover what works best for you and optimize your goal-setting strategy
                </p>
                <Button
                  variant="primary"
                  onClick={loadPatterns}
                  disabled={loadingPatterns || (stats.total < 3)}
                >
                  {loadingPatterns ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="w-5 h-5 mr-2" />
                      Analyze Patterns
                    </>
                  )}
                </Button>
                {stats.total < 3 && (
                  <p className="text-sm text-gray-500 mt-3">
                    Create at least 3 goals to unlock pattern analysis
                  </p>
                )}
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Success Patterns */}
                {patterns.successPatterns && patterns.successPatterns.length > 0 && (
                  <Card className="border-green-200 bg-green-50">
                    <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Success Patterns
                    </h3>
                    <div className="space-y-3">
                      {patterns.successPatterns.map((pattern, index) => (
                        <div key={index} className="bg-white p-4 rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">{pattern.pattern}</h4>
                            <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                              {pattern.frequency} Frequency
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{pattern.recommendation}</p>
                          {pattern.examples && pattern.examples.length > 0 && (
                            <div className="text-xs text-gray-600">
                              Examples: {pattern.examples.join(', ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Personalized Strategy */}
                {patterns.personalizedStrategy && (
                  <Card className="border-primary-200 bg-primary-50">
                    <h3 className="text-lg font-bold text-primary-900 mb-4">Your Personalized Strategy</h3>
                    <div className="space-y-4">
                      {patterns.personalizedStrategy.strengths && (
                        <div>
                          <h4 className="font-semibold text-primary-800 mb-2">Strengths</h4>
                          <ul className="list-disc list-inside space-y-1 text-gray-700">
                            {patterns.personalizedStrategy.strengths.map((strength, idx) => (
                              <li key={idx}>{strength}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {patterns.personalizedStrategy.recommendations && (
                        <div>
                          <h4 className="font-semibold text-primary-800 mb-2">Recommendations</h4>
                          <ul className="list-disc list-inside space-y-1 text-gray-700">
                            {patterns.personalizedStrategy.recommendations.map((rec, idx) => (
                              <li key={idx}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </Card>
                )}

                {/* Optimal Characteristics */}
                {patterns.optimalCharacteristics && (
                  <Card>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Optimal Goal Characteristics</h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      {patterns.optimalCharacteristics.timeline && (
                        <div>
                          <span className="font-medium text-gray-700">Best Timeline:</span>
                          <p className="text-gray-600 mt-1">{patterns.optimalCharacteristics.timeline}</p>
                        </div>
                      )}
                      {patterns.optimalCharacteristics.priorityBalance && (
                        <div>
                          <span className="font-medium text-gray-700">Priority Balance:</span>
                          <p className="text-gray-600 mt-1">{patterns.optimalCharacteristics.priorityBalance}</p>
                        </div>
                      )}
                      {patterns.optimalCharacteristics.categoryFocus && (
                        <div>
                          <span className="font-medium text-gray-700">Category Focus:</span>
                          <p className="text-gray-600 mt-1">{patterns.optimalCharacteristics.categoryFocus}</p>
                        </div>
                      )}
                      {patterns.optimalCharacteristics.milestoneStrategy && (
                        <div>
                          <span className="font-medium text-gray-700">Milestone Strategy:</span>
                          <p className="text-gray-600 mt-1">{patterns.optimalCharacteristics.milestoneStrategy}</p>
                        </div>
                      )}
                    </div>
                  </Card>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GoalDashboard;
