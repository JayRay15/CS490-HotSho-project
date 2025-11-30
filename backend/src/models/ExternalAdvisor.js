import mongoose from "mongoose";
import crypto from "crypto";

// ExternalAdvisorRelationship schema - represents a connection with an external career advisor
const externalAdvisorRelationshipSchema = new mongoose.Schema(
    {
        // User (job seeker) who invited the advisor
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        // Store sender info directly for display (in case user profile is incomplete)
        senderName: {
            type: String,
            trim: true,
        },
        senderEmail: {
            type: String,
            lowercase: true,
            trim: true,
        },
        // External advisor (after they accept)
        advisorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
            index: true,
        },
        // Store advisor info directly for display (in case user profile is incomplete)
        advisorName: {
            type: String,
            trim: true,
        },
        // Advisor email for invitation
        advisorEmail: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        // Advisor type
        advisorType: {
            type: String,
            enum: [
                "career_coach",
                "executive_coach",
                "resume_writer",
                "interview_coach",
                "salary_negotiator",
                "industry_expert",
                "linkedin_specialist",
                "recruiter_advisor",
                "other",
            ],
            default: "career_coach",
        },
        // Relationship status
        status: {
            type: String,
            enum: ["pending", "accepted", "rejected", "cancelled", "expired", "paused"],
            default: "pending",
            index: true,
        },
        // Invitation details
        invitationMessage: {
            type: String,
            maxlength: 1000,
            trim: true,
        },
        invitationToken: {
            type: String,
            unique: true,
            sparse: true,
        },
        invitationExpiresAt: {
            type: Date,
            default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
        // Acceptance tracking
        acceptedAt: {
            type: Date,
            default: null,
        },
        endedAt: {
            type: Date,
            default: null,
        },
        // Focus areas for this advisor relationship
        focusAreas: {
            type: [String],
            enum: [
                "job_search_strategy",
                "resume_optimization",
                "cover_letter_writing",
                "interview_preparation",
                "salary_negotiation",
                "career_transition",
                "executive_positioning",
                "personal_branding",
                "linkedin_optimization",
                "networking_strategy",
                "industry_insights",
                "skill_development",
                "work_life_balance",
                "leadership_development",
                "general_career_advice",
            ],
            default: [],
        },
        // Shared profile data - which sections user is sharing
        sharedData: {
            shareResume: { type: Boolean, default: true },
            shareCoverLetters: { type: Boolean, default: true },
            shareApplications: { type: Boolean, default: true },
            shareInterviewPrep: { type: Boolean, default: true },
            shareGoals: { type: Boolean, default: true },
            shareSkillGaps: { type: Boolean, default: true },
            shareProgress: { type: Boolean, default: true },
            shareSalaryInfo: { type: Boolean, default: false },
            shareNetworkContacts: { type: Boolean, default: false },
        },
        // Advisor credentials and verification
        advisorProfile: {
            title: { type: String, trim: true },
            company: { type: String, trim: true },
            specializations: [{ type: String, trim: true }],
            yearsExperience: { type: Number, min: 0 },
            certifications: [{ type: String, trim: true }],
            linkedinUrl: { type: String, trim: true },
            website: { type: String, trim: true },
            bio: { type: String, maxlength: 2000, trim: true },
            isVerified: { type: Boolean, default: false },
            verifiedAt: { type: Date, default: null },
        },
        // Contract/agreement terms
        contractTerms: {
            startDate: { type: Date, default: null },
            endDate: { type: Date, default: null },
            isOpenEnded: { type: Boolean, default: true },
            totalSessions: { type: Number, default: null }, // null = unlimited
            completedSessions: { type: Number, default: 0 },
            agreementNotes: { type: String, maxlength: 2000, trim: true },
        },
        // Impact tracking
        impactMetrics: {
            // Job search improvements
            applicationsBeforeAdvisor: { type: Number, default: 0 },
            applicationsAfterAdvisor: { type: Number, default: 0 },
            interviewsBeforeAdvisor: { type: Number, default: 0 },
            interviewsAfterAdvisor: { type: Number, default: 0 },
            offersBeforeAdvisor: { type: Number, default: 0 },
            offersAfterAdvisor: { type: Number, default: 0 },
            // Salary impact
            expectedSalaryBeforeAdvisor: { type: Number, default: null },
            negotiatedSalary: { type: Number, default: null },
            salaryIncrease: { type: Number, default: null }, // percentage
            // Overall success
            achievedGoals: { type: Number, default: 0 },
            totalGoals: { type: Number, default: 0 },
            careerAdvancementScore: { type: Number, min: 0, max: 100, default: 0 },
            lastMetricsUpdate: { type: Date, default: null },
        },
        // Notes and tags
        notes: {
            type: String,
            maxlength: 5000,
            trim: true,
        },
        tags: [{ type: String, trim: true, lowercase: true }],
    },
    { timestamps: true }
);

// Indexes
externalAdvisorRelationshipSchema.index({ userId: 1, advisorId: 1 });
externalAdvisorRelationshipSchema.index({ userId: 1, status: 1 });
externalAdvisorRelationshipSchema.index({ advisorEmail: 1, status: 1 });
externalAdvisorRelationshipSchema.index({ invitationToken: 1 }, { sparse: true });

// Generate invitation token before saving
externalAdvisorRelationshipSchema.pre("save", function (next) {
    if (this.isNew && !this.invitationToken) {
        this.invitationToken = crypto.randomBytes(32).toString("hex");
    }
    next();
});

// AdvisorSession schema - tracks individual coaching sessions
const advisorSessionSchema = new mongoose.Schema(
    {
        // Relationship reference
        relationshipId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ExternalAdvisorRelationship",
            required: true,
            index: true,
        },
        // User and advisor references
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        advisorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        // Session details
        title: {
            type: String,
            required: true,
            maxlength: 200,
            trim: true,
        },
        description: {
            type: String,
            maxlength: 2000,
            trim: true,
        },
        sessionType: {
            type: String,
            enum: [
                "initial_consultation",
                "follow_up",
                "resume_review",
                "mock_interview",
                "strategy_session",
                "goal_setting",
                "progress_review",
                "salary_negotiation",
                "final_review",
                "other",
            ],
            default: "follow_up",
        },
        // Scheduling
        scheduledAt: {
            type: Date,
            required: true,
        },
        duration: {
            type: Number, // in minutes
            default: 60,
            min: 15,
            max: 240,
        },
        timezone: {
            type: String,
            default: "America/New_York",
        },
        // Session status
        status: {
            type: String,
            enum: ["scheduled", "confirmed", "in_progress", "completed", "cancelled", "no_show", "rescheduled"],
            default: "scheduled",
        },
        // Meeting details
        meetingType: {
            type: String,
            enum: ["video", "phone", "in_person", "chat"],
            default: "video",
        },
        meetingLink: {
            type: String,
            trim: true,
        },
        meetingLocation: {
            type: String,
            trim: true,
        },
        // Session notes and outcomes
        agendaItems: [{
            item: { type: String, trim: true },
            completed: { type: Boolean, default: false },
        }],
        sessionNotes: {
            type: String,
            maxlength: 10000,
            trim: true,
        },
        keyTakeaways: [{
            type: String,
            trim: true,
        }],
        actionItems: [{
            item: { type: String, trim: true },
            dueDate: { type: Date },
            completed: { type: Boolean, default: false },
            completedAt: { type: Date },
        }],
        // Attachments shared during session
        attachments: [{
            name: { type: String, trim: true },
            url: { type: String, trim: true },
            type: { type: String, trim: true },
            sharedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            sharedAt: { type: Date, default: Date.now },
        }],
        // Completion tracking
        startedAt: {
            type: Date,
            default: null,
        },
        completedAt: {
            type: Date,
            default: null,
        },
        // Cancellation details
        cancelledAt: {
            type: Date,
            default: null,
        },
        cancelledBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        cancellationReason: {
            type: String,
            maxlength: 500,
            trim: true,
        },
        // Reminders
        remindersSent: [{
            type: { type: String, enum: ["email", "sms", "push"] },
            sentAt: { type: Date },
        }],
    },
    { timestamps: true }
);

// Indexes
advisorSessionSchema.index({ relationshipId: 1, scheduledAt: 1 });
advisorSessionSchema.index({ userId: 1, status: 1 });
advisorSessionSchema.index({ advisorId: 1, scheduledAt: 1 });
advisorSessionSchema.index({ status: 1, scheduledAt: 1 });

// AdvisorBilling schema - manages billing for paid coaching services
const advisorBillingSchema = new mongoose.Schema(
    {
        // Relationship reference
        relationshipId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ExternalAdvisorRelationship",
            required: true,
            index: true,
        },
        // User and advisor references
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        advisorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        // Billing type
        billingType: {
            type: String,
            enum: ["free", "per_session", "package", "subscription", "retainer"],
            default: "free",
        },
        // Pricing
        currency: {
            type: String,
            default: "USD",
            uppercase: true,
        },
        // Per-session pricing
        sessionRate: {
            type: Number,
            default: 0,
            min: 0,
        },
        // Package pricing
        packageDetails: {
            name: { type: String, trim: true },
            totalSessions: { type: Number, default: 0 },
            usedSessions: { type: Number, default: 0 },
            packagePrice: { type: Number, default: 0 },
            validUntil: { type: Date },
        },
        // Subscription pricing
        subscriptionDetails: {
            plan: { type: String, enum: ["monthly", "quarterly", "annual"], default: "monthly" },
            amount: { type: Number, default: 0 },
            sessionsPerMonth: { type: Number, default: 0 },
            nextBillingDate: { type: Date },
            autoRenew: { type: Boolean, default: true },
        },
        // Retainer pricing
        retainerDetails: {
            monthlyRetainer: { type: Number, default: 0 },
            hoursIncluded: { type: Number, default: 0 },
            additionalHourlyRate: { type: Number, default: 0 },
        },
        // Payment status
        status: {
            type: String,
            enum: ["active", "paused", "cancelled", "expired", "pending_payment"],
            default: "active",
        },
        // Totals
        totalPaid: {
            type: Number,
            default: 0,
        },
        totalOutstanding: {
            type: Number,
            default: 0,
        },
        // Payment method (reference to external payment provider)
        paymentMethod: {
            type: {
                type: String,
                enum: ["card", "paypal", "bank_transfer", "invoice", "other"],
                default: null,
            },
            last4: { type: String, default: null },
            brand: { type: String, default: null },
        },
        stripeCustomerId: { type: String, default: null },
        stripePaymentMethodId: { type: String, default: null },
        // Discount
        discountPercent: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },
        discountCode: {
            type: String,
            trim: true,
        },
        // Notes
        notes: {
            type: String,
            maxlength: 1000,
            trim: true,
        },
    },
    { timestamps: true }
);

// Indexes
advisorBillingSchema.index({ relationshipId: 1 }, { unique: true });
advisorBillingSchema.index({ userId: 1 });
advisorBillingSchema.index({ advisorId: 1 });
advisorBillingSchema.index({ status: 1 });

// AdvisorPayment schema - individual payment transactions
const advisorPaymentSchema = new mongoose.Schema(
    {
        // Billing reference
        billingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AdvisorBilling",
            required: true,
            index: true,
        },
        // User and advisor references
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        advisorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        // Session reference (if payment is for specific session)
        sessionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AdvisorSession",
            default: null,
        },
        // Payment details
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        currency: {
            type: String,
            default: "USD",
            uppercase: true,
        },
        description: {
            type: String,
            maxlength: 500,
            trim: true,
        },
        // Payment status
        status: {
            type: String,
            enum: ["pending", "processing", "completed", "failed", "refunded", "disputed"],
            default: "pending",
        },
        // Payment method
        paymentMethod: {
            type: String,
            enum: ["card", "paypal", "bank_transfer", "invoice", "other"],
        },
        // External payment provider references
        stripePaymentIntentId: { type: String, default: null },
        stripeChargeId: { type: String, default: null },
        // Invoice details
        invoiceNumber: {
            type: String,
            trim: true,
        },
        invoiceUrl: {
            type: String,
            trim: true,
        },
        // Dates
        paidAt: {
            type: Date,
            default: null,
        },
        dueDate: {
            type: Date,
            default: null,
        },
        // Refund details
        refundedAt: {
            type: Date,
            default: null,
        },
        refundAmount: {
            type: Number,
            default: 0,
        },
        refundReason: {
            type: String,
            maxlength: 500,
            trim: true,
        },
    },
    { timestamps: true }
);

// Indexes
advisorPaymentSchema.index({ billingId: 1, createdAt: -1 });
advisorPaymentSchema.index({ userId: 1, status: 1 });
advisorPaymentSchema.index({ advisorId: 1, status: 1 });
advisorPaymentSchema.index({ status: 1, dueDate: 1 });

// AdvisorRecommendation schema - recommendations from advisor to user
const advisorRecommendationSchema = new mongoose.Schema(
    {
        // Relationship reference
        relationshipId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ExternalAdvisorRelationship",
            required: true,
            index: true,
        },
        // User and advisor references
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        advisorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        // Session reference (if from a session)
        sessionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AdvisorSession",
            default: null,
        },
        // Recommendation details
        title: {
            type: String,
            required: true,
            maxlength: 300,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            maxlength: 5000,
            trim: true,
        },
        category: {
            type: String,
            enum: [
                "resume_update",
                "cover_letter_improvement",
                "interview_preparation",
                "networking_action",
                "skill_development",
                "job_search_strategy",
                "personal_branding",
                "salary_negotiation",
                "career_planning",
                "work_life_balance",
                "leadership",
                "other",
            ],
            required: true,
        },
        priority: {
            type: String,
            enum: ["critical", "high", "medium", "low"],
            default: "medium",
        },
        // Target and deadline
        targetDate: {
            type: Date,
        },
        estimatedEffort: {
            type: String,
            enum: ["quick_win", "few_hours", "few_days", "week", "ongoing"],
            default: "few_hours",
        },
        // Implementation tracking
        status: {
            type: String,
            enum: ["pending", "in_progress", "completed", "dismissed", "deferred"],
            default: "pending",
        },
        startedAt: {
            type: Date,
            default: null,
        },
        completedAt: {
            type: Date,
            default: null,
        },
        // User progress notes
        progressNotes: {
            type: String,
            maxlength: 2000,
            trim: true,
        },
        // Impact assessment
        expectedImpact: {
            type: String,
            maxlength: 1000,
            trim: true,
        },
        actualImpact: {
            type: String,
            maxlength: 1000,
            trim: true,
        },
        impactRating: {
            type: Number,
            min: 1,
            max: 5,
            default: null,
        },
        // Resources and references
        resources: [{
            title: { type: String, trim: true },
            url: { type: String, trim: true },
            type: { type: String, enum: ["article", "video", "tool", "template", "course", "other"] },
        }],
    },
    { timestamps: true }
);

// Indexes
advisorRecommendationSchema.index({ relationshipId: 1, createdAt: -1 });
advisorRecommendationSchema.index({ userId: 1, status: 1 });
advisorRecommendationSchema.index({ priority: 1, status: 1 });
advisorRecommendationSchema.index({ category: 1 });

// AdvisorEvaluation schema - performance evaluation and feedback for advisors
const advisorEvaluationSchema = new mongoose.Schema(
    {
        // Relationship reference
        relationshipId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ExternalAdvisorRelationship",
            required: true,
            index: true,
        },
        // User and advisor references
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        advisorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        // Session reference (if evaluation is for specific session)
        sessionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AdvisorSession",
            default: null,
        },
        // Evaluation type
        evaluationType: {
            type: String,
            enum: ["session_feedback", "periodic_review", "final_evaluation", "milestone_review"],
            default: "session_feedback",
        },
        // Ratings (1-5 scale)
        ratings: {
            overall: { type: Number, min: 1, max: 5, required: true },
            communication: { type: Number, min: 1, max: 5 },
            expertise: { type: Number, min: 1, max: 5 },
            responsiveness: { type: Number, min: 1, max: 5 },
            actionableAdvice: { type: Number, min: 1, max: 5 },
            professionalism: { type: Number, min: 1, max: 5 },
            valueForMoney: { type: Number, min: 1, max: 5 },
            goalProgress: { type: Number, min: 1, max: 5 },
        },
        // Qualitative feedback
        feedback: {
            strengths: { type: String, maxlength: 2000, trim: true },
            improvements: { type: String, maxlength: 2000, trim: true },
            highlights: { type: String, maxlength: 2000, trim: true },
            additionalComments: { type: String, maxlength: 5000, trim: true },
        },
        // Outcome tracking
        goalsAchieved: [{
            goal: { type: String, trim: true },
            achieved: { type: Boolean, default: false },
            notes: { type: String, trim: true },
        }],
        // Net Promoter Score
        npsScore: {
            type: Number,
            min: 0,
            max: 10,
        },
        wouldRecommend: {
            type: Boolean,
            default: null,
        },
        wouldContinue: {
            type: Boolean,
            default: null,
        },
        // Visibility
        isPublic: {
            type: Boolean,
            default: false, // Public reviews visible to other users
        },
        isAnonymous: {
            type: Boolean,
            default: false,
        },
        // Advisor response
        advisorResponse: {
            content: { type: String, maxlength: 2000, trim: true },
            respondedAt: { type: Date },
        },
    },
    { timestamps: true }
);

// Indexes
advisorEvaluationSchema.index({ relationshipId: 1, createdAt: -1 });
advisorEvaluationSchema.index({ advisorId: 1, "ratings.overall": -1 });
advisorEvaluationSchema.index({ evaluationType: 1 });
advisorEvaluationSchema.index({ isPublic: 1, advisorId: 1 });

// AdvisorMessage schema - secure communication between user and advisor
const advisorMessageSchema = new mongoose.Schema(
    {
        // Relationship reference
        relationshipId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ExternalAdvisorRelationship",
            required: true,
            index: true,
        },
        // Sender and recipient
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
            maxlength: 10000,
            trim: true,
        },
        // Message type
        messageType: {
            type: String,
            enum: ["text", "session_request", "session_update", "recommendation", "file_share", "system"],
            default: "text",
        },
        // Attachments
        attachments: [{
            name: { type: String, trim: true },
            url: { type: String, trim: true },
            type: { type: String, trim: true },
            size: { type: Number },
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
        // Thread reference for replies
        parentMessageId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AdvisorMessage",
            default: null,
        },
        // Session reference if message is about a session
        sessionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AdvisorSession",
            default: null,
        },
        // Priority
        priority: {
            type: String,
            enum: ["normal", "important", "urgent"],
            default: "normal",
        },
    },
    { timestamps: true }
);

// Indexes
advisorMessageSchema.index({ relationshipId: 1, createdAt: -1 });
advisorMessageSchema.index({ recipientId: 1, isRead: 1 });
advisorMessageSchema.index({ senderId: 1, createdAt: -1 });
advisorMessageSchema.index({ parentMessageId: 1 });

// Export models
export const ExternalAdvisorRelationship = mongoose.model(
    "ExternalAdvisorRelationship",
    externalAdvisorRelationshipSchema
);
export const AdvisorSession = mongoose.model(
    "AdvisorSession",
    advisorSessionSchema
);
export const AdvisorBilling = mongoose.model(
    "AdvisorBilling",
    advisorBillingSchema
);
export const AdvisorPayment = mongoose.model(
    "AdvisorPayment",
    advisorPaymentSchema
);
export const AdvisorRecommendation = mongoose.model(
    "AdvisorRecommendation",
    advisorRecommendationSchema
);
export const AdvisorEvaluation = mongoose.model(
    "AdvisorEvaluation",
    advisorEvaluationSchema
);
export const AdvisorMessage = mongoose.model(
    "AdvisorMessage",
    advisorMessageSchema
);

// AdvisorImpactMetric schema - track impact of advisor on job search
const advisorImpactMetricSchema = new mongoose.Schema(
    {
        relationshipId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ExternalAdvisorRelationship",
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        advisorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        metricType: {
            type: String,
            enum: ["applications", "interviews", "offers", "networking", "skills"],
            required: true,
        },
        value: {
            type: Number,
            default: 1,
        },
        description: String,
        relatedJobId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Job",
        },
        milestone: String,
        recordedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

advisorImpactMetricSchema.index({ relationshipId: 1, createdAt: -1 });
advisorImpactMetricSchema.index({ metricType: 1 });

export const AdvisorImpactMetric = mongoose.model(
    "AdvisorImpactMetric",
    advisorImpactMetricSchema
);
