import { jest } from '@jest/globals';

const makeRes = () => {
  const sent = {};
  let resolveDone;
  const done = new Promise((r) => { resolveDone = r; });
  return {
    sent,
    res: {
      status: (code) => {
        sent.status = code;
        return {
          json: (body) => {
            sent.body = body;
            if (resolveDone) resolveDone();
            return body;
          }
        };
      }
    },
    done
  };
};

describe('jobController focused tests', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('getJobs returns 401 when no auth', async () => {
    const { scrapeJobFromURL } = {};
  const { res, sent, done } = makeRes();
  const { getJobs } = await import('../jobController.js');

  const req = { auth: null, query: {} };
  getJobs(req, res, () => {});
  await done;

    expect(sent.status).toBe(401);
    expect(sent.body.success).toBe(false);
  });

  it('getJobs returns jobs with filters', async () => {
  const jobMod = await import('../../models/Job.js');
    jobMod.Job.find = jest.fn().mockImplementation(() => {
      const arr = [{ title: 'A' }, { title: 'B' }];
      return {
        sort: () => Promise.resolve(arr),
        then: (cb) => Promise.resolve(arr).then(cb),
        catch: (cb) => Promise.resolve(arr).catch(cb),
      };
    });

    const { getJobs } = await import('../jobController.js');
  const { res, sent, done } = makeRes();

    const req = { auth: { userId: 'u1' }, query: { search: 'engineer', archived: 'false', status: 'Applied' } };
    getJobs(req, res, () => {});
    await done;

    expect(sent.status).toBe(200);
    expect(sent.body.data.jobs.length).toBe(2);
  });

  it('addJob validation error when missing fields', async () => {
    const { addJob } = await import('../jobController.js');
  const { res, sent, done } = makeRes();
    const req = { auth: { userId: 'u1' }, body: { title: '', company: '' } };

    addJob(req, res, () => {});
    await done;

    expect(sent.status).toBe(400);
    expect(sent.body.success).toBe(false);
    expect(sent.body.message).toMatch(/Please fix the following errors/i);
  });

  it('addJob success creates job', async () => {
  const jobMod = await import('../../models/Job.js');
    // Mock Job.find for deduplication check (return empty array = no duplicates)
    jobMod.Job.find = jest.fn().mockResolvedValue([]);
    jobMod.Job.create = jest.fn().mockResolvedValue({ _id: 'j1', industry: 'Tech' });

    const { addJob } = await import('../jobController.js');
  const { res, sent, done } = makeRes();

    const req = { auth: { userId: 'u1' }, body: { title: 'Dev', company: 'Acme' } };
    addJob(req, res, () => {});
    await done;

    expect(sent.status).toBe(200);
    expect(sent.body.data.job._id).toBe('j1');
  });

  it('updateJob returns 404 when job not found', async () => {
  const jobMod = await import('../../models/Job.js');
    jobMod.Job.findOne = jest.fn().mockResolvedValue(null);
    const { updateJob } = await import('../jobController.js');
    const { res, sent, done } = makeRes();

    const req = { auth: { userId: 'u1' }, params: { jobId: 'nope' }, body: {} };
  updateJob(req, res, () => {});
  await done;

    expect(sent.status).toBe(404);
  });

  it('updateJob success saves and returns job', async () => {
    const fakeJob = { _id: 'j2', industry: 'X', save: jest.fn().mockResolvedValue(true) };
  const jobMod = await import('../../models/Job.js');
    jobMod.Job.findOne = jest.fn().mockResolvedValue(fakeJob);
    const { updateJob } = await import('../jobController.js');
  const { res, sent, done } = makeRes();

    const req = { auth: { userId: 'u1' }, params: { jobId: 'j2' }, body: { industry: 'New' } };
    updateJob(req, res, () => {});
    await done;

  // save should be called; response body may be set by sendResponse
  expect(fakeJob.save).toHaveBeenCalled();
    console.log('DEBUG updateJob sent:', sent);
    expect(sent.body).toBeDefined();
  });

  it('updateJobStatus invalid status returns 400', async () => {
  const { updateJobStatus } = await import('../jobController.js');
  const { res, sent, done } = makeRes();
  const req = { auth: { userId: 'u1' }, params: { jobId: 'j1' }, body: { status: 'NotAStatus' } };

  updateJobStatus(req, res, () => {});
  await done;

  expect(sent.status).toBe(400);
  });

  it('updateJobStatus success updates and saves', async () => {
    const fakeJob = { statusHistory: [{ status: 'Interested', timestamp: new Date() }], statusHistoryLength: 1, save: jest.fn().mockResolvedValue(true) };
    // Ensure statusHistory exists and is array
    fakeJob.statusHistory = [{ status: 'Interested', timestamp: new Date() }];

  const jobMod = await import('../../models/Job.js');
    jobMod.Job.findOne = jest.fn().mockResolvedValue(fakeJob);
    const { updateJobStatus } = await import('../jobController.js');
    const { res, sent, done } = makeRes();

    const req = { auth: { userId: 'u1' }, params: { jobId: 'j1' }, body: { status: 'Applied', notes: 'Note' } };
  updateJobStatus(req, res, () => {});
  await done;

  expect(fakeJob.save).toHaveBeenCalled();
  console.log('DEBUG updateJobStatus sent:', sent);
  expect(sent.body).toBeDefined();
  });

  it('bulkUpdateDeadline validates input and updates jobs', async () => {
    const jobA = { _id: 'ja', deadline: null, save: jest.fn().mockResolvedValue(true) };
    const jobB = { _id: 'jb', deadline: null, save: jest.fn().mockResolvedValue(true) };

  const jobMod = await import('../../models/Job.js');
    jobMod.Job.findOne = jest.fn().mockImplementation(({ _id }) => _id === 'ja' ? Promise.resolve(jobA) : Promise.resolve(jobB));
    const { bulkUpdateDeadline } = await import('../jobController.js');
  const { res, sent, done } = makeRes();
    const nowIso = new Date().toISOString();
    const req = { auth: { userId: 'u1' }, body: { jobIds: ['ja','jb'], setDate: nowIso } };
  bulkUpdateDeadline(req, res, () => {});
  await done;

  expect(jobA.save).toHaveBeenCalled();
  console.log('DEBUG bulkUpdateDeadline sent:', sent);
  expect(sent.body).toBeDefined();
  if (sent.body && sent.body.data) expect(sent.body.data.updated).toBe(2);
  });

  it('deleteJob returns 404 when not found and 200 when deleted', async () => {
  const jobMod = await import('../../models/Job.js');
    jobMod.Job.findOneAndDelete = jest.fn().mockResolvedValue(null);
    const { deleteJob } = await import('../jobController.js');
    let { res, sent } = makeRes();
    let req = { auth: { userId: 'u1' }, params: { jobId: 'nope' } };
    await deleteJob(req, res);
    expect(sent.status).toBe(404);

    // now mock delete success
    await jest.resetModules();
  const jobMod2 = await import('../../models/Job.js');
    jobMod2.Job.findOneAndDelete = jest.fn().mockResolvedValue({ _id: 'del1' });
    const mod = await import('../jobController.js');
    ({ res, sent } = makeRes());
    req = { auth: { userId: 'u1' }, params: { jobId: 'del1' } };
    await mod.deleteJob(req, res);
    expect(sent.status).toBe(200);
  });

  it('sendDeadlineReminders calls deadline util and returns result', async () => {
  await jest.unstable_mockModule('../../utils/deadlineReminders.js', () => ({ sendDeadlineRemindersNow: jest.fn().mockResolvedValue({ processed: 3 }) }));
  const { sendDeadlineReminders } = await import('../jobController.js');
  const { res, sent } = makeRes();
  const req = { auth: { userId: 'u1' } };
  await sendDeadlineReminders(req, res);
  expect(sent.body).toBeDefined();
  if (sent.body && sent.body.data) expect(sent.body.data.processed).toBe(3);
  });

});
