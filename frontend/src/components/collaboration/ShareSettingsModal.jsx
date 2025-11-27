import React, { useState } from 'react';
import Button from '../Button';

/**
 * UC-110: Collaborative Resume and Cover Letter Review
 * ShareSettingsModal - Modal for configuring share settings including reviewers, permissions, and deadlines
 */
export default function ShareSettingsModal({
  isOpen,
  onClose,
  onCreateShare,
  documentName = 'Document',
  documentType = 'resume', // 'resume' or 'coverLetter'
  existingShares = [],
  onRevokeShare,
  isLoading = false
}) {
  const [privacy, setPrivacy] = useState('unlisted');
  const [allowComments, setAllowComments] = useState(true);
  const [canViewContact, setCanViewContact] = useState(false);
  const [note, setNote] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [deadline, setDeadline] = useState('');
  const [reviewers, setReviewers] = useState([{ email: '', name: '', role: 'Reviewer' }]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [createdShareUrl, setCreatedShareUrl] = useState(null);
  const [activeTab, setActiveTab] = useState('create'); // 'create' or 'manage'

  const handleAddReviewer = () => {
    setReviewers([...reviewers, { email: '', name: '', role: 'Reviewer' }]);
  };

  const handleRemoveReviewer = (index) => {
    setReviewers(reviewers.filter((_, i) => i !== index));
  };

  const handleReviewerChange = (index, field, value) => {
    const updated = [...reviewers];
    updated[index][field] = value;
    setReviewers(updated);
  };

  const handleCreateShare = async () => {
    const validReviewers = reviewers.filter(r => r.email.trim());
    const payload = {
      privacy,
      allowComments,
      canViewContact,
      note: note.trim() || null,
      expiresAt: expiresAt || null,
      deadline: deadline || null,
      allowedReviewers: validReviewers
    };

    try {
      const result = await onCreateShare(payload);
      if (result?.url) {
        setCreatedShareUrl(result.url);
      }
    } catch (err) {
      console.error('Failed to create share:', err);
    }
  };

  const handleCopyLink = () => {
    if (createdShareUrl) {
      navigator.clipboard.writeText(createdShareUrl);
      alert('Link copied to clipboard!');
    }
  };

  const handleRevokeShare = async (token) => {
    if (window.confirm('Are you sure you want to revoke this share link? Reviewers will no longer be able to access the document.')) {
      await onRevokeShare(token);
    }
  };

  const resetForm = () => {
    setPrivacy('unlisted');
    setAllowComments(true);
    setCanViewContact(false);
    setNote('');
    setExpiresAt('');
    setDeadline('');
    setReviewers([{ email: '', name: '', role: 'Reviewer' }]);
    setCreatedShareUrl(null);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold" style={{ color: "#4F5348" }}>
              Share {documentName}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex mt-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('create')}
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'create' ? 'text-[#777C6D] border-b-2 border-[#777C6D]' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Create Share Link
            </button>
            <button
              onClick={() => setActiveTab('manage')}
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'manage' ? 'text-[#777C6D] border-b-2 border-[#777C6D]' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Manage Shares ({existingShares.filter(s => s.status === 'active').length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'create' ? (
            <>
              {createdShareUrl ? (
                /* Success State */
                <div className="text-center py-8">
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Share Link Created!</h3>
                  <p className="text-gray-600 mb-4">Your {documentType} is now shared. Copy the link below to send to reviewers.</p>
                  
                  <div className="bg-gray-100 rounded-lg p-3 flex items-center gap-2 mb-4">
                    <input
                      type="text"
                      readOnly
                      value={createdShareUrl}
                      className="flex-1 bg-transparent border-none text-sm text-gray-700 outline-none"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-3 py-1 bg-[#777C6D] text-white rounded text-sm hover:bg-[#6a6f62] transition-colors"
                    >
                      Copy
                    </button>
                  </div>

                  <div className="flex justify-center gap-3">
                    <Button variant="secondary" onClick={resetForm}>
                      Create Another
                    </Button>
                    <Button onClick={onClose}>
                      Done
                    </Button>
                  </div>
                </div>
              ) : (
                /* Create Form */
                <div className="space-y-6">
                  {/* Privacy Setting */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Access Level
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <input
                          type="radio"
                          name="privacy"
                          value="unlisted"
                          checked={privacy === 'unlisted'}
                          onChange={(e) => setPrivacy(e.target.value)}
                          className="mt-1"
                        />
                        <div>
                          <div className="font-medium">Anyone with link</div>
                          <div className="text-sm text-gray-500">Anyone with the link can view and comment</div>
                        </div>
                      </label>
                      <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <input
                          type="radio"
                          name="privacy"
                          value="private"
                          checked={privacy === 'private'}
                          onChange={(e) => setPrivacy(e.target.value)}
                          className="mt-1"
                        />
                        <div>
                          <div className="font-medium">Specific people only</div>
                          <div className="text-sm text-gray-500">Only designated reviewers can access</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Designated Reviewers (for private) */}
                  {privacy === 'private' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Designated Reviewers
                      </label>
                      <div className="space-y-2">
                        {reviewers.map((reviewer, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="email"
                              placeholder="Email address"
                              value={reviewer.email}
                              onChange={(e) => handleReviewerChange(index, 'email', e.target.value)}
                              className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#777C6D] focus:border-transparent"
                            />
                            <input
                              type="text"
                              placeholder="Name (optional)"
                              value={reviewer.name}
                              onChange={(e) => handleReviewerChange(index, 'name', e.target.value)}
                              className="w-32 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#777C6D] focus:border-transparent"
                            />
                            <select
                              value={reviewer.role}
                              onChange={(e) => handleReviewerChange(index, 'role', e.target.value)}
                              className="w-28 px-2 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#777C6D] focus:border-transparent"
                            >
                              <option value="Reviewer">Reviewer</option>
                              <option value="Mentor">Mentor</option>
                              <option value="Coach">Coach</option>
                              <option value="Peer">Peer</option>
                            </select>
                            {reviewers.length > 1 && (
                              <button
                                onClick={() => handleRemoveReviewer(index)}
                                className="px-2 text-red-500 hover:text-red-700"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={handleAddReviewer}
                          className="text-sm text-[#777C6D] hover:text-[#6a6f62] flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Add reviewer
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Permissions */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Permissions
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={allowComments}
                          onChange={(e) => setAllowComments(e.target.checked)}
                          className="rounded text-[#777C6D] focus:ring-[#777C6D]"
                        />
                        <span className="text-sm">Allow comments and suggestions</span>
                      </label>
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={canViewContact}
                          onChange={(e) => setCanViewContact(e.target.checked)}
                          className="rounded text-[#777C6D] focus:ring-[#777C6D]"
                        />
                        <span className="text-sm">Show contact information (email, phone)</span>
                      </label>
                    </div>
                  </div>

                  {/* Advanced Options Toggle */}
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
                  >
                    <svg 
                      className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    Advanced Options
                  </button>

                  {showAdvanced && (
                    <div className="space-y-4 pl-4 border-l-2 border-gray-200">
                      {/* Review Deadline */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Review Deadline
                        </label>
                        <input
                          type="datetime-local"
                          value={deadline}
                          onChange={(e) => setDeadline(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#777C6D] focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">Reviewers will see this deadline</p>
                      </div>

                      {/* Link Expiration */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Link Expiration
                        </label>
                        <input
                          type="datetime-local"
                          value={expiresAt}
                          onChange={(e) => setExpiresAt(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#777C6D] focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">Link will stop working after this time</p>
                      </div>

                      {/* Note */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Note for Reviewers
                        </label>
                        <textarea
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="Add context or instructions for reviewers..."
                          rows={2}
                          className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#777C6D] focus:border-transparent resize-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            /* Manage Shares Tab */
            <div>
              {existingShares.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  <p>No share links created yet</p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="mt-2 text-[#777C6D] hover:underline"
                  >
                    Create your first share link
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {existingShares.map((share, index) => (
                    <div
                      key={share.token || index}
                      className={`p-4 border rounded-lg ${share.status === 'revoked' ? 'bg-gray-50 opacity-60' : 'bg-white'}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              share.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {share.status === 'active' ? 'Active' : 'Revoked'}
                            </span>
                            <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800">
                              {share.privacy === 'private' ? 'Private' : 'Anyone with link'}
                            </span>
                            {share.allowComments && (
                              <span className="px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-800">
                                Comments enabled
                              </span>
                            )}
                          </div>
                          
                          <div className="text-xs text-gray-500 mt-2 space-y-1">
                            <p>Created: {new Date(share.createdAt).toLocaleDateString()}</p>
                            {share.deadline && (
                              <p>Deadline: {new Date(share.deadline).toLocaleDateString()}</p>
                            )}
                            {share.expiresAt && (
                              <p>Expires: {new Date(share.expiresAt).toLocaleDateString()}</p>
                            )}
                            {share.allowedReviewers?.length > 0 && (
                              <p>Reviewers: {share.allowedReviewers.map(r => r.email).join(', ')}</p>
                            )}
                          </div>
                        </div>

                        {share.status === 'active' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                const url = `${window.location.origin}/share/${documentType === 'coverLetter' ? 'cover-letter/' : ''}${share.token}`;
                                navigator.clipboard.writeText(url);
                                alert('Link copied!');
                              }}
                              className="px-3 py-1 text-sm text-[#777C6D] border border-[#777C6D] rounded hover:bg-[#777C6D] hover:text-white transition-colors"
                            >
                              Copy Link
                            </button>
                            <button
                              onClick={() => handleRevokeShare(share.token)}
                              className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50 transition-colors"
                            >
                              Revoke
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {activeTab === 'create' && !createdShareUrl && (
          <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleCreateShare} disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Share Link'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
