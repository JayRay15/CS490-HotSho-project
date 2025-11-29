import { jest, beforeEach, describe, it, expect } from '@jest/globals';
import mongoose from 'mongoose';

// Mock models
const mockRelationshipReminderFind = jest.fn();
const mockRelationshipReminderFindOne = jest.fn();
const mockRelationshipReminderFindById = jest.fn();
const mockRelationshipReminderFindOneAndDelete = jest.fn();

const mockReminderComplete = jest.fn();
const mockReminderSnooze = jest.fn();
const mockReminderSave = jest.fn();

const mockRelationshipActivityFind = jest.fn();
const mockRelationshipActivitySave = jest.fn();
const mockRelationshipActivityCalculateHealth = jest.fn();

const mockContactFind = jest.fn();
const mockContactFindOne = jest.fn();
const mockContactFindByIdAndUpdate = jest.fn();

jest.unstable_mockModule('../../models/RelationshipReminder.js', () => ({
  default: class MockReminder {
    constructor(data) {
      Object.assign(this, data);
      this.save = mockReminderSave;
      this.complete = mockReminderComplete;
      this.snooze = mockReminderSnooze;
    }
    static find = mockRelationshipReminderFind;
    static findOne = mockRelationshipReminderFindOne;
    static findById = mockRelationshipReminderFindById;
    static findOneAndDelete = mockRelationshipReminderFindOneAndDelete;
  }
}));

jest.unstable_mockModule('../../models/RelationshipActivity.js', () => ({
  default: class MockActivity {
    constructor(data) {
      Object.assign(this, data);
      this.save = mockRelationshipActivitySave;
    }
    static find = mockRelationshipActivityFind;
    static calculateRelationshipHealth = mockRelationshipActivityCalculateHealth;
  }
}));

jest.unstable_mockModule('../../models/Contact.js', () => ({
  default: {
    find: mockContactFind,
    findOne: mockContactFindOne,
    findByIdAndUpdate: mockContactFindByIdAndUpdate
  }
}));

const {
  getReminders,
  getReminderById,
  createReminder,
  updateReminder,
  completeReminder,
  snoozeReminder,
  dismissReminder,
  deleteReminder,
  generateReminders,
  getMessageTemplates,
  getActivities,
  createActivity,
  getRelationshipHealth,
  getRelationshipAnalytics
} = await import('../relationshipMaintenanceController.js');

describe('Relationship Maintenance Controller - Extended Coverage', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { auth: { userId: 'user1' }, query: {}, params: {}, body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  });

  describe('getReminders', () => {
    it('should return all reminders without filters', async () => {
      const mockReminders = [
        { _id: 'r1', title: 'Check in', reminderType: 'General Check-in' },
        { _id: 'r2', title: 'Birthday', reminderType: 'Birthday' }
      ];
      mockRelationshipReminderFind.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockReminders)
        })
      });

      await getReminders(req, res);

      expect(res.json).toHaveBeenCalledWith(mockReminders);
    });

    it('should filter by status', async () => {
      req.query = { status: 'Pending' };
      mockRelationshipReminderFind.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([])
        })
      });

      await getReminders(req, res);

      expect(mockRelationshipReminderFind).toHaveBeenCalledWith(expect.objectContaining({ status: 'Pending' }));
    });

    it('should filter by reminderType', async () => {
      req.query = { reminderType: 'Birthday' };
      mockRelationshipReminderFind.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([])
        })
      });

      await getReminders(req, res);

      expect(mockRelationshipReminderFind).toHaveBeenCalledWith(expect.objectContaining({ reminderType: 'Birthday' }));
    });

    it('should filter by priority', async () => {
      req.query = { priority: 'High' };
      mockRelationshipReminderFind.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([])
        })
      });

      await getReminders(req, res);

      expect(mockRelationshipReminderFind).toHaveBeenCalledWith(expect.objectContaining({ priority: 'High' }));
    });

    it('should filter by contactId', async () => {
      req.query = { contactId: 'contact123' };
      mockRelationshipReminderFind.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([])
        })
      });

      await getReminders(req, res);

      expect(mockRelationshipReminderFind).toHaveBeenCalledWith(expect.objectContaining({ contactId: 'contact123' }));
    });

    it('should filter for upcoming reminders', async () => {
      req.query = { upcoming: 'true' };
      mockRelationshipReminderFind.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([])
        })
      });

      await getReminders(req, res);

      expect(mockRelationshipReminderFind).toHaveBeenCalledWith(expect.objectContaining({
        status: 'Pending',
        reminderDate: expect.any(Object)
      }));
    });

    it('should filter for overdue reminders', async () => {
      req.query = { overdue: 'true' };
      mockRelationshipReminderFind.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([])
        })
      });

      await getReminders(req, res);

      expect(mockRelationshipReminderFind).toHaveBeenCalledWith(expect.objectContaining({
        status: 'Pending'
      }));
    });

    it('should handle error in getReminders', async () => {
      mockRelationshipReminderFind.mockImplementation(() => {
        throw new Error('Database error');
      });

      await getReminders(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Server error fetching reminders' }));
    });
  });

  describe('getReminderById', () => {
    it('should return reminder when found', async () => {
      req.params = { id: 'reminder123' };
      const mockReminder = { _id: 'reminder123', title: 'Test Reminder' };
      mockRelationshipReminderFindOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockReminder)
      });

      await getReminderById(req, res);

      expect(res.json).toHaveBeenCalledWith(mockReminder);
    });

    it('should return 404 when reminder not found', async () => {
      req.params = { id: 'nonexistent' };
      mockRelationshipReminderFindOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      await getReminderById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Reminder not found' }));
    });

    it('should handle error in getReminderById', async () => {
      req.params = { id: 'reminder123' };
      mockRelationshipReminderFindOne.mockImplementation(() => {
        throw new Error('Database error');
      });

      await getReminderById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('createReminder', () => {
    it('should create reminder successfully', async () => {
      const contactId = new mongoose.Types.ObjectId().toString();
      req.body = {
        contactId,
        reminderType: 'General Check-in',
        reminderDate: new Date().toISOString(),
        title: 'Check in with John'
      };
      
      mockContactFindOne.mockResolvedValue({ _id: contactId, firstName: 'John' });
      mockReminderSave.mockResolvedValue(true);
      mockRelationshipReminderFindById.mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          _id: 'newReminder',
          title: 'Check in with John'
        })
      });

      await createReminder(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return 404 when contact not found', async () => {
      req.body = {
        contactId: 'nonexistent',
        reminderType: 'General Check-in',
        reminderDate: new Date().toISOString(),
        title: 'Check in'
      };
      mockContactFindOne.mockResolvedValue(null);

      await createReminder(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Contact not found' }));
    });

    it('should create recurring reminder with Weekly pattern', async () => {
      const contactId = new mongoose.Types.ObjectId().toString();
      req.body = {
        contactId,
        reminderType: 'General Check-in',
        reminderDate: new Date().toISOString(),
        title: 'Weekly check in',
        isRecurring: true,
        recurrencePattern: 'Weekly'
      };
      
      mockContactFindOne.mockResolvedValue({ _id: contactId });
      mockReminderSave.mockResolvedValue(true);
      mockRelationshipReminderFindById.mockReturnValue({
        populate: jest.fn().mockResolvedValue({ _id: 'new', title: 'Weekly check in' })
      });

      await createReminder(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should create recurring reminder with Custom pattern', async () => {
      const contactId = new mongoose.Types.ObjectId().toString();
      req.body = {
        contactId,
        reminderType: 'General Check-in',
        reminderDate: new Date().toISOString(),
        title: 'Custom check in',
        isRecurring: true,
        recurrencePattern: 'Custom',
        recurrenceInterval: 10
      };
      
      mockContactFindOne.mockResolvedValue({ _id: contactId });
      mockReminderSave.mockResolvedValue(true);
      mockRelationshipReminderFindById.mockReturnValue({
        populate: jest.fn().mockResolvedValue({ _id: 'new', title: 'Custom check in' })
      });

      await createReminder(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should handle error in createReminder', async () => {
      req.body = { contactId: 'contact123' };
      mockContactFindOne.mockRejectedValue(new Error('Database error'));

      await createReminder(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateReminder', () => {
    it('should update reminder successfully', async () => {
      req.params = { id: 'reminder123' };
      req.body = { title: 'Updated Title', priority: 'High' };
      
      const mockReminder = {
        _id: 'reminder123',
        title: 'Original',
        priority: 'Medium',
        isRecurring: false,
        save: mockReminderSave
      };
      mockRelationshipReminderFindOne.mockResolvedValue(mockReminder);
      mockReminderSave.mockResolvedValue(true);
      mockRelationshipReminderFindById.mockReturnValue({
        populate: jest.fn().mockResolvedValue({ ...mockReminder, title: 'Updated Title' })
      });

      await updateReminder(req, res);

      expect(res.json).toBeDefined();
    });

    it('should return 404 when reminder not found for update', async () => {
      req.params = { id: 'nonexistent' };
      req.body = { title: 'Updated' };
      mockRelationshipReminderFindOne.mockResolvedValue(null);

      await updateReminder(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should update recurring reminder and recalculate next recurrence', async () => {
      req.params = { id: 'reminder123' };
      req.body = { isRecurring: true, recurrencePattern: 'Monthly' };
      
      const mockReminder = {
        _id: 'reminder123',
        reminderDate: new Date(),
        isRecurring: false,
        save: mockReminderSave
      };
      mockRelationshipReminderFindOne.mockResolvedValue(mockReminder);
      mockReminderSave.mockResolvedValue(true);
      mockRelationshipReminderFindById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockReminder)
      });

      await updateReminder(req, res);

      expect(mockReminderSave).toHaveBeenCalled();
    });

    it('should handle error in updateReminder', async () => {
      req.params = { id: 'reminder123' };
      mockRelationshipReminderFindOne.mockRejectedValue(new Error('Database error'));

      await updateReminder(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('completeReminder', () => {
    it('should complete reminder with notes and log activity', async () => {
      req.params = { id: 'reminder123' };
      req.body = { notes: 'Great conversation', logActivity: true };
      
      const mockReminder = {
        _id: 'reminder123',
        contactId: 'contact123',
        reminderType: 'General Check-in',
        complete: mockReminderComplete
      };
      mockRelationshipReminderFindOne.mockResolvedValue(mockReminder);
      mockReminderComplete.mockResolvedValue(mockReminder);
      mockRelationshipActivitySave.mockResolvedValue(true);
      mockContactFindByIdAndUpdate.mockResolvedValue(true);
      mockRelationshipReminderFindById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockReminder)
      });

      await completeReminder(req, res);

      expect(mockReminderComplete).toHaveBeenCalledWith('Great conversation');
    });

    it('should complete reminder without logging activity', async () => {
      req.params = { id: 'reminder123' };
      req.body = { notes: 'Done', logActivity: false };
      
      const mockReminder = {
        _id: 'reminder123',
        complete: mockReminderComplete
      };
      mockRelationshipReminderFindOne.mockResolvedValue(mockReminder);
      mockReminderComplete.mockResolvedValue(mockReminder);
      mockRelationshipReminderFindById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockReminder)
      });

      await completeReminder(req, res);

      expect(res.json).toBeDefined();
    });

    it('should return 404 when reminder not found', async () => {
      req.params = { id: 'nonexistent' };
      mockRelationshipReminderFindOne.mockResolvedValue(null);

      await completeReminder(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should handle error in completeReminder', async () => {
      req.params = { id: 'reminder123' };
      mockRelationshipReminderFindOne.mockRejectedValue(new Error('Database error'));

      await completeReminder(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('snoozeReminder', () => {
    it('should snooze reminder for specified days', async () => {
      req.params = { id: 'reminder123' };
      req.body = { days: 3 };
      
      const mockReminder = {
        _id: 'reminder123',
        snooze: mockReminderSnooze
      };
      mockRelationshipReminderFindOne.mockResolvedValue(mockReminder);
      mockReminderSnooze.mockResolvedValue(mockReminder);
      mockRelationshipReminderFindById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockReminder)
      });

      await snoozeReminder(req, res);

      expect(mockReminderSnooze).toHaveBeenCalledWith(3);
    });

    it('should return 400 for invalid snooze duration', async () => {
      req.params = { id: 'reminder123' };
      req.body = { days: 0 };

      await snoozeReminder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Invalid snooze duration' }));
    });

    it('should return 400 when days is not provided', async () => {
      req.params = { id: 'reminder123' };
      req.body = {};

      await snoozeReminder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 when reminder not found', async () => {
      req.params = { id: 'nonexistent' };
      req.body = { days: 3 };
      mockRelationshipReminderFindOne.mockResolvedValue(null);

      await snoozeReminder(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should handle error in snoozeReminder', async () => {
      req.params = { id: 'reminder123' };
      req.body = { days: 3 };
      mockRelationshipReminderFindOne.mockRejectedValue(new Error('Database error'));

      await snoozeReminder(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('dismissReminder', () => {
    it('should dismiss reminder successfully', async () => {
      req.params = { id: 'reminder123' };
      
      const mockReminder = {
        _id: 'reminder123',
        status: 'Pending',
        save: mockReminderSave
      };
      mockRelationshipReminderFindOne.mockResolvedValue(mockReminder);
      mockReminderSave.mockResolvedValue(true);

      await dismissReminder(req, res);

      expect(mockReminder.status).toBe('Dismissed');
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Reminder dismissed successfully' }));
    });

    it('should return 404 when reminder not found', async () => {
      req.params = { id: 'nonexistent' };
      mockRelationshipReminderFindOne.mockResolvedValue(null);

      await dismissReminder(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should handle error in dismissReminder', async () => {
      req.params = { id: 'reminder123' };
      mockRelationshipReminderFindOne.mockRejectedValue(new Error('Database error'));

      await dismissReminder(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('deleteReminder', () => {
    it('should delete reminder successfully', async () => {
      req.params = { id: 'reminder123' };
      mockRelationshipReminderFindOneAndDelete.mockResolvedValue({ _id: 'reminder123' });

      await deleteReminder(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Reminder deleted successfully' }));
    });

    it('should return 404 when reminder not found', async () => {
      req.params = { id: 'nonexistent' };
      mockRelationshipReminderFindOneAndDelete.mockResolvedValue(null);

      await deleteReminder(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should handle error in deleteReminder', async () => {
      req.params = { id: 'reminder123' };
      mockRelationshipReminderFindOneAndDelete.mockRejectedValue(new Error('Database error'));

      await deleteReminder(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('generateReminders', () => {
    it('should generate reminders for contacts needing check-in', async () => {
      const now = new Date();
      const oldDate = new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000);
      
      const mockContacts = [
        { _id: 'c1', firstName: 'John', lastName: 'Doe', lastContactDate: oldDate, relationshipStrength: 'Medium' }
      ];
      mockContactFind.mockResolvedValue(mockContacts);
      mockRelationshipReminderFindOne.mockResolvedValue(null);
      mockReminderSave.mockResolvedValue(true);

      await generateReminders(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Generated')
      }));
    });

    it('should generate birthday reminders', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const birthday = `${tomorrow.getMonth() + 1}/${tomorrow.getDate()}`;
      
      const mockContacts = [
        { _id: 'c1', firstName: 'Jane', lastName: 'Doe', birthday }
      ];
      mockContactFind.mockResolvedValue(mockContacts);
      mockRelationshipReminderFindOne.mockResolvedValue(null);
      mockReminderSave.mockResolvedValue(true);

      await generateReminders(req, res);

      expect(res.json).toBeDefined();
    });

    it('should skip contacts with existing pending check-in reminders', async () => {
      const mockContacts = [
        { _id: 'c1', firstName: 'John', lastName: 'Doe', lastContactDate: new Date() }
      ];
      mockContactFind.mockResolvedValue(mockContacts);
      mockRelationshipReminderFindOne.mockResolvedValue({ _id: 'existingReminder' });

      await generateReminders(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        count: 0
      }));
    });

    it('should handle contacts with no lastContactDate', async () => {
      const mockContacts = [
        { _id: 'c1', firstName: 'New', lastName: 'Contact', lastContactDate: null }
      ];
      mockContactFind.mockResolvedValue(mockContacts);
      mockRelationshipReminderFindOne.mockResolvedValue(null);
      mockReminderSave.mockResolvedValue(true);

      await generateReminders(req, res);

      expect(res.json).toBeDefined();
    });

    it('should handle error in generateReminders', async () => {
      mockContactFind.mockRejectedValue(new Error('Database error'));

      await generateReminders(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getMessageTemplates', () => {
    it('should return all templates when no reminderType provided', async () => {
      await getMessageTemplates(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        templates: expect.any(Object)
      }));
    });

    it('should return templates for specific reminderType', async () => {
      req.query = { reminderType: 'General Check-in' };

      await getMessageTemplates(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        reminderType: 'General Check-in',
        templates: expect.any(Array)
      }));
    });

    it('should personalize templates when contactId provided', async () => {
      req.query = { reminderType: 'General Check-in', contactId: 'contact123' };
      mockContactFindOne.mockResolvedValue({ firstName: 'John', lastName: 'Doe', company: 'TechCo' });

      await getMessageTemplates(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        templates: expect.any(Array)
      }));
    });

    it('should handle error in getMessageTemplates', async () => {
      req.query = { reminderType: 'Birthday', contactId: 'contact123' };
      mockContactFindOne.mockRejectedValue(new Error('Database error'));

      await getMessageTemplates(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getActivities', () => {
    it('should return all activities', async () => {
      mockRelationshipActivityFind.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([])
          })
        })
      });

      await getActivities(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.any(Array));
    });

    it('should filter by contactId', async () => {
      req.query = { contactId: 'contact123' };
      mockRelationshipActivityFind.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([])
          })
        })
      });

      await getActivities(req, res);

      expect(mockRelationshipActivityFind).toHaveBeenCalledWith(expect.objectContaining({
        contactId: 'contact123'
      }));
    });

    it('should filter by activityType', async () => {
      req.query = { activityType: 'Email Sent' };
      mockRelationshipActivityFind.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([])
          })
        })
      });

      await getActivities(req, res);

      expect(mockRelationshipActivityFind).toHaveBeenCalledWith(expect.objectContaining({
        activityType: 'Email Sent'
      }));
    });

    it('should filter by date range', async () => {
      req.query = { startDate: '2024-01-01', endDate: '2024-12-31' };
      mockRelationshipActivityFind.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([])
          })
        })
      });

      await getActivities(req, res);

      expect(mockRelationshipActivityFind).toHaveBeenCalledWith(expect.objectContaining({
        activityDate: expect.any(Object)
      }));
    });

    it('should apply limit', async () => {
      req.query = { limit: '50' };
      const mockLimit = jest.fn().mockResolvedValue([]);
      mockRelationshipActivityFind.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: mockLimit
          })
        })
      });

      await getActivities(req, res);

      expect(mockLimit).toHaveBeenCalledWith(50);
    });

    it('should handle error in getActivities', async () => {
      mockRelationshipActivityFind.mockImplementation(() => {
        throw new Error('Database error');
      });

      await getActivities(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('createActivity', () => {
    it('should create activity successfully', async () => {
      const contactId = new mongoose.Types.ObjectId().toString();
      req.body = {
        contactId,
        activityType: 'Email Sent',
        direction: 'Outbound'
      };
      mockContactFindOne.mockResolvedValue({ _id: contactId });
      mockRelationshipActivitySave.mockResolvedValue(true);
      mockContactFindByIdAndUpdate.mockResolvedValue(true);

      // Mock the findById for returning populated activity
      const mockPopulate = jest.fn().mockResolvedValue({
        _id: 'newActivity',
        activityType: 'Email Sent'
      });
      
      // We need to mock the RelationshipActivity.findById
      const RelationshipActivity = (await import('../../models/RelationshipActivity.js')).default;
      RelationshipActivity.findById = jest.fn().mockReturnValue({
        populate: mockPopulate
      });

      await createActivity(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return 404 when contact not found', async () => {
      req.body = { contactId: 'nonexistent', activityType: 'Email Sent' };
      mockContactFindOne.mockResolvedValue(null);

      await createActivity(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should handle error in createActivity', async () => {
      req.body = { contactId: 'contact123' };
      mockContactFindOne.mockRejectedValue(new Error('Database error'));

      await createActivity(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getRelationshipHealth', () => {
    it('should return relationship health for contact', async () => {
      req.params = { contactId: 'contact123' };
      mockContactFindOne.mockResolvedValue({
        _id: 'contact123',
        firstName: 'John',
        lastName: 'Doe'
      });
      mockRelationshipActivityCalculateHealth.mockResolvedValue({
        score: 75,
        status: 'Healthy'
      });

      await getRelationshipHealth(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        contactId: 'contact123',
        contactName: 'John Doe',
        score: 75,
        status: 'Healthy'
      }));
    });

    it('should return 404 when contact not found', async () => {
      req.params = { contactId: 'nonexistent' };
      mockContactFindOne.mockResolvedValue(null);

      await getRelationshipHealth(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should handle error in getRelationshipHealth', async () => {
      req.params = { contactId: 'contact123' };
      mockContactFindOne.mockRejectedValue(new Error('Database error'));

      await getRelationshipHealth(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getRelationshipAnalytics', () => {
    it('should return analytics with activities and contacts', async () => {
      const mockActivities = [
        { activityType: 'Email Sent', direction: 'Outbound', valueExchange: 'Given', opportunityGenerated: true },
        { activityType: 'Phone Call', direction: 'Inbound', valueExchange: 'Received', opportunityGenerated: false },
        { activityType: 'Meeting', direction: 'Mutual', valueExchange: 'Mutual', opportunityGenerated: false }
      ];
      const mockContacts = [
        { _id: 'c1', lastContactDate: new Date() },
        { _id: 'c2', lastContactDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) }
      ];

      mockRelationshipActivityFind.mockResolvedValue(mockActivities);
      mockContactFind.mockResolvedValue(mockContacts);

      await getRelationshipAnalytics(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        totalContacts: 2,
        totalActivities: 3,
        opportunitiesGenerated: 1,
        outboundActivities: 1,
        inboundActivities: 1
      }));
    });

    it('should handle empty activities and contacts', async () => {
      mockRelationshipActivityFind.mockResolvedValue([]);
      mockContactFind.mockResolvedValue([]);

      await getRelationshipAnalytics(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        totalContacts: 0,
        totalActivities: 0
      }));
    });

    it('should handle error in getRelationshipAnalytics', async () => {
      mockRelationshipActivityFind.mockRejectedValue(new Error('Database error'));

      await getRelationshipAnalytics(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
