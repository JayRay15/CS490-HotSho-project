import express from "express";
import { checkJwt } from "../middleware/checkJwt.js";
import {
    // Partnership management
    invitePartner,
    acceptPartnerInvitation,
    getMyPartnerships,
    updatePartnership,
    endPartnership,
    // Progress sharing
    shareProgress,
    getMyProgressShares,
    getSharedProgress,
    viewProgressByToken,
    addEncouragement,
    // Achievements
    getAchievements,
    celebrateAchievement,
    // Messaging
    sendMessage,
    getMessages,
    // Insights & Analytics
    getInsights,
    recordCheckIn,
    getWeeklySummary,
} from "../controllers/accountabilityController.js";

const router = express.Router();

// ===== PARTNERSHIP MANAGEMENT ENDPOINTS =====

// Invite an accountability partner
router.post("/partners/invite", checkJwt, invitePartner);

// Accept partner invitation (via token)
router.post("/partners/accept/:token", checkJwt, acceptPartnerInvitation);

// Get all my partnerships
router.get("/partners", checkJwt, getMyPartnerships);

// Update partnership settings
router.put("/partners/:partnershipId", checkJwt, updatePartnership);

// End/remove partnership
router.delete("/partners/:partnershipId", checkJwt, endPartnership);

// Record a check-in
router.post("/check-in/:partnershipId", checkJwt, recordCheckIn);

// ===== PROGRESS SHARING ENDPOINTS =====

// Share progress with partners
router.post("/progress", checkJwt, shareProgress);

// Get my progress shares
router.get("/progress", checkJwt, getMyProgressShares);

// Get progress shared with me (as a partner)
router.get("/progress/shared/:partnershipId", checkJwt, getSharedProgress);

// View progress by token (public/semi-public access)
router.get("/progress/view/:token", viewProgressByToken);

// Add encouragement to a progress share
router.post("/progress/:shareId/encourage", checkJwt, addEncouragement);

// ===== ACHIEVEMENT ENDPOINTS =====

// Get user's achievements
router.get("/achievements", checkJwt, getAchievements);

// Celebrate/share an achievement
router.post("/achievements/:achievementId/celebrate", checkJwt, celebrateAchievement);

// ===== MESSAGING ENDPOINTS =====

// Send message to partner
router.post("/messages", checkJwt, sendMessage);

// Get messages for a partnership
router.get("/messages/:partnershipId", checkJwt, getMessages);

// ===== INSIGHTS & ANALYTICS ENDPOINTS =====

// Get accountability insights
router.get("/insights", checkJwt, getInsights);

// Get weekly summary
router.get("/weekly-summary", checkJwt, getWeeklySummary);

export default router;
