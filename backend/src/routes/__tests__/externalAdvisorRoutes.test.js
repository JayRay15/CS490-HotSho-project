import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

// Mock all external advisor controller functions (20+)
const advMocks = {
    inviteAdvisor: jest.fn((req, res) => res.json({ success: true })),
    acceptAdvisorInvitation: jest.fn((req, res) => res.json({ success: true })),
    acceptAdvisorInvitationByToken: jest.fn((req, res) => res.json({ success: true })),
    rejectAdvisorInvitation: jest.fn((req, res) => res.json({ success: true })),
    getMyAdvisors: jest.fn((req, res) => res.json({ success: true, data: [] })),
    getMyClients: jest.fn((req, res) => res.json({ success: true, data: [] })),
    getPendingInvitations: jest.fn((req, res) => res.json({ success: true, data: [] })),
    cancelAdvisorRelationship: jest.fn((req, res) => res.json({ success: true })),
    updateSharedData: jest.fn((req, res) => res.json({ success: true })),
    getAdvisorDashboard: jest.fn((req, res) => res.json({ success: true, data: {} })),
    getClientProfile: jest.fn((req, res) => res.json({ success: true, data: {} })),
    createSession: jest.fn((req, res) => res.json({ success: true })),
    getSessions: jest.fn((req, res) => res.json({ success: true, data: [] })),
    updateSession: jest.fn((req, res) => res.json({ success: true })),
    addSessionNotes: jest.fn((req, res) => res.json({ success: true })),
    getBilling: jest.fn((req, res) => res.json({ success: true, data: {} })),
    updateBilling: jest.fn((req, res) => res.json({ success: true })),
    getPayments: jest.fn((req, res) => res.json({ success: true, data: [] })),
    recordPayment: jest.fn((req, res) => res.json({ success: true })),
    createRecommendation: jest.fn((req, res) => res.json({ success: true })),
    getRecommendations: jest.fn((req, res) => res.json({ success: true, data: [] })),
    updateRecommendation: jest.fn((req, res) => res.json({ success: true })),
    createEvaluation: jest.fn((req, res) => res.json({ success: true })),
    getEvaluations: jest.fn((req, res) => res.json({ success: true, data: [] })),
    respondToEvaluation: jest.fn((req, res) => res.json({ success: true })),
    getAdvisorRating: jest.fn((req, res) => res.json({ success: true, data: {} })),
    sendMessage: jest.fn((req, res) => res.json({ success: true })),
    getMessages: jest.fn((req, res) => res.json({ success: true, data: [] })),
    getUnreadCount: jest.fn((req, res) => res.json({ success: true, count: 0 })),
    getImpactMetrics: jest.fn((req, res) => res.json({ success: true, data: {} })),
    addImpactMetric: jest.fn((req, res) => res.json({ success: true })),
    updateImpactMetrics: jest.fn((req, res) => res.json({ success: true })),
    getImpactReport: jest.fn((req, res) => res.json({ success: true, data: {} })),
};

jest.unstable_mockModule('../../controllers/externalAdvisorController.js', () => advMocks);

const mockCheckJwt = jest.fn((req, res, next) => {
    req.auth = { userId: 'test-user-id' };
    next();
});

jest.unstable_mockModule('../../middleware/checkJwt.js', () => ({
    checkJwt: mockCheckJwt,
}));

describe('externalAdvisorRoutes', () => {
    let app;

    beforeEach(async () => {
        jest.clearAllMocks();
        app = express();
        app.use(express.json());

        const advisorRoutes = await import('../../routes/externalAdvisorRoutes.js');
        app.use('/api/external-advisor', advisorRoutes.default);
    });

    const endpoints = [
        ['POST', '/invite', 'inviteAdvisor'],
        ['POST', '/accept/rel123', 'acceptAdvisorInvitation'],
        ['POST', '/accept-token/token123', 'acceptAdvisorInvitationByToken'],
        ['POST', '/reject/rel123', 'rejectAdvisorInvitation'],
        ['GET', '/my-advisors', 'getMyAdvisors'],
        ['GET', '/my-clients', 'getMyClients'],
        ['GET', '/pending', 'getPendingInvitations'],
        ['POST', '/cancel/rel123', 'cancelAdvisorRelationship'],
        ['PUT', '/rel123/shared-data', 'updateSharedData'],
        ['GET', '/dashboard', 'getAdvisorDashboard'],
        ['GET', '/clients/rel123/profile', 'getClientProfile'],
        ['POST', '/sessions', 'createSession'],
        ['GET', '/sessions', 'getSessions'],
        ['PUT', '/sessions/ses123', 'updateSession'],
        ['POST', '/sessions/ses123/notes', 'addSessionNotes'],
        ['GET', '/billing/rel123', 'getBilling'],
        ['PUT', '/billing/rel123', 'updateBilling'],
        ['GET', '/payments/rel123', 'getPayments'],
        ['POST', '/payments', 'recordPayment'],
        ['POST', '/recommendations', 'createRecommendation'],
        ['GET', '/recommendations', 'getRecommendations'],
        ['PUT', '/recommendations/rec123', 'updateRecommendation'],
        ['POST', '/evaluations', 'createEvaluation'],
        ['GET', '/evaluations', 'getEvaluations'],
        ['PUT', '/evaluations/eval123/respond', 'respondToEvaluation'],
        ['GET', '/ratings/adv123', 'getAdvisorRating'],
        ['GET', '/messages/unread/count', 'getUnreadCount'],
        ['POST', '/messages', 'sendMessage'],
        ['GET', '/messages/rel123', 'getMessages'],
        ['GET', '/impact/rel123', 'getImpactMetrics'],
        ['POST', '/impact', 'addImpactMetric'],
        ['PUT', '/rel123/impact', 'updateImpactMetrics'],
        ['GET', '/rel123/impact-report', 'getImpactReport'],
    ];

    endpoints.forEach(([method, path, mockName]) => {
        it(`should handle ${method} /api/external-advisor${path}`, async () => {
            const response = await request(app)[method.toLowerCase()](`/api/external-advisor${path}`);
            expect(response.status).toBe(200);
            expect(advMocks[mockName]).toHaveBeenCalled();
        });
    });

    it('should protect routes with checkJwt', async () => {
        await request(app).get('/api/external-advisor/my-advisors');
        expect(mockCheckJwt).toHaveBeenCalled();
    });
});
