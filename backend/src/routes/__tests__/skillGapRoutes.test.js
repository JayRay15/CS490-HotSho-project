import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

// Mock the controllers
const mockAnalyzeJobSkillGap = jest.fn((req, res) => res.json({ success: true, gaps: [] }));
const mockGetSkillTrends = jest.fn((req, res) => res.json({ success: true, trends: [] }));
const mockStartSkillTracking = jest.fn((req, res) => res.json({ success: true, tracking: {} }));
const mockUpdateSkillProgress = jest.fn((req, res) => res.json({ success: true, updated: true }));
const mockGetSkillTracking = jest.fn((req, res) => res.json({ success: true, skills: [] }));
const mockDeleteSkillTracking = jest.fn((req, res) => res.json({ success: true, deleted: true }));
const mockCompareJobsSkills = jest.fn((req, res) => res.json({ success: true, comparison: {} }));

jest.unstable_mockModule('../../controllers/skillGapController.js', () => ({
  analyzeJobSkillGap: mockAnalyzeJobSkillGap,
  getSkillTrends: mockGetSkillTrends,
  startSkillTracking: mockStartSkillTracking,
  updateSkillProgress: mockUpdateSkillProgress,
  getSkillTracking: mockGetSkillTracking,
  deleteSkillTracking: mockDeleteSkillTracking,
  compareJobsSkills: mockCompareJobsSkills,
}));

// Mock the middleware
const mockCheckJwt = jest.fn((req, res, next) => {
  req.auth = { userId: 'test-user-id' };
  next();
});

jest.unstable_mockModule('../../middleware/checkJwt.js', () => ({
  checkJwt: mockCheckJwt,
}));

describe('skillGapRoutes', () => {
  let app;
  let skillGapRoutes;

  beforeEach(async () => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    
    const routesModule = await import('../../routes/skillGapRoutes.js');
    skillGapRoutes = routesModule.default;
    app.use('/api/skillgap', skillGapRoutes);
  });

  describe('GET /api/skillgap/analyze/:jobId', () => {
    it('should call analyzeJobSkillGap controller', async () => {
      const response = await request(app).get('/api/skillgap/analyze/job-123');
      expect(response.status).toBe(200);
      expect(mockAnalyzeJobSkillGap).toHaveBeenCalled();
    });

    it('should require authentication', async () => {
      await request(app).get('/api/skillgap/analyze/job-123');
      expect(mockCheckJwt).toHaveBeenCalled();
    });

    it('should pass jobId parameter', async () => {
      await request(app).get('/api/skillgap/analyze/job-999');
      const callArgs = mockAnalyzeJobSkillGap.mock.calls[0];
      expect(callArgs[0].params.jobId).toBe('job-999');
    });
  });

  describe('GET /api/skillgap/trends', () => {
    it('should call getSkillTrends controller', async () => {
      const response = await request(app).get('/api/skillgap/trends');
      expect(response.status).toBe(200);
      expect(mockGetSkillTrends).toHaveBeenCalled();
    });

    it('should require authentication', async () => {
      await request(app).get('/api/skillgap/trends');
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('POST /api/skillgap/compare', () => {
    it('should call compareJobsSkills controller', async () => {
      const response = await request(app)
        .post('/api/skillgap/compare')
        .send({ jobIds: ['job-1', 'job-2'] });
      expect(response.status).toBe(200);
      expect(mockCompareJobsSkills).toHaveBeenCalled();
    });

    it('should require authentication', async () => {
      await request(app).post('/api/skillgap/compare').send({});
      expect(mockCheckJwt).toHaveBeenCalled();
    });

    it('should accept request body', async () => {
      await request(app)
        .post('/api/skillgap/compare')
        .send({ jobIds: ['a', 'b'], includeDetails: true });
      expect(mockCompareJobsSkills).toHaveBeenCalled();
    });
  });

  describe('GET /api/skillgap/track', () => {
    it('should call getSkillTracking controller', async () => {
      const response = await request(app).get('/api/skillgap/track');
      expect(response.status).toBe(200);
      expect(mockGetSkillTracking).toHaveBeenCalled();
    });

    it('should require authentication', async () => {
      await request(app).get('/api/skillgap/track');
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('POST /api/skillgap/track', () => {
    it('should call startSkillTracking controller', async () => {
      const response = await request(app)
        .post('/api/skillgap/track')
        .send({ skillName: 'React', targetLevel: 'advanced' });
      expect(response.status).toBe(200);
      expect(mockStartSkillTracking).toHaveBeenCalled();
    });

    it('should require authentication', async () => {
      await request(app).post('/api/skillgap/track').send({});
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('PUT /api/skillgap/track/:skillName', () => {
    it('should call updateSkillProgress controller', async () => {
      const response = await request(app)
        .put('/api/skillgap/track/React')
        .send({ progress: 50 });
      expect(response.status).toBe(200);
      expect(mockUpdateSkillProgress).toHaveBeenCalled();
    });

    it('should require authentication', async () => {
      await request(app).put('/api/skillgap/track/Python').send({});
      expect(mockCheckJwt).toHaveBeenCalled();
    });

    it('should pass skillName parameter', async () => {
      await request(app).put('/api/skillgap/track/Docker').send({});
      const callArgs = mockUpdateSkillProgress.mock.calls[0];
      expect(callArgs[0].params.skillName).toBe('Docker');
    });
  });

  describe('DELETE /api/skillgap/track/:skillName', () => {
    it('should call deleteSkillTracking controller', async () => {
      const response = await request(app).delete('/api/skillgap/track/Python');
      expect(response.status).toBe(200);
      expect(mockDeleteSkillTracking).toHaveBeenCalled();
    });

    it('should require authentication', async () => {
      await request(app).delete('/api/skillgap/track/Java');
      expect(mockCheckJwt).toHaveBeenCalled();
    });

    it('should pass skillName parameter', async () => {
      await request(app).delete('/api/skillgap/track/Kubernetes');
      const callArgs = mockDeleteSkillTracking.mock.calls[0];
      expect(callArgs[0].params.skillName).toBe('Kubernetes');
    });
  });

  describe('Route protection', () => {
    it('should set userId from JWT on request', async () => {
      await request(app).get('/api/skillgap/trends');
      const callArgs = mockGetSkillTrends.mock.calls[0];
      expect(callArgs[0].auth.userId).toBe('test-user-id');
    });
  });

  describe('Response format', () => {
    it('should return JSON responses', async () => {
      const response = await request(app).get('/api/skillgap/trends');
      expect(response.type).toMatch(/json/);
    });

    it('should return success flag in response', async () => {
      const response = await request(app).get('/api/skillgap/trends');
      expect(response.body.success).toBe(true);
    });
  });
});
