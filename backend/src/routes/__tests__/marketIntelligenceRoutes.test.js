import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

// Mock all controller functions
const mockGetMarketIntelligence = jest.fn((req, res) => res.json({ success: true, data: {} }));
const mockUpdatePreferences = jest.fn((req, res) => res.json({ success: true }));
const mockGetJobMarketTrends = jest.fn((req, res) => res.json({ success: true, data: [] }));
const mockGetSkillDemand = jest.fn((req, res) => res.json({ success: true, data: [] }));
const mockGetSalaryTrends = jest.fn((req, res) => res.json({ success: true, data: [] }));
const mockGetCompanyGrowth = jest.fn((req, res) => res.json({ success: true, data: [] }));
const mockGetIndustryInsights = jest.fn((req, res) => res.json({ success: true, data: {} }));
const mockGetRecommendations = jest.fn((req, res) => res.json({ success: true, data: [] }));
const mockUpdateRecommendation = jest.fn((req, res) => res.json({ success: true }));
const mockGetMarketOpportunities = jest.fn((req, res) => res.json({ success: true, data: [] }));
const mockGetCompetitiveLandscape = jest.fn((req, res) => res.json({ success: true, data: {} }));
const mockGenerateMarketReport = jest.fn((req, res) => res.json({ success: true, data: {} }));

jest.unstable_mockModule('../../controllers/marketIntelligenceController.js', () => ({
    getMarketIntelligence: mockGetMarketIntelligence,
    updatePreferences: mockUpdatePreferences,
    getJobMarketTrends: mockGetJobMarketTrends,
    getSkillDemand: mockGetSkillDemand,
    getSalaryTrends: mockGetSalaryTrends,
    getCompanyGrowth: mockGetCompanyGrowth,
    getIndustryInsights: mockGetIndustryInsights,
    getRecommendations: mockGetRecommendations,
    updateRecommendation: mockUpdateRecommendation,
    getMarketOpportunities: mockGetMarketOpportunities,
    getCompetitiveLandscape: mockGetCompetitiveLandscape,
    generateMarketReport: mockGenerateMarketReport,
}));

const mockCheckJwt = jest.fn((req, res, next) => {
    req.auth = { userId: 'test-user-id' };
    next();
});

jest.unstable_mockModule('../../middleware/checkJwt.js', () => ({
    checkJwt: mockCheckJwt,
}));

describe('marketIntelligenceRoutes', () => {
    let app;

    beforeEach(async () => {
        jest.clearAllMocks();
        app = express();
        app.use(express.json());

        const marketIntelligenceRoutes = await import('../../routes/marketIntelligenceRoutes.js');
        app.use('/api/market-intelligence', marketIntelligenceRoutes.default);
    });

    it('should get market intelligence', async () => {
        const response = await request(app).get('/api/market-intelligence');
        expect(response.status).toBe(200);
        expect(mockGetMarketIntelligence).toHaveBeenCalled();
    });

    it('should update preferences', async () => {
        const response = await request(app).put('/api/market-intelligence/preferences');
        expect(response.status).toBe(200);
        expect(mockUpdatePreferences).toHaveBeenCalled();
    });

    it('should get job market trends', async () => {
        const response = await request(app).get('/api/market-intelligence/job-trends');
        expect(response.status).toBe(200);
        expect(mockGetJobMarketTrends).toHaveBeenCalled();
    });

    it('should get skill demand', async () => {
        const response = await request(app).get('/api/market-intelligence/skill-demand');
        expect(response.status).toBe(200);
        expect(mockGetSkillDemand).toHaveBeenCalled();
    });

    it('should get salary trends', async () => {
        const response = await request(app).get('/api/market-intelligence/salary-trends');
        expect(response.status).toBe(200);
        expect(mockGetSalaryTrends).toHaveBeenCalled();
    });

    it('should get company growth', async () => {
        const response = await request(app).get('/api/market-intelligence/company-growth');
        expect(response.status).toBe(200);
        expect(mockGetCompanyGrowth).toHaveBeenCalled();
    });

    it('should get industry insights', async () => {
        const response = await request(app).get('/api/market-intelligence/industry-insights');
        expect(response.status).toBe(200);
        expect(mockGetIndustryInsights).toHaveBeenCalled();
    });

    it('should get recommendations', async () => {
        const response = await request(app).get('/api/market-intelligence/recommendations');
        expect(response.status).toBe(200);
        expect(mockGetRecommendations).toHaveBeenCalled();
    });

    it('should update recommendation', async () => {
        const response = await request(app).put('/api/market-intelligence/recommendations/rec123');
        expect(response.status).toBe(200);
        expect(mockUpdateRecommendation).toHaveBeenCalled();
    });

    it('should get market opportunities', async () => {
        const response = await request(app).get('/api/market-intelligence/opportunities');
        expect(response.status).toBe(200);
        expect(mockGetMarketOpportunities).toHaveBeenCalled();
    });

    it('should get competitive landscape', async () => {
        const response = await request(app).get('/api/market-intelligence/competitive-landscape');
        expect(response.status).toBe(200);
        expect(mockGetCompetitiveLandscape).toHaveBeenCalled();
    });

    it('should generate market report', async () => {
        const response = await request(app).post('/api/market-intelligence/generate-report');
        expect(response.status).toBe(200);
        expect(mockGenerateMarketReport).toHaveBeenCalled();
    });

    it('should protect routes with checkJwt', async () => {
        await request(app).get('/api/market-intelligence');
        expect(mockCheckJwt).toHaveBeenCalled();
    });
});
