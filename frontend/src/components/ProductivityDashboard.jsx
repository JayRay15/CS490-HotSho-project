import React, { useState, useEffect } from 'react';
import { productivityApi } from '../api/productivity';
import Card from './Card';
import Button from './Button';
import { Link } from 'react-router-dom';

export default function ProductivityDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await productivityApi.getDashboard();
      setDashboard(response.dashboard);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <Card>
        <p className="text-center text-gray-600 py-8">
          Failed to load productivity dashboard. Please try again.
        </p>
      </Card>
    );
  }

  const stats = selectedPeriod === 'week' ? dashboard.weekStats : dashboard.monthStats;
  const quickStats = dashboard.quickStats;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold text-gray-900">
            Productivity Dashboard
          </h2>
          <p className="text-gray-600">Overview of your time investment and productivity</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setSelectedPeriod('week')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              selectedPeriod === 'week'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setSelectedPeriod('month')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              selectedPeriod === 'month'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            This Month
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="elevated">
          <div>
            <div className="text-sm text-gray-600">Total Hours</div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.totalHours.toFixed(1)}h
              </div>
              <div className="text-xs text-gray-500">
                {quickStats.todayHours.toFixed(1)}h today
              </div>
            </div>
        </Card>

        <Card variant="elevated">
          <div>
            <div className="text-sm text-gray-600">Productive Hours</div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.productiveHours.toFixed(1)}h
              </div>
              <div className="text-xs text-gray-500">
                {stats.totalHours > 0 
                  ? `${((stats.productiveHours / stats.totalHours) * 100).toFixed(0)}% efficiency`
                  : 'N/A'}
              </div>
            </div>
        </Card>

        <Card variant="elevated">
          <div>
            <div className="text-sm text-gray-600">Avg Productivity</div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.averageProductivity.toFixed(1)}/10
              </div>
              <div className="text-xs text-gray-500">
                {selectedPeriod === 'week' ? 'Weekly' : 'Monthly'} average
              </div>
            </div>
        </Card>

        <Card variant="elevated">
          <div>
            <div className="text-sm text-gray-600">Outcomes</div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.totalOutcomes}
              </div>
              <div className="text-xs text-gray-500">
                {stats.totalHours > 0 
                  ? `${(stats.totalOutcomes / stats.totalHours).toFixed(1)} per hour`
                  : 'N/A'}
              </div>
            </div>
        </Card>
      </div>

      {dashboard.today.hasActiveEntry && (
        <Card variant="primary" className="border-l-4 border-green-500">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="font-semibold text-gray-900">Activity in Progress</h3>
              <p className="text-sm text-gray-600">
                You're currently tracking: {dashboard.today.currentEntry.activity}
              </p>
            </div>
            <Link to="/productivity/tracker" className="ml-auto">
              <Button variant="outline" size="small">
                View Tracker
              </Button>
            </Link>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold mb-4">
            Activity Breakdown
          </h3>
          
          {Object.keys(stats.activityTotals || {}).length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No activity data available for this period.
            </p>
          ) : (
            <div className="space-y-3">
              {Object.entries(stats.activityTotals || {})
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([activity, minutes]) => {
                  const hours = (minutes / 60).toFixed(1);
                  const percentage = ((minutes / (stats.totalHours * 60)) * 100).toFixed(0);
                  
                  return (
                    <div key={activity}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">{activity}</span>
                        <span className="text-gray-600">{hours}h ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </Card>

        <Card>
          <h3 className="text-lg font-semibold mb-4">
            Active Goals
          </h3>
          
          {dashboard.activeGoals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No active goals yet.</p>
              <Link to="/goals">
                <Button variant="outline" size="small">
                  Create Your First Goal
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {dashboard.activeGoals.map(goal => (
                <div key={goal._id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">{goal.title}</h4>
                      <span className="text-xs text-gray-600">{goal.category}</span>
                    </div>
                    <span className="text-sm font-semibold text-primary">
                      {goal.progressPercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${goal.progressPercentage}%` }}
                    />
                  </div>
                  {goal.daysRemaining !== null && (
                    <div className="text-xs text-gray-600">
                      {goal.daysRemaining > 0 
                        ? `${goal.daysRemaining} days remaining`
                        : goal.daysRemaining === 0 
                        ? 'Due today'
                        : 'Overdue'}
                    </div>
                  )}
                </div>
              ))}
              
              <Link to="/goals">
                <button className="w-full text-primary hover:text-primary-600 text-sm font-medium py-2 flex items-center justify-center gap-1">
                  View All Goals
                </button>
              </Link>
            </div>
          )}
        </Card>
      </div>

      {dashboard.recentAnalyses && dashboard.recentAnalyses.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              Recent Analyses
            </h3>
            <a href="/productivity#analysis-history">
              <Button variant="ghost" size="small">
                View All
              </Button>
            </a>
          </div>

          <div className="space-y-3">
            {dashboard.recentAnalyses.map(analysis => (
              <Link
                key={analysis._id}
                to={`/productivity/analysis/${analysis._id}`}
                className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {analysis.period.type} Analysis
                    </h4>
                    <p className="text-sm text-gray-600">
                      {new Date(analysis.period.startDate).toLocaleDateString()} - {' '}
                      {new Date(analysis.period.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">
                      {analysis.productivityMetrics?.averageProductivity?.toFixed(1) || 'N/A'}/10
                    </div>
                    <div className="text-xs text-gray-600">
                      {analysis.productivityMetrics?.efficiencyRating || 'N/A'}
                    </div>
                  </div>
                </div>
                
                {analysis.burnoutIndicators?.riskLevel && 
                 analysis.burnoutIndicators.riskLevel !== 'Low' && (
                  <div className={`mt-2 text-sm font-medium ${
                    analysis.burnoutIndicators.riskLevel === 'Critical' 
                      ? 'text-red-600'
                      : analysis.burnoutIndicators.riskLevel === 'High'
                      ? 'text-orange-600'
                      : 'text-yellow-600'
                  }`}>
                    <span>Burnout Risk: {analysis.burnoutIndicators.riskLevel}</span>
                  </div>
                )}
              </Link>
            ))}
          </div>
        </Card>
      )}

      <div className="flex gap-4">
        <Link to="/productivity/tracker" className="flex-1">
          <Button variant="primary" className="w-full">
            Time Tracker
          </Button>
        </Link>
      </div>
    </div>
  );
}
