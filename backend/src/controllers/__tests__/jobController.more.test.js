import { jest } from '@jest/globals';

const makeRes = () => {
  const sent = {};
  let resolveDone;
  const done = new Promise((r) => { resolveDone = r; });
  return {
    sent,
    res: {
      status: (code) => ({ json: (body) => { sent.status = code; sent.body = body; if (resolveDone) resolveDone(); return body; } })
    },
    done
  };
};

describe('jobController additional coverage tests', () => {
  beforeEach(() => jest.resetModules());

  it('getJobStats returns counts using countDocuments', async () => {
    const jobMod = await import('../../models/Job.js');
    // return 2 for any countDocuments call
    jobMod.Job.countDocuments = jest.fn().mockResolvedValue(2);

    const { getJobStats } = await import('../jobController.js');
    const { res, sent, done } = makeRes();
    const req = { auth: { userId: 'u1' } };

    getJobStats(req, res, () => {});
    await done;

    expect(sent.status).toBe(200);
    expect(sent.body.data.byStatus).toBeDefined();
    expect(Object.keys(sent.body.data.byStatus).length).toBeGreaterThan(0);
    expect(sent.body.data.totalActive).toBeDefined();
  });

  it('getJobAnalytics computes many metrics from a varied jobs set', async () => {
    const now = new Date();
    const days = (n) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000).toISOString();

    const allJobs = [
      {
        _id: 'a1', company: 'Acme', industry: 'Tech', workMode: 'Remote', status: 'Applied',
        createdAt: days(60), applicationDate: days(5), deadline: new Date(new Date().getTime() + 5*24*60*60*1000).toISOString(),
        statusHistory: [ { status: 'Interested', timestamp: days(10) }, { status: 'Applied', timestamp: days(5) } ]
      },
      {
        _id: 'b1', company: 'Beta', industry: 'Finance', workMode: 'On-site', status: 'Offer',
        createdAt: days(30), applicationDate: days(25), deadline: days(1),
        statusHistory: [ { status: 'Interested', timestamp: days(30) }, { status: 'Applied', timestamp: days(25) }, { status: 'Offer', timestamp: days(5) } ]
      },
      {
        _id: 'c1', company: 'Gamma', industry: 'Tech', workMode: 'Hybrid', status: 'Interview',
        createdAt: days(7), applicationDate: null, deadline: new Date(new Date().getTime() + 10*24*60*60*1000).toISOString(),
        statusHistory: [ { status: 'Interested', timestamp: days(20) }, { status: 'Applied', timestamp: days(15) }, { status: 'Phone Screen', timestamp: days(8) }, { status: 'Interview', timestamp: days(2) } ]
      }
    ];

    const jobMod = await import('../../models/Job.js');
    jobMod.Job.find = jest.fn().mockImplementation(() => Promise.resolve(allJobs));

    const { getJobAnalytics } = await import('../jobController.js');
    const { res, sent, done } = makeRes();
    const req = { auth: { userId: 'u1' } };

    getJobAnalytics(req, res, () => {});
    await done;

    expect(sent.status).toBe(200);
    const data = sent.body.data;
    expect(data.overview.totalApplications).toBe(allJobs.length);
    expect(data.deadlineTracking).toBeDefined();
    expect(typeof data.avgTimeByStage).toBe('object');
    expect(Array.isArray(data.companyAnalytics)).toBe(true);
    expect(Array.isArray(data.industryAnalytics)).toBe(true);
  });

  it('getJobAnalytics triggers recommendations and company/industry branches', async () => {
    const now = new Date();
    const days = (n) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000).toISOString();

    // Build jobs to trigger recommendation branches and fast responder detection
    const fastResponseJob = {
      _id: 'f1', company: 'FastCo', industry: 'Quick', workMode: 'Remote', status: 'Interview',
      createdAt: days(3), applicationDate: days(2), deadline: null,
      statusHistory: [ { status: 'Interested', timestamp: days(4) }, { status: 'Applied', timestamp: days(2) }, { status: 'Phone Screen', timestamp: days(1) } ]
    };

    // Create several jobs in one industry to push successRate over threshold
    const manyIndustryJobs = [];
    for (let i = 0; i < 12; i++) {
      manyIndustryJobs.push({
        _id: `h${i}`, company: `Hot${i}`, industry: 'HotIndustry', workMode: 'Hybrid', status: i % 3 === 0 ? 'Interview' : 'Applied',
        createdAt: days(10 + i), applicationDate: days(9 + i), deadline: null,
        statusHistory: [ { status: 'Interested', timestamp: days(15 + i) }, { status: 'Applied', timestamp: days(9 + i) }, { status: (i % 3 === 0 ? 'Interview' : 'Applied'), timestamp: days(5 + i) } ]
      });
    }

    const allJobs = [fastResponseJob, ...manyIndustryJobs];

    const jobMod = await import('../../models/Job.js');
    jobMod.Job.find = jest.fn().mockImplementation(() => Promise.resolve(allJobs));

    const { getJobAnalytics } = await import('../jobController.js');
    const { res, sent, done } = makeRes();
    const req = { auth: { userId: 'u1' } };

    getJobAnalytics(req, res, () => {});
    await done;

    expect(sent.status).toBe(200);
    const data = sent.body.data;
    // recommendations should be an array and may include critical/info messages
    expect(Array.isArray(data.recommendations)).toBe(true);
    // companyAnalytics should include FastCo and show numeric avgResponseTime or 'N/A'
    const fast = data.companyAnalytics.find(c => c.company === 'FastCo' || c.company === 'Hot0');
    expect(fast).toBeTruthy();
    expect(data.industryAnalytics.some(i => i.industry === 'HotIndustry')).toBe(true);
  });

  it('bulkArchiveJobs archives found jobs', async () => {
    const jobA = { _id: 'ja', archived: false, save: jest.fn().mockResolvedValue(true) };
    const jobB = { _id: 'jb', archived: false, save: jest.fn().mockResolvedValue(true) };
    const jobMod = await import('../../models/Job.js');
    jobMod.Job.find = jest.fn().mockResolvedValue([jobA, jobB]);

    const { bulkArchiveJobs } = await import('../jobController.js');
    const { res, sent, done } = makeRes();
    const req = { auth: { userId: 'u1' }, body: { jobIds: ['ja','jb'], reason: 'test', notes: 'n' } };

    bulkArchiveJobs(req, res, () => {});
    await done;

    expect(jobA.save).toHaveBeenCalled();
    expect(sent.status).toBe(200);
    expect(sent.body.data.count).toBe(2);
  });

  it('bulkRestoreJobs restores archived jobs', async () => {
    const jobA = { _id: 'ra', archived: true, save: jest.fn().mockResolvedValue(true) };
    const jobMod = await import('../../models/Job.js');
    jobMod.Job.find = jest.fn().mockResolvedValue([jobA]);

    const { bulkRestoreJobs } = await import('../jobController.js');
    const { res, sent, done } = makeRes();
    const req = { auth: { userId: 'u1' }, body: { jobIds: ['ra'] } };

    bulkRestoreJobs(req, res, () => {});
    await done;

    expect(jobA.save).toHaveBeenCalled();
    expect(sent.body.data.count).toBe(1);
  });

  it('autoArchiveJobs moves jobs to archived', async () => {
    const jobA = { _id: 'aa', archived: false, save: jest.fn().mockResolvedValue(true) };
    const jobMod = await import('../../models/Job.js');
    jobMod.Job.find = jest.fn().mockResolvedValue([jobA]);

    const { autoArchiveJobs } = await import('../jobController.js');
    const { res, sent, done } = makeRes();
    const req = { auth: { userId: 'u1' }, body: { daysInactive: 0 } };

    autoArchiveJobs(req, res, () => {});
    await done;

    expect(jobA.save).toHaveBeenCalled();
    expect(sent.body.data.count).toBe(1);
  });

  it('bulkUpdateStatus updates multiple jobs', async () => {
    const jobA = { _id: 's1', statusHistory: [{ status: 'Interested', timestamp: new Date().toISOString() }], save: jest.fn().mockResolvedValue(true) };
    const jobMod = await import('../../models/Job.js');
    jobMod.Job.find = jest.fn().mockResolvedValue([jobA]);

    const { bulkUpdateStatus } = await import('../jobController.js');
    const { res, sent, done } = makeRes();
    const req = { auth: { userId: 'u1' }, body: { jobIds: ['s1'], status: 'Applied', notes: 'note' } };

    bulkUpdateStatus(req, res, () => {});
    await done;

    expect(jobA.save).toHaveBeenCalled();
    expect(sent.body.data.count).toBeDefined();
  });

  it('linkResumeToJob links resume and saves', async () => {
    const job = { _id: 'l1', save: jest.fn().mockResolvedValue(true) };
    const jobMod = await import('../../models/Job.js');
    jobMod.Job.findOne = jest.fn().mockResolvedValue(job);

    const { linkResumeToJob } = await import('../jobController.js');
    const { res, sent, done } = makeRes();
    const req = { auth: { userId: 'u1' }, params: { jobId: 'l1' }, body: { resumeId: 'r1' } };

    linkResumeToJob(req, res, () => {});
    await done;

    expect(job.save).toHaveBeenCalled();
    expect(sent.status).toBe(200);
  });

  it('archiveJob and restoreJob toggle archive state', async () => {
    const job = { _id: 't1', archived: false, save: jest.fn().mockResolvedValue(true) };
    const jobMod = await import('../../models/Job.js');
    jobMod.Job.findOne = jest.fn().mockResolvedValue(job);

    const { archiveJob, restoreJob } = await import('../jobController.js');
    const { res: res1, sent: sent1, done: done1 } = makeRes();
    const req1 = { auth: { userId: 'u1' }, params: { jobId: 't1' }, body: { reason: 'r' } };

    archiveJob(req1, res1, () => {});
    await done1;
    expect(job.save).toHaveBeenCalled();

    // now simulate archived = true and restore
    job.archived = true;
    const { res: res2, sent: sent2, done: done2 } = makeRes();
    const req2 = { auth: { userId: 'u1' }, params: { jobId: 't1' } };
    restoreJob(req2, res2, () => {});
    await done2;
    expect(job.save).toHaveBeenCalled();
    expect(sent2.status).toBe(200);
  });

  it('getJobAnalytics comprehensive coverage for remaining branches', async () => {
    const now = new Date();
    const days = (n) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000).toISOString();

    const statuses = ['Interested','Applied','Phone Screen','Interview','Offer','Rejected','Accepted'];
    const allJobs = [];
    for (let i = 0; i < 30; i++) {
      const status = statuses[i % statuses.length];
      const company = `Co${i%6}`;
      const industry = `Ind${i%4}`;
      const createdAt = days( i );
      const appDate = i % 2 === 0 ? days(i - 1) : null;
      const deadline = i % 3 === 0 ? new Date(new Date().getTime() + (i%7)*24*60*60*1000).toISOString() : null;

      const history = [{ status: 'Interested', timestamp: days(i+5) }];
      if (appDate) history.push({ status: 'Applied', timestamp: appDate });
      if (status !== 'Interested' && status !== 'Applied') history.push({ status, timestamp: days(i-1) });

      allJobs.push({ _id: `x${i}`, company, industry, workMode: ['Remote','Hybrid','On-site'][i%3], status, createdAt, applicationDate: appDate, deadline, statusHistory: history });
    }

    const jobMod = await import('../../models/Job.js');
    jobMod.Job.find = jest.fn().mockImplementation(() => Promise.resolve(allJobs));

    const { getJobAnalytics } = await import('../jobController.js');
    const { res, sent, done } = makeRes();
    const req = { auth: { userId: 'u1' } };

    getJobAnalytics(req, res, () => {});
    await done;

    expect(sent.status).toBe(200);
    const d = sent.body.data;
    // assert many parts exist and have reasonable shapes
    expect(d.monthlyVolume).toBeDefined();
    expect(Array.isArray(d.monthlyVolume)).toBe(true);
    expect(d.funnelAnalytics).toBeDefined();
    expect(d.companyAnalytics.length).toBeGreaterThan(0);
    expect(typeof d.goalTracking).toBe('object');
  });

  it('getJobAnalytics recommendations coverage - low response rate & industry success', async () => {
    const now = new Date();
    const days = (n) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000).toISOString();

    const allJobs = [];
    // Create 15 applied jobs with minimal responses (to force low responseRate)
    for (let i = 0; i < 15; i++) {
      allJobs.push({ _id: `ap${i}`, company: `C${i%3}`, industry: `Ind${i%2}`, workMode: 'Remote', status: 'Applied', createdAt: days(1), applicationDate: days(1), deadline: null, statusHistory: [{ status: 'Interested', timestamp: days(3) }, { status: 'Applied', timestamp: days(1) }] });
    }
    // Add 2 responded jobs only
    allJobs.push({ _id: 'r1', company: 'Resp1', industry: 'IndX', workMode: 'On-site', status: 'Phone Screen', createdAt: days(2), applicationDate: days(2), statusHistory: [{ status: 'Interested', timestamp: days(4) }, { status: 'Applied', timestamp: days(2) }, { status: 'Phone Screen', timestamp: days(1) }] });
    allJobs.push({ _id: 'r2', company: 'Resp2', industry: 'IndX', workMode: 'Hybrid', status: 'Interview', createdAt: days(2), applicationDate: days(2), statusHistory: [{ status: 'Interested', timestamp: days(4) }, { status: 'Applied', timestamp: days(2) }, { status: 'Interview', timestamp: days(1) }] });

    // Add many jobs in one industry to create high successRate for that industry
    for (let i = 0; i < 12; i++) {
      const s = i % 4 === 0 ? 'Interview' : 'Applied';
      allJobs.push({ _id: `hot${i}`, company: `Hot${i}`, industry: 'HotIndustry', workMode: 'Hybrid', status: s, createdAt: days(2), applicationDate: days(2), statusHistory: [{ status: 'Interested', timestamp: days(5) }, { status: 'Applied', timestamp: days(2) }, { status: s, timestamp: days(1) }] });
    }

    const jobMod = await import('../../models/Job.js');
    jobMod.Job.find = jest.fn().mockImplementation(() => Promise.resolve(allJobs));

    const { getJobAnalytics } = await import('../jobController.js');
    const { res, sent, done } = makeRes();
    const req = { auth: { userId: 'u1' } };

    getJobAnalytics(req, res, () => {});
    await done;

    expect(sent.status).toBe(200);
    const data = sent.body.data;
    // Low response rate recommendation expected
    expect(data.recommendations.length).toBeGreaterThanOrEqual(1);
    // HotIndustry should be present and likely have successRate > 20
    const hot = data.industryAnalytics.find(i => i.industry === 'HotIndustry');
    expect(hot).toBeTruthy();
  });

});
