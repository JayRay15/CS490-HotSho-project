import { jest } from '@jest/globals';

// Mock dependencies before importing
const mockCheckJwt = jest.fn((req, res, next) => {
  req.auth = { userId: 'user123' };
  next();
});

const mockGetGoals = jest.fn((req, res) => res.json({ success: true }));
const mockGetGoalById = jest.fn((req, res) => res.json({ success: true }));
const mockCreateGoal = jest.fn((req, res) => res.status(201).json({ success: true }));
const mockUpdateGoal = jest.fn((req, res) => res.json({ success: true }));
const mockDeleteGoal = jest.fn((req, res) => res.json({ success: true }));
const mockAddProgressUpdate = jest.fn((req, res) => res.json({ success: true }));
const mockCompleteMilestone = jest.fn((req, res) => res.json({ success: true }));
const mockGetGoalStats = jest.fn((req, res) => res.json({ success: true }));
const mockGetGoalRecommendations = jest.fn((req, res) => res.json({ success: true }));
const mockAnalyzeGoal = jest.fn((req, res) => res.json({ success: true }));
const mockCelebrateGoal = jest.fn((req, res) => res.json({ success: true }));
const mockGetSuccessPatterns = jest.fn((req, res) => res.json({ success: true }));
const mockLinkGoalToEntities = jest.fn((req, res) => res.json({ success: true }));
const mockUpdateImpactMetrics = jest.fn((req, res) => res.json({ success: true }));
const mockGetDashboardSummary = jest.fn((req, res) => res.json({ success: true }));

await jest.unstable_mockModule('../../middleware/checkJwt.js', () => ({
  checkJwt: mockCheckJwt
}));

await jest.unstable_mockModule('../../controllers/goalController.js', () => ({
  getGoals: mockGetGoals,
  getGoalById: mockGetGoalById,
  createGoal: mockCreateGoal,
  updateGoal: mockUpdateGoal,
  deleteGoal: mockDeleteGoal,
  addProgressUpdate: mockAddProgressUpdate,
  completeMilestone: mockCompleteMilestone,
  getGoalStats: mockGetGoalStats,
  getGoalRecommendations: mockGetGoalRecommendations,
  analyzeGoal: mockAnalyzeGoal,
  celebrateGoal: mockCelebrateGoal,
  getSuccessPatterns: mockGetSuccessPatterns,
  linkGoalToEntities: mockLinkGoalToEntities,
  updateImpactMetrics: mockUpdateImpactMetrics,
  getDashboardSummary: mockGetDashboardSummary
}));

const express = (await import('express')).default;
const request = (await import('supertest')).default;
const goalRoutes = (await import('../goalRoutes.js')).default;

describe('goalRoutes', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/goals', goalRoutes);
  });

  describe('GET /api/goals/dashboard', () => {
    it('should call getDashboardSummary controller', async () => {
      await request(app).get('/api/goals/dashboard');
      expect(mockGetDashboardSummary).toHaveBeenCalled();
    });

    it('should require authentication', async () => {
      await request(app).get('/api/goals/dashboard');
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('GET /api/goals/stats', () => {
    it('should call getGoalStats controller', async () => {
      await request(app).get('/api/goals/stats');
      expect(mockGetGoalStats).toHaveBeenCalled();
    });
  });

  describe('POST /api/goals/recommendations', () => {
    it('should call getGoalRecommendations controller', async () => {
      await request(app).post('/api/goals/recommendations').send({});
      expect(mockGetGoalRecommendations).toHaveBeenCalled();
    });
  });

  describe('GET /api/goals/patterns', () => {
    it('should call getSuccessPatterns controller', async () => {
      await request(app).get('/api/goals/patterns');
      expect(mockGetSuccessPatterns).toHaveBeenCalled();
    });
  });

  describe('GET /api/goals', () => {
    it('should call getGoals controller', async () => {
      await request(app).get('/api/goals');
      expect(mockGetGoals).toHaveBeenCalled();
    });
  });

  describe('POST /api/goals', () => {
    it('should call createGoal controller', async () => {
      await request(app).post('/api/goals').send({ title: 'Test Goal' });
      expect(mockCreateGoal).toHaveBeenCalled();
    });
  });

  describe('GET /api/goals/:id', () => {
    it('should call getGoalById controller', async () => {
      await request(app).get('/api/goals/goal123');
      expect(mockGetGoalById).toHaveBeenCalled();
    });

    it('should pass id param', async () => {
      await request(app).get('/api/goals/goal456');
      expect(mockGetGoalById).toHaveBeenCalled();
      const req = mockGetGoalById.mock.calls[0][0];
      expect(req.params.id).toBe('goal456');
    });
  });

  describe('PUT /api/goals/:id', () => {
    it('should call updateGoal controller', async () => {
      await request(app).put('/api/goals/goal123').send({ title: 'Updated' });
      expect(mockUpdateGoal).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/goals/:id', () => {
    it('should call deleteGoal controller', async () => {
      await request(app).delete('/api/goals/goal123');
      expect(mockDeleteGoal).toHaveBeenCalled();
    });
  });

  describe('POST /api/goals/:id/progress', () => {
    it('should call addProgressUpdate controller', async () => {
      await request(app).post('/api/goals/goal123/progress').send({ value: 10 });
      expect(mockAddProgressUpdate).toHaveBeenCalled();
    });
  });

  describe('POST /api/goals/:id/milestones/:milestoneId/complete', () => {
    it('should call completeMilestone controller', async () => {
      await request(app).post('/api/goals/goal123/milestones/ms456/complete');
      expect(mockCompleteMilestone).toHaveBeenCalled();
    });

    it('should pass milestoneId param', async () => {
      await request(app).post('/api/goals/goal123/milestones/ms789/complete');
      const req = mockCompleteMilestone.mock.calls[0][0];
      expect(req.params.milestoneId).toBe('ms789');
    });
  });

  describe('POST /api/goals/:id/analyze', () => {
    it('should call analyzeGoal controller', async () => {
      await request(app).post('/api/goals/goal123/analyze');
      expect(mockAnalyzeGoal).toHaveBeenCalled();
    });
  });

  describe('POST /api/goals/:id/celebrate', () => {
    it('should call celebrateGoal controller', async () => {
      await request(app).post('/api/goals/goal123/celebrate');
      expect(mockCelebrateGoal).toHaveBeenCalled();
    });
  });

  describe('POST /api/goals/:id/link', () => {
    it('should call linkGoalToEntities controller', async () => {
      await request(app).post('/api/goals/goal123/link').send({ jobIds: ['job1'] });
      expect(mockLinkGoalToEntities).toHaveBeenCalled();
    });
  });

  describe('POST /api/goals/:id/impact', () => {
    it('should call updateImpactMetrics controller', async () => {
      await request(app).post('/api/goals/goal123/impact').send({ jobApplications: 5 });
      expect(mockUpdateImpactMetrics).toHaveBeenCalled();
    });
  });
});
