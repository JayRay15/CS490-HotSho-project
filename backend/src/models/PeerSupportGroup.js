import mongoose from "mongoose";
import crypto from "crypto";

// ===== PEER SUPPORT GROUP SCHEMA =====
// Represents an industry or role-specific job search support group
const peerSupportGroupSchema = new mongoose.Schema(
    {
        // Group identification
        name: {
            type: String,
            required: [true, "Group name is required"],
            trim: true,
            maxlength: [200, "Group name cannot exceed 200 characters"],
        },
        slug: {
            type: String,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        description: {
            type: String,
            trim: true,
            maxlength: [2000, "Description cannot exceed 2000 characters"],
        },
        
        // Group categorization
        category: {
            type: String,
            enum: [
                "industry", // Industry-specific (tech, finance, healthcare, etc.)
                "role", // Role-specific (engineering, marketing, sales, etc.)
                "experience", // Experience level (entry, mid, senior, executive)
                "location", // Location-based (remote, specific cities)
                "specialty", // Specialty groups (career changers, returners, etc.)
            ],
            required: true,
        },
        
        // Industry/role tags for filtering
        tags: [{
            type: String,
            trim: true,
            lowercase: true,
        }],
        
        // Group type
        groupType: {
            type: String,
            enum: ["public", "private", "invite_only"],
            default: "public",
        },
        
        // Group creator/owner
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        
        // Group moderators
        moderators: [{
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
            addedAt: {
                type: Date,
                default: Date.now,
            },
            addedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        }],
        
        // Group settings
        settings: {
            // Privacy settings
            allowAnonymousPosts: { type: Boolean, default: true },
            requireApproval: { type: Boolean, default: false },
            allowMemberInvites: { type: Boolean, default: true },
            
            // Content settings
            enableDiscussions: { type: Boolean, default: true },
            enableChallenges: { type: Boolean, default: true },
            enableSuccessStories: { type: Boolean, default: true },
            enableReferralSharing: { type: Boolean, default: true },
            enableWebinars: { type: Boolean, default: true },
            enableOpportunityAlerts: { type: Boolean, default: true },
            
            // Notification settings
            notifyNewMembers: { type: Boolean, default: true },
            notifyNewPosts: { type: Boolean, default: true },
            notifyNewChallenges: { type: Boolean, default: true },
            notifyNewOpportunities: { type: Boolean, default: true },
        },
        
        // Group statistics
        stats: {
            totalMembers: { type: Number, default: 0 },
            activeMembers: { type: Number, default: 0 },
            totalDiscussions: { type: Number, default: 0 },
            totalChallenges: { type: Number, default: 0 },
            totalSuccessStories: { type: Number, default: 0 },
            totalReferrals: { type: Number, default: 0 },
            totalWebinars: { type: Number, default: 0 },
            averageEngagement: { type: Number, default: 0 },
        },
        
        // Featured content
        featuredContent: {
            pinnedDiscussionId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "PeerDiscussion",
            },
            featuredSuccessStoryId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "PeerSuccessStory",
            },
            activeChallengeId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "PeerChallenge",
            },
        },
        
        // Invite code for private groups
        inviteCode: {
            type: String,
            unique: true,
            sparse: true,
        },
        inviteCodeExpiresAt: {
            type: Date,
        },
        
        // Group status
        status: {
            type: String,
            enum: ["active", "archived", "suspended"],
            default: "active",
        },
        
        // Cover image
        coverImage: {
            url: String,
            publicId: String,
        },
        
        // Group guidelines
        guidelines: {
            type: String,
            maxlength: [5000, "Guidelines cannot exceed 5000 characters"],
        },
    },
    {
        timestamps: true,
    }
);

// Generate slug from name
peerSupportGroupSchema.pre("save", function (next) {
    if (this.isNew || this.isModified("name")) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "") + "-" + crypto.randomBytes(4).toString("hex");
    }
    next();
});

// Generate invite code
peerSupportGroupSchema.methods.generateInviteCode = function () {
    this.inviteCode = crypto.randomBytes(8).toString("hex");
    this.inviteCodeExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    return this.inviteCode;
};

// ===== GROUP MEMBERSHIP SCHEMA =====
const groupMembershipSchema = new mongoose.Schema(
    {
        groupId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PeerSupportGroup",
            required: true,
            index: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        
        // Member role
        role: {
            type: String,
            enum: ["member", "moderator", "admin", "owner"],
            default: "member",
        },
        
        // Member status
        status: {
            type: String,
            enum: ["pending", "active", "suspended", "left"],
            default: "active",
        },
        
        // Privacy settings for this group
        privacySettings: {
            showProfile: { type: Boolean, default: true },
            allowDirectMessages: { type: Boolean, default: true },
            shareJobSearchStatus: { type: Boolean, default: true },
            shareProgress: { type: Boolean, default: true },
            anonymousMode: { type: Boolean, default: false }, // Post anonymously by default
        },
        
        // Notification preferences
        notifications: {
            newDiscussions: { type: Boolean, default: true },
            replies: { type: Boolean, default: true },
            mentions: { type: Boolean, default: true },
            challenges: { type: Boolean, default: true },
            opportunities: { type: Boolean, default: true },
            webinars: { type: Boolean, default: true },
            digest: {
                enabled: { type: Boolean, default: true },
                frequency: { type: String, enum: ["daily", "weekly"], default: "weekly" },
            },
        },
        
        // Engagement tracking
        engagement: {
            discussionsStarted: { type: Number, default: 0 },
            repliesPosted: { type: Number, default: 0 },
            likesGiven: { type: Number, default: 0 },
            likesReceived: { type: Number, default: 0 },
            challengesJoined: { type: Number, default: 0 },
            challengesCompleted: { type: Number, default: 0 },
            referralsShared: { type: Number, default: 0 },
            webinarsAttended: { type: Number, default: 0 },
            lastActiveAt: { type: Date, default: Date.now },
        },
        
        // Impact tracking
        impactMetrics: {
            connectionsFromGroup: { type: Number, default: 0 },
            referralsReceived: { type: Number, default: 0 },
            interviewsFromReferrals: { type: Number, default: 0 },
            offersFromGroup: { type: Number, default: 0 },
            helpfulInsightsShared: { type: Number, default: 0 },
        },
        
        // Join information
        joinedVia: {
            type: String,
            enum: ["direct", "invite", "referral", "search"],
            default: "direct",
        },
        referredBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        inviteCode: String,
        
        approvedAt: Date,
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for unique membership
groupMembershipSchema.index({ groupId: 1, userId: 1 }, { unique: true });

// ===== PEER DISCUSSION SCHEMA =====
const peerDiscussionSchema = new mongoose.Schema(
    {
        groupId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PeerSupportGroup",
            required: true,
            index: true,
        },
        authorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        
        // Content
        title: {
            type: String,
            required: [true, "Discussion title is required"],
            trim: true,
            maxlength: [300, "Title cannot exceed 300 characters"],
        },
        content: {
            type: String,
            required: [true, "Discussion content is required"],
            maxlength: [10000, "Content cannot exceed 10000 characters"],
        },
        
        // Discussion type
        discussionType: {
            type: String,
            enum: [
                "question", // Asking for advice
                "insight", // Sharing insights/strategies
                "experience", // Sharing experience
                "resource", // Sharing resources
                "celebration", // Celebrating wins
                "support", // Seeking support
                "general", // General discussion
            ],
            default: "general",
        },
        
        // Tags for categorization
        tags: [{
            type: String,
            trim: true,
            lowercase: true,
        }],
        
        // Anonymous posting
        isAnonymous: {
            type: Boolean,
            default: false,
        },
        anonymousName: {
            type: String,
            default: "Anonymous Member",
        },
        
        // Engagement
        likes: [{
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
            createdAt: {
                type: Date,
                default: Date.now,
            },
        }],
        
        // Stats
        stats: {
            likeCount: { type: Number, default: 0 },
            replyCount: { type: Number, default: 0 },
            viewCount: { type: Number, default: 0 },
            bookmarkCount: { type: Number, default: 0 },
        },
        
        // Status
        isPinned: { type: Boolean, default: false },
        isLocked: { type: Boolean, default: false },
        status: {
            type: String,
            enum: ["active", "hidden", "deleted"],
            default: "active",
        },
        
        // Moderation
        reportCount: { type: Number, default: 0 },
        moderationNotes: String,
    },
    {
        timestamps: true,
    }
);

// ===== DISCUSSION REPLY SCHEMA =====
const discussionReplySchema = new mongoose.Schema(
    {
        discussionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PeerDiscussion",
            required: true,
            index: true,
        },
        authorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        parentReplyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "DiscussionReply",
            default: null,
        },
        
        content: {
            type: String,
            required: [true, "Reply content is required"],
            maxlength: [5000, "Reply cannot exceed 5000 characters"],
        },
        
        isAnonymous: {
            type: Boolean,
            default: false,
        },
        anonymousName: {
            type: String,
            default: "Anonymous Member",
        },
        
        likes: [{
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
            createdAt: {
                type: Date,
                default: Date.now,
            },
        }],
        
        likeCount: { type: Number, default: 0 },
        
        isAcceptedAnswer: { type: Boolean, default: false },
        
        status: {
            type: String,
            enum: ["active", "hidden", "deleted"],
            default: "active",
        },
    },
    {
        timestamps: true,
    }
);

// ===== PEER CHALLENGE SCHEMA =====
const peerChallengeSchema = new mongoose.Schema(
    {
        groupId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PeerSupportGroup",
            required: true,
            index: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        
        // Challenge details
        title: {
            type: String,
            required: [true, "Challenge title is required"],
            trim: true,
            maxlength: [200, "Title cannot exceed 200 characters"],
        },
        description: {
            type: String,
            required: true,
            maxlength: [3000, "Description cannot exceed 3000 characters"],
        },
        
        // Challenge type
        challengeType: {
            type: String,
            enum: [
                "application_sprint", // Apply to X jobs in Y days
                "networking", // Connect with X people
                "skill_building", // Complete X courses/certifications
                "interview_prep", // Practice X mock interviews
                "outreach", // Send X cold messages
                "content_creation", // Create X posts/articles
                "accountability", // Daily check-ins
                "custom",
            ],
            required: true,
        },
        
        // Goals and metrics
        goals: {
            targetValue: { type: Number, required: true },
            metric: { type: String, required: true }, // "applications", "connections", etc.
            timeframe: { type: Number, required: true }, // in days
        },
        
        // Schedule
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            required: true,
        },
        
        // Participants
        participants: [{
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
            joinedAt: {
                type: Date,
                default: Date.now,
            },
            progress: {
                currentValue: { type: Number, default: 0 },
                percentComplete: { type: Number, default: 0 },
                lastUpdated: Date,
            },
            status: {
                type: String,
                enum: ["active", "completed", "dropped"],
                default: "active",
            },
            completedAt: Date,
        }],
        
        // Stats
        stats: {
            totalParticipants: { type: Number, default: 0 },
            activeParticipants: { type: Number, default: 0 },
            completedParticipants: { type: Number, default: 0 },
            averageProgress: { type: Number, default: 0 },
        },
        
        // Rewards/recognition
        rewards: {
            badge: {
                name: String,
                icon: String,
                color: String,
            },
            points: { type: Number, default: 0 },
        },
        
        // Status
        status: {
            type: String,
            enum: ["upcoming", "active", "completed", "cancelled"],
            default: "upcoming",
        },
        
        // Featured
        isFeatured: { type: Boolean, default: false },
    },
    {
        timestamps: true,
    }
);

// ===== PEER SUCCESS STORY SCHEMA =====
const peerSuccessStorySchema = new mongoose.Schema(
    {
        groupId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PeerSupportGroup",
            required: true,
            index: true,
        },
        authorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        
        // Story content
        title: {
            type: String,
            required: [true, "Story title is required"],
            trim: true,
            maxlength: [200, "Title cannot exceed 200 characters"],
        },
        summary: {
            type: String,
            required: true,
            maxlength: [500, "Summary cannot exceed 500 characters"],
        },
        fullStory: {
            type: String,
            required: true,
            maxlength: [10000, "Story cannot exceed 10000 characters"],
        },
        
        // Story type
        storyType: {
            type: String,
            enum: [
                "job_offer", // Got a job offer
                "career_change", // Successful career change
                "promotion", // Got promoted
                "interview_success", // Aced an interview
                "networking_win", // Networking led to opportunity
                "skill_growth", // Learned new skill that helped
                "rejection_recovery", // Bounced back from rejection
                "other",
            ],
            required: true,
        },
        
        // Key learnings
        keyLearnings: [{
            type: String,
            maxlength: 500,
        }],
        
        // Tips for others
        tipsForOthers: [{
            type: String,
            maxlength: 500,
        }],
        
        // Anonymous posting
        isAnonymous: {
            type: Boolean,
            default: false,
        },
        
        // Career details (optional, for context)
        careerContext: {
            previousRole: String,
            newRole: String,
            industry: String,
            jobSearchDuration: String, // "3 months", "6 months", etc.
            applicationsSubmitted: Number,
            interviewsAttended: Number,
        },
        
        // Engagement
        likes: [{
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
            createdAt: {
                type: Date,
                default: Date.now,
            },
        }],
        
        comments: [{
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
            content: {
                type: String,
                maxlength: 1000,
            },
            isAnonymous: { type: Boolean, default: false },
            createdAt: {
                type: Date,
                default: Date.now,
            },
        }],
        
        stats: {
            likeCount: { type: Number, default: 0 },
            commentCount: { type: Number, default: 0 },
            viewCount: { type: Number, default: 0 },
            shareCount: { type: Number, default: 0 },
        },
        
        // Status
        isFeatured: { type: Boolean, default: false },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected", "hidden"],
            default: "approved",
        },
        
        // Approval
        approvedAt: Date,
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
    }
);

// ===== PEER REFERRAL SCHEMA =====
const peerReferralSchema = new mongoose.Schema(
    {
        groupId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PeerSupportGroup",
            required: true,
            index: true,
        },
        sharedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        
        // Opportunity details
        title: {
            type: String,
            required: [true, "Opportunity title is required"],
            trim: true,
            maxlength: [200, "Title cannot exceed 200 characters"],
        },
        company: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            maxlength: [3000, "Description cannot exceed 3000 characters"],
        },
        
        // Opportunity type
        opportunityType: {
            type: String,
            enum: [
                "job_opening", // Direct job opening
                "referral", // User can refer
                "internal_posting", // Internal company posting
                "freelance", // Freelance/contract work
                "internship",
                "mentorship",
                "networking",
            ],
            required: true,
        },
        
        // Job details
        jobDetails: {
            location: String,
            locationType: {
                type: String,
                enum: ["remote", "hybrid", "onsite"],
            },
            salaryRange: {
                min: Number,
                max: Number,
                currency: { type: String, default: "USD" },
            },
            experienceLevel: {
                type: String,
                enum: ["entry", "mid", "senior", "lead", "executive"],
            },
            skills: [String],
        },
        
        // Application info
        applicationInfo: {
            url: String,
            deadline: Date,
            contactEmail: String,
            referralCode: String,
            instructions: String,
        },
        
        // Referral capacity
        canRefer: { type: Boolean, default: false },
        referralSlots: {
            total: { type: Number, default: 0 },
            used: { type: Number, default: 0 },
        },
        
        // Interested users
        interestedUsers: [{
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
            requestedAt: Date,
            status: {
                type: String,
                enum: ["interested", "referred", "applied", "interviewing", "hired", "rejected"],
                default: "interested",
            },
            notes: String,
            updatedAt: Date,
        }],
        
        // Stats
        stats: {
            viewCount: { type: Number, default: 0 },
            interestCount: { type: Number, default: 0 },
            referralCount: { type: Number, default: 0 },
            applicationCount: { type: Number, default: 0 },
            hireCount: { type: Number, default: 0 },
        },
        
        // Status
        status: {
            type: String,
            enum: ["active", "filled", "expired", "closed"],
            default: "active",
        },
        expiresAt: Date,
    },
    {
        timestamps: true,
    }
);

// ===== PEER WEBINAR/COACHING SESSION SCHEMA =====
const peerWebinarSchema = new mongoose.Schema(
    {
        groupId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PeerSupportGroup",
            required: true,
            index: true,
        },
        hostId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        
        // Session details
        title: {
            type: String,
            required: [true, "Webinar title is required"],
            trim: true,
            maxlength: [200, "Title cannot exceed 200 characters"],
        },
        description: {
            type: String,
            required: true,
            maxlength: [3000, "Description cannot exceed 3000 characters"],
        },
        
        // Session type
        sessionType: {
            type: String,
            enum: [
                "webinar", // One-to-many presentation
                "workshop", // Interactive workshop
                "group_coaching", // Group coaching session
                "ama", // Ask Me Anything
                "panel", // Panel discussion
                "networking", // Networking event
                "study_group", // Study/practice group
            ],
            required: true,
        },
        
        // Topic/category
        topic: {
            type: String,
            enum: [
                "resume_review",
                "interview_prep",
                "salary_negotiation",
                "networking",
                "personal_branding",
                "job_search_strategy",
                "industry_insights",
                "skill_development",
                "career_transition",
                "mental_health",
                "other",
            ],
            required: true,
        },
        
        // Schedule
        scheduledAt: {
            type: Date,
            required: true,
        },
        duration: {
            type: Number, // in minutes
            required: true,
            default: 60,
        },
        timezone: {
            type: String,
            default: "America/New_York",
        },
        
        // Meeting details
        meetingInfo: {
            platform: {
                type: String,
                enum: ["zoom", "google_meet", "teams", "other"],
            },
            link: String,
            meetingId: String,
            passcode: String,
            instructions: String,
        },
        
        // Capacity
        capacity: {
            max: { type: Number, default: 100 },
            current: { type: Number, default: 0 },
        },
        
        // Registrations
        registrations: [{
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
            registeredAt: {
                type: Date,
                default: Date.now,
            },
            attended: { type: Boolean, default: false },
            feedback: {
                rating: { type: Number, min: 1, max: 5 },
                comment: String,
                submittedAt: Date,
            },
        }],
        
        // Co-hosts/panelists
        coHosts: [{
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
            role: {
                type: String,
                enum: ["co_host", "panelist", "moderator", "speaker"],
            },
        }],
        
        // Recording
        recording: {
            available: { type: Boolean, default: false },
            url: String,
            uploadedAt: Date,
        },
        
        // Resources/materials
        resources: [{
            title: String,
            type: { type: String, enum: ["document", "link", "video", "other"] },
            url: String,
            uploadedAt: Date,
        }],
        
        // Stats
        stats: {
            registrationCount: { type: Number, default: 0 },
            attendeeCount: { type: Number, default: 0 },
            averageRating: { type: Number, default: 0 },
            feedbackCount: { type: Number, default: 0 },
        },
        
        // Status
        status: {
            type: String,
            enum: ["scheduled", "live", "completed", "cancelled"],
            default: "scheduled",
        },
        
        // Recurring
        isRecurring: { type: Boolean, default: false },
        recurrence: {
            frequency: { type: String, enum: ["daily", "weekly", "biweekly", "monthly"] },
            endDate: Date,
            parentWebinarId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "PeerWebinar",
            },
        },
    },
    {
        timestamps: true,
    }
);

// ===== OPPORTUNITY ALERT SCHEMA =====
const opportunityAlertSchema = new mongoose.Schema(
    {
        groupId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PeerSupportGroup",
            required: true,
            index: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        
        // Alert details
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
        },
        
        // Alert type
        alertType: {
            type: String,
            enum: [
                "job_opening",
                "company_hiring",
                "event",
                "deadline",
                "news",
                "resource",
            ],
            required: true,
        },
        
        // Priority
        priority: {
            type: String,
            enum: ["low", "medium", "high", "urgent"],
            default: "medium",
        },
        
        // Link
        link: String,
        
        // Expiry
        expiresAt: Date,
        
        // Status
        status: {
            type: String,
            enum: ["active", "expired", "archived"],
            default: "active",
        },
    },
    {
        timestamps: true,
    }
);

// ===== PEER NETWORKING IMPACT SCHEMA =====
const peerNetworkingImpactSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        
        // Overall stats across all groups
        overallStats: {
            groupsJoined: { type: Number, default: 0 },
            activeGroups: { type: Number, default: 0 },
            totalConnections: { type: Number, default: 0 },
            discussionsParticipated: { type: Number, default: 0 },
            challengesCompleted: { type: Number, default: 0 },
            webinarsAttended: { type: Number, default: 0 },
        },
        
        // Impact metrics
        impactMetrics: {
            referralsReceived: { type: Number, default: 0 },
            referralsGiven: { type: Number, default: 0 },
            interviewsFromReferrals: { type: Number, default: 0 },
            offersFromNetworking: { type: Number, default: 0 },
            insightsShared: { type: Number, default: 0 },
            insightsReceived: { type: Number, default: 0 },
            helpScore: { type: Number, default: 0 }, // How helpful to others
        },
        
        // Engagement score
        engagementScore: {
            current: { type: Number, default: 0 },
            trend: { type: String, enum: ["up", "down", "stable"], default: "stable" },
            history: [{
                date: Date,
                score: Number,
            }],
        },
        
        // Badges earned
        badges: [{
            name: String,
            description: String,
            icon: String,
            earnedAt: Date,
            groupId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "PeerSupportGroup",
            },
        }],
        
        // Monthly summaries
        monthlySummaries: [{
            month: Date,
            stats: {
                newConnections: Number,
                discussionsStarted: Number,
                repliesPosted: Number,
                challengesJoined: Number,
                webinarsAttended: Number,
                referralsShared: Number,
            },
        }],
        
        lastCalculatedAt: Date,
    },
    {
        timestamps: true,
    }
);

// Create and export models
export const PeerSupportGroup = mongoose.model("PeerSupportGroup", peerSupportGroupSchema);
export const GroupMembership = mongoose.model("GroupMembership", groupMembershipSchema);
export const PeerDiscussion = mongoose.model("PeerDiscussion", peerDiscussionSchema);
export const DiscussionReply = mongoose.model("DiscussionReply", discussionReplySchema);
export const PeerChallenge = mongoose.model("PeerChallenge", peerChallengeSchema);
export const PeerSuccessStory = mongoose.model("PeerSuccessStory", peerSuccessStorySchema);
export const PeerReferral = mongoose.model("PeerReferral", peerReferralSchema);
export const PeerWebinar = mongoose.model("PeerWebinar", peerWebinarSchema);
export const OpportunityAlert = mongoose.model("OpportunityAlert", opportunityAlertSchema);
export const PeerNetworkingImpact = mongoose.model("PeerNetworkingImpact", peerNetworkingImpactSchema);
