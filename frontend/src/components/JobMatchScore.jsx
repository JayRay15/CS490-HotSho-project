import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import api, { setAuthToken } from '../api/axios';
import Card from './Card';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';

/**
 * UC-063: Job Match Score Component
 * Displays match score breakdown and analysis for a job
 */
export default function JobMatchScore({ jobId, onClose }) {
  const { getToken } = useAuth();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchMatch();
  }, [jobId]);

  const fetchMatch = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      setAuthToken(token);
      
      // Try to get existing match
      const response = await api.get(`/api/job-matches/${jobId}`);

      if (response.data?.success) {
        setMatch(response.data.data);
      } else {
        // Match doesn't exist, need to calculate
        setMatch(null);
      }
    } catch (err) {
      // 404 is expected when match hasn't been calculated yet
      if (err.response?.status === 404) {
        console.log('[JobMatchScore] No existing match found - will show calculate button');
        setMatch(null);
      } else {
        console.error('Error fetching match:', err);
      }
      setError(null); // Don't show error, just show calculate button
    } finally {
      setLoading(false);
    }
  };

  const calculateMatch = async () => {
    try {
      setCalculating(true);
      setError(null);
      const token = await getToken();
      setAuthToken(token);

      const response = await api.post(`/api/job-matches/calculate/${jobId}`);

      if (response.data?.success) {
        setMatch(response.data.data);
      } else {
        throw new Error(response.data?.message || 'Failed to calculate match');
      }
    } catch (err) {
      console.error('Error calculating match:', err);
      setError(err.response?.data?.message || err.message || 'Failed to calculate match score. Please try again.');
    } finally {
      setCalculating(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 55) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreGrade = (score) => {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 55) return 'Fair';
    return 'Poor';
  };

  const getSeverityColor = (severity) => {
    if (severity === 'critical') return 'text-red-600 bg-red-50';
    if (severity === 'important') return 'text-orange-600 bg-orange-50';
    return 'text-yellow-600 bg-yellow-50';
  };

  const getPriorityColor = (priority) => {
    if (priority === 'high') return 'text-red-600 bg-red-50';
    if (priority === 'medium') return 'text-blue-600 bg-blue-50';
    return 'text-gray-600 bg-gray-50';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (!match) {
    return (
      <Card title="Job Match Analysis" variant="elevated">
        <div className="text-center py-8">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Match Score Yet
          </h3>
          <p className="text-gray-600 mb-6">
            Calculate how well you match this job opportunity based on your skills, experience, and education.
          </p>
          <Button
            onClick={calculateMatch}
            disabled={calculating}
            className="mx-auto"
          >
            {calculating ? 'Calculating...' : 'Calculate Match Score'}
          </Button>
          {error && (
            <p className="text-red-600 text-sm mt-4">{error}</p>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card variant="elevated" className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="text-center py-6">
          <div className="mb-2">
            <div className={`text-6xl font-bold ${getScoreColor(match.overallScore)}`}>
              {match.overallScore}%
            </div>
            <div className="text-xl font-semibold text-gray-700 mt-2">
              {getScoreGrade(match.overallScore)} Match
            </div>
          </div>
          <p className="text-gray-600 mt-3">
            Overall compatibility with {match.metadata.jobTitle}
          </p>
          <div className="flex justify-center gap-4 mt-4">
            <Button
              size="small"
              variant="secondary"
              onClick={calculateMatch}
              disabled={calculating}
            >
              {calculating ? 'Recalculating...' : 'Recalculate'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-4">
          {['overview', 'strengths', 'gaps', 'suggestions'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <Card title="Category Breakdown" variant="elevated">
            <div className="space-y-4">
              {/* Skills */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">Skills</span>
                  <span className={`font-bold ${getScoreColor(match.categoryScores.skills.score)}`}>
                    {match.categoryScores.skills.score}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all"
                    style={{ width: `${match.categoryScores.skills.score}%` }}
                  />
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {match.categoryScores.skills.details.matchedCount} of{' '}
                  {match.categoryScores.skills.details.totalRequired} skills matched
                </div>
              </div>

              {/* Experience */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">Experience</span>
                  <span className={`font-bold ${getScoreColor(match.categoryScores.experience.score)}`}>
                    {match.categoryScores.experience.score}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-green-600 h-3 rounded-full transition-all"
                    style={{ width: `${match.categoryScores.experience.score}%` }}
                  />
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {match.categoryScores.experience.details.yearsExperience} years experience
                  {match.categoryScores.experience.details.yearsRequired > 0 &&
                    ` (${match.categoryScores.experience.details.yearsRequired} required)`}
                </div>
              </div>

              {/* Education */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">Education</span>
                  <span className={`font-bold ${getScoreColor(match.categoryScores.education.score)}`}>
                    {match.categoryScores.education.score}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-purple-600 h-3 rounded-full transition-all"
                    style={{ width: `${match.categoryScores.education.score}%` }}
                  />
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {match.categoryScores.education.details.educationLevel} level
                </div>
              </div>

              {/* Additional */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">Additional Factors</span>
                  <span className={`font-bold ${getScoreColor(match.categoryScores.additional.score)}`}>
                    {match.categoryScores.additional.score}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-indigo-600 h-3 rounded-full transition-all"
                    style={{ width: `${match.categoryScores.additional.score}%` }}
                  />
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {match.categoryScores.additional.details.projects} projects,{' '}
                  {match.categoryScores.additional.details.certifications} certifications
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'strengths' && (
        <Card title="Your Strengths" variant="elevated">
          {match.strengths.length > 0 ? (
            <div className="space-y-3">
              {match.strengths.map((strength, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200"
                >
                  <svg
                    className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {strength.description}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        strength.impact === 'high' ? 'bg-green-200 text-green-800' :
                        strength.impact === 'medium' ? 'bg-blue-200 text-blue-800' :
                        'bg-gray-200 text-gray-800'
                      }`}>
                        {strength.impact} impact
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1 capitalize">
                      {strength.category}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No specific strengths identified</p>
          )}
        </Card>
      )}

      {activeTab === 'gaps' && (
        <Card title="Areas for Improvement" variant="elevated">
          {match.gaps.length > 0 ? (
            <div className="space-y-3">
              {match.gaps.map((gap, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border ${getSeverityColor(gap.severity)} border-current`}
                >
                  <div className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 mt-0.5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{gap.description}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white border border-current uppercase">
                          {gap.severity}
                        </span>
                      </div>
                      <div className="text-sm mb-2 capitalize text-gray-600">
                        Category: {gap.category}
                      </div>
                      <div className="text-sm bg-white bg-opacity-50 p-2 rounded border border-current border-opacity-30">
                        💡 <strong>Suggestion:</strong> {gap.suggestion}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <svg
                className="w-16 h-16 mx-auto text-green-500 mb-3"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-gray-700 font-medium">Great match!</p>
              <p className="text-gray-500 text-sm">No significant gaps identified</p>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'suggestions' && (
        <Card title="Improvement Suggestions" variant="elevated">
          {match.suggestions.length > 0 ? (
            <div className="space-y-4">
              {match.suggestions.map((suggestion, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={`px-2 py-1 rounded text-xs font-medium uppercase ${getPriorityColor(suggestion.priority)}`}>
                      {suggestion.priority}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{suggestion.title}</h4>
                      <p className="text-gray-700 text-sm mb-2">{suggestion.description}</p>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-green-600 font-medium">
                          +{suggestion.estimatedImpact} points potential impact
                        </span>
                      </div>
                      {suggestion.resources && suggestion.resources.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <div className="text-sm font-medium text-gray-700">Resources:</div>
                          {suggestion.resources.map((resource, resIdx) => (
                            <a
                              key={resIdx}
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                />
                              </svg>
                              {resource.title}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No suggestions at this time</p>
          )}
        </Card>
      )}

      {/* Close Button */}
      {onClose && (
        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      )}
    </div>
  );
}
