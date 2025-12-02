import { useState } from 'react';
import { updateInformationalInterview } from '../api/informationalInterviews';

const STATUS_OPTIONS = ['Identified', 'Outreach Sent', 'Scheduled', 'Completed', 'Follow-up Sent'];

export default function InformationalInterviewCard({ 
  interview, 
  onDelete, 
  onPrepare, 
  onRecordOutcome,
  onRefresh,
  viewMode = 'kanban'
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const formatDate = (date) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getDaysUntil = (date) => {
    if (!date) return null;
    const now = new Date();
    const target = new Date(date);
    const diffTime = target - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setIsUpdating(true);
      const updates = { status: newStatus };
      
      // Auto-set dates based on status
      if (newStatus === 'Outreach Sent' && !interview.dates.outreachDate) {
        updates.dates = { ...interview.dates, outreachDate: new Date() };
      } else if (newStatus === 'Follow-up Sent' && !interview.dates.followUpDate) {
        updates.dates = { ...interview.dates, followUpDate: new Date() };
      }
      
      await updateInformationalInterview(interview._id, updates);
      onRefresh();
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const daysUntil = getDaysUntil(interview.dates?.interviewDate);
  const isUpcoming = daysUntil !== null && daysUntil >= 0 && daysUntil <= 7;
  const isPast = daysUntil !== null && daysUntil < 0;

  return (
    <div className={`bg-white rounded-lg shadow-sm hover:shadow-md transition ${viewMode === 'list' ? 'p-4' : 'p-3'}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 truncate">
            {interview.candidateName}
          </h4>
          <p className="text-sm text-gray-600 truncate">{interview.targetRole}</p>
          <p className="text-xs text-gray-500 truncate">{interview.targetCompany}</p>
        </div>
        
        {interview.impactScore > 0 && (
          <div className="ml-2 flex-shrink-0">
            <div className="px-2 py-1 bg-purple-100 rounded text-xs font-semibold text-purple-700">
              ⭐ {interview.impactScore}
            </div>
          </div>
        )}
      </div>

      {/* Interview Date Badge */}
      {interview.dates?.interviewDate && (
        <div className={`text-xs px-2 py-1 rounded inline-block mb-2 ${
          isUpcoming ? 'bg-yellow-100 text-yellow-800' :
          isPast ? 'bg-gray-100 text-gray-600' :
          'bg-blue-100 text-blue-800'
        }`}>
          📅 {formatDate(interview.dates.interviewDate)}
          {isUpcoming && ` (${daysUntil} days)`}
        </div>
      )}

      {/* Referral Badge */}
      {interview.outcomes?.referralObtained && (
        <div className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded inline-block mb-2 ml-1">
          🤝 Referral Obtained
        </div>
      )}

      {/* Status Dropdown */}
      <div className="mb-2">
        <select
          value={interview.status}
          onChange={(e) => handleStatusChange(e.target.value)}
          disabled={isUpdating}
          className="text-xs w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          {STATUS_OPTIONS.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-1 mt-2">
        {interview.status === 'Scheduled' && (
          <button
            onClick={() => onPrepare(interview)}
            className="flex-1 text-xs px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition"
          >
            📝 Prepare
          </button>
        )}
        
        {(interview.status === 'Completed' || interview.status === 'Follow-up Sent') && (
          <button
            onClick={() => onRecordOutcome(interview)}
            className="flex-1 text-xs px-2 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded transition"
          >
            📊 Outcomes
          </button>
        )}
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-1 text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition"
        >
          {isExpanded ? '▲' : '▼'}
        </button>
        
        <button
          onClick={() => onDelete(interview._id)}
          className="text-xs px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded transition"
        >
          🗑️
        </button>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-200 space-y-2 text-xs">
          {interview.candidateEmail && (
            <div>
              <span className="font-medium text-gray-700">Email: </span>
              <a href={`mailto:${interview.candidateEmail}`} className="text-indigo-600 hover:underline">
                {interview.candidateEmail}
              </a>
            </div>
          )}
          
          {interview.candidateLinkedIn && (
            <div>
              <span className="font-medium text-gray-700">LinkedIn: </span>
              <a href={interview.candidateLinkedIn} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                Profile
              </a>
            </div>
          )}
          
          {interview.outcomes?.keyLearnings && (
            <div>
              <span className="font-medium text-gray-700">Key Learnings: </span>
              <p className="text-gray-600 mt-1">{interview.outcomes.keyLearnings}</p>
            </div>
          )}
          
          {interview.tags && interview.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {interview.tags.map((tag, idx) => (
                <span key={idx} className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
