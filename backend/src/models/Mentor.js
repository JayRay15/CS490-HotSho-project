import mongoose from "mongoose";

// MentorRelationship schema - represents a connection between a mentee and mentor
const mentorRelationshipSchema = new mongoose.Schema(
    {
        // Mentee (job seeker) who invited the mentor
        menteeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        // Mentor/Coach (expert) being invited
        mentorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        // Relationship type: 'mentor', 'career_coach', 'peer_mentor'
        relationshipType: {
            type: String,
            enum: ["mentor", "career_coach", "peer_mentor"],
            default: "mentor",
        },
        // Invitation status
        status: {
            type: String,
            enum: ["pending", "accepted", "rejected", "cancelled"],
            default: "pending",
        },
        // Email or identifier if mentor hasn't accepted yet
        mentorEmail: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        // When mentor accepts, track acceptance date
        acceptedAt: {
            type: Date,
            default: null,
        },
        // Track when mentor rejected or relationship was cancelled
        endedAt: {
            type: Date,
            default: null,
        },
        // Personal invitation message from mentee
        invitationMessage: {
            type: String,
            maxlength: 500,
            trim: true,
        },
        // What the mentee wants help with
        focusAreas: {
            type: [String],
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
            default: [],
        },
        // Shared profile data - which sections mentee is sharing
        sharedData: {
            shareResume: { type: Boolean, default: true },
            shareCoverLetters: { type: Boolean, default: true },
            shareApplications: { type: Boolean, default: true },
            shareInterviewPrep: { type: Boolean, default: true },
            shareGoals: { type: Boolean, default: true },
            shareSkillGaps: { type: Boolean, default: true },
            shareProgress: { type: Boolean, default: true },
        },
        // Track if mentor has been notified about new shared data
        lastNotifiedAt: {
            type: Date,
            default: null,
        },
        // Token for accepting invitation via link (if mentor isn't registered yet)
        invitationToken: {
            type: String,
            unique: true,
            sparse: true,
        },
        // Expiration for the invitation
        invitationExpiresAt: {
            type: Date,
            default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
    },
    { timestamps: true }
);

// Create index for efficient queries
mentorRelationshipSchema.index({ menteeId: 1, mentorId: 1 });
mentorRelationshipSchema.index({ menteeId: 1, status: 1 });
mentorRelationshipSchema.index({ mentorId: 1, status: 1 });
mentorRelationshipSchema.index({ mentorEmail: 1, status: 1 });
mentorRelationshipSchema.index({ invitationToken: 1 }, { sparse: true });

// MentorFeedback schema - feedback from mentor to mentee
const mentorFeedbackSchema = new mongoose.Schema(
    {
        // The mentor-mentee relationship
        relationshipId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "MentorRelationship",
            required: true,
        },
        // Who gave the feedback
        mentorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        // Who received the feedback
        menteeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        // What the feedback is about
        type: {
            type: String,
            enum: [
                "resume",
                "cover_letter",
                "interview_prep",
                "job_search_strategy",
                "skill_gap",
                "goal",
                "general",
            ],
            required: true,
        },
        // Reference to the specific item (e.g., resumeId, coverId, etc.)
        referenceId: {
            type: String,
            trim: true,
        },
        // Rating 1-5 for items that can be rated
        rating: {
            type: Number,
            min: 1,
            max: 5,
        },
        // The actual feedback content
        content: {
            type: String,
            required: true,
            maxlength: 5000,
            trim: true,
        },
        // Specific suggestions
        suggestions: [
            {
                title: String,
                description: String,
                priority: {
                    type: String,
                    enum: ["high", "medium", "low"],
                    default: "medium",
                },
            },
        ],
        // Whether mentee has acknowledged this feedback
        acknowledged: {
            type: Boolean,
            default: false,
        },
        // When mentee acknowledged
        acknowledgedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

// Create index for efficient queries
mentorFeedbackSchema.index({ relationshipId: 1 });
mentorFeedbackSchema.index({ mentorId: 1, menteeId: 1 });
mentorFeedbackSchema.index({ type: 1, createdAt: -1 });

// MentorRecommendation schema - recommendations/action items for mentee
const mentorRecommendationSchema = new mongoose.Schema(
    {
        // The mentor-mentee relationship
        relationshipId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "MentorRelationship",
            required: true,
        },
        // Who made the recommendation
        mentorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        // Who should implement
        menteeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        // Title of the recommendation
        title: {
            type: String,
            required: true,
            maxlength: 200,
            trim: true,
        },
        // Detailed description
        description: {
            type: String,
            required: true,
            maxlength: 2000,
            trim: true,
        },
        // Category of recommendation
        category: {
            type: String,
            enum: [
                "resume_update",
                "skill_development",
                "application_strategy",
                "interview_practice",
                "networking",
                "career_planning",
                "other",
            ],
            required: true,
        },
        // Priority level
        priority: {
            type: String,
            enum: ["high", "medium", "low"],
            default: "medium",
        },
        // Target completion date
        targetDate: {
            type: Date,
        },
        // Implementation status
        status: {
            type: String,
            enum: ["pending", "in_progress", "completed", "dismissed"],
            default: "pending",
        },
        // When mentee marked as complete
        completedAt: {
            type: Date,
            default: null,
        },
        // Mentee's progress notes
        progressNotes: {
            type: String,
            maxlength: 1000,
            trim: true,
        },
    },
    { timestamps: true }
);

// Create index for efficient queries
mentorRecommendationSchema.index({ relationshipId: 1 });
mentorRecommendationSchema.index({ menteeId: 1, status: 1 });
mentorRecommendationSchema.index({ priority: 1, targetDate: 1 });

// MentorMessage schema - secure communication between mentor and mentee
const mentorMessageSchema = new mongoose.Schema(
    {
        // The mentor-mentee relationship
        relationshipId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "MentorRelationship",
            required: true,
        },
        // Who sent the message
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        // Who received the message
        recipientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        // Message content
        content: {
            type: String,
            required: true,
            maxlength: 3000,
            trim: true,
        },
        // Message type
        type: {
            type: String,
            enum: ["text", "feedback_response", "recommendation_update"],
            default: "text",
        },
        // Whether recipient has read the message
        isRead: {
            type: Boolean,
            default: false,
        },
        // When recipient read the message
        readAt: {
            type: Date,
            default: null,
        },
        // Attachments or references
        attachments: [
            {
                type: String, // Could be URL, file path, or document ID
                label: String,
            },
        ],
    },
    { timestamps: true }
);

// Create index for efficient queries
mentorMessageSchema.index({ relationshipId: 1, createdAt: -1 });
mentorMessageSchema.index({ recipientId: 1, isRead: 1 });
mentorMessageSchema.index({ senderId: 1, createdAt: -1 });

// MentorProgressReport schema - aggregated progress report for mentor review
const mentorProgressReportSchema = new mongoose.Schema(
    {
        // The mentor-mentee relationship
        relationshipId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "MentorRelationship",
            required: true,
        },
        // Mentee info
        menteeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        // Report period
        reportPeriod: {
            startDate: { type: Date, required: true },
            endDate: { type: Date, required: true },
        },
        // Report type
        reportType: {
            type: String,
            enum: ["weekly", "monthly", "custom"],
            default: "monthly",
        },
        // Job search metrics
        metrics: {
            jobsAppliedTo: { type: Number, default: 0 },
            interviewsScheduled: { type: Number, default: 0 },
            offersReceived: { type: Number, default: 0 },
            rejections: { type: Number, default: 0 },
            averageResponseTime: { type: Number, default: 0 }, // in hours
        },
        // Recommendations status
        recommendationStats: {
            total: { type: Number, default: 0 },
            completed: { type: Number, default: 0 },
            inProgress: { type: Number, default: 0 },
            pending: { type: Number, default: 0 },
        },
        // Feedback provided
        feedbackCount: { type: Number, default: 0 },
        // Main accomplishments
        accomplishments: [
            {
                title: String,
                description: String,
            },
        ],
        // Challenges and blockers
        challenges: [
            {
                title: String,
                description: String,
                suggestedSolution: String,
            },
        ],
        // Next steps
        nextSteps: [
            {
                action: String,
                dueDate: Date,
                priority: {
                    type: String,
                    enum: ["high", "medium", "low"],
                },
            },
        ],
        // Overall progress score (0-100)
        progressScore: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
        },
        // Generated by (auto or manual)
        generatedBy: {
            type: String,
            enum: ["auto", "mentor"],
            default: "auto",
        },
        // Whether mentor has reviewed this report
        reviewedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

// Create index for efficient queries
mentorProgressReportSchema.index({ relationshipId: 1, createdAt: -1 });
mentorProgressReportSchema.index({ menteeId: 1, reportPeriod: 1 });

export const MentorRelationship = mongoose.model(
    "MentorRelationship",
    mentorRelationshipSchema
);
export const MentorFeedback = mongoose.model(
    "MentorFeedback",
    mentorFeedbackSchema
);
export const MentorRecommendation = mongoose.model(
    "MentorRecommendation",
    mentorRecommendationSchema
);
export const MentorMessage = mongoose.model(
    "MentorMessage",
    mentorMessageSchema
);
export const MentorProgressReport = mongoose.model(
    "MentorProgressReport",
    mentorProgressReportSchema
);
