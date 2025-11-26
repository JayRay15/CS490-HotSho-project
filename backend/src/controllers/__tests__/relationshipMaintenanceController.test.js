import { jest, beforeEach, describe, it, expect } from '@jest/globals';

// Mock models
const mockRelationshipReminderFind = jest.fn();
const mockRelationshipReminderFindOne = jest.fn();
const mockRelationshipReminderFindById = jest.fn();
const mockRelationshipReminderSave = jest.fn();

const mockRelationshipActivityFind = jest.fn();

const mockContactFind = jest.fn();

jest.unstable_mockModule('../../models/RelationshipReminder.js', () => ({
  default: {
    find: mockRelationshipReminderFind,
    findOne: mockRelationshipReminderFindOne,
    findById: mockRelationshipReminderFindById,
    prototype: { save: mockRelationshipReminderSave }
  }
}));

jest.unstable_mockModule('../../models/RelationshipActivity.js', () => ({
  default: {
    find: mockRelationshipActivityFind,
    calculateRelationshipHealth: jest.fn().mockResolvedValue({ score: 80 })
  }
}));

jest.unstable_mockModule('../../models/Contact.js', () => ({
  default: {
    find: mockContactFind,
    findOne: jest.fn()
  }
}));

const {
  getMessageTemplates,
  getActivities,
  getRelationshipAnalytics,
  getRelationshipHealth
} = await import('../relationshipMaintenanceController.js');

describe('Relationship Maintenance Controller', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { auth: { userId: 'u1' }, query: {}, params: {}, body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  });

  it('getMessageTemplates returns templates map when no type', async () => {
    await getMessageTemplates(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ templates: expect.any(Object) }));
  });

  it('getActivities returns activities list', async () => {
    mockRelationshipActivityFind.mockReturnValue({ populate: jest.fn().mockReturnValue({ sort: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([]) }) }) });

    await getActivities(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.any(Array));
  });

  it('getRelationshipAnalytics returns computed analytics', async () => {
    // Prepare activities and contacts
    const activities = [ { activityType: 'Email', opportunityGenerated: true, direction: 'Outbound', valueExchange: 'Given' } ];
    const contacts = [ { _id: 'c1', lastContactDate: new Date() } ];

    mockRelationshipActivityFind.mockResolvedValueOnce(activities);
    mockContactFind.mockResolvedValueOnce(contacts);

    await getRelationshipAnalytics(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ totalContacts: 1 }));
  });

  it('getRelationshipHealth returns 404 when contact missing', async () => {
    req.params = { contactId: 'notfound' };
    // mock Contact.findOne to return null
    const Contact = (await import('../../models/Contact.js')).default;
    Contact.findOne = jest.fn().mockResolvedValueOnce(null);

    await getRelationshipHealth(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});
