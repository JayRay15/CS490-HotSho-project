import { jest } from '@jest/globals';

// Use real module imports but monkey-patch the functions we need. This avoids unstable_mockModule path
// resolution issues across different import strings.
const ResumeModule = await import('../../models/Resume.js');
const responseFormat = await import('../../utils/responseFormat.js');

// Replace the model's DB call with a Jest mock. Avoid mocking ESM utils (read-only)
const mockFindOne = jest.fn();
ResumeModule.Resume.findOne = mockFindOne;
// Helper to emulate Mongoose Query. findOne(...).lean() => Promise
const returnsLean = (val) => ({ lean: () => Promise.resolve(val) });
const rejectsLean = (err) => ({ lean: () => Promise.reject(err) });

const { ensureShareAccess } = await import('../shareAccess.js');

describe('ensureShareAccess middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindOne.mockReset();
  });

  it('responds 400 when token is missing', async () => {
  const req = { params: {}, headers: {}, query: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    const next = jest.fn();

    await ensureShareAccess(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
  expect(res.json).toHaveBeenCalled();
  expect(res.json.mock.calls[0][0].message).toBe('Share token is required');
    expect(next).not.toHaveBeenCalled();
  });

  it('responds 404 when share not found', async () => {
    mockFindOne.mockReturnValue(returnsLean(null));
  const req = { params: { token: 't1' }, headers: {}, query: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    const next = jest.fn();

    await ensureShareAccess(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  expect(res.json).toHaveBeenCalled();
  expect(res.json.mock.calls[0][0].message).toBe('Share link not found');
    expect(next).not.toHaveBeenCalled();
  });

    it('responds 403 when share revoked or inactive', async () => {
    mockFindOne.mockReturnValue(returnsLean({ shares: [{ token: 't1', status: 'revoked' }] }));
    const req = { params: { token: 't1' }, headers: {}, query: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    const next = jest.fn();

    await ensureShareAccess(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  expect(res.json).toHaveBeenCalled();
  expect(res.json.mock.calls[0][0].message).toBe('This share link has been revoked');
    expect(next).not.toHaveBeenCalled();
  });

  it('responds 403 when share expired', async () => {
    const past = new Date(Date.now() - 1000 * 60 * 60).toISOString();
  mockFindOne.mockReturnValue(returnsLean({ shares: [{ token: 't1', status: 'active', expiresAt: past }] }));
    const req = { params: { token: 't1' }, headers: {}, query: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    const next = jest.fn();

    await ensureShareAccess(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  expect(res.json).toHaveBeenCalled();
  expect(res.json.mock.calls[0][0].message).toBe('This share link has expired');
    expect(next).not.toHaveBeenCalled();
  });

  it("responds 403 when privacy is private and reviewer isn't allowed", async () => {
  mockFindOne.mockReturnValue(returnsLean({ shares: [{ token: 't1', status: 'active', privacy: 'private', allowedReviewers: [] }] }));
  const req = { params: { token: 't1' }, headers: { 'x-reviewer-email': 'someone@example.com' }, query: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    const next = jest.fn();

    await ensureShareAccess(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  expect(res.json).toHaveBeenCalled();
  expect(res.json.mock.calls[0][0].message).toBe("You don't have access to this shared resume");
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next and attaches resume/share for public active share', async () => {
    const resume = { id: 'r1', shares: [{ token: 't1', status: 'active', privacy: 'public' }] };
  mockFindOne.mockReturnValue(returnsLean(resume));
  const req = { params: { token: 't1' }, headers: {}, query: {} };
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    const next = jest.fn();

    await ensureShareAccess(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.sharedResume).toBe(resume);
    expect(req.share).toEqual(resume.shares[0]);
    expect(req.reviewerEmail).toBe('');
  });

  it('allows private share when reviewer is in allowlist', async () => {
    const resume = { id: 'r2', shares: [{ token: 't2', status: 'active', privacy: 'private', allowedReviewers: [{ email: 'allowed@example.com' }] }] };
  mockFindOne.mockReturnValue(returnsLean(resume));
  const req = { params: { token: 't2' }, headers: { 'x-reviewer-email': 'allowed@example.com' }, query: {} };
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    const next = jest.fn();

    await ensureShareAccess(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.sharedResume).toBe(resume);
    expect(req.reviewerEmail).toBe('allowed@example.com');
  });

  it('returns 500 on DB error', async () => {
  mockFindOne.mockReturnValue(rejectsLean(new Error('db error')));
  const req = { params: { token: 'x' }, headers: {}, query: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    const next = jest.fn();

    await ensureShareAccess(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
  expect(res.json).toHaveBeenCalled();
  expect(res.json.mock.calls[0][0].message).toBe('Failed to access share');
    expect(next).not.toHaveBeenCalled();
  });
});
