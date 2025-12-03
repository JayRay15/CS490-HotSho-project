import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
  Trophy, Medal, Award, TrendingUp, TrendingDown, Minus, Users,
  BarChart3, Target, Briefcase, Calendar, RefreshCw, ChevronDown,
  Sparkles, Crown, Star, Zap, ArrowUp, ArrowDown, Info
} from 'lucide-react';
import {
  getTeamBenchmarks,
  generateBenchmark,
  getLeaderboard,
  PERIOD_LABELS,
  METRIC_LABELS,
  TREND_ICONS,
  INSIGHT_ICONS
} from '../../api/benchmarks';

const BenchmarkingTab = ({ teamId }) => {
  const { user } = useUser();
  const [benchmark, setBenchmark] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('weekly');
  const [leaderboardMetric, setLeaderboardMetric] = useState('overall');
  const [showDetails, setShowDetails] = useState(false);

  const fetchData = useCallback(async () => {
    if (!teamId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const [benchmarkRes, leaderboardRes] = await Promise.all([
        getTeamBenchmarks(teamId, period),
        getLeaderboard(teamId, period, leaderboardMetric)
      ]);
      
      setBenchmark(benchmarkRes.benchmark);
      setLeaderboard(leaderboardRes.leaderboard || []);
    } catch (err) {
      console.error('Error fetching benchmark data:', err);
      setError('Failed to load benchmarking data');
    } finally {
      setLoading(false);
    }
  }, [teamId, period, leaderboardMetric]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await generateBenchmark(teamId, period);
      await fetchData();
    } catch (err) {
      console.error('Error refreshing benchmark:', err);
      setError('Failed to refresh benchmark');
    } finally {
      setRefreshing(false);
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2: return <Medal className="h-5 w-5 text-gray-400" />;
      case 3: return <Award className="h-5 w-5 text-amber-600" />;
      default: return <span className="font-bold text-gray-500">#{rank}</span>;
    }
  };

  const getPercentileColor = (percentile) => {
    if (percentile >= 90) return 'text-green-600 bg-green-100';
    if (percentile >= 75) return 'text-blue-600 bg-blue-100';
    if (percentile >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  const formatComparison = (value) => {
    if (value > 0) return <span className="text-green-600">+{value}%</span>;
    if (value < 0) return <span className="text-red-600">{value}%</span>;
    return <span className="text-gray-500">0%</span>;
  };

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
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            Team Performance Benchmarking
          </h2>
          <p className="text-sm text-gray-500">
            Compare your progress with team members and track performance trends
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            {Object.entries(PERIOD_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Team Metrics Overview */}
      {benchmark && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Applications</p>
                <p className="text-2xl font-bold text-gray-900">
                  {benchmark.teamMetrics?.totalApplications || 0}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Briefcase className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Team total this {period.replace('ly', '')}
            </p>
          </div>

          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Interviews</p>
                <p className="text-2xl font-bold text-gray-900">
                  {benchmark.teamMetrics?.totalInterviews || 0}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Response rate: {benchmark.teamMetrics?.averageResponseRate || 0}%
            </p>
          </div>

          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Offers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {benchmark.teamMetrics?.totalOffers || 0}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Trophy className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Congratulations to all!
            </p>
          </div>

          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Members</p>
                <p className="text-2xl font-bold text-gray-900">
                  {benchmark.teamMetrics?.activeMembers || 0}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Contributing this period
            </p>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div className="bg-white border rounded-lg shadow-sm">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Leaderboard
          </h3>
          <select
            value={leaderboardMetric}
            onChange={(e) => setLeaderboardMetric(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm"
          >
            {Object.entries(METRIC_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        
        <div className="divide-y">
          {leaderboard.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>No benchmark data available yet</p>
              <p className="text-sm">Members need to track their job search progress</p>
            </div>
          ) : (
            leaderboard.map((member, idx) => {
              const isCurrentUser = member.userId?._id === user?.id || 
                                    member.userId?.clerkId === user?.id;
              
              return (
                <div
                  key={member.userId?._id || idx}
                  className={`p-4 flex items-center gap-4 ${
                    isCurrentUser ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                >
                  {/* Rank */}
                  <div className="w-10 flex justify-center">
                    {getRankIcon(member.rank)}
                  </div>

                  {/* Avatar & Name */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                      {member.userId?.firstName?.charAt(0) || 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {member.userId?.firstName} {member.userId?.lastName}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs text-blue-600">(You)</span>
                        )}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        {getTrendIcon(member.trend)}
                        <span className={`px-2 py-0.5 rounded-full text-xs ${getPercentileColor(member.percentile)}`}>
                          Top {100 - member.percentile}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="hidden md:flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="font-semibold text-gray-900">{member.metrics?.applications || 0}</p>
                      <p className="text-xs text-gray-500">Applications</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-gray-900">{member.metrics?.interviews || 0}</p>
                      <p className="text-xs text-gray-500">Interviews</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-gray-900">{member.metrics?.offers || 0}</p>
                      <p className="text-xs text-gray-500">Offers</p>
                    </div>
                  </div>

                  {/* Comparison */}
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                      {member.comparison?.vsTeamAverage > 0 ? (
                        <ArrowUp className="h-4 w-4 text-green-500" />
                      ) : member.comparison?.vsTeamAverage < 0 ? (
                        <ArrowDown className="h-4 w-4 text-red-500" />
                      ) : null}
                      {formatComparison(member.comparison?.vsTeamAverage || 0)}
                    </div>
                    <p className="text-xs text-gray-500">vs team avg</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Insights */}
      {benchmark?.insights && benchmark.insights.length > 0 && (
        <div className="bg-white border rounded-lg shadow-sm">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Insights & Highlights
            </h3>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {benchmark.insights.map((insight, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg ${
                  insight.type === 'milestone' ? 'bg-green-50 border border-green-200' :
                  insight.type === 'strength' ? 'bg-blue-50 border border-blue-200' :
                  insight.type === 'improvement' ? 'bg-yellow-50 border border-yellow-200' :
                  'bg-gray-50 border border-gray-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{INSIGHT_ICONS[insight.type]}</span>
                  <div>
                    <h4 className="font-medium text-gray-900">{insight.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Industry Comparison */}
      {benchmark?.industryBenchmarks && (
        <div className="bg-white border rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Target className="h-5 w-5 text-indigo-500" />
              Industry Benchmarks
            </h3>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <Info className="h-4 w-4" />
              {showDetails ? 'Hide' : 'Show'} Details
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-indigo-600">
                {benchmark.industryBenchmarks.averageApplicationsToInterview}:1
              </p>
              <p className="text-sm text-gray-600 mt-1">Avg Applications to Interview</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-indigo-600">
                {benchmark.industryBenchmarks.averageInterviewsToOffer}:1
              </p>
              <p className="text-sm text-gray-600 mt-1">Avg Interviews to Offer</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-indigo-600">
                {benchmark.industryBenchmarks.averageTimeToOffer}
              </p>
              <p className="text-sm text-gray-600 mt-1">Avg Days to Offer</p>
            </div>
          </div>

          {showDetails && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg text-sm text-gray-600">
              <p className="font-medium text-gray-900 mb-2">About Industry Benchmarks</p>
              <p>
                These benchmarks are based on industry averages and help you understand
                how your team's performance compares. Top performers typically achieve
                the {benchmark.industryBenchmarks.topPerformerThreshold}th percentile 
                or higher in their metrics.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BenchmarkingTab;
