import mongoose from "mongoose";
import crypto from "crypto";

// ===== ACCOUNTABILITY PARTNERSHIP SCHEMA =====
// Represents a relationship between a job seeker and their accountability partner
const accountabilityPartnershipSchema = new mongoose.Schema(
    {
        // User who created the partnership (job seeker)
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        // The accountability partner (can be another user or external)
        partnerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        // Partner email for invitations
        partnerEmail: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        // Partner's name (for display when not registered)
        partnerName: {
            type: String,
            trim: true,
            maxlength: 100,
        },
        // Type of partner
        partnerType: {
            type: String,
            enum: ["mentor", "peer", "friend", "family", "coach", "colleague"],
            default: "peer",
        },
        // Partnership status
        status: {
            type: String,
            enum: ["pending", "active", "paused", "ended"],
            default: "pending",
        },
        // Invitation details
        invitationToken: {
            type: String,
            unique: true,
            sparse: true,
        },
        invitationMessage: {
            type: String,
            maxlength: 500,
            trim: true,
        },
        invitationExpiresAt: {
            type: Date,
            default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        },
        acceptedAt: {
            type: Date,
            default: null,
        },
        endedAt: {
            type: Date,
            default: null,
        },
        // Privacy settings - what data to share
        privacySettings: {
            shareGoals: { type: Boolean, default: true },
            shareApplicationProgress: { type: Boolean, default: true },
            shareInterviewSchedule: { type: Boolean, default: true },
            shareMilestones: { type: Boolean, default: true },
            shareWeeklyStats: { type: Boolean, default: true },
            shareSkillProgress: { type: Boolean, default: false },
            shareJobDetails: { type: Boolean, default: false },
            shareSalaryInfo: { type: Boolean, default: false },
            shareResumeUpdates: { type: Boolean, default: false },
        },
        // Check-in schedule
        checkInSchedule: {
            frequency: {
                type: String,
                enum: ["daily", "weekly", "biweekly", "monthly"],
                default: "weekly",
            },
            preferredDay: {
                type: String,
                enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
                default: "monday",
            },
            preferredTime: {
                type: String,
                default: "09:00",
            },
            lastCheckIn: {
                type: Date,
                default: null,
            },
            nextCheckIn: {
                type: Date,
                default: null,
            },
        },
        // Accountability goals - what they're accountable for
        accountabilityAreas: {
            type: [String],
            enum: [
                "applications_per_week",
                "networking_activities",
                "skill_development",
                "interview_prep",
                "resume_updates",
                "goal_completion",
                "daily_activities",
                "motivation_support",
            ],
            default: ["applications_per_week", "goal_completion"],
        },
        // Target metrics (customizable)
        targetMetrics: {
            applicationsPerWeek: { type: Number, default: 5 },
            networkingActivitiesPerWeek: { type: Number, default: 2 },
            hoursOfPrepPerWeek: { type: Number, default: 5 },
        },
        // Engagement tracking
        engagementStats: {
            totalCheckIns: { type: Number, default: 0 },
            lastEngagement: { type: Date, default: null },
            messagesExchanged: { type: Number, default: 0 },
            encouragementsSent: { type: Number, default: 0 },
            encouragementsReceived: { type: Number, default: 0 },
            milestonesAcknowledged: { type: Number, default: 0 },
            streakDays: { type: Number, default: 0 },
            longestStreak: { type: Number, default: 0 },
        },
        // Notification preferences
        notifications: {
            emailOnProgress: { type: Boolean, default: true },
            emailOnMilestone: { type: Boolean, default: true },
            emailOnCheckIn: { type: Boolean, default: true },
            pushNotifications: { type: Boolean, default: true },
        },
    },
    { timestamps: true }
);

// Indexes
accountabilityPartnershipSchema.index({ userId: 1, status: 1 });
accountabilityPartnershipSchema.index({ partnerId: 1, status: 1 });
accountabilityPartnershipSchema.index({ partnerEmail: 1, status: 1 });
accountabilityPartnershipSchema.index({ invitationToken: 1 }, { sparse: true });

// Generate invitation token before saving
accountabilityPartnershipSchema.pre("save", function (next) {
    if (this.isNew && this.status === "pending" && !this.invitationToken) {
        this.invitationToken = crypto.randomBytes(32).toString("hex");
    }
    next();
});

// ===== PROGRESS SHARE SCHEMA =====
// Represents a shared progress update with accountability partner(s)
const progressShareSchema = new mongoose.Schema(
    {
        // User sharing the progress
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        // Partnerships this is shared with (can be multiple)
        sharedWith: [{
            partnershipId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "AccountabilityPartnership",
            },
            viewedAt: {
                type: Date,
                default: null,
            },
            acknowledgedAt: {
                type: Date,
                default: null,
            },
        }],
        // Type of share
        shareType: {
            type: String,
            enum: ["progress_report", "milestone", "achievement", "check_in", "goal_update", "weekly_summary"],
            required: true,
        },
        // Report period for progress reports
        reportPeriod: {
            startDate: { type: Date },
            endDate: { type: Date },
            periodType: {
                type: String,
                enum: ["daily", "weekly", "biweekly", "monthly", "custom"],
            },
        },
        // Content of the share
        content: {
            title: {
                type: String,
                required: true,
                maxlength: 200,
            },
            summary: {
                type: String,
                maxlength: 2000,
            },
            details: {
                type: mongoose.Schema.Types.Mixed,
            },
        },
        // Progress metrics
        metrics: {
            jobsApplied: { type: Number, default: 0 },
            interviewsScheduled: { type: Number, default: 0 },
            interviewsCompleted: { type: Number, default: 0 },
            offersReceived: { type: Number, default: 0 },
            networkingActivities: { type: Number, default: 0 },
            goalsCompleted: { type: Number, default: 0 },
            goalsInProgress: { type: Number, default: 0 },
            skillsLearned: { type: Number, default: 0 },
            hoursSpentOnJobSearch: { type: Number, default: 0 },
        },
        // Goal progress updates
        goalProgress: [{
            goalId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Goal",
            },
            title: String,
            targetValue: Number,
            currentValue: Number,
            percentComplete: Number,
            status: {
                type: String,
                enum: ["not_started", "in_progress", "completed", "blocked"],
            },
        }],
        // Milestones achieved
        milestones: [{
            title: {
                type: String,
                required: true,
            },
            description: String,
            achievedAt: {
                type: Date,
                default: Date.now,
            },
            category: {
                type: String,
                enum: ["application", "interview", "offer", "skill", "goal", "networking", "other"],
            },
            significance: {
                type: String,
                enum: ["minor", "moderate", "major", "exceptional"],
                default: "moderate",
            },
        }],
        // Challenges and blockers
        challenges: [{
            description: String,
            status: {
                type: String,
                enum: ["active", "resolved", "ongoing"],
                default: "active",
            },
            helpNeeded: Boolean,
        }],
        // Next steps/commitments
        commitments: [{
            action: String,
            targetDate: Date,
            completed: { type: Boolean, default: false },
        }],
        // Mood/motivation indicator
        motivation: {
            level: {
                type: Number,
                min: 1,
                max: 5,
            },
            notes: String,
        },
        // Token for public/shared access
        shareToken: {
            type: String,
            unique: true,
            sparse: true,
        },
        // Access control
        accessControl: {
            isPublic: { type: Boolean, default: false },
            expiresAt: { type: Date },
            requiresAuth: { type: Boolean, default: true },
            password: { type: String }, // hashed if set
        },
        // Engagement on this share
        engagement: {
            views: { type: Number, default: 0 },
            encouragements: [{
                fromPartnerId: mongoose.Schema.Types.ObjectId,
                message: String,
                type: {
                    type: String,
                    enum: ["encouragement", "celebration", "support", "advice"],
                },
                createdAt: { type: Date, default: Date.now },
            }],
            comments: [{
                fromPartnerId: mongoose.Schema.Types.ObjectId,
                content: String,
                createdAt: { type: Date, default: Date.now },
            }],
        },
    },
    { timestamps: true }
);

// Indexes
progressShareSchema.index({ userId: 1, createdAt: -1 });
progressShareSchema.index({ "sharedWith.partnershipId": 1 });
progressShareSchema.index({ shareType: 1, createdAt: -1 });
progressShareSchema.index({ shareToken: 1 }, { sparse: true });

// Generate share token
progressShareSchema.pre("save", function (next) {
    if (this.isNew && !this.shareToken) {
        this.shareToken = crypto.randomBytes(24).toString("hex");
    }
    next();
});

// ===== ACHIEVEMENT SCHEMA =====
// Tracks achievements and celebrations
const achievementSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        // Achievement type
        type: {
            type: String,
            enum: [
                "first_application",
                "applications_milestone",
                "first_interview",
                "interviews_milestone",
                "first_offer",
                "goal_completed",
                "streak_milestone",
                "skill_mastery",
                "network_growth",
                "resume_complete",
                "profile_complete",
                "consistency_champion",
                "quick_response",
                "positive_feedback",
                "custom",
            ],
            required: true,
        },
        // Achievement title
        title: {
            type: String,
            required: true,
            maxlength: 100,
        },
        // Description
        description: {
            type: String,
            maxlength: 500,
        },
        // Badge/icon identifier
        badge: {
            icon: { type: String, default: "trophy" },
            color: { type: String, default: "gold" },
            tier: {
                type: String,
                enum: ["bronze", "silver", "gold", "platinum", "diamond"],
                default: "bronze",
            },
        },
        // Milestone thresholds that triggered this
        threshold: {
            metric: String,
            value: Number,
        },
        // When achieved
        achievedAt: {
            type: Date,
            default: Date.now,
        },
        // Celebration data
        celebration: {
            celebrated: { type: Boolean, default: false },
            celebratedAt: { type: Date },
            sharedWith: [{
                partnershipId: mongoose.Schema.Types.ObjectId,
                celebratedAt: Date,
            }],
            partnerAcknowledgements: [{
                partnerId: mongoose.Schema.Types.ObjectId,
                message: String,
                acknowledgedAt: Date,
            }],
        },
        // Points/XP for gamification
        points: {
            type: Number,
            default: 10,
        },
    },
    { timestamps: true }
);

// Indexes
achievementSchema.index({ userId: 1, type: 1 });
achievementSchema.index({ userId: 1, achievedAt: -1 });

// ===== ACCOUNTABILITY MESSAGE SCHEMA =====
// Messages between accountability partners
const accountabilityMessageSchema = new mongoose.Schema(
    {
        partnershipId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AccountabilityPartnership",
            required: true,
            index: true,
        },
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        recipientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        // Message content
        content: {
            type: String,
            required: true,
            maxlength: 2000,
            trim: true,
        },
        // Message type
        messageType: {
            type: String,
            enum: ["text", "encouragement", "celebration", "check_in", "milestone_acknowledgement", "support_request"],
            default: "text",
        },
        // Attachments (progress share references)
        attachments: [{
            type: {
                type: String,
                enum: ["progress_share", "achievement", "goal"],
            },
            referenceId: mongoose.Schema.Types.ObjectId,
        }],
        // Read status
        isRead: {
            type: Boolean,
            default: false,
        },
        readAt: {
            type: Date,
            default: null,
        },
        // Reactions
        reactions: [{
            emoji: String,
            userId: mongoose.Schema.Types.ObjectId,
            createdAt: { type: Date, default: Date.now },
        }],
    },
    { timestamps: true }
);

// Indexes
accountabilityMessageSchema.index({ partnershipId: 1, createdAt: -1 });
accountabilityMessageSchema.index({ recipientId: 1, isRead: 1 });

// ===== ACCOUNTABILITY INSIGHTS SCHEMA =====
// Analytics on accountability impact
const accountabilityInsightsSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true,
        },
        // Overall accountability score
        accountabilityScore: {
            current: { type: Number, default: 0, min: 0, max: 100 },
            trend: { type: String, enum: ["up", "down", "stable"], default: "stable" },
            history: [{
                score: Number,
                date: Date,
            }],
        },
        // Partner engagement summary
        partnerEngagement: {
            totalPartners: { type: Number, default: 0 },
            activePartners: { type: Number, default: 0 },
            averageEngagementRate: { type: Number, default: 0 },
            mostEngagedPartner: mongoose.Schema.Types.ObjectId,
        },
        // Impact metrics
        impactMetrics: {
            // Comparison: with vs without accountability
            withAccountability: {
                applicationsPerWeek: { type: Number, default: 0 },
                interviewsPerMonth: { type: Number, default: 0 },
                goalsCompletedPerMonth: { type: Number, default: 0 },
                consistencyScore: { type: Number, default: 0 },
            },
            beforeAccountability: {
                applicationsPerWeek: { type: Number, default: 0 },
                interviewsPerMonth: { type: Number, default: 0 },
                goalsCompletedPerMonth: { type: Number, default: 0 },
                consistencyScore: { type: Number, default: 0 },
            },
            improvement: {
                applicationsImprovement: { type: Number, default: 0 },
                interviewsImprovement: { type: Number, default: 0 },
                goalsImprovement: { type: Number, default: 0 },
                consistencyImprovement: { type: Number, default: 0 },
            },
        },
        // Streaks and consistency
        streaks: {
            currentStreak: { type: Number, default: 0 },
            longestStreak: { type: Number, default: 0 },
            checkInStreak: { type: Number, default: 0 },
            applicationStreak: { type: Number, default: 0 },
        },
        // Motivation patterns
        motivationPatterns: {
            averageMotivationLevel: { type: Number, default: 3 },
            motivationTrend: { type: String, enum: ["improving", "declining", "stable"], default: "stable" },
            peakMotivationDays: [String], // e.g., ["monday", "wednesday"]
            lowMotivationDays: [String],
        },
        // Success correlation
        successCorrelation: {
            partnerCheckInToSuccessRate: { type: Number, default: 0 },
            encouragementImpact: { type: Number, default: 0 },
            sharedGoalsCompletionRate: { type: Number, default: 0 },
        },
        // Last calculated
        lastCalculatedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

// Models
export const AccountabilityPartnership = mongoose.model(
    "AccountabilityPartnership",
    accountabilityPartnershipSchema
);

export const ProgressShare = mongoose.model(
    "ProgressShare",
    progressShareSchema
);

export const Achievement = mongoose.model(
    "Achievement",
    achievementSchema
);

export const AccountabilityMessage = mongoose.model(
    "AccountabilityMessage",
    accountabilityMessageSchema
);

export const AccountabilityInsights = mongoose.model(
    "AccountabilityInsights",
    accountabilityInsightsSchema
);
