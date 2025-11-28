import React from 'react';
import Card from '../Card';

/**
 * Cover Letter Share & Feedback Panel Component (UC-110)
 * Displays share links and feedback management for cover letter owners
 */
export default function CoverLetterShareFeedbackPanel({
  showCoverLetterSharePanel,
  setShowCoverLetterSharePanel,
  shareForCoverLetter,
  coverLetterSuccessMessage,
  coverLetterShareForm,
  setCoverLetterShareForm,
  coverLetterShareActionLoading,
  handleGenerateCoverLetterShare,
  createdCoverLetterShareUrl,
  isLoadingCoverLetterShares,
  coverLetterShareLinks,
  loadCoverLetterShares,
  handleRevokeCoverLetterShare,
  isLoadingCoverLetterOwnerFeedback,
  coverLetterOwnerFeedback,
  setCoverLetterOwnerFeedback,
  loadCoverLetterOwnerFeedback,
  handleExportCoverLetterFeedback,
  handleResolveCoverLetterFeedback,
  handleUpdateCoverLetterApproval,
  authWrap,
  apiResolveCoverLetterFeedback,
  getPayload
}) {
  if (!showCoverLetterSharePanel || !shareForCoverLetter) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
      onClick={() => setShowCoverLetterSharePanel(false)}
    >
      <div
        className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h3 className="text-2xl font-heading font-semibold">Share & Feedback — {shareForCoverLetter.name}</h3>
            {shareForCoverLetter.approvalStatus && (
              <span className={`text-sm px-2 py-1 rounded mt-1 inline-block ${shareForCoverLetter.approvalStatus === 'approved' ? 'bg-green-100 text-green-700' :
                shareForCoverLetter.approvalStatus === 'needs_revision' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                Status: {shareForCoverLetter.approvalStatus.replace('_', ' ')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Approval buttons */}
            <button
              onClick={() => handleUpdateCoverLetterApproval('approved')}
              className="px-3 py-1 text-sm rounded bg-green-100 text-green-700 hover:bg-green-200 transition"
            >
              Mark Approved
            </button>
            <button
              onClick={() => handleUpdateCoverLetterApproval('needs_revision')}
              className="px-3 py-1 text-sm rounded bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition"
            >
              Needs Revision
            </button>
            <button
              onClick={() => setShowCoverLetterSharePanel(false)}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {coverLetterSuccessMessage && (
          <div className="mx-6 mt-6 p-4 border rounded-lg" style={{ backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }}>
            <p className="font-medium" style={{ color: '#166534' }}>{coverLetterSuccessMessage}</p>
          </div>
        )}

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Create New Share */}
          <Card variant="outlined">
            <div className="p-4">
              <h4 className="text-lg font-heading font-semibold mb-3">Create new share link</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-700 block mb-1">Privacy</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={coverLetterShareForm.privacy}
                    onChange={(e) => setCoverLetterShareForm(prev => ({ ...prev, privacy: e.target.value }))}
                  >
                    <option value="unlisted">Unlisted (anyone with link)</option>
                    <option value="private">Private (allow-listed reviewers only)</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input id="clAllowComments" type="checkbox" className="h-4 w-4" checked={coverLetterShareForm.allowComments} onChange={(e) => setCoverLetterShareForm(prev => ({ ...prev, allowComments: e.target.checked }))} />
                  <label htmlFor="clAllowComments" className="text-sm">Allow comments</label>
                </div>
                {coverLetterShareForm.privacy === 'private' && (
                  <div>
                    <label className="text-sm text-gray-700 block mb-1">Allowed reviewer emails (comma-separated)</label>
                    <input
                      type="text"
                      className="w-full border rounded px-3 py-2"
                      placeholder="name@example.com, other@example.com"
                      value={coverLetterShareForm.allowedReviewersText}
                      onChange={(e) => setCoverLetterShareForm(prev => ({ ...prev, allowedReviewersText: e.target.value }))}
                    />
                  </div>
                )}
                <div>
                  <label className="text-sm text-gray-700 block mb-1">Note (optional)</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2"
                    placeholder="e.g., For career advisor review"
                    value={coverLetterShareForm.note}
                    onChange={(e) => setCoverLetterShareForm(prev => ({ ...prev, note: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-700 block mb-1">Feedback deadline (optional)</label>
                  <input
                    type="date"
                    className="w-full border rounded px-3 py-2"
                    value={coverLetterShareForm.deadline}
                    onChange={(e) => setCoverLetterShareForm(prev => ({ ...prev, deadline: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-700 block mb-1">Link expiry (days, optional)</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full border rounded px-3 py-2"
                    placeholder="e.g., 7"
                    value={coverLetterShareForm.expiresInDays}
                    onChange={(e) => setCoverLetterShareForm(prev => ({ ...prev, expiresInDays: e.target.value }))}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleGenerateCoverLetterShare}
                    disabled={coverLetterShareActionLoading}
                    className="px-4 py-2 text-white rounded-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50"
                    style={{ backgroundColor: '#2563EB' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1D4ED8'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563EB'}
                  >
                    {coverLetterShareActionLoading ? 'Creating…' : 'Create link'}
                  </button>
                  {createdCoverLetterShareUrl && (
                    <button
                      onClick={() => navigator.clipboard.writeText(createdCoverLetterShareUrl)}
                      className="px-3 py-2 border rounded text-sm"
                      title={createdCoverLetterShareUrl}
                    >Copy URL</button>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Existing Share Links */}
          <Card variant="outlined">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-heading font-semibold">Existing links</h4>
                <button
                  onClick={() => loadCoverLetterShares(shareForCoverLetter._id)}
                  className="text-sm px-3 py-1 border rounded"
                >Refresh</button>
              </div>
              {isLoadingCoverLetterShares ? (
                <div className="text-sm text-gray-500">Loading…</div>
              ) : (coverLetterShareLinks && coverLetterShareLinks.length > 0 ? (
                <div className="space-y-2">
                  {coverLetterShareLinks.map((s) => (
                    <div key={s.token} className={`p-3 border rounded flex items-center justify-between ${s.status === 'revoked' ? 'opacity-60' : ''}`}>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{s.privacy === 'private' ? 'Private' : 'Unlisted'} • {s.allowComments ? 'Comments on' : 'Comments off'}</p>
                        <p className="text-xs text-gray-600 truncate">Token: {s.token}</p>
                        {s.expiresAt && (
                          <p className="text-xs text-gray-500">Expires: {new Date(s.expiresAt).toLocaleString()}</p>
                        )}
                        {s.deadline && (
                          <p className="text-xs text-gray-500">Feedback deadline: {new Date(s.deadline).toLocaleDateString()}</p>
                        )}
                        <p className="text-xs text-gray-500">Status: {s.status}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {s.status !== 'revoked' && (
                          <>
                            <button
                              onClick={() => navigator.clipboard.writeText(`${window.location.origin}/share/cover-letter/${s.token}`)}
                              className="px-2 py-1 border rounded text-xs"
                            >Copy URL</button>
                            <button
                              onClick={() => handleRevokeCoverLetterShare(s.token)}
                              className="px-2 py-1 border rounded text-xs text-red-600 border-red-300"
                            >Revoke</button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No share links yet.</p>
              ))}
            </div>
          </Card>

          {/* Feedback Management */}
          <Card variant="outlined" className="lg:col-span-2">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-heading font-semibold">Feedback</h4>
                <div className="flex items-center gap-2">
                  <button onClick={() => loadCoverLetterOwnerFeedback(shareForCoverLetter._id)} className="text-sm px-3 py-1 border rounded">Refresh</button>
                  <button onClick={() => handleExportCoverLetterFeedback('csv')} className="text-sm px-3 py-1 border rounded">Export CSV</button>
                  <button onClick={() => handleExportCoverLetterFeedback('json')} className="text-sm px-3 py-1 border rounded">Export JSON</button>
                </div>
              </div>

              {/* Feedback Stats */}
              {coverLetterOwnerFeedback && coverLetterOwnerFeedback.length > 0 && (
                <div className="mb-4 flex gap-4 flex-wrap">
                  <div className="px-3 py-2 bg-gray-100 rounded">
                    <span className="text-sm font-medium">Total: </span>
                    <span className="text-sm">{coverLetterOwnerFeedback.length}</span>
                  </div>
                  <div className="px-3 py-2 bg-blue-50 rounded">
                    <span className="text-sm font-medium text-blue-700">Open: </span>
                    <span className="text-sm text-blue-700">{coverLetterOwnerFeedback.filter(f => f.status === 'open').length}</span>
                  </div>
                  <div className="px-3 py-2 bg-green-50 rounded">
                    <span className="text-sm font-medium text-green-700">Resolved: </span>
                    <span className="text-sm text-green-700">{coverLetterOwnerFeedback.filter(f => f.status === 'resolved').length}</span>
                  </div>
                  <div className="px-3 py-2 bg-yellow-50 rounded">
                    <span className="text-sm font-medium text-yellow-700">Dismissed: </span>
                    <span className="text-sm text-yellow-700">{coverLetterOwnerFeedback.filter(f => f.status === 'dismissed').length}</span>
                  </div>
                </div>
              )}

              {isLoadingCoverLetterOwnerFeedback ? (
                <div className="text-sm text-gray-500">Loading…</div>
              ) : (coverLetterOwnerFeedback && coverLetterOwnerFeedback.length > 0 ? (
                <div className="divide-y">
                  {coverLetterOwnerFeedback.map(fb => (
                    <div key={fb._id} className="py-3 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium">{fb.authorName || fb.authorEmail || 'Anonymous'}</p>
                          <span className="text-xs text-gray-500">{new Date(fb.createdAt).toLocaleString()}</span>
                          {fb.feedbackTheme && (
                            <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">{fb.feedbackTheme}</span>
                          )}
                          {fb.suggestionType && (
                            <span className={`text-xs px-2 py-0.5 rounded ${fb.suggestionType === 'critical' ? 'bg-red-100 text-red-700' :
                              fb.suggestionType === 'suggestion' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>{fb.suggestionType}</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-800 whitespace-pre-wrap mt-1">{fb.comment}</p>
                        {fb.selectionStart !== undefined && fb.selectionEnd !== undefined && (
                          <p className="text-xs text-gray-500 mt-1 italic">Inline comment (chars {fb.selectionStart}-{fb.selectionEnd})</p>
                        )}
                        {fb.status === 'resolved' && (
                          <p className="text-xs text-green-700 mt-1">✓ Resolved {fb.resolvedAt ? new Date(fb.resolvedAt).toLocaleString() : ''}{fb.resolutionNote ? ` • ${fb.resolutionNote}` : ''}</p>
                        )}
                        {fb.status === 'dismissed' && (
                          <p className="text-xs text-yellow-700 mt-1">✗ Dismissed{fb.resolutionNote ? ` • ${fb.resolutionNote}` : ''}</p>
                        )}
                      </div>
                      <div className="flex-shrink-0 flex gap-1">
                        {fb.status === 'open' && (
                          <>
                            <button onClick={() => handleResolveCoverLetterFeedback(fb)} className="px-2 py-1 border rounded text-xs text-green-600 border-green-300 hover:bg-green-50">Resolve</button>
                            <button onClick={async () => {
                              try {
                                await authWrap();
                                const note = window.prompt('Add a dismissal note (optional):', '');
                                const resp = await apiResolveCoverLetterFeedback(fb._id, { resolutionNote: note || '', status: 'dismissed' });
                                const payload = getPayload(resp);
                                const updated = payload.feedback || payload;
                                setCoverLetterOwnerFeedback(prev => prev.map(it => it._id === updated._id ? updated : it));
                              } catch (e) {
                                console.error('Dismiss cover letter feedback failed', e);
                              }
                            }} className="px-2 py-1 border rounded text-xs text-yellow-600 border-yellow-300 hover:bg-yellow-50">Dismiss</button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No feedback yet.</p>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
