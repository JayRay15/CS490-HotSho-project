import { Job } from "../models/Job.js";
import { Resume } from "../models/Resume.js";
import { CoverLetter } from "../models/CoverLetter.js";
import { successResponse, errorResponse, sendResponse, ERROR_CODES, validationErrorResponse } from "../utils/responseFormat.js";
import { asyncHandler } from "../middleware/errorHandler.js";

// GET /api/materials/list - list available resumes and cover letters for selection
export const listMaterials = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  if (!userId) {
    const { response, statusCode } = errorResponse("Unauthorized: missing authentication credentials", 401, ERROR_CODES.UNAUTHORIZED);
    return sendResponse(res, response, statusCode);
  }
  const resumes = await Resume.find({ userId, isArchived: { $ne: true } }).sort({ isDefault: -1, updatedAt: -1 });
  const coverLetters = await CoverLetter.find({ userId, isArchived: { $ne: true } }).sort({ isDefault: -1, updatedAt: -1 });
  const { response, statusCode } = successResponse("Materials retrieved", { resumes, coverLetters });
  return sendResponse(res, response, statusCode);
});

// POST /api/materials/jobs/:jobId/link - link resume/cover letter to a job and record history
export const linkMaterialsToJob = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { jobId } = req.params;
  const { resumeId, coverLetterId, reason } = req.body || {};
  if (!userId) {
    const { response, statusCode } = errorResponse("Unauthorized: missing authentication credentials", 401, ERROR_CODES.UNAUTHORIZED);
    return sendResponse(res, response, statusCode);
  }
  const job = await Job.findOne({ _id: jobId, userId });
  if (!job) {
    const { response, statusCode } = errorResponse("Job not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }
  // Optional validation: ensure provided IDs belong to user
  if (resumeId) {
    const r = await Resume.findOne({ _id: resumeId, userId });
    if (!r) {
      const { response, statusCode } = validationErrorResponse("Resume not found or not accessible", [ { field: 'resumeId', message: 'Invalid resumeId' } ]);
      return sendResponse(res, response, statusCode);
    }
    job.materials.resume = resumeId;
  } else if (resumeId === null) {
    // allow clearing
    job.materials.resume = null;
  }
  if (coverLetterId) {
    const c = await CoverLetter.findOne({ _id: coverLetterId, userId });
    if (!c) {
      const { response, statusCode } = validationErrorResponse("Cover letter not found or not accessible", [ { field: 'coverLetterId', message: 'Invalid coverLetterId' } ]);
      return sendResponse(res, response, statusCode);
    }
    job.materials.coverLetter = coverLetterId;
  } else if (coverLetterId === null) {
    job.materials.coverLetter = null;
  }
  // Record into materialsHistory when either provided
  job.materialsHistory = job.materialsHistory || [];
  job.materialsHistory.push({ resume: job.materials.resume || null, coverLetter: job.materials.coverLetter || null, reason });
  await job.save();
  const populated = await Job.findById(job._id)
    .populate('materials.resume', 'name isDefault metadata')
    .populate('materials.coverLetter', 'name isDefault metadata')
    .populate('materialsHistory.resume', 'name')
    .populate('materialsHistory.coverLetter', 'name');
  const { response, statusCode } = successResponse("Materials linked to job", { job: populated });
  return sendResponse(res, response, statusCode);
});

// GET /api/materials/jobs/:jobId/history - get materials history for a job
export const getMaterialsHistory = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { jobId } = req.params;
  if (!userId) {
    const { response, statusCode } = errorResponse("Unauthorized: missing authentication credentials", 401, ERROR_CODES.UNAUTHORIZED);
    return sendResponse(res, response, statusCode);
  }
  const job = await Job.findOne({ _id: jobId, userId })
    .populate('materialsHistory.resume', 'name')
    .populate('materialsHistory.coverLetter', 'name');
  if (!job) {
    const { response, statusCode } = errorResponse("Job not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }
  const { response, statusCode } = successResponse("Materials history retrieved", { history: job.materialsHistory || [] });
  return sendResponse(res, response, statusCode);
});

// GET /api/materials/analytics - usage analytics for resumes and cover letters
export const getMaterialsAnalytics = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  if (!userId) {
    const { response, statusCode } = errorResponse("Unauthorized: missing authentication credentials", 401, ERROR_CODES.UNAUTHORIZED);
    return sendResponse(res, response, statusCode);
  }
  // Aggregate by resume and cover letter usage counts and offer success rates
  const jobs = await Job.find({ userId });
  const stats = { resumes: {}, coverLetters: {} };
  const toKey = (id) => (id ? String(id) : 'none');
  for (const j of jobs) {
    // Resume usage
    const rKey = toKey(j.materials?.resume || null);
    stats.resumes[rKey] = stats.resumes[rKey] || { used: 0, offers: 0 };
    stats.resumes[rKey].used += 1;
    if (j.status === 'Offer') stats.resumes[rKey].offers += 1;
    // Cover letter usage
    const cKey = toKey(j.materials?.coverLetter || null);
    stats.coverLetters[cKey] = stats.coverLetters[cKey] || { used: 0, offers: 0 };
    stats.coverLetters[cKey].used += 1;
    if (j.status === 'Offer') stats.coverLetters[cKey].offers += 1;
  }
  // Resolve names
  const resumeIds = Object.keys(stats.resumes).filter(k => k !== 'none');
  const coverLetterIds = Object.keys(stats.coverLetters).filter(k => k !== 'none');
  const [resumes, coverLetters] = await Promise.all([
    Resume.find({ _id: { $in: resumeIds } }, 'name'),
    CoverLetter.find({ _id: { $in: coverLetterIds } }, 'name')
  ]);
  const resumeNameMap = Object.fromEntries(resumes.map(r => [String(r._id), r.name]));
  const coverLetterNameMap = Object.fromEntries(coverLetters.map(c => [String(c._id), c.name]));
  const result = {
    resumes: Object.entries(stats.resumes).map(([id, v]) => ({ id: id === 'none' ? null : id, name: id === 'none' ? 'None' : (resumeNameMap[id] || 'Unknown'), ...v })),
    coverLetters: Object.entries(stats.coverLetters).map(([id, v]) => ({ id: id === 'none' ? null : id, name: id === 'none' ? 'None' : (coverLetterNameMap[id] || 'Unknown'), ...v })),
  };
  const { response, statusCode } = successResponse("Materials analytics", result);
  return sendResponse(res, response, statusCode);
});
