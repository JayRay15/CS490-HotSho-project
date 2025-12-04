import { useState } from 'react';
import Card from '../Card';
import Button from '../Button';
import { Copy, CheckCircle, Mail } from 'lucide-react';

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
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [logActivity, setLogActivity] = useState(true);
  const [showSnoozeOptions, setShowSnoozeOptions] = useState(false);
  const [copied, setCopied] = useState(false);

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
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-blue-900">Suggested Check-in Message</div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(reminder.suggestedMessage);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900 transition"
              >
                {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              {contact?.email && (
                <button
                  onClick={() => {
                    const subject = `Checking in - ${reminder.reminderType}`;
                    const mailtoLink = `mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(reminder.suggestedMessage)}`;
                    window.open(mailtoLink, '_blank');
                  }}
                  className="flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900 transition"
                >
                  <Mail size={14} />
                  Send Email
                </button>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{reminder.suggestedMessage}</p>
        </div>
      )}

      {/* Send Check-in Modal */}
      {showCheckInModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Send Check-in to {contact ? `${contact.firstName} ${contact.lastName}` : 'Contact'}
                </h3>
                <button
                  onClick={() => setShowCheckInModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{icon}</span>
                  <span className="text-sm font-medium text-gray-700">{reminder.reminderType}</span>
                </div>
                {contact?.email && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Email:</span> {contact.email}
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Personalized Message
                </label>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {reminder.suggestedMessage || `Hi ${contact?.firstName || 'there'},\n\nI hope this message finds you well! I wanted to reach out and check in to see how things are going.\n\nWould love to catch up sometime soon.\n\nBest regards`}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {/* Primary Actions */}
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => {
                      const message = reminder.suggestedMessage || `Hi ${contact?.firstName || 'there'},\n\nI hope this message finds you well! I wanted to reach out and check in to see how things are going.\n\nWould love to catch up sometime soon.\n\nBest regards`;
                      navigator.clipboard.writeText(message);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                  >
                    {copied ? '✓ Copied to Clipboard!' : 'Copy Message'}
                  </Button>
                  {contact?.email && (
                    <Button
                      className="flex-1"
                      variant="secondary"
                      onClick={() => {
                        const message = reminder.suggestedMessage || `Hi ${contact?.firstName || 'there'},\n\nI hope this message finds you well! I wanted to reach out and check in to see how things are going.\n\nWould love to catch up sometime soon.\n\nBest regards`;
                        const subject = reminder.reminderType === 'Birthday' 
                          ? `Happy Birthday, ${contact.firstName}!`
                          : reminder.reminderType === 'Congratulations'
                          ? `Congratulations, ${contact.firstName}!`
                          : `Checking in - Hope you're doing well!`;
                        const mailtoLink = `mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
                        window.open(mailtoLink, '_blank');
                      }}
                    >
                      <Mail size={16} className="mr-2" />
                      Open in Email
                    </Button>
                  )}
                </div>

                {/* LinkedIn Option */}
                {contact?.linkedinUrl && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      window.open(contact.linkedinUrl, '_blank');
                    }}
                  >
                    Open LinkedIn Profile
                  </Button>
                )}

                {/* Mark as Complete */}
                <div className="border-t pt-3 mt-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setShowCheckInModal(false);
                      setShowCompleteForm(true);
                    }}
                  >
                    Mark Check-in as Complete
                  </Button>
                </div>
              </div>
            </div>
          </div>
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
            onClick={() => setShowCheckInModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Send Check-in
          </Button>
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
