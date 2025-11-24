import Card from '../Card';

export default function RelationshipAnalytics({ analytics }) {
  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="outlined" className="p-4">
          <div className="text-sm text-gray-600 mb-1">Total Contacts</div>
          <div className="text-3xl font-bold text-gray-900">{analytics.totalContacts}</div>
        </Card>
        <Card variant="outlined" className="p-4">
          <div className="text-sm text-gray-600 mb-1">Active Contacts</div>
          <div className="text-3xl font-bold text-green-600">{analytics.activeContacts}</div>
          <div className="text-xs text-gray-500 mt-1">Last 30 days</div>
        </Card>
        <Card variant="outlined" className="p-4">
          <div className="text-sm text-gray-600 mb-1">Inactive Contacts</div>
          <div className="text-3xl font-bold text-orange-600">{analytics.inactiveContacts}</div>
          <div className="text-xs text-gray-500 mt-1">Need attention</div>
        </Card>
        <Card variant="outlined" className="p-4">
          <div className="text-sm text-gray-600 mb-1">Opportunities</div>
          <div className="text-3xl font-bold text-blue-600">{analytics.opportunitiesGenerated}</div>
          <div className="text-xs text-gray-500 mt-1">From relationships</div>
        </Card>
      </div>

      {/* Activity Summary */}
      <Card variant="outlined" className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-gray-600 mb-2">Total Activities</div>
            <div className="text-2xl font-bold text-gray-900">{analytics.totalActivities}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-2">Outbound</div>
            <div className="text-2xl font-bold text-blue-600">{analytics.outboundActivities}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-2">Inbound</div>
            <div className="text-2xl font-bold text-green-600">{analytics.inboundActivities}</div>
          </div>
        </div>

        {/* Reciprocity Rate */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Reciprocity Rate</span>
            <span className="text-sm font-semibold text-gray-900">{analytics.reciprocityRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full ${
                analytics.reciprocityRate >= 60 ? 'bg-green-500' :
                analytics.reciprocityRate >= 30 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${analytics.reciprocityRate}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {analytics.reciprocityRate >= 60 
              ? 'Excellent! Your relationships are well-balanced.'
              : analytics.reciprocityRate >= 30
              ? 'Good. Consider receiving more value from your network.'
              : 'Focus on building mutually beneficial relationships.'}
          </p>
        </div>
      </Card>

      {/* Activity Types Breakdown */}
      <Card variant="outlined" className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Types</h3>
        <div className="space-y-3">
          {Object.entries(analytics.activityTypes || {})
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{type}</span>
                <div className="flex items-center gap-3">
                  <div className="w-48 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ 
                        width: `${(count / analytics.totalActivities) * 100}%` 
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-12 text-right">
                    {count}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </Card>

      {/* Value Exchange */}
      <Card variant="outlined" className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Value Exchange</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {analytics.valueExchanges.given}
            </div>
            <div className="text-sm text-gray-600">Value Given</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {analytics.valueExchanges.received}
            </div>
            <div className="text-sm text-gray-600">Value Received</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-1">
              {analytics.valueExchanges.mutual}
            </div>
            <div className="text-sm text-gray-600">Mutual Exchange</div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Insight:</span>{' '}
            {analytics.valueExchanges.given > analytics.valueExchanges.received * 2
              ? 'You\'re giving more than receiving. Consider asking for introductions or advice from your network.'
              : analytics.valueExchanges.received > analytics.valueExchanges.given * 2
              ? 'You\'re receiving more than giving. Look for opportunities to provide value to your contacts.'
              : 'Great balance! You\'re maintaining mutually beneficial relationships.'}
          </p>
        </div>
      </Card>

      {/* Recommendations */}
      <Card variant="outlined" className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
        <ul className="space-y-3">
          {analytics.inactiveContacts > analytics.activeContacts && (
            <li className="flex items-start gap-3">
              <span className="text-orange-600 mt-1">⚠️</span>
              <div>
                <div className="font-medium text-gray-900">Re-activate dormant relationships</div>
                <div className="text-sm text-gray-600">
                  You have {analytics.inactiveContacts} inactive contacts. Consider reaching out with a check-in message.
                </div>
              </div>
            </li>
          )}
          {analytics.reciprocityRate < 30 && (
            <li className="flex items-start gap-3">
              <span className="text-blue-600 mt-1">💡</span>
              <div>
                <div className="font-medium text-gray-900">Improve relationship balance</div>
                <div className="text-sm text-gray-600">
                  Your reciprocity rate is low. Try to receive more value by asking for advice or introductions.
                </div>
              </div>
            </li>
          )}
          {analytics.totalActivities < analytics.totalContacts && (
            <li className="flex items-start gap-3">
              <span className="text-green-600 mt-1">✅</span>
              <div>
                <div className="font-medium text-gray-900">Increase engagement</div>
                <div className="text-sm text-gray-600">
                  Try to log at least one activity per contact to track relationship health effectively.
                </div>
              </div>
            </li>
          )}
          <li className="flex items-start gap-3">
            <span className="text-purple-600 mt-1">🎯</span>
            <div>
              <div className="font-medium text-gray-900">Set up automated reminders</div>
              <div className="text-sm text-gray-600">
                Use the "Generate Auto Reminders" feature to stay on top of important check-ins and birthdays.
              </div>
            </div>
          </li>
        </ul>
      </Card>
    </div>
  );
}
