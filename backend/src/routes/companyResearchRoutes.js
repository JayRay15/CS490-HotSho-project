import express from 'express';
import { checkJwt } from '../middleware/checkJwt.js';
import {
  generateCompanyResearch,
  getResearchByInterview,
  getResearchByJob,
  getAllResearch,
  updateResearch,
  exportResearch,
  deleteResearch,
} from '../controllers/companyResearchController.js';

const router = express.Router();

// All routes require authentication
router.use(checkJwt);

// POST /api/company-research/generate - Generate company research
router.post('/generate', generateCompanyResearch);

// GET /api/company-research - Get all research for user
router.get('/', getAllResearch);

// GET /api/company-research/interview/:interviewId - Get research by interview
router.get('/interview/:interviewId', getResearchByInterview);

// GET /api/company-research/job/:jobId - Get research by job
router.get('/job/:jobId', getResearchByJob);

// PUT /api/company-research/:id - Update research
router.put('/:id', updateResearch);

// POST /api/company-research/:id/export - Export research
router.post('/:id/export', exportResearch);

// DELETE /api/company-research/:id - Delete research
router.delete('/:id', deleteResearch);

export default router;
