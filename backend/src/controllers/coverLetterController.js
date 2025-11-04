import { CoverLetter } from "../models/CoverLetter.js";
import { errorResponse, sendResponse, successResponse, ERROR_CODES } from "../utils/responseFormat.js";

/**
 * Create a new cover letter
 */
export const createCoverLetter = async (req, res) => {
  try {
    const { name, content, metadata, isDefault } = req.body;
    const userId = req.auth.userId;

    if (!name || !content) {
      const { response, statusCode } = errorResponse(
        "Name and content are required",
        400,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
      return sendResponse(res, response, statusCode);
    }

    const coverLetter = new CoverLetter({
      userId,
      name,
      content,
      metadata: metadata || {},
      isDefault: isDefault || false,
    });

    await coverLetter.save();

    const { response: successResp, statusCode } = successResponse(
      "Cover letter created successfully",
      { coverLetter }
    );
    return sendResponse(res, successResp, statusCode);
  } catch (error) {
    console.error("Error creating cover letter:", error);
    const { response, statusCode } = errorResponse(
      error.message || "Failed to create cover letter",
      500,
      ERROR_CODES.DATABASE_ERROR
    );
    return sendResponse(res, response, statusCode);
  }
};

/**
 * Get all cover letters for the user
 */
export const getAllCoverLetters = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { includeArchived } = req.query;

    const filter = { userId };
    if (includeArchived !== 'true') {
      filter.isArchived = false;
    }

    const coverLetters = await CoverLetter.find(filter)
      .sort({ isDefault: -1, updatedAt: -1 });

    const { response: successResp, statusCode } = successResponse(
      "Cover letters retrieved successfully",
      { coverLetters }
    );
    return sendResponse(res, successResp, statusCode);
  } catch (error) {
    console.error("Error getting cover letters:", error);
    const { response, statusCode } = errorResponse(
      "Failed to retrieve cover letters",
      500,
      ERROR_CODES.DATABASE_ERROR
    );
    return sendResponse(res, response, statusCode);
  }
};

/**
 * Get a single cover letter by ID
 */
export const getCoverLetterById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.auth.userId;

    const coverLetter = await CoverLetter.findOne({ _id: id, userId });

    if (!coverLetter) {
      const { response, statusCode } = errorResponse(
        "Cover letter not found",
        404,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
      return sendResponse(res, response, statusCode);
    }

    const { response: successResp, statusCode } = successResponse(
      "Cover letter retrieved successfully",
      { coverLetter }
    );
    return sendResponse(res, successResp, statusCode);
  } catch (error) {
    console.error("Error getting cover letter:", error);
    const { response, statusCode } = errorResponse(
      "Failed to retrieve cover letter",
      500,
      ERROR_CODES.DATABASE_ERROR
    );
    return sendResponse(res, response, statusCode);
  }
};

/**
 * Update a cover letter
 */
export const updateCoverLetter = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.auth.userId;
    const updates = req.body;

    const coverLetter = await CoverLetter.findOne({ _id: id, userId });

    if (!coverLetter) {
      const { response, statusCode } = errorResponse(
        "Cover letter not found",
        404,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
      return sendResponse(res, response, statusCode);
    }

    // Update allowed fields
    const allowedFields = ['name', 'content', 'metadata', 'isDefault', 'isArchived'];
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        coverLetter[field] = updates[field];
      }
    });

    await coverLetter.save();

    const { response: successResp, statusCode } = successResponse(
      "Cover letter updated successfully",
      { coverLetter }
    );
    return sendResponse(res, successResp, statusCode);
  } catch (error) {
    console.error("Error updating cover letter:", error);
    const { response, statusCode } = errorResponse(
      error.message || "Failed to update cover letter",
      500,
      ERROR_CODES.DATABASE_ERROR
    );
    return sendResponse(res, response, statusCode);
  }
};

/**
 * Delete a cover letter
 */
export const deleteCoverLetter = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.auth.userId;

    const coverLetter = await CoverLetter.findOneAndDelete({ _id: id, userId });

    if (!coverLetter) {
      const { response, statusCode } = errorResponse(
        "Cover letter not found",
        404,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
      return sendResponse(res, response, statusCode);
    }

    const { response: successResp, statusCode } = successResponse(
      "Cover letter deleted successfully",
      { id }
    );
    return sendResponse(res, successResp, statusCode);
  } catch (error) {
    console.error("Error deleting cover letter:", error);
    const { response, statusCode } = errorResponse(
      "Failed to delete cover letter",
      500,
      ERROR_CODES.DATABASE_ERROR
    );
    return sendResponse(res, response, statusCode);
  }
};

/**
 * Set a cover letter as default
 */
export const setDefaultCoverLetter = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.auth.userId;

    const coverLetter = await CoverLetter.findOne({ _id: id, userId });

    if (!coverLetter) {
      const { response, statusCode } = errorResponse(
        "Cover letter not found",
        404,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
      return sendResponse(res, response, statusCode);
    }

    // The pre-save middleware will handle unsetting other defaults
    coverLetter.isDefault = true;
    await coverLetter.save();

    const { response: successResp, statusCode } = successResponse(
      "Default cover letter set successfully",
      { coverLetter }
    );
    return sendResponse(res, successResp, statusCode);
  } catch (error) {
    console.error("Error setting default cover letter:", error);
    const { response, statusCode } = errorResponse(
      "Failed to set default cover letter",
      500,
      ERROR_CODES.DATABASE_ERROR
    );
    return sendResponse(res, response, statusCode);
  }
};
