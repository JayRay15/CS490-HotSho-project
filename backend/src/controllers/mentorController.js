import crypto from "crypto";
import mongoose from "mongoose";
import {
  MentorRelationship,
  MentorFeedback,
  MentorRecommendation,
  MentorMessage,
  MentorProgressReport,
} from "../models/Mentor.js";
import { User } from "../models/User.js";

// ===== MENTOR RELATIONSHIP MANAGEMENT =====

/**
 * Invite a mentor to collaborate
 * POST /api/mentors/invite
 */
export const inviteMentor = async (req, res) => {
  try {
    const { mentorEmail, relationshipType, invitationMessage, focusAreas, sharedData } = req.body;
    const clerkUserId = req.auth.userId;

    // Validate input
    if (!mentorEmail) {
      return res.status(400).json({
        success: false,
        message: "Mentor email is required",
      });
    }

    if (!clerkUserId) {
      return res.status(400).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Get MongoDB user by auth0Id
    const currentUser = await User.findOne({ auth0Id: clerkUserId });
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User profile not found",
      });
    }

    const menteeObjectId = currentUser._id;

    // Check if already invited
    const existingRelationship = await MentorRelationship.findOne({
      menteeId: menteeObjectId,
      mentorEmail: mentorEmail.toLowerCase(),
    });

    if (existingRelationship && existingRelationship.status === "pending") {
      return res.status(409).json({
        success: false,
        message: "Pending invitation already exists for this mentor",
      });
    }

    if (existingRelationship && existingRelationship.status === "accepted") {
      return res.status(409).json({
        success: false,
        message: "This mentor is already collaborating with you",
      });
    }

    // Generate invitation token
    const invitationToken = crypto.randomBytes(32).toString("hex");

    // Create mentor relationship
    const relationship = new MentorRelationship({
      menteeId: menteeObjectId,
      mentorEmail: mentorEmail.toLowerCase(),
      relationshipType: relationshipType || "mentor",
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
      },
      invitationToken,
    });

    await relationship.save();

    // Try to find existing mentor user
    const mentorUser = await User.findOne({
      email: mentorEmail.toLowerCase(),
    });

    if (mentorUser) {
      // Mentor exists, send notification email (but DON'T set mentorId yet - wait for acceptance)
      await sendMentorInvitationEmail(
        mentorUser.email,
        currentUser.firstName || "A mentee",
        invitationMessage,
        relationship._id
      );
    } else {
      // Mentor doesn't exist yet, send invite with sign-up link
      await sendMentorSignUpInvitationEmail(
        mentorEmail,
        currentUser.firstName || "A mentee",
        invitationMessage,
        invitationToken
      );
    }

    res.status(201).json({
      success: true,
      message: "Mentor invitation sent successfully",
      data: {
        relationshipId: relationship._id,
        status: relationship.status,
      },
    });
  } catch (error) {
    console.error("Error inviting mentor:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send mentor invitation",
      error: error.message,
    });
  }
};

/**
 * Accept mentor invitation
 * POST /api/mentors/accept/:relationshipId
 */
export const acceptMentorInvitation = async (req, res) => {
  try {
    const clerkUserId = req.auth.userId;
    const { relationshipId } = req.params;

    // Get MongoDB user by auth0Id
    const currentUser = await User.findOne({ auth0Id: clerkUserId });
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User profile not found",
      });
    }

    const relationship = await MentorRelationship.findById(relationshipId);

    if (!relationship) {
      return res.status(404).json({
        success: false,
        message: "Mentor invitation not found",
      });
    }

    if (relationship.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Cannot accept invitation with status: ${relationship.status}`,
      });
    }

    // Update relationship
    relationship.mentorId = currentUser._id;
    relationship.status = "accepted";
    relationship.acceptedAt = new Date();
    await relationship.save();

    // Send confirmation email to mentee
    const menteeUser = await User.findById(relationship.menteeId);
    if (menteeUser) {
      await sendMentorAcceptedEmail(menteeUser.email, currentUser._id);
    }

    res.status(200).json({
      success: true,
      message: "Mentor invitation accepted",
      data: relationship,
    });
  } catch (error) {
    console.error("Error accepting mentor invitation:", error);
    res.status(500).json({
      success: false,
      message: "Failed to accept mentor invitation",
      error: error.message,
    });
  }
};

/**
 * Reject mentor invitation
 * POST /api/mentors/reject/:relationshipId
 */
export const rejectMentorInvitation = async (req, res) => {
  try {
    const clerkUserId = req.auth.userId;
    const { relationshipId } = req.params;

    // Get MongoDB user by auth0Id
    const currentUser = await User.findOne({ auth0Id: clerkUserId });
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User profile not found",
      });
    }

    const relationship = await MentorRelationship.findById(relationshipId);

    if (!relationship) {
      return res.status(404).json({
        success: false,
        message: "Mentor invitation not found",
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
    await relationship.save();

    // Notify mentee of rejection
    const menteeUser = await User.findById(relationship.menteeId);
    if (menteeUser) {
      await sendMentorRejectedEmail(menteeUser.email);
    }

    res.status(200).json({
      success: true,
      message: "Mentor invitation rejected",
    });
  } catch (error) {
    console.error("Error rejecting mentor invitation:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject mentor invitation",
      error: error.message,
    });
  }
};

/**
 * Accept mentor invitation by token (for new users who signed up via invitation link)
 * POST /api/mentors/accept-token/:token
 */
export const acceptMentorInvitationByToken = async (req, res) => {
  try {
    const clerkUserId = req.auth.userId;
    const { token } = req.params;

    // Get MongoDB user by auth0Id
    const currentUser = await User.findOne({ auth0Id: clerkUserId });
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User profile not found",
      });
    }

    // Find relationship by invitation token
    const relationship = await MentorRelationship.findOne({ invitationToken: token });

    if (!relationship) {
      return res.status(404).json({
        success: false,
        message: "Invitation not found or already used",
      });
    }

    if (relationship.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Cannot accept invitation with status: ${relationship.status}`,
      });
    }

    // Verify the accepting user's email matches the invitation
    if (currentUser.email.toLowerCase() !== relationship.mentorEmail.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: "This invitation was sent to a different email address",
      });
    }

    // Update relationship
    relationship.mentorId = currentUser._id;
    relationship.status = "accepted";
    relationship.acceptedAt = new Date();
    relationship.invitationToken = null; // Clear token after use
    await relationship.save();

    // Send confirmation email to mentee
    const menteeUser = await User.findById(relationship.menteeId);
    if (menteeUser) {
      await sendMentorAcceptedEmail(menteeUser.email, currentUser._id);
    }

    res.status(200).json({
      success: true,
      message: "Mentor invitation accepted successfully",
      data: relationship,
    });
  } catch (error) {
    console.error("Error accepting mentor invitation by token:", error);
    res.status(500).json({
      success: false,
      message: "Failed to accept mentor invitation",
      error: error.message,
    });
  }
};

/**
 * Get all mentors for a mentee
 * GET /api/mentors/my-mentors
 */
export const getMyMentors = async (req, res) => {
  try {
    const clerkUserId = req.auth.userId;

    if (!clerkUserId) {
      return res.status(400).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Get MongoDB user by auth0Id
    const currentUser = await User.findOne({ auth0Id: clerkUserId });
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User profile not found",
      });
    }

    const relationships = await MentorRelationship.find({
      menteeId: currentUser._id,
      status: "accepted",
    }).populate("mentorId", "firstName lastName email profilePicture");

    res.status(200).json({
      success: true,
      data: relationships,
    });
  } catch (error) {
    console.error("Error fetching mentors:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch mentors",
      error: error.message,
    });
  }
};

/**
 * Get all mentees for a mentor
 * GET /api/mentors/my-mentees
 */
export const getMyMentees = async (req, res) => {
  try {
    const clerkUserId = req.auth.userId;

    if (!clerkUserId) {
      return res.status(400).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Get MongoDB user by auth0Id
    const currentUser = await User.findOne({ auth0Id: clerkUserId });
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User profile not found",
      });
    }

    const relationships = await MentorRelationship.find({
      mentorId: currentUser._id,
      status: "accepted",
    }).populate("menteeId", "firstName lastName email profilePicture");

    res.status(200).json({
      success: true,
      data: relationships,
    });
  } catch (error) {
    console.error("Error fetching mentees:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch mentees",
      error: error.message,
    });
  }
};

/**
 * Get pending mentor invitations
 * GET /api/mentors/pending
 */
export const getPendingInvitations = async (req, res) => {
  try {
    const clerkUserId = req.auth.userId;

    // Get MongoDB user by auth0Id
    const currentUser = await User.findOne({ auth0Id: clerkUserId });
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User profile not found",
      });
    }

    // Get invitations sent by user (as mentee)
    const sentInvitations = await MentorRelationship.find({
      menteeId: currentUser._id,
      status: "pending",
    }).populate("mentorId", "firstName lastName email profilePicture");

    // Get invitations received by user (as potential mentor)
    // Only show invitations that are truly pending (not accepted/rejected)
    const receivedInvitations = await MentorRelationship.find({
      mentorEmail: currentUser.email.toLowerCase(),
      status: "pending",
    }).populate("menteeId", "firstName lastName email profilePicture headline");

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
 * Cancel a mentor relationship
 * POST /api/mentors/cancel/:relationshipId
 */
export const cancelMentorship = async (req, res) => {
  try {
    const clerkUserId = req.auth.userId;
    const { relationshipId } = req.params;

    // Get MongoDB user by auth0Id
    const currentUser = await User.findOne({ auth0Id: clerkUserId });
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User profile not found",
      });
    }

    const relationship = await MentorRelationship.findById(relationshipId);

    if (!relationship) {
      return res.status(404).json({
        success: false,
        message: "Mentorship relationship not found",
      });
    }

    // Check authorization
    if (
      relationship.menteeId.toString() !== currentUser._id.toString() &&
      relationship.mentorId?.toString() !== currentUser._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this relationship",
      });
    }

    relationship.status = "cancelled";
    relationship.endedAt = new Date();
    await relationship.save();

    res.status(200).json({
      success: true,
      message: "Mentorship cancelled",
    });
  } catch (error) {
    console.error("Error cancelling mentorship:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel mentorship",
      error: error.message,
    });
  }
};

// ===== FEEDBACK MANAGEMENT =====

/**
 * Add feedback from mentor to mentee
 * POST /api/mentors/feedback
 */
export const addFeedback = async (req, res) => {
  try {
    const clerkUserId = req.auth.userId;
    const {
      relationshipId,
      type,
      content,
      rating,
      suggestions,
      referenceId,
    } = req.body;

    // Get MongoDB user by auth0Id
    const currentUser = await User.findOne({ auth0Id: clerkUserId });
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User profile not found",
      });
    }

    const relationship = await MentorRelationship.findById(relationshipId);

    if (!relationship) {
      return res.status(404).json({
        success: false,
        message: "Mentorship relationship not found",
      });
    }

    if (relationship.mentorId?.toString() !== currentUser._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the mentor can provide feedback",
      });
    }

    const feedback = new MentorFeedback({
      relationshipId,
      mentorId: currentUser._id,
      menteeId: relationship.menteeId,
      type,
      content,
      rating,
      suggestions: suggestions || [],
      referenceId,
    });

    await feedback.save();

    // Send notification to mentee
    const menteeUser = await User.findById(relationship.menteeId);
    if (menteeUser) {
      await sendFeedbackNotificationEmail(menteeUser.email, type);
    }

    res.status(201).json({
      success: true,
      message: "Feedback added successfully",
      data: feedback,
    });
  } catch (error) {
    console.error("Error adding feedback:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add feedback",
      error: error.message,
    });
  }
};

/**
 * Get feedback for a mentee
 * GET /api/mentors/feedback/received
 */
export const getReceivedFeedback = async (req, res) => {
  try {
    const clerkUserId = req.auth.userId;
    const { relationshipId, type } = req.query;

    // Get MongoDB user by auth0Id
    const currentUser = await User.findOne({ auth0Id: clerkUserId });
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User profile not found",
      });
    }

    let query = { menteeId: currentUser._id };
    if (relationshipId) query.relationshipId = relationshipId;
    if (type) query.type = type;

    const feedback = await MentorFeedback.find(query)
      .populate("mentorId", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: feedback,
    });
  } catch (error) {
    console.error("Error fetching feedback:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch feedback",
      error: error.message,
    });
  }
};

/**
 * Acknowledge feedback
 * PUT /api/mentors/feedback/:feedbackId/acknowledge
 */
export const acknowledgeFeedback = async (req, res) => {
  try {
    const clerkUserId = req.auth.userId;
    const { feedbackId } = req.params;

    // Get MongoDB user by auth0Id
    const currentUser = await User.findOne({ auth0Id: clerkUserId });
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User profile not found",
      });
    }

    const feedback = await MentorFeedback.findById(feedbackId);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found",
      });
    }

    if (feedback.menteeId.toString() !== currentUser._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to acknowledge this feedback",
      });
    }

    feedback.acknowledged = true;
    feedback.acknowledgedAt = new Date();
    await feedback.save();

    res.status(200).json({
      success: true,
      message: "Feedback acknowledged",
      data: feedback,
    });
  } catch (error) {
    console.error("Error acknowledging feedback:", error);
    res.status(500).json({
      success: false,
      message: "Failed to acknowledge feedback",
      error: error.message,
    });
  }
};

// ===== RECOMMENDATION MANAGEMENT =====

/**
 * Add recommendation for mentee
 * POST /api/mentors/recommendations
 */
export const addRecommendation = async (req, res) => {
  try {
    const clerkUserId = req.auth.userId;
    const {
      relationshipId,
      title,
      description,
      category,
      priority,
      targetDate,
    } = req.body;

    // Get MongoDB user by auth0Id
    const currentUser = await User.findOne({ auth0Id: clerkUserId });
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User profile not found",
      });
    }

    const relationship = await MentorRelationship.findById(relationshipId);

    if (!relationship) {
      return res.status(404).json({
        success: false,
        message: "Mentorship relationship not found",
      });
    }

    if (relationship.mentorId?.toString() !== currentUser._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the mentor can add recommendations",
      });
    }

    const recommendation = new MentorRecommendation({
      relationshipId,
      mentorId: currentUser._id,
      menteeId: relationship.menteeId,
      title,
      description,
      category,
      priority: priority || "medium",
      targetDate,
    });

    await recommendation.save();

    // Send notification to mentee
    const menteeUser = await User.findById(relationship.menteeId);
    if (menteeUser) {
      await sendRecommendationNotificationEmail(menteeUser.email, title);
    }

    res.status(201).json({
      success: true,
      message: "Recommendation added successfully",
      data: recommendation,
    });
  } catch (error) {
    console.error("Error adding recommendation:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add recommendation",
      error: error.message,
    });
  }
};

/**
 * Get recommendations for mentee
 * GET /api/mentors/recommendations
 */
export const getRecommendations = async (req, res) => {
  try {
    const clerkUserId = req.auth.userId;
    const { status, category } = req.query;

    // Get MongoDB user by auth0Id
    const currentUser = await User.findOne({ auth0Id: clerkUserId });
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User profile not found",
      });
    }

    let query = { menteeId: currentUser._id };
    if (status) query.status = status;
    if (category) query.category = category;

    const recommendations = await MentorRecommendation.find(query)
      .populate("mentorId", "firstName lastName email")
      .sort({ priority: 1, targetDate: 1 });

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
 * PUT /api/mentors/recommendations/:recommendationId
 */
export const updateRecommendationStatus = async (req, res) => {
  try {
    const clerkUserId = req.auth.userId;
    const { recommendationId } = req.params;
    const { status, progressNotes } = req.body;

    // Get MongoDB user by auth0Id
    const currentUser = await User.findOne({ auth0Id: clerkUserId });
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User profile not found",
      });
    }

    const recommendation = await MentorRecommendation.findById(recommendationId);

    if (!recommendation) {
      return res.status(404).json({
        success: false,
        message: "Recommendation not found",
      });
    }

    if (recommendation.menteeId.toString() !== currentUser._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this recommendation",
      });
    }

    if (status) recommendation.status = status;
    if (progressNotes) recommendation.progressNotes = progressNotes;

    if (status === "completed") {
      recommendation.completedAt = new Date();
    }

    await recommendation.save();

    res.status(200).json({
      success: true,
      message: "Recommendation updated",
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

// ===== MESSAGE/COMMUNICATION =====

/**
 * Send message to mentor/mentee
 * POST /api/mentors/messages
 */
export const sendMessage = async (req, res) => {
  try {
    const clerkUserId = req.auth.userId;
    const { relationshipId, recipientId, content, type } = req.body;

    // Get MongoDB user by auth0Id
    const currentUser = await User.findOne({ auth0Id: clerkUserId });
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User profile not found",
      });
    }

    const relationship = await MentorRelationship.findById(relationshipId);

    if (!relationship) {
      return res.status(404).json({
        success: false,
        message: "Mentorship relationship not found",
      });
    }

    // Verify sender is part of relationship
    if (
      relationship.menteeId.toString() !== currentUser._id.toString() &&
      relationship.mentorId?.toString() !== currentUser._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to send messages in this relationship",
      });
    }

    const message = new MentorMessage({
      relationshipId,
      senderId: currentUser._id,
      recipientId,
      content,
      type: type || "text",
    });

    await message.save();

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
 * Get messages in a mentorship
 * GET /api/mentors/messages/:relationshipId
 */
export const getMessages = async (req, res) => {
  try {
    const clerkUserId = req.auth.userId;
    const { relationshipId } = req.params;

    // Get MongoDB user by auth0Id
    const currentUser = await User.findOne({ auth0Id: clerkUserId });
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User profile not found",
      });
    }

    const relationship = await MentorRelationship.findById(relationshipId);

    if (!relationship) {
      return res.status(404).json({
        success: false,
        message: "Mentorship relationship not found",
      });
    }

    // Verify user is part of relationship
    if (
      relationship.menteeId.toString() !== currentUser._id.toString() &&
      relationship.mentorId?.toString() !== currentUser._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view these messages",
      });
    }

    const messages = await MentorMessage.find({ relationshipId })
      .populate("senderId", "firstName lastName email profilePicture")
      .sort({ createdAt: 1 });

    // Mark all messages for this user as read
    await MentorMessage.updateMany(
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
      data: messages,
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

// ===== PROGRESS REPORTING =====

/**
 * Generate progress report
 * POST /api/mentors/progress-reports
 */
export const generateProgressReport = async (req, res) => {
  try {
    const clerkUserId = req.auth.userId;
    const { relationshipId, reportType, startDate, endDate } = req.body;

    // Get MongoDB user by auth0Id
    const currentUser = await User.findOne({ auth0Id: clerkUserId });
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User profile not found",
      });
    }

    const relationship = await MentorRelationship.findById(relationshipId);

    if (!relationship) {
      return res.status(404).json({
        success: false,
        message: "Mentorship relationship not found",
      });
    }

    if (relationship.menteeId.toString() !== currentUser._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to generate report for this relationship",
      });
    }

    // Calculate metrics (this would typically aggregate data from other collections)
    const report = new MentorProgressReport({
      relationshipId,
      menteeId: currentUser._id,
      reportPeriod: {
        startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: endDate || new Date(),
      },
      reportType: reportType || "monthly",
      generatedBy: "auto",
    });

    await report.save();

    // Send to mentor for review
    if (relationship.mentorId) {
      const mentorUser = await User.findById(relationship.mentorId);
      if (mentorUser) {
        await sendProgressReportNotificationEmail(mentorUser.email);
      }
    }

    res.status(201).json({
      success: true,
      message: "Progress report generated",
      data: report,
    });
  } catch (error) {
    console.error("Error generating progress report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate progress report",
      error: error.message,
    });
  }
};

/**
 * Get progress reports for mentor review
 * GET /api/mentors/progress-reports
 */
export const getProgressReports = async (req, res) => {
  try {
    const clerkUserId = req.auth.userId;
    const { relationshipId } = req.query;

    // Get MongoDB user by auth0Id
    const currentUser = await User.findOne({ auth0Id: clerkUserId });
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User profile not found",
      });
    }

    let query = {};
    if (relationshipId) {
      query.relationshipId = relationshipId;
    } else {
      // Get all reports for mentees this person is mentoring
      const relationships = await MentorRelationship.find({
        mentorId: currentUser._id,
        status: "accepted",
      });
      const relationshipIds = relationships.map((r) => r._id);
      query.relationshipId = { $in: relationshipIds };
    }

    const reports = await MentorProgressReport.find(query)
      .populate("menteeId", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: reports,
    });
  } catch (error) {
    console.error("Error fetching progress reports:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch progress reports",
      error: error.message,
    });
  }
};

// ===== HELPER EMAIL FUNCTIONS =====

// Email functions for mentor invitations
async function sendMentorInvitationEmail(mentorEmail, menteeName, invitationMessage, relationshipId) {
  const nodemailer = (await import("nodemailer")).default;
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: mentorEmail,
    subject: `${menteeName} Invited You to Be Their Mentor! 🌟`,
    html: `<h2>You've Been Invited to Be a Mentor!</h2>
      <p><strong>${menteeName}</strong> has invited you to be their mentor on Nirvana.</p>
      ${invitationMessage ? `<p><em>Message from ${menteeName}:</em></p><blockquote>${invitationMessage}</blockquote>` : ''}
      <p>As a mentor, you'll be able to:</p>
      <ul>
        <li>Provide feedback on resumes, cover letters, and applications</li>
        <li>Share recommendations and career advice</li>
        <li>Track their progress and goals</li>
        <li>Communicate through the mentor messaging system</li>
      </ul>
      <p><a href="${process.env.FRONTEND_URL}/mentors" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0;">View Invitation</a></p>
      <p>Best regards,<br/>The Nirvana Team</p>`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Sent mentor invitation email to ${mentorEmail}`);
  } catch (error) {
    console.error("Error sending mentor invitation email:", error);
  }
}

async function sendMentorSignUpInvitationEmail(mentorEmail, menteeName, invitationMessage, invitationToken) {
  const nodemailer = (await import("nodemailer")).default;
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  const signUpLink = `${process.env.FRONTEND_URL}/register?mentor-invite=${invitationToken}`;

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: mentorEmail,
    subject: `${menteeName} Invited You to Join Nirvana as Their Mentor! 🌟`,
    html: `<h2>You've Been Invited to Be a Mentor!</h2>
      <p><strong>${menteeName}</strong> has invited you to be their mentor on Nirvana, a career development platform.</p>
      ${invitationMessage ? `<p><em>Message from ${menteeName}:</em></p><blockquote>${invitationMessage}</blockquote>` : ''}
      <p>As a mentor, you'll be able to:</p>
      <ul>
        <li>Provide feedback on resumes, cover letters, and applications</li>
        <li>Share recommendations and career advice</li>
        <li>Track their progress and goals</li>
        <li>Communicate through the mentor messaging system</li>
      </ul>
      <p>To accept this invitation, you'll need to create a free Nirvana account:</p>
      <p><a href="${signUpLink}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0;">Sign Up & Accept Invitation</a></p>
      <p>Or copy this link: ${signUpLink}</p>
      <p>Best regards,<br/>The Nirvana Team</p>`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Sent sign-up invitation email to ${mentorEmail}`);
  } catch (error) {
    console.error("Error sending sign-up invitation email:", error);
  }
}

async function sendMentorAcceptedEmail(menteeEmail, mentorId) {
  const nodemailer = (await import("nodemailer")).default;
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: menteeEmail,
    subject: "Your Mentor Has Accepted Your Invitation! 🎉",
    html: `<h2>Great News!</h2>
      <p>Your mentor has accepted your collaboration invitation.</p>
      <p>You can now start working together on your career development goals.</p>
      <p>Visit your Mentor Hub to get started: <a href="${process.env.FRONTEND_URL}/mentors">View Mentor Hub</a></p>
      <p>Best regards,<br/>The Nirvana Team</p>`
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending mentor accepted email:", error);
  }
}

async function sendMentorRejectedEmail(menteeEmail) {
  const nodemailer = (await import("nodemailer")).default;
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: menteeEmail,
    subject: "Mentor Invitation Update",
    html: `<h2>Mentor Invitation Update</h2>
      <p>Unfortunately, your mentor invitation was declined.</p>
      <p>Don't worry - you can invite other mentors from your network to collaborate with you.</p>
      <p>Visit your Mentor Hub: <a href="${process.env.FRONTEND_URL}/mentors">Mentor Hub</a></p>
      <p>Best regards,<br/>The Nirvana Team</p>`
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending mentor rejected email:", error);
  }
}

async function sendFeedbackNotificationEmail(menteeEmail, feedbackType) {
  const nodemailer = (await import("nodemailer")).default;
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: menteeEmail,
    subject: "New Feedback from Your Mentor 📝",
    html: `<h2>You've Received New Feedback!</h2>
      <p>Your mentor has provided feedback on your ${feedbackType}.</p>
      <p>View the feedback and suggestions: <a href="${process.env.FRONTEND_URL}/mentors">View Feedback</a></p>
      <p>Best regards,<br/>The Nirvana Team</p>`
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending feedback notification email:", error);
  }
}

async function sendRecommendationNotificationEmail(menteeEmail, title) {
  const nodemailer = (await import("nodemailer")).default;
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: menteeEmail,
    subject: "New Recommendation from Your Mentor 💡",
    html: `<h2>New Recommendation</h2>
      <p>Your mentor has added a new recommendation: "${title}"</p>
      <p>Check it out and mark your progress: <a href="${process.env.FRONTEND_URL}/mentors">View Recommendations</a></p>
      <p>Best regards,<br/>The Nirvana Team</p>`
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending recommendation notification email:", error);
  }
}

async function sendProgressReportNotificationEmail(mentorEmail) {
  const nodemailer = (await import("nodemailer")).default;
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: mentorEmail,
    subject: "New Progress Report from Your Mentee 📊",
    html: `<h2>Progress Report Available</h2>
      <p>Your mentee has generated a new progress report for your review.</p>
      <p>View the report: <a href="${process.env.FRONTEND_URL}/mentors/progress">View Progress Reports</a></p>
      <p>Best regards,<br/>The Nirvana Team</p>`
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending progress report notification email:", error);
  }
}

// ===== MENTOR DASHBOARD SPECIALIZED ENDPOINTS =====

/**
 * Get comprehensive mentor dashboard with all mentee information
 * GET /api/mentors/dashboard
 */
export const getMentorDashboard = async (req, res) => {
  try {
    const clerkUserId = req.auth.userId;

    // Get MongoDB user by auth0Id
    const currentUser = await User.findOne({ auth0Id: clerkUserId });
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User profile not found",
      });
    }

    // Get all accepted mentee relationships
    const relationships = await MentorRelationship.find({
      mentorId: currentUser._id,
      status: "accepted",
    }).populate("menteeId", "firstName lastName email profilePicture");

    if (!relationships || relationships.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          menteeCount: 0,
          mentees: [],
          recentActivity: [],
          pendingFeedback: 0,
          upcomingMilestones: [],
        },
      });
    }

    const menteeIds = relationships.map((r) => r.menteeId._id);
    const relationshipIds = relationships.map((r) => r._id);

    // Get recent feedback given
    const recentFeedback = await MentorFeedback.find({
      mentorId: currentUser._id,
      menteeId: { $in: menteeIds },
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("menteeId", "firstName lastName");

    // Get pending recommendations
    const pendingRecommendations = await MentorRecommendation.find({
      mentorId: currentUser._id,
      menteeId: { $in: menteeIds },
      status: { $in: ["pending", "in_progress"] },
    }).countDocuments();

    // Get unread messages count
    const unreadMessages = await MentorMessage.find({
      relationshipId: { $in: relationshipIds },
      recipientId: currentUser._id,
      isRead: false,
    }).countDocuments();

    // Build activity timeline (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentActivity = [];

    // Activity from feedback
    const feedbackActivity = await MentorFeedback.find({
      mentorId: currentUser._id,
      createdAt: { $gte: thirtyDaysAgo },
    })
      .populate("menteeId", "firstName lastName")
      .sort({ createdAt: -1 });

    feedbackActivity.forEach((f) => {
      recentActivity.push({
        type: "feedback",
        date: f.createdAt,
        description: `Provided ${f.type} feedback to ${f.menteeId?.firstName || "mentee"}`,
        mentee: f.menteeId,
      });
    });

    // Activity from recommendations
    const recommendationActivity = await MentorRecommendation.find({
      mentorId: currentUser._id,
      createdAt: { $gte: thirtyDaysAgo },
    })
      .populate("menteeId", "firstName lastName")
      .sort({ createdAt: -1 });

    recommendationActivity.forEach((r) => {
      recentActivity.push({
        type: "recommendation",
        date: r.createdAt,
        description: `Added recommendation: ${r.title}`,
        mentee: r.menteeId,
      });
    });

    // Sort combined activity by date
    recentActivity.sort((a, b) => b.date - a.date);

    res.status(200).json({
      success: true,
      data: {
        menteeCount: relationships.length,
        mentees: relationships,
        recentActivity: recentActivity.slice(0, 15),
        pendingRecommendations,
        unreadMessages,
        recentFeedback,
      },
    });
  } catch (error) {
    console.error("Error fetching mentor dashboard:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch mentor dashboard",
      error: error.message,
    });
  }
};

/**
 * Get detailed mentee profile with progress and KPIs
 * GET /api/mentors/mentee/:menteeId/profile
 */
export const getMenteeProfile = async (req, res) => {
  try {
    const clerkUserId = req.auth.userId;
    const { menteeId } = req.params;

    // Get MongoDB user by auth0Id
    const currentUser = await User.findOne({ auth0Id: clerkUserId });
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User profile not found",
      });
    }

    // Verify mentor-mentee relationship
    const relationship = await MentorRelationship.findOne({
      mentorId: currentUser._id,
      menteeId: menteeId,
      status: "accepted",
    });

    if (!relationship) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this mentee's profile",
      });
    }

    // Get mentee user data
    const menteeUser = await User.findById(menteeId);
    if (!menteeUser) {
      return res.status(404).json({
        success: false,
        message: "Mentee not found",
      });
    }

    // Get shared data based on permissions
    const sharedData = {};

    if (relationship.sharedData?.shareResume) {
      // Import Resume model dynamically
      const { Resume } = await import("../models/Resume.js");
      sharedData.resumes = await Resume.find({ userId: menteeUser.auth0Id })
        .sort({ updatedAt: -1 })
        .limit(5);
    }

    if (relationship.sharedData?.shareApplications) {
      // Import Job model dynamically
      const { Job } = await import("../models/Job.js");
      sharedData.applications = await Job.find({ userId: menteeUser.auth0Id })
        .sort({ updatedAt: -1 })
        .limit(10);
    }

    if (relationship.sharedData?.shareGoals) {
      // Import Goal model dynamically
      const { default: Goal } = await import("../models/Goal.js");
      sharedData.goals = await Goal.find({ userId: menteeUser.auth0Id })
        .sort({ targetDate: 1 })
        .limit(10);
    }

    if (relationship.sharedData?.shareInterviewPrep) {
      // Import Interview model dynamically
      const { Interview } = await import("../models/Interview.js");
      sharedData.interviews = await Interview.find({ userId: menteeUser.auth0Id })
        .sort({ scheduledDate: -1 })
        .limit(10);
    }

    // Get feedback history
    const feedbackHistory = await MentorFeedback.find({
      relationshipId: relationship._id,
    })
      .sort({ createdAt: -1 })
      .limit(20);

    // Get recommendations
    const recommendations = await MentorRecommendation.find({
      relationshipId: relationship._id,
    }).sort({ priority: 1, targetDate: 1 });

    res.status(200).json({
      success: true,
      data: {
        mentee: {
          id: menteeUser._id,
          firstName: menteeUser.firstName,
          lastName: menteeUser.lastName,
          email: menteeUser.email,
          profilePicture: menteeUser.profilePicture,
          headline: menteeUser.headline,
          summary: menteeUser.summary,
        },
        relationship,
        sharedData,
        feedbackHistory,
        recommendations,
      },
    });
  } catch (error) {
    console.error("Error fetching mentee profile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch mentee profile",
      error: error.message,
    });
  }
};

/**
 * Get mentee progress summary and KPIs
 * GET /api/mentors/mentee/:menteeId/progress
 */
export const getMenteeProgress = async (req, res) => {
  try {
    const clerkUserId = req.auth.userId;
    const { menteeId } = req.params;
    const { period = "30" } = req.query; // days

    // Get MongoDB user by auth0Id
    const currentUser = await User.findOne({ auth0Id: clerkUserId });
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User profile not found",
      });
    }

    // Verify mentor-mentee relationship
    const relationship = await MentorRelationship.findOne({
      mentorId: currentUser._id,
      menteeId: menteeId,
      status: "accepted",
    });

    if (!relationship) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this mentee's progress",
      });
    }

    const menteeUser = await User.findById(menteeId);
    if (!menteeUser) {
      return res.status(404).json({
        success: false,
        message: "Mentee not found",
      });
    }

    const periodDays = parseInt(period);
    const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

    // Calculate KPIs
    const kpis = {
      applications: { total: 0, change: 0, trend: "neutral" },
      interviews: { total: 0, change: 0, trend: "neutral" },
      goals: { completed: 0, total: 0, completionRate: 0 },
      engagement: { lastActive: null, activityScore: 0 },
    };

    // Import models dynamically
    const { Job } = await import("../models/Job.js");
    const { default: Goal } = await import("../models/Goal.js");
    const { Interview } = await import("../models/Interview.js");

    // Applications in period
    const applicationsInPeriod = await Job.countDocuments({
      userId: menteeUser.auth0Id,
      updatedAt: { $gte: startDate },
      status: { $in: ["Applied", "Phone Screen", "Interview", "Offer"] },
    });

    const totalApplications = await Job.countDocuments({
      userId: menteeUser.auth0Id,
      status: { $in: ["Applied", "Phone Screen", "Interview", "Offer"] },
    });

    kpis.applications.total = totalApplications;
    kpis.applications.change = applicationsInPeriod;

    // Interviews in period
    const interviewsInPeriod = await Interview.countDocuments({
      userId: menteeUser.auth0Id,
      createdAt: { $gte: startDate },
    });

    const totalInterviews = await Interview.countDocuments({
      userId: menteeUser.auth0Id,
    });

    kpis.interviews.total = totalInterviews;
    kpis.interviews.change = interviewsInPeriod;

    // Goals progress
    const goals = await Goal.find({ userId: menteeUser.auth0Id });
    const completedGoals = goals.filter((g) => g.status === "completed");
    kpis.goals.total = goals.length;
    kpis.goals.completed = completedGoals.length;
    kpis.goals.completionRate =
      goals.length > 0 ? (completedGoals.length / goals.length) * 100 : 0;

    // Engagement metrics
    const recentMessages = await MentorMessage.find({
      relationshipId: relationship._id,
      senderId: menteeId,
      createdAt: { $gte: startDate },
    });

    kpis.engagement.lastActive = recentMessages.length > 0
      ? recentMessages[recentMessages.length - 1].createdAt
      : null;
    kpis.engagement.activityScore = recentMessages.length;

    // Get goal progress over time
    const goalProgressData = await Goal.aggregate([
      { $match: { userId: menteeUser.auth0Id } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get milestone achievements
    const goalsWithMilestones = await Goal.find({
      userId: menteeUser.auth0Id,
      "milestones.completed": true,
    });

    const achievedMilestones = goalsWithMilestones.flatMap((goal) =>
      goal.milestones
        .filter((m) => m.completed)
        .map((m) => ({
          goalTitle: goal.title,
          milestoneTitle: m.title,
          completedDate: m.completedDate,
        }))
    );

    res.status(200).json({
      success: true,
      data: {
        period: periodDays,
        kpis,
        goalProgressData,
        achievedMilestones: achievedMilestones.slice(-10),
        trends: {
          applications: applicationsInPeriod > 0 ? "up" : "stable",
          interviews: interviewsInPeriod > 0 ? "up" : "stable",
        },
      },
    });
  } catch (error) {
    console.error("Error fetching mentee progress:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch mentee progress",
      error: error.message,
    });
  }
};

/**
 * Get coaching insights and recommendations for mentee
 * GET /api/mentors/mentee/:menteeId/insights
 */
export const getMenteeInsights = async (req, res) => {
  try {
    const clerkUserId = req.auth.userId;
    const { menteeId } = req.params;

    // Get MongoDB user by auth0Id
    const currentUser = await User.findOne({ auth0Id: clerkUserId });
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User profile not found",
      });
    }

    // Verify mentor-mentee relationship
    const relationship = await MentorRelationship.findOne({
      mentorId: currentUser._id,
      menteeId: menteeId,
      status: "accepted",
    });

    if (!relationship) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view insights for this mentee",
      });
    }

    const menteeUser = await User.findById(menteeId);
    if (!menteeUser) {
      return res.status(404).json({
        success: false,
        message: "Mentee not found",
      });
    }

    // Import models
    const { Job } = await import("../models/Job.js");
    const { default: Goal } = await import("../models/Goal.js");

    // Generate insights based on mentee data
    const insights = {
      strengths: [],
      areasForImprovement: [],
      actionableRecommendations: [],
      achievementPatterns: [],
    };

    // Analyze application patterns
    const applications = await Job.find({ userId: menteeUser.auth0Id });
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentApplications = applications.filter(
      (app) => new Date(app.createdAt) >= thirtyDaysAgo
    );

    if (recentApplications.length >= 5) {
      insights.strengths.push({
        area: "Application Volume",
        description: `Submitted ${recentApplications.length} applications in the last 30 days`,
        impact: "high",
      });
    } else if (recentApplications.length < 3) {
      insights.areasForImprovement.push({
        area: "Application Activity",
        description: "Low application volume in recent weeks",
        impact: "medium",
      });
      insights.actionableRecommendations.push({
        title: "Increase Application Frequency",
        description: "Aim for at least 5 applications per week to improve job search momentum",
        priority: "high",
        estimatedImpact: "Increases interview chances by 40%",
      });
    }

    // Analyze goal completion
    const goals = await Goal.find({ userId: menteeUser.auth0Id });
    const completedGoals = goals.filter((g) => g.status === "completed");
    const completionRate = goals.length > 0 ? (completedGoals.length / goals.length) * 100 : 0;

    if (completionRate >= 70) {
      insights.strengths.push({
        area: "Goal Achievement",
        description: `Excellent goal completion rate: ${completionRate.toFixed(1)}%`,
        impact: "high",
      });
    } else if (completionRate < 40) {
      insights.areasForImprovement.push({
        area: "Goal Completion",
        description: `Low goal completion rate: ${completionRate.toFixed(1)}%`,
        impact: "high",
      });
      insights.actionableRecommendations.push({
        title: "Break Down Goals into Smaller Milestones",
        description: "Create more achievable short-term milestones to build momentum",
        priority: "high",
        estimatedImpact: "Improves motivation and tracking",
      });
    }

    // Analyze interview conversion
    const interviewStages = ["Interview", "Offer"];
    const interviewCount = applications.filter((app) =>
      interviewStages.includes(app.status)
    ).length;
    const conversionRate = applications.length > 0
      ? (interviewCount / applications.length) * 100
      : 0;

    if (conversionRate >= 15) {
      insights.strengths.push({
        area: "Interview Conversion",
        description: `Strong conversion rate: ${conversionRate.toFixed(1)}%`,
        impact: "high",
      });
    } else if (conversionRate < 5 && applications.length >= 10) {
      insights.areasForImprovement.push({
        area: "Application Quality",
        description: "Low interview conversion rate suggests need for application improvements",
        impact: "high",
      });
      insights.actionableRecommendations.push({
        title: "Enhance Resume and Cover Letter Quality",
        description: "Focus on tailoring applications to specific job requirements",
        priority: "high",
        estimatedImpact: "Can double interview callback rate",
      });
    }

    // Achievement patterns
    if (completedGoals.length > 0) {
      const avgTimeToComplete = completedGoals.reduce((sum, goal) => {
        const created = new Date(goal.createdAt);
        const completed = new Date(goal.completedAt || goal.updatedAt);
        return sum + (completed - created) / (1000 * 60 * 60 * 24);
      }, 0) / completedGoals.length;

      insights.achievementPatterns.push({
        pattern: "Goal Completion Time",
        description: `Average time to complete goals: ${avgTimeToComplete.toFixed(0)} days`,
        insight: avgTimeToComplete < 30
          ? "Quick achiever - setting and completing goals efficiently"
          : "Consider setting shorter-term goals for more frequent wins",
      });
    }

    res.status(200).json({
      success: true,
      data: insights,
    });
  } catch (error) {
    console.error("Error generating mentee insights:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate insights",
      error: error.message,
    });
  }
};

/**
 * Get mentee engagement and activity metrics
 * GET /api/mentors/mentee/:menteeId/engagement
 */
export const getMenteeEngagement = async (req, res) => {
  try {
    const clerkUserId = req.auth.userId;
    const { menteeId } = req.params;

    // Get MongoDB user by auth0Id
    const currentUser = await User.findOne({ auth0Id: clerkUserId });
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User profile not found",
      });
    }

    // Verify mentor-mentee relationship
    const relationship = await MentorRelationship.findOne({
      mentorId: currentUser._id,
      menteeId: menteeId,
      status: "accepted",
    });

    if (!relationship) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view engagement for this mentee",
      });
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Message activity
    const messages = await MentorMessage.find({
      relationshipId: relationship._id,
      senderId: menteeId,
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Feedback acknowledgment rate
    const feedbackSent = await MentorFeedback.find({
      relationshipId: relationship._id,
      mentorId: currentUser._id,
    });

    const acknowledgedFeedback = feedbackSent.filter((f) => f.acknowledged);
    const acknowledgmentRate = feedbackSent.length > 0
      ? (acknowledgedFeedback.length / feedbackSent.length) * 100
      : 0;

    // Recommendation completion
    const recommendations = await MentorRecommendation.find({
      relationshipId: relationship._id,
    });

    const completedRecommendations = recommendations.filter(
      (r) => r.status === "completed"
    );
    const recommendationCompletionRate = recommendations.length > 0
      ? (completedRecommendations.length / recommendations.length) * 100
      : 0;

    // Recent activity timeline
    const activityTimeline = [];

    messages.forEach((msg) => {
      activityTimeline.push({
        type: "message",
        date: msg.createdAt,
        description: "Sent message",
      });
    });

    acknowledgedFeedback.forEach((f) => {
      if (f.acknowledgedAt && f.acknowledgedAt >= thirtyDaysAgo) {
        activityTimeline.push({
          type: "feedback_acknowledged",
          date: f.acknowledgedAt,
          description: `Acknowledged feedback on ${f.type}`,
        });
      }
    });

    activityTimeline.sort((a, b) => b.date - a.date);

    res.status(200).json({
      success: true,
      data: {
        messageCount: messages.length,
        acknowledgmentRate: acknowledgmentRate.toFixed(1),
        recommendationCompletionRate: recommendationCompletionRate.toFixed(1),
        activityTimeline: activityTimeline.slice(0, 20),
        engagementScore: calculateEngagementScore({
          messages: messages.length,
          acknowledgmentRate,
          recommendationCompletionRate,
        }),
        lastActive: messages.length > 0 ? messages[messages.length - 1].createdAt : null,
      },
    });
  } catch (error) {
    console.error("Error fetching mentee engagement:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch engagement metrics",
      error: error.message,
    });
  }
};

// Helper function to calculate engagement score
function calculateEngagementScore({ messages, acknowledgmentRate, recommendationCompletionRate }) {
  // Score out of 100
  const messageScore = Math.min((messages / 10) * 40, 40); // Max 40 points for messages
  const acknowledgmentScore = (acknowledgmentRate / 100) * 30; // Max 30 points
  const completionScore = (recommendationCompletionRate / 100) * 30; // Max 30 points

  const totalScore = messageScore + acknowledgmentScore + completionScore;

  return {
    score: Math.round(totalScore),
    rating: totalScore >= 80 ? "Excellent" : totalScore >= 60 ? "Good" : totalScore >= 40 ? "Fair" : "Needs Attention",
  };
}
