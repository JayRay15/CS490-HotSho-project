import express from "express";
import { checkJwt } from "../middleware/checkJwt.js";
import {
    // Relationship management
    inviteAdvisor,
    acceptAdvisorInvitation,
    acceptAdvisorInvitationByToken,
    rejectAdvisorInvitation,
    getMyAdvisors,
    getMyClients,
    getPendingInvitations,
    cancelAdvisorRelationship,
    updateSharedData,
    getAdvisorDashboard,
    getClientProfile,
    // Session management
    createSession,
    getSessions,
    updateSession,
    addSessionNotes,
    // Billing management
    getBilling,
    updateBilling,
    getPayments,
    recordPayment,
    // Recommendations
    createRecommendation,
    getRecommendations,
    updateRecommendation,
    // Evaluations
    createEvaluation,
    getEvaluations,
    respondToEvaluation,
    getAdvisorRating,
    // Messaging
    sendMessage,
    getMessages,
    getUnreadCount,
    // Impact tracking
    updateImpactMetrics,
    getImpactReport,
    getImpactMetrics,
    addImpactMetric,
} from "../controllers/externalAdvisorController.js";

const router = express.Router();

// ===== RELATIONSHIP MANAGEMENT ROUTES =====

// Invite an external advisor
router.post("/invite", checkJwt, inviteAdvisor);

// Accept invitation by relationship ID (for existing users)
router.post("/accept/:relationshipId", checkJwt, acceptAdvisorInvitation);

// Accept invitation by token (for new users)
router.post("/accept-token/:token", checkJwt, acceptAdvisorInvitationByToken);

// Reject invitation
router.post("/reject/:relationshipId", checkJwt, rejectAdvisorInvitation);

// Get my advisors (as job seeker)
router.get("/my-advisors", checkJwt, getMyAdvisors);

// Get my clients (as advisor)
router.get("/my-clients", checkJwt, getMyClients);

// Get pending invitations
router.get("/pending", checkJwt, getPendingInvitations);

// Cancel/end advisor relationship
router.post("/cancel/:relationshipId", checkJwt, cancelAdvisorRelationship);

// Update shared data settings
router.put("/:relationshipId/shared-data", checkJwt, updateSharedData);

// Get advisor dashboard (for advisors)
router.get("/dashboard", checkJwt, getAdvisorDashboard);

// Get client profile (for advisor to view)
router.get("/clients/:relationshipId/profile", checkJwt, getClientProfile);

// ===== SESSION MANAGEMENT ROUTES =====

// Create/schedule a session
router.post("/sessions", checkJwt, createSession);

// Get sessions
router.get("/sessions", checkJwt, getSessions);

// Update session
router.put("/sessions/:sessionId", checkJwt, updateSession);

// Add session notes
router.post("/sessions/:sessionId/notes", checkJwt, addSessionNotes);

// ===== BILLING MANAGEMENT ROUTES =====

// Get billing for a relationship
router.get("/billing/:relationshipId", checkJwt, getBilling);

// Update billing configuration
router.put("/billing/:relationshipId", checkJwt, updateBilling);

// Get payments for a relationship
router.get("/payments/:relationshipId", checkJwt, getPayments);

// Record a payment
router.post("/payments", checkJwt, recordPayment);

// ===== RECOMMENDATION ROUTES =====

// Create recommendation
router.post("/recommendations", checkJwt, createRecommendation);

// Get recommendations
router.get("/recommendations", checkJwt, getRecommendations);

// Update recommendation
router.put("/recommendations/:recommendationId", checkJwt, updateRecommendation);

// ===== EVALUATION ROUTES =====

// Create evaluation
router.post("/evaluations", checkJwt, createEvaluation);

// Get evaluations
router.get("/evaluations", checkJwt, getEvaluations);

// Respond to evaluation
router.put("/evaluations/:evaluationId/respond", checkJwt, respondToEvaluation);

// Get advisor rating
router.get("/ratings/:advisorId", checkJwt, getAdvisorRating);

// ===== MESSAGING ROUTES =====

// Get unread message count (must be before :relationshipId route)
router.get("/messages/unread/count", checkJwt, getUnreadCount);

// Send message
router.post("/messages", checkJwt, sendMessage);

// Get messages for a relationship
router.get("/messages/:relationshipId", checkJwt, getMessages);

// ===== IMPACT TRACKING ROUTES =====

// Get impact metrics for a relationship
router.get("/impact/:relationshipId", checkJwt, getImpactMetrics);

// Add impact metric
router.post("/impact", checkJwt, addImpactMetric);

// Update impact metrics
router.put("/:relationshipId/impact", checkJwt, updateImpactMetrics);

// Get impact report
router.get("/:relationshipId/impact-report", checkJwt, getImpactReport);

export default router;
