import { Resume } from "../models/Resume.js";
import { errorResponse, sendResponse, ERROR_CODES } from "../utils/responseFormat.js";

/**
 * Middleware: ensure share token is valid and privacy rules are enforced for public share endpoints
 * Attaches req.sharedResume and req.share (share subdoc)
 * Optionally enforces allowed reviewer email if privacy is private
 */
export const ensureShareAccess = async (req, res, next) => {
  try {
    const { token } = req.params;
    const reviewerEmail = (req.headers['x-reviewer-email'] || req.query.reviewerEmail || req.body?.reviewerEmail || '').toString().toLowerCase();

    if (!token) {
      const { response, statusCode } = errorResponse("Share token is required", 400, ERROR_CODES.MISSING_REQUIRED_FIELD);
      return sendResponse(res, response, statusCode);
    }

    // Find resume containing this share token
    const resume = await Resume.findOne({ 'shares.token': token }).lean();
    if (!resume) {
      const { response, statusCode } = errorResponse("Share link not found", 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }

    const share = (resume.shares || []).find((s) => s.token === token);
    if (!share || share.status !== 'active') {
      const { response, statusCode } = errorResponse("This share link has been revoked", 403, ERROR_CODES.UNAUTHORIZED);
      return sendResponse(res, response, statusCode);
    }

    // Expiry check
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      const { response, statusCode } = errorResponse("This share link has expired", 403, ERROR_CODES.UNAUTHORIZED);
      return sendResponse(res, response, statusCode);
    }

    // Privacy check
    if (share.privacy === 'private') {
      // Require reviewerEmail and it must be in allowlist
      const allowed = (share.allowedReviewers || []).some((r) => r.email?.toLowerCase() === reviewerEmail);
      if (!allowed) {
        const { response, statusCode } = errorResponse("You don't have access to this shared resume", 403, ERROR_CODES.UNAUTHORIZED);
        return sendResponse(res, response, statusCode);
      }
    }

    // Attach
    req.sharedResume = resume;
    req.share = share;
    req.reviewerEmail = reviewerEmail;

    return next();
  } catch (err) {
    console.error('Share access error:', err);
    const { response, statusCode } = errorResponse("Failed to access share", 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};
