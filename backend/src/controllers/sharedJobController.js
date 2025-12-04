import SharedJob from "../models/SharedJob.js";
import { Job } from "../models/Job.js";
import { Team, TeamMember, TeamActivityLog } from "../models/Team.js";
import { User } from "../models/User.js";

/**
 * Share a job with a team
 * POST /api/teams/:teamId/shared-jobs
 */
export const shareJobWithTeam = async (req, res) => {
    try {
        const { teamId } = req.params;
        const { jobId, shareMessage, visibility } = req.body;
        const userId = req.auth?.userId;
        
        // Use membership from middleware (set by verifyTeamMembership)
        const membership = req.membership;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (!membership) {
            return res.status(403).json({ message: "Not a member of this team" });
        }

        // Get the job details - userId in Job model is clerkUserId
        const job = await Job.findOne({ _id: jobId, userId });
        if (!job) {
            return res.status(404).json({ message: "Job not found or you don't own this job" });
        }

        // Check if job is already shared with this team
        const existingShare = await SharedJob.findOne({
            teamId,
            jobId,
            status: "active",
        });

        if (existingShare) {
            return res.status(400).json({ message: "This job is already shared with the team" });
        }

        // Create the shared job
        const sharedJob = new SharedJob({
            teamId,
            jobId,
            sharedBy: {
                userId,
                userName: membership.profile?.name || membership.email || "Team Member",
            },
            jobSnapshot: {
                title: job.title,
                company: job.company,
                location: job.location,
                salary: job.salary,
                jobType: job.jobType,
                description: job.description,
                url: job.url,
                status: job.status,
            },
            shareMessage,
            visibility: visibility || "all_members",
        });

        await sharedJob.save();

        // Log team activity
        await TeamActivityLog.create({
            teamId,
            actorId: membership._id,
            actorName: membership.profile?.name || membership.email || "Team Member",
            actorRole: membership.role,
            action: "candidate_data_shared",
            targetType: "candidate",
            targetId: sharedJob._id,
            details: {
                jobTitle: job.title,
                company: job.company,
                message: shareMessage,
                type: "shared_job",
            },
        });

        res.status(201).json({
            message: "Job shared successfully",
            data: sharedJob,
        });
    } catch (error) {
        console.error("Error sharing job:", error);
        res.status(500).json({ message: "Failed to share job", error: error.message });
    }
};

/**
 * Get all shared jobs for a team
 * GET /api/teams/:teamId/shared-jobs
 */
export const getSharedJobs = async (req, res) => {
    try {
        const { teamId } = req.params;
        const userId = req.auth?.userId;
        const { status = "active", page = 1, limit = 20 } = req.query;
        
        // Use membership from middleware
        const membership = req.membership;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (!membership) {
            return res.status(403).json({ message: "Not a member of this team" });
        }

        // Build query based on visibility
        const query = {
            teamId,
            status,
            $or: [
                { visibility: "all_members" },
                { "sharedBy.userId": userId },
                { visibleTo: userId },
            ],
        };

        // If user is a coach/mentor, they can see coaches_only posts too
        if (["coach", "mentor", "owner", "admin"].includes(membership.role)) {
            query.$or.push({ visibility: "coaches_only" });
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [sharedJobs, totalCount] = await Promise.all([
            SharedJob.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            SharedJob.countDocuments(query),
        ]);

        res.json({
            data: sharedJobs,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalCount,
                totalPages: Math.ceil(totalCount / parseInt(limit)),
            },
        });
    } catch (error) {
        console.error("Error getting shared jobs:", error);
        res.status(500).json({ message: "Failed to get shared jobs", error: error.message });
    }
};

/**
 * Add a comment to a shared job
 * POST /api/teams/:teamId/shared-jobs/:sharedJobId/comments
 */
export const addComment = async (req, res) => {
    try {
        const { teamId, sharedJobId } = req.params;
        const { content } = req.body;
        const userId = req.auth?.userId;
        
        // Use membership from middleware
        const membership = req.membership;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ message: "Comment content is required" });
        }

        if (!membership) {
            return res.status(403).json({ message: "Not a member of this team" });
        }

        const sharedJob = await SharedJob.findOne({ _id: sharedJobId, teamId });
        if (!sharedJob) {
            return res.status(404).json({ message: "Shared job not found" });
        }

        const comment = {
            userId,
            userName: membership.profile?.name || membership.email || "Team Member",
            content: content.trim(),
            createdAt: new Date(),
        };

        sharedJob.comments.push(comment);
        await sharedJob.save();

        // Log team activity
        await TeamActivityLog.create({
            teamId,
            actorId: membership._id,
            actorName: membership.profile?.name || membership.email || "Team Member",
            actorRole: membership.role,
            action: "message_sent",
            targetType: "message",
            targetId: sharedJob._id,
            details: {
                jobTitle: sharedJob.jobSnapshot.title,
                company: sharedJob.jobSnapshot.company,
                commentPreview: content.substring(0, 100),
                type: "job_comment",
            },
        });

        res.status(201).json({
            message: "Comment added successfully",
            data: sharedJob.comments[sharedJob.comments.length - 1],
        });
    } catch (error) {
        console.error("Error adding comment:", error);
        res.status(500).json({ message: "Failed to add comment", error: error.message });
    }
};

/**
 * Delete a comment from a shared job
 * DELETE /api/teams/:teamId/shared-jobs/:sharedJobId/comments/:commentId
 */
export const deleteComment = async (req, res) => {
    try {
        const { teamId, sharedJobId, commentId } = req.params;
        const userId = req.auth?.userId;
        
        // Use membership from middleware
        const membership = req.membership;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (!membership) {
            return res.status(403).json({ message: "Not a member of this team" });
        }

        const sharedJob = await SharedJob.findOne({ _id: sharedJobId, teamId });
        if (!sharedJob) {
            return res.status(404).json({ message: "Shared job not found" });
        }

        const commentIndex = sharedJob.comments.findIndex(
            (c) => c._id.toString() === commentId && c.userId === userId
        );

        if (commentIndex === -1) {
            // Check if user is admin/owner and can delete any comment
            if (!["owner", "admin"].includes(membership.role)) {
                return res.status(403).json({ message: "Can only delete your own comments" });
            }
            const adminCommentIndex = sharedJob.comments.findIndex(
                (c) => c._id.toString() === commentId
            );
            if (adminCommentIndex === -1) {
                return res.status(404).json({ message: "Comment not found" });
            }
            sharedJob.comments.splice(adminCommentIndex, 1);
        } else {
            sharedJob.comments.splice(commentIndex, 1);
        }

        await sharedJob.save();

        res.json({ message: "Comment deleted successfully" });
    } catch (error) {
        console.error("Error deleting comment:", error);
        res.status(500).json({ message: "Failed to delete comment", error: error.message });
    }
};

/**
 * Add a reaction to a shared job
 * POST /api/teams/:teamId/shared-jobs/:sharedJobId/reactions
 */
export const addReaction = async (req, res) => {
    try {
        const { teamId, sharedJobId } = req.params;
        const { type } = req.body;
        const userId = req.auth?.userId;
        
        // Use membership from middleware
        const membership = req.membership;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (!["interested", "applied", "recommended", "not_interested"].includes(type)) {
            return res.status(400).json({ message: "Invalid reaction type" });
        }

        if (!membership) {
            return res.status(403).json({ message: "Not a member of this team" });
        }

        const sharedJob = await SharedJob.findOne({ _id: sharedJobId, teamId });
        if (!sharedJob) {
            return res.status(404).json({ message: "Shared job not found" });
        }

        // Remove existing reaction from this user
        sharedJob.reactions = sharedJob.reactions.filter((r) => r.userId !== userId);

        // Add new reaction
        sharedJob.reactions.push({
            userId,
            userName: membership.profile?.name || membership.email || "Team Member",
            type,
            createdAt: new Date(),
        });

        await sharedJob.save();

        res.json({
            message: "Reaction added successfully",
            data: sharedJob.reactions,
        });
    } catch (error) {
        console.error("Error adding reaction:", error);
        res.status(500).json({ message: "Failed to add reaction", error: error.message });
    }
};

/**
 * Get team benchmarking/comparison data
 * GET /api/teams/:teamId/benchmarking
 */
export const getTeamBenchmarking = async (req, res) => {
    try {
        const { teamId } = req.params;
        const userId = req.auth?.userId;
        
        // Use membership from middleware
        const membership = req.membership;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (!membership) {
            return res.status(403).json({ message: "Not a member of this team" });
        }

        // Get all active team members and populate their User records to get clerk userId (auth0Id)
        const members = await TeamMember.find({
            teamId,
            status: "active",
            role: { $in: ["candidate", "member"] },
        }).populate('userId', 'auth0Id').lean();

        // Extract clerk userIds (stored in User.auth0Id field) for Job queries
        const memberUserIds = members
            .filter((m) => m.userId && m.userId.auth0Id)
            .map((m) => m.userId.auth0Id);

        // Get aggregate job statistics for all team members
        const [jobStats, interviewStats] = await Promise.all([
            Job.aggregate([
                { $match: { userId: { $in: memberUserIds } } },
                {
                    $group: {
                        _id: "$userId",
                        totalJobs: { $sum: 1 },
                        applied: { $sum: { $cond: [{ $eq: ["$status", "Applied"] }, 1, 0] } },
                        interviewing: { $sum: { $cond: [{ $eq: ["$status", "Interview"] }, 1, 0] } },
                        offers: { $sum: { $cond: [{ $eq: ["$status", "Offer"] }, 1, 0] } },
                        rejected: { $sum: { $cond: [{ $eq: ["$status", "Rejected"] }, 1, 0] } },
                    },
                },
            ]),
            // Mock interview stats if Interview model exists
            Promise.resolve([]),
        ]);

        // Calculate anonymized benchmarks
        const statsArray = jobStats.map((s) => ({
            totalJobs: s.totalJobs,
            applied: s.applied,
            interviewing: s.interviewing,
            offers: s.offers,
            rejected: s.rejected,
            conversionRate: s.applied > 0 ? ((s.interviewing + s.offers) / s.applied * 100).toFixed(1) : 0,
            successRate: s.totalJobs > 0 ? (s.offers / s.totalJobs * 100).toFixed(1) : 0,
        }));

        // Calculate team averages
        const teamAverages = {
            avgTotalJobs: statsArray.length > 0 
                ? (statsArray.reduce((a, b) => a + b.totalJobs, 0) / statsArray.length).toFixed(1) 
                : 0,
            avgApplied: statsArray.length > 0 
                ? (statsArray.reduce((a, b) => a + b.applied, 0) / statsArray.length).toFixed(1) 
                : 0,
            avgInterviewing: statsArray.length > 0 
                ? (statsArray.reduce((a, b) => a + b.interviewing, 0) / statsArray.length).toFixed(1) 
                : 0,
            avgOffers: statsArray.length > 0 
                ? (statsArray.reduce((a, b) => a + b.offers, 0) / statsArray.length).toFixed(1) 
                : 0,
            avgConversionRate: statsArray.length > 0 
                ? (statsArray.reduce((a, b) => a + parseFloat(b.conversionRate), 0) / statsArray.length).toFixed(1) 
                : 0,
            avgSuccessRate: statsArray.length > 0 
                ? (statsArray.reduce((a, b) => a + parseFloat(b.successRate), 0) / statsArray.length).toFixed(1) 
                : 0,
        };

        // Find user's stats (anonymized position)
        const userStats = jobStats.find((s) => s._id === userId);
        const userPosition = userStats ? {
            totalJobs: userStats.totalJobs,
            applied: userStats.applied,
            interviewing: userStats.interviewing,
            offers: userStats.offers,
            conversionRate: userStats.applied > 0 
                ? ((userStats.interviewing + userStats.offers) / userStats.applied * 100).toFixed(1) 
                : 0,
            successRate: userStats.totalJobs > 0 
                ? (userStats.offers / userStats.totalJobs * 100).toFixed(1) 
                : 0,
        } : null;

        // Calculate percentile rankings (anonymized)
        const calculatePercentile = (value, array) => {
            if (array.length === 0) return 50;
            const sorted = [...array].sort((a, b) => a - b);
            const index = sorted.findIndex((v) => v >= value);
            return Math.round((index / sorted.length) * 100);
        };

        const userPercentiles = userPosition ? {
            totalJobsPercentile: calculatePercentile(userPosition.totalJobs, statsArray.map(s => s.totalJobs)),
            appliedPercentile: calculatePercentile(userPosition.applied, statsArray.map(s => s.applied)),
            conversionPercentile: calculatePercentile(parseFloat(userPosition.conversionRate), statsArray.map(s => parseFloat(s.conversionRate))),
            successPercentile: calculatePercentile(parseFloat(userPosition.successRate), statsArray.map(s => parseFloat(s.successRate))),
        } : null;

        // Top performers (anonymized)
        const topPerformers = {
            mostApplications: statsArray.length > 0 ? Math.max(...statsArray.map(s => s.applied)) : 0,
            mostInterviews: statsArray.length > 0 ? Math.max(...statsArray.map(s => s.interviewing)) : 0,
            mostOffers: statsArray.length > 0 ? Math.max(...statsArray.map(s => s.offers)) : 0,
            highestConversion: statsArray.length > 0 ? Math.max(...statsArray.map(s => parseFloat(s.conversionRate))) : 0,
        };

        // Activity trends (last 4 weeks)
        const fourWeeksAgo = new Date();
        fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

        const weeklyTrends = await Job.aggregate([
            {
                $match: {
                    userId: { $in: memberUserIds },
                    createdAt: { $gte: fourWeeksAgo },
                },
            },
            {
                $group: {
                    _id: {
                        week: { $week: "$createdAt" },
                        year: { $year: "$createdAt" },
                    },
                    count: { $sum: 1 },
                },
            },
            { $sort: { "_id.year": 1, "_id.week": 1 } },
        ]);

        res.json({
            data: {
                teamSize: members.length,
                teamAverages,
                userStats: userPosition,
                userPercentiles,
                topPerformers,
                weeklyTrends,
                insights: generateInsights(userPosition, teamAverages, userPercentiles),
            },
        });
    } catch (error) {
        console.error("Error getting team benchmarking:", error);
        res.status(500).json({ message: "Failed to get benchmarking data", error: error.message });
    }
};

// Helper function to generate insights
function generateInsights(userStats, teamAverages, percentiles) {
    const insights = [];

    if (!userStats || !percentiles) {
        return ["Start tracking your job applications to see how you compare to the team!"];
    }

    if (percentiles.appliedPercentile >= 75) {
        insights.push("🌟 You're in the top 25% for application volume! Great hustle!");
    } else if (percentiles.appliedPercentile < 25) {
        insights.push("💪 Consider increasing your application volume to match team average.");
    }

    if (percentiles.conversionPercentile >= 75) {
        insights.push("🎯 Your application-to-interview conversion rate is excellent!");
    } else if (percentiles.conversionPercentile < 25) {
        insights.push("📝 Focus on tailoring applications to improve conversion rates.");
    }

    if (parseFloat(userStats.successRate) > parseFloat(teamAverages.avgSuccessRate)) {
        insights.push("🏆 Your success rate is above team average!");
    }

    if (userStats.offers > 0) {
        insights.push("🎉 Congratulations on your offers! You're doing great!");
    }

    if (insights.length === 0) {
        insights.push("📊 Keep tracking your progress to unlock more insights!");
    }

    return insights;
}

/**
 * Archive/unarchive a shared job
 * PUT /api/teams/:teamId/shared-jobs/:sharedJobId/status
 */
export const updateSharedJobStatus = async (req, res) => {
    try {
        const { teamId, sharedJobId } = req.params;
        const { status } = req.body;
        const userId = req.auth?.userId;
        
        // Use membership from middleware
        const membership = req.membership;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (!["active", "archived", "closed"].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        if (!membership) {
            return res.status(403).json({ message: "Not a member of this team" });
        }

        const sharedJob = await SharedJob.findOne({ _id: sharedJobId, teamId });
        if (!sharedJob) {
            return res.status(404).json({ message: "Shared job not found" });
        }

        // Only the person who shared or admins can update status
        if (sharedJob.sharedBy.userId !== userId && !["owner", "admin"].includes(membership.role)) {
            return res.status(403).json({ message: "Not authorized to update this shared job" });
        }

        sharedJob.status = status;
        await sharedJob.save();

        res.json({
            message: "Shared job status updated",
            data: sharedJob,
        });
    } catch (error) {
        console.error("Error updating shared job status:", error);
        res.status(500).json({ message: "Failed to update status", error: error.message });
    }
};
