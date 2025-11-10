import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import api, { setAuthToken } from '../api/axios';
import Card from './Card';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';

/**
 * UC-063: Job Match Comparison Component
 * Compare match scores across multiple jobs
 */
export default function JobMatchComparison({ jobs }) {
  const { getToken } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comparison, setComparison] = useState(null);
  const [sortBy, setSortBy] = useState('overallScore');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    fetchMatches();
  }, [jobs]);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      setAuthToken(token);

      const response = await api.get(`/api/job-matches?sortBy=${sortBy}&order=${sortOrder}`);

      if (response.data?.success) {
        setMatches(response.data.data.matches || []);
      }
    } catch (err) {
      console.error('Error fetching matches:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateAllMatches = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      setAuthToken(token);

      const response = await api.post('/api/job-matches/calculate-all');

      if (response.data?.success) {
        await fetchMatches();
      }
    } catch (err) {
      console.error('Error calculating matches:', err);
    }
  };

  const compareSelectedJobs = async (jobIds) => {
    try {
      const token = await getToken();
      setAuthToken(token);

      const response = await api.post('/api/job-matches/compare', { jobIds });

      if (response.data?.success) {
        setComparison(response.data.data);
      }
    } catch (err) {
      console.error('Error comparing jobs:', err);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 55) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 85) return 'bg-green-50';
    if (score >= 70) return 'bg-blue-50';
    if (score >= 55) return 'bg-yellow-50';
    return 'bg-red-50';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <Card title="Job Match Comparison" variant="elevated">
        <div className="text-center py-8">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Match Scores Yet</h3>
          <p className="text-gray-600 mb-6">Calculate match scores for all your jobs to see how well they align with your profile.</p>
          <Button onClick={calculateAllMatches}>
            Calculate All Match Scores
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="elevated" className="text-center">
          <div className="text-sm text-gray-600 mb-1">Total Jobs</div>
          <div className="text-3xl font-bold text-gray-900">{matches.length}</div>
        </Card>
        <Card variant="elevated" className="text-center">
          <div className="text-sm text-gray-600 mb-1">Best Match</div>
          <div className={`text-3xl font-bold ${getScoreColor(matches[0]?.overallScore || 0)}`}>
            {matches[0]?.overallScore || 0}%
          </div>
        </Card>
        <Card variant="elevated" className="text-center">
          <div className="text-sm text-gray-600 mb-1">Average Match</div>
          <div className="text-3xl font-bold text-blue-600">
            {Math.round(matches.reduce((sum, m) => sum + m.overallScore, 0) / matches.length)}%
          </div>
        </Card>
        <Card variant="elevated" className="text-center">
          <div className="text-sm text-gray-600 mb-1">Good Matches</div>
          <div className="text-3xl font-bold text-green-600">
            {matches.filter(m => m.overallScore >= 70).length}
          </div>
        </Card>
      </div>

      {/* Sort Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">All Job Matches</h2>
        <div className="flex items-center gap-3">
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              fetchMatches();
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="overallScore">Overall Score</option>
            <option value="createdAt">Date Calculated</option>
            <option value="metadata.company">Company</option>
          </select>
          <button
            onClick={() => {
              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              fetchMatches();
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
          </button>
          <Button size="small" onClick={calculateAllMatches}>
            Recalculate All
          </Button>
        </div>
      </div>

      {/* Match List */}
      <div className="space-y-3">
        {matches.map((match, idx) => (
          <Card key={match._id} variant="elevated" className="hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              {/* Rank */}
              <div className="text-center min-w-[50px]">
                <div className="text-2xl font-bold text-gray-400">#{idx + 1}</div>
              </div>

              {/* Job Info */}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-lg">
                  {match.metadata.jobTitle}
                </h3>
                <p className="text-gray-600 text-sm">{match.metadata.company}</p>
              </div>

              {/* Score */}
              <div className={`text-center px-6 py-4 rounded-lg ${getScoreBgColor(match.overallScore)}`}>
                <div className={`text-3xl font-bold ${getScoreColor(match.overallScore)}`}>
                  {match.overallScore}%
                </div>
                <div className="text-xs text-gray-600 mt-1">{match.matchGrade}</div>
              </div>

              {/* Category Mini-Breakdown */}
              <div className="grid grid-cols-2 gap-3 min-w-[200px]">
                <div>
                  <div className="text-xs text-gray-600">Skills</div>
                  <div className="font-semibold text-sm">{match.categoryScores.skills.score}%</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600">Experience</div>
                  <div className="font-semibold text-sm">{match.categoryScores.experience.score}%</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600">Education</div>
                  <div className="font-semibold text-sm">{match.categoryScores.education.score}%</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600">Additional</div>
                  <div className="font-semibold text-sm">{match.categoryScores.additional.score}%</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => window.open(`/jobs?viewMatch=${match.jobId}`, '_blank')}
                  className="px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  View Details
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-600">{match.strengths.length} strengths</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-600">{match.gaps.length} gaps</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                </svg>
                <span className="text-gray-600">{match.suggestions.length} suggestions</span>
              </div>
              <div className="ml-auto text-gray-500 text-xs">
                Calculated {new Date(match.createdAt).toLocaleDateString()}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
