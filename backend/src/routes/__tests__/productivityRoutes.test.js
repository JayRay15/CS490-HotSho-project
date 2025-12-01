import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

const mockGetTimeTrackingByDate = jest.fn((req, res) => res.json({ success: true, data: {} }));
const mockGetTimeTrackingRange = jest.fn((req, res) => res.json({ success: true, data: [] }));
const mockAddTimeEntry = jest.fn((req, res) => res.json({ success: true }));
const mockUpdateTimeEntry = jest.fn((req, res) => res.json({ success: true }));
const mockDeleteTimeEntry = jest.fn((req, res) => res.json({ success: true }));
const mockGetTimeStats = jest.fn((req, res) => res.json({ success: true, data: {} }));
const mockGenerateProductivityAnalysis = jest.fn((req, res) => res.json({ success: true, data: {} }));
const mockGetProductivityAnalysis = jest.fn((req, res) => res.json({ success: true, data: {} }));
const mockGetUserAnalyses = jest.fn((req, res) => res.json({ success: true, data: [] }));
const mockGetProductivityDashboard = jest.fn((req, res) => res.json({ success: true, data: {} }));
const mockGetProductivityInsights = jest.fn((req, res) => res.json({ success: true, data: {} }));
const mockGetOptimalSchedule = jest.fn((req, res) => res.json({ success: true, data: {} }));
const mockCompareProductivity = jest.fn((req, res) => res.json({ success: true, data: {} }));

jest.unstable_mockModule('../../controllers/productivityController.js', () => ({
    getTimeTrackingByDate: mockGetTimeTrackingByDate,
    getTimeTrackingRange: mockGetTimeTrackingRange,
    addTimeEntry: mockAddTimeEntry,
    updateTimeEntry: mockUpdateTimeEntry,
    deleteTimeEntry: mockDeleteTimeEntry,
    getTimeStats: mockGetTimeStats,
    generateProductivityAnalysis: mockGenerateProductivityAnalysis,
    getProductivityAnalysis: mockGetProductivityAnalysis,
    getUserAnalyses: mockGetUserAnalyses,
    getProductivityDashboard: mockGetProductivityDashboard,
    getProductivityInsights: mockGetProductivityInsights,
    getOptimalSchedule: mockGetOptimalSchedule,
    compareProductivity: mockCompareProductivity,
}));

const mockCheckJwt = jest.fn((req, res, next) => {
    req.auth = { userId: 'test-user-id' };
    next();
});

jest.unstable_mockModule('../../middleware/checkJwt.js', () => ({
    checkJwt: mockCheckJwt,
}));

describe('productivityRoutes', () => {
    let app;

    beforeEach(async () => {
        jest.clearAllMocks();
        app = express();
        app.use(express.json());

        const productivityRoutes = await import('../../routes/productivityRoutes.js');
        app.use('/api/productivity', productivityRoutes.default);
    });

    it('should get dashboard', async () => {
        const response = await request(app).get('/api/productivity/dashboard');
        expect(response.status).toBe(200);
        expect(mockGetProductivityDashboard).toHaveBeenCalled();
    });

    it('should get time tracking range', async () => {
        const response = await request(app).get('/api/productivity/time-tracking');
        expect(response.status).toBe(200);
        expect(mockGetTimeTrackingRange).toHaveBeenCalled();
    });

    it('should get time tracking by date', async () => {
        const response = await request(app).get('/api/productivity/time-tracking/2024-01-01');
        expect(response.status).toBe(200);
        expect(mockGetTimeTrackingByDate).toHaveBeenCalled();
    });

    it('should add time entry', async () => {
        const response = await request(app).post('/api/productivity/time-tracking/2024-01-01/entries');
        expect(response.status).toBe(200);
        expect(mockAddTimeEntry).toHaveBeenCalled();
    });

    it('should update time entry', async () => {
        const response = await request(app).put('/api/productivity/time-tracking/2024-01-01/entries/entry123');
        expect(response.status).toBe(200);
        expect(mockUpdateTimeEntry).toHaveBeenCalled();
    });

    it('should delete time entry', async () => {
        const response = await request(app).delete('/api/productivity/time-tracking/2024-01-01/entries/entry123');
        expect(response.status).toBe(200);
        expect(mockDeleteTimeEntry).toHaveBeenCalled();
    });

    it('should get stats', async () => {
        const response = await request(app).get('/api/productivity/stats');
        expect(response.status).toBe(200);
        expect(mockGetTimeStats).toHaveBeenCalled();
    });

    it('should generate analysis', async () => {
        const response = await request(app).post('/api/productivity/analysis');
        expect(response.status).toBe(200);
        expect(mockGenerateProductivityAnalysis).toHaveBeenCalled();
    });

    it('should get analysis', async () => {
        const response = await request(app).get('/api/productivity/analysis/analysis123');
        expect(response.status).toBe(200);
        expect(mockGetProductivityAnalysis).toHaveBeenCalled();
    });

    it('should get user analyses', async () => {
        const response = await request(app).get('/api/productivity/analyses');
        expect(response.status).toBe(200);
        expect(mockGetUserAnalyses).toHaveBeenCalled();
    });

    it('should get insights', async () => {
        const response = await request(app).post('/api/productivity/insights');
        expect(response.status).toBe(200);
        expect(mockGetProductivityInsights).toHaveBeenCalled();
    });

    it('should get optimal schedule', async () => {
        const response = await request(app).get('/api/productivity/optimal-schedule');
        expect(response.status).toBe(200);
        expect(mockGetOptimalSchedule).toHaveBeenCalled();
    });

    it('should compare productivity', async () => {
        const response = await request(app).post('/api/productivity/compare');
        expect(response.status).toBe(200);
        expect(mockCompareProductivity).toHaveBeenCalled();
    });

    it('should protect routes with checkJwt', async () => {
        await request(app).get('/api/productivity/dashboard');
        expect(mockCheckJwt).toHaveBeenCalled();
    });
});
