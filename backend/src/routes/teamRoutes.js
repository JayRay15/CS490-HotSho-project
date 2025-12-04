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
    shareJobWithTeam,
    getSharedJobs,
    addComment,
    deleteComment,
    addReaction,
    getTeamBenchmarking,
    updateSharedJobStatus,
} from "../controllers/sharedJobController.js";
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

// ===== SHARED JOBS ROUTES =====

// Share a job with the team
router.post(
    "/:teamId/shared-jobs",
    verifyTeamMembership,
    verifyTeamActive,
    shareJobWithTeam
);

// Get all shared jobs for a team
router.get(
    "/:teamId/shared-jobs",
    verifyTeamMembership,
    verifyTeamActive,
    getSharedJobs
);

// Add comment to shared job
router.post(
    "/:teamId/shared-jobs/:sharedJobId/comments",
    verifyTeamMembership,
    verifyTeamActive,
    addComment
);

// Delete comment from shared job
router.delete(
    "/:teamId/shared-jobs/:sharedJobId/comments/:commentId",
    verifyTeamMembership,
    verifyTeamActive,
    deleteComment
);

// Add reaction to shared job
router.post(
    "/:teamId/shared-jobs/:sharedJobId/reactions",
    verifyTeamMembership,
    verifyTeamActive,
    addReaction
);

// Update shared job status
router.put(
    "/:teamId/shared-jobs/:sharedJobId/status",
    verifyTeamMembership,
    verifyTeamActive,
    updateSharedJobStatus
);

// ===== TEAM BENCHMARKING ROUTES =====

// Get team benchmarking/comparison data
router.get(
    "/:teamId/benchmarking",
    verifyTeamMembership,
    verifyTeamActive,
    getTeamBenchmarking
);

export default router;
