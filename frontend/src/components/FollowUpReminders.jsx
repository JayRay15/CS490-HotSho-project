import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { setAuthToken } from '../api/axios';
import {
  getPendingReminders,
  getReminderStats,
  snoozeReminder,
  dismissReminder,
  completeReminder,
  getEtiquetteTips,
  getPriorityBadgeClasses,
  getStatusBadgeClasses,
  getReminderTypeInfo,
  formatScheduledDate,
  getResponsivenessInfo,
  dismissRejectedReminders
} from '../api/followUpReminders';

const SNOOZE_OPTIONS = [
  { days: 1, label: '1 day' },
  { days: 2, label: '2 days' },
  { days: 3, label: '3 days' },
  { days: 7, label: '1 week' }
];

export default function FollowUpReminders({ onOpenFollowUpTemplates }) {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState({ overdue: [], upcoming: [], total: 0 });
  const [stats, setStats] = useState(null);
  const [expandedReminder, setExpandedReminder] = useState(null);
  const [etiquetteTips, setEtiquetteTips] = useState(null);
  const [selectedSnooze, setSelectedSnooze] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  const [showDismissedMessage, setShowDismissedMessage] = useState(false);

  const loadReminders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      setAuthToken(token);
      
      const [remindersData, statsData] = await Promise.all([
        getPendingReminders(14),
        getReminderStats()
      ]);
      
      setReminders(remindersData.data || { overdue: [], upcoming: [], total: 0 });
      setStats(statsData.data);
    } catch (err) {
      console.error('Failed to load reminders:', err);
      setError('Failed to load reminders. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  const loadEtiquetteTips = async (type) => {
    try {
      const token = await getToken();
      setAuthToken(token);
      const response = await getEtiquetteTips(type);
      setEtiquetteTips(response.data);
    } catch (err) {
      console.error('Failed to load etiquette tips:', err);
    }
  };

  const handleSnooze = async (reminderId, days) => {
    try {
      setActionLoading(reminderId);
      const token = await getToken();
      setAuthToken(token);
      await snoozeReminder(reminderId, { days });
      await loadReminders();
      setSelectedSnooze(null);
    } catch (err) {
      console.error('Failed to snooze reminder:', err);
      setError('Failed to snooze reminder');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDismiss = async (reminderId, reason = 'Manually dismissed') => {
    try {
      setActionLoading(reminderId);
      const token = await getToken();
      setAuthToken(token);
      await dismissReminder(reminderId, reason);
      await loadReminders();
    } catch (err) {
      console.error('Failed to dismiss reminder:', err);
      setError('Failed to dismiss reminder');
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async (reminderId) => {
    try {
      setActionLoading(reminderId);
      const token = await getToken();
      setAuthToken(token);
      await completeReminder(reminderId, { method: 'marked-complete' });
      await loadReminders();
    } catch (err) {
      console.error('Failed to complete reminder:', err);
      setError('Failed to complete reminder');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDismissRejected = async () => {
    try {
      setActionLoading('dismiss-rejected');
      const token = await getToken();
      setAuthToken(token);
      const response = await dismissRejectedReminders();
      setShowDismissedMessage(true);
      setTimeout(() => setShowDismissedMessage(false), 3000);
      await loadReminders();
    } catch (err) {
      console.error('Failed to dismiss rejected reminders:', err);
      setError('Failed to dismiss rejected reminders');
    } finally {
      setActionLoading(null);
    }
  };

  const handleExpandReminder = async (reminder) => {
    if (expandedReminder === reminder._id) {
      setExpandedReminder(null);
      setEtiquetteTips(null);
    } else {
      setExpandedReminder(reminder._id);
      await loadEtiquetteTips(reminder.reminderType);
    }
  };

  const handleSendFollowUp = (reminder) => {
    if (onOpenFollowUpTemplates && reminder.jobId) {
      onOpenFollowUpTemplates(reminder.jobId);
    }
  };

  const ReminderCard = ({ reminder, isOverdue }) => {
    const typeInfo = getReminderTypeInfo(reminder.reminderType);
    const isExpanded = expandedReminder === reminder._id;
    const isLoading = actionLoading === reminder._id;
    const responsivenessInfo = getResponsivenessInfo(reminder.companyResponsiveness?.responsiveness);

    return (
      <div 
        className={`border rounded-lg p-4 mb-3 transition-all ${
          isOverdue 
            ? 'border-red-300 bg-red-50' 
            : 'border-gray-200 bg-white hover:shadow-md'
        }`}
      >
        {/* Header */}
        <div 
          className="flex items-start justify-between cursor-pointer"
          onClick={() => handleExpandReminder(reminder)}
        >
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{typeInfo.icon}</span>
              <h4 className="font-medium text-gray-900">{reminder.title}</h4>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-gray-600">
                {reminder.jobId?.title} at {reminder.jobId?.company}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityBadgeClasses(reminder.priority)}`}>
                {reminder.priority}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClasses(reminder.status)}`}>
                {reminder.status}
              </span>
            </div>
            <div className={`mt-1 text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
              {formatScheduledDate(reminder.scheduledDate)}
            </div>
          </div>
          <div className="ml-4">
            <span className="text-gray-400 text-lg">
              {isExpanded ? '▼' : '▶'}
            </span>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            {/* Description */}
            <p className="text-sm text-gray-700 mb-4">{reminder.description}</p>

            {/* Company Responsiveness */}
            {reminder.companyResponsiveness && reminder.companyResponsiveness.responsiveness !== 'unknown' && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-700">Company Responsiveness:</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${responsivenessInfo.color}`}>
                    {responsivenessInfo.label}
                  </span>
                </div>
                <p className="text-xs text-gray-600">{responsivenessInfo.description}</p>
                {reminder.adjustedFrequency?.adjustmentReason && (
                  <p className="text-xs text-gray-500 mt-1 italic">
                    Timing adjusted: {reminder.adjustedFrequency.adjustmentReason}
                  </p>
                )}
              </div>
            )}

            {/* Etiquette Tips */}
            {etiquetteTips && (
              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-800 mb-2 flex items-center gap-1">
                  <span>💡</span> Follow-up Etiquette Tips
                </h5>
                <ul className="space-y-1">
                  {etiquetteTips.tips?.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className={`mt-0.5 ${
                        tip.importance === 'critical' ? 'text-red-500' :
                        tip.importance === 'important' ? 'text-yellow-500' :
                        'text-green-500'
                      }`}>
                        {tip.importance === 'critical' ? '⚠️' :
                         tip.importance === 'important' ? '📌' : '💚'}
                      </span>
                      <span className="text-gray-700">{tip.tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggested Template */}
            {reminder.suggestedTemplateType && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span>📧</span>
                  <span className="text-sm text-blue-800">
                    Suggested template: <span className="font-medium capitalize">{reminder.suggestedTemplateType.replace('-', ' ')}</span>
                  </span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
              {/* Send Follow-up Button */}
              <button
                onClick={() => handleSendFollowUp(reminder)}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                📧 Send Follow-up
              </button>

              {/* Complete Button */}
              <button
                onClick={() => handleComplete(reminder._id)}
                disabled={isLoading}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                {isLoading ? '...' : '✓ Mark Complete'}
              </button>

              {/* Snooze Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setSelectedSnooze(selectedSnooze === reminder._id ? null : reminder._id)}
                  disabled={isLoading}
                  className="px-4 py-2 bg-yellow-500 text-white text-sm font-medium rounded-lg hover:bg-yellow-600 transition disabled:opacity-50"
                >
                  ⏰ Snooze
                </button>
                {selectedSnooze === reminder._id && (
                  <div className="absolute z-10 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[120px]">
                    {SNOOZE_OPTIONS.map(option => (
                      <button
                        key={option.days}
                        onClick={() => handleSnooze(reminder._id, option.days)}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Dismiss Button */}
              <button
                onClick={() => handleDismiss(reminder._id)}
                disabled={isLoading}
                className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
              >
                {isLoading ? '...' : '✕ Dismiss'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading reminders...</span>
      </div>
    );
  }

  return (
    <div className="follow-up-reminders">
      {/* Header */}
      <div className="bg-gray-50 border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-heading font-semibold text-gray-900">
              Follow-up Reminders
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Stay on top of your applications with intelligent follow-up reminders
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-2 font-medium hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Success Message */}
      {showDismissedMessage && (
        <div className="mx-6 mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          ✓ Reminders for rejected applications have been dismissed
        </div>
      )}

      {/* Statistics */}
      {stats && (
        <div className="px-6 py-4 bg-white border-b">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-800">{stats.overdueCount || 0}</div>
              <div className="text-xs text-red-600 font-medium">Overdue</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-800">{stats.upcomingCount || 0}</div>
              <div className="text-xs text-blue-600 font-medium">Upcoming</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-800">{stats.completionRate || 0}%</div>
              <div className="text-xs text-green-600 font-medium">Completion Rate</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-800">{stats.responseRate || 0}%</div>
              <div className="text-xs text-purple-600 font-medium">Response Rate</div>
            </div>
          </div>
        </div>
      )}

      {/* Actions Bar */}
      <div className="px-6 py-3 bg-gray-50 border-b flex justify-between items-center">
        <button
          onClick={loadReminders}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          ↻ Refresh
        </button>
        <button
          onClick={handleDismissRejected}
          disabled={actionLoading === 'dismiss-rejected'}
          className="text-sm text-gray-600 hover:text-gray-800"
        >
          {actionLoading === 'dismiss-rejected' ? 'Dismissing...' : 'Dismiss all for rejected apps'}
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Overdue Reminders */}
        {reminders.overdue?.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-red-600 mb-3 flex items-center gap-2">
              <span>⚠️</span> Overdue ({reminders.overdue.length})
            </h3>
            {reminders.overdue.map(reminder => (
              <ReminderCard key={reminder._id} reminder={reminder} isOverdue={true} />
            ))}
          </div>
        )}

        {/* Upcoming Reminders */}
        {reminders.upcoming?.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span>📅</span> Upcoming ({reminders.upcoming.length})
            </h3>
            {reminders.upcoming.map(reminder => (
              <ReminderCard key={reminder._id} reminder={reminder} isOverdue={false} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {(!reminders.overdue?.length && !reminders.upcoming?.length) && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">✅</div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">All caught up!</h3>
            <p className="text-sm text-gray-600">
              No pending follow-up reminders. Keep applying and they'll appear here automatically.
            </p>
          </div>
        )}

        {/* Best Practices Section */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
            <span>📚</span> Follow-up Best Practices
          </h3>
          <ul className="space-y-2 text-sm text-blue-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-500">•</span>
              <span><strong>Thank-you notes:</strong> Send within 24 hours of any interview</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500">•</span>
              <span><strong>Application follow-ups:</strong> Wait 1-2 weeks before checking in</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500">•</span>
              <span><strong>Post-interview:</strong> Follow up 3-5 business days after if no response</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500">•</span>
              <span><strong>Keep it brief:</strong> Your follow-up should be 3-4 sentences max</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500">•</span>
              <span><strong>Know when to stop:</strong> Two follow-ups max per stage; then move on</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
