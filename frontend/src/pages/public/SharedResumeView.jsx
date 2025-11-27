import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { fetchSharedResume, listFeedbackForShare, postFeedbackForShare } from '../../api/resumeShare';

/**
 * UC-110: Collaborative Resume and Cover Letter Review
 * SharedResumeView - Public page for reviewers to view shared resumes and leave feedback
 */
export default function SharedResumeView() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, isLoaded: isUserLoaded } = useUser();
  const [resume, setResume] = useState(null);
  const [share, setShare] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewerEmail, setReviewerEmail] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [activeSection, setActiveSection] = useState('resume'); // 'resume' or 'feedback'

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
    
    loadResume(emailToUse);
  }, [token, isUserLoaded, user]);

  const loadResume = async (email = null) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchSharedResume(token, email);
      if (response.data?.data) {
        setResume(response.data.data.resume);
        setShare(response.data.data.share);
        
        // Load feedback
        if (response.data.data.share?.allowComments) {
          await loadFeedback(email);
        }
      }
    } catch (err) {
      console.error('Failed to load shared resume:', err);
      const message = err.response?.data?.error?.message || err.message || 'Failed to load resume';
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
      const response = await listFeedbackForShare(token, email || reviewerEmail);
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
    loadResume(reviewerEmail);
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setSubmittingComment(true);
      await postFeedbackForShare(token, {
        comment: newComment,
        authorEmail: reviewerEmail,
        authorName: reviewerName
      }, reviewerEmail);
      setNewComment('');
      await loadFeedback();
    } catch (err) {
      console.error('Failed to post comment:', err);
      alert('Failed to post comment. Please try again.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const renderSection = (title, content) => {
    if (!content) return null;
    
    if (typeof content === 'string') {
      return (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1">
            {title}
          </h3>
          <p className="text-gray-700 whitespace-pre-wrap">{content}</p>
        </div>
      );
    }

    if (Array.isArray(content)) {
      return (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1">
            {title}
          </h3>
          <ul className="list-disc list-inside space-y-1">
            {content.map((item, idx) => (
              <li key={idx} className="text-gray-700">
                {typeof item === 'object' ? JSON.stringify(item) : item}
              </li>
            ))}
          </ul>
        </div>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-[#777C6D] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shared resume...</p>
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
              This resume is shared with specific reviewers. Please enter your email to verify access.
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

  if (!resume) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center text-gray-600">Resume not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {/* Back Button */}
            <button
              onClick={() => navigate('/resumes')}
              className="flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors"
              title="Back to My Documents"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-800">{resume.name}</h1>
              <p className="text-sm text-gray-500">Shared for review</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Tab Switcher */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveSection('resume')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeSection === 'resume' ? 'bg-white shadow text-gray-800' : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Resume
              </button>
              {share?.allowComments && (
                <button
                  onClick={() => setActiveSection('feedback')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeSection === 'feedback' ? 'bg-white shadow text-gray-800' : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Feedback ({feedback.length})
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Resume Content */}
          <div className={`${activeSection === 'resume' ? 'block' : 'hidden lg:block'} lg:col-span-2`}>
            <div className="bg-white rounded-lg shadow-sm p-8">
              {/* Contact Info */}
              {resume.sections?.contactInfo && (
                <div className="mb-8 text-center border-b pb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {resume.sections.contactInfo.name}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {resume.sections.contactInfo.location}
                  </p>
                  {share?.canViewContact && (
                    <div className="mt-2 text-sm text-gray-500">
                      {resume.sections.contactInfo.email && (
                        <span className="mr-4">{resume.sections.contactInfo.email}</span>
                      )}
                      {resume.sections.contactInfo.phone && (
                        <span>{resume.sections.contactInfo.phone}</span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Summary */}
              {renderSection('Summary', resume.sections?.summary)}

              {/* Experience */}
              {resume.sections?.experience && resume.sections.experience.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-1">
                    Experience
                  </h3>
                  <div className="space-y-4">
                    {resume.sections.experience.map((exp, idx) => (
                      <div key={idx} className="pl-4 border-l-2 border-gray-200">
                        <div className="font-medium text-gray-800">{exp.title || exp.position}</div>
                        <div className="text-gray-600">{exp.company}</div>
                        <div className="text-sm text-gray-500">{exp.duration || `${exp.startDate} - ${exp.endDate || 'Present'}`}</div>
                        {exp.description && (
                          <p className="text-gray-700 mt-2 text-sm whitespace-pre-wrap">{exp.description}</p>
                        )}
                        {exp.achievements && exp.achievements.length > 0 && (
                          <ul className="list-disc list-inside mt-2 text-sm text-gray-700">
                            {exp.achievements.map((ach, i) => <li key={i}>{ach}</li>)}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {resume.sections?.education && resume.sections.education.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-1">
                    Education
                  </h3>
                  <div className="space-y-3">
                    {resume.sections.education.map((edu, idx) => (
                      <div key={idx}>
                        <div className="font-medium text-gray-800">{edu.degree}</div>
                        <div className="text-gray-600">{edu.school || edu.institution}</div>
                        <div className="text-sm text-gray-500">{edu.year || edu.graduationDate}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills */}
              {renderSection('Skills', resume.sections?.skills)}

              {/* Projects */}
              {resume.sections?.projects && resume.sections.projects.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-1">
                    Projects
                  </h3>
                  <div className="space-y-4">
                    {resume.sections.projects.map((proj, idx) => (
                      <div key={idx}>
                        <div className="font-medium text-gray-800">{proj.name}</div>
                        <p className="text-gray-700 text-sm">{proj.description}</p>
                        {proj.technologies && (
                          <div className="text-xs text-gray-500 mt-1">
                            Technologies: {Array.isArray(proj.technologies) ? proj.technologies.join(', ') : proj.technologies}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Feedback Panel */}
          <div className={`${activeSection === 'feedback' ? 'block' : 'hidden lg:block'}`}>
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
                  Comments are disabled for this shared resume.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
