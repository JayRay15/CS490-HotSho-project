import Contact from '../models/Contact.js';
import RelationshipActivity from '../models/RelationshipActivity.js';
import NetworkingEvent from '../models/NetworkingEvent.js';
import Referral from '../models/Referral.js';

// @desc    Get network analytics for authenticated user
// @route   GET /api/analytics/network
// @access  Private
export const getNetworkAnalytics = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

        // Fetch all relevant data
        const [contacts, activities, events, referrals] = await Promise.all([
            Contact.find({ userId }),
            RelationshipActivity.find({ userId }),
            NetworkingEvent.find({ userId }),
            Referral.find({ userId })
        ]);

        // 1. Activity Volume - Track networking activity volume
        const recentActivities30 = activities.filter(a => a.activityDate >= thirtyDaysAgo);
        const recentActivities90 = activities.filter(a => a.activityDate >= ninetyDaysAgo);

        const activityVolume = {
            last30Days: recentActivities30.length,
            last90Days: recentActivities90.length,
            averagePerWeek: (recentActivities30.length / 4.3).toFixed(1), // 30 days ≈ 4.3 weeks
            byType: {}
        };

        // Group by activity type
        recentActivities30.forEach(activity => {
            activityVolume.byType[activity.activityType] =
                (activityVolume.byType[activity.activityType] || 0) + 1;
        });

        // 2. Relationship Health - Analyze relationship strength development
        const relationshipHealth = {
            total: contacts.length,
            byStrength: {},
            averageInteractionsPerContact: contacts.length > 0
                ? (activities.length / contacts.length).toFixed(1)
                : 0
        };

        contacts.forEach(contact => {
            const strength = contact.relationshipStrength || 'New';
            relationshipHealth.byStrength[strength] =
                (relationshipHealth.byStrength[strength] || 0) + 1;
        });

        // 3. Event ROI - Measure networking event ROI
        const attendedEvents = events.filter(e => e.attendanceStatus === 'Attended');
        const eventsWithCost = attendedEvents.filter(e => e.cost && e.cost > 0);
        const totalCost = eventsWithCost.reduce((sum, e) => sum + (e.cost || 0), 0);
        const totalConnections = attendedEvents.reduce((sum, e) => sum + (e.connectionsGained || 0), 0);
        const totalJobLeads = attendedEvents.reduce((sum, e) => sum + (e.jobLeadsGenerated || 0), 0);
        const eventsWithApplications = attendedEvents.filter(e =>
            e.linkedJobApplications && e.linkedJobApplications.length > 0
        );

        const eventROI = {
            totalEventsAttended: attendedEvents.length,
            totalConnectionsGained: totalConnections,
            totalJobLeadsGenerated: totalJobLeads,
            averageCostPerConnection: totalConnections > 0
                ? (totalCost / totalConnections).toFixed(2)
                : 0,
            averageCostPerJobLead: totalJobLeads > 0
                ? (totalCost / totalJobLeads).toFixed(2)
                : 0,
            averageROIRating: attendedEvents.length > 0
                ? (attendedEvents.reduce((sum, e) => sum + (e.roiRating || 0), 0) / attendedEvents.length).toFixed(1)
                : 0,
            conversionRate: attendedEvents.length > 0
                ? ((eventsWithApplications.length / attendedEvents.length) * 100).toFixed(1)
                : 0,
            topEvents: attendedEvents
                .filter(e => e.roiRating)
                .sort((a, b) => (b.roiRating || 0) - (a.roiRating || 0))
                .slice(0, 5)
                .map(e => ({
                    name: e.name,
                    date: e.eventDate,
                    roiRating: e.roiRating,
                    connectionsGained: e.connectionsGained,
                    jobLeadsGenerated: e.jobLeadsGenerated
                }))
        };

        // 4. Value Exchange - Track mutual value exchange and reciprocity
        const valueGiven = activities.filter(a =>
            a.valueExchange === 'Given' || a.valueExchange === 'Mutual'
        ).length;
        const valueReceived = activities.filter(a =>
            a.valueExchange === 'Received' || a.valueExchange === 'Mutual'
        ).length;

        const valueExchange = {
            totalValueGiven: valueGiven,
            totalValueReceived: valueReceived,
            reciprocityScore: valueGiven > 0
                ? ((valueReceived / valueGiven) * 100).toFixed(1)
                : 0,
            byType: {}
        };

        // Group by value type
        activities.filter(a => a.valueType).forEach(activity => {
            valueExchange.byType[activity.valueType] =
                (valueExchange.byType[activity.valueType] || 0) + 1;
        });

        // 5. Referral Generation - Monitor referral generation
        const referralStats = {
            totalRequested: referrals.filter(r => r.status !== 'draft').length,
            accepted: referrals.filter(r => r.status === 'accepted').length,
            declined: referrals.filter(r => r.status === 'declined').length,
            pending: referrals.filter(r => r.status === 'requested').length,
            successRate: referrals.filter(r => r.status !== 'draft').length > 0
                ? ((referrals.filter(r => r.status === 'accepted').length /
                    referrals.filter(r => r.status !== 'draft').length) * 100).toFixed(1)
                : 0,
            ledToInterview: referrals.filter(r => r.outcome === 'led_to_interview').length,
            ledToOffer: referrals.filter(r => r.outcome === 'led_to_offer').length
        };

        // 6. Opportunity Conversion - Track job opportunity sourcing
        const opportunityActivities = activities.filter(a => a.opportunityGenerated);
        const opportunityConversion = {
            totalOpportunities: opportunityActivities.length,
            conversionRate: activities.length > 0
                ? ((opportunityActivities.length / activities.length) * 100).toFixed(1)
                : 0,
            byType: {}
        };

        opportunityActivities.forEach(activity => {
            const type = activity.opportunityType || 'Other';
            opportunityConversion.byType[type] =
                (opportunityConversion.byType[type] || 0) + 1;
        });

        // 7. Engagement Quality - Analyze engagement quality
        const positiveActivities = activities.filter(a => a.sentiment === 'Positive').length;
        const engagementQuality = {
            positiveSentimentRate: activities.length > 0
                ? ((positiveActivities / activities.length) * 100).toFixed(1)
                : 0,
            responseRate: activities.filter(a => a.direction === 'Outbound').length > 0
                ? ((activities.filter(a => a.responseReceived).length /
                    activities.filter(a => a.direction === 'Outbound').length) * 100).toFixed(1)
                : 0,
            averageResponseTime: (() => {
                const responseTimes = activities
                    .filter(a => a.responseTime)
                    .map(a => a.responseTime);
                return responseTimes.length > 0
                    ? (responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length).toFixed(1)
                    : 0;
            })()
        };

        // Compile final analytics
        const analytics = {
            activityVolume,
            relationshipHealth,
            eventROI,
            valueExchange,
            referralStats,
            opportunityConversion,
            engagementQuality,
            generatedAt: now
        };

        res.status(200).json({
            success: true,
            data: analytics
        });
    } catch (error) {
        console.error('Error fetching network analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch network analytics',
            error: error.message
        });
    }
};
