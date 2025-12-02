import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

const mockGetPerformanceDashboard = jest.fn((req, res) => res.json({ success: true, data: {} }));
const mockGetSearchGoals = jest.fn((req, res) => res.json({ success: true, data: {} }));
const mockUpdateSearchGoals = jest.fn((req, res) => res.json({ success: true }));
const mockGetTrendAnalysis = jest.fn((req, res) => res.json({ success: true, data: {} }));

jest.unstable_mockModule('../../controllers/performanceDashboardController.js', () => ({
    getPerformanceDashboard: mockGetPerformanceDashboard,
    getSearchGoals: mockGetSearchGoals,
    updateSearchGoals: mockUpdateSearchGoals,
    getTrendAnalysis: mockGetTrendAnalysis,
}));

const mockCheckJwt = jest.fn((req, res, next) => {
    req.auth = { userId: 'test-user-id' };
    next();
});

jest.unstable_mockModule('../../middleware/checkJwt.js', () => ({
    checkJwt: mockCheckJwt,
}));

describe('performanceDashboardRoutes', () => {
    let app;

    beforeEach(async () => {
        jest.clearAllMocks();
        app = express();
        app.use(express.json());

        const performanceDashboardRoutes = await import('../../routes/performanceDashboardRoutes.js');
        app.use('/api/performance-dashboard', performanceDashboardRoutes.default);
    });

    it('should get performance dashboard', async () => {
        const response = await request(app).get('/api/performance-dashboard');
        expect(response.status).toBe(200);
        expect(mockGetPerformanceDashboard).toHaveBeenCalled();
    });

    it('should get search goals', async () => {
        const response = await request(app).get('/api/performance-dashboard/goals');
        expect(response.status).toBe(200);
        expect(mockGetSearchGoals).toHaveBeenCalled();
    });

    it('should update search goals', async () => {
        const response = await request(app).put('/api/performance-dashboard/goals');
        expect(response.status).toBe(200);
        expect(mockUpdateSearchGoals).toHaveBeenCalled();
    });

    it('should get trend analysis', async () => {
        const response = await request(app).get('/api/performance-dashboard/trends');
        expect(response.status).toBe(200);
        expect(mockGetTrendAnalysis).toHaveBeenCalled();
    });

    it('should protect routes with checkJwt', async () => {
        await request(app).get('/api/performance-dashboard');
        expect(mockCheckJwt).toHaveBeenCalled();
    });
});
