import express from "express";
import { checkJwt } from "../middleware/checkJwt.js";
import {
  listCoverLetters,
  createCoverLetter,
  updateCoverLetter,
  deleteCoverLetter,
  setDefaultCoverLetter,
  archiveCoverLetter,
  exportCoverLetterText,
  compareCoverLetters,
} from "../controllers/coverLetterController.js";

const router = express.Router();

router.get("/cover-letters", checkJwt, listCoverLetters);
router.post("/cover-letters", checkJwt, createCoverLetter);
router.put("/cover-letters/:id", checkJwt, updateCoverLetter);
router.delete("/cover-letters/:id", checkJwt, deleteCoverLetter);
router.put("/cover-letters/:id/set-default", checkJwt, setDefaultCoverLetter);
router.put("/cover-letters/:id/archive", checkJwt, archiveCoverLetter);
router.get("/cover-letters/:id/text", checkJwt, exportCoverLetterText);
router.get("/cover-letters/:id/compare", checkJwt, compareCoverLetters);

export default router;
