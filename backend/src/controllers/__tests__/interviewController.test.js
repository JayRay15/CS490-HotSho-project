import { jest, beforeEach, describe, it, expect } from '@jest/globals';

jest.resetModules();

// Mock dependencies
const mockInterview = {
  find: jest.fn(),
  findOne: jest.fn(),
  findOneAndDelete: jest.fn(),
  create: jest.fn(),
};

const mockJob = {
  findOne: jest.fn(),
  findById: jest.fn(),
};

const mockAsyncHandler = (fn) => fn;

jest.unstable_mockModule('../../models/Interview.js', () => ({
  Interview: mockInterview,
}));

jest.unstable_mockModule('../../models/Job.js', () => ({
  Job: mockJob,
}));

jest.unstable_mockModule('../../middleware/errorHandler.js', () => ({
  asyncHandler: mockAsyncHandler,
}));

// Import controller
const {
  getInterviews,
  getInterview,
  scheduleInterview,
  updateInterview,
  rescheduleInterview,
  cancelInterview,
  recordOutcome,
  confirmInterview,
  deleteInterview,
  getUpcomingInterviews,
  checkConflicts,
  updatePreparationTask,
  addPreparationTask,
  deletePreparationTask,
  generatePreparationTasks,
} = await import('../interviewController.js');

describe('InterviewController', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      auth: {
        userId: 'test-user-123',
        payload: { sub: 'test-user-123' },
      },
      body: {},
      params: {},
      query: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe('getInterviews', () => {
    it('should retrieve all interviews for user', async () => {
      const mockInterviews = [
        {
          _id: 'interview-1',
          title: 'Phone Screen',
          company: 'TechCorp',
          scheduledDate: new Date(),
          userId: 'test-user-123',
        },
      ];
      mockInterview.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockInterviews),
      });

      await getInterviews(mockReq, mockRes);

      expect(mockInterview.find).toHaveBeenCalledWith({ userId: 'test-user-123' });
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 401 if user not authenticated', async () => {
      mockReq.auth = null;
      mockReq.auth = {};

      await getInterviews(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should filter interviews by status', async () => {
      mockReq.query.status = 'Scheduled';
      mockInterview.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([]),
      });

      await getInterviews(mockReq, mockRes);

      expect(mockInterview.find).toHaveBeenCalledWith({
        userId: 'test-user-123',
        status: 'Scheduled',
      });
    });

    it('should filter interviews by date range', async () => {
      mockReq.query.from = '2024-01-01';
      mockReq.query.to = '2024-12-31';
      mockInterview.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([]),
      });

      await getInterviews(mockReq, mockRes);

      expect(mockInterview.find).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'test-user-123',
          scheduledDate: expect.objectContaining({
            $gte: expect.any(Date),
            $lte: expect.any(Date),
          }),
        })
      );
    });

    it('should filter interviews by jobId', async () => {
      mockReq.query.jobId = 'job-123';
      mockInterview.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([]),
      });

      await getInterviews(mockReq, mockRes);

      expect(mockInterview.find).toHaveBeenCalledWith({
        userId: 'test-user-123',
        jobId: 'job-123',
      });
    });
  });

  describe('getInterview', () => {
    it('should get single interview by id', async () => {
      mockReq.params.interviewId = 'interview-123';
      const mockInterviewDoc = {
        _id: 'interview-123',
        title: 'Phone Screen',
        userId: 'test-user-123',
      };
      mockInterview.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockInterviewDoc),
      });

      await getInterview(mockReq, mockRes);

      expect(mockInterview.findOne).toHaveBeenCalledWith({
        _id: 'interview-123',
        userId: 'test-user-123',
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 401 if user not authenticated', async () => {
      mockReq.params.interviewId = 'interview-123';
      mockReq.auth = null;

      await getInterview(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should return 404 if interview not found', async () => {
      mockReq.params.interviewId = 'non-existent';
      mockInterview.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await getInterview(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('scheduleInterview', () => {
    it('should schedule interview successfully', async () => {
      mockReq.body = {
        jobId: 'job-123',
        title: 'Phone Screen',
        company: 'TechCorp',
        interviewType: 'Phone',
        scheduledDate: '2024-12-31T10:00:00Z',
        duration: 60,
      };
      const mockJobDoc = {
        _id: 'job-123',
        userId: 'test-user-123',
      };
      const mockCreatedInterview = {
        _id: 'interview-123',
        ...mockReq.body,
        status: 'Scheduled',
        conflictWarning: {
          hasConflict: false,
          conflictDetails: '',
        },
        checkConflict: jest.fn().mockResolvedValue(true),
        generatePreparationTasks: jest.fn(),
        save: jest.fn().mockResolvedValue(true),
      };
      mockJob.findOne.mockResolvedValue(mockJobDoc);
      mockInterview.create.mockResolvedValue(mockCreatedInterview);

      await scheduleInterview(mockReq, mockRes);

      expect(mockInterview.create).toHaveBeenCalled();
      expect(mockCreatedInterview.checkConflict).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return validation error if required fields missing', async () => {
      mockReq.body = {
        jobId: 'job-123',
        // Missing title, company, scheduledDate, interviewType
      };

      await scheduleInterview(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errors: expect.arrayContaining([
            expect.objectContaining({ field: 'title' }),
            expect.objectContaining({ field: 'company' }),
            expect.objectContaining({ field: 'scheduledDate' }),
            expect.objectContaining({ field: 'interviewType' }),
          ]),
        })
      );
    });

    it('should return 404 if job not found', async () => {
      mockReq.body = {
        jobId: 'non-existent',
        title: 'Phone Screen',
        company: 'TechCorp',
        interviewType: 'Phone',
        scheduledDate: '2024-12-31T10:00:00Z',
      };
      mockJob.findOne.mockResolvedValue(null);

      await scheduleInterview(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updateInterview', () => {
    it('should update interview successfully', async () => {
      mockReq.params.interviewId = 'interview-123';
      mockReq.body = {
        notes: 'Updated notes',
        location: 'New location',
      };
      const mockInterviewDoc = {
        _id: 'interview-123',
        userId: 'test-user-123',
        history: [],
        save: jest.fn().mockResolvedValue(true),
      };
      mockInterview.findOne.mockResolvedValue(mockInterviewDoc);

      await updateInterview(mockReq, mockRes);

      expect(mockInterviewDoc.notes).toBe('Updated notes');
      expect(mockInterviewDoc.location).toBe('New location');
      expect(mockInterviewDoc.history.length).toBeGreaterThan(0);
      expect(mockInterviewDoc.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 401 if user not authenticated', async () => {
      mockReq.params.interviewId = 'interview-123';
      mockReq.auth = null;

      await updateInterview(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should return 404 if interview not found', async () => {
      mockReq.params.interviewId = 'non-existent';
      mockReq.body = { title: 'Updated' };
      mockInterview.findOne.mockResolvedValue(null);

      await updateInterview(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should only update allowed fields', async () => {
      mockReq.params.interviewId = 'interview-123';
      mockReq.body = {
        title: 'Updated Title',
        status: 'Completed', // Should not be updated via this endpoint
        scheduledDate: new Date(), // Should not be updated
      };
      const mockInterviewDoc = {
        _id: 'interview-123',
        userId: 'test-user-123',
        title: 'Original',
        status: 'Scheduled',
        scheduledDate: new Date('2024-01-01'),
        history: [],
        save: jest.fn().mockResolvedValue(true),
      };
      mockInterview.findOne.mockResolvedValue(mockInterviewDoc);

      await updateInterview(mockReq, mockRes);

      expect(mockInterviewDoc.title).toBe('Updated Title');
      expect(mockInterviewDoc.status).toBe('Scheduled'); // Should remain unchanged
    });
  });

  describe('rescheduleInterview', () => {
    it('should reschedule interview successfully', async () => {
      mockReq.params.interviewId = 'interview-123';
      mockReq.body = {
        newDate: '2025-01-15T10:00:00Z',
        reason: 'Conflict with another meeting',
      };
      const previousDate = new Date('2024-12-31T10:00:00Z');
      const mockInterviewDoc = {
        _id: 'interview-123',
        userId: 'test-user-123',
        scheduledDate: previousDate,
        status: 'Scheduled',
        history: [],
        preparationTasks: [],
        conflictWarning: {
          hasConflict: false,
          conflictDetails: '',
        },
        checkConflict: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true),
      };
      mockInterview.findOne.mockResolvedValue(mockInterviewDoc);

      await rescheduleInterview(mockReq, mockRes);

      expect(mockInterviewDoc.scheduledDate).toEqual(new Date('2025-01-15T10:00:00Z'));
      expect(mockInterviewDoc.status).toBe('Rescheduled');
      expect(mockInterviewDoc.history.length).toBeGreaterThan(0);
      expect(mockInterviewDoc.save).toHaveBeenCalled();
    });

    it('should return 400 if newDate is missing', async () => {
      mockReq.params.interviewId = 'interview-123';
      mockReq.body = {};

      await rescheduleInterview(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('cancelInterview', () => {
    it('should cancel interview successfully', async () => {
      mockReq.params.interviewId = 'interview-123';
      mockReq.body = {
        reason: 'Accepted another offer',
        cancelledBy: 'User',
      };
      const mockInterviewDoc = {
        _id: 'interview-123',
        userId: 'test-user-123',
        status: 'Scheduled',
        cancelled: { isCancelled: false },
        history: [],
        save: jest.fn().mockResolvedValue(true),
      };
      mockInterview.findOne.mockResolvedValue(mockInterviewDoc);

      await cancelInterview(mockReq, mockRes);

      expect(mockInterviewDoc.status).toBe('Cancelled');
      expect(mockInterviewDoc.cancelled.isCancelled).toBe(true);
      expect(mockInterviewDoc.cancelled.reason).toBe('Accepted another offer');
      expect(mockInterviewDoc.save).toHaveBeenCalled();
    });

    it('should return 400 if interview already cancelled', async () => {
      mockReq.params.interviewId = 'interview-123';
      const mockInterviewDoc = {
        _id: 'interview-123',
        userId: 'test-user-123',
        cancelled: { isCancelled: true },
      };
      mockInterview.findOne.mockResolvedValue(mockInterviewDoc);

      await cancelInterview(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 401 if user not authenticated', async () => {
      mockReq.params.interviewId = 'interview-123';
      mockReq.auth = null;

      await cancelInterview(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should return 404 if interview not found', async () => {
      mockReq.params.interviewId = 'non-existent';
      mockReq.body = { reason: 'Conflict' };
      mockInterview.findOne.mockResolvedValue(null);

      await cancelInterview(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('recordOutcome', () => {
    it('should record interview outcome successfully', async () => {
      mockReq.params.interviewId = 'interview-123';
      mockReq.body = {
        result: 'Moved to Next Round',
        notes: 'Great interview',
        feedback: 'Strong technical skills',
        rating: 5,
      };
      const mockInterviewDoc = {
        _id: 'interview-123',
        userId: 'test-user-123',
        jobId: 'job-123',
        status: 'Scheduled',
        history: [],
        save: jest.fn().mockResolvedValue(true),
      };
      const mockJobDoc = {
        _id: 'job-123',
        userId: 'test-user-123',
        status: 'Applied',
        interviewNotes: '',
        save: jest.fn().mockResolvedValue(true),
      };
      mockInterview.findOne.mockResolvedValue(mockInterviewDoc);
      mockJob.findById.mockResolvedValue(mockJobDoc);

      await recordOutcome(mockReq, mockRes);

      expect(mockInterviewDoc.outcome.result).toBe('Moved to Next Round');
      expect(mockInterviewDoc.status).toBe('Completed');
      expect(mockJobDoc.status).toBe('Interview');
      expect(mockInterviewDoc.save).toHaveBeenCalled();
      expect(mockJobDoc.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should update job status when offer extended', async () => {
      mockReq.params.interviewId = 'interview-123';
      mockReq.body = {
        result: 'Offer Extended',
        notes: 'Congratulations!',
      };
      const mockInterviewDoc = {
        _id: 'interview-123',
        userId: 'test-user-123',
        jobId: 'job-123',
        title: 'Final Interview',
        status: 'Scheduled',
        outcome: {},
        history: [],
        save: jest.fn().mockResolvedValue(true),
      };
      const mockJobDoc = {
        _id: 'job-123',
        userId: 'test-user-123',
        status: 'Interview',
        interviewNotes: '',
        save: jest.fn().mockResolvedValue(true),
      };
      mockInterview.findOne.mockResolvedValue(mockInterviewDoc);
      mockJob.findById.mockResolvedValue(mockJobDoc);

      await recordOutcome(mockReq, mockRes);

      expect(mockJobDoc.status).toBe('Offer');
      expect(mockJobDoc.save).toHaveBeenCalled();
    });

    it('should return 401 if user not authenticated', async () => {
      mockReq.params.interviewId = 'interview-123';
      mockReq.auth = null;

      await recordOutcome(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should return 404 if interview not found', async () => {
      mockReq.params.interviewId = 'non-existent';
      mockReq.body = { result: 'Passed' };
      mockInterview.findOne.mockResolvedValue(null);

      await recordOutcome(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 if result is missing', async () => {
      mockReq.params.interviewId = 'interview-123';
      mockReq.body = { notes: 'Some notes' };

      await recordOutcome(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getUpcomingInterviews', () => {
    it('should get upcoming interviews within specified days', async () => {
      mockReq.query.days = '7';
      const mockInterviews = [
        {
          _id: 'interview-1',
          scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          status: 'Scheduled',
        },
      ];
      mockInterview.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockInterviews),
      });

      await getUpcomingInterviews(mockReq, mockRes);

      expect(mockInterview.find).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'test-user-123',
          scheduledDate: expect.objectContaining({
            $gte: expect.any(Date),
            $lte: expect.any(Date),
          }),
          status: { $in: ['Scheduled', 'Confirmed', 'Rescheduled'] },
        })
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('checkConflicts', () => {
    it('should check for interview conflicts', async () => {
      mockReq.query = {
        date: '2024-12-31T10:00:00Z',
        duration: 60,
      };
      const mockConflicts = [
        {
          _id: 'interview-1',
          scheduledDate: new Date('2024-12-31T10:30:00Z'),
        },
      ];
      mockInterview.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockConflicts),
      });

      await checkConflicts(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            hasConflicts: true,
            conflicts: mockConflicts,
          }),
        })
      );
    });

    it('should return 400 if date is missing', async () => {
      mockReq.query = { duration: 60 };

      await checkConflicts(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should exclude interview ID when checking conflicts', async () => {
      mockReq.query.date = '2024-12-31T10:00:00Z';
      mockReq.query.duration = '60';
      mockReq.query.excludeId = 'interview-123';
      mockInterview.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([]),
      });

      await checkConflicts(mockReq, mockRes);

      expect(mockInterview.find).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: { $ne: 'interview-123' },
        })
      );
    });

    it('should return 401 if user not authenticated', async () => {
      mockReq.auth = null;
      mockReq.query = { date: '2024-12-31T10:00:00Z' };

      await checkConflicts(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('deleteInterview', () => {
    it('should delete interview successfully', async () => {
      mockReq.params.interviewId = 'interview-123';
      const mockDeletedInterview = {
        _id: 'interview-123',
        title: 'Phone Screen',
      };
      mockInterview.findOneAndDelete.mockResolvedValue(mockDeletedInterview);

      await deleteInterview(mockReq, mockRes);

      expect(mockInterview.findOneAndDelete).toHaveBeenCalledWith({
        _id: 'interview-123',
        userId: 'test-user-123',
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if interview not found', async () => {
      mockReq.params.interviewId = 'non-existent';
      mockInterview.findOneAndDelete.mockResolvedValue(null);

      await deleteInterview(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should return 401 if user not authenticated', async () => {
      mockReq.params.interviewId = 'interview-123';
      mockReq.auth = null;

      await deleteInterview(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('confirmInterview', () => {
    it('should confirm interview successfully', async () => {
      mockReq.params.interviewId = 'interview-123';
      const mockInterviewDoc = {
        _id: 'interview-123',
        userId: 'test-user-123',
        status: 'Scheduled',
        history: [],
        save: jest.fn().mockResolvedValue(true),
      };
      mockInterview.findOne.mockResolvedValue(mockInterviewDoc);

      await confirmInterview(mockReq, mockRes);

      expect(mockInterviewDoc.status).toBe('Confirmed');
      expect(mockInterviewDoc.history.length).toBe(1);
      expect(mockInterviewDoc.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if interview not found', async () => {
      mockReq.params.interviewId = 'non-existent';
      mockInterview.findOne.mockResolvedValue(null);

      await confirmInterview(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updatePreparationTask', () => {
    it('should update preparation task successfully', async () => {
      mockReq.params.interviewId = 'interview-123';
      mockReq.params.taskId = 'task-123';
      mockReq.body = { completed: true, title: 'Updated Task' };
      const mockTask = {
        _id: 'task-123',
        title: 'Original Task',
        completed: false,
      };
      const mockInterviewDoc = {
        _id: 'interview-123',
        userId: 'test-user-123',
        preparationTasks: {
          id: jest.fn().mockReturnValue(mockTask),
        },
        save: jest.fn().mockResolvedValue(true),
      };
      mockInterview.findOne.mockResolvedValue(mockInterviewDoc);

      await updatePreparationTask(mockReq, mockRes);

      expect(mockTask.completed).toBe(true);
      expect(mockTask.title).toBe('Updated Task');
      expect(mockInterviewDoc.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if interview not found', async () => {
      mockReq.params.interviewId = 'non-existent';
      mockReq.params.taskId = 'task-123';
      mockInterview.findOne.mockResolvedValue(null);

      await updatePreparationTask(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should return 404 if task not found', async () => {
      mockReq.params.interviewId = 'interview-123';
      mockReq.params.taskId = 'non-existent';
      const mockInterviewDoc = {
        _id: 'interview-123',
        userId: 'test-user-123',
        preparationTasks: {
          id: jest.fn().mockReturnValue(null),
        },
      };
      mockInterview.findOne.mockResolvedValue(mockInterviewDoc);

      await updatePreparationTask(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('addPreparationTask', () => {
    it('should add preparation task successfully', async () => {
      mockReq.params.interviewId = 'interview-123';
      mockReq.body = {
        title: 'New Task',
        description: 'Task description',
        priority: 'High',
      };
      const mockInterviewDoc = {
        _id: 'interview-123',
        userId: 'test-user-123',
        preparationTasks: [],
        save: jest.fn().mockResolvedValue(true),
      };
      mockInterview.findOne.mockResolvedValue(mockInterviewDoc);

      await addPreparationTask(mockReq, mockRes);

      expect(mockInterviewDoc.preparationTasks.length).toBe(1);
      expect(mockInterviewDoc.preparationTasks[0].title).toBe('New Task');
      expect(mockInterviewDoc.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 if title is missing', async () => {
      mockReq.params.interviewId = 'interview-123';
      mockReq.body = { description: 'Task description' };

      await addPreparationTask(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 if interview not found', async () => {
      mockReq.params.interviewId = 'non-existent';
      mockReq.body = { title: 'New Task' };
      mockInterview.findOne.mockResolvedValue(null);

      await addPreparationTask(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deletePreparationTask', () => {
    it('should delete preparation task successfully', async () => {
      mockReq.params.interviewId = 'interview-123';
      mockReq.params.taskId = 'task-123';
      const mockTask = {
        _id: 'task-123',
        remove: jest.fn(),
      };
      const mockInterviewDoc = {
        _id: 'interview-123',
        userId: 'test-user-123',
        preparationTasks: {
          id: jest.fn().mockReturnValue(mockTask),
        },
        save: jest.fn().mockResolvedValue(true),
      };
      mockInterview.findOne.mockResolvedValue(mockInterviewDoc);

      await deletePreparationTask(mockReq, mockRes);

      expect(mockTask.remove).toHaveBeenCalled();
      expect(mockInterviewDoc.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if interview not found', async () => {
      mockReq.params.interviewId = 'non-existent';
      mockReq.params.taskId = 'task-123';
      mockInterview.findOne.mockResolvedValue(null);

      await deletePreparationTask(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should return 404 if task not found', async () => {
      mockReq.params.interviewId = 'interview-123';
      mockReq.params.taskId = 'non-existent';
      const mockInterviewDoc = {
        _id: 'interview-123',
        userId: 'test-user-123',
        preparationTasks: {
          id: jest.fn().mockReturnValue(null),
        },
      };
      mockInterview.findOne.mockResolvedValue(mockInterviewDoc);

      await deletePreparationTask(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('generatePreparationTasks', () => {
    it('should generate preparation tasks successfully', async () => {
      mockReq.params.interviewId = 'interview-123';
      const mockInterviewDoc = {
        _id: 'interview-123',
        userId: 'test-user-123',
        title: 'Software Engineer Interview',
        company: 'TechCorp',
        interviewType: 'Technical',
        preparationTasks: [],
        generatePreparationTasks: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true),
      };
      mockInterview.findOne.mockResolvedValue(mockInterviewDoc);

      await generatePreparationTasks(mockReq, mockRes);

      expect(mockInterviewDoc.generatePreparationTasks).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if interview not found', async () => {
      mockReq.params.interviewId = 'non-existent';
      mockInterview.findOne.mockResolvedValue(null);

      await generatePreparationTasks(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });
});

