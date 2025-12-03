import express from 'express';
import { requireAuth } from '@clerk/express';
import {
  getTeamBenchmarks,
  generateBenchmark,
  getBenchmarkHistory,
  getMemberBenchmark,
  getLeaderboard
} from '../controllers/benchmarkController.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth());

// Get team benchmarks
router.get('/teams/:teamId/benchmarks', getTeamBenchmarks);

// Generate fresh benchmark
router.post('/teams/:teamId/benchmarks/generate', generateBenchmark);

// Get benchmark history
router.get('/teams/:teamId/benchmarks/history', getBenchmarkHistory);

// Get member's personal benchmark
router.get('/teams/:teamId/benchmarks/members/:memberId', getMemberBenchmark);

// Get leaderboard
router.get('/teams/:teamId/leaderboard', getLeaderboard);

export default router;
