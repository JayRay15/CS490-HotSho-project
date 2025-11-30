import { Team, TeamMember } from "../models/Team.js";
import { User } from "../models/User.js";
import { hasPermission as checkPermission } from "../controllers/teamController.js";

/**
 * Middleware to verify team membership
 */
export const verifyTeamMembership = async (req, res, next) => {
    try {
        const { teamId } = req.params;
        const clerkUserId = req.auth.userId;

        if (!teamId) {
            return res.status(400).json({
                success: false,
                message: "Team ID is required",
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

        // Check membership
        const membership = await TeamMember.findOne({
            teamId: team._id,
            userId: user._id,
            status: "active",
            isDeleted: false,
        });

        if (!membership) {
            return res.status(403).json({
                success: false,
                message: "You are not a member of this team",
            });
        }

        // Attach to request for use in route handlers
        req.team = team;
        req.membership = membership;
        req.user = user;

        next();
    } catch (error) {
        console.error("Error verifying team membership:", error);
        return res.status(500).json({
            success: false,
            message: "Error verifying team membership",
            error: error.message,
        });
    }
};

/**
 * Middleware to check specific permission
 */
export const requirePermission = (permission) => {
    return async (req, res, next) => {
        try {
            const membership = req.membership;

            if (!membership) {
                return res.status(403).json({
                    success: false,
                    message: "Team membership not verified",
                });
            }

            // Check if user has the required permission
            const hasPermission = checkPermission(membership, permission);

            if (!hasPermission) {
                return res.status(403).json({
                    success: false,
                    message: `You don't have permission to ${permission}`,
                });
            }

            next();
        } catch (error) {
            console.error("Error checking permission:", error);
            return res.status(500).json({
                success: false,
                message: "Error checking permission",
                error: error.message,
            });
        }
    };
};

/**
 * Middleware to check if user is team owner
 */
export const requireTeamOwner = async (req, res, next) => {
    try {
        const membership = req.membership;
        const team = req.team;
        const user = req.user;

        if (!membership || !team || !user) {
            return res.status(403).json({
                success: false,
                message: "Team context not available",
            });
        }

        if (membership.role !== "owner" || team.ownerId.toString() !== user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Only team owner can perform this action",
            });
        }

        next();
    } catch (error) {
        console.error("Error checking team owner:", error);
        return res.status(500).json({
            success: false,
            message: "Error checking team owner",
            error: error.message,
        });
    }
};

/**
 * Middleware to check team role
 */
export const requireRole = (roles) => {
    return async (req, res, next) => {
        try {
            const membership = req.membership;

            if (!membership) {
                return res.status(403).json({
                    success: false,
                    message: "Team membership not verified",
                });
            }

            // Ensure roles is an array
            const allowedRoles = Array.isArray(roles) ? roles : [roles];

            if (!allowedRoles.includes(membership.role)) {
                return res.status(403).json({
                    success: false,
                    message: `This action requires one of the following roles: ${allowedRoles.join(", ")}`,
                });
            }

            next();
        } catch (error) {
            console.error("Error checking role:", error);
            return res.status(500).json({
                success: false,
                message: "Error checking role",
                error: error.message,
            });
        }
    };
};

/**
 * Middleware to check subscription limits
 */
export const checkSubscriptionLimit = (resource) => {
    return async (req, res, next) => {
        try {
            const team = req.team;

            if (!team) {
                return res.status(400).json({
                    success: false,
                    message: "Team context not available",
                });
            }

            // Get subscription
            const subscription = await team.populate("subscriptionId");

            if (!subscription.subscriptionId) {
                return res.status(404).json({
                    success: false,
                    message: "No subscription found for team",
                });
            }

            // Check if limit is exceeded
            if (subscription.subscriptionId.isOverLimit(resource)) {
                return res.status(403).json({
                    success: false,
                    message: `Team has reached ${resource} limit. Please upgrade your plan.`,
                    limit: subscription.subscriptionId.limits[`max${resource.charAt(0).toUpperCase() + resource.slice(1)}`],
                });
            }

            next();
        } catch (error) {
            console.error("Error checking subscription limit:", error);
            return res.status(500).json({
                success: false,
                message: "Error checking subscription limit",
                error: error.message,
            });
        }
    };
};

/**
 * Middleware to verify team is active
 */
export const verifyTeamActive = async (req, res, next) => {
    try {
        const team = req.team;

        if (!team) {
            return res.status(400).json({
                success: false,
                message: "Team context not available",
            });
        }

        // Check if team is active
        if (team.status === "suspended") {
            return res.status(403).json({
                success: false,
                message: "Team account is suspended. Please contact support.",
            });
        }

        if (team.status === "cancelled") {
            return res.status(403).json({
                success: false,
                message: "Team account has been cancelled.",
            });
        }

        // Check if trial expired
        if (team.status === "trial" && team.trialEndsAt && team.trialEndsAt < new Date()) {
            return res.status(403).json({
                success: false,
                message: "Team trial has expired. Please upgrade your plan.",
            });
        }

        next();
    } catch (error) {
        console.error("Error verifying team status:", error);
        return res.status(500).json({
            success: false,
            message: "Error verifying team status",
            error: error.message,
        });
    }
};
