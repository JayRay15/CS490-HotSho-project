import { useState, useEffect } from 'react';
import { updateInformationalInterview, generatePreparationFramework } from '../api/informationalInterviews';
import LoadingSpinner from './LoadingSpinner';

export default function InterviewPreparationView({ isOpen, interview, onClose }) {
  const [preparation, setPreparation] = useState({
    questions: [],
    researchTopics: [],
    conversationTips: []
  });
  const [userNotes, setUserNotes] = useState(interview.preparationNotes?.userNotes || '');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (interview.preparationNotes?.questions?.length > 0) {
      setPreparation({
        questions: interview.preparationNotes.questions || [],
        researchTopics: interview.preparationNotes.researchTopics || [],
        conversationTips: []
      });
    }
  }, [interview]);

  const handleGeneratePreparation = async () => {
    setGenerating(true);
    setError(null);

    try {
      const response = await generatePreparationFramework({
        targetRole: interview.targetRole,
        targetCompany: interview.targetCompany,
        candidateName: interview.candidateName
      });

      const prepData = response.data.data.preparation;
      setPreparation(prepData);
    } catch (err) {
      console.error('Failed to generate preparation:', err);
      setError('Failed to generate preparation framework. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      await updateInformationalInterview(interview._id, {
        preparationNotes: {
          questions: preparation.questions,
          researchTopics: preparation.researchTopics,
          userNotes
        }
      });
      onClose();
    } catch (err) {
      console.error('Failed to save preparation:', err);
      setError('Failed to save preparation notes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-1">Interview Preparation</h2>
              <p className="text-blue-100 text-sm">
                {interview.candidateName} - {interview.targetRole} at {interview.targetCompany}
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

          {/* Generate Button */}
          {preparation.questions.length === 0 && (
            <div className="mb-6 text-center py-8 bg-blue-50 rounded-lg">
              <p className="text-gray-600 mb-4">
                Generate an AI-powered preparation framework with strategic questions and research topics
              </p>
              <button
                onClick={handleGeneratePreparation}
                disabled={generating}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
              >
                {generating ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    ✨ Generate Preparation Framework
                  </>
                )}
              </button>
            </div>
          )}

          {/* Strategic Questions */}
          {preparation.questions.length > 0 && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-900">📝 Strategic Questions to Ask</h3>
                <button
                  onClick={handleGeneratePreparation}
                  disabled={generating}
                  className="text-sm text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                >
                  {generating ? 'Regenerating...' : '🔄 Regenerate'}
                </button>
              </div>
              <div className="space-y-2">
                {preparation.questions.map((question, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-start">
                      <span className="text-indigo-600 font-bold mr-2">{idx + 1}.</span>
                      <p className="text-gray-800">{question}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Research Checklist */}
          {preparation.researchTopics.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">🔍 Research Checklist</h3>
              <div className="space-y-2">
                {preparation.researchTopics.map((topic, idx) => (
                  <div key={idx} className="flex items-start bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                    <input
                      type="checkbox"
                      className="mt-1 mr-3 h-4 w-4 text-indigo-600 rounded"
                    />
                    <p className="text-gray-800">{topic}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conversation Tips */}
          {preparation.conversationTips && preparation.conversationTips.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">💡 Conversation Tips</h3>
              <div className="space-y-2">
                {preparation.conversationTips.map((tip, idx) => (
                  <div key={idx} className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <p className="text-gray-800">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User Notes */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">📋 Your Notes</h3>
            <textarea
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Take notes during or after the interview...&#10;&#10;Key takeaways:&#10;- ...&#10;&#10;Action items:&#10;- ..."
            />
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
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Preparation'}
          </button>
        </div>
      </div>
    </div>
  );
}
