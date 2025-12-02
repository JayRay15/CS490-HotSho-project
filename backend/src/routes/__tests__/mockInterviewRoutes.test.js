import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

// Mock the controller
const mockStartMockInterview = jest.fn((req, res) => res.json({ success: true, sessionId: 'session123' }));
const mockGetSession = jest.fn((req, res) => res.json({ success: true, data: {} }));
const mockAnswerQuestion = jest.fn((req, res) => res.json({ success: true, data: {} }));
const mockFinishSession = jest.fn((req, res) => res.json({ success: true, data: {} }));
const mockGetSummary = jest.fn((req, res) => res.json({ success: true, data: {} }));
const mockGetUserSessions = jest.fn((req, res) => res.json({ success: true, data: [] }));

jest.unstable_mockModule('../../controllers/mockInterviewController.js', () => ({
    startMockInterview: mockStartMockInterview,
    getSession: mockGetSession,
    answerQuestion: mockAnswerQuestion,
    finishSession: mockFinishSession,
    getSummary: mockGetSummary,
    getUserSessions: mockGetUserSessions,
}));

// Mock the middleware
const mockCheckJwt = jest.fn((req, res, next) => {
    req.auth = { userId: 'test-user-id' };
    next();
});

jest.unstable_mockModule('../../middleware/checkJwt.js', () => ({
    checkJwt: mockCheckJwt,
}));

describe('mockInterviewRoutes', () => {
    let app;

    beforeEach(async () => {
        jest.clearAllMocks();
        app = express();
        app.use(express.json());

        const mockInterviewRoutes = await import('../../routes/mockInterviewRoutes.js');
        app.use('/api/mock-interview', mockInterviewRoutes.default);
    });

    describe('GET /api/mock-interview', () => {
        it('should get all user sessions', async () => {
            const response = await request(app).get('/api/mock-interview');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockGetUserSessions).toHaveBeenCalled();
        });

        it('should protect the route with checkJwt middleware', async () => {
            await request(app).get('/api/mock-interview');
            expect(mockCheckJwt).toHaveBeenCalled();
        });
    });

    describe('POST /api/mock-interview/start', () => {
        it('should start a new mock interview session', async () => {
            const response = await request(app)
                .post('/api/mock-interview/start')
                .send({ role: 'Software Engineer' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockStartMockInterview).toHaveBeenCalled();
        });

        it('should protect the route with checkJwt middleware', async () => {
            await request(app).post('/api/mock-interview/start');
            expect(mockCheckJwt).toHaveBeenCalled();
        });
    });

    describe('GET /api/mock-interview/:sessionId', () => {
        it('should get session details', async () => {
            const response = await request(app).get('/api/mock-interview/session123');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockGetSession).toHaveBeenCalled();
        });
    });

    describe('POST /api/mock-interview/:sessionId/answer', () => {
        it('should answer current question', async () => {
            const response = await request(app)
                .post('/api/mock-interview/session123/answer')
                .send({ answer: 'My answer' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockAnswerQuestion).toHaveBeenCalled();
        });
    });

    describe('POST /api/mock-interview/:sessionId/finish', () => {
        it('should finish session', async () => {
            const response = await request(app)
                .post('/api/mock-interview/session123/finish');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockFinishSession).toHaveBeenCalled();
        });
    });

    describe('GET /api/mock-interview/:sessionId/summary', () => {
        it('should get session summary', async () => {
            const response = await request(app).get('/api/mock-interview/session123/summary');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockGetSummary).toHaveBeenCalled();
        });
    });

    describe('middleware application', () => {
        it('should reject unauthenticated requests when middleware fails', async () => {
            mockCheckJwt.mockImplementationOnce((req, res, next) => {
                res.status(401).json({ success: false, message: 'Unauthorized' });
            });

            const response = await request(app).get('/api/mock-interview');

            expect(response.status).toBe(401);
            expect(mockGetUserSessions).not.toHaveBeenCalled();
        });
    });
});
