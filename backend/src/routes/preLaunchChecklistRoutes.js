import express from 'express';
import {
  getChecklist,
  toggleItem,
  signOff,
  makeLaunchDecision,
  resetChecklist
} from '../controllers/preLaunchChecklistController.js';
import { checkJwt } from '../middleware/checkJwt.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = express.Router();

// All routes require authentication and admin access
router.use(checkJwt);
router.use(requireAdmin);

// GET /api/pre-launch-checklist - Get the checklist
router.get('/', getChecklist);

// PUT /api/pre-launch-checklist/:sectionKey/:itemId - Toggle an item
router.put('/:sectionKey/:itemId', toggleItem);

// POST /api/pre-launch-checklist/signoff - Admin sign-off
router.post('/signoff', signOff);

// POST /api/pre-launch-checklist/decision - Make launch decision
router.post('/decision', makeLaunchDecision);

// POST /api/pre-launch-checklist/reset - Reset checklist
router.post('/reset', resetChecklist);

export default router;
