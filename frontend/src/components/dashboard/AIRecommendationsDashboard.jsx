import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles, Briefcase, Video, Users, TrendingUp, Clock, RefreshCw,
  ChevronDown, ChevronUp, Check, X, AlertCircle, Target, Bell,
  Globe, CheckCircle, ArrowRight, Lightbulb, Zap, Filter, Star
} from 'lucide-react';
import {
  getAIRecommendations,
  completeRecommendation,
  dismissRecommendation,
  refreshRecommendations,
  PRIORITY_COLORS,
  CATEGORY_COLORS
} from '../../api/aiRecommendations';

const getCategoryIcon = (iconName) => {
  switch (iconName) {
    case 'briefcase': return Briefcase;
    case 'video': return Video;
    case 'users': return Users;
    case 'trending-up': return TrendingUp;
    case 'clock': return Clock;
    default: return Sparkles;
  }
};

const getInsightIcon = (iconName) => {
  switch (iconName) {
    case 'trending-up': return <TrendingUp className="h-5 w-5 text-green-600" />;
    case 'globe': return <Globe className="h-5 w-5 text-blue-600" />;
    case 'bell': return <Bell className="h-5 w-5 text-orange-600" />;
    default: return <Lightbulb className="h-5 w-5 text-yellow-600" />;
  }
};

const RecommendationCard = ({ recommendation, onComplete, onDismiss }) => {
  const [expanded, setExpanded] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  const handleComplete = async () => {
    setCompleting(true);
    await onComplete(recommendation.id);
    setCompleting(false);
  };

  const handleDismiss = async () => {
    setDismissing(true);
    await onDismiss(recommendation.id, 'not_relevant');
    setDismissing(false);
  };

  return (
    <div className={`border rounded-lg overflow-hidden ${
      recommendation.priority === 'high' ? 'border-red-200 bg-red-50/30' : 'bg-white'
    }`}>
      {/* Card Header */}
      <div
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[recommendation.priority]}`}>
                {recommendation.priority} priority
              </span>
              {recommendation.estimatedTime && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {recommendation.estimatedTime}
                </span>
              )}
            </div>
            <h4 className="font-medium text-gray-900">{recommendation.title}</h4>
            <p className="text-sm text-gray-600 mt-1">{recommendation.description}</p>
          </div>
          <div className="flex items-center gap-2 ml-4">
            {expanded ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-4 border-t bg-white">
          {/* AI Insight */}
          <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
            <div className="flex items-start gap-2">
              <Sparkles className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-purple-900">AI Insight</p>
                <p className="text-sm text-purple-700">{recommendation.insight}</p>
              </div>
            </div>
          </div>

          {/* Action Items */}
          {recommendation.actionItems && recommendation.actionItems.length > 0 && (
            <div className="mt-4">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Action Items</h5>
              <ul className="space-y-2">
                {recommendation.actionItems.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                    <ArrowRight className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Related Info */}
          {recommendation.relatedJobs && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs font-medium text-gray-700 mb-1">Related Jobs</p>
              <p className="text-sm text-gray-600">{recommendation.relatedJobs.join(', ')}</p>
            </div>
          )}

          {recommendation.upcomingInterview && (
            <div className="mt-4 p-3 bg-purple-50 rounded-lg">
              <p className="text-xs font-medium text-purple-700 mb-1">Upcoming Interview</p>
              <p className="text-sm text-purple-600">{recommendation.upcomingInterview}</p>
            </div>
          )}

          {recommendation.contacts && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <p className="text-xs font-medium text-green-700 mb-1">Contacts to Reach Out</p>
              <p className="text-sm text-green-600">{recommendation.contacts.join(', ')}</p>
            </div>
          )}

          {recommendation.deadline && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg">
              <p className="text-xs font-medium text-red-700 mb-1">⏰ Time Sensitive</p>
              <p className="text-sm text-red-600">{recommendation.deadline}</p>
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleComplete}
              disabled={completing}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {completing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Mark Complete
            </button>
            <button
              onClick={handleDismiss}
              disabled={dismissing}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              {dismissing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600" />
              ) : (
                <X className="h-4 w-4" />
              )}
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const AIRecommendationsDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [filterPriority, setFilterPriority] = useState('all');
  const [expandedCategories, setExpandedCategories] = useState({});

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAIRecommendations();
      setData(response.data);
      
      // Expand first category by default
      if (response.data?.categories?.length > 0) {
        setExpandedCategories({ [response.data.categories[0].id]: true });
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const response = await refreshRecommendations();
      setData(response.data);
    } catch (err) {
      console.error('Error refreshing:', err);
      setError('Failed to refresh recommendations');
    } finally {
      setRefreshing(false);
    }
  };

  const handleComplete = async (recommendationId) => {
    try {
      await completeRecommendation(recommendationId);
      // Remove from list
      setData(prev => ({
        ...prev,
        categories: prev.categories.map(cat => ({
          ...cat,
          recommendations: cat.recommendations.filter(r => r.id !== recommendationId)
        }))
      }));
    } catch (err) {
      console.error('Error completing recommendation:', err);
    }
  };

  const handleDismiss = async (recommendationId, reason) => {
    try {
      await dismissRecommendation(recommendationId, reason);
      // Remove from list
      setData(prev => ({
        ...prev,
        categories: prev.categories.map(cat => ({
          ...cat,
          recommendations: cat.recommendations.filter(r => r.id !== recommendationId)
        }))
      }));
    } catch (err) {
      console.error('Error dismissing recommendation:', err);
    }
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const filteredCategories = data?.categories?.map(cat => ({
    ...cat,
    recommendations: cat.recommendations.filter(r => 
      filterPriority === 'all' || r.priority === filterPriority
    )
  })).filter(cat => cat.recommendations.length > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-purple-600" />
            AI Recommendations
          </h2>
          <p className="text-gray-600 mt-1">
            Personalized insights to accelerate your job search
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Overview Stats */}
      {data?.overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border rounded-lg p-4">
            <p className="text-sm text-gray-500">Total Recommendations</p>
            <p className="text-2xl font-bold text-gray-900">{data.overview.totalRecommendations}</p>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <p className="text-sm text-gray-500">High Priority</p>
            <p className="text-2xl font-bold text-red-600">{data.overview.highPriority}</p>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <p className="text-sm text-gray-500">Completed This Week</p>
            <p className="text-2xl font-bold text-green-600">{data.overview.completedThisWeek}</p>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <p className="text-sm text-gray-500">Improvement Score</p>
            <p className="text-2xl font-bold text-blue-600">{data.overview.improvementScore}%</p>
          </div>
        </div>
      )}

      {/* Quick Insights */}
      {data?.insights && data.insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.insights.map((insight, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-lg ${
                insight.type === 'positive' ? 'bg-green-50 border border-green-200' :
                insight.type === 'action' ? 'bg-orange-50 border border-orange-200' :
                'bg-blue-50 border border-blue-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {getInsightIcon(insight.icon)}
                <div>
                  <p className="font-medium text-gray-900">{insight.title}</p>
                  <p className="text-sm text-gray-600">{insight.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Weekly Focus */}
      {data?.weeklyFocus && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />
                Weekly Focus: {data.weeklyFocus.goal}
              </h3>
              <p className="text-sm text-gray-600">{data.weeklyFocus.progress}% complete</p>
            </div>
            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-600 transition-all"
                style={{ width: `${data.weeklyFocus.progress}%` }}
              />
            </div>
          </div>
          <div className="space-y-2">
            {data.weeklyFocus.tasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  task.done ? 'bg-green-500' : 'border-2 border-gray-300'
                }`}>
                  {task.done && <Check className="h-3 w-3 text-white" />}
                </div>
                <span className={`text-sm ${task.done ? 'text-gray-500 line-through' : 'text-gray-700'}`}>
                  {task.task}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Filter className="h-5 w-5 text-gray-400" />
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">All Priorities</option>
          <option value="high">High Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="low">Low Priority</option>
        </select>
      </div>

      {/* Recommendations by Category */}
      {filteredCategories && filteredCategories.length > 0 ? (
        <div className="space-y-4">
          {filteredCategories.map((category) => {
            const Icon = getCategoryIcon(category.icon);
            const isExpanded = expandedCategories[category.id];
            
            return (
              <div key={category.id} className="bg-white border rounded-lg overflow-hidden">
                {/* Category Header */}
                <div
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleCategory(category.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${CATEGORY_COLORS[category.color]} flex items-center justify-center`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{category.name}</h3>
                      <p className="text-sm text-gray-500">
                        {category.recommendations.length} recommendation{category.recommendations.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </div>

                {/* Category Content */}
                {isExpanded && (
                  <div className="p-4 pt-0 space-y-3">
                    {category.recommendations.map((rec) => (
                      <RecommendationCard
                        key={rec.id}
                        recommendation={rec}
                        onComplete={handleComplete}
                        onDismiss={handleDismiss}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">All caught up!</h3>
          <p className="text-gray-500">No recommendations matching your filter.</p>
        </div>
      )}
    </div>
  );
};

export default AIRecommendationsDashboard;
