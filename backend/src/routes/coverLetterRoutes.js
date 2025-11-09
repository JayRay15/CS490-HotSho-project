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
  generateCoverLetterEmailTemplate
} from "../controllers/coverLetterController.js";

const router = express.Router();

// Cover letter routes (actual cover letters, not templates)
router.get("/cover-letters", checkJwt, listCoverLetters);
router.post("/cover-letters", checkJwt, createCoverLetterFromTemplate);
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

export default router;
