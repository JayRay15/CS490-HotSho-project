import { jest } from '@jest/globals';

// Pre-register ESM mocks before importing the module under test
const mockFetch = jest.fn();
await jest.unstable_mockModule('node-fetch', () => ({ default: mockFetch }));

const mockFindOne = jest.fn();
await jest.unstable_mockModule('../../models/Job.js', () => ({ Job: { findOne: mockFindOne } }));

const { fetchEnrichedJobData } = await import('../../utils/jobDataFetcher.js');

describe('fetchEnrichedJobData - enrichment and parsing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('enriches from JSON-LD when available (description + skills + qualifications)', async () => {
    const html = `<!doctype html><html><head><script type="application/ld+json">{"@type":"JobPosting","description":"<p>Great job</p>","skills":["JS","Node"],"qualifications":"3+ years"}</script></head><body></body></html>`;
    // Mock fetch to return ok and the html
    mockFetch.mockResolvedValue({ ok: true, text: async () => html });

    const job = { _id: 'j1', userId: 'u1', title: 'T', company: 'C', location: 'L', url: 'https://example.com/job', description: '', requirements: [] };
    mockFindOne.mockReturnValue({ lean: () => Promise.resolve(job) });

    const res = await fetchEnrichedJobData('j1', 'u1');

    expect(mockFindOne).toHaveBeenCalledWith({ _id: 'j1', userId: 'u1' });
    expect(mockFetch).toHaveBeenCalled();
    expect(res.description).toContain('Great job');
    // requirements should include both skills and qualifications
    expect(res.requirements).toEqual(expect.arrayContaining(['JS', 'Node', '3+ years']));
  });

  it('falls back to description pattern and extracts list requirements', async () => {
    const longDesc = '<div id="jobDescriptionText">' + 'A'.repeat(200) + '</div>';
    const listHtml = '<ul class="requirements"><li>Requirement one</li><li>Requirement two</li></ul>';
    const html = `<!doctype html><html><body>${longDesc}${listHtml}</body></html>`;

    mockFetch.mockResolvedValue({ ok: true, text: async () => html });

    const job = { _id: 'j2', userId: 'u2', title: 'T2', company: 'C2', location: 'L2', url: 'https://example.com/job2', description: '', requirements: [] };
    mockFindOne.mockReturnValue({ lean: () => Promise.resolve(job) });

    const res = await fetchEnrichedJobData('j2', 'u2');

    expect(res.description.length).toBeGreaterThan(0);
    expect(res.requirements).toEqual(expect.arrayContaining([expect.stringContaining('Requirement one'), expect.stringContaining('Requirement two')]));
  });

  it('extracts requirements from description when list patterns missing', async () => {
  // Make the description long enough so the fallback description pattern captures it (>100 chars)
  // Use longer requirement items so they pass the length filter (>10 chars)
  const desc = '<div class="description">' + 'Intro text '.repeat(20) + 'Requirements:\n- Senior Skill Alpha\n- Senior Skill Beta\n</div>';
    const html = `<!doctype html><html><body>${desc}</body></html>`;

    mockFetch.mockResolvedValue({ ok: true, text: async () => html });

    const job = { _id: 'j3', userId: 'u3', title: 'T3', company: 'C3', location: 'L3', url: 'https://example.com/job3', description: '', requirements: [] };
    mockFindOne.mockReturnValue({ lean: () => Promise.resolve(job) });

    const res = await fetchEnrichedJobData('j3', 'u3');

    expect(res.requirements.length).toBeGreaterThan(0);
    expect(res.requirements[0]).toMatch(/Skill A|Skill B/);
  });

  it('does not modify job when fetch response is not ok', async () => {
    mockFetch.mockResolvedValue({ ok: false, text: async () => '' });
    const job = { _id: 'j4', userId: 'u4', title: 'T4', company: 'C4', location: 'L4', url: 'https://example.com/job4', description: '', requirements: [] };
    mockFindOne.mockReturnValue({ lean: () => Promise.resolve(job) });

    const res = await fetchEnrichedJobData('j4', 'u4');

    // Still returns the job shape with empty description/requirements
    expect(res.description).toBe('');
    expect(res.requirements).toEqual([]);
  });

  it('continues gracefully when fetch throws (network error)', async () => {
    mockFetch.mockRejectedValue(new Error('network'));
    const job = { _id: 'j5', userId: 'u5', title: 'T5', company: 'C5', location: 'L5', url: 'https://bad.example', description: '', requirements: [] };
    mockFindOne.mockReturnValue({ lean: () => Promise.resolve(job) });

    const res = await fetchEnrichedJobData('j5', 'u5');

    // Returns shape even if enrichment failed
    expect(res.title).toBe('T5');
    expect(res.requirements).toEqual([]);
  });
});
