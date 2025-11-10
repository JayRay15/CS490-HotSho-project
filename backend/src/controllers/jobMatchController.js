import { User } from "../models/User.js";
import { Job } from "../models/Job.js";
import { JobMatch } from "../models/JobMatch.js";
import { successResponse, errorResponse, sendResponse, ERROR_CODES } from "../utils/responseFormat.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { calculateJobMatch, compareJobMatches } from "../utils/jobMatchingService.js";

/**
 * UC-063: Calculate match score for a specific job
 * POST /api/job-matches/calculate/:jobId
 */
export const calculateMatch = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { jobId } = req.params;
  const { customWeights } = req.body || {};

  // Get user profile
  const user = await User.findOne({ auth0Id: userId }).lean();
  if (!user) {
    const { response, statusCode } = errorResponse("User not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  // Get job details
  const job = await Job.findOne({ _id: jobId, userId }).lean();
  if (!job) {
    const { response, statusCode } = errorResponse("Job not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  // Calculate match
  const matchAnalysis = await calculateJobMatch(job, user, customWeights);

  // Save or update match record
  const existingMatch = await JobMatch.findOne({ userId, jobId });

  let savedMatch;
  if (existingMatch) {
    // Update existing match
    Object.assign(existingMatch, {
      overallScore: matchAnalysis.overallScore,
      categoryScores: matchAnalysis.categoryScores,
      strengths: matchAnalysis.strengths,
      gaps: matchAnalysis.gaps,
      suggestions: matchAnalysis.suggestions,
      customWeights: matchAnalysis.customWeights,
      metadata: matchAnalysis.metadata,
    });
    savedMatch = await existingMatch.save();
  } else {
    // Create new match record
    savedMatch = await JobMatch.create({
      userId,
      jobId,
      ...matchAnalysis,
    });
  }

  const { response, statusCode } = successResponse("Match score calculated", savedMatch);
  return sendResponse(res, response, statusCode);
});

/**
 * UC-063: Get match score for a specific job
 * GET /api/job-matches/:jobId
 */
export const getJobMatch = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { jobId } = req.params;

  const match = await JobMatch.findOne({ userId, jobId });

  if (!match) {
    const { response, statusCode } = errorResponse(
      "Match not found. Calculate match first.",
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  const { response, statusCode } = successResponse("Match retrieved", match);
  return sendResponse(res, response, statusCode);
});

/**
 * UC-063: Get all job matches for user
 * GET /api/job-matches
 */
export const getAllMatches = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { sortBy = 'overallScore', order = 'desc', minScore, maxScore } = req.query;

  // Build query
  const query = { userId };
  if (minScore || maxScore) {
    query.overallScore = {};
    if (minScore) query.overallScore.$gte = parseInt(minScore);
    if (maxScore) query.overallScore.$lte = parseInt(maxScore);
  }

  // Build sort
  const sortOrder = order === 'asc' ? 1 : -1;
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder;

  const matches = await JobMatch.find(query).sort(sortOptions).lean();

  // Populate with job details
  const jobIds = matches.map(m => m.jobId);
  const jobs = await Job.find({ _id: { $in: jobIds } }).lean();
  const jobMap = {};
  jobs.forEach(job => {
    jobMap[job._id.toString()] = job;
  });

  // Enhance matches with job details
  const enhancedMatches = matches.map(match => ({
    ...match,
    job: jobMap[match.jobId.toString()],
  }));

  const { response, statusCode } = successResponse("Matches retrieved", {
    matches: enhancedMatches,
    total: matches.length,
  });
  return sendResponse(res, response, statusCode);
});

/**
 * UC-063: Compare matches across multiple jobs
 * POST /api/job-matches/compare
 */
export const compareMatches = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { jobIds } = req.body || {};

  if (!jobIds || !Array.isArray(jobIds) || jobIds.length === 0) {
    const { response, statusCode } = errorResponse(
      "Job IDs array is required",
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
    return sendResponse(res, response, statusCode);
  }

  // Get matches for specified jobs
  const matches = await JobMatch.find({
    userId,
    jobId: { $in: jobIds },
  }).lean();

  // If some jobs don't have matches, calculate them
  const matchedJobIds = matches.map(m => m.jobId.toString());
  const unmatchedJobIds = jobIds.filter(id => !matchedJobIds.includes(id));

  if (unmatchedJobIds.length > 0) {
    // Get user profile
    const user = await User.findOne({ auth0Id: userId }).lean();
    if (!user) {
      const { response, statusCode } = errorResponse("User not found", 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }

    // Get unmatched jobs
    const unmatchedJobs = await Job.find({
      _id: { $in: unmatchedJobIds },
      userId,
    }).lean();

    // Calculate matches for unmatched jobs
    for (const job of unmatchedJobs) {
      const matchAnalysis = await calculateJobMatch(job, user);
      const newMatch = await JobMatch.create({
        userId,
        jobId: job._id,
        ...matchAnalysis,
      });
      matches.push(newMatch);
    }
  }

  // Perform comparison
  const comparison = compareJobMatches(matches);

  const { response, statusCode } = successResponse("Jobs compared", comparison);
  return sendResponse(res, response, statusCode);
});

/**
 * UC-063: Update custom weights for matching criteria
 * PUT /api/job-matches/:jobId/weights
 */
export const updateMatchWeights = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { jobId } = req.params;
  const { skills, experience, education, additional } = req.body || {};

  // Validate weights
  const weights = { skills, experience, education, additional };
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + (w || 0), 0);

  if (totalWeight !== 100) {
    const { response, statusCode } = errorResponse(
      "Weights must sum to 100",
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
    return sendResponse(res, response, statusCode);
  }

  // Get existing match
  const match = await JobMatch.findOne({ userId, jobId });
  if (!match) {
    const { response, statusCode } = errorResponse(
      "Match not found. Calculate match first.",
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  // Update weights and recalculate overall score
  match.customWeights = weights;
  match.categoryScores.skills.weight = skills;
  match.categoryScores.experience.weight = experience;
  match.categoryScores.education.weight = education;
  match.categoryScores.additional.weight = additional;
  match.recalculateOverallScore();

  await match.save();

  const { response, statusCode } = successResponse("Weights updated", match);
  return sendResponse(res, response, statusCode);
});

/**
 * UC-063: Get match history and trends for a job
 * GET /api/job-matches/:jobId/history
 */
export const getMatchHistory = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { jobId } = req.params;

  // Get all historical matches for this job
  const matches = await JobMatch.find({ userId, jobId })
    .sort({ createdAt: 1 })
    .lean();

  if (matches.length === 0) {
    const { response, statusCode } = errorResponse(
      "No match history found",
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  // Calculate trend
  const trend = matches.length > 1
    ? matches[matches.length - 1].overallScore - matches[0].overallScore
    : 0;

  const history = {
    matches,
    trend: {
      direction: trend > 0 ? 'improving' : trend < 0 ? 'declining' : 'stable',
      change: Math.abs(trend),
      firstScore: matches[0].overallScore,
      latestScore: matches[matches.length - 1].overallScore,
    },
    timeline: matches.map(m => ({
      date: m.createdAt,
      score: m.overallScore,
      skills: m.categoryScores.skills.score,
      experience: m.categoryScores.experience.score,
      education: m.categoryScores.education.score,
      additional: m.categoryScores.additional.score,
    })),
  };

  const { response, statusCode } = successResponse("Match history retrieved", history);
  return sendResponse(res, response, statusCode);
});

/**
 * UC-063: Get match trends across all jobs
 * GET /api/job-matches/trends
 */
export const getMatchTrends = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;

  // Get all matches for user
  const matches = await JobMatch.find({ userId })
    .sort({ createdAt: -1 })
    .lean();

  if (matches.length === 0) {
    const { response, statusCode } = successResponse("No matches found", {
      averageScore: 0,
      trends: [],
      categoryAverages: {},
    });
    return sendResponse(res, response, statusCode);
  }

  // Calculate averages
  const averageScore = Math.round(
    matches.reduce((sum, m) => sum + m.overallScore, 0) / matches.length
  );

  const categoryAverages = {
    skills: Math.round(
      matches.reduce((sum, m) => sum + m.categoryScores.skills.score, 0) / matches.length
    ),
    experience: Math.round(
      matches.reduce((sum, m) => sum + m.categoryScores.experience.score, 0) / matches.length
    ),
    education: Math.round(
      matches.reduce((sum, m) => sum + m.categoryScores.education.score, 0) / matches.length
    ),
    additional: Math.round(
      matches.reduce((sum, m) => sum + m.categoryScores.additional.score, 0) / matches.length
    ),
  };

  // Group by month for trend analysis
  const monthlyTrends = {};
  matches.forEach(match => {
    const month = new Date(match.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
    });
    if (!monthlyTrends[month]) {
      monthlyTrends[month] = { scores: [], count: 0 };
    }
    monthlyTrends[month].scores.push(match.overallScore);
    monthlyTrends[month].count++;
  });

  const trends = Object.entries(monthlyTrends).map(([month, data]) => ({
    month,
    averageScore: Math.round(data.scores.reduce((sum, s) => sum + s, 0) / data.count),
    count: data.count,
  }));

  // Find weakest category
  const weakestCategory = Object.entries(categoryAverages).reduce((min, [cat, score]) =>
    score < min.score ? { category: cat, score } : min
  , { category: 'skills', score: categoryAverages.skills });

  const { response, statusCode } = successResponse("Match trends retrieved", {
    averageScore,
    categoryAverages,
    weakestCategory,
    trends,
    totalMatches: matches.length,
    scoreDistribution: {
      excellent: matches.filter(m => m.overallScore >= 85).length,
      good: matches.filter(m => m.overallScore >= 70 && m.overallScore < 85).length,
      fair: matches.filter(m => m.overallScore >= 55 && m.overallScore < 70).length,
      poor: matches.filter(m => m.overallScore < 55).length,
    },
  });
  return sendResponse(res, response, statusCode);
});

/**
 * UC-063: Export match analysis report
 * GET /api/job-matches/:jobId/export
 */
export const exportMatchReport = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { jobId } = req.params;
  const { format = 'json' } = req.query;

  const match = await JobMatch.findOne({ userId, jobId }).lean();
  if (!match) {
    const { response, statusCode } = errorResponse(
      "Match not found",
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  // Get job details
  const job = await Job.findById(jobId).lean();

  if (format === 'text') {
    // Generate plain text report
    let report = `JOB MATCH ANALYSIS REPORT\n`;
    report += `${'='.repeat(50)}\n\n`;
    report += `Job: ${job.title} at ${job.company}\n`;
    report += `Generated: ${new Date().toLocaleDateString()}\n\n`;
    report += `OVERALL MATCH SCORE: ${match.overallScore}% (${match.matchGrade})\n\n`;
    
    report += `CATEGORY BREAKDOWN:\n`;
    report += `- Skills: ${match.categoryScores.skills.score}%\n`;
    report += `- Experience: ${match.categoryScores.experience.score}%\n`;
    report += `- Education: ${match.categoryScores.education.score}%\n`;
    report += `- Additional: ${match.categoryScores.additional.score}%\n\n`;
    
    if (match.strengths.length > 0) {
      report += `STRENGTHS:\n`;
      match.strengths.forEach((s, idx) => {
        report += `${idx + 1}. ${s.description} (${s.impact} impact)\n`;
      });
      report += `\n`;
    }
    
    if (match.gaps.length > 0) {
      report += `GAPS TO ADDRESS:\n`;
      match.gaps.forEach((g, idx) => {
        report += `${idx + 1}. [${g.severity.toUpperCase()}] ${g.description}\n`;
        report += `   Suggestion: ${g.suggestion}\n`;
      });
      report += `\n`;
    }
    
    if (match.suggestions.length > 0) {
      report += `IMPROVEMENT SUGGESTIONS:\n`;
      match.suggestions.slice(0, 5).forEach((s, idx) => {
        report += `${idx + 1}. [${s.priority.toUpperCase()}] ${s.title}\n`;
        report += `   ${s.description}\n`;
        report += `   Impact: +${s.estimatedImpact} points\n`;
      });
    }

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="match-report-${jobId}.txt"`);
    return res.send(report);
  }

  // Default: JSON format
  const report = {
    job: {
      id: job._id,
      title: job.title,
      company: job.company,
      industry: job.industry,
      location: job.location,
    },
    match,
    generatedAt: new Date(),
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="match-report-${jobId}.json"`);
  return res.json(report);
});

/**
 * UC-063: Delete a match record
 * DELETE /api/job-matches/:jobId
 */
export const deleteMatch = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { jobId } = req.params;

  const match = await JobMatch.findOneAndDelete({ userId, jobId });

  if (!match) {
    const { response, statusCode } = errorResponse(
      "Match not found",
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  const { response, statusCode } = successResponse("Match deleted");
  return sendResponse(res, response, statusCode);
});

/**
 * UC-063: Batch calculate matches for all jobs
 * POST /api/job-matches/calculate-all
 */
export const calculateAllMatches = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;

  // Get user profile
  const user = await User.findOne({ auth0Id: userId }).lean();
  if (!user) {
    const { response, statusCode } = errorResponse("User not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  // Get all user's jobs
  const jobs = await Job.find({ userId, archived: false }).lean();

  if (jobs.length === 0) {
    const { response, statusCode } = successResponse("No jobs to analyze", {
      calculatedMatches: 0,
    });
    return sendResponse(res, response, statusCode);
  }

  const results = [];

  // Calculate match for each job
  for (const job of jobs) {
    const matchAnalysis = await calculateJobMatch(job, user);

    // Save or update match record
    const existingMatch = await JobMatch.findOne({ userId, jobId: job._id });

    if (existingMatch) {
      Object.assign(existingMatch, {
        overallScore: matchAnalysis.overallScore,
        categoryScores: matchAnalysis.categoryScores,
        strengths: matchAnalysis.strengths,
        gaps: matchAnalysis.gaps,
        suggestions: matchAnalysis.suggestions,
        metadata: matchAnalysis.metadata,
      });
      await existingMatch.save();
      results.push(existingMatch);
    } else {
      const newMatch = await JobMatch.create({
        userId,
        jobId: job._id,
        ...matchAnalysis,
      });
      results.push(newMatch);
    }
  }

  // Sort by score
  results.sort((a, b) => b.overallScore - a.overallScore);

  const { response, statusCode } = successResponse("All matches calculated", {
    calculatedMatches: results.length,
    topMatch: results[0] ? {
      jobId: results[0].jobId,
      score: results[0].overallScore,
      job: `${results[0].metadata.jobTitle} at ${results[0].metadata.company}`,
    } : null,
    averageScore: Math.round(
      results.reduce((sum, r) => sum + r.overallScore, 0) / results.length
    ),
  });
  return sendResponse(res, response, statusCode);
});
