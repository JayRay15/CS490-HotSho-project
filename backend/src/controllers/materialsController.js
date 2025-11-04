import { Job } from "../models/Job.js";
import { Resume } from "../models/Resume.js";
import { CoverLetter } from "../models/CoverLetter.js";
import { errorResponse, sendResponse, successResponse, ERROR_CODES } from "../utils/responseFormat.js";

/**
 * Link resume and/or cover letter to a job application
 */
export const linkMaterialsToJob = async (req, res) => {
  try {
    const { jobId, resumeId, coverLetterId, reason } = req.body;
    const userId = req.auth.userId;

    if (!jobId) {
      const { response, statusCode } = errorResponse(
        "Job ID is required",
        400,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
      return sendResponse(res, response, statusCode);
    }

    // Find the job
    const job = await Job.findOne({ _id: jobId, userId });
    if (!job) {
      const { response, statusCode } = errorResponse(
        "Job not found",
        404,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
      return sendResponse(res, response, statusCode);
    }

    // Verify resume ownership if provided
    if (resumeId) {
      const resume = await Resume.findOne({ _id: resumeId, userId });
      if (!resume) {
        const { response, statusCode } = errorResponse(
          "Resume not found or not owned by user",
          404,
          ERROR_CODES.RESOURCE_NOT_FOUND
        );
        return sendResponse(res, response, statusCode);
      }
      job.materials.resume = resumeId;
    }

    // Verify cover letter ownership if provided
    if (coverLetterId) {
      const coverLetter = await CoverLetter.findOne({ _id: coverLetterId, userId });
      if (!coverLetter) {
        const { response, statusCode } = errorResponse(
          "Cover letter not found or not owned by user",
          404,
          ERROR_CODES.RESOURCE_NOT_FOUND
        );
        return sendResponse(res, response, statusCode);
      }
      job.materials.coverLetter = coverLetterId;
    }

    // Add to history
    job.materialsHistory.push({
      resume: resumeId || job.materials.resume,
      coverLetter: coverLetterId || job.materials.coverLetter,
      changedAt: new Date(),
      changedBy: "user",
      reason: reason || "Materials linked to application",
    });

    await job.save();

    // Populate materials for response
    await job.populate('materials.resume materials.coverLetter');

    const { response: successResp, statusCode } = successResponse(
      "Materials linked successfully",
      { job }
    );
    return sendResponse(res, successResp, statusCode);
  } catch (error) {
    console.error("Error linking materials:", error);
    const { response, statusCode } = errorResponse(
      "Failed to link materials",
      500,
      ERROR_CODES.DATABASE_ERROR
    );
    return sendResponse(res, response, statusCode);
  }
};

/**
 * Update materials for an existing job application
 */
export const updateJobMaterials = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { resumeId, coverLetterId, reason } = req.body;
    const userId = req.auth.userId;

    const job = await Job.findOne({ _id: jobId, userId });
    if (!job) {
      const { response, statusCode } = errorResponse(
        "Job not found",
        404,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
      return sendResponse(res, response, statusCode);
    }

    // Update resume if provided
    if (resumeId !== undefined) {
      if (resumeId === null) {
        job.materials.resume = null;
      } else {
        const resume = await Resume.findOne({ _id: resumeId, userId });
        if (!resume) {
          const { response, statusCode } = errorResponse(
            "Resume not found",
            404,
            ERROR_CODES.RESOURCE_NOT_FOUND
          );
          return sendResponse(res, response, statusCode);
        }
        job.materials.resume = resumeId;
      }
    }

    // Update cover letter if provided
    if (coverLetterId !== undefined) {
      if (coverLetterId === null) {
        job.materials.coverLetter = null;
      } else {
        const coverLetter = await CoverLetter.findOne({ _id: coverLetterId, userId });
        if (!coverLetter) {
          const { response, statusCode } = errorResponse(
            "Cover letter not found",
            404,
            ERROR_CODES.RESOURCE_NOT_FOUND
          );
          return sendResponse(res, response, statusCode);
        }
        job.materials.coverLetter = coverLetterId;
      }
    }

    // Manually trigger materials history update
    job.markModified('materials');
    await job.save();

    await job.populate('materials.resume materials.coverLetter');

    const { response: successResp, statusCode } = successResponse(
      "Materials updated successfully",
      { job }
    );
    return sendResponse(res, successResp, statusCode);
  } catch (error) {
    console.error("Error updating materials:", error);
    const { response, statusCode } = errorResponse(
      "Failed to update materials",
      500,
      ERROR_CODES.DATABASE_ERROR
    );
    return sendResponse(res, response, statusCode);
  }
};

/**
 * Get materials history for a specific job
 */
export const getJobMaterialsHistory = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.auth.userId;

    const job = await Job.findOne({ _id: jobId, userId })
      .populate('materialsHistory.resume materialsHistory.coverLetter')
      .select('materialsHistory title company');

    if (!job) {
      const { response, statusCode } = errorResponse(
        "Job not found",
        404,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
      return sendResponse(res, response, statusCode);
    }

    const { response: successResp, statusCode } = successResponse(
      "Materials history retrieved",
      { 
        jobTitle: job.title,
        company: job.company,
        history: job.materialsHistory 
      }
    );
    return sendResponse(res, successResp, statusCode);
  } catch (error) {
    console.error("Error getting materials history:", error);
    const { response, statusCode } = errorResponse(
      "Failed to retrieve materials history",
      500,
      ERROR_CODES.DATABASE_ERROR
    );
    return sendResponse(res, response, statusCode);
  }
};

/**
 * Get materials usage analytics
 */
export const getMaterialsUsageAnalytics = async (req, res) => {
  try {
    const userId = req.auth.userId;

    // Get all jobs with materials
    const jobs = await Job.find({ userId })
      .populate('materials.resume materials.coverLetter')
      .select('materials status title company');

    // Count resume usage
    const resumeUsage = {};
    const coverLetterUsage = {};
    const statusByMaterial = {};

    jobs.forEach(job => {
      if (job.materials?.resume) {
        const resumeId = job.materials.resume._id.toString();
        if (!resumeUsage[resumeId]) {
          resumeUsage[resumeId] = {
            resume: job.materials.resume,
            count: 0,
            statuses: {},
          };
        }
        resumeUsage[resumeId].count++;
        resumeUsage[resumeId].statuses[job.status] = 
          (resumeUsage[resumeId].statuses[job.status] || 0) + 1;
      }

      if (job.materials?.coverLetter) {
        const coverLetterId = job.materials.coverLetter._id.toString();
        if (!coverLetterUsage[coverLetterId]) {
          coverLetterUsage[coverLetterId] = {
            coverLetter: job.materials.coverLetter,
            count: 0,
            statuses: {},
          };
        }
        coverLetterUsage[coverLetterId].count++;
        coverLetterUsage[coverLetterId].statuses[job.status] = 
          (coverLetterUsage[coverLetterId].statuses[job.status] || 0) + 1;
      }
    });

    // Convert to arrays and sort by usage
    const resumeStats = Object.values(resumeUsage).sort((a, b) => b.count - a.count);
    const coverLetterStats = Object.values(coverLetterUsage).sort((a, b) => b.count - a.count);

    // Calculate success rates (Offer / Total)
    resumeStats.forEach(stat => {
      stat.successRate = stat.statuses.Offer ? 
        ((stat.statuses.Offer / stat.count) * 100).toFixed(1) : 0;
    });

    coverLetterStats.forEach(stat => {
      stat.successRate = stat.statuses.Offer ? 
        ((stat.statuses.Offer / stat.count) * 100).toFixed(1) : 0;
    });

    const { response: successResp, statusCode } = successResponse(
      "Materials analytics retrieved",
      { 
        resumeUsage: resumeStats,
        coverLetterUsage: coverLetterStats,
        totalApplications: jobs.length,
        applicationsWithResume: jobs.filter(j => j.materials?.resume).length,
        applicationsWithCoverLetter: jobs.filter(j => j.materials?.coverLetter).length,
      }
    );
    return sendResponse(res, successResp, statusCode);
  } catch (error) {
    console.error("Error getting materials analytics:", error);
    const { response, statusCode } = errorResponse(
      "Failed to retrieve analytics",
      500,
      ERROR_CODES.DATABASE_ERROR
    );
    return sendResponse(res, response, statusCode);
  }
};

/**
 * Get default materials (resume and cover letter)
 */
export const getDefaultMaterials = async (req, res) => {
  try {
    const userId = req.auth.userId;

    const defaultResume = await Resume.findOne({ userId, isDefault: true, isArchived: false });
    const defaultCoverLetter = await CoverLetter.findOne({ userId, isDefault: true, isArchived: false });

    const { response: successResp, statusCode } = successResponse(
      "Default materials retrieved",
      { 
        defaultResume,
        defaultCoverLetter,
      }
    );
    return sendResponse(res, successResp, statusCode);
  } catch (error) {
    console.error("Error getting default materials:", error);
    const { response, statusCode } = errorResponse(
      "Failed to retrieve default materials",
      500,
      ERROR_CODES.DATABASE_ERROR
    );
    return sendResponse(res, response, statusCode);
  }
};

/**
 * Get all resumes (for dropdown selection)
 */
export const getAllResumes = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const resumes = await Resume.find({ userId, isArchived: false })
      .select('name isDefault createdAt updatedAt metadata')
      .sort({ isDefault: -1, updatedAt: -1 });

    const { response: successResp, statusCode } = successResponse(
      "Resumes retrieved",
      { resumes }
    );
    return sendResponse(res, successResp, statusCode);
  } catch (error) {
    console.error("Error getting resumes:", error);
    const { response, statusCode } = errorResponse(
      "Failed to retrieve resumes",
      500,
      ERROR_CODES.DATABASE_ERROR
    );
    return sendResponse(res, response, statusCode);
  }
};

/**
 * Get all cover letters (for dropdown selection)
 */
export const getAllCoverLetters = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const coverLetters = await CoverLetter.find({ userId, isArchived: false })
      .select('name isDefault createdAt updatedAt metadata')
      .sort({ isDefault: -1, updatedAt: -1 });

    const { response: successResp, statusCode } = successResponse(
      "Cover letters retrieved",
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
