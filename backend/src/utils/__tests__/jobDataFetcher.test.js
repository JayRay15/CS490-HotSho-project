import { jest } from '@jest/globals';

// Mock Job model and node-fetch before importing module under test
const mockJobFindOne = jest.fn();
// Mock the model as imported by the util (relative from utils/ file)
jest.unstable_mockModule('../../models/Job.js', () => ({
  Job: { findOne: mockJobFindOne }
}));
jest.unstable_mockModule('../../models/Job', () => ({
  Job: { findOne: mockJobFindOne }
}));

const mockFetch = jest.fn();
jest.unstable_mockModule('node-fetch', () => ({
  default: mockFetch
}));

const { fetchEnrichedJobData } = await import('../jobDataFetcher.js');

describe('fetchEnrichedJobData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when no jobId provided', async () => {
    const res = await fetchEnrichedJobData(undefined, 'user');
    expect(res).toBeNull();
  });

  it('returns null when job not found', async () => {
    // findOne should return an object with .lean() in our mocks
    mockJobFindOne.mockReturnValueOnce({ lean: jest.fn().mockResolvedValue(null) });
    const res = await fetchEnrichedJobData('jid', 'uid');
    expect(res).toBeNull();
    expect(mockJobFindOne).toHaveBeenCalledWith({ _id: 'jid', userId: 'uid' });
  });

  it('returns job as-is when description present (no fetch)', async () => {
  const job = { _id: 'j1', userId: 'u1', title: 'T', company: 'C', description: 'desc', requirements: ['a'] };
  mockJobFindOne.mockReturnValueOnce({ lean: jest.fn().mockResolvedValue(job) });
  const res = await fetchEnrichedJobData('j1', 'u1');
    expect(res.title).toBe('T');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('enriches job from JSON-LD when incomplete and url present', async () => {
    const job = { _id: 'j2', userId: 'u2', title: 'T2', company: 'C2', url: 'https://example.com/job', description: null, requirements: [] };
  mockJobFindOne.mockReturnValueOnce({ lean: jest.fn().mockResolvedValue(job) });

    const jsonLd = JSON.stringify({ '@type': 'JobPosting', description: '<p>Job desc here</p>', skills: ['skill1','skill2'] });
    const html = `<html><head><script type="application/ld+json">${jsonLd}</script></head><body></body></html>`;

    mockFetch.mockResolvedValueOnce({ ok: true, text: async () => html });

    const res = await fetchEnrichedJobData('j2', 'u2');
    expect(res.description).toContain('Job desc here');
    expect(res.requirements.length).toBeGreaterThan(0);
    expect(mockFetch).toHaveBeenCalled();
  });

  it('gracefully handles fetch failure and returns job data', async () => {
    const job = { _id: 'j3', userId: 'u3', title: 'T3', company: 'C3', url: 'https://bad.example', description: null, requirements: [] };
  mockJobFindOne.mockReturnValueOnce({ lean: jest.fn().mockResolvedValue(job) });
    mockFetch.mockRejectedValueOnce(new Error('network')); // simulate fetch error

    const res = await fetchEnrichedJobData('j3', 'u3');
    expect(res.title).toBe('T3');
    // ensure function didn't throw
  });
});
