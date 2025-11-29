import { jest, beforeEach, describe, it, expect } from '@jest/globals';
import express from 'express';
import request from 'supertest';

// Mock the middleware and controller
const mockCheckJwt = jest.fn((req, res, next) => {
  req.auth = { userId: 'test-user-123' };
  next();
});

const mockGenerateCompanyResearch = jest.fn((req, res) => res.status(201).json({ success: true }));
const mockGetResearchByInterview = jest.fn((req, res) => res.status(200).json({ success: true }));
const mockGetResearchByJob = jest.fn((req, res) => res.status(200).json({ success: true }));
const mockGetAllResearch = jest.fn((req, res) => res.status(200).json({ success: true }));
const mockUpdateResearch = jest.fn((req, res) => res.status(200).json({ success: true }));
const mockExportResearch = jest.fn((req, res) => res.status(200).json({ success: true }));
const mockDeleteResearch = jest.fn((req, res) => res.status(200).json({ success: true }));

jest.unstable_mockModule('../../middleware/checkJwt.js', () => ({
  checkJwt: mockCheckJwt
}));

jest.unstable_mockModule('../../controllers/companyResearchController.js', () => ({
  generateCompanyResearch: mockGenerateCompanyResearch,
  getResearchByInterview: mockGetResearchByInterview,
  getResearchByJob: mockGetResearchByJob,
  getAllResearch: mockGetAllResearch,
  updateResearch: mockUpdateResearch,
  exportResearch: mockExportResearch,
  deleteResearch: mockDeleteResearch
}));

// Import after mocking
const companyResearchRoutesModule = await import('../companyResearchRoutes.js');
const companyResearchRoutes = companyResearchRoutesModule.default;

describe('companyResearchRoutes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/company-research', companyResearchRoutes);
    jest.clearAllMocks();
  });

  describe('POST /api/company-research/generate', () => {
    it('should call generateCompanyResearch controller', async () => {
      const response = await request(app)
        .post('/api/company-research/generate')
        .send({ companyName: 'Test Corp' });

      expect(response.status).toBe(201);
      expect(mockGenerateCompanyResearch).toHaveBeenCalled();
    });

    it('should require authentication', async () => {
      await request(app)
        .post('/api/company-research/generate')
        .send({ companyName: 'Test Corp' });

      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('GET /api/company-research', () => {
    it('should call getAllResearch controller', async () => {
      const response = await request(app)
        .get('/api/company-research');

      expect(response.status).toBe(200);
      expect(mockGetAllResearch).toHaveBeenCalled();
    });
  });

  describe('GET /api/company-research/interview/:interviewId', () => {
    it('should call getResearchByInterview controller', async () => {
      const response = await request(app)
        .get('/api/company-research/interview/interview-123');

      expect(response.status).toBe(200);
      expect(mockGetResearchByInterview).toHaveBeenCalled();
    });

    it('should pass interviewId param', async () => {
      await request(app)
        .get('/api/company-research/interview/interview-456');

      const req = mockGetResearchByInterview.mock.calls[0][0];
      expect(req.params.interviewId).toBe('interview-456');
    });
  });

  describe('GET /api/company-research/job/:jobId', () => {
    it('should call getResearchByJob controller', async () => {
      const response = await request(app)
        .get('/api/company-research/job/job-123');

      expect(response.status).toBe(200);
      expect(mockGetResearchByJob).toHaveBeenCalled();
    });

    it('should pass jobId param', async () => {
      await request(app)
        .get('/api/company-research/job/job-789');

      const req = mockGetResearchByJob.mock.calls[0][0];
      expect(req.params.jobId).toBe('job-789');
    });
  });

  describe('PUT /api/company-research/:id', () => {
    it('should call updateResearch controller', async () => {
      const response = await request(app)
        .put('/api/company-research/research-123')
        .send({ notes: 'Updated notes' });

      expect(response.status).toBe(200);
      expect(mockUpdateResearch).toHaveBeenCalled();
    });

    it('should pass id param', async () => {
      await request(app)
        .put('/api/company-research/research-456')
        .send({ notes: 'Updated notes' });

      const req = mockUpdateResearch.mock.calls[0][0];
      expect(req.params.id).toBe('research-456');
    });
  });

  describe('POST /api/company-research/:id/export', () => {
    it('should call exportResearch controller', async () => {
      const response = await request(app)
        .post('/api/company-research/research-123/export')
        .send({ format: 'pdf' });

      expect(response.status).toBe(200);
      expect(mockExportResearch).toHaveBeenCalled();
    });

    it('should pass id param', async () => {
      await request(app)
        .post('/api/company-research/research-789/export')
        .send({ format: 'pdf' });

      const req = mockExportResearch.mock.calls[0][0];
      expect(req.params.id).toBe('research-789');
    });
  });

  describe('DELETE /api/company-research/:id', () => {
    it('should call deleteResearch controller', async () => {
      const response = await request(app)
        .delete('/api/company-research/research-123');

      expect(response.status).toBe(200);
      expect(mockDeleteResearch).toHaveBeenCalled();
    });

    it('should pass id param', async () => {
      await request(app)
        .delete('/api/company-research/research-999');

      const req = mockDeleteResearch.mock.calls[0][0];
      expect(req.params.id).toBe('research-999');
    });
  });

  describe('Authentication', () => {
    it('should apply checkJwt to all routes', async () => {
      await request(app).get('/api/company-research');
      expect(mockCheckJwt).toHaveBeenCalledTimes(1);

      await request(app).post('/api/company-research/generate');
      expect(mockCheckJwt).toHaveBeenCalledTimes(2);

      await request(app).get('/api/company-research/interview/123');
      expect(mockCheckJwt).toHaveBeenCalledTimes(3);

      await request(app).get('/api/company-research/job/123');
      expect(mockCheckJwt).toHaveBeenCalledTimes(4);

      await request(app).put('/api/company-research/123');
      expect(mockCheckJwt).toHaveBeenCalledTimes(5);

      await request(app).post('/api/company-research/123/export');
      expect(mockCheckJwt).toHaveBeenCalledTimes(6);

      await request(app).delete('/api/company-research/123');
      expect(mockCheckJwt).toHaveBeenCalledTimes(7);
    });
  });
});
