import Card from '../Card';

const activityTypeIcons = {
  'Email Sent': '📧',
  'Email Received': '📨',
  'Phone Call': '📞',
  'Meeting': '🤝',
  'LinkedIn Message': '💼',
  'Coffee Chat': '☕',
  'Introduction Made': '🤝',
  'Referral Requested': '🙋',
  'Referral Provided': '✅',
  'Job Lead Shared': '💼',
  'Advice Requested': '❓',
  'Advice Given': '💡',
  'Birthday Wish': '🎂',
  'Congratulations Sent': '🎊',
  'Thank You Sent': '🙏',
  'Industry News Shared': '📰',
  'Event Attended Together': '🎫',
  'Other': '📝'
};

const directionColors = {
  Outbound: 'bg-blue-100 text-blue-800',
  Inbound: 'bg-green-100 text-green-800',
  Mutual: 'bg-purple-100 text-purple-800'
};

const sentimentColors = {
  Positive: 'text-green-600',
  Neutral: 'text-gray-600',
  Negative: 'text-red-600'
};

export default function RelationshipActivityCard({ activity }) {
  const formatDate = (date) => {
    const d = new Date(date);
    // Use UTC methods to avoid timezone conversion
    const month = d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
    const day = d.getUTCDate();
    const year = d.getUTCFullYear();
    return `${month} ${day}, ${year}`;
  };

  const contact = activity.contactId;
  const icon = activityTypeIcons[activity.activityType] || '📝';

  return (
    <Card variant="outlined" className="p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              {activity.activityType}
            </h3>
            <p className="text-sm text-gray-600">
              {contact ? `${contact.firstName} ${contact.lastName}` : 'Unknown Contact'}
              {contact?.company && ` • ${contact.company}`}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${directionColors[activity.direction]}`}>
            {activity.direction}
          </span>
          <span className="text-xs text-gray-500">
            {formatDate(activity.activityDate)}
          </span>
        </div>
      </div>

      {activity.subject && (
        <div className="mb-2">
          <span className="text-sm font-medium text-gray-700">Subject: </span>
          <span className="text-sm text-gray-600">{activity.subject}</span>
        </div>
      )}

      {activity.notes && (
        <div className="mb-2 text-sm text-gray-700">
          {activity.notes}
        </div>
      )}

      <div className="flex flex-wrap gap-4 text-xs text-gray-600">
        {activity.sentiment && activity.sentiment !== 'Neutral' && (
          <div className="flex items-center gap-1">
            <span className="font-medium">Sentiment:</span>
            <span className={sentimentColors[activity.sentiment]}>
              {activity.sentiment}
            </span>
          </div>
        )}

        {activity.valueExchange && activity.valueExchange !== 'None' && (
          <div className="flex items-center gap-1">
            <span className="font-medium">Value:</span>
            <span>{activity.valueExchange}</span>
            {activity.valueType && <span>({activity.valueType})</span>}
          </div>
        )}

        {activity.opportunityGenerated && (
          <div className="flex items-center gap-1">
            <span className="font-medium text-green-600">✓ Opportunity Generated</span>
            {activity.opportunityType && <span>({activity.opportunityType})</span>}
          </div>
        )}

        {activity.responseReceived && (
          <div className="flex items-center gap-1">
            <span className="font-medium text-green-600">✓ Response Received</span>
            {activity.responseTime && (
              <span>in {activity.responseTime}h</span>
            )}
          </div>
        )}
      </div>

      {activity.tags && activity.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {activity.tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}
