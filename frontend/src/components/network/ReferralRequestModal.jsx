import React, { useState, useEffect } from 'react';
import { X, Sparkles, AlertCircle, CheckCircle, Send } from 'lucide-react';
import { generateReferralTemplate, createReferral } from '../../api/referralApi';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';
import Button from '../Button';

const ReferralRequestModal = ({ isOpen, onClose, contact, onSuccess }) => {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [tone, setTone] = useState('professional');
  const [requestContent, setRequestContent] = useState('');
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedGuidance, setGeneratedGuidance] = useState(null);
  const [showGuidance, setShowGuidance] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadJobs();
    }
  }, [isOpen]);

  const loadJobs = async () => {
    try {
      const response = await api.get('/api/jobs');
      const allJobs = response.data?.data?.jobs || [];
      
      // Filter to active job applications (not rejected or archived)
      const activeJobs = allJobs.filter(
        job => job.status !== 'Rejected' && !job.archived
      );
      setJobs(activeJobs);
    } catch (error) {
      console.error('Error loading jobs:', error);
      toast.error('Failed to load jobs');
    }
  };

  const handleGenerateTemplate = async () => {
    if (!selectedJobId) {
      toast.error('Please select a job first');
      return;
    }

    setIsGenerating(true);
    try {
      const resp = await generateReferralTemplate({
        jobId: selectedJobId,
        contactId: contact._id,
        tone
      });

      // resp is the backend response object: { success, message, data }
      const generated = resp.data || {};
      setRequestContent(generated.message || '');
      setGeneratedGuidance(generated);
      setShowGuidance(true);
      toast.success(resp.message || 'Template generated successfully!');
    } catch (error) {
      console.error('Error generating template:', error);
      toast.error(error.response?.data?.message || 'Failed to generate template');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async (status = 'draft') => {
    if (!selectedJobId || !requestContent.trim()) {
      toast.error('Please select a job and enter request content');
      return;
    }

    setIsSaving(true);
    try {
      await createReferral({
        jobId: selectedJobId,
        contactId: contact._id,
        status,
        requestContent,
        tone,
        notes,
        followUpDate: followUpDate || null,
        etiquetteScore: generatedGuidance?.etiquetteScore || 0,
        timingScore: generatedGuidance?.timingScore || 0
      });

      toast.success(
        status === 'draft' 
          ? 'Referral request saved as draft' 
          : 'Referral request marked as sent!'
      );
      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error('Error saving referral:', error);
      toast.error(error.response?.data?.message || 'Failed to save referral request');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setSelectedJobId('');
    setTone('professional');
    setRequestContent('');
    setNotes('');
    setFollowUpDate('');
    setGeneratedGuidance(null);
    setShowGuidance(false);
    onClose();
  };

  if (!isOpen) return null;

  const selectedJob = jobs.find(job => job._id === selectedJobId);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.48)' }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Request Referral</h2>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-500">
              {contact.firstName} {contact.lastName}
              {contact.company && ` • ${contact.company}`}
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Job Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Job Application *
            </label>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Choose a job...</option>
              {jobs.map(job => (
                <option key={job._id} value={job._id}>
                  {job.title} at {job.company} ({job.status})
                </option>
              ))}
            </select>
          </div>

          {/* Tone Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message Tone
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['formal', 'professional', 'friendly', 'casual'].map(t => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={`px-4 py-2 rounded-lg border-2 transition ${
                    tone === t
                      ? 'border-primary-600 bg-primary-50 text-primary-700 font-medium'
                      : 'border-gray-200 text-gray-700 hover:border-primary-300'
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerateTemplate}
            disabled={!selectedJobId || isGenerating}
            className="w-full flex items-center justify-center gap-2"
            isLoading={isGenerating}
          >
            <Sparkles size={20} />
            {isGenerating ? 'Generating Template...' : 'Generate AI Template'}
          </Button>

          {/* Request Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Referral Request Message *
            </label>
            <textarea
              value={requestContent}
              onChange={(e) => setRequestContent(e.target.value)}
              rows={8}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Your referral request message will appear here after generation, or you can write your own..."
            />
          </div>

          {/* AI Guidance Panel */}
          {showGuidance && generatedGuidance && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-blue-700 font-medium">
                <AlertCircle size={20} />
                AI Guidance & Best Practices
              </div>

              {/* Scores */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded p-3">
                  <div className="text-xs text-gray-600 mb-1">Etiquette Score</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {generatedGuidance.etiquetteScore || 8}/10
                  </div>
                </div>
                <div className="bg-white rounded p-3">
                  <div className="text-xs text-gray-600 mb-1">Timing Score</div>
                  <div className="text-2xl font-bold text-green-600">
                    {generatedGuidance.timingScore || 7}/10
                  </div>
                </div>
              </div>

              {/* Etiquette Guidance */}
              {generatedGuidance.etiquetteGuidance && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    Etiquette Tips:
                  </div>
                  <ul className="space-y-1 text-sm text-gray-600">
                    {generatedGuidance.etiquetteGuidance.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Timing & Follow-up */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium text-gray-700 mb-1">Best Timing:</div>
                  <div className="text-gray-600">{generatedGuidance.timingRecommendation}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-700 mb-1">Follow-up:</div>
                  <div className="text-gray-600">{generatedGuidance.followUpSuggestion}</div>
                </div>
              </div>

              {/* Success Probability */}
              {generatedGuidance.successProbability && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-700">Success Probability:</span>
                  <span className={`px-2 py-1 rounded font-medium ${
                    generatedGuidance.successProbability === 'high'
                      ? 'bg-green-100 text-green-700'
                      : generatedGuidance.successProbability === 'medium'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {generatedGuidance.successProbability.toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Private Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Any private notes about this referral request..."
            />
          </div>

          {/* Follow-up Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Follow-up Date (Optional)
            </label>
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
          {/* Footer */}
          <div className="border-t bg-gray-50 px-6 py-4 flex items-center justify-end gap-3">
            <Button type="button" variant="secondary" onClick={handleClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSave('draft')}
              disabled={isSaving || !selectedJobId || !requestContent.trim()}
            >
              Save as Draft
            </Button>
            <Button
              type="button"
              onClick={() => handleSave('requested')}
              disabled={isSaving || !selectedJobId || !requestContent.trim()}
              isLoading={isSaving}
            >
              <Send size={16} />
              {isSaving ? 'Saving...' : 'Mark as Sent'}
            </Button>
          </div>
      </div>
    </div>
  );
};

export default ReferralRequestModal;
