import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getGoalById,
  addProgressUpdate,
  completeMilestone,
  analyzeGoal,
  celebrateGoal,
  deleteGoal,
  formatGoalStatus,
  calculateDaysRemaining,
  updateImpactMetrics
} from '../api/goals';
import Card from './Card';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import toast from 'react-hot-toast';
import {
  Target,
  TrendingUp,
  Calendar,
  CheckCircle,
  Edit,
  Trash2,
  Sparkles,
  Trophy,
  ArrowLeft,
  AlertCircle,
  BarChart3,
  Award,
  PartyPopper
} from 'lucide-react';

const GoalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [celebration, setCelebration] = useState(null);
  
  const [progressValue, setProgressValue] = useState('');
  const [progressNotes, setProgressNotes] = useState('');
  const [updatingProgress, setUpdatingProgress] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    loadGoal();
  }, [id]);

  const loadGoal = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getGoalById(id);
      setGoal(response.goal);
      setProgressValue(response.goal.measurable?.currentValue || 0);
    } catch (err) {
      console.error('Load Goal Error:', err);
      setError(err.message || 'Failed to load goal');
      toast.error('Failed to load goal');
    } finally {
      setLoading(false);
    }
  };

  const handleProgressUpdate = async (e) => {
    e.preventDefault();
    const numValue = parseFloat(progressValue);
    if (!progressValue || numValue < 0) {
      toast.error('Please enter a valid progress value');
      return;
    }

    try {
      setUpdatingProgress(true);
      const response = await addProgressUpdate(id, numValue, progressNotes);
      const updatedGoal = response.goal;
      
      // Ensure progressPercentage is recalculated if not present in response
      if (!updatedGoal.progressPercentage && updatedGoal.measurable && updatedGoal.measurable.targetValue) {
        updatedGoal.progressPercentage = Math.round((updatedGoal.measurable.currentValue / updatedGoal.measurable.targetValue) * 100);
      }
      
      // Force a re-render by creating a new object
      setGoal({ ...updatedGoal });
      setProgressValue(updatedGoal.measurable?.currentValue || 0);
      setProgressNotes('');
      toast.success('Progress updated successfully!');
    } catch (err) {
      console.error('Update Progress Error:', err);
      toast.error('Failed to update progress');
    } finally {
      setUpdatingProgress(false);
    }
  };

  const handleMilestoneComplete = async (milestoneId) => {
    try {
      const response = await completeMilestone(id, milestoneId);
      setGoal(response.goal);
      toast.success('Milestone completed!');
    } catch (err) {
      console.error('Complete Milestone Error:', err);
      toast.error('Failed to complete milestone');
    }
  };

  const handleAnalyze = async () => {
    try {
      setAnalyzing(true);
      const response = await analyzeGoal(id);
      setAnalysis(response.analysis);
      setGoal(response.goal);
      toast.success('Goal analyzed successfully!');
    } catch (err) {
      console.error('Analyze Goal Error:', err);
      toast.error('Failed to analyze goal');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCelebrate = async () => {
    try {
      setCelebrating(true);
      const response = await celebrateGoal(id);
      setCelebration(response.celebration);
      setGoal(response.goal);
      toast.success('Congratulations on your achievement!');
    } catch (err) {
      console.error('Celebrate Goal Error:', err);
      toast.error('Failed to generate celebration');
    } finally {
      setCelebrating(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteGoal(id);
      toast.success('Goal deleted successfully');
      navigate('/goals');
    } catch (err) {
      console.error('Delete Goal Error:', err);
      toast.error('Failed to delete goal');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !goal) {
    return <ErrorMessage message={error || 'Goal not found'} />;
  }

  const statusInfo = formatGoalStatus(goal.status);
  const daysLeft = calculateDaysRemaining(goal.timeBound?.targetDate);
  const progressPercentage = goal.progressPercentage || 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link to="/goals" className="text-primary-600 hover:text-primary-800 flex items-center gap-2">
          <ArrowLeft className="w-5 h-5" />
          Back to Goals
        </Link>
        <div className="flex gap-2">
          <Link to={`/goals/${id}/edit`}>
            <Button variant="primary" size="large" className="px-6 py-3 text-lg rounded-xl">
              Edit
            </Button>
          </Link>
          <Button
            variant="danger"
            size="large"
            onClick={() => setShowDeleteConfirm(true)}
            className="px-6 py-3 text-lg rounded-xl"
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 w-screen h-screen">
          <Card className="max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Goal?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this goal? This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <Button
                variant="primary"
                onClick={handleDelete}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Delete
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Goal Overview */}
      <Card>
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-6 h-6 text-primary-600" />
              <h1 className="text-2xl font-bold text-gray-900">{goal.title}</h1>
            </div>
            <p className="text-gray-600 mb-4">{goal.description}</p>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-${statusInfo.color}-100 text-${statusInfo.color}-800`}>
                {statusInfo.icon} {statusInfo.text}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                {goal.category}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
                {goal.type}
              </span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                goal.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                goal.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                goal.priority === 'Medium' ? 'bg-warning-100 text-warning-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {goal.priority} Priority
              </span>
            </div>
            {goal.tags && goal.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {goal.tags.map((tag, index) => (
                  <span key={index} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="text-right ml-4">
            <div className="text-4xl font-bold text-primary-600">{progressPercentage}%</div>
            <div className="text-sm text-gray-600">Complete</div>
            {daysLeft !== null && (
              <div className={`text-sm font-medium mt-2 ${
                daysLeft < 0 ? 'text-red-600' :
                daysLeft < 7 ? 'text-orange-600' :
                'text-gray-600'
              }`}>
                {daysLeft < 0 ? 'Overdue' : daysLeft === 0 ? 'Due today' : `${daysLeft} days left`}
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all ${
                goal.status === 'At Risk' ? 'bg-red-600' :
                goal.status === 'Completed' ? 'bg-green-600' :
                'bg-primary-600'
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{goal.measurable?.currentValue} {goal.measurable?.unit}</span>
            <span>{goal.measurable?.targetValue} {goal.measurable?.unit}</span>
          </div>
        </div>

        {/* Quick Actions */}
        {goal.status === 'Completed' && !goal.celebrated && (
          <Button
            variant="primary"
            onClick={handleCelebrate}
            disabled={celebrating}
            className="w-full bg-linear-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
          >
            {celebrating ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Celebrating...
              </>
            ) : (
              <>
                <PartyPopper className="w-5 h-5 mr-2" />
                Celebrate Achievement!
              </>
            )}
          </Button>
        )}

        {goal.status !== 'Completed' && (
          <Button
            variant="outline"
            onClick={handleAnalyze}
            disabled={analyzing}
            className="w-full"
          >
            {analyzing ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Analyzing...
              </>
            ) : (
              <>Analyze Progress with AI</>
            )}
          </Button>
        )}
      </Card>

      {/* Celebration */}
      {celebration && (
        <Card className="border-yellow-200 bg-linear-to-br from-yellow-50 to-orange-50">
          <div className="text-center mb-4">
            <Trophy className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Congratulations!</h2>
          </div>
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 whitespace-pre-line">{celebration.celebrationMessage}</p>
          </div>
          
          {celebration.achievementHighlights && celebration.achievementHighlights.length > 0 && (
            <div className="mt-6">
              <h3 className="font-bold text-gray-900 mb-3">Achievement Highlights</h3>
              <ul className="space-y-2">
                {celebration.achievementHighlights.map((highlight, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Award className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                    <span className="text-gray-700">{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {celebration.shareableMessage && (
            <div className="mt-6 p-4 bg-white rounded-lg border border-yellow-200">
              <p className="text-sm font-medium text-gray-700 mb-2">Share Your Success:</p>
              <p className="text-gray-600 italic">{celebration.shareableMessage}</p>
            </div>
          )}
        </Card>
      )}

      {/* Analysis Results */}
      {analysis && (
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary-600" />
            AI Progress Analysis
          </h2>

          <div className="space-y-4">
            {/* Progress Assessment */}
            {analysis.progressAssessment && (
              <div className="p-4 bg-primary-50 rounded-lg">
                <h3 className="font-semibold text-primary-900 mb-2">Progress Assessment</h3>
                <p className="text-sm text-primary-800 mb-2">{analysis.progressAssessment.summary}</p>
                <div className="flex gap-4 text-xs text-primary-700">
                  <span>Status: {analysis.progressAssessment.overallStatus}</span>
                  <span>•</span>
                  <span>Velocity: {analysis.progressAssessment.velocityTrend}</span>
                </div>
              </div>
            )}

            {/* Risk Analysis */}
            {analysis.riskAnalysis && (
              <div className={`p-4 rounded-lg ${
                analysis.riskAnalysis.riskLevel === 'High' || analysis.riskAnalysis.riskLevel === 'Critical'
                  ? 'bg-red-50'
                  : analysis.riskAnalysis.riskLevel === 'Medium'
                  ? 'bg-warning-50'
                  : 'bg-green-50'
              }`}>
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Risk Analysis - {analysis.riskAnalysis.riskLevel} Risk
                </h3>
                {analysis.riskAnalysis.identifiedRisks && analysis.riskAnalysis.identifiedRisks.length > 0 && (
                  <div className="mb-2">
                    <p className="text-sm font-medium text-gray-700">Identified Risks:</p>
                    <ul className="list-disc list-inside text-sm text-gray-600">
                      {analysis.riskAnalysis.identifiedRisks.map((risk, index) => (
                        <li key={index}>{risk}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysis.riskAnalysis.mitigationStrategies && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Mitigation Strategies:</p>
                    <ul className="list-disc list-inside text-sm text-gray-600">
                      {analysis.riskAnalysis.mitigationStrategies.map((strategy, index) => (
                        <li key={index}>{strategy}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Next Steps */}
            {analysis.nextSteps && analysis.nextSteps.length > 0 && (
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2">Recommended Next Steps</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-green-800">
                  {analysis.nextSteps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* SMART Criteria */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-bold text-gray-900 mb-4">SMART Criteria</h2>
          <div className="space-y-3 text-sm">
            <div>
              <span className="font-medium text-primary-600">Specific:</span>
              <p className="text-gray-700 mt-1">{goal.specific}</p>
            </div>
            <div>
              <span className="font-medium text-primary-600">Measurable:</span>
              <p className="text-gray-700 mt-1">
                {goal.measurable?.metric}: {goal.measurable?.currentValue} / {goal.measurable?.targetValue} {goal.measurable?.unit}
              </p>
            </div>
            <div>
              <span className="font-medium text-primary-600">Achievable:</span>
              <p className="text-gray-700 mt-1">{goal.achievable}</p>
            </div>
            <div>
              <span className="font-medium text-primary-600">Relevant:</span>
              <p className="text-gray-700 mt-1">{goal.relevant}</p>
            </div>
            <div>
              <span className="font-medium text-primary-600">Time-bound:</span>
              <p className="text-gray-700 mt-1">
                {new Date(goal.timeBound?.startDate).toLocaleDateString()} → {new Date(goal.timeBound?.targetDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </Card>

        {/* Timeline */}
        <Card>
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-600" />
            Timeline
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Start Date:</span>
              <span className="font-medium text-gray-900">
                {new Date(goal.timeBound?.startDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Target Date:</span>
              <span className="font-medium text-gray-900">
                {new Date(goal.timeBound?.targetDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Duration:</span>
              <span className="font-medium text-gray-900">{goal.duration} days</span>
            </div>
            {daysLeft !== null && (
              <div className="flex justify-between">
                <span className="text-gray-600">Days Remaining:</span>
                <span className={`font-medium ${daysLeft < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  {daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days`}
                </span>
              </div>
            )}
            {goal.status === 'Completed' && goal.timeBound?.completedDate && (
              <div className="flex justify-between">
                <span className="text-gray-600">Completed On:</span>
                <span className="font-medium text-green-600">
                  {new Date(goal.timeBound.completedDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Progress Update Form */}
      {goal.status !== 'Completed' && goal.status !== 'Abandoned' && (
        <Card>
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Update Progress
          </h2>
          <form onSubmit={handleProgressUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Value ({goal.measurable?.unit})
                </label>
                <input
                  type="number"
                  value={progressValue}
                  onChange={(e) => setProgressValue(e.target.value)}
                  min="0"
                  max={goal.measurable?.targetValue}
                  step="any"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  value={progressNotes}
                  onChange={(e) => setProgressNotes(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="What did you accomplish?"
                />
              </div>
            </div>
            <Button type="submit" variant="primary" disabled={updatingProgress}>
              {updatingProgress ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Updating...
                </>
              ) : (
                <>Update Progress</>
              )}
            </Button>
          </form>
        </Card>
      )}

      {/* Milestones */}
      {goal.milestones && goal.milestones.length > 0 && (
        <Card>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Milestones</h2>
          <div className="space-y-3">
            {goal.milestones.map((milestone) => (
              <div
                key={milestone._id}
                className={`p-4 rounded-lg border ${
                  milestone.completed
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {milestone.completed ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                      )}
                      <h3 className={`font-semibold ${
                        milestone.completed ? 'text-green-900 line-through' : 'text-gray-900'
                      }`}>
                        {milestone.title}
                      </h3>
                    </div>
                    {milestone.description && (
                      <p className="text-sm text-gray-600 mt-1 ml-7">{milestone.description}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1 ml-7">
                      Target: {new Date(milestone.targetDate).toLocaleDateString()}
                    </p>
                  </div>
                  {!milestone.completed && goal.status !== 'Completed' && (
                    <Button
                      variant="outline"
                      size="md"
                      className="px-6"
                      onClick={() => handleMilestoneComplete(milestone._id)}
                    >
                      Complete
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-sm text-gray-600">
            {goal.milestones.filter(m => m.completed).length} of {goal.milestones.length} milestones completed
          </div>
        </Card>
      )}

      {/* Progress History */}
      {goal.progressUpdates && goal.progressUpdates.length > 0 && (
        <Card>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Progress History</h2>
          <div className="space-y-2">
            {goal.progressUpdates.slice().reverse().slice(0, 10).map((update, index) => (
              <div key={index} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {update.value} {goal.measurable?.unit}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(update.date).toLocaleDateString()}
                    </span>
                  </div>
                  {update.notes && (
                    <p className="text-sm text-gray-600 mt-1">{update.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default GoalDetail;
