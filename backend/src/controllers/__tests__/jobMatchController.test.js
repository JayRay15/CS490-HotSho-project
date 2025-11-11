import { jest } from '@jest/globals';

// Mock modules used by jobMatchController
await jest.unstable_mockModule('../../models/User.js', () => ({
  __esModule: true,
  User: {
    findOne: jest.fn(),
  },
}));

await jest.unstable_mockModule('../../models/Job.js', () => ({
  __esModule: true,
  Job: {
    findOne: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
  },
}));

await jest.unstable_mockModule('../../models/JobMatch.js', () => ({
  __esModule: true,
  JobMatch: {
    findOne: jest.fn(),
    create: jest.fn(),
    find: jest.fn(),
    findOneAndDelete: jest.fn(),
  },
}));

await jest.unstable_mockModule('../../utils/jobMatchingService.js', () => ({
  __esModule: true,
  calculateJobMatch: jest.fn(),
  compareJobMatches: jest.fn(),
}));

// Import the controller after mocks
const { calculateMatch, getJobMatch, updateMatchWeights, exportMatchReport, deleteMatch, getMatchTrends } = await import('../jobMatchController.js');
const userMod = await import('../../models/User.js');
const jobMod = await import('../../models/Job.js');
const jmMod = await import('../../models/JobMatch.js');
const svc = await import('../../utils/jobMatchingService.js');

describe('jobMatchController', () => {
  let req;
  let res;

  beforeEach(() => {
    jest.resetAllMocks();
    req = { auth: { userId: 'user-1' }, params: { jobId: 'job-1' }, body: {}, query: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn(), setHeader: jest.fn(), send: jest.fn() };
    // provide a next handler so asyncHandler.catch(next) won't cause unhandled rejections in tests
    req.next = jest.fn();
    // next function to pass to controllers
    res.__next = (err) => {
      // Basic fallback error handler for tests
      res.status(500);
      res.json({ success: false, error: err?.message });
    };
  });

  describe('calculateMatch', () => {
    it('returns 404 when user not found', async () => {
      // simulate query.lean() resolving to null
      userMod.User.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

  calculateMatch(req, res, res.__next);
  await new Promise(resolve => setImmediate(resolve));

  expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalled();
    });

    it('returns 404 when job not found', async () => {
    userMod.User.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue({ auth0Id: 'user-1' }) });
    jobMod.Job.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

  calculateMatch(req, res, res.__next);
  await new Promise(resolve => setImmediate(resolve));

    expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalled();
    });

    it('creates a new JobMatch when none exists', async () => {
      userMod.User.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue({ auth0Id: 'user-1' }) });
      jobMod.Job.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: 'job-1', title: 'J' }) });
      svc.calculateJobMatch.mockResolvedValue({ overallScore: 80, categoryScores: {}, strengths: [], gaps: [], suggestions: [], customWeights: null, metadata: {} });
      jmMod.JobMatch.findOne.mockResolvedValue(null);
      jmMod.JobMatch.create.mockResolvedValue({ _id: 'match-1', overallScore: 80 });

  calculateMatch(req, res, res.__next);
  await new Promise(resolve => setImmediate(resolve));

  expect(jmMod.JobMatch.create).toHaveBeenCalled();
  expect(res.status).toHaveBeenCalledWith(200);
  expect(res.json).toHaveBeenCalled();
    });

    it('updates existing JobMatch when present', async () => {
      userMod.User.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue({ auth0Id: 'user-1' }) });
      jobMod.Job.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: 'job-1', title: 'J' }) });
      svc.calculateJobMatch.mockResolvedValue({ overallScore: 90, categoryScores: {}, strengths: [], gaps: [], suggestions: [], customWeights: null, metadata: {} });

      const existing = { save: jest.fn().mockResolvedValue({ _id: 'm', overallScore: 90 }) };
      jmMod.JobMatch.findOne.mockResolvedValue(existing);

  calculateMatch(req, res, res.__next);
  await new Promise(resolve => setImmediate(resolve));

  expect(existing.save).toHaveBeenCalled();
  expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getJobMatch', () => {
    it('returns 404 when match not found', async () => {
      jmMod.JobMatch.findOne.mockResolvedValue(null);
  await getJobMatch(req, res, res.__next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns match when found', async () => {
      jmMod.JobMatch.findOne.mockResolvedValue({ _id: 'm1', overallScore: 70 });
  await getJobMatch(req, res, res.__next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('updateMatchWeights', () => {
    it('returns 400 when weights do not sum to 100', async () => {
      req.body = { skills: 10, experience: 10, education: 10, additional: 10 };
  await updateMatchWeights(req, res, res.__next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 404 when match not found', async () => {
      req.body = { skills: 25, experience: 25, education: 25, additional: 25 };
      jmMod.JobMatch.findOne.mockResolvedValue(null);
  await updateMatchWeights(req, res, res.__next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('updates and saves match when found', async () => {
      req.body = { skills: 25, experience: 25, education: 25, additional: 25 };
      const match = {
        categoryScores: {
          skills: { weight: 0 },
          experience: { weight: 0 },
          education: { weight: 0 },
          additional: { weight: 0 },
        },
        recalculateOverallScore: jest.fn(),
        save: jest.fn().mockResolvedValue(true),
      };
      jmMod.JobMatch.findOne.mockResolvedValue(match);

  updateMatchWeights(req, res, res.__next);
  await new Promise(resolve => setImmediate(resolve));

      expect(match.recalculateOverallScore).toHaveBeenCalled();
      expect(match.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('exportMatchReport', () => {
    it('returns 404 when match not found', async () => {
      // Controller calls JobMatch.findOne(...).lean()
      jmMod.JobMatch.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
  await exportMatchReport(req, res, res.__next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('responds with JSON report when match exists and format=json', async () => {
      const match = { overallScore: 75, matchGrade: 'Good', categoryScores: { skills: { score: 70 }, experience: { score: 80 }, education: { score: 60 }, additional: { score: 50 } }, strengths: [], gaps: [], suggestions: [] };
      jmMod.JobMatch.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(match) });
  jobMod.Job.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: 'job-1', title: 'T', company: 'C', industry: 'I', location: 'L' }) });

  exportMatchReport(req, res, res.__next);
  await new Promise(resolve => setImmediate(resolve));

      expect(res.setHeader).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });

    it('responds with text report when format=text', async () => {
      const match = { overallScore: 88, matchGrade: 'Excellent', categoryScores: { skills: { score: 90 }, experience: { score: 85 }, education: { score: 70 }, additional: { score: 60 } }, strengths: [{ description: 'X', impact: 'high' }], gaps: [{ description: 'Y', severity: 'critical', suggestion: 'Z' }], suggestions: [{ title: 'Do A', priority: 'high', description: 'd', estimatedImpact: 5 }] };
      jmMod.JobMatch.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(match) });
  jobMod.Job.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: 'job-1', title: 'T', company: 'C' }) });

      req.query = { format: 'text' };

      exportMatchReport(req, res, res.__next);
      await new Promise(resolve => setImmediate(resolve));

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/plain');
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe('deleteMatch', () => {
    it('returns 404 when no match to delete', async () => {
      jmMod.JobMatch.findOneAndDelete.mockResolvedValue(null);
  await deleteMatch(req, res, res.__next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('deletes and returns success when found', async () => {
      jmMod.JobMatch.findOneAndDelete.mockResolvedValue({ _id: 'm' });
  await deleteMatch(req, res, res.__next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getMatchTrends', () => {
    it('returns zeroed response when no matches', async () => {
      // JobMatch.find(...).sort(...).lean() chain
      jmMod.JobMatch.find.mockReturnValue({ sort: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue([]) });
  await getMatchTrends(req, res, res.__next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response.data.averageScore).toBe(0);
    });

    it('calculates averages and distribution when matches present', async () => {
      const matches = [
        { overallScore: 90, categoryScores: { skills: { score: 90 }, experience: { score: 85 }, education: { score: 70 }, additional: { score: 60 } }, createdAt: new Date('2025-01-01') },
        { overallScore: 70, categoryScores: { skills: { score: 70 }, experience: { score: 65 }, education: { score: 60 }, additional: { score: 50 } }, createdAt: new Date('2025-01-15') },
      ];
  jmMod.JobMatch.find.mockReturnValue({ sort: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue(matches) });

  await getMatchTrends(req, res, res.__next);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];
      expect(response.data.averageScore).toBeGreaterThan(0);
      expect(response.data.categoryAverages).toBeDefined();
      expect(response.data.weakestCategory).toBeDefined();
    });
  });
});
