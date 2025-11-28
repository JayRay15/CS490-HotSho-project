import React from 'react';
import Card from '../Card';

/**
 * Resume Share & Feedback Panel Component
 * Displays share links and feedback management for resume owners
 */
export default function ResumeShareFeedbackPanel({
  showSharePanel,
  setShowSharePanel,
  shareForResume,
  successMessage,
  shareForm,
  setShareForm,
  shareActionLoading,
  handleGenerateShare,
  createdShareUrl,
  isLoadingShares,
  shareLinks,
  loadShares,
  handleRevokeShare,
  isLoadingOwnerFeedback,
  ownerFeedback,
  loadOwnerFeedback,
  handleExportFeedback,
  handleResolveFeedback
}) {
  if (!showSharePanel || !shareForResume) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
      onClick={() => setShowSharePanel(false)}
    >
      <div
        className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <h3 className="text-2xl font-heading font-semibold">Share & Feedback — {shareForResume.name}</h3>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSharePanel(false)}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {successMessage && (
          <div className="mx-6 mt-6 p-4 border rounded-lg" style={{ backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }}>
            <p className="font-medium" style={{ color: '#166534' }}>{successMessage}</p>
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
                    value={shareForm.privacy}
                    onChange={(e) => setShareForm(prev => ({ ...prev, privacy: e.target.value }))}
                  >
                    <option value="unlisted">Unlisted (anyone with link)</option>
                    <option value="private">Private (allow-listed reviewers only)</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input id="allowComments" type="checkbox" className="h-4 w-4" checked={shareForm.allowComments} onChange={(e) => setShareForm(prev => ({ ...prev, allowComments: e.target.checked }))} />
                  <label htmlFor="allowComments" className="text-sm">Allow comments</label>
                </div>
                <div className="flex items-center gap-2">
                  <input id="canViewContact" type="checkbox" className="h-4 w-4" checked={shareForm.canViewContact} onChange={(e) => setShareForm(prev => ({ ...prev, canViewContact: e.target.checked }))} />
                  <label htmlFor="canViewContact" className="text-sm">Show contact info</label>
                </div>
                {shareForm.privacy === 'private' && (
                  <div>
                    <label className="text-sm text-gray-700 block mb-1">Allowed reviewer emails (comma-separated)</label>
                    <input
                      type="text"
                      className="w-full border rounded px-3 py-2"
                      placeholder="name@example.com, other@example.com"
                      value={shareForm.allowedReviewersText}
                      onChange={(e) => setShareForm(prev => ({ ...prev, allowedReviewersText: e.target.value }))}
                    />
                  </div>
                )}
                <div>
                  <label className="text-sm text-gray-700 block mb-1">Note (optional)</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2"
                    placeholder="e.g., For Design team review"
                    value={shareForm.note}
                    onChange={(e) => setShareForm(prev => ({ ...prev, note: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-700 block mb-1">Expiry (days, optional)</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full border rounded px-3 py-2"
                    placeholder="e.g., 7"
                    value={shareForm.expiresInDays}
                    onChange={(e) => setShareForm(prev => ({ ...prev, expiresInDays: e.target.value }))}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleGenerateShare}
                    disabled={shareActionLoading}
                    className="px-4 py-2 text-white rounded-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50"
                    style={{ backgroundColor: '#2563EB' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1D4ED8'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563EB'}
                  >
                    {shareActionLoading ? 'Creating…' : 'Create link'}
                  </button>
                  {createdShareUrl && (
                    <button
                      onClick={() => navigator.clipboard.writeText(createdShareUrl)}
                      className="px-3 py-2 border rounded text-sm"
                      title={createdShareUrl}
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
                  onClick={() => loadShares(shareForResume._id)}
                  className="text-sm px-3 py-1 border rounded"
                >Refresh</button>
              </div>
              {isLoadingShares ? (
                <div className="text-sm text-gray-500">Loading…</div>
              ) : (shareLinks && shareLinks.length > 0 ? (
                <div className="space-y-2">
                  {shareLinks.map((s) => (
                    <div key={s.token} className={`p-3 border rounded flex items-center justify-between ${s.status === 'revoked' ? 'opacity-60' : ''}`}>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{s.privacy === 'private' ? 'Private' : 'Unlisted'} • {s.allowComments ? 'Comments on' : 'Comments off'} {s.canViewContact ? '• Contact visible' : ''}</p>
                        <p className="text-xs text-gray-600 truncate">Token: {s.token}</p>
                        {s.expiresAt && (
                          <p className="text-xs text-gray-500">Expires: {new Date(s.expiresAt).toLocaleString()}</p>
                        )}
                        <p className="text-xs text-gray-500">Status: {s.status}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {s.status !== 'revoked' && (
                          <>
                            <button
                              onClick={() => navigator.clipboard.writeText(`${window.location.origin}/share/${s.token}`)}
                              className="px-2 py-1 border rounded text-xs"
                            >Copy URL</button>
                            <button
                              onClick={() => handleRevokeShare(s.token)}
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
                  <button onClick={() => loadOwnerFeedback(shareForResume._id)} className="text-sm px-3 py-1 border rounded">Refresh</button>
                  <button onClick={() => handleExportFeedback('csv')} className="text-sm px-3 py-1 border rounded">Export CSV</button>
                  <button onClick={() => handleExportFeedback('json')} className="text-sm px-3 py-1 border rounded">Export JSON</button>
                </div>
              </div>
              {isLoadingOwnerFeedback ? (
                <div className="text-sm text-gray-500">Loading…</div>
              ) : (ownerFeedback && ownerFeedback.length > 0 ? (
                <div className="divide-y">
                  {ownerFeedback.map(fb => (
                    <div key={fb._id} className="py-3 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm"><span className="font-medium">{fb.authorName || fb.authorEmail || 'Anonymous'}</span> — <span className="text-gray-600 text-xs">{new Date(fb.createdAt).toLocaleString()}</span></p>
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{fb.comment}</p>
                        {fb.status === 'resolved' && (
                          <p className="text-xs text-green-700 mt-1">Resolved {fb.resolvedAt ? new Date(fb.resolvedAt).toLocaleString() : ''}{fb.resolutionNote ? ` • ${fb.resolutionNote}` : ''}</p>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        {fb.status !== 'resolved' && (
                          <button onClick={() => handleResolveFeedback(fb)} className="px-3 py-1 border rounded text-sm">Mark Resolved</button>
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
