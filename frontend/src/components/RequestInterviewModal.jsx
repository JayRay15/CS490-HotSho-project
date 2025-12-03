import { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { createInformationalInterview, generateOutreachEmail } from '../api/informationalInterviews';
import { setAuthToken } from '../api/axios';
import LoadingSpinner from './LoadingSpinner';

export default function RequestInterviewModal({ isOpen, onClose }) {
  const { getToken } = useAuth();
  const [formData, setFormData] = useState({
    candidateName: '',
    targetRole: '',
    targetCompany: '',
    candidateEmail: '',
    candidateLinkedIn: '',
    userBackground: '',
    userGoal: '',
    tags: []
  });
  const [outreachContent, setOutreachContent] = useState('');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerateOutreach = async () => {
    if (!formData.candidateName || !formData.targetRole || !formData.targetCompany) {
      setError('Please fill in candidate name, role, and company first');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const token = await getToken();
      setAuthToken(token);
      const response = await generateOutreachEmail({
        candidateName: formData.candidateName,
        targetRole: formData.targetRole,
        targetCompany: formData.targetCompany,
        userBackground: formData.userBackground,
        userGoal: formData.userGoal
      });

      setOutreachContent(response.data.data.outreachContent);
    } catch (err) {
      console.error('Failed to generate outreach:', err);
      setError('Failed to generate outreach email. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.candidateName || !formData.targetRole || !formData.targetCompany) {
      setError('Please fill in all required fields');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const token = await getToken();
      setAuthToken(token);
      const dataToSubmit = {
        ...formData,
        outreachContent,
        status: 'Identified'
      };

      await createInformationalInterview(dataToSubmit);
      onClose();
    } catch (err) {
      console.error('Failed to create interview:', err);
      setError('Failed to create informational interview. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-1">Request Informational Interview</h2>
              <p className="text-indigo-100 text-sm">
                Identify a candidate and generate a professional outreach email
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
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Candidate Information */}
          <div className="space-y-4 mb-6">
            <h3 className="font-semibold text-gray-900">Candidate Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Candidate Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="candidateName"
                value={formData.candidateName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="John Doe"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Their Role <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="targetRole"
                  value={formData.targetRole}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Senior Software Engineer"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Their Company <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="targetCompany"
                  value={formData.targetCompany}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Tech Corp"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  name="candidateEmail"
                  value={formData.candidateEmail}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  LinkedIn Profile (Optional)
                </label>
                <input
                  type="url"
                  name="candidateLinkedIn"
                  value={formData.candidateLinkedIn}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="https://linkedin.com/in/..."
                />
              </div>
            </div>
          </div>

          {/* Outreach Context */}
          <div className="space-y-4 mb-6">
            <h3 className="font-semibold text-gray-900">Your Context (for AI generation)</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Background
              </label>
              <textarea
                name="userBackground"
                value={formData.userBackground}
                onChange={handleChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Recent graduate in Computer Science, interested in web development..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Goal for this Interview
              </label>
              <textarea
                name="userGoal"
                value={formData.userGoal}
                onChange={handleChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Learn about career path in software engineering, understand day-to-day work..."
              />
            </div>

            <button
              type="button"
              onClick={handleGenerateOutreach}
              disabled={generating || !formData.candidateName || !formData.targetRole || !formData.targetCompany}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {generating ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  ✨ Generate Outreach Email
                </>
              )}
            </button>
          </div>

          {/* Generated Outreach */}
          {outreachContent && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Generated Outreach Email
              </label>
              <textarea
                value={outreachContent}
                onChange={(e) => setOutreachContent(e.target.value)}
                rows={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                placeholder="Generated email will appear here..."
              />
              <p className="text-xs text-gray-500 mt-1">
                You can edit the generated email before saving
              </p>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-4 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !formData.candidateName || !formData.targetRole || !formData.targetCompany}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Interview'}
          </button>
        </div>
      </div>
    </div>
  );
}
