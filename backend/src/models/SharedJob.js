import mongoose from "mongoose";

// Schema for comments on shared jobs
const commentSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
        },
        userName: {
            type: String,
            required: true,
        },
        content: {
            type: String,
            required: true,
            maxlength: [2000, "Comment cannot exceed 2000 characters"],
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: true }
);

// Schema for shared jobs within a team
const sharedJobSchema = new mongoose.Schema(
    {
        // Reference to the team
        teamId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Team",
            required: true,
            index: true,
        },
        // Reference to the original job
        jobId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Job",
            required: true,
        },
        // User who shared the job
        sharedBy: {
            userId: {
                type: String,
                required: true,
            },
            userName: {
                type: String,
                required: true,
            },
        },
        // Job details snapshot (in case original job is deleted)
        jobSnapshot: {
            title: {
                type: String,
                required: true,
            },
            company: {
                type: String,
                required: true,
            },
            location: String,
            salary: String,
            jobType: String,
            description: String,
            url: String,
            status: String,
        },
        // Sharing message from the user
        shareMessage: {
            type: String,
            maxlength: [1000, "Share message cannot exceed 1000 characters"],
        },
        // Team comments on the shared job
        comments: [commentSchema],
        // Reactions/endorsements
        reactions: [
            {
                userId: String,
                userName: String,
                type: {
                    type: String,
                    enum: ["interested", "applied", "recommended", "not_interested"],
                },
                createdAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        // Status of the shared job
        status: {
            type: String,
            enum: ["active", "archived", "closed"],
            default: "active",
        },
        // Visibility settings
        visibility: {
            type: String,
            enum: ["all_members", "coaches_only", "specific_members"],
            default: "all_members",
        },
        // Specific members who can see (if visibility is specific_members)
        visibleTo: [String],
    },
    {
        timestamps: true,
    }
);

// Index for efficient queries
sharedJobSchema.index({ teamId: 1, createdAt: -1 });
sharedJobSchema.index({ teamId: 1, "sharedBy.userId": 1 });

const SharedJob = mongoose.model("SharedJob", sharedJobSchema);

export default SharedJob;
