import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { fetchSharedCoverLetter, listFeedbackForCoverLetterShare, postFeedbackForCoverLetterShare } from '../../api/coverLetterShare';

/**
 * UC-110: Collaborative Resume and Cover Letter Review
 * SharedCoverLetterView - Public page for reviewers to view shared cover letters and leave feedback
 */
export default function SharedCoverLetterView() {
  const { token } = useParams();
  const { user, isLoaded: isUserLoaded } = useUser();
  const [coverLetter, setCoverLetter] = useState(null);
  const [share, setShare] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewerEmail, setReviewerEmail] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [suggestionType, setSuggestionType] = useState('general');
  const [feedbackTheme, setFeedbackTheme] = useState('other');
  const [selectedText, setSelectedText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [activeTab, setActiveTab] = useState('content'); // 'content' or 'feedback'

  useEffect(() => {
    // Wait for Clerk to load user info
    if (!isUserLoaded) return;
    
    // Priority: 1) Clerk user email, 2) localStorage, 3) empty
    const clerkEmail = user?.primaryEmailAddress?.emailAddress;
    const clerkName = user?.fullName || user?.firstName;
    const savedEmail = localStorage.getItem('reviewerEmail');
    const savedName = localStorage.getItem('reviewerName');
    
    const emailToUse = clerkEmail || savedEmail || '';
    const nameToUse = clerkName || savedName || '';
    
    if (emailToUse) setReviewerEmail(emailToUse);
    if (nameToUse) setReviewerName(nameToUse);
    
    loadCoverLetter(emailToUse);
  }, [token, isUserLoaded, user]);

  const loadCoverLetter = async (email = null) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchSharedCoverLetter(token, email);
      if (response.data?.data) {
        setCoverLetter(response.data.data.coverLetter);
        setShare(response.data.data.share);
        
        // Load feedback
        if (response.data.data.share?.allowComments) {
          await loadFeedback(email);
        }
      }
    } catch (err) {
      console.error('Failed to load shared cover letter:', err);
      const message = err.response?.data?.error?.message || err.message || 'Failed to load cover letter';
      const status = err.response?.status;
      
      // Show email prompt for 403 errors (access denied) unless already providing email
      if (status === 403 && !email) {
        setShowEmailPrompt(true);
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const loadFeedback = async (email = null) => {
    try {
      const response = await listFeedbackForCoverLetterShare(token, email || reviewerEmail);
      if (response.data?.data?.feedback) {
        setFeedback(response.data.data.feedback);
      }
    } catch (err) {
      console.error('Failed to load feedback:', err);
    }
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem('reviewerEmail', reviewerEmail);
    localStorage.setItem('reviewerName', reviewerName);
    setShowEmailPrompt(false);
    loadCoverLetter(reviewerEmail);
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString().trim());
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setSubmittingComment(true);
      await postFeedbackForCoverLetterShare(token, {
        comment: newComment,
        authorEmail: reviewerEmail,
        authorName: reviewerName,
        selectedText: selectedText || null,
        suggestionType,
        feedbackTheme
      }, reviewerEmail);
      setNewComment('');
      setSelectedText('');
      setSuggestionType('general');
      setFeedbackTheme('other');
      await loadFeedback();
    } catch (err) {
      console.error('Failed to post comment:', err);
      alert('Failed to post comment. Please try again.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const formatDeadline = (deadline) => {
    if (!deadline) return null;
    const date = new Date(deadline);
    const now = new Date();
    const isPast = date < now;
    const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
    
    return {
      text: date.toLocaleDateString(),
      isPast,
      daysLeft: isPast ? 0 : diffDays
    };
  };

  const getApprovalBadge = (status) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-600',
      pending_review: 'bg-yellow-100 text-yellow-800',
      changes_requested: 'bg-orange-100 text-orange-800',
      approved: 'bg-green-100 text-green-800'
    };
    const labels = {
      draft: 'Draft',
      pending_review: 'Pending Review',
      changes_requested: 'Changes Requested',
      approved: 'Approved'
    };
    return { style: styles[status] || styles.draft, label: labels[status] || 'Draft' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-[#777C6D] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shared cover letter...</p>
        </div>
      </div>
    );
  }

  if (showEmailPrompt || (error && error.includes("don't have access"))) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-[#777C6D] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Access Required</h2>
            <p className="text-gray-600 mt-2">
              This cover letter is shared with specific reviewers. Please enter your email to verify access.
            </p>
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={reviewerEmail}
                onChange={(e) => setReviewerEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#777C6D] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Name (optional)</label>
              <input
                type="text"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#777C6D] focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-[#777C6D] text-white rounded-lg font-medium hover:bg-[#6a6f62] transition-colors"
            >
              Verify Access
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!coverLetter) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center text-gray-600">Cover letter not found</div>
      </div>
    );
  }

  const deadlineInfo = formatDeadline(share?.deadline);
  const approvalBadge = getApprovalBadge(coverLetter.approvalStatus);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-gray-800">{coverLetter.name}</h1>
                <span className={`px-2 py-1 rounded text-xs font-medium ${approvalBadge.style}`}>
                  {approvalBadge.label}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Shared for review
                {coverLetter.style && (
                  <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded text-xs">
                    Style: {coverLetter.style}
                  </span>
                )}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Deadline Warning */}
              {deadlineInfo && (
                <div className={`px-3 py-2 rounded-lg text-sm ${
                  deadlineInfo.isPast 
                    ? 'bg-red-100 text-red-800' 
                    : deadlineInfo.daysLeft <= 2 
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-blue-100 text-blue-800'
                }`}>
                  {deadlineInfo.isPast ? (
                    <>Review deadline passed: {deadlineInfo.text}</>
                  ) : (
                    <>Review due: {deadlineInfo.text} ({deadlineInfo.daysLeft} days left)</>
                  )}
                </div>
              )}

              {/* Tab Switcher */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('content')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'content' ? 'bg-white shadow text-gray-800' : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Cover Letter
                </button>
                {share?.allowComments && (
                  <button
                    onClick={() => setActiveTab('feedback')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'feedback' ? 'bg-white shadow text-gray-800' : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Feedback ({feedback.length})
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cover Letter Content */}
          <div className={`${activeTab === 'content' ? 'block' : 'hidden lg:block'} lg:col-span-2`}>
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div 
                className="prose max-w-none"
                onMouseUp={handleTextSelection}
              >
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {coverLetter.content}
                </div>
              </div>

              {/* Selection indicator */}
              {selectedText && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-medium text-yellow-800 mb-1">Selected text for feedback:</div>
                      <div className="text-sm text-gray-700 italic">"{selectedText}"</div>
                    </div>
                    <button
                      onClick={() => setSelectedText('')}
                      className="text-yellow-600 hover:text-yellow-800"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Tip */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
                <strong>Tip:</strong> Select any text in the cover letter above to provide inline feedback on specific sections.
              </div>
            </div>
          </div>

          {/* Feedback Panel */}
          <div className={`${activeTab === 'feedback' ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Leave Feedback
              </h3>

              {share?.allowComments ? (
                <>
                  {/* Comment Form */}
                  <form onSubmit={handleSubmitComment} className="mb-6">
                    {!reviewerName && (
                      <div className="mb-3">
                        <input
                          type="text"
                          placeholder="Your name (optional)"
                          value={reviewerName}
                          onChange={(e) => setReviewerName(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#777C6D] focus:border-transparent"
                        />
                      </div>
                    )}
                    {!reviewerEmail && (
                      <div className="mb-3">
                        <input
                          type="email"
                          placeholder="Your email"
                          value={reviewerEmail}
                          onChange={(e) => setReviewerEmail(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#777C6D] focus:border-transparent"
                        />
                      </div>
                    )}

                    {/* Feedback Type */}
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Feedback Type</label>
                      <select
                        value={suggestionType}
                        onChange={(e) => setSuggestionType(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#777C6D] focus:border-transparent"
                      >
                        <option value="general">General</option>
                        <option value="grammar">Grammar</option>
                        <option value="content">Content</option>
                        <option value="tone">Tone</option>
                        <option value="structure">Structure</option>
                        <option value="formatting">Formatting</option>
                      </select>
                    </div>

                    {/* Feedback Theme */}
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Theme</label>
                      <select
                        value={feedbackTheme}
                        onChange={(e) => setFeedbackTheme(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#777C6D] focus:border-transparent"
                      >
                        <option value="other">Other</option>
                        <option value="clarity">Clarity</option>
                        <option value="impact">Impact</option>
                        <option value="relevance">Relevance</option>
                        <option value="professionalism">Professionalism</option>
                        <option value="customization">Customization</option>
                      </select>
                    </div>

                    {/* Selected text indicator */}
                    {selectedText && (
                      <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                        <span className="font-medium">Commenting on: </span>
                        <span className="italic">"{selectedText.substring(0, 50)}..."</span>
                      </div>
                    )}

                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Share your feedback, suggestions, or comments..."
                      rows={4}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#777C6D] focus:border-transparent resize-none"
                    />
                    <button
                      type="submit"
                      disabled={submittingComment || !newComment.trim()}
                      className="mt-2 w-full py-2 bg-[#777C6D] text-white rounded-lg font-medium hover:bg-[#6a6f62] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submittingComment ? 'Submitting...' : 'Submit Feedback'}
                    </button>
                  </form>

                  {/* Existing Feedback */}
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      All Feedback ({feedback.length})
                    </h4>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {feedback.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">
                          No feedback yet. Be the first to leave a comment!
                        </p>
                      ) : (
                        feedback.map((item) => (
                          <div key={item._id} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-6 h-6 rounded-full bg-[#777C6D] text-white flex items-center justify-center text-xs">
                                {(item.authorName || item.authorEmail || 'A').charAt(0).toUpperCase()}
                              </div>
                              <span className="text-sm font-medium text-gray-800">
                                {item.authorName || item.authorEmail || 'Anonymous'}
                              </span>
                              <span className={`ml-auto text-xs px-2 py-0.5 rounded ${
                                item.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                item.status === 'dismissed' ? 'bg-gray-100 text-gray-600' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {item.status}
                              </span>
                            </div>
                            
                            {/* Type and Theme badges */}
                            <div className="flex gap-1 mb-2">
                              {item.suggestionType && item.suggestionType !== 'general' && (
                                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                                  {item.suggestionType}
                                </span>
                              )}
                              {item.feedbackTheme && item.feedbackTheme !== 'other' && (
                                <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                                  {item.feedbackTheme}
                                </span>
                              )}
                            </div>

                            {/* Selected text */}
                            {item.selectedText && (
                              <div className="mb-2 p-2 bg-yellow-50 border-l-2 border-yellow-400 text-xs text-gray-600 italic">
                                "{item.selectedText}"
                              </div>
                            )}
                            
                            <p className="text-sm text-gray-700">{item.comment}</p>
                            <div className="text-xs text-gray-400 mt-1">
                              {new Date(item.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-gray-500 text-sm">
                  Comments are disabled for this shared cover letter.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
