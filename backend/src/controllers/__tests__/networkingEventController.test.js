import { jest, beforeEach, describe, it, expect } from '@jest/globals';

// Mocks for NetworkingEvent model
const mockFind = jest.fn();
const mockFindOne = jest.fn();
const mockCreate = jest.fn();
const mockFindOneAndUpdate = jest.fn();
const mockFindOneAndDelete = jest.fn();
const mockCountDocuments = jest.fn();

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
  // make it thenable so `await chain` resolves to value
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

describe('NetworkingEvent Controller', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { auth: { userId: 'user1' }, query: {}, params: {}, body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  });

  it('getNetworkingEvents returns events', async () => {
    const events = [{ _id: 'e1', name: 'Event1' }];
    mockFind.mockReturnValue(makeChainable(events));

    await getNetworkingEvents(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: events }));
  });

  it('getNetworkingEventById handles not found', async () => {
    req.params = { id: 'missing' };
    mockFindOne.mockReturnValue(makeChainable(null));

    await getNetworkingEventById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it('createNetworkingEvent returns created', async () => {
    const created = { _id: 'new', title: 'x' };
    mockCreate.mockResolvedValueOnce(created);

    await createNetworkingEvent(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: created }));
  });

  it('updateNetworkingEvent handles not found', async () => {
    req.params = { id: 'id1' };
    mockFindOneAndUpdate.mockReturnValue(makeChainable(null));

    await updateNetworkingEvent(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('deleteNetworkingEvent handles not found', async () => {
    req.params = { id: 'id1' };
    mockFindOneAndDelete.mockResolvedValueOnce(null);

    await deleteNetworkingEvent(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('getNetworkingStats returns aggregated data', async () => {
    // configure countDocuments to return different numbers on consecutive calls
    mockCountDocuments.mockResolvedValueOnce(5).mockResolvedValueOnce(2).mockResolvedValueOnce(1);
    const events = [ { connectionsGained: 2, jobLeadsGenerated: 1, roiRating: 4, goals: [{achieved:true}] } ];
    // When find is called for eventsWithConnections, return events
    mockFind.mockResolvedValueOnce(events);

    await getNetworkingStats(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: expect.any(Object) }));
  });

  it('discoverEvents returns search results', async () => {
    mockSearchEvents.mockResolvedValueOnce({ events: [{ id: 'evt' }], pagination: { page:1 } });

    await discoverEvents(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('getCategories returns categories', async () => {
    mockGetEventCategories.mockResolvedValueOnce([{ id:'101', name:'Business' }]);

    await getCategories(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

});
