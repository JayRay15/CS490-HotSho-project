import express from "express";
import { registerPublic } from "../controllers/publicAuthController.js";

const router = express.Router();

// POST /api/register - Public registration (email/password)
router.post("/register", registerPublic);

export default router;
