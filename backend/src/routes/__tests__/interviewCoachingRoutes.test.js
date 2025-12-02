import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

// Mock the controller
const mockSubmitInterviewResponse = jest.fn((req, res) => res.json({ success: true, data: {} }));
const mockGetInterviewResponses = jest.fn((req, res) => res.json({ success: true, data: [] }));
const mockGetInterviewResponseById = jest.fn((req, res) => res.json({ success: true, data: {} }));
const mockUpdateInterviewResponse = jest.fn((req, res) => res.json({ success: true, data: {} }));
const mockDeleteInterviewResponse = jest.fn((req, res) => res.json({ success: true, message: 'Deleted' }));
const mockGetPracticeStats = jest.fn((req, res) => res.json({ success: true, data: {} }));
const mockGenerateQuestions = jest.fn((req, res) => res.json({ success: true, data: [] }));
const mockCompareVersions = jest.fn((req, res) => res.json({ success: true, data: {} }));

jest.unstable_mockModule('../../controllers/interviewCoachingController.js', () => ({
    submitInterviewResponse: mockSubmitInterviewResponse,
    getInterviewResponses: mockGetInterviewResponses,
    getInterviewResponseById: mockGetInterviewResponseById,
    updateInterviewResponse: mockUpdateInterviewResponse,
    deleteInterviewResponse: mockDeleteInterviewResponse,
    getPracticeStats: mockGetPracticeStats,
    generateQuestions: mockGenerateQuestions,
    compareVersions: mockCompareVersions,
}));

//  Mock Clerk's requireAuth middleware
const mockRequireAuth = jest.fn((req, res, next) => {
    req.auth = { userId: 'test-user-id' };
    next();
});

jest.unstable_mockModule('@clerk/express', () => ({
    requireAuth: () => mockRequireAuth,
}));

describe('interviewCoachingRoutes', () => {
    let app;

    beforeEach(async () => {
        jest.clearAllMocks();
        app = express();
        app.use(express.json());

        const interviewCoachingRoutes = await import('../../routes/interviewCoachingRoutes.js');
        app.use('/api/interview-coaching', interviewCoachingRoutes.default);
    });

    it('should submit interview response', async () => {
        const response = await request(app)
            .post('/api/interview-coaching/responses')
            .send({ question: 'Tell me about yourself', answer: 'My answer' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(mockSubmitInterviewResponse).toHaveBeenCalled();
    });

    it('should get all interview responses', async () => {
        const response = await request(app).get('/api/interview-coaching/responses');
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(mockGetInterviewResponses).toHaveBeenCalled();
    });

    it('should get interview response by ID', async () => {
        const response = await request(app).get('/api/interview-coaching/responses/response123');
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(mockGetInterviewResponseById).toHaveBeenCalled();
    });

    it('should update interview response', async () => {
        const response = await request(app)
            .patch('/api/interview-coaching/responses/response123')
            .send({ archived: true });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(mockUpdateInterviewResponse).toHaveBeenCalled();
    });

    it('should delete interview response', async () => {
        const response = await request(app).delete('/api/interview-coaching/responses/response123');
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(mockDeleteInterviewResponse).toHaveBeenCalled();
    });

    it('should get practice stats', async () => {
        const response = await request(app).get('/api/interview-coaching/stats');
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(mockGetPracticeStats).toHaveBeenCalled();
    });

    it('should generate questions', async () => {
        const response = await request(app)
            .post('/api/interview-coaching/questions/generate')
            .send({ role: 'Software Engineer' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(mockGenerateQuestions).toHaveBeenCalled();
    });

    it('should compare versions of response', async () => {
        const response = await request(app).get('/api/interview-coaching/responses/response123/compare');
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(mockCompareVersions).toHaveBeenCalled();
    });

    it('should protect routes with requireAuth', async () => {
        await request(app).get('/api/interview-coaching/responses');
        expect(mockRequireAuth).toHaveBeenCalled();
    });
});
