import { jest, beforeEach, describe, it, expect } from '@jest/globals';

// Mock dependencies
const mockRelationshipActivityFind = jest.fn();
const mockNetworkingEventFind = jest.fn();
const mockContactFind = jest.fn();
const mockReferralFind = jest.fn();

jest.unstable_mockModule('../../models/RelationshipActivity.js', () => ({
  default: {
    find: mockRelationshipActivityFind
  }
}));

jest.unstable_mockModule('../../models/NetworkingEvent.js', () => ({
  default: {
    find: mockNetworkingEventFind
  }
}));

jest.unstable_mockModule('../../models/Contact.js', () => ({
  default: {
    find: mockContactFind
  }
}));

jest.unstable_mockModule('../../models/Referral.js', () => ({
  default: {
    find: mockReferralFind
  }
}));

const { getNetworkAnalytics } = await import('../analyticsController.js');

describe('analyticsController', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockReq = {
      auth: { userId: 'test-user-123' },
      query: {}
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('getNetworkAnalytics', () => {
    it('should return 500 on database error', async () => {
      mockContactFind.mockRejectedValue(new Error('DB error'));

      await getNetworkAnalytics(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it('should return analytics with empty data', async () => {
      mockContactFind.mockResolvedValue([]);
      mockRelationshipActivityFind.mockResolvedValue([]);
      mockNetworkingEventFind.mockResolvedValue([]);
      mockReferralFind.mockResolvedValue([]);

      await getNetworkAnalytics(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const responseData = mockRes.json.mock.calls[0][0];
      expect(responseData.data).toBeDefined();
      expect(responseData.data.activityVolume).toBeDefined();
    });

    it('should calculate activity volume correctly', async () => {
      const now = new Date();
      const activities = [
        { activityType: 'email', activityDate: now },
        { activityType: 'call', activityDate: now },
        { activityType: 'meeting', activityDate: now }
      ];
      
      mockContactFind.mockResolvedValue([]);
      mockRelationshipActivityFind.mockResolvedValue(activities);
      mockNetworkingEventFind.mockResolvedValue([]);
      mockReferralFind.mockResolvedValue([]);

      await getNetworkAnalytics(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const responseData = mockRes.json.mock.calls[0][0];
      expect(responseData.data.activityVolume.last30Days).toBe(3);
      expect(responseData.data.activityVolume.byType.email).toBe(1);
      expect(responseData.data.activityVolume.byType.call).toBe(1);
      expect(responseData.data.activityVolume.byType.meeting).toBe(1);
    });

    it('should calculate relationship health', async () => {
      const contacts = [
        { _id: 'c1', relationshipStrength: 80 },
        { _id: 'c2', relationshipStrength: 60 }
      ];
      
      mockContactFind.mockResolvedValue(contacts);
      mockRelationshipActivityFind.mockResolvedValue([]);
      mockNetworkingEventFind.mockResolvedValue([]);
      mockReferralFind.mockResolvedValue([]);

      await getNetworkAnalytics(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const responseData = mockRes.json.mock.calls[0][0];
      expect(responseData.data.relationshipHealth).toBeDefined();
      expect(responseData.data.relationshipHealth.total).toBe(2);
    });

    it('should calculate event ROI', async () => {
      const events = [
        { _id: 'e1', attendanceStatus: 'Attended', cost: 100, connectionsGained: 3 },
        { _id: 'e2', attendanceStatus: 'Attended', cost: 0, connectionsGained: 5 }
      ];
      
      mockContactFind.mockResolvedValue([]);
      mockRelationshipActivityFind.mockResolvedValue([]);
      mockNetworkingEventFind.mockResolvedValue(events);
      mockReferralFind.mockResolvedValue([]);

      await getNetworkAnalytics(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const responseData = mockRes.json.mock.calls[0][0];
      expect(responseData.data.eventROI).toBeDefined();
      expect(responseData.data.eventROI.totalEventsAttended).toBe(2);
    });

    it('should calculate value exchange metrics', async () => {
      const now = new Date();
      const activities = [
        { activityType: 'referral_given', activityDate: now, gaveReferral: true },
        { activityType: 'referral_received', activityDate: now, receivedReferral: true }
      ];
      
      mockContactFind.mockResolvedValue([]);
      mockRelationshipActivityFind.mockResolvedValue(activities);
      mockNetworkingEventFind.mockResolvedValue([]);
      mockReferralFind.mockResolvedValue([]);

      await getNetworkAnalytics(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const responseData = mockRes.json.mock.calls[0][0];
      expect(responseData.data.valueExchange).toBeDefined();
    });

    it('should calculate referral stats', async () => {
      const referrals = [
        { type: 'given', outcome: 'successful' },
        { type: 'given', outcome: 'pending' },
        { type: 'received' }
      ];
      
      mockContactFind.mockResolvedValue([]);
      mockRelationshipActivityFind.mockResolvedValue([]);
      mockNetworkingEventFind.mockResolvedValue([]);
      mockReferralFind.mockResolvedValue(referrals);

      await getNetworkAnalytics(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const responseData = mockRes.json.mock.calls[0][0];
      expect(responseData.data.referralStats).toBeDefined();
    });

    it('should calculate opportunity conversion', async () => {
      const now = new Date();
      const activities = [
        { activityType: 'meeting', activityDate: now, opportunityGenerated: true, opportunityType: 'job' },
        { activityType: 'call', activityDate: now, opportunityGenerated: true, opportunityType: 'introduction' },
        { activityType: 'email', activityDate: now }
      ];
      
      mockContactFind.mockResolvedValue([]);
      mockRelationshipActivityFind.mockResolvedValue(activities);
      mockNetworkingEventFind.mockResolvedValue([]);
      mockReferralFind.mockResolvedValue([]);

      await getNetworkAnalytics(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const responseData = mockRes.json.mock.calls[0][0];
      expect(responseData.data.opportunityConversion).toBeDefined();
    });

    it('should calculate engagement quality', async () => {
      const now = new Date();
      const activities = [
        { activityType: 'meeting', activityDate: now, outcome: 'positive', duration: 60 },
        { activityType: 'call', activityDate: now, outcome: 'positive', duration: 30 },
        { activityType: 'email', activityDate: now, outcome: 'neutral', duration: 5 }
      ];
      
      mockContactFind.mockResolvedValue([]);
      mockRelationshipActivityFind.mockResolvedValue(activities);
      mockNetworkingEventFind.mockResolvedValue([]);
      mockReferralFind.mockResolvedValue([]);

      await getNetworkAnalytics(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const responseData = mockRes.json.mock.calls[0][0];
      expect(responseData.data.engagementQuality).toBeDefined();
    });

    it('should generate benchmarks', async () => {
      const now = new Date();
      const activities = [
        { activityType: 'email', activityDate: now },
        { activityType: 'call', activityDate: now }
      ];
      
      mockContactFind.mockResolvedValue([{ _id: 'c1' }]);
      mockRelationshipActivityFind.mockResolvedValue(activities);
      mockNetworkingEventFind.mockResolvedValue([]);
      mockReferralFind.mockResolvedValue([]);

      await getNetworkAnalytics(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const responseData = mockRes.json.mock.calls[0][0];
      expect(responseData.data.benchmarks).toBeDefined();
    });

    it('should generate strategy insights', async () => {
      const oldDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000); // 60 days ago
      const contacts = [
        { _id: 'c1', relationshipStrength: 90, lastInteraction: new Date() },
        { _id: 'c2', relationshipStrength: 30, lastInteraction: oldDate }
      ];
      
      mockContactFind.mockResolvedValue(contacts);
      mockRelationshipActivityFind.mockResolvedValue([]);
      mockNetworkingEventFind.mockResolvedValue([]);
      mockReferralFind.mockResolvedValue([]);

      await getNetworkAnalytics(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const responseData = mockRes.json.mock.calls[0][0];
      expect(responseData.data.strategyInsights).toBeDefined();
    });

    it('should handle activities with contacts', async () => {
      const now = new Date();
      const activities = [
        { activityType: 'email', activityDate: now, contactId: 'c1' },
        { activityType: 'call', activityDate: now, contactId: 'c1' },
        { activityType: 'meeting', activityDate: now, contactId: 'c2' }
      ];
      
      mockContactFind.mockResolvedValue([]);
      mockRelationshipActivityFind.mockResolvedValue(activities);
      mockNetworkingEventFind.mockResolvedValue([]);
      mockReferralFind.mockResolvedValue([]);

      await getNetworkAnalytics(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should calculate cost per contact for events', async () => {
      const events = [
        { _id: 'e1', attendanceStatus: 'Attended', cost: 200, connectionsGained: 4 },
        { _id: 'e2', attendanceStatus: 'Attended', cost: 100, connectionsGained: 2 }
      ];
      
      mockContactFind.mockResolvedValue([]);
      mockRelationshipActivityFind.mockResolvedValue([]);
      mockNetworkingEventFind.mockResolvedValue(events);
      mockReferralFind.mockResolvedValue([]);

      await getNetworkAnalytics(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const responseData = mockRes.json.mock.calls[0][0];
      expect(responseData.data.eventROI).toBeDefined();
    });

    it('should categorize contacts by relationship strength', async () => {
      const contacts = [
        { _id: 'c1', relationshipStrength: 90 },
        { _id: 'c2', relationshipStrength: 70 },
        { _id: 'c3', relationshipStrength: 40 },
        { _id: 'c4', relationshipStrength: 20 }
      ];
      
      mockContactFind.mockResolvedValue(contacts);
      mockRelationshipActivityFind.mockResolvedValue([]);
      mockNetworkingEventFind.mockResolvedValue([]);
      mockReferralFind.mockResolvedValue([]);

      await getNetworkAnalytics(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const responseData = mockRes.json.mock.calls[0][0];
      expect(responseData.data.relationshipHealth.byStrength).toBeDefined();
    });

    it('should calculate activities older than 30 days for 90 day stats', async () => {
      const now = new Date();
      const fiftyDaysAgo = new Date(now.getTime() - 50 * 24 * 60 * 60 * 1000);
      const activities = [
        { activityType: 'email', activityDate: now },
        { activityType: 'call', activityDate: fiftyDaysAgo }
      ];
      
      mockContactFind.mockResolvedValue([]);
      mockRelationshipActivityFind.mockResolvedValue(activities);
      mockNetworkingEventFind.mockResolvedValue([]);
      mockReferralFind.mockResolvedValue([]);

      await getNetworkAnalytics(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const responseData = mockRes.json.mock.calls[0][0];
      expect(responseData.data.activityVolume.last30Days).toBe(1);
      expect(responseData.data.activityVolume.last90Days).toBe(2);
    });

    it('should handle events with different statuses', async () => {
      const events = [
        { _id: 'e1', attendanceStatus: 'Attended', cost: 100, connectionsGained: 3 },
        { _id: 'e2', attendanceStatus: 'Registered', cost: 50, connectionsGained: 0 },
        { _id: 'e3', attendanceStatus: 'No Show', cost: 75, connectionsGained: 0 }
      ];
      
      mockContactFind.mockResolvedValue([]);
      mockRelationshipActivityFind.mockResolvedValue([]);
      mockNetworkingEventFind.mockResolvedValue(events);
      mockReferralFind.mockResolvedValue([]);

      await getNetworkAnalytics(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const responseData = mockRes.json.mock.calls[0][0];
      // Only 1 event has Attended status
      expect(responseData.data.eventROI.totalEventsAttended).toBe(1);
    });
  });
});
