import { useState, useEffect } from 'react';
import { Clock, Mail, User, Bot, CheckCircle, XCircle, Calendar, MessageSquare, X } from 'lucide-react';
import { getStatusTimeline, formatStatus } from '../api/applicationStatus';

const StatusTimeline = ({ jobId, isOpen, onClose }) => {
  const [timeline, setTimeline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && jobId) {
      loadTimeline();
    }
  }, [isOpen, jobId]);

  const loadTimeline = async () => {
    try {
      setLoading(true);
      const data = await getStatusTimeline(jobId);
      setTimeline(data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load timeline');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getEventIcon = (type, source) => {
    switch (type) {
      case 'status_change':
        if (source === 'email-detection') return <Mail className="text-blue-600" size={20} />;
        if (source === 'automation') return <Bot className="text-purple-600" size={20} />;
        return <CheckCircle className="text-green-600" size={20} />;
      case 'email_received':
        return <Mail className="text-blue-600" size={20} />;
      case 'follow_up_sent':
        return <MessageSquare className="text-indigo-600" size={20} />;
      case 'interview_scheduled':
        return <Calendar className="text-orange-600" size={20} />;
      case 'note_added':
        return <MessageSquare className="text-gray-600" size={20} />;
      default:
        return <Clock className="text-gray-600" size={20} />;
    }
  };

  const getSourceBadge = (source) => {
    if (source === 'user') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
          <User size={12} />
          Manual
        </span>
      );
    }
    if (source === 'email-detection') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
          <Mail size={12} />
          Email Detection
        </span>
      );
    }
    if (source === 'automation') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
          <Bot size={12} />
          Automation
        </span>
      );
    }
    return null;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
    });
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
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Application Timeline</h3>
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
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <XCircle className="mx-auto text-red-500 mb-4" size={48} />
                <p className="text-red-600 font-medium">{error}</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Status History */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <CheckCircle size={16} />
                    Status History
                  </h4>
                  <div className="relative">
                    {/* Vertical line */}
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                    
                    <div className="space-y-6">
                      {timeline?.statusHistory?.map((entry, index) => {
                        const statusInfo = formatStatus(entry.status);
                        const isFirst = index === 0;
                        
                        return (
                          <div key={entry._id} className="relative pl-12">
                            {/* Timeline dot */}
                            <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center ${
                              isFirst ? 'bg-indigo-600' : 'bg-gray-300'
                            }`}>
                              {isFirst ? (
                                <CheckCircle className="text-white" size={16} />
                              ) : (
                                <Clock className="text-gray-600" size={16} />
                              )}
                            </div>

                            <div className={`p-4 rounded-lg ${isFirst ? 'bg-indigo-50 border-2 border-indigo-200' : 'bg-gray-50'}`}>
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    statusInfo.color === 'green' ? 'bg-green-100 text-green-800' :
                                    statusInfo.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                                    statusInfo.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                                    statusInfo.color === 'red' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {statusInfo.icon} {statusInfo.label}
                                  </span>
                                  {getSourceBadge(entry.changeSource)}
                                  {isFirst && (
                                    <span className="px-2 py-0.5 bg-indigo-600 text-white rounded-full text-xs font-medium">
                                      Current
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-gray-500">
                                  {formatDate(entry.changedAt)}
                                </span>
                              </div>

                              {entry.notes && (
                                <p className="text-sm text-gray-700 mt-2">{entry.notes}</p>
                              )}

                              {entry.changeSource === 'email-detection' && entry.sourceEmail && (
                                <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                                  <p className="text-xs font-medium text-gray-700">
                                    Detected from: {entry.sourceEmail.subject}
                                  </p>
                                  {entry.confidence && (
                                    <p className="text-xs text-gray-600 mt-1">
                                      Confidence: {entry.confidence}%
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Timeline Events */}
                {timeline?.timeline && timeline.timeline.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Clock size={16} />
                      Activity Timeline
                    </h4>
                    <div className="space-y-3">
                      {timeline.timeline.map((event) => (
                        <div key={event._id} className="flex gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex-shrink-0 mt-0.5">
                            {getEventIcon(event.type, event.source)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{event.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500">
                                {formatDate(event.timestamp)}
                              </span>
                              {event.source && getSourceBadge(event.source)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {(!timeline?.statusHistory || timeline.statusHistory.length === 0) && 
                 (!timeline?.timeline || timeline.timeline.length === 0) && (
                  <div className="text-center py-12">
                    <Clock className="mx-auto text-gray-400 mb-4" size={48} />
                    <p className="text-gray-600">No timeline events yet</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusTimeline;
