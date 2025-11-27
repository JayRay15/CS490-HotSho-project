import { v4 as uuidv4 } from 'uuid';
import { CoverLetter } from '../models/CoverLetter.js';
import { CoverLetterFeedback } from '../models/CoverLetterFeedback.js';
import { User } from '../models/User.js';
import { errorResponse, successResponse, sendResponse, ERROR_CODES } from '../utils/responseFormat.js';

const getUserId = (req) => {
  const auth = typeof req.auth === 'function' ? req.auth() : req.auth;
  return auth?.userId || auth?.payload?.sub;
};

/**
 * UC-110: Collaborative Resume and Cover Letter Review
 * Cover Letter Share Controller - handles sharing and feedback functionality
 */

// Generate share link for cover letter
export const createShareLink = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params; // cover letter id
    const { 
      privacy = 'unlisted', 
      allowComments = true, 
      canViewContact = false, 
      allowedReviewers = [], 
      note = null, 
      expiresAt = null,
      deadline = null // UC-110: deadline management
    } = req.body || {};

    const coverLetter = await CoverLetter.findOne({ _id: id, userId });
    if (!coverLetter) {
      const { response, statusCode } = errorResponse('Cover letter not found', 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }

    const token = uuidv4();
    const share = {
      token,
      privacy,
      allowComments: !!allowComments,
      canViewContact: !!canViewContact,
      allowedReviewers: (allowedReviewers || []).map(r => ({ 
        email: (r.email || '').toLowerCase(), 
        name: r.name || '', 
        role: r.role || 'Reviewer' 
      })),
      note,
      status: 'active',
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      deadline: deadline ? new Date(deadline) : null,
      createdBy: userId
    };

    coverLetter.shares = coverLetter.shares || [];
    coverLetter.shares.push(share);
    
    // Update approval status to pending_review when shared
    if (coverLetter.approvalStatus === 'draft') {
      coverLetter.approvalStatus = 'pending_review';
    }
    
    await coverLetter.save();

    const shareUrl = `${process.env.FRONTEND_ORIGIN || 'http://localhost:5173'}/share/cover-letter/${token}`;
    const { response, statusCode } = successResponse('Share link created', { share: share, url: shareUrl }, 201);
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error('Create cover letter share error:', err);
    const { response, statusCode } = errorResponse('Failed to create share link', 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

// List all shares for a cover letter
export const listShares = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const coverLetter = await CoverLetter.findOne({ _id: id, userId }).lean();
    if (!coverLetter) {
      const { response, statusCode } = errorResponse('Cover letter not found', 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }
    const { response, statusCode } = successResponse('Shares fetched', { shares: coverLetter.shares || [] });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    const { response, statusCode } = errorResponse('Failed to fetch shares', 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

// Revoke a share link
export const revokeShare = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id, token } = req.params;
    const coverLetter = await CoverLetter.findOne({ _id: id, userId });
    if (!coverLetter) {
      const { response, statusCode } = errorResponse('Cover letter not found', 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }
    const share = (coverLetter.shares || []).find(s => s.token === token);
    if (!share) {
      const { response, statusCode } = errorResponse('Share not found', 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }
    share.status = 'revoked';
    await coverLetter.save();
    const { response, statusCode } = successResponse('Share revoked', { share });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    const { response, statusCode } = errorResponse('Failed to revoke share', 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

// Public: fetch shared cover letter by token
export const getSharedCoverLetter = async (req, res) => {
  try {
    const coverLetter = req.sharedCoverLetter; // from middleware
    const share = req.share;

    if (!coverLetter || !share) {
      const { response, statusCode } = errorResponse('Share not found', 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }

    // Create safe copy without internal data
    const safeCoverLetter = { ...coverLetter };
    
    // Do not leak internal shares array to public
    delete safeCoverLetter.shares;

    const { response, statusCode } = successResponse('Shared cover letter', { 
      coverLetter: safeCoverLetter, 
      share: { 
        token: share.token, 
        allowComments: share.allowComments,
        deadline: share.deadline 
      } 
    });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    const { response, statusCode } = errorResponse('Failed to load shared cover letter', 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

// Public: create feedback via token
export const createFeedback = async (req, res) => {
  try {
    const coverLetter = req.sharedCoverLetter;
    const share = req.share;
    const { 
      comment, 
      authorName, 
      authorEmail,
      selectionStart,
      selectionEnd,
      selectedText,
      suggestionType = 'general',
      feedbackTheme = 'other'
    } = req.body || {};

    if (!share.allowComments) {
      const { response, statusCode } = errorResponse('Comments are disabled for this shared cover letter', 403, ERROR_CODES.UNAUTHORIZED);
      return sendResponse(res, response, statusCode);
    }

    if (!comment || comment.trim().length === 0) {
      const { response, statusCode } = errorResponse('Comment text is required', 400, ERROR_CODES.MISSING_REQUIRED_FIELD);
      return sendResponse(res, response, statusCode);
    }

    // Enforce private privacy allowlist for comment creation
    if (share.privacy === 'private') {
      const email = (authorEmail || req.reviewerEmail || '').toLowerCase();
      const allowed = (share.allowedReviewers || []).some((r) => r.email?.toLowerCase() === email);
      if (!allowed) {
        const { response, statusCode } = errorResponse("You don't have permission to comment on this cover letter", 403, ERROR_CODES.UNAUTHORIZED);
        return sendResponse(res, response, statusCode);
      }
    }

    const doc = await CoverLetterFeedback.create({
      coverLetterId: coverLetter._id,
      shareToken: share.token,
      authorUserId: req.auth?.payload?.sub || null,
      authorEmail: (authorEmail || req.reviewerEmail || '').toLowerCase() || null,
      authorName: authorName || null,
      comment: comment.trim(),
      selectionStart: selectionStart || null,
      selectionEnd: selectionEnd || null,
      selectedText: selectedText || null,
      suggestionType,
      feedbackTheme,
      status: 'open'
    });

    // Notify owner
    try {
      const owner = await User.findOne({ auth0Id: coverLetter.userId });
      if (owner) {
        owner.notifications = owner.notifications || [];
        owner.notifications.push({
          type: 'feedback:new',
          coverLetterId: coverLetter._id,
          feedbackId: doc._id,
          message: `New feedback on cover letter "${coverLetter.name}"`
        });
        await owner.save();
      }
    } catch (notifyErr) {
      console.warn('Failed to save notification:', notifyErr?.message || notifyErr);
    }

    const { response, statusCode } = successResponse('Feedback posted', { feedback: doc }, 201);
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error('Create cover letter feedback error:', err);
    const { response, statusCode } = errorResponse('Failed to post feedback', 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

// List feedback - for owner via cover letter id
export const listFeedbackForCoverLetter = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params; // cover letter id
    const coverLetter = await CoverLetter.findOne({ _id: id, userId }).lean();
    if (!coverLetter) {
      const { response, statusCode } = errorResponse('Cover letter not found', 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }
    const items = await CoverLetterFeedback.find({ coverLetterId: id }).sort({ createdAt: -1 }).lean();
    const { response, statusCode } = successResponse('Feedback list', { feedback: items });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    const { response, statusCode } = errorResponse('Failed to list feedback', 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

// Public: list feedback for a share token (read-only)
export const listFeedbackForShare = async (req, res) => {
  try {
    const share = req.share;
    const items = await CoverLetterFeedback.find({ shareToken: share.token }).sort({ createdAt: -1 }).lean();
    const { response, statusCode } = successResponse('Feedback list', { feedback: items });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    const { response, statusCode } = errorResponse('Failed to list feedback', 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

// Owner resolves feedback
export const resolveFeedback = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { feedbackId } = req.params;
    const { resolutionNote, appliedInCoverLetterVersionId, status = 'resolved' } = req.body || {};

    const fb = await CoverLetterFeedback.findById(feedbackId);
    if (!fb) {
      const { response, statusCode } = errorResponse('Feedback not found', 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }
    
    // Ownership: ensure the feedback belongs to a cover letter owned by user
    const coverLetter = await CoverLetter.findOne({ _id: fb.coverLetterId, userId });
    if (!coverLetter) {
      const { response, statusCode } = errorResponse('Unauthorized', 403, ERROR_CODES.UNAUTHORIZED);
      return sendResponse(res, response, statusCode);
    }

    fb.status = status; // 'resolved' or 'dismissed'
    fb.resolutionNote = resolutionNote || null;
    fb.resolvedBy = userId;
    fb.resolvedAt = new Date();
    if (appliedInCoverLetterVersionId) {
      fb.appliedInCoverLetterVersionId = appliedInCoverLetterVersionId;
    }
    await fb.save();

    // Save notification
    try {
      const owner = await User.findOne({ auth0Id: userId });
      if (owner) {
        owner.notifications = owner.notifications || [];
        owner.notifications.push({
          type: 'feedback:resolved',
          coverLetterId: coverLetter._id,
          feedbackId: fb._id,
          message: `Feedback ${status} on cover letter "${coverLetter.name}"`
        });
        await owner.save();
      }
    } catch (notifyErr) {
      console.warn('Failed to save notification:', notifyErr?.message || notifyErr);
    }

    const { response, statusCode } = successResponse('Feedback updated', { feedback: fb });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    const { response, statusCode } = errorResponse('Failed to update feedback', 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

// UC-110: Approve cover letter (approval workflow)
export const approveCoverLetter = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const { action } = req.body; // 'approve' or 'request_changes'

    const coverLetter = await CoverLetter.findById(id);
    if (!coverLetter) {
      const { response, statusCode } = errorResponse('Cover letter not found', 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }

    // Check if user has reviewer access
    const share = (coverLetter.shares || []).find(s => 
      s.status === 'active' && 
      s.allowedReviewers?.some(r => r.email?.toLowerCase() === req.reviewerEmail?.toLowerCase())
    );

    if (!share && coverLetter.userId !== userId) {
      const { response, statusCode } = errorResponse('Unauthorized to approve', 403, ERROR_CODES.UNAUTHORIZED);
      return sendResponse(res, response, statusCode);
    }

    if (action === 'approve') {
      coverLetter.approvalStatus = 'approved';
      coverLetter.approvedBy = userId;
      coverLetter.approvedAt = new Date();
    } else if (action === 'request_changes') {
      coverLetter.approvalStatus = 'changes_requested';
    }

    await coverLetter.save();

    // Notify owner
    try {
      const owner = await User.findOne({ auth0Id: coverLetter.userId });
      if (owner && coverLetter.userId !== userId) {
        owner.notifications = owner.notifications || [];
        owner.notifications.push({
          type: action === 'approve' ? 'coverletter:approved' : 'coverletter:changes_requested',
          coverLetterId: coverLetter._id,
          message: action === 'approve' 
            ? `Cover letter "${coverLetter.name}" has been approved`
            : `Changes requested on cover letter "${coverLetter.name}"`
        });
        await owner.save();
      }
    } catch (notifyErr) {
      console.warn('Failed to save notification:', notifyErr?.message || notifyErr);
    }

    const { response, statusCode } = successResponse('Approval status updated', { coverLetter });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    const { response, statusCode } = errorResponse('Failed to update approval status', 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

// UC-110: Export feedback summary with theme analysis
export const exportFeedbackSummary = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params; // cover letter id
    const { format = 'json' } = req.query;

    const coverLetter = await CoverLetter.findOne({ _id: id, userId }).lean();
    if (!coverLetter) {
      const { response, statusCode } = errorResponse('Cover letter not found', 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }

    const items = await CoverLetterFeedback.find({ coverLetterId: id }).sort({ createdAt: -1 }).lean();

    // Generate theme summary
    const themeSummary = {};
    const typeSummary = {};
    items.forEach(f => {
      themeSummary[f.feedbackTheme] = (themeSummary[f.feedbackTheme] || 0) + 1;
      typeSummary[f.suggestionType] = (typeSummary[f.suggestionType] || 0) + 1;
    });

    const stats = {
      total: items.length,
      open: items.filter(f => f.status === 'open').length,
      resolved: items.filter(f => f.status === 'resolved').length,
      dismissed: items.filter(f => f.status === 'dismissed').length,
      themes: themeSummary,
      types: typeSummary
    };

    if (format === 'csv') {
      const rows = [
        ['FeedbackID', 'Status', 'Theme', 'Type', 'AuthorName', 'AuthorEmail', 'CreatedAt', 'ResolvedAt', 'Comment'].join(',')
      ];
      for (const f of items) {
        const cells = [
          f._id,
          f.status,
          f.feedbackTheme || '',
          f.suggestionType || '',
          (f.authorName || '').replace(/[,\n"]/g, ' '),
          (f.authorEmail || ''),
          new Date(f.createdAt).toISOString(),
          f.resolvedAt ? new Date(f.resolvedAt).toISOString() : '',
          `"${(f.comment || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`
        ];
        rows.push(cells.join(','));
      }
      const csv = rows.join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${coverLetter.name.replace(/[^a-z0-9-_]/gi, '_')}_feedback.csv"`);
      return res.send(csv);
    }

    const { response, statusCode } = successResponse('Feedback summary', { feedback: items, stats });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    const { response, statusCode } = errorResponse('Failed to export feedback', 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

/**
 * UC-110: Get pending cover letter review invitations for the current user
 * Finds all cover letters where the user's email is in the allowedReviewers list
 */
export const getPendingCoverLetterReviewInvitations = async (req, res) => {
  try {
    const userId = getUserId(req);
    
    // Get user's email from database
    const user = await User.findOne({ auth0Id: userId }).lean();
    if (!user || !user.email) {
      const { response, statusCode } = errorResponse('User email not found', 400, ERROR_CODES.MISSING_REQUIRED_FIELD);
      return sendResponse(res, response, statusCode);
    }
    
    const userEmail = user.email.toLowerCase();
    
    // Find cover letters where user is in allowedReviewers of an active share
    const coverLetters = await CoverLetter.find({
      'shares.status': 'active',
      'shares.privacy': 'private',
      'shares.allowedReviewers.email': userEmail
    }).lean();
    
    // Extract relevant share info for each cover letter
    const invitations = [];
    for (const coverLetter of coverLetters) {
      // Find the specific share(s) where user is invited
      const relevantShares = (coverLetter.shares || []).filter(share => 
        share.status === 'active' &&
        share.privacy === 'private' &&
        (share.allowedReviewers || []).some(r => r.email?.toLowerCase() === userEmail)
      );
      
      for (const share of relevantShares) {
        // Check if expired
        if (share.expiresAt && new Date(share.expiresAt) < new Date()) continue;
        
        // Get owner info
        let ownerName = 'Unknown';
        try {
          const owner = await User.findOne({ auth0Id: coverLetter.userId }).lean();
          if (owner) {
            ownerName = owner.name || owner.email || 'Unknown';
          }
        } catch (e) { /* ignore */ }
        
        invitations.push({
          type: 'cover-letter',
          documentId: coverLetter._id,
          documentName: coverLetter.name,
          token: share.token,
          ownerName,
          note: share.note,
          deadline: share.deadline || null,
          expiresAt: share.expiresAt || null,
          allowComments: share.allowComments,
          approvalStatus: coverLetter.approvalStatus,
          createdAt: share.createdAt
        });
      }
    }
    
    // Sort by most recent first
    invitations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    const { response, statusCode } = successResponse('Pending cover letter review invitations', { invitations });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error('Get pending cover letter review invitations error:', err);
    const { response, statusCode } = errorResponse('Failed to fetch invitations', 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};
