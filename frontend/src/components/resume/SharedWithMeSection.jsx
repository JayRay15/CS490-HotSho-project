import React from 'react';
import Card from '../Card';

/**
 * Shared With Me Section Component (UC-110)
 * Displays documents that others have shared for review and feedback
 */
export default function SharedWithMeSection({
  reviewInvitations,
  isLoadingReviewInvitations,
  loadReviewInvitations
}) {
  if (!reviewInvitations || reviewInvitations.length === 0) return null;

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-heading font-bold" style={{ color: "#4F5348" }}>
            Shared with Me
          </h2>
          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
            {reviewInvitations.length} pending review{reviewInvitations.length !== 1 ? 's' : ''}
          </span>
        </div>
        <button
          onClick={loadReviewInvitations}
          disabled={isLoadingReviewInvitations}
          className="px-3 py-1.5 text-sm border rounded-lg transition hover:bg-gray-50"
          style={{ borderColor: '#D1D5DB' }}
        >
          {isLoadingReviewInvitations ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Documents that others have shared with you for review and feedback.
      </p>

      {isLoadingReviewInvitations ? (
        <div className="text-center py-8 text-gray-500">Loading invitations...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reviewInvitations.map((invitation) => {
            const isResume = invitation.type === 'resume';
            const deadlineDate = invitation.deadline ? new Date(invitation.deadline) : null;
            const isOverdue = deadlineDate && deadlineDate < new Date();
            const daysLeft = deadlineDate ? Math.ceil((deadlineDate - new Date()) / (1000 * 60 * 60 * 24)) : null;

            return (
              <Card
                key={`${invitation.type}-${invitation.token}`}
                variant="outlined"
                className="overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isResume ? 'bg-blue-100' : 'bg-purple-100'
                        }`}>
                        {isResume ? (
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${isResume ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                        {isResume ? 'Resume' : 'Cover Letter'}
                      </span>
                    </div>
                    {invitation.approvalStatus && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${invitation.approvalStatus === 'approved' ? 'bg-green-100 text-green-700' :
                        invitation.approvalStatus === 'changes_requested' ? 'bg-orange-100 text-orange-700' :
                          invitation.approvalStatus === 'pending_review' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-600'
                        }`}>
                        {invitation.approvalStatus.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  {/* Document Name */}
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                    {invitation.documentName}
                  </h3>

                  {/* Owner */}
                  <p className="text-sm text-gray-600 mb-2">
                    From: <span className="font-medium">{invitation.ownerName}</span>
                  </p>

                  {/* Note */}
                  {invitation.note && (
                    <p className="text-sm text-gray-500 mb-2 line-clamp-2 italic">
                      "{invitation.note}"
                    </p>
                  )}

                  {/* Deadline */}
                  {deadlineDate && (
                    <div className={`text-xs px-2 py-1 rounded mb-3 inline-block ${isOverdue
                      ? 'bg-red-100 text-red-700'
                      : daysLeft <= 2
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-blue-50 text-blue-700'
                      }`}>
                      {isOverdue ? (
                        <>⚠️ Overdue: {deadlineDate.toLocaleDateString()}</>
                      ) : (
                        <>📅 Due: {deadlineDate.toLocaleDateString()} ({daysLeft} day{daysLeft !== 1 ? 's' : ''} left)</>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-3">
                    <a
                      href={isResume
                        ? `/share/${invitation.token}`
                        : `/share/cover-letter/${invitation.token}`
                      }
                      className="flex-1 px-3 py-2 text-sm text-center text-white rounded-lg transition"
                      style={{ backgroundColor: '#777C6D' }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#656A5C'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#777C6D'}
                    >
                      Review & Comment
                    </a>
                  </div>

                  {/* Shared date */}
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    Shared {new Date(invitation.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
