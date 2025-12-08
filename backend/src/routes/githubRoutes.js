import express from "express";
import { requireAuth } from "@clerk/express";
import {
  connectGitHub,
  getGitHubProfile,
  refreshGitHubData,
  updateFeaturedRepos,
  disconnectGitHub
} from "../controllers/githubController.js";

const router = express.Router();

// All routes require authentication
router.use(requireAuth());

// Connect GitHub account
router.post("/connect", connectGitHub);

// Get GitHub profile
router.get("/", getGitHubProfile);

// Refresh GitHub data
router.post("/refresh", refreshGitHubData);

// Update featured repositories
router.put("/featured", updateFeaturedRepos);

// Disconnect GitHub account
router.delete("/disconnect", disconnectGitHub);

export default router;
