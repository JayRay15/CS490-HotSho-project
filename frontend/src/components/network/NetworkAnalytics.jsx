import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import api, { setAuthToken } from '../../api/axios';
import Card from '../Card';
import LoadingSpinner from '../LoadingSpinner';
import ErrorMessage from '../ErrorMessage';

export default function NetworkAnalytics() {
    const { getToken } = useAuth();
    const [analytics, setAnalytics] = useState(null);
    const [relationshipAnalytics, setRelationshipAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const token = await getToken();
            setAuthToken(token);

            const [networkRes, relationshipRes] = await Promise.all([
                api.get('/api/analytics/network'),
                api.get('/api/relationship-maintenance/activities/analytics')
            ]);

            setAnalytics(networkRes.data.data);
            setRelationshipAnalytics(relationshipRes.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching analytics:', err);
            setError(err.response?.data?.message || 'Failed to load analytics');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <LoadingSpinner />
            </div>
        );
    }

    if (error) {
        return <ErrorMessage message={error} />;
    }

    if (!analytics || !relationshipAnalytics) {
        return null;
    }

    const {
        activityVolume,
        relationshipHealth,
        eventROI,
        valueExchange,
        referralStats,
        opportunityConversion,
        engagementQuality
    } = analytics;

    return (
        <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium" style={{ color: '#656A5C' }}>Total Contacts</p>
                            <p className="text-3xl font-bold mt-2" style={{ color: '#4F5348' }}>
                                {relationshipHealth.total}
                            </p>
                        </div>
                        <div className="p-3 rounded-full" style={{ backgroundColor: '#E4E6E0' }}>
                            <svg className="w-8 h-8" style={{ color: '#777C6D' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium" style={{ color: '#656A5C' }}>Recent Activities</p>
                            <p className="text-3xl font-bold mt-2" style={{ color: '#4F5348' }}>
                                {activityVolume.last30Days}
                            </p>
                            <p className="text-xs mt-1" style={{ color: '#656A5C' }}>Last 30 days</p>
                        </div>
                        <div className="p-3 rounded-full" style={{ backgroundColor: '#E4E6E0' }}>
                            <svg className="w-8 h-8" style={{ color: '#777C6D' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium" style={{ color: '#656A5C' }}>Events Attended</p>
                            <p className="text-3xl font-bold mt-2" style={{ color: '#4F5348' }}>
                                {eventROI.totalEventsAttended}
                            </p>
                            <p className="text-xs mt-1" style={{ color: '#656A5C' }}>
                                {eventROI.totalConnectionsGained} connections gained
                            </p>
                        </div>
                        <div className="p-3 rounded-full" style={{ backgroundColor: '#E4E6E0' }}>
                            <svg className="w-8 h-8" style={{ color: '#777C6D' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Activity Volume */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4" style={{ color: '#4F5348' }}>
                    Activity Volume
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium" style={{ color: '#656A5C' }}>Last 30 Days</span>
                            <span className="text-lg font-bold" style={{ color: '#4F5348' }}>{activityVolume.last30Days}</span>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium" style={{ color: '#656A5C' }}>Last 90 Days</span>
                            <span className="text-lg font-bold" style={{ color: '#4F5348' }}>{activityVolume.last90Days}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium" style={{ color: '#656A5C' }}>Average per Week</span>
                            <span className="text-lg font-bold" style={{ color: '#4F5348' }}>{activityVolume.averagePerWeek}</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-sm font-medium mb-3" style={{ color: '#656A5C' }}>Top Activity Types</p>
                        {Object.entries(activityVolume.byType)
                            .sort(([, a], [, b]) => b - a)
                            .slice(0, 5)
                            .map(([type, count]) => (
                                <div key={type} className="flex justify-between items-center mb-2">
                                    <span className="text-sm" style={{ color: '#656A5C' }}>{type}</span>
                                    <span className="text-sm font-semibold" style={{ color: '#4F5348' }}>{count}</span>
                                </div>
                            ))}
                    </div>
                </div>
            </Card>

            {/* Relationship Health */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4" style={{ color: '#4F5348' }}>
                    Relationship Health
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <p className="text-sm font-medium mb-3" style={{ color: '#656A5C' }}>Distribution by Strength</p>
                        {Object.entries(relationshipHealth.byStrength).map(([strength, count]) => {
                            const percentage = relationshipHealth.total > 0
                                ? ((count / relationshipHealth.total) * 100).toFixed(0)
                                : 0;
                            return (
                                <div key={strength} className="mb-3">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-medium" style={{ color: '#656A5C' }}>{strength}</span>
                                        <span className="text-sm font-semibold" style={{ color: '#4F5348' }}>{count} ({percentage}%)</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="h-2 rounded-full transition-all duration-300"
                                            style={{
                                                width: `${percentage}%`,
                                                backgroundColor: '#777C6D'
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex flex-col justify-center">
                        <div className="text-center p-6 rounded-lg" style={{ backgroundColor: '#E4E6E0' }}>
                            <p className="text-sm font-medium mb-2" style={{ color: '#656A5C' }}>
                                Average Interactions per Contact
                            </p>
                            <p className="text-4xl font-bold" style={{ color: '#4F5348' }}>
                                {relationshipHealth.averageInteractionsPerContact}
                            </p>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Event ROI */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4" style={{ color: '#4F5348' }}>
                    Networking Event ROI
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#E4E6E0' }}>
                        <p className="text-sm font-medium mb-2" style={{ color: '#656A5C' }}>Avg Cost per Connection</p>
                        <p className="text-2xl font-bold" style={{ color: '#4F5348' }}>
                            ${eventROI.averageCostPerConnection}
                        </p>
                    </div>
                    <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#E4E6E0' }}>
                        <p className="text-sm font-medium mb-2" style={{ color: '#656A5C' }}>Avg Cost per Job Lead</p>
                        <p className="text-2xl font-bold" style={{ color: '#4F5348' }}>
                            ${eventROI.averageCostPerJobLead}
                        </p>
                    </div>
                    <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#E4E6E0' }}>
                        <p className="text-sm font-medium mb-2" style={{ color: '#656A5C' }}>Conversion Rate</p>
                        <p className="text-2xl font-bold" style={{ color: '#4F5348' }}>
                            {eventROI.conversionRate}%
                        </p>
                    </div>
                </div>

                {eventROI.topEvents && eventROI.topEvents.length > 0 && (
                    <div>
                        <p className="text-sm font-medium mb-3" style={{ color: '#656A5C' }}>Top ROI Events</p>
                        <div className="space-y-2">
                            {eventROI.topEvents.map((event, idx) => (
                                <div key={idx} className="flex justify-between items-center p-3 rounded-lg" style={{ backgroundColor: '#E4E6E0' }}>
                                    <div>
                                        <p className="font-medium" style={{ color: '#4F5348' }}>{event.name}</p>
                                        <p className="text-xs" style={{ color: '#656A5C' }}>
                                            {new Date(event.date).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold" style={{ color: '#4F5348' }}>
                                            ROI: {event.roiRating}/5
                                        </p>
                                        <p className="text-xs" style={{ color: '#656A5C' }}>
                                            {event.connectionsGained} connections, {event.jobLeadsGenerated} leads
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </Card>

            {/* Value Exchange & Referrals */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4" style={{ color: '#4F5348' }}>
                        Value Exchange
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium" style={{ color: '#656A5C' }}>Value Given</span>
                            <span className="text-lg font-bold" style={{ color: '#4F5348' }}>{valueExchange.totalValueGiven}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium" style={{ color: '#656A5C' }}>Value Received</span>
                            <span className="text-lg font-bold" style={{ color: '#4F5348' }}>{valueExchange.totalValueReceived}</span>
                        </div>
                        <div className="pt-4 border-t border-gray-200">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium" style={{ color: '#656A5C' }}>Reciprocity Score</span>
                                <span className="text-xl font-bold" style={{ color: '#777C6D' }}>{valueExchange.reciprocityScore}%</span>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4" style={{ color: '#4F5348' }}>
                        Referral Performance
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium" style={{ color: '#656A5C' }}>Total Requested</span>
                            <span className="text-lg font-bold" style={{ color: '#4F5348' }}>{referralStats.totalRequested}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium" style={{ color: '#656A5C' }}>Accepted</span>
                            <span className="text-lg font-bold text-green-600">{referralStats.accepted}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium" style={{ color: '#656A5C' }}>Success Rate</span>
                            <span className="text-xl font-bold" style={{ color: '#777C6D' }}>{referralStats.successRate}%</span>
                        </div>
                        <div className="pt-4 border-t border-gray-200">
                            <div className="flex justify-between items-center text-sm">
                                <span style={{ color: '#656A5C' }}>Led to Interview</span>
                                <span className="font-semibold" style={{ color: '#4F5348' }}>{referralStats.ledToInterview}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm mt-2">
                                <span style={{ color: '#656A5C' }}>Led to Offer</span>
                                <span className="font-semibold" style={{ color: '#4F5348' }}>{referralStats.ledToOffer}</span>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Opportunity Conversion & Engagement Quality */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4" style={{ color: '#4F5348' }}>
                        Opportunity Conversion
                    </h3>
                    <div className="text-center mb-4">
                        <p className="text-4xl font-bold mb-2" style={{ color: '#4F5348' }}>
                            {opportunityConversion.totalOpportunities}
                        </p>
                        <p className="text-sm" style={{ color: '#656A5C' }}>Total Opportunities Generated</p>
                        <p className="text-lg font-semibold mt-2" style={{ color: '#777C6D' }}>
                            {opportunityConversion.conversionRate}% conversion rate
                        </p>
                    </div>
                    {Object.keys(opportunityConversion.byType).length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <p className="text-sm font-medium mb-2" style={{ color: '#656A5C' }}>By Type</p>
                            {Object.entries(opportunityConversion.byType).map(([type, count]) => (
                                <div key={type} className="flex justify-between items-center mb-1">
                                    <span className="text-sm" style={{ color: '#656A5C' }}>{type}</span>
                                    <span className="text-sm font-semibold" style={{ color: '#4F5348' }}>{count}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4" style={{ color: '#4F5348' }}>
                        Engagement Quality
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium" style={{ color: '#656A5C' }}>Positive Sentiment</span>
                                <span className="text-lg font-bold" style={{ color: '#4F5348' }}>{engagementQuality.positiveSentimentRate}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="h-2 rounded-full transition-all duration-300"
                                    style={{
                                        width: `${engagementQuality.positiveSentimentRate}%`,
                                        backgroundColor: '#777C6D'
                                    }}
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium" style={{ color: '#656A5C' }}>Response Rate</span>
                                <span className="text-lg font-bold" style={{ color: '#4F5348' }}>{engagementQuality.responseRate}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="h-2 rounded-full transition-all duration-300"
                                    style={{
                                        width: `${engagementQuality.responseRate}%`,
                                        backgroundColor: '#777C6D'
                                    }}
                                />
                            </div>
                        </div>
                        <div className="pt-4 border-t border-gray-200">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium" style={{ color: '#656A5C' }}>Avg Response Time</span>
                                <span className="text-lg font-bold" style={{ color: '#4F5348' }}>{engagementQuality.averageResponseTime}h</span>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Recommendations (Merged from Relationship Maintenance) */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4" style={{ color: '#4F5348' }}>Recommendations</h3>
                <ul className="space-y-3">
                    {relationshipAnalytics.inactiveContacts > relationshipAnalytics.activeContacts && (
                        <li className="flex items-start gap-3">
                            <span className="text-orange-600 mt-1">⚠️</span>
                            <div>
                                <div className="font-medium" style={{ color: '#4F5348' }}>Re-activate dormant relationships</div>
                                <div className="text-sm text-gray-600">
                                    You have {relationshipAnalytics.inactiveContacts} inactive contacts. Consider reaching out with a check-in message.
                                </div>
                            </div>
                        </li>
                    )}
                    {relationshipAnalytics.reciprocityRate < 30 && (
                        <li className="flex items-start gap-3">
                            <span className="text-blue-600 mt-1">💡</span>
                            <div>
                                <div className="font-medium" style={{ color: '#4F5348' }}>Improve relationship balance</div>
                                <div className="text-sm text-gray-600">
                                    Your reciprocity rate is low. Try to receive more value by asking for advice or introductions.
                                </div>
                            </div>
                        </li>
                    )}
                    {relationshipAnalytics.totalActivities < relationshipAnalytics.totalContacts && (
                        <li className="flex items-start gap-3">
                            <span className="text-green-600 mt-1">✅</span>
                            <div>
                                <div className="font-medium" style={{ color: '#4F5348' }}>Increase engagement</div>
                                <div className="text-sm text-gray-600">
                                    Try to log at least one activity per contact to track relationship health effectively.
                                </div>
                            </div>
                        </li>
                    )}
                    <li className="flex items-start gap-3">
                        <span className="text-purple-600 mt-1">🎯</span>
                        <div>
                            <div className="font-medium" style={{ color: '#4F5348' }}>Set up automated reminders</div>
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
