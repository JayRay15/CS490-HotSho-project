import { useState } from 'react';
import { Mail, AlertCircle, CheckCircle, TrendingUp, X, Sparkles } from 'lucide-react';
import { detectStatusFromEmail, formatStatus } from '../api/applicationStatus';
import axiosInstance from '../api/axios';

const EmailStatusDetector = ({ jobId, isOpen, onClose, onDetectionConfirmed }) => {
  const [emailData, setEmailData] = useState({
    subject: '',
    body: '',
    from: '',
    receivedAt: new Date().toISOString().split('T')[0]
  });
  const [detection, setDetection] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleDetect = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setDetection(null);

    try {
      // Map frontend field names to backend expected names
      const result = await detectStatusFromEmail(jobId, {
        emailSubject: emailData.subject,
        emailBody: emailData.body,
        emailFrom: emailData.from,
        receivedAt: emailData.receivedAt
      });
      setDetection(result);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to detect status');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (applyUpdate) => {
    if (!detection) return;

    setConfirming(true);
    setError('');

    try {
      if (applyUpdate) {
        // Update job status directly using the job status endpoint
        await axiosInstance.put(`/api/jobs/${jobId}/status`, {
          status: detection.data.detectedStatus,
          notes: `Status detected from email: ${emailData.subject}\nConfidence: ${detection.data.confidence}%\nReason: ${detection.data.reason}`
        });

        onDetectionConfirmed?.();
      }
      
      // Reset form
      setEmailData({
        subject: '',
        body: '',
        from: '',
        receivedAt: new Date().toISOString().split('T')[0]
      });
      setDetection(null);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to apply status update');
    } finally {
      setConfirming(false);
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBg = (confidence) => {
    if (confidence >= 80) return 'bg-green-100';
    if (confidence >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full relative z-10">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="text-white" size={24} />
                <div>
                  <h3 className="text-lg font-semibold text-white">AI Email Status Detector</h3>
                  <p className="text-sm text-purple-100 mt-1">Paste email content to automatically detect status</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 mb-6">
                <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-sm font-medium text-red-800">Error</p>
                  <p className="text-sm text-red-600 mt-1">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleDetect} className="space-y-4">
              {/* Email From */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From (Email Address)
                </label>
                <input
                  type="email"
                  value={emailData.from}
                  onChange={(e) => setEmailData({ ...emailData, from: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="recruiter@company.com"
                  required
                />
              </div>

              {/* Email Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  value={emailData.subject}
                  onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Interview Invitation - Software Engineer Position"
                  required
                />
              </div>

              {/* Email Body */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Body *
                </label>
                <textarea
                  value={emailData.body}
                  onChange={(e) => setEmailData({ ...emailData, body: e.target.value })}
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none font-mono text-sm"
                  placeholder="Paste the email content here..."
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  Include the full email body for best detection accuracy
                </p>
              </div>

              {/* Received Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Received Date
                </label>
                <input
                  type="date"
                  value={emailData.receivedAt}
                  onChange={(e) => setEmailData({ ...emailData, receivedAt: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Detect Button */}
              <button
                type="submit"
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    Detect Status
                  </>
                )}
              </button>
            </form>

            {/* Detection Results */}
            {detection && (
              <div className="mt-6 p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="text-purple-600 flex-shrink-0" size={28} />
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">Detection Complete</h4>
                    <p className="text-sm text-gray-600">AI has analyzed the email content</p>
                  </div>
                </div>

                {/* Confidence Meter */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Confidence Level</span>
                    <span className={`text-lg font-bold ${getConfidenceColor(detection.data.confidence)}`}>
                      {detection.data.confidence}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        detection.data.confidence >= 80 ? 'bg-green-500' :
                        detection.data.confidence >= 60 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${detection.data.confidence}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {detection.data.confidence >= 80 ? 'High confidence - Safe to apply automatically' :
                     detection.data.confidence >= 60 ? 'Medium confidence - Review before applying' :
                     'Low confidence - Manual review recommended'}
                  </p>
                </div>

                {/* Detected Status */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">Detected Status</label>
                    <div className="flex items-center gap-3">
                      {(() => {
                        const statusInfo = formatStatus(detection.data.detectedStatus);
                        return (
                          <span className={`px-4 py-2 rounded-lg text-base font-medium ${
                            statusInfo.color === 'green' ? 'bg-green-100 text-green-800' :
                            statusInfo.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                            statusInfo.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                            statusInfo.color === 'red' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {statusInfo.icon} {statusInfo.label}
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Reason */}
                  {detection.data.reason && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-2">Detection Reason</label>
                      <p className="text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-200">
                        {detection.data.reason}
                      </p>
                    </div>
                  )}

                  {/* Matched Keywords */}
                  {detection.data.matchedKeywords && detection.data.matchedKeywords.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-2">Matched Keywords</label>
                      <div className="flex flex-wrap gap-2">
                        {detection.data.matchedKeywords.map((keyword, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggested Action */}
                  {detection.data.suggestedAction && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-2">Suggested Next Action</label>
                      <div className="flex items-start gap-2 bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <TrendingUp className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
                        <p className="text-sm text-blue-700">{detection.data.suggestedAction}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6 pt-4 border-t border-purple-200">
                  <button
                    onClick={() => handleConfirm(false)}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                    disabled={confirming}
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={() => handleConfirm(true)}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={confirming}
                  >
                    {confirming ? 'Applying...' : 'Apply Status Update'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailStatusDetector;
