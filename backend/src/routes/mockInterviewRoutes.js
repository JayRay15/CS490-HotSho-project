import express from "express";
import { checkJwt } from "../middleware/checkJwt.js";
import { startMockInterview, getSession, answerQuestion, finishSession, getSummary } from "../controllers/mockInterviewController.js";

const router = express.Router();

// Start a new mock interview session
router.post("/start", checkJwt, startMockInterview);

// Get session details
router.get("/:sessionId", checkJwt, getSession);

// Answer current question (advances automatically)
router.post("/:sessionId/answer", checkJwt, answerQuestion);

// Finish early (or retrieve finished session)
router.post("/:sessionId/finish", checkJwt, finishSession);

// Get summary only
router.get("/:sessionId/summary", checkJwt, getSummary);

export default router;
