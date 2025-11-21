import express from "express";
import { checkJwt } from "../middleware/checkJwt.js";
import {
  createNegotiation,
  getNegotiations,
  getNegotiationById,
  updateNegotiation,
  deleteNegotiation,
  generateTalkingPointsForNegotiation,
  addCounteroffer,
  addConversation,
  getSalaryProgression,
  getNegotiationAnalytics
} from "../controllers/negotiationController.js";

const router = express.Router();

/**
 * UC-083: Salary Negotiation Guidance and Tools Routes
 * 
 * These routes provide comprehensive salary negotiation features including:
 * - Creating and managing negotiation sessions
 * - Generating talking points and scenarios
 * - Tracking counteroffers and conversations
 * - Monitoring salary progression
 * - Analyzing negotiation outcomes
 */

// Analytics and progression (must come before :id routes)
router.get("/user/progression", checkJwt, getSalaryProgression);
router.get("/user/analytics", checkJwt, getNegotiationAnalytics);

// Core CRUD operations
router.post("/", checkJwt, createNegotiation);
router.get("/", checkJwt, getNegotiations);
router.get("/:id", checkJwt, getNegotiationById);
router.put("/:id", checkJwt, updateNegotiation);
router.delete("/:id", checkJwt, deleteNegotiation);

// Talking points generation
router.post("/:id/talking-points", checkJwt, generateTalkingPointsForNegotiation);

// Counteroffer management
router.post("/:id/counteroffer", checkJwt, addCounteroffer);

// Conversation logging
router.post("/:id/conversation", checkJwt, addConversation);

export default router;
