import { Job } from "../models/Job.js";
import { User } from "../models/User.js";
import { successResponse, errorResponse, sendResponse, ERROR_CODES } from "../utils/responseFormat.js";
import { asyncHandler } from "../middleware/errorHandler.js";

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
