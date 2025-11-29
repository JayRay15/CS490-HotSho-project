import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

// Mock the controllers
const mockGetSalaryResearch = jest.fn((req, res) => res.json({ success: true }));
const mockCompareSalaries = jest.fn((req, res) => res.json({ success: true }));
const mockGetSalaryBenchmarks = jest.fn((req, res) => res.json({ success: true }));
const mockExportSalaryReport = jest.fn((req, res) => res.json({ success: true }));
const mockCreateNegotiation = jest.fn((req, res) => res.json({ success: true }));
const mockGetNegotiation = jest.fn((req, res) => res.json({ success: true }));
const mockGetAllNegotiations = jest.fn((req, res) => res.json({ success: true }));
const mockGenerateTalkingPoints = jest.fn((req, res) => res.json({ success: true }));
const mockGenerateNegotiationScript = jest.fn((req, res) => res.json({ success: true }));
const mockAddOffer = jest.fn((req, res) => res.json({ success: true }));
const mockEvaluateCounteroffer = jest.fn((req, res) => res.json({ success: true }));
const mockAddConfidenceExercise = jest.fn((req, res) => res.json({ success: true }));
const mockCompleteExercise = jest.fn((req, res) => res.json({ success: true }));
const mockCompleteNegotiation = jest.fn((req, res) => res.json({ success: true }));
const mockGetTimingStrategy = jest.fn((req, res) => res.json({ success: true }));
// UC-100 mocks
const mockTrackSalaryOffer = jest.fn((req, res) => res.json({ success: true }));
const mockUpdateSalaryOffer = jest.fn((req, res) => res.json({ success: true }));
const mockDeleteSalaryOffer = jest.fn((req, res) => res.json({ success: true }));
const mockGetSalaryProgression = jest.fn((req, res) => res.json({ success: true }));
const mockGetProgressionAnalytics = jest.fn((req, res) => res.json({ success: true }));
const mockAddCareerMilestone = jest.fn((req, res) => res.json({ success: true }));
const mockAddMarketAssessment = jest.fn((req, res) => res.json({ success: true }));
const mockGenerateAdvancementRecommendations = jest.fn((req, res) => res.json({ success: true }));
const mockTrackNegotiationOutcome = jest.fn((req, res) => res.json({ success: true }));

jest.unstable_mockModule('../../controllers/salaryController.js', () => ({
  getSalaryResearch: mockGetSalaryResearch,
  compareSalaries: mockCompareSalaries,
  getSalaryBenchmarks: mockGetSalaryBenchmarks,
  exportSalaryReport: mockExportSalaryReport,
  createNegotiation: mockCreateNegotiation,
  getNegotiation: mockGetNegotiation,
  getAllNegotiations: mockGetAllNegotiations,
  generateTalkingPoints: mockGenerateTalkingPoints,
  generateNegotiationScript: mockGenerateNegotiationScript,
  addOffer: mockAddOffer,
  evaluateCounteroffer: mockEvaluateCounteroffer,
  addConfidenceExercise: mockAddConfidenceExercise,
  completeExercise: mockCompleteExercise,
  completeNegotiation: mockCompleteNegotiation,
  getTimingStrategy: mockGetTimingStrategy,
  trackSalaryOffer: mockTrackSalaryOffer,
  updateSalaryOffer: mockUpdateSalaryOffer,
  deleteSalaryOffer: mockDeleteSalaryOffer,
  getSalaryProgression: mockGetSalaryProgression,
  getProgressionAnalytics: mockGetProgressionAnalytics,
  addCareerMilestone: mockAddCareerMilestone,
  addMarketAssessment: mockAddMarketAssessment,
  generateAdvancementRecommendations: mockGenerateAdvancementRecommendations,
  trackNegotiationOutcome: mockTrackNegotiationOutcome,
}));

// Mock the middleware
const mockCheckJwt = jest.fn((req, res, next) => {
  req.auth = { userId: 'test-user-id' };
  next();
});

jest.unstable_mockModule('../../middleware/checkJwt.js', () => ({
  checkJwt: mockCheckJwt,
}));

describe('salaryRoutes', () => {
  let app;
  let salaryRoutes;

  beforeEach(async () => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    
    const routesModule = await import('../../routes/salaryRoutes.js');
    salaryRoutes = routesModule.default;
    app.use('/api/salary', salaryRoutes);
  });

  describe('GET /api/salary/benchmarks', () => {
    it('should call getSalaryBenchmarks controller', async () => {
      const response = await request(app).get('/api/salary/benchmarks');
      expect(response.status).toBe(200);
      expect(mockGetSalaryBenchmarks).toHaveBeenCalled();
    });

    it('should protect the route with checkJwt', async () => {
      await request(app).get('/api/salary/benchmarks');
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('GET /api/salary/compare', () => {
    it('should call compareSalaries controller', async () => {
      const response = await request(app).get('/api/salary/compare');
      expect(response.status).toBe(200);
      expect(mockCompareSalaries).toHaveBeenCalled();
    });

    it('should protect the route with checkJwt', async () => {
      await request(app).get('/api/salary/compare');
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('GET /api/salary/research/:jobId', () => {
    it('should call getSalaryResearch controller', async () => {
      const response = await request(app).get('/api/salary/research/job-123');
      expect(response.status).toBe(200);
      expect(mockGetSalaryResearch).toHaveBeenCalled();
    });

    it('should protect the route with checkJwt', async () => {
      await request(app).get('/api/salary/research/job-123');
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('POST /api/salary/export', () => {
    it('should call exportSalaryReport controller', async () => {
      const response = await request(app)
        .post('/api/salary/export')
        .send({ format: 'pdf' });
      expect(response.status).toBe(200);
      expect(mockExportSalaryReport).toHaveBeenCalled();
    });

    it('should protect the route with checkJwt', async () => {
      await request(app).post('/api/salary/export').send({});
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });
});
