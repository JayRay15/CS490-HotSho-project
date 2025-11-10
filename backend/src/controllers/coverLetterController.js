import { CoverLetter } from "../models/CoverLetter.js";
import { successResponse, errorResponse, sendResponse, ERROR_CODES, validationErrorResponse } from "../utils/responseFormat.js";
import { asyncHandler } from "../middleware/errorHandler.js";

// GET /api/cover-letters - list cover letters for current user
export const listCoverLetters = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  if (!userId) {
    const { response, statusCode } = errorResponse("Unauthorized: missing authentication credentials", 401, ERROR_CODES.UNAUTHORIZED);
    return sendResponse(res, response, statusCode);
  }
  const { includeArchived } = req.query;
  const filter = { userId };
  if (!includeArchived || includeArchived === 'false') filter.isArchived = { $ne: true };
  const list = await CoverLetter.find(filter).sort({ isDefault: -1, updatedAt: -1 });
  const { response, statusCode } = successResponse("Cover letters retrieved", { coverLetters: list });
  return sendResponse(res, response, statusCode);
});

// POST /api/cover-letters - create
export const createCoverLetter = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  if (!userId) {
    const { response, statusCode } = errorResponse("Unauthorized: missing authentication credentials", 401, ERROR_CODES.UNAUTHORIZED);
    return sendResponse(res, response, statusCode);
  }
  const { name, sections, metadata, isDefault } = req.body || {};
  const errors = [];
  if (!name?.trim()) errors.push({ field: 'name', message: 'Name is required' });
  if (errors.length) {
    const { response, statusCode } = validationErrorResponse("Validation error", errors);
    return sendResponse(res, response, statusCode);
  }
  // If setting default, unset existing default for this user
  if (isDefault) {
    await CoverLetter.updateMany({ userId, isDefault: true }, { $set: { isDefault: false } });
  }
  const doc = await CoverLetter.create({ userId, name: name.trim(), sections: sections || {}, metadata: metadata || {}, isDefault: !!isDefault });
  const { response, statusCode } = successResponse("Cover letter created", { coverLetter: doc });
  return sendResponse(res, response, statusCode);
});

// PUT /api/cover-letters/:id - update
export const updateCoverLetter = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { id } = req.params;
  if (!userId) {
    const { response, statusCode } = errorResponse("Unauthorized: missing authentication credentials", 401, ERROR_CODES.UNAUTHORIZED);
    return sendResponse(res, response, statusCode);
  }
  const doc = await CoverLetter.findOne({ _id: id, userId });
  if (!doc) {
    const { response, statusCode } = errorResponse("Not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }
  const { name, sections, metadata, isDefault } = req.body || {};
  if (name !== undefined) doc.name = name;
  if (sections !== undefined) doc.sections = sections;
  if (metadata !== undefined) doc.metadata = metadata;
  if (isDefault === true) {
    await CoverLetter.updateMany({ userId, isDefault: true }, { $set: { isDefault: false } });
    doc.isDefault = true;
  } else if (isDefault === false) {
    doc.isDefault = false;
  }
  await doc.save();
  const { response, statusCode } = successResponse("Cover letter updated", { coverLetter: doc });
  return sendResponse(res, response, statusCode);
});

// DELETE /api/cover-letters/:id - delete
export const deleteCoverLetter = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { id } = req.params;
  if (!userId) {
    const { response, statusCode } = errorResponse("Unauthorized: missing authentication credentials", 401, ERROR_CODES.UNAUTHORIZED);
    return sendResponse(res, response, statusCode);
  }
  const doc = await CoverLetter.findOneAndDelete({ _id: id, userId });
  if (!doc) {
    const { response, statusCode } = errorResponse("Not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }
  const { response, statusCode } = successResponse("Cover letter deleted");
  return sendResponse(res, response, statusCode);
});

// PUT /api/cover-letters/:id/set-default - set default
export const setDefaultCoverLetter = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { id } = req.params;
  if (!userId) {
    const { response, statusCode } = errorResponse("Unauthorized: missing authentication credentials", 401, ERROR_CODES.UNAUTHORIZED);
    return sendResponse(res, response, statusCode);
  }
  const doc = await CoverLetter.findOne({ _id: id, userId });
  if (!doc) {
    const { response, statusCode } = errorResponse("Not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }
  await CoverLetter.updateMany({ userId, isDefault: true }, { $set: { isDefault: false } });
  doc.isDefault = true;
  await doc.save();
  const { response, statusCode } = successResponse("Default cover letter set", { coverLetter: doc });
  return sendResponse(res, response, statusCode);
});

// PUT /api/cover-letters/:id/archive - archive/unarchive
export const archiveCoverLetter = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { id } = req.params;
  const { archive } = req.body || {};
  if (!userId) {
    const { response, statusCode } = errorResponse("Unauthorized: missing authentication credentials", 401, ERROR_CODES.UNAUTHORIZED);
    return sendResponse(res, response, statusCode);
  }
  const doc = await CoverLetter.findOne({ _id: id, userId });
  if (!doc) {
    const { response, statusCode } = errorResponse("Not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }
  doc.isArchived = !!archive;
  if (archive && doc.isDefault) doc.isDefault = false;
  await doc.save();
  const { response, statusCode } = successResponse("Cover letter updated", { coverLetter: doc });
  return sendResponse(res, response, statusCode);
});

// GET /api/cover-letters/:id/text - export as plain text (view/download)
export const exportCoverLetterText = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { id } = req.params;
  const { download } = req.query;
  if (!userId) {
    const { response, statusCode } = errorResponse("Unauthorized: missing authentication credentials", 401, ERROR_CODES.UNAUTHORIZED);
    return sendResponse(res, response, statusCode);
  }
  const doc = await CoverLetter.findOne({ _id: id, userId });
  if (!doc) {
    const { response, statusCode } = errorResponse("Not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }
  const s = doc.sections || {};
  const text = [s.intro, s.body, s.closing, s.signature].filter(Boolean).join("\n\n");
  if (download === 'true') {
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${(doc.name || 'cover-letter').replace(/[^a-z0-9-_]/gi,'_')}.txt"`);
    return res.status(200).send(text);
  }
  res.setHeader('Content-Type', 'text/plain');
  return res.status(200).send(text);
});

// GET /api/cover-letters/:id/compare?otherId=...
export const compareCoverLetters = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { id } = req.params;
  const { otherId } = req.query;
  if (!userId) {
    const { response, statusCode } = errorResponse("Unauthorized: missing authentication credentials", 401, ERROR_CODES.UNAUTHORIZED);
    return sendResponse(res, response, statusCode);
  }
  if (!otherId) {
    const { response, statusCode } = validationErrorResponse("otherId is required", [ { field: 'otherId', message: 'Provide otherId to compare with' } ]);
    return sendResponse(res, response, statusCode);
  }
  const [a, b] = await Promise.all([
    CoverLetter.findOne({ _id: id, userId }),
    CoverLetter.findOne({ _id: otherId, userId })
  ]);
  if (!a || !b) {
    const { response, statusCode } = errorResponse("One or both cover letters not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }
  const keys = Array.from(new Set([...(Object.keys(a.sections||{})), ...(Object.keys(b.sections||{}))]));
  const diff = keys.map(k => {
    const av = (a.sections?.[k] ?? '').split('\n');
    const bv = (b.sections?.[k] ?? '').split('\n');
    // naive line diff: list lines only in A or only in B
    const onlyInA = av.filter(line => !bv.includes(line));
    const onlyInB = bv.filter(line => !av.includes(line));
    return { section: k, onlyInA, onlyInB };
  });
  const { response, statusCode } = successResponse("Cover letter comparison", { a: { id: a._id, name: a.name }, b: { id: b._id, name: b.name }, diff });
  return sendResponse(res, response, statusCode);
});
