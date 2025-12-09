import { Job } from "../models/Job.js";
import { User } from "../models/User.js";
import { SalaryNegotiation } from "../models/SalaryNegotiation.js";
import { SalaryProgression } from "../models/SalaryProgression.js";
import { SalaryBenchmarkCache } from "../models/SalaryBenchmarkCache.js";
import { successResponse, errorResponse, sendResponse, ERROR_CODES } from "../utils/responseFormat.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { fetchBLSSalaryData, formatBLSData } from "../services/blsApiService.js";

/**
 * UC-067: Salary Research and Benchmarking
 * 
 * This controller provides comprehensive salary research and benchmarking features
 * including market analysis, compensation comparisons, and negotiation insights.
 * 
 * Note: The benchmark data (INDUSTRY_BENCHMARKS, LOCATION_MULTIPLIERS, COMPANY_SIZE_MULTIPLIERS)
 * represents industry-standard market data. In a production environment, this would be
 * fetched from external salary APIs (e.g., Glassdoor, Payscale, Bureau of Labor Statistics).
 * These are NOT user-specific data and are NOT stored in localStorage.
 */

// Industry salary benchmarks (simulated market data)
// In production, this would come from external salary APIs (Glassdoor, Payscale, etc.)
const INDUSTRY_BENCHMARKS = {
  "Technology": {
    "Entry": { min: 60000, max: 85000, median: 72500, benefits: 15000 },
    "Mid": { min: 85000, max: 130000, median: 107500, benefits: 25000 },
    "Senior": { min: 130000, max: 200000, median: 165000, benefits: 40000 },
    "Executive": { min: 200000, max: 400000, median: 300000, benefits: 80000 }
  },
  "Finance": {
    "Entry": { min: 55000, max: 75000, median: 65000, benefits: 12000 },
    "Mid": { min: 75000, max: 120000, median: 97500, benefits: 22000 },
    "Senior": { min: 120000, max: 180000, median: 150000, benefits: 35000 },
    "Executive": { min: 180000, max: 350000, median: 265000, benefits: 70000 }
  },
  "Healthcare": {
    "Entry": { min: 50000, max: 70000, median: 60000, benefits: 18000 },
    "Mid": { min: 70000, max: 110000, median: 90000, benefits: 28000 },
    "Senior": { min: 110000, max: 170000, median: 140000, benefits: 42000 },
    "Executive": { min: 170000, max: 320000, median: 245000, benefits: 75000 }
  },
  "Education": {
    "Entry": { min: 40000, max: 55000, median: 47500, benefits: 10000 },
    "Mid": { min: 55000, max: 85000, median: 70000, benefits: 18000 },
    "Senior": { min: 85000, max: 130000, median: 107500, benefits: 28000 },
    "Executive": { min: 130000, max: 220000, median: 175000, benefits: 45000 }
  },
  "Manufacturing": {
    "Entry": { min: 45000, max: 65000, median: 55000, benefits: 12000 },
    "Mid": { min: 65000, max: 100000, median: 82500, benefits: 20000 },
    "Senior": { min: 100000, max: 150000, median: 125000, benefits: 32000 },
    "Executive": { min: 150000, max: 280000, median: 215000, benefits: 60000 }
  },
  "Retail": {
    "Entry": { min: 35000, max: 50000, median: 42500, benefits: 8000 },
    "Mid": { min: 50000, max: 80000, median: 65000, benefits: 15000 },
    "Senior": { min: 80000, max: 125000, median: 102500, benefits: 25000 },
    "Executive": { min: 125000, max: 250000, median: 187500, benefits: 50000 }
  },
  "Marketing": {
    "Entry": { min: 45000, max: 65000, median: 55000, benefits: 10000 },
    "Mid": { min: 65000, max: 100000, median: 82500, benefits: 18000 },
    "Senior": { min: 100000, max: 150000, median: 125000, benefits: 30000 },
    "Executive": { min: 150000, max: 300000, median: 225000, benefits: 65000 }
  },
  "Consulting": {
    "Entry": { min: 60000, max: 80000, median: 70000, benefits: 12000 },
    "Mid": { min: 80000, max: 125000, median: 102500, benefits: 22000 },
    "Senior": { min: 125000, max: 190000, median: 157500, benefits: 38000 },
    "Executive": { min: 190000, max: 380000, median: 285000, benefits: 75000 }
  },
  "Other": {
    "Entry": { min: 45000, max: 65000, median: 55000, benefits: 10000 },
    "Mid": { min: 65000, max: 100000, median: 82500, benefits: 18000 },
    "Senior": { min: 100000, max: 150000, median: 125000, benefits: 30000 },
    "Executive": { min: 150000, max: 280000, median: 215000, benefits: 60000 }
  }
};

// Location multipliers for cost of living adjustments
const LOCATION_MULTIPLIERS = {
  "San Francisco": 1.35,
  "New York": 1.30,
  "Seattle": 1.25,
  "Boston": 1.22,
  "Los Angeles": 1.20,
  "Washington DC": 1.18,
  "Chicago": 1.10,
  "Austin": 1.08,
  "Denver": 1.05,
  "Atlanta": 1.00,
  "Dallas": 0.98,
  "Phoenix": 0.95,
  "Miami": 0.95,
  "Remote": 1.00,
  "Other": 1.00
};

// Company size multipliers
const COMPANY_SIZE_MULTIPLIERS = {
  "Startup (1-50)": 0.85,
  "Small (51-200)": 0.95,
  "Medium (201-1000)": 1.00,
  "Large (1001-10000)": 1.10,
  "Enterprise (10000+)": 1.20
};

/**
 * Helper function to calculate location multiplier
 */
const getLocationMultiplier = (location) => {
  if (!location) return 1.00;
  
  // Check for exact matches
  const exactMatch = Object.keys(LOCATION_MULTIPLIERS).find(key => 
    location.toLowerCase().includes(key.toLowerCase())
  );
  
  if (exactMatch) return LOCATION_MULTIPLIERS[exactMatch];
  
  // Check for state matches (use average for state)
  if (location.toLowerCase().includes('california')) return 1.25;
  if (location.toLowerCase().includes('new york')) return 1.25;
  if (location.toLowerCase().includes('massachusetts')) return 1.20;
  if (location.toLowerCase().includes('washington')) return 1.20;
  if (location.toLowerCase().includes('texas')) return 0.98;
  
  return 1.00; // Default
};

/**
 * Helper function to estimate company size from company name
 */
const estimateCompanySize = (company) => {
  // In production, this would use an external API (Clearbit, LinkedIn, etc.)
  // For now, we'll use simple heuristics
  
  const knownLarge = ['google', 'microsoft', 'amazon', 'apple', 'facebook', 'meta', 
                      'netflix', 'tesla', 'oracle', 'ibm', 'salesforce', 'adobe'];
  const knownMedium = ['stripe', 'shopify', 'square', 'twilio', 'datadog', 'snowflake'];
  
  const companyLower = company.toLowerCase();
  
  if (knownLarge.some(name => companyLower.includes(name))) {
    return "Enterprise (10000+)";
  }
  if (knownMedium.some(name => companyLower.includes(name))) {
    return "Large (1001-10000)";
  }
  
  return "Medium (201-1000)"; // Default to medium
};

/**
 * GET /api/salary/research/:jobId - Get comprehensive salary research for a job
 */
export const getSalaryResearch = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { jobId } = req.params;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  // Get job details
  const job = await Job.findOne({ _id: jobId, userId });
  if (!job) {
    const { response, statusCode } = errorResponse(
      "Job not found or you don't have permission to access it",
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  // Get user profile for experience level
  const user = await User.findOne({ auth0Id: userId });
  const experienceLevel = user?.experienceLevel || "Mid";

  // Get industry benchmarks
  const industry = job.industry || "Other";
  const benchmark = INDUSTRY_BENCHMARKS[industry]?.[experienceLevel] || INDUSTRY_BENCHMARKS["Other"][experienceLevel];

  // Calculate location-adjusted salary
  const locationMultiplier = getLocationMultiplier(job.location);
  const adjustedBenchmark = {
    min: Math.round(benchmark.min * locationMultiplier),
    max: Math.round(benchmark.max * locationMultiplier),
    median: Math.round(benchmark.median * locationMultiplier),
    benefits: Math.round(benchmark.benefits * locationMultiplier)
  };

  // Company size adjustment
  const companySize = estimateCompanySize(job.company);
  const companySizeMultiplier = COMPANY_SIZE_MULTIPLIERS[companySize];
  const companySizeAdjusted = {
    min: Math.round(adjustedBenchmark.min * companySizeMultiplier),
    max: Math.round(adjustedBenchmark.max * companySizeMultiplier),
    median: Math.round(adjustedBenchmark.median * companySizeMultiplier),
    benefits: adjustedBenchmark.benefits
  };

  // Total compensation
  const totalCompensation = {
    min: companySizeAdjusted.min + companySizeAdjusted.benefits,
    max: companySizeAdjusted.max + companySizeAdjusted.benefits,
    median: companySizeAdjusted.median + companySizeAdjusted.benefits
  };

  // Compare with similar positions from user's job tracking
  const similarJobs = await Job.find({
    userId,
    industry: job.industry,
    _id: { $ne: jobId },
    "salary.min": { $exists: true }
  }).limit(20);

  const similarSalaries = similarJobs
    .filter(j => j.salary?.min || j.salary?.max)
    .map(j => ({
      id: j._id.toString(),
      company: j.company,
      title: j.title,
      location: j.location,
      min: j.salary?.min || 0,
      max: j.salary?.max || 0,
      median: j.salary?.min && j.salary?.max ? (j.salary.min + j.salary.max) / 2 : 0
    }));

  // Calculate average from similar tracked jobs
  const trackedAverage = similarSalaries.length > 0 ? {
    min: Math.round(similarSalaries.reduce((sum, s) => sum + s.min, 0) / similarSalaries.length),
    max: Math.round(similarSalaries.reduce((sum, s) => sum + s.max, 0) / similarSalaries.length),
    median: Math.round(similarSalaries.reduce((sum, s) => sum + s.median, 0) / similarSalaries.length)
  } : null;

  // Historical salary trends (simulated - last 5 years)
  const currentYear = new Date().getFullYear();
  const historicalTrends = [];
  for (let i = 4; i >= 0; i--) {
    const year = currentYear - i;
    const growthRate = 0.04; // 4% annual growth
    const yearMultiplier = Math.pow(1 + growthRate, -i);
    historicalTrends.push({
      year,
      min: Math.round(companySizeAdjusted.min * yearMultiplier),
      max: Math.round(companySizeAdjusted.max * yearMultiplier),
      median: Math.round(companySizeAdjusted.median * yearMultiplier)
    });
  }

  // Negotiation recommendations
  const recommendations = generateNegotiationRecommendations(
    job,
    companySizeAdjusted,
    totalCompensation,
    experienceLevel,
    user
  );

  // Compare with user's current compensation (if available)
  const currentJob = user?.employment?.find(emp => emp.isCurrentPosition);
  const currentCompensation = currentJob ? extractCurrentSalary(currentJob) : null;

  const salaryComparison = currentCompensation ? {
    current: currentCompensation,
    target: companySizeAdjusted.median,
    difference: companySizeAdjusted.median - currentCompensation,
    percentageIncrease: ((companySizeAdjusted.median - currentCompensation) / currentCompensation * 100).toFixed(1)
  } : null;

  const { response, statusCode } = successResponse("Salary research retrieved successfully", {
    job: {
      id: job._id,
      title: job.title,
      company: job.company,
      location: job.location,
      industry: job.industry,
      providedSalary: job.salary
    },
    marketData: {
      baseBenchmark: benchmark,
      locationAdjusted: adjustedBenchmark,
      companySizeAdjusted: companySizeAdjusted,
      totalCompensation
    },
    factors: {
      experienceLevel,
      locationMultiplier,
      location: job.location,
      companySize,
      companySizeMultiplier
    },
    similarPositions: {
      count: similarSalaries.length,
      data: similarSalaries,
      average: trackedAverage
    },
    historicalTrends,
    recommendations,
    salaryComparison
  });
  return sendResponse(res, response, statusCode);
});

/**
 * GET /api/salary/compare - Compare salaries across multiple companies/industries
 */
export const compareSalaries = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { jobIds } = req.query;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  if (!jobIds) {
    const { response, statusCode } = errorResponse(
      "Job IDs are required for comparison",
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
    return sendResponse(res, response, statusCode);
  }

  // Filter out empty or invalid IDs
  const jobIdArray = jobIds.split(',').filter(id => id && id.trim().length > 0);
  
  if (jobIdArray.length === 0) {
    const { response, statusCode } = errorResponse(
      "Valid job IDs are required for comparison",
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
    return sendResponse(res, response, statusCode);
  }

  const jobs = await Job.find({
    _id: { $in: jobIdArray },
    userId
  });

  if (jobs.length === 0) {
    const { response, statusCode } = errorResponse(
      "No jobs found for comparison",
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  const user = await User.findOne({ auth0Id: userId });
  const experienceLevel = user?.experienceLevel || "Mid";

  // Compare each job
  const comparisons = jobs.map(job => {
    const industry = job.industry || "Other";
    const benchmark = INDUSTRY_BENCHMARKS[industry]?.[experienceLevel] || INDUSTRY_BENCHMARKS["Other"][experienceLevel];
    
    const locationMultiplier = getLocationMultiplier(job.location);
    const adjustedBenchmark = {
      min: Math.round(benchmark.min * locationMultiplier),
      max: Math.round(benchmark.max * locationMultiplier),
      median: Math.round(benchmark.median * locationMultiplier),
      benefits: Math.round(benchmark.benefits * locationMultiplier)
    };

    const companySize = estimateCompanySize(job.company);
    const companySizeMultiplier = COMPANY_SIZE_MULTIPLIERS[companySize];
    const finalBenchmark = {
      min: Math.round(adjustedBenchmark.min * companySizeMultiplier),
      max: Math.round(adjustedBenchmark.max * companySizeMultiplier),
      median: Math.round(adjustedBenchmark.median * companySizeMultiplier),
      benefits: adjustedBenchmark.benefits
    };

    return {
      jobId: job._id,
      title: job.title,
      company: job.company,
      location: job.location,
      industry: job.industry,
      providedSalary: job.salary,
      estimatedSalary: finalBenchmark,
      totalCompensation: finalBenchmark.median + finalBenchmark.benefits,
      companySize,
      locationMultiplier
    };
  });

  // Sort by total compensation
  comparisons.sort((a, b) => b.totalCompensation - a.totalCompensation);

  const { response, statusCode } = successResponse("Salary comparison retrieved successfully", {
    count: comparisons.length,
    comparisons,
    summary: {
      highest: comparisons[0],
      lowest: comparisons[comparisons.length - 1],
      average: Math.round(comparisons.reduce((sum, c) => sum + c.totalCompensation, 0) / comparisons.length)
    }
  });
  return sendResponse(res, response, statusCode);
});

/**
 * GET /api/salary/benchmarks - Get general salary benchmarks by filters
 */
export const getSalaryBenchmarks = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { industry, experienceLevel, location } = req.query;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const targetIndustry = industry || "Technology";
  const targetLevel = experienceLevel || "Mid";
  const targetLocation = location || "Other";

  const benchmark = INDUSTRY_BENCHMARKS[targetIndustry]?.[targetLevel] || 
                   INDUSTRY_BENCHMARKS["Other"][targetLevel];

  const locationMultiplier = getLocationMultiplier(targetLocation);
  const adjustedBenchmark = {
    min: Math.round(benchmark.min * locationMultiplier),
    max: Math.round(benchmark.max * locationMultiplier),
    median: Math.round(benchmark.median * locationMultiplier),
    benefits: Math.round(benchmark.benefits * locationMultiplier)
  };

  // Get all benchmarks for comparison
  const allBenchmarks = {};
  Object.keys(INDUSTRY_BENCHMARKS).forEach(ind => {
    allBenchmarks[ind] = {};
    Object.keys(INDUSTRY_BENCHMARKS[ind]).forEach(level => {
      const base = INDUSTRY_BENCHMARKS[ind][level];
      allBenchmarks[ind][level] = {
        min: Math.round(base.min * locationMultiplier),
        max: Math.round(base.max * locationMultiplier),
        median: Math.round(base.median * locationMultiplier),
        benefits: Math.round(base.benefits * locationMultiplier)
      };
    });
  });

  const { response, statusCode } = successResponse("Salary benchmarks retrieved successfully", {
    filters: {
      industry: targetIndustry,
      experienceLevel: targetLevel,
      location: targetLocation,
      locationMultiplier
    },
    benchmark: adjustedBenchmark,
    totalCompensation: adjustedBenchmark.median + adjustedBenchmark.benefits,
    allBenchmarks,
    availableIndustries: Object.keys(INDUSTRY_BENCHMARKS),
    availableLevels: ["Entry", "Mid", "Senior", "Executive"],
    topLocations: Object.keys(LOCATION_MULTIPLIERS)
  });
  return sendResponse(res, response, statusCode);
});

/**
 * POST /api/salary/export - Export salary research report
 */
export const exportSalaryReport = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { jobId, format } = req.body;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  if (!jobId) {
    const { response, statusCode } = errorResponse(
      "Job ID is required",
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
    return sendResponse(res, response, statusCode);
  }

  // Get job details
  const job = await Job.findOne({ _id: jobId, userId });
  if (!job) {
    const { response, statusCode } = errorResponse(
      "Job not found or you don't have permission to access it",
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  const user = await User.findOne({ auth0Id: userId });
  const experienceLevel = user?.experienceLevel || "Mid";

  // Get salary research data (reuse logic from getSalaryResearch)
  const industry = job.industry || "Other";
  const benchmark = INDUSTRY_BENCHMARKS[industry]?.[experienceLevel] || INDUSTRY_BENCHMARKS["Other"][experienceLevel];
  
  const locationMultiplier = getLocationMultiplier(job.location);
  const adjustedBenchmark = {
    min: Math.round(benchmark.min * locationMultiplier),
    max: Math.round(benchmark.max * locationMultiplier),
    median: Math.round(benchmark.median * locationMultiplier),
    benefits: Math.round(benchmark.benefits * locationMultiplier)
  };

  const companySize = estimateCompanySize(job.company);
  const companySizeMultiplier = COMPANY_SIZE_MULTIPLIERS[companySize];
  const finalBenchmark = {
    min: Math.round(adjustedBenchmark.min * companySizeMultiplier),
    max: Math.round(adjustedBenchmark.max * companySizeMultiplier),
    median: Math.round(adjustedBenchmark.median * companySizeMultiplier),
    benefits: adjustedBenchmark.benefits
  };

  // Generate report in requested format
  const reportData = {
    generatedAt: new Date().toISOString(),
    job: {
      title: job.title,
      company: job.company,
      location: job.location,
      industry: job.industry
    },
    salaryResearch: {
      baseSalary: benchmark,
      locationAdjusted: adjustedBenchmark,
      finalEstimate: finalBenchmark,
      totalCompensation: finalBenchmark.median + finalBenchmark.benefits
    },
    factors: {
      experienceLevel,
      locationMultiplier,
      companySize,
      companySizeMultiplier
    },
    recommendations: generateNegotiationRecommendations(
      job,
      finalBenchmark,
      { median: finalBenchmark.median + finalBenchmark.benefits },
      experienceLevel,
      user
    )
  };

  const exportFormat = format || 'json';

  if (exportFormat === 'markdown') {
    const markdownReport = generateMarkdownReport(reportData);
    const { response, statusCode } = successResponse("Salary report exported successfully", {
      format: 'markdown',
      content: markdownReport,
      filename: `salary-report-${job.company}-${Date.now()}.md`
    });
    return sendResponse(res, response, statusCode);
  }

  // Default to JSON
  const { response, statusCode } = successResponse("Salary report exported successfully", {
    format: 'json',
    data: reportData,
    filename: `salary-report-${job.company}-${Date.now()}.json`
  });
  return sendResponse(res, response, statusCode);
});

/**
 * Helper: Generate negotiation recommendations
 */
function generateNegotiationRecommendations(job, salaryData, totalComp, experienceLevel, user) {
  const recommendations = [];

  // Base salary positioning
  const targetSalary = salaryData.median;
  const targetRange = {
    conservative: Math.round(targetSalary * 0.95),
    target: targetSalary,
    optimistic: Math.round(targetSalary * 1.10)
  };

  recommendations.push({
    category: "Target Salary Range",
    recommendation: `Based on market data, aim for a salary between $${targetRange.conservative.toLocaleString()} and $${targetRange.optimistic.toLocaleString()}`,
    confidence: "High",
    rationale: `Median for ${experienceLevel} level in ${job.industry || 'this industry'} is $${targetSalary.toLocaleString()}`
  });

  // Benefits negotiation
  if (salaryData.benefits > 0) {
    recommendations.push({
      category: "Total Compensation",
      recommendation: `Don't forget to negotiate benefits! Average benefits package is worth $${salaryData.benefits.toLocaleString()} annually`,
      confidence: "High",
      rationale: "Total compensation includes base salary, bonuses, equity, health insurance, retirement, and other benefits"
    });
  }

  // Location-based advice
  const locationMultiplier = getLocationMultiplier(job.location);
  if (locationMultiplier > 1.15) {
    recommendations.push({
      category: "Cost of Living",
      recommendation: `${job.location} has ${Math.round((locationMultiplier - 1) * 100)}% higher cost of living. Request relocation assistance or remote work flexibility`,
      confidence: "Medium",
      rationale: "High cost of living areas typically offer higher compensation and relocation packages"
    });
  }

  // Experience-based strategy
  if (experienceLevel === "Entry") {
    recommendations.push({
      category: "Negotiation Strategy",
      recommendation: "Focus on growth opportunities, mentorship, and professional development budget in addition to salary",
      confidence: "High",
      rationale: "Early career professionals should prioritize learning and career growth opportunities"
    });
  } else if (experienceLevel === "Senior" || experienceLevel === "Executive") {
    recommendations.push({
      category: "Negotiation Strategy",
      recommendation: "Negotiate equity/stock options, performance bonuses, and executive benefits (car allowance, club memberships, etc.)",
      confidence: "High",
      rationale: "Senior positions typically have significant variable compensation components"
    });
  }

  // Timing advice
  recommendations.push({
    category: "Timing",
    recommendation: "Best time to negotiate is after receiving a written offer but before accepting",
    confidence: "High",
    rationale: "You have maximum leverage once they've decided you're the candidate, but haven't finalized terms"
  });

  // Market conditions
  recommendations.push({
    category: "Market Positioning",
    recommendation: `The ${job.industry || 'target'} industry is competitive. Highlight unique skills and relevant experience`,
    confidence: "Medium",
    rationale: "Demonstrating unique value justifies higher compensation"
  });

  return recommendations;
}

/**
 * Helper: Extract current salary from employment history
 */
function extractCurrentSalary(currentJob) {
  // Return the salary field if it exists and the job is current
  if (currentJob?.salary && currentJob?.isCurrentPosition) {
    return currentJob.salary;
  }
  return null;
}

/**
 * Helper: Generate markdown report
 */
function generateMarkdownReport(reportData) {
  const { job, salaryResearch, factors, recommendations } = reportData;
  
  let markdown = `# Salary Research Report\n\n`;
  markdown += `**Generated:** ${new Date(reportData.generatedAt).toLocaleDateString()}\n\n`;
  
  markdown += `## Position Details\n\n`;
  markdown += `- **Title:** ${job.title}\n`;
  markdown += `- **Company:** ${job.company}\n`;
  markdown += `- **Location:** ${job.location}\n`;
  markdown += `- **Industry:** ${job.industry}\n\n`;
  
  markdown += `## Salary Analysis\n\n`;
  markdown += `### Market Benchmarks\n\n`;
  markdown += `| Metric | Amount |\n`;
  markdown += `|--------|--------|\n`;
  markdown += `| Minimum | $${salaryResearch.finalEstimate.min.toLocaleString()} |\n`;
  markdown += `| Median | $${salaryResearch.finalEstimate.median.toLocaleString()} |\n`;
  markdown += `| Maximum | $${salaryResearch.finalEstimate.max.toLocaleString()} |\n`;
  markdown += `| Benefits Value | $${salaryResearch.finalEstimate.benefits.toLocaleString()} |\n`;
  markdown += `| **Total Compensation** | **$${salaryResearch.totalCompensation.toLocaleString()}** |\n\n`;
  
  markdown += `### Adjustment Factors\n\n`;
  markdown += `- **Experience Level:** ${factors.experienceLevel}\n`;
  markdown += `- **Location Multiplier:** ${factors.locationMultiplier}x\n`;
  markdown += `- **Company Size:** ${factors.companySize}\n`;
  markdown += `- **Company Size Multiplier:** ${factors.companySizeMultiplier}x\n\n`;
  
  markdown += `## Negotiation Recommendations\n\n`;
  recommendations.forEach((rec, idx) => {
    markdown += `### ${idx + 1}. ${rec.category}\n\n`;
    markdown += `**Recommendation:** ${rec.recommendation}\n\n`;
    markdown += `**Confidence:** ${rec.confidence}\n\n`;
    markdown += `**Rationale:** ${rec.rationale}\n\n`;
  });
  
  markdown += `---\n\n`;
  markdown += `*This report is based on market data and industry benchmarks. Actual salaries may vary based on specific circumstances.*\n`;
  
  return markdown;
}

/**
 * ========================================================================
 * UC-083: SALARY NEGOTIATION PREPARATION ENDPOINTS
 * ========================================================================
 */

/**
 * POST /api/salary/negotiation - Create new negotiation preparation
 */
export const createNegotiation = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { jobId, targetSalary, minimumAcceptable, idealSalary } = req.body;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  if (!jobId || !targetSalary || !minimumAcceptable) {
    const { response, statusCode } = errorResponse(
      "Missing required fields: jobId, targetSalary, and minimumAcceptable are required",
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
    return sendResponse(res, response, statusCode);
  }

  // Get job details
  const job = await Job.findOne({ _id: jobId, userId });
  if (!job) {
    const { response, statusCode } = errorResponse(
      "Job not found or you don't have permission to access it",
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  // Get market research data
  const user = await User.findOne({ auth0Id: userId });
  const experienceLevel = user?.experienceLevel || "Mid";
  const industry = job.industry || "Other";
  const benchmark = INDUSTRY_BENCHMARKS[industry]?.[experienceLevel] || INDUSTRY_BENCHMARKS["Other"][experienceLevel];
  
  const locationMultiplier = getLocationMultiplier(job.location);
  const companySizeMultiplier = COMPANY_SIZE_MULTIPLIERS[estimateCompanySize(job.company)];
  
  const locationAdjusted = Math.round(benchmark.median * locationMultiplier);
  const finalAdjusted = Math.round(locationAdjusted * companySizeMultiplier);

  // Create negotiation
  const negotiation = new SalaryNegotiation({
    userId,
    jobId,
    jobTitle: job.title,
    company: job.company,
    targetSalary,
    minimumAcceptable,
    idealSalary: idealSalary || Math.round(targetSalary * 1.15),
    marketResearch: {
      industryMedian: benchmark.median,
      locationAdjusted,
      experienceLevel,
      researched: true
    }
  });

  await negotiation.save();

  const { response, statusCode } = successResponse("Negotiation preparation created successfully", {
    negotiation
  });
  return sendResponse(res, response, statusCode);
});

/**
 * GET /api/salary/negotiation/:jobId - Get negotiation preparation for a job
 */
export const getNegotiation = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { jobId } = req.params;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const negotiation = await SalaryNegotiation.findOne({ userId, jobId }).populate('jobId');
  
  if (!negotiation) {
    const { response, statusCode } = errorResponse(
      "Negotiation preparation not found",
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  const { response, statusCode } = successResponse("Negotiation preparation retrieved successfully", {
    negotiation
  });
  return sendResponse(res, response, statusCode);
});

/**
 * GET /api/salary/negotiations - Get all negotiations for user
 */
export const getAllNegotiations = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const negotiations = await SalaryNegotiation.find({ userId })
    .populate('jobId')
    .sort({ createdAt: -1 });

  const { response, statusCode } = successResponse("Negotiations retrieved successfully", {
    count: negotiations.length,
    negotiations
  });
  return sendResponse(res, response, statusCode);
});

/**
 * POST /api/salary/negotiation/:id/talking-points - Generate talking points
 */
export const generateTalkingPoints = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { id } = req.params;
  const { achievements, skills, education, certifications } = req.body;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const negotiation = await SalaryNegotiation.findOne({ _id: id, userId });
  if (!negotiation) {
    const { response, statusCode } = errorResponse(
      "Negotiation preparation not found",
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  const user = await User.findOne({ auth0Id: userId });
  
  // Generate talking points based on user data
  const talkingPoints = [];

  // Achievement-based talking points
  if (achievements && achievements.length > 0) {
    achievements.forEach(achievement => {
      talkingPoints.push({
        category: 'Achievement',
        description: achievement.description || achievement,
        evidence: achievement.evidence || achievement.metrics || '',
        strength: achievement.impact === 'High' || achievement.metrics ? 'High' : 'Medium'
      });
    });
  }

  // Skills-based talking points
  if (skills && skills.length > 0) {
    const advancedSkills = skills.filter(s => s.level === 'Advanced' || s.level === 'Expert');
    advancedSkills.forEach(skill => {
      talkingPoints.push({
        category: 'Unique Skills',
        description: `Expert-level proficiency in ${skill.name}`,
        evidence: `${skill.level} level - ${skill.category}`,
        strength: skill.level === 'Expert' ? 'High' : 'Medium'
      });
    });
  }

  // Education-based talking points
  if (education && education.length > 0) {
    education.forEach(edu => {
      const gpaNote = edu.gpa && edu.gpa >= 3.5 ? ` with ${edu.gpa} GPA` : '';
      talkingPoints.push({
        category: 'Education',
        description: `${edu.degree} in ${edu.fieldOfStudy} from ${edu.institution}${gpaNote}`,
        evidence: edu.honors || '',
        strength: edu.gpa >= 3.8 || edu.honors ? 'High' : 'Medium'
      });
    });
  }

  // Certification-based talking points
  if (certifications && certifications.length > 0) {
    certifications.forEach(cert => {
      talkingPoints.push({
        category: 'Certifications',
        description: `${cert.name} certification`,
        evidence: cert.issuingOrganization || '',
        strength: 'Medium'
      });
    });
  }

  // Market value talking points
  if (negotiation.marketResearch?.locationAdjusted) {
    talkingPoints.push({
      category: 'Market Value',
      description: `Market research shows comparable positions pay $${negotiation.marketResearch.locationAdjusted.toLocaleString()} for ${negotiation.marketResearch.experienceLevel} level`,
      evidence: 'Based on industry benchmarks and location adjustment',
      strength: 'High'
    });
  }

  // Add experience from employment history
  if (user?.employment && user.employment.length > 0) {
    const totalYears = calculateTotalExperience(user.employment);
    if (totalYears > 0) {
      talkingPoints.push({
        category: 'Impact',
        description: `${totalYears} years of progressive experience in the field`,
        evidence: `${user.employment.length} positions demonstrating career growth`,
        strength: totalYears >= 5 ? 'High' : 'Medium'
      });
    }
  }

  // Add talking points to negotiation
  negotiation.talkingPoints.push(...talkingPoints);
  await negotiation.save();

  const { response, statusCode } = successResponse("Talking points generated successfully", {
    talkingPoints,
    count: talkingPoints.length
  });
  return sendResponse(res, response, statusCode);
});

/**
 * POST /api/salary/negotiation/:id/script - Generate negotiation script
 */
export const generateNegotiationScript = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { id } = req.params;
  const { scenario, customScenario } = req.body;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const negotiation = await SalaryNegotiation.findOne({ _id: id, userId });
  if (!negotiation) {
    const { response, statusCode } = errorResponse(
      "Negotiation preparation not found",
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  // Generate script based on scenario
  const script = generateScriptForScenario(scenario, customScenario, negotiation);
  
  negotiation.scripts.push(script);
  await negotiation.save();

  const { response, statusCode } = successResponse("Negotiation script generated successfully", {
    script
  });
  return sendResponse(res, response, statusCode);
});

/**
 * POST /api/salary/negotiation/:id/offer - Add offer to negotiation
 */
export const addOffer = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { id } = req.params;
  const offerData = req.body;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const negotiation = await SalaryNegotiation.findOne({ _id: id, userId });
  if (!negotiation) {
    const { response, statusCode } = errorResponse(
      "Negotiation preparation not found",
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  // Calculate total compensation if not provided
  if (!offerData.totalCompensation) {
    offerData.totalCompensation = 
      (offerData.baseSalary || 0) + 
      (offerData.signingBonus || 0) + 
      (offerData.performanceBonus || 0);
  }

  await negotiation.addOffer(offerData);

  const { response, statusCode } = successResponse("Offer added successfully", {
    offer: offerData,
    negotiationStatus: negotiation.status
  });
  return sendResponse(res, response, statusCode);
});

/**
 * POST /api/salary/negotiation/:id/counteroffer - Evaluate and generate counteroffer
 */
export const evaluateCounteroffer = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { id } = req.params;
  const { currentOffer } = req.body;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const negotiation = await SalaryNegotiation.findOne({ _id: id, userId });
  if (!negotiation) {
    const { response, statusCode } = errorResponse(
      "Negotiation preparation not found",
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  // Evaluate current offer
  const evaluation = {
    meetsMinimum: currentOffer.baseSalary >= negotiation.minimumAcceptable,
    meetsTarget: currentOffer.baseSalary >= negotiation.targetSalary,
    meetsIdeal: currentOffer.baseSalary >= negotiation.idealSalary,
    gapFromTarget: negotiation.targetSalary - currentOffer.baseSalary,
    gapFromIdeal: negotiation.idealSalary - currentOffer.baseSalary,
    recommendation: ''
  };

  // Generate recommendation
  if (evaluation.meetsIdeal) {
    evaluation.recommendation = 'Accept';
    evaluation.reasoning = 'This offer meets or exceeds your ideal salary. This is an excellent offer.';
  } else if (evaluation.meetsTarget) {
    evaluation.recommendation = 'Consider Accepting or Minor Counter';
    evaluation.reasoning = `This offer meets your target salary. Consider negotiating for additional benefits or a slightly higher salary (around $${Math.round(negotiation.idealSalary).toLocaleString()}).`;
  } else if (evaluation.meetsMinimum) {
    evaluation.recommendation = 'Counter Offer Recommended';
    evaluation.reasoning = `This offer is above your minimum but below your target. Counter with $${Math.round(negotiation.targetSalary).toLocaleString()} and be prepared to settle around $${Math.round((currentOffer.baseSalary + negotiation.targetSalary) / 2).toLocaleString()}.`;
  } else {
    evaluation.recommendation = 'Counter Offer Strongly Recommended';
    evaluation.reasoning = `This offer is below your minimum acceptable salary. Counter with $${Math.round(negotiation.targetSalary).toLocaleString()} and emphasize your value and market research.`;
  }

  // Generate counteroffer suggestions
  const counterofferSuggestions = [];

  // Salary counteroffer
  if (!evaluation.meetsTarget) {
    const counterSalary = Math.min(
      negotiation.idealSalary,
      currentOffer.baseSalary + Math.round(evaluation.gapFromTarget * 1.2)
    );
    
    counterofferSuggestions.push({
      type: 'Salary',
      current: currentOffer.baseSalary,
      proposed: counterSalary,
      justification: `Based on market research and my ${negotiation.marketResearch.experienceLevel} level experience, comparable positions pay $${negotiation.marketResearch.locationAdjusted?.toLocaleString() || 'competitive rates'}.`
    });
  }

  // Benefits alternatives
  if (evaluation.gapFromTarget > 0) {
    const benefitsGap = Math.round(evaluation.gapFromTarget * 0.7);
    counterofferSuggestions.push({
      type: 'Sign-on Bonus',
      current: currentOffer.signingBonus || 0,
      proposed: (currentOffer.signingBonus || 0) + Math.min(benefitsGap, 20000),
      justification: 'A sign-on bonus helps offset the gap in base salary expectations.'
    });

    counterofferSuggestions.push({
      type: 'Performance Bonus',
      current: currentOffer.performanceBonus || 0,
      proposed: Math.round(currentOffer.baseSalary * 0.15),
      justification: 'A performance-based bonus aligns my compensation with value delivered to the company.'
    });

    counterofferSuggestions.push({
      type: 'Additional PTO',
      current: currentOffer.benefits?.paidTimeOff || 0,
      proposed: (currentOffer.benefits?.paidTimeOff || 15) + 5,
      justification: 'Additional paid time off enhances work-life balance and overall compensation value.'
    });

    if (!currentOffer.benefits?.remoteWork || currentOffer.benefits.remoteWork === 'None') {
      counterofferSuggestions.push({
        type: 'Remote Work',
        current: currentOffer.benefits?.remoteWork || 'None',
        proposed: 'Hybrid',
        justification: 'Flexible work arrangements improve productivity and reduce commuting costs.'
      });
    }
  }

  const { response, statusCode } = successResponse("Counteroffer evaluation completed", {
    evaluation,
    counterofferSuggestions,
    negotiationGoals: {
      minimum: negotiation.minimumAcceptable,
      target: negotiation.targetSalary,
      ideal: negotiation.idealSalary
    }
  });
  return sendResponse(res, response, statusCode);
});

/**
 * POST /api/salary/negotiation/:id/confidence-exercise - Add confidence exercise
 */
export const addConfidenceExercise = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { id } = req.params;
  const { exerciseType, customDescription } = req.body;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const negotiation = await SalaryNegotiation.findOne({ _id: id, userId });
  if (!negotiation) {
    const { response, statusCode } = errorResponse(
      "Negotiation preparation not found",
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  // Generate exercises based on type
  const exercises = generateConfidenceExercises(exerciseType, customDescription, negotiation);
  
  negotiation.confidenceExercises.push(...exercises);
  await negotiation.save();

  const { response, statusCode } = successResponse("Confidence exercises added successfully", {
    exercises,
    count: exercises.length
  });
  return sendResponse(res, response, statusCode);
});

/**
 * PUT /api/salary/negotiation/:id/exercise/:exerciseId - Mark exercise as completed
 */
export const completeExercise = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { id, exerciseId } = req.params;
  const { notes } = req.body;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const negotiation = await SalaryNegotiation.findOne({ _id: id, userId });
  if (!negotiation) {
    const { response, statusCode } = errorResponse(
      "Negotiation preparation not found",
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  const exercise = negotiation.confidenceExercises.id(exerciseId);
  if (!exercise) {
    const { response, statusCode } = errorResponse(
      "Exercise not found",
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  exercise.completed = true;
  exercise.completedDate = new Date();
  exercise.notes = notes || '';
  
  await negotiation.save();

  const { response, statusCode } = successResponse("Exercise marked as completed", {
    exercise
  });
  return sendResponse(res, response, statusCode);
});

/**
 * POST /api/salary/negotiation/:id/complete - Complete negotiation with outcome
 */
export const completeNegotiation = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { id } = req.params;
  const outcomeData = req.body;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const negotiation = await SalaryNegotiation.findOne({ _id: id, userId });
  if (!negotiation) {
    const { response, statusCode } = errorResponse(
      "Negotiation preparation not found",
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  await negotiation.completeNegotiation(outcomeData);

  const { response, statusCode } = successResponse("Negotiation completed successfully", {
    outcome: negotiation.outcome,
    status: negotiation.status,
    summary: {
      increaseFromInitial: negotiation.outcome.increaseFromInitial,
      metTarget: negotiation.outcome.compareToTarget.metTarget,
      satisfaction: negotiation.outcome.satisfaction
    }
  });
  return sendResponse(res, response, statusCode);
});

/**
 * GET /api/salary/negotiation/:id/timing - Get timing strategy recommendations
 */
export const getTimingStrategy = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { id } = req.params;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const negotiation = await SalaryNegotiation.findOne({ _id: id, userId });
  if (!negotiation) {
    const { response, statusCode } = errorResponse(
      "Negotiation preparation not found",
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  const timingStrategies = [
    {
      phase: 'Before Offer',
      strategy: 'Research and Preparation',
      timing: 'As soon as you start interviewing',
      actions: [
        'Research market salaries thoroughly',
        'Document your achievements and value proposition',
        'Practice negotiation scenarios',
        'Determine your target, ideal, and minimum acceptable salaries'
      ],
      rationale: 'Being prepared early gives you confidence and prevents rushed decisions.'
    },
    {
      phase: 'After Initial Offer',
      strategy: 'Strategic Pause',
      timing: '24-48 hours after receiving offer',
      actions: [
        'Thank them for the offer enthusiastically',
        'Request time to review (24-48 hours is reasonable)',
        'Analyze the complete compensation package',
        'Prepare your counteroffer with specific numbers'
      ],
      rationale: 'Taking time shows professionalism and prevents accepting too quickly. Employers expect some deliberation.'
    },
    {
      phase: 'Counteroffer',
      strategy: 'Professional Counter',
      timing: 'Within 2-3 days of initial offer',
      actions: [
        'Schedule a call or in-person meeting if possible',
        'Present your counteroffer with confidence and data',
        'Use your prepared talking points',
        'Be specific about numbers and reasoning'
      ],
      rationale: 'Prompt response shows interest while your preparation demonstrates professionalism and value.'
    },
    {
      phase: 'Negotiation Discussion',
      strategy: 'Collaborative Dialogue',
      timing: 'During the negotiation conversation',
      actions: [
        'Listen actively to their constraints and priorities',
        'Be flexible on lower-priority items',
        'Focus on total compensation, not just base salary',
        'Use "we" language to show partnership mindset'
      ],
      rationale: 'Collaborative approach builds goodwill and often leads to creative solutions that work for both parties.'
    },
    {
      phase: 'Final Decision',
      strategy: 'Decisive Conclusion',
      timing: 'Within 5-7 days of initial offer',
      actions: [
        'Make your final decision within their timeline',
        'If accepting, express genuine enthusiasm',
        'If declining, remain professional and grateful',
        'Request written confirmation of final terms'
      ],
      rationale: 'Timely decisions maintain positive relationships regardless of outcome. Extended delays can harm the relationship.'
    }
  ];

  // Add specific deadline recommendations if there's an offer
  const latestOffer = negotiation.offers?.[negotiation.offers.length - 1];
  let deadlineAdvice = null;
  
  if (latestOffer?.responseDeadline) {
    const daysUntilDeadline = Math.ceil(
      (new Date(latestOffer.responseDeadline) - new Date()) / (1000 * 60 * 60 * 24)
    );
    
    deadlineAdvice = {
      deadline: latestOffer.responseDeadline,
      daysRemaining: daysUntilDeadline,
      recommendation: daysUntilDeadline > 5 
        ? 'You have adequate time to negotiate. Use 2-3 days for careful consideration.'
        : daysUntilDeadline > 2
        ? 'Timeline is moderate. Counter within 1-2 days to allow for discussion.'
        : 'Timeline is tight. Counter promptly (within 24 hours) or request a brief extension if needed.',
      urgency: daysUntilDeadline > 5 ? 'Low' : daysUntilDeadline > 2 ? 'Medium' : 'High'
    };
  }

  const { response, statusCode } = successResponse("Timing strategy retrieved successfully", {
    strategies: timingStrategies,
    deadlineAdvice,
    generalTips: [
      'Never negotiate via email if you can have a conversation',
      'Best time for negotiation calls: Tuesday-Thursday, 10am-3pm',
      'Avoid negotiating on Fridays or before holidays when decisions may be rushed',
      'If they say "this is our final offer," ask about benefits or other compensation',
      'Always get final offer in writing before accepting'
    ]
  });
  return sendResponse(res, response, statusCode);
});

/**
 * Helper: Generate script for specific scenario
 */
function generateScriptForScenario(scenario, customScenario, negotiation) {
  const scripts = {
    'Initial Offer Too Low': {
      opening: `Thank you so much for the offer for the ${negotiation.jobTitle} position. I'm very excited about the opportunity to join ${negotiation.company} and contribute to the team. I've given the offer careful consideration, and I'd like to discuss the compensation package.`,
      keyPoints: [
        `Based on my research of market rates for ${negotiation.jobTitle} positions in this location, the typical range is $${negotiation.marketResearch.locationAdjusted?.toLocaleString() || 'X'}`,
        `With my ${negotiation.marketResearch.experienceLevel} level experience and proven track record of [specific achievement], I believe a salary of $${negotiation.targetSalary.toLocaleString()} better reflects the value I'll bring`,
        `I'm confident I can make an immediate impact in areas such as [mention 2-3 key skills/achievements]`
      ],
      closingStatement: `I'm very interested in joining ${negotiation.company}, and I believe this adjusted compensation reflects both market rates and the value I'll bring to the role. Is there flexibility to move closer to $${negotiation.targetSalary.toLocaleString()}?`,
      alternativeResponses: [
        {
          situation: 'If they mention budget constraints',
          response: 'I understand budget considerations. Would it be possible to discuss alternative compensation such as a sign-on bonus, performance bonuses, or additional benefits that might bridge this gap?'
        },
        {
          situation: 'If they ask for your current salary',
          response: 'I\'d prefer to focus on the value I can bring to this role rather than my current compensation. Based on my research and the responsibilities of this position, I believe $' + negotiation.targetSalary.toLocaleString() + ' is appropriate.'
        }
      ]
    },
    'Benefits Negotiation': {
      opening: `I appreciate the offer and the base salary is competitive. I'd like to discuss the benefits package to ensure the total compensation aligns with my needs and the market standard.`,
      keyPoints: [
        'Additional PTO days for work-life balance',
        'Flexible work arrangements (remote/hybrid options)',
        'Professional development budget for continued learning',
        'Enhanced retirement benefits or 401(k) matching'
      ],
      closingStatement: `These benefits would significantly enhance the overall value of the package and help me be most effective in the role. Which of these might be possible to include?`,
      alternativeResponses: [
        {
          situation: 'If benefits are fixed',
          response: 'I understand the benefits structure is standardized. Would it be possible to add a sign-on bonus or increase the base salary to offset these considerations?'
        }
      ]
    },
    'Equity Discussion': {
      opening: `I'm excited about ${negotiation.company}'s growth potential and would like to discuss including equity as part of my compensation package.`,
      keyPoints: [
        'Equity aligns my success with the company\'s long-term growth',
        'This is standard for this role at similar companies',
        'I\'m committed to contributing to the company\'s success over the long term'
      ],
      closingStatement: `Would it be possible to include stock options or RSUs as part of the offer? This would demonstrate a mutual investment in the company's future.`,
      alternativeResponses: []
    },
    'Remote Work': {
      opening: `I'm enthusiastic about the role and want to discuss the possibility of remote or hybrid work arrangements.`,
      keyPoints: [
        'Remote work has proven to increase my productivity',
        'This arrangement would eliminate commute time, allowing me to focus more on deliverables',
        'I have a proven track record of successful remote collaboration'
      ],
      closingStatement: `Would the team be open to a hybrid arrangement, perhaps 2-3 days remote per week? I believe this flexibility would allow me to deliver my best work.`,
      alternativeResponses: []
    },
    'Sign-on Bonus': {
      opening: `I'm very interested in the position. To make the transition, I'd like to discuss including a sign-on bonus.`,
      keyPoints: [
        'A sign-on bonus would help offset relocation costs / transition expenses',
        'This is common practice for positions at this level',
        'It would demonstrate the company\'s commitment to bringing me aboard'
      ],
      closingStatement: `Would it be possible to include a sign-on bonus of $${Math.round(negotiation.targetSalary * 0.1).toLocaleString()} to help facilitate this transition?`,
      alternativeResponses: []
    },
    'Performance Review': {
      opening: `Thank you for meeting with me. I'd like to discuss my compensation in light of my performance and contributions over the past [time period].`,
      keyPoints: [
        'I\'ve successfully [specific achievement #1]',
        'I\'ve taken on additional responsibilities including [examples]',
        'My contributions have resulted in [quantifiable impact]',
        'Market research shows my current salary is below the median for my role and experience'
      ],
      closingStatement: `Based on my performance and market research, I believe a salary adjustment to $${negotiation.targetSalary.toLocaleString()} is appropriate. Can we discuss making this change?`,
      alternativeResponses: []
    },
    'Promotion': {
      opening: `I'm honored to be considered for the ${negotiation.jobTitle} position. I'd like to discuss the compensation for this new role.`,
      keyPoints: [
        'This promotion reflects increased responsibilities and scope',
        'Market research indicates the typical range for this role is $X-$Y',
        'I\'ve already demonstrated capability in this role through [examples]',
        'This adjustment would align my compensation with the new responsibilities'
      ],
      closingStatement: `Given the expanded role and market data, I believe $${negotiation.targetSalary.toLocaleString()} is appropriate for this position. Is this something we can work towards?`,
      alternativeResponses: []
    },
    'Counter Offer': {
      opening: `I want to be transparent with you. I've received another offer, but I'm genuinely interested in staying with ${negotiation.company} because [specific reasons].`,
      keyPoints: [
        'The other offer includes [competitive elements]',
        'I value the work we\'re doing here and my relationships with the team',
        'I\'d like to see if we can adjust my compensation to be more competitive',
        'I believe my contributions justify this adjustment'
      ],
      closingStatement: `I'd really like to continue growing here. Is there flexibility to match or come closer to the competitive offer? I'm happy to discuss the details.`,
      alternativeResponses: [
        {
          situation: 'If they ask to see the other offer',
          response: 'I prefer to keep that confidential, but I can share that the total compensation is around $' + negotiation.targetSalary.toLocaleString() + '. My preference is to stay here if we can find common ground.'
        }
      ]
    },
    'Custom': {
      opening: customScenario || `Thank you for the offer. I'd like to discuss the compensation package.`,
      keyPoints: [
        'Present your key value proposition',
        'Reference market research and data',
        'Highlight specific achievements and skills'
      ],
      closingStatement: `I'm very interested in this opportunity and believe we can find terms that work for both of us. Can we discuss some adjustments?`,
      alternativeResponses: []
    }
  };

  const selectedScript = scripts[scenario] || scripts['Custom'];
  
  return {
    scenario,
    customScenario: scenario === 'Custom' ? customScenario : undefined,
    ...selectedScript
  };
}

/**
 * Helper: Generate confidence-building exercises
 */
function generateConfidenceExercises(exerciseType, customDescription, negotiation) {
  const exercises = [];

  if (!exerciseType || exerciseType === 'Power Posing') {
    exercises.push({
      exerciseType: 'Power Posing',
      description: `Before your negotiation, practice power posing for 2 minutes: Stand tall with your hands on your hips or arms raised in a V-shape. Research shows this can increase confidence and reduce stress hormones.`
    });
  }

  if (!exerciseType || exerciseType === 'Visualization') {
    exercises.push({
      exerciseType: 'Visualization',
      description: `Close your eyes and visualize the negotiation going well. See yourself speaking confidently, the hiring manager nodding in agreement, and reaching a positive outcome. Visualize how you'll feel when you successfully negotiate your target salary of $${negotiation.targetSalary.toLocaleString()}.`
    });
  }

  if (!exerciseType || exerciseType === 'Affirmations') {
    exercises.push({
      exerciseType: 'Affirmations',
      description: `Repeat these affirmations: "I am worth $${negotiation.targetSalary.toLocaleString()}.", "My skills and experience bring significant value.", "I negotiate from a position of strength and collaboration.", "I deserve to be compensated fairly for my work." Say each one 3 times aloud before your negotiation.`
    });
  }

  if (!exerciseType || exerciseType === 'Mock Negotiation') {
    exercises.push({
      exerciseType: 'Mock Negotiation',
      description: `Practice your negotiation script with a friend, mentor, or family member. Have them play the role of the hiring manager and give you pushback on your requests. This helps you prepare responses and build confidence in handling objections.`
    });
  }

  if (!exerciseType || exerciseType === 'Research Review') {
    exercises.push({
      exerciseType: 'Research Review',
      description: `Review your market research one more time. Remind yourself that comparable positions pay around $${negotiation.marketResearch.locationAdjusted?.toLocaleString() || negotiation.targetSalary.toLocaleString()}. Your request is backed by data, not just wishes. Write down 3 data points that support your target salary.`
    });
  }

  if (!exerciseType || exerciseType === 'Value Reflection') {
    exercises.push({
      exerciseType: 'Value Reflection',
      description: `Write down your 3-5 most significant achievements that demonstrate your value. For each one, note the quantifiable impact it had. This exercise reminds you of your worth and gives you concrete examples to reference during negotiation.`
    });
  }

  if (exerciseType === 'Custom' && customDescription) {
    exercises.push({
      exerciseType: 'Custom',
      description: customDescription
    });
  }

  return exercises;
}

/**
 * Helper: Calculate total years of experience
 */
function calculateTotalExperience(employment) {
  if (!employment || employment.length === 0) return 0;
  
  let totalMonths = 0;
  employment.forEach(job => {
    const start = new Date(job.startDate);
    const end = job.endDate ? new Date(job.endDate) : new Date();
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    totalMonths += months;
  });
  
  return Math.round(totalMonths / 12);
}

/**
 * ========================================================================
 * UC-100: SALARY PROGRESSION AND MARKET POSITIONING ENDPOINTS
 * ========================================================================
 */

/**
 * POST /api/salary/progression/offer - Track a salary offer
 */
export const trackSalaryOffer = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const offerData = req.body;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  // Validate required fields
  if (!offerData.jobId || !offerData.jobTitle || !offerData.company || !offerData.baseSalary) {
    const { response, statusCode } = errorResponse(
      "Missing required fields: jobId, jobTitle, company, and baseSalary are required",
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
    return sendResponse(res, response, statusCode);
  }

  // Calculate total compensation if not provided
  if (!offerData.totalCompensation) {
    offerData.totalCompensation = 
      (offerData.baseSalary || 0) + 
      (offerData.signingBonus || 0) + 
      (offerData.performanceBonus || 0) + 
      (offerData.equityValue || 0) + 
      (offerData.benefitsValue || 0);
  }

  // Calculate negotiation metrics if negotiated
  if (offerData.wasNegotiated && offerData.initialOffer && offerData.finalOffer) {
    offerData.increaseFromInitial = {
      amount: offerData.finalOffer - offerData.initialOffer,
      percentage: ((offerData.finalOffer - offerData.initialOffer) / offerData.initialOffer * 100).toFixed(2)
    };
  }

  // Calculate market position if market data provided
  if (offerData.marketMedian) {
    const diffFromMedian = offerData.baseSalary - offerData.marketMedian;
    const percentDiff = (diffFromMedian / offerData.marketMedian) * 100;
    
    if (percentDiff < -10) {
      offerData.marketPosition = 'Below Market';
    } else if (percentDiff > 10) {
      offerData.marketPosition = 'Above Market';
    } else {
      offerData.marketPosition = 'At Market';
    }
    
    // Calculate percentile rank (simplified estimation)
    offerData.percentileRank = Math.min(100, Math.max(0, 50 + (percentDiff / 2)));
  }

  // Get or create progression record
  let progression = await SalaryProgression.findOne({ userId });
  if (!progression) {
    progression = new SalaryProgression({ 
      userId,
      salaryOffers: [],
      careerMilestones: [],
      negotiationHistory: [],
      marketPositioning: [],
      compensationHistory: [],
      benefitsTrends: [],
      advancementRecommendations: []
    });
  }

  // Add the offer
  await progression.addSalaryOffer(offerData);

  // Add to compensation history if accepted
  if (offerData.offerStatus === 'Accepted') {
    await progression.addCompensationSnapshot({
      date: offerData.offerDate || new Date(),
      baseSalary: offerData.baseSalary,
      bonuses: (offerData.signingBonus || 0) + (offerData.performanceBonus || 0),
      equity: offerData.equityValue || 0,
      benefits: offerData.benefitsValue || 0,
      totalCompensation: offerData.totalCompensation,
      source: 'Job Offer',
      company: offerData.company,
      title: offerData.jobTitle
    });
  }

  const { response, statusCode } = successResponse("Salary offer tracked successfully", {
    offer: offerData,
    progressionId: progression._id,
    analytics: progression.analytics
  });
  return sendResponse(res, response, statusCode);
});

/**
 * GET /api/salary/progression - Get complete salary progression data
 */
export const getSalaryProgression = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  let progression = await SalaryProgression.findOne({ userId });
  
  // Create empty progression if none exists
  if (!progression) {
    progression = new SalaryProgression({ 
      userId,
      salaryOffers: [],
      careerMilestones: [],
      negotiationHistory: [],
      marketPositioning: [],
      compensationHistory: [],
      benefitsTrends: [],
      advancementRecommendations: []
    });
    await progression.save();
  }

  // Calculate career velocity
  progression.calculateCareerVelocity();
  await progression.save();

  const { response, statusCode } = successResponse("Salary progression retrieved successfully", {
    progression
  });
  return sendResponse(res, response, statusCode);
});

/**
 * GET /api/salary/progression/analytics - Get salary progression analytics
 */
export const getProgressionAnalytics = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const progression = await SalaryProgression.findOne({ userId });
  
  if (!progression || progression.salaryOffers.length === 0) {
    const { response, statusCode } = successResponse("No progression data available yet", {
      analytics: {
        hasData: false,
        message: "Start tracking salary offers to see your progression analytics"
      }
    });
    return sendResponse(res, response, statusCode);
  }

  // Calculate comprehensive analytics
  const analytics = {
    hasData: true,
    
    // Offer statistics
    offers: {
      total: progression.analytics.totalOffersReceived,
      accepted: progression.analytics.totalOffersAccepted,
      declined: progression.analytics.totalOffersDeclined,
      pending: progression.salaryOffers.filter(o => o.offerStatus === 'Active' || o.offerStatus === 'Pending').length,
      acceptanceRate: progression.analytics.totalOffersReceived > 0 
        ? ((progression.analytics.totalOffersAccepted / progression.analytics.totalOffersReceived) * 100).toFixed(1)
        : 0
    },
    
    // Negotiation success
    negotiation: {
      totalNegotiated: progression.salaryOffers.filter(o => o.wasNegotiated).length,
      successRate: progression.analytics.negotiationSuccessRate.toFixed(1),
      averageIncrease: progression.analytics.averageNegotiationIncrease.toFixed(1),
      bestNegotiation: progression.salaryOffers
        .filter(o => o.increaseFromInitial?.percentage)
        .sort((a, b) => b.increaseFromInitial.percentage - a.increaseFromInitial.percentage)[0] || null,
      improvementPattern: calculateNegotiationPattern(progression.salaryOffers)
    },
    
    // Compensation growth
    compensation: {
      totalGrowth: progression.analytics.totalCompensationGrowth.toFixed(1),
      yearOverYear: progression.analytics.yearOverYearGrowth,
      currentCompensation: progression.compensationHistory.length > 0 
        ? progression.compensationHistory[0].totalCompensation 
        : null,
      highestOffer: Math.max(...progression.salaryOffers.map(o => o.totalCompensation)),
      averageOffer: progression.salaryOffers.length > 0
        ? (progression.salaryOffers.reduce((sum, o) => sum + o.totalCompensation, 0) / progression.salaryOffers.length).toFixed(0)
        : 0
    },
    
    // Career progression
    career: {
      velocity: progression.analytics.careerVelocity,
      averageTimeToIncrease: progression.analytics.averageTimeToSalaryIncrease?.toFixed(1),
      milestones: progression.careerMilestones.length,
      promotions: progression.careerMilestones.filter(m => m.type === 'Promotion').length,
      jobChanges: progression.careerMilestones.filter(m => m.type === 'Job Change').length
    },
    
    // Market positioning
    marketPosition: {
      current: progression.marketPositioning.length > 0 
        ? progression.marketPositioning[0] 
        : null,
      trend: calculateMarketPositionTrend(progression.marketPositioning),
      averagePercentile: progression.salaryOffers.filter(o => o.percentileRank)
        .reduce((sum, o, _, arr) => sum + o.percentileRank / arr.length, 0).toFixed(1)
    },
    
    // Benefits evolution
    benefits: {
      totalTrends: progression.benefitsTrends.length,
      latestValue: progression.benefitsTrends.length > 0 
        ? progression.benefitsTrends[0].estimatedValue 
        : 0,
      evolution: analyzeBenefitsTrends(progression.benefitsTrends)
    }
  };

  const { response, statusCode } = successResponse("Progression analytics retrieved successfully", {
    analytics
  });
  return sendResponse(res, response, statusCode);
});

/**
 * POST /api/salary/progression/milestone - Add career milestone
 */
export const addCareerMilestone = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const milestoneData = req.body;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  // Validate required fields
  if (!milestoneData.date || !milestoneData.type || !milestoneData.title) {
    const { response, statusCode } = errorResponse(
      "Missing required fields: date, type, and title are required",
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
    return sendResponse(res, response, statusCode);
  }

  let progression = await SalaryProgression.findOne({ userId });
  if (!progression) {
    progression = new SalaryProgression({ userId });
  }

  await progression.addCareerMilestone(milestoneData);

  const { response, statusCode } = successResponse("Career milestone added successfully", {
    milestone: milestoneData
  });
  return sendResponse(res, response, statusCode);
});

/**
 * POST /api/salary/progression/market-assessment - Add market positioning assessment
 */
export const addMarketAssessment = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const assessmentData = req.body;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  // Calculate derived fields
  if (assessmentData.currentSalary && assessmentData.marketMedian) {
    const gap = assessmentData.currentSalary - assessmentData.marketMedian;
    assessmentData.gapFromMarket = gap;
    assessmentData.gapPercentage = (gap / assessmentData.marketMedian * 100).toFixed(2);
    
    const percentDiff = assessmentData.gapPercentage;
    if (percentDiff < -10) {
      assessmentData.position = 'Below Market';
    } else if (percentDiff > 10) {
      assessmentData.position = 'Above Market';
    } else {
      assessmentData.position = 'At Market';
    }
    
    // Simplified percentile calculation
    assessmentData.percentileRank = Math.min(100, Math.max(0, 50 + (percentDiff / 2)));
  }

  let progression = await SalaryProgression.findOne({ userId });
  if (!progression) {
    progression = new SalaryProgression({ userId });
  }

  await progression.addMarketAssessment(assessmentData);

  const { response, statusCode } = successResponse("Market assessment added successfully", {
    assessment: assessmentData
  });
  return sendResponse(res, response, statusCode);
});

/**
 * POST /api/salary/progression/recommendations - Generate advancement recommendations
 */
export const generateAdvancementRecommendations = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const progression = await SalaryProgression.findOne({ userId });
  const user = await User.findOne({ auth0Id: userId });
  
  if (!progression) {
    const { response, statusCode } = errorResponse(
      "No progression data found. Track some salary offers first.",
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  const recommendations = [];
  
  // Get latest market position
  const latestMarketPosition = progression.marketPositioning.length > 0 
    ? progression.marketPositioning[0] 
    : null;
  
  // Get latest compensation
  const latestComp = progression.compensationHistory.length > 0 
    ? progression.compensationHistory[0] 
    : null;

  // Recommendation 1: Salary negotiation if below market
  if (latestMarketPosition && latestMarketPosition.position === 'Below Market') {
    const gapAmount = Math.abs(latestMarketPosition.gapFromMarket);
    recommendations.push({
      recommendationType: 'Negotiation',
      title: 'Negotiate Salary to Market Rate',
      description: `Your current salary is ${Math.abs(latestMarketPosition.gapPercentage).toFixed(1)}% below market median. Consider negotiating a raise or seeking opportunities that offer market-competitive compensation.`,
      potentialImpact: {
        salaryIncrease: gapAmount,
        percentage: Math.abs(latestMarketPosition.gapPercentage)
      },
      timeframe: '3-6 months',
      priority: 'High',
      actionItems: [
        'Schedule a performance review with your manager',
        'Document your achievements and contributions',
        'Research current market rates for your role',
        'Prepare a data-driven case for a raise',
        'Consider exploring external opportunities if internal negotiation fails'
      ],
      marketData: {
        currentSalary: latestMarketPosition.currentSalary,
        marketMedian: latestMarketPosition.marketMedian,
        targetSalary: latestMarketPosition.marketMedian
      }
    });
  }

  // Recommendation 2: Job change based on career velocity
  if (progression.analytics.careerVelocity === 'Slow' && progression.compensationHistory.length >= 2) {
    const yearsInCurrent = progression.analytics.averageTimeToSalaryIncrease || 36;
    if (yearsInCurrent > 24) {
      recommendations.push({
        recommendationType: 'Job Change',
        title: 'Consider a Career Move for Salary Growth',
        description: `Your career progression has been slower than average, with approximately ${yearsInCurrent.toFixed(0)} months between salary increases. Job changes typically result in 10-20% salary increases.`,
        potentialImpact: {
          salaryIncrease: latestComp ? latestComp.totalCompensation * 0.15 : 0,
          percentage: 15
        },
        timeframe: '6-12 months',
        priority: 'High',
        actionItems: [
          'Update your resume with recent achievements',
          'Network with professionals in your target companies',
          'Apply to 2-3 positions per week',
          'Practice interviewing skills',
          'Research companies with strong career growth opportunities'
        ]
      });
    }
  }

  // Recommendation 3: Skill development based on market trends
  const experienceLevel = user?.experienceLevel || 'Mid';
  const targetLevel = experienceLevel === 'Entry' ? 'Mid' : experienceLevel === 'Mid' ? 'Senior' : 'Executive';
  
  if (experienceLevel !== 'Executive') {
    const industry = latestComp?.company ? 'Technology' : 'Other';
    const currentMedian = INDUSTRY_BENCHMARKS[industry]?.[experienceLevel]?.median || 0;
    const nextLevelMedian = INDUSTRY_BENCHMARKS[industry]?.[targetLevel]?.median || 0;
    const potentialIncrease = nextLevelMedian - currentMedian;
    
    recommendations.push({
      recommendationType: 'Skill Development',
      title: `Develop Skills for ${targetLevel}-Level Positions`,
      description: `Advancing to ${targetLevel} level could increase your salary by ${((potentialIncrease / currentMedian) * 100).toFixed(0)}%. Focus on developing leadership, strategic thinking, and specialized technical skills.`,
      potentialImpact: {
        salaryIncrease: potentialIncrease,
        percentage: (potentialIncrease / currentMedian) * 100
      },
      timeframe: '12-24 months',
      priority: 'Medium',
      actionItems: [
        'Identify key skills required for next level',
        'Take on leadership responsibilities in current role',
        'Pursue relevant certifications or advanced training',
        'Seek mentorship from senior professionals',
        'Lead cross-functional projects'
      ]
    });
  }

  // Recommendation 4: Certification based on negotiation success rate
  if (progression.analytics.negotiationSuccessRate < 50 && progression.negotiationHistory.length >= 2) {
    recommendations.push({
      recommendationType: 'Certification',
      title: 'Obtain Industry Certification to Strengthen Negotiations',
      description: `Your negotiation success rate is ${progression.analytics.negotiationSuccessRate.toFixed(0)}%. Earning a recognized certification can provide leverage in salary discussions and increase your market value.`,
      potentialImpact: {
        salaryIncrease: latestComp ? latestComp.baseSalary * 0.08 : 0,
        percentage: 8
      },
      timeframe: '3-9 months',
      priority: 'Medium',
      actionItems: [
        'Research high-value certifications in your field',
        'Allocate study time weekly',
        'Consider employer-sponsored certification programs',
        'Update resume and LinkedIn immediately after certification',
        'Use certification as leverage in next negotiation'
      ]
    });
  }

  // Recommendation 5: Industry switch if market position consistently low
  if (progression.marketPositioning.length >= 3) {
    const belowMarketCount = progression.marketPositioning
      .slice(0, 3)
      .filter(mp => mp.position === 'Below Market').length;
    
    if (belowMarketCount >= 2) {
      recommendations.push({
        recommendationType: 'Industry Switch',
        title: 'Explore Higher-Paying Industries',
        description: `Your compensation has consistently been below market. Consider industries with higher compensation for your skills, such as Technology, Finance, or Consulting.`,
        potentialImpact: {
          salaryIncrease: latestComp ? latestComp.totalCompensation * 0.25 : 0,
          percentage: 25
        },
        timeframe: '12-18 months',
        priority: 'Low',
        actionItems: [
          'Research industries that value your transferable skills',
          'Network with professionals in target industries',
          'Identify skill gaps for target industry',
          'Tailor resume to highlight relevant experience',
          'Consider informational interviews'
        ]
      });
    }
  }

  // Recommendation 6: Optimal timing for next move
  if (progression.compensationHistory.length >= 2) {
    const timeSinceLastIncrease = calculateMonthsSinceLastIncrease(progression.compensationHistory);
    
    if (timeSinceLastIncrease >= 18 && timeSinceLastIncrease < 36) {
      recommendations.push({
        recommendationType: 'Negotiation',
        title: 'Optimal Timing for Salary Discussion',
        description: `It's been ${timeSinceLastIncrease} months since your last significant salary increase. This is an ideal time to discuss compensation with your current employer or explore new opportunities.`,
        potentialImpact: {
          salaryIncrease: latestComp ? latestComp.totalCompensation * 0.12 : 0,
          percentage: 12
        },
        timeframe: '1-3 months',
        priority: 'High',
        actionItems: [
          'Document recent achievements and impact',
          'Research current market rates',
          'Schedule meeting with manager',
          'Prepare negotiation talking points',
          'Have backup plan if negotiation unsuccessful'
        ]
      });
    }
  }

  // Save recommendations to progression
  for (const rec of recommendations) {
    await progression.addRecommendation(rec);
  }

  const { response, statusCode } = successResponse("Advancement recommendations generated successfully", {
    count: recommendations.length,
    recommendations: recommendations.sort((a, b) => {
      const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    })
  });
  return sendResponse(res, response, statusCode);
});

/**
 * POST /api/salary/progression/negotiation-outcome - Track negotiation outcome
 */
export const trackNegotiationOutcome = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { negotiationId, outcome } = req.body;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  // Get the negotiation record
  const negotiation = await SalaryNegotiation.findById(negotiationId);
  if (!negotiation || negotiation.userId !== userId) {
    const { response, statusCode } = errorResponse(
      "Negotiation not found",
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  let progression = await SalaryProgression.findOne({ userId });
  if (!progression) {
    progression = new SalaryProgression({ userId });
  }

  // Calculate success metrics
  const targetAchievedPercentage = negotiation.targetSalary > 0
    ? (outcome.achievedSalary / negotiation.targetSalary * 100)
    : 0;
  
  const success = targetAchievedPercentage >= 90; // 90% or more of target = success

  const outcomeData = {
    negotiationId,
    date: new Date(),
    jobTitle: negotiation.jobTitle,
    company: negotiation.company,
    targetSalary: negotiation.targetSalary,
    achievedSalary: outcome.achievedSalary,
    success,
    successRate: targetAchievedPercentage,
    strategyUsed: negotiation.negotiationStrategy,
    lessonsLearned: outcome.lessonsLearned || []
  };

  await progression.addNegotiationOutcome(outcomeData);

  const { response, statusCode } = successResponse("Negotiation outcome tracked successfully", {
    outcome: outcomeData,
    successRate: progression.analytics.negotiationSuccessRate
  });
  return sendResponse(res, response, statusCode);
});

/**
 * PUT /api/salary/progression/offer/:offerId - Update a tracked salary offer
 */
export const updateSalaryOffer = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { offerId } = req.params;
  const updateData = req.body;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const progression = await SalaryProgression.findOne({ userId });
  if (!progression) {
    const { response, statusCode } = errorResponse(
      "No progression data found",
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  // Find the offer to update
  const offerIndex = progression.salaryOffers.findIndex(o => o._id.toString() === offerId);
  if (offerIndex === -1) {
    const { response, statusCode } = errorResponse(
      "Offer not found",
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  // Update the offer fields
  const offer = progression.salaryOffers[offerIndex];
  Object.keys(updateData).forEach(key => {
    if (updateData[key] !== undefined && key !== '_id') {
      offer[key] = updateData[key];
    }
  });

  // Recalculate total compensation if components changed
  if (updateData.baseSalary !== undefined || updateData.signingBonus !== undefined || 
      updateData.performanceBonus !== undefined || updateData.equityValue !== undefined || 
      updateData.benefitsValue !== undefined) {
    offer.totalCompensation = 
      (offer.baseSalary || 0) + 
      (offer.signingBonus || 0) + 
      (offer.performanceBonus || 0) + 
      (offer.equityValue || 0) + 
      (offer.benefitsValue || 0);
  }

  // Recalculate negotiation metrics if relevant fields changed
  if (offer.wasNegotiated && offer.initialOffer && offer.finalOffer) {
    offer.increaseFromInitial = {
      amount: offer.finalOffer - offer.initialOffer,
      percentage: ((offer.finalOffer - offer.initialOffer) / offer.initialOffer * 100).toFixed(2)
    };
  }

  // Recalculate market position if market data changed
  if (offer.marketMedian && offer.baseSalary) {
    const diffFromMedian = offer.baseSalary - offer.marketMedian;
    const percentDiff = (diffFromMedian / offer.marketMedian) * 100;
    
    if (percentDiff < -10) {
      offer.marketPosition = 'Below Market';
    } else if (percentDiff > 10) {
      offer.marketPosition = 'Above Market';
    } else {
      offer.marketPosition = 'At Market';
    }
    
    offer.percentileRank = Math.min(100, Math.max(0, 50 + (percentDiff / 2)));
  }

  // Update the offer in place
  progression.salaryOffers[offerIndex] = offer;

  // Recalculate analytics after update
  progression.analytics.totalOffersReceived = progression.salaryOffers.length;
  progression.analytics.totalOffersAccepted = progression.salaryOffers.filter(o => o.offerStatus === 'Accepted').length;
  progression.analytics.totalOffersDeclined = progression.salaryOffers.filter(o => o.offerStatus === 'Declined').length;

  // Recalculate negotiation metrics
  const negotiatedOffers = progression.salaryOffers.filter(o => o.wasNegotiated);
  if (negotiatedOffers.length > 0) {
    const successfulNegotiations = negotiatedOffers.filter(o => 
      o.increaseFromInitial && o.increaseFromInitial.percentage > 0
    );
    progression.analytics.negotiationSuccessRate = (successfulNegotiations.length / negotiatedOffers.length) * 100;
    
    if (successfulNegotiations.length > 0) {
      const totalIncrease = successfulNegotiations.reduce((sum, o) => sum + parseFloat(o.increaseFromInitial.percentage), 0);
      progression.analytics.averageNegotiationIncrease = totalIncrease / successfulNegotiations.length;
    } else {
      progression.analytics.averageNegotiationIncrease = 0;
    }
  } else {
    progression.analytics.negotiationSuccessRate = 0;
    progression.analytics.averageNegotiationIncrease = 0;
  }

  // Recalculate total compensation growth
  const sortedOffers = progression.salaryOffers
    .filter(o => o.totalCompensation && o.offerDate)
    .sort((a, b) => new Date(a.offerDate) - new Date(b.offerDate));
  
  if (sortedOffers.length >= 2) {
    const earliest = sortedOffers[0];
    const latest = sortedOffers[sortedOffers.length - 1];
    progression.analytics.totalCompensationGrowth = 
      ((latest.totalCompensation - earliest.totalCompensation) / earliest.totalCompensation) * 100;
  } else {
    progression.analytics.totalCompensationGrowth = 0;
  }

  await progression.save();

  const { response, statusCode } = successResponse("Salary offer updated successfully", {
    offer: progression.salaryOffers[offerIndex],
    analytics: progression.analytics
  });
  return sendResponse(res, response, statusCode);
});

/**
 * DELETE /api/salary/progression/offer/:offerId - Delete a tracked salary offer
 */
export const deleteSalaryOffer = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { offerId } = req.params;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const progression = await SalaryProgression.findOne({ userId });
  if (!progression) {
    const { response, statusCode } = errorResponse(
      "No progression data found",
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  // Find and remove the offer
  const offerIndex = progression.salaryOffers.findIndex(o => o._id.toString() === offerId);
  if (offerIndex === -1) {
    const { response, statusCode } = errorResponse(
      "Offer not found",
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  progression.salaryOffers.splice(offerIndex, 1);

  // Recalculate analytics
  progression.analytics.totalOffersReceived = progression.salaryOffers.length;
  progression.analytics.totalOffersAccepted = progression.salaryOffers.filter(o => o.offerStatus === 'Accepted').length;
  progression.analytics.totalOffersDeclined = progression.salaryOffers.filter(o => o.offerStatus === 'Declined').length;

  // Recalculate negotiation metrics
  const negotiatedOffers = progression.salaryOffers.filter(o => o.wasNegotiated);
  if (negotiatedOffers.length > 0) {
    const successfulNegotiations = negotiatedOffers.filter(o => 
      o.increaseFromInitial && o.increaseFromInitial.percentage > 0
    );
    progression.analytics.negotiationSuccessRate = (successfulNegotiations.length / negotiatedOffers.length) * 100;
    
    if (successfulNegotiations.length > 0) {
      const totalIncrease = successfulNegotiations.reduce((sum, o) => sum + parseFloat(o.increaseFromInitial.percentage), 0);
      progression.analytics.averageNegotiationIncrease = totalIncrease / successfulNegotiations.length;
    } else {
      progression.analytics.averageNegotiationIncrease = 0;
    }
  } else {
    progression.analytics.negotiationSuccessRate = 0;
    progression.analytics.averageNegotiationIncrease = 0;
  }

  // Recalculate total compensation growth
  const sortedOffers = progression.salaryOffers
    .filter(o => o.totalCompensation && o.offerDate)
    .sort((a, b) => new Date(a.offerDate) - new Date(b.offerDate));
  
  if (sortedOffers.length >= 2) {
    const earliest = sortedOffers[0];
    const latest = sortedOffers[sortedOffers.length - 1];
    progression.analytics.totalCompensationGrowth = 
      ((latest.totalCompensation - earliest.totalCompensation) / earliest.totalCompensation) * 100;
  } else {
    progression.analytics.totalCompensationGrowth = 0;
  }

  await progression.save();

  const { response, statusCode } = successResponse("Salary offer deleted successfully", {
    analytics: progression.analytics
  });
  return sendResponse(res, response, statusCode);
});

/**
 * Helper: Calculate negotiation improvement pattern
 */
function calculateNegotiationPattern(salaryOffers) {
  // Filter to only negotiated offers with valid data
  const negotiatedOffers = salaryOffers
    .filter(o => o.wasNegotiated && o.increaseFromInitial?.percentage)
    .sort((a, b) => new Date(a.offerDate) - new Date(b.offerDate)); // Sort chronologically
  
  if (negotiatedOffers.length < 2) return 'Insufficient Data';
  
  // Split into recent (last 3) and older negotiations
  const recent = negotiatedOffers.slice(-3); // Last 3
  const older = negotiatedOffers.slice(0, -3); // Everything before last 3
  
  if (older.length === 0) return 'Building History';
  
  // Calculate success rates (success = positive percentage increase)
  const recentSuccessRate = recent.filter(n => parseFloat(n.increaseFromInitial.percentage) > 0).length / recent.length;
  const olderSuccessRate = older.filter(n => parseFloat(n.increaseFromInitial.percentage) > 0).length / older.length;
  
  if (recentSuccessRate > olderSuccessRate + 0.15) return 'Improving';
  if (recentSuccessRate < olderSuccessRate - 0.15) return 'Declining';
  return 'Stable';
}

/**
 * Helper: Calculate market position trend
 */
function calculateMarketPositionTrend(positioning) {
  if (positioning.length < 2) return 'Insufficient Data';
  
  const recent = positioning.slice(0, 3);
  const scores = {
    'Below Market': 1,
    'At Market': 2,
    'Above Market': 3
  };
  
  const avgRecent = recent.reduce((sum, p) => sum + scores[p.position], 0) / recent.length;
  
  if (avgRecent >= 2.5) return 'Strong';
  if (avgRecent >= 1.5) return 'Competitive';
  return 'Below Average';
}

/**
 * Helper: Analyze benefits trends
 */
function analyzeBenefitsTrends(trends) {
  if (trends.length < 2) return { trend: 'Insufficient Data', changes: [] };
  
  const latest = trends[0];
  const previous = trends[1];
  
  const changes = [];
  
  if (latest.paidTimeOff > previous.paidTimeOff) {
    changes.push('Increased PTO');
  }
  if (latest.retirement401k && !previous.retirement401k) {
    changes.push('Added 401k');
  }
  if (latest.remoteWork && !previous.remoteWork) {
    changes.push('Gained Remote Work');
  }
  if (latest.estimatedValue > previous.estimatedValue) {
    changes.push('Benefits Value Increased');
  }
  
  return {
    trend: changes.length > 0 ? 'Improving' : 'Stable',
    changes
  };
}

/**
 * Helper: Calculate months since last compensation increase
 */
function calculateMonthsSinceLastIncrease(history) {
  if (history.length < 2) return 0;
  
  const sorted = history.slice().sort((a, b) => b.date - a.date);
  const latest = sorted[0];
  const previous = sorted[1];
  
  // Check if there was a meaningful increase (at least 3%)
  if (latest.totalCompensation > previous.totalCompensation * 1.03) {
    const diffMs = Date.now() - new Date(latest.date).getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30));
  }
  
  // If no recent increase, check when the last one was
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i - 1].totalCompensation > sorted[i].totalCompensation * 1.03) {
      const diffMs = Date.now() - new Date(sorted[i - 1].date).getTime();
      return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30));
    }
  }
  
  // No significant increase found
  if (sorted.length > 0) {
    const diffMs = Date.now() - new Date(sorted[0].date).getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30));
  }
  
  return 0;
}

/**
 * UC-112: GET /api/salary/bls-benchmarks - Get BLS salary benchmarks
 * Fetches real salary data from US Bureau of Labor Statistics API
 * with intelligent caching to minimize API calls
 */
export const getBLSBenchmarks = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { jobTitle, location } = req.query;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  if (!jobTitle) {
    const { response, statusCode } = errorResponse(
      "Job title is required",
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
    return sendResponse(res, response, statusCode);
  }

  try {
    const normalizedLocation = location || 'National';
    
    // Check cache first
    const cachedData = await SalaryBenchmarkCache.findCachedData(jobTitle, normalizedLocation);
    
    if (cachedData) {
      // Return cached data
      const { response, statusCode } = successResponse(
        "Salary benchmarks retrieved from cache",
        {
          source: cachedData.dataSource,
          dataYear: cachedData.dataYear,
          location: cachedData.location,
          jobTitle: cachedData.jobTitle,
          salaryRange: {
            min: cachedData.salaryData.min,
            max: cachedData.salaryData.max,
            median: cachedData.salaryData.median,
            mean: cachedData.salaryData.mean,
          },
          percentiles: cachedData.salaryData.percentiles,
          metadata: {
            occupationCode: cachedData.occupationCode,
            cached: true,
            cacheAge: Math.floor((new Date() - cachedData.updatedAt) / (1000 * 60 * 60 * 24)), // days
            lastUpdated: cachedData.updatedAt,
          },
          disclaimer: "Salary data is sourced from the US Bureau of Labor Statistics and represents industry averages. Actual salaries may vary based on experience, education, company size, and other factors. Data is updated periodically and cached for performance."
        }
      );
      return sendResponse(res, response, statusCode);
    }

    // No cache - fetch from BLS API
    const blsData = await fetchBLSSalaryData(jobTitle, location);
    
    if (!blsData) {
      // No data available from BLS
      const { response, statusCode } = errorResponse(
        "No salary data available for this job title and location",
        404,
        ERROR_CODES.NOT_FOUND
      );
      return sendResponse(res, response, statusCode);
    }

    // Format the data
    const formattedData = formatBLSData(blsData);
    
    // Cache the data (30 days expiry)
    await SalaryBenchmarkCache.cacheData(
      jobTitle,
      normalizedLocation,
      formattedData.salaryRange,
      {
        dataSource: 'BLS',
        occupationCode: blsData.occupationCode,
        areaCode: blsData.areaCode,
        dataYear: blsData.year,
        cacheDurationDays: 30,
        metadata: {
          confidence: 'high',
          notes: 'Data from US Bureau of Labor Statistics',
        },
      }
    );

    // Return fresh data
    const { response, statusCode } = successResponse(
      "Salary benchmarks retrieved from BLS",
      {
        ...formattedData,
        jobTitle,
        metadata: {
          ...formattedData.metadata,
          cached: false,
        },
        disclaimer: "Salary data is sourced from the US Bureau of Labor Statistics and represents industry averages. Actual salaries may vary based on experience, education, company size, and other factors. Data is updated periodically and cached for performance."
      }
    );
    return sendResponse(res, response, statusCode);

  } catch (error) {
    console.error('Error fetching BLS benchmarks:', error);
    
    const { response, statusCode } = errorResponse(
      `Failed to fetch salary benchmarks: ${error.message}`,
      500,
      ERROR_CODES.SERVER_ERROR
    );
    return sendResponse(res, response, statusCode);
  }
});

/**
 * UC-112: GET /api/salary/job-benchmarks/:jobId - Get BLS benchmarks for a specific job
 * Combines job details with real BLS salary data
 */
export const getJobBLSBenchmarks = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { jobId } = req.params;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  try {
    // Get job details
    const job = await Job.findOne({ _id: jobId, userId });
    
    if (!job) {
      const { response, statusCode } = errorResponse(
        "Job not found or you don't have permission to access it",
        404,
        ERROR_CODES.NOT_FOUND
      );
      return sendResponse(res, response, statusCode);
    }

    const jobTitle = job.title;
    const location = job.location || 'National';
    
    // Check cache first
    const cachedData = await SalaryBenchmarkCache.findCachedData(jobTitle, location);
    
    if (cachedData) {
      // Return cached data with job context
      const { response, statusCode } = successResponse(
        "Job salary benchmarks retrieved",
        {
          job: {
            id: job._id,
            title: job.title,
            company: job.company,
            location: job.location,
            providedSalary: job.salary,
          },
          benchmarkData: {
            source: cachedData.dataSource,
            dataYear: cachedData.dataYear,
            location: cachedData.location,
            salaryRange: {
              min: cachedData.salaryData.min,
              max: cachedData.salaryData.max,
              median: cachedData.salaryData.median,
              mean: cachedData.salaryData.mean,
            },
            percentiles: cachedData.salaryData.percentiles,
            metadata: {
              occupationCode: cachedData.occupationCode,
              cached: true,
              cacheAge: Math.floor((new Date() - cachedData.updatedAt) / (1000 * 60 * 60 * 24)),
              lastUpdated: cachedData.updatedAt,
            },
          },
          comparison: job.salary?.min ? {
            jobMin: job.salary.min,
            jobMax: job.salary.max,
            benchmarkMedian: cachedData.salaryData.median,
            difference: job.salary.min - cachedData.salaryData.median,
            percentageDiff: ((job.salary.min - cachedData.salaryData.median) / cachedData.salaryData.median * 100).toFixed(1),
          } : null,
          disclaimer: "Salary data is sourced from the US Bureau of Labor Statistics and represents industry averages. Actual salaries may vary based on experience, education, company size, and other factors."
        }
      );
      return sendResponse(res, response, statusCode);
    }

    // No cache - fetch from BLS API
    const blsData = await fetchBLSSalaryData(jobTitle, location);
    
    if (!blsData) {
      // Return job data without benchmarks
      const { response, statusCode } = successResponse(
        "Job details retrieved, but no benchmark data available",
        {
          job: {
            id: job._id,
            title: job.title,
            company: job.company,
            location: job.location,
            providedSalary: job.salary,
          },
          benchmarkData: null,
          message: "No salary benchmark data available for this position",
          disclaimer: "Salary benchmarks could not be retrieved. This may be due to an uncommon job title or location."
        }
      );
      return sendResponse(res, response, statusCode);
    }

    // Format and cache the data
    const formattedData = formatBLSData(blsData);
    
    await SalaryBenchmarkCache.cacheData(
      jobTitle,
      location,
      formattedData.salaryRange,
      {
        dataSource: 'BLS',
        occupationCode: blsData.occupationCode,
        areaCode: blsData.areaCode,
        dataYear: blsData.year,
        cacheDurationDays: 30,
        metadata: {
          confidence: 'high',
          notes: 'Data from US Bureau of Labor Statistics',
        },
      }
    );

    // Return job data with fresh benchmarks
    const { response, statusCode } = successResponse(
      "Job salary benchmarks retrieved from BLS",
      {
        job: {
          id: job._id,
          title: job.title,
          company: job.company,
          location: job.location,
          providedSalary: job.salary,
        },
        benchmarkData: {
          ...formattedData,
          metadata: {
            ...formattedData.metadata,
            cached: false,
          },
        },
        comparison: job.salary?.min ? {
          jobMin: job.salary.min,
          jobMax: job.salary.max,
          benchmarkMedian: formattedData.salaryRange.median,
          difference: job.salary.min - formattedData.salaryRange.median,
          percentageDiff: ((job.salary.min - formattedData.salaryRange.median) / formattedData.salaryRange.median * 100).toFixed(1),
        } : null,
        disclaimer: "Salary data is sourced from the US Bureau of Labor Statistics and represents industry averages. Actual salaries may vary based on experience, education, company size, and other factors."
      }
    );
    return sendResponse(res, response, statusCode);

  } catch (error) {
    console.error('Error fetching job BLS benchmarks:', error);
    
    const { response, statusCode } = errorResponse(
      `Failed to fetch salary benchmarks: ${error.message}`,
      500,
      ERROR_CODES.SERVER_ERROR
    );
    return sendResponse(res, response, statusCode);
  }
});
