import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

// Mock the controller functions
const mockGetPrediction = jest.fn((req, res) => res.json({ success: true, data: {} }));
const mockGetAllUserPredictions = jest.fn((req, res) => res.json({ success: true, data: [] }));
const mockGetUpcomingPredictions = jest.fn((req, res) => res.json({ success: true, data: [] }));
const mockRecalculatePrediction = jest.fn((req, res) => res.json({ success: true, data: {} }));
const mockCompleteRecommendation = jest.fn((req, res) => res.json({ success: true }));
const mockUncompleteRecommendation = jest.fn((req, res) => res.json({ success: true }));
const mockRecordOutcome = jest.fn((req, res) => res.json({ success: true }));
const mockGetAnalytics = jest.fn((req, res) => res.json({ success: true, data: {} }));
const mockCompareInterviews = jest.fn((req, res) => res.json({ success: true, data: {} }));

jest.unstable_mockModule('../../controllers/interviewPredictionController.js', () => ({
    getPrediction: mockGetPrediction,
    getAllUserPredictions: mockGetAllUserPredictions,
    getUpcomingPredictions: mockGetUpcomingPredictions,
    recalculatePrediction: mockRecalculatePrediction,
    completeRecommendation: mockCompleteRecommendation,
    uncompleteRecommendation: mockUncompleteRecommendation,
    recordOutcome: mockRecordOutcome,
    getAnalytics: mockGetAnalytics,
    compareInterviews: mockCompareInterviews,
}));

// Mock the middleware
const mockCheckJwt = jest.fn((req, res, next) => {
    req.auth = { userId: 'test-user-id' };
    next();
});

jest.unstable_mockModule('../../middleware/checkJwt.js', () => ({
    checkJwt: mockCheckJwt,
}));

describe('interviewPredictionRoutes', () => {
    let app;

    beforeEach(async () => {
        jest.clearAllMocks();
        app = express();
        app.use(express.json());

        const interviewPredictionRoutes = await import('../../routes/interviewPredictionRoutes.js');
        app.use('/api/interview-prediction', interviewPredictionRoutes.default);
    });

    describe('GET /api/interview-prediction/user/all', () => {
        it('should get all user predictions', async () => {
            const response = await request(app).get('/api/interview-prediction/user/all');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockGetAllUserPredictions).toHaveBeenCalled();
        });
    });

    describe('GET /api/interview-prediction/upcoming/list', () => {
        it('should get upcoming predictions', async () => {
            const response = await request(app).get('/api/interview-prediction/upcoming/list');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockGetUpcomingPredictions).toHaveBeenCalled();
        });
    });

    describe('GET /api/interview-prediction/analytics/accuracy', () => {
        it('should get prediction analytics', async () => {
            const response = await request(app).get('/api/interview-prediction/analytics/accuracy');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockGetAnalytics).toHaveBeenCalled();
        });
    });

    describe('GET /api/interview-prediction/comparison/interviews', () => {
        it('should compare interviews', async () => {
            const response = await request(app).get('/api/interview-prediction/comparison/interviews');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockCompareInterviews).toHaveBeenCalled();
        });
    });

    describe('GET /api/interview-prediction/:interviewId', () => {
        it('should get prediction for specific interview', async () => {
            const response = await request(app).get('/api/interview-prediction/interview123');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockGetPrediction).toHaveBeenCalled();
        });
    });

    describe(' /api/interview-prediction/:interviewId/recalculate', () => {
        it('should recalculate prediction', async () => {
            const response = await request(app).post('/api/interview-prediction/interview123/recalculate');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockRecalculatePrediction).toHaveBeenCalled();
        });
    });

    describe('PUT /api/interview-prediction/:interviewId/recommendations/:recommendationId/complete', () => {
        it('should mark recommendation as completed', async () => {
            const response = await request(app)
                .put('/api/interview-prediction/interview123/recommendations/rec456/complete');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockCompleteRecommendation).toHaveBeenCalled();
        });
    });

    describe('DELETE /api/interview-prediction/:interviewId/recommendations/:recommendationId/complete', () => {
        it('should undo completed recommendation', async () => {
            const response = await request(app)
                .delete('/api/interview-prediction/interview123/recommendations/rec456/complete');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockUncompleteRecommendation).toHaveBeenCalled();
        });
    });

    describe('POST /api/interview-prediction/:interviewId/outcome', () => {
        it('should record interview outcome', async () => {
            const response = await request(app)
                .post('/api/interview-prediction/interview123/outcome')
                .send({ outcome: 'hired' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockRecordOutcome).toHaveBeenCalled();
        });
    });

    describe('middleware application', () => {
        it('should apply checkJwt to all routes via router.use', async () => {
            await request(app).get('/api/interview-prediction/user/all');
            expect(mockCheckJwt).toHaveBeenCalled();
        });

        it('should reject unauthenticated requests when middleware fails', async () => {
            mockCheckJwt.mockImplementationOnce((req, res, next) => {
                res.status(401).json({ success: false, message: 'Unauthorized' });
            });

            const response = await request(app).get('/api/interview-prediction/user/all');

            expect(response.status).toBe(401);
            expect(mockGetAllUserPredictions).not.toHaveBeenCalled();
        });
    });
});
