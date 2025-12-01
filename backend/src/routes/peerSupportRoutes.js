import express from "express";
import { checkJwt } from "../middleware/checkJwt.js";
import {
    // Group management
    getGroups,
    getGroup,
    createGroup,
    joinGroup,
    leaveGroup,
    updateMemberPrivacy,
    getMyGroups,
    getGroupMembers,
    // Discussions
    getDiscussions,
    createDiscussion,
    getDiscussion,
    replyToDiscussion,
    likeContent,
    // Challenges
    getChallenges,
    createChallenge,
    joinChallenge,
    updateChallengeProgress,
    // Success Stories
    getSuccessStories,
    shareSuccessStory,
    // Referrals
    getReferrals,
    shareReferral,
    expressInterest,
    // Webinars
    getWebinars,
    createWebinar,
    registerForWebinar,
    // Impact & Alerts
    getNetworkingImpact,
    getOpportunityAlerts,
    createOpportunityAlert,
} from "../controllers/peerSupportController.js";

const router = express.Router();

// ===== GROUP MANAGEMENT =====

// Get all available groups (with filters)
router.get("/groups", checkJwt, getGroups);

// Get my groups
router.get("/my-groups", checkJwt, getMyGroups);

// Get group by ID or slug
router.get("/groups/:groupId", checkJwt, getGroup);

// Create a new group
router.post("/groups", checkJwt, createGroup);

// Join a group
router.post("/groups/:groupId/join", checkJwt, joinGroup);

// Leave a group
router.post("/groups/:groupId/leave", checkJwt, leaveGroup);

// Update privacy settings for a group
router.put("/groups/:groupId/privacy", checkJwt, updateMemberPrivacy);

// Get group members
router.get("/groups/:groupId/members", checkJwt, getGroupMembers);

// ===== DISCUSSIONS =====

// Get discussions for a group
router.get("/groups/:groupId/discussions", checkJwt, getDiscussions);

// Create a discussion
router.post("/groups/:groupId/discussions", checkJwt, createDiscussion);

// Get discussion with replies
router.get("/groups/:groupId/discussions/:discussionId", checkJwt, getDiscussion);

// Reply to a discussion
router.post("/groups/:groupId/discussions/:discussionId/replies", checkJwt, replyToDiscussion);

// Like content (discussion or reply)
router.post("/groups/:groupId/like/:contentType/:contentId", checkJwt, likeContent);

// ===== CHALLENGES =====

// Get challenges for a group
router.get("/groups/:groupId/challenges", checkJwt, getChallenges);

// Create a challenge
router.post("/groups/:groupId/challenges", checkJwt, createChallenge);

// Join a challenge
router.post("/groups/:groupId/challenges/:challengeId/join", checkJwt, joinChallenge);

// Update challenge progress
router.put("/groups/:groupId/challenges/:challengeId/progress", checkJwt, updateChallengeProgress);

// ===== SUCCESS STORIES =====

// Get success stories
router.get("/groups/:groupId/success-stories", checkJwt, getSuccessStories);

// Share a success story
router.post("/groups/:groupId/success-stories", checkJwt, shareSuccessStory);

// ===== REFERRALS & OPPORTUNITIES =====

// Get referrals/opportunities
router.get("/groups/:groupId/referrals", checkJwt, getReferrals);

// Share a referral/opportunity
router.post("/groups/:groupId/referrals", checkJwt, shareReferral);

// Express interest in a referral
router.post("/groups/:groupId/referrals/:referralId/interest", checkJwt, expressInterest);

// ===== WEBINARS & COACHING =====

// Get webinars/coaching sessions
router.get("/groups/:groupId/webinars", checkJwt, getWebinars);

// Create a webinar
router.post("/groups/:groupId/webinars", checkJwt, createWebinar);

// Register for a webinar
router.post("/groups/:groupId/webinars/:webinarId/register", checkJwt, registerForWebinar);

// ===== OPPORTUNITY ALERTS =====

// Get opportunity alerts
router.get("/groups/:groupId/alerts", checkJwt, getOpportunityAlerts);

// Create opportunity alert
router.post("/groups/:groupId/alerts", checkJwt, createOpportunityAlert);

// ===== NETWORKING IMPACT =====

// Get user's networking impact
router.get("/impact", checkJwt, getNetworkingImpact);

export default router;
