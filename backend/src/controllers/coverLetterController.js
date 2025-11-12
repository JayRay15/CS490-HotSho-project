import { CoverLetter } from "../models/CoverLetter.js";
import { CoverLetterTemplate } from "../models/CoverLetterTemplate.js";
import { Job } from "../models/Job.js";
import { User } from "../models/User.js";
import { errorResponse, sendResponse, successResponse, ERROR_CODES } from "../utils/responseFormat.js";
import {
  checkSpellingAndGrammar,
  getSynonymSuggestions,
  analyzeReadability,
  suggestRestructuring
} from "../utils/geminiService.js";
import {
  exportCoverLetterToDocx,
  exportCoverLetterToHtml,
  exportCoverLetterToPdf,
  exportCoverLetterToPlainText,
  generateEmailTemplate,
  generateCoverLetterFilename
} from "../utils/coverLetterExporter.js";
import {
  selectRelevantExperiences,
  generateExperienceNarrative,
  connectToJobRequirements,
  suggestAdditionalExperiences,
  scoreExperiencePackage,
  generateAlternativePresentations,
  quantifyAchievements
} from "../utils/experienceAnalyzer.js";

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
    const { response, statusCode } = errorResponse("Failed to export cover letter", 500, ERROR_CODES.SERVER_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

// UC-060: AI-powered editing assistance endpoints

/**
 * Check spelling and grammar in cover letter text
 */
export const checkCoverLetterSpelling = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      const { response, statusCode } = errorResponse("Text is required", 400, ERROR_CODES.MISSING_REQUIRED_FIELD);
      return sendResponse(res, response, statusCode);
    }

    const analysis = await checkSpellingAndGrammar(text);

    const { response, statusCode } = successResponse("Spelling and grammar check completed", { analysis });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Failed to check spelling and grammar:", err);
    const { response, statusCode } = errorResponse("Failed to check spelling and grammar", 500, ERROR_CODES.SERVER_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

/**
 * Get synonym suggestions for a word
 */
export const getCoverLetterSynonyms = async (req, res) => {
  try {
    const { word, context } = req.body;

    if (!word || !word.trim()) {
      const { response, statusCode } = errorResponse("Word is required", 400, ERROR_CODES.MISSING_REQUIRED_FIELD);
      return sendResponse(res, response, statusCode);
    }

    const suggestions = await getSynonymSuggestions(word, context || '');

    const { response, statusCode } = successResponse("Synonym suggestions retrieved", { suggestions });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Failed to get synonym suggestions:", err);
    const { response, statusCode } = errorResponse("Failed to get synonym suggestions", 500, ERROR_CODES.SERVER_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

/**
 * Analyze readability of cover letter text
 */
export const analyzeCoverLetterReadability = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      const { response, statusCode } = errorResponse("Text is required", 400, ERROR_CODES.MISSING_REQUIRED_FIELD);
      return sendResponse(res, response, statusCode);
    }

    const analysis = await analyzeReadability(text);

    const { response, statusCode } = successResponse("Readability analysis completed", { analysis });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Failed to analyze readability:", err);
    const { response, statusCode } = errorResponse("Failed to analyze readability", 500, ERROR_CODES.SERVER_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

/**
 * Get restructuring suggestions for text
 */
export const getSentenceRestructuring = async (req, res) => {
  try {
    const { text, type } = req.body;

    if (!text || !text.trim()) {
      const { response, statusCode } = errorResponse("Text is required", 400, ERROR_CODES.MISSING_REQUIRED_FIELD);
      return sendResponse(res, response, statusCode);
    }

    const suggestions = await suggestRestructuring(text, type || 'sentence');

    const { response, statusCode } = successResponse("Restructuring suggestions retrieved", { suggestions });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Failed to get restructuring suggestions:", err);
    const { response, statusCode } = errorResponse("Failed to get restructuring suggestions", 500, ERROR_CODES.SERVER_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

/**
 * Save a version of the cover letter during editing
 */
export const saveCoverLetterVersion = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const { content, note } = req.body;

    const coverLetter = await CoverLetter.findOne({ _id: id, userId });
    if (!coverLetter) {
      const { response, statusCode } = errorResponse("Cover letter not found", 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }

    // Initialize editHistory if it doesn't exist
    if (!coverLetter.editHistory) {
      coverLetter.editHistory = [];
    }

    // Add current version to history
    coverLetter.editHistory.push({
      content,
      note: note || 'Manual save',
      timestamp: new Date()
    });

    // Keep only last 20 versions to prevent bloat
    if (coverLetter.editHistory.length > 20) {
      coverLetter.editHistory = coverLetter.editHistory.slice(-20);
    }

    await coverLetter.save();

    const { response, statusCode } = successResponse("Version saved", { 
      versionCount: coverLetter.editHistory.length,
      latestVersion: coverLetter.editHistory[coverLetter.editHistory.length - 1]
    });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Failed to save version:", err);
    const { response, statusCode } = errorResponse("Failed to save version", 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

/**
 * Get edit history for a cover letter
 */
export const getCoverLetterHistory = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const coverLetter = await CoverLetter.findOne({ _id: id, userId }).lean();
    if (!coverLetter) {
      const { response, statusCode } = errorResponse("Cover letter not found", 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }

    const { response, statusCode } = successResponse("Edit history retrieved", { 
      history: coverLetter.editHistory || []
    });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Failed to get edit history:", err);
    const { response, statusCode } = errorResponse("Failed to get edit history", 500, ERROR_CODES.DATABASE_ERROR);
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

/**
 * Analyze experience relevance for a job and generate narratives
 * POST /api/cover-letters/analyze-experience
 */
export const analyzeExperienceForCoverLetter = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { jobId, maxExperiences = 3 } = req.body;

    if (!jobId) {
      const { response, statusCode } = errorResponse("Job ID is required", 400, ERROR_CODES.VALIDATION_ERROR);
      return sendResponse(res, response, statusCode);
    }

    // Fetch job details
    const job = await Job.findOne({ _id: jobId, userId }).lean();
    if (!job) {
      const { response, statusCode } = errorResponse("Job not found", 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }

    // Fetch user profile with employment (work experience)
    const user = await User.findOne({ auth0Id: userId }).select('employment skills').lean();
    if (!user || !user.employment || user.employment.length === 0) {
      const { response, statusCode } = errorResponse("No work experience found in profile. Please add your employment history in your profile.", 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }

    // Transform employment data to match experience analyzer format
    const workExperience = user.employment.map(emp => ({
      title: emp.position || emp.jobTitle,
      company: emp.company,
      startDate: emp.startDate,
      endDate: emp.endDate,
      description: emp.description || '',
      achievements: emp.description ? emp.description.split('\n').filter(line => line.trim()) : [],
      location: emp.location,
      isCurrentPosition: emp.isCurrentPosition
    }));

    // Select most relevant experiences
    const relevantExperiences = selectRelevantExperiences(
      workExperience,
      job,
      user.skills || [],
      maxExperiences
    );

    // Generate narratives for each experience
    const experiencesWithNarratives = relevantExperiences.map(exp => {
      const narratives = generateExperienceNarrative(exp, job, exp.relevance);
      const alternativePresentations = generateAlternativePresentations(exp, job);
      const quantified = quantifyAchievements(exp.achievements || [], exp.relevance);
      
      return {
        experience: {
          title: exp.title,
          company: exp.company,
          startDate: exp.startDate,
          endDate: exp.endDate,
          description: exp.description,
          achievements: exp.achievements
        },
        relevance: exp.relevance,
        narratives,
        quantifiedAchievements: quantified,
        alternativePresentations
      };
    });

    // Connect experiences to job requirements
    const requirementConnections = connectToJobRequirements(relevantExperiences, job);

    // Suggest additional experiences
    const additionalSuggestions = suggestAdditionalExperiences(
      workExperience,
      relevantExperiences,
      job
    );

    // Score overall experience package
    const packageScore = scoreExperiencePackage(relevantExperiences, job);

    const analysisResult = {
      selectedExperiences: experiencesWithNarratives,
      requirementConnections,
      additionalSuggestions: additionalSuggestions.map(s => ({
        experience: {
          title: s.experience.title,
          company: s.experience.company
        },
        relevanceScore: s.relevance.score,
        reason: s.reason
      })),
      packageScore,
      recommendations: generateExperienceRecommendations(packageScore, relevantExperiences, job)
    };

    const { response, statusCode } = successResponse("Experience analysis completed", analysisResult);
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Failed to analyze experience:", err);
    const { response, statusCode } = errorResponse("Failed to analyze experience", 500, ERROR_CODES.INTERNAL_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

/**
 * Generate experience recommendations based on analysis
 */
function generateExperienceRecommendations(packageScore, experiences, job) {
  const recommendations = [];

  if (packageScore.overallScore >= 70) {
    recommendations.push({
      type: 'emphasis',
      message: 'Your experience is highly relevant - emphasize specific achievements',
      action: 'Use achievement-focused narratives in your cover letter'
    });
  } else if (packageScore.overallScore >= 50) {
    recommendations.push({
      type: 'transferable',
      message: 'Good match - highlight transferable skills',
      action: 'Connect your experiences to job requirements explicitly'
    });
  } else {
    recommendations.push({
      type: 'growth',
      message: 'Emphasize learning ability and growth potential',
      action: 'Focus on how past experiences prepared you for this role'
    });
  }

  if (packageScore.gaps.length > 0) {
    recommendations.push({
      type: 'skill-gaps',
      message: `Address skill gaps: ${packageScore.gaps.slice(0, 3).join(', ')}`,
      action: 'Mention relevant coursework, projects, or self-study'
    });
  }

  if (experiences.length < 3) {
    recommendations.push({
      type: 'expand',
      message: 'Consider adding more relevant experiences',
      action: 'Include internships, projects, or volunteer work'
    });
  }

  // Check for quantification
  const hasQuantified = experiences.some(exp => 
    exp.achievements?.some(a => /\d+/.test(a))
  );
  if (!hasQuantified) {
    recommendations.push({
      type: 'quantify',
      message: 'Add metrics to your achievements',
      action: 'Quantify impact where possible (e.g., "increased by 25%")'
    });
  }

  return recommendations;
}
