import { jest, beforeEach, describe, it, expect } from '@jest/globals';

// Mock the NetworkingCampaign model
const mockNetworkingCampaign = {
  create: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  findOneAndDelete: jest.fn(),
  countDocuments: jest.fn(),
};

// Mock Job model
const mockJob = {
  findOne: jest.fn(),
};

jest.unstable_mockModule('../../models/NetworkingCampaign.js', () => ({
  NetworkingCampaign: mockNetworkingCampaign,
}));

jest.unstable_mockModule('../../models/Job.js', () => ({
  Job: mockJob,
}));

const {
  createCampaign,
  getCampaigns,
  getCampaign,
  updateCampaign,
  deleteCampaign,
  addOutreach,
  updateOutreach,
  deleteOutreach,
  createABTest,
  completeABTest,
  getCampaignAnalytics,
  getOverviewAnalytics,
  linkJobToCampaign,
} = await import('../networkingCampaignController.js');

describe('networkingCampaignController', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockReq = {
      auth: { userId: 'test-user-123' },
      params: {},
      body: {},
      query: {},
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('createCampaign', () => {
    it('should return 401 if no userId', async () => {
      mockReq.auth = {};

      await createCampaign(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should return 400 if name is missing', async () => {
      mockReq.body = {};

      await createCampaign(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should create a campaign successfully', async () => {
      mockReq.body = { name: 'Test Campaign' };
      mockNetworkingCampaign.create.mockResolvedValue({
        _id: 'campaign123',
        name: 'Test Campaign',
        userId: 'test-user-123',
      });

      await createCampaign(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockNetworkingCampaign.create).toHaveBeenCalled();
    });

    it('should create campaign with all optional fields', async () => {
      mockReq.body = {
        name: 'Full Campaign',
        description: 'Test description',
        campaignType: 'Referral',
        targetCompanies: ['Company A'],
        targetIndustries: ['Tech'],
        targetRoles: ['Engineer'],
        goals: { totalOutreach: 50 },
        startDate: new Date(),
        endDate: new Date(),
        strategy: { approach: 'direct' },
        notes: 'Some notes',
      };
      mockNetworkingCampaign.create.mockResolvedValue({
        _id: 'campaign123',
        ...mockReq.body,
        userId: 'test-user-123',
      });

      await createCampaign(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });

  describe('getCampaigns', () => {
    it('should return 401 if no userId', async () => {
      mockReq.auth = {};

      await getCampaigns(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should get campaigns with default pagination', async () => {
      const mockCampaigns = [{ _id: '1', name: 'Campaign 1', status: 'Active', metrics: {} }];
      // Mock the chained query for paginated results
      const chainedMock = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockCampaigns),
      };
      // Handle both query patterns
      mockNetworkingCampaign.find.mockReturnValue(chainedMock);
      // Also make it work as a resolved promise for the second call
      chainedMock.then = (fn) => Promise.resolve(mockCampaigns).then(fn);
      mockNetworkingCampaign.countDocuments.mockResolvedValue(1);

      await getCampaigns(mockReq, mockRes, mockNext);

      expect(mockNetworkingCampaign.find).toHaveBeenCalled();
    });

    it('should filter by status', async () => {
      mockReq.query = { status: 'Active' };
      const mockCampaigns = [{ _id: '1', name: 'Campaign 1', status: 'Active', metrics: {} }];
      const chainedMock = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      };
      chainedMock.then = (fn) => Promise.resolve(mockCampaigns).then(fn);
      mockNetworkingCampaign.find.mockReturnValue(chainedMock);
      mockNetworkingCampaign.countDocuments.mockResolvedValue(0);

      await getCampaigns(mockReq, mockRes, mockNext);

      expect(mockNetworkingCampaign.find).toHaveBeenCalled();
    });

    it('should filter by campaignType', async () => {
      mockReq.query = { campaignType: 'Referral' };
      const mockCampaigns = [{ _id: '1', name: 'Campaign 1', status: 'Active', metrics: {} }];
      const chainedMock = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      };
      chainedMock.then = (fn) => Promise.resolve(mockCampaigns).then(fn);
      mockNetworkingCampaign.find.mockReturnValue(chainedMock);
      mockNetworkingCampaign.countDocuments.mockResolvedValue(0);

      await getCampaigns(mockReq, mockRes, mockNext);

      expect(mockNetworkingCampaign.find).toHaveBeenCalled();
    });
  });

  describe('getCampaign', () => {
    it('should return 401 if no userId', async () => {
      mockReq.auth = {};
      mockReq.params = { id: 'campaign123' };

      await getCampaign(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should return 404 if campaign not found', async () => {
      mockReq.params = { id: 'campaign123' };
      mockNetworkingCampaign.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await getCampaign(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should return campaign successfully', async () => {
      mockReq.params = { id: 'campaign123' };
      mockNetworkingCampaign.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          _id: 'campaign123',
          name: 'Test Campaign',
        }),
      });

      await getCampaign(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('updateCampaign', () => {
    it('should return 401 if no userId', async () => {
      mockReq.auth = {};
      mockReq.params = { id: 'campaign123' };

      await updateCampaign(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should return 404 if campaign not found', async () => {
      mockReq.params = { id: 'campaign123' };
      mockNetworkingCampaign.findOne.mockResolvedValue(null);

      await updateCampaign(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should update campaign successfully', async () => {
      mockReq.params = { id: 'campaign123' };
      mockReq.body = { name: 'Updated Campaign' };
      const mockCampaign = {
        _id: 'campaign123',
        name: 'Old Name',
        save: jest.fn().mockResolvedValue(true),
      };
      mockNetworkingCampaign.findOne.mockResolvedValue(mockCampaign);

      await updateCampaign(mockReq, mockRes, mockNext);

      expect(mockCampaign.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('deleteCampaign', () => {
    it('should return 401 if no userId', async () => {
      mockReq.auth = {};
      mockReq.params = { id: 'campaign123' };

      await deleteCampaign(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should return 404 if campaign not found', async () => {
      mockReq.params = { id: 'campaign123' };
      mockNetworkingCampaign.findOneAndDelete.mockResolvedValue(null);

      await deleteCampaign(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should delete campaign successfully', async () => {
      mockReq.params = { id: 'campaign123' };
      mockNetworkingCampaign.findOneAndDelete.mockResolvedValue({ _id: 'campaign123' });

      await deleteCampaign(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('addOutreach', () => {
    it('should return 401 if no userId', async () => {
      mockReq.auth = {};
      mockReq.params = { id: 'campaign123' };

      await addOutreach(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should return 404 if campaign not found', async () => {
      mockReq.params = { id: 'campaign123' };
      mockNetworkingCampaign.findOne.mockResolvedValue(null);

      await addOutreach(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 if contactName is missing', async () => {
      mockReq.params = { id: 'campaign123' };
      mockReq.body = {};
      mockNetworkingCampaign.findOne.mockResolvedValue({
        _id: 'campaign123',
        outreaches: [],
      });

      await addOutreach(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should add outreach successfully', async () => {
      mockReq.params = { id: 'campaign123' };
      mockReq.body = { contactName: 'John Doe', method: 'email' };
      const mockCampaign = {
        _id: 'campaign123',
        outreaches: [],
        metrics: {},
        save: jest.fn().mockResolvedValue(true),
      };
      mockNetworkingCampaign.findOne.mockResolvedValue(mockCampaign);

      await addOutreach(mockReq, mockRes, mockNext);

      expect(mockCampaign.outreaches.length).toBe(1);
      expect(mockCampaign.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });

  describe('updateOutreach', () => {
    it('should return 401 if no userId', async () => {
      mockReq.auth = {};
      mockReq.params = { id: 'campaign123', outreachId: 'outreach456' };

      await updateOutreach(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should return 404 if campaign not found', async () => {
      mockReq.params = { id: 'campaign123', outreachId: 'outreach456' };
      mockNetworkingCampaign.findOne.mockResolvedValue(null);

      await updateOutreach(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should return 404 if outreach not found', async () => {
      mockReq.params = { id: 'campaign123', outreachId: 'outreach456' };
      mockNetworkingCampaign.findOne.mockResolvedValue({
        _id: 'campaign123',
        outreaches: { id: jest.fn().mockReturnValue(null) },
      });

      await updateOutreach(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should update outreach status successfully', async () => {
      mockReq.params = { id: 'campaign123', outreachId: 'outreach456' };
      mockReq.body = { status: 'Responded' };
      const mockOutreach = {
        _id: 'outreach456',
        status: 'Sent',
        messageTemplate: 'Control',
      };
      const mockCampaign = {
        _id: 'campaign123',
        outreaches: { id: jest.fn().mockReturnValue(mockOutreach) },
        abTests: [],
        metrics: {},
        save: jest.fn().mockResolvedValue(true),
      };
      mockNetworkingCampaign.findOne.mockResolvedValue(mockCampaign);

      await updateOutreach(mockReq, mockRes, mockNext);

      expect(mockOutreach.status).toBe('Responded');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('deleteOutreach', () => {
    it('should return 401 if no userId', async () => {
      mockReq.auth = {};
      mockReq.params = { id: 'campaign123', outreachId: 'outreach456' };

      await deleteOutreach(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should delete outreach successfully', async () => {
      mockReq.params = { id: 'campaign123', outreachId: 'outreach456' };
      const mockCampaign = {
        _id: 'campaign123',
        outreaches: { pull: jest.fn() },
        metrics: {},
        save: jest.fn().mockResolvedValue(true),
      };
      mockNetworkingCampaign.findOne.mockResolvedValue(mockCampaign);

      await deleteOutreach(mockReq, mockRes, mockNext);

      expect(mockCampaign.outreaches.pull).toHaveBeenCalledWith('outreach456');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('createABTest', () => {
    it('should return 401 if no userId', async () => {
      mockReq.auth = {};
      mockReq.params = { id: 'campaign123' };

      await createABTest(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should return 404 if campaign not found', async () => {
      mockReq.params = { id: 'campaign123' };
      mockNetworkingCampaign.findOne.mockResolvedValue(null);

      await createABTest(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 if templates are missing', async () => {
      mockReq.params = { id: 'campaign123' };
      mockReq.body = { name: 'Test' };
      mockNetworkingCampaign.findOne.mockResolvedValue({
        _id: 'campaign123',
        abTests: [],
      });

      await createABTest(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should create A/B test successfully', async () => {
      mockReq.params = { id: 'campaign123' };
      mockReq.body = {
        name: 'Test A/B',
        templateA: { message: 'Hello A' },
        templateB: { message: 'Hello B' },
      };
      const mockCampaign = {
        _id: 'campaign123',
        abTests: [],
        save: jest.fn().mockResolvedValue(true),
      };
      mockNetworkingCampaign.findOne.mockResolvedValue(mockCampaign);

      await createABTest(mockReq, mockRes, mockNext);

      expect(mockCampaign.abTests.length).toBe(1);
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });

  describe('completeABTest', () => {
    it('should return 401 if no userId', async () => {
      mockReq.auth = {};
      mockReq.params = { id: 'campaign123', testId: 'test789' };

      await completeABTest(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should return 404 if campaign not found', async () => {
      mockReq.params = { id: 'campaign123', testId: 'test789' };
      mockNetworkingCampaign.findOne.mockResolvedValue(null);

      await completeABTest(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should return 404 if A/B test not found', async () => {
      mockReq.params = { id: 'campaign123', testId: 'test789' };
      mockNetworkingCampaign.findOne.mockResolvedValue({
        _id: 'campaign123',
        abTests: { id: jest.fn().mockReturnValue(null) },
      });

      await completeABTest(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should complete A/B test and determine winner', async () => {
      mockReq.params = { id: 'campaign123', testId: 'test789' };
      const mockABTest = {
        _id: 'test789',
        templateA: { sentCount: 10, responseCount: 5 },
        templateB: { sentCount: 10, responseCount: 2 },
        status: 'Active',
      };
      const mockCampaign = {
        _id: 'campaign123',
        abTests: { id: jest.fn().mockReturnValue(mockABTest) },
        save: jest.fn().mockResolvedValue(true),
      };
      mockNetworkingCampaign.findOne.mockResolvedValue(mockCampaign);

      await completeABTest(mockReq, mockRes, mockNext);

      expect(mockABTest.status).toBe('Completed');
      expect(mockABTest.winner).toBe('A');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should declare tie when rates are similar', async () => {
      mockReq.params = { id: 'campaign123', testId: 'test789' };
      const mockABTest = {
        _id: 'test789',
        templateA: { sentCount: 10, responseCount: 5 },
        templateB: { sentCount: 10, responseCount: 5 },
        status: 'Active',
      };
      const mockCampaign = {
        _id: 'campaign123',
        abTests: { id: jest.fn().mockReturnValue(mockABTest) },
        save: jest.fn().mockResolvedValue(true),
      };
      mockNetworkingCampaign.findOne.mockResolvedValue(mockCampaign);

      await completeABTest(mockReq, mockRes, mockNext);

      expect(mockABTest.winner).toBe('Tie');
    });
  });

  describe('getCampaignAnalytics', () => {
    it('should return 401 if no userId', async () => {
      mockReq.auth = {};
      mockReq.params = { id: 'campaign123' };

      await getCampaignAnalytics(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should return 404 if campaign not found', async () => {
      mockReq.params = { id: 'campaign123' };
      mockNetworkingCampaign.findOne.mockResolvedValue(null);

      await getCampaignAnalytics(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should return campaign analytics', async () => {
      mockReq.params = { id: 'campaign123' };
      mockNetworkingCampaign.findOne.mockResolvedValue({
        _id: 'campaign123',
        name: 'Test Campaign',
        status: 'Active',
        metrics: { totalOutreach: 10, responseRate: 30, meetings: 2, connections: 5 },
        goals: { totalOutreach: 50, responseRate: 40, meetingsScheduled: 5, connectionsGained: 10 },
        outreaches: [],
        abTests: [],
        healthScore: 75,
        progress: 50,
        daysRemaining: 10,
      });

      await getCampaignAnalytics(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const responseData = mockRes.json.mock.calls[0][0];
      expect(responseData.data.goalProgress).toBeDefined();
    });
  });

  describe('getOverviewAnalytics', () => {
    it('should return 401 if no userId', async () => {
      mockReq.auth = {};

      await getOverviewAnalytics(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should return overview analytics', async () => {
      mockNetworkingCampaign.find.mockResolvedValue([
        {
          _id: 'campaign1',
          name: 'Campaign 1',
          status: 'Active',
          metrics: { totalOutreach: 10, responses: 5, meetings: 2, connections: 3, responseRate: 50 },
          healthScore: 75,
          outreaches: [
            { method: 'LinkedIn', status: 'Responded' },
            { method: 'Email', status: 'Sent' },
          ],
        },
        {
          _id: 'campaign2',
          name: 'Campaign 2',
          status: 'Completed',
          metrics: { totalOutreach: 20, responses: 8, meetings: 4, connections: 6, responseRate: 40 },
          healthScore: 80,
          outreaches: [
            { method: 'LinkedIn', status: 'Connected' },
          ],
        },
      ]);

      await getOverviewAnalytics(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should handle empty campaigns list', async () => {
      mockNetworkingCampaign.find.mockResolvedValue([]);

      await getOverviewAnalytics(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const responseData = mockRes.json.mock.calls[0][0];
      expect(responseData.data.totals.campaigns).toBe(0);
    });
  });

  describe('linkJobToCampaign', () => {
    it('should return 401 if no userId', async () => {
      mockReq.auth = {};
      mockReq.params = { id: 'campaign123' };

      await linkJobToCampaign(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should return 404 if campaign not found', async () => {
      mockReq.params = { id: 'campaign123' };
      mockReq.body = { jobId: 'job456' };
      mockNetworkingCampaign.findOne.mockResolvedValue(null);

      await linkJobToCampaign(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });
});
