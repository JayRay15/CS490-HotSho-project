import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

// Mock all the controller functions
const mockCreateCampaign = jest.fn((req, res) => res.json({ success: true, data: { campaign: {} } }));
const mockGetCampaigns = jest.fn((req, res) => res.json({ success: true, data: { campaigns: [] } }));
const mockGetCampaign = jest.fn((req, res) => res.json({ success: true, data: { campaign: {} } }));
const mockUpdateCampaign = jest.fn((req, res) => res.json({ success: true, data: { campaign: {} } }));
const mockDeleteCampaign = jest.fn((req, res) => res.json({ success: true }));
const mockAddOutreach = jest.fn((req, res) => res.json({ success: true, data: { outreach: {} } }));
const mockUpdateOutreach = jest.fn((req, res) => res.json({ success: true, data: { outreach: {} } }));
const mockDeleteOutreach = jest.fn((req, res) => res.json({ success: true }));
const mockCreateABTest = jest.fn((req, res) => res.json({ success: true, data: { abTest: {} } }));
const mockCompleteABTest = jest.fn((req, res) => res.json({ success: true, data: { abTest: {} } }));
const mockGetCampaignAnalytics = jest.fn((req, res) => res.json({ success: true, data: { analytics: {} } }));
const mockGetOverviewAnalytics = jest.fn((req, res) => res.json({ success: true, data: { overview: {} } }));
const mockLinkJobToCampaign = jest.fn((req, res) => res.json({ success: true, data: { campaign: {} } }));

jest.unstable_mockModule('../../controllers/networkingCampaignController.js', () => ({
  createCampaign: mockCreateCampaign,
  getCampaigns: mockGetCampaigns,
  getCampaign: mockGetCampaign,
  updateCampaign: mockUpdateCampaign,
  deleteCampaign: mockDeleteCampaign,
  addOutreach: mockAddOutreach,
  updateOutreach: mockUpdateOutreach,
  deleteOutreach: mockDeleteOutreach,
  createABTest: mockCreateABTest,
  completeABTest: mockCompleteABTest,
  getCampaignAnalytics: mockGetCampaignAnalytics,
  getOverviewAnalytics: mockGetOverviewAnalytics,
  linkJobToCampaign: mockLinkJobToCampaign,
}));

// Mock the middleware
const mockCheckJwt = jest.fn((req, res, next) => {
  req.auth = { userId: 'test-user-id' };
  next();
});

jest.unstable_mockModule('../../middleware/checkJwt.js', () => ({
  checkJwt: mockCheckJwt,
}));

describe('networkingCampaignRoutes', () => {
  let app;

  beforeEach(async () => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    
    const networkingCampaignRoutes = await import('../../routes/networkingCampaignRoutes.js');
    app.use('/api/networking-campaigns', networkingCampaignRoutes.default);
  });

  describe('Campaign CRUD Routes', () => {
    describe('POST /api/networking-campaigns', () => {
      it('should create a new campaign', async () => {
        const response = await request(app)
          .post('/api/networking-campaigns')
          .send({ name: 'Test Campaign' });

        expect(response.status).toBe(200);
        expect(mockCreateCampaign).toHaveBeenCalled();
      });

      it('should protect the route with checkJwt', async () => {
        await request(app)
          .post('/api/networking-campaigns')
          .send({ name: 'Test Campaign' });

        expect(mockCheckJwt).toHaveBeenCalled();
      });
    });

    describe('GET /api/networking-campaigns', () => {
      it('should get all campaigns', async () => {
        const response = await request(app).get('/api/networking-campaigns');

        expect(response.status).toBe(200);
        expect(mockGetCampaigns).toHaveBeenCalled();
      });

      it('should support query parameters', async () => {
        await request(app)
          .get('/api/networking-campaigns')
          .query({ status: 'Active', page: 1, limit: 10 });

        expect(mockGetCampaigns).toHaveBeenCalled();
      });
    });

    describe('GET /api/networking-campaigns/:id', () => {
      it('should get a single campaign', async () => {
        const response = await request(app).get('/api/networking-campaigns/campaign123');

        expect(response.status).toBe(200);
        expect(mockGetCampaign).toHaveBeenCalled();
      });
    });

    describe('PUT /api/networking-campaigns/:id', () => {
      it('should update a campaign', async () => {
        const response = await request(app)
          .put('/api/networking-campaigns/campaign123')
          .send({ name: 'Updated Campaign' });

        expect(response.status).toBe(200);
        expect(mockUpdateCampaign).toHaveBeenCalled();
      });
    });

    describe('DELETE /api/networking-campaigns/:id', () => {
      it('should delete a campaign', async () => {
        const response = await request(app).delete('/api/networking-campaigns/campaign123');

        expect(response.status).toBe(200);
        expect(mockDeleteCampaign).toHaveBeenCalled();
      });
    });
  });

  describe('Outreach Routes', () => {
    describe('POST /api/networking-campaigns/:id/outreach', () => {
      it('should add outreach to campaign', async () => {
        const response = await request(app)
          .post('/api/networking-campaigns/campaign123/outreach')
          .send({ contactName: 'John Doe', method: 'email' });

        expect(response.status).toBe(200);
        expect(mockAddOutreach).toHaveBeenCalled();
      });
    });

    describe('PUT /api/networking-campaigns/:id/outreach/:outreachId', () => {
      it('should update outreach status', async () => {
        const response = await request(app)
          .put('/api/networking-campaigns/campaign123/outreach/outreach456')
          .send({ status: 'Responded' });

        expect(response.status).toBe(200);
        expect(mockUpdateOutreach).toHaveBeenCalled();
      });
    });

    describe('DELETE /api/networking-campaigns/:id/outreach/:outreachId', () => {
      it('should delete outreach', async () => {
        const response = await request(app)
          .delete('/api/networking-campaigns/campaign123/outreach/outreach456');

        expect(response.status).toBe(200);
        expect(mockDeleteOutreach).toHaveBeenCalled();
      });
    });
  });

  describe('A/B Testing Routes', () => {
    describe('POST /api/networking-campaigns/:id/ab-test', () => {
      it('should create A/B test for campaign', async () => {
        const response = await request(app)
          .post('/api/networking-campaigns/campaign123/ab-test')
          .send({ name: 'Test A/B', variantA: {}, variantB: {} });

        expect(response.status).toBe(200);
        expect(mockCreateABTest).toHaveBeenCalled();
      });
    });

    describe('PUT /api/networking-campaigns/:id/ab-test/:testId/complete', () => {
      it('should complete A/B test', async () => {
        const response = await request(app)
          .put('/api/networking-campaigns/campaign123/ab-test/test789/complete')
          .send({ winner: 'A' });

        expect(response.status).toBe(200);
        expect(mockCompleteABTest).toHaveBeenCalled();
      });
    });
  });

  describe('Analytics Routes', () => {
    describe('GET /api/networking-campaigns/analytics/overview', () => {
      it('should get overview analytics', async () => {
        const response = await request(app).get('/api/networking-campaigns/analytics/overview');

        expect(response.status).toBe(200);
        expect(mockGetOverviewAnalytics).toHaveBeenCalled();
      });
    });

    describe('GET /api/networking-campaigns/:id/analytics', () => {
      it('should get campaign analytics', async () => {
        const response = await request(app).get('/api/networking-campaigns/campaign123/analytics');

        expect(response.status).toBe(200);
        expect(mockGetCampaignAnalytics).toHaveBeenCalled();
      });
    });
  });

  describe('Job Integration Routes', () => {
    describe('POST /api/networking-campaigns/:id/link-job', () => {
      it('should link job to campaign', async () => {
        const response = await request(app)
          .post('/api/networking-campaigns/campaign123/link-job')
          .send({ jobId: 'job456' });

        expect(response.status).toBe(200);
        expect(mockLinkJobToCampaign).toHaveBeenCalled();
      });
    });
  });

  describe('Authentication', () => {
    it('should reject requests when auth fails', async () => {
      mockCheckJwt.mockImplementationOnce((req, res) => {
        res.status(401).json({ success: false, message: 'Unauthorized' });
      });

      const response = await request(app).get('/api/networking-campaigns');

      expect(response.status).toBe(401);
      expect(mockGetCampaigns).not.toHaveBeenCalled();
    });
  });
});
