import { jest, beforeEach, describe, it, expect } from '@jest/globals';

// Mock the discovery service
const mockDiscoverContacts = jest.fn();
const mockGetDiscoveryFilters = jest.fn();
const mockGetSuggestedContacts = jest.fn();

jest.unstable_mockModule('../../utils/contactDiscoveryService.js', () => ({
  discoverContacts: mockDiscoverContacts,
  getDiscoveryFilters: mockGetDiscoveryFilters,
  getSuggestedContacts: mockGetSuggestedContacts
}));

// Mock Job model
jest.unstable_mockModule('../../models/Job.js', () => ({
  Job: {
    find: jest.fn()
  }
}));

describe('Contact Discovery Controller', () => {
  let discoverContactsController;
  let getDiscoveryFiltersController;
  let getSuggestedContactsController;
  let trackDiscoverySuccess;
  let mockReq;
  let mockRes;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Import controllers
    const controllers = await import('../contactController.js');
    discoverContactsController = controllers.discoverContactsController;
    getDiscoveryFiltersController = controllers.getDiscoveryFiltersController;
    getSuggestedContactsController = controllers.getSuggestedContactsController;
    trackDiscoverySuccess = controllers.trackDiscoverySuccess;

    // Setup mock request/response
    mockReq = {
      auth: { userId: 'test_user_123' },
      query: {},
      body: {}
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  describe('discoverContactsController', () => {
    it('should return discovered contacts with default pagination', async () => {
      const mockContacts = [
        { id: '1', fullName: 'John Doe', company: 'Google' },
        { id: '2', fullName: 'Jane Smith', company: 'Microsoft' }
      ];

      mockDiscoverContacts.mockResolvedValue({
        success: true,
        data: mockContacts,
        pagination: { page: 1, totalPages: 1, totalContacts: 2 }
      });

      await discoverContactsController(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockContacts,
        pagination: { page: 1, totalPages: 1, totalContacts: 2 }
      });
    });

    it('should pass query parameters to service', async () => {
      mockReq.query = {
        industry: 'Technology',
        company: 'Google',
        connectionType: 'Alumni',
        page: '2',
        limit: '20'
      };

      mockDiscoverContacts.mockResolvedValue({
        success: true,
        data: [],
        pagination: { page: 2, totalPages: 1, totalContacts: 0 }
      });

      await discoverContactsController(mockReq, mockRes);

      expect(mockDiscoverContacts).toHaveBeenCalledWith({
        industry: 'Technology',
        company: 'Google',
        role: undefined,
        location: undefined,
        connectionType: 'Alumni',
        university: undefined,
        q: undefined,
        page: 2,
        limit: 20
      });
    });

    it('should handle errors gracefully', async () => {
      mockDiscoverContacts.mockRejectedValue(new Error('Service error'));

      await discoverContactsController(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to discover contacts',
        error: 'Service error'
      });
    });
  });

  describe('getDiscoveryFiltersController', () => {
    it('should return filter options', async () => {
      const mockFilters = {
        success: true,
        data: {
          industries: ['Technology', 'Finance'],
          connectionTypes: [{ type: 'Alumni', description: 'Shared education' }],
          universities: ['MIT', 'Stanford'],
          locations: ['New York, NY', 'San Francisco, CA']
        }
      };

      mockGetDiscoveryFilters.mockResolvedValue(mockFilters);

      await getDiscoveryFiltersController(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockFilters);
    });

    it('should handle errors gracefully', async () => {
      mockGetDiscoveryFilters.mockRejectedValue(new Error('Filter error'));

      await getDiscoveryFiltersController(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch discovery filters',
        error: 'Filter error'
      });
    });
  });

  describe('getSuggestedContactsController', () => {
    it('should return personalized suggestions based on user jobs', async () => {
      const { Job } = await import('../../models/Job.js');
      
      Job.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([
          { company: 'Google', industry: 'Technology', jobTitle: 'Software Engineer' },
          { company: 'Microsoft', industry: 'Technology', jobTitle: 'Product Manager' }
        ])
      });

      const mockSuggestions = {
        success: true,
        data: [
          { id: '1', fullName: 'John Doe', company: 'Google', connectionType: 'Company Employee' }
        ],
        categories: [
          { name: 'At Your Target Companies', count: 1 }
        ]
      };

      mockGetSuggestedContacts.mockResolvedValue(mockSuggestions);

      await getSuggestedContactsController(mockReq, mockRes);

      expect(mockGetSuggestedContacts).toHaveBeenCalledWith({
        targetCompanies: ['Google', 'Microsoft'],
        targetIndustries: ['Technology'],
        targetRoles: ['Software Engineer', 'Product Manager'],
        university: null
      });

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockSuggestions);
    });

    it('should handle university query parameter', async () => {
      const { Job } = await import('../../models/Job.js');
      
      Job.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      });

      mockReq.query.university = 'NJIT';

      mockGetSuggestedContacts.mockResolvedValue({
        success: true,
        data: [],
        categories: []
      });

      await getSuggestedContactsController(mockReq, mockRes);

      expect(mockGetSuggestedContacts).toHaveBeenCalledWith(
        expect.objectContaining({
          university: 'NJIT'
        })
      );
    });

    it('should handle errors gracefully', async () => {
      const { Job } = await import('../../models/Job.js');
      
      Job.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      await getSuggestedContactsController(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch contact suggestions',
        error: 'Database error'
      });
    });
  });

  describe('trackDiscoverySuccess', () => {
    it('should acknowledge tracking request', async () => {
      mockReq.body = {
        discoveredContactId: 'disc_123',
        action: 'added_to_network',
        notes: 'Added John Doe from Google'
      };

      await trackDiscoverySuccess(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Discovery action tracked successfully'
      });
    });

    it('should handle tracking errors gracefully', async () => {
      mockReq.body = null; // This will cause an error

      await trackDiscoverySuccess(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to track discovery',
        error: expect.any(String)
      });
    });
  });
});
