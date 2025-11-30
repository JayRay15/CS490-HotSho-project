import crypto from "crypto";
import mongoose from "mongoose";
import { Team, TeamMember, TeamSubscription, TeamActivityLog } from "../models/Team.js";
import { User } from "../models/User.js";
import { ApplicationStatus } from "../models/ApplicationStatus.js";
import { Interview } from "../models/Interview.js";
import Goal from "../models/Goal.js";

// ===== ROLE-BASED PERMISSION HELPERS =====

/**
 * Get default permissions for a role
 */
const getRolePermissions = (role) => {
    const permissions = {
        owner: {
            viewCandidates: true,
            manageCandidates: true,
            viewResumes: true,
            editResumes: false,
            viewApplications: true,
            editApplications: false,
            viewInterviews: true,
            editInterviews: false,
            viewAnalytics: true,
            inviteMembers: true,
            removeMembers: true,
            manageRoles: true,
            manageTeamSettings: true,
            sendMessages: true,
            createReports: true,
            shareFeedback: true,
            manageBilling: true,
        },
        admin: {
            viewCandidates: true,
            manageCandidates: true,
            viewResumes: true,
            editResumes: false,
            viewApplications: true,
            editApplications: false,
            viewInterviews: true,
            editInterviews: false,
            viewAnalytics: true,
            inviteMembers: true,
            removeMembers: true,
            manageRoles: false,
            manageTeamSettings: true,
            sendMessages: true,
            createReports: true,
            shareFeedback: true,
            manageBilling: false,
        },
        mentor: {
            viewCandidates: true,
            manageCandidates: false,
            viewResumes: true,
            editResumes: false,
            viewApplications: true,
            editApplications: false,
            viewInterviews: true,
            editInterviews: false,
            viewAnalytics: true,
            inviteMembers: false,
            removeMembers: false,
            manageRoles: false,
            manageTeamSettings: false,
            sendMessages: true,
            createReports: true,
            shareFeedback: true,
            manageBilling: false,
        },
        coach: {
            viewCandidates: true,
            manageCandidates: false,
            viewResumes: true,
            editResumes: false,
            viewApplications: true,
            editApplications: false,
            viewInterviews: true,
            editInterviews: false,
            viewAnalytics: true,
            inviteMembers: false,
            removeMembers: false,
            manageRoles: false,
            manageTeamSettings: false,
            sendMessages: true,
            createReports: true,
            shareFeedback: true,
            manageBilling: false,
        },
        candidate: {
            viewCandidates: false,
            manageCandidates: false,
            viewResumes: true, // own data only
            editResumes: true,
            viewApplications: true,
            editApplications: true,
            viewInterviews: true,
            editInterviews: true,
            viewAnalytics: true, // own analytics only
            inviteMembers: false,
            removeMembers: false,
            manageRoles: false,
            manageTeamSettings: false,
            sendMessages: true,
            createReports: false,
            shareFeedback: false,
            manageBilling: false,
        },
        viewer: {
            viewCandidates: true,
            manageCandidates: false,
            viewResumes: false,
            editResumes: false,
            viewApplications: false,
            editApplications: false,
            viewInterviews: false,
            editInterviews: false,
            viewAnalytics: true,
            inviteMembers: false,
            removeMembers: false,
            manageRoles: false,
            manageTeamSettings: false,
            sendMessages: false,
            createReports: false,
            shareFeedback: false,
            manageBilling: false,
        },
    };

    return permissions[role] || permissions.viewer;
};

/**
 * Check if a team member has a specific permission
 */
const hasPermission = (member, permission) => {
    // Get role-based default
    const rolePermissions = getRolePermissions(member.role);

    // Check if custom permission is set (overrides role default)
    if (member.permissions && member.permissions[permission] !== null && member.permissions[permission] !== undefined) {
        return member.permissions[permission];
    }

    // Use role default
    return rolePermissions[permission] || false;
};

/**
 * Log team activity
 */
const logActivity = async (teamId, actorId, actorName, actorRole, action, targetType, targetId, details, req) => {
    try {
        const activityLog = new TeamActivityLog({
            teamId,
            actorId,
            actorName,
            actorRole,
            action,
            targetType,
            targetId,
            details,
            ipAddress: req?.ip || req?.connection?.remoteAddress,
            userAgent: req?.headers["user-agent"],
        });
        await activityLog.save();
    } catch (error) {
        console.error("Error logging team activity:", error);
    }
};

// ===== TEAM MANAGEMENT =====

/**
 * Create a new team
 * POST /api/teams
 */
export const createTeam = async (req, res) => {
    try {
        const { name, description, teamType, settings, branding, tags } = req.body;
        const clerkUserId = req.auth.userId;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Team name is required",
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

        // Create team
        const team = new Team({
            name,
            description,
            teamType: teamType || "career_coaching",
            ownerId: user._id,
            settings: settings || {},
            branding: branding || {},
            tags: tags || [],
        });

        await team.save();

        // Create subscription (free trial)
        const subscription = new TeamSubscription({
            teamId: team._id,
            plan: "free",
            status: "trialing",
        });

        await subscription.save();

        // Update team with subscription reference
        team.subscriptionId = subscription._id;
        await team.save();

        // Add owner as team member
        const ownerMember = new TeamMember({
            teamId: team._id,
            userId: user._id,
            email: user.email,
            role: "owner",
            status: "active",
            invitedBy: user._id,
            joinedAt: new Date(),
        });

        await ownerMember.save();

        // Update team stats
        team.stats.totalMembers = 1;
        await team.save();

        // Log activity
        await logActivity(
            team._id,
            user._id,
            user.name || user.email,
            "owner",
            "team_created",
            "team",
            team._id,
            { teamName: name },
            req
        );

        return res.status(201).json({
            success: true,
            message: "Team created successfully",
            data: {
                team,
                subscription,
            },
        });
    } catch (error) {
        console.error("Error creating team:", error);
        return res.status(500).json({
            success: false,
            message: "Error creating team",
            error: error.message,
        });
    }
};

/**
 * Get user's teams
 * GET /api/teams
 */
export const getMyTeams = async (req, res) => {
    try {
        const clerkUserId = req.auth.userId;

        // Get user
        const user = await User.findOne({ auth0Id: clerkUserId });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Find all team memberships
        const memberships = await TeamMember.find({
            userId: user._id,
            status: "active",
            isDeleted: false,
        }).populate("teamId");

        // Filter out deleted teams and get team data
        const teams = memberships
            .filter(m => m.teamId && !m.teamId.isDeleted)
            .map(m => ({
                team: m.teamId,
                membership: {
                    role: m.role,
                    joinedAt: m.joinedAt,
                    permissions: m.permissions,
                },
            }));

        return res.status(200).json({
            success: true,
            data: teams,
        });
    } catch (error) {
        console.error("Error fetching teams:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching teams",
            error: error.message,
        });
    }
};

/**
 * Get team by ID or slug
 * GET /api/teams/:identifier
 */
export const getTeam = async (req, res) => {
    try {
        const { identifier } = req.params;
        const clerkUserId = req.auth.userId;

        // Get user
        const user = await User.findOne({ auth0Id: clerkUserId });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Find team by ID or slug
        const team = mongoose.Types.ObjectId.isValid(identifier)
            ? await Team.findById(identifier).populate("subscriptionId")
            : await Team.findOne({ slug: identifier }).populate("subscriptionId");

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
            isDeleted: false,
        });

        if (!membership) {
            return res.status(403).json({
                success: false,
                message: "You are not a member of this team",
            });
        }

        // Get team members
        const members = await TeamMember.find({
            teamId: team._id,
            isDeleted: false,
        }).populate("userId", "name email profilePicture");

        return res.status(200).json({
            success: true,
            data: {
                team,
                membership,
                members,
            },
        });
    } catch (error) {
        console.error("Error fetching team:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching team",
            error: error.message,
        });
    }
};

/**
 * Update team
 * PUT /api/teams/:teamId
 */
export const updateTeam = async (req, res) => {
    try {
        const { teamId } = req.params;
        const { name, description, teamType, settings, branding, tags } = req.body;
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

        if (!membership || !hasPermission(membership, "manageTeamSettings")) {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to update team settings",
            });
        }

        // Update fields
        if (name) team.name = name;
        if (description !== undefined) team.description = description;
        if (teamType) team.teamType = teamType;
        if (settings) team.settings = { ...team.settings, ...settings };
        if (branding) team.branding = { ...team.branding, ...branding };
        if (tags) team.tags = tags;

        await team.save();

        // Log activity
        await logActivity(
            team._id,
            user._id,
            user.name || user.email,
            membership.role,
            "team_updated",
            "team",
            team._id,
            { updates: req.body },
            req
        );

        return res.status(200).json({
            success: true,
            message: "Team updated successfully",
            data: team,
        });
    } catch (error) {
        console.error("Error updating team:", error);
        return res.status(500).json({
            success: false,
            message: "Error updating team",
            error: error.message,
        });
    }
};

/**
 * Delete team (soft delete)
 * DELETE /api/teams/:teamId
 */
export const deleteTeam = async (req, res) => {
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

        // Check if user is owner
        if (team.ownerId.toString() !== user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Only team owner can delete the team",
            });
        }

        // Soft delete team
        team.isDeleted = true;
        team.deletedAt = new Date();
        team.status = "cancelled";
        await team.save();

        // Soft delete all members
        await TeamMember.updateMany(
            { teamId: team._id },
            {
                $set: {
                    isDeleted: true,
                    deletedAt: new Date(),
                    status: "removed",
                },
            }
        );

        // Log activity
        await logActivity(
            team._id,
            user._id,
            user.name || user.email,
            "owner",
            "team_deleted",
            "team",
            team._id,
            { teamName: team.name },
            req
        );

        return res.status(200).json({
            success: true,
            message: "Team deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting team:", error);
        return res.status(500).json({
            success: false,
            message: "Error deleting team",
            error: error.message,
        });
    }
};

// ===== TEAM MEMBER MANAGEMENT =====

/**
 * Invite member to team
 * POST /api/teams/:teamId/members/invite
 */
export const inviteMember = async (req, res) => {
    try {
        const { teamId } = req.params;
        const { email, role, invitationMessage, permissions, focusAreas } = req.body;
        const clerkUserId = req.auth.userId;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required",
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
        const team = await Team.findById(teamId).populate("subscriptionId");
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

        if (!membership || !hasPermission(membership, "inviteMembers")) {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to invite members",
            });
        }

        // Check subscription limits
        if (team.subscriptionId && team.subscriptionId.isOverLimit("members")) {
            return res.status(403).json({
                success: false,
                message: "Team has reached member limit. Please upgrade your plan.",
            });
        }

        // Check if already invited or member
        const existingMember = await TeamMember.findOne({
            teamId: team._id,
            email: email.toLowerCase(),
            isDeleted: false,
        });

        if (existingMember && existingMember.status === "active") {
            return res.status(409).json({
                success: false,
                message: "User is already a team member",
            });
        }

        if (existingMember && existingMember.status === "pending") {
            return res.status(409).json({
                success: false,
                message: "Invitation already sent to this email",
            });
        }

        // Create invitation
        const invitation = new TeamMember({
            teamId: team._id,
            email: email.toLowerCase(),
            role: role || "candidate",
            status: "pending",
            invitedBy: user._id,
            invitationMessage,
            permissions: permissions || {},
            focusAreas: focusAreas || [],
        });

        await invitation.save();

        // Try to find existing user to link
        const invitedUser = await User.findOne({ email: email.toLowerCase() });
        if (invitedUser) {
            invitation.userId = invitedUser._id;
            await invitation.save();

            // TODO: Send email notification
        }

        // Log activity
        await logActivity(
            team._id,
            user._id,
            user.name || user.email,
            membership.role,
            "member_invited",
            "member",
            invitation._id,
            { email, role: role || "candidate" },
            req
        );

        return res.status(201).json({
            success: true,
            message: "Invitation sent successfully",
            data: invitation,
        });
    } catch (error) {
        console.error("Error inviting member:", error);
        return res.status(500).json({
            success: false,
            message: "Error inviting member",
            error: error.message,
        });
    }
};

/**
 * Accept team invitation
 * POST /api/teams/invitations/:token/accept
 */
export const acceptInvitation = async (req, res) => {
    try {
        const { token } = req.params;
        const clerkUserId = req.auth.userId;

        // Get user
        const user = await User.findOne({ auth0Id: clerkUserId });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Find invitation
        const invitation = await TeamMember.findOne({
            invitationToken: token,
            status: "pending",
            isDeleted: false,
        }).populate("teamId");

        if (!invitation) {
            return res.status(404).json({
                success: false,
                message: "Invitation not found or already processed",
            });
        }

        // Check if invitation expired
        if (invitation.invitationExpiresAt < new Date()) {
            return res.status(400).json({
                success: false,
                message: "Invitation has expired",
            });
        }

        // Check if email matches
        if (invitation.email !== user.email.toLowerCase()) {
            return res.status(403).json({
                success: false,
                message: "This invitation is for a different email address",
            });
        }

        // Accept invitation
        invitation.userId = user._id;
        invitation.status = "active";
        invitation.joinedAt = new Date();
        invitation.invitationToken = null; // Clear token
        await invitation.save();

        // Update team stats
        const team = invitation.teamId;
        team.stats.totalMembers += 1;

        if (invitation.role === "candidate") {
            team.stats.activeCandidates += 1;
        }

        await team.save();

        // Update subscription usage
        if (team.subscriptionId) {
            const subscription = await TeamSubscription.findById(team.subscriptionId);
            if (subscription) {
                subscription.usage.currentMembers += 1;
                if (invitation.role === "candidate") {
                    subscription.usage.currentCandidates += 1;
                } else if (["mentor", "coach"].includes(invitation.role)) {
                    subscription.usage.currentMentors += 1;
                }
                await subscription.save();
            }
        }

        // Log activity
        await logActivity(
            team._id,
            user._id,
            user.name || user.email,
            invitation.role,
            "member_joined",
            "member",
            invitation._id,
            { role: invitation.role },
            req
        );

        return res.status(200).json({
            success: true,
            message: "Invitation accepted successfully",
            data: {
                team,
                membership: invitation,
            },
        });
    } catch (error) {
        console.error("Error accepting invitation:", error);
        return res.status(500).json({
            success: false,
            message: "Error accepting invitation",
            error: error.message,
        });
    }
};

/**
 * Get my pending invitations
 * GET /api/teams/invitations/pending
 */
export const getMyInvitations = async (req, res) => {
    try {
        const clerkUserId = req.auth.userId;

        // Get user
        const user = await User.findOne({ auth0Id: clerkUserId });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Find pending invitations for user's email
        const invitations = await TeamMember.find({
            email: user.email.toLowerCase(),
            status: "pending",
            isDeleted: false,
            invitationExpiresAt: { $gt: new Date() },
        })
            .populate("teamId", "name description branding stats")
            .populate("invitedBy", "name email picture")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: invitations,
        });
    } catch (error) {
        console.error("Error fetching invitations:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching invitations",
            error: error.message,
        });
    }
};

/**
 * Get team members
 * GET /api/teams/:teamId/members
 */
export const getTeamMembers = async (req, res) => {
    try {
        const { teamId } = req.params;
        const { status, role } = req.query;
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

        // Build query
        const query = {
            teamId: team._id,
            isDeleted: false,
        };

        if (status) query.status = status;
        if (role) query.role = role;

        // Get members
        const members = await TeamMember.find(query)
            .populate("userId", "name email profilePicture")
            .populate("invitedBy", "name email")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: members,
        });
    } catch (error) {
        console.error("Error fetching team members:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching team members",
            error: error.message,
        });
    }
};

/**
 * Update team member role or permissions
 * PUT /api/teams/:teamId/members/:memberId
 */
export const updateMemberRole = async (req, res) => {
    try {
        const { teamId, memberId } = req.params;
        const { role, permissions } = req.body;
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
        const userMembership = await TeamMember.findOne({
            teamId: team._id,
            userId: user._id,
            status: "active",
        });

        if (!userMembership || !hasPermission(userMembership, "manageRoles")) {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to manage roles",
            });
        }

        // Get target member
        const targetMember = await TeamMember.findById(memberId);
        if (!targetMember || targetMember.teamId.toString() !== team._id.toString()) {
            return res.status(404).json({
                success: false,
                message: "Member not found",
            });
        }

        // Cannot change owner role
        if (targetMember.role === "owner" && role && role !== "owner") {
            return res.status(403).json({
                success: false,
                message: "Cannot change owner role",
            });
        }

        // Only owner can assign owner role
        if (role === "owner" && team.ownerId.toString() !== user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Only team owner can assign owner role",
            });
        }

        // Update role and permissions
        if (role) targetMember.role = role;
        if (permissions) targetMember.permissions = { ...targetMember.permissions, ...permissions };

        await targetMember.save();

        // Log activity
        await logActivity(
            team._id,
            user._id,
            user.name || user.email,
            userMembership.role,
            "member_role_changed",
            "member",
            targetMember._id,
            { newRole: role, permissions },
            req
        );

        return res.status(200).json({
            success: true,
            message: "Member updated successfully",
            data: targetMember,
        });
    } catch (error) {
        console.error("Error updating member:", error);
        return res.status(500).json({
            success: false,
            message: "Error updating member",
            error: error.message,
        });
    }
};

/**
 * Remove team member
 * DELETE /api/teams/:teamId/members/:memberId
 */
export const removeMember = async (req, res) => {
    try {
        const { teamId, memberId } = req.params;
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
        const team = await Team.findById(teamId).populate("subscriptionId");
        if (!team || team.isDeleted) {
            return res.status(404).json({
                success: false,
                message: "Team not found",
            });
        }

        // Check permission
        const userMembership = await TeamMember.findOne({
            teamId: team._id,
            userId: user._id,
            status: "active",
        });

        if (!userMembership || !hasPermission(userMembership, "removeMembers")) {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to remove members",
            });
        }

        // Get target member
        const targetMember = await TeamMember.findById(memberId);
        if (!targetMember || targetMember.teamId.toString() !== team._id.toString()) {
            return res.status(404).json({
                success: false,
                message: "Member not found",
            });
        }

        // Cannot remove owner
        if (targetMember.role === "owner") {
            return res.status(403).json({
                success: false,
                message: "Cannot remove team owner",
            });
        }

        // Soft delete member
        targetMember.isDeleted = true;
        targetMember.deletedAt = new Date();
        targetMember.status = "removed";
        await targetMember.save();

        // Update team stats
        team.stats.totalMembers -= 1;
        if (targetMember.role === "candidate") {
            team.stats.activeCandidates -= 1;
        }
        await team.save();

        // Update subscription usage
        if (team.subscriptionId) {
            team.subscriptionId.usage.currentMembers -= 1;
            if (targetMember.role === "candidate") {
                team.subscriptionId.usage.currentCandidates -= 1;
            } else if (["mentor", "coach"].includes(targetMember.role)) {
                team.subscriptionId.usage.currentMentors -= 1;
            }
            await team.subscriptionId.save();
        }

        // Log activity
        await logActivity(
            team._id,
            user._id,
            user.name || user.email,
            userMembership.role,
            "member_removed",
            "member",
            targetMember._id,
            { removedMember: targetMember.email, role: targetMember.role },
            req
        );

        return res.status(200).json({
            success: true,
            message: "Member removed successfully",
        });
    } catch (error) {
        console.error("Error removing member:", error);
        return res.status(500).json({
            success: false,
            message: "Error removing member",
            error: error.message,
        });
    }
};

// ===== TEAM ANALYTICS & DASHBOARD =====

/**
 * Get team dashboard with aggregate metrics
 * GET /api/teams/:teamId/dashboard
 */
export const getTeamDashboard = async (req, res) => {
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
        const team = await Team.findById(teamId).populate("subscriptionId");
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

        if (!membership || !hasPermission(membership, "viewAnalytics")) {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to view analytics",
            });
        }

        // Get all candidates in team
        const candidateMembers = await TeamMember.find({
            teamId: team._id,
            role: "candidate",
            status: "active",
            isDeleted: false,
        }).select("userId");

        const candidateIds = candidateMembers.map(m => m.userId).filter(id => id);

        // Aggregate applications data
        const applicationsStats = await ApplicationStatus.aggregate([
            {
                $match: {
                    userId: { $in: candidateIds },
                },
            },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                },
            },
        ]);

        // Aggregate interviews data
        const interviewsStats = await Interview.aggregate([
            {
                $match: {
                    userId: { $in: candidateIds },
                },
            },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                },
            },
        ]);

        // Get goals progress
        const goalsStats = await Goal.aggregate([
            {
                $match: {
                    userId: { $in: candidateIds },
                },
            },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                },
            },
        ]);

        // Calculate aggregate metrics
        const totalApplications = applicationsStats.reduce((sum, stat) => sum + stat.count, 0);
        const totalInterviews = interviewsStats.reduce((sum, stat) => sum + stat.count, 0);
        const totalGoals = goalsStats.reduce((sum, stat) => sum + stat.count, 0);

        // Get recent activity
        const recentActivity = await TeamActivityLog.find({
            teamId: team._id,
        })
            .sort({ createdAt: -1 })
            .limit(20);

        return res.status(200).json({
            success: true,
            data: {
                team,
                subscription: team.subscriptionId,
                metrics: {
                    totalMembers: team.stats.totalMembers,
                    activeCandidates: candidateIds.length,
                    totalApplications,
                    totalInterviews,
                    totalGoals,
                    applicationsByStatus: applicationsStats,
                    interviewsByStatus: interviewsStats,
                    goalsByStatus: goalsStats,
                },
                recentActivity,
            },
        });
    } catch (error) {
        console.error("Error fetching team dashboard:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching team dashboard",
            error: error.message,
        });
    }
};

/**
 * Get candidate progress within team
 * GET /api/teams/:teamId/candidates/:candidateId/progress
 */
export const getCandidateProgress = async (req, res) => {
    try {
        const { teamId, candidateId } = req.params;
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

        if (!membership || !hasPermission(membership, "viewCandidates")) {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to view candidate data",
            });
        }

        // Get candidate membership
        const candidateMembership = await TeamMember.findOne({
            teamId: team._id,
            userId: candidateId,
            role: "candidate",
            status: "active",
        }).populate("userId", "name email profilePicture");

        if (!candidateMembership) {
            return res.status(404).json({
                success: false,
                message: "Candidate not found in team",
            });
        }

        // Check data sharing permissions
        if (!candidateMembership.dataSharing.shareProgress && membership.role !== "owner") {
            return res.status(403).json({
                success: false,
                message: "Candidate has not shared progress data",
            });
        }

        // Get candidate data based on sharing settings
        const candidateData = {};

        if (candidateMembership.dataSharing.shareApplications) {
            candidateData.applications = await ApplicationStatus.find({
                userId: candidateId,
            })
                .sort({ createdAt: -1 })
                .limit(50);
        }

        if (candidateMembership.dataSharing.shareInterviews) {
            candidateData.interviews = await Interview.find({
                userId: candidateId,
            })
                .sort({ interviewDate: -1 })
                .limit(20);
        }

        if (candidateMembership.dataSharing.shareGoals) {
            candidateData.goals = await Goal.find({
                userId: candidateId,
            }).sort({ createdAt: -1 });
        }

        return res.status(200).json({
            success: true,
            data: {
                candidate: candidateMembership.userId,
                membership: candidateMembership,
                progress: candidateData,
            },
        });
    } catch (error) {
        console.error("Error fetching candidate progress:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching candidate progress",
            error: error.message,
        });
    }
};

/**
 * Get team activity log
 * GET /api/teams/:teamId/activity
 */
export const getTeamActivity = async (req, res) => {
    try {
        const { teamId } = req.params;
        const { limit = 50, action, actorId } = req.query;
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

        // Build query
        const query = { teamId: team._id };
        if (action) query.action = action;
        if (actorId) query.actorId = actorId;

        // Get activity log
        const activities = await TeamActivityLog.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        return res.status(200).json({
            success: true,
            data: activities,
        });
    } catch (error) {
        console.error("Error fetching team activity:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching team activity",
            error: error.message,
        });
    }
};

// Export permission helper for use in middleware
export { hasPermission, getRolePermissions };
