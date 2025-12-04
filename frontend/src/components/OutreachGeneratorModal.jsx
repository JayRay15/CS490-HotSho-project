import { useState } from 'react';
import { X, Mail, Loader2, Copy, Check } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { generateOutreachEmail, markOutreachSent } from '../api/informationalInterview';
import { setAuthToken } from '../api/axios';
import Button from './Button';
import { toast } from 'react-hot-toast';

const OutreachGeneratorModal = ({ isOpen, onClose, interview, onSuccess }) => {
  const { getToken } = useAuth();
  const [context, setContext] = useState('');
  const [userGoal, setUserGoal] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState(false);

  const refreshToken = async () => {
    const token = await getToken();
    setAuthToken(token);
  };

  const contextOptions = [
    'Alumni from my school',
    'LinkedIn connection',
    'Referred by mutual contact',
    'Met at networking event',
    'Cold outreach (no prior connection)',
    'Professional association member',
    'Other'
  ];

  const handleGenerate = async () => {
    if (!context || !userGoal) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsGenerating(true);
    try {
      await refreshToken();
      const response = await generateOutreachEmail(interview._id, context, userGoal);
      setEmailContent(response.data?.emailContent || response.emailContent);
      toast.success('Email template generated!');
    } catch (error) {
      console.error('Error generating email:', error);
      toast.error(error.response?.data?.message || 'Failed to generate email');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(emailContent);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const handleMarkSent = async () => {
    setIsSending(true);
    try {
      await refreshToken();
      await markOutreachSent(interview._id, emailContent);
      toast.success('Outreach marked as sent!');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error marking outreach sent:', error);
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    setContext('');
    setUserGoal('');
    setEmailContent('');
    setCopied(false);
    onClose();
  };

  if (!isOpen) return null;

  const contact = interview?.contactId;
  const contactName = contact ? `${contact.firstName} ${contact.lastName || ''}`.trim() : 'Contact';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Generate Outreach Email</h2>
            <p className="text-sm text-gray-600 mt-1">To: {contactName}</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Input Section */}
          {!emailContent && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Connection Context
                </label>
                <select
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Select how you know them...</option>
                  {contextOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Goal
                </label>
                <textarea
                  value={userGoal}
                  onChange={(e) => setUserGoal(e.target.value)}
                  placeholder="What do you hope to learn or achieve from this conversation? (e.g., 'Learn about the transition from engineering to product management' or 'Understand the day-to-day of working in fintech')"
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !context || !userGoal}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Email...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Generate Email Template
                  </>
                )}
              </Button>
            </>
          )}

          {/* Generated Email */}
          {emailContent && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Generated Email (Editable)
                </label>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <textarea
                value={emailContent}
                onChange={(e) => setEmailContent(e.target.value)}
                rows={16}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-2">
                Feel free to edit the email before sending. Click "Mark as Sent" once you've sent the email.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between gap-3 p-6 border-t bg-gray-50">
          {emailContent && (
            <Button
              variant="outline"
              onClick={() => setEmailContent('')}
            >
              Regenerate
            </Button>
          )}
          <div className="flex gap-3 ml-auto">
            <Button
              variant="outline"
              onClick={handleClose}
            >
              Cancel
            </Button>
            {emailContent && (
              <Button
                onClick={handleMarkSent}
                disabled={isSending}
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Mark as Sent'
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OutreachGeneratorModal;
