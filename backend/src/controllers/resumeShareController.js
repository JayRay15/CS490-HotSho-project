import { v4 as uuidv4 } from 'uuid';
import { Resume } from '../models/Resume.js';
import { ResumeFeedback } from '../models/ResumeFeedback.js';
import { User } from '../models/User.js';
import { errorResponse, successResponse, sendResponse, ERROR_CODES } from '../utils/responseFormat.js';

const getUserId = (req) => {
  const auth = typeof req.auth === 'function' ? req.auth() : req.auth;
  return auth?.userId || auth?.payload?.sub;
};

// Generate share link
export const createShareLink = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params; // resume id
    const { privacy = 'unlisted', allowComments = true, canViewContact = false, allowedReviewers = [], note = null, expiresAt = null } = req.body || {};

    const resume = await Resume.findOne({ _id: id, userId });
    if (!resume) {
      const { response, statusCode } = errorResponse('Resume not found', 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }

    const token = uuidv4();
    const share = {
      token,
      privacy,
      allowComments: !!allowComments,
      canViewContact: !!canViewContact,
      allowedReviewers: (allowedReviewers || []).map(r => ({ email: (r.email||'').toLowerCase(), name: r.name || '', role: r.role || 'Reviewer' })),
      note,
      status: 'active',
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdBy: userId
    };

    resume.shares = resume.shares || [];
    resume.shares.push(share);
    await resume.save();

    const shareUrl = `${process.env.FRONTEND_ORIGIN || 'http://localhost:5173'}/share/${token}`;
    const { response, statusCode } = successResponse('Share link created', { share: share, url: shareUrl }, 201);
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error('Create share error:', err);
    const { response, statusCode } = errorResponse('Failed to create share link', 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

export const listShares = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const resume = await Resume.findOne({ _id: id, userId }).lean();
    if (!resume) {
      const { response, statusCode } = errorResponse('Resume not found', 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }
    const { response, statusCode } = successResponse('Shares fetched', { shares: resume.shares || [] });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    const { response, statusCode } = errorResponse('Failed to fetch shares', 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

export const revokeShare = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id, token } = req.params;
    const resume = await Resume.findOne({ _id: id, userId });
    if (!resume) {
      const { response, statusCode } = errorResponse('Resume not found', 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }
    const share = (resume.shares || []).find(s => s.token === token);
    if (!share) {
      const { response, statusCode } = errorResponse('Share not found', 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }
    share.status = 'revoked';
    await resume.save();
    const { response, statusCode } = successResponse('Share revoked', { share });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    const { response, statusCode } = errorResponse('Failed to revoke share', 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

// Public: fetch shared resume by token
export const getSharedResume = async (req, res) => {
  try {
    const resume = req.sharedResume; // from middleware
    const share = req.share;

    if (!resume || !share) {
      const { response, statusCode } = errorResponse('Share not found', 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }

    // Redact contact info based on canViewContact
    const safeResume = { ...resume };
    if (!share.canViewContact && safeResume.sections?.contactInfo) {
      const { name, location, linkedin, github, website } = safeResume.sections.contactInfo;
      safeResume.sections.contactInfo = { name, location, linkedin, github, website };
    }

    // Do not leak internal shares array to public
    delete safeResume.shares;

    const { response, statusCode } = successResponse('Shared resume', { resume: safeResume, share: { token: share.token, allowComments: share.allowComments } });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    const { response, statusCode } = errorResponse('Failed to load shared resume', 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

// Public: create feedback via token
export const createFeedback = async (req, res) => {
  try {
    const resume = req.sharedResume;
    const share = req.share;
    const { comment, authorName, authorEmail } = req.body || {};

    if (!share.allowComments) {
      const { response, statusCode } = errorResponse('Comments are disabled for this shared resume', 403, ERROR_CODES.UNAUTHORIZED);
      return sendResponse(res, response, statusCode);
    }

    if (!comment || comment.trim().length === 0) {
      const { response, statusCode } = errorResponse('Comment text is required', 400, ERROR_CODES.MISSING_REQUIRED_FIELD);
      return sendResponse(res, response, statusCode);
    }

    // Enforce private privacy allowlist again for comment creation
    if (share.privacy === 'private') {
      const email = (authorEmail || req.reviewerEmail || '').toLowerCase();
      const allowed = (share.allowedReviewers || []).some((r) => r.email?.toLowerCase() === email);
      if (!allowed) {
        const { response, statusCode } = errorResponse("You don't have permission to comment on this resume", 403, ERROR_CODES.UNAUTHORIZED);
        return sendResponse(res, response, statusCode);
      }
    }

    const doc = await ResumeFeedback.create({
      resumeId: resume._id,
      shareToken: share.token,
      authorUserId: req.auth?.payload?.sub || null,
      authorEmail: (authorEmail || req.reviewerEmail || '').toLowerCase() || null,
      authorName: authorName || null,
      comment: comment.trim(),
      status: 'open'
    });

    // Notify owner
    try {
      const owner = await User.findOne({ auth0Id: resume.userId });
      if (owner) {
        owner.notifications = owner.notifications || [];
        owner.notifications.push({
          type: 'feedback:new',
          resumeId: resume._id,
          feedbackId: doc._id,
          message: `New feedback on resume "${resume.name}"`
        });
        await owner.save();
      }
    } catch (notifyErr) {
      console.warn('Failed to save notification:', notifyErr?.message || notifyErr);
    }

    const { response, statusCode } = successResponse('Feedback posted', { feedback: doc }, 201);
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error('Create feedback error:', err);
    const { response, statusCode } = errorResponse('Failed to post feedback', 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

// List feedback - for owner via resume id
export const listFeedbackForResume = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params; // resume id
    const resume = await Resume.findOne({ _id: id, userId }).lean();
    if (!resume) {
      const { response, statusCode } = errorResponse('Resume not found', 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }
    const items = await ResumeFeedback.find({ resumeId: id }).sort({ createdAt: -1 }).lean();
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
    const items = await ResumeFeedback.find({ shareToken: share.token }).sort({ createdAt: -1 }).lean();
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
    const { resolutionNote, appliedInResumeVersionId } = req.body || {};

    const fb = await ResumeFeedback.findById(feedbackId);
    if (!fb) {
      const { response, statusCode } = errorResponse('Feedback not found', 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }
    // Ownership: ensure the feedback belongs to a resume owned by user
    const resume = await Resume.findOne({ _id: fb.resumeId, userId });
    if (!resume) {
      const { response, statusCode } = errorResponse('Unauthorized', 403, ERROR_CODES.UNAUTHORIZED);
      return sendResponse(res, response, statusCode);
    }

    fb.status = 'resolved';
    fb.resolutionNote = resolutionNote || null;
    fb.resolvedBy = userId;
    fb.resolvedAt = new Date();
    if (appliedInResumeVersionId) {
      fb.appliedInResumeVersionId = appliedInResumeVersionId;
    }
    await fb.save();

    // Save notification
    try {
      const owner = await User.findOne({ auth0Id: userId });
      if (owner) {
        owner.notifications = owner.notifications || [];
        owner.notifications.push({
          type: 'feedback:resolved',
          resumeId: resume._id,
          feedbackId: fb._id,
          message: `Feedback resolved on resume "${resume.name}"`
        });
        await owner.save();
      }
    } catch (notifyErr) {
      console.warn('Failed to save notification:', notifyErr?.message || notifyErr);
    }

    const { response, statusCode } = successResponse('Feedback resolved', { feedback: fb });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    const { response, statusCode } = errorResponse('Failed to resolve feedback', 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

// Export feedback summary (JSON/CSV)
export const exportFeedbackSummary = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params; // resume id
    const { format = 'json' } = req.query;

    const resume = await Resume.findOne({ _id: id, userId }).lean();
    if (!resume) {
      const { response, statusCode } = errorResponse('Resume not found', 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }

    const items = await ResumeFeedback.find({ resumeId: id }).sort({ createdAt: -1 }).lean();

    if (format === 'csv') {
      const rows = [
        ['FeedbackID','Status','AuthorName','AuthorEmail','CreatedAt','ResolvedAt','ResolutionNote'].join(',')
      ];
      for (const f of items) {
        const cells = [
          f._id,
          f.status,
          (f.authorName || '').replace(/[,\n]/g,' '),
          (f.authorEmail || ''),
          new Date(f.createdAt).toISOString(),
          f.resolvedAt ? new Date(f.resolvedAt).toISOString() : '',
          (f.resolutionNote || '').replace(/[,\n]/g,' ')
        ];
        rows.push(cells.join(','));
      }
      const csv = rows.join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${resume.name.replace(/[^a-z0-9-_]/gi, '_')}_feedback.csv"`);
      return res.send(csv);
    }

    const { response, statusCode } = successResponse('Feedback summary', { feedback: items });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    const { response, statusCode } = errorResponse('Failed to export feedback', 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};
