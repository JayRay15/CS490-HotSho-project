import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

// Mock the controller
const mockGetBehavioralQuestions = jest.fn((req, res) => res.json({ success: true, data: [] }));
const mockGetBehavioralQuestion = jest.fn((req, res) => res.json({ success: true, data: {} }));
const mockCreatePracticeSession = jest.fn((req, res) => res.json({ success: true, data: {} }));
const mockGetPracticeSessions = jest.fn((req, res) => res.json({ success: true, data: [] }));
const mockGetPracticeSession = jest.fn((req, res) => res.json({ success: true, data: {} }));
const mockSubmitResponse = jest.fn((req, res) => res.json({ success: true, data: {} }));
const mockCompletePracticeSession = jest.fn((req, res) => res.json({ success: true, data: {} }));
const mockGetPerformanceTracking = jest.fn((req, res) => res.json({ success: true, data: {} }));
const mockCompareSessions = jest.fn((req, res) => res.json({ success: true, data: {} }));
const mockUpdateNerveManagement = jest.fn((req, res) => res.json({ success: true, data: {} }));
const mockGetWritingTips = jest.fn((req, res) => res.json({ success: true, data: [] }));

jest.unstable_mockModule('../../controllers/writingPracticeController.js', () => ({
    getBehavioralQuestions: mockGetBehavioralQuestions,
    getBehavioralQuestion: mockGetBehavioralQuestion,
    createPracticeSession: mockCreatePracticeSession,
    getPracticeSessions: mockGetPracticeSessions,
    getPracticeSession: mockGetPracticeSession,
    submitResponse: mockSubmitResponse,
    completePracticeSession: mockCompletePracticeSession,
    getPerformanceTracking: mockGetPerformanceTracking,
    compareSessions: mockCompareSessions,
    updateNerveManagement: mockUpdateNerveManagement,
    getWritingTips: mockGetWritingTips,
}));

// Mock the middleware
const mockCheckJwt = jest.fn((req, res, next) => {
    req.auth = { userId: 'test-user-id' };
    next();
});

jest.unstable_mockModule('../../middleware/checkJwt.js', () => ({
    checkJwt: mockCheckJwt,
}));

describe('writingPracticeRoutes', () => {
    let app;

    beforeEach(async () => {
        jest.clearAllMocks();
        app = express();
        app.use(express.json());

        const writingPracticeRoutes = await import('../../routes/writingPracticeRoutes.js');
        app.use('/api/writing-practice', writingPracticeRoutes.default);
    });

    describe('GET /api/writing-practice/questions', () => {
        it('should get behavioral questions', async () => {
            const response = await request(app).get('/api/writing-practice/questions');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockGetBehavioralQuestions).toHaveBeenCalled();
        });

        it('should protect the route with checkJwt middleware', async () => {
            await request(app).get('/api/writing-practice/questions');
            expect(mockCheckJwt).toHaveBeenCalled();
        });
    });

    describe('GET /api/writing-practice/questions/:id', () => {
        it('should get a specific behavioral question', async () => {
            const response = await request(app).get('/api/writing-practice/questions/q123');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockGetBehavioralQuestion).toHaveBeenCalled();
        });
    });

    describe('POST /api/writing-practice/sessions', () => {
        it('should create a practice session', async () => {
            const response = await request(app)
                .post('/api/writing-practice/sessions')
                .send({ questionIds: ['q1', 'q2'] });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockCreatePracticeSession).toHaveBeenCalled();
        });
    });

    describe('GET /api/writing-practice/sessions', () => {
        it('should get all practice sessions', async () => {
            const response = await request(app).get('/api/writing-practice/sessions');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockGetPracticeSessions).toHaveBeenCalled();
        });
    });

    describe('GET /api/writing-practice/sessions/:id', () => {
        it('should get a specific practice session', async () => {
            const response = await request(app).get('/api/writing-practice/sessions/session123');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockGetPracticeSession).toHaveBeenCalled();
        });
    });

    describe('POST /api/writing-practice/sessions/:sessionId/questions/:questionId/respond', () => {
        it('should submit a response', async () => {
            const response = await request(app)
                .post('/api/writing-practice/sessions/session123/questions/q456/respond')
                .send({ response: 'My answer' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockSubmitResponse).toHaveBeenCalled();
        });
    });

    describe('POST /api/writing-practice/sessions/:sessionId/complete', () => {
        it('should complete a practice session', async () => {
            const response = await request(app)
                .post('/api/writing-practice/sessions/session123/complete');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockCompletePracticeSession).toHaveBeenCalled();
        });
    });

    describe('GET /api/writing-practice/performance', () => {
        it('should get performance tracking', async () => {
            const response = await request(app).get('/api/writing-practice/performance');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockGetPerformanceTracking).toHaveBeenCalled();
        });
    });

    describe('GET /api/writing-practice/performance/compare', () => {
        it('should compare sessions', async () => {
            const response = await request(app).get('/api/writing-practice/performance/compare');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockCompareSessions).toHaveBeenCalled();
        });
    });

    describe('PUT /api/writing-practice/nerve-management', () => {
        it('should update nerve management settings', async () => {
            const response = await request(app)
                .put('/api/writing-practice/nerve-management')
                .send({ level: 'high' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockUpdateNerveManagement).toHaveBeenCalled();
        });
    });

    describe('GET /api/writing-practice/tips', () => {
        it('should get writing tips', async () => {
            const response = await request(app).get('/api/writing-practice/tips');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockGetWritingTips).toHaveBeenCalled();
        });
    });

    describe('middleware application', () => {
        it('should apply checkJwt to all routes via router.use', async () => {
            await request(app).get('/api/writing-practice/questions');
            expect(mockCheckJwt).toHaveBeenCalled();
        });

        it('should reject unauthenticated requests when middleware fails', async () => {
            mockCheckJwt.mockImplementationOnce((req, res, next) => {
                res.status(401).json({ success: false, message: 'Unauthorized' });
            });

            const response = await request(app).get('/api/writing-practice/questions');

            expect(response.status).toBe(401);
            expect(mockGetBehavioralQuestions).not.toHaveBeenCalled();
        });
    });
});
