import { CoverLetter } from "../models/CoverLetter.js";
import { CoverLetterTemplate } from "../models/CoverLetterTemplate.js";
import { Job } from "../models/Job.js";
import { errorResponse, sendResponse, successResponse, ERROR_CODES } from "../utils/responseFormat.js";

const getUserId = (req) => {
  const auth = typeof req.auth === 'function' ? req.auth() : req.auth;
  return auth?.userId || auth?.payload?.sub;
};

// List all cover letters for a user
export const listCoverLetters = async (req, res) => {
  try {
    const userId = getUserId(req);
    const coverLetters = await CoverLetter.find({ userId }).sort({ updatedAt: -1 }).lean();
    
    // Add job usage count for each cover letter (similar to resumes)
    const coverLettersWithJobCount = await Promise.all(
      coverLetters.map(async (coverLetter) => {
        const jobCount = await Job.countDocuments({ 
          userId, 
          linkedCoverLetterId: coverLetter._id 
        });
        return { ...coverLetter, linkedJobCount: jobCount };
      })
    );
    
    const { response, statusCode } = successResponse("Cover letters fetched", { coverLetters: coverLettersWithJobCount });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Failed to fetch cover letters:", err);
    const { response, statusCode } = errorResponse("Failed to fetch cover letters", 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

// Create a cover letter from a template
export const createCoverLetterFromTemplate = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { templateId, name, content, jobId } = req.body || {};
    
    if (!name || !content) {
      const { response, statusCode } = errorResponse("name and content are required", 400, ERROR_CODES.MISSING_REQUIRED_FIELD);
      return sendResponse(res, response, statusCode);
    }
    
    // If templateId is provided, verify the template exists and user has access
    if (templateId) {
      const tpl = await CoverLetterTemplate.findOne({ 
        _id: templateId, 
        $or: [{ userId }, { isShared: true }] 
      });
      if (!tpl) {
        const { response, statusCode } = errorResponse("Template not found", 404, ERROR_CODES.NOT_FOUND);
        return sendResponse(res, response, statusCode);
      }
      // Increment usage count
      tpl.usageCount += 1;
      await tpl.save();
    }
    
    const coverLetter = await CoverLetter.create({ 
      userId, 
      templateId: templateId || null, 
      name, 
      content,
      jobId: jobId || null
    });
    
    const { response, statusCode } = successResponse("Cover letter created", { coverLetter }, 201);
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Failed to create cover letter:", err);
    const { response, statusCode } = errorResponse("Failed to create cover letter", 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

// Get a specific cover letter
export const getCoverLetterById = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    
    const coverLetter = await CoverLetter.findOne({ _id: id, userId }).lean();
    if (!coverLetter) {
      const { response, statusCode } = errorResponse("Cover letter not found", 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }
    
    const { response, statusCode } = successResponse("Cover letter fetched", { coverLetter });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Failed to fetch cover letter:", err);
    const { response, statusCode } = errorResponse("Failed to fetch cover letter", 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

// Update a cover letter
export const updateCoverLetter = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const updates = req.body || {};
    
    const coverLetter = await CoverLetter.findOne({ _id: id, userId });
    if (!coverLetter) {
      const { response, statusCode } = errorResponse("Cover letter not found", 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }
    
    Object.assign(coverLetter, updates);
    await coverLetter.save();
    
    const { response, statusCode } = successResponse("Cover letter updated", { coverLetter });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Failed to update cover letter:", err);
    const { response, statusCode } = errorResponse("Failed to update cover letter", 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

// Delete a cover letter
export const deleteCoverLetter = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    
    const result = await CoverLetter.deleteOne({ _id: id, userId });
    if (result.deletedCount === 0) {
      const { response, statusCode } = errorResponse("Cover letter not found", 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }
    
    const { response, statusCode } = successResponse("Cover letter deleted");
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Failed to delete cover letter:", err);
    const { response, statusCode } = errorResponse("Failed to delete cover letter", 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

// Set a cover letter as default
export const setDefaultCoverLetter = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    
    const coverLetter = await CoverLetter.findOne({ _id: id, userId });
    if (!coverLetter) {
      const { response, statusCode } = errorResponse("Cover letter not found", 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }
    
    // Unset all other default cover letters
    await CoverLetter.updateMany({ userId, _id: { $ne: id } }, { $set: { isDefault: false } });
    
    coverLetter.isDefault = true;
    await coverLetter.save();
    
    const { response, statusCode } = successResponse("Default cover letter set", { coverLetter });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Failed to set default cover letter:", err);
    const { response, statusCode } = errorResponse("Failed to set default cover letter", 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

// Archive a cover letter
export const archiveCoverLetter = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    
    const coverLetter = await CoverLetter.findOne({ _id: id, userId });
    if (!coverLetter) {
      const { response, statusCode } = errorResponse("Cover letter not found", 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }
    
    coverLetter.isArchived = true;
    await coverLetter.save();
    
    const { response, statusCode } = successResponse("Cover letter archived", { coverLetter });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Failed to archive cover letter:", err);
    const { response, statusCode } = errorResponse("Failed to archive cover letter", 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

// Unarchive a cover letter
export const unarchiveCoverLetter = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    
    const coverLetter = await CoverLetter.findOne({ _id: id, userId });
    if (!coverLetter) {
      const { response, statusCode } = errorResponse("Cover letter not found", 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }
    
    coverLetter.isArchived = false;
    await coverLetter.save();
    
    const { response, statusCode } = successResponse("Cover letter unarchived", { coverLetter });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Failed to unarchive cover letter:", err);
    const { response, statusCode } = errorResponse("Failed to unarchive cover letter", 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

// Clone a cover letter
export const cloneCoverLetter = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const { name } = req.body;
    
    const originalCoverLetter = await CoverLetter.findOne({ _id: id, userId });
    if (!originalCoverLetter) {
      const { response, statusCode } = errorResponse("Cover letter not found", 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }
    
    const clonedCoverLetter = await CoverLetter.create({
      userId,
      templateId: originalCoverLetter.templateId,
      name: name || `${originalCoverLetter.name} (Copy)`,
      content: originalCoverLetter.content,
      jobId: originalCoverLetter.jobId,
      metadata: {
        ...originalCoverLetter.metadata,
        clonedFrom: id,
        clonedAt: new Date()
      },
      isDefault: false,
      isArchived: false
    });
    
    const { response, statusCode } = successResponse("Cover letter cloned", { coverLetter: clonedCoverLetter }, 201);
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Failed to clone cover letter:", err);
    const { response, statusCode } = errorResponse("Failed to clone cover letter", 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};
