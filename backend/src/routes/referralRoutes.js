import express from 'express';
import {
  createReferral,
  getReferrals,
  getReferralById,
  updateReferral,
  deleteReferral,
  generateTemplate,
  getReferralAnalytics
} from '../controllers/referralController.js';
import { checkJwt } from '../middleware/checkJwt.js';

const router = express.Router();

// All routes require authentication
router.use(checkJwt);

// GET /api/referrals/analytics - Get referral analytics
router.get('/analytics', getReferralAnalytics);

// POST /api/referrals/generate-template - Generate AI template
router.post('/generate-template', generateTemplate);

// GET /api/referrals - Get all referrals
router.get('/', getReferrals);

// POST /api/referrals - Create new referral
router.post('/', createReferral);

// GET /api/referrals/:id - Get single referral
router.get('/:id', getReferralById);

// PUT /api/referrals/:id - Update referral
router.put('/:id', updateReferral);

// DELETE /api/referrals/:id - Delete referral
router.delete('/:id', deleteReferral);

export default router;
