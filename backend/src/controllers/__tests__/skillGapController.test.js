import { jest, beforeEach, describe, it, expect } from '@jest/globals';

jest.resetModules();

// Mock models
const mockUser = {
  findOne: jest.fn(),
};

const mockJob = {
  findOne: jest.fn(),
  find: jest.fn(),
};

// Mock skillGapAnalysis utils
const mockAnalysis = {
  extractJobSkills: jest.fn(),
  analyzeSkillGap: jest.fn(),
  suggestLearningResources: jest.fn(),
  generateLearningPath: jest.fn(),
  analyzeSkillTrends: jest.fn(),
};

jest.unstable_mockModule('../../models/User.js', () => ({ User: mockUser }));
jest.unstable_mockModule('../../models/Job.js', () => ({ Job: mockJob }));
jest.unstable_mockModule('../../utils/skillGapAnalysis.js', () => mockAnalysis);

// Spy/mock the response utilities so we can assert controller calls to sendResponse
const mockSendResponse = jest.fn((res, response, statusCode) => res.status(statusCode).json(response));
const mockSuccessResponse = (message, data = null, statusCode = 200) => ({ response: { message, data }, statusCode });
const mockErrorResponse = (message, statusCode = 400) => ({ response: { message }, statusCode });
const mockErrorCodes = { NOT_FOUND: 'NOT_FOUND', VALIDATION_ERROR: 'VALIDATION_ERROR' };

jest.unstable_mockModule('../../utils/responseFormat.js', () => ({
  sendResponse: mockSendResponse,
  successResponse: mockSuccessResponse,
  errorResponse: mockErrorResponse,
  ERROR_CODES: mockErrorCodes
}));

// Import controller after mocks
const {
  analyzeJobSkillGap,
  getSkillTrends,
  startSkillTracking,
  updateSkillProgress,
  getSkillTracking,
  deleteSkillTracking,
  compareJobsSkills
} = await import('../skillGapController.js');

describe('skillGapController', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      auth: { payload: { sub: 'user-1' }, userId: 'user-1' },
      params: {},
      body: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe('analyzeJobSkillGap', () => {
    it('returns 404 when user not found', async () => {
      mockReq.params.jobId = 'job-1';
      mockUser.findOne.mockResolvedValue(null);

  analyzeJobSkillGap(mockReq, mockRes);
  await new Promise(resolve => setImmediate(resolve));

  expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('returns 404 when job not found', async () => {
      mockReq.params.jobId = 'job-1';
      mockUser.findOne.mockResolvedValue({ skills: ['JS'] });
      mockJob.findOne.mockResolvedValue(null);

  analyzeJobSkillGap(mockReq, mockRes);
  await new Promise(resolve => setImmediate(resolve));

  expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('returns analysis on success', async () => {
      mockReq.params.jobId = 'job-1';
      const user = { skills: [{ name: 'JS' }], experienceLevel: 'mid' };
      const job = { _id: 'job-1', title: 'Engineer', company: 'Acme' };
      mockUser.findOne.mockResolvedValue(user);
      mockJob.findOne.mockResolvedValue(job);

      mockAnalysis.extractJobSkills.mockReturnValue(['Node', 'JS']);
      mockAnalysis.analyzeSkillGap.mockReturnValue({ missing: ['Node'], weak: [], matchPercentage: 50, summary: {} });
      mockAnalysis.suggestLearningResources.mockReturnValue([{ title: 'Course' }]);
      mockAnalysis.generateLearningPath.mockReturnValue([{ step: 'Learn Node' }]);

  analyzeJobSkillGap(mockReq, mockRes);
  await new Promise(resolve => setImmediate(resolve));

  expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockAnalysis.analyzeSkillGap).toHaveBeenCalled();
    });
  });

  describe('getSkillTrends', () => {
    it('returns 404 when user not found', async () => {
  mockUser.findOne.mockResolvedValue(null);
  getSkillTrends(mockReq, mockRes);
  await new Promise(resolve => setImmediate(resolve));
  expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('returns empty trends when no jobs', async () => {
  mockUser.findOne.mockResolvedValue({ skills: [] });
  mockJob.find.mockResolvedValue([]);

  getSkillTrends(mockReq, mockRes);
  await new Promise(resolve => setImmediate(resolve));

  expect(mockRes.status).toHaveBeenCalledWith(200);
  expect(mockRes.json).toHaveBeenCalled();
    });

    it('returns trends when jobs exist', async () => {
      const user = { skills: [{ name: 'JS' }] };
      const jobs = [{ _id: 'j1' }, { _id: 'j2' }];
  mockUser.findOne.mockResolvedValue(user);
  mockJob.find.mockResolvedValue(jobs);
  mockAnalysis.analyzeSkillTrends.mockReturnValue({ trending: ['JS'] });

  getSkillTrends(mockReq, mockRes);
  await new Promise(resolve => setImmediate(resolve));

  expect(mockRes.status).toHaveBeenCalledWith(200);
  expect(mockAnalysis.analyzeSkillTrends).toHaveBeenCalledWith(jobs, user.skills || []);
    });
  });

  describe('startSkillTracking', () => {
    it('validates required fields', async () => {
      mockReq.body = { targetLevel: 'advanced' }; // missing skillName
  mockUser.findOne.mockResolvedValue({});

  startSkillTracking(mockReq, mockRes);
  await new Promise(resolve => setImmediate(resolve));

  expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('adds new tracking when user exists', async () => {
      mockReq.body = { skillName: 'Node', targetLevel: 'intermediate' };
      const user = { skillDevelopment: [], save: jest.fn().mockResolvedValue(true) };
  mockUser.findOne.mockResolvedValue(user);

  startSkillTracking(mockReq, mockRes);
  await new Promise(resolve => setImmediate(resolve));

  expect(user.save).toHaveBeenCalled();
  expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('updateSkillProgress', () => {
    it('returns 404 when user not found', async () => {
  mockUser.findOne.mockResolvedValue(null);
  mockReq.params.skillName = 'Node';
  updateSkillProgress(mockReq, mockRes);
  await new Promise(resolve => setImmediate(resolve));
  expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('returns 404 when tracking not found', async () => {
      const user = { skillDevelopment: [], save: jest.fn() };
  mockUser.findOne.mockResolvedValue(user);
  mockReq.params.skillName = 'Node';
  updateSkillProgress(mockReq, mockRes);
  await new Promise(resolve => setImmediate(resolve));
  expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('updates progress and adds skill on 100%', async () => {
      const user = {
        skills: [],
        skillDevelopment: [{ skillName: 'Node', targetLevel: 'advanced', currentProgress: 0, resources: [] }],
        save: jest.fn().mockResolvedValue(true)
      };
  mockUser.findOne.mockResolvedValue(user);
  mockReq.params.skillName = 'Node';
  mockReq.body = { currentProgress: 100 };

  updateSkillProgress(mockReq, mockRes);
  await new Promise(resolve => setImmediate(resolve));

  expect(user.save).toHaveBeenCalled();
  expect(user.skills.some(s => s.name === 'Node')).toBe(true);
  expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getSkillTracking and deleteSkillTracking', () => {
    it('returns 404 on get when user missing', async () => {
  mockUser.findOne.mockResolvedValue(null);
  getSkillTracking(mockReq, mockRes);
  await new Promise(resolve => setImmediate(resolve));
  expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('returns tracking array when present', async () => {
      const user = { skillDevelopment: [{ skillName: 'Node' }] };
  mockUser.findOne.mockResolvedValue(user);
  getSkillTracking(mockReq, mockRes);
  await new Promise(resolve => setImmediate(resolve));
  expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('delete returns 404 when not tracking', async () => {
      const user = { skillDevelopment: undefined };
  mockUser.findOne.mockResolvedValue(user);
  mockReq.params.skillName = 'Node';
  deleteSkillTracking(mockReq, mockRes);
  await new Promise(resolve => setImmediate(resolve));
  expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('deletes tracking when present', async () => {
      const user = { skillDevelopment: [{ skillName: 'Node' }], save: jest.fn().mockResolvedValue(true) };
  mockUser.findOne.mockResolvedValue(user);
  mockReq.params.skillName = 'Node';
  deleteSkillTracking(mockReq, mockRes);
  await new Promise(resolve => setImmediate(resolve));
  expect(user.save).toHaveBeenCalled();
  expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('compareJobsSkills', () => {
    it('validates request body', async () => {
      mockReq.body = { jobIds: [] };
  mockUser.findOne.mockResolvedValue({});
  compareJobsSkills(mockReq, mockRes);
  await new Promise(resolve => setImmediate(resolve));
  expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('returns 404 when no jobs found', async () => {
  mockReq.body = { jobIds: ['j1'] };
  mockUser.findOne.mockResolvedValue({ skills: [] });
  mockJob.find.mockResolvedValue([]);
  compareJobsSkills(mockReq, mockRes);
  await new Promise(resolve => setImmediate(resolve));
  expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('compares jobs successfully', async () => {
      mockReq.body = { jobIds: ['j1', 'j2'] };
      const user = { skills: [] };
      const jobs = [
        { _id: 'j1', title: 'A', company: 'X' },
        { _id: 'j2', title: 'B', company: 'Y' }
      ];
      mockUser.findOne.mockResolvedValue(user);
      mockJob.find.mockResolvedValue(jobs);

      mockAnalysis.extractJobSkills.mockReturnValue(['JS']);
  mockAnalysis.analyzeSkillGap.mockReturnValue({ matchPercentage: 50, summary: {} });

  compareJobsSkills(mockReq, mockRes);
  await new Promise(resolve => setImmediate(resolve));

  expect(mockRes.status).toHaveBeenCalledWith(200);
  expect(mockRes.json).toHaveBeenCalled();
    });
  });
});
