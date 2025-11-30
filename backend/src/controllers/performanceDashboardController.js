import { Job } from "../models/Job.js";
import { Interview } from "../models/Interview.js";
import { User } from "../models/User.js";
import { successResponse, errorResponse, sendResponse, ERROR_CODES, validationErrorResponse } from "../utils/responseFormat.js";
import { asyncHandler } from "../middleware/errorHandler.js";

// ============================================================================
// UC-096: Job Search Performance Dashboard
// ============================================================================

// Industry benchmarks for job search performance
const INDUSTRY_BENCHMARKS = {
  responseRate: 25,           // 25% of applications get responses
  interviewRate: 15,          // 15% of applications lead to interviews
  offerRate: 5,               // 5% of applications result in offers
  avgTimeToResponse: 14,      // 14 days average response time
  avgTimeToOffer: 45,         // 45 days average time to offer
  avgApplicationsPerWeek: 10, // 10 applications per week recommended
  interviewToOfferRate: 25,   // 25% of interviews lead to offers
  phoneScreenPassRate: 60,    // 60% pass phone screen
  technicalPassRate: 40,      // 40% pass technical interviews
};

/**
 * GET /api/performance-dashboard
 * Get comprehensive performance dashboard with optional date filtering
 */
export const getPerformanceDashboard = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  
  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  // Parse date range from query params
  const { startDate, endDate, period } = req.query;
  let dateFilter = {};
  
  if (startDate && endDate) {
    dateFilter = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };
  } else if (period) {
    const now = new Date();
    let start;
    switch (period) {
      case 'week':
        start = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        start = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'quarter':
        start = new Date(now.setMonth(now.getMonth() - 3));
        break;
      case 'year':
        start = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      case 'all':
      default:
        start = null;
    }
    if (start) {
      dateFilter = { createdAt: { $gte: start } };
    }
  }

  // Fetch user for goals
  const user = await User.findOne({ auth0Id: userId });
  
  // Fetch all jobs for user with date filter
  const allJobs = await Job.find({ 
    userId,
    ...dateFilter
  }).sort({ createdAt: -1 });

  // Fetch interviews with date filter
  const interviews = await Interview.find({
    userId,
    ...(dateFilter.createdAt ? { scheduledTime: dateFilter.createdAt } : {})
  });

  // ========== KEY METRICS ==========
  const totalApplications = allJobs.length;
  const interviewsScheduled = interviews.length;
  const offersReceived = allJobs.filter(j => ["Offer", "Accepted"].includes(j.status)).length;
  const acceptedOffers = allJobs.filter(j => j.status === "Accepted").length;

  // ========== CONVERSION FUNNEL ==========
  const funnel = calculateConversionFunnel(allJobs);

  // ========== TIME METRICS ==========
  const timeMetrics = calculateTimeMetrics(allJobs);

  // ========== TRENDS ==========
  const trends = calculateTrends(allJobs, dateFilter);

  // ========== GOALS ==========
  const goals = user?.searchGoals || getDefaultGoals();
  const goalProgress = calculateGoalProgress(allJobs, interviews, goals);

  // ========== BENCHMARKS ==========
  const benchmarkComparison = calculateBenchmarkComparison(allJobs, interviews);

  // ========== INSIGHTS ==========
  const insights = generateActionableInsights(allJobs, interviews, funnel, timeMetrics, benchmarkComparison);

  // ========== SUCCESS PATTERNS ==========
  const successPatterns = analyzeSuccessPatterns(allJobs);

  const { response, statusCode } = successResponse("Performance dashboard retrieved", {
    keyMetrics: {
      totalApplications,
      interviewsScheduled,
      offersReceived,
      acceptedOffers,
      activeApplications: allJobs.filter(j => !["Rejected", "Withdrawn", "Ghosted"].includes(j.status)).length,
    },
    conversionFunnel: funnel,
    timeMetrics,
    trends,
    goals: goalProgress,
    benchmarks: benchmarkComparison,
    insights,
    successPatterns,
    dateRange: {
      start: dateFilter.createdAt?.$gte || null,
      end: dateFilter.createdAt?.$lte || new Date(),
      period: period || 'all'
    }
  });
  return sendResponse(res, response, statusCode);
});

/**
 * GET /api/performance-dashboard/goals
 * Get user's search goals
 */
export const getSearchGoals = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  
  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const user = await User.findOne({ auth0Id: userId });
  
  if (!user) {
    const { response, statusCode } = errorResponse("User not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  const goals = user.searchGoals || getDefaultGoals();

  const { response, statusCode } = successResponse("Search goals retrieved", { goals });
  return sendResponse(res, response, statusCode);
});

/**
 * PUT /api/performance-dashboard/goals
 * Update user's search goals
 */
export const updateSearchGoals = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { goals } = req.body;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  // Validate goals
  if (!goals || typeof goals !== 'object') {
    const { response, statusCode } = validationErrorResponse(
      "Invalid goals format",
      [{ field: 'goals', message: 'Goals must be an object' }]
    );
    return sendResponse(res, response, statusCode);
  }

  const user = await User.findOneAndUpdate(
    { auth0Id: userId },
    { $set: { searchGoals: goals } },
    { new: true, runValidators: true }
  );

  if (!user) {
    const { response, statusCode } = errorResponse("User not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  const { response, statusCode } = successResponse("Search goals updated", { goals: user.searchGoals });
  return sendResponse(res, response, statusCode);
});

/**
 * GET /api/performance-dashboard/trends
 * Get detailed trend analysis
 */
export const getTrendAnalysis = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { granularity = 'weekly' } = req.query; // daily, weekly, monthly

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const allJobs = await Job.find({ userId }).sort({ createdAt: 1 });
  const interviews = await Interview.find({ userId });

  const trendData = calculateDetailedTrends(allJobs, interviews, granularity);

  const { response, statusCode } = successResponse("Trend analysis retrieved", trendData);
  return sendResponse(res, response, statusCode);
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getDefaultGoals() {
  return {
    weekly: {
      applications: { target: 10, enabled: true },
      networking: { target: 5, enabled: true },
    },
    monthly: {
      applications: { target: 40, enabled: true },
      interviews: { target: 4, enabled: true },
      offers: { target: 1, enabled: true },
    },
    overall: {
      targetRole: '',
      targetSalary: null,
      targetDate: null,
    }
  };
}

function calculateConversionFunnel(jobs) {
  const total = jobs.length;
  if (total === 0) {
    return {
      stages: [],
      conversionRates: {},
      bottleneck: null
    };
  }

  const stages = [
    { name: 'Applied', count: total, percentage: 100 },
    { name: 'Responded', count: jobs.filter(j => !['Interested', 'Applied', 'Ghosted'].includes(j.status)).length },
    { name: 'Phone Screen', count: jobs.filter(j => ['Phone Screen', 'Interview', 'Offer', 'Accepted'].includes(j.status)).length },
    { name: 'Interview', count: jobs.filter(j => ['Interview', 'Offer', 'Accepted'].includes(j.status)).length },
    { name: 'Offer', count: jobs.filter(j => ['Offer', 'Accepted'].includes(j.status)).length },
    { name: 'Accepted', count: jobs.filter(j => j.status === 'Accepted').length },
  ];

  // Calculate percentages and drop-off
  stages.forEach((stage, i) => {
    stage.percentage = ((stage.count / total) * 100).toFixed(1);
    if (i > 0) {
      const prevCount = stages[i - 1].count;
      stage.conversionFromPrevious = prevCount > 0 
        ? ((stage.count / prevCount) * 100).toFixed(1) 
        : 0;
      stage.dropOff = prevCount - stage.count;
    }
  });

  // Identify bottleneck (largest drop-off percentage)
  let bottleneck = null;
  let maxDropOffRate = 0;
  for (let i = 1; i < stages.length; i++) {
    const prevCount = stages[i - 1].count;
    if (prevCount > 0) {
      const dropOffRate = (stages[i].dropOff / prevCount) * 100;
      if (dropOffRate > maxDropOffRate && stages[i - 1].count >= 5) {
        maxDropOffRate = dropOffRate;
        bottleneck = {
          from: stages[i - 1].name,
          to: stages[i].name,
          dropOffRate: dropOffRate.toFixed(1),
          suggestion: getBottleneckSuggestion(stages[i - 1].name, stages[i].name)
        };
      }
    }
  }

  return {
    stages,
    conversionRates: {
      responseRate: stages[1].percentage,
      phoneScreenRate: stages[2].percentage,
      interviewRate: stages[3].percentage,
      offerRate: stages[4].percentage,
      acceptanceRate: stages[5].percentage,
    },
    bottleneck
  };
}

function getBottleneckSuggestion(fromStage, toStage) {
  const suggestions = {
    'Applied-Responded': 'Focus on tailoring your resume and cover letter to each job posting. Use keywords from the job description.',
    'Responded-Phone Screen': 'Practice your elevator pitch and ensure your initial responses are professional and prompt.',
    'Phone Screen-Interview': 'Prepare better for phone screens by researching companies and practicing common questions.',
    'Interview-Offer': 'Work on interview skills, prepare STAR stories, and practice technical questions relevant to your field.',
    'Offer-Accepted': 'Review your salary expectations and consider what factors are most important to you beyond compensation.',
  };
  return suggestions[`${fromStage}-${toStage}`] || 'Analyze what is happening at this stage and identify areas for improvement.';
}

function calculateTimeMetrics(jobs) {
  const responseTimes = [];
  const interviewTimes = [];
  const offerTimes = [];

  jobs.forEach(job => {
    if (!job.applicationDate) return;
    const appDate = new Date(job.applicationDate);

    // Time to first response
    if (job.statusHistory && job.statusHistory.length > 1) {
      const firstResponse = job.statusHistory.find(h => 
        !['Interested', 'Applied'].includes(h.status)
      );
      if (firstResponse) {
        const days = Math.floor((new Date(firstResponse.timestamp) - appDate) / (1000 * 60 * 60 * 24));
        if (days >= 0) responseTimes.push(days);
      }
    }

    // Time to interview
    const interviewEntry = job.statusHistory?.find(h => h.status === 'Interview');
    if (interviewEntry) {
      const days = Math.floor((new Date(interviewEntry.timestamp) - appDate) / (1000 * 60 * 60 * 24));
      if (days >= 0) interviewTimes.push(days);
    }

    // Time to offer
    const offerEntry = job.statusHistory?.find(h => h.status === 'Offer');
    if (offerEntry) {
      const days = Math.floor((new Date(offerEntry.timestamp) - appDate) / (1000 * 60 * 60 * 24));
      if (days >= 0) offerTimes.push(days);
    }
  });

  const avg = arr => arr.length > 0 ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : null;
  const median = arr => {
    if (arr.length === 0) return null;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : ((sorted[mid - 1] + sorted[mid]) / 2).toFixed(1);
  };

  return {
    responseTime: {
      average: avg(responseTimes),
      median: median(responseTimes),
      fastest: responseTimes.length > 0 ? Math.min(...responseTimes) : null,
      slowest: responseTimes.length > 0 ? Math.max(...responseTimes) : null,
      sampleSize: responseTimes.length
    },
    interviewTime: {
      average: avg(interviewTimes),
      median: median(interviewTimes),
      sampleSize: interviewTimes.length
    },
    offerTime: {
      average: avg(offerTimes),
      median: median(offerTimes),
      sampleSize: offerTimes.length
    }
  };
}

function calculateTrends(jobs, dateFilter) {
  // Weekly trends for last 8 weeks
  const weeklyData = [];
  const now = new Date();

  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - (i * 7 + 7));
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - (i * 7));
    weekEnd.setHours(23, 59, 59, 999);

    const weekJobs = jobs.filter(j => {
      const date = new Date(j.createdAt);
      return date >= weekStart && date <= weekEnd;
    });

    const responses = weekJobs.filter(j => !['Interested', 'Applied', 'Ghosted'].includes(j.status)).length;
    const interviews = weekJobs.filter(j => ['Interview', 'Offer', 'Accepted'].includes(j.status)).length;

    weeklyData.push({
      week: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      applications: weekJobs.length,
      responses,
      interviews,
      responseRate: weekJobs.length > 0 ? ((responses / weekJobs.length) * 100).toFixed(1) : 0
    });
  }

  // Calculate trend direction
  const recentApps = weeklyData.slice(-4).reduce((sum, w) => sum + w.applications, 0);
  const olderApps = weeklyData.slice(0, 4).reduce((sum, w) => sum + w.applications, 0);
  
  let volumeTrend = 'stable';
  if (recentApps > olderApps * 1.2) volumeTrend = 'increasing';
  else if (recentApps < olderApps * 0.8) volumeTrend = 'decreasing';

  // Success rate trend
  const recentSuccess = weeklyData.slice(-4);
  const olderSuccess = weeklyData.slice(0, 4);
  const recentSuccessRate = recentSuccess.reduce((sum, w) => sum + parseFloat(w.responseRate || 0), 0) / 4;
  const olderSuccessRate = olderSuccess.reduce((sum, w) => sum + parseFloat(w.responseRate || 0), 0) / 4;

  let successTrend = 'stable';
  if (recentSuccessRate > olderSuccessRate + 5) successTrend = 'improving';
  else if (recentSuccessRate < olderSuccessRate - 5) successTrend = 'declining';

  return {
    weekly: weeklyData,
    volumeTrend,
    successTrend,
    averageWeeklyApplications: (jobs.length / 8).toFixed(1),
    peakWeek: weeklyData.reduce((max, w) => w.applications > max.applications ? w : max, weeklyData[0])
  };
}

function calculateDetailedTrends(jobs, interviews, granularity) {
  const now = new Date();
  const dataPoints = [];
  let periods, format;

  switch (granularity) {
    case 'daily':
      periods = 30;
      format = { month: 'short', day: 'numeric' };
      break;
    case 'monthly':
      periods = 12;
      format = { month: 'short', year: '2-digit' };
      break;
    case 'weekly':
    default:
      periods = 12;
      format = { month: 'short', day: 'numeric' };
  }

  for (let i = periods - 1; i >= 0; i--) {
    let start, end;

    if (granularity === 'daily') {
      start = new Date(now);
      start.setDate(start.getDate() - i - 1);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setHours(23, 59, 59, 999);
    } else if (granularity === 'monthly') {
      start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
    } else {
      start = new Date(now);
      start.setDate(start.getDate() - (i * 7 + 7));
      start.setHours(0, 0, 0, 0);
      end = new Date(now);
      end.setDate(end.getDate() - i * 7);
      end.setHours(23, 59, 59, 999);
    }

    const periodJobs = jobs.filter(j => {
      const date = new Date(j.createdAt);
      return date >= start && date <= end;
    });

    const periodInterviews = interviews.filter(i => {
      const date = new Date(i.scheduledTime);
      return date >= start && date <= end;
    });

    dataPoints.push({
      label: start.toLocaleDateString('en-US', format),
      applications: periodJobs.length,
      interviews: periodInterviews.length,
      responses: periodJobs.filter(j => !['Interested', 'Applied', 'Ghosted'].includes(j.status)).length,
      offers: periodJobs.filter(j => ['Offer', 'Accepted'].includes(j.status)).length
    });
  }

  return {
    granularity,
    dataPoints,
    totals: {
      applications: dataPoints.reduce((sum, d) => sum + d.applications, 0),
      interviews: dataPoints.reduce((sum, d) => sum + d.interviews, 0),
      responses: dataPoints.reduce((sum, d) => sum + d.responses, 0),
      offers: dataPoints.reduce((sum, d) => sum + d.offers, 0)
    }
  };
}

function calculateGoalProgress(jobs, interviews, goals) {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const weeklyApps = jobs.filter(j => new Date(j.createdAt) >= weekStart).length;
  const monthlyApps = jobs.filter(j => new Date(j.createdAt) >= monthStart).length;
  const monthlyInterviews = jobs.filter(j => 
    new Date(j.createdAt) >= monthStart && 
    ['Interview', 'Offer', 'Accepted'].includes(j.status)
  ).length;
  const monthlyOffers = jobs.filter(j => 
    new Date(j.createdAt) >= monthStart && 
    ['Offer', 'Accepted'].includes(j.status)
  ).length;

  return {
    weekly: {
      applications: {
        current: weeklyApps,
        target: goals.weekly?.applications?.target || 10,
        percentage: Math.min(100, Math.round((weeklyApps / (goals.weekly?.applications?.target || 10)) * 100)),
        onTrack: weeklyApps >= (goals.weekly?.applications?.target || 10)
      }
    },
    monthly: {
      applications: {
        current: monthlyApps,
        target: goals.monthly?.applications?.target || 40,
        percentage: Math.min(100, Math.round((monthlyApps / (goals.monthly?.applications?.target || 40)) * 100)),
        onTrack: monthlyApps >= (goals.monthly?.applications?.target || 40)
      },
      interviews: {
        current: monthlyInterviews,
        target: goals.monthly?.interviews?.target || 4,
        percentage: Math.min(100, Math.round((monthlyInterviews / (goals.monthly?.interviews?.target || 4)) * 100)),
        onTrack: monthlyInterviews >= (goals.monthly?.interviews?.target || 4)
      },
      offers: {
        current: monthlyOffers,
        target: goals.monthly?.offers?.target || 1,
        percentage: Math.min(100, Math.round((monthlyOffers / (goals.monthly?.offers?.target || 1)) * 100)),
        onTrack: monthlyOffers >= (goals.monthly?.offers?.target || 1)
      }
    },
    overall: goals.overall || {}
  };
}

function calculateBenchmarkComparison(jobs, interviews) {
  const total = jobs.length;
  if (total === 0) {
    return {
      userMetrics: {},
      industryBenchmarks: INDUSTRY_BENCHMARKS,
      comparison: {}
    };
  }

  const responded = jobs.filter(j => !['Interested', 'Applied', 'Ghosted'].includes(j.status)).length;
  const interviewed = jobs.filter(j => ['Interview', 'Offer', 'Accepted'].includes(j.status)).length;
  const offers = jobs.filter(j => ['Offer', 'Accepted'].includes(j.status)).length;

  const userMetrics = {
    responseRate: ((responded / total) * 100).toFixed(1),
    interviewRate: ((interviewed / total) * 100).toFixed(1),
    offerRate: ((offers / total) * 100).toFixed(1),
    interviewToOfferRate: interviewed > 0 ? ((offers / interviewed) * 100).toFixed(1) : 0,
  };

  const getStatus = (user, benchmark) => {
    const diff = parseFloat(user) - benchmark;
    if (diff >= 5) return 'above';
    if (diff >= -5) return 'average';
    return 'below';
  };

  return {
    userMetrics,
    industryBenchmarks: INDUSTRY_BENCHMARKS,
    comparison: {
      responseRate: {
        status: getStatus(userMetrics.responseRate, INDUSTRY_BENCHMARKS.responseRate),
        difference: (parseFloat(userMetrics.responseRate) - INDUSTRY_BENCHMARKS.responseRate).toFixed(1)
      },
      interviewRate: {
        status: getStatus(userMetrics.interviewRate, INDUSTRY_BENCHMARKS.interviewRate),
        difference: (parseFloat(userMetrics.interviewRate) - INDUSTRY_BENCHMARKS.interviewRate).toFixed(1)
      },
      offerRate: {
        status: getStatus(userMetrics.offerRate, INDUSTRY_BENCHMARKS.offerRate),
        difference: (parseFloat(userMetrics.offerRate) - INDUSTRY_BENCHMARKS.offerRate).toFixed(1)
      }
    }
  };
}

function generateActionableInsights(jobs, interviews, funnel, timeMetrics, benchmarks) {
  const insights = [];

  // Response rate insight
  if (benchmarks.comparison?.responseRate?.status === 'below') {
    insights.push({
      type: 'warning',
      category: 'Response Rate',
      title: 'Your response rate needs attention',
      description: `Your response rate is ${Math.abs(benchmarks.comparison.responseRate.difference)}% below industry average.`,
      actions: [
        'Customize your resume for each application',
        'Include keywords from job descriptions',
        'Write personalized cover letters',
        'Apply within 48 hours of job posting'
      ],
      priority: 'high'
    });
  } else if (benchmarks.comparison?.responseRate?.status === 'above') {
    insights.push({
      type: 'success',
      category: 'Response Rate',
      title: 'Great response rate!',
      description: `Your response rate is ${benchmarks.comparison.responseRate.difference}% above industry average.`,
      actions: ['Keep doing what you\'re doing!', 'Consider documenting your successful approach'],
      priority: 'low'
    });
  }

  // Bottleneck insight
  if (funnel.bottleneck) {
    insights.push({
      type: 'warning',
      category: 'Conversion Funnel',
      title: `Bottleneck: ${funnel.bottleneck.from} → ${funnel.bottleneck.to}`,
      description: `${funnel.bottleneck.dropOffRate}% of applications drop off at this stage.`,
      actions: [funnel.bottleneck.suggestion],
      priority: 'high'
    });
  }

  // Application volume insight
  const recentWeekApps = jobs.filter(j => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return new Date(j.createdAt) >= weekAgo;
  }).length;

  if (recentWeekApps < 5) {
    insights.push({
      type: 'info',
      category: 'Application Volume',
      title: 'Consider increasing your application volume',
      description: `You've only applied to ${recentWeekApps} jobs this week.`,
      actions: [
        'Set aside dedicated time each day for applications',
        'Use job alerts to find new opportunities quickly',
        'Expand your search criteria slightly'
      ],
      priority: 'medium'
    });
  }

  // Time to response insight
  if (timeMetrics.responseTime.average && parseFloat(timeMetrics.responseTime.average) > 21) {
    insights.push({
      type: 'info',
      category: 'Response Time',
      title: 'Companies are taking longer to respond',
      description: `Average response time is ${timeMetrics.responseTime.average} days.`,
      actions: [
        'Follow up on applications after 1-2 weeks',
        'Continue applying while waiting',
        'Consider companies known for faster processes'
      ],
      priority: 'low'
    });
  }

  // Interview conversion insight
  if (benchmarks.comparison?.interviewRate?.status === 'below') {
    insights.push({
      type: 'warning',
      category: 'Interview Rate',
      title: 'Work on getting more interviews',
      description: 'Your interview rate is below average.',
      actions: [
        'Optimize your LinkedIn profile',
        'Network with people at target companies',
        'Get resume feedback from professionals',
        'Practice your phone screen skills'
      ],
      priority: 'high'
    });
  }

  return insights.sort((a, b) => {
    const priority = { high: 0, medium: 1, low: 2 };
    return priority[a.priority] - priority[b.priority];
  });
}

function analyzeSuccessPatterns(jobs) {
  const successfulJobs = jobs.filter(j => ['Interview', 'Offer', 'Accepted'].includes(j.status));
  
  if (successfulJobs.length < 3) {
    return {
      hasEnoughData: false,
      message: 'Need more successful applications to identify patterns'
    };
  }

  // Analyze by industry
  const industrySuccess = {};
  jobs.forEach(job => {
    if (!job.industry) return;
    if (!industrySuccess[job.industry]) {
      industrySuccess[job.industry] = { total: 0, success: 0 };
    }
    industrySuccess[job.industry].total++;
    if (['Interview', 'Offer', 'Accepted'].includes(job.status)) {
      industrySuccess[job.industry].success++;
    }
  });

  const topIndustries = Object.entries(industrySuccess)
    .map(([industry, data]) => ({
      industry,
      successRate: ((data.success / data.total) * 100).toFixed(1),
      applications: data.total
    }))
    .filter(i => i.applications >= 2)
    .sort((a, b) => parseFloat(b.successRate) - parseFloat(a.successRate))
    .slice(0, 3);

  // Analyze by work mode
  const workModeSuccess = {};
  jobs.forEach(job => {
    const mode = job.workMode || 'Unknown';
    if (!workModeSuccess[mode]) {
      workModeSuccess[mode] = { total: 0, success: 0 };
    }
    workModeSuccess[mode].total++;
    if (['Interview', 'Offer', 'Accepted'].includes(job.status)) {
      workModeSuccess[mode].success++;
    }
  });

  const topWorkModes = Object.entries(workModeSuccess)
    .map(([mode, data]) => ({
      mode,
      successRate: ((data.success / data.total) * 100).toFixed(1),
      applications: data.total
    }))
    .filter(m => m.applications >= 2)
    .sort((a, b) => parseFloat(b.successRate) - parseFloat(a.successRate));

  // Application day analysis
  const daySuccess = { 0: { total: 0, success: 0 }, 1: { total: 0, success: 0 }, 2: { total: 0, success: 0 }, 
                        3: { total: 0, success: 0 }, 4: { total: 0, success: 0 }, 5: { total: 0, success: 0 }, 
                        6: { total: 0, success: 0 } };
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  jobs.forEach(job => {
    const day = new Date(job.createdAt).getDay();
    daySuccess[day].total++;
    if (['Interview', 'Offer', 'Accepted'].includes(job.status)) {
      daySuccess[day].success++;
    }
  });

  const bestDays = Object.entries(daySuccess)
    .map(([day, data]) => ({
      day: dayNames[parseInt(day)],
      successRate: data.total > 0 ? ((data.success / data.total) * 100).toFixed(1) : 0,
      applications: data.total
    }))
    .filter(d => d.applications >= 2)
    .sort((a, b) => parseFloat(b.successRate) - parseFloat(a.successRate))
    .slice(0, 3);

  return {
    hasEnoughData: true,
    topIndustries,
    topWorkModes,
    bestDays,
    recommendations: generatePatternRecommendations(topIndustries, topWorkModes, bestDays)
  };
}

function generatePatternRecommendations(industries, workModes, days) {
  const recommendations = [];

  if (industries.length > 0 && parseFloat(industries[0].successRate) > 30) {
    recommendations.push(`Focus on ${industries[0].industry} - you have ${industries[0].successRate}% success rate there`);
  }

  if (workModes.length > 0) {
    const bestMode = workModes[0];
    if (parseFloat(bestMode.successRate) > parseFloat(workModes[workModes.length - 1]?.successRate || 0) + 10) {
      recommendations.push(`${bestMode.mode} positions seem to be your sweet spot`);
    }
  }

  if (days.length > 0 && parseFloat(days[0].successRate) > 20) {
    recommendations.push(`Consider applying on ${days[0].day}s - your success rate is higher`);
  }

  return recommendations;
}
