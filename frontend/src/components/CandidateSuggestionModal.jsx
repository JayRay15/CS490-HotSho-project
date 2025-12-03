import { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { suggestCandidates, createInformationalInterview } from '../api/informationalInterviews';
import { setAuthToken } from '../api/axios';
import LoadingSpinner from './LoadingSpinner';

export default function CandidateSuggestionModal({ isOpen, onClose }) {
  const { getToken } = useAuth();
  const [formData, setFormData] = useState({
    targetRole: '',
    targetCompany: '',
    targetIndustry: '',
    userBackground: '',
    careerGoals: ''
  });
  const [suggestions, setSuggestions] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [creating, setCreating] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerate = async () => {
    if (!formData.targetRole && !formData.targetCompany && !formData.targetIndustry) {
      setError('Please fill in at least one of: target role, company, or industry');
      return;
    }

    setGenerating(true);
    setError(null);
    setSuggestions([]);

    try {
      const token = await getToken();
      setAuthToken(token);
      const response = await suggestCandidates(formData);
      setSuggestions(response.data.data.suggestions || []);
    } catch (err) {
      console.error('Failed to generate suggestions:', err);
      setError('Failed to generate candidate suggestions. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleAddToList = async (suggestion) => {
    setCreating(suggestion.jobTitle);
    try {
      const token = await getToken();
      setAuthToken(token);
      await createInformationalInterview({
        candidateName: `Target: ${suggestion.jobTitle}`,
        targetRole: suggestion.jobTitle,
        targetCompany: formData.targetCompany || 'To be identified',
        preparationNotes: {
          questions: suggestion.keyQuestions || [],
          researchTopics: [suggestion.whereToFind || ''],
          userNotes: `Why this person: ${suggestion.whyThisPerson}\n\nOutreach tip: ${suggestion.outreachTip}`
        },
        status: 'Identified',
        tags: ['AI Suggested', formData.targetIndustry].filter(Boolean)
      });
      
      // Mark as added
      setSuggestions(prev => prev.map(s => 
        s.jobTitle === suggestion.jobTitle ? { ...s, added: true } : s
      ));
    } catch (err) {
      console.error('Failed to add candidate:', err);
      alert('Failed to add candidate to list');
    } finally {
      setCreating(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-1">🔍 Find Interview Candidates</h2>
              <p className="text-purple-100 text-sm">
                AI-powered suggestions for valuable informational interview targets
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Search Form */}
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Role
                </label>
                <input
                  type="text"
                  name="targetRole"
                  value={formData.targetRole}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="e.g., Product Manager"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Company
                </label>
                <input
                  type="text"
                  name="targetCompany"
                  value={formData.targetCompany}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="e.g., Google, Meta"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Industry
                </label>
                <input
                  type="text"
                  name="targetIndustry"
                  value={formData.targetIndustry}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="e.g., Fintech, Healthcare"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Background
                </label>
                <textarea
                  name="userBackground"
                  value={formData.userBackground}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Brief summary of your experience..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Career Goals
                </label>
                <textarea
                  name="careerGoals"
                  value={formData.careerGoals}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="What you hope to learn or achieve..."
                />
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {generating ? (
                <span className="inline-flex items-center">
                  <LoadingSpinner size="sm" className="mr-2" />
                  Finding Candidates...
                </span>
              ) : (
                '✨ Generate Candidate Suggestions'
              )}
            </button>
          </div>

          {/* Suggestions List */}
          {suggestions.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">
                Suggested Interview Targets ({suggestions.length})
              </h3>
              
              {suggestions.map((suggestion, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">{suggestion.jobTitle}</h4>
                      <p className="text-sm text-gray-600">{suggestion.whyThisPerson}</p>
                    </div>
                    <button
                      onClick={() => handleAddToList(suggestion)}
                      disabled={creating === suggestion.jobTitle || suggestion.added}
                      className={`px-3 py-1 rounded text-sm font-medium transition ${
                        suggestion.added
                          ? 'bg-green-100 text-green-700 cursor-default'
                          : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                      } disabled:opacity-50`}
                    >
                      {creating === suggestion.jobTitle ? 'Adding...' : suggestion.added ? '✓ Added' : '+ Add to List'}
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Key Questions:</p>
                      <ul className="text-sm text-gray-700 list-disc list-inside">
                        {suggestion.keyQuestions?.map((q, i) => (
                          <li key={i}>{q}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Where to Find:</p>
                      <p className="text-sm text-gray-700">{suggestion.whereToFind}</p>
                      
                      <p className="text-xs font-medium text-gray-500 mt-2 mb-1">Outreach Tip:</p>
                      <p className="text-sm text-gray-700 italic">{suggestion.outreachTip}</p>
                    </div>
                  </div>
                </div>
              ))}
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
