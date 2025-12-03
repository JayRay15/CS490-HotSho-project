import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { generateInsights } from '../api/informationalInterviews';
import { setAuthToken } from '../api/axios';
import LoadingSpinner from './LoadingSpinner';
import Card from './Card';

// Helper function to safely extract text from string or object
const getTextContent = (item) => {
  if (typeof item === 'string') return item;
  if (typeof item === 'object' && item !== null) {
    // Try common keys that might contain the text
    return item.text || item.content || item.description || item.value || 
           item.trend || item.pattern || item.path || item.recommendation || 
           item.opportunity || item.skill || item.name || item.tip ||
           JSON.stringify(item);
  }
  return String(item);
};

export default function InsightsPanel({ isOpen, onClose }) {
  const { getToken } = useAuth();
  const [insights, setInsights] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadInsights = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const token = await getToken();
      setAuthToken(token);
      const response = await generateInsights();
      setInsights(response.data.data.insights);
      setMessage(response.data.data.message || null);
    } catch (err) {
      console.error('Failed to load insights:', err);
      setError('Failed to generate insights. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (isOpen) {
      loadInsights();
    }
  }, [isOpen, loadInsights]);

  if (!isOpen) return null;

  // Handler for clicking the backdrop
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.48)' }}
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">💡 Industry Insights</h2>
            <p className="text-gray-500 text-sm">
              AI-generated intelligence from your completed informational interviews
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800 text-sm">{error}</p>
              <button
                onClick={loadInsights}
                className="mt-2 text-sm text-red-600 hover:text-red-800"
              >
                Try Again
              </button>
            </div>
          )}

          {loading && (
            <div className="py-12 text-center">
              <LoadingSpinner text="Analyzing your interviews..." />
            </div>
          )}

          {!loading && !insights && !error && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600 mb-4">
                {message || 'Complete some informational interviews and record outcomes to generate insights'}
              </p>
              <p className="text-sm text-gray-500">
                To get insights, mark interviews as "Completed" and fill in the outcomes section with key learnings.
              </p>
            </div>
          )}

          {!loading && insights && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-[#E4E6E0] rounded-lg p-4 border border-[#d4d6d0]">
                <p className="text-[#4F5348] text-sm">
                  ✨ Insights based on <strong>{insights.basedOnInterviews || 0}</strong> completed interviews
                  {insights.generatedAt && (
                    <span className="ml-2 text-[#656A5C]">
                      (Generated: {new Date(insights.generatedAt).toLocaleDateString()})
                    </span>
                  )}
                </p>
              </div>

              {/* Industry Trends */}
              {insights.industryTrends?.length > 0 && (
                <Card variant="elevated">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="text-xl mr-2">📈</span> Industry Trends
                  </h3>
                  <ul className="space-y-2">
                    {insights.industryTrends.map((trend, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-amber-500 mr-2">•</span>
                        <span className="text-gray-700">{getTextContent(trend)}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {/* Skill Priorities */}
              {insights.skillPriorities?.length > 0 && (
                <Card variant="elevated">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="text-xl mr-2">🎯</span> Skills in Demand
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {insights.skillPriorities.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                      >
                        {getTextContent(skill)}
                      </span>
                    ))}
                  </div>
                </Card>
              )}

              {/* Cultural Patterns */}
              {insights.culturalPatterns?.length > 0 && (
                <Card variant="elevated">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="text-xl mr-2">🏢</span> Company Culture Insights
                  </h3>
                  <ul className="space-y-2">
                    {insights.culturalPatterns.map((pattern, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-purple-500 mr-2">•</span>
                        <span className="text-gray-700">{getTextContent(pattern)}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {/* Career Paths */}
              {insights.careerPaths?.length > 0 && (
                <Card variant="elevated">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="text-xl mr-2">🛤️</span> Career Path Insights
                  </h3>
                  <ul className="space-y-2">
                    {insights.careerPaths.map((path, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-green-500 mr-2">•</span>
                        <span className="text-gray-700">{getTextContent(path)}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {/* Recommendations */}
              {insights.recommendations?.length > 0 && (
                <Card variant="elevated" className="bg-gradient-to-br from-green-50 to-emerald-50">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="text-xl mr-2">✅</span> Recommended Actions
                  </h3>
                  <ol className="space-y-3 list-decimal list-inside">
                    {insights.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-gray-700">
                        {getTextContent(rec)}
                      </li>
                    ))}
                  </ol>
                </Card>
              )}

              {/* Networking Opportunities */}
              {insights.networkingOpportunities?.length > 0 && (
                <Card variant="elevated">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="text-xl mr-2">🤝</span> Networking Opportunities
                  </h3>
                  <ul className="space-y-2">
                    {insights.networkingOpportunities.map((opp, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-indigo-500 mr-2">→</span>
                        <span className="text-gray-700">{getTextContent(opp)}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {/* Refresh Button */}
              <div className="text-center pt-4">
                <button
                  onClick={loadInsights}
                  className="px-4 py-2 text-[#656A5C] hover:text-[#4F5348] font-medium"
                >
                  🔄 Regenerate Insights
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
