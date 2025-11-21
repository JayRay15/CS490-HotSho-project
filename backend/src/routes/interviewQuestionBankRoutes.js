import express from 'express';
import { checkJwt } from '../middleware/checkJwt.js';
import {
  generateInterviewQuestionBank,
  getQuestionBankByJob,
  getAllQuestionBanks,
  updatePracticeStatus,
  deleteQuestionBank,
} from '../controllers/interviewQuestionBankController.js';

const router = express.Router();

router.use(checkJwt);

// POST /api/interview-question-bank/generate
router.post('/generate', generateInterviewQuestionBank);
// GET /api/interview-question-bank
router.get('/', getAllQuestionBanks);
// GET /api/interview-question-bank/job/:jobId
router.get('/job/:jobId', getQuestionBankByJob);
// PATCH /api/interview-question-bank/:id/question/:questionId/practice
router.patch('/:id/question/:questionId/practice', updatePracticeStatus);
// DELETE /api/interview-question-bank/:id
router.delete('/:id', deleteQuestionBank);

export default router;
