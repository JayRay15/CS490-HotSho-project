import { User } from "../models/User.js";
import { Job } from "../models/Job.js";
import { successResponse, errorResponse, sendResponse, ERROR_CODES } from "../utils/responseFormat.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import {
  extractJobSkills,
  analyzeSkillGap,
  suggestLearningResources,
  generateLearningPath,
  analyzeSkillTrends
} from "../utils/skillGapAnalysis.js";

/**
 * Analyze skill gap for a specific job
 * GET /api/skill-gaps/analyze/:jobId
 */
export const analyzeJobSkillGap = asyncHandler(async (req, res) => {
  const sub = req.auth?.payload?.sub || req.auth?.userId;
  const { jobId } = req.params;

  // Get user profile with skills
  const user = await User.findOne({ auth0Id: sub });
  if (!user) {
    const { response, statusCode } = errorResponse("User not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  // Get job details
  const job = await Job.findOne({ _id: jobId, userId: sub });
  if (!job) {
    const { response, statusCode } = errorResponse("Job not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  // Extract required skills from job
  const jobSkills = extractJobSkills(job);

  // Analyze skill gap
  const gapAnalysis = analyzeSkillGap(user.skills || [], jobSkills);

  // Generate learning resources for gaps
  const allGaps = [...gapAnalysis.missing, ...gapAnalysis.weak];
  const learningResources = suggestLearningResources(allGaps);

  // Generate personalized learning path
  const learningPath = generateLearningPath(allGaps, {
    skills: user.skills,
    experience: user.experienceLevel
  });

  const result = {
    job: {
      id: job._id,
      title: job.title,
      company: job.company
    },
    analysis: gapAnalysis,
    learningResources,
    learningPath,
    analyzedAt: new Date()
  };

  const { response, statusCode } = successResponse("Skill gap analysis completed", result);
  return sendResponse(res, response, statusCode);
});

/**
 * Get skill trends across all user's jobs
 * GET /api/skill-gaps/trends
 */
export const getSkillTrends = asyncHandler(async (req, res) => {
  const sub = req.auth?.payload?.sub || req.auth?.userId;

  // Get user profile
  const user = await User.findOne({ auth0Id: sub });
  if (!user) {
    const { response, statusCode } = errorResponse("User not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  // Get all user's jobs
  const jobs = await Job.find({ userId: sub });

  if (jobs.length === 0) {
    const { response, statusCode } = successResponse("No jobs to analyze", {
      totalJobsAnalyzed: 0,
      trending: [],
      criticalGaps: [],
      recommendations: []
    });
    return sendResponse(res, response, statusCode);
  }

  // Analyze trends
  const trends = analyzeSkillTrends(jobs, user.skills || []);

  const { response, statusCode } = successResponse("Skill trends analyzed", trends);
  return sendResponse(res, response, statusCode);
});

/**
 * Start tracking a skill development
 * POST /api/skill-gaps/track
 */
export const startSkillTracking = asyncHandler(async (req, res) => {
  const sub = req.auth?.payload?.sub || req.auth?.userId;
  const { skillName, targetLevel, targetDate, resources } = req.body;

  // Validate required fields
  if (!skillName || !targetLevel) {
    const { response, statusCode } = errorResponse(
      "Skill name and target level are required",
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
    return sendResponse(res, response, statusCode);
  }

  const user = await User.findOne({ auth0Id: sub });
  if (!user) {
    const { response, statusCode } = errorResponse("User not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  // Check if already tracking this skill
  const existingIndex = user.skillDevelopment?.findIndex(
    sd => sd.skillName.toLowerCase() === skillName.toLowerCase()
  );

  const trackingData = {
    skillName,
    targetLevel,
    targetDate: targetDate ? new Date(targetDate) : null,
    currentProgress: 0,
    startedAt: new Date(),
    resources: resources || [],
    milestones: []
  };

  if (existingIndex !== undefined && existingIndex >= 0) {
    // Update existing
    user.skillDevelopment[existingIndex] = {
      ...user.skillDevelopment[existingIndex],
      ...trackingData
    };
  } else {
    // Add new
    if (!user.skillDevelopment) {
      user.skillDevelopment = [];
    }
    user.skillDevelopment.push(trackingData);
  }

  await user.save();

  const { response, statusCode } = successResponse(
    "Skill tracking started",
    user.skillDevelopment
  );
  return sendResponse(res, response, statusCode);
});

/**
 * Update skill development progress
 * PUT /api/skill-gaps/track/:skillName
 */
export const updateSkillProgress = asyncHandler(async (req, res) => {
  const sub = req.auth?.payload?.sub || req.auth?.userId;
  const { skillName } = req.params;
  const { currentProgress, completedResources, newMilestone, notes } = req.body;

  const user = await User.findOne({ auth0Id: sub });
  if (!user) {
    const { response, statusCode } = errorResponse("User not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  const skillTracking = user.skillDevelopment?.find(
    sd => sd.skillName.toLowerCase() === skillName.toLowerCase()
  );

  if (!skillTracking) {
    const { response, statusCode } = errorResponse(
      "Skill tracking not found",
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  // Update progress
  if (currentProgress !== undefined) {
    skillTracking.currentProgress = Math.min(100, Math.max(0, currentProgress));
  }

  // Mark resources as completed
  if (completedResources && Array.isArray(completedResources)) {
    completedResources.forEach(resourceUrl => {
      const resource = skillTracking.resources.find(r => r.url === resourceUrl);
      if (resource) {
        resource.completed = true;
        resource.completedAt = new Date();
      }
    });
  }

  // Add new milestone
  if (newMilestone) {
    if (!skillTracking.milestones) {
      skillTracking.milestones = [];
    }
    skillTracking.milestones.push({
      description: newMilestone,
      completed: false
    });
  }

  // Update notes
  if (notes !== undefined) {
    skillTracking.notes = notes;
  }

  // If progress is 100%, potentially add to user's skills
  if (skillTracking.currentProgress === 100) {
    const hasSkill = user.skills?.some(
      s => s.name.toLowerCase() === skillName.toLowerCase()
    );

    if (!hasSkill) {
      if (!user.skills) {
        user.skills = [];
      }
      user.skills.push({
        name: skillName,
        level: skillTracking.targetLevel,
        category: 'Technical' // Default category
      });
    }
  }

  await user.save();

  const { response, statusCode } = successResponse(
    "Skill progress updated",
    skillTracking
  );
  return sendResponse(res, response, statusCode);
});

/**
 * Get all skill development tracking
 * GET /api/skill-gaps/track
 */
export const getSkillTracking = asyncHandler(async (req, res) => {
  const sub = req.auth?.payload?.sub || req.auth?.userId;

  const user = await User.findOne({ auth0Id: sub });
  if (!user) {
    const { response, statusCode } = errorResponse("User not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  const { response, statusCode } = successResponse(
    "Skill tracking retrieved",
    user.skillDevelopment || []
  );
  return sendResponse(res, response, statusCode);
});

/**
 * Delete skill tracking
 * DELETE /api/skill-gaps/track/:skillName
 */
export const deleteSkillTracking = asyncHandler(async (req, res) => {
  const sub = req.auth?.payload?.sub || req.auth?.userId;
  const { skillName } = req.params;

  const user = await User.findOne({ auth0Id: sub });
  if (!user) {
    const { response, statusCode } = errorResponse("User not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  if (!user.skillDevelopment) {
    const { response, statusCode } = errorResponse(
      "No skill tracking found",
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  user.skillDevelopment = user.skillDevelopment.filter(
    sd => sd.skillName.toLowerCase() !== skillName.toLowerCase()
  );

  await user.save();

  const { response, statusCode } = successResponse("Skill tracking deleted");
  return sendResponse(res, response, statusCode);
});

/**
 * Compare skills across multiple jobs
 * POST /api/skill-gaps/compare
 */
export const compareJobsSkills = asyncHandler(async (req, res) => {
  const sub = req.auth?.payload?.sub || req.auth?.userId;
  const { jobIds } = req.body;

  if (!jobIds || !Array.isArray(jobIds) || jobIds.length === 0) {
    const { response, statusCode } = errorResponse(
      "Job IDs array is required",
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
    return sendResponse(res, response, statusCode);
  }

  const user = await User.findOne({ auth0Id: sub });
  if (!user) {
    const { response, statusCode } = errorResponse("User not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  // Get all specified jobs
  const jobs = await Job.find({ _id: { $in: jobIds }, userId: sub });

  if (jobs.length === 0) {
    const { response, statusCode } = errorResponse("No jobs found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  // Analyze each job
  const comparisons = jobs.map(job => {
    const jobSkills = extractJobSkills(job);
    const analysis = analyzeSkillGap(user.skills || [], jobSkills);

    return {
      job: {
        id: job._id,
        title: job.title,
        company: job.company
      },
      matchPercentage: analysis.matchPercentage,
      summary: analysis.summary
    };
  });

  // Sort by match percentage
  comparisons.sort((a, b) => b.matchPercentage - a.matchPercentage);

  const { response, statusCode } = successResponse("Jobs compared", {
    comparisons,
    bestMatch: comparisons[0],
    averageMatch: Math.round(
      comparisons.reduce((sum, c) => sum + c.matchPercentage, 0) / comparisons.length
    )
  });
  return sendResponse(res, response, statusCode);
});
