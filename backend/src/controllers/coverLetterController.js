import { CoverLetter } from "../models/CoverLetter.js";
import { CoverLetterTemplate } from "../models/CoverLetterTemplate.js";
import { Job } from "../models/Job.js";
import { User } from "../models/User.js";
import { errorResponse, sendResponse, successResponse, ERROR_CODES } from "../utils/responseFormat.js";
import {
  exportCoverLetterToDocx,
  exportCoverLetterToHtml,
  exportCoverLetterToPdf,
  exportCoverLetterToPlainText,
  generateEmailTemplate,
  generateCoverLetterFilename
} from "../utils/coverLetterExporter.js";

const getUserId = (req) => {
  const auth = typeof req.auth === 'function' ? req.auth() : req.auth;
  return auth?.userId || auth?.payload?.sub;
};

// List all cover letters for a user
export const listCoverLetters = async (req, res) => {
  try {
    const userId = getUserId(req);
    const coverLetters = await CoverLetter.find({ userId })
      .populate('templateId', 'name style industry')
      .sort({ updatedAt: -1 })
      .lean();

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
    const { templateId, name, content, style, jobId } = req.body || {};

    // Validate required fields
    if (!name || !content) {
      console.error('Validation error: Missing required fields', { hasName: !!name, hasContent: !!content });
      const { response, statusCode } = errorResponse("name and content are required", 400, ERROR_CODES.MISSING_REQUIRED_FIELD);
      return sendResponse(res, response, statusCode);
    }

    // Validate content is not empty
    if (!content.trim()) {
      console.error('Validation error: Content is empty');
      const { response, statusCode } = errorResponse("Content cannot be empty", 400, ERROR_CODES.INVALID_INPUT);
      return sendResponse(res, response, statusCode);
    }

    let coverLetterStyle = style || 'formal';

    // If templateId is provided, verify the template exists and user has access
    if (templateId) {
      const tpl = await CoverLetterTemplate.findOne({
        _id: templateId,
        $or: [{ userId }, { isShared: true }]
      });
      if (!tpl) {
        console.error('Template not found:', templateId);
        const { response, statusCode } = errorResponse("Template not found", 404, ERROR_CODES.NOT_FOUND);
        return sendResponse(res, response, statusCode);
      }
      // Increment usage count
      tpl.usageCount += 1;
      await tpl.save();

      // Use template's style if no style provided
      if (!style) {
        coverLetterStyle = tpl.style;
      }
    }

    const coverLetter = await CoverLetter.create({
      userId,
      templateId: templateId || null,
      name,
      content,
      style: coverLetterStyle,
      jobId: jobId || null
    });

    const { response, statusCode } = successResponse("Cover letter created", { coverLetter }, 201);
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Failed to create cover letter:", err);
    console.error("Error details:", {
      name: err.name,
      message: err.message,
      code: err.code
    });
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

// UC-054: Export cover letter to PDF
export const exportCoverLetterAsPdf = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const {
      letterhead,
      jobDetails,
      printOptimized = false
    } = req.body || {};

    const coverLetter = await CoverLetter.findOne({ _id: id, userId })
      .populate('templateId', 'theme')
      .populate('jobId', 'company jobTitle hiringManager companyAddress')
      .lean();

    if (!coverLetter) {
      const { response, statusCode } = errorResponse("Cover letter not found", 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }

    // Get user contact info
    const user = await User.findOne({ userId }).select('profile').lean();
    const contactInfo = user?.profile?.contactInfo || {};

    // Merge job details from linked job if available
    const finalJobDetails = {
      ...jobDetails,
      ...(coverLetter.jobId ? {
        company: coverLetter.jobId.company,
        jobTitle: coverLetter.jobId.jobTitle,
        hiringManager: coverLetter.jobId.hiringManager,
        companyAddress: coverLetter.jobId.companyAddress
      } : {})
    };

    // Generate PDF
    const pdfBuffer = await exportCoverLetterToPdf(coverLetter, {
      style: coverLetter.style,
      letterhead,
      contactInfo,
      jobDetails: finalJobDetails,
      template: coverLetter.templateId,
      printOptimized
    });

    // Generate filename
    const filename = generateCoverLetterFilename(
      coverLetter,
      contactInfo,
      finalJobDetails,
      'pdf'
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error("Failed to export cover letter as PDF:", err);
    const { response, statusCode } = errorResponse("Failed to export cover letter", 500, ERROR_CODES.EXPORT_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

// UC-054: Export cover letter to DOCX
export const exportCoverLetterAsDocx = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const {
      letterhead,
      jobDetails,
      printOptimized = false
    } = req.body || {};

    const coverLetter = await CoverLetter.findOne({ _id: id, userId })
      .populate('templateId', 'theme')
      .populate('jobId', 'company jobTitle hiringManager companyAddress')
      .lean();

    if (!coverLetter) {
      const { response, statusCode } = errorResponse("Cover letter not found", 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }

    // Get user contact info
    const user = await User.findOne({ userId }).select('profile').lean();
    const contactInfo = user?.profile?.contactInfo || {};

    // Merge job details
    const finalJobDetails = {
      ...jobDetails,
      ...(coverLetter.jobId ? {
        company: coverLetter.jobId.company,
        jobTitle: coverLetter.jobId.jobTitle,
        hiringManager: coverLetter.jobId.hiringManager,
        companyAddress: coverLetter.jobId.companyAddress
      } : {})
    };

    // Generate DOCX
    const docxBuffer = await exportCoverLetterToDocx(coverLetter, {
      style: coverLetter.style,
      letterhead,
      contactInfo,
      jobDetails: finalJobDetails,
      template: coverLetter.templateId,
      printOptimized
    });

    // Generate filename
    const filename = generateCoverLetterFilename(
      coverLetter,
      contactInfo,
      finalJobDetails,
      'docx'
    );

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(docxBuffer);
  } catch (err) {
    console.error("Failed to export cover letter as DOCX:", err);
    const { response, statusCode } = errorResponse("Failed to export cover letter", 500, ERROR_CODES.EXPORT_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

// UC-054: Export cover letter to HTML
export const exportCoverLetterAsHtml = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const {
      letterhead,
      jobDetails,
      printOptimized = false
    } = req.body || {};

    const coverLetter = await CoverLetter.findOne({ _id: id, userId })
      .populate('templateId', 'theme')
      .populate('jobId', 'company jobTitle hiringManager companyAddress')
      .lean();

    if (!coverLetter) {
      const { response, statusCode } = errorResponse("Cover letter not found", 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }

    // Get user contact info
    const user = await User.findOne({ userId }).select('profile').lean();
    const contactInfo = user?.profile?.contactInfo || {};

    // Merge job details
    const finalJobDetails = {
      ...jobDetails,
      ...(coverLetter.jobId ? {
        company: coverLetter.jobId.company,
        jobTitle: coverLetter.jobId.jobTitle,
        hiringManager: coverLetter.jobId.hiringManager,
        companyAddress: coverLetter.jobId.companyAddress
      } : {})
    };

    // Generate HTML
    const html = exportCoverLetterToHtml(coverLetter, {
      style: coverLetter.style,
      letterhead,
      contactInfo,
      jobDetails: finalJobDetails,
      template: coverLetter.templateId,
      printOptimized
    });

    // Generate filename
    const filename = generateCoverLetterFilename(
      coverLetter,
      contactInfo,
      finalJobDetails,
      'html'
    );

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(html);
  } catch (err) {
    console.error("Failed to export cover letter as HTML:", err);
    const { response, statusCode } = errorResponse("Failed to export cover letter", 500, ERROR_CODES.EXPORT_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

// UC-054: Export cover letter to plain text
export const exportCoverLetterAsText = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const {
      jobDetails,
      includeHeader = true
    } = req.body || {};

    const coverLetter = await CoverLetter.findOne({ _id: id, userId })
      .populate('jobId', 'company jobTitle hiringManager companyAddress')
      .lean();

    if (!coverLetter) {
      const { response, statusCode } = errorResponse("Cover letter not found", 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }

    // Get user contact info
    const user = await User.findOne({ userId }).select('profile').lean();
    const contactInfo = user?.profile?.contactInfo || {};

    // Merge job details
    const finalJobDetails = {
      ...jobDetails,
      ...(coverLetter.jobId ? {
        company: coverLetter.jobId.company,
        jobTitle: coverLetter.jobId.jobTitle,
        hiringManager: coverLetter.jobId.hiringManager,
        companyAddress: coverLetter.jobId.companyAddress
      } : {})
    };

    // Generate plain text
    const text = exportCoverLetterToPlainText(coverLetter, {
      contactInfo,
      jobDetails: finalJobDetails,
      includeHeader
    });

    // Generate filename
    const filename = generateCoverLetterFilename(
      coverLetter,
      contactInfo,
      finalJobDetails,
      'txt'
    );

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(text);
  } catch (err) {
    console.error("Failed to export cover letter as text:", err);
    const { response, statusCode } = errorResponse("Failed to export cover letter", 500, ERROR_CODES.EXPORT_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

// UC-054: Generate email template
export const generateCoverLetterEmailTemplate = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const { jobDetails } = req.body || {};

    const coverLetter = await CoverLetter.findOne({ _id: id, userId })
      .populate('jobId', 'company jobTitle hiringManager companyAddress')
      .lean();

    if (!coverLetter) {
      const { response, statusCode } = errorResponse("Cover letter not found", 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }

    // Get user contact info
    const user = await User.findOne({ userId }).select('profile').lean();
    const contactInfo = user?.profile?.contactInfo || {};

    // Merge job details
    const finalJobDetails = {
      ...jobDetails,
      ...(coverLetter.jobId ? {
        company: coverLetter.jobId.company,
        jobTitle: coverLetter.jobId.jobTitle,
        hiringManager: coverLetter.jobId.hiringManager,
        companyAddress: coverLetter.jobId.companyAddress
      } : {})
    };

    // Generate email template
    const emailTemplate = generateEmailTemplate(coverLetter, {
      contactInfo,
      jobDetails: finalJobDetails
    });

    const { response, statusCode } = successResponse("Email template generated", { emailTemplate });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Failed to generate email template:", err);
    const { response, statusCode } = errorResponse("Failed to generate email template", 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};
