import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { setAuthToken } from '../api/axios';
import { getPendingReminders, getReminderTypeInfo, formatScheduledDate } from '../api/followUpReminders';

/**
 * FollowUpReminderNotification - Shows a notification badge/dropdown for pending reminders
 * Can be placed in the navbar or dashboard
 */
export default function FollowUpReminderNotification({ onViewAll, onOpenFollowUpTemplates }) {
  const { getToken } = useAuth();
  const [reminders, setReminders] = useState({ overdue: [], upcoming: [], total: 0 });
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadReminders = useCallback(async () => {
    try {
      const token = await getToken();
      setAuthToken(token);
      const data = await getPendingReminders(7);
      setReminders(data.data || { overdue: [], upcoming: [], total: 0 });
    } catch (err) {
      console.error('Failed to load reminders:', err);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    loadReminders();
    // Refresh every 5 minutes
    const interval = setInterval(loadReminders, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadReminders]);

  const totalCount = (reminders.overdue?.length || 0) + (reminders.upcoming?.length || 0);
  const overdueCount = reminders.overdue?.length || 0;

  // Don't show anything if no reminders
  if (!loading && totalCount === 0) {
    return null;
  }

  return (
    <div className="relative">
      {/* Notification Bell/Badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
        title="Follow-up Reminders"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        {/* Badge */}
        {totalCount > 0 && (
          <span className={`absolute -top-1 -right-1 px-1.5 py-0.5 text-xs font-bold rounded-full ${
            overdueCount > 0 ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
          }`}>
            {totalCount > 9 ? '9+' : totalCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Content */}
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">Follow-up Reminders</h3>
                {overdueCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                    {overdueCount} overdue
                  </span>
                )}
              </div>
            </div>

            {/* Reminders List */}
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : (
                <>
                  {/* Overdue */}
                  {reminders.overdue?.slice(0, 3).map(reminder => (
                    <ReminderItem 
                      key={reminder._id} 
                      reminder={reminder} 
                      isOverdue={true}
                      onClick={() => {
                        setIsOpen(false);
                        onOpenFollowUpTemplates?.(reminder.jobId);
                      }}
                    />
                  ))}

                  {/* Upcoming */}
                  {reminders.upcoming?.slice(0, 3).map(reminder => (
                    <ReminderItem 
                      key={reminder._id} 
                      reminder={reminder} 
                      isOverdue={false}
                      onClick={() => {
                        setIsOpen(false);
                        onOpenFollowUpTemplates?.(reminder.jobId);
                      }}
                    />
                  ))}

                  {/* Empty State */}
                  {totalCount === 0 && (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No pending reminders
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            {totalCount > 0 && (
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onViewAll?.();
                  }}
                  className="w-full text-center text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  View All Reminders →
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ReminderItem({ reminder, isOverdue, onClick }) {
  const typeInfo = getReminderTypeInfo(reminder.reminderType);
  
  return (
    <div 
      className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition ${
        isOverdue ? 'bg-red-50' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg">{typeInfo.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">
            {reminder.jobId?.title}
          </p>
          <p className="text-xs text-gray-600 truncate">
            {reminder.jobId?.company}
          </p>
          <p className={`text-xs font-medium mt-1 ${isOverdue ? 'text-red-600' : 'text-gray-500'}`}>
            {formatScheduledDate(reminder.scheduledDate)}
          </p>
        </div>
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
          reminder.priority === 'high' ? 'bg-red-100 text-red-700' :
          reminder.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
          'bg-green-100 text-green-700'
        }`}>
          {reminder.priority}
        </span>
      </div>
    </div>
  );
}

/**
 * Compact reminder count badge for navbar
 */
export function FollowUpReminderBadge() {
  const { getToken } = useAuth();
  const [count, setCount] = useState(0);
  const [hasOverdue, setHasOverdue] = useState(false);

  useEffect(() => {
    const loadCount = async () => {
      try {
        const token = await getToken();
        setAuthToken(token);
        const data = await getPendingReminders(7);
        const reminders = data.data || { overdue: [], upcoming: [] };
        setCount((reminders.overdue?.length || 0) + (reminders.upcoming?.length || 0));
        setHasOverdue((reminders.overdue?.length || 0) > 0);
      } catch (err) {
        console.error('Failed to load reminder count:', err);
      }
    };

    loadCount();
    const interval = setInterval(loadCount, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [getToken]);

  if (count === 0) return null;

  return (
    <span className={`px-1.5 py-0.5 text-xs font-bold rounded-full ${
      hasOverdue ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
    }`}>
      {count > 9 ? '9+' : count}
    </span>
  );
}
