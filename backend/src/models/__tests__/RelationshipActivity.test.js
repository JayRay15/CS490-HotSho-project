import { jest, beforeEach, describe, it, expect } from '@jest/globals';
import mongoose from 'mongoose';
import RelationshipActivity from '../RelationshipActivity.js';

describe('RelationshipActivity Model', () => {
  describe('Schema Validation', () => {
    it('should validate required fields', () => {
      const activity = new RelationshipActivity({});

      const error = activity.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.userId).toBeDefined();
      expect(error.errors.contactId).toBeDefined();
      expect(error.errors.activityType).toBeDefined();
    });

    it('should create activity with valid required fields', () => {
      const activity = new RelationshipActivity({
        userId: 'user_123',
        contactId: new mongoose.Types.ObjectId(),
        activityType: 'Email Sent'
      });

      const error = activity.validateSync();
      expect(error).toBeUndefined();
      expect(activity.userId).toBe('user_123');
      expect(activity.activityType).toBe('Email Sent');
    });

    it('should set default values correctly', () => {
      const activity = new RelationshipActivity({
        userId: 'user_123',
        contactId: new mongoose.Types.ObjectId(),
        activityType: 'Phone Call'
      });

      expect(activity.direction).toBe('Outbound');
      expect(activity.sentiment).toBe('Neutral');
      expect(activity.responseReceived).toBe(false);
      expect(activity.valueExchange).toBe('None');
      expect(activity.opportunityGenerated).toBe(false);
      expect(activity.followUpRequired).toBe(false);
      expect(activity.followUpCompleted).toBe(false);
    });

    it('should validate activityType enum values', () => {
      const validTypes = [
        'Email Sent',
        'Email Received',
        'Phone Call',
        'Meeting',
        'LinkedIn Message',
        'Coffee Chat',
        'Introduction Made',
        'Referral Requested',
        'Referral Provided',
        'Job Lead Shared',
        'Advice Requested',
        'Advice Given',
        'Birthday Wish',
        'Congratulations Sent',
        'Thank You Sent',
        'Industry News Shared',
        'Event Attended Together',
        'Other'
      ];

      validTypes.forEach(type => {
        const activity = new RelationshipActivity({
          userId: 'user_123',
          contactId: new mongoose.Types.ObjectId(),
          activityType: type
        });

        const error = activity.validateSync();
        expect(error).toBeUndefined();
      });
    });

    it('should reject invalid activityType', () => {
      const activity = new RelationshipActivity({
        userId: 'user_123',
        contactId: new mongoose.Types.ObjectId(),
        activityType: 'InvalidType'
      });

      const error = activity.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.activityType).toBeDefined();
    });

    it('should validate direction enum values', () => {
      const validDirections = ['Outbound', 'Inbound', 'Mutual'];

      validDirections.forEach(direction => {
        const activity = new RelationshipActivity({
          userId: 'user_123',
          contactId: new mongoose.Types.ObjectId(),
          activityType: 'Email Sent',
          direction
        });

        const error = activity.validateSync();
        expect(error).toBeUndefined();
        expect(activity.direction).toBe(direction);
      });
    });

    it('should reject invalid direction', () => {
      const activity = new RelationshipActivity({
        userId: 'user_123',
        contactId: new mongoose.Types.ObjectId(),
        activityType: 'Email Sent',
        direction: 'InvalidDirection'
      });

      const error = activity.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.direction).toBeDefined();
    });

    it('should validate sentiment enum values', () => {
      const validSentiments = ['Positive', 'Neutral', 'Negative'];

      validSentiments.forEach(sentiment => {
        const activity = new RelationshipActivity({
          userId: 'user_123',
          contactId: new mongoose.Types.ObjectId(),
          activityType: 'Meeting',
          sentiment
        });

        const error = activity.validateSync();
        expect(error).toBeUndefined();
        expect(activity.sentiment).toBe(sentiment);
      });
    });

    it('should reject invalid sentiment', () => {
      const activity = new RelationshipActivity({
        userId: 'user_123',
        contactId: new mongoose.Types.ObjectId(),
        activityType: 'Meeting',
        sentiment: 'InvalidSentiment'
      });

      const error = activity.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.sentiment).toBeDefined();
    });

    it('should validate valueExchange enum values', () => {
      const validValues = ['Given', 'Received', 'Mutual', 'None'];

      validValues.forEach(valueExchange => {
        const activity = new RelationshipActivity({
          userId: 'user_123',
          contactId: new mongoose.Types.ObjectId(),
          activityType: 'Coffee Chat',
          valueExchange
        });

        const error = activity.validateSync();
        expect(error).toBeUndefined();
        expect(activity.valueExchange).toBe(valueExchange);
      });
    });

    it('should reject invalid valueExchange', () => {
      const activity = new RelationshipActivity({
        userId: 'user_123',
        contactId: new mongoose.Types.ObjectId(),
        activityType: 'Coffee Chat',
        valueExchange: 'InvalidValue'
      });

      const error = activity.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.valueExchange).toBeDefined();
    });

    it('should validate valueType enum values', () => {
      const validValueTypes = [
        'Job Lead',
        'Introduction',
        'Advice',
        'Information',
        'Referral',
        'Recommendation',
        'Mentorship',
        'Support',
        'Other'
      ];

      validValueTypes.forEach(valueType => {
        const activity = new RelationshipActivity({
          userId: 'user_123',
          contactId: new mongoose.Types.ObjectId(),
          activityType: 'Meeting',
          valueType
        });

        const error = activity.validateSync();
        expect(error).toBeUndefined();
      });
    });

    it('should reject invalid valueType', () => {
      const activity = new RelationshipActivity({
        userId: 'user_123',
        contactId: new mongoose.Types.ObjectId(),
        activityType: 'Meeting',
        valueType: 'InvalidValueType'
      });

      const error = activity.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.valueType).toBeDefined();
    });

    it('should validate opportunityType enum values', () => {
      const validOpportunityTypes = [
        'Job Interview',
        'Job Offer',
        'Referral',
        'Introduction',
        'Partnership',
        'Other'
      ];

      validOpportunityTypes.forEach(opportunityType => {
        const activity = new RelationshipActivity({
          userId: 'user_123',
          contactId: new mongoose.Types.ObjectId(),
          activityType: 'Referral Provided',
          opportunityType
        });

        const error = activity.validateSync();
        expect(error).toBeUndefined();
      });
    });

    it('should reject invalid opportunityType', () => {
      const activity = new RelationshipActivity({
        userId: 'user_123',
        contactId: new mongoose.Types.ObjectId(),
        activityType: 'Referral Provided',
        opportunityType: 'InvalidOpportunityType'
      });

      const error = activity.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.opportunityType).toBeDefined();
    });

    it('should trim subject', () => {
      const activity = new RelationshipActivity({
        userId: 'user_123',
        contactId: new mongoose.Types.ObjectId(),
        activityType: 'Email Sent',
        subject: '  Follow up on job opportunity  '
      });

      const error = activity.validateSync();
      expect(error).toBeUndefined();
      expect(activity.subject).toBe('Follow up on job opportunity');
    });

    it('should trim notes', () => {
      const activity = new RelationshipActivity({
        userId: 'user_123',
        contactId: new mongoose.Types.ObjectId(),
        activityType: 'Meeting',
        notes: '  Discussed potential opportunities  '
      });

      const error = activity.validateSync();
      expect(error).toBeUndefined();
      expect(activity.notes).toBe('Discussed potential opportunities');
    });

    it('should handle tags array', () => {
      const activity = new RelationshipActivity({
        userId: 'user_123',
        contactId: new mongoose.Types.ObjectId(),
        activityType: 'Networking Event',
        tags: ['  tech  ', '  startup  ', '  hiring  ']
      });

      // Tags should be trimmed
      expect(activity.tags).toEqual(['tech', 'startup', 'hiring']);
    });

    it('should handle attachments array', () => {
      const activity = new RelationshipActivity({
        userId: 'user_123',
        contactId: new mongoose.Types.ObjectId(),
        activityType: 'Email Sent',
        attachments: [
          { fileName: 'resume.pdf', fileUrl: 'https://example.com/resume.pdf', fileType: 'application/pdf' }
        ]
      });

      expect(activity.attachments).toHaveLength(1);
      expect(activity.attachments[0].fileName).toBe('resume.pdf');
    });

    it('should set activityDate to default Date.now if not provided', () => {
      const before = new Date();
      const activity = new RelationshipActivity({
        userId: 'user_123',
        contactId: new mongoose.Types.ObjectId(),
        activityType: 'Phone Call'
      });
      const after = new Date();

      expect(activity.activityDate).toBeDefined();
      expect(activity.activityDate.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(activity.activityDate.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should accept custom activityDate', () => {
      const customDate = new Date('2024-01-15');
      const activity = new RelationshipActivity({
        userId: 'user_123',
        contactId: new mongoose.Types.ObjectId(),
        activityType: 'Meeting',
        activityDate: customDate
      });

      expect(activity.activityDate).toEqual(customDate);
    });

    it('should handle responseTime as number', () => {
      const activity = new RelationshipActivity({
        userId: 'user_123',
        contactId: new mongoose.Types.ObjectId(),
        activityType: 'Email Sent',
        responseReceived: true,
        responseTime: 24
      });

      expect(activity.responseTime).toBe(24);
    });

    it('should handle followUpDate', () => {
      const followUpDate = new Date('2024-02-01');
      const activity = new RelationshipActivity({
        userId: 'user_123',
        contactId: new mongoose.Types.ObjectId(),
        activityType: 'Meeting',
        followUpRequired: true,
        followUpDate
      });

      expect(activity.followUpDate).toEqual(followUpDate);
    });

    it('should handle linkedJobId as ObjectId', () => {
      const jobId = new mongoose.Types.ObjectId();
      const activity = new RelationshipActivity({
        userId: 'user_123',
        contactId: new mongoose.Types.ObjectId(),
        activityType: 'Referral Provided',
        linkedJobId: jobId
      });

      expect(activity.linkedJobId).toEqual(jobId);
    });

    it('should handle linkedReminderId as ObjectId', () => {
      const reminderId = new mongoose.Types.ObjectId();
      const activity = new RelationshipActivity({
        userId: 'user_123',
        contactId: new mongoose.Types.ObjectId(),
        activityType: 'Email Sent',
        linkedReminderId: reminderId
      });

      expect(activity.linkedReminderId).toEqual(reminderId);
    });
  });

  describe('calculateRelationshipHealth Static Method', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return inactive status when no activities found', async () => {
      // Mock the find method to return empty array
      jest.spyOn(RelationshipActivity, 'find').mockResolvedValue([]);

      const result = await RelationshipActivity.calculateRelationshipHealth('user_123', new mongoose.Types.ObjectId());

      expect(result.score).toBe(0);
      expect(result.status).toBe('Inactive');
      expect(result.lastActivity).toBeNull();
      expect(result.frequency).toBe(0);
      expect(result.reciprocity).toBe(0);
      expect(result.valueExchange).toBe(0);

      RelationshipActivity.find.mockRestore();
    });

    it('should calculate Strong status for high activity', async () => {
      const now = new Date();
      const recentDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
      
      const mockActivities = [
        { activityDate: recentDate, direction: 'Outbound', valueExchange: 'Given', opportunityGenerated: true },
        { activityDate: recentDate, direction: 'Inbound', valueExchange: 'Received', opportunityGenerated: false },
        { activityDate: recentDate, direction: 'Outbound', valueExchange: 'Mutual', opportunityGenerated: false },
        { activityDate: recentDate, direction: 'Inbound', valueExchange: 'None', opportunityGenerated: false },
        // Add more for higher frequency
        ...Array(20).fill({ activityDate: recentDate, direction: 'Outbound', valueExchange: 'Given', opportunityGenerated: false })
      ];

      jest.spyOn(RelationshipActivity, 'find').mockResolvedValue(mockActivities);

      const result = await RelationshipActivity.calculateRelationshipHealth('user_123', new mongoose.Types.ObjectId());

      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.status).toBe('Strong');
      expect(result.totalActivities).toBe(mockActivities.length);
      expect(result.opportunitiesGenerated).toBe(1);

      RelationshipActivity.find.mockRestore();
    });

    it('should calculate Healthy status for moderate activity', async () => {
      const now = new Date();
      const recentDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); // 5 days ago - recent
      
      // Need enough activities for good frequency (2+ per month = 20 points)
      // Recent date = 40 points (within 7 days)
      // Some reciprocity and value exchange
      const mockActivities = [
        { activityDate: recentDate, direction: 'Outbound', valueExchange: 'Given', opportunityGenerated: false },
        { activityDate: recentDate, direction: 'Inbound', valueExchange: 'Received', opportunityGenerated: false },
        { activityDate: recentDate, direction: 'Outbound', valueExchange: 'None', opportunityGenerated: false },
        { activityDate: recentDate, direction: 'Inbound', valueExchange: 'None', opportunityGenerated: false },
        ...Array(8).fill({ activityDate: recentDate, direction: 'Outbound', valueExchange: 'None', opportunityGenerated: false })
      ];

      jest.spyOn(RelationshipActivity, 'find').mockResolvedValue(mockActivities);

      const result = await RelationshipActivity.calculateRelationshipHealth('user_123', new mongoose.Types.ObjectId());

      expect(result.score).toBeGreaterThanOrEqual(60);
      expect(result.score).toBeLessThan(80);
      expect(result.status).toBe('Healthy');

      RelationshipActivity.find.mockRestore();
    });

    it('should calculate Moderate status for low activity', async () => {
      const now = new Date();
      const recentDate = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000); // 20 days ago
      
      // 30 points for recency (within 30 days)
      // 10-20 points for frequency (1+ per month)
      // Some reciprocity
      const mockActivities = [
        { activityDate: recentDate, direction: 'Outbound', valueExchange: 'None', opportunityGenerated: false },
        { activityDate: recentDate, direction: 'Inbound', valueExchange: 'None', opportunityGenerated: false },
        { activityDate: recentDate, direction: 'Outbound', valueExchange: 'None', opportunityGenerated: false },
        { activityDate: recentDate, direction: 'Outbound', valueExchange: 'None', opportunityGenerated: false },
        { activityDate: recentDate, direction: 'Outbound', valueExchange: 'None', opportunityGenerated: false },
        { activityDate: recentDate, direction: 'Outbound', valueExchange: 'None', opportunityGenerated: false }
      ];

      jest.spyOn(RelationshipActivity, 'find').mockResolvedValue(mockActivities);

      const result = await RelationshipActivity.calculateRelationshipHealth('user_123', new mongoose.Types.ObjectId());

      expect(result.score).toBeGreaterThanOrEqual(40);
      expect(result.score).toBeLessThan(60);
      expect(result.status).toBe('Moderate');

      RelationshipActivity.find.mockRestore();
    });

    it('should calculate Weak status for minimal activity', async () => {
      const now = new Date();
      const oldDate = new Date(now.getTime() - 50 * 24 * 60 * 60 * 1000); // 50 days ago
      
      // 20 points for recency (within 60 days)
      // 10 points for frequency (1 per month)
      // Minimal reciprocity = some points
      const mockActivities = [
        { activityDate: oldDate, direction: 'Outbound', valueExchange: 'None', opportunityGenerated: false },
        { activityDate: oldDate, direction: 'Inbound', valueExchange: 'None', opportunityGenerated: false },
        { activityDate: oldDate, direction: 'Outbound', valueExchange: 'None', opportunityGenerated: false },
        { activityDate: oldDate, direction: 'Outbound', valueExchange: 'None', opportunityGenerated: false }
      ];

      jest.spyOn(RelationshipActivity, 'find').mockResolvedValue(mockActivities);

      const result = await RelationshipActivity.calculateRelationshipHealth('user_123', new mongoose.Types.ObjectId());

      expect(result.score).toBeGreaterThanOrEqual(20);
      expect(result.score).toBeLessThan(40);
      expect(result.status).toBe('Weak');

      RelationshipActivity.find.mockRestore();
    });

    it('should calculate Inactive status for very old activity', async () => {
      const now = new Date();
      const veryOldDate = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000); // 120 days ago
      
      const mockActivities = [
        { activityDate: veryOldDate, direction: 'Outbound', valueExchange: 'None', opportunityGenerated: false }
      ];

      jest.spyOn(RelationshipActivity, 'find').mockResolvedValue(mockActivities);

      const result = await RelationshipActivity.calculateRelationshipHealth('user_123', new mongoose.Types.ObjectId());

      expect(result.score).toBeLessThan(20);
      expect(result.status).toBe('Inactive');

      RelationshipActivity.find.mockRestore();
    });

    it('should handle reciprocity calculation correctly', async () => {
      const now = new Date();
      const recentDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
      
      // Equal inbound and outbound
      const mockActivities = [
        { activityDate: recentDate, direction: 'Outbound', valueExchange: 'None', opportunityGenerated: false },
        { activityDate: recentDate, direction: 'Outbound', valueExchange: 'None', opportunityGenerated: false },
        { activityDate: recentDate, direction: 'Inbound', valueExchange: 'None', opportunityGenerated: false },
        { activityDate: recentDate, direction: 'Inbound', valueExchange: 'None', opportunityGenerated: false }
      ];

      jest.spyOn(RelationshipActivity, 'find').mockResolvedValue(mockActivities);

      const result = await RelationshipActivity.calculateRelationshipHealth('user_123', new mongoose.Types.ObjectId());

      expect(result.reciprocity).toBe(100); // Perfect reciprocity

      RelationshipActivity.find.mockRestore();
    });

    it('should handle value exchange calculation correctly', async () => {
      const now = new Date();
      const recentDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
      
      const mockActivities = [
        { activityDate: recentDate, direction: 'Outbound', valueExchange: 'Given', opportunityGenerated: false },
        { activityDate: recentDate, direction: 'Outbound', valueExchange: 'Received', opportunityGenerated: false },
        { activityDate: recentDate, direction: 'Outbound', valueExchange: 'None', opportunityGenerated: false },
        { activityDate: recentDate, direction: 'Outbound', valueExchange: 'None', opportunityGenerated: false }
      ];

      jest.spyOn(RelationshipActivity, 'find').mockResolvedValue(mockActivities);

      const result = await RelationshipActivity.calculateRelationshipHealth('user_123', new mongoose.Types.ObjectId());

      expect(result.valueExchange).toBe(50); // 2 out of 4 have value exchange

      RelationshipActivity.find.mockRestore();
    });
  });

  describe('Indexes', () => {
    it('should have proper schema indexes defined', () => {
      const indexes = RelationshipActivity.schema.indexes();
      
      // Check if indexes exist
      expect(indexes).toBeDefined();
      expect(indexes.length).toBeGreaterThan(0);
    });
  });
});
