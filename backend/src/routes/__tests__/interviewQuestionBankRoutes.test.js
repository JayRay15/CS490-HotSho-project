import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

// Mock the controller
const mockGenerateInterviewQuestionBank = jest.fn((req, res) => res.json({ success: true, data: {} }));
const mockGetQuestionBankByJob = jest.fn((req, res) => res.json({ success: true, data: {} }));
const mockGetAllQuestionBanks = jest.fn((req, res) => res.json({ success: true, data: [] }));
const mockUpdatePracticeStatus = jest.fn((req, res) => res.json({ success: true, data: {} }));
const mockDeleteQuestionBank = jest.fn((req, res) => res.json({ success: true, message: 'Deleted' }));

jest.unstable_mockModule('../../controllers/interviewQuestionBankController.js', () => ({
    generateInterviewQuestionBank: mockGenerateInterviewQuestionBank,
    getQuestionBankByJob: mockGetQuestionBankByJob,
    getAllQuestionBanks: mockGetAllQuestionBanks,
    updatePracticeStatus: mockUpdatePracticeStatus,
    deleteQuestionBank: mockDeleteQuestionBank,
}));

// Mock the middleware
const mockCheckJwt = jest.fn((req, res, next) => {
    req.auth = { userId: 'test-user-id' };
    next();
});

jest.unstable_mockModule('../../middleware/checkJwt.js', () => ({
    checkJwt: mockCheckJwt,
}));

describe('interviewQuestionBankRoutes', () => {
    let app;

    beforeEach(async () => {
        jest.clearAllMocks();
        app = express();
        app.use(express.json());

        const questionBankRoutes = await import('../../routes/interviewQuestionBankRoutes.js');
        app.use('/api/interview-question-bank', questionBankRoutes.default);
    });

    describe('POST /api/interview-question-bank/generate', () => {
        it('should generate interview question bank', async () => {
            const response = await request(app)
                .post('/api/interview-question-bank/generate')
                .send({ jobId: 'job123' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockGenerateInterviewQuestionBank).toHaveBeenCalled();
        });

        it('should protect the route with checkJwt middleware', async () => {
            await request(app).post('/api/interview-question-bank/generate');
            expect(mockCheckJwt).toHaveBeenCalled();
        });
    });

    describe('GET /api/interview-question-bank', () => {
        it('should get all question banks', async () => {
            const response = await request(app).get('/api/interview-question-bank');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockGetAllQuestionBanks).toHaveBeenCalled();
        });

        it('should protect the route with checkJwt middleware', async () => {
            await request(app).get('/api/interview-question-bank');
            expect(mockCheckJwt).toHaveBeenCalled();
        });
    });

    describe('GET /api/interview-question-bank/job/:jobId', () => {
        it('should get question bank by job', async () => {
            const response = await request(app).get('/api/interview-question-bank/job/job123');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockGetQuestionBankByJob).toHaveBeenCalled();
        });
    });

    describe('PATCH /api/interview-question-bank/:id/question/:questionId/practice', () => {
        it('should update practice status', async () => {
            const response = await request(app)
                .patch('/api/interview-question-bank/bank123/question/q456/practice')
                .send({ practiced: true });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockUpdatePracticeStatus).toHaveBeenCalled();
        });
    });

    describe('DELETE /api/interview-question-bank/:id', () => {
        it('should delete question bank', async () => {
            const response = await request(app).delete('/api/interview-question-bank/bank123');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockDeleteQuestionBank).toHaveBeenCalled();
        });
    });

    describe('middleware application', () => {
        it('should apply checkJwt to all routes via router.use', async () => {
            await request(app).get('/api/interview-question-bank');
            expect(mockCheckJwt).toHaveBeenCalled();
        });

        it('should reject unauthenticated requests when middleware fails', async () => {
            mockCheckJwt.mockImplementationOnce((req, res, next) => {
                res.status(401).json({ success: false, message: 'Unauthorized' });
            });

            const response = await request(app).get('/api/interview-question-bank');

            expect(response.status).toBe(401);
            expect(mockGetAllQuestionBanks).not.toHaveBeenCalled();
        });
    });
});
