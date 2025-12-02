import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

// Mock all 15 controller functions in one declaration
const mocks = {
    invitePartner: jest.fn((req, res) => res.json({ success: true })),
    acceptPartnerInvitation: jest.fn((req, res) => res.json({ success: true })),
    getMyPartnerships: jest.fn((req, res) => res.json({ success: true, data: [] })),
    updatePartnership: jest.fn((req, res) => res.json({ success: true })),
    endPartnership: jest.fn((req, res) => res.json({ success: true })),
    shareProgress: jest.fn((req, res) => res.json({ success: true })),
    getMyProgressShares: jest.fn((req, res) => res.json({ success: true, data: [] })),
    getSharedProgress: jest.fn((req, res) => res.json({ success: true, data: {} })),
    viewProgressByToken: jest.fn((req, res) => res.json({ success: true, data: {} })),
    addEncouragement: jest.fn((req, res) => res.json({ success: true })),
    getAchievements: jest.fn((req, res) => res.json({ success: true, data: [] })),
    celebrateAchievement: jest.fn((req, res) => res.json({ success: true })),
    sendMessage: jest.fn((req, res) => res.json({ success: true })),
    getMessages: jest.fn((req, res) => res.json({ success: true, data: [] })),
    getInsights: jest.fn((req, res) => res.json({ success: true, data: {} })),
    recordCheckIn: jest.fn((req, res) => res.json({ success: true })),
    getWeeklySummary: jest.fn((req, res) => res.json({ success: true, data: {} })),
};

jest.unstable_mockModule('../../controllers/accountabilityController.js', () => mocks);

const mockCheckJwt = jest.fn((req, res, next) => {
    req.auth = { userId: 'test-user-id' };
    next();
});

jest.unstable_mockModule('../../middleware/checkJwt.js', () => ({
    checkJwt: mockCheckJwt,
}));

describe('accountabilityRoutes', () => {
    let app;

    beforeEach(async () => {
        jest.clearAllMocks();
        app = express();
        app.use(express.json());

        const accountabilityRoutes = await import('../../routes/accountabilityRoutes.js');
        app.use('/api/accountability', accountabilityRoutes.default);
    });

    const endpoints = [
        ['POST', '/partners/invite', 'invitePartner'],
        ['POST', '/partners/accept/token123', 'acceptPartnerInvitation'],
        ['GET', '/partners', 'getMyPartnerships'],
        ['PUT', '/partners/p123', 'updatePartnership'],
        ['DELETE', '/partners/p123', 'endPartnership'],
        ['POST', '/check-in/p123', 'recordCheckIn'],
        ['POST', '/progress', 'shareProgress'],
        ['GET', '/progress', 'getMyProgressShares'],
        ['GET', '/progress/shared/p123', 'getSharedProgress'],
        ['GET', '/progress/view/token123', 'viewProgressByToken'],
        ['POST', '/progress/share123/encourage', 'addEncouragement'],
        ['GET', '/achievements', 'getAchievements'],
        ['POST', '/achievements/ach123/celebrate', 'celebrateAchievement'],
        ['POST', '/messages', 'sendMessage'],
        ['GET', '/messages/p123', 'getMessages'],
        ['GET', '/insights', 'getInsights'],
        ['GET', '/weekly-summary', 'getWeeklySummary'],
    ];

    endpoints.forEach(([method, path, mockName]) => {
        it(`should handle ${method} /api/accountability${path}`, async () => {
            const response = await request(app)[method.toLowerCase()](`/api/accountability${path}`);
            expect(response.status).toBe(200);
            expect(mocks[mockName]).toHaveBeenCalled();
        });
    });

    it('should protect routes with checkJwt', async () => {
        await request(app).get('/api/accountability/partners');
        expect(mockCheckJwt).toHaveBeenCalled();
    });

    it('should allow unauthenticated access to viewProgressByToken', async () => {
        jest.clearAllMocks();
        await request(app).get('/api/accountability/progress/view/token123');
        expect(mocks.viewProgressByToken).toHaveBeenCalled();
    });
});
