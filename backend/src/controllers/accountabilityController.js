import crypto from "crypto";
import mongoose from "mongoose";
import {
    AccountabilityPartnership,
    ProgressShare,
    Achievement,
    AccountabilityMessage,
    AccountabilityInsights,
} from "../models/AccountabilityPartner.js";
import { User } from "../models/User.js";
import Goal from "../models/Goal.js";
import { Job } from "../models/Job.js";
import { Interview } from "../models/Interview.js";

// ===== HELPER FUNCTIONS =====

/**
 * Get MongoDB user from Clerk userId
 */
const getUserFromAuth = async (clerkUserId) => {
    return await User.findOne({ auth0Id: clerkUserId });
};

/**
 * Calculate next check-in date based on schedule
 */
const calculateNextCheckIn = (schedule) => {
    const now = new Date();
    const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const targetDayIndex = daysOfWeek.indexOf(schedule.preferredDay);
    const currentDayIndex = now.getDay();

    let daysUntilNext = targetDayIndex - currentDayIndex;
    if (daysUntilNext <= 0) {
        daysUntilNext += 7;
    }

    // Adjust based on frequency
    if (schedule.frequency === "biweekly") {
        daysUntilNext += 7;
    } else if (schedule.frequency === "monthly") {
        daysUntilNext = 28;
    } else if (schedule.frequency === "daily") {
        daysUntilNext = 1;
    }

    const nextDate = new Date(now);
    nextDate.setDate(now.getDate() + daysUntilNext);

    // Set preferred time
    const [hours, minutes] = (schedule.preferredTime || "09:00").split(":");
    nextDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    return nextDate;
};

/**
 * Check and award achievements
 */
const checkAndAwardAchievements = async (userId) => {
    const achievements = [];

    // Get user stats
    const jobsApplied = await Job.countDocuments({ userId, status: { $ne: "Interested" } });
    const interviews = await Interview.countDocuments({ userId });
    const offers = await Job.countDocuments({ userId, status: "Offer" });
    const goalsCompleted = await Goal.countDocuments({ userId, status: "completed" });

    // Check for first application
    if (jobsApplied === 1) {
        const existing = await Achievement.findOne({ userId, type: "first_application" });
        if (!existing) {
            achievements.push({
                userId,
                type: "first_application",
                title: "First Step",
                description: "Submitted your first job application!",
                badge: { icon: "rocket", color: "blue", tier: "bronze" },
                threshold: { metric: "applications", value: 1 },
                points: 10,
            });
        }
    }

    // Application milestones
    const appMilestones = [5, 10, 25, 50, 100];
    for (const milestone of appMilestones) {
        if (jobsApplied >= milestone) {
            const existing = await Achievement.findOne({
                userId,
                type: "applications_milestone",
                "threshold.value": milestone,
            });
            if (!existing) {
                const tier = milestone >= 100 ? "diamond" : milestone >= 50 ? "platinum" : milestone >= 25 ? "gold" : milestone >= 10 ? "silver" : "bronze";
                achievements.push({
                    userId,
                    type: "applications_milestone",
                    title: `${milestone} Applications`,
                    description: `Applied to ${milestone} jobs!`,
                    badge: { icon: "briefcase", color: "green", tier },
                    threshold: { metric: "applications", value: milestone },
                    points: milestone * 2,
                });
            }
        }
    }

    // First interview
    if (interviews === 1) {
        const existing = await Achievement.findOne({ userId, type: "first_interview" });
        if (!existing) {
            achievements.push({
                userId,
                type: "first_interview",
                title: "Interview Ready",
                description: "Scheduled your first interview!",
                badge: { icon: "calendar", color: "purple", tier: "silver" },
                threshold: { metric: "interviews", value: 1 },
                points: 25,
            });
        }
    }

    // First offer
    if (offers >= 1) {
        const existing = await Achievement.findOne({ userId, type: "first_offer" });
        if (!existing) {
            achievements.push({
                userId,
                type: "first_offer",
                title: "Offer Received!",
                description: "Congratulations on receiving your first job offer!",
                badge: { icon: "trophy", color: "gold", tier: "gold" },
                threshold: { metric: "offers", value: 1 },
                points: 100,
            });
        }
    }

    // Goal completion milestones
    if (goalsCompleted >= 1) {
        const existing = await Achievement.findOne({ userId, type: "goal_completed" });
        if (!existing) {
            achievements.push({
                userId,
                type: "goal_completed",
                title: "Goal Getter",
                description: "Completed your first goal!",
                badge: { icon: "target", color: "teal", tier: "bronze" },
                threshold: { metric: "goals", value: 1 },
                points: 15,
            });
        }
    }

    // Save new achievements
    if (achievements.length > 0) {
        await Achievement.insertMany(achievements);
    }

    return achievements;
};

// ===== PARTNERSHIP MANAGEMENT =====

/**
 * Invite an accountability partner
 * POST /api/accountability/partners/invite
 */
export const invitePartner = async (req, res) => {
    try {
        const {
            partnerEmail,
            partnerName,
            partnerType,
            invitationMessage,
            privacySettings,
            checkInSchedule,
            accountabilityAreas,
            targetMetrics,
        } = req.body;
        const clerkUserId = req.auth.userId;

        if (!partnerEmail) {
            return res.status(400).json({
                success: false,
                message: "Partner email is required",
            });
        }

        const currentUser = await getUserFromAuth(clerkUserId);
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: "User profile not found",
            });
        }

        // Check for existing partnership
        const existingPartnership = await AccountabilityPartnership.findOne({
            userId: currentUser._id,
            partnerEmail: partnerEmail.toLowerCase(),
            status: { $in: ["pending", "active"] },
        });

        if (existingPartnership) {
            return res.status(409).json({
                success: false,
                message: existingPartnership.status === "pending"
                    ? "Pending invitation already exists for this partner"
                    : "Active partnership already exists with this partner",
            });
        }

        // Create partnership
        const partnership = new AccountabilityPartnership({
            userId: currentUser._id,
            partnerEmail: partnerEmail.toLowerCase(),
            partnerName: partnerName || "",
            partnerType: partnerType || "peer",
            invitationMessage,
            privacySettings: privacySettings || {},
            checkInSchedule: checkInSchedule || {},
            accountabilityAreas: accountabilityAreas || ["applications_per_week", "goal_completion"],
            targetMetrics: targetMetrics || {},
        });

        // Calculate next check-in
        partnership.checkInSchedule.nextCheckIn = calculateNextCheckIn(partnership.checkInSchedule);

        await partnership.save();

        // Check if partner already exists as user
        const partnerUser = await User.findOne({ email: partnerEmail.toLowerCase() });
        if (partnerUser) {
            partnership.partnerId = partnerUser._id;
            await partnership.save();
        }

        // TODO: Send invitation email

        res.status(201).json({
            success: true,
            message: "Partnership invitation sent successfully",
            data: {
                partnershipId: partnership._id,
                invitationToken: partnership.invitationToken,
                status: partnership.status,
            },
        });
    } catch (error) {
        console.error("Error inviting partner:", error);
        res.status(500).json({
            success: false,
            message: "Failed to send partnership invitation",
            error: error.message,
        });
    }
};

/**
 * Accept partnership invitation
 * POST /api/accountability/partners/accept/:token
 */
export const acceptPartnerInvitation = async (req, res) => {
    try {
        const { token } = req.params;
        const clerkUserId = req.auth.userId;

        const partnership = await AccountabilityPartnership.findOne({
            invitationToken: token,
            status: "pending",
        });

        if (!partnership) {
            return res.status(404).json({
                success: false,
                message: "Invalid or expired invitation",
            });
        }

        if (partnership.invitationExpiresAt < new Date()) {
            return res.status(400).json({
                success: false,
                message: "This invitation has expired",
            });
        }

        const currentUser = await getUserFromAuth(clerkUserId);
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: "User profile not found",
            });
        }

        // Update partnership
        partnership.partnerId = currentUser._id;
        partnership.status = "active";
        partnership.acceptedAt = new Date();
        partnership.checkInSchedule.nextCheckIn = calculateNextCheckIn(partnership.checkInSchedule);
        await partnership.save();

        res.status(200).json({
            success: true,
            message: "Partnership accepted successfully",
            data: partnership,
        });
    } catch (error) {
        console.error("Error accepting partnership:", error);
        res.status(500).json({
            success: false,
            message: "Failed to accept partnership",
            error: error.message,
        });
    }
};

/**
 * Get my partnerships (as user)
 * GET /api/accountability/partners
 */
export const getMyPartnerships = async (req, res) => {
    try {
        const clerkUserId = req.auth.userId;
        const currentUser = await getUserFromAuth(clerkUserId);

        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: "User profile not found",
            });
        }

        const partnerships = await AccountabilityPartnership.find({
            $or: [
                { userId: currentUser._id },
                { partnerId: currentUser._id },
            ],
            status: { $in: ["pending", "active", "paused"] },
        }).populate("userId partnerId", "firstName lastName email picture");

        res.status(200).json({
            success: true,
            data: partnerships,
        });
    } catch (error) {
        console.error("Error fetching partnerships:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch partnerships",
            error: error.message,
        });
    }
};

/**
 * Update partnership settings
 * PUT /api/accountability/partners/:partnershipId
 */
export const updatePartnership = async (req, res) => {
    try {
        const { partnershipId } = req.params;
        const { privacySettings, checkInSchedule, accountabilityAreas, targetMetrics, status } = req.body;
        const clerkUserId = req.auth.userId;

        const currentUser = await getUserFromAuth(clerkUserId);
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: "User profile not found",
            });
        }

        const partnership = await AccountabilityPartnership.findById(partnershipId);
        if (!partnership) {
            return res.status(404).json({
                success: false,
                message: "Partnership not found",
            });
        }

        // Verify ownership
        if (!partnership.userId.equals(currentUser._id) && !partnership.partnerId?.equals(currentUser._id)) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to update this partnership",
            });
        }

        // Update allowed fields
        if (privacySettings) {
            partnership.privacySettings = { ...partnership.privacySettings, ...privacySettings };
        }
        if (checkInSchedule) {
            partnership.checkInSchedule = { ...partnership.checkInSchedule, ...checkInSchedule };
            partnership.checkInSchedule.nextCheckIn = calculateNextCheckIn(partnership.checkInSchedule);
        }
        if (accountabilityAreas) {
            partnership.accountabilityAreas = accountabilityAreas;
        }
        if (targetMetrics) {
            partnership.targetMetrics = { ...partnership.targetMetrics, ...targetMetrics };
        }
        if (status && ["active", "paused", "ended"].includes(status)) {
            partnership.status = status;
            if (status === "ended") {
                partnership.endedAt = new Date();
            }
        }

        await partnership.save();

        res.status(200).json({
            success: true,
            message: "Partnership updated successfully",
            data: partnership,
        });
    } catch (error) {
        console.error("Error updating partnership:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update partnership",
            error: error.message,
        });
    }
};

/**
 * End/remove partnership
 * DELETE /api/accountability/partners/:partnershipId
 */
export const endPartnership = async (req, res) => {
    try {
        const { partnershipId } = req.params;
        const clerkUserId = req.auth.userId;

        const currentUser = await getUserFromAuth(clerkUserId);
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: "User profile not found",
            });
        }

        const partnership = await AccountabilityPartnership.findById(partnershipId);
        if (!partnership) {
            return res.status(404).json({
                success: false,
                message: "Partnership not found",
            });
        }

        // Verify ownership
        if (!partnership.userId.equals(currentUser._id) && !partnership.partnerId?.equals(currentUser._id)) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to end this partnership",
            });
        }

        partnership.status = "ended";
        partnership.endedAt = new Date();
        await partnership.save();

        res.status(200).json({
            success: true,
            message: "Partnership ended successfully",
        });
    } catch (error) {
        console.error("Error ending partnership:", error);
        res.status(500).json({
            success: false,
            message: "Failed to end partnership",
            error: error.message,
        });
    }
};

// ===== PROGRESS SHARING =====

/**
 * Create and share a progress report
 * POST /api/accountability/progress
 */
export const shareProgress = async (req, res) => {
    try {
        const {
            partnershipIds,
            shareType,
            reportPeriod,
            content,
            milestones,
            challenges,
            commitments,
            motivation,
            isPublic,
        } = req.body;
        const clerkUserId = req.auth.userId;

        const currentUser = await getUserFromAuth(clerkUserId);
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: "User profile not found",
            });
        }

        // Calculate metrics for the period
        const startDate = reportPeriod?.startDate ? new Date(reportPeriod.startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const endDate = reportPeriod?.endDate ? new Date(reportPeriod.endDate) : new Date();

        // Get jobs applied in period
        const jobsApplied = await Job.countDocuments({
            userId: currentUser._id,
            status: { $ne: "Interested" },
            appliedDate: { $gte: startDate, $lte: endDate },
        });

        // Get interviews in period
        const interviewsScheduled = await Interview.countDocuments({
            userId: currentUser._id,
            scheduledDate: { $gte: startDate, $lte: endDate },
        });

        // Get goal progress
        const goals = await Goal.find({ userId: currentUser._id });
        const goalProgress = goals.map((goal) => ({
            goalId: goal._id,
            title: goal.title,
            targetValue: goal.measurable?.targetValue || 100,
            currentValue: goal.measurable?.currentValue || 0,
            percentComplete: goal.measurable?.targetValue
                ? Math.round((goal.measurable.currentValue / goal.measurable.targetValue) * 100)
                : 0,
            status: goal.status,
        }));

        // Prepare shared with array
        const sharedWith = partnershipIds?.map((id) => ({
            partnershipId: id,
        })) || [];

        // Create progress share
        const progressShare = new ProgressShare({
            userId: currentUser._id,
            sharedWith,
            shareType: shareType || "progress_report",
            reportPeriod: {
                startDate,
                endDate,
                periodType: reportPeriod?.periodType || "weekly",
            },
            content: content || {
                title: `Progress Update - ${new Date().toLocaleDateString()}`,
                summary: "",
            },
            metrics: {
                jobsApplied,
                interviewsScheduled,
                goalsCompleted: goals.filter((g) => g.status === "completed").length,
                goalsInProgress: goals.filter((g) => g.status === "in_progress").length,
            },
            goalProgress,
            milestones: milestones || [],
            challenges: challenges || [],
            commitments: commitments || [],
            motivation: motivation || { level: 3 },
            accessControl: {
                isPublic: isPublic || false,
            },
        });

        await progressShare.save();

        // Update partnership engagement stats
        if (partnershipIds?.length > 0) {
            await AccountabilityPartnership.updateMany(
                { _id: { $in: partnershipIds } },
                { $set: { "engagementStats.lastEngagement": new Date() } }
            );
        }

        // Check for new achievements
        const newAchievements = await checkAndAwardAchievements(currentUser._id);

        res.status(201).json({
            success: true,
            message: "Progress shared successfully",
            data: {
                progressShare,
                shareToken: progressShare.shareToken,
                newAchievements,
            },
        });
    } catch (error) {
        console.error("Error sharing progress:", error);
        res.status(500).json({
            success: false,
            message: "Failed to share progress",
            error: error.message,
        });
    }
};

/**
 * Get progress shares for current user
 * GET /api/accountability/progress
 */
export const getMyProgressShares = async (req, res) => {
    try {
        const clerkUserId = req.auth.userId;
        const { limit = 20, shareType } = req.query;

        const currentUser = await getUserFromAuth(clerkUserId);
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: "User profile not found",
            });
        }

        const query = { userId: currentUser._id };
        if (shareType) {
            query.shareType = shareType;
        }

        const shares = await ProgressShare.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .populate("sharedWith.partnershipId");

        res.status(200).json({
            success: true,
            data: shares,
        });
    } catch (error) {
        console.error("Error fetching progress shares:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch progress shares",
            error: error.message,
        });
    }
};

/**
 * Get shared progress (for partners viewing)
 * GET /api/accountability/progress/shared/:partnershipId
 */
export const getSharedProgress = async (req, res) => {
    try {
        const { partnershipId } = req.params;
        const { limit = 20 } = req.query;
        const clerkUserId = req.auth.userId;

        const currentUser = await getUserFromAuth(clerkUserId);
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: "User profile not found",
            });
        }

        // Verify access to partnership
        const partnership = await AccountabilityPartnership.findById(partnershipId);
        if (!partnership) {
            return res.status(404).json({
                success: false,
                message: "Partnership not found",
            });
        }

        if (!partnership.partnerId?.equals(currentUser._id) && !partnership.userId.equals(currentUser._id)) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to view this progress",
            });
        }

        // Get progress shares for this partnership
        const shares = await ProgressShare.find({
            "sharedWith.partnershipId": partnershipId,
        })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .populate("userId", "firstName lastName picture");

        // Mark as viewed
        for (const share of shares) {
            const sharedWithEntry = share.sharedWith.find(
                (sw) => sw.partnershipId.toString() === partnershipId
            );
            if (sharedWithEntry && !sharedWithEntry.viewedAt) {
                sharedWithEntry.viewedAt = new Date();
                share.engagement.views += 1;
                await share.save();
            }
        }

        res.status(200).json({
            success: true,
            data: shares,
        });
    } catch (error) {
        console.error("Error fetching shared progress:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch shared progress",
            error: error.message,
        });
    }
};

/**
 * View progress by share token (public/semi-public)
 * GET /api/accountability/progress/view/:token
 */
export const viewProgressByToken = async (req, res) => {
    try {
        const { token } = req.params;

        const share = await ProgressShare.findOne({ shareToken: token })
            .populate("userId", "firstName lastName picture");

        if (!share) {
            return res.status(404).json({
                success: false,
                message: "Progress share not found",
            });
        }

        // Check if expired
        if (share.accessControl.expiresAt && share.accessControl.expiresAt < new Date()) {
            return res.status(410).json({
                success: false,
                message: "This progress share has expired",
            });
        }

        // Increment view count
        share.engagement.views += 1;
        await share.save();

        res.status(200).json({
            success: true,
            data: share,
        });
    } catch (error) {
        console.error("Error viewing progress:", error);
        res.status(500).json({
            success: false,
            message: "Failed to view progress",
            error: error.message,
        });
    }
};

/**
 * Add encouragement to a progress share
 * POST /api/accountability/progress/:shareId/encourage
 */
export const addEncouragement = async (req, res) => {
    try {
        const { shareId } = req.params;
        const { message, type } = req.body;
        const clerkUserId = req.auth.userId;

        const currentUser = await getUserFromAuth(clerkUserId);
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: "User profile not found",
            });
        }

        const share = await ProgressShare.findById(shareId);
        if (!share) {
            return res.status(404).json({
                success: false,
                message: "Progress share not found",
            });
        }

        // Add encouragement
        share.engagement.encouragements.push({
            fromPartnerId: currentUser._id,
            message: message || "Great progress! Keep going! 🎉",
            type: type || "encouragement",
        });

        await share.save();

        // Update partnership engagement stats
        const sharedPartnership = share.sharedWith.find(
            (sw) => sw.partnershipId
        );
        if (sharedPartnership) {
            await AccountabilityPartnership.findByIdAndUpdate(
                sharedPartnership.partnershipId,
                {
                    $inc: {
                        "engagementStats.encouragementsSent": 1,
                    },
                    $set: {
                        "engagementStats.lastEngagement": new Date(),
                    },
                }
            );

            // Also update the share owner's received count
            const partnership = await AccountabilityPartnership.findById(sharedPartnership.partnershipId);
            if (partnership && partnership.userId) {
                // The share owner gets the encouragement
                await AccountabilityPartnership.findByIdAndUpdate(
                    sharedPartnership.partnershipId,
                    {
                        $inc: { "engagementStats.encouragementsReceived": 1 },
                    }
                );
            }
        }

        res.status(200).json({
            success: true,
            message: "Encouragement added",
            data: share.engagement.encouragements,
        });
    } catch (error) {
        console.error("Error adding encouragement:", error);
        res.status(500).json({
            success: false,
            message: "Failed to add encouragement",
            error: error.message,
        });
    }
};

// ===== ACHIEVEMENTS =====

/**
 * Get user achievements
 * GET /api/accountability/achievements
 */
export const getAchievements = async (req, res) => {
    try {
        const clerkUserId = req.auth.userId;

        const currentUser = await getUserFromAuth(clerkUserId);
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: "User profile not found",
            });
        }

        // Check for any new achievements first
        await checkAndAwardAchievements(currentUser._id);

        const achievements = await Achievement.find({ userId: currentUser._id })
            .sort({ achievedAt: -1 });

        // Calculate total points
        const totalPoints = achievements.reduce((sum, a) => sum + (a.points || 0), 0);

        res.status(200).json({
            success: true,
            data: {
                achievements,
                totalPoints,
                count: achievements.length,
            },
        });
    } catch (error) {
        console.error("Error fetching achievements:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch achievements",
            error: error.message,
        });
    }
};

/**
 * Celebrate an achievement
 * POST /api/accountability/achievements/:achievementId/celebrate
 */
export const celebrateAchievement = async (req, res) => {
    try {
        const { achievementId } = req.params;
        const { partnershipIds } = req.body;
        const clerkUserId = req.auth.userId;

        const currentUser = await getUserFromAuth(clerkUserId);
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: "User profile not found",
            });
        }

        const achievement = await Achievement.findById(achievementId);
        if (!achievement) {
            return res.status(404).json({
                success: false,
                message: "Achievement not found",
            });
        }

        if (!achievement.userId.equals(currentUser._id)) {
            return res.status(403).json({
                success: false,
                message: "Not authorized",
            });
        }

        achievement.celebration.celebrated = true;
        achievement.celebration.celebratedAt = new Date();

        if (partnershipIds?.length > 0) {
            achievement.celebration.sharedWith = partnershipIds.map((id) => ({
                partnershipId: id,
                celebratedAt: new Date(),
            }));
        }

        await achievement.save();

        // Create a milestone progress share for partners
        if (partnershipIds?.length > 0) {
            const progressShare = new ProgressShare({
                userId: currentUser._id,
                sharedWith: partnershipIds.map((id) => ({ partnershipId: id })),
                shareType: "achievement",
                content: {
                    title: `🎉 Achievement Unlocked: ${achievement.title}`,
                    summary: achievement.description,
                },
                milestones: [{
                    title: achievement.title,
                    description: achievement.description,
                    achievedAt: achievement.achievedAt,
                    category: "other",
                    significance: achievement.badge.tier === "diamond" ? "exceptional" :
                        achievement.badge.tier === "gold" || achievement.badge.tier === "platinum" ? "major" : "moderate",
                }],
            });
            await progressShare.save();
        }

        res.status(200).json({
            success: true,
            message: "Achievement celebrated!",
            data: achievement,
        });
    } catch (error) {
        console.error("Error celebrating achievement:", error);
        res.status(500).json({
            success: false,
            message: "Failed to celebrate achievement",
            error: error.message,
        });
    }
};

// ===== MESSAGING =====

/**
 * Send message to partner
 * POST /api/accountability/messages
 */
export const sendMessage = async (req, res) => {
    try {
        const { partnershipId, content, messageType, attachments } = req.body;
        const clerkUserId = req.auth.userId;

        const currentUser = await getUserFromAuth(clerkUserId);
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: "User profile not found",
            });
        }

        const partnership = await AccountabilityPartnership.findById(partnershipId);
        if (!partnership) {
            return res.status(404).json({
                success: false,
                message: "Partnership not found",
            });
        }

        // Verify access
        const isUser = partnership.userId.equals(currentUser._id);
        const isPartner = partnership.partnerId?.equals(currentUser._id);
        if (!isUser && !isPartner) {
            return res.status(403).json({
                success: false,
                message: "Not authorized",
            });
        }

        // Determine recipient
        const recipientId = isUser ? partnership.partnerId : partnership.userId;
        if (!recipientId) {
            return res.status(400).json({
                success: false,
                message: "Partner hasn't accepted the invitation yet",
            });
        }

        const message = new AccountabilityMessage({
            partnershipId,
            senderId: currentUser._id,
            recipientId,
            content,
            messageType: messageType || "text",
            attachments: attachments || [],
        });

        await message.save();

        // Update engagement stats
        partnership.engagementStats.messagesExchanged += 1;
        partnership.engagementStats.lastEngagement = new Date();
        await partnership.save();

        res.status(201).json({
            success: true,
            message: "Message sent",
            data: message,
        });
    } catch (error) {
        console.error("Error sending message:", error);
        res.status(500).json({
            success: false,
            message: "Failed to send message",
            error: error.message,
        });
    }
};

/**
 * Get messages for partnership
 * GET /api/accountability/messages/:partnershipId
 */
export const getMessages = async (req, res) => {
    try {
        const { partnershipId } = req.params;
        const { limit = 50, before } = req.query;
        const clerkUserId = req.auth.userId;

        const currentUser = await getUserFromAuth(clerkUserId);
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: "User profile not found",
            });
        }

        const partnership = await AccountabilityPartnership.findById(partnershipId);
        if (!partnership) {
            return res.status(404).json({
                success: false,
                message: "Partnership not found",
            });
        }

        // Verify access
        if (!partnership.userId.equals(currentUser._id) && !partnership.partnerId?.equals(currentUser._id)) {
            return res.status(403).json({
                success: false,
                message: "Not authorized",
            });
        }

        const query = { partnershipId };
        if (before) {
            query.createdAt = { $lt: new Date(before) };
        }

        const messages = await AccountabilityMessage.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .populate("senderId recipientId", "firstName lastName picture");

        // Mark unread messages as read
        await AccountabilityMessage.updateMany(
            {
                partnershipId,
                recipientId: currentUser._id,
                isRead: false,
            },
            {
                $set: { isRead: true, readAt: new Date() },
            }
        );

        res.status(200).json({
            success: true,
            data: messages.reverse(),
        });
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch messages",
            error: error.message,
        });
    }
};

// ===== INSIGHTS & ANALYTICS =====

/**
 * Get accountability insights
 * GET /api/accountability/insights
 */
export const getInsights = async (req, res) => {
    try {
        const clerkUserId = req.auth.userId;

        const currentUser = await getUserFromAuth(clerkUserId);
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: "User profile not found",
            });
        }

        // Get or create insights
        let insights = await AccountabilityInsights.findOne({ userId: currentUser._id });

        // Calculate fresh insights
        const partnerships = await AccountabilityPartnership.find({
            $or: [{ userId: currentUser._id }, { partnerId: currentUser._id }],
            status: "active",
        });

        const totalPartnersCount = partnerships.length;
        const activePartnersCount = partnerships.filter(
            (p) => p.engagementStats.lastEngagement &&
                new Date() - p.engagementStats.lastEngagement < 7 * 24 * 60 * 60 * 1000
        ).length;

        // Calculate averages
        const avgEngagementRate = partnerships.length > 0
            ? partnerships.reduce((sum, p) => sum + (p.engagementStats.totalCheckIns || 0), 0) / partnerships.length
            : 0;

        // Get current month stats
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const jobsThisMonth = await Job.countDocuments({
            userId: currentUser._id,
            status: { $ne: "Interested" },
            appliedDate: { $gte: monthStart },
        });

        const interviewsThisMonth = await Interview.countDocuments({
            userId: currentUser._id,
            scheduledDate: { $gte: monthStart },
        });

        const goalsCompletedThisMonth = await Goal.countDocuments({
            userId: currentUser._id,
            status: "completed",
            updatedAt: { $gte: monthStart },
        });

        // Calculate weekly rate
        const weeklyApps = Math.round(jobsThisMonth / 4);

        // Update or create insights
        const insightsData = {
            userId: currentUser._id,
            partnerEngagement: {
                totalPartners: totalPartnersCount,
                activePartners: activePartnersCount,
                averageEngagementRate: avgEngagementRate,
            },
            impactMetrics: {
                withAccountability: {
                    applicationsPerWeek: weeklyApps,
                    interviewsPerMonth: interviewsThisMonth,
                    goalsCompletedPerMonth: goalsCompletedThisMonth,
                    consistencyScore: Math.min(100, activePartnersCount * 20 + weeklyApps * 5),
                },
            },
            streaks: {
                currentStreak: partnerships.reduce((max, p) => Math.max(max, p.engagementStats.streakDays || 0), 0),
                longestStreak: partnerships.reduce((max, p) => Math.max(max, p.engagementStats.longestStreak || 0), 0),
            },
            lastCalculatedAt: new Date(),
        };

        // Calculate accountability score
        const score = Math.min(100, Math.round(
            (activePartnersCount * 10) +
            (weeklyApps * 5) +
            (interviewsThisMonth * 10) +
            (goalsCompletedThisMonth * 15) +
            (avgEngagementRate * 2)
        ));

        insightsData.accountabilityScore = {
            current: score,
            trend: "stable",
        };

        if (insights) {
            Object.assign(insights, insightsData);
            await insights.save();
        } else {
            insights = await AccountabilityInsights.create(insightsData);
        }

        res.status(200).json({
            success: true,
            data: insights,
        });
    } catch (error) {
        console.error("Error fetching insights:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch insights",
            error: error.message,
        });
    }
};

/**
 * Record a check-in
 * POST /api/accountability/check-in/:partnershipId
 */
export const recordCheckIn = async (req, res) => {
    try {
        const { partnershipId } = req.params;
        const { notes, motivation } = req.body;
        const clerkUserId = req.auth.userId;

        const currentUser = await getUserFromAuth(clerkUserId);
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: "User profile not found",
            });
        }

        const partnership = await AccountabilityPartnership.findById(partnershipId);
        if (!partnership) {
            return res.status(404).json({
                success: false,
                message: "Partnership not found",
            });
        }

        // Update check-in stats
        partnership.checkInSchedule.lastCheckIn = new Date();
        partnership.checkInSchedule.nextCheckIn = calculateNextCheckIn(partnership.checkInSchedule);
        partnership.engagementStats.totalCheckIns += 1;
        partnership.engagementStats.lastEngagement = new Date();

        // Update streak
        const lastCheckIn = partnership.checkInSchedule.lastCheckIn;
        const daysSinceLastCheckIn = lastCheckIn
            ? Math.floor((new Date() - lastCheckIn) / (24 * 60 * 60 * 1000))
            : 0;

        if (daysSinceLastCheckIn <= 7) {
            partnership.engagementStats.streakDays += 1;
            if (partnership.engagementStats.streakDays > partnership.engagementStats.longestStreak) {
                partnership.engagementStats.longestStreak = partnership.engagementStats.streakDays;
            }
        } else {
            partnership.engagementStats.streakDays = 1;
        }

        await partnership.save();

        // Create a check-in progress share
        const checkInShare = new ProgressShare({
            userId: currentUser._id,
            sharedWith: [{ partnershipId: partnership._id }],
            shareType: "check_in",
            content: {
                title: `Check-in - ${new Date().toLocaleDateString()}`,
                summary: notes || "Completed accountability check-in",
            },
            motivation: motivation || { level: 3 },
        });
        await checkInShare.save();

        // Check for streak achievement
        if (partnership.engagementStats.streakDays === 7) {
            const existing = await Achievement.findOne({
                userId: currentUser._id,
                type: "streak_milestone",
                "threshold.value": 7,
            });
            if (!existing) {
                await Achievement.create({
                    userId: currentUser._id,
                    type: "streak_milestone",
                    title: "Week Warrior",
                    description: "Maintained a 7-day check-in streak!",
                    badge: { icon: "fire", color: "orange", tier: "silver" },
                    threshold: { metric: "streak", value: 7 },
                    points: 30,
                });
            }
        }

        res.status(200).json({
            success: true,
            message: "Check-in recorded",
            data: {
                partnership,
                checkInShare,
                streak: partnership.engagementStats.streakDays,
            },
        });
    } catch (error) {
        console.error("Error recording check-in:", error);
        res.status(500).json({
            success: false,
            message: "Failed to record check-in",
            error: error.message,
        });
    }
};

/**
 * Generate weekly summary report
 * GET /api/accountability/weekly-summary
 */
export const getWeeklySummary = async (req, res) => {
    try {
        const clerkUserId = req.auth.userId;

        const currentUser = await getUserFromAuth(clerkUserId);
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: "User profile not found",
            });
        }

        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        // Get week's stats
        const jobsApplied = await Job.countDocuments({
            userId: currentUser._id,
            status: { $ne: "Interested" },
            appliedDate: { $gte: weekAgo },
        });

        const interviewsScheduled = await Interview.countDocuments({
            userId: currentUser._id,
            scheduledDate: { $gte: weekAgo },
        });

        const goalsCompleted = await Goal.countDocuments({
            userId: currentUser._id,
            status: "completed",
            updatedAt: { $gte: weekAgo },
        });

        // Get goals in progress
        const goalsInProgress = await Goal.find({
            userId: currentUser._id,
            status: "in_progress",
        });

        // Get recent achievements
        const recentAchievements = await Achievement.find({
            userId: currentUser._id,
            achievedAt: { $gte: weekAgo },
        });

        // Get partnerships
        const partnerships = await AccountabilityPartnership.find({
            $or: [{ userId: currentUser._id }, { partnerId: currentUser._id }],
            status: "active",
        }).populate("partnerId userId", "firstName lastName");

        // Calculate encouragements received
        const progressShares = await ProgressShare.find({
            userId: currentUser._id,
            createdAt: { $gte: weekAgo },
        });

        const encouragementsReceived = progressShares.reduce(
            (sum, share) => sum + (share.engagement?.encouragements?.length || 0),
            0
        );

        const summary = {
            period: {
                start: weekAgo,
                end: new Date(),
            },
            metrics: {
                jobsApplied,
                interviewsScheduled,
                goalsCompleted,
                goalsInProgress: goalsInProgress.length,
            },
            goalProgress: goalsInProgress.map((g) => ({
                title: g.title,
                percentComplete: g.measurable?.targetValue
                    ? Math.round((g.measurable.currentValue / g.measurable.targetValue) * 100)
                    : 0,
            })),
            achievements: recentAchievements,
            accountability: {
                activePartners: partnerships.length,
                encouragementsReceived,
                checkIns: progressShares.filter((s) => s.shareType === "check_in").length,
            },
        };

        res.status(200).json({
            success: true,
            data: summary,
        });
    } catch (error) {
        console.error("Error generating weekly summary:", error);
        res.status(500).json({
            success: false,
            message: "Failed to generate weekly summary",
            error: error.message,
        });
    }
};
