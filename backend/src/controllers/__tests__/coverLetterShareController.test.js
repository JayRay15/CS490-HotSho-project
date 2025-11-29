import { jest, beforeEach, describe, it, expect } from '@jest/globals';

// Mock dependencies
const mockCoverLetterFindOne = jest.fn();
const mockCoverLetterFindById = jest.fn();
const mockCoverLetterFind = jest.fn();
const mockCoverLetterFeedbackCreate = jest.fn();
const mockCoverLetterFeedbackFind = jest.fn();
const mockCoverLetterFeedbackFindById = jest.fn();
const mockUserFindOne = jest.fn();

jest.unstable_mockModule('../../models/CoverLetter.js', () => ({
  CoverLetter: {
    findOne: mockCoverLetterFindOne,
    findById: mockCoverLetterFindById,
    find: mockCoverLetterFind
  }
}));

jest.unstable_mockModule('../../models/CoverLetterFeedback.js', () => ({
  CoverLetterFeedback: {
    create: mockCoverLetterFeedbackCreate,
    find: mockCoverLetterFeedbackFind,
    findById: mockCoverLetterFeedbackFindById
  }
}));

jest.unstable_mockModule('../../models/User.js', () => ({
  User: {
    findOne: mockUserFindOne
  }
}));

jest.unstable_mockModule('uuid', () => ({
  v4: () => 'mock-uuid-token'
}));

// Import after mocking
const {
  createShareLink,
  listShares,
  revokeShare,
  getSharedCoverLetter,
  createFeedback,
  listFeedbackForCoverLetter,
  listFeedbackForShare,
  resolveFeedback,
  approveCoverLetter,
  exportFeedbackSummary,
  getPendingCoverLetterReviewInvitations
} = await import('../coverLetterShareController.js');

describe('coverLetterShareController', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockReq = {
      auth: { userId: 'test-user-123' },
      params: {},
      body: {},
      query: {},
      sharedCoverLetter: null,
      share: null,
      reviewerEmail: ''
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
  });

  describe('createShareLink', () => {
    it('should return 404 if cover letter not found', async () => {
      mockReq.params = { id: 'cl-123' };
      mockCoverLetterFindOne.mockResolvedValue(null);

      await createShareLink(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should create share link successfully', async () => {
      mockReq.params = { id: 'cl-123' };
      mockReq.body = { privacy: 'unlisted', allowComments: true };
      
      const mockCoverLetter = {
        _id: 'cl-123',
        userId: 'test-user-123',
        shares: [],
        approvalStatus: 'draft',
        save: jest.fn().mockResolvedValue(true)
      };
      mockCoverLetterFindOne.mockResolvedValue(mockCoverLetter);

      await createShareLink(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockCoverLetter.save).toHaveBeenCalled();
      expect(mockCoverLetter.shares.length).toBe(1);
    });

    it('should update approvalStatus to pending_review', async () => {
      mockReq.params = { id: 'cl-123' };
      mockReq.body = {};
      
      const mockCoverLetter = {
        _id: 'cl-123',
        userId: 'test-user-123',
        shares: [],
        approvalStatus: 'draft',
        save: jest.fn().mockResolvedValue(true)
      };
      mockCoverLetterFindOne.mockResolvedValue(mockCoverLetter);

      await createShareLink(mockReq, mockRes);

      expect(mockCoverLetter.approvalStatus).toBe('pending_review');
    });

    it('should handle database errors', async () => {
      mockReq.params = { id: 'cl-123' };
      mockCoverLetterFindOne.mockRejectedValue(new Error('DB error'));

      await createShareLink(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it('should add allowedReviewers from body', async () => {
      mockReq.params = { id: 'cl-123' };
      mockReq.body = { 
        privacy: 'private',
        allowedReviewers: [{ email: 'test@example.com', name: 'Test', role: 'Manager' }]
      };
      
      const mockCoverLetter = {
        _id: 'cl-123',
        userId: 'test-user-123',
        shares: [],
        approvalStatus: 'draft',
        save: jest.fn().mockResolvedValue(true)
      };
      mockCoverLetterFindOne.mockResolvedValue(mockCoverLetter);

      await createShareLink(mockReq, mockRes);

      expect(mockCoverLetter.shares[0].allowedReviewers).toBeDefined();
      expect(mockCoverLetter.shares[0].allowedReviewers[0].email).toBe('test@example.com');
    });
  });

  describe('listShares', () => {
    it('should return 404 if cover letter not found', async () => {
      mockReq.params = { id: 'cl-123' };
      mockCoverLetterFindOne.mockReturnValue({ lean: () => Promise.resolve(null) });

      await listShares(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should return shares list', async () => {
      mockReq.params = { id: 'cl-123' };
      const mockCoverLetter = {
        _id: 'cl-123',
        shares: [{ token: 'token-1' }, { token: 'token-2' }]
      };
      mockCoverLetterFindOne.mockReturnValue({ lean: () => Promise.resolve(mockCoverLetter) });

      await listShares(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should handle database errors', async () => {
      mockReq.params = { id: 'cl-123' };
      mockCoverLetterFindOne.mockReturnValue({ lean: () => Promise.reject(new Error('DB error')) });

      await listShares(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('revokeShare', () => {
    it('should return 404 if cover letter not found', async () => {
      mockReq.params = { id: 'cl-123', token: 'token-1' };
      mockCoverLetterFindOne.mockResolvedValue(null);

      await revokeShare(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should return 404 if share not found', async () => {
      mockReq.params = { id: 'cl-123', token: 'nonexistent' };
      mockCoverLetterFindOne.mockResolvedValue({
        shares: [{ token: 'different-token' }],
        save: jest.fn()
      });

      await revokeShare(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should revoke share successfully', async () => {
      mockReq.params = { id: 'cl-123', token: 'token-1' };
      const mockShare = { token: 'token-1', status: 'active' };
      const mockCoverLetter = {
        shares: [mockShare],
        save: jest.fn().mockResolvedValue(true)
      };
      mockCoverLetterFindOne.mockResolvedValue(mockCoverLetter);

      await revokeShare(mockReq, mockRes);

      expect(mockShare.status).toBe('revoked');
      expect(mockCoverLetter.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should handle database errors', async () => {
      mockReq.params = { id: 'cl-123', token: 'token-1' };
      mockCoverLetterFindOne.mockRejectedValue(new Error('DB error'));

      await revokeShare(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getSharedCoverLetter', () => {
    it('should return 404 if share not found', async () => {
      mockReq.sharedCoverLetter = null;
      mockReq.share = null;

      await getSharedCoverLetter(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should return shared cover letter', async () => {
      mockReq.sharedCoverLetter = { _id: 'cl-123', name: 'Test Letter', shares: [] };
      mockReq.share = { token: 'token-1', allowComments: true, deadline: null };

      await getSharedCoverLetter(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should not include shares array in response', async () => {
      mockReq.sharedCoverLetter = { _id: 'cl-123', name: 'Test Letter', shares: [{ token: 'secret' }] };
      mockReq.share = { token: 'token-1', allowComments: true };

      await getSharedCoverLetter(mockReq, mockRes);

      const responseData = mockRes.json.mock.calls[0][0];
      expect(responseData.data.coverLetter.shares).toBeUndefined();
    });
  });

  describe('createFeedback', () => {
    it('should return 403 if comments disabled', async () => {
      mockReq.sharedCoverLetter = { _id: 'cl-123' };
      mockReq.share = { allowComments: false };
      mockReq.body = { comment: 'Test comment' };

      await createFeedback(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    it('should return 400 if comment is empty', async () => {
      mockReq.sharedCoverLetter = { _id: 'cl-123' };
      mockReq.share = { allowComments: true };
      mockReq.body = { comment: '' };

      await createFeedback(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 403 if private share and email not allowed', async () => {
      mockReq.sharedCoverLetter = { _id: 'cl-123' };
      mockReq.share = { allowComments: true, privacy: 'private', allowedReviewers: [{ email: 'allowed@test.com' }] };
      mockReq.body = { comment: 'Test comment', authorEmail: 'notallowed@test.com' };
      mockReq.reviewerEmail = '';

      await createFeedback(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    it('should create feedback successfully', async () => {
      mockReq.sharedCoverLetter = { _id: 'cl-123', userId: 'owner-123' };
      mockReq.share = { token: 'token-1', allowComments: true, privacy: 'unlisted' };
      mockReq.body = { comment: 'Great work!' };
      
      const mockFeedback = { _id: 'fb-123', comment: 'Great work!' };
      mockCoverLetterFeedbackCreate.mockResolvedValue(mockFeedback);
      mockUserFindOne.mockResolvedValue(null);

      await createFeedback(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockCoverLetterFeedbackCreate).toHaveBeenCalled();
    });

    it('should notify owner when feedback is created', async () => {
      mockReq.sharedCoverLetter = { _id: 'cl-123', userId: 'owner-123', name: 'Test Letter' };
      mockReq.share = { token: 'token-1', allowComments: true };
      mockReq.body = { comment: 'Great work!' };
      
      const mockFeedback = { _id: 'fb-123' };
      mockCoverLetterFeedbackCreate.mockResolvedValue(mockFeedback);
      
      const mockOwner = { notifications: [], save: jest.fn().mockResolvedValue(true) };
      mockUserFindOne.mockResolvedValue(mockOwner);

      await createFeedback(mockReq, mockRes);

      expect(mockOwner.save).toHaveBeenCalled();
      expect(mockOwner.notifications.length).toBe(1);
    });

    it('should handle database errors', async () => {
      mockReq.sharedCoverLetter = { _id: 'cl-123' };
      mockReq.share = { allowComments: true };
      mockReq.body = { comment: 'Test' };
      mockCoverLetterFeedbackCreate.mockRejectedValue(new Error('DB error'));

      await createFeedback(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('listFeedbackForCoverLetter', () => {
    it('should return 404 if cover letter not found', async () => {
      mockReq.params = { id: 'cl-123' };
      mockCoverLetterFindOne.mockReturnValue({ lean: () => Promise.resolve(null) });

      await listFeedbackForCoverLetter(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should return feedback list', async () => {
      mockReq.params = { id: 'cl-123' };
      mockCoverLetterFindOne.mockReturnValue({ lean: () => Promise.resolve({ _id: 'cl-123' }) });
      mockCoverLetterFeedbackFind.mockReturnValue({
        sort: () => ({ lean: () => Promise.resolve([{ _id: 'fb-1' }, { _id: 'fb-2' }]) })
      });

      await listFeedbackForCoverLetter(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should handle database errors', async () => {
      mockReq.params = { id: 'cl-123' };
      mockCoverLetterFindOne.mockReturnValue({ lean: () => Promise.reject(new Error('DB error')) });

      await listFeedbackForCoverLetter(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('listFeedbackForShare', () => {
    it('should return feedback list for share token', async () => {
      mockReq.share = { token: 'token-1' };
      mockCoverLetterFeedbackFind.mockReturnValue({
        sort: () => ({ lean: () => Promise.resolve([{ _id: 'fb-1' }]) })
      });

      await listFeedbackForShare(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should handle database errors', async () => {
      mockReq.share = { token: 'token-1' };
      mockCoverLetterFeedbackFind.mockReturnValue({
        sort: () => ({ lean: () => Promise.reject(new Error('DB error')) })
      });

      await listFeedbackForShare(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('resolveFeedback', () => {
    it('should return 404 if feedback not found', async () => {
      mockReq.params = { feedbackId: 'fb-123' };
      mockCoverLetterFeedbackFindById.mockResolvedValue(null);

      await resolveFeedback(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should return 403 if not authorized', async () => {
      mockReq.params = { feedbackId: 'fb-123' };
      mockReq.body = { status: 'resolved' };
      mockCoverLetterFeedbackFindById.mockResolvedValue({ coverLetterId: 'cl-123' });
      mockCoverLetterFindOne.mockResolvedValue(null);

      await resolveFeedback(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    it('should resolve feedback successfully', async () => {
      mockReq.params = { feedbackId: 'fb-123' };
      mockReq.body = { status: 'resolved', resolutionNote: 'Fixed' };
      
      const mockFeedback = { 
        coverLetterId: 'cl-123', 
        save: jest.fn().mockResolvedValue(true) 
      };
      mockCoverLetterFeedbackFindById.mockResolvedValue(mockFeedback);
      mockCoverLetterFindOne.mockResolvedValue({ _id: 'cl-123', name: 'Test' });
      mockUserFindOne.mockResolvedValue(null);

      await resolveFeedback(mockReq, mockRes);

      expect(mockFeedback.status).toBe('resolved');
      expect(mockFeedback.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should handle database errors', async () => {
      mockReq.params = { feedbackId: 'fb-123' };
      mockCoverLetterFeedbackFindById.mockRejectedValue(new Error('DB error'));

      await resolveFeedback(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('approveCoverLetter', () => {
    it('should return 404 if cover letter not found', async () => {
      mockReq.params = { id: 'cl-123' };
      mockReq.body = { action: 'approve' };
      mockCoverLetterFindById.mockResolvedValue(null);

      await approveCoverLetter(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should return 403 if not authorized', async () => {
      mockReq.params = { id: 'cl-123' };
      mockReq.body = { action: 'approve' };
      mockReq.reviewerEmail = 'notallowed@test.com';
      mockCoverLetterFindById.mockResolvedValue({
        _id: 'cl-123',
        userId: 'other-user',
        shares: []
      });

      await approveCoverLetter(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    it('should approve cover letter', async () => {
      mockReq.params = { id: 'cl-123' };
      mockReq.body = { action: 'approve' };
      
      const mockCoverLetter = {
        _id: 'cl-123',
        userId: 'test-user-123',
        shares: [],
        save: jest.fn().mockResolvedValue(true)
      };
      mockCoverLetterFindById.mockResolvedValue(mockCoverLetter);
      mockUserFindOne.mockResolvedValue(null);

      await approveCoverLetter(mockReq, mockRes);

      expect(mockCoverLetter.approvalStatus).toBe('approved');
      expect(mockCoverLetter.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should request changes', async () => {
      mockReq.params = { id: 'cl-123' };
      mockReq.body = { action: 'request_changes' };
      
      const mockCoverLetter = {
        _id: 'cl-123',
        userId: 'test-user-123',
        shares: [],
        save: jest.fn().mockResolvedValue(true)
      };
      mockCoverLetterFindById.mockResolvedValue(mockCoverLetter);
      mockUserFindOne.mockResolvedValue(null);

      await approveCoverLetter(mockReq, mockRes);

      expect(mockCoverLetter.approvalStatus).toBe('changes_requested');
    });

    it('should handle database errors', async () => {
      mockReq.params = { id: 'cl-123' };
      mockReq.body = { action: 'approve' };
      mockCoverLetterFindById.mockRejectedValue(new Error('DB error'));

      await approveCoverLetter(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('exportFeedbackSummary', () => {
    it('should return 404 if cover letter not found', async () => {
      mockReq.params = { id: 'cl-123' };
      mockReq.query = {};
      mockCoverLetterFindOne.mockReturnValue({ lean: () => Promise.resolve(null) });

      await exportFeedbackSummary(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should return JSON summary by default', async () => {
      mockReq.params = { id: 'cl-123' };
      mockReq.query = {};
      mockCoverLetterFindOne.mockReturnValue({ lean: () => Promise.resolve({ _id: 'cl-123', name: 'Test' }) });
      mockCoverLetterFeedbackFind.mockReturnValue({
        sort: () => ({ lean: () => Promise.resolve([
          { _id: 'fb-1', status: 'open', feedbackTheme: 'content', suggestionType: 'general' },
          { _id: 'fb-2', status: 'resolved', feedbackTheme: 'content', suggestionType: 'grammar' }
        ]) })
      });

      await exportFeedbackSummary(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const responseData = mockRes.json.mock.calls[0][0];
      expect(responseData.data.stats).toBeDefined();
    });

    it('should return CSV when format=csv', async () => {
      mockReq.params = { id: 'cl-123' };
      mockReq.query = { format: 'csv' };
      mockCoverLetterFindOne.mockReturnValue({ lean: () => Promise.resolve({ _id: 'cl-123', name: 'Test Letter' }) });
      mockCoverLetterFeedbackFind.mockReturnValue({
        sort: () => ({ lean: () => Promise.resolve([
          { _id: 'fb-1', status: 'open', feedbackTheme: 'content', suggestionType: 'general', createdAt: new Date(), comment: 'Test comment' }
        ]) })
      });

      await exportFeedbackSummary(mockReq, mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(mockRes.send).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      mockReq.params = { id: 'cl-123' };
      mockReq.query = {};
      mockCoverLetterFindOne.mockReturnValue({ lean: () => Promise.reject(new Error('DB error')) });

      await exportFeedbackSummary(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getPendingCoverLetterReviewInvitations', () => {
    it('should return 400 if user email not found', async () => {
      mockUserFindOne.mockReturnValue({ lean: () => Promise.resolve(null) });

      await getPendingCoverLetterReviewInvitations(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return invitations list', async () => {
      mockUserFindOne.mockReturnValue({ lean: () => Promise.resolve({ email: 'user@test.com' }) });
      mockCoverLetterFind.mockReturnValue({ lean: () => Promise.resolve([
        {
          _id: 'cl-123',
          name: 'Test Letter',
          userId: 'owner-123',
          approvalStatus: 'pending_review',
          shares: [{
            status: 'active',
            privacy: 'private',
            token: 'token-1',
            allowedReviewers: [{ email: 'user@test.com' }]
          }]
        }
      ]) });
      // For owner lookup
      mockUserFindOne.mockReturnValueOnce({ lean: () => Promise.resolve({ email: 'user@test.com' }) });
      mockUserFindOne.mockReturnValueOnce({ lean: () => Promise.resolve({ name: 'Owner Name' }) });

      await getPendingCoverLetterReviewInvitations(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should filter out expired shares', async () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString();
      mockUserFindOne.mockReturnValue({ lean: () => Promise.resolve({ email: 'user@test.com' }) });
      mockCoverLetterFind.mockReturnValue({ lean: () => Promise.resolve([
        {
          _id: 'cl-123',
          name: 'Test Letter',
          userId: 'owner-123',
          shares: [{
            status: 'active',
            privacy: 'private',
            token: 'token-1',
            expiresAt: pastDate,
            allowedReviewers: [{ email: 'user@test.com' }]
          }]
        }
      ]) });

      await getPendingCoverLetterReviewInvitations(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const responseData = mockRes.json.mock.calls[0][0];
      expect(responseData.data.invitations.length).toBe(0);
    });

    it('should handle database errors', async () => {
      mockUserFindOne.mockReturnValue({ lean: () => Promise.reject(new Error('DB error')) });

      await getPendingCoverLetterReviewInvitations(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});
