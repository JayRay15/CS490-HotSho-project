import mongoose from "mongoose";
import crypto from "crypto";

// Team schema - represents a team/organization account
const teamSchema = new mongoose.Schema(
    {
        // Team identification
        name: {
            type: String,
            required: [true, "Team name is required"],
            trim: true,
            maxlength: [200, "Team name cannot exceed 200 characters"],
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
            maxlength: [1000, "Team description cannot exceed 1000 characters"],
        },

        // Team type
        teamType: {
            type: String,
            enum: ["career_coaching", "mentorship", "recruiting", "educational", "corporate", "other"],
            default: "career_coaching",
        },

        // Team owner (primary admin who created the team)
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        // Team settings
        settings: {
            // Privacy settings
            isPublic: { type: Boolean, default: false },
            allowMemberInvites: { type: Boolean, default: false }, // Can non-admin members invite others
            requireApproval: { type: Boolean, default: true }, // Require admin approval for new members

            // Feature toggles
            enableMessaging: { type: Boolean, default: true },
            enableSharedReports: { type: Boolean, default: true },
            enableProgressTracking: { type: Boolean, default: true },
            enableCollaboration: { type: Boolean, default: true },

            // Data sharing defaults
            defaultDataSharing: {
                shareResume: { type: Boolean, default: true },
                shareCoverLetters: { type: Boolean, default: true },
                shareApplications: { type: Boolean, default: true },
                shareInterviewPrep: { type: Boolean, default: true },
                shareGoals: { type: Boolean, default: true },
                shareSkillGaps: { type: Boolean, default: true },
                shareProgress: { type: Boolean, default: true },
                shareAnalytics: { type: Boolean, default: true },
            },

            // Notification settings
            notifications: {
                newMemberJoined: { type: Boolean, default: true },
                memberProgress: { type: Boolean, default: true },
                sharedContent: { type: Boolean, default: true },
                teamMessages: { type: Boolean, default: true },
            },
        },

        // Team statistics
        stats: {
            totalMembers: { type: Number, default: 0 },
            activeCandidates: { type: Number, default: 0 },
            totalApplications: { type: Number, default: 0 },
            totalInterviews: { type: Number, default: 0 },
            successfulPlacements: { type: Number, default: 0 },
            averageResponseTime: { type: Number, default: 0 }, // in hours
        },

        // Subscription and billing info (reference to TeamSubscription)
        subscriptionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "TeamSubscription",
            default: null,
        },

        // Status
        status: {
            type: String,
            enum: ["active", "suspended", "cancelled", "trial"],
            default: "trial",
        },

        // Trial information
        trialEndsAt: {
            type: Date,
            default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
        },

        // Branding
        branding: {
            logo: { type: String, trim: true },
            primaryColor: { type: String, default: "#3b82f6" },
            secondaryColor: { type: String, default: "#10b981" },
        },

        // Tags for categorization
        tags: [{ type: String, trim: true, lowercase: true }],

        // Soft delete
        isDeleted: { type: Boolean, default: false },
        deletedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

// Indexes for efficient queries
teamSchema.index({ ownerId: 1, status: 1 });
teamSchema.index({ slug: 1 }, { unique: true });
teamSchema.index({ status: 1, isDeleted: 1 });
teamSchema.index({ "stats.totalMembers": 1 });

// Generate slug before saving
teamSchema.pre("save", async function (next) {
    if (!this.slug && this.name) {
        const baseSlug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");

        let slug = baseSlug;
        let counter = 1;

        // Ensure unique slug
        while (await mongoose.models.Team.findOne({ slug, _id: { $ne: this._id } })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }

        this.slug = slug;
    }
    next();
});

// Virtual for checking if trial is expired
teamSchema.virtual("isTrialExpired").get(function () {
    return this.status === "trial" && this.trialEndsAt && this.trialEndsAt < new Date();
});

// Team Member schema - represents a user's membership in a team
const teamMemberSchema = new mongoose.Schema(
    {
        // Team reference
        teamId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Team",
            required: true,
            index: true,
        },

        // User reference (null if invitation pending)
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
            index: true,
        },

        // Email for pending invitations
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            index: true,
        },

        // Role in the team
        role: {
            type: String,
            enum: ["owner", "admin", "mentor", "coach", "candidate", "viewer"],
            required: true,
            default: "candidate",
        },

        // Membership status
        status: {
            type: String,
            enum: ["pending", "active", "suspended", "removed"],
            default: "pending",
        },

        // Invitation details
        invitedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        invitationToken: {
            type: String,
            unique: true,
            sparse: true,
            index: true,
        },
        invitationMessage: {
            type: String,
            trim: true,
            maxlength: 500,
        },
        invitationExpiresAt: {
            type: Date,
            default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },

        // Acceptance/joining details
        joinedAt: {
            type: Date,
            default: null,
        },

        // Custom permissions (overrides role defaults)
        permissions: {
            // Candidate management
            viewCandidates: { type: Boolean, default: null }, // null = use role default
            manageCandidates: { type: Boolean, default: null },

            // Data access
            viewResumes: { type: Boolean, default: null },
            editResumes: { type: Boolean, default: null },
            viewApplications: { type: Boolean, default: null },
            editApplications: { type: Boolean, default: null },
            viewInterviews: { type: Boolean, default: null },
            editInterviews: { type: Boolean, default: null },
            viewAnalytics: { type: Boolean, default: null },

            // Team management
            inviteMembers: { type: Boolean, default: null },
            removeMembers: { type: Boolean, default: null },
            manageRoles: { type: Boolean, default: null },
            manageTeamSettings: { type: Boolean, default: null },

            // Communication
            sendMessages: { type: Boolean, default: null },
            createReports: { type: Boolean, default: null },
            shareFeedback: { type: Boolean, default: null },

            // Billing
            manageBilling: { type: Boolean, default: null },
        },

        // Data sharing configuration (for candidates)
        dataSharing: {
            shareResume: { type: Boolean, default: true },
            shareCoverLetters: { type: Boolean, default: true },
            shareApplications: { type: Boolean, default: true },
            shareInterviewPrep: { type: Boolean, default: true },
            shareGoals: { type: Boolean, default: true },
            shareSkillGaps: { type: Boolean, default: true },
            shareProgress: { type: Boolean, default: true },
            shareAnalytics: { type: Boolean, default: true },
        },

        // Focus areas (for mentor-candidate relationships)
        focusAreas: [
            {
                type: String,
                enum: [
                    "job_search_strategy",
                    "resume_review",
                    "interview_prep",
                    "salary_negotiation",
                    "career_direction",
                    "skill_development",
                    "networking",
                    "general_support",
                ],
            },
        ],

        // Member notes (visible to admins and mentors)
        notes: {
            type: String,
            trim: true,
            maxlength: 2000,
        },

        // Last activity tracking
        lastActivityAt: {
            type: Date,
            default: Date.now,
        },

        // Notification preferences
        notifications: {
            teamMessages: { type: Boolean, default: true },
            candidateUpdates: { type: Boolean, default: true },
            reportSharing: { type: Boolean, default: true },
            weeklyDigest: { type: Boolean, default: true },
        },

        // Soft delete
        isDeleted: { type: Boolean, default: false },
        deletedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

// Compound indexes
teamMemberSchema.index({ teamId: 1, userId: 1 }, { unique: true, sparse: true });
teamMemberSchema.index({ teamId: 1, email: 1 });
teamMemberSchema.index({ teamId: 1, role: 1, status: 1 });
teamMemberSchema.index({ userId: 1, status: 1 });
teamMemberSchema.index({ invitationToken: 1 }, { sparse: true });

// Generate invitation token before saving
teamMemberSchema.pre("save", function (next) {
    if (this.isNew && this.status === "pending" && !this.invitationToken) {
        this.invitationToken = crypto.randomBytes(32).toString("hex");
    }
    next();
});

// Team Subscription schema - billing and subscription management
const teamSubscriptionSchema = new mongoose.Schema(
    {
        // Team reference
        teamId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Team",
            required: true,
            unique: true,
            index: true,
        },

        // Plan details
        plan: {
            type: String,
            enum: ["free", "starter", "professional", "enterprise", "custom"],
            default: "free",
        },

        // Pricing
        billingCycle: {
            type: String,
            enum: ["monthly", "annual", "lifetime"],
            default: "monthly",
        },
        price: {
            type: Number,
            default: 0,
            min: 0,
        },
        currency: {
            type: String,
            default: "USD",
            uppercase: true,
        },

        // Limits based on plan
        limits: {
            maxMembers: { type: Number, default: 5 },
            maxCandidates: { type: Number, default: 5 },
            maxMentors: { type: Number, default: 2 },
            maxStorage: { type: Number, default: 1024 }, // MB
            maxReportsPerMonth: { type: Number, default: 10 },
        },

        // Current usage
        usage: {
            currentMembers: { type: Number, default: 0 },
            currentCandidates: { type: Number, default: 0 },
            currentMentors: { type: Number, default: 0 },
            currentStorage: { type: Number, default: 0 }, // MB
            reportsThisMonth: { type: Number, default: 0 },
        },

        // Payment information
        paymentMethod: {
            type: {
                type: String,
                enum: ["card", "paypal", "bank_transfer", "invoice"],
                default: null,
            },
            last4: { type: String, default: null },
            brand: { type: String, default: null },
            expiryMonth: { type: Number, default: null },
            expiryYear: { type: Number, default: null },
        },

        // External payment provider details
        stripeCustomerId: { type: String, default: null },
        stripeSubscriptionId: { type: String, default: null },

        // Subscription status
        status: {
            type: String,
            enum: ["active", "past_due", "cancelled", "trialing", "paused"],
            default: "trialing",
        },

        // Important dates
        currentPeriodStart: {
            type: Date,
            default: Date.now,
        },
        currentPeriodEnd: {
            type: Date,
            default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
        cancelAt: {
            type: Date,
            default: null,
        },
        cancelledAt: {
            type: Date,
            default: null,
        },
        trialStart: {
            type: Date,
            default: Date.now,
        },
        trialEnd: {
            type: Date,
            default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        },

        // Billing history reference
        lastPaymentDate: { type: Date, default: null },
        lastPaymentAmount: { type: Number, default: 0 },
        nextBillingDate: {
            type: Date,
            default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },

        // Discount/coupon
        couponCode: { type: String, default: null, trim: true },
        discountPercent: { type: Number, default: 0, min: 0, max: 100 },

        // Add-ons
        addOns: [
            {
                name: { type: String, required: true },
                price: { type: Number, required: true },
                description: { type: String },
            },
        ],

        // Notes
        notes: {
            type: String,
            trim: true,
            maxlength: 1000,
        },
    },
    { timestamps: true }
);

// Indexes
teamSubscriptionSchema.index({ teamId: 1 }, { unique: true });
teamSubscriptionSchema.index({ status: 1 });
teamSubscriptionSchema.index({ plan: 1 });
teamSubscriptionSchema.index({ nextBillingDate: 1 });

// Check if usage exceeds limits
teamSubscriptionSchema.methods.isOverLimit = function (resource) {
    const limits = this.limits;
    const usage = this.usage;

    switch (resource) {
        case "members":
            return usage.currentMembers >= limits.maxMembers;
        case "candidates":
            return usage.currentCandidates >= limits.maxCandidates;
        case "mentors":
            return usage.currentMentors >= limits.maxMentors;
        case "storage":
            return usage.currentStorage >= limits.maxStorage;
        case "reports":
            return usage.reportsThisMonth >= limits.maxReportsPerMonth;
        default:
            return false;
    }
};

// Team Activity Log schema - audit trail for team actions
const teamActivityLogSchema = new mongoose.Schema(
    {
        teamId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Team",
            required: true,
            index: true,
        },
        actorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        actorName: {
            type: String,
            required: true,
        },
        actorRole: {
            type: String,
            required: true,
        },
        action: {
            type: String,
            required: true,
            enum: [
                // Team management
                "team_created",
                "team_updated",
                "team_deleted",
                "team_settings_updated",

                // Member management
                "member_invited",
                "member_joined",
                "member_removed",
                "member_role_changed",
                "member_permissions_updated",

                // Data access
                "candidate_data_viewed",
                "candidate_data_shared",
                "report_generated",
                "report_shared",

                // Communication
                "message_sent",
                "feedback_shared",

                // Subscription
                "subscription_created",
                "subscription_updated",
                "subscription_cancelled",
                "payment_received",
            ],
        },
        targetType: {
            type: String,
            enum: ["team", "member", "candidate", "subscription", "report", "message"],
        },
        targetId: {
            type: mongoose.Schema.Types.ObjectId,
        },
        details: {
            type: mongoose.Schema.Types.Mixed,
        },
        ipAddress: {
            type: String,
        },
        userAgent: {
            type: String,
        },
    },
    { timestamps: true }
);

// Indexes for activity log
teamActivityLogSchema.index({ teamId: 1, createdAt: -1 });
teamActivityLogSchema.index({ actorId: 1, createdAt: -1 });
teamActivityLogSchema.index({ action: 1, createdAt: -1 });

// Export models
export const Team = mongoose.model("Team", teamSchema);
export const TeamMember = mongoose.model("TeamMember", teamMemberSchema);
export const TeamSubscription = mongoose.model("TeamSubscription", teamSubscriptionSchema);
export const TeamActivityLog = mongoose.model("TeamActivityLog", teamActivityLogSchema);
