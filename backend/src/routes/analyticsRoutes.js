import express from 'express';
import { checkJwt } from '../middleware/checkJwt.js';
import { getNetworkAnalytics } from '../controllers/analyticsController.js';

const router = express.Router();

// All routes require authentication
router.use(checkJwt);

// GET /api/analytics/network - Get network analytics
router.get('/network', getNetworkAnalytics);

export default router;
