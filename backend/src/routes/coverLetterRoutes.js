import express from "express";
import { checkJwt } from "../middleware/checkJwt.js";
import {
  listCoverLetters,
  createCoverLetterFromTemplate,
  getCoverLetterById,
  updateCoverLetter,
  deleteCoverLetter,
  setDefaultCoverLetter,
  archiveCoverLetter,
  unarchiveCoverLetter,
  cloneCoverLetter,
  exportCoverLetterAsPdf,
  exportCoverLetterAsDocx,
  exportCoverLetterAsHtml,
  exportCoverLetterAsText,
  generateCoverLetterEmailTemplate,
  checkCoverLetterSpelling,
  getCoverLetterSynonyms,
  analyzeCoverLetterReadability,
  getSentenceRestructuring,
  saveCoverLetterVersion,
  getCoverLetterHistory,
  analyzeExperienceForCoverLetter
} from "../controllers/coverLetterController.js";
import {
  createShareLink,
  listShares,
  revokeShare,
  getSharedCoverLetter,
  createFeedback,
  listFeedbackForCoverLetter,
  listFeedbackForShare,
  resolveFeedback,
  approveCoverLetter,
  exportFeedbackSummary,
} from "../controllers/coverLetterShareController.js";
import { ensureCoverLetterShareAccess } from "../middleware/shareAccess.js";

const router = express.Router();

// Cover letter routes (actual cover letters, not templates)
router.get("/cover-letters", checkJwt, listCoverLetters);
router.post("/cover-letters", checkJwt, createCoverLetterFromTemplate);

// Experience highlighting and analysis - MUST come before parameterized routes
router.post("/cover-letters/analyze-experience", checkJwt, analyzeExperienceForCoverLetter);

router.get("/cover-letters/:id", checkJwt, getCoverLetterById);
router.put("/cover-letters/:id", checkJwt, updateCoverLetter);
router.delete("/cover-letters/:id", checkJwt, deleteCoverLetter);

// Cover letter management
router.put("/cover-letters/:id/set-default", checkJwt, setDefaultCoverLetter);
router.put("/cover-letters/:id/archive", checkJwt, archiveCoverLetter);
router.put("/cover-letters/:id/unarchive", checkJwt, unarchiveCoverLetter);
router.post("/cover-letters/:id/clone", checkJwt, cloneCoverLetter);

// UC-054: Cover letter export routes
router.post("/cover-letters/:id/export/pdf", checkJwt, exportCoverLetterAsPdf);
router.post("/cover-letters/:id/export/docx", checkJwt, exportCoverLetterAsDocx);
router.post("/cover-letters/:id/export/html", checkJwt, exportCoverLetterAsHtml);
router.post("/cover-letters/:id/export/text", checkJwt, exportCoverLetterAsText);
router.post("/cover-letters/:id/email-template", checkJwt, generateCoverLetterEmailTemplate);

// UC-060: Cover letter editing assistance routes
router.post("/cover-letters/editing/spell-check", checkJwt, checkCoverLetterSpelling);
router.post("/cover-letters/editing/synonyms", checkJwt, getCoverLetterSynonyms);
router.post("/cover-letters/editing/readability", checkJwt, analyzeCoverLetterReadability);
router.post("/cover-letters/editing/restructure", checkJwt, getSentenceRestructuring);
router.post("/cover-letters/:id/versions", checkJwt, saveCoverLetterVersion);
router.get("/cover-letters/:id/history", checkJwt, getCoverLetterHistory);

// UC-110: Cover letter sharing & collaborative feedback
// Owner actions (authenticated)
router.post("/cover-letters/:id/share", checkJwt, createShareLink);
router.get("/cover-letters/:id/shares", checkJwt, listShares);
router.patch("/cover-letters/:id/shares/:token/revoke", checkJwt, revokeShare);
router.get("/cover-letters/:id/feedback", checkJwt, listFeedbackForCoverLetter);
router.patch("/cover-letter-feedback/:feedbackId/resolve", checkJwt, resolveFeedback);
router.get("/cover-letters/:id/feedback/export", checkJwt, exportFeedbackSummary);

// UC-110: Approval workflow
router.patch("/cover-letters/:id/approval", checkJwt, approveCoverLetter);

// Public share endpoints (no auth required)
router.get("/share/cover-letter/:token", ensureCoverLetterShareAccess, getSharedCoverLetter);
router.get("/share/cover-letter/:token/feedback", ensureCoverLetterShareAccess, listFeedbackForShare);
router.post("/share/cover-letter/:token/feedback", ensureCoverLetterShareAccess, createFeedback);

export default router;
