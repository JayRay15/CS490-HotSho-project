import crypto from "crypto";
import mongoose from "mongoose";
import {
    ExternalAdvisorRelationship,
    AdvisorSession,
    AdvisorBilling,
    AdvisorPayment,
    AdvisorRecommendation,
    AdvisorEvaluation,
    AdvisorMessage,
    AdvisorImpactMetric,
} from "../models/ExternalAdvisor.js";
import { User } from "../models/User.js";

// ===== EXTERNAL ADVISOR RELATIONSHIP MANAGEMENT =====

/**
 * Invite an external advisor
 * POST /api/external-advisors/invite
 */
export const inviteAdvisor = async (req, res) => {
    try {
        const {
            advisorEmail,
            advisorName,
            advisorType,
            invitationMessage,
            focusAreas,
            sharedData,
            contractTerms,
        } = req.body;
        const clerkUserId = req.auth.userId;

        // Validate input
        if (!advisorEmail) {
            return res.status(400).json({
                success: false,
                message: "Advisor email is required",
            });
        }

        // Get MongoDB user
        const currentUser = await User.findOne({ auth0Id: clerkUserId });
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: "User profile not found",
            });
        }

        // Check for existing relationship
        const existingRelationship = await ExternalAdvisorRelationship.findOne({
            userId: currentUser._id,
            advisorEmail: advisorEmail.toLowerCase(),
            status: { $in: ["pending", "accepted"] },
        });

        if (existingRelationship) {
            return res.status(409).json({
                success: false,
                message: existingRelationship.status === "pending"
                    ? "Pending invitation already exists for this advisor"
                    : "You already have an active relationship with this advisor",
            });
        }

        // Create advisor relationship - use name field, or firstName/lastName, or email as fallback
        const senderName = currentUser.name
            || (currentUser.firstName && currentUser.lastName
                ? `${currentUser.firstName} ${currentUser.lastName}`.trim()
                : null)
            || currentUser.email;

        const relationship = new ExternalAdvisorRelationship({
            userId: currentUser._id,
            senderName: senderName,
            senderEmail: currentUser.email,
            advisorEmail: advisorEmail.toLowerCase(),
            advisorName: advisorName || "",
            advisorType: advisorType || "career_coach",
            invitationMessage,
            focusAreas: focusAreas || [],
            sharedData: sharedData || {
                shareResume: true,
                shareCoverLetters: true,
                shareApplications: true,
                shareInterviewPrep: true,
                shareGoals: true,
                shareSkillGaps: true,
                shareProgress: true,
                shareSalaryInfo: false,
                shareNetworkContacts: false,
            },
            contractTerms: contractTerms || {},
        });

        await relationship.save();

        // Try to find existing advisor user
        const advisorUser = await User.findOne({
            email: advisorEmail.toLowerCase(),
        });

        // Send invitation email
        await sendAdvisorInvitationEmail(
            advisorEmail,
            currentUser.firstName || "A job seeker",
            invitationMessage,
            relationship.invitationToken,
            !!advisorUser
        );

        res.status(201).json({
            success: true,
            message: "Advisor invitation sent successfully",
            data: {
                relationshipId: relationship._id,
                status: relationship.status,
            },
        });
    } catch (error) {
        console.error("Error inviting advisor:", error);
        res.status(500).json({
            success: false,
            message: "Failed to send advisor invitation",
            error: error.message,
        });
    }
};

/**
 * Accept advisor invitation
 * POST /api/external-advisors/accept/:relationshipId
 */
export const acceptAdvisorInvitation = async (req, res) => {
    try {
        const clerkUserId = req.auth.userId;
        const { relationshipId } = req.params;
        const { advisorProfile } = req.body;

        const currentUser = await User.findOne({ auth0Id: clerkUserId });
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: "User profile not found",
            });
        }

        const relationship = await ExternalAdvisorRelationship.findById(relationshipId);

        if (!relationship) {
            return res.status(404).json({
                success: false,
                message: "Advisor invitation not found",
            });
        }

        // Verify the current user is the invited advisor
        if (currentUser.email?.toLowerCase() !== relationship.advisorEmail?.toLowerCase()) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to accept this invitation",
            });
        }

        if (relationship.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: `Cannot accept invitation with status: ${relationship.status}`,
            });
        }

        // Update relationship with advisor info
        const advisorDisplayName = currentUser.firstName && currentUser.lastName
            ? `${currentUser.firstName} ${currentUser.lastName}`.trim()
            : currentUser.email;

        relationship.advisorId = currentUser._id;
        relationship.advisorName = advisorDisplayName;
        relationship.status = "accepted";
        relationship.acceptedAt = new Date();
        if (advisorProfile) {
            relationship.advisorProfile = { ...relationship.advisorProfile, ...advisorProfile };
        }
        await relationship.save();

        // Create default billing record
        try {
            const billing = new AdvisorBilling({
                relationshipId: relationship._id,
                userId: relationship.userId,
                advisorId: currentUser._id,
                billingType: "free",
            });
            await billing.save();
        } catch (billingError) {
            console.log("Billing record creation failed (may already exist):", billingError.message);
        }

        // Notify user (don't fail if email fails)
        try {
            const user = await User.findById(relationship.userId);
            if (user) {
                await sendAdvisorAcceptedEmail(user.email, currentUser.firstName || currentUser.email);
            }
        } catch (emailError) {
            console.log("Email notification failed:", emailError.message);
        }

        res.status(200).json({
            success: true,
            message: "Advisor invitation accepted",
            data: relationship,
        });
    } catch (error) {
        console.error("Error accepting advisor invitation:", error);
        res.status(500).json({
            success: false,
            message: "Failed to accept advisor invitation",
            error: error.message,
        });
    }
};

/**
 * Accept invitation via token (for new users)
 * POST /api/external-advisors/accept-token/:token
 */
export const acceptAdvisorInvitationByToken = async (req, res) => {
    try {
        const { token } = req.params;
        const clerkUserId = req.auth.userId;
        const { advisorProfile } = req.body;

        const currentUser = await User.findOne({ auth0Id: clerkUserId });
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: "User profile not found",
            });
        }

        const relationship = await ExternalAdvisorRelationship.findOne({
            invitationToken: token,
            status: "pending",
        });

        if (!relationship) {
            return res.status(404).json({
                success: false,
                message: "Invitation not found or already processed",
            });
        }

        if (relationship.invitationExpiresAt < new Date()) {
            relationship.status = "expired";
            await relationship.save();
            return res.status(400).json({
                success: false,
                message: "Invitation has expired",
            });
        }

        // Update relationship
        relationship.advisorId = currentUser._id;
        relationship.status = "accepted";
        relationship.acceptedAt = new Date();
        if (advisorProfile) {
            relationship.advisorProfile = { ...relationship.advisorProfile, ...advisorProfile };
        }
        await relationship.save();

        // Create default billing record
        const billing = new AdvisorBilling({
            relationshipId: relationship._id,
            userId: relationship.userId,
            advisorId: currentUser._id,
            billingType: "free",
        });
        await billing.save();

        res.status(200).json({
            success: true,
            message: "Advisor invitation accepted",
            data: relationship,
        });
    } catch (error) {
        console.error("Error accepting advisor invitation by token:", error);
        res.status(500).json({
            success: false,
            message: "Failed to accept advisor invitation",
            error: error.message,
        });
    }
};

/**
 * Reject advisor invitation
 * POST /api/external-advisors/reject/:relationshipId
 */
export const rejectAdvisorInvitation = async (req, res) => {
    try {
        const clerkUserId = req.auth.userId;
        const { relationshipId } = req.params;
        const { reason } = req.body;

        const currentUser = await User.findOne({ auth0Id: clerkUserId });
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: "User profile not found",
            });
        }

        const relationship = await ExternalAdvisorRelationship.findById(relationshipId);

        if (!relationship) {
            return res.status(404).json({
                success: false,
                message: "Advisor invitation not found",
            });
        }

        // Verify the current user is the invited advisor
        if (currentUser.email?.toLowerCase() !== relationship.advisorEmail?.toLowerCase()) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to decline this invitation",
            });
        }

        if (relationship.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: `Cannot reject invitation with status: ${relationship.status}`,
            });
        }

        relationship.status = "rejected";
        relationship.endedAt = new Date();
        if (reason) {
            relationship.notes = `Rejection reason: ${reason}`;
        }
        await relationship.save();

        res.status(200).json({
            success: true,
            message: "Advisor invitation rejected",
        });
    } catch (error) {
        console.error("Error rejecting advisor invitation:", error);
        res.status(500).json({
            success: false,
            message: "Failed to reject advisor invitation",
            error: error.message,
        });
    }
};

/**
 * Get my advisors (as job seeker)
 * GET /api/external-advisors/my-advisors
 */
export const getMyAdvisors = async (req, res) => {
    try {
        const clerkUserId = req.auth.userId;
        const { status } = req.query;

        const currentUser = await User.findOne({ auth0Id: clerkUserId });
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: "User profile not found",
            });
        }

        const query = { userId: currentUser._id };
        if (status) {
            query.status = status;
        } else {
            query.status = { $in: ["accepted", "pending"] };
        }

        const advisors = await ExternalAdvisorRelationship.find(query)
            .populate("advisorId", "firstName lastName email profilePicture")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: advisors,
        });
    } catch (error) {
        console.error("Error fetching advisors:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch advisors",
            error: error.message,
        });
    }
};

/**
 * Get my clients (as advisor)
 * GET /api/external-advisors/my-clients
 */
export const getMyClients = async (req, res) => {
    try {
        const clerkUserId = req.auth.userId;
        const { status } = req.query;

        const currentUser = await User.findOne({ auth0Id: clerkUserId });
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: "User profile not found",
            });
        }

        const query = {
            $or: [
                { advisorId: currentUser._id },
                { advisorEmail: currentUser.email?.toLowerCase() },
            ],
        };
        if (status) {
            query.status = status;
        } else {
            query.status = { $in: ["accepted", "pending"] };
        }

        const clients = await ExternalAdvisorRelationship.find(query)
            .populate("userId", "firstName lastName email profilePicture")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: clients,
        });
    } catch (error) {
        console.error("Error fetching clients:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch clients",
            error: error.message,
        });
    }
};

/**
 * Get pending invitations
 * GET /api/external-advisors/pending
 */
export const getPendingInvitations = async (req, res) => {
    try {
        const clerkUserId = req.auth.userId;

        const currentUser = await User.findOne({ auth0Id: clerkUserId });
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: "User profile not found",
            });
        }

        // Sent invitations (as job seeker)
        const sentInvitations = await ExternalAdvisorRelationship.find({
            userId: currentUser._id,
            status: "pending",
        }).sort({ createdAt: -1 });

        // Received invitations (as advisor)
        const receivedInvitations = await ExternalAdvisorRelationship.find({
            $or: [
                { advisorEmail: currentUser.email?.toLowerCase() },
            ],
            status: "pending",
        })
            .populate("userId", "firstName lastName email profilePicture")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: {
                sent: sentInvitations,
                received: receivedInvitations,
            },
        });
    } catch (error) {
        console.error("Error fetching pending invitations:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch pending invitations",
            error: error.message,
        });
    }
};

/**
 * Cancel/end advisor relationship
 * POST /api/external-advisors/cancel/:relationshipId
 */
export const cancelAdvisorRelationship = async (req, res) => {
    try {
        const clerkUserId = req.auth.userId;
        const { relationshipId } = req.params;
        const { reason } = req.body;

        const currentUser = await User.findOne({ auth0Id: clerkUserId });
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: "User profile not found",
            });
        }

        const relationship = await ExternalAdvisorRelationship.findById(relationshipId);

        if (!relationship) {
            return res.status(404).json({
                success: false,
                message: "Advisor relationship not found",
            });
        }

        // Verify user is part of this relationship
        if (
            relationship.userId.toString() !== currentUser._id.toString() &&
            relationship.advisorId?.toString() !== currentUser._id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to cancel this relationship",
            });
        }

        relationship.status = "cancelled";
        relationship.endedAt = new Date();
        if (reason) {
            relationship.notes = (relationship.notes || "") + `\nCancellation reason: ${reason}`;
        }
        await relationship.save();

        res.status(200).json({
            success: true,
            message: "Advisor relationship cancelled",
        });
    } catch (error) {
        console.error("Error cancelling advisor relationship:", error);
        res.status(500).json({
            success: false,
            message: "Failed to cancel advisor relationship",
            error: error.message,
        });
    }
};

/**
 * Update shared data settings
 * PUT /api/external-advisors/:relationshipId/shared-data
 */
export const updateSharedData = async (req, res) => {
    try {
        const clerkUserId = req.auth.userId;
        const { relationshipId } = req.params;
        const { sharedData } = req.body;

        const currentUser = await User.findOne({ auth0Id: clerkUserId });
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: "User profile not found",
            });
        }

        const relationship = await ExternalAdvisorRelationship.findById(relationshipId);

        if (!relationship) {
            return res.status(404).json({
                success: false,
                message: "Advisor relationship not found",
            });
        }

        // Only the job seeker can update shared data
        if (relationship.userId.toString() !== currentUser._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Only the job seeker can update shared data settings",
            });
        }

        relationship.sharedData = { ...relationship.sharedData, ...sharedData };
        await relationship.save();

        res.status(200).json({
            success: true,
            message: "Shared data settings updated",
            data: relationship.sharedData,
        });
    } catch (error) {
        console.error("Error updating shared data:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update shared data settings",
            error: error.message,
        });
    }
};

/**
 * Get advisor dashboard
 * GET /api/external-advisors/dashboard
 */
export const getAdvisorDashboard = async (req, res) => {
    try {
        const clerkUserId = req.auth.userId;

        const currentUser = await User.findOne({ auth0Id: clerkUserId });
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: "User profile not found",
            });
        }

        // Get relationships where user is advisor
        const clientRelationships = await ExternalAdvisorRelationship.find({
            $or: [
                { advisorId: currentUser._id },
                { advisorEmail: currentUser.email?.toLowerCase() },
            ],
            status: "accepted",
        }).populate("userId", "firstName lastName email profilePicture");

        // Get upcoming sessions
        const upcomingSessions = await AdvisorSession.find({
            advisorId: currentUser._id,
            scheduledAt: { $gte: new Date() },
            status: { $in: ["scheduled", "confirmed"] },
        })
            .populate("userId", "firstName lastName")
            .sort({ scheduledAt: 1 })
            .limit(10);

        // Get pending recommendations
        const pendingRecommendations = await AdvisorRecommendation.find({
            advisorId: currentUser._id,
            status: "pending",
        }).populate("userId", "firstName lastName");

        // Get recent evaluations
        const recentEvaluations = await AdvisorEvaluation.find({
            advisorId: currentUser._id,
        })
            .sort({ createdAt: -1 })
            .limit(5);

        // Calculate average rating
        const allEvaluations = await AdvisorEvaluation.find({
            advisorId: currentUser._id,
        });
        const averageRating = allEvaluations.length > 0
            ? allEvaluations.reduce((sum, e) => sum + e.ratings.overall, 0) / allEvaluations.length
            : 0;

        // Get billing summary
        const billings = await AdvisorBilling.find({
            advisorId: currentUser._id,
            status: "active",
        });
        const totalEarnings = billings.reduce((sum, b) => sum + b.totalPaid, 0);

        res.status(200).json({
            success: true,
            data: {
                clients: clientRelationships,
                upcomingSessions,
                pendingRecommendations,
                recentEvaluations,
                stats: {
                    totalClients: clientRelationships.length,
                    averageRating: Math.round(averageRating * 10) / 10,
                    totalEvaluations: allEvaluations.length,
                    totalEarnings,
                },
            },
        });
    } catch (error) {
        console.error("Error fetching advisor dashboard:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch advisor dashboard",
            error: error.message,
        });
    }
};

/**
 * Get client profile (for advisor to view)
 * GET /api/external-advisors/clients/:relationshipId/profile
 */
export const getClientProfile = async (req, res) => {
    try {
        const clerkUserId = req.auth.userId;
        const { relationshipId } = req.params;

        const currentUser = await User.findOne({ auth0Id: clerkUserId });
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: "User profile not found",
            });
        }

        const relationship = await ExternalAdvisorRelationship.findById(relationshipId)
            .populate("userId");

        if (!relationship) {
            return res.status(404).json({
                success: false,
                message: "Relationship not found",
            });
        }

        // Verify current user is the advisor
        if (
            relationship.advisorId?.toString() !== currentUser._id.toString() &&
            relationship.advisorEmail !== currentUser.email?.toLowerCase()
        ) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to view this client",
            });
        }

        // Get shared data based on permissions
        const sharedData = relationship.sharedData;
        const clientData = {
            user: {
                firstName: relationship.userId.firstName,
                lastName: relationship.userId.lastName,
                email: relationship.userId.email,
                profilePicture: relationship.userId.profilePicture,
            },
            focusAreas: relationship.focusAreas,
            contractTerms: relationship.contractTerms,
            impactMetrics: relationship.impactMetrics,
        };

        // Add shared data based on permissions
        if (sharedData.shareResume && relationship.userId.resume) {
            clientData.resume = relationship.userId.resume;
        }
        if (sharedData.shareGoals && relationship.userId.goals) {
            clientData.goals = relationship.userId.goals;
        }

        // Get session history
        const sessions = await AdvisorSession.find({
            relationshipId: relationship._id,
        }).sort({ scheduledAt: -1 });

        // Get recommendations
        const recommendations = await AdvisorRecommendation.find({
            relationshipId: relationship._id,
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: {
                client: clientData,
                relationship,
                sessions,
                recommendations,
            },
        });
    } catch (error) {
        console.error("Error fetching client profile:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch client profile",
            error: error.message,
        });
    }
};

// ===== SESSION MANAGEMENT =====

/**
 * Create/schedule a session
 * POST /api/external-advisors/sessions
 */
export const createSession = async (req, res) => {
    try {
        const clerkUserId = req.auth.userId;
        const {
            relationshipId,
            title,
            description,
            sessionType,
            scheduledAt,
            duration,
            meetingType,
            meetingLink,
            meetingLocation,
            agendaItems,
        } = req.body;

        const currentUser = await User.findOne({ auth0Id: clerkUserId });
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: "User profile not found",
            });
        }

        const relationship = await ExternalAdvisorRelationship.findById(relationshipId);
        if (!relationship || relationship.status !== "accepted") {
            return res.status(404).json({
                success: false,
                message: "Active advisor relationship not found",
            });
        }

        // Verify user is part of relationship
        if (
            relationship.userId.toString() !== currentUser._id.toString() &&
            relationship.advisorId?.toString() !== currentUser._id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to create sessions for this relationship",
            });
        }

        const session = new AdvisorSession({
            relationshipId,
            userId: relationship.userId,
            advisorId: relationship.advisorId,
            title,
            description,
            sessionType: sessionType || "follow_up",
            scheduledAt: new Date(scheduledAt),
            duration: duration || 60,
            meetingType: meetingType || "video",
            meetingLink,
            meetingLocation,
            agendaItems: agendaItems || [],
        });

        await session.save();

        // Update contract terms
        relationship.contractTerms.completedSessions =
            (relationship.contractTerms.completedSessions || 0);
        await relationship.save();

        res.status(201).json({
            success: true,
            message: "Session scheduled successfully",
            data: session,
        });
    } catch (error) {
        console.error("Error creating session:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create session",
            error: error.message,
        });
    }
};

/**
 * Get sessions
 * GET /api/external-advisors/sessions
 */
export const getSessions = async (req, res) => {
    try {
        const clerkUserId = req.auth.userId;
        const { relationshipId, status, upcoming } = req.query;

        const currentUser = await User.findOne({ auth0Id: clerkUserId });
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: "User profile not found",
            });
        }

        const query = {
            $or: [
                { userId: currentUser._id },
                { advisorId: currentUser._id },
            ],
        };

        if (relationshipId) {
            query.relationshipId = relationshipId;
        }
        if (status) {
            query.status = status;
        }
        if (upcoming === "true") {
            query.scheduledAt = { $gte: new Date() };
            query.status = { $in: ["scheduled", "confirmed"] };
        }

        const sessions = await AdvisorSession.find(query)
            .populate("userId", "firstName lastName email")
            .populate("advisorId", "firstName lastName email")
            .sort({ scheduledAt: upcoming === "true" ? 1 : -1 });

        res.status(200).json({
            success: true,
            data: sessions,
        });
    } catch (error) {
        console.error("Error fetching sessions:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch sessions",
            error: error.message,
        });
    }
};

/**
 * Update session
 * PUT /api/external-advisors/sessions/:sessionId
 */
export const updateSession = async (req, res) => {
    try {
        const clerkUserId = req.auth.userId;
        const { sessionId } = req.params;
        const updates = req.body;

        const currentUser = await User.findOne({ auth0Id: clerkUserId });
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: "User profile not found",
            });
        }

        const session = await AdvisorSession.findById(sessionId);
        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Session not found",
            });
        }

        // Verify user is part of session
        if (
            session.userId.toString() !== currentUser._id.toString() &&
            session.advisorId.toString() !== currentUser._id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to update this session",
            });
        }

        // Handle status changes
        if (updates.status === "completed" && session.status !== "completed") {
            updates.completedAt = new Date();

            // Update contract completed sessions
            const relationship = await ExternalAdvisorRelationship.findById(session.relationshipId);
            if (relationship) {
                relationship.contractTerms.completedSessions =
                    (relationship.contractTerms.completedSessions || 0) + 1;
                await relationship.save();
            }
        }

        if (updates.status === "cancelled" && session.status !== "cancelled") {
            updates.cancelledAt = new Date();
            updates.cancelledBy = currentUser._id;
        }

        Object.assign(session, updates);
        await session.save();

        res.status(200).json({
            success: true,
            message: "Session updated successfully",
            data: session,
        });
    } catch (error) {
        console.error("Error updating session:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update session",
            error: error.message,
        });
    }
};

/**
 * Add session notes
 * POST /api/external-advisors/sessions/:sessionId/notes
 */
export const addSessionNotes = async (req, res) => {
    try {
        const clerkUserId = req.auth.userId;
        const { sessionId } = req.params;
        const { sessionNotes, keyTakeaways, actionItems } = req.body;

        const currentUser = await User.findOne({ auth0Id: clerkUserId });
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: "User profile not found",
            });
        }

        const session = await AdvisorSession.findById(sessionId);
        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Session not found",
            });
        }

        if (session.advisorId.toString() !== currentUser._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Only the advisor can add session notes",
            });
        }

        if (sessionNotes) session.sessionNotes = sessionNotes;
        if (keyTakeaways) session.keyTakeaways = keyTakeaways;
        if (actionItems) session.actionItems = actionItems;

        await session.save();

        res.status(200).json({
            success: true,
            message: "Session notes added successfully",
            data: session,
        });
    } catch (error) {
        console.error("Error adding session notes:", error);
        res.status(500).json({
            success: false,
            message: "Failed to add session notes",
            error: error.message,
        });
    }
};

// ===== BILLING MANAGEMENT =====

/**
 * Get billing for a relationship
 * GET /api/external-advisors/billing/:relationshipId
 */
export const getBilling = async (req, res) => {
    try {
        const clerkUserId = req.auth.userId;
        const { relationshipId } = req.params;

        const currentUser = await User.findOne({ auth0Id: clerkUserId });
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: "User profile not found",
            });
        }

        const relationship = await ExternalAdvisorRelationship.findById(relationshipId);
        if (!relationship) {
            return res.status(404).json({
                success: false,
                message: "Relationship not found",
            });
        }

        // Verify user is part of relationship
        if (
            relationship.userId.toString() !== currentUser._id.toString() &&
            relationship.advisorId?.toString() !== currentUser._id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to view billing",
            });
        }

        let billing = await AdvisorBilling.findOne({ relationshipId });

        // Create a default billing if none exists
        if (!billing) {
            billing = {
                billingType: "hourly",
                hourlyRate: 0,
                isActive: false,
            };
        }

        const payments = await AdvisorPayment.find({ billingId: billing?._id })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            billing,
            payments,
        });
    } catch (error) {
        console.error("Error fetching billing:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch billing",
            error: error.message,
        });
    }
};

/**
 * Update billing configuration
 * PUT /api/external-advisors/billing/:relationshipId
 */
export const updateBilling = async (req, res) => {
    try {
        const clerkUserId = req.auth.userId;
        const { relationshipId } = req.params;
        const updates = req.body;

        const currentUser = await User.findOne({ auth0Id: clerkUserId });
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: "User profile not found",
            });
        }

        const relationship = await ExternalAdvisorRelationship.findById(relationshipId);
        if (!relationship) {
            return res.status(404).json({
                success: false,
                message: "Relationship not found",
            });
        }

        // Only advisor can update billing config
        if (relationship.advisorId?.toString() !== currentUser._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Only the advisor can update billing configuration",
            });
        }

        let billing = await AdvisorBilling.findOne({ relationshipId });
        if (!billing) {
            billing = new AdvisorBilling({
                relationshipId,
                userId: relationship.userId,
                advisorId: relationship.advisorId,
            });
        }

        Object.assign(billing, updates);
        await billing.save();

        res.status(200).json({
            success: true,
            message: "Billing updated successfully",
            data: billing,
        });
    } catch (error) {
        console.error("Error updating billing:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update billing",
            error: error.message,
        });
    }
};

/**
 * Get payments for a relationship
 * GET /api/external-advisors/payments/:relationshipId
 */
export const getPayments = async (req, res) => {
    try {
        const clerkUserId = req.auth.userId;
        const { relationshipId } = req.params;

        const currentUser = await User.findOne({ auth0Id: clerkUserId });
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: "User profile not found",
            });
        }

        const relationship = await ExternalAdvisorRelationship.findById(relationshipId);
        if (!relationship) {
            return res.status(404).json({
                success: false,
                message: "Relationship not found",
            });
        }

        // Verify user is part of the relationship
        const isParticipant =
            relationship.userId?.toString() === currentUser._id.toString() ||
            relationship.advisorId?.toString() === currentUser._id.toString();

        if (!isParticipant) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to view these payments",
            });
        }

        const billing = await AdvisorBilling.findOne({ relationshipId });

        let payments = [];
        if (billing) {
            payments = await AdvisorPayment.find({ billingId: billing._id })
                .sort({ createdAt: -1 });
        }

        res.status(200).json({
            success: true,
            payments,
        });
    } catch (error) {
        console.error("Error fetching payments:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch payments",
            error: error.message,
        });
    }
};

/**
 * Record a payment
 * POST /api/external-advisors/payments
 */
export const recordPayment = async (req, res) => {
    try {
        const clerkUserId = req.auth.userId;
        const {
            relationshipId,
            sessionId,
            amount,
            currency,
            description,
            paymentMethod,
        } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Valid amount is required",
            });
        }

        const currentUser = await User.findOne({ auth0Id: clerkUserId });
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: "User profile not found",
            });
        }

        const relationship = await ExternalAdvisorRelationship.findById(relationshipId);
        if (!relationship) {
            return res.status(404).json({
                success: false,
                message: "Relationship not found",
            });
        }

        // Create billing record if it doesn't exist
        let billing = await AdvisorBilling.findOne({ relationshipId });
        if (!billing) {
            billing = new AdvisorBilling({
                relationshipId: relationship._id,
                userId: relationship.userId,
                advisorId: relationship.advisorId,
                billingType: "hourly",
                isActive: true,
            });
            await billing.save();
        }

        const payment = new AdvisorPayment({
            billingId: billing._id,
            userId: relationship.userId,
            advisorId: relationship.advisorId,
            sessionId,
            amount: parseFloat(amount),
            currency: currency || "USD",
            description: description || "Payment",
            paymentMethod: paymentMethod || "other",
            status: "completed",
            paidAt: new Date(),
            paymentDate: new Date(),
        });

        await payment.save();

        // Update billing totals
        billing.totalPaid = (billing.totalPaid || 0) + parseFloat(amount);
        await billing.save();

        res.status(201).json({
            success: true,
            message: "Payment recorded successfully",
            data: payment,
        });
    } catch (error) {
        console.error("Error recording payment:", error);
        res.status(500).json({
            success: false,
            message: "Failed to record payment",
            error: error.message,
        });
    }
};

// ===== RECOMMENDATIONS =====

/**
 * Create recommendation
 * POST /api/external-advisors/recommendations
 */
export const createRecommendation = async (req, res) => {
    try {
        const clerkUserId = req.auth.userId;
        const {
            relationshipId,
            sessionId,
            title,
            description,
            category,
            priority,
            targetDate,
            estimatedEffort,
            expectedImpact,
            resources,
        } = req.body;

        const currentUser = await User.findOne({ auth0Id: clerkUserId });
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: "User profile not found",
            });
        }

        const relationship = await ExternalAdvisorRelationship.findById(relationshipId);
        if (!relationship || relationship.status !== "accepted") {
            return res.status(404).json({
                success: false,
                message: "Active advisor relationship not found",
            });
        }

        // Only advisor can create recommendations
        if (relationship.advisorId?.toString() !== currentUser._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Only the advisor can create recommendations",
            });
        }

        const recommendation = new AdvisorRecommendation({
            relationshipId,
            userId: relationship.userId,
            advisorId: currentUser._id,
            sessionId,
            title,
            description,
            category,
            priority: priority || "medium",
            targetDate: targetDate ? new Date(targetDate) : null,
            estimatedEffort,
            expectedImpact,
            resources: resources || [],
        });

        await recommendation.save();

        res.status(201).json({
            success: true,
            message: "Recommendation created successfully",
            data: recommendation,
        });
    } catch (error) {
        console.error("Error creating recommendation:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create recommendation",
            error: error.message,
        });
    }
};

/**
 * Get recommendations
 * GET /api/external-advisors/recommendations
 */
export const getRecommendations = async (req, res) => {
    try {
        const clerkUserId = req.auth.userId;
        const { relationshipId, status, category } = req.query;

        const currentUser = await User.findOne({ auth0Id: clerkUserId });
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: "User profile not found",
            });
        }

        const query = {
            $or: [
                { userId: currentUser._id },
                { advisorId: currentUser._id },
            ],
        };

        if (relationshipId) {
            query.relationshipId = relationshipId;
        }
        if (status) {
            query.status = status;
        }
        if (category) {
            query.category = category;
        }

        const recommendations = await AdvisorRecommendation.find(query)
            .populate("advisorId", "firstName lastName")
            .populate("userId", "firstName lastName")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: recommendations,
        });
    } catch (error) {
        console.error("Error fetching recommendations:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch recommendations",
            error: error.message,
        });
    }
};

/**
 * Update recommendation status
 * PUT /api/external-advisors/recommendations/:recommendationId
 */
export const updateRecommendation = async (req, res) => {
    try {
        const clerkUserId = req.auth.userId;
        const { recommendationId } = req.params;
        const updates = req.body;

        const currentUser = await User.findOne({ auth0Id: clerkUserId });
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: "User profile not found",
            });
        }

        const recommendation = await AdvisorRecommendation.findById(recommendationId);
        if (!recommendation) {
            return res.status(404).json({
                success: false,
                message: "Recommendation not found",
            });
        }

        // User can update status and progress, advisor can update content
        if (
            recommendation.userId.toString() !== currentUser._id.toString() &&
            recommendation.advisorId.toString() !== currentUser._id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to update this recommendation",
            });
        }

        if (updates.status === "in_progress" && recommendation.status === "pending") {
            updates.startedAt = new Date();
        }
        if (updates.status === "completed" && recommendation.status !== "completed") {
            updates.completedAt = new Date();
        }

        Object.assign(recommendation, updates);
        await recommendation.save();

        res.status(200).json({
            success: true,
            message: "Recommendation updated successfully",
            data: recommendation,
        });
    } catch (error) {
        console.error("Error updating recommendation:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update recommendation",
            error: error.message,
        });
    }
};

// ===== EVALUATIONS =====

/**
 * Create evaluation
 * POST /api/external-advisors/evaluations
 */
export const createEvaluation = async (req, res) => {
    try {
        const clerkUserId = req.auth.userId;
        const {
            relationshipId,
            sessionId,
            evaluationType,
            ratings,
            feedback,
            goalsAchieved,
            npsScore,
            wouldRecommend,
            wouldContinue,
            isPublic,
            isAnonymous,
        } = req.body;

        console.log("Creating evaluation for relationship:", relationshipId);
        console.log("Ratings:", JSON.stringify(ratings));

        if (!relationshipId) {
            return res.status(400).json({
                success: false,
                message: "Relationship ID is required",
            });
        }

        if (!ratings || !ratings.overall) {
            return res.status(400).json({
                success: false,
                message: "Overall rating is required",
            });
        }

        const currentUser = await User.findOne({ auth0Id: clerkUserId });
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: "User profile not found",
            });
        }

        const relationship = await ExternalAdvisorRelationship.findById(relationshipId);
        if (!relationship) {
            return res.status(404).json({
                success: false,
                message: "Advisor relationship not found",
            });
        }

        // Only the client can create evaluations
        if (relationship.userId.toString() !== currentUser._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Only the client can create evaluations",
            });
        }

        // Check if advisor exists
        if (!relationship.advisorId) {
            return res.status(400).json({
                success: false,
                message: "Cannot evaluate - advisor has not accepted the invitation yet",
            });
        }

        const evaluation = new AdvisorEvaluation({
            relationshipId,
            userId: currentUser._id,
            advisorId: relationship.advisorId,
            sessionId,
            evaluationType: evaluationType || "session_feedback",
            ratings,
            feedback,
            goalsAchieved,
            npsScore,
            wouldRecommend,
            wouldContinue,
            isPublic: isPublic || false,
            isAnonymous: isAnonymous || false,
        });

        await evaluation.save();

        res.status(201).json({
            success: true,
            message: "Evaluation submitted successfully",
            data: evaluation,
        });
    } catch (error) {
        console.error("Error creating evaluation:", error);
        console.error("Error stack:", error.stack);
        res.status(500).json({
            success: false,
            message: "Failed to create evaluation: " + error.message,
            error: error.message,
            details: error.errors ? Object.keys(error.errors).map(k => `${k}: ${error.errors[k].message}`) : null,
        });
    }
};

/**
 * Get evaluations
 * GET /api/external-advisors/evaluations
 */
export const getEvaluations = async (req, res) => {
    try {
        const clerkUserId = req.auth.userId;
        const { relationshipId, advisorId } = req.query;

        const currentUser = await User.findOne({ auth0Id: clerkUserId });
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: "User profile not found",
            });
        }

        const query = {};

        if (relationshipId) {
            query.relationshipId = relationshipId;
        } else if (advisorId) {
            // Public reviews for an advisor
            query.advisorId = advisorId;
            query.isPublic = true;
        } else {
            // Own evaluations
            query.$or = [
                { userId: currentUser._id },
                { advisorId: currentUser._id },
            ];
        }

        const evaluations = await AdvisorEvaluation.find(query)
            .populate("userId", "firstName lastName")
            .populate("advisorId", "firstName lastName")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: evaluations,
        });
    } catch (error) {
        console.error("Error fetching evaluations:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch evaluations",
            error: error.message,
        });
    }
};

/**
 * Advisor responds to evaluation
 * PUT /api/external-advisors/evaluations/:evaluationId/respond
 */
export const respondToEvaluation = async (req, res) => {
    try {
        const clerkUserId = req.auth.userId;
        const { evaluationId } = req.params;
        const { content } = req.body;

        const currentUser = await User.findOne({ auth0Id: clerkUserId });
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: "User profile not found",
            });
        }

        const evaluation = await AdvisorEvaluation.findById(evaluationId);
        if (!evaluation) {
            return res.status(404).json({
                success: false,
                message: "Evaluation not found",
            });
        }

        if (evaluation.advisorId.toString() !== currentUser._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Only the advisor can respond to evaluations",
            });
        }

        evaluation.advisorResponse = {
            content,
            respondedAt: new Date(),
        };
        await evaluation.save();

        res.status(200).json({
            success: true,
            message: "Response added successfully",
            data: evaluation,
        });
    } catch (error) {
        console.error("Error responding to evaluation:", error);
        res.status(500).json({
            success: false,
            message: "Failed to respond to evaluation",
            error: error.message,
        });
    }
};

/**
 * Get advisor rating stats
 * GET /api/external-advisors/ratings/:advisorId
 */
export const getAdvisorRating = async (req, res) => {
    try {
        const { advisorId } = req.params;

        const evaluations = await AdvisorEvaluation.find({
            advisorId,
            "ratings.overall": { $exists: true }
        });

        if (evaluations.length === 0) {
            return res.status(200).json({
                success: true,
                data: {
                    averageRating: null,
                    totalReviews: 0,
                    breakdown: null,
                },
            });
        }

        // Calculate averages
        let totalOverall = 0;
        let totalCommunication = 0;
        let totalExpertise = 0;
        let totalResponsiveness = 0;
        let countCommunication = 0;
        let countExpertise = 0;
        let countResponsiveness = 0;

        evaluations.forEach(ev => {
            totalOverall += ev.ratings.overall;
            if (ev.ratings.communication) {
                totalCommunication += ev.ratings.communication;
                countCommunication++;
            }
            if (ev.ratings.expertise) {
                totalExpertise += ev.ratings.expertise;
                countExpertise++;
            }
            if (ev.ratings.responsiveness) {
                totalResponsiveness += ev.ratings.responsiveness;
                countResponsiveness++;
            }
        });

        res.status(200).json({
            success: true,
            data: {
                averageRating: Math.round((totalOverall / evaluations.length) * 10) / 10,
                totalReviews: evaluations.length,
                breakdown: {
                    communication: countCommunication > 0 ? Math.round((totalCommunication / countCommunication) * 10) / 10 : null,
                    expertise: countExpertise > 0 ? Math.round((totalExpertise / countExpertise) * 10) / 10 : null,
                    responsiveness: countResponsiveness > 0 ? Math.round((totalResponsiveness / countResponsiveness) * 10) / 10 : null,
                },
            },
        });
    } catch (error) {
        console.error("Error getting advisor rating:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get advisor rating",
            error: error.message,
        });
    }
};

// ===== MESSAGING =====

/**
 * Send message
 * POST /api/external-advisors/messages
 */
export const sendMessage = async (req, res) => {
    try {
        const clerkUserId = req.auth.userId;
        const {
            relationshipId,
            content,
            messageType,
            attachments,
            sessionId,
            priority,
            parentMessageId,
        } = req.body;

        const currentUser = await User.findOne({ auth0Id: clerkUserId });
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: "User profile not found",
            });
        }

        const relationship = await ExternalAdvisorRelationship.findById(relationshipId);
        if (!relationship || relationship.status !== "accepted") {
            return res.status(404).json({
                success: false,
                message: "Active advisor relationship not found",
            });
        }

        // Determine recipient
        const isUser = relationship.userId.toString() === currentUser._id.toString();
        const recipientId = isUser ? relationship.advisorId : relationship.userId;

        // Ensure recipientId exists
        if (!recipientId) {
            return res.status(400).json({
                success: false,
                message: "Cannot send message - recipient not found. The advisor may not have accepted the invitation yet.",
            });
        }

        // Check if sender and recipient are the same (self-invitation/test case)
        const isSelfMessage = currentUser._id.toString() === recipientId.toString();

        const message = new AdvisorMessage({
            relationshipId,
            senderId: currentUser._id,
            recipientId,
            content,
            messageType: messageType || "text",
            attachments: attachments || [],
            sessionId,
            priority: priority || "normal",
            parentMessageId,
        });

        await message.save();

        // If self-messaging (test mode), create an echo response
        if (isSelfMessage) {
            const echoMessage = new AdvisorMessage({
                relationshipId,
                senderId: recipientId, // Same person, but as "the other side"
                recipientId: currentUser._id,
                content: `Echo: ${content}`,
                messageType: "text",
                priority: "normal",
            });
            await echoMessage.save();
        }

        res.status(201).json({
            success: true,
            message: "Message sent successfully",
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
 * Get messages
 * GET /api/external-advisors/messages/:relationshipId
 */
export const getMessages = async (req, res) => {
    try {
        const clerkUserId = req.auth.userId;
        const { relationshipId } = req.params;
        const { limit = 50, before } = req.query;

        const currentUser = await User.findOne({ auth0Id: clerkUserId });
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: "User profile not found",
            });
        }

        const relationship = await ExternalAdvisorRelationship.findById(relationshipId);
        if (!relationship) {
            return res.status(404).json({
                success: false,
                message: "Relationship not found",
            });
        }

        // Verify user is part of relationship
        if (
            relationship.userId.toString() !== currentUser._id.toString() &&
            relationship.advisorId?.toString() !== currentUser._id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to view messages",
            });
        }

        const query = { relationshipId };
        if (before) {
            query.createdAt = { $lt: new Date(before) };
        }

        const messages = await AdvisorMessage.find(query)
            .populate("senderId", "firstName lastName")
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        // Mark messages as read
        await AdvisorMessage.updateMany(
            {
                relationshipId,
                recipientId: currentUser._id,
                isRead: false,
            },
            {
                isRead: true,
                readAt: new Date(),
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

/**
 * Get unread message count
 * GET /api/external-advisors/messages/unread/count
 */
export const getUnreadCount = async (req, res) => {
    try {
        const clerkUserId = req.auth.userId;

        const currentUser = await User.findOne({ auth0Id: clerkUserId });
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: "User profile not found",
            });
        }

        const count = await AdvisorMessage.countDocuments({
            recipientId: currentUser._id,
            isRead: false,
        });

        res.status(200).json({
            success: true,
            data: { count },
        });
    } catch (error) {
        console.error("Error fetching unread count:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch unread count",
            error: error.message,
        });
    }
};

// ===== IMPACT TRACKING =====

/**
 * Update impact metrics
 * PUT /api/external-advisors/:relationshipId/impact
 */
export const updateImpactMetrics = async (req, res) => {
    try {
        const clerkUserId = req.auth.userId;
        const { relationshipId } = req.params;
        const { impactMetrics } = req.body;

        const currentUser = await User.findOne({ auth0Id: clerkUserId });
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: "User profile not found",
            });
        }

        const relationship = await ExternalAdvisorRelationship.findById(relationshipId);
        if (!relationship) {
            return res.status(404).json({
                success: false,
                message: "Relationship not found",
            });
        }

        // Only user can update their impact metrics
        if (relationship.userId.toString() !== currentUser._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Only the client can update impact metrics",
            });
        }

        relationship.impactMetrics = {
            ...relationship.impactMetrics,
            ...impactMetrics,
            lastMetricsUpdate: new Date(),
        };
        await relationship.save();

        res.status(200).json({
            success: true,
            message: "Impact metrics updated",
            data: relationship.impactMetrics,
        });
    } catch (error) {
        console.error("Error updating impact metrics:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update impact metrics",
            error: error.message,
        });
    }
};

/**
 * Get impact report
 * GET /api/external-advisors/:relationshipId/impact-report
 */
export const getImpactReport = async (req, res) => {
    try {
        const clerkUserId = req.auth.userId;
        const { relationshipId } = req.params;

        const currentUser = await User.findOne({ auth0Id: clerkUserId });
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: "User profile not found",
            });
        }

        const relationship = await ExternalAdvisorRelationship.findById(relationshipId)
            .populate("userId", "firstName lastName")
            .populate("advisorId", "firstName lastName");

        if (!relationship) {
            return res.status(404).json({
                success: false,
                message: "Relationship not found",
            });
        }

        // Verify user is part of relationship
        if (
            relationship.userId._id.toString() !== currentUser._id.toString() &&
            relationship.advisorId?._id.toString() !== currentUser._id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to view impact report",
            });
        }

        // Get session stats
        const sessions = await AdvisorSession.find({
            relationshipId,
            status: "completed",
        });

        // Get recommendation stats
        const recommendations = await AdvisorRecommendation.find({ relationshipId });
        const completedRecommendations = recommendations.filter(r => r.status === "completed");

        // Get evaluation stats
        const evaluations = await AdvisorEvaluation.find({ relationshipId });
        const avgRating = evaluations.length > 0
            ? evaluations.reduce((sum, e) => sum + e.ratings.overall, 0) / evaluations.length
            : null;

        // Calculate impact scores
        const metrics = relationship.impactMetrics;
        const interviewImprovement = metrics.interviewsBeforeAdvisor > 0
            ? ((metrics.interviewsAfterAdvisor - metrics.interviewsBeforeAdvisor) / metrics.interviewsBeforeAdvisor) * 100
            : null;
        const offerImprovement = metrics.offersBeforeAdvisor > 0
            ? ((metrics.offersAfterAdvisor - metrics.offersBeforeAdvisor) / metrics.offersBeforeAdvisor) * 100
            : null;

        res.status(200).json({
            success: true,
            data: {
                relationship: {
                    startDate: relationship.acceptedAt,
                    duration: relationship.acceptedAt
                        ? Math.floor((new Date() - relationship.acceptedAt) / (1000 * 60 * 60 * 24))
                        : 0,
                    focusAreas: relationship.focusAreas,
                },
                sessions: {
                    total: sessions.length,
                    totalHours: sessions.reduce((sum, s) => sum + (s.duration / 60), 0),
                },
                recommendations: {
                    total: recommendations.length,
                    completed: completedRecommendations.length,
                    completionRate: recommendations.length > 0
                        ? Math.round((completedRecommendations.length / recommendations.length) * 100)
                        : 0,
                },
                satisfaction: {
                    averageRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
                    totalEvaluations: evaluations.length,
                },
                careerImpact: {
                    ...metrics,
                    interviewImprovement,
                    offerImprovement,
                },
            },
        });
    } catch (error) {
        console.error("Error generating impact report:", error);
        res.status(500).json({
            success: false,
            message: "Failed to generate impact report",
            error: error.message,
        });
    }
};

/**
 * Get impact metrics for a relationship
 * GET /api/external-advisors/impact/:relationshipId
 */
export const getImpactMetrics = async (req, res) => {
    try {
        const clerkUserId = req.auth.userId;
        const { relationshipId } = req.params;

        const currentUser = await User.findOne({ auth0Id: clerkUserId });
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: "User profile not found",
            });
        }

        const relationship = await ExternalAdvisorRelationship.findById(relationshipId);
        if (!relationship) {
            return res.status(404).json({
                success: false,
                message: "Relationship not found",
            });
        }

        // Get impact metrics from the AdvisorImpactMetric collection
        const metrics = await AdvisorImpactMetric.find({ relationshipId }).sort({ createdAt: -1 });

        // Calculate summary
        const summary = {
            applications: 0,
            interviews: 0,
            offers: 0,
            networking: 0,
            skills: 0,
        };

        metrics.forEach(m => {
            if (summary[m.metricType] !== undefined) {
                summary[m.metricType] += m.value || 1;
            }
        });

        res.status(200).json({
            success: true,
            metrics,
            summary,
        });
    } catch (error) {
        console.error("Error getting impact metrics:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get impact metrics",
            error: error.message,
        });
    }
};

/**
 * Add impact metric
 * POST /api/external-advisors/impact
 */
export const addImpactMetric = async (req, res) => {
    try {
        const clerkUserId = req.auth.userId;
        const { relationshipId, metricType, value, description, relatedJobId, milestone } = req.body;

        // Log the incoming request for debugging
        console.log("Adding impact metric:", { relationshipId, metricType, value, description, milestone });

        if (!relationshipId) {
            return res.status(400).json({
                success: false,
                message: "Relationship ID is required",
            });
        }

        if (!metricType) {
            return res.status(400).json({
                success: false,
                message: "Metric type is required",
            });
        }

        const currentUser = await User.findOne({ auth0Id: clerkUserId });
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: "User profile not found",
            });
        }

        const relationship = await ExternalAdvisorRelationship.findById(relationshipId);
        if (!relationship) {
            return res.status(404).json({
                success: false,
                message: "Relationship not found",
            });
        }

        const metric = new AdvisorImpactMetric({
            relationshipId,
            userId: relationship.userId,
            advisorId: relationship.advisorId || null,
            metricType,
            value: value || 1,
            description: description || "",
            relatedJobId: relatedJobId || undefined,
            milestone: milestone || "",
            recordedBy: currentUser._id,
        });

        await metric.save();

        res.status(201).json({
            success: true,
            message: "Impact metric added",
            data: metric,
        });
    } catch (error) {
        console.error("Error adding impact metric:", error);
        res.status(500).json({
            success: false,
            message: "Failed to add impact metric",
            error: error.message,
        });
    }
};

// ===== EMAIL HELPERS =====

async function sendAdvisorInvitationEmail(advisorEmail, userName, message, token, existingUser) {
    try {
        const nodemailer = (await import("nodemailer")).default;
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        const acceptLink = existingUser
            ? `${process.env.FRONTEND_URL}/advisors?invitation=pending`
            : `${process.env.FRONTEND_URL}/register?advisorToken=${token}`;

        const mailOptions = {
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: advisorEmail,
            subject: `${userName} has invited you to be their Career Advisor`,
            html: `
                <h2>Career Advisor Invitation</h2>
                <p><strong>${userName}</strong> would like you to be their career advisor on HotSho.</p>
                ${message ? `<p><em>Personal message:</em></p><blockquote>${message}</blockquote>` : ""}
                <p>As a career advisor, you'll be able to:</p>
                <ul>
                    <li>Review their resume and career materials</li>
                    <li>Schedule coaching sessions</li>
                    <li>Provide recommendations and track progress</li>
                    <li>Set up paid coaching packages (optional)</li>
                    <li>Communicate through secure messaging</li>
                </ul>
                <p>
                    <a href="${acceptLink}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0;">
                        ${existingUser ? "View Invitation" : "Sign Up & Accept Invitation"}
                    </a>
                </p>
                <p>Best regards,<br/>The HotSho Team</p>
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Sent advisor invitation email to ${advisorEmail}`);
    } catch (error) {
        console.error("Error sending advisor invitation email:", error);
    }
}

async function sendAdvisorAcceptedEmail(userEmail, advisorName) {
    try {
        const nodemailer = (await import("nodemailer")).default;
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        const mailOptions = {
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: userEmail,
            subject: "Your Career Advisor Has Accepted! 🎉",
            html: `
                <h2>Great News!</h2>
                <p><strong>${advisorName}</strong> has accepted your invitation to be your career advisor.</p>
                <p>You can now:</p>
                <ul>
                    <li>Schedule your first session</li>
                    <li>Start messaging your advisor</li>
                    <li>Share your career materials</li>
                </ul>
                <p>
                    <a href="${process.env.FRONTEND_URL}/advisors" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0;">
                        Go to Advisor Dashboard
                    </a>
                </p>
                <p>Best regards,<br/>The HotSho Team</p>
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Sent advisor accepted email to ${userEmail}`);
    } catch (error) {
        console.error("Error sending advisor accepted email:", error);
    }
}
