import { useState, useEffect } from 'react';
import { updateInformationalInterview, generateFollowUpEmail } from '../api/informationalInterviews';
import LoadingSpinner from './LoadingSpinner';

export default function OutcomeModal({ isOpen, interview, onClose }) {
  const [outcomes, setOutcomes] = useState({
    keyLearnings: '',
    industryInsights: '',
    referralObtained: false,
    referralDetails: '',
    futureOpportunities: '',
    connectionQuality: ''
  });
  const [followUpContent, setFollowUpContent] = useState('');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (interview.outcomes) {
      setOutcomes({
        keyLearnings: interview.outcomes.keyLearnings || '',
        industryInsights: interview.outcomes.industryInsights || '',
        referralObtained: interview.outcomes.referralObtained || false,
        referralDetails: interview.outcomes.referralDetails || '',
        futureOpportunities: interview.outcomes.futureOpportunities || '',
        connectionQuality: interview.outcomes.connectionQuality || ''
      });
    }
    if (interview.followUpContent) {
      setFollowUpContent(interview.followUpContent);
    }
  }, [interview]);

  const handleChange = (field, value) => {
    setOutcomes(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerateFollowUp = async () => {
    setGenerating(true);
    setError(null);

    try {
      const response = await generateFollowUpEmail({
        candidateName: interview.candidateName,
        targetRole: interview.targetRole,
        keyLearnings: outcomes.keyLearnings,
        referralObtained: outcomes.referralObtained
      });

      setFollowUpContent(response.data.data.followUpContent);
    } catch (err) {
      console.error('Failed to generate follow-up:', err);
      setError('Failed to generate follow-up email. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      // Calculate impact score based on outcomes
      const updates = {
        outcomes,
        followUpContent,
        status: followUpContent ? 'Follow-up Sent' : 'Completed',
        dates: {
          ...interview.dates,
          followUpDate: followUpContent ? new Date() : interview.dates.followUpDate
        }
      };

      await updateInformationalInterview(interview._id, updates);
      onClose();
    } catch (err) {
      console.error('Failed to save outcomes:', err);
      setError('Failed to save outcomes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-1">Record Interview Outcomes</h2>
              <p className="text-green-100 text-sm">
                {interview.candidateName} - {interview.targetRole}
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
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Key Learnings */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                🎯 Key Learnings
              </label>
              <textarea
                value={outcomes.keyLearnings}
                onChange={(e) => handleChange('keyLearnings', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="What were the most valuable insights you gained from this conversation?"
              />
            </div>

            {/* Industry Insights */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                🔍 Industry Insights
              </label>
              <textarea
                value={outcomes.industryInsights}
                onChange={(e) => handleChange('industryInsights', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Any industry trends, challenges, or opportunities discussed?"
              />
            </div>

            {/* Referral Information */}
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center mb-3">
                <input
                  type="checkbox"
                  id="referralObtained"
                  checked={outcomes.referralObtained}
                  onChange={(e) => handleChange('referralObtained', e.target.checked)}
                  className="h-4 w-4 text-purple-600 rounded mr-2"
                />
                <label htmlFor="referralObtained" className="text-sm font-medium text-gray-700">
                  🤝 Referral or Introduction Obtained
                </label>
              </div>
              
              {outcomes.referralObtained && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Referral Details
                  </label>
                  <textarea
                    value={outcomes.referralDetails}
                    onChange={(e) => handleChange('referralDetails', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Who were you referred to? What position or opportunity?"
                  />
                </div>
              )}
            </div>

            {/* Future Opportunities */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                🚀 Future Opportunities
              </label>
              <textarea
                value={outcomes.futureOpportunities}
                onChange={(e) => handleChange('futureOpportunities', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Any potential job opportunities, projects, or connections mentioned?"
              />
            </div>

            {/* Connection Quality */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                📊 Connection Quality
              </label>
              <select
                value={outcomes.connectionQuality}
                onChange={(e) => handleChange('connectionQuality', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Select...</option>
                <option value="Weak">Weak - Brief conversation, unlikely to reconnect</option>
                <option value="Moderate">Moderate - Good conversation, may stay in touch</option>
                <option value="Strong">Strong - Great rapport, potential mentor/advocate</option>
              </select>
            </div>

            {/* Generate Follow-up */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-900">✉️ Follow-up Email</h3>
                <button
                  onClick={handleGenerateFollowUp}
                  disabled={generating || !outcomes.keyLearnings}
                  className="text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? 'Generating...' : '✨ Generate'}
                </button>
              </div>
              
              <textarea
                value={followUpContent}
                onChange={(e) => setFollowUpContent(e.target.value)}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 font-mono text-sm"
                placeholder="Generate a thank-you follow-up email..."
              />
              <p className="text-xs text-gray-500 mt-1">
                A personalized thank-you email helps maintain the relationship
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-4 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Outcomes'}
          </button>
        </div>
      </div>
    </div>
  );
}
