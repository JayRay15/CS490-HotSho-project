import { useState, useEffect } from 'react';
import { X, Calendar, Package, Send, Clock } from 'lucide-react';
import Button from './Button';
import { generateApplicationPackage, scheduleApplication } from '../api/applications';
import { fetchResumes } from '../api/resumes';
import { fetchCoverLetters } from '../api/coverLetters';

const ApplicationPackageGenerator = ({ job, onClose, onSuccess }) => {
  const [step, setStep] = useState(1); // 1: Select files, 2: Schedule
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Available resumes and cover letters
  const [resumes, setResumes] = useState([]);
  const [coverLetters, setCoverLetters] = useState([]);
  const [loadingResources, setLoadingResources] = useState(true);
  
  // Selected options
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [selectedCoverLetterId, setSelectedCoverLetterId] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [autoTailor, setAutoTailor] = useState(false);
  
  // Scheduling options
  const [shouldSchedule, setShouldSchedule] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [autoSubmit, setAutoSubmit] = useState(false);
  
  // Generated package
  const [generatedPackage, setGeneratedPackage] = useState(null);

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      setLoadingResources(true);
      const [resumesResponse, coverLettersResponse] = await Promise.all([
        fetchResumes(),
        fetchCoverLetters()
      ]);
      
      // Extract the actual data arrays from the response
      // API returns { data: { data: { resumes: [...] } } }
      const resumesList = resumesResponse?.data?.data?.resumes || [];
      const coverLettersList = coverLettersResponse?.data?.data?.coverLetters || [];
      
      setResumes(resumesList);
      setCoverLetters(coverLettersList);
      
      // Auto-select most recent if available
      if (resumesList.length > 0) {
        setSelectedResumeId(resumesList[0]._id);
      }
      if (coverLettersList.length > 0) {
        setSelectedCoverLetterId(coverLettersList[0]._id);
      }
    } catch (err) {
      console.error('Failed to load resources:', err);
      setError('Failed to load resumes and cover letters');
    } finally {
      setLoadingResources(false);
    }
  };

  const handleGeneratePackage = async () => {
    try {
      setLoading(true);
      setError('');
      
      const packageData = {
        jobId: job._id,
        resumeId: selectedResumeId || undefined,
        coverLetterId: selectedCoverLetterId || undefined,
        portfolioUrl: portfolioUrl || undefined,
        autoTailor
      };
      
      const result = await generateApplicationPackage(packageData);
      setGeneratedPackage(result.data);
      
      if (shouldSchedule) {
        setStep(2);
      } else {
        onSuccess?.(result.data);
      }
    } catch (err) {
      console.error('Failed to generate package:', err);
      setError(err.response?.data?.message || 'Failed to generate application package');
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async () => {
    try {
      setLoading(true);
      setError('');
      
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      
      const scheduleData = {
        packageId: generatedPackage._id,
        scheduledFor: scheduledDateTime.toISOString(),
        autoSubmit
      };
      
      const result = await scheduleApplication(scheduleData);
      onSuccess?.(result.data);
    } catch (err) {
      console.error('Failed to schedule application:', err);
      setError(err.response?.data?.message || 'Failed to schedule application');
    } finally {
      setLoading(false);
    }
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const selectedResume = resumes.find(r => r._id === selectedResumeId);
  const selectedCoverLetter = coverLetters.find(c => c._id === selectedCoverLetterId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {step === 1 ? 'Generate Application Package' : 'Schedule Application'}
              </h2>
              <p className="text-sm text-gray-600">
                {job.title} at {job.company}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {step === 1 && (
            <div className="space-y-6">
              {/* Resume Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Resume
                </label>
                {loadingResources ? (
                  <div className="text-sm text-gray-500">Loading resumes...</div>
                ) : resumes.length === 0 ? (
                  <div className="text-sm text-gray-500">
                    No resumes found. Please create a resume first.
                  </div>
                ) : (
                  <select
                    value={selectedResumeId}
                    onChange={(e) => setSelectedResumeId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Use most recent</option>
                    {resumes.map((resume) => (
                      <option key={resume._id} value={resume._id}>
                        {resume.name} - {new Date(resume.updatedAt).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Cover Letter Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Cover Letter
                </label>
                {loadingResources ? (
                  <div className="text-sm text-gray-500">Loading cover letters...</div>
                ) : coverLetters.length === 0 ? (
                  <div className="text-sm text-gray-500">
                    No cover letters found. You can proceed without one.
                  </div>
                ) : (
                  <select
                    value={selectedCoverLetterId}
                    onChange={(e) => setSelectedCoverLetterId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Use most recent</option>
                    {coverLetters.map((letter) => (
                      <option key={letter._id} value={letter._id}>
                        {letter.name || letter.position} - {new Date(letter.createdAt).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Portfolio URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Portfolio URL (Optional)
                </label>
                <input
                  type="url"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  placeholder="https://myportfolio.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Auto-tailor Option */}
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                <input
                  type="checkbox"
                  id="autoTailor"
                  checked={autoTailor}
                  onChange={(e) => setAutoTailor(e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="autoTailor" className="flex-1 text-sm">
                  <span className="font-medium text-gray-900">Auto-tailor for this position</span>
                  <p className="text-gray-600 mt-1">
                    Automatically customize the resume and cover letter based on the job description
                  </p>
                </label>
              </div>

              {/* Schedule Option */}
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="shouldSchedule"
                  checked={shouldSchedule}
                  onChange={(e) => setShouldSchedule(e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="shouldSchedule" className="flex-1 text-sm">
                  <span className="font-medium text-gray-900 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Schedule submission for later
                  </span>
                  <p className="text-gray-600 mt-1">
                    Choose a specific date and time to submit this application
                  </p>
                </label>
              </div>

              {/* Package Preview */}
              {selectedResume || selectedCoverLetter ? (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h3 className="font-medium text-gray-900 mb-3">Package Preview</h3>
                  <div className="space-y-2 text-sm">
                    {selectedResume && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <span className="font-medium">Resume:</span>
                        <span>{selectedResume.name}</span>
                      </div>
                    )}
                    {selectedCoverLetter && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <span className="font-medium">Cover Letter:</span>
                        <span>{selectedCoverLetter.name || selectedCoverLetter.position}</span>
                      </div>
                    )}
                    {portfolioUrl && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <span className="font-medium">Portfolio:</span>
                        <span className="text-blue-600 truncate">{portfolioUrl}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 font-medium">✓ Package generated successfully!</p>
              </div>

              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Schedule Date
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={getMinDate()}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Time Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Schedule Time
                </label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Auto-submit Option */}
              <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg">
                <input
                  type="checkbox"
                  id="autoSubmit"
                  checked={autoSubmit}
                  onChange={(e) => setAutoSubmit(e.target.checked)}
                  className="mt-1 w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                />
                <label htmlFor="autoSubmit" className="flex-1 text-sm">
                  <span className="font-medium text-gray-900">Enable auto-submit</span>
                  <p className="text-gray-600 mt-1">
                    Automatically submit the application at the scheduled time
                  </p>
                </label>
              </div>

              {scheduledDate && (
                <div className="border border-gray-200 rounded-lg p-4 bg-blue-50">
                  <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Scheduled For
                  </h3>
                  <p className="text-sm text-gray-700">
                    {new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {step === 1 ? 'Step 1 of ' + (shouldSchedule ? '2' : '1') : 'Step 2 of 2'}
          </div>
          <div className="flex items-center gap-3">
            {step === 2 && (
              <Button
                variant="secondary"
                onClick={() => setStep(1)}
                disabled={loading}
              >
                Back
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            {step === 1 ? (
              <Button
                onClick={handleGeneratePackage}
                disabled={loading || loadingResources}
                className="flex items-center gap-2"
              >
                {loading ? (
                  'Generating...'
                ) : (
                  <>
                    <Package className="w-4 h-4" />
                    {shouldSchedule ? 'Next' : 'Generate Package'}
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleSchedule}
                disabled={loading || !scheduledDate}
                className="flex items-center gap-2"
              >
                {loading ? (
                  'Scheduling...'
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Schedule Application
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationPackageGenerator;
