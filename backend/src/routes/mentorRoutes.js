import express from "express";
import { checkJwt } from "../middleware/checkJwt.js";
import {
    inviteMentor,
    acceptMentorInvitation,
    rejectMentorInvitation,
    getMyMentors,
    getMyMentees,
    getPendingInvitations,
    cancelMentorship,
    addFeedback,
    getReceivedFeedback,
    acknowledgeFeedback,
    addRecommendation,
    getRecommendations,
    updateRecommendationStatus,
    sendMessage,
    getMessages,
    generateProgressReport,
    getProgressReports,
    getMentorDashboard,
    getMenteeProfile,
    getMenteeProgress,
    getMenteeInsights,
    getMenteeEngagement,
} from "../controllers/mentorController.js";

const router = express.Router();

// ===== MENTOR RELATIONSHIP ENDPOINTS =====

// Invite a mentor
router.post("/invite", checkJwt, inviteMentor);

// Accept mentor invitation
router.post("/accept/:relationshipId", checkJwt, acceptMentorInvitation);

// Reject mentor invitation
router.post("/reject/:relationshipId", checkJwt, rejectMentorInvitation);

// Get all mentors for current user (mentee)
router.get("/my-mentors", checkJwt, getMyMentors);

// Get all mentees for current user (mentor)
router.get("/my-mentees", checkJwt, getMyMentees);

// Get pending invitations
router.get("/pending", checkJwt, getPendingInvitations);

// Cancel mentorship
router.post("/cancel/:relationshipId", checkJwt, cancelMentorship);

// ===== FEEDBACK ENDPOINTS =====

// Add feedback from mentor
router.post("/feedback", checkJwt, addFeedback);

// Get feedback received by mentee
router.get("/feedback/received", checkJwt, getReceivedFeedback);

// Acknowledge feedback
router.put("/feedback/:feedbackId/acknowledge", checkJwt, acknowledgeFeedback);

// ===== RECOMMENDATION ENDPOINTS =====

// Add recommendation
router.post("/recommendations", checkJwt, addRecommendation);

// Get recommendations
router.get("/recommendations", checkJwt, getRecommendations);

// Update recommendation status
router.put(
    "/recommendations/:recommendationId",
    checkJwt,
    updateRecommendationStatus
);

// ===== MESSAGE ENDPOINTS =====

// Send message
router.post("/messages", checkJwt, sendMessage);

// Get messages for a relationship
router.get("/messages/:relationshipId", checkJwt, getMessages);

// ===== PROGRESS REPORT ENDPOINTS =====

// Generate progress report
router.post("/progress-reports", checkJwt, generateProgressReport);

// Get progress reports (for mentor review)
router.get("/progress-reports", checkJwt, getProgressReports);

// ===== MENTOR DASHBOARD SPECIALIZED ENDPOINTS =====

// Get comprehensive mentor dashboard
router.get("/dashboard", checkJwt, getMentorDashboard);

// Get detailed mentee profile with shared data
router.get("/mentee/:menteeId/profile", checkJwt, getMenteeProfile);

// Get mentee progress summary and KPIs
router.get("/mentee/:menteeId/progress", checkJwt, getMenteeProgress);

// Get coaching insights and recommendations
router.get("/mentee/:menteeId/insights", checkJwt, getMenteeInsights);

// Get mentee engagement and activity metrics
router.get("/mentee/:menteeId/engagement", checkJwt, getMenteeEngagement);

export default router;
