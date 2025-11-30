import { Team, TeamSubscription, TeamActivityLog } from "../models/Team.js";
import { User } from "../models/User.js";
import { TeamMember } from "../models/Team.js";

/**
 * Get team subscription details
 * GET /api/teams/:teamId/subscription
 */
export const getSubscription = async (req, res) => {
    try {
        const { teamId } = req.params;
        const clerkUserId = req.auth.userId;

        // Get user
        const user = await User.findOne({ auth0Id: clerkUserId });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Get team
        const team = await Team.findById(teamId);
        if (!team || team.isDeleted) {
            return res.status(404).json({
                success: false,
                message: "Team not found",
            });
        }

        // Check if user is a member
        const membership = await TeamMember.findOne({
            teamId: team._id,
            userId: user._id,
            status: "active",
        });

        if (!membership) {
            return res.status(403).json({
                success: false,
                message: "You are not a member of this team",
            });
        }

        // Get subscription
        const subscription = await TeamSubscription.findOne({ teamId: team._id });
        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: "Subscription not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: subscription,
        });
    } catch (error) {
        console.error("Error fetching subscription:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching subscription",
            error: error.message,
        });
    }
};

/**
 * Update team subscription plan
 * PUT /api/teams/:teamId/subscription
 */
export const updateSubscription = async (req, res) => {
    try {
        const { teamId } = req.params;
        const { plan, billingCycle, paymentMethod } = req.body;
        const clerkUserId = req.auth.userId;

        // Get user
        const user = await User.findOne({ auth0Id: clerkUserId });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Get team
        const team = await Team.findById(teamId);
        if (!team || team.isDeleted) {
            return res.status(404).json({
                success: false,
                message: "Team not found",
            });
        }

        // Check if user has billing permission
        const membership = await TeamMember.findOne({
            teamId: team._id,
            userId: user._id,
            status: "active",
        });

        if (!membership) {
            return res.status(403).json({
                success: false,
                message: "You are not a member of this team",
            });
        }

        // Check permission (owner or custom manageBilling permission)
        const hasManageBillingPermission =
            membership.role === "owner" ||
            (membership.permissions && membership.permissions.manageBilling === true);

        if (!hasManageBillingPermission) {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to manage billing",
            });
        }

        // Get subscription
        const subscription = await TeamSubscription.findOne({ teamId: team._id });
        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: "Subscription not found",
            });
        }

        // Define plan pricing and limits
        const planConfigs = {
            free: {
                price: 0,
                limits: {
                    maxMembers: 5,
                    maxCandidates: 5,
                    maxMentors: 1,
                    maxStorage: 1024, // 1GB
                    maxReportsPerMonth: 10,
                },
            },
            starter: {
                monthly: 29,
                annual: 290, // ~2 months free
                limits: {
                    maxMembers: 15,
                    maxCandidates: 10,
                    maxMentors: 3,
                    maxStorage: 5120, // 5GB
                    maxReportsPerMonth: 50,
                },
            },
            professional: {
                monthly: 99,
                annual: 990, // ~2 months free
                limits: {
                    maxMembers: 50,
                    maxCandidates: 40,
                    maxMentors: 10,
                    maxStorage: 20480, // 20GB
                    maxReportsPerMonth: 200,
                },
            },
            enterprise: {
                monthly: 299,
                annual: 2990, // ~2 months free
                limits: {
                    maxMembers: 999,
                    maxCandidates: 500,
                    maxMentors: 50,
                    maxStorage: 102400, // 100GB
                    maxReportsPerMonth: 999,
                },
            },
        };

        // Update subscription
        if (plan) {
            const planConfig = planConfigs[plan];
            if (!planConfig) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid plan selected",
                });
            }

            subscription.plan = plan;
            subscription.limits = planConfig.limits;

            if (plan === "free") {
                subscription.price = 0;
            } else if (billingCycle === "annual") {
                subscription.price = planConfig.annual;
            } else {
                subscription.price = planConfig.monthly;
            }
        }

        if (billingCycle) {
            subscription.billingCycle = billingCycle;
        }

        if (paymentMethod) {
            subscription.paymentMethod = paymentMethod;
        }

        // Update subscription status
        if (plan !== "free") {
            subscription.status = "active";
        }

        // Update team status
        team.status = "active";
        await team.save();

        await subscription.save();

        // Log activity
        const activityLog = new TeamActivityLog({
            teamId: team._id,
            actorId: user._id,
            actorName: user.name || user.email,
            actorRole: membership.role,
            action: "subscription_updated",
            targetType: "subscription",
            targetId: subscription._id,
            details: { plan, billingCycle },
        });
        await activityLog.save();

        return res.status(200).json({
            success: true,
            message: "Subscription updated successfully",
            data: subscription,
        });
    } catch (error) {
        console.error("Error updating subscription:", error);
        return res.status(500).json({
            success: false,
            message: "Error updating subscription",
            error: error.message,
        });
    }
};

/**
 * Cancel team subscription
 * POST /api/teams/:teamId/subscription/cancel
 */
export const cancelSubscription = async (req, res) => {
    try {
        const { teamId } = req.params;
        const { reason, cancelImmediately } = req.body;
        const clerkUserId = req.auth.userId;

        // Get user
        const user = await User.findOne({ auth0Id: clerkUserId });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Get team
        const team = await Team.findById(teamId);
        if (!team || team.isDeleted) {
            return res.status(404).json({
                success: false,
                message: "Team not found",
            });
        }

        // Check permission
        const membership = await TeamMember.findOne({
            teamId: team._id,
            userId: user._id,
            status: "active",
        });

        if (!membership || membership.role !== "owner") {
            return res.status(403).json({
                success: false,
                message: "Only team owner can cancel subscription",
            });
        }

        // Get subscription
        const subscription = await TeamSubscription.findOne({ teamId: team._id });
        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: "Subscription not found",
            });
        }

        // Cancel subscription
        if (cancelImmediately) {
            subscription.status = "cancelled";
            subscription.cancelledAt = new Date();
            team.status = "cancelled";
        } else {
            // Cancel at end of billing period
            subscription.cancelAt = subscription.currentPeriodEnd;
            subscription.status = "cancelled";
        }

        await subscription.save();
        await team.save();

        // Log activity
        const activityLog = new TeamActivityLog({
            teamId: team._id,
            actorId: user._id,
            actorName: user.name || user.email,
            actorRole: membership.role,
            action: "subscription_cancelled",
            targetType: "subscription",
            targetId: subscription._id,
            details: { reason, cancelImmediately },
        });
        await activityLog.save();

        return res.status(200).json({
            success: true,
            message: "Subscription cancelled successfully",
            data: subscription,
        });
    } catch (error) {
        console.error("Error cancelling subscription:", error);
        return res.status(500).json({
            success: false,
            message: "Error cancelling subscription",
            error: error.message,
        });
    }
};

/**
 * Get subscription usage and limits
 * GET /api/teams/:teamId/subscription/usage
 */
export const getSubscriptionUsage = async (req, res) => {
    try {
        const { teamId } = req.params;
        const clerkUserId = req.auth.userId;

        // Get user
        const user = await User.findOne({ auth0Id: clerkUserId });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Get team
        const team = await Team.findById(teamId);
        if (!team || team.isDeleted) {
            return res.status(404).json({
                success: false,
                message: "Team not found",
            });
        }

        // Check if user is a member
        const membership = await TeamMember.findOne({
            teamId: team._id,
            userId: user._id,
            status: "active",
        });

        if (!membership) {
            return res.status(403).json({
                success: false,
                message: "You are not a member of this team",
            });
        }

        // Get subscription
        const subscription = await TeamSubscription.findOne({ teamId: team._id });
        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: "Subscription not found",
            });
        }

        // Calculate usage percentages
        const usagePercentages = {
            members: (subscription.usage.currentMembers / subscription.limits.maxMembers) * 100,
            candidates: (subscription.usage.currentCandidates / subscription.limits.maxCandidates) * 100,
            mentors: (subscription.usage.currentMentors / subscription.limits.maxMentors) * 100,
            storage: (subscription.usage.currentStorage / subscription.limits.maxStorage) * 100,
            reports: (subscription.usage.reportsThisMonth / subscription.limits.maxReportsPerMonth) * 100,
        };

        return res.status(200).json({
            success: true,
            data: {
                limits: subscription.limits,
                usage: subscription.usage,
                usagePercentages,
                plan: subscription.plan,
                status: subscription.status,
            },
        });
    } catch (error) {
        console.error("Error fetching subscription usage:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching subscription usage",
            error: error.message,
        });
    }
};

/**
 * Apply coupon code to subscription
 * POST /api/teams/:teamId/subscription/coupon
 */
export const applyCoupon = async (req, res) => {
    try {
        const { teamId } = req.params;
        const { couponCode } = req.body;
        const clerkUserId = req.auth.userId;

        if (!couponCode) {
            return res.status(400).json({
                success: false,
                message: "Coupon code is required",
            });
        }

        // Get user
        const user = await User.findOne({ auth0Id: clerkUserId });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Get team
        const team = await Team.findById(teamId);
        if (!team || team.isDeleted) {
            return res.status(404).json({
                success: false,
                message: "Team not found",
            });
        }

        // Check permission
        const membership = await TeamMember.findOne({
            teamId: team._id,
            userId: user._id,
            status: "active",
        });

        if (!membership || membership.role !== "owner") {
            return res.status(403).json({
                success: false,
                message: "Only team owner can apply coupons",
            });
        }

        // Get subscription
        const subscription = await TeamSubscription.findOne({ teamId: team._id });
        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: "Subscription not found",
            });
        }

        // Validate coupon (simplified - in real app would check against database/Stripe)
        const validCoupons = {
            WELCOME20: 20,
            SAVE30: 30,
            EARLYBIRD50: 50,
        };

        const discount = validCoupons[couponCode.toUpperCase()];
        if (!discount) {
            return res.status(400).json({
                success: false,
                message: "Invalid coupon code",
            });
        }

        // Apply coupon
        subscription.couponCode = couponCode.toUpperCase();
        subscription.discountPercent = discount;
        await subscription.save();

        return res.status(200).json({
            success: true,
            message: "Coupon applied successfully",
            data: {
                couponCode: subscription.couponCode,
                discountPercent: subscription.discountPercent,
            },
        });
    } catch (error) {
        console.error("Error applying coupon:", error);
        return res.status(500).json({
            success: false,
            message: "Error applying coupon",
            error: error.message,
        });
    }
};
