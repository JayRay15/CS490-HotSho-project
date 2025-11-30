import express from "express";
import { clerkMiddleware } from "@clerk/express";
import {
    createTeam,
    getMyTeams,
    getTeam,
    updateTeam,
    deleteTeam,
    inviteMember,
    acceptInvitation,
    getMyInvitations,
    getTeamMembers,
    updateMemberRole,
    removeMember,
    getTeamDashboard,
    getCandidateProgress,
    getTeamActivity,
} from "../controllers/teamController.js";
import {
    getSubscription,
    updateSubscription,
    cancelSubscription,
    getSubscriptionUsage,
    applyCoupon,
} from "../controllers/teamSubscriptionController.js";
import {
    verifyTeamMembership,
    requirePermission,
    requireTeamOwner,
    requireRole,
    checkSubscriptionLimit,
    verifyTeamActive,
} from "../middleware/teamMiddleware.js";

const router = express.Router();

// Apply Clerk authentication to all routes
router.use(clerkMiddleware());

// ===== TEAM MANAGEMENT ROUTES =====

// Create team
router.post("/", createTeam);

// Get user's teams
router.get("/", getMyTeams);

// Get team by ID or slug
router.get("/:identifier", getTeam);

// Update team (requires team settings permission)
router.put(
    "/:teamId",
    verifyTeamMembership,
    verifyTeamActive,
    requirePermission("manageTeamSettings"),
    updateTeam
);

// Delete team (requires owner)
router.delete("/:teamId", deleteTeam);

// ===== TEAM MEMBER MANAGEMENT ROUTES =====

// Invite member to team
router.post(
    "/:teamId/members/invite",
    verifyTeamMembership,
    verifyTeamActive,
    requirePermission("inviteMembers"),
    checkSubscriptionLimit("members"),
    inviteMember
);

// Accept invitation (public route with token)
router.post("/invitations/:token/accept", acceptInvitation);

// Get my pending invitations
router.get("/invitations/pending", getMyInvitations);

// Get team members
router.get(
    "/:teamId/members",
    verifyTeamMembership,
    verifyTeamActive,
    getTeamMembers
);

// Update member role or permissions
router.put(
    "/:teamId/members/:memberId",
    verifyTeamMembership,
    verifyTeamActive,
    requirePermission("manageRoles"),
    updateMemberRole
);

// Remove member from team
router.delete(
    "/:teamId/members/:memberId",
    verifyTeamMembership,
    verifyTeamActive,
    requirePermission("removeMembers"),
    removeMember
);

// ===== TEAM DASHBOARD & ANALYTICS ROUTES =====

// Get team dashboard
router.get(
    "/:teamId/dashboard",
    verifyTeamMembership,
    verifyTeamActive,
    requirePermission("viewAnalytics"),
    getTeamDashboard
);

// Get candidate progress
router.get(
    "/:teamId/candidates/:candidateId/progress",
    verifyTeamMembership,
    verifyTeamActive,
    requirePermission("viewCandidates"),
    getCandidateProgress
);

// Get team activity log
router.get(
    "/:teamId/activity",
    verifyTeamMembership,
    verifyTeamActive,
    getTeamActivity
);

// ===== SUBSCRIPTION & BILLING ROUTES =====

// Get subscription details
router.get(
    "/:teamId/subscription",
    verifyTeamMembership,
    getSubscription
);

// Update subscription
router.put(
    "/:teamId/subscription",
    verifyTeamMembership,
    requireTeamOwner,
    updateSubscription
);

// Cancel subscription
router.post(
    "/:teamId/subscription/cancel",
    verifyTeamMembership,
    requireTeamOwner,
    cancelSubscription
);

// Get subscription usage
router.get(
    "/:teamId/subscription/usage",
    verifyTeamMembership,
    getSubscriptionUsage
);

// Apply coupon code
router.post(
    "/:teamId/subscription/coupon",
    verifyTeamMembership,
    requireTeamOwner,
    applyCoupon
);

export default router;
