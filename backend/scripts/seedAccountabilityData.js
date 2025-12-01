/**
 * Seed script for UC-111: Progress Sharing & Accountability Feature
 * 
 * This script creates test data for:
 * - Accountability partnerships
 * - Progress shares
 * - Achievements
 * - Messages
 * - Insights
 * 
 * Usage: node scripts/seedAccountabilityData.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env from backend root
dotenv.config({ path: join(__dirname, '..', '.env') });

// If that didn't work, try src location
if (!process.env.MONGODB_URI) {
    dotenv.config({ path: join(__dirname, '..', 'src', '.env') });
}

// If still not found, try loading from current working directory
if (!process.env.MONGODB_URI) {
    dotenv.config();
}

import { User } from '../src/models/User.js';
import {
    AccountabilityPartnership,
    ProgressShare,
    Achievement,
    AccountabilityMessage,
    AccountabilityInsights
} from '../src/models/AccountabilityPartner.js';

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

async function seedAccountabilityData() {
    try {
        if (!MONGODB_URI) {
            console.error('❌ MongoDB URI not found in environment variables!');
            console.log('   Make sure MONGODB_URI or MONGO_URI is set in your .env file');
            process.exit(1);
        }
        
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find existing users
        const users = await User.find().limit(5);
        
        if (users.length < 2) {
            console.log('❌ Need at least 2 users in the database. Please register some users first.');
            process.exit(1);
        }

        console.log(`📋 Found ${users.length} users to work with`);
        
        const primaryUser = users[0];
        const partnerUser = users[1];
        const thirdUser = users[2] || users[1];

        console.log(`\n👤 Primary User: ${primaryUser.name} (${primaryUser.email})`);
        console.log(`👥 Partner User: ${partnerUser.name} (${partnerUser.email})`);

        // Clear existing accountability data for these users
        console.log('\n🧹 Clearing existing accountability data...');
        await AccountabilityPartnership.deleteMany({
            $or: [
                { userId: primaryUser._id },
                { partnerId: primaryUser._id }
            ]
        });
        await ProgressShare.deleteMany({ userId: primaryUser._id });
        await Achievement.deleteMany({ userId: primaryUser._id });
        await AccountabilityMessage.deleteMany({
            $or: [
                { senderId: primaryUser._id },
                { receiverId: primaryUser._id }
            ]
        });
        await AccountabilityInsights.deleteMany({ userId: primaryUser._id });

        // Create Accountability Partnership
        console.log('\n🤝 Creating accountability partnership...');
        const partnership = await AccountabilityPartnership.create({
            userId: primaryUser._id,
            partnerId: partnerUser._id,
            partnerEmail: partnerUser.email,
            partnerName: partnerUser.name,
            partnerType: 'peer',
            status: 'active',
            privacySettings: {
                shareApplicationCount: true,
                shareInterviewCount: true,
                shareCompanyNames: false,
                shareJobTitles: true,
                shareSalaryInfo: false,
                shareGoals: true,
                shareMilestones: true
            },
            checkInSchedule: {
                frequency: 'weekly',
                preferredDay: 'monday',
                preferredTime: '09:00',
                reminderEnabled: true
            },
            engagementStats: {
                totalCheckIns: 12,
                currentStreak: 5,
                longestStreak: 8,
                lastCheckIn: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
                messagesExchanged: 25,
                encouragementsSent: 8,
                encouragementsReceived: 6
            },
            invitationMessage: "Let's keep each other accountable during our job search!",
            acceptedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
        });
        console.log(`✅ Created partnership: ${partnership._id}`);

        // Create a pending partnership invitation
        if (thirdUser._id.toString() !== partnerUser._id.toString()) {
            console.log('\n📨 Creating pending partnership invitation...');
            const pendingPartnership = await AccountabilityPartnership.create({
                userId: thirdUser._id,
                partnerId: primaryUser._id,
                partnerEmail: primaryUser.email,
                partnerName: primaryUser.name,
                partnerType: 'mentor',
                status: 'pending',
                privacySettings: {
                    shareApplicationCount: true,
                    shareInterviewCount: true,
                    shareCompanyNames: true,
                    shareJobTitles: true,
                    shareSalaryInfo: false,
                    shareGoals: true,
                    shareMilestones: true
                },
                invitationMessage: "I'd love to mentor you on your job search journey!"
            });
            console.log(`✅ Created pending invitation: ${pendingPartnership._id}`);
        }

        // Create Progress Shares
        console.log('\n📊 Creating progress shares...');
        const progressShares = await ProgressShare.insertMany([
            {
                userId: primaryUser._id,
                sharedWith: [{
                    partnershipId: partnership._id,
                    viewedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                    acknowledgedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
                }],
                shareType: 'weekly_summary',
                reportPeriod: {
                    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                    endDate: new Date(),
                    periodType: 'weekly'
                },
                content: {
                    title: 'Weekly Progress Report - Week ' + getWeekNumber(new Date()),
                    summary: 'Great progress this week! Sent 25 applications and scheduled 5 interviews.',
                    details: {
                        highlights: ['First offer received!', 'Completed 3 technical interviews'],
                        challenges: ['Waiting to hear back from 3 companies'],
                        nextWeekGoals: ['Follow up on pending applications', 'Prepare for final round interviews']
                    }
                },
                metrics: {
                    jobsApplied: 25,
                    interviewsScheduled: 5,
                    interviewsCompleted: 3,
                    offersReceived: 1,
                    networkingActivities: 15,
                    goalsCompleted: 3,
                    goalsInProgress: 2,
                    skillsLearned: 3,
                    hoursSpentOnJobSearch: 20
                },
                milestones: [
                    {
                        title: 'First Offer Received',
                        description: 'Got my first job offer!',
                        achievedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                        celebrated: true,
                        celebratedBy: [partnerUser._id]
                    }
                ],
                mood: 'excited',
                reflections: 'Feeling great about the progress. The accountability partnership really helped me stay on track!'
            },
            {
                userId: primaryUser._id,
                sharedWith: [{
                    partnershipId: partnership._id,
                    viewedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                    acknowledgedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
                }],
                shareType: 'progress_report',
                reportPeriod: {
                    startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
                    endDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                    periodType: 'weekly'
                },
                content: {
                    title: 'Weekly Progress Report - Week ' + (getWeekNumber(new Date()) - 1),
                    summary: 'Good week for applications. Building momentum!',
                    details: {
                        highlights: ['Hit my weekly application goal', 'Got 2 interview requests'],
                        challenges: ['Need to improve resume for senior roles'],
                        nextWeekGoals: ['Apply to 10 more jobs', 'Practice system design']
                    }
                },
                metrics: {
                    jobsApplied: 18,
                    interviewsScheduled: 3,
                    interviewsCompleted: 2,
                    offersReceived: 0,
                    networkingActivities: 10,
                    goalsCompleted: 2,
                    goalsInProgress: 3,
                    skillsLearned: 1,
                    hoursSpentOnJobSearch: 15
                },
                milestones: [
                    {
                        title: 'Applied to 10+ Jobs',
                        description: 'Hit my first application milestone!',
                        achievedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
                        celebrated: true,
                        celebratedBy: [partnerUser._id]
                    }
                ],
                mood: 'motivated'
            }
        ]);
        console.log(`✅ Created ${progressShares.length} progress shares`);

        // Create Achievements
        console.log('\n🏆 Creating achievements...');
        const achievements = await Achievement.insertMany([
            {
                userId: primaryUser._id,
                type: 'first_application',
                title: 'First Steps',
                description: 'Submitted your first job application',
                badge: {
                    icon: 'rocket',
                    color: 'blue',
                    tier: 'bronze'
                },
                threshold: { metric: 'applications', value: 1 },
                achievedAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
                celebration: {
                    celebrated: true,
                    celebratedAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
                    sharedWith: [{ partnershipId: partnership._id, celebratedAt: new Date(Date.now() - 27 * 24 * 60 * 60 * 1000) }],
                    partnerAcknowledgements: [{ partnerId: partnerUser._id, message: 'Great start!', acknowledgedAt: new Date(Date.now() - 27 * 24 * 60 * 60 * 1000) }]
                },
                points: 10
            },
            {
                userId: primaryUser._id,
                type: 'streak_milestone',
                title: 'On Fire!',
                description: 'Maintained a 5-day application streak',
                badge: {
                    icon: 'flame',
                    color: 'orange',
                    tier: 'silver'
                },
                threshold: { metric: 'streak_days', value: 5 },
                achievedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
                celebration: {
                    celebrated: true,
                    celebratedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
                    sharedWith: [{ partnershipId: partnership._id, celebratedAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000) }],
                    partnerAcknowledgements: [{ partnerId: partnerUser._id, message: 'Keep it up!', acknowledgedAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000) }]
                },
                points: 25
            },
            {
                userId: primaryUser._id,
                type: 'first_interview',
                title: 'Interview Ready',
                description: 'Completed your first technical interview',
                badge: {
                    icon: 'microphone',
                    color: 'purple',
                    tier: 'silver'
                },
                threshold: { metric: 'interviews', value: 1 },
                achievedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
                celebration: { celebrated: false },
                points: 30
            },
            {
                userId: primaryUser._id,
                type: 'first_offer',
                title: 'First Offer!',
                description: 'Received your first job offer',
                badge: {
                    icon: 'trophy',
                    color: 'gold',
                    tier: 'gold'
                },
                threshold: { metric: 'offers', value: 1 },
                achievedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                celebration: {
                    celebrated: true,
                    celebratedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                    sharedWith: [{ partnershipId: partnership._id, celebratedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) }],
                    partnerAcknowledgements: [{ partnerId: partnerUser._id, message: 'Amazing work! So proud!', acknowledgedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) }]
                },
                points: 100
            },
            {
                userId: primaryUser._id,
                type: 'network_growth',
                title: 'Consistent Networker',
                description: 'Connected with 15+ professionals',
                badge: {
                    icon: 'users',
                    color: 'teal',
                    tier: 'silver'
                },
                threshold: { metric: 'connections', value: 15 },
                achievedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                celebration: { celebrated: false },
                points: 40
            },
            {
                userId: primaryUser._id,
                type: 'consistency_champion',
                title: 'Team Player',
                description: 'Sent 5+ encouragements to partners',
                badge: {
                    icon: 'heart',
                    color: 'pink',
                    tier: 'bronze'
                },
                threshold: { metric: 'encouragements_sent', value: 5 },
                achievedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                celebration: { celebrated: false },
                points: 20
            }
        ]);
        console.log(`✅ Created ${achievements.length} achievements`);

        // Create Messages
        console.log('\n💬 Creating messages...');
        const messages = await AccountabilityMessage.insertMany([
            {
                partnershipId: partnership._id,
                senderId: partnerUser._id,
                recipientId: primaryUser._id,
                messageType: 'encouragement',
                content: "You're doing amazing! Keep up the great work! 💪",
                isRead: true,
                readAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
                createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
            },
            {
                partnershipId: partnership._id,
                senderId: primaryUser._id,
                recipientId: partnerUser._id,
                messageType: 'check_in',
                content: "Just finished my weekly applications. How's your search going?",
                isRead: true,
                readAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
            },
            {
                partnershipId: partnership._id,
                senderId: partnerUser._id,
                recipientId: primaryUser._id,
                messageType: 'celebration',
                content: "Congratulations on the offer! 🎉🎊 So proud of you!",
                isRead: true,
                readAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
                createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
            },
            {
                partnershipId: partnership._id,
                senderId: primaryUser._id,
                recipientId: partnerUser._id,
                messageType: 'text',
                content: "I found that tailoring my resume for each application really helped. Try it!",
                isRead: false,
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
            },
            {
                partnershipId: partnership._id,
                senderId: partnerUser._id,
                recipientId: primaryUser._id,
                messageType: 'encouragement',
                content: "Monday motivation: You've got this! Another great week ahead! 🚀",
                isRead: false,
                createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
            }
        ]);
        console.log(`✅ Created ${messages.length} messages`);

        // Create Insights
        console.log('\n📈 Creating accountability insights...');
        const insights = await AccountabilityInsights.create({
            userId: primaryUser._id,
            accountabilityScore: {
                current: 85,
                trend: 'up',
                history: [
                    { score: 70, date: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000) },
                    { score: 75, date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000) },
                    { score: 80, date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
                    { score: 83, date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
                    { score: 85, date: new Date() }
                ]
            },
            partnerEngagement: {
                totalPartners: 1,
                activePartners: 1,
                averageEngagementRate: 0.92,
                mostEngagedPartner: partnerUser._id
            },
            impactMetrics: {
                withAccountability: {
                    applicationsPerWeek: 12,
                    interviewsPerMonth: 5,
                    goalsCompletedPerMonth: 4,
                    consistencyScore: 85
                },
                beforeAccountability: {
                    applicationsPerWeek: 6,
                    interviewsPerMonth: 2,
                    goalsCompletedPerMonth: 2,
                    consistencyScore: 50
                },
                improvement: {
                    applicationsImprovement: 100,
                    interviewsImprovement: 150,
                    goalsImprovement: 100,
                    consistencyImprovement: 70
                }
            },
            streaks: {
                currentStreak: 5,
                longestStreak: 8,
                checkInStreak: 12,
                applicationStreak: 5
            },
            motivationPatterns: {
                averageMotivationLevel: 4,
                motivationTrend: 'improving',
                peakMotivationDays: ['monday', 'wednesday', 'friday'],
                lowMotivationDays: ['sunday']
            },
            successCorrelation: {
                partnerCheckInToSuccessRate: 0.85,
                encouragementImpact: 0.72,
                sharedGoalsCompletionRate: 0.78
            },
            lastCalculatedAt: new Date()
        });
        console.log(`✅ Created insights: ${insights._id}`);

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('✅ SEED DATA CREATED SUCCESSFULLY!');
        console.log('='.repeat(60));
        console.log(`
📊 Summary:
   - 1 Active Partnership (${primaryUser.name} ↔ ${partnerUser.name})
   - 1 Pending Invitation
   - ${progressShares.length} Progress Shares
   - ${achievements.length} Achievements
   - ${messages.length} Messages
   - 1 Insights Record

🔑 To test, log in as: ${primaryUser.email}
   Then navigate to Teams → Select a team → Progress Sharing tab

💡 The primary user (${primaryUser.name}) has:
   - 5-day streak
   - 25 applications sent
   - 5 interviews scheduled
   - 1 offer received
   - 6 achievements earned
`);

        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding data:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

// Helper function to get week number
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

seedAccountabilityData();
