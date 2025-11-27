import { Resume } from "../models/Resume.js";
import { CoverLetter } from "../models/CoverLetter.js";
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

/**
 * UC-110: Middleware for cover letter share access
 * Attaches req.sharedCoverLetter and req.share (share subdoc)
 * Optionally enforces allowed reviewer email if privacy is private
 */
export const ensureCoverLetterShareAccess = async (req, res, next) => {
  try {
    const { token } = req.params;
    const reviewerEmail = (req.headers['x-reviewer-email'] || req.query.reviewerEmail || req.body?.reviewerEmail || '').toString().toLowerCase();

    console.log('[CoverLetterShareAccess] Token:', token, 'Reviewer email:', reviewerEmail || '(none)');

    if (!token) {
      const { response, statusCode } = errorResponse("Share token is required", 400, ERROR_CODES.MISSING_REQUIRED_FIELD);
      return sendResponse(res, response, statusCode);
    }

    // Find cover letter containing this share token
    const coverLetter = await CoverLetter.findOne({ 'shares.token': token }).lean();
    if (!coverLetter) {
      console.log('[CoverLetterShareAccess] Cover letter not found for token:', token);
      const { response, statusCode } = errorResponse("Share link not found", 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }

    const share = (coverLetter.shares || []).find((s) => s.token === token);
    console.log('[CoverLetterShareAccess] Share found:', share ? { token: share.token, status: share.status, privacy: share.privacy } : 'null');
    
    if (!share) {
      const { response, statusCode } = errorResponse("Share link not found in document", 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }
    
    if (share.status !== 'active') {
      console.log('[CoverLetterShareAccess] Share status is not active:', share.status);
      const { response, statusCode } = errorResponse("This share link has been revoked", 403, ERROR_CODES.UNAUTHORIZED);
      return sendResponse(res, response, statusCode);
    }

    // Expiry check
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      console.log('[CoverLetterShareAccess] Share expired at:', share.expiresAt);
      const { response, statusCode } = errorResponse("This share link has expired", 403, ERROR_CODES.UNAUTHORIZED);
      return sendResponse(res, response, statusCode);
    }

    // Deadline warning (optional - just attach info, don't block)
    if (share.deadline && new Date(share.deadline) < new Date()) {
      req.deadlinePassed = true;
    }

    // Privacy check - only enforce for private shares
    if (share.privacy === 'private') {
      console.log('[CoverLetterShareAccess] Private share - checking allowedReviewers:', share.allowedReviewers);
      // Require reviewerEmail and it must be in allowlist
      const allowed = (share.allowedReviewers || []).some((r) => r.email?.toLowerCase() === reviewerEmail);
      if (!allowed) {
        console.log('[CoverLetterShareAccess] Email not in allowlist, reviewerEmail:', reviewerEmail);
        const { response, statusCode } = errorResponse("You don't have access to this shared cover letter. Please enter your email to verify access.", 403, ERROR_CODES.UNAUTHORIZED);
        return sendResponse(res, response, statusCode);
      }
    }

    // Attach
    req.sharedCoverLetter = coverLetter;
    req.share = share;
    req.reviewerEmail = reviewerEmail;

    console.log('[CoverLetterShareAccess] Access granted for cover letter:', coverLetter._id);
    return next();
  } catch (err) {
    console.error('Cover letter share access error:', err);
    const { response, statusCode } = errorResponse("Failed to access share", 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};
