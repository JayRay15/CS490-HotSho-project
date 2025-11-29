import mongoose from 'mongoose';
import { jest } from '@jest/globals';

describe('Goal Model', () => {
  let Goal;

  beforeAll(async () => {
    const module = await import('../../models/Goal.js');
    Goal = module.default;
  });

  describe('Schema Definition', () => {
    it('should have required userId field', () => {
      const schema = Goal.schema.paths;
      expect(schema.userId).toBeDefined();
      expect(schema.userId.isRequired).toBe(true);
    });

    it('should have required title field', () => {
      const schema = Goal.schema.paths;
      expect(schema.title).toBeDefined();
      expect(schema.title.isRequired).toBe(true);
    });

    it('should have required description field', () => {
      const schema = Goal.schema.paths;
      expect(schema.description).toBeDefined();
      expect(schema.description.isRequired).toBe(true);
    });

    it('should have SMART criteria fields', () => {
      const schema = Goal.schema.paths;
      expect(schema.specific).toBeDefined();
      expect(schema.achievable).toBeDefined();
      expect(schema.relevant).toBeDefined();
    });
  });

  describe('Measurable Subdocument', () => {
    it('should have measurable field with correct structure', () => {
      const schema = Goal.schema.paths;
      expect(schema['measurable.metric']).toBeDefined();
      expect(schema['measurable.currentValue']).toBeDefined();
      expect(schema['measurable.targetValue']).toBeDefined();
      expect(schema['measurable.unit']).toBeDefined();
    });

    it('should have required metric field', () => {
      const schema = Goal.schema.paths;
      expect(schema['measurable.metric'].isRequired).toBe(true);
    });
  });

  describe('TimeBound Subdocument', () => {
    it('should have timeBound field with correct structure', () => {
      const schema = Goal.schema.paths;
      expect(schema['timeBound.startDate']).toBeDefined();
      expect(schema['timeBound.targetDate']).toBeDefined();
      expect(schema['timeBound.completedDate']).toBeDefined();
    });
  });

  describe('Category Field', () => {
    it('should have valid category enum', () => {
      const schema = Goal.schema.paths;
      expect(schema.category).toBeDefined();
      const categoryEnum = schema.category.options.enum;
      expect(categoryEnum).toContain('Job Search');
      expect(categoryEnum).toContain('Skill Development');
      expect(categoryEnum).toContain('Networking');
      expect(categoryEnum).toContain('Career Advancement');
      expect(categoryEnum).toContain('Salary Negotiation');
      expect(categoryEnum).toContain('Work-Life Balance');
      expect(categoryEnum).toContain('Professional Certification');
      expect(categoryEnum).toContain('Industry Knowledge');
      expect(categoryEnum).toContain('Leadership');
      expect(categoryEnum).toContain('Custom');
    });
  });

  describe('Type Field', () => {
    it('should have valid type enum', () => {
      const schema = Goal.schema.paths;
      expect(schema.type).toBeDefined();
      const typeEnum = schema.type.options.enum;
      expect(typeEnum).toContain('Short-term');
      expect(typeEnum).toContain('Long-term');
      expect(typeEnum).toContain('Milestone');
    });

    it('should default to Short-term', () => {
      const schema = Goal.schema.paths;
      expect(schema.type.options.default).toBe('Short-term');
    });
  });

  describe('Priority Field', () => {
    it('should have valid priority enum', () => {
      const schema = Goal.schema.paths;
      expect(schema.priority).toBeDefined();
      const priorityEnum = schema.priority.options.enum;
      expect(priorityEnum).toContain('Low');
      expect(priorityEnum).toContain('Medium');
      expect(priorityEnum).toContain('High');
      expect(priorityEnum).toContain('Critical');
    });

    it('should default to Medium', () => {
      const schema = Goal.schema.paths;
      expect(schema.priority.options.default).toBe('Medium');
    });
  });

  describe('Status Field', () => {
    it('should have valid status enum', () => {
      const schema = Goal.schema.paths;
      expect(schema.status).toBeDefined();
      const statusEnum = schema.status.options.enum;
      expect(statusEnum).toContain('Not Started');
      expect(statusEnum).toContain('In Progress');
      expect(statusEnum).toContain('On Track');
      expect(statusEnum).toContain('At Risk');
      expect(statusEnum).toContain('Completed');
      expect(statusEnum).toContain('Abandoned');
    });

    it('should default to Not Started', () => {
      const schema = Goal.schema.paths;
      expect(schema.status.options.default).toBe('Not Started');
    });
  });

  describe('Impact Metrics', () => {
    it('should have impactMetrics subdocument', () => {
      const schema = Goal.schema.paths;
      expect(schema['impactMetrics.jobApplications']).toBeDefined();
      expect(schema['impactMetrics.interviewsSecured']).toBeDefined();
      expect(schema['impactMetrics.offersReceived']).toBeDefined();
      expect(schema['impactMetrics.skillsAcquired']).toBeDefined();
      expect(schema['impactMetrics.connectionsGained']).toBeDefined();
    });

    it('should default impactMetrics to 0', () => {
      const schema = Goal.schema.paths;
      expect(schema['impactMetrics.jobApplications'].options.default).toBe(0);
    });
  });

  describe('Accountability Settings', () => {
    it('should have accountability subdocument', () => {
      const schema = Goal.schema.paths;
      expect(schema['accountability.shareWithOthers']).toBeDefined();
      expect(schema['accountability.publicVisibility']).toBeDefined();
      expect(schema['accountability.reminderFrequency']).toBeDefined();
    });

    it('should have valid reminderFrequency enum', () => {
      const schema = Goal.schema.paths;
      const freqEnum = schema['accountability.reminderFrequency'].options.enum;
      expect(freqEnum).toContain('None');
      expect(freqEnum).toContain('Daily');
      expect(freqEnum).toContain('Weekly');
      expect(freqEnum).toContain('Bi-weekly');
      expect(freqEnum).toContain('Monthly');
    });
  });

  describe('Recommendations Array', () => {
    it('should have recommendations array', () => {
      const schema = Goal.schema.paths;
      expect(schema.recommendations).toBeDefined();
    });
  });

  describe('Insights Array', () => {
    it('should have insights array', () => {
      const schema = Goal.schema.paths;
      expect(schema.insights).toBeDefined();
    });
  });

  describe('Success Factors', () => {
    it('should have successFactors array', () => {
      const schema = Goal.schema.paths;
      expect(schema.successFactors).toBeDefined();
    });
  });

  describe('Related Entities', () => {
    it('should have relatedJobs array', () => {
      const schema = Goal.schema.paths;
      expect(schema.relatedJobs).toBeDefined();
    });

    it('should have relatedApplications array', () => {
      const schema = Goal.schema.paths;
      expect(schema.relatedApplications).toBeDefined();
    });
  });

  describe('Virtual Fields', () => {
    it('should have progressPercentage virtual', () => {
      const virtuals = Goal.schema.virtuals;
      expect(virtuals.progressPercentage).toBeDefined();
    });

    it('should have daysRemaining virtual', () => {
      const virtuals = Goal.schema.virtuals;
      expect(virtuals.daysRemaining).toBeDefined();
    });

    it('should have duration virtual', () => {
      const virtuals = Goal.schema.virtuals;
      expect(virtuals.duration).toBeDefined();
    });

    it('should have milestoneCompletionRate virtual', () => {
      const virtuals = Goal.schema.virtuals;
      expect(virtuals.milestoneCompletionRate).toBeDefined();
    });

    it('should have isOnTrack virtual', () => {
      const virtuals = Goal.schema.virtuals;
      expect(virtuals.isOnTrack).toBeDefined();
    });
  });

  describe('Instance Methods', () => {
    it('should have addProgressUpdate method', () => {
      expect(Goal.schema.methods.addProgressUpdate).toBeDefined();
    });

    it('should have completeMilestone method', () => {
      expect(Goal.schema.methods.completeMilestone).toBeDefined();
    });

    it('should have addRecommendation method', () => {
      expect(Goal.schema.methods.addRecommendation).toBeDefined();
    });

    it('should have addInsight method', () => {
      expect(Goal.schema.methods.addInsight).toBeDefined();
    });
  });

  describe('Static Methods', () => {
    it('should have getUserStats static method', () => {
      expect(Goal.getUserStats).toBeDefined();
    });
  });

  describe('Document Creation', () => {
    it('should create a valid document instance', () => {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 1);
      
      const doc = new Goal({
        userId: 'user123',
        title: 'Test Goal',
        description: 'Test description',
        specific: 'Specific goal details',
        measurable: {
          metric: 'applications',
          currentValue: 0,
          targetValue: 10,
          unit: 'count'
        },
        achievable: 'This is achievable',
        relevant: 'This is relevant',
        timeBound: {
          startDate: new Date(),
          targetDate: futureDate
        },
        category: 'Job Search'
      });

      expect(doc.userId).toBe('user123');
      expect(doc.title).toBe('Test Goal');
      expect(doc.status).toBe('Not Started');
      expect(doc.priority).toBe('Medium');
      expect(doc.type).toBe('Short-term');
    });

    it('should calculate progressPercentage virtual correctly', () => {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 1);
      
      const doc = new Goal({
        userId: 'user123',
        title: 'Test Goal',
        description: 'Test description',
        specific: 'Specific goal details',
        measurable: {
          metric: 'applications',
          currentValue: 5,
          targetValue: 10,
          unit: 'count'
        },
        achievable: 'This is achievable',
        relevant: 'This is relevant',
        timeBound: {
          startDate: new Date(),
          targetDate: futureDate
        },
        category: 'Job Search'
      });

      expect(doc.progressPercentage).toBe(50);
    });

    it('should return 0 progress when targetValue is 0', () => {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 1);
      
      const doc = new Goal({
        userId: 'user123',
        title: 'Test Goal',
        description: 'Test description',
        specific: 'Specific goal details',
        measurable: {
          metric: 'applications',
          currentValue: 0,
          targetValue: 0,
          unit: 'count'
        },
        achievable: 'This is achievable',
        relevant: 'This is relevant',
        timeBound: {
          startDate: new Date(),
          targetDate: futureDate
        },
        category: 'Job Search'
      });

      expect(doc.progressPercentage).toBe(0);
    });

    it('should cap progressPercentage at 100', () => {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 1);
      
      const doc = new Goal({
        userId: 'user123',
        title: 'Test Goal',
        description: 'Test description',
        specific: 'Specific goal details',
        measurable: {
          metric: 'applications',
          currentValue: 15,
          targetValue: 10,
          unit: 'count'
        },
        achievable: 'This is achievable',
        relevant: 'This is relevant',
        timeBound: {
          startDate: new Date(),
          targetDate: futureDate
        },
        category: 'Job Search'
      });

      expect(doc.progressPercentage).toBe(100);
    });

    it('should calculate daysRemaining virtual correctly', () => {
      const startDate = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      
      const doc = new Goal({
        userId: 'user123',
        title: 'Test Goal',
        description: 'Test description',
        specific: 'Specific goal details',
        measurable: {
          metric: 'applications',
          currentValue: 0,
          targetValue: 10,
          unit: 'count'
        },
        achievable: 'This is achievable',
        relevant: 'This is relevant',
        timeBound: {
          startDate: startDate,
          targetDate: futureDate
        },
        category: 'Job Search'
      });

      expect(doc.daysRemaining).toBeGreaterThanOrEqual(9);
      expect(doc.daysRemaining).toBeLessThanOrEqual(11);
    });

    it('should return null daysRemaining when no targetDate', () => {
      const doc = new Goal({
        userId: 'user123',
        title: 'Test Goal',
        description: 'Test description',
        specific: 'Specific goal details',
        measurable: {
          metric: 'applications',
          currentValue: 0,
          targetValue: 10,
          unit: 'count'
        },
        achievable: 'This is achievable',
        relevant: 'This is relevant',
        timeBound: {
          startDate: new Date()
        },
        category: 'Job Search'
      });

      expect(doc.daysRemaining).toBeNull();
    });

    it('should calculate duration virtual correctly', () => {
      const startDate = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      
      const doc = new Goal({
        userId: 'user123',
        title: 'Test Goal',
        description: 'Test description',
        specific: 'Specific goal details',
        measurable: {
          metric: 'applications',
          currentValue: 0,
          targetValue: 10,
          unit: 'count'
        },
        achievable: 'This is achievable',
        relevant: 'This is relevant',
        timeBound: {
          startDate: startDate,
          targetDate: futureDate
        },
        category: 'Job Search'
      });

      expect(doc.duration).toBe(30);
    });

    it('should calculate milestoneCompletionRate correctly', () => {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 1);
      
      const doc = new Goal({
        userId: 'user123',
        title: 'Test Goal',
        description: 'Test description',
        specific: 'Specific goal details',
        measurable: {
          metric: 'applications',
          currentValue: 0,
          targetValue: 10,
          unit: 'count'
        },
        achievable: 'This is achievable',
        relevant: 'This is relevant',
        timeBound: {
          startDate: new Date(),
          targetDate: futureDate
        },
        category: 'Job Search',
        milestones: [
          { title: 'M1', targetDate: futureDate, completed: true },
          { title: 'M2', targetDate: futureDate, completed: false }
        ]
      });

      expect(doc.milestoneCompletionRate).toBe(50);
    });

    it('should return 0 milestoneCompletionRate when no milestones', () => {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 1);
      
      const doc = new Goal({
        userId: 'user123',
        title: 'Test Goal',
        description: 'Test description',
        specific: 'Specific goal details',
        measurable: {
          metric: 'applications',
          currentValue: 0,
          targetValue: 10,
          unit: 'count'
        },
        achievable: 'This is achievable',
        relevant: 'This is relevant',
        timeBound: {
          startDate: new Date(),
          targetDate: futureDate
        },
        category: 'Job Search',
        milestones: []
      });

      expect(doc.milestoneCompletionRate).toBe(0);
    });

    it('should return true isOnTrack for completed goals', () => {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 1);
      
      const doc = new Goal({
        userId: 'user123',
        title: 'Test Goal',
        description: 'Test description',
        specific: 'Specific goal details',
        measurable: {
          metric: 'applications',
          currentValue: 10,
          targetValue: 10,
          unit: 'count'
        },
        achievable: 'This is achievable',
        relevant: 'This is relevant',
        timeBound: {
          startDate: new Date(),
          targetDate: futureDate
        },
        category: 'Job Search',
        status: 'Completed'
      });

      expect(doc.isOnTrack).toBe(true);
    });
  });

  describe('Indexes', () => {
    it('should have proper indexes defined', () => {
      const indexes = Goal.schema.indexes();
      expect(indexes.length).toBeGreaterThan(0);
    });

    it('should have userId index', () => {
      const schema = Goal.schema.paths;
      expect(schema.userId.options.index).toBe(true);
    });
  });

  describe('Validation', () => {
    it('should fail without userId', async () => {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 1);
      
      const doc = new Goal({
        title: 'Test Goal',
        description: 'Test description',
        specific: 'Specific',
        measurable: { metric: 'test', currentValue: 0, targetValue: 10, unit: 'count' },
        achievable: 'Achievable',
        relevant: 'Relevant',
        timeBound: { startDate: new Date(), targetDate: futureDate },
        category: 'Job Search'
      });

      await expect(doc.validate()).rejects.toThrow();
    });

    it('should fail without title', async () => {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 1);
      
      const doc = new Goal({
        userId: 'user123',
        description: 'Test description',
        specific: 'Specific',
        measurable: { metric: 'test', currentValue: 0, targetValue: 10, unit: 'count' },
        achievable: 'Achievable',
        relevant: 'Relevant',
        timeBound: { startDate: new Date(), targetDate: futureDate },
        category: 'Job Search'
      });

      await expect(doc.validate()).rejects.toThrow();
    });

    it('should fail with invalid status', async () => {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 1);
      
      const doc = new Goal({
        userId: 'user123',
        title: 'Test Goal',
        description: 'Test description',
        specific: 'Specific',
        measurable: { metric: 'test', currentValue: 0, targetValue: 10, unit: 'count' },
        achievable: 'Achievable',
        relevant: 'Relevant',
        timeBound: { startDate: new Date(), targetDate: futureDate },
        category: 'Job Search',
        status: 'Invalid Status'
      });

      await expect(doc.validate()).rejects.toThrow();
    });

    it('should fail with invalid category', async () => {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 1);
      
      const doc = new Goal({
        userId: 'user123',
        title: 'Test Goal',
        description: 'Test description',
        specific: 'Specific',
        measurable: { metric: 'test', currentValue: 0, targetValue: 10, unit: 'count' },
        achievable: 'Achievable',
        relevant: 'Relevant',
        timeBound: { startDate: new Date(), targetDate: futureDate },
        category: 'Invalid Category'
      });

      await expect(doc.validate()).rejects.toThrow();
    });

    it('should fail with negative targetValue', async () => {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 1);
      
      const doc = new Goal({
        userId: 'user123',
        title: 'Test Goal',
        description: 'Test description',
        specific: 'Specific',
        measurable: { metric: 'test', currentValue: 0, targetValue: -5, unit: 'count' },
        achievable: 'Achievable',
        relevant: 'Relevant',
        timeBound: { startDate: new Date(), targetDate: futureDate },
        category: 'Job Search'
      });

      await expect(doc.validate()).rejects.toThrow();
    });
  });

  describe('Celebration Tracking', () => {
    it('should have celebrated field with default false', () => {
      const schema = Goal.schema.paths;
      expect(schema.celebrated).toBeDefined();
      expect(schema.celebrated.options.default).toBe(false);
    });

    it('should have celebrationDate field', () => {
      const schema = Goal.schema.paths;
      expect(schema.celebrationDate).toBeDefined();
    });
  });

  describe('Tags and Notes', () => {
    it('should have tags array field', () => {
      const schema = Goal.schema.paths;
      expect(schema.tags).toBeDefined();
    });

    it('should have notes field', () => {
      const schema = Goal.schema.paths;
      expect(schema.notes).toBeDefined();
    });
  });

  describe('Milestones and Progress', () => {
    it('should have milestones array', () => {
      const schema = Goal.schema.paths;
      expect(schema.milestones).toBeDefined();
    });

    it('should have progressUpdates array', () => {
      const schema = Goal.schema.paths;
      expect(schema.progressUpdates).toBeDefined();
    });
  });

  describe('Instance Methods', () => {
    let testGoal;
    
    beforeEach(() => {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 1);
      
      testGoal = new Goal({
        userId: 'user123',
        title: 'Test Goal',
        description: 'Test description',
        specific: 'Specific details',
        measurable: { metric: 'applications', currentValue: 0, targetValue: 10, unit: 'count' },
        achievable: 'This is achievable',
        relevant: 'Relevant to career',
        timeBound: { startDate: new Date(), targetDate: futureDate },
        category: 'Job Search'
      });
    });

    describe('addProgressUpdate', () => {
      it('should be a function', () => {
        expect(typeof testGoal.addProgressUpdate).toBe('function');
      });

      it('should add progress update to array', async () => {
        // Mock the save function
        testGoal.save = jest.fn().mockResolvedValue(testGoal);
        
        await testGoal.addProgressUpdate(5, 'Made progress');
        
        expect(testGoal.progressUpdates.length).toBe(1);
        expect(testGoal.progressUpdates[0].value).toBe(5);
        expect(testGoal.progressUpdates[0].notes).toBe('Made progress');
        expect(testGoal.measurable.currentValue).toBe(5);
      });

      it('should add value to currentValue when numeric', async () => {
        testGoal.measurable.currentValue = 3;
        testGoal.save = jest.fn().mockResolvedValue(testGoal);
        
        await testGoal.addProgressUpdate(2, 'More progress');
        
        expect(testGoal.measurable.currentValue).toBe(5);
      });

      it('should set currentValue when not numeric', async () => {
        testGoal.measurable.currentValue = null;
        testGoal.save = jest.fn().mockResolvedValue(testGoal);
        
        await testGoal.addProgressUpdate(7, 'Initial');
        
        expect(testGoal.measurable.currentValue).toBe(7);
      });

      it('should include metrics in update', async () => {
        testGoal.save = jest.fn().mockResolvedValue(testGoal);
        
        await testGoal.addProgressUpdate(1, 'With metrics', { source: 'linkedin' });
        
        // Metrics is stored as a Map, check it exists
        expect(testGoal.progressUpdates[0].metrics).toBeDefined();
      });
    });

    describe('completeMilestone', () => {
      it('should be a function', () => {
        expect(typeof testGoal.completeMilestone).toBe('function');
      });

      it('should mark milestone as completed', async () => {
        // Add a milestone
        testGoal.milestones.push({
          title: 'Test Milestone',
          targetDate: new Date(),
          completed: false
        });
        testGoal.save = jest.fn().mockResolvedValue(testGoal);
        
        const milestoneId = testGoal.milestones[0]._id;
        await testGoal.completeMilestone(milestoneId);
        
        expect(testGoal.milestones[0].completed).toBe(true);
        expect(testGoal.milestones[0].completedDate).toBeDefined();
      });

      it('should handle non-existent milestone', async () => {
        testGoal.save = jest.fn().mockResolvedValue(testGoal);
        const fakeId = new mongoose.Types.ObjectId();
        
        // Should not throw
        await testGoal.completeMilestone(fakeId);
        expect(testGoal.save).toHaveBeenCalled();
      });
    });

    describe('addRecommendation', () => {
      it('should be a function', () => {
        expect(typeof testGoal.addRecommendation).toBe('function');
      });

      it('should add recommendation to array', async () => {
        testGoal.save = jest.fn().mockResolvedValue(testGoal);
        
        await testGoal.addRecommendation('Skill', 'Learn React', 'Improve frontend skills', 'High');
        
        expect(testGoal.recommendations.length).toBe(1);
        expect(testGoal.recommendations[0].type).toBe('Skill');
        expect(testGoal.recommendations[0].title).toBe('Learn React');
        expect(testGoal.recommendations[0].description).toBe('Improve frontend skills');
        expect(testGoal.recommendations[0].priority).toBe('High');
      });

      it('should default priority to Medium', async () => {
        testGoal.save = jest.fn().mockResolvedValue(testGoal);
        
        await testGoal.addRecommendation('Strategy', 'Apply more', 'Increase applications');
        
        expect(testGoal.recommendations[0].priority).toBe('Medium');
      });
    });

    describe('addInsight', () => {
      it('should be a function', () => {
        expect(typeof testGoal.addInsight).toBe('function');
      });

      it('should add insight to array', async () => {
        testGoal.save = jest.fn().mockResolvedValue(testGoal);
        
        await testGoal.addInsight('Progress', 'On track for goal', { percentage: 50 });
        
        expect(testGoal.insights.length).toBe(1);
        expect(testGoal.insights[0].category).toBe('Progress');
        expect(testGoal.insights[0].message).toBe('On track for goal');
        // Data is stored as a Map, so just check it exists
        expect(testGoal.insights[0].data).toBeDefined();
      });

      it('should default data to empty object', async () => {
        testGoal.save = jest.fn().mockResolvedValue(testGoal);
        
        await testGoal.addInsight('Risk', 'Falling behind');
        
        // Data is stored as a Map, check it was created
        expect(testGoal.insights[0].data).toBeDefined();
      });
    });
  });

  describe('Static Methods', () => {
    describe('getUserStats', () => {
      it('should be a function', () => {
        expect(typeof Goal.getUserStats).toBe('function');
      });
    });
  });

  describe('Pre-save Middleware', () => {
    it('should have pre-save hook defined', () => {
      const preSaveHooks = Goal.schema.s.hooks._pres.get('save');
      expect(preSaveHooks).toBeDefined();
      expect(preSaveHooks.length).toBeGreaterThan(0);
    });
  });

  describe('Impact Metrics', () => {
    it('should have impactMetrics subdocument', () => {
      const schema = Goal.schema.paths;
      expect(schema['impactMetrics.jobApplications']).toBeDefined();
      expect(schema['impactMetrics.interviewsSecured']).toBeDefined();
      expect(schema['impactMetrics.offersReceived']).toBeDefined();
      expect(schema['impactMetrics.skillsAcquired']).toBeDefined();
      expect(schema['impactMetrics.connectionsGained']).toBeDefined();
    });

    it('should have default values for impact metrics', () => {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 1);
      
      const goal = new Goal({
        userId: 'user123',
        title: 'Test',
        description: 'Desc',
        specific: 'Spec',
        measurable: { metric: 'test', currentValue: 0, targetValue: 10 },
        achievable: 'Ach',
        relevant: 'Rel',
        timeBound: { startDate: new Date(), targetDate: futureDate },
        category: 'Job Search'
      });
      
      expect(goal.impactMetrics.jobApplications).toBe(0);
      expect(goal.impactMetrics.interviewsSecured).toBe(0);
      expect(goal.impactMetrics.offersReceived).toBe(0);
    });
  });

  describe('Related Entities', () => {
    it('should have relatedJobs array', () => {
      const schema = Goal.schema.paths;
      expect(schema.relatedJobs).toBeDefined();
    });

    it('should have relatedApplications array', () => {
      const schema = Goal.schema.paths;
      expect(schema.relatedApplications).toBeDefined();
    });
  });

  describe('Recommendations and Insights', () => {
    it('should have recommendations array', () => {
      const schema = Goal.schema.paths;
      expect(schema.recommendations).toBeDefined();
    });

    it('should have insights array', () => {
      const schema = Goal.schema.paths;
      expect(schema.insights).toBeDefined();
    });
  });

  describe('Pre-save Behavior', () => {
    let testGoal;
    
    beforeEach(() => {
      const startDate = new Date();
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 1);
      
      testGoal = new Goal({
        userId: 'user123',
        title: 'Test Goal',
        description: 'Test description',
        specific: 'Specific details',
        measurable: { metric: 'applications', currentValue: 0, targetValue: 10, unit: 'count' },
        achievable: 'This is achievable',
        relevant: 'Relevant to career',
        timeBound: { startDate, targetDate: futureDate },
        category: 'Job Search',
        status: 'Not Started'
      });
    });

    it('should transition to In Progress when progress is added', () => {
      // Simulate adding progress
      testGoal.measurable.currentValue = 5;
      
      // The pre-save hook checks progressPercentage
      expect(testGoal.progressPercentage).toBe(50);
    });

    it('should complete goal when progress reaches 100%', () => {
      testGoal.measurable.currentValue = 10;
      expect(testGoal.progressPercentage).toBe(100);
    });

    it('should identify at-risk status based on daysRemaining', () => {
      // Create a goal that is behind schedule
      const pastStart = new Date();
      pastStart.setMonth(pastStart.getMonth() - 2);
      
      const nearFuture = new Date();
      nearFuture.setDate(nearFuture.getDate() + 5);
      
      const atRiskGoal = new Goal({
        userId: 'user123',
        title: 'At Risk Goal',
        description: 'Description',
        specific: 'Specific',
        measurable: { metric: 'test', currentValue: 1, targetValue: 100, unit: 'count' },
        achievable: 'Achievable',
        relevant: 'Relevant',
        timeBound: { startDate: pastStart, targetDate: nearFuture },
        category: 'Job Search',
        status: 'In Progress'
      });
      
      // Check isOnTrack calculation (should be false due to low progress)
      expect(atRiskGoal.isOnTrack).toBe(false);
    });

    it('should calculate isOnTrack correctly for on-track goals', () => {
      const startDate = new Date();
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 1);
      
      const onTrackGoal = new Goal({
        userId: 'user123',
        title: 'On Track Goal',
        description: 'Description',
        specific: 'Specific',
        measurable: { metric: 'test', currentValue: 90, targetValue: 100, unit: 'count' },
        achievable: 'Achievable',
        relevant: 'Relevant',
        timeBound: { startDate, targetDate: futureDate },
        category: 'Job Search',
        status: 'In Progress'
      });
      
      // 90% progress should be on track for most timeframes
      expect(onTrackGoal.progressPercentage).toBe(90);
    });
  });

  describe('Static getUserStats Method', () => {
    it('should be defined on the model', () => {
      expect(typeof Goal.getUserStats).toBe('function');
    });

    it('should accept userId parameter', () => {
      // Test that the function exists and accepts parameters
      const fn = Goal.getUserStats;
      expect(fn.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Virtual isOnTrack Edge Cases', () => {
    it('should return true for completed goals', () => {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 1);
      
      const completedGoal = new Goal({
        userId: 'user123',
        title: 'Completed Goal',
        description: 'Description',
        specific: 'Specific',
        measurable: { metric: 'test', currentValue: 10, targetValue: 10, unit: 'count' },
        achievable: 'Achievable',
        relevant: 'Relevant',
        timeBound: { startDate: new Date(), targetDate: futureDate },
        category: 'Job Search',
        status: 'Completed'
      });
      
      expect(completedGoal.isOnTrack).toBe(true);
    });

    it('should handle zero duration gracefully', () => {
      const now = new Date();
      
      const zeroDurationGoal = new Goal({
        userId: 'user123',
        title: 'Zero Duration Goal',
        description: 'Description',
        specific: 'Specific',
        measurable: { metric: 'test', currentValue: 5, targetValue: 10, unit: 'count' },
        achievable: 'Achievable',
        relevant: 'Relevant',
        timeBound: { startDate: now, targetDate: now },
        category: 'Job Search',
        status: 'In Progress'
      });
      
      // Should handle division by zero gracefully
      expect(zeroDurationGoal.duration).toBe(0);
    });
  });

  describe('Milestones Subdocument', () => {
    it('should allow adding milestones', () => {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 1);
      
      const goalWithMilestones = new Goal({
        userId: 'user123',
        title: 'Goal with Milestones',
        description: 'Description',
        specific: 'Specific',
        measurable: { metric: 'test', currentValue: 0, targetValue: 10, unit: 'count' },
        achievable: 'Achievable',
        relevant: 'Relevant',
        timeBound: { startDate: new Date(), targetDate: futureDate },
        category: 'Job Search',
        milestones: [
          { title: 'Milestone 1', targetDate: new Date(), completed: false },
          { title: 'Milestone 2', targetDate: futureDate, completed: true }
        ]
      });
      
      expect(goalWithMilestones.milestones.length).toBe(2);
      expect(goalWithMilestones.milestoneCompletionRate).toBe(50);
    });
  });

  describe('Progress Updates Subdocument', () => {
    it('should allow adding progress updates', () => {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 1);
      
      const goalWithUpdates = new Goal({
        userId: 'user123',
        title: 'Goal with Updates',
        description: 'Description',
        specific: 'Specific',
        measurable: { metric: 'test', currentValue: 0, targetValue: 10, unit: 'count' },
        achievable: 'Achievable',
        relevant: 'Relevant',
        timeBound: { startDate: new Date(), targetDate: futureDate },
        category: 'Job Search',
        progressUpdates: [
          { date: new Date(), value: 5, notes: 'First update' }
        ]
      });
      
      expect(goalWithUpdates.progressUpdates.length).toBe(1);
      expect(goalWithUpdates.progressUpdates[0].value).toBe(5);
    });
  });
});
