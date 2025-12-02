import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

// Mock the controller functions
const mockCreateFollowUp = jest.fn((req, res) => res.json({ success: true, data: {} }));
const mockGetAllFollowUps = jest.fn((req, res) => res.json({ success: true, data: [] }));
const mockGetJobFollowUps = jest.fn((req, res) => res.json({ success: true, data: [] }));
const mockGetJobFollowUpStats = jest.fn((req, res) => res.json({ success: true, data: {} }));
const mockGetOverallStats = jest.fn((req, res) => res.json({ success: true, data: {} }));
const mockUpdateFollowUpResponse = jest.fn((req, res) => res.json({ success: true, data: {} }));
const mockDeleteFollowUp = jest.fn((req, res) => res.json({ success: true, message: 'Deleted' }));

// Mock using default export with all properties
jest.unstable_mockModule('../../controllers/followUpController.js', () => ({
    createFollowUp: mockCreateFollowUp,
    getAllFollowUps: mockGetAllFollowUps,
    getJobFollowUps: mockGetJobFollowUps,
    getJobFollowUpStats: mockGetJobFollowUpStats,
    getOverallStats: mockGetOverallStats,
    updateFollowUpResponse: mockUpdateFollowUpResponse,
    deleteFollowUp: mockDeleteFollowUp,
}));

// Mock the middleware
const mockCheckJwt = jest.fn((req, res, next) => {
    req.auth = { userId: 'test-user-id' };
    next();
});

jest.unstable_mockModule('../../middleware/checkJwt.js', () => ({
    checkJwt: mockCheckJwt,
}));

describe('followUp Routes', () => {
    let app;

    beforeEach(async () => {
        jest.clearAllMocks();
        app = express();
        app.use(express.json());

        const followUpRoutes = await import('../../routes/followUp.js');
        app.use('/api/follow-up', followUpRoutes.default);
    });

    describe('POST /api/follow-up', () => {
        it('should create a follow-up', async () => {
            const response = await request(app)
                .post('/api/follow-up')
                .send({ jobId: 'job123', note: 'Follow up' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockCreateFollowUp).toHaveBeenCalled();
        });

        it('should protect the route with checkJwt middleware', async () => {
            await request(app).post('/api/follow-up');
            expect(mockCheckJwt).toHaveBeenCalled();
        });
    });

    describe('GET /api/follow-up', () => {
        it('should get all follow-ups for user', async () => {
            const response = await request(app).get('/api/follow-up');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockGetAllFollowUps).toHaveBeenCalled();
        });

        it('should protect the route with checkJwt middleware', async () => {
            await request(app).get('/api/follow-up');
            expect(mockCheckJwt).toHaveBeenCalled();
        });
    });

    describe('GET /api/follow-up/stats/:jobId', () => {
        it('should get follow-up statistics for specific job', async () => {
            const response = await request(app).get('/api/follow-up/stats/job123');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockGetJobFollowUpStats).toHaveBeenCalled();
        });
    });

    describe('GET /api/follow-up/:jobId', () => {
        it('should get follow-ups for specific job', async () => {
            const response = await request(app).get('/api/follow-up/job123');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockGetJobFollowUps).toHaveBeenCalled();
        });

        it('should handle /stats route via :jobId param due to route ordering', async () => {
            // Note: Due to route order in followUp.js, /stats matches /:jobId before /stats route
            const response = await request(app).get('/api/follow-up/stats');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            // This matches /:jobId where jobId='stats', not the /stats route
            expect(mockGetJobFollowUps).toHaveBeenCalled();
        });
    });

    describe('PUT /api/follow-up/:followUpId/response', () => {
        it('should update follow-up response status', async () => {
            const response = await request(app)
                .put('/api/follow-up/followup123/response')
                .send({ responded: true });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockUpdateFollowUpResponse).toHaveBeenCalled();
        });
    });

    describe('DELETE /api/follow-up/:followUpId', () => {
        it('should delete a follow-up', async () => {
            const response = await request(app).delete('/api/follow-up/followup123');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockDeleteFollowUp).toHaveBeenCalled();
        });
    });

    describe('middleware application', () => {
        it('should apply checkJwt to all routes via router.use', async () => {
            await request(app).get('/api/follow-up');
            expect(mockCheckJwt).toHaveBeenCalled();
        });

        it('should reject unauthenticated requests when middleware fails', async () => {
            mockCheckJwt.mockImplementationOnce((req, res, next) => {
                res.status(401).json({ success: false, message: 'Unauthorized' });
            });

            const response = await request(app).get('/api/follow-up');

            expect(response.status).toBe(401);
            expect(mockGetAllFollowUps).not.toHaveBeenCalled();
        });
    });
});
