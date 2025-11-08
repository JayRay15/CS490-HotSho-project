import { jest, beforeEach, describe, it, expect } from '@jest/globals';

jest.resetModules();

// Mock dependencies
const mockJob = {
  findOne: jest.fn(),
  find: jest.fn(),
};

const mockUser = {
  findOne: jest.fn(),
};

const mockAsyncHandler = (fn) => fn;

jest.unstable_mockModule('../../models/Job.js', () => ({
  Job: mockJob,
}));

jest.unstable_mockModule('../../models/User.js', () => ({
  User: mockUser,
}));

jest.unstable_mockModule('../../middleware/errorHandler.js', () => ({
  asyncHandler: mockAsyncHandler,
}));

// Import controller
const {
  getSalaryResearch,
  compareSalaries,
  getSalaryBenchmarks,
  exportSalaryReport,
} = await import('../salaryController.js');

describe('SalaryController', () => {
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

  describe('getSalaryResearch', () => {
    it('should return salary research for a job', async () => {
      mockReq.params.jobId = 'job-123';
      const mockJobDoc = {
        _id: 'job-123',
        title: 'Software Engineer',
        company: 'TechCorp',
        location: 'San Francisco',
        industry: 'Technology',
        salary: { min: 100000, max: 150000 },
        userId: 'test-user-123',
      };
      const mockUserDoc = {
        _id: 'user-123',
        auth0Id: 'test-user-123',
        experienceLevel: 'Mid',
        employment: [],
      };
      mockJob.findOne.mockResolvedValue(mockJobDoc);
      mockUser.findOne.mockResolvedValue(mockUserDoc);
      mockJob.find.mockReturnValue({
        limit: jest.fn().mockResolvedValue([]), // similarJobs
      });

      await getSalaryResearch(mockReq, mockRes);

      expect(mockJob.findOne).toHaveBeenCalledWith({
        _id: 'job-123',
        userId: 'test-user-123',
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Salary research retrieved successfully',
          data: expect.objectContaining({
            job: expect.objectContaining({
              title: 'Software Engineer',
              company: 'TechCorp',
            }),
            marketData: expect.objectContaining({
              baseBenchmark: expect.any(Object),
              locationAdjusted: expect.any(Object),
              companySizeAdjusted: expect.any(Object),
              totalCompensation: expect.any(Object),
            }),
            factors: expect.objectContaining({
              experienceLevel: 'Mid',
              location: 'San Francisco',
            }),
            recommendations: expect.any(Array),
          }),
        })
      );
    });

    it('should return 401 if user not authenticated', async () => {
      mockReq.auth = null;
      mockReq.params.jobId = 'job-123';

      await getSalaryResearch(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should return 404 if job not found', async () => {
      mockReq.params.jobId = 'non-existent';
      mockJob.findOne.mockResolvedValue(null);

      await getSalaryResearch(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should calculate location-adjusted salary', async () => {
      mockReq.params.jobId = 'job-123';
      const mockJobDoc = {
        _id: 'job-123',
        title: 'Engineer',
        company: 'TechCorp',
        location: 'New York',
        industry: 'Technology',
        userId: 'test-user-123',
      };
      const mockUserDoc = {
        auth0Id: 'test-user-123',
        experienceLevel: 'Mid',
        employment: [],
      };
      mockJob.findOne.mockResolvedValue(mockJobDoc);
      mockUser.findOne.mockResolvedValue(mockUserDoc);
      mockJob.find.mockReturnValue({
        limit: jest.fn().mockResolvedValue([]),
      });

      await getSalaryResearch(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            factors: expect.objectContaining({
              locationMultiplier: expect.any(Number),
            }),
          }),
        })
      );
    });
  });

  describe('compareSalaries', () => {
    it('should compare salaries across multiple jobs', async () => {
      mockReq.query.jobIds = 'job-1,job-2';
      const mockJobs = [
        {
          _id: 'job-1',
          title: 'Engineer',
          company: 'TechCorp',
          location: 'San Francisco',
          industry: 'Technology',
          salary: { min: 120000, max: 150000 },
          userId: 'test-user-123',
        },
        {
          _id: 'job-2',
          title: 'Engineer',
          company: 'DataCo',
          location: 'Austin',
          industry: 'Technology',
          salary: { min: 100000, max: 130000 },
          userId: 'test-user-123',
        },
      ];
      const mockUserDoc = {
        auth0Id: 'test-user-123',
        experienceLevel: 'Mid',
      };
      mockJob.find.mockResolvedValue(mockJobs);
      mockUser.findOne.mockResolvedValue(mockUserDoc);

      await compareSalaries(mockReq, mockRes);

      expect(mockJob.find).toHaveBeenCalledWith({
        _id: { $in: ['job-1', 'job-2'] },
        userId: 'test-user-123',
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            count: 2,
            comparisons: expect.arrayContaining([
              expect.objectContaining({
                jobId: 'job-1',
                title: 'Engineer',
                estimatedSalary: expect.any(Object),
              }),
            ]),
            summary: expect.objectContaining({
              highest: expect.any(Object),
              lowest: expect.any(Object),
              average: expect.any(Number),
            }),
          }),
        })
      );
    });

    it('should return 400 if jobIds is missing', async () => {
      mockReq.query = {};

      await compareSalaries(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 if no jobs found', async () => {
      mockReq.query.jobIds = 'job-1,job-2';
      mockJob.find.mockResolvedValue([]);

      await compareSalaries(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getSalaryBenchmarks', () => {
    it('should return salary benchmarks with filters', async () => {
      mockReq.query = {
        industry: 'Technology',
        experienceLevel: 'Senior',
        location: 'San Francisco',
      };

      await getSalaryBenchmarks(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            filters: expect.objectContaining({
              industry: 'Technology',
              experienceLevel: 'Senior',
              location: 'San Francisco',
            }),
            benchmark: expect.objectContaining({
              min: expect.any(Number),
              max: expect.any(Number),
              median: expect.any(Number),
            }),
            allBenchmarks: expect.any(Object),
            availableIndustries: expect.any(Array),
            availableLevels: expect.any(Array),
          }),
        })
      );
    });

    it('should use default values if filters not provided', async () => {
      mockReq.query = {};

      await getSalaryBenchmarks(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            filters: expect.objectContaining({
              industry: 'Technology', // Default
              experienceLevel: 'Mid', // Default
            }),
          }),
        })
      );
    });
  });

  describe('exportSalaryReport', () => {
    it('should export salary report in JSON format', async () => {
      mockReq.body = {
        jobId: 'job-123',
        format: 'json',
      };
      const mockJobDoc = {
        _id: 'job-123',
        title: 'Engineer',
        company: 'TechCorp',
        location: 'San Francisco',
        industry: 'Technology',
        userId: 'test-user-123',
      };
      const mockUserDoc = {
        auth0Id: 'test-user-123',
        experienceLevel: 'Mid',
      };
      mockJob.findOne.mockResolvedValue(mockJobDoc);
      mockUser.findOne.mockResolvedValue(mockUserDoc);

      await exportSalaryReport(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            format: 'json',
            data: expect.objectContaining({
              job: expect.any(Object),
              salaryResearch: expect.any(Object),
              recommendations: expect.any(Array),
            }),
            filename: expect.stringContaining('salary-report'),
          }),
        })
      );
    });

    it('should export salary report in markdown format', async () => {
      mockReq.body = {
        jobId: 'job-123',
        format: 'markdown',
      };
      const mockJobDoc = {
        _id: 'job-123',
        title: 'Engineer',
        company: 'TechCorp',
        location: 'San Francisco',
        industry: 'Technology',
        userId: 'test-user-123',
      };
      const mockUserDoc = {
        auth0Id: 'test-user-123',
        experienceLevel: 'Mid',
      };
      mockJob.findOne.mockResolvedValue(mockJobDoc);
      mockUser.findOne.mockResolvedValue(mockUserDoc);

      await exportSalaryReport(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            format: 'markdown',
            content: expect.any(String),
            filename: expect.stringContaining('.md'),
          }),
        })
      );
    });

    it('should return 400 if jobId is missing', async () => {
      mockReq.body = { format: 'json' };

      await exportSalaryReport(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });
});

