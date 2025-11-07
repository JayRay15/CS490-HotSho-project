import { getSalaryResearch, compareSalaries, getSalaryBenchmarks, exportSalaryReport } from '../salaryController.js';
import { Job } from '../../models/Job.js';
import { User } from '../../models/User.js';
import { successResponse } from '../../utils/responseFormat.js';

// Mock dependencies
jest.mock('../../models/Job.js');
jest.mock('../../models/User.js');
jest.mock('../../utils/responseFormat.js');

describe('Salary Controller - UC-067', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: {},
      query: {},
      body: {},
      user: { id: 'user123' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('getSalaryResearch', () => {
    it('should return comprehensive salary research data', async () => {
      const mockJob = {
        _id: 'job123',
        title: 'Software Engineer',
        company: 'Tech Corp',
        location: 'San Francisco, CA',
        industry: 'Technology',
        salary: { min: 100000, max: 150000 },
        userId: 'user123'
      };

      const mockUser = {
        _id: 'user123',
        employment: [{
          salary: 90000
        }]
      };

      req.params.jobId = 'job123';
      Job.findById.mockResolvedValue(mockJob);
      Job.find.mockResolvedValue([mockJob]);
      User.findById.mockResolvedValue(mockUser);
      
      successResponse.mockReturnValue({
        response: { success: true, data: {} },
        statusCode: 200
      });

      await getSalaryResearch(req, res, jest.fn());

      expect(Job.findById).toHaveBeenCalledWith('job123');
      expect(successResponse).toHaveBeenCalled();
      const responseData = successResponse.mock.calls[0][1];
      
      // Verify all required features are present
      expect(responseData).toHaveProperty('job');
      expect(responseData).toHaveProperty('marketData');
      expect(responseData).toHaveProperty('factors');
      expect(responseData).toHaveProperty('similarPositions');
      expect(responseData).toHaveProperty('historicalTrends');
      expect(responseData).toHaveProperty('recommendations');
      expect(responseData).toHaveProperty('salaryComparison');
      
      // Verify market data includes location, experience, and company size adjustments
      expect(responseData.marketData).toHaveProperty('baseBenchmark');
      expect(responseData.marketData).toHaveProperty('locationAdjusted');
      expect(responseData.marketData).toHaveProperty('companySizeAdjusted');
      expect(responseData.marketData).toHaveProperty('totalCompensation');
      
      // Verify factors are included
      expect(responseData.factors).toHaveProperty('experienceLevel');
      expect(responseData.factors).toHaveProperty('locationMultiplier');
      expect(responseData.factors).toHaveProperty('companySize');
      
      // Verify salary comparison with current compensation
      expect(responseData.salaryComparison).toHaveProperty('current');
      expect(responseData.salaryComparison).toHaveProperty('target');
      expect(responseData.salaryComparison).toHaveProperty('difference');
      expect(responseData.salaryComparison).toHaveProperty('percentageIncrease');
    });

    it('should return 404 if job not found', async () => {
      req.params.jobId = 'nonexistent';
      Job.findById.mockResolvedValue(null);

      await getSalaryResearch(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should handle jobs without current compensation', async () => {
      const mockJob = {
        _id: 'job123',
        title: 'Software Engineer',
        company: 'Tech Corp',
        location: 'San Francisco, CA',
        industry: 'Technology',
        userId: 'user123'
      };

      const mockUser = {
        _id: 'user123',
        employment: []
      };

      req.params.jobId = 'job123';
      Job.findById.mockResolvedValue(mockJob);
      Job.find.mockResolvedValue([]);
      User.findById.mockResolvedValue(mockUser);
      
      successResponse.mockReturnValue({
        response: { success: true, data: {} },
        statusCode: 200
      });

      await getSalaryResearch(req, res, jest.fn());

      const responseData = successResponse.mock.calls[0][1];
      expect(responseData.salaryComparison).toBeNull();
    });
  });

  describe('compareSalaries', () => {
    it('should compare salaries across multiple companies', async () => {
      const mockJobs = [
        {
          _id: 'job1',
          title: 'Software Engineer',
          company: 'Company A',
          location: 'San Francisco',
          salary: { min: 100000, max: 150000 },
          industry: 'Technology'
        },
        {
          _id: 'job2',
          title: 'Software Engineer',
          company: 'Company B',
          location: 'New York',
          salary: { min: 110000, max: 160000 },
          industry: 'Technology'
        }
      ];

      req.query.jobIds = 'job1,job2';
      Job.find.mockResolvedValue(mockJobs);
      
      successResponse.mockReturnValue({
        response: { success: true, data: {} },
        statusCode: 200
      });

      await compareSalaries(req, res, jest.fn());

      expect(Job.find).toHaveBeenCalled();
      expect(successResponse).toHaveBeenCalled();
      const responseData = successResponse.mock.calls[0][1];
      
      expect(responseData).toHaveProperty('jobs');
      expect(responseData).toHaveProperty('comparison');
      expect(responseData.jobs).toHaveLength(2);
    });

    it('should return error if no job IDs provided', async () => {
      req.query.jobIds = '';

      await compareSalaries(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getSalaryBenchmarks', () => {
    it('should return salary benchmarks by industry, experience, and location', async () => {
      req.query = {
        industry: 'Technology',
        experienceLevel: 'Mid',
        location: 'San Francisco'
      };

      successResponse.mockReturnValue({
        response: { success: true, data: {} },
        statusCode: 200
      });

      await getSalaryBenchmarks(req, res, jest.fn());

      expect(successResponse).toHaveBeenCalled();
      const responseData = successResponse.mock.calls[0][1];
      
      expect(responseData).toHaveProperty('industry');
      expect(responseData).toHaveProperty('experienceLevel');
      expect(responseData).toHaveProperty('location');
      expect(responseData).toHaveProperty('baseBenchmark');
      expect(responseData).toHaveProperty('adjustedBenchmark');
      expect(responseData).toHaveProperty('totalCompensation');
    });

    it('should use default values if filters not provided', async () => {
      req.query = {};

      successResponse.mockReturnValue({
        response: { success: true, data: {} },
        statusCode: 200
      });

      await getSalaryBenchmarks(req, res, jest.fn());

      expect(successResponse).toHaveBeenCalled();
    });
  });

  describe('exportSalaryReport', () => {
    it('should export salary report in JSON format', async () => {
      const mockJob = {
        _id: 'job123',
        title: 'Software Engineer',
        company: 'Tech Corp',
        location: 'San Francisco',
        industry: 'Technology',
        userId: 'user123'
      };

      req.body = {
        jobId: 'job123',
        format: 'json'
      };

      Job.findById.mockResolvedValue(mockJob);
      Job.find.mockResolvedValue([]);
      User.findById.mockResolvedValue({ _id: 'user123' });
      
      successResponse.mockReturnValue({
        response: { success: true, data: {} },
        statusCode: 200
      });

      await exportSalaryReport(req, res, jest.fn());

      expect(successResponse).toHaveBeenCalled();
      const responseData = successResponse.mock.calls[0][1];
      
      expect(responseData).toHaveProperty('format');
      expect(responseData).toHaveProperty('filename');
      expect(responseData).toHaveProperty('data');
      expect(responseData.format).toBe('json');
    });

    it('should export salary report in markdown format', async () => {
      const mockJob = {
        _id: 'job123',
        title: 'Software Engineer',
        company: 'Tech Corp',
        location: 'San Francisco',
        industry: 'Technology',
        userId: 'user123'
      };

      req.body = {
        jobId: 'job123',
        format: 'markdown'
      };

      Job.findById.mockResolvedValue(mockJob);
      Job.find.mockResolvedValue([]);
      User.findById.mockResolvedValue({ _id: 'user123' });
      
      successResponse.mockReturnValue({
        response: { success: true, data: {} },
        statusCode: 200
      });

      await exportSalaryReport(req, res, jest.fn());

      expect(successResponse).toHaveBeenCalled();
      const responseData = successResponse.mock.calls[0][1];
      
      expect(responseData.format).toBe('markdown');
      expect(responseData).toHaveProperty('content');
      expect(typeof responseData.content).toBe('string');
    });

    it('should return error if job ID not provided', async () => {
      req.body = { format: 'json' };

      await exportSalaryReport(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Feature Coverage Tests', () => {
    it('should display salary ranges for similar positions', async () => {
      const mockJob = {
        _id: 'job123',
        title: 'Software Engineer',
        company: 'Tech Corp',
        location: 'San Francisco',
        industry: 'Technology',
        userId: 'user123'
      };

      const similarJobs = [
        { title: 'Software Engineer', company: 'Other Corp', salary: { min: 95000, max: 145000 } }
      ];

      req.params.jobId = 'job123';
      Job.findById.mockResolvedValue(mockJob);
      Job.find.mockResolvedValue(similarJobs);
      User.findById.mockResolvedValue({ _id: 'user123' });
      
      successResponse.mockReturnValue({
        response: { success: true, data: {} },
        statusCode: 200
      });

      await getSalaryResearch(req, res, jest.fn());

      const responseData = successResponse.mock.calls[0][1];
      expect(responseData.similarPositions).toBeDefined();
      expect(responseData.similarPositions.count).toBeGreaterThanOrEqual(0);
    });

    it('should include historical salary trend data', async () => {
      const mockJob = {
        _id: 'job123',
        title: 'Software Engineer',
        company: 'Tech Corp',
        location: 'San Francisco',
        industry: 'Technology',
        userId: 'user123'
      };

      req.params.jobId = 'job123';
      Job.findById.mockResolvedValue(mockJob);
      Job.find.mockResolvedValue([]);
      User.findById.mockResolvedValue({ _id: 'user123' });
      
      successResponse.mockReturnValue({
        response: { success: true, data: {} },
        statusCode: 200
      });

      await getSalaryResearch(req, res, jest.fn());

      const responseData = successResponse.mock.calls[0][1];
      expect(responseData.historicalTrends).toBeDefined();
      expect(Array.isArray(responseData.historicalTrends)).toBe(true);
      expect(responseData.historicalTrends.length).toBeGreaterThan(0);
    });

    it('should include negotiation recommendations', async () => {
      const mockJob = {
        _id: 'job123',
        title: 'Software Engineer',
        company: 'Tech Corp',
        location: 'San Francisco',
        industry: 'Technology',
        userId: 'user123'
      };

      req.params.jobId = 'job123';
      Job.findById.mockResolvedValue(mockJob);
      Job.find.mockResolvedValue([]);
      User.findById.mockResolvedValue({ _id: 'user123' });
      
      successResponse.mockReturnValue({
        response: { success: true, data: {} },
        statusCode: 200
      });

      await getSalaryResearch(req, res, jest.fn());

      const responseData = successResponse.mock.calls[0][1];
      expect(responseData.recommendations).toBeDefined();
      expect(Array.isArray(responseData.recommendations)).toBe(true);
    });

    it('should show total compensation including benefits', async () => {
      const mockJob = {
        _id: 'job123',
        title: 'Software Engineer',
        company: 'Tech Corp',
        location: 'San Francisco',
        industry: 'Technology',
        userId: 'user123'
      };

      req.params.jobId = 'job123';
      Job.findById.mockResolvedValue(mockJob);
      Job.find.mockResolvedValue([]);
      User.findById.mockResolvedValue({ _id: 'user123' });
      
      successResponse.mockReturnValue({
        response: { success: true, data: {} },
        statusCode: 200
      });

      await getSalaryResearch(req, res, jest.fn());

      const responseData = successResponse.mock.calls[0][1];
      expect(responseData.marketData.totalCompensation).toBeDefined();
      expect(responseData.marketData.totalCompensation).toHaveProperty('min');
      expect(responseData.marketData.totalCompensation).toHaveProperty('median');
      expect(responseData.marketData.totalCompensation).toHaveProperty('max');
    });
  });
});
