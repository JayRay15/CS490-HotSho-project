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
      // Mentor exists, update relationship
      relationship.mentorId = mentorUser._id;
      relationship.status = "pending";
      await relationship.save();

      // Send notification email to mentor
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
      await sendMentorAcceptedEmail(menteeUser.email, mentorId);
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
    });

    // Get invitations received by user (as potential mentor)
    const receivedInvitations = await MentorRelationship.find({
      mentorEmail: currentUser.email,
      status: "pending",
      mentorId: null,
    });

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

  const signUpLink = `${process.env.FRONTEND_URL}/sign-up?mentor-invite=${invitationToken}`;

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
