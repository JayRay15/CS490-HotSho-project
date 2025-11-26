import { useState } from 'react';
import Card from '../Card';
import Button from '../Button';

const priorityColors = {
  High: 'bg-red-100 text-red-800',
  Medium: 'bg-yellow-100 text-yellow-800',
  Low: 'bg-green-100 text-green-800'
};

const reminderTypeIcons = {
  'General Check-in': '👋',
  'Birthday': '🎂',
  'Work Anniversary': '🎉',
  'Industry News Share': '📰',
  'Congratulations': '🎊',
  'Thank You': '🙏',
  'Follow-up': '📧',
  'Coffee Chat': '☕',
  'Relationship Maintenance': '🤝',
  'Custom': '📌'
};

export default function RelationshipReminderCard({ 
  reminder, 
  onComplete, 
  onSnooze, 
  onDismiss,
  onRefresh 
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [notes, setNotes] = useState('');
  const [logActivity, setLogActivity] = useState(true);
  const [showSnoozeOptions, setShowSnoozeOptions] = useState(false);

  const formatDate = (date) => {
    const d = new Date(date);
    // Use UTC methods to avoid timezone conversion
    const month = d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
    const day = d.getUTCDate();
    const year = d.getUTCFullYear();
    return `${month} ${day}, ${year}`;
  };

  const isOverdue = () => {
    if (reminder.status !== 'Pending') return false;
    const reminderDate = new Date(reminder.reminderDate);
    const today = new Date();
    // Compare UTC dates at midnight
    const reminderUTC = Date.UTC(reminderDate.getUTCFullYear(), reminderDate.getUTCMonth(), reminderDate.getUTCDate());
    const todayUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    return reminderUTC < todayUTC;
  };

  const handleComplete = () => {
    onComplete(reminder._id, notes, logActivity);
    setShowCompleteForm(false);
    setNotes('');
  };

  const handleSnooze = (days) => {
    onSnooze(reminder._id, days);
    setShowSnoozeOptions(false);
  };

  const contact = reminder.contactId;
  const icon = reminderTypeIcons[reminder.reminderType] || '📌';

  return (
    <Card variant="outlined" className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">{icon}</span>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {reminder.title}
              </h3>
              <p className="text-sm text-gray-600">
                {contact ? `${contact.firstName} ${contact.lastName}` : 'Unknown Contact'}
                {contact?.company && ` • ${contact.company}`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[reminder.priority]}`}>
            {reminder.priority}
          </span>
          {reminder.status === 'Pending' && isOverdue() && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              Overdue
            </span>
          )}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            reminder.status === 'Completed' ? 'bg-green-100 text-green-800' :
            reminder.status === 'Snoozed' ? 'bg-blue-100 text-blue-800' :
            reminder.status === 'Dismissed' ? 'bg-gray-100 text-gray-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {reminder.status}
          </span>
        </div>
      </div>

      {/* Reminder Details */}
      <div className="mb-3 space-y-1 text-sm">
        <div className="flex items-center text-gray-700">
          <span className="font-medium mr-2">Type:</span>
          {reminder.reminderType}
        </div>
        <div className="flex items-center text-gray-700">
          <span className="font-medium mr-2">Date:</span>
          {formatDate(reminder.reminderDate)}
        </div>
        {reminder.description && (
          <div className="flex items-start text-gray-700">
            <span className="font-medium mr-2">Notes:</span>
            <span>{reminder.description}</span>
          </div>
        )}
      </div>

      {/* Suggested Message */}
      {reminder.suggestedMessage && showDetails && (
        <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-xs font-medium text-blue-900 mb-2">Suggested Message</div>
          <p className="text-sm text-gray-700">{reminder.suggestedMessage}</p>
        </div>
      )}

      {/* Complete Form */}
      {showCompleteForm && (
        <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Completion Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            rows={3}
            placeholder="Add any notes about this interaction..."
          />
          <div className="flex items-center mt-2 mb-3">
            <input
              type="checkbox"
              id="logActivity"
              checked={logActivity}
              onChange={(e) => setLogActivity(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="logActivity" className="text-sm text-gray-700">
              Log this as an activity
            </label>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleComplete}>
              Confirm Complete
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowCompleteForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Snooze Options */}
      {showSnoozeOptions && (
        <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-700 mb-2">Snooze for:</div>
          <div className="flex flex-wrap gap-2">
            {[1, 3, 7, 14, 30].map(days => (
              <Button
                key={days}
                size="sm"
                variant="outline"
                onClick={() => handleSnooze(days)}
              >
                {days} {days === 1 ? 'day' : 'days'}
              </Button>
            ))}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowSnoozeOptions(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Actions */}
      {reminder.status === 'Pending' && (
        <div className="flex flex-wrap gap-2">
          <Button 
            size="sm" 
            onClick={() => setShowCompleteForm(true)}
          >
            Complete
          </Button>
          <Button 
            size="sm" 
            variant="secondary" 
            onClick={() => setShowSnoozeOptions(true)}
          >
            Snooze
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => onDismiss(reminder._id)}
          >
            Dismiss
          </Button>
        </div>
      )}

      {reminder.status === 'Completed' && reminder.completedNotes && (
        <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="text-xs font-medium text-green-900 mb-1">Completion Notes</div>
          <p className="text-sm text-gray-700">{reminder.completedNotes}</p>
          <p className="text-xs text-gray-500 mt-1">
            Completed on {formatDate(reminder.completedAt)}
          </p>
        </div>
      )}
    </Card>
  );
}
