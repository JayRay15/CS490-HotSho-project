import { jest, beforeEach, describe, it, expect } from '@jest/globals';

// Mocks for NetworkingEvent model
const mockFind = jest.fn();
const mockFindOne = jest.fn();
const mockCreate = jest.fn();
const mockFindOneAndUpdate = jest.fn();
const mockFindOneAndDelete = jest.fn();
const mockCountDocuments = jest.fn();
const mockSave = jest.fn();

const mockNetworkingEvent = {
  find: mockFind,
  findOne: mockFindOne,
  create: mockCreate,
  findOneAndUpdate: mockFindOneAndUpdate,
  findOneAndDelete: mockFindOneAndDelete,
  countDocuments: mockCountDocuments
};

// Helper to create a chainable thenable that mimics Mongoose query chaining
function makeChainable(value) {
  const chain = {
    sort: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(value)
  };
  chain.then = (resolve) => resolve(value);
  chain.catch = () => chain;
  return chain;
}

// Mock discovery util
const mockSearchEvents = jest.fn();
const mockGetEventCategories = jest.fn();

jest.unstable_mockModule('../../models/NetworkingEvent.js', () => ({
  default: mockNetworkingEvent
}));

jest.unstable_mockModule('../../utils/eventDiscoveryService.js', () => ({
  searchEvents: mockSearchEvents,
  getEventCategories: mockGetEventCategories
}));

const {
  getNetworkingEvents,
  getNetworkingEventById,
  createNetworkingEvent,
  updateNetworkingEvent,
  deleteNetworkingEvent,
  getNetworkingStats,
  addConnection,
  updateConnection,
  deleteConnection,
  discoverEvents,
  getCategories
} = await import('../networkingEventController.js');

describe('NetworkingEvent Controller - Extended Coverage', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { auth: { userId: 'user1' }, query: {}, params: {}, body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  });

  describe('getNetworkingEvents', () => {
    it('should filter by attendanceStatus', async () => {
      req.query = { attendanceStatus: 'Attended' };
      const events = [{ _id: 'e1', name: 'Event1', attendanceStatus: 'Attended' }];
      mockFind.mockReturnValue(makeChainable(events));

      await getNetworkingEvents(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: events }));
    });

    it('should filter by industry', async () => {
      req.query = { industry: 'Technology' };
      const events = [{ _id: 'e1', industry: 'Technology' }];
      mockFind.mockReturnValue(makeChainable(events));

      await getNetworkingEvents(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should filter by eventType', async () => {
      req.query = { eventType: 'Conference' };
      const events = [{ _id: 'e1', eventType: 'Conference' }];
      mockFind.mockReturnValue(makeChainable(events));

      await getNetworkingEvents(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should filter by isVirtual true', async () => {
      req.query = { isVirtual: 'true' };
      const events = [{ _id: 'e1', isVirtual: true }];
      mockFind.mockReturnValue(makeChainable(events));

      await getNetworkingEvents(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should filter by isVirtual false', async () => {
      req.query = { isVirtual: 'false' };
      const events = [{ _id: 'e1', isVirtual: false }];
      mockFind.mockReturnValue(makeChainable(events));

      await getNetworkingEvents(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should filter by timeFilter upcoming', async () => {
      req.query = { timeFilter: 'upcoming' };
      const events = [{ _id: 'e1', eventDate: new Date(Date.now() + 86400000) }];
      mockFind.mockReturnValue(makeChainable(events));

      await getNetworkingEvents(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should filter by timeFilter past', async () => {
      req.query = { timeFilter: 'past' };
      const events = [{ _id: 'e1', eventDate: new Date(Date.now() - 86400000) }];
      mockFind.mockReturnValue(makeChainable(events));

      await getNetworkingEvents(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should sort by sortBy and sortOrder asc', async () => {
      req.query = { sortBy: 'name', sortOrder: 'asc' };
      const events = [{ _id: 'e1', name: 'Alpha' }];
      mockFind.mockReturnValue(makeChainable(events));

      await getNetworkingEvents(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle error in getNetworkingEvents', async () => {
      mockFind.mockImplementation(() => {
        throw new Error('Database error');
      });

      await getNetworkingEvents(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });
  });

  describe('getNetworkingEventById', () => {
    it('should return event when found', async () => {
      req.params = { id: 'event123' };
      const event = { _id: 'event123', name: 'Tech Meetup' };
      mockFindOne.mockReturnValue(makeChainable(event));

      await getNetworkingEventById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: event }));
    });

    it('should handle error in getNetworkingEventById', async () => {
      req.params = { id: 'event123' };
      mockFindOne.mockImplementation(() => {
        throw new Error('Database error');
      });

      await getNetworkingEventById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('createNetworkingEvent', () => {
    it('should create event with body data', async () => {
      req.body = { name: 'New Event', industry: 'Tech' };
      const created = { _id: 'new123', name: 'New Event', industry: 'Tech', userId: 'user1' };
      mockCreate.mockResolvedValueOnce(created);

      await createNetworkingEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should handle error in createNetworkingEvent', async () => {
      mockCreate.mockRejectedValueOnce(new Error('Creation failed'));

      await createNetworkingEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateNetworkingEvent', () => {
    it('should update event when found', async () => {
      req.params = { id: 'event123' };
      req.body = { name: 'Updated Event' };
      const updated = { _id: 'event123', name: 'Updated Event' };
      mockFindOneAndUpdate.mockReturnValue(makeChainable(updated));

      await updateNetworkingEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should handle error in updateNetworkingEvent', async () => {
      req.params = { id: 'event123' };
      mockFindOneAndUpdate.mockImplementation(() => {
        throw new Error('Update failed');
      });

      await updateNetworkingEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('deleteNetworkingEvent', () => {
    it('should delete event when found', async () => {
      req.params = { id: 'event123' };
      mockFindOneAndDelete.mockResolvedValueOnce({ _id: 'event123' });

      await deleteNetworkingEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should handle error in deleteNetworkingEvent', async () => {
      req.params = { id: 'event123' };
      mockFindOneAndDelete.mockRejectedValueOnce(new Error('Delete failed'));

      await deleteNetworkingEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getNetworkingStats', () => {
    it('should calculate stats with no events', async () => {
      mockCountDocuments.mockResolvedValueOnce(0).mockResolvedValueOnce(0).mockResolvedValueOnce(0);
      mockFind.mockResolvedValueOnce([]);

      await getNetworkingStats(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          totalEvents: 0,
          upcomingEvents: 0,
          attendedEvents: 0,
          totalConnections: 0,
          totalJobLeads: 0
        })
      }));
    });

    it('should calculate stats with events having goals', async () => {
      mockCountDocuments.mockResolvedValueOnce(3).mockResolvedValueOnce(1).mockResolvedValueOnce(2);
      const events = [
        { connectionsGained: 5, jobLeadsGenerated: 2, roiRating: 5, goals: [{ achieved: true }, { achieved: false }] },
        { connectionsGained: 3, jobLeadsGenerated: 1, roiRating: 3, goals: [{ achieved: true }] },
        { connectionsGained: 0, jobLeadsGenerated: 0, roiRating: null, goals: [] }
      ];
      mockFind.mockResolvedValueOnce(events);

      await getNetworkingStats(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          totalEvents: 3,
          totalConnections: 8,
          totalJobLeads: 3
        })
      }));
    });

    it('should handle error in getNetworkingStats', async () => {
      mockCountDocuments.mockRejectedValueOnce(new Error('Stats error'));

      await getNetworkingStats(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('addConnection', () => {
    it('should add connection to event', async () => {
      req.params = { id: 'event123' };
      req.body = { name: 'John Doe', company: 'TechCo' };
      
      const mockEvent = {
        _id: 'event123',
        connections: [],
        connectionsGained: 0,
        save: jest.fn().mockResolvedValue(true)
      };
      mockEvent.connections.push = jest.fn();
      mockFindOne.mockResolvedValueOnce(mockEvent);

      await addConnection(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 when event not found for addConnection', async () => {
      req.params = { id: 'nonexistent' };
      req.body = { name: 'John' };
      mockFindOne.mockResolvedValueOnce(null);

      await addConnection(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should handle error in addConnection', async () => {
      req.params = { id: 'event123' };
      mockFindOne.mockRejectedValueOnce(new Error('Connection error'));

      await addConnection(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateConnection', () => {
    it('should update connection in event', async () => {
      req.params = { id: 'event123', connectionId: 'conn123' };
      req.body = { name: 'Jane Doe' };
      
      const mockConnection = { _id: 'conn123', name: 'John' };
      const mockEvent = {
        _id: 'event123',
        connections: {
          id: jest.fn().mockReturnValue(mockConnection)
        },
        save: jest.fn().mockResolvedValue(true)
      };
      mockFindOne.mockResolvedValueOnce(mockEvent);

      await updateConnection(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 when event not found for updateConnection', async () => {
      req.params = { id: 'nonexistent', connectionId: 'conn123' };
      mockFindOne.mockResolvedValueOnce(null);

      await updateConnection(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 404 when connection not found', async () => {
      req.params = { id: 'event123', connectionId: 'nonexistent' };
      req.body = { name: 'Jane' };
      
      const mockEvent = {
        _id: 'event123',
        connections: {
          id: jest.fn().mockReturnValue(null)
        }
      };
      mockFindOne.mockResolvedValueOnce(mockEvent);

      await updateConnection(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should handle error in updateConnection', async () => {
      req.params = { id: 'event123', connectionId: 'conn123' };
      mockFindOne.mockRejectedValueOnce(new Error('Update error'));

      await updateConnection(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('deleteConnection', () => {
    it('should delete connection from event', async () => {
      req.params = { id: 'event123', connectionId: 'conn123' };
      
      const mockEvent = {
        _id: 'event123',
        connections: {
          pull: jest.fn(),
          length: 0
        },
        connectionsGained: 1,
        save: jest.fn().mockResolvedValue(true)
      };
      mockFindOne.mockResolvedValueOnce(mockEvent);

      await deleteConnection(req, res);

      expect(mockEvent.connections.pull).toHaveBeenCalledWith('conn123');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 when event not found for deleteConnection', async () => {
      req.params = { id: 'nonexistent', connectionId: 'conn123' };
      mockFindOne.mockResolvedValueOnce(null);

      await deleteConnection(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should handle error in deleteConnection', async () => {
      req.params = { id: 'event123', connectionId: 'conn123' };
      mockFindOne.mockRejectedValueOnce(new Error('Delete error'));

      await deleteConnection(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('discoverEvents', () => {
    it('should discover events with all query params', async () => {
      req.query = {
        location: 'New York',
        q: 'tech',
        categories: 'Technology',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        page: '2'
      };
      mockSearchEvents.mockResolvedValueOnce({
        events: [{ id: 'evt1', name: 'Tech Conf' }],
        pagination: { page: 2, totalPages: 5 }
      });

      await discoverEvents(req, res);

      expect(mockSearchEvents).toHaveBeenCalledWith(expect.objectContaining({
        location: 'New York',
        q: 'tech',
        categories: 'Technology',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        page: 2
      }));
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should discover events with no page param defaults to 1', async () => {
      req.query = { location: 'Boston' };
      mockSearchEvents.mockResolvedValueOnce({
        events: [],
        pagination: { page: 1, totalPages: 0 }
      });

      await discoverEvents(req, res);

      expect(mockSearchEvents).toHaveBeenCalledWith(expect.objectContaining({
        page: 1
      }));
    });

    it('should handle error in discoverEvents', async () => {
      mockSearchEvents.mockRejectedValueOnce(new Error('Discovery failed'));

      await discoverEvents(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getCategories', () => {
    it('should return event categories', async () => {
      mockGetEventCategories.mockResolvedValueOnce([
        { id: '101', name: 'Business' },
        { id: '102', name: 'Technology' }
      ]);

      await getCategories(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({ id: '101', name: 'Business' })
        ])
      }));
    });

    it('should handle error in getCategories', async () => {
      mockGetEventCategories.mockRejectedValueOnce(new Error('Categories failed'));

      await getCategories(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
