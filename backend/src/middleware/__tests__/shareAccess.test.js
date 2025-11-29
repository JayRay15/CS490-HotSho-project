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

// Tests for ensureCoverLetterShareAccess (lines 68-135)
const CoverLetterModule = await import('../../models/CoverLetter.js');
const mockCLFindOne = jest.fn();
CoverLetterModule.CoverLetter.findOne = mockCLFindOne;

const { ensureCoverLetterShareAccess } = await import('../shareAccess.js');

describe('ensureCoverLetterShareAccess middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCLFindOne.mockReset();
  });

  const returnsLean = (val) => ({ lean: () => Promise.resolve(val) });
  const rejectsLean = (err) => ({ lean: () => Promise.reject(err) });

  it('responds 400 when token is missing', async () => {
    const req = { params: {}, headers: {}, query: {}, body: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    const next = jest.fn();

    await ensureCoverLetterShareAccess(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('responds 404 when cover letter not found', async () => {
    mockCLFindOne.mockReturnValue(returnsLean(null));
    const req = { params: { token: 't1' }, headers: {}, query: {}, body: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    const next = jest.fn();

    await ensureCoverLetterShareAccess(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json.mock.calls[0][0].message).toBe('Share link not found');
    expect(next).not.toHaveBeenCalled();
  });

  it('responds 404 when share not found in document', async () => {
    mockCLFindOne.mockReturnValue(returnsLean({ shares: [{ token: 'other', status: 'active' }] }));
    const req = { params: { token: 't1' }, headers: {}, query: {}, body: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    const next = jest.fn();

    await ensureCoverLetterShareAccess(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json.mock.calls[0][0].message).toBe('Share link not found in document');
    expect(next).not.toHaveBeenCalled();
  });

  it('responds 403 when share is not active (revoked)', async () => {
    mockCLFindOne.mockReturnValue(returnsLean({ shares: [{ token: 't1', status: 'revoked' }] }));
    const req = { params: { token: 't1' }, headers: {}, query: {}, body: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    const next = jest.fn();

    await ensureCoverLetterShareAccess(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json.mock.calls[0][0].message).toBe('This share link has been revoked');
    expect(next).not.toHaveBeenCalled();
  });

  it('responds 403 when share is expired', async () => {
    const past = new Date(Date.now() - 1000 * 60 * 60).toISOString();
    mockCLFindOne.mockReturnValue(returnsLean({ shares: [{ token: 't1', status: 'active', expiresAt: past }] }));
    const req = { params: { token: 't1' }, headers: {}, query: {}, body: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    const next = jest.fn();

    await ensureCoverLetterShareAccess(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json.mock.calls[0][0].message).toBe('This share link has expired');
    expect(next).not.toHaveBeenCalled();
  });

  it('sets deadlinePassed when deadline has passed', async () => {
    const past = new Date(Date.now() - 1000 * 60 * 60).toISOString();
    const coverLetter = { _id: 'cl1', shares: [{ token: 't1', status: 'active', deadline: past }] };
    mockCLFindOne.mockReturnValue(returnsLean(coverLetter));
    const req = { params: { token: 't1' }, headers: {}, query: {}, body: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    const next = jest.fn();

    await ensureCoverLetterShareAccess(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.deadlinePassed).toBe(true);
  });

  it('responds 403 when private share and email not in allowlist', async () => {
    mockCLFindOne.mockReturnValue(returnsLean({ 
      shares: [{ token: 't1', status: 'active', privacy: 'private', allowedReviewers: [{ email: 'allowed@test.com' }] }] 
    }));
    const req = { params: { token: 't1' }, headers: { 'x-reviewer-email': 'notallowed@test.com' }, query: {}, body: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    const next = jest.fn();

    await ensureCoverLetterShareAccess(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('allows access when private share and email is in allowlist', async () => {
    const coverLetter = { _id: 'cl2', shares: [{ token: 't1', status: 'active', privacy: 'private', allowedReviewers: [{ email: 'allowed@test.com' }] }] };
    mockCLFindOne.mockReturnValue(returnsLean(coverLetter));
    const req = { params: { token: 't1' }, headers: { 'x-reviewer-email': 'allowed@test.com' }, query: {}, body: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    const next = jest.fn();

    await ensureCoverLetterShareAccess(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.sharedCoverLetter).toEqual(coverLetter);
    expect(req.share).toBeDefined();
    expect(req.reviewerEmail).toBe('allowed@test.com');
  });

  it('allows access for unlisted share without email check', async () => {
    const coverLetter = { _id: 'cl3', shares: [{ token: 't1', status: 'active', privacy: 'unlisted' }] };
    mockCLFindOne.mockReturnValue(returnsLean(coverLetter));
    const req = { params: { token: 't1' }, headers: {}, query: {}, body: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    const next = jest.fn();

    await ensureCoverLetterShareAccess(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.sharedCoverLetter).toEqual(coverLetter);
  });

  it('returns 500 on DB error', async () => {
    mockCLFindOne.mockReturnValue(rejectsLean(new Error('db error')));
    const req = { params: { token: 'x' }, headers: {}, query: {}, body: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    const next = jest.fn();

    await ensureCoverLetterShareAccess(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0].message).toBe('Failed to access share');
    expect(next).not.toHaveBeenCalled();
  });

  it('handles empty shares array', async () => {
    mockCLFindOne.mockReturnValue(returnsLean({ shares: [] }));
    const req = { params: { token: 't1' }, headers: {}, query: {}, body: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    const next = jest.fn();

    await ensureCoverLetterShareAccess(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(next).not.toHaveBeenCalled();
  });

  it('handles undefined shares', async () => {
    mockCLFindOne.mockReturnValue(returnsLean({ shares: undefined }));
    const req = { params: { token: 't1' }, headers: {}, query: {}, body: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    const next = jest.fn();

    await ensureCoverLetterShareAccess(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(next).not.toHaveBeenCalled();
  });

  it('gets reviewerEmail from query params', async () => {
    const coverLetter = { _id: 'cl4', shares: [{ token: 't1', status: 'active', privacy: 'private', allowedReviewers: [{ email: 'query@test.com' }] }] };
    mockCLFindOne.mockReturnValue(returnsLean(coverLetter));
    const req = { params: { token: 't1' }, headers: {}, query: { reviewerEmail: 'query@test.com' }, body: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    const next = jest.fn();

    await ensureCoverLetterShareAccess(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.reviewerEmail).toBe('query@test.com');
  });

  it('gets reviewerEmail from body', async () => {
    const coverLetter = { _id: 'cl5', shares: [{ token: 't1', status: 'active', privacy: 'private', allowedReviewers: [{ email: 'body@test.com' }] }] };
    mockCLFindOne.mockReturnValue(returnsLean(coverLetter));
    const req = { params: { token: 't1' }, headers: {}, query: {}, body: { reviewerEmail: 'body@test.com' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    const next = jest.fn();

    await ensureCoverLetterShareAccess(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.reviewerEmail).toBe('body@test.com');
  });

  it('case-insensitive email matching', async () => {
    const coverLetter = { _id: 'cl6', shares: [{ token: 't1', status: 'active', privacy: 'private', allowedReviewers: [{ email: 'test@example.com' }] }] };
    mockCLFindOne.mockReturnValue(returnsLean(coverLetter));
    const req = { params: { token: 't1' }, headers: { 'x-reviewer-email': 'TEST@EXAMPLE.COM' }, query: {}, body: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    const next = jest.fn();

    await ensureCoverLetterShareAccess(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
