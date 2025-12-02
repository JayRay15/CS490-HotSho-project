import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

// Mock LinkedIN controller functions
const mockSaveLinkedInProfile = jest.fn((req, res) => res.json({ success: true }));
const mockGetLinkedInProfile = jest.fn((req, res) => res.json({ success: true, data: {} }));
const mockGenerateNetworkingTemplates = jest.fn((req, res) => res.json({ success: true, data: {} }));
const mockGetOptimizationSuggestions = jest.fn((req, res) => res.json({ success: true, data: [] }));
const mockGetContentStrategies = jest.fn((req, res) => res.json({ success: true, data: [] }));
const mockCreateNetworkingCampaign = jest.fn((req, res) => res.json({ success: true, data: {} }));
const mockGetNetworkingCampaigns = jest.fn((req, res) => res.json({ success: true, data: [] }));
const mockUpdateCampaignMetrics = jest.fn((req, res) => res.json({ success: true }));
const mockDeleteCampaign = jest.fn((req, res) => res.json({ success: true }));

jest.unstable_mockModule('../../controllers/linkedinController.js', () => ({
    saveLinkedInProfile: mockSaveLinkedInProfile,
    getLinkedInProfile: mockGetLinkedInProfile,
    generateNetworkingTemplates: mockGenerateNetworkingTemplates,
    getOptimizationSuggestions: mockGetOptimizationSuggestions,
    getContentStrategies: mockGetContentStrategies,
    createNetworkingCampaign: mockCreateNetworkingCampaign,
    getNetworkingCampaigns: mockGetNetworkingCampaigns,
    updateCampaignMetrics: mockUpdateCampaignMetrics,
    deleteCampaign: mockDeleteCampaign,
}));

const mockCheckJwt = jest.fn((req, res, next) => {
    req.auth = { userId: 'test-user-id' };
    next();
});

jest.unstable_mockModule('../../middleware/checkJwt.js', () => ({
    checkJwt: mockCheckJwt,
}));

describe('linkedinRoutes', () => {
    let app;

    beforeEach(async () => {
        jest.clearAllMocks();
        app = express();
        app.use(express.json());

        const linkedinRoutes = await import('../../routes/linkedinRoutes.js');
        app.use('/api/linkedin', linkedinRoutes.default);
    });

    it('should save LinkedIn profile', async () => {
        const response = await request(app).post('/api/linkedin/save-profile');
        expect(response.status).toBe(200);
        expect(mockSaveLinkedInProfile).toHaveBeenCalled();
    });

    it('should get LinkedIn profile', async () => {
        const response = await request(app).get('/api/linkedin/profile');
        expect(response.status).toBe(200);
        expect(mockGetLinkedInProfile).toHaveBeenCalled();
    });

    it('should generate networking templates', async () => {
        const response = await request(app).post('/api/linkedin/networking-templates');
        expect(response.status).toBe(200);
        expect(mockGenerateNetworkingTemplates).toHaveBeenCalled();
    });

    it('should get optimization suggestions', async () => {
        const response = await request(app).get('/api/linkedin/optimization-suggestions');
        expect(response.status).toBe(200);
        expect(mockGetOptimizationSuggestions).toHaveBeenCalled();
    });

    it('should get content strategies', async () => {
        const response = await request(app).get('/api/linkedin/content-strategies');
        expect(response.status).toBe(200);
        expect(mockGetContentStrategies).toHaveBeenCalled();
    });

    it('should create networking campaign', async () => {
        const response = await request(app).post('/api/linkedin/campaigns');
        expect(response.status).toBe(200);
        expect(mockCreateNetworkingCampaign).toHaveBeenCalled();
    });

    it('should get networking campaigns', async () => {
        const response = await request(app).get('/api/linkedin/campaigns');
        expect(response.status).toBe(200);
        expect(mockGetNetworkingCampaigns).toHaveBeenCalled();
    });

    it('should update campaign metrics', async () => {
        const response = await request(app).put('/api/linkedin/campaigns/campaign123');
        expect(response.status).toBe(200);
        expect(mockUpdateCampaignMetrics).toHaveBeenCalled();
    });

    it('should delete campaign', async () => {
        const response = await request(app).delete('/api/linkedin/campaigns/campaign123');
        expect(response.status).toBe(200);
        expect(mockDeleteCampaign).toHaveBeenCalled();
    });

    it('should protect routes with checkJwt', async () => {
        await request(app).get('/api/linkedin/profile');
        expect(mockCheckJwt).toHaveBeenCalled();
    });
});
