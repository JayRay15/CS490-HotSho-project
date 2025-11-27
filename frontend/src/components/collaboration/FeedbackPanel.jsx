import React, { useState } from 'react';

/**
 * UC-110: Collaborative Resume and Cover Letter Review
 * FeedbackPanel - Component for displaying and managing feedback comments
 */
export default function FeedbackPanel({
  feedback = [],
  onResolveFeedback,
  onDismissFeedback,
  isOwner = false,
  isLoading = false,
  documentType = 'resume' // 'resume' or 'coverLetter'
}) {
  const [filter, setFilter] = useState('all'); // 'all', 'open', 'resolved', 'dismissed'
  const [expandedId, setExpandedId] = useState(null);
  const [resolutionNote, setResolutionNote] = useState('');

  const filteredFeedback = feedback.filter(item => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  const stats = {
    total: feedback.length,
    open: feedback.filter(f => f.status === 'open').length,
    resolved: feedback.filter(f => f.status === 'resolved').length,
    dismissed: feedback.filter(f => f.status === 'dismissed').length
  };

  // Group feedback by theme for summary
  const themeSummary = feedback.reduce((acc, f) => {
    const theme = f.feedbackTheme || 'other';
    acc[theme] = (acc[theme] || 0) + 1;
    return acc;
  }, {});

  const handleResolve = async (feedbackId) => {
    await onResolveFeedback(feedbackId, { resolutionNote, status: 'resolved' });
    setExpandedId(null);
    setResolutionNote('');
  };

  const handleDismiss = async (feedbackId) => {
    await onDismissFeedback(feedbackId, { status: 'dismissed' });
    setExpandedId(null);
  };

  const getStatusBadge = (status) => {
    const styles = {
      open: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      dismissed: 'bg-gray-100 text-gray-600'
    };
    return styles[status] || styles.open;
  };

  const getThemeBadge = (theme) => {
    const styles = {
      clarity: 'bg-blue-100 text-blue-800',
      impact: 'bg-purple-100 text-purple-800',
      relevance: 'bg-orange-100 text-orange-800',
      professionalism: 'bg-indigo-100 text-indigo-800',
      customization: 'bg-pink-100 text-pink-800',
      other: 'bg-gray-100 text-gray-600'
    };
    return styles[theme] || styles.other;
  };

  const getTypeBadge = (type) => {
    const styles = {
      general: 'bg-gray-100 text-gray-700',
      grammar: 'bg-red-100 text-red-700',
      content: 'bg-blue-100 text-blue-700',
      tone: 'bg-purple-100 text-purple-700',
      structure: 'bg-green-100 text-green-700',
      formatting: 'bg-yellow-100 text-yellow-700'
    };
    return styles[type] || styles.general;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header with Stats */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Feedback & Comments</h3>
        
        {/* Stats Row */}
        <div className="flex gap-4 mb-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.open}</div>
            <div className="text-xs text-gray-500">Open</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
            <div className="text-xs text-gray-500">Resolved</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-400">{stats.dismissed}</div>
            <div className="text-xs text-gray-500">Dismissed</div>
          </div>
        </div>

        {/* Theme Summary */}
        {Object.keys(themeSummary).length > 0 && (
          <div className="mb-3">
            <div className="text-xs text-gray-500 mb-1">Feedback Themes:</div>
            <div className="flex flex-wrap gap-1">
              {Object.entries(themeSummary).map(([theme, count]) => (
                <span key={theme} className={`px-2 py-0.5 rounded-full text-xs ${getThemeBadge(theme)}`}>
                  {theme}: {count}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Filter Buttons */}
        <div className="flex gap-2">
          {['all', 'open', 'resolved', 'dismissed'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                filter === f 
                  ? 'bg-[#777C6D] text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback List */}
      <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="animate-spin w-6 h-6 border-2 border-[#777C6D] border-t-transparent rounded-full mx-auto mb-2"></div>
            Loading feedback...
          </div>
        ) : filteredFeedback.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>{filter === 'all' ? 'No feedback yet' : `No ${filter} feedback`}</p>
          </div>
        ) : (
          filteredFeedback.map((item) => (
            <div key={item._id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  {/* Author Avatar */}
                  <div className="w-8 h-8 rounded-full bg-[#777C6D] text-white flex items-center justify-center text-sm font-medium">
                    {(item.authorName || item.authorEmail || 'A').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-gray-800 text-sm">
                      {item.authorName || item.authorEmail || 'Anonymous'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {item.suggestionType && item.suggestionType !== 'general' && (
                    <span className={`px-2 py-0.5 rounded text-xs ${getTypeBadge(item.suggestionType)}`}>
                      {item.suggestionType}
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded text-xs ${getStatusBadge(item.status)}`}>
                    {item.status}
                  </span>
                </div>
              </div>

              {/* Selected Text (if inline comment) */}
              {item.selectedText && (
                <div className="mb-2 p-2 bg-yellow-50 border-l-2 border-yellow-400 text-sm text-gray-600 italic">
                  "{item.selectedText}"
                </div>
              )}

              {/* Comment */}
              <p className="text-gray-700 text-sm mb-2">{item.comment}</p>

              {/* Theme Badge */}
              {item.feedbackTheme && item.feedbackTheme !== 'other' && (
                <span className={`px-2 py-0.5 rounded-full text-xs ${getThemeBadge(item.feedbackTheme)}`}>
                  {item.feedbackTheme}
                </span>
              )}

              {/* Resolution Note */}
              {item.status === 'resolved' && item.resolutionNote && (
                <div className="mt-2 p-2 bg-green-50 border-l-2 border-green-400 text-sm">
                  <span className="font-medium text-green-800">Resolution:</span>
                  <span className="text-gray-600 ml-1">{item.resolutionNote}</span>
                </div>
              )}

              {/* Owner Actions */}
              {isOwner && item.status === 'open' && (
                <div className="mt-3">
                  {expandedId === item._id ? (
                    <div className="space-y-2">
                      <textarea
                        value={resolutionNote}
                        onChange={(e) => setResolutionNote(e.target.value)}
                        placeholder="Add a resolution note (optional)..."
                        rows={2}
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#777C6D] focus:border-transparent resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleResolve(item._id)}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                        >
                          Mark Resolved
                        </button>
                        <button
                          onClick={() => handleDismiss(item._id)}
                          className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                        >
                          Dismiss
                        </button>
                        <button
                          onClick={() => { setExpandedId(null); setResolutionNote(''); }}
                          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setExpandedId(item._id)}
                      className="text-sm text-[#777C6D] hover:text-[#6a6f62]"
                    >
                      Respond to feedback
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
