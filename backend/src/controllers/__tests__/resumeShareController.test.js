import { jest } from '@jest/globals';

// Pre-register ESM mocks for models
await jest.unstable_mockModule('../../models/Resume.js', () => ({
  __esModule: true,
  Resume: {
    findOne: jest.fn(),
    find: jest.fn(),
  },
}));

await jest.unstable_mockModule('../../models/ResumeFeedback.js', () => ({
  __esModule: true,
  ResumeFeedback: {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
  },
}));

await jest.unstable_mockModule('../../models/User.js', () => ({
  __esModule: true,
  User: {
    findOne: jest.fn(),
  },
}));

describe('resumeShareController', () => {
  let Resume, ResumeFeedback, User, controller;

  beforeEach(async () => {
    jest.resetModules();
    jest.clearAllMocks();

    const r = await import('../../models/Resume.js');
    Resume = r.Resume;
    const rf = await import('../../models/ResumeFeedback.js');
    ResumeFeedback = rf.ResumeFeedback;
    const u = await import('../../models/User.js');
    User = u.User;

    controller = await import('../resumeShareController.js');
  });

  function makeRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn();
    res.setHeader = jest.fn();
    res.send = jest.fn();
    return res;
  }

  test('createShareLink - resume not found returns 404', async () => {
    Resume.findOne = jest.fn().mockResolvedValue(null);
    const req = { auth: { userId: 'u1' }, params: { id: 'r1' }, body: {} };
    const res = makeRes();

    await controller.createShareLink(req, res);

    expect(res.json).toHaveBeenCalled();
    const resp = res.json.mock.calls[0][0];
    expect(resp.success).toBe(false);
    expect(resp.message).toMatch(/Resume not found/i);
  });

  test('createShareLink - success creates share and saves', async () => {
    const resume = { _id: 'r1', userId: 'u1', shares: [], save: jest.fn().mockResolvedValue(true) };
    Resume.findOne = jest.fn().mockResolvedValue(resume);

    const req = { auth: { userId: 'u1' }, params: { id: 'r1' }, body: { privacy: 'unlisted' } };
    const res = makeRes();

    await controller.createShareLink(req, res);

    expect(resume.save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalled();
    const resp = res.json.mock.calls[0][0];
    expect(resp.success).toBe(true);
    expect(resp.data.share).toBeDefined();
    expect(resp.data.url).toMatch(/\/share\//);
  });

  test('listShares - not found returns 404', async () => {
    Resume.findOne = jest.fn().mockResolvedValue(null);
    const req = { auth: { userId: 'u1' }, params: { id: 'r1' } };
    const res = makeRes();

    await controller.listShares(req, res);

    expect(res.json).toHaveBeenCalled();
    const resp = res.json.mock.calls[0][0];
    expect(resp.success).toBe(false);
  });

  test('listShares - returns shares', async () => {
    const resume = { _id: 'r1', userId: 'u1', shares: [{ token: 't1' }] };
  Resume.findOne = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(resume) });
    const req = { auth: { userId: 'u1' }, params: { id: 'r1' } };
    const res = makeRes();

    await controller.listShares(req, res);

    expect(res.json).toHaveBeenCalled();
    const resp = res.json.mock.calls[0][0];
    expect(resp.success).toBe(true);
    expect(resp.data.shares).toEqual(resume.shares);
  });

  test('revokeShare - not found share returns 404', async () => {
    const resume = { _id: 'r1', userId: 'u1', shares: [] };
    Resume.findOne = jest.fn().mockResolvedValue(resume);
    const req = { auth: { userId: 'u1' }, params: { id: 'r1', token: 'nope' } };
    const res = makeRes();

    await controller.revokeShare(req, res);

    expect(res.json).toHaveBeenCalled();
    const resp = res.json.mock.calls[0][0];
    expect(resp.success).toBe(false);
  });

  test('revokeShare - success sets revoked and saves', async () => {
    const share = { token: 't1', status: 'active' };
    const resume = { _id: 'r1', userId: 'u1', shares: [share], save: jest.fn().mockResolvedValue(true) };
    Resume.findOne = jest.fn().mockResolvedValue(resume);
    const req = { auth: { userId: 'u1' }, params: { id: 'r1', token: 't1' } };
    const res = makeRes();

    await controller.revokeShare(req, res);

    expect(share.status).toBe('revoked');
    expect(resume.save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalled();
  });

  test('getSharedResume - redacts contact when cannot view contact', async () => {
    const shared = { _id: 'r1', name: 'R', sections: { contactInfo: { name: 'A', location: 'L', linkedin: 'li', github: 'gh', website: 'w', phone: '123' } }, shares: [] };
    const share = { token: 't1', allowComments: true, canViewContact: false };
    const req = { sharedResume: shared, share };
    const res = makeRes();

    await controller.getSharedResume(req, res);

    expect(res.json).toHaveBeenCalled();
    const resp = res.json.mock.calls[0][0];
    expect(resp.data.resume.sections.contactInfo.phone).toBeUndefined();
    expect(resp.data.resume.shares).toBeUndefined();
  });

  test('createFeedback - comments disabled returns 403', async () => {
    const shared = { _id: 'r1', name: 'R' };
    const share = { token: 't1', allowComments: false, privacy: 'unlisted' };
    const req = { sharedResume: shared, share, body: { comment: 'hi' }, reviewerEmail: 'a@b.com' };
    const res = makeRes();

    await controller.createFeedback(req, res);

    expect(res.json).toHaveBeenCalled();
    const resp = res.json.mock.calls[0][0];
    expect(resp.success).toBe(false);
  });

  test('createFeedback - success creates feedback and notifies owner', async () => {
    const shared = { _id: 'r1', name: 'R', userId: 'owner-1' };
    const share = { token: 't1', allowComments: true, privacy: 'unlisted' };
    ResumeFeedback.create = jest.fn().mockResolvedValue({ _id: 'f1', resumeId: 'r1' });
    User.findOne = jest.fn().mockResolvedValue({ auth0Id: 'owner-1', notifications: [], save: jest.fn().mockResolvedValue(true) });

    const req = { sharedResume: shared, share, body: { comment: 'Nice', authorEmail: 'r@e.com', authorName: 'Rev' }, auth: { payload: { sub: null } } };
    const res = makeRes();

    await controller.createFeedback(req, res);

    expect(ResumeFeedback.create).toHaveBeenCalled();
    expect(User.findOne).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalled();
    const resp = res.json.mock.calls[0][0];
    expect(resp.success).toBe(true);
  });

  test('listFeedbackForResume - returns list', async () => {
    const resume = { _id: 'r1', userId: 'u1' };
  Resume.findOne = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(resume) });
  ResumeFeedback.find = jest.fn().mockReturnValue({ sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([{ _id: 'f1' }]) }) });
    const req = { auth: { userId: 'u1' }, params: { id: 'r1' } };
    const res = makeRes();

    await controller.listFeedbackForResume(req, res);

    expect(res.json).toHaveBeenCalled();
    const resp = res.json.mock.calls[0][0];
    expect(resp.data.feedback.length).toBeGreaterThanOrEqual(1);
  });

  test('listFeedbackForShare - returns list', async () => {
    const share = { token: 't1' };
    ResumeFeedback.find = jest.fn().mockReturnValue({ sort: () => ({ lean: () => Promise.resolve([{ _id: 'f1' }]) }) });
    const req = { share };
    const res = makeRes();

    await controller.listFeedbackForShare(req, res);

    expect(res.json).toHaveBeenCalled();
  });

  test('resolveFeedback - feedback not found returns 404', async () => {
    ResumeFeedback.findById = jest.fn().mockResolvedValue(null);
    const req = { auth: { userId: 'u1' }, params: { feedbackId: 'fx' } };
    const res = makeRes();

    await controller.resolveFeedback(req, res);

    expect(res.json).toHaveBeenCalled();
    const resp = res.json.mock.calls[0][0];
    expect(resp.success).toBe(false);
  });

  test('resolveFeedback - success resolves and notifies', async () => {
    const fb = { _id: 'f1', resumeId: 'r1', save: jest.fn().mockResolvedValue(true) };
    ResumeFeedback.findById = jest.fn().mockResolvedValue(fb);
    Resume.findOne = jest.fn().mockResolvedValue({ _id: 'r1', userId: 'u1', name: 'R' });
    User.findOne = jest.fn().mockResolvedValue({ auth0Id: 'u1', notifications: [], save: jest.fn().mockResolvedValue(true) });
    const req = { auth: { userId: 'u1' }, params: { feedbackId: 'f1' }, body: { resolutionNote: 'ok' } };
    const res = makeRes();

    await controller.resolveFeedback(req, res);

    expect(fb.status).toBe('resolved');
    expect(fb.save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalled();
  });

  test('exportFeedbackSummary - csv returns csv via res.send', async () => {
    const resume = { _id: 'r1', userId: 'u1', name: 'My Resume' };
  Resume.findOne = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(resume) });
  const items = [{ _id: 'f1', status: 'open', authorName: 'A', authorEmail: 'a@b.com', createdAt: new Date(), resolvedAt: null, resolutionNote: null }];
  ResumeFeedback.find = jest.fn().mockReturnValue({ sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(items) }) });
    const req = { auth: { userId: 'u1' }, params: { id: 'r1' }, query: { format: 'csv' } };
    const res = makeRes();

    await controller.exportFeedbackSummary(req, res);

    expect(res.setHeader).toHaveBeenCalled();
    expect(res.send).toHaveBeenCalled();
    const sent = res.send.mock.calls[0][0];
    expect(sent).toContain('FeedbackID');
  });

  test('exportFeedbackSummary - json returns data', async () => {
    const resume = { _id: 'r1', userId: 'u1', name: 'My Resume' };
  Resume.findOne = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(resume) });
  const items = [{ _id: 'f1' }];
  ResumeFeedback.find = jest.fn().mockReturnValue({ sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(items) }) });
    const req = { auth: { userId: 'u1' }, params: { id: 'r1' }, query: {} };
    const res = makeRes();

    await controller.exportFeedbackSummary(req, res);

    expect(res.json).toHaveBeenCalled();
    const resp = res.json.mock.calls[0][0];
    expect(resp.data.feedback).toEqual(items);
  });
});
