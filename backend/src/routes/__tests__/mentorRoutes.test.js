import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

// Mock all 16 mentor controller functions
const mocks = {
    inviteMentor: jest.fn((req, res) => res.json({ success: true })),
    acceptMentorInvitation: jest.fn((req, res) => res.json({ success: true })),
    rejectMentorInvitation: jest.fn((req, res) => res.json({ success: true })),
    getMyMentors: jest.fn((req, res) => res.json({ success: true, data: [] })),
    getMyMentees: jest.fn((req, res) => res.json({ success: true, data: [] })),
    getPendingInvitations: jest.fn((req, res) => res.json({ success: true, data: [] })),
    cancelMentorship: jest.fn((req, res) => res.json({ success: true })),
    addFeedback: jest.fn((req, res) => res.json({ success: true })),
    getReceivedFeedback: jest.fn((req, res) => res.json({ success: true, data: [] })),
    acknowledgeFeedback: jest.fn((req, res) => res.json({ success: true })),
    addRecommendation: jest.fn((req, res) => res.json({ success: true })),
    getRecommendations: jest.fn((req, res) => res.json({ success: true, data: [] })),
    updateRecommendationStatus: jest.fn((req, res) => res.json({ success: true })),
    sendMessage: jest.fn((req, res) => res.json({ success: true })),
    getMessages: jest.fn((req, res) => res.json({ success: true, data: [] })),
    generateProgressReport: jest.fn((req, res) => res.json({ success: true })),
    getProgressReports: jest.fn((req, res) => res.json({ success: true, data: [] })),
    getMentorDashboard: jest.fn((req, res) => res.json({ success: true, data: {} })),
    getMenteeProfile: jest.fn((req, res) => res.json({ success: true, data: {} })),
    getMenteeProgress: jest.fn((req, res) => res.json({ success: true, data: {} })),
    getMenteeInsights: jest.fn((req, res) => res.json({ success: true, data: {} })),
    getMenteeEngagement: jest.fn((req, res) => res.json({ success: true, data: {} })),
};

jest.unstable_mockModule('../../controllers/mentorController.js', () => mocks);

const mockCheckJwt = jest.fn((req, res, next) => {
    req.auth = { userId: 'test-user-id' };
    next();
});

jest.unstable_mockModule('../../middleware/checkJwt.js', () => ({
    checkJwt: mockCheckJwt,
}));

describe('mentorRoutes', () => {
    let app;

    beforeEach(async () => {
        jest.clearAllMocks();
        app = express();
        app.use(express.json());

        const mentorRoutes = await import('../../routes/mentorRoutes.js');
        app.use('/api/mentor', mentorRoutes.default);
    });

    const endpoints = [
        ['POST', '/invite', 'inviteMentor'],
        ['POST', '/accept/rel123', 'acceptMentorInvitation'],
        ['POST', '/reject/rel123', 'rejectMentorInvitation'],
        ['GET', '/my-mentors', 'getMyMentors'],
        ['GET', '/my-mentees', 'getMyMentees'],
        ['GET', '/pending', 'getPendingInvitations'],
        ['POST', '/cancel/rel123', 'cancelMentorship'],
        ['POST', '/feedback', 'addFeedback'],
        ['GET', '/feedback/received', 'getReceivedFeedback'],
        ['PUT', '/feedback/fb123/acknowledge', 'acknowledgeFeedback'],
        ['POST', '/recommendations', 'addRecommendation'],
        ['GET', '/recommendations', 'getRecommendations'],
        ['PUT', '/recommendations/rec123', 'updateRecommendationStatus'],
        ['POST', '/messages', 'sendMessage'],
        ['GET', '/messages/rel123', 'getMessages'],
        ['POST', '/progress-reports', 'generateProgressReport'],
        ['GET', '/progress-reports', 'getProgressReports'],
        ['GET', '/dashboard', 'getMentorDashboard'],
        ['GET', '/mentee/mentee123/profile', 'getMenteeProfile'],
        ['GET', '/mentee/mentee123/progress', 'getMenteeProgress'],
        ['GET', '/mentee/mentee123/insights', 'getMenteeInsights'],
        ['GET', '/mentee/mentee123/engagement', 'getMenteeEngagement'],
    ];

    endpoints.forEach(([method, path, mockName]) => {
        it(`should handle ${method} /api/mentor${path}`, async () => {
            const response = await request(app)[method.toLowerCase()](`/api/mentor${path}`);
            expect(response.status).toBe(200);
            expect(mocks[mockName]).toHaveBeenCalled();
        });
    });

    it('should protect routes with checkJwt', async () => {
        await request(app).get('/api/mentor/my-mentors');
        expect(mockCheckJwt).toHaveBeenCalled();
    });
});
