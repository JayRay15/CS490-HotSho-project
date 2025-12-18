import { jest, beforeEach, describe, it, expect } from '@jest/globals';

// Reset modules
jest.resetModules();

// Mock dependencies
const mockJob = {
  find: jest.fn(),
  findOne: jest.fn(),
  findOneAndDelete: jest.fn(),
  create: jest.fn(),
  countDocuments: jest.fn(),
};

const mockAsyncHandler = (fn) => fn;

jest.unstable_mockModule('../../models/Job.js', () => ({
  Job: mockJob,
}));

jest.unstable_mockModule('../../middleware/errorHandler.js', () => ({
  asyncHandler: mockAsyncHandler,
}));

// Import controller after mocks
const {
  getJobs,
  addJob,
  updateJob,
  deleteJob,
  updateJobStatus,
  archiveJob,
  restoreJob,
  bulkUpdateStatus,
  bulkUpdateDeadline,
  getJobStats,
  linkResumeToJob,
} = await import('../jobController.js');

describe('JobController - CRUD Operations', () => {
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

  describe('getJobs', () => {
    it('should retrieve all jobs for user', async () => {
      const mockJobs = [
        { _id: '1', title: 'Software Engineer', company: 'TechCorp', userId: 'test-user-123' },
        { _id: '2', title: 'Data Scientist', company: 'DataCo', userId: 'test-user-123' },
      ];
      mockJob.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockJobs),
      });

      await getJobs(mockReq, mockRes);

      expect(mockJob.find).toHaveBeenCalledWith({ userId: 'test-user-123' });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Jobs retrieved successfully',
          data: expect.objectContaining({
            jobs: mockJobs,
            count: 2,
          }),
        })
      );
    });

    it('should filter jobs by status', async () => {
      mockReq.query.status = 'Applied';
      const mockJobs = [{ _id: '1', title: 'Engineer', status: 'Applied' }];
      mockJob.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockJobs),
      });

      await getJobs(mockReq, mockRes);

      expect(mockJob.find).toHaveBeenCalledWith({
        userId: 'test-user-123',
        status: 'Applied',
      });
    });

    it('should filter jobs by archived state', async () => {
      mockReq.query.archived = 'true';
      const mockJobs = [{ _id: '1', title: 'Engineer', archived: true }];
      mockJob.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockJobs),
      });

      await getJobs(mockReq, mockRes);

      expect(mockJob.find).toHaveBeenCalledWith({
        userId: 'test-user-123',
        archived: true,
      });
    });

    it('should search jobs by title, company, or location', async () => {
      mockReq.query.search = 'Engineer';
      const mockJobs = [{ _id: '1', title: 'Software Engineer' }];
      mockJob.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockJobs),
      });

      await getJobs(mockReq, mockRes);

      expect(mockJob.find).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'test-user-123',
          $or: expect.arrayContaining([
            { title: { $regex: 'Engineer', $options: 'i' } },
            { company: { $regex: 'Engineer', $options: 'i' } },
            { location: { $regex: 'Engineer', $options: 'i' } },
          ]),
        })
      );
    });

    it('should return 401 if user not authenticated', async () => {
      mockReq.auth = null;

      await getJobs(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Unauthorized'),
        })
      );
    });
  });

  describe('addJob', () => {
    it('should create a new job successfully', async () => {
      mockReq.body = {
        title: 'Software Engineer',
        company: 'TechCorp',
        status: 'Interested',
        location: 'New York',
      };
      const mockCreatedJob = {
        _id: 'new-job-id',
        ...mockReq.body,
        userId: 'test-user-123',
        statusHistory: expect.any(Array),
      };
      // Mock Job.find for deduplication check (return empty array = no duplicates)
      mockJob.find.mockResolvedValue([]);
      mockJob.create.mockResolvedValue(mockCreatedJob);

      await addJob(mockReq, mockRes);

      expect(mockJob.create).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Job added successfully',
          data: expect.objectContaining({
            job: mockCreatedJob,
          }),
        })
      );
    });

    it('should return validation error if title is missing', async () => {
      mockReq.body = {
        company: 'TechCorp',
      };

      await addJob(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('fix the following errors'),
          errors: expect.arrayContaining([
            expect.objectContaining({
              field: 'title',
              message: 'Job title is required',
            }),
          ]),
        })
      );
    });

    it('should return validation error if company is missing', async () => {
      mockReq.body = {
        title: 'Software Engineer',
      };

      await addJob(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errors: expect.arrayContaining([
            expect.objectContaining({
              field: 'company',
              message: 'Company name is required',
            }),
          ]),
        })
      );
    });

    it('should set default status to "Interested" if not provided', async () => {
      mockReq.body = {
        title: 'Engineer',
        company: 'TechCorp',
      };
      const mockCreatedJob = {
        _id: 'new-job-id',
        status: 'Interested',
        statusHistory: [{ status: 'Interested', timestamp: expect.any(Date) }],
      };
      // Mock Job.find for deduplication check (return empty array = no duplicates)
      mockJob.find.mockResolvedValue([]);
      mockJob.create.mockResolvedValue(mockCreatedJob);

      await addJob(mockReq, mockRes);

      expect(mockJob.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'Interested',
        })
      );
    });
  });

  describe('updateJob', () => {
    it('should update job successfully', async () => {
      mockReq.params.jobId = 'job-123';
      mockReq.body = {
        title: 'Senior Software Engineer',
        location: 'San Francisco',
      };
      const mockJobDoc = {
        _id: 'job-123',
        title: 'Software Engineer',
        company: 'TechCorp',
        userId: 'test-user-123',
        save: jest.fn().mockResolvedValue(true),
      };
      mockJob.findOne.mockResolvedValue(mockJobDoc);

      await updateJob(mockReq, mockRes);

      expect(mockJob.findOne).toHaveBeenCalledWith({
        _id: 'job-123',
        userId: 'test-user-123',
      });
      expect(mockJobDoc.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if job not found', async () => {
      mockReq.params.jobId = 'non-existent';
      mockJob.findOne.mockResolvedValue(null);

      await updateJob(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('not found'),
        })
      );
    });

    it('should return 400 if jobId is missing', async () => {
      mockReq.params = {};

      await updateJob(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('deleteJob', () => {
    it('should delete job successfully', async () => {
      mockReq.params.jobId = 'job-123';
      const mockDeletedJob = { _id: 'job-123', title: 'Engineer' };
      mockJob.findOneAndDelete.mockResolvedValue(mockDeletedJob);

      await deleteJob(mockReq, mockRes);

      expect(mockJob.findOneAndDelete).toHaveBeenCalledWith({
        _id: 'job-123',
        userId: 'test-user-123',
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Job deleted successfully',
        })
      );
    });

    it('should return 404 if job not found', async () => {
      mockReq.params.jobId = 'non-existent';
      mockJob.findOneAndDelete.mockResolvedValue(null);

      await deleteJob(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updateJobStatus', () => {
    it('should update job status successfully', async () => {
      mockReq.params.jobId = 'job-123';
      mockReq.body = { status: 'Applied', notes: 'Submitted application' };
      const mockJobDoc = {
        _id: 'job-123',
        status: 'Interested',
        statusHistory: [{ status: 'Interested', timestamp: new Date() }],
        userId: 'test-user-123',
        save: jest.fn().mockResolvedValue(true),
      };
      mockJob.findOne.mockResolvedValue(mockJobDoc);

      await updateJobStatus(mockReq, mockRes);

      expect(mockJobDoc.status).toBe('Applied');
      expect(mockJobDoc.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 for invalid status', async () => {
      mockReq.params.jobId = 'job-123';
      mockReq.body = { status: 'InvalidStatus' };

      await updateJobStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Invalid status'),
        })
      );
    });

    it('should return 400 if status is missing', async () => {
      mockReq.params.jobId = 'job-123';
      mockReq.body = {};

      await updateJobStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('archiveJob', () => {
    it('should archive job successfully', async () => {
      mockReq.params.jobId = 'job-123';
      mockReq.body = { reason: 'Position filled', notes: 'No longer interested' };
      const mockJobDoc = {
        _id: 'job-123',
        archived: false,
        userId: 'test-user-123',
        save: jest.fn().mockResolvedValue(true),
      };
      mockJob.findOne.mockResolvedValue(mockJobDoc);

      await archiveJob(mockReq, mockRes);

      expect(mockJobDoc.archived).toBe(true);
      expect(mockJobDoc.archiveReason).toBe('Position filled');
      expect(mockJobDoc.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 if job already archived', async () => {
      mockReq.params.jobId = 'job-123';
      const mockJobDoc = {
        _id: 'job-123',
        archived: true,
        userId: 'test-user-123',
      };
      mockJob.findOne.mockResolvedValue(mockJobDoc);

      await archiveJob(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('already archived'),
        })
      );
    });
  });

  describe('restoreJob', () => {
    it('should restore archived job successfully', async () => {
      mockReq.params.jobId = 'job-123';
      const mockJobDoc = {
        _id: 'job-123',
        archived: true,
        archivedAt: new Date(),
        archiveReason: 'Test',
        userId: 'test-user-123',
        save: jest.fn().mockResolvedValue(true),
      };
      mockJob.findOne.mockResolvedValue(mockJobDoc);

      await restoreJob(mockReq, mockRes);

      expect(mockJobDoc.archived).toBe(false);
      expect(mockJobDoc.archivedAt).toBeUndefined();
      expect(mockJobDoc.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 if job is not archived', async () => {
      mockReq.params.jobId = 'job-123';
      const mockJobDoc = {
        _id: 'job-123',
        archived: false,
        userId: 'test-user-123',
      };
      mockJob.findOne.mockResolvedValue(mockJobDoc);

      await restoreJob(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('bulkUpdateStatus', () => {
    it('should update multiple jobs status', async () => {
      mockReq.body = {
        jobIds: ['job-1', 'job-2'],
        status: 'Applied',
        notes: 'Bulk update',
      };
      const mockJobs = [
        {
          _id: 'job-1',
          status: 'Interested',
          statusHistory: [{ status: 'Interested', timestamp: new Date() }],
          save: jest.fn().mockResolvedValue(true),
        },
        {
          _id: 'job-2',
          status: 'Interested',
          statusHistory: [{ status: 'Interested', timestamp: new Date() }],
          save: jest.fn().mockResolvedValue(true),
        },
      ];
      mockJob.find.mockResolvedValue(mockJobs);

      await bulkUpdateStatus(mockReq, mockRes);

      expect(mockJob.find).toHaveBeenCalledWith({
        _id: { $in: ['job-1', 'job-2'] },
        userId: 'test-user-123',
      });
      expect(mockJobs[0].status).toBe('Applied');
      expect(mockJobs[1].status).toBe('Applied');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 if jobIds is not an array', async () => {
      mockReq.body = {
        jobIds: 'not-an-array',
        status: 'Applied',
      };

      await bulkUpdateStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('bulkUpdateDeadline', () => {
    it('should update deadlines with setDate', async () => {
      mockReq.body = {
        jobIds: ['job-1'],
        setDate: '2024-12-31',
      };
      const mockJobDoc = {
        _id: 'job-1',
        deadline: new Date('2024-01-01'),
        save: jest.fn().mockResolvedValue(true),
      };
      mockJob.findOne.mockResolvedValue(mockJobDoc);

      await bulkUpdateDeadline(mockReq, mockRes);

      expect(mockJobDoc.deadline).toEqual(new Date('2024-12-31'));
      expect(mockJobDoc.save).toHaveBeenCalled();
    });

    it('should shift deadlines by days', async () => {
      mockReq.body = {
        jobIds: ['job-1'],
        shiftDays: 7,
      };
      const originalDeadline = new Date('2024-01-01');
      const mockJobDoc = {
        _id: 'job-1',
        deadline: originalDeadline,
        save: jest.fn().mockResolvedValue(true),
      };
      mockJob.findOne.mockResolvedValue(mockJobDoc);

      await bulkUpdateDeadline(mockReq, mockRes);

      const expectedDate = new Date(originalDeadline);
      expectedDate.setDate(expectedDate.getDate() + 7);
      expect(mockJobDoc.deadline.getTime()).toBe(expectedDate.getTime());
    });
  });

  describe('getJobStats', () => {
    it('should return job statistics', async () => {
      const statusCounts = {
        Interested: 5,
        Applied: 3,
        'Phone Screen': 2,
        Interview: 1,
        Offer: 0,
        Rejected: 1,
      };
      mockJob.countDocuments
        .mockResolvedValueOnce(statusCounts.Interested)
        .mockResolvedValueOnce(statusCounts.Applied)
        .mockResolvedValueOnce(statusCounts['Phone Screen'])
        .mockResolvedValueOnce(statusCounts.Interview)
        .mockResolvedValueOnce(statusCounts.Offer)
        .mockResolvedValueOnce(statusCounts.Rejected)
        .mockResolvedValueOnce(12) // totalActive
        .mockResolvedValueOnce(3); // totalArchived

      await getJobStats(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            byStatus: statusCounts,
            totalActive: 12,
            totalArchived: 3,
          }),
        })
      );
    });
  });

  describe('linkResumeToJob', () => {
    it('should link resume to job successfully', async () => {
      mockReq.params.jobId = 'job-123';
      mockReq.body = { resumeId: 'resume-123' };
      const mockJobDoc = {
        _id: 'job-123',
        userId: 'test-user-123',
        save: jest.fn().mockResolvedValue(true),
      };
      mockJob.findOne.mockResolvedValue(mockJobDoc);

      await linkResumeToJob(mockReq, mockRes);

      expect(mockJobDoc.linkedResumeId).toBe('resume-123');
      expect(mockJobDoc.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 if resumeId is missing', async () => {
      mockReq.params.jobId = 'job-123';
      mockReq.body = {};

      await linkResumeToJob(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });
});

