import { Job } from "../models/Job.js";
import { Resume } from "../models/Resume.js";
import { CoverLetter } from "../models/CoverLetter.js";
import { Interview } from "../models/Interview.js";
import { successResponse, errorResponse, sendResponse, ERROR_CODES } from "../utils/responseFormat.js";
import { asyncHandler } from "../middleware/errorHandler.js";

// ============================================================================
// UC-097: Application Success Rate Analysis
// ============================================================================

// Statistical significance helper functions
function calculateZScore(successes, total, baseline) {
  if (total === 0) return 0;
  const p = successes / total;
  const se = Math.sqrt((baseline * (1 - baseline)) / total);
  if (se === 0) return 0;
  return (p - baseline) / se;
}

function getStatisticalSignificance(zScore) {
  const absZ = Math.abs(zScore);
  if (absZ >= 2.576) return { level: "high", confidence: 99, significant: true };
  if (absZ >= 1.96) return { level: "medium", confidence: 95, significant: true };
  if (absZ >= 1.645) return { level: "low", confidence: 90, significant: true };
  return { level: "none", confidence: 0, significant: false };
}

function calculateChiSquare(observed, expected) {
  if (expected === 0) return 0;
  return Math.pow(observed - expected, 2) / expected;
}

function calculateCorrelation(xValues, yValues) {
  const n = xValues.length;
  if (n < 3) return { correlation: 0, strength: "insufficient_data" };

  const sumX = xValues.reduce((a, b) => a + b, 0);
  const sumY = yValues.reduce((a, b) => a + b, 0);
  const sumXY = xValues.reduce((total, x, i) => total + x * yValues[i], 0);
  const sumX2 = xValues.reduce((total, x) => total + x * x, 0);
  const sumY2 = yValues.reduce((total, y) => total + y * y, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (denominator === 0) return { correlation: 0, strength: "no_variance" };

  const r = numerator / denominator;
  let strength = "none";
  const absR = Math.abs(r);
  if (absR >= 0.7) strength = "strong";
  else if (absR >= 0.4) strength = "moderate";
  else if (absR >= 0.2) strength = "weak";

  return { correlation: parseFloat(r.toFixed(3)), strength };
}

/**
 * GET /api/application-success/analysis
 * Comprehensive application success analysis
 */
export const getSuccessAnalysis = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  // Fetch all jobs for user
  const allJobs = await Job.find({ userId }).sort({ createdAt: -1 });
  const resumes = await Resume.find({ userId });
  const coverLetters = await CoverLetter.find({ userId });
  const interviews = await Interview.find({ userId });

  if (allJobs.length === 0) {
    const { response, statusCode } = successResponse("No applications to analyze", {
      hasData: false,
      message: "Start tracking applications to see success analysis",
    });
    return sendResponse(res, response, statusCode);
  }

  // Define success outcomes
  const successStatuses = ["Interview", "Phone Screen", "Offer", "Accepted"];
  const successfulJobs = allJobs.filter(j => successStatuses.includes(j.status));
  const rejectedJobs = allJobs.filter(j => j.status === "Rejected");
  const overallSuccessRate = allJobs.length > 0 ? (successfulJobs.length / allJobs.length) * 100 : 0;

  // ========== 1. SUCCESS RATES BY INDUSTRY ==========
  const industryAnalysis = analyzeByIndustry(allJobs, successStatuses, overallSuccessRate);

  // ========== 2. SUCCESS RATES BY COMPANY SIZE ==========
  const companySizeAnalysis = analyzeByCompanySize(allJobs, successStatuses, overallSuccessRate);

  // ========== 3. SUCCESS RATES BY ROLE TYPE ==========
  const roleTypeAnalysis = analyzeByRoleType(allJobs, successStatuses, overallSuccessRate);

  // ========== 4. APPLICATION METHOD ANALYSIS ==========
  const methodAnalysis = analyzeByMethod(allJobs, successStatuses, overallSuccessRate);

  // ========== 5. SUCCESSFUL VS REJECTED PATTERN ANALYSIS ==========
  const patternAnalysis = analyzePatterns(successfulJobs, rejectedJobs, allJobs);

  // ========== 6. MATERIALS CORRELATION ANALYSIS ==========
  const materialsAnalysis = analyzeMaterialsImpact(allJobs, resumes, coverLetters, successStatuses);

  // ========== 7. TIMING ANALYSIS ==========
  const timingAnalysis = analyzeTimingPatterns(allJobs, successStatuses);

  // ========== 8. GENERATE RECOMMENDATIONS ==========
  const recommendations = generateRecommendations(
    industryAnalysis,
    companySizeAnalysis,
    roleTypeAnalysis,
    methodAnalysis,
    patternAnalysis,
    materialsAnalysis,
    timingAnalysis,
    overallSuccessRate
  );

  // ========== 9. SUMMARY STATISTICS ==========
  const summary = {
    totalApplications: allJobs.length,
    successfulApplications: successfulJobs.length,
    rejectedApplications: rejectedJobs.length,
    pendingApplications: allJobs.filter(j => ["Applied", "Interested"].includes(j.status)).length,
    overallSuccessRate: parseFloat(overallSuccessRate.toFixed(1)),
    interviewRate: parseFloat(((allJobs.filter(j => ["Interview", "Phone Screen"].includes(j.status)).length / allJobs.length) * 100).toFixed(1)),
    offerRate: parseFloat(((allJobs.filter(j => ["Offer", "Accepted"].includes(j.status)).length / allJobs.length) * 100).toFixed(1)),
  };

  const { response, statusCode } = successResponse("Application success analysis retrieved", {
    hasData: true,
    summary,
    industryAnalysis,
    companySizeAnalysis,
    roleTypeAnalysis,
    methodAnalysis,
    patternAnalysis,
    materialsAnalysis,
    timingAnalysis,
    recommendations,
  });
  return sendResponse(res, response, statusCode);
});

/**
 * GET /api/application-success/patterns
 * Identify success patterns and correlations
 */
export const getSuccessPatterns = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const allJobs = await Job.find({ userId }).sort({ createdAt: -1 });
  const successStatuses = ["Interview", "Phone Screen", "Offer", "Accepted"];
  const successfulJobs = allJobs.filter(j => successStatuses.includes(j.status));

  if (allJobs.length < 5) {
    const { response, statusCode } = successResponse("Not enough data for pattern analysis", {
      hasData: false,
      message: "Need at least 5 applications to identify patterns",
      minimumRequired: 5,
      currentCount: allJobs.length,
    });
    return sendResponse(res, response, statusCode);
  }

  // Identify key success patterns
  const patterns = identifySuccessPatterns(allJobs, successfulJobs);

  const { response, statusCode } = successResponse("Success patterns identified", {
    hasData: true,
    patterns,
    sampleSize: allJobs.length,
    successCount: successfulJobs.length,
  });
  return sendResponse(res, response, statusCode);
});

/**
 * GET /api/application-success/recommendations
 * Get personalized optimization recommendations
 */
export const getOptimizationRecommendations = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const allJobs = await Job.find({ userId }).sort({ createdAt: -1 });
  const resumes = await Resume.find({ userId });
  const coverLetters = await CoverLetter.find({ userId });

  if (allJobs.length < 3) {
    const { response, statusCode } = successResponse("Not enough data for recommendations", {
      hasData: false,
      message: "Need at least 3 applications for personalized recommendations",
      generalTips: [
        "Track all your applications to build a data-driven strategy",
        "Customize your resume for each application",
        "Write tailored cover letters highlighting relevant experience",
        "Apply to jobs that match at least 60% of your skills",
        "Follow up on applications after 1-2 weeks",
      ],
    });
    return sendResponse(res, response, statusCode);
  }

  const successStatuses = ["Interview", "Phone Screen", "Offer", "Accepted"];
  const successfulJobs = allJobs.filter(j => successStatuses.includes(j.status));
  const rejectedJobs = allJobs.filter(j => j.status === "Rejected");
  const overallSuccessRate = (successfulJobs.length / allJobs.length) * 100;

  // Generate comprehensive recommendations
  const recommendations = generateDetailedRecommendations(
    allJobs,
    successfulJobs,
    rejectedJobs,
    resumes,
    coverLetters,
    overallSuccessRate
  );

  const { response, statusCode } = successResponse("Optimization recommendations generated", {
    hasData: true,
    recommendations,
    dataBasedOn: {
      totalApplications: allJobs.length,
      successfulApplications: successfulJobs.length,
      currentSuccessRate: parseFloat(overallSuccessRate.toFixed(1)),
    },
  });
  return sendResponse(res, response, statusCode);
});

/**
 * GET /api/application-success/timing
 * Analyze timing patterns for optimal submission
 */
export const getTimingAnalysis = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const allJobs = await Job.find({ userId }).sort({ createdAt: -1 });
  const successStatuses = ["Interview", "Phone Screen", "Offer", "Accepted"];

  if (allJobs.length < 5) {
    const { response, statusCode } = successResponse("Not enough data for timing analysis", {
      hasData: false,
      message: "Need at least 5 applications for timing analysis",
    });
    return sendResponse(res, response, statusCode);
  }

  const timingAnalysis = analyzeTimingPatterns(allJobs, successStatuses);
  const optimalTimes = identifyOptimalTiming(allJobs, successStatuses);

  const { response, statusCode } = successResponse("Timing analysis retrieved", {
    hasData: true,
    timingAnalysis,
    optimalTimes,
    sampleSize: allJobs.length,
  });
  return sendResponse(res, response, statusCode);
});

/**
 * GET /api/application-success/materials-impact
 * Analyze impact of resume and cover letter customization
 */
export const getMaterialsImpact = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const allJobs = await Job.find({ userId }).sort({ createdAt: -1 });
  const resumes = await Resume.find({ userId });
  const coverLetters = await CoverLetter.find({ userId });
  const successStatuses = ["Interview", "Phone Screen", "Offer", "Accepted"];

  const materialsAnalysis = analyzeMaterialsImpact(allJobs, resumes, coverLetters, successStatuses);

  const { response, statusCode } = successResponse("Materials impact analysis retrieved", {
    hasData: true,
    materialsAnalysis,
    resumeCount: resumes.length,
    coverLetterCount: coverLetters.length,
  });
  return sendResponse(res, response, statusCode);
});

// ============================================================================
// UC-105: Success Pattern Recognition API Handlers
// ============================================================================

/**
 * GET /api/application-success/prediction
 * Get success prediction for a potential application
 */
export const getSuccessPrediction = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const { industry, companySize, roleType } = req.query;
  const allJobs = await Job.find({ userId }).sort({ createdAt: -1 });
  const successStatuses = ["Interview", "Phone Screen", "Offer", "Accepted"];
  const successfulJobs = allJobs.filter(j => successStatuses.includes(j.status));

  if (allJobs.length < 5) {
    const { response, statusCode } = successResponse("Not enough data for prediction", {
      hasData: false,
      message: "Need at least 5 applications for predictive modeling",
      minimumRequired: 5,
      currentCount: allJobs.length,
    });
    return sendResponse(res, response, statusCode);
  }

  // Build historical patterns
  const historicalPatterns = buildHistoricalPatterns(allJobs, successfulJobs);

  // Generate prediction
  const prediction = generateSuccessPrediction(
    { industry, companySize, roleType },
    { ...historicalPatterns, sampleSize: allJobs.length }
  );

  const { response, statusCode } = successResponse("Success prediction generated", {
    hasData: true,
    prediction,
    basedOn: {
      totalApplications: allJobs.length,
      successfulApplications: successfulJobs.length,
      overallSuccessRate: parseFloat(((successfulJobs.length / allJobs.length) * 100).toFixed(1)),
    }
  });
  return sendResponse(res, response, statusCode);
});

/**
 * GET /api/application-success/evolution
 * Track pattern evolution over time
 */
export const getPatternEvolution = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const allJobs = await Job.find({ userId }).sort({ createdAt: -1 });

  if (allJobs.length < 10) {
    const { response, statusCode } = successResponse("Not enough data for evolution analysis", {
      hasData: false,
      message: "Need at least 10 applications to track pattern evolution",
      minimumRequired: 10,
      currentCount: allJobs.length,
    });
    return sendResponse(res, response, statusCode);
  }

  const evolution = analyzePatternEvolution(allJobs);

  const { response, statusCode } = successResponse("Pattern evolution analyzed", {
    hasData: true,
    evolution,
    totalApplications: allJobs.length,
  });
  return sendResponse(res, response, statusCode);
});

/**
 * Build historical patterns for prediction model
 */
function buildHistoricalPatterns(allJobs, successfulJobs) {
  const patterns = {};

  // Industry success rates
  const industryStats = {};
  allJobs.forEach(job => {
    const industry = job.industry || "Unknown";
    if (!industryStats[industry]) industryStats[industry] = { total: 0, success: 0 };
    industryStats[industry].total++;
    if (successfulJobs.find(s => s._id.equals(job._id))) industryStats[industry].success++;
  });

  patterns.topIndustries = Object.entries(industryStats)
    .filter(([_, stats]) => stats.total >= 2)
    .map(([industry, stats]) => ({
      industry,
      successRate: ((stats.success / stats.total) * 100).toFixed(1),
      count: stats.total
    }))
    .sort((a, b) => parseFloat(b.successRate) - parseFloat(a.successRate))
    .slice(0, 5);

  // Company size success rates
  const sizeStats = {};
  allJobs.forEach(job => {
    const size = job.companyInfo?.size || "Unknown";
    if (!sizeStats[size]) sizeStats[size] = { total: 0, success: 0 };
    sizeStats[size].total++;
    if (successfulJobs.find(s => s._id.equals(job._id))) sizeStats[size].success++;
  });

  patterns.bestCompanySize = Object.entries(sizeStats)
    .filter(([_, stats]) => stats.total >= 2)
    .map(([size, stats]) => ({
      size,
      successRate: ((stats.success / stats.total) * 100).toFixed(1),
      count: stats.total
    }))
    .sort((a, b) => parseFloat(b.successRate) - parseFloat(a.successRate))[0];

  // Best days for application
  const dayStats = {};
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  allJobs.forEach(job => {
    const day = days[new Date(job.createdAt).getDay()];
    if (!dayStats[day]) dayStats[day] = { total: 0, success: 0 };
    dayStats[day].total++;
    if (successfulJobs.find(s => s._id.equals(job._id))) dayStats[day].success++;
  });

  patterns.bestDays = Object.entries(dayStats)
    .filter(([_, stats]) => stats.total >= 2)
    .map(([day, stats]) => ({
      day,
      successRate: ((stats.success / stats.total) * 100).toFixed(1),
      count: stats.total
    }))
    .sort((a, b) => parseFloat(b.successRate) - parseFloat(a.successRate))
    .slice(0, 3);

  // Role type success rates
  const roleStats = {};
  allJobs.forEach(job => {
    const role = job.type || "Unknown";
    if (!roleStats[role]) roleStats[role] = { total: 0, success: 0 };
    roleStats[role].total++;
    if (successfulJobs.find(s => s._id.equals(job._id))) roleStats[role].success++;
  });

  patterns.bestRoleTypes = Object.entries(roleStats)
    .filter(([_, stats]) => stats.total >= 2)
    .map(([roleType, stats]) => ({
      roleType,
      successRate: ((stats.success / stats.total) * 100).toFixed(1),
      count: stats.total
    }))
    .sort((a, b) => parseFloat(b.successRate) - parseFloat(a.successRate))
    .slice(0, 5);

  return patterns;
}

// ============================================================================
// Helper Functions
// ============================================================================

function analyzeByIndustry(jobs, successStatuses, baselineRate) {
  const industryStats = {};

  jobs.forEach(job => {
    const industry = job.industry || "Unknown";
    if (!industryStats[industry]) {
      industryStats[industry] = { total: 0, successful: 0 };
    }
    industryStats[industry].total++;
    if (successStatuses.includes(job.status)) {
      industryStats[industry].successful++;
    }
  });

  const analysis = Object.entries(industryStats)
    .map(([industry, stats]) => {
      const successRate = stats.total > 0 ? (stats.successful / stats.total) * 100 : 0;
      const zScore = calculateZScore(stats.successful, stats.total, baselineRate / 100);
      const significance = getStatisticalSignificance(zScore);

      return {
        industry,
        total: stats.total,
        successful: stats.successful,
        successRate: parseFloat(successRate.toFixed(1)),
        vsAverage: parseFloat((successRate - baselineRate).toFixed(1)),
        statisticalSignificance: significance,
        recommendation: successRate > baselineRate + 10 ? "focus" : successRate < baselineRate - 10 ? "reconsider" : "maintain",
      };
    })
    .sort((a, b) => b.successRate - a.successRate);

  return {
    byIndustry: analysis,
    topPerforming: analysis.filter(a => a.successRate > baselineRate),
    needsImprovement: analysis.filter(a => a.successRate < baselineRate && a.total >= 3),
  };
}

function analyzeByCompanySize(jobs, successStatuses, baselineRate) {
  const sizeStats = {};
  const sizeOrder = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5001-10000", "10000+"];

  jobs.forEach(job => {
    const size = job.companyInfo?.size || "Unknown";
    if (!sizeStats[size]) {
      sizeStats[size] = { total: 0, successful: 0 };
    }
    sizeStats[size].total++;
    if (successStatuses.includes(job.status)) {
      sizeStats[size].successful++;
    }
  });

  const analysis = Object.entries(sizeStats)
    .map(([size, stats]) => {
      const successRate = stats.total > 0 ? (stats.successful / stats.total) * 100 : 0;
      const zScore = calculateZScore(stats.successful, stats.total, baselineRate / 100);
      const significance = getStatisticalSignificance(zScore);

      return {
        companySize: size,
        total: stats.total,
        successful: stats.successful,
        successRate: parseFloat(successRate.toFixed(1)),
        vsAverage: parseFloat((successRate - baselineRate).toFixed(1)),
        statisticalSignificance: significance,
        sizeCategory: size === "Unknown" ? "unknown" :
          ["1-10", "11-50"].includes(size) ? "startup" :
            ["51-200", "201-500"].includes(size) ? "mid-size" : "enterprise",
      };
    })
    .sort((a, b) => {
      const aIdx = sizeOrder.indexOf(a.companySize);
      const bIdx = sizeOrder.indexOf(b.companySize);
      return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
    });

  return {
    bySize: analysis,
    bestPerforming: analysis.reduce((best, curr) =>
      curr.total >= 3 && curr.successRate > (best?.successRate || 0) ? curr : best, null),
  };
}

function analyzeByRoleType(jobs, successStatuses, baselineRate) {
  const roleStats = {};

  jobs.forEach(job => {
    const roleType = job.jobType || "Unknown";
    if (!roleStats[roleType]) {
      roleStats[roleType] = { total: 0, successful: 0 };
    }
    roleStats[roleType].total++;
    if (successStatuses.includes(job.status)) {
      roleStats[roleType].successful++;
    }
  });

  const analysis = Object.entries(roleStats)
    .map(([roleType, stats]) => {
      const successRate = stats.total > 0 ? (stats.successful / stats.total) * 100 : 0;
      const zScore = calculateZScore(stats.successful, stats.total, baselineRate / 100);
      const significance = getStatisticalSignificance(zScore);

      return {
        roleType,
        total: stats.total,
        successful: stats.successful,
        successRate: parseFloat(successRate.toFixed(1)),
        vsAverage: parseFloat((successRate - baselineRate).toFixed(1)),
        statisticalSignificance: significance,
      };
    })
    .sort((a, b) => b.successRate - a.successRate);

  return {
    byRoleType: analysis,
    bestPerforming: analysis[0] || null,
  };
}

function analyzeByMethod(jobs, successStatuses, baselineRate) {
  // Analyze by work mode as a proxy for application method
  const modeStats = {};

  jobs.forEach(job => {
    const mode = job.workMode || "Unknown";
    if (!modeStats[mode]) {
      modeStats[mode] = { total: 0, successful: 0 };
    }
    modeStats[mode].total++;
    if (successStatuses.includes(job.status)) {
      modeStats[mode].successful++;
    }
  });

  const analysis = Object.entries(modeStats)
    .map(([mode, stats]) => {
      const successRate = stats.total > 0 ? (stats.successful / stats.total) * 100 : 0;
      const zScore = calculateZScore(stats.successful, stats.total, baselineRate / 100);
      const significance = getStatisticalSignificance(zScore);

      return {
        method: mode,
        total: stats.total,
        successful: stats.successful,
        successRate: parseFloat(successRate.toFixed(1)),
        vsAverage: parseFloat((successRate - baselineRate).toFixed(1)),
        statisticalSignificance: significance,
      };
    })
    .sort((a, b) => b.successRate - a.successRate);

  return {
    byMethod: analysis,
    bestMethod: analysis[0] || null,
  };
}

function analyzePatterns(successfulJobs, rejectedJobs, allJobs) {
  const patterns = {
    successfulCharacteristics: {},
    rejectedCharacteristics: {},
    keyDifferences: [],
  };

  // Analyze successful jobs
  if (successfulJobs.length > 0) {
    patterns.successfulCharacteristics = {
      avgDaysToResponse: calculateAverageResponseTime(successfulJobs),
      commonIndustries: getTopCategories(successfulJobs, "industry", 3),
      commonWorkModes: getTopCategories(successfulJobs, "workMode", 3),
      commonJobTypes: getTopCategories(successfulJobs, "jobType", 3),
      avgPriority: getAveragePriority(successfulJobs),
      hadCustomMaterials: successfulJobs.filter(j => j.materials?.resume || j.materials?.coverLetter).length / successfulJobs.length,
    };
  }

  // Analyze rejected jobs
  if (rejectedJobs.length > 0) {
    patterns.rejectedCharacteristics = {
      avgDaysToResponse: calculateAverageResponseTime(rejectedJobs),
      commonIndustries: getTopCategories(rejectedJobs, "industry", 3),
      commonWorkModes: getTopCategories(rejectedJobs, "workMode", 3),
      commonJobTypes: getTopCategories(rejectedJobs, "jobType", 3),
      avgPriority: getAveragePriority(rejectedJobs),
      hadCustomMaterials: rejectedJobs.filter(j => j.materials?.resume || j.materials?.coverLetter).length / rejectedJobs.length,
    };
  }

  // Identify key differences
  if (successfulJobs.length >= 3 && rejectedJobs.length >= 3) {
    const successIndustries = new Set(successfulJobs.map(j => j.industry).filter(Boolean));
    const rejectedIndustries = new Set(rejectedJobs.map(j => j.industry).filter(Boolean));

    // Find industries with high success vs high rejection
    const successOnlyIndustries = [...successIndustries].filter(i => !rejectedIndustries.has(i));
    if (successOnlyIndustries.length > 0) {
      patterns.keyDifferences.push({
        factor: "Industry Focus",
        insight: `You have 100% success rate in: ${successOnlyIndustries.join(", ")}`,
        recommendation: "Consider focusing more on these industries",
      });
    }
  }

  return patterns;
}

function analyzeMaterialsImpact(jobs, resumes, coverLetters, successStatuses) {
  const withResume = jobs.filter(j => j.linkedResumeId || j.materials?.resume);
  const withCoverLetter = jobs.filter(j => j.materials?.coverLetter);
  const withBoth = jobs.filter(j => (j.linkedResumeId || j.materials?.resume) && j.materials?.coverLetter);
  const withNeither = jobs.filter(j => !j.linkedResumeId && !j.materials?.resume && !j.materials?.coverLetter);

  const calculateStats = (subset) => {
    const successful = subset.filter(j => successStatuses.includes(j.status)).length;
    return {
      total: subset.length,
      successful,
      successRate: subset.length > 0 ? parseFloat(((successful / subset.length) * 100).toFixed(1)) : 0,
    };
  };

  const overallStats = calculateStats(jobs);
  const resumeStats = calculateStats(withResume);
  const coverLetterStats = calculateStats(withCoverLetter);
  const bothStats = calculateStats(withBoth);
  const neitherStats = calculateStats(withNeither);

  // Calculate correlation between customization and success
  const customizationScores = jobs.map(j => {
    let score = 0;
    if (j.linkedResumeId || j.materials?.resume) score += 1;
    if (j.materials?.coverLetter) score += 1;
    return score;
  });
  const successScores = jobs.map(j => successStatuses.includes(j.status) ? 1 : 0);
  const correlation = calculateCorrelation(customizationScores, successScores);

  // Count customized materials
  const customizedResumes = resumes.filter(r => r.metadata?.tailoredForJob).length;
  const customizedCoverLetters = coverLetters.filter(cl => cl.metadata?.tailoredForJob || cl.jobId).length;

  return {
    overview: {
      totalResumes: resumes.length,
      totalCoverLetters: coverLetters.length,
      customizedResumes,
      customizedCoverLetters,
    },
    impact: {
      withResume: resumeStats,
      withCoverLetter: coverLetterStats,
      withBothMaterials: bothStats,
      withoutMaterials: neitherStats,
      baseline: overallStats,
    },
    customizationCorrelation: correlation,
    recommendation: correlation.correlation > 0.2
      ? "Custom materials significantly improve your success rate"
      : correlation.correlation > 0
        ? "Custom materials have a moderate positive impact"
        : "Consider improving the quality of your application materials",
  };
}

function analyzeTimingPatterns(jobs, successStatuses) {
  const dayOfWeek = { 0: "Sunday", 1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday", 5: "Friday", 6: "Saturday" };
  const dayStats = {};
  const hourStats = {};
  const weekStats = {};

  jobs.forEach(job => {
    const date = new Date(job.createdAt);
    const day = dayOfWeek[date.getDay()];
    const hour = date.getHours();
    const week = getWeekNumber(date);

    // Day of week analysis
    if (!dayStats[day]) dayStats[day] = { total: 0, successful: 0 };
    dayStats[day].total++;
    if (successStatuses.includes(job.status)) dayStats[day].successful++;

    // Hour of day analysis
    const hourRange = hour < 9 ? "Early Morning (before 9am)" :
      hour < 12 ? "Morning (9am-12pm)" :
        hour < 17 ? "Afternoon (12pm-5pm)" :
          hour < 21 ? "Evening (5pm-9pm)" : "Night (after 9pm)";
    if (!hourStats[hourRange]) hourStats[hourRange] = { total: 0, successful: 0 };
    hourStats[hourRange].total++;
    if (successStatuses.includes(job.status)) hourStats[hourRange].successful++;
  });

  const dayAnalysis = Object.entries(dayStats)
    .map(([day, stats]) => ({
      day,
      total: stats.total,
      successful: stats.successful,
      successRate: stats.total > 0 ? parseFloat(((stats.successful / stats.total) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.successRate - a.successRate);

  const hourAnalysis = Object.entries(hourStats)
    .map(([timeRange, stats]) => ({
      timeRange,
      total: stats.total,
      successful: stats.successful,
      successRate: stats.total > 0 ? parseFloat(((stats.successful / stats.total) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.successRate - a.successRate);

  return {
    byDayOfWeek: dayAnalysis,
    byTimeOfDay: hourAnalysis,
    bestDay: dayAnalysis.find(d => d.total >= 2) || dayAnalysis[0],
    bestTime: hourAnalysis.find(h => h.total >= 2) || hourAnalysis[0],
  };
}

function identifyOptimalTiming(jobs, successStatuses) {
  const timingAnalysis = analyzeTimingPatterns(jobs, successStatuses);

  return {
    optimalDay: timingAnalysis.bestDay?.day || "Not enough data",
    optimalTime: timingAnalysis.bestTime?.timeRange || "Not enough data",
    rationale: timingAnalysis.bestDay && timingAnalysis.bestTime
      ? `Based on ${jobs.length} applications, your best success rate is when applying on ${timingAnalysis.bestDay.day} during ${timingAnalysis.bestTime.timeRange}`
      : "Need more data to determine optimal timing",
  };
}

function generateRecommendations(industry, companySize, roleType, method, patterns, materials, timing, overallRate) {
  const recommendations = [];

  // Industry recommendations
  if (industry.topPerforming.length > 0) {
    const top = industry.topPerforming[0];
    if (top.statisticalSignificance.significant) {
      recommendations.push({
        category: "Industry Focus",
        priority: "high",
        title: `Double down on ${top.industry}`,
        description: `Your success rate in ${top.industry} is ${top.successRate}% vs your average of ${overallRate.toFixed(1)}%`,
        impact: "high",
        actionable: `Apply to more ${top.industry} positions`,
      });
    }
  }

  // Company size recommendations
  if (companySize.bestPerforming && companySize.bestPerforming.vsAverage > 10) {
    recommendations.push({
      category: "Company Size",
      priority: "medium",
      title: `Focus on ${companySize.bestPerforming.sizeCategory} companies`,
      description: `You perform ${companySize.bestPerforming.vsAverage}% better with ${companySize.bestPerforming.companySize} employee companies`,
      impact: "medium",
      actionable: `Target companies with ${companySize.bestPerforming.companySize} employees`,
    });
  }

  // Materials recommendations
  if (materials.customizationCorrelation.strength === "strong" || materials.customizationCorrelation.strength === "moderate") {
    recommendations.push({
      category: "Application Materials",
      priority: "high",
      title: "Continue customizing your materials",
      description: `There's a ${materials.customizationCorrelation.strength} correlation between customized materials and success`,
      impact: "high",
      actionable: "Always use tailored resume and cover letter for each application",
    });
  } else if (materials.impact.withBothMaterials.successRate < materials.impact.baseline.successRate) {
    recommendations.push({
      category: "Application Materials",
      priority: "high",
      title: "Improve your application materials",
      description: "Your materials may need improvement - consider getting feedback",
      impact: "high",
      actionable: "Have your resume and cover letter reviewed by a professional",
    });
  }

  // Timing recommendations
  if (timing.bestDay && timing.bestDay.successRate > overallRate + 5) {
    recommendations.push({
      category: "Timing",
      priority: "low",
      title: `Apply on ${timing.bestDay.day}s`,
      description: `Your success rate is ${timing.bestDay.successRate}% when applying on ${timing.bestDay.day}`,
      impact: "low",
      actionable: `Schedule your applications for ${timing.bestDay.day}`,
    });
  }

  // Work mode recommendations
  if (method.bestMethod && method.bestMethod.vsAverage > 10) {
    recommendations.push({
      category: "Work Mode",
      priority: "medium",
      title: `Target ${method.bestMethod.method} positions`,
      description: `You have ${method.bestMethod.vsAverage}% better success with ${method.bestMethod.method} roles`,
      impact: "medium",
      actionable: `Filter for ${method.bestMethod.method} positions in your job search`,
    });
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

function generateDetailedRecommendations(allJobs, successfulJobs, rejectedJobs, resumes, coverLetters, overallRate) {
  const recommendations = [];

  // Volume recommendation
  const weeklyRate = allJobs.length / Math.max(1, getWeeksDifference(allJobs[allJobs.length - 1]?.createdAt, allJobs[0]?.createdAt));
  if (weeklyRate < 5) {
    recommendations.push({
      category: "Application Volume",
      priority: "high",
      title: "Increase your application volume",
      description: `You're averaging ${weeklyRate.toFixed(1)} applications per week. Industry standard recommends 10-15.`,
      actionItems: [
        "Set a daily goal of 2-3 applications",
        "Use job alerts to find opportunities faster",
        "Create templates to speed up applications",
      ],
    });
  }

  // Success rate improvement
  if (overallRate < 15) {
    recommendations.push({
      category: "Success Rate",
      priority: "high",
      title: "Improve application quality",
      description: `Your current success rate of ${overallRate.toFixed(1)}% is below the industry average of 15-20%`,
      actionItems: [
        "Only apply to jobs where you meet 60%+ of requirements",
        "Customize your resume for each application",
        "Research the company before applying",
        "Include a tailored cover letter",
      ],
    });
  }

  // Materials recommendation
  const jobsWithMaterials = allJobs.filter(j => j.linkedResumeId || j.materials?.resume || j.materials?.coverLetter);
  if (jobsWithMaterials.length < allJobs.length * 0.5) {
    recommendations.push({
      category: "Application Materials",
      priority: "high",
      title: "Attach materials to more applications",
      description: `Only ${((jobsWithMaterials.length / allJobs.length) * 100).toFixed(0)}% of your applications have linked materials`,
      actionItems: [
        "Create 3-5 resume versions for different role types",
        "Develop cover letter templates you can quickly customize",
        "Track which materials lead to interviews",
      ],
    });
  }

  // Diversification recommendation
  const industries = [...new Set(allJobs.map(j => j.industry).filter(Boolean))];
  if (industries.length < 3 && allJobs.length > 10) {
    recommendations.push({
      category: "Diversification",
      priority: "medium",
      title: "Consider expanding your industry focus",
      description: "You're only targeting a few industries, which limits opportunities",
      actionItems: [
        "Identify transferable skills that apply to other industries",
        "Research adjacent industries where your skills are valued",
        "Network with professionals in related fields",
      ],
    });
  }

  return recommendations;
}

function identifySuccessPatterns(allJobs, successfulJobs) {
  const patterns = [];
  const interviewJobs = allJobs.filter(j => ["Interview", "Phone Screen"].includes(j.status));
  const offerJobs = allJobs.filter(j => ["Offer", "Accepted"].includes(j.status));

  // Pattern 1: Industry success pattern
  const industrySuccess = {};
  allJobs.forEach(job => {
    const industry = job.industry || "Unknown";
    if (!industrySuccess[industry]) industrySuccess[industry] = { total: 0, success: 0, interviews: 0, offers: 0 };
    industrySuccess[industry].total++;
    if (successfulJobs.includes(job)) industrySuccess[industry].success++;
    if (interviewJobs.includes(job)) industrySuccess[industry].interviews++;
    if (offerJobs.includes(job)) industrySuccess[industry].offers++;
  });

  const highSuccessIndustries = Object.entries(industrySuccess)
    .filter(([_, stats]) => stats.total >= 3 && (stats.success / stats.total) > 0.3)
    .map(([industry, stats]) => ({
      industry,
      successRate: ((stats.success / stats.total) * 100).toFixed(1),
      interviewRate: ((stats.interviews / stats.total) * 100).toFixed(1),
      offerRate: ((stats.offers / stats.total) * 100).toFixed(1),
      count: stats.total,
    }));

  if (highSuccessIndustries.length > 0) {
    patterns.push({
      type: "Industry Strength",
      description: `You perform well in ${highSuccessIndustries.map(i => i.industry).join(", ")}`,
      data: highSuccessIndustries,
      recommendation: "Focus more applications in these industries",
    });
  }

  // Pattern 2: Timing pattern - Day of week
  const daySuccess = {};
  allJobs.forEach(job => {
    const day = new Date(job.createdAt).getDay();
    if (!daySuccess[day]) daySuccess[day] = { total: 0, success: 0 };
    daySuccess[day].total++;
    if (successfulJobs.includes(job)) daySuccess[day].success++;
  });

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const bestDay = Object.entries(daySuccess)
    .filter(([_, stats]) => stats.total >= 3)
    .map(([day, stats]) => ({
      day: days[parseInt(day)],
      successRate: ((stats.success / stats.total) * 100).toFixed(1),
      count: stats.total,
    }))
    .sort((a, b) => parseFloat(b.successRate) - parseFloat(a.successRate))[0];

  if (bestDay && parseFloat(bestDay.successRate) > 20) {
    patterns.push({
      type: "Optimal Timing",
      description: `Applications submitted on ${bestDay.day} have a ${bestDay.successRate}% success rate`,
      data: bestDay,
      recommendation: `Try to submit more applications on ${bestDay.day}`,
    });
  }

  // Pattern 3: Interview to Offer Conversion
  if (interviewJobs.length >= 3) {
    const interviewToOfferRate = offerJobs.length > 0
      ? ((offerJobs.length / interviewJobs.length) * 100).toFixed(1)
      : "0";

    patterns.push({
      type: "Interview Conversion",
      description: `${interviewToOfferRate}% of your interviews lead to offers`,
      data: {
        totalInterviews: interviewJobs.length,
        totalOffers: offerJobs.length,
        conversionRate: interviewToOfferRate,
      },
      recommendation: parseFloat(interviewToOfferRate) < 30
        ? "Focus on interview preparation to improve conversion"
        : "Your interview skills are strong - keep it up!",
    });
  }

  // Pattern 4: Application to Interview Conversion
  if (allJobs.length >= 5) {
    const appToInterviewRate = ((interviewJobs.length / allJobs.length) * 100).toFixed(1);

    patterns.push({
      type: "Application to Interview",
      description: `${appToInterviewRate}% of applications lead to interviews`,
      data: {
        totalApplications: allJobs.length,
        totalInterviews: interviewJobs.length,
        conversionRate: appToInterviewRate,
      },
      recommendation: parseFloat(appToInterviewRate) < 15
        ? "Improve resume targeting and application quality"
        : "Your application materials are performing well",
    });
  }

  // Pattern 5: Preparation correlation (jobs with notes/preparation tend to be more successful)
  const jobsWithPrep = allJobs.filter(j => j.notes && j.notes.length > 50);
  const jobsWithoutPrep = allJobs.filter(j => !j.notes || j.notes.length <= 50);

  if (jobsWithPrep.length >= 3 && jobsWithoutPrep.length >= 3) {
    const prepSuccessRate = (jobsWithPrep.filter(j => successfulJobs.includes(j)).length / jobsWithPrep.length) * 100;
    const noPrepSuccessRate = (jobsWithoutPrep.filter(j => successfulJobs.includes(j)).length / jobsWithoutPrep.length) * 100;

    if (prepSuccessRate > noPrepSuccessRate + 5) {
      patterns.push({
        type: "Preparation Impact",
        description: `Applications with detailed preparation notes have ${prepSuccessRate.toFixed(1)}% success vs ${noPrepSuccessRate.toFixed(1)}% without`,
        data: {
          withPrepSuccessRate: prepSuccessRate.toFixed(1),
          withoutPrepSuccessRate: noPrepSuccessRate.toFixed(1),
          improvement: (prepSuccessRate - noPrepSuccessRate).toFixed(1),
        },
        recommendation: "Continue adding detailed notes and preparation for each application",
      });
    }
  }

  // Pattern 6: Monthly/Seasonal patterns (market conditions)
  const monthSuccess = {};
  allJobs.forEach(job => {
    const month = new Date(job.createdAt).getMonth();
    if (!monthSuccess[month]) monthSuccess[month] = { total: 0, success: 0 };
    monthSuccess[month].total++;
    if (successfulJobs.includes(job)) monthSuccess[month].success++;
  });

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthPatterns = Object.entries(monthSuccess)
    .filter(([_, stats]) => stats.total >= 2)
    .map(([month, stats]) => ({
      month: months[parseInt(month)],
      successRate: ((stats.success / stats.total) * 100).toFixed(1),
      count: stats.total,
    }))
    .sort((a, b) => parseFloat(b.successRate) - parseFloat(a.successRate));

  if (monthPatterns.length >= 2) {
    const bestMonth = monthPatterns[0];
    const worstMonth = monthPatterns[monthPatterns.length - 1];

    if (parseFloat(bestMonth.successRate) - parseFloat(worstMonth.successRate) > 15) {
      patterns.push({
        type: "Market Timing",
        description: `Best results in ${bestMonth.month} (${bestMonth.successRate}%), lower in ${worstMonth.month} (${worstMonth.successRate}%)`,
        data: { bestMonth, worstMonth, allMonths: monthPatterns },
        recommendation: `Consider timing your job search around ${bestMonth.month} for better results`,
      });
    }
  }

  // Pattern 7: Response time patterns
  const jobsWithQuickResponse = allJobs.filter(j => {
    if (!j.statusHistory || j.statusHistory.length < 2) return false;
    const applied = j.statusHistory.find(s => s.status === "Applied")?.timestamp;
    const nextStatus = j.statusHistory.find(s => s.status !== "Applied" && s.status !== "Interested")?.timestamp;
    if (applied && nextStatus) {
      const days = (new Date(nextStatus) - new Date(applied)) / (1000 * 60 * 60 * 24);
      return days <= 14;
    }
    return false;
  });

  if (jobsWithQuickResponse.length >= 3) {
    const quickResponseSuccessRate = (jobsWithQuickResponse.filter(j => successfulJobs.includes(j)).length / jobsWithQuickResponse.length) * 100;
    patterns.push({
      type: "Response Velocity",
      description: `Jobs with quick employer response (≤14 days) have ${quickResponseSuccessRate.toFixed(1)}% success rate`,
      data: {
        quickResponseJobs: jobsWithQuickResponse.length,
        successRate: quickResponseSuccessRate.toFixed(1),
      },
      recommendation: "Quick employer responses often indicate good fit - prioritize follow-up on these",
    });
  }

  // Pattern 8: Company size pattern
  const sizeSuccess = {};
  allJobs.forEach(job => {
    const size = job.companyInfo?.size || "Unknown";
    if (!sizeSuccess[size]) sizeSuccess[size] = { total: 0, success: 0 };
    sizeSuccess[size].total++;
    if (successfulJobs.includes(job)) sizeSuccess[size].success++;
  });

  const bestSize = Object.entries(sizeSuccess)
    .filter(([_, stats]) => stats.total >= 3)
    .map(([size, stats]) => ({
      size,
      successRate: ((stats.success / stats.total) * 100).toFixed(1),
      count: stats.total,
    }))
    .sort((a, b) => parseFloat(b.successRate) - parseFloat(a.successRate))[0];

  if (bestSize && parseFloat(bestSize.successRate) > 20) {
    patterns.push({
      type: "Company Size Preference",
      description: `You have ${bestSize.successRate}% success rate with ${bestSize.size} employee companies`,
      data: bestSize,
      recommendation: `Target companies with around ${bestSize.size} employees`,
    });
  }

  return patterns;
}

// Utility functions
function calculateAverageResponseTime(jobs) {
  const jobsWithResponse = jobs.filter(j => j.statusHistory && j.statusHistory.length > 1);
  if (jobsWithResponse.length === 0) return null;

  const responseTimes = jobsWithResponse.map(j => {
    const applied = j.statusHistory.find(s => s.status === "Applied")?.timestamp;
    const nextStatus = j.statusHistory.find(s => s.status !== "Applied" && s.status !== "Interested")?.timestamp;
    if (applied && nextStatus) {
      return (new Date(nextStatus) - new Date(applied)) / (1000 * 60 * 60 * 24);
    }
    return null;
  }).filter(Boolean);

  if (responseTimes.length === 0) return null;
  return parseFloat((responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(1));
}

function getTopCategories(jobs, field, limit) {
  const counts = {};
  jobs.forEach(job => {
    const value = job[field] || "Unknown";
    counts[value] = (counts[value] || 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count, percentage: ((count / jobs.length) * 100).toFixed(1) }));
}

function getAveragePriority(jobs) {
  const priorityValues = { Low: 1, Medium: 2, High: 3 };
  const priorities = jobs.map(j => priorityValues[j.priority] || 2);
  const avg = priorities.reduce((a, b) => a + b, 0) / priorities.length;
  if (avg < 1.5) return "Low";
  if (avg < 2.5) return "Medium";
  return "High";
}

function getWeekNumber(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

function getWeeksDifference(startDate, endDate) {
  if (!startDate || !endDate) return 1;
  const diffTime = Math.abs(new Date(endDate) - new Date(startDate));
  const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
  return Math.max(1, diffWeeks);
}

// ============================================================================
// UC-105: Success Pattern Recognition - Predictive Modeling
// ============================================================================

/**
 * Generate success prediction for a potential application
 */
export function generateSuccessPrediction(jobData, historicalPatterns) {
  const factors = [];
  let baseScore = 50; // Start with 50% base probability

  // Factor 1: Industry match (weight: 25%)
  if (historicalPatterns.topIndustries && jobData.industry) {
    const industryMatch = historicalPatterns.topIndustries.find(
      i => i.industry.toLowerCase() === jobData.industry.toLowerCase()
    );
    if (industryMatch) {
      const industryBonus = Math.min(25, (parseFloat(industryMatch.successRate) - 15) * 0.5);
      baseScore += industryBonus;
      factors.push({
        factor: "Industry Match",
        impact: industryBonus > 0 ? "positive" : "neutral",
        score: industryBonus,
        detail: `${jobData.industry} has ${industryMatch.successRate}% historical success rate`
      });
    }
  }

  // Factor 2: Company size match (weight: 15%)
  if (historicalPatterns.bestCompanySize && jobData.companySize) {
    const sizeMatch = jobData.companySize === historicalPatterns.bestCompanySize.size;
    const sizeScore = sizeMatch ? 15 : -5;
    baseScore += sizeScore;
    factors.push({
      factor: "Company Size",
      impact: sizeMatch ? "positive" : "neutral",
      score: sizeScore,
      detail: sizeMatch
        ? `Matches your strongest company size (${historicalPatterns.bestCompanySize.size})`
        : `Different from your optimal company size`
    });
  }

  // Factor 3: Timing optimization (weight: 10%)
  const dayOfWeek = new Date().getDay();
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  if (historicalPatterns.bestDays && historicalPatterns.bestDays.length > 0) {
    const isOptimalDay = historicalPatterns.bestDays.some(d => d.day === days[dayOfWeek]);
    const timingScore = isOptimalDay ? 10 : 0;
    baseScore += timingScore;
    factors.push({
      factor: "Submission Timing",
      impact: isOptimalDay ? "positive" : "neutral",
      score: timingScore,
      detail: isOptimalDay
        ? `${days[dayOfWeek]} is one of your optimal application days`
        : `Consider applying on ${historicalPatterns.bestDays[0]?.day || "weekdays"} for better results`
    });
  }

  // Factor 4: Role type match (weight: 15%)
  if (historicalPatterns.bestRoleTypes && jobData.roleType) {
    const roleMatch = historicalPatterns.bestRoleTypes.find(
      r => r.roleType.toLowerCase() === jobData.roleType.toLowerCase()
    );
    if (roleMatch) {
      const roleScore = Math.min(15, (parseFloat(roleMatch.successRate) - 15) * 0.3);
      baseScore += roleScore;
      factors.push({
        factor: "Role Type",
        impact: roleScore > 0 ? "positive" : "neutral",
        score: roleScore,
        detail: `${jobData.roleType} roles show ${roleMatch.successRate}% success rate`
      });
    }
  }

  // Ensure score is within bounds
  const finalScore = Math.max(5, Math.min(95, baseScore));

  // Determine confidence level
  let confidence = "low";
  if (historicalPatterns.sampleSize >= 20) confidence = "high";
  else if (historicalPatterns.sampleSize >= 10) confidence = "medium";

  return {
    successProbability: Math.round(finalScore),
    confidence,
    factors,
    recommendations: generatePredictionRecommendations(factors, historicalPatterns),
    modelVersion: "1.0",
    basedOnSampleSize: historicalPatterns.sampleSize || 0
  };
}

/**
 * Generate recommendations based on prediction factors
 */
function generatePredictionRecommendations(factors, patterns) {
  const recommendations = [];

  const negativeFactors = factors.filter(f => f.impact === "negative" || f.score < 0);
  negativeFactors.forEach(factor => {
    if (factor.factor === "Industry Match") {
      recommendations.push({
        priority: "high",
        action: "Research industry-specific requirements",
        detail: "Consider tailoring your resume to highlight relevant industry experience"
      });
    }
    if (factor.factor === "Submission Timing") {
      recommendations.push({
        priority: "medium",
        action: `Apply on ${patterns.bestDays?.[0]?.day || "Monday-Wednesday"}`,
        detail: "Your historical data shows better success rates on these days"
      });
    }
  });

  // Always add general recommendations
  recommendations.push({
    priority: "medium",
    action: "Customize your application materials",
    detail: "Tailored resumes and cover letters typically improve success rates by 20-40%"
  });

  return recommendations.slice(0, 3);
}

/**
 * Track pattern evolution over time
 */
export function analyzePatternEvolution(allJobs) {
  if (allJobs.length < 10) {
    return {
      hasEnoughData: false,
      message: "Need at least 10 applications to track pattern evolution",
      evolution: []
    };
  }

  // Sort jobs by date
  const sortedJobs = [...allJobs].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  // Divide into time periods (quarters or months based on data span)
  const firstDate = new Date(sortedJobs[0].createdAt);
  const lastDate = new Date(sortedJobs[sortedJobs.length - 1].createdAt);
  const daySpan = (lastDate - firstDate) / (1000 * 60 * 60 * 24);

  let periodSize;
  let periodLabel;
  if (daySpan > 180) {
    periodSize = 90; // Quarterly
    periodLabel = "Quarter";
  } else if (daySpan > 60) {
    periodSize = 30; // Monthly
    periodLabel = "Month";
  } else {
    periodSize = 14; // Bi-weekly
    periodLabel = "Period";
  }

  const successStatuses = ["Interview", "Phone Screen", "Offer", "Accepted"];
  const periods = [];
  let currentPeriodStart = firstDate;
  let periodIndex = 1;

  while (currentPeriodStart < lastDate) {
    const periodEnd = new Date(currentPeriodStart.getTime() + periodSize * 24 * 60 * 60 * 1000);
    const periodJobs = sortedJobs.filter(j => {
      const jobDate = new Date(j.createdAt);
      return jobDate >= currentPeriodStart && jobDate < periodEnd;
    });

    if (periodJobs.length > 0) {
      const successCount = periodJobs.filter(j => successStatuses.includes(j.status)).length;
      const successRate = (successCount / periodJobs.length) * 100;

      // Calculate strategy metrics
      const avgApplicationsPerWeek = periodJobs.length / Math.max(1, periodSize / 7);
      const topIndustries = getTopCategories(periodJobs.filter(j => successStatuses.includes(j.status)), "industry", 2);

      periods.push({
        period: `${periodLabel} ${periodIndex}`,
        startDate: currentPeriodStart.toISOString().split("T")[0],
        endDate: periodEnd.toISOString().split("T")[0],
        totalApplications: periodJobs.length,
        successfulApplications: successCount,
        successRate: parseFloat(successRate.toFixed(1)),
        avgApplicationsPerWeek: parseFloat(avgApplicationsPerWeek.toFixed(1)),
        topSuccessfulIndustries: topIndustries.map(i => i.name),
        trend: periodIndex > 1 ? calculateTrend(periods[periods.length - 1]?.successRate || 0, successRate) : "baseline"
      });
    }

    currentPeriodStart = periodEnd;
    periodIndex++;
  }

  // Calculate overall evolution insights
  const evolutionInsights = generateEvolutionInsights(periods);

  return {
    hasEnoughData: true,
    periodType: periodLabel,
    periods,
    insights: evolutionInsights,
    strategyAdaptation: identifyStrategyChanges(periods)
  };
}

function calculateTrend(previous, current) {
  const diff = current - previous;
  if (diff > 5) return "improving";
  if (diff < -5) return "declining";
  return "stable";
}

function generateEvolutionInsights(periods) {
  if (periods.length < 2) return [];

  const insights = [];
  const firstHalf = periods.slice(0, Math.floor(periods.length / 2));
  const secondHalf = periods.slice(Math.floor(periods.length / 2));

  const firstHalfAvg = firstHalf.reduce((sum, p) => sum + p.successRate, 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((sum, p) => sum + p.successRate, 0) / secondHalf.length;

  if (secondHalfAvg > firstHalfAvg + 5) {
    insights.push({
      type: "positive_trend",
      message: "Your success rate has improved over time",
      detail: `Increased from ${firstHalfAvg.toFixed(1)}% to ${secondHalfAvg.toFixed(1)}%`
    });
  } else if (secondHalfAvg < firstHalfAvg - 5) {
    insights.push({
      type: "negative_trend",
      message: "Your success rate has declined recently",
      detail: `Consider revisiting strategies that worked in earlier periods`
    });
  }

  // Check for consistency
  const successRates = periods.map(p => p.successRate);
  const variance = calculateVariance(successRates);
  if (variance < 50) {
    insights.push({
      type: "consistent",
      message: "Your application strategy is consistent",
      detail: "Low variance in success rates indicates stable performance"
    });
  }

  return insights;
}

function calculateVariance(values) {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
}

function identifyStrategyChanges(periods) {
  if (periods.length < 3) return [];

  const changes = [];

  for (let i = 1; i < periods.length; i++) {
    const current = periods[i];
    const previous = periods[i - 1];

    // Check for volume changes
    if (current.avgApplicationsPerWeek > previous.avgApplicationsPerWeek * 1.5) {
      changes.push({
        period: current.period,
        change: "increased_volume",
        impact: current.successRate > previous.successRate ? "positive" : "negative",
        detail: `Application volume increased by ${((current.avgApplicationsPerWeek / previous.avgApplicationsPerWeek - 1) * 100).toFixed(0)}%`
      });
    }

    // Check for industry focus changes
    const industryShift = current.topSuccessfulIndustries.some(
      i => !previous.topSuccessfulIndustries.includes(i)
    );
    if (industryShift) {
      changes.push({
        period: current.period,
        change: "industry_shift",
        impact: current.successRate > previous.successRate ? "positive" : "neutral",
        detail: `Shifted focus to ${current.topSuccessfulIndustries.join(", ")}`
      });
    }
  }

  return changes;
}

/**
 * GET /api/application-success/response-tracking
 * Track application response rates over time
 */
export const getResponseTracking = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const allJobs = await Job.find({ userId }).sort({ createdAt: 1 });

  if (allJobs.length === 0) {
    const { response, statusCode } = successResponse("No applications to track", {
      hasData: false,
    });
    return sendResponse(res, response, statusCode);
  }

  // Calculate response metrics
  const responseMetrics = {
    totalApplications: allJobs.length,
    responsesReceived: 0,
    interviewsReceived: 0,
    offersReceived: 0,
    avgResponseTime: 0,
    responseRate: 0,
    interviewConversionRate: 0,
    offerConversionRate: 0,
    trendData: []
  };

  const responseTimes = [];
  const successStatuses = ["Interview", "Phone Screen", "Offer", "Accepted"];
  const responseStatuses = [...successStatuses, "Rejected"];

  allJobs.forEach(job => {
    if (responseStatuses.includes(job.status)) {
      responseMetrics.responsesReceived++;
    }
    if (["Interview", "Phone Screen"].includes(job.status)) {
      responseMetrics.interviewsReceived++;
    }
    if (["Offer", "Accepted"].includes(job.status)) {
      responseMetrics.offersReceived++;
    }

    // Calculate response time if available
    if (job.statusHistory && job.statusHistory.length >= 2) {
      const applied = job.statusHistory.find(s => s.status === "Applied")?.timestamp;
      const response = job.statusHistory.find(s => responseStatuses.includes(s.status))?.timestamp;
      if (applied && response) {
        const days = (new Date(response) - new Date(applied)) / (1000 * 60 * 60 * 24);
        responseTimes.push(days);
      }
    }
  });

  responseMetrics.responseRate = parseFloat(((responseMetrics.responsesReceived / responseMetrics.totalApplications) * 100).toFixed(1));
  responseMetrics.interviewConversionRate = parseFloat(((responseMetrics.interviewsReceived / responseMetrics.totalApplications) * 100).toFixed(1));
  responseMetrics.offerConversionRate = parseFloat(((responseMetrics.offersReceived / responseMetrics.totalApplications) * 100).toFixed(1));
  responseMetrics.avgResponseTime = responseTimes.length > 0
    ? parseFloat((responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(1))
    : 0;

  // Generate trend data by month
  const monthlyData = {};
  allJobs.forEach(job => {
    const monthKey = new Date(job.createdAt).toISOString().slice(0, 7); // YYYY-MM
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        month: monthKey,
        total: 0,
        responses: 0,
        interviews: 0,
        offers: 0
      };
    }
    monthlyData[monthKey].total++;
    if (responseStatuses.includes(job.status)) monthlyData[monthKey].responses++;
    if (["Interview", "Phone Screen"].includes(job.status)) monthlyData[monthKey].interviews++;
    if (["Offer", "Accepted"].includes(job.status)) monthlyData[monthKey].offers++;
  });

  responseMetrics.trendData = Object.values(monthlyData).map(data => ({
    ...data,
    responseRate: parseFloat(((data.responses / data.total) * 100).toFixed(1)),
    interviewRate: parseFloat(((data.interviews / data.total) * 100).toFixed(1)),
    offerRate: parseFloat(((data.offers / data.total) * 100).toFixed(1))
  }));

  const { response, statusCode } = successResponse("Response tracking retrieved", {
    hasData: true,
    metrics: responseMetrics
  });
  return sendResponse(res, response, statusCode);
});

/**
 * GET /api/application-success/ab-testing
 * Compare performance of different resume/cover letter versions
 */
export const getABTesting = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const allJobs = await Job.find({ userId });
  const resumes = await Resume.find({ userId });
  const coverLetters = await CoverLetter.find({ userId });

  if (resumes.length < 2 && coverLetters.length < 2) {
    const { response, statusCode } = successResponse("Not enough material versions for A/B testing", {
      hasData: false,
      message: "Create multiple versions of your resume or cover letter to see performance comparison"
    });
    return sendResponse(res, response, statusCode);
  }

  const successStatuses = ["Interview", "Phone Screen", "Offer", "Accepted"];

  // Analyze resume versions
  const resumePerformance = resumes.map(resume => {
    const jobsWithResume = allJobs.filter(j => 
      j.linkedResumeId?.toString() === resume._id.toString() || 
      j.materials?.resume === resume.fileName
    );
    const successful = jobsWithResume.filter(j => successStatuses.includes(j.status)).length;

    return {
      id: resume._id,
      name: resume.fileName || `Resume ${resume._id.toString().slice(-6)}`,
      version: resume.version || 1,
      applicationsUsed: jobsWithResume.length,
      successfulApplications: successful,
      successRate: jobsWithResume.length > 0 ? parseFloat(((successful / jobsWithResume.length) * 100).toFixed(1)) : 0,
      interviewRate: jobsWithResume.length > 0 
        ? parseFloat(((jobsWithResume.filter(j => ["Interview", "Phone Screen"].includes(j.status)).length / jobsWithResume.length) * 100).toFixed(1))
        : 0,
      lastUsed: jobsWithResume.length > 0 
        ? new Date(Math.max(...jobsWithResume.map(j => new Date(j.createdAt)))).toISOString()
        : resume.createdAt,
      isTailored: resume.metadata?.tailoredForJob || false
    };
  }).sort((a, b) => b.successRate - a.successRate);

  // Analyze cover letter versions
  const coverLetterPerformance = coverLetters.map(cl => {
    const jobsWithCoverLetter = allJobs.filter(j => 
      j.materials?.coverLetter === cl.fileName ||
      j.linkedCoverLetterId?.toString() === cl._id.toString()
    );
    const successful = jobsWithCoverLetter.filter(j => successStatuses.includes(j.status)).length;

    return {
      id: cl._id,
      name: cl.fileName || `Cover Letter ${cl._id.toString().slice(-6)}`,
      applicationsUsed: jobsWithCoverLetter.length,
      successfulApplications: successful,
      successRate: jobsWithCoverLetter.length > 0 ? parseFloat(((successful / jobsWithCoverLetter.length) * 100).toFixed(1)) : 0,
      interviewRate: jobsWithCoverLetter.length > 0 
        ? parseFloat(((jobsWithCoverLetter.filter(j => ["Interview", "Phone Screen"].includes(j.status)).length / jobsWithCoverLetter.length) * 100).toFixed(1))
        : 0,
      lastUsed: jobsWithCoverLetter.length > 0 
        ? new Date(Math.max(...jobsWithCoverLetter.map(j => new Date(j.createdAt)))).toISOString()
        : cl.createdAt,
      isTailored: cl.metadata?.tailoredForJob || cl.jobId || false
    };
  }).sort((a, b) => b.successRate - a.successRate);

  // Calculate statistical significance
  const topResume = resumePerformance[0];
  const bottomResume = resumePerformance[resumePerformance.length - 1];
  const resumeSignificance = topResume && bottomResume && topResume.applicationsUsed >= 3 && bottomResume.applicationsUsed >= 3
    ? getStatisticalSignificance(
        calculateZScore(
          topResume.successfulApplications,
          topResume.applicationsUsed,
          bottomResume.successRate / 100
        )
      )
    : { level: "none", confidence: 0, significant: false };

  const { response, statusCode } = successResponse("A/B testing analysis retrieved", {
    hasData: true,
    resumeVersions: resumePerformance,
    coverLetterVersions: coverLetterPerformance,
    insights: {
      bestResume: resumePerformance[0] || null,
      bestCoverLetter: coverLetterPerformance[0] || null,
      tailoredVsGeneric: {
        tailored: {
          resumes: resumePerformance.filter(r => r.isTailored),
          avgSuccessRate: resumePerformance.filter(r => r.isTailored).length > 0
            ? parseFloat((resumePerformance.filter(r => r.isTailored).reduce((sum, r) => sum + r.successRate, 0) / resumePerformance.filter(r => r.isTailored).length).toFixed(1))
            : 0
        },
        generic: {
          resumes: resumePerformance.filter(r => !r.isTailored),
          avgSuccessRate: resumePerformance.filter(r => !r.isTailored).length > 0
            ? parseFloat((resumePerformance.filter(r => !r.isTailored).reduce((sum, r) => sum + r.successRate, 0) / resumePerformance.filter(r => !r.isTailored).length).toFixed(1))
            : 0
        }
      },
      statisticalSignificance: resumeSignificance,
      recommendation: topResume && topResume.successRate > 20 
        ? `Your "${topResume.name}" resume performs best with ${topResume.successRate}% success rate`
        : "Continue testing different resume versions to identify the most effective format"
    }
  });
  return sendResponse(res, response, statusCode);
});
