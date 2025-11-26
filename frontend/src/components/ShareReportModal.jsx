import React, { useState } from 'react';
import Button from './Button';
import ErrorMessage from './ErrorMessage';
import { shareReport } from '../api/reports';

/**
 * ShareReportModal Component
 * Modal for sharing reports with customizable options
 */
export default function ShareReportModal({ 
  isOpen, 
  onClose, 
  reportId, 
  reportName,
  reportData,
  onShareSuccess 
}) {
  const [shareOptions, setShareOptions] = useState({
    expirationDays: 7,
    password: '',
    requirePassword: false,
    allowedEmails: '',
    shareMessage: '',
    reportSnapshot: null,
  });

  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState(null);
  const [shareLink, setShareLink] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const expirationOptions = [
    { value: 1, label: '1 Day' },
    { value: 7, label: '7 Days' },
    { value: 14, label: '14 Days' },
    { value: 30, label: '30 Days' },
    { value: 90, label: '90 Days' },
    { value: 0, label: 'Never Expires' },
  ];

  const handleShare = async () => {
    setIsSharing(true);
    setError(null);

    try {
      // Prepare share options
      const options = {
        expirationDate: shareOptions.expirationDays > 0 
          ? new Date(Date.now() + shareOptions.expirationDays * 24 * 60 * 60 * 1000)
          : null,
        password: shareOptions.requirePassword ? shareOptions.password : null,
        allowedEmails: shareOptions.allowedEmails 
          ? shareOptions.allowedEmails.split(',').map(email => email.trim()).filter(Boolean)
          : [],
        shareMessage: shareOptions.shareMessage || '',
        reportSnapshot: reportData,
      };

      const response = await shareReport(reportId, options);
      
      // Backend wraps data in response.data.data structure
      const shareData = response.data.data || response.data;
      
      // Build full share URL
      const baseUrl = window.location.origin;
      const fullShareLink = `${baseUrl}/reports/shared/${shareData.uniqueToken}`;
      
      setShareLink(fullShareLink);
      
      if (onShareSuccess) {
        onShareSuccess(shareData);
      }
    } catch (err) {
      setError(err.message || 'Failed to create share link');
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleClose = () => {
    setShareOptions({
      expirationDays: 7,
      password: '',
      requirePassword: false,
      allowedEmails: '',
      shareMessage: '',
      reportSnapshot: null,
    });
    setShareLink(null);
    setError(null);
    setCopySuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 transform transition-all">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Share Report</h2>
              <p className="text-sm text-gray-600 mt-1">{reportName}</p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Share Link Display */}
          {shareLink && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-800">
                  ✓ Share link created successfully!
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-1 px-3 py-2 bg-white border border-green-300 rounded-lg text-sm text-gray-900"
                />
                <Button
                  variant={copySuccess ? "secondary" : "primary"}
                  size="small"
                  onClick={handleCopyLink}
                >
                  {copySuccess ? '✓ Copied!' : 'Copy'}
                </Button>
              </div>
            </div>
          )}

          {/* Share Options Form */}
          {!shareLink && (
            <div className="space-y-5">
              {/* Expiration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link Expiration
                </label>
                <select
                  value={shareOptions.expirationDays}
                  onChange={(e) => setShareOptions({
                    ...shareOptions,
                    expirationDays: parseInt(e.target.value)
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {expirationOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Password Protection */}
              <div>
                <label className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    checked={shareOptions.requirePassword}
                    onChange={(e) => setShareOptions({
                      ...shareOptions,
                      requirePassword: e.target.checked,
                      password: e.target.checked ? shareOptions.password : ''
                    })}
                    className="mr-2 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Require password to view
                  </span>
                </label>
                
                {shareOptions.requirePassword && (
                  <input
                    type="password"
                    value={shareOptions.password}
                    onChange={(e) => setShareOptions({
                      ...shareOptions,
                      password: e.target.value
                    })}
                    placeholder="Enter password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                )}
              </div>

              {/* Allowed Emails */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Restrict to Specific Emails (Optional)
                </label>
                <input
                  type="text"
                  value={shareOptions.allowedEmails}
                  onChange={(e) => setShareOptions({
                    ...shareOptions,
                    allowedEmails: e.target.value
                  })}
                  placeholder="email1@example.com, email2@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separate multiple emails with commas. Leave empty to allow anyone with the link.
                </p>
              </div>

              {/* Share Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message (Optional)
                </label>
                <textarea
                  value={shareOptions.shareMessage}
                  onChange={(e) => setShareOptions({
                    ...shareOptions,
                    shareMessage: e.target.value
                  })}
                  placeholder="Add a message for recipients..."
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Share Information</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Recipients can view the report data but cannot edit it</li>
                        <li>You can revoke access at any time from your shared reports list</li>
                        <li>Report includes current data snapshot at time of sharing</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {error && <ErrorMessage message={error} />}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={handleClose}
            >
              {shareLink ? 'Close' : 'Cancel'}
            </Button>
            {!shareLink && (
              <Button
                variant="primary"
                onClick={handleShare}
                isLoading={isSharing}
                disabled={shareOptions.requirePassword && !shareOptions.password}
              >
                Create Share Link
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
