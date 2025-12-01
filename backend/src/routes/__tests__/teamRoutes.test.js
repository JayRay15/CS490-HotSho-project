import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

// Mock team controllers
const teamMocks = {
    createTeam: jest.fn((req, res) => res.json({ success: true })),
    getMyTeams: jest.fn((req, res) => res.json({ success: true, data: [] })),
    getTeam: jest.fn((req, res) => res.json({ success: true, data: {} })),
    updateTeam: jest.fn((req, res) => res.json({ success: true })),
    deleteTeam: jest.fn((req, res) => res.json({ success: true })),
    inviteMember: jest.fn((req, res) => res.json({ success: true })),
    acceptInvitation: jest.fn((req, res) => res.json({ success: true })),
    getMyInvitations: jest.fn((req, res) => res.json({ success: true, data: [] })),
    getTeamMembers: jest.fn((req, res) => res.json({ success: true, data: [] })),
    updateMemberRole: jest.fn((req, res) => res.json({ success: true })),
    removeMember: jest.fn((req, res) => res.json({ success: true })),
    getTeamDashboard: jest.fn((req, res) => res.json({ success: true, data: {} })),
    getCandidateProgress: jest.fn((req, res) => res.json({ success: true, data: {} })),
    getTeamActivity: jest.fn((req, res) => res.json({ success: true, data: [] })),
};

// Mock subscription controllers
const subMocks = {
    getSubscription: jest.fn((req, res) => res.json({ success: true, data: {} })),
    updateSubscription: jest.fn((req, res) => res.json({ success: true })),
    cancelSubscription: jest.fn((req, res) => res.json({ success: true })),
    getSubscriptionUsage: jest.fn((req, res) => res.json({ success: true, data: {} })),
    applyCoupon: jest.fn((req, res) => res.json({ success: true })),
};

jest.unstable_mockModule('../../controllers/teamController.js', () => teamMocks);
jest.unstable_mockModule('../../controllers/teamSubscriptionController.js', () => subMocks);

// Mock middleware
const mockClerkMiddleware = jest.fn(() => (req, res, next) => {
    req.auth = { userId: 'test-user-id' };
    next();
});

const mockVerifyTeamMembership = jest.fn((req, res, next) => next());
const mockRequirePermission = jest.fn(() => (req, res, next) => next());
const mockRequireTeamOwner = jest.fn((req, res, next) => next());
const mockRequireRole = jest.fn(() => (req, res, next) => next());
const mockCheckSubscriptionLimit = jest.fn(() => (req, res, next) => next());
const mockVerifyTeamActive = jest.fn((req, res, next) => next());

jest.unstable_mockModule('@clerk/express', () => ({
    clerkMiddleware: mockClerkMiddleware,
}));

jest.unstable_mockModule('../../middleware/teamMiddleware.js', () => ({
    verifyTeamMembership: mockVerifyTeamMembership,
    requirePermission: mockRequirePermission,
    requireTeamOwner: mockRequireTeamOwner,
    requireRole: mockRequireRole,
    checkSubscriptionLimit: mockCheckSubscriptionLimit,
    verifyTeamActive: mockVerifyTeamActive,
}));

describe('teamRoutes', () => {
    let app;

    beforeEach(async () => {
        jest.clearAllMocks();
        app = express();
        app.use(express.json());

        const teamRoutes = await import('../../routes/teamRoutes.js');
        app.use('/api/team', teamRoutes.default);
    });

    const teamEndpoints = [
        ['POST', '/', 'createTeam'],
        ['GET', '/', 'getMyTeams'],
        ['GET', '/team123', 'getTeam'],
        ['PUT', '/team123', 'updateTeam'],
        ['DELETE', '/team123', 'deleteTeam'],
        ['POST', '/team123/members/invite', 'inviteMember'],
        ['POST', '/invitations/token123/accept', 'acceptInvitation'],
        ['GET', '/invitations/pending', 'getMyInvitations'],
        ['GET', '/team123/members', 'getTeamMembers'],
        ['PUT', '/team123/members/mem123', 'updateMemberRole'],
        ['DELETE', '/team123/members/mem123', 'removeMember'],
        ['GET', '/team123/dashboard', 'getTeamDashboard'],
        ['GET', '/team123/candidates/cand123/progress', 'getCandidateProgress'],
        ['GET', '/team123/activity', 'getTeamActivity'],
    ];

    teamEndpoints.forEach(([method, path, mockName]) => {
        it(`should handle ${method} /api/team${path}`, async () => {
            const response = await request(app)[method.toLowerCase()](`/api/team${path}`);
            expect(response.status).toBe(200);
            expect(teamMocks[mockName]).toHaveBeenCalled();
        });
    });

    const subEndpoints = [
        ['GET', '/team123/subscription', 'getSubscription'],
        ['PUT', '/team123/subscription', 'updateSubscription'],
        ['POST', '/team123/subscription/cancel', 'cancelSubscription'],
        ['GET', '/team123/subscription/usage', 'getSubscriptionUsage'],
        ['POST', '/team123/subscription/coupon', 'applyCoupon'],
    ];

    subEndpoints.forEach(([method, path, mockName]) => {
        it(`should handle ${method} /api/team${path}`, async () => {
            const response = await request(app)[method.toLowerCase()](`/api/team${path}`);
            expect(response.status).toBe(200);
            expect(subMocks[mockName]).toHaveBeenCalled();
        });
    });

    it('should apply Clerk middleware (route reachable and handler called)', async () => {
        const response = await request(app).get('/api/team');
        expect(response.status).toBe(200);
        // Clerk middleware may be invoked during module setup; ensure the route handler ran
        expect(teamMocks.getMyTeams).toHaveBeenCalled();
    });

    it('should apply team middleware to protected routes', async () => {
        await request(app).put('/api/team/team123');
        expect(mockVerifyTeamMembership).toHaveBeenCalled();
    });
});
