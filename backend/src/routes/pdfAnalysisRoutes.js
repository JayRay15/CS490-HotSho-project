import express from 'express';
import multer from 'multer';
import { analyzePDF } from '../controllers/pdfAnalysisController.js';
import { checkJwt } from '../middleware/checkJwt.js';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// POST /api/pdf-analysis/analyze - Analyze a PDF for styling hints
router.post('/analyze', checkJwt, upload.single('file'), analyzePDF);

export default router;
