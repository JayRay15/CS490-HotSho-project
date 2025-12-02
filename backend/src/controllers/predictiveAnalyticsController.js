import { Interview } from "../models/Interview.js";
import { Job } from "../models/Job.js";
import { InterviewPrediction } from "../models/InterviewPrediction.js";
import { MockInterviewSession } from "../models/MockInterviewSession.js";
import { SalaryNegotiation } from "../models/SalaryNegotiation.js";
import Goal from "../models/Goal.js";
import ProductivityAnalysis from "../models/ProductivityAnalysis.js";
import { successResponse, errorResponse, sendResponse, ERROR_CODES } from "../utils/responseFormat.js";
import { asyncHandler } from "../middleware/errorHandler.js";

// ============================================================================
// Main Endpoint Handlers
// ============================================================================

/**
 * GET /api/predictive-analytics/dashboard
 * Get comprehensive predictive analytics dashboard data
 */
export const getPredictiveAnalyticsDashboard = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  
  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  // Fetch all necessary data
  const [interviews, jobs, predictions, mockSessions, goals] = await Promise.all([
    Interview.find({ userId }).sort({ scheduledDate: -1 }),
    Job.find({ userId }).sort({ dateApplied: -1 }),
    InterviewPrediction.find({ userId }),
    MockInterviewSession.find({ userId }),
    Goal.find({ userId })
  ]);

  // Calculate all predictions
  const interviewSuccessPredictions = calculateInterviewSuccessPredictions(interviews, predictions, mockSessions);
  const jobSearchTimeline = forecastJobSearchTimeline(jobs, interviews);
  const salaryPredictions = predictSalaryNegotiationOutcomes(jobs, interviews);
  const optimalTiming = predictOptimalTiming(interviews, jobs);
  const modelAccuracy = trackPredictionAccuracy(predictions, interviews);

  // Calculate key summary metrics from computed data
  const overallSuccessProbability = interviewSuccessPredictions.overall?.historicalSuccessRate 
    ? interviewSuccessPredictions.overall.historicalSuccessRate / 100 
    : 0.5;
  
  const predictedTimeToOffer = jobSearchTimeline.forecast?.estimatedWeeksToOffer 
    ? Math.round(jobSearchTimeline.forecast.estimatedWeeksToOffer * 7) 
    : null;
  
  const expectedSalaryRange = {
    min: salaryPredictions.overview?.avgSalaryRangeMin || 0,
    max: salaryPredictions.overview?.avgSalaryRangeMax || 0,
    median: salaryPredictions.overview?.avgSalaryRangeMin && salaryPredictions.overview?.avgSalaryRangeMax
      ? Math.round((salaryPredictions.overview.avgSalaryRangeMin + salaryPredictions.overview.avgSalaryRangeMax) / 2)
      : 0
  };

  // Generate key insights based on data
  const keyInsights = generateKeyInsights(interviews, jobs, interviewSuccessPredictions, jobSearchTimeline, salaryPredictions);
  
  // Generate quick actions
  const quickActions = generateQuickActions(interviewSuccessPredictions, jobSearchTimeline, salaryPredictions);

  const { response, statusCode } = successResponse("Predictive analytics dashboard retrieved", {
    hasData: interviews.length > 0 || jobs.length > 0,
    summary: {
      totalInterviews: interviews.length,
      totalJobs: jobs.length,
      activeApplications: jobs.filter(j => !["Rejected", "Withdrawn", "Ghosted"].includes(j.status)).length,
      predictionAccuracy: modelAccuracy.overallAccuracy,
      confidenceLevel: modelAccuracy.confidenceLevel,
      overallSuccessProbability,
      predictedTimeToOffer,
      expectedSalaryRange
    },
    keyInsights,
    quickActions,
    interviewSuccessPredictions,
    jobSearchTimeline,
    salaryPredictions,
    optimalTiming,
    modelAccuracy
  });

  return sendResponse(res, response, statusCode);
});

/**
 * GET /api/predictive-analytics/interview-success
 * Predict interview success probability
 */
export const getInterviewSuccessPredictions = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  
  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const [interviews, predictions, mockSessions] = await Promise.all([
    Interview.find({ userId }).sort({ scheduledDate: -1 }),
    InterviewPrediction.find({ userId }),
    MockInterviewSession.find({ userId })
  ]);

  const interviewSuccessPredictions = calculateInterviewSuccessPredictions(interviews, predictions, mockSessions);

  const { response, statusCode } = successResponse("Interview success predictions retrieved", interviewSuccessPredictions);
  return sendResponse(res, response, statusCode);
});

/**
 * GET /api/predictive-analytics/job-search-timeline
 * Forecast job search timeline
 */
export const getJobSearchTimelineForecast = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  
  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const [jobs, interviews] = await Promise.all([
    Job.find({ userId }).sort({ dateApplied: -1 }),
    Interview.find({ userId }).sort({ scheduledDate: -1 })
  ]);

  const timeline = forecastJobSearchTimeline(jobs, interviews);

  const { response, statusCode } = successResponse("Job search timeline forecast retrieved", timeline);
  return sendResponse(res, response, statusCode);
});

/**
 * GET /api/predictive-analytics/salary-predictions
 * Predict salary negotiation outcomes
 */
export const getSalaryPredictions = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  
  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const [jobs, interviews] = await Promise.all([
    Job.find({ userId }),
    Interview.find({ userId })
  ]);

  const predictions = predictSalaryNegotiationOutcomes(jobs, interviews);

  const { response, statusCode } = successResponse("Salary predictions retrieved", predictions);
  return sendResponse(res, response, statusCode);
});

/**
 * GET /api/predictive-analytics/optimal-timing
 * Predict optimal timing for career moves
 */
export const getOptimalTimingPredictions = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  
  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const [interviews, jobs] = await Promise.all([
    Interview.find({ userId }),
    Job.find({ userId })
  ]);

  const timing = predictOptimalTiming(interviews, jobs);

  const { response, statusCode } = successResponse("Optimal timing predictions retrieved", timing);
  return sendResponse(res, response, statusCode);
});

/**
 * GET /api/predictive-analytics/scenarios
 * Generate scenario planning for different strategies
 */
export const getScenarioPlanning = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  
  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const [jobs, interviews, mockSessions] = await Promise.all([
    Job.find({ userId }),
    Interview.find({ userId }),
    MockInterviewSession.find({ userId })
  ]);

  const scenarios = generateScenarioPlanning(jobs, interviews, mockSessions);

  const { response, statusCode } = successResponse("Scenario planning generated", scenarios);
  return sendResponse(res, response, statusCode);
});

/**
 * GET /api/predictive-analytics/recommendations
 * Get recommendations for improving predicted outcomes
 */
export const getImprovementRecommendations = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  
  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const [interviews, jobs, predictions, mockSessions] = await Promise.all([
    Interview.find({ userId }),
    Job.find({ userId }),
    InterviewPrediction.find({ userId }),
    MockInterviewSession.find({ userId })
  ]);

  const recommendations = generateImprovementRecommendations(interviews, jobs, predictions, mockSessions);

  const { response, statusCode } = successResponse("Improvement recommendations retrieved", recommendations);
  return sendResponse(res, response, statusCode);
});

/**
 * GET /api/predictive-analytics/accuracy
 * Track prediction accuracy and model improvement
 */
export const getAccuracyTracking = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  
  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const [predictions, interviews] = await Promise.all([
    InterviewPrediction.find({ userId }),
    Interview.find({ userId })
  ]);

  const accuracy = trackPredictionAccuracy(predictions, interviews);

  const { response, statusCode } = successResponse("Accuracy tracking retrieved", accuracy);
  return sendResponse(res, response, statusCode);
});

// ============================================================================
// Helper Functions
// ============================================================================

function calculateInterviewSuccessPredictions(interviews, predictions, mockSessions) {
  // Calculate historical success rate
  const completedInterviews = interviews.filter(i => i.outcome?.result);
  const successfulInterviews = completedInterviews.filter(i => 
    ["Moved to Next Round", "Offer Extended", "Passed"].includes(i.outcome?.result)
  );
  
  const historicalSuccessRate = completedInterviews.length > 0 
    ? (successfulInterviews.length / completedInterviews.length) * 100 
    : 50; // Default to 50% if no history

  // Calculate preparation score from mock sessions
  const recentMocks = mockSessions.filter(m => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return new Date(m.createdAt) >= thirtyDaysAgo;
  });
  
  const avgMockScore = recentMocks.length > 0
    ? recentMocks.reduce((sum, m) => sum + (m.summary?.averageScore || 0), 0) / recentMocks.length
    : 0;

  // Get upcoming interviews with predictions
  const upcomingInterviews = interviews.filter(i => 
    new Date(i.scheduledDate) > new Date() && i.status !== "Completed"
  );

  const interviewPredictions = upcomingInterviews.map(interview => {
    const existingPrediction = predictions.find(p => 
      p.interviewId?.toString() === interview._id.toString()
    );

    // Calculate success probability based on multiple factors
    let baseProb = historicalSuccessRate;
    
    // Adjust based on interview type
    const typeBonus = getInterviewTypeBonus(interview.interviewType, interviews);
    baseProb += typeBonus;

    // Adjust based on preparation
    const prepBonus = avgMockScore > 0 ? (avgMockScore - 50) * 0.3 : 0;
    baseProb += prepBonus;

    // Adjust based on existing prediction if available
    if (existingPrediction) {
      baseProb = (baseProb + existingPrediction.successProbability) / 2;
    }

    // Ensure probability is within bounds
    const successProbability = Math.min(95, Math.max(5, baseProb));

    // Calculate confidence interval
    const sampleSize = completedInterviews.length;
    const confidenceMargin = sampleSize > 10 ? 8 : sampleSize > 5 ? 12 : 18;

    return {
      interviewId: interview._id,
      company: interview.company,
      position: interview.position || interview.title,
      interviewType: interview.interviewType,
      scheduledDate: interview.scheduledDate,
      successProbability: Math.round(successProbability * 10) / 10,
      confidenceInterval: {
        low: Math.max(5, Math.round((successProbability - confidenceMargin) * 10) / 10),
        high: Math.min(95, Math.round((successProbability + confidenceMargin) * 10) / 10)
      },
      factors: {
        historicalPerformance: Math.round(historicalSuccessRate),
        preparationLevel: Math.round(avgMockScore) || 50,
        interviewTypeAdvantage: typeBonus > 0 ? "Positive" : typeBonus < 0 ? "Negative" : "Neutral"
      },
      recommendations: generateInterviewRecommendations(interview, avgMockScore, historicalSuccessRate)
    };
  });

  return {
    overall: {
      historicalSuccessRate: Math.round(historicalSuccessRate * 10) / 10,
      totalCompleted: completedInterviews.length,
      totalSuccessful: successfulInterviews.length,
      avgPreparationScore: Math.round(avgMockScore) || 50,
      upcomingCount: upcomingInterviews.length
    },
    predictions: interviewPredictions,
    trend: calculateSuccessTrend(interviews)
  };
}

function getInterviewTypeBonus(type, interviews) {
  // Calculate success rate per interview type
  const typeInterviews = interviews.filter(i => i.interviewType === type && i.outcome?.result);
  if (typeInterviews.length === 0) return 0;

  const typeSuccess = typeInterviews.filter(i => 
    ["Moved to Next Round", "Offer Extended", "Passed"].includes(i.outcome?.result)
  ).length;

  const typeRate = (typeSuccess / typeInterviews.length) * 100;
  
  // Compare to overall average
  const allComplete = interviews.filter(i => i.outcome?.result);
  const overallRate = allComplete.length > 0
    ? (allComplete.filter(i => ["Moved to Next Round", "Offer Extended", "Passed"].includes(i.outcome?.result)).length / allComplete.length) * 100
    : 50;

  return (typeRate - overallRate) * 0.5;
}

function generateInterviewRecommendations(interview, prepScore, historicalRate) {
  const recommendations = [];

  if (prepScore < 60) {
    recommendations.push({
      priority: "High",
      category: "Preparation",
      action: "Complete more mock interviews to boost confidence",
      expectedImpact: "+10-15% success probability"
    });
  }

  if (interview.interviewType === "Technical") {
    recommendations.push({
      priority: "Medium",
      category: "Technical Skills",
      action: "Review common technical questions for this role",
      expectedImpact: "+5-10% success probability"
    });
  }

  if (historicalRate < 50) {
    recommendations.push({
      priority: "High",
      category: "Interview Skills",
      action: "Focus on STAR method responses and active listening",
      expectedImpact: "+8-12% success probability"
    });
  }

  recommendations.push({
    priority: "Medium",
    category: "Research",
    action: `Research ${interview.company}'s recent news and culture`,
    expectedImpact: "+5-8% success probability"
  });

  return recommendations.slice(0, 3);
}

function calculateSuccessTrend(interviews) {
  const sorted = [...interviews]
    .filter(i => i.outcome?.result)
    .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));

  if (sorted.length < 4) return { direction: "Insufficient Data", change: 0 };

  const midpoint = Math.floor(sorted.length / 2);
  const firstHalf = sorted.slice(0, midpoint);
  const secondHalf = sorted.slice(midpoint);

  const firstRate = calculateSuccessRate(firstHalf);
  const secondRate = calculateSuccessRate(secondHalf);

  const change = secondRate - firstRate;

  return {
    direction: change > 5 ? "Improving" : change < -5 ? "Declining" : "Stable",
    change: Math.round(change * 10) / 10,
    firstPeriodRate: Math.round(firstRate * 10) / 10,
    secondPeriodRate: Math.round(secondRate * 10) / 10
  };
}

function calculateSuccessRate(interviews) {
  if (interviews.length === 0) return 0;
  const successful = interviews.filter(i => 
    ["Moved to Next Round", "Offer Extended", "Passed"].includes(i.outcome?.result)
  ).length;
  return (successful / interviews.length) * 100;
}

function forecastJobSearchTimeline(jobs, interviews) {
  const now = new Date();
  
  // Calculate current velocity
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const recentApplications = jobs.filter(j => new Date(j.dateApplied) >= last30Days);
  const weeklyApplicationRate = (recentApplications.length / 30) * 7;

  // Calculate conversion rates
  const totalApps = jobs.length;
  const interviewCount = interviews.length;
  const offersCount = jobs.filter(j => ["Offer", "Accepted"].includes(j.status)).length;

  const appToInterviewRate = totalApps > 0 ? (interviewCount / totalApps) * 100 : 10;
  const interviewToOfferRate = interviewCount > 0 ? (offersCount / interviewCount) * 100 : 15;

  // Calculate estimated time to offer
  const appsNeededForInterview = appToInterviewRate > 0 ? 100 / appToInterviewRate : 10;
  const interviewsNeededForOffer = interviewToOfferRate > 0 ? 100 / interviewToOfferRate : 7;
  const totalAppsNeeded = Math.ceil(appsNeededForInterview * interviewsNeededForOffer);

  const weeksToOffer = weeklyApplicationRate > 0 
    ? Math.ceil(totalAppsNeeded / weeklyApplicationRate)
    : 12;

  const estimatedOfferDate = new Date(now.getTime() + weeksToOffer * 7 * 24 * 60 * 60 * 1000);

  // Generate weekly milestones
  const milestones = generateTimelineMilestones(now, weeksToOffer, weeklyApplicationRate, appToInterviewRate);

  return {
    currentVelocity: {
      weeklyApplications: Math.round(weeklyApplicationRate * 10) / 10,
      monthlyApplications: Math.round(weeklyApplicationRate * 4.3),
      trend: weeklyApplicationRate > 5 ? "Good" : weeklyApplicationRate > 2 ? "Moderate" : "Low"
    },
    conversionRates: {
      applicationToInterview: Math.round(appToInterviewRate * 10) / 10,
      interviewToOffer: Math.round(interviewToOfferRate * 10) / 10,
      overallFunnel: Math.round((appToInterviewRate * interviewToOfferRate / 100) * 10) / 10
    },
    forecast: {
      estimatedWeeksToOffer: weeksToOffer,
      estimatedOfferDate: estimatedOfferDate.toISOString().split('T')[0],
      confidenceLevel: totalApps > 20 ? "High" : totalApps > 10 ? "Medium" : "Low",
      confidenceInterval: {
        optimistic: Math.max(1, Math.floor(weeksToOffer * 0.7)),
        pessimistic: Math.ceil(weeksToOffer * 1.5)
      }
    },
    milestones,
    recommendations: generateTimelineRecommendations(weeklyApplicationRate, appToInterviewRate)
  };
}

function generateTimelineMilestones(startDate, weeksToOffer, weeklyRate, conversionRate) {
  const milestones = [];
  let currentApps = 0;
  let currentInterviews = 0;

  for (let week = 1; week <= Math.min(weeksToOffer, 12); week++) {
    currentApps += weeklyRate;
    const newInterviews = Math.floor((weeklyRate * conversionRate) / 100);
    currentInterviews += newInterviews;

    const milestoneDate = new Date(startDate.getTime() + week * 7 * 24 * 60 * 60 * 1000);

    milestones.push({
      week,
      date: milestoneDate.toISOString().split('T')[0],
      expectedApplications: Math.round(currentApps),
      expectedInterviews: Math.round(currentInterviews),
      milestone: getMilestoneDescription(week, currentApps, currentInterviews)
    });
  }

  return milestones;
}

function getMilestoneDescription(week, apps, interviews) {
  if (week === 1) return "Initial momentum building";
  if (interviews >= 1 && week <= 3) return "First interviews expected";
  if (interviews >= 5) return "Interview pipeline active";
  if (apps >= 20) return "Strong application volume";
  return "Steady progress";
}

function generateTimelineRecommendations(weeklyRate, conversionRate) {
  const recommendations = [];

  if (weeklyRate < 3) {
    recommendations.push({
      priority: "High",
      action: "Increase application volume to at least 5 per week",
      expectedImpact: "Reduce time to offer by 2-3 weeks"
    });
  }

  if (conversionRate < 15) {
    recommendations.push({
      priority: "High",
      action: "Improve resume and application quality for better conversion",
      expectedImpact: "Double your interview invitations"
    });
  }

  recommendations.push({
    priority: "Medium",
    action: "Set up job alerts for immediate notification of new postings",
    expectedImpact: "Apply earlier, increase response rates by 10-15%"
  });

  return recommendations.slice(0, 4);
}

function predictSalaryNegotiationOutcomes(jobs, interviews) {
  // Analyze jobs with salary information
  const jobsWithSalary = jobs.filter(j => j.salary?.min || j.salary?.max);
  const offeredJobs = jobs.filter(j => ["Offer", "Accepted"].includes(j.status));

  // Calculate average salary ranges
  let avgMinSalary = 0;
  let avgMaxSalary = 0;
  if (jobsWithSalary.length > 0) {
    avgMinSalary = jobsWithSalary.reduce((sum, j) => sum + (j.salary?.min || 0), 0) / jobsWithSalary.length;
    avgMaxSalary = jobsWithSalary.reduce((sum, j) => sum + (j.salary?.max || j.salary?.min || 0), 0) / jobsWithSalary.length;
  }

  // Calculate interview performance impact
  const successfulInterviews = interviews.filter(i => 
    ["Moved to Next Round", "Offer Extended"].includes(i.outcome?.result)
  );
  const performanceMultiplier = successfulInterviews.length > 0 
    ? Math.min(1.15, 1 + (successfulInterviews.length * 0.02))
    : 1;

  // Generate predictions for active applications
  const activeJobs = jobs.filter(j => 
    !["Rejected", "Withdrawn", "Ghosted"].includes(j.status) && j.status !== "Offer"
  );

  const predictions = activeJobs.slice(0, 5).map(job => {
    const minSalary = job.salary?.min || avgMinSalary || 60000;
    const maxSalary = job.salary?.max || avgMaxSalary || minSalary * 1.2;
    const midpoint = (minSalary + maxSalary) / 2;

    // Predict negotiation outcome
    const baseNegotiationGain = 0.05; // 5% baseline
    const performanceBonus = (performanceMultiplier - 1);
    const predictedGain = baseNegotiationGain + performanceBonus;

    const predictedSalary = Math.round(midpoint * (1 + predictedGain));

    return {
      jobId: job._id,
      company: job.company,
      position: job.title,
      status: job.status,
      salaryRange: {
        min: Math.round(minSalary),
        max: Math.round(maxSalary),
        midpoint: Math.round(midpoint)
      },
      prediction: {
        likelyOffer: Math.round(midpoint * 0.95),
        withNegotiation: predictedSalary,
        optimisticOutcome: Math.round(midpoint * (1 + predictedGain + 0.05)),
        expectedGain: Math.round(predictedGain * 100)
      },
      confidenceLevel: job.salary?.min ? "High" : "Low",
      negotiationStrategies: generateNegotiationStrategies(job, performanceMultiplier)
    };
  });

  return {
    overview: {
      avgSalaryRangeMin: Math.round(avgMinSalary),
      avgSalaryRangeMax: Math.round(avgMaxSalary),
      jobsAnalyzed: jobsWithSalary.length,
      offersReceived: offeredJobs.length,
      performanceMultiplier: Math.round(performanceMultiplier * 100) / 100
    },
    predictions,
    marketInsights: {
      negotiationSuccessRate: 85,
      avgNegotiationIncrease: "5-15%",
      bestTimeToNegotiate: "After verbal offer, before written"
    },
    recommendations: [
      {
        priority: "High",
        action: "Research specific salary data for each target company",
        expectedImpact: "Stronger negotiation position"
      },
      {
        priority: "Medium",
        action: "Prepare 3-5 specific achievements with quantifiable results",
        expectedImpact: "Justify higher salary requests"
      },
      {
        priority: "Medium",
        action: "Practice negotiation conversations with a mentor",
        expectedImpact: "Increased confidence during negotiation"
      }
    ]
  };
}

function generateNegotiationStrategies(job, performanceMultiplier) {
  const strategies = [
    {
      approach: "Anchor High",
      description: "Start negotiations 15-20% above your target",
      riskLevel: "Medium",
      successRate: 70
    },
    {
      approach: "Total Compensation",
      description: "Negotiate base salary plus benefits package",
      riskLevel: "Low",
      successRate: 85
    }
  ];

  if (performanceMultiplier > 1.1) {
    strategies.push({
      approach: "Leverage Performance",
      description: "Use strong interview performance as negotiation leverage",
      riskLevel: "Low",
      successRate: 80
    });
  }

  return strategies;
}

function predictOptimalTiming(interviews, jobs) {
  // Analyze when interviews were most successful
  const interviewsByDay = {};
  const interviewsByHour = {};

  interviews.filter(i => i.outcome?.result).forEach(interview => {
    const date = new Date(interview.scheduledDate);
    const day = date.toLocaleDateString('en-US', { weekday: 'long' });
    const hour = date.getHours();

    if (!interviewsByDay[day]) interviewsByDay[day] = { total: 0, successful: 0 };
    if (!interviewsByHour[hour]) interviewsByHour[hour] = { total: 0, successful: 0 };

    interviewsByDay[day].total++;
    interviewsByHour[hour].total++;

    if (["Moved to Next Round", "Offer Extended", "Passed"].includes(interview.outcome?.result)) {
      interviewsByDay[day].successful++;
      interviewsByHour[hour].successful++;
    }
  });

  // Find best day and time
  const dayRates = Object.entries(interviewsByDay).map(([day, data]) => ({
    day,
    successRate: data.total > 0 ? (data.successful / data.total) * 100 : 0,
    sampleSize: data.total
  })).sort((a, b) => b.successRate - a.successRate);

  const hourRates = Object.entries(interviewsByHour).map(([hour, data]) => ({
    hour: parseInt(hour),
    timeSlot: formatTimeSlot(parseInt(hour)),
    successRate: data.total > 0 ? (data.successful / data.total) * 100 : 0,
    sampleSize: data.total
  })).sort((a, b) => b.successRate - a.successRate);

  // Analyze job application timing
  const appsByMonth = {};
  jobs.forEach(job => {
    const month = new Date(job.dateApplied).toLocaleDateString('en-US', { month: 'long' });
    if (!appsByMonth[month]) appsByMonth[month] = { applied: 0, interviews: 0 };
    appsByMonth[month].applied++;
  });

  // Cross-reference with interview invitations
  interviews.forEach(interview => {
    const month = new Date(interview.createdAt || interview.scheduledDate).toLocaleDateString('en-US', { month: 'long' });
    if (appsByMonth[month]) appsByMonth[month].interviews++;
  });

  const monthlyAnalysis = Object.entries(appsByMonth).map(([month, data]) => ({
    month,
    applications: data.applied,
    interviews: data.interviews,
    conversionRate: data.applied > 0 ? Math.round((data.interviews / data.applied) * 100) : 0
  })).sort((a, b) => b.conversionRate - a.conversionRate);

  return {
    interviewTiming: {
      bestDays: dayRates.slice(0, 3).map(d => ({
        day: d.day,
        successRate: Math.round(d.successRate),
        confidence: d.sampleSize >= 5 ? "High" : d.sampleSize >= 3 ? "Medium" : "Low"
      })),
      bestTimeSlots: hourRates.slice(0, 3).map(h => ({
        timeSlot: h.timeSlot,
        successRate: Math.round(h.successRate),
        confidence: h.sampleSize >= 5 ? "High" : h.sampleSize >= 3 ? "Medium" : "Low"
      })),
      avoidTimes: hourRates.filter(h => h.successRate < 30 && h.sampleSize >= 2).map(h => h.timeSlot)
    },
    applicationTiming: {
      bestMonths: monthlyAnalysis.slice(0, 3),
      marketCycles: [
        { period: "January-February", activity: "High", reason: "New budget cycles" },
        { period: "September-October", activity: "High", reason: "Q4 hiring push" },
        { period: "June-August", activity: "Low", reason: "Summer slowdown" }
      ]
    },
    careerMoveRecommendations: [
      {
        timing: "Now",
        recommendation: "Current market conditions favor job seekers",
        confidence: "Medium"
      },
      {
        timing: "Within 3 months",
        recommendation: "Schedule interviews mid-week for optimal results",
        confidence: dayRates.length > 0 ? "High" : "Low"
      }
    ]
  };
}

function formatTimeSlot(hour) {
  if (hour < 12) return `${hour}:00 AM`;
  if (hour === 12) return "12:00 PM";
  return `${hour - 12}:00 PM`;
}

function generateScenarioPlanning(jobs, interviews, mockSessions) {
  const currentStats = {
    weeklyApps: calculateWeeklyApplications(jobs),
    interviewRate: calculateInterviewRate(jobs, interviews),
    successRate: calculateSuccessRate(interviews),
    prepScore: calculatePrepScore(mockSessions)
  };

  const scenarios = [
    generateScenario("Current Pace", currentStats, 1, 1, 1),
    generateScenario("Increased Volume", currentStats, 1.5, 1, 1),
    generateScenario("Quality Focus", currentStats, 0.8, 1.3, 1.2),
    generateScenario("Maximum Effort", currentStats, 1.5, 1.2, 1.2),
    generateScenario("Targeted Approach", currentStats, 0.6, 1.5, 1.3)
  ];

  return {
    currentState: currentStats,
    scenarios,
    recommendation: selectBestScenario(scenarios),
    comparisonChart: scenarios.map(s => ({
      name: s.name,
      weeksToOffer: s.projectedWeeksToOffer,
      effortLevel: s.effortLevel
    }))
  };
}

function calculateWeeklyApplications(jobs) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recent = jobs.filter(j => new Date(j.dateApplied) >= thirtyDaysAgo);
  return (recent.length / 30) * 7;
}

function calculateInterviewRate(jobs, interviews) {
  if (jobs.length === 0) return 10;
  return (interviews.length / jobs.length) * 100;
}

function calculatePrepScore(mockSessions) {
  if (mockSessions.length === 0) return 50;
  const recent = mockSessions.filter(m => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return new Date(m.createdAt) >= thirtyDaysAgo;
  });
  if (recent.length === 0) return 50;
  return recent.reduce((sum, m) => sum + (m.summary?.averageScore || 50), 0) / recent.length;
}

function generateScenario(name, currentStats, appMultiplier, conversionMultiplier, successMultiplier) {
  const adjustedWeeklyApps = currentStats.weeklyApps * appMultiplier;
  const adjustedInterviewRate = Math.min(50, currentStats.interviewRate * conversionMultiplier);
  const adjustedSuccessRate = Math.min(80, currentStats.successRate * successMultiplier);

  // Calculate interviews needed for offer
  const interviewsPerWeek = (adjustedWeeklyApps * adjustedInterviewRate) / 100;
  const interviewsNeeded = adjustedSuccessRate > 0 ? 100 / adjustedSuccessRate : 10;
  const weeksToOffer = interviewsPerWeek > 0 ? Math.ceil(interviewsNeeded / interviewsPerWeek) : 20;

  return {
    name,
    description: getScenarioDescription(name),
    adjustments: {
      weeklyApplications: Math.round(adjustedWeeklyApps * 10) / 10,
      interviewRate: Math.round(adjustedInterviewRate * 10) / 10,
      successRate: Math.round(adjustedSuccessRate * 10) / 10
    },
    projectedWeeksToOffer: Math.min(52, weeksToOffer),
    projectedOfferDate: new Date(Date.now() + weeksToOffer * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    effortLevel: getEffortLevel(appMultiplier, conversionMultiplier),
    risks: getScenarioRisks(name),
    benefits: getScenarioBenefits(name)
  };
}

function getScenarioDescription(name) {
  const descriptions = {
    "Current Pace": "Continue with your current job search strategy",
    "Increased Volume": "Apply to more positions while maintaining quality",
    "Quality Focus": "Apply to fewer, better-matched positions with enhanced preparation",
    "Maximum Effort": "Maximize both quantity and quality of applications",
    "Targeted Approach": "Focus on ideal-fit positions with extensive research"
  };
  return descriptions[name] || "";
}

function getEffortLevel(appMultiplier, conversionMultiplier) {
  const total = appMultiplier + conversionMultiplier;
  if (total >= 2.5) return "High";
  if (total >= 2) return "Medium-High";
  if (total >= 1.5) return "Medium";
  return "Low-Medium";
}

function getScenarioRisks(name) {
  const risks = {
    "Current Pace": ["May take longer to find opportunities"],
    "Increased Volume": ["Potential burnout", "Lower application quality"],
    "Quality Focus": ["Fewer total opportunities", "Longer timeline if mismatched"],
    "Maximum Effort": ["High burnout risk", "Sustainability challenges"],
    "Targeted Approach": ["Very limited pipeline", "High stakes per application"]
  };
  return risks[name] || [];
}

function getScenarioBenefits(name) {
  const benefits = {
    "Current Pace": ["Sustainable long-term", "Maintains work-life balance"],
    "Increased Volume": ["More opportunities", "Faster interview pipeline"],
    "Quality Focus": ["Higher success rate", "Better job matches"],
    "Maximum Effort": ["Fastest potential results", "Comprehensive market coverage"],
    "Targeted Approach": ["Best cultural fit", "Higher satisfaction potential"]
  };
  return benefits[name] || [];
}

function selectBestScenario(scenarios) {
  // Balance time to offer with effort level
  const scored = scenarios.map(s => ({
    ...s,
    score: (52 - s.projectedWeeksToOffer) * 2 - (s.effortLevel === "High" ? 10 : s.effortLevel === "Medium-High" ? 5 : 0)
  })).sort((a, b) => b.score - a.score);

  return {
    recommended: scored[0].name,
    reason: `Offers the best balance of timeline (${scored[0].projectedWeeksToOffer} weeks) and sustainability`,
    alternativeIfUrgent: scenarios.find(s => s.name === "Maximum Effort")?.name
  };
}

function generateImprovementRecommendations(interviews, jobs, predictions, mockSessions) {
  const recommendations = [];
  
  // Analyze current state
  const successRate = calculateSuccessRate(interviews);
  const prepScore = calculatePrepScore(mockSessions);
  const interviewRate = calculateInterviewRate(jobs, interviews);

  // Interview preparation recommendations
  if (prepScore < 60) {
    recommendations.push({
      category: "Interview Preparation",
      priority: "High",
      currentState: `Average preparation score: ${Math.round(prepScore)}%`,
      recommendation: "Complete at least 3 mock interviews per week",
      expectedImprovement: "+15-20% interview success rate",
      timeframe: "2-3 weeks",
      actionItems: [
        "Schedule daily practice sessions (15-30 min)",
        "Focus on behavioral questions with STAR method",
        "Record and review your practice answers"
      ]
    });
  }

  // Application quality recommendations
  if (interviewRate < 15) {
    recommendations.push({
      category: "Application Quality",
      priority: "High",
      currentState: `Interview rate: ${Math.round(interviewRate)}%`,
      recommendation: "Improve resume targeting and application quality",
      expectedImprovement: "Double interview invitation rate",
      timeframe: "1-2 weeks",
      actionItems: [
        "Customize resume for each application",
        "Include keywords from job description",
        "Write compelling cover letters"
      ]
    });
  }

  // Success rate recommendations
  if (successRate < 40) {
    recommendations.push({
      category: "Interview Performance",
      priority: "High",
      currentState: `Success rate: ${Math.round(successRate)}%`,
      recommendation: "Focus on interview technique and company research",
      expectedImprovement: "+20-30% success rate",
      timeframe: "3-4 weeks",
      actionItems: [
        "Research each company thoroughly before interviews",
        "Prepare 5+ questions to ask interviewers",
        "Practice answering 'Tell me about yourself' confidently"
      ]
    });
  }

  // Volume recommendations
  const weeklyApps = calculateWeeklyApplications(jobs);
  if (weeklyApps < 5) {
    recommendations.push({
      category: "Application Volume",
      priority: "Medium",
      currentState: `Current pace: ${Math.round(weeklyApps)} apps/week`,
      recommendation: "Increase application volume while maintaining quality",
      expectedImprovement: "Faster time to offer",
      timeframe: "Immediate",
      actionItems: [
        "Set daily application targets (1-2 per day)",
        "Use job boards with alerts",
        "Network actively for referrals"
      ]
    });
  }

  // Networking recommendations
  recommendations.push({
    category: "Networking",
    priority: "Medium",
    currentState: "Networking improves outcomes by 40%+",
    recommendation: "Increase networking activities for referral opportunities",
    expectedImprovement: "3x higher interview conversion",
    timeframe: "Ongoing",
    actionItems: [
      "Reach out to 3-5 contacts per week",
      "Attend industry events or virtual meetups",
      "Request informational interviews"
    ]
  });

  return {
    recommendations: recommendations.sort((a, b) => 
      a.priority === "High" ? -1 : b.priority === "High" ? 1 : 0
    ),
    overallAssessment: getOverallAssessment(successRate, prepScore, interviewRate),
    potentialImprovement: calculatePotentialImprovement(recommendations)
  };
}

function getOverallAssessment(successRate, prepScore, interviewRate) {
  const avgScore = (successRate + prepScore + interviewRate) / 3;
  
  if (avgScore >= 60) return { level: "Strong", message: "Your job search fundamentals are solid" };
  if (avgScore >= 40) return { level: "Moderate", message: "Some areas need improvement for better results" };
  return { level: "Needs Work", message: "Focus on the high-priority recommendations below" };
}

function calculatePotentialImprovement(recommendations) {
  const highPriority = recommendations.filter(r => r.priority === "High").length;
  
  if (highPriority >= 3) return "50-70% improvement possible with focused effort";
  if (highPriority >= 2) return "30-50% improvement possible";
  if (highPriority >= 1) return "15-30% improvement possible";
  return "10-20% optimization possible";
}

function trackPredictionAccuracy(predictions, interviews) {
  // Find predictions that have outcomes
  const predictionsWithOutcomes = predictions.filter(p => {
    const interview = interviews.find(i => 
      i._id.toString() === p.interviewId?.toString()
    );
    return interview?.outcome?.result;
  });

  if (predictionsWithOutcomes.length === 0) {
    return {
      overallAccuracy: 0,
      confidenceLevel: "Insufficient Data",
      sampleSize: 0,
      breakdown: {},
      trend: "Insufficient Data",
      calibration: { message: "Need more completed interviews with predictions" }
    };
  }

  // Calculate accuracy
  let correct = 0;
  let close = 0;
  const buckets = { high: { correct: 0, total: 0 }, medium: { correct: 0, total: 0 }, low: { correct: 0, total: 0 } };

  predictionsWithOutcomes.forEach(prediction => {
    const interview = interviews.find(i => 
      i._id.toString() === prediction.interviewId?.toString()
    );
    
    const wasSuccessful = ["Moved to Next Round", "Offer Extended", "Passed"].includes(interview.outcome?.result);
    const predictedSuccess = prediction.successProbability >= 50;

    // Categorize by probability bucket
    let bucket = "medium";
    if (prediction.successProbability >= 70) bucket = "high";
    else if (prediction.successProbability < 40) bucket = "low";

    buckets[bucket].total++;
    
    if (predictedSuccess === wasSuccessful) {
      correct++;
      buckets[bucket].correct++;
    } else if (Math.abs(prediction.successProbability - (wasSuccessful ? 100 : 0)) < 30) {
      close++;
    }
  });

  const accuracy = (correct / predictionsWithOutcomes.length) * 100;
  const closeAccuracy = ((correct + close) / predictionsWithOutcomes.length) * 100;

  return {
    overallAccuracy: Math.round(accuracy),
    closeAccuracy: Math.round(closeAccuracy),
    confidenceLevel: predictionsWithOutcomes.length >= 20 ? "High" : 
                     predictionsWithOutcomes.length >= 10 ? "Medium" : "Low",
    sampleSize: predictionsWithOutcomes.length,
    breakdown: {
      highConfidence: {
        accuracy: buckets.high.total > 0 ? Math.round((buckets.high.correct / buckets.high.total) * 100) : 0,
        sampleSize: buckets.high.total
      },
      mediumConfidence: {
        accuracy: buckets.medium.total > 0 ? Math.round((buckets.medium.correct / buckets.medium.total) * 100) : 0,
        sampleSize: buckets.medium.total
      },
      lowConfidence: {
        accuracy: buckets.low.total > 0 ? Math.round((buckets.low.correct / buckets.low.total) * 100) : 0,
        sampleSize: buckets.low.total
      }
    },
    trend: accuracy > 70 ? "Excellent" : accuracy > 50 ? "Good" : "Needs Improvement",
    calibration: {
      isCalibrated: Math.abs(accuracy - 50) < 20,
      message: accuracy > 70 ? "Predictions are well calibrated" : 
               accuracy > 50 ? "Predictions are reasonably accurate" :
               "Consider adjusting prediction factors"
    },
    improvementSuggestions: generateAccuracyImprovementSuggestions(accuracy, buckets)
  };
}

function generateAccuracyImprovementSuggestions(accuracy, buckets) {
  const suggestions = [];

  if (accuracy < 60) {
    suggestions.push("More historical data will improve prediction accuracy");
  }

  if (buckets.high.total > 0 && buckets.high.correct / buckets.high.total < 0.7) {
    suggestions.push("High-confidence predictions may be overly optimistic");
  }

  if (buckets.low.total > 0 && buckets.low.correct / buckets.low.total > 0.5) {
    suggestions.push("Low-probability interviews are outperforming predictions");
  }

  if (suggestions.length === 0) {
    suggestions.push("Continue tracking to maintain prediction accuracy");
  }

  return suggestions;
}



// Generate key insights based on user data
function generateKeyInsights(interviews, jobs, interviewPredictions, timeline, salaryPredictions) {
  const insights = [];

  // Interview success insight
  const successRate = interviewPredictions.overall?.historicalSuccessRate || 50;
  if (successRate >= 70) {
    insights.push({
      type: "positive",
      title: "Strong Interview Performance",
      description: `Your interview success rate of ${Math.round(successRate)}% is above average. Keep up the great preparation!`
    });
  } else if (successRate < 40) {
    insights.push({
      type: "warning",
      title: "Interview Success Needs Attention",
      description: `Your success rate of ${Math.round(successRate)}% could be improved with more targeted preparation.`
    });
  } else {
    insights.push({
      type: "info",
      title: "Solid Interview Performance",
      description: `Your ${Math.round(successRate)}% success rate is in line with typical job seekers.`
    });
  }

  // Application velocity insight
  const weeklyApps = timeline.currentVelocity?.weeklyApplications || 0;
  if (weeklyApps >= 10) {
    insights.push({
      type: "positive",
      title: "Excellent Application Volume",
      description: `You're applying to ${Math.round(weeklyApps)} jobs per week - great momentum!`
    });
  } else if (weeklyApps < 3) {
    insights.push({
      type: "warning",
      title: "Low Application Activity",
      description: "Increasing your application volume could speed up your job search significantly."
    });
  }

  // Conversion rate insight
  const conversionRate = timeline.conversionRates?.applicationToInterview || 0;
  if (conversionRate >= 20) {
    insights.push({
      type: "positive",
      title: "High Conversion Rate",
      description: `${Math.round(conversionRate)}% of your applications lead to interviews - your resume is performing well!`
    });
  } else if (conversionRate < 10 && jobs.length >= 10) {
    insights.push({
      type: "warning",
      title: "Low Application Conversion",
      description: "Consider updating your resume or tailoring applications to improve interview rates."
    });
  }

  // Upcoming interviews insight
  const upcomingCount = interviewPredictions.overall?.upcomingCount || 0;
  if (upcomingCount > 0) {
    insights.push({
      type: "info",
      title: `${upcomingCount} Upcoming Interview${upcomingCount > 1 ? 's' : ''}`,
      description: `You have interviews scheduled - check the predictions for preparation recommendations.`
    });
  }

  // Timeline insight
  const weeksToOffer = timeline.forecast?.estimatedWeeksToOffer;
  if (weeksToOffer && weeksToOffer <= 4) {
    insights.push({
      type: "positive",
      title: "On Track for Quick Success",
      description: `Based on your current pace, you could receive an offer within ${weeksToOffer} weeks.`
    });
  }

  return insights.slice(0, 4);
}

// Generate quick action recommendations
function generateQuickActions(interviewPredictions, timeline, salaryPredictions) {
  const actions = [];

  const upcomingCount = interviewPredictions.overall?.upcomingCount || 0;
  const weeklyApps = timeline.currentVelocity?.weeklyApplications || 0;
  const prepScore = interviewPredictions.overall?.avgPreparationScore || 50;

  if (upcomingCount > 0) {
    actions.push({
      icon: "",
      title: "Prepare for Interviews",
      expectedImpact: `Review predictions for ${upcomingCount} upcoming interview${upcomingCount > 1 ? 's' : ''}`
    });
  }

  if (prepScore < 70) {
    actions.push({
      icon: "",
      title: "Practice Mock Interviews",
      expectedImpact: "Boost confidence and success probability by 10-15%"
    });
  }

  if (weeklyApps < 5) {
    actions.push({
      icon: "",
      title: "Increase Application Volume",
      expectedImpact: "Applying to 5+ jobs/week accelerates your timeline"
    });
  }

  if (salaryPredictions.predictions?.length > 0) {
    actions.push({
      icon: "",
      title: "Review Salary Negotiations",
      expectedImpact: "Prepare strategies for upcoming offers"
    });
  }

  actions.push({
    icon: "",
    title: "Track Your Progress",
    expectedImpact: "Regular monitoring improves prediction accuracy"
  });

  return actions.slice(0, 4);
}
