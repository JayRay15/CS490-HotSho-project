import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

// Mock the controller
const mockAnalyzePDF = jest.fn((req, res) => res.json({ success: true }));

jest.unstable_mockModule('../../controllers/pdfAnalysisController.js', () => ({
  analyzePDF: mockAnalyzePDF,
}));

// Mock the middleware
const mockCheckJwt = jest.fn((req, res, next) => {
  req.auth = { userId: 'test-user-id' };
  next();
});

jest.unstable_mockModule('../../middleware/checkJwt.js', () => ({
  checkJwt: mockCheckJwt,
}));

describe('pdfAnalysisRoutes', () => {
  let app;
  let pdfAnalysisRoutes;

  beforeEach(async () => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    
    const routesModule = await import('../../routes/pdfAnalysisRoutes.js');
    pdfAnalysisRoutes = routesModule.default;
    app.use('/api/pdf-analysis', pdfAnalysisRoutes);
  });

  describe('POST /api/pdf-analysis/analyze', () => {
    it('should call analyzePDF controller with file upload', async () => {
      const response = await request(app)
        .post('/api/pdf-analysis/analyze')
        .attach('file', Buffer.from('%PDF-1.4 test'), 'test.pdf');
      
      expect(response.status).toBe(200);
      expect(mockAnalyzePDF).toHaveBeenCalled();
    });

    it('should protect the route with checkJwt', async () => {
      await request(app)
        .post('/api/pdf-analysis/analyze')
        .attach('file', Buffer.from('%PDF-1.4 test'), 'test.pdf');
      
      expect(mockCheckJwt).toHaveBeenCalled();
    });

    it('should handle requests with multipart/form-data', async () => {
      const response = await request(app)
        .post('/api/pdf-analysis/analyze')
        .field('name', 'test')
        .attach('file', Buffer.from('%PDF-1.4 test'), 'test.pdf');
      
      expect(response.status).toBe(200);
    });

    it('should reject non-PDF files', async () => {
      const response = await request(app)
        .post('/api/pdf-analysis/analyze')
        .attach('file', Buffer.from('not a pdf'), 'test.txt');
      
      // Multer will reject with 500 due to fileFilter error
      expect(response.status).toBe(500);
    });
  });
});
