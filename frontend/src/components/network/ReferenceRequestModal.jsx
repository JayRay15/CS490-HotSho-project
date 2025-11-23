import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import api, { setAuthToken } from '../../api/axios';
import Button from '../Button';
import LoadingSpinner from '../LoadingSpinner';

export default function ReferenceRequestModal({ isOpen, onClose, reference, onSuccess }) {
  const { getToken } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedRequest, setGeneratedRequest] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchJobs();
    }
  }, [isOpen]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      setAuthToken(token);

      const response = await api.get('/api/jobs');
      // Expect jobs array at response.data.data.jobs
      const allJobs = response.data?.data?.jobs || [];
      // Filter for active jobs
      const activeJobs = allJobs.filter(
        job => job.status !== 'Rejected' && job.status !== 'Withdrawn' && !job.archived
      );
      setJobs(activeJobs);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Failed to load job applications');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedJobId) {
      alert('Please select a job application');
      return;
    }

    try {
      setGenerating(true);
      setError(null);
      const token = await getToken();
      setAuthToken(token);

      const response = await api.post('/api/contacts/reference-request', {
        referenceId: reference._id,
        jobId: selectedJobId
      });

      setGeneratedRequest(response.data.data);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Error generating request:', err);
      setError(err.response?.data?.message || 'Failed to generate reference request');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyEmail = () => {
    if (generatedRequest) {
      const fullEmail = `Subject: ${generatedRequest.subject}\n\n${generatedRequest.emailBody}`;
      navigator.clipboard.writeText(fullEmail);
      alert('Email copied to clipboard!');
    }
  };

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.48)' }}
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-bold">Request Reference</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Reference Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-900 mb-2">Reference</h4>
          <p className="text-lg font-semibold">
            {reference.firstName} {reference.lastName}
          </p>
          <p className="text-sm text-gray-600">
            {reference.jobTitle} {reference.company ? `at ${reference.company}` : ''}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {reference.relationshipType} • {reference.relationshipStrength} relationship
          </p>
        </div>

        <div className="p-6 space-y-6">

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {!generatedRequest ? (
            <>
              {/* Job Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Job Application
                </label>
                {loading ? (
                  <div className="flex justify-center py-4">
                    <LoadingSpinner />
                  </div>
                ) : (
                  <select
                    value={selectedJobId}
                    onChange={(e) => setSelectedJobId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">-- Select a job --</option>
                    {jobs.map((job) => (
                      <option key={job._id} value={job._id}>
                        {job.jobTitle || job.title} at {job.company} ({job.status})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <Button onClick={onClose} variant="outline">
                  Cancel
                </Button>
                <Button
                  onClick={handleGenerate}
                  disabled={!selectedJobId || generating}
                  className="bg-[#777C6D] hover:bg-[#656A5C] text-white"
                >
                  {generating ? 'Generating...' : 'Generate Request'}
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Generated Email */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Subject
                  </label>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-gray-900">{generatedRequest.subject}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Body
                  </label>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <pre className="whitespace-pre-wrap text-gray-900 font-sans text-sm">
                      {generatedRequest.emailBody}
                    </pre>
                  </div>
                </div>

                {/* Talking Points */}
                {generatedRequest.talkingPoints && generatedRequest.talkingPoints.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Suggested Talking Points for Reference
                    </h4>
                    <div className="space-y-3">
                      {generatedRequest.talkingPoints.map((point, index) => (
                        <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="font-medium text-blue-900">{point.point}</p>
                          <p className="text-sm text-blue-700 mt-1">{point.context}</p>
                          <p className="text-xs text-blue-600 mt-1">
                            <strong>Impact:</strong> {point.impact}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preparation Tips */}
                {generatedRequest.preparationTips && generatedRequest.preparationTips.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Preparation Tips
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                      {generatedRequest.preparationTips.map((tip, index) => (
                        <li key={index}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Timeline */}
                {generatedRequest.timeline && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm">
                      <strong className="text-yellow-900">Timeline:</strong>{' '}
                      <span className="text-yellow-700">{generatedRequest.timeline}</span>
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t pb-4">
                  <Button onClick={() => setGeneratedRequest(null)} variant="outline">
                    Generate New
                  </Button>
                  <Button
                    onClick={handleCopyEmail}
                    className="bg-[#777C6D] hover:bg-[#656A5C] text-white"
                  >
                    Copy Email
                  </Button>
                  <Button onClick={onClose} variant="outline">
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
