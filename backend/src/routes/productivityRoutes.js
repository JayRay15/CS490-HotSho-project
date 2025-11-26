import express from 'express';
import { checkJwt } from '../middleware/checkJwt.js';
import {
  getTimeTrackingByDate,
  getTimeTrackingRange,
  addTimeEntry,
  updateTimeEntry,
  deleteTimeEntry,
  getTimeStats,
  generateProductivityAnalysis,
  getProductivityAnalysis,
  getUserAnalyses,
  getProductivityDashboard,
  getProductivityInsights,
  getOptimalSchedule,
  compareProductivity
} from '../controllers/productivityController.js';

const router = express.Router();

router.use(checkJwt);

router.get('/dashboard', getProductivityDashboard);

router.get('/time-tracking', getTimeTrackingRange);
router.get('/time-tracking/:date', getTimeTrackingByDate);
router.post('/time-tracking/:date/entries', addTimeEntry);
router.put('/time-tracking/:date/entries/:entryId', updateTimeEntry);
router.delete('/time-tracking/:date/entries/:entryId', deleteTimeEntry);

router.get('/stats', getTimeStats);

router.post('/analysis', generateProductivityAnalysis);
router.get('/analysis/:id', getProductivityAnalysis);
router.get('/analyses', getUserAnalyses);

router.post('/insights', getProductivityInsights);
router.get('/optimal-schedule', getOptimalSchedule);
router.post('/compare', compareProductivity);

export default router;
