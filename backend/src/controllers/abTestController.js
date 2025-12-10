import { asyncHandler } from "../middleware/errorHandler.js";
import { ABTest } from "../models/ABTest.js";
import { Resume } from "../models/Resume.js";
import { CoverLetter } from "../models/CoverLetter.js";
import { Job } from "../models/Job.js";
import { successResponse, errorResponse, ERROR_CODES, sendResponse } from "../utils/responseFormat.js";

// ============================================================================
// UC-120: A/B Testing for Resume and Cover Letter Versions
// ============================================================================

const MINIMUM_SAMPLE_SIZE = 10;

/**
 * Calculate Z-score for two proportions
 */
function calculateTwoProportionZScore(successes1, total1, successes2, total2) {
  if (total1 === 0 || total2 === 0) return 0;
  
  const p1 = successes1 / total1;
  const p2 = successes2 / total2;
  const pooledP = (successes1 + successes2) / (total1 + total2);
  const se = Math.sqrt(pooledP * (1 - pooledP) * (1 / total1 + 1 / total2));
  
  if (se === 0) return 0;
  return (p1 - p2) / se;
}

/**
 * Get statistical significance from Z-score
 */
function getSignificanceFromZScore(zScore) {
  const absZ = Math.abs(zScore);
  if (absZ >= 2.576) return { level: "high", confidence: 99, significant: true };
  if (absZ >= 1.96) return { level: "medium", confidence: 95, significant: true };
  if (absZ >= 1.645) return { level: "low", confidence: 90, significant: true };
  return { level: "none", confidence: 0, significant: false };
}

/**
 * Analyze material elements (format, content, length)
 */
async function analyzeMaterialElements(materialId, materialType) {
  let material;
  if (materialType === "resume") {
    material = await Resume.findById(materialId);
    if (!material) return null;
    
    const sections = material.sections || {};
    return {
      format: material.metadata?.format || "Traditional",
      wordCount: estimateWordCount(sections),
      sectionCount: Object.keys(sections).filter(k => sections[k]).length,
      hasSummary: !!sections.summary,
      hasSkillsSection: !!sections.skills,
      bulletPointCount: countBulletPoints(sections),
      keywordsCount: countKeywords(sections),
    };
  } else {
    material = await CoverLetter.findById(materialId);
    if (!material) return null;
    
    return {
      format: material.style || "formal",
      wordCount: material.content ? material.content.split(/\s+/).length : 0,
      sectionCount: countParagraphs(material.content),
      hasSummary: true, // Cover letters typically have intro
      hasSkillsSection: false,
      bulletPointCount: (material.content?.match(/[•\-\*]/g) || []).length,
      keywordsCount: countKeywordsInText(material.content),
    };
  }
}

function estimateWordCount(sections) {
  let count = 0;
  for (const key in sections) {
    if (typeof sections[key] === "string") {
      count += sections[key].split(/\s+/).length;
    } else if (Array.isArray(sections[key])) {
      sections[key].forEach(item => {
        if (typeof item === "string") {
          count += item.split(/\s+/).length;
        } else if (typeof item === "object") {
          count += JSON.stringify(item).split(/\s+/).length;
        }
      });
    }
  }
  return count;
}

function countBulletPoints(sections) {
  let count = 0;
  const text = JSON.stringify(sections);
  count += (text.match(/[•\-\*]/g) || []).length;
  if (sections.experience && Array.isArray(sections.experience)) {
    sections.experience.forEach(exp => {
      if (exp.bullets) count += exp.bullets.length;
      if (exp.achievements) count += exp.achievements.length;
    });
  }
  return count;
}

function countKeywords(sections) {
  const keywords = ["led", "managed", "developed", "created", "improved", "increased", "reduced", "achieved", "implemented", "designed", "built", "launched"];
  const text = JSON.stringify(sections).toLowerCase();
  return keywords.filter(k => text.includes(k)).length;
}

function countParagraphs(content) {
  if (!content) return 0;
  return content.split(/\n\n+/).filter(p => p.trim()).length;
}

function countKeywordsInText(content) {
  if (!content) return 0;
  const keywords = ["led", "managed", "developed", "created", "improved", "increased", "reduced", "achieved", "implemented", "designed", "built", "launched", "passionate", "excited", "skilled"];
  const text = content.toLowerCase();
  return keywords.filter(k => text.includes(k)).length;
}

// ============================================================================
// Endpoints
// ============================================================================

/**
 * POST /api/ab-tests
 * Create a new A/B test experiment
 */
export const createABTest = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;

  if (!userId) {
    const { response, statusCode } = errorResponse("Unauthorized", 401, ERROR_CODES.UNAUTHORIZED);
    return sendResponse(res, response, statusCode);
  }

  const { name, description, materialType, versionIds, targetIndustries, targetRoles, minSampleSize, targetSampleSize } = req.body;

  if (!name || !materialType || !versionIds || versionIds.length < 2) {
    const { response, statusCode } = errorResponse("Name, material type, and at least 2 version IDs are required", 400, ERROR_CODES.VALIDATION_ERROR);
    return sendResponse(res, response, statusCode);
  }

  // Validate materials exist and belong to user
  const Model = materialType === "resume" ? Resume : CoverLetter;
  const materials = await Model.find({ _id: { $in: versionIds }, userId });

  if (materials.length !== versionIds.length) {
    const { response, statusCode } = errorResponse("One or more materials not found or don't belong to user", 400, ERROR_CODES.VALIDATION_ERROR);
    return sendResponse(res, response, statusCode);
  }

  // Create versions with analysis
  const versions = await Promise.all(materials.map(async (material, index) => {
    const analysis = await analyzeMaterialElements(material._id, materialType);
    return {
      materialId: material._id,
      materialType,
      versionLabel: `Version ${String.fromCharCode(65 + index)}`, // A, B, C...
      materialName: material.name,
      analysis,
      applicationsAssigned: 0,
      responses: 0,
      interviews: 0,
      offers: 0,
      rejections: 0,
      noResponse: 0,
      totalResponseTime: 0,
      responseCount: 0,
    };
  }));

  const abTest = await ABTest.create({
    userId,
    name,
    description,
    materialType,
    versions,
    targetIndustries: targetIndustries || [],
    targetRoles: targetRoles || [],
    minSampleSize: minSampleSize || MINIMUM_SAMPLE_SIZE,
    targetSampleSize: targetSampleSize || 20,
    status: "active",
    startedAt: new Date(),
  });

  const { response, statusCode } = successResponse("A/B test created successfully", { abTest });
  return sendResponse(res, response, statusCode);
});

/**
 * GET /api/ab-tests
 * Get all A/B tests for user
 */
export const getABTests = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;

  if (!userId) {
    const { response, statusCode } = errorResponse("Unauthorized", 401, ERROR_CODES.UNAUTHORIZED);
    return sendResponse(res, response, statusCode);
  }

  const { status, materialType } = req.query;
  const query = { userId };
  
  if (status) query.status = status;
  if (materialType) query.materialType = materialType;

  const abTests = await ABTest.find(query).sort({ createdAt: -1 });

  const { response, statusCode } = successResponse("A/B tests retrieved", { 
    abTests,
    count: abTests.length 
  });
  return sendResponse(res, response, statusCode);
});

/**
 * GET /api/ab-tests/:id
 * Get a specific A/B test with full details
 */
export const getABTest = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;

  if (!userId) {
    const { response, statusCode } = errorResponse("Unauthorized", 401, ERROR_CODES.UNAUTHORIZED);
    return sendResponse(res, response, statusCode);
  }

  const abTest = await ABTest.findOne({ _id: req.params.id, userId });

  if (!abTest) {
    const { response, statusCode } = errorResponse("A/B test not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  // Calculate additional metrics
  const metrics = calculateTestMetrics(abTest);

  const { response, statusCode } = successResponse("A/B test retrieved", { 
    abTest,
    metrics 
  });
  return sendResponse(res, response, statusCode);
});

/**
 * POST /api/ab-tests/:id/assign
 * Get a random version assignment for a new application
 */
export const assignVersion = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;

  if (!userId) {
    const { response, statusCode } = errorResponse("Unauthorized", 401, ERROR_CODES.UNAUTHORIZED);
    return sendResponse(res, response, statusCode);
  }

  const abTest = await ABTest.findOne({ _id: req.params.id, userId, status: "active" });

  if (!abTest) {
    const { response, statusCode } = errorResponse("Active A/B test not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  let selectedVersionIndex;

  if (abTest.assignmentStrategy === "alternating") {
    // Assign to version with fewer applications
    const counts = abTest.versions.map(v => v.applicationsAssigned);
    selectedVersionIndex = counts.indexOf(Math.min(...counts));
  } else {
    // Random assignment
    selectedVersionIndex = Math.floor(Math.random() * abTest.versions.length);
  }

  const selectedVersion = abTest.versions[selectedVersionIndex];

  // Increment application count
  abTest.versions[selectedVersionIndex].applicationsAssigned++;
  await abTest.save();

  const { response, statusCode } = successResponse("Version assigned", {
    versionIndex: selectedVersionIndex,
    versionLabel: selectedVersion.versionLabel,
    materialId: selectedVersion.materialId,
    materialName: selectedVersion.materialName,
  });
  return sendResponse(res, response, statusCode);
});

/**
 * POST /api/ab-tests/:id/record-outcome
 * Record the outcome of an application for a specific version
 */
export const recordOutcome = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;

  if (!userId) {
    const { response, statusCode } = errorResponse("Unauthorized", 401, ERROR_CODES.UNAUTHORIZED);
    return sendResponse(res, response, statusCode);
  }

  const { versionIndex, outcome, responseTimeDays } = req.body;

  if (versionIndex === undefined || !outcome) {
    const { response, statusCode } = errorResponse("Version index and outcome are required", 400, ERROR_CODES.VALIDATION_ERROR);
    return sendResponse(res, response, statusCode);
  }

  const validOutcomes = ["response", "interview", "offer", "rejection", "noResponse"];
  if (!validOutcomes.includes(outcome)) {
    const { response, statusCode } = errorResponse("Invalid outcome. Must be one of: " + validOutcomes.join(", "), 400, ERROR_CODES.VALIDATION_ERROR);
    return sendResponse(res, response, statusCode);
  }

  const abTest = await ABTest.findOne({ _id: req.params.id, userId });

  if (!abTest) {
    const { response, statusCode } = errorResponse("A/B test not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  if (versionIndex >= abTest.versions.length) {
    const { response, statusCode } = errorResponse("Invalid version index", 400, ERROR_CODES.VALIDATION_ERROR);
    return sendResponse(res, response, statusCode);
  }

  // Update version metrics
  const version = abTest.versions[versionIndex];
  if (outcome === "response") version.responses++;
  if (outcome === "interview") {
    version.responses++;
    version.interviews++;
  }
  if (outcome === "offer") {
    version.responses++;
    version.interviews++;
    version.offers++;
  }
  if (outcome === "rejection") {
    version.responses++;
    version.rejections++;
  }
  if (outcome === "noResponse") version.noResponse++;

  // Track response time
  if (responseTimeDays && responseTimeDays > 0) {
    version.totalResponseTime += responseTimeDays;
    version.responseCount++;
  }

  await abTest.save();

  const { response, statusCode } = successResponse("Outcome recorded", { 
    version: abTest.versions[versionIndex] 
  });
  return sendResponse(res, response, statusCode);
});

/**
 * GET /api/ab-tests/:id/results
 * Get detailed results and statistical analysis
 */
export const getTestResults = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;

  if (!userId) {
    const { response, statusCode } = errorResponse("Unauthorized", 401, ERROR_CODES.UNAUTHORIZED);
    return sendResponse(res, response, statusCode);
  }

  const abTest = await ABTest.findOne({ _id: req.params.id, userId });

  if (!abTest) {
    const { response, statusCode } = errorResponse("A/B test not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  const results = calculateDetailedResults(abTest);

  const { response, statusCode } = successResponse("Test results retrieved", results);
  return sendResponse(res, response, statusCode);
});

/**
 * PATCH /api/ab-tests/:id/declare-winner
 * Declare a winning version
 */
export const declareWinner = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;

  if (!userId) {
    const { response, statusCode } = errorResponse("Unauthorized", 401, ERROR_CODES.UNAUTHORIZED);
    return sendResponse(res, response, statusCode);
  }

  const { winningVersionIndex, reason } = req.body;

  const abTest = await ABTest.findOne({ _id: req.params.id, userId });

  if (!abTest) {
    const { response, statusCode } = errorResponse("A/B test not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  if (winningVersionIndex >= abTest.versions.length) {
    const { response, statusCode } = errorResponse("Invalid version index", 400, ERROR_CODES.VALIDATION_ERROR);
    return sendResponse(res, response, statusCode);
  }

  abTest.winningVersionIndex = winningVersionIndex;
  abTest.winnerDeclaredAt = new Date();
  abTest.winnerDeclaredReason = reason || "Manually declared";
  abTest.status = "completed";
  abTest.completedAt = new Date();

  await abTest.save();

  const { response, statusCode } = successResponse("Winner declared", { abTest });
  return sendResponse(res, response, statusCode);
});

/**
 * PATCH /api/ab-tests/:id/status
 * Update test status (pause, resume, archive)
 */
export const updateTestStatus = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;

  if (!userId) {
    const { response, statusCode } = errorResponse("Unauthorized", 401, ERROR_CODES.UNAUTHORIZED);
    return sendResponse(res, response, statusCode);
  }

  const { status } = req.body;
  const validStatuses = ["active", "paused", "completed", "archived"];

  if (!validStatuses.includes(status)) {
    const { response, statusCode } = errorResponse("Invalid status", 400, ERROR_CODES.VALIDATION_ERROR);
    return sendResponse(res, response, statusCode);
  }

  const abTest = await ABTest.findOne({ _id: req.params.id, userId });

  if (!abTest) {
    const { response, statusCode } = errorResponse("A/B test not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  abTest.status = status;
  if (status === "completed") {
    abTest.completedAt = new Date();
  }

  await abTest.save();

  const { response, statusCode } = successResponse("Test status updated", { abTest });
  return sendResponse(res, response, statusCode);
});

/**
 * POST /api/ab-tests/:id/archive-loser
 * Archive the underperforming version
 */
export const archiveLosingVersion = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;

  if (!userId) {
    const { response, statusCode } = errorResponse("Unauthorized", 401, ERROR_CODES.UNAUTHORIZED);
    return sendResponse(res, response, statusCode);
  }

  const { losingVersionIndex } = req.body;

  const abTest = await ABTest.findOne({ _id: req.params.id, userId });

  if (!abTest) {
    const { response, statusCode } = errorResponse("A/B test not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  if (losingVersionIndex >= abTest.versions.length) {
    const { response, statusCode } = errorResponse("Invalid version index", 400, ERROR_CODES.VALIDATION_ERROR);
    return sendResponse(res, response, statusCode);
  }

  const losingVersion = abTest.versions[losingVersionIndex];
  const Model = abTest.materialType === "resume" ? Resume : CoverLetter;

  // Archive the material
  await Model.findByIdAndUpdate(losingVersion.materialId, {
    isArchived: true,
    metadata: {
      archivedFromABTest: abTest._id,
      archivedAt: new Date(),
      archivedReason: "Underperforming in A/B test",
    }
  });

  const { response, statusCode } = successResponse("Losing version archived", {
    archivedMaterialId: losingVersion.materialId,
    archivedMaterialName: losingVersion.materialName,
  });
  return sendResponse(res, response, statusCode);
});

/**
 * DELETE /api/ab-tests/:id
 * Delete an A/B test
 */
export const deleteABTest = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;

  if (!userId) {
    const { response, statusCode } = errorResponse("Unauthorized", 401, ERROR_CODES.UNAUTHORIZED);
    return sendResponse(res, response, statusCode);
  }

  const abTest = await ABTest.findOneAndDelete({ _id: req.params.id, userId });

  if (!abTest) {
    const { response, statusCode } = errorResponse("A/B test not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  const { response, statusCode } = successResponse("A/B test deleted", { deleted: true });
  return sendResponse(res, response, statusCode);
});

/**
 * POST /api/ab-tests/sync-from-jobs
 * Sync A/B test metrics from job applications
 */
export const syncFromJobs = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;

  if (!userId) {
    const { response, statusCode } = errorResponse("Unauthorized", 401, ERROR_CODES.UNAUTHORIZED);
    return sendResponse(res, response, statusCode);
  }

  const activeTests = await ABTest.find({ userId, status: "active" });
  const allJobs = await Job.find({ userId });

  const syncResults = [];

  for (const test of activeTests) {
    for (let i = 0; i < test.versions.length; i++) {
      const version = test.versions[i];
      const materialId = version.materialId.toString();

      // Find jobs using this material
      const jobsWithMaterial = allJobs.filter(job => {
        if (test.materialType === "resume") {
          return job.linkedResumeId?.toString() === materialId ||
                 job.materials?.resume?.toString() === materialId;
        } else {
          return job.materials?.coverLetter?.toString() === materialId;
        }
      });

      // Update metrics
      version.applicationsAssigned = jobsWithMaterial.length;
      version.responses = jobsWithMaterial.filter(j => 
        ["Interview", "Phone Screen", "Offer", "Rejected", "Accepted"].includes(j.status)
      ).length;
      version.interviews = jobsWithMaterial.filter(j => 
        ["Interview", "Phone Screen", "Offer", "Accepted"].includes(j.status)
      ).length;
      version.offers = jobsWithMaterial.filter(j => 
        ["Offer", "Accepted"].includes(j.status)
      ).length;
      version.rejections = jobsWithMaterial.filter(j => j.status === "Rejected").length;
      version.noResponse = jobsWithMaterial.filter(j => 
        ["Applied", "Interested"].includes(j.status)
      ).length;

      // Calculate response times
      let totalTime = 0;
      let timeCount = 0;
      jobsWithMaterial.forEach(job => {
        if (job.statusHistory && job.statusHistory.length >= 2) {
          const appliedEntry = job.statusHistory.find(h => h.status === "Applied");
          const responseEntry = job.statusHistory.find(h => 
            ["Interview", "Phone Screen", "Offer", "Rejected"].includes(h.status)
          );
          if (appliedEntry && responseEntry) {
            const days = (new Date(responseEntry.timestamp) - new Date(appliedEntry.timestamp)) / (1000 * 60 * 60 * 24);
            if (days > 0) {
              totalTime += days;
              timeCount++;
            }
          }
        }
      });
      version.totalResponseTime = totalTime;
      version.responseCount = timeCount;
    }

    await test.save();
    syncResults.push({
      testId: test._id,
      testName: test.name,
      synced: true,
    });
  }

  const { response, statusCode } = successResponse("A/B tests synced from jobs", { 
    syncedTests: syncResults.length,
    results: syncResults 
  });
  return sendResponse(res, response, statusCode);
});

// ============================================================================
// Helper Functions
// ============================================================================

function calculateTestMetrics(abTest) {
  const versions = abTest.versions.map((v, index) => {
    const responseRate = v.applicationsAssigned > 0 
      ? (v.responses / v.applicationsAssigned) * 100 : 0;
    const interviewRate = v.applicationsAssigned > 0 
      ? (v.interviews / v.applicationsAssigned) * 100 : 0;
    const offerRate = v.applicationsAssigned > 0 
      ? (v.offers / v.applicationsAssigned) * 100 : 0;
    const avgResponseTime = v.responseCount > 0 
      ? v.totalResponseTime / v.responseCount : 0;

    return {
      index,
      label: v.versionLabel,
      name: v.materialName,
      applications: v.applicationsAssigned,
      hasMinSample: v.applicationsAssigned >= abTest.minSampleSize,
      sampleProgress: Math.min(100, (v.applicationsAssigned / abTest.minSampleSize) * 100),
      metrics: {
        responseRate: parseFloat(responseRate.toFixed(1)),
        interviewRate: parseFloat(interviewRate.toFixed(1)),
        offerRate: parseFloat(offerRate.toFixed(1)),
        avgResponseTime: parseFloat(avgResponseTime.toFixed(1)),
        interviewConversion: v.responses > 0 
          ? parseFloat(((v.interviews / v.responses) * 100).toFixed(1)) : 0,
      },
      rawCounts: {
        responses: v.responses,
        interviews: v.interviews,
        offers: v.offers,
        rejections: v.rejections,
        noResponse: v.noResponse,
      }
    };
  });

  const allHaveMinSample = versions.every(v => v.hasMinSample);

  return {
    versions,
    allHaveMinSample,
    totalApplications: versions.reduce((sum, v) => sum + v.applications, 0),
    minSampleSize: abTest.minSampleSize,
  };
}

function calculateDetailedResults(abTest) {
  const metrics = calculateTestMetrics(abTest);
  
  // Statistical significance between versions
  const significanceResults = [];
  if (abTest.versions.length === 2 && metrics.allHaveMinSample) {
    const v0 = abTest.versions[0];
    const v1 = abTest.versions[1];

    // Response rate significance
    const responseZScore = calculateTwoProportionZScore(
      v0.responses, v0.applicationsAssigned,
      v1.responses, v1.applicationsAssigned
    );
    significanceResults.push({
      metric: "Response Rate",
      zScore: parseFloat(responseZScore.toFixed(3)),
      ...getSignificanceFromZScore(responseZScore),
      winner: responseZScore > 0 ? 0 : responseZScore < 0 ? 1 : null,
    });

    // Interview rate significance
    const interviewZScore = calculateTwoProportionZScore(
      v0.interviews, v0.applicationsAssigned,
      v1.interviews, v1.applicationsAssigned
    );
    significanceResults.push({
      metric: "Interview Rate",
      zScore: parseFloat(interviewZScore.toFixed(3)),
      ...getSignificanceFromZScore(interviewZScore),
      winner: interviewZScore > 0 ? 0 : interviewZScore < 0 ? 1 : null,
    });
  }

  // Identify winning version
  let suggestedWinner = null;
  let winningReason = null;

  if (metrics.allHaveMinSample && significanceResults.some(r => r.significant)) {
    const significantResults = significanceResults.filter(r => r.significant);
    const winCounts = [0, 0];
    significantResults.forEach(r => {
      if (r.winner !== null) winCounts[r.winner]++;
    });
    
    if (winCounts[0] > winCounts[1]) {
      suggestedWinner = 0;
      winningReason = `Version A wins ${winCounts[0]} out of ${significantResults.length} significant metrics`;
    } else if (winCounts[1] > winCounts[0]) {
      suggestedWinner = 1;
      winningReason = `Version B wins ${winCounts[1]} out of ${significantResults.length} significant metrics`;
    }
  }

  // Element analysis comparison
  const elementComparison = compareVersionElements(abTest.versions);

  return {
    test: {
      id: abTest._id,
      name: abTest.name,
      status: abTest.status,
      materialType: abTest.materialType,
      startedAt: abTest.startedAt,
      completedAt: abTest.completedAt,
    },
    metrics,
    statisticalSignificance: {
      canCalculate: metrics.allHaveMinSample,
      minimumSampleMet: metrics.allHaveMinSample,
      requiredSampleSize: abTest.minSampleSize,
      results: significanceResults,
    },
    suggestedWinner: {
      versionIndex: suggestedWinner,
      versionLabel: suggestedWinner !== null ? abTest.versions[suggestedWinner].versionLabel : null,
      reason: winningReason,
      confidence: significanceResults.find(r => r.significant)?.confidence || 0,
    },
    declaredWinner: abTest.winningVersionIndex !== null ? {
      versionIndex: abTest.winningVersionIndex,
      versionLabel: abTest.versions[abTest.winningVersionIndex]?.versionLabel,
      declaredAt: abTest.winnerDeclaredAt,
      reason: abTest.winnerDeclaredReason,
    } : null,
    elementAnalysis: elementComparison,
  };
}

function compareVersionElements(versions) {
  if (versions.length < 2) return null;

  const comparisons = [];
  const v0 = versions[0].analysis || {};
  const v1 = versions[1].analysis || {};

  // Word count comparison
  if (v0.wordCount && v1.wordCount) {
    const diff = v0.wordCount - v1.wordCount;
    comparisons.push({
      element: "Word Count",
      versionA: v0.wordCount,
      versionB: v1.wordCount,
      difference: Math.abs(diff),
      insight: diff > 50 
        ? `Version A is ${diff} words longer` 
        : diff < -50 
          ? `Version B is ${Math.abs(diff)} words longer`
          : "Similar length",
    });
  }

  // Format comparison
  if (v0.format && v1.format) {
    comparisons.push({
      element: "Format/Style",
      versionA: v0.format,
      versionB: v1.format,
      difference: v0.format !== v1.format ? 1 : 0,
      insight: v0.format !== v1.format 
        ? `Different styles: ${v0.format} vs ${v1.format}`
        : "Same format",
    });
  }

  // Bullet points comparison
  if (v0.bulletPointCount !== undefined && v1.bulletPointCount !== undefined) {
    const diff = v0.bulletPointCount - v1.bulletPointCount;
    comparisons.push({
      element: "Bullet Points",
      versionA: v0.bulletPointCount,
      versionB: v1.bulletPointCount,
      difference: Math.abs(diff),
      insight: diff > 3 
        ? `Version A has ${diff} more bullet points` 
        : diff < -3 
          ? `Version B has ${Math.abs(diff)} more bullet points`
          : "Similar structure",
    });
  }

  // Keywords comparison
  if (v0.keywordsCount !== undefined && v1.keywordsCount !== undefined) {
    const diff = v0.keywordsCount - v1.keywordsCount;
    comparisons.push({
      element: "Action Keywords",
      versionA: v0.keywordsCount,
      versionB: v1.keywordsCount,
      difference: Math.abs(diff),
      insight: diff > 2 
        ? `Version A uses ${diff} more action keywords` 
        : diff < -2 
          ? `Version B uses ${Math.abs(diff)} more action keywords`
          : "Similar keyword usage",
    });
  }

  return {
    comparisons,
    summary: generateElementSummary(comparisons, versions),
  };
}

function generateElementSummary(comparisons, versions) {
  const insights = [];

  // Find the version with better performance
  const v0Rate = versions[0].applicationsAssigned > 0 
    ? (versions[0].interviews / versions[0].applicationsAssigned) * 100 : 0;
  const v1Rate = versions[1].applicationsAssigned > 0 
    ? (versions[1].interviews / versions[1].applicationsAssigned) * 100 : 0;

  const betterVersion = v0Rate >= v1Rate ? 0 : 1;
  const betterLabel = betterVersion === 0 ? "A" : "B";

  comparisons.forEach(c => {
    if (c.difference > 0) {
      const betterValue = betterVersion === 0 ? c.versionA : c.versionB;
      const worseValue = betterVersion === 0 ? c.versionB : c.versionA;
      
      if (c.element === "Word Count") {
        insights.push(`The better performing Version ${betterLabel} has ${betterValue} words`);
      }
      if (c.element === "Bullet Points" && Math.abs(c.versionA - c.versionB) > 2) {
        insights.push(`Version ${betterLabel} uses ${betterValue} bullet points`);
      }
      if (c.element === "Action Keywords" && Math.abs(c.versionA - c.versionB) > 1) {
        insights.push(`Version ${betterLabel} uses ${betterValue} action keywords`);
      }
    }
  });

  return insights.length > 0 ? insights : ["Not enough data to identify differentiating elements"];
}
