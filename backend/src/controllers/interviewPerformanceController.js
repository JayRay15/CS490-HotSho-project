import { Interview } from "../models/Interview.js";
import { Job } from "../models/Job.js";
import { MockInterviewSession } from "../models/MockInterviewSession.js";
import { successResponse, errorResponse, sendResponse, ERROR_CODES } from "../utils/responseFormat.js";
import { asyncHandler } from "../middleware/errorHandler.js";

// ============================================================================
// Interview Performance Analytics Controller
// ============================================================================

/**
 * GET /api/interview-performance/analytics
 * Get comprehensive interview performance analytics
 */
export const getInterviewPerformanceAnalytics = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  // Fetch all interviews and related data
  const [interviews, mockInterviews, jobs] = await Promise.all([
    Interview.find({ userId }).sort({ scheduledDate: -1 }),
    MockInterviewSession.find({ userId }).sort({ createdAt: -1 }),
    Job.find({ userId, status: { $in: ["Interview", "Offer", "Accepted", "Rejected"] } })
  ]);

  if (interviews.length === 0 && mockInterviews.length === 0) {
    const { response, statusCode } = successResponse("No interview data available", {
      hasData: false,
      message: "Start tracking your interviews to see performance analytics"
    });
    return sendResponse(res, response, statusCode);
  }

  // Calculate conversion rates
  const conversionRates = calculateConversionRates(interviews, jobs);

  // Analyze by format and type
  const formatAnalysis = analyzeByFormat(interviews);
  const typeAnalysis = analyzeByType(interviews);

  // Track improvement trends
  const improvementTrends = analyzeImprovementTrends(interviews, mockInterviews);

  // Industry and culture analysis
  const industryPerformance = analyzeByIndustry(interviews, jobs);
  const cultureAnalysis = analyzeByCulture(interviews, jobs);

  // Feedback analysis
  const feedbackThemes = analyzeFeedbackThemes(interviews, mockInterviews);

  // Confidence and anxiety tracking
  const confidenceTracking = analyzeConfidenceAndAnxiety(interviews, mockInterviews);

  // Generate coaching recommendations
  const coachingRecommendations = generateCoachingRecommendations(
    conversionRates,
    formatAnalysis,
    feedbackThemes,
    confidenceTracking,
    improvementTrends
  );

  // Benchmark against success patterns
  const benchmarking = generateBenchmarking(interviews, mockInterviews, conversionRates);

  // Summary statistics
  const summary = {
    totalInterviews: interviews.length,
    totalMockInterviews: mockInterviews.length,
    overallConversionRate: conversionRates.overall,
    averageConfidence: confidenceTracking.averageConfidence,
    improvementScore: improvementTrends.overallImprovement,
    lastInterviewDate: interviews[0]?.scheduledDate || null
  };

  const { response, statusCode } = successResponse("Interview performance analytics retrieved", {
    hasData: true,
    summary,
    conversionRates,
    formatAnalysis,
    typeAnalysis,
    improvementTrends,
    industryPerformance,
    cultureAnalysis,
    feedbackThemes,
    confidenceTracking,
    coachingRecommendations,
    benchmarking
  });

  return sendResponse(res, response, statusCode);
});

/**
 * GET /api/interview-performance/trends
 * Get improvement trends over time
 */
export const getImprovementTrends = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { period = "6months" } = req.query;

  const [interviews, mockInterviews] = await Promise.all([
    Interview.find({ userId }).sort({ scheduledDate: 1 }),
    MockInterviewSession.find({ userId }).sort({ createdAt: 1 })
  ]);

  const trends = calculateDetailedTrends(interviews, mockInterviews, period);

  const { response, statusCode } = successResponse("Improvement trends retrieved", trends);
  return sendResponse(res, response, statusCode);
});

/**
 * GET /api/interview-performance/coaching
 * Get personalized coaching recommendations
 */
export const getCoachingRecommendations = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;

  const [interviews, mockInterviews] = await Promise.all([
    Interview.find({ userId }).sort({ scheduledDate: -1 }).limit(20),
    MockInterviewSession.find({ userId }).sort({ createdAt: -1 }).limit(10)
  ]);

  const recommendations = generateDetailedCoachingPlan(interviews, mockInterviews);

  const { response, statusCode } = successResponse("Coaching recommendations retrieved", recommendations);
  return sendResponse(res, response, statusCode);
});

/**
 * GET /api/interview-performance/benchmarks
 * Get performance benchmarks
 */
export const getPerformanceBenchmarks = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;

  const [interviews, mockInterviews, allJobs] = await Promise.all([
    Interview.find({ userId }),
    MockInterviewSession.find({ userId }),
    Job.find({ userId })
  ]);

  const benchmarks = calculateComprehensiveBenchmarks(interviews, mockInterviews, allJobs);

  const { response, statusCode } = successResponse("Performance benchmarks retrieved", benchmarks);
  return sendResponse(res, response, statusCode);
});

// ============================================================================
// Helper Functions
// ============================================================================

function calculateConversionRates(interviews, jobs) {
  // Count all interviews, but only successful ones with outcomes for success rate
  const totalInterviews = interviews.length;
  const interviewsWithOutcome = interviews.filter(i => i.outcome?.result && i.outcome.result !== "Pending" && i.outcome.result !== "Waiting for Feedback");
  
  const offers = jobs.filter(j => ["Offer", "Accepted"].includes(j.status)).length;
  const interviewStage = jobs.filter(j => j.status === "Interview").length;

  // Calculate by stage
  const phoneScreens = interviews.filter(i => i.interviewType === "Phone Screen" || i.interviewType === "Phone");
  const phoneScreensWithOutcome = phoneScreens.filter(i => i.outcome?.result);
  const phoneToNext = phoneScreens.filter(i => 
    i.outcome?.result === "Moved to Next Round" || i.outcome?.result === "Offer Extended" || i.outcome?.result === "Passed"
  ).length;

  const technical = interviews.filter(i => i.interviewType === "Technical");
  const technicalWithOutcome = technical.filter(i => i.outcome?.result);
  const technicalToNext = technical.filter(i => 
    i.outcome?.result === "Moved to Next Round" || i.outcome?.result === "Offer Extended" || i.outcome?.result === "Passed"
  ).length;

  const behavioral = interviews.filter(i => i.interviewType === "Behavioral");
  const behavioralWithOutcome = behavioral.filter(i => i.outcome?.result);
  const behavioralToNext = behavioral.filter(i => 
    i.outcome?.result === "Moved to Next Round" || i.outcome?.result === "Offer Extended" || i.outcome?.result === "Passed"
  ).length;

  const final = interviews.filter(i => i.interviewType === "Final Round");
  const finalWithOutcome = final.filter(i => i.outcome?.result);
  const finalToOffer = final.filter(i => i.outcome?.result === "Offer Extended").length;

  // Time series data
  const last6Months = new Date();
  last6Months.setMonth(last6Months.getMonth() - 6);
  
  const recentInterviews = interviews.filter(i => new Date(i.date) >= last6Months);
  const monthlyData = calculateMonthlyConversion(recentInterviews);

  // Calculate success rate from interviews with outcomes
  const successfulInterviews = interviewsWithOutcome.filter(i => 
    i.outcome?.result === "Moved to Next Round" || i.outcome?.result === "Offer Extended" || i.outcome?.result === "Passed"
  ).length;

  return {
    overall: interviewsWithOutcome.length > 0 ? ((successfulInterviews / interviewsWithOutcome.length) * 100).toFixed(1) : 0,
    totalInterviews,
    totalOffers: offers,
    currentInProgress: interviewStage,
    byStage: {
      phoneScreen: {
        total: phoneScreens.length,
        advanced: phoneToNext,
        rate: phoneScreensWithOutcome.length > 0 ? ((phoneToNext / phoneScreensWithOutcome.length) * 100).toFixed(1) : 0
      },
      technical: {
        total: technical.length,
        advanced: technicalToNext,
        rate: technicalWithOutcome.length > 0 ? ((technicalToNext / technicalWithOutcome.length) * 100).toFixed(1) : 0
      },
      behavioral: {
        total: behavioral.length,
        advanced: behavioralToNext,
        rate: behavioralWithOutcome.length > 0 ? ((behavioralToNext / behavioralWithOutcome.length) * 100).toFixed(1) : 0
      },
      finalRound: {
        total: final.length,
        offers: finalToOffer,
        rate: finalWithOutcome.length > 0 ? ((finalToOffer / finalWithOutcome.length) * 100).toFixed(1) : 0
      }
    },
    timeSeriesData: monthlyData,
    trend: calculateTrend(monthlyData)
  };
}

function calculateMonthlyConversion(interviews) {
  const monthlyMap = {};
  
  interviews.forEach(interview => {
    if (!interview.scheduledDate) return;
    
    const date = new Date(interview.scheduledDate);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = { total: 0, successful: 0, withOutcome: 0 };
    }
    
    monthlyMap[monthKey].total++;
    
    // Only count as successful if outcome exists and is positive
    if (interview.outcome?.result) {
      monthlyMap[monthKey].withOutcome++;
      if (interview.outcome.result === "Moved to Next Round" || interview.outcome.result === "Offer Extended" || interview.outcome.result === "Passed") {
        monthlyMap[monthKey].successful++;
      }
    }
  });

  return Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      total: data.total,
      successful: data.successful,
      rate: data.withOutcome > 0 ? ((data.successful / data.withOutcome) * 100).toFixed(1) : '0'
    }));
}

function calculateTrend(monthlyData) {
  if (monthlyData.length < 2) return "neutral";
  
  const recent = parseFloat(monthlyData[monthlyData.length - 1]?.rate || 0);
  const previous = parseFloat(monthlyData[monthlyData.length - 2]?.rate || 0);
  
  if (recent > previous + 5) return "improving";
  if (recent < previous - 5) return "declining";
  return "stable";
}

function analyzeByFormat(interviews) {
  const formats = ["In-Person", "Video", "Phone"];
  
  return formats.map(format => {
    // Map interview types to formats
    const formatInterviews = interviews.filter(i => {
      const type = i.interviewType || '';
      if (format === "In-Person") return type === "In-Person";
      if (format === "Video") return type === "Video Call" || type === "Video";
      if (format === "Phone") return type === "Phone Screen" || type === "Phone";
      return false;
    });
    const formatInterviewsWithOutcome = formatInterviews.filter(i => i.outcome?.result);
    const successful = formatInterviews.filter(i => 
      i.outcome?.result === "Moved to Next Round" || i.outcome?.result === "Offer Extended" || i.outcome?.result === "Passed"
    ).length;

    return {
      format,
      total: formatInterviews.length,
      successful,
      successRate: formatInterviewsWithOutcome.length > 0 
        ? ((successful / formatInterviewsWithOutcome.length) * 100).toFixed(1) 
        : 0,
      averagePreparation: calculateAveragePreparation(formatInterviews)
    };
  });
}

function analyzeByType(interviews) {
  const types = ["Phone Screen", "Technical", "Behavioral", "Final Round", "Case Study", "Panel"];
  
  return types.map(type => {
    const typeInterviews = interviews.filter(i => i.interviewType === type);
    const typeInterviewsWithOutcome = typeInterviews.filter(i => i.outcome?.result);
    const successful = typeInterviews.filter(i => 
      i.outcome?.result === "Moved to Next Round" || i.outcome?.result === "Offer Extended" || i.outcome?.result === "Passed"
    ).length;

    return {
      type,
      total: typeInterviews.length,
      successful,
      successRate: typeInterviewsWithOutcome.length > 0 
        ? ((successful / typeInterviewsWithOutcome.length) * 100).toFixed(1) 
        : 0
    };
  }).filter(t => t.total > 0);
}

function analyzeImprovementTrends(interviews, mockInterviews) {
  // Sort by date
  const sortedInterviews = [...interviews].sort((a, b) => 
    new Date(a.scheduledDate) - new Date(b.scheduledDate)
  );
  
  const sortedMocks = [...mockInterviews].sort((a, b) => 
    new Date(a.createdAt) - new Date(b.createdAt)
  );

  // Split into quarters for trend analysis
  const quarters = splitIntoQuarters([...sortedInterviews, ...sortedMocks]);
  
  const quarterlyPerformance = quarters.map((quarter, index) => {
    const realInterviews = quarter.filter(i => i.interviewType); // Has interview type field
    const mocks = quarter.filter(i => i.formats); // MockInterviewSession has formats field
    
    // Only count interviews with outcomes for success rate
    const realInterviewsWithOutcome = realInterviews.filter(i => i.outcome?.result);
    
    const realSuccess = realInterviews.filter(i => 
      i.outcome?.result === "Moved to Next Round" || i.outcome?.result === "Offer Extended" || i.outcome?.result === "Passed"
    ).length;
    
    const mockSuccess = mocks.filter(m => 
      m.status === "finished" && m.summary?.totalQuestions > 0
    ).length;

    return {
      quarter: index + 1,
      realInterviews: realInterviews.length,
      mockInterviews: mocks.length,
      realSuccessRate: realInterviewsWithOutcome.length > 0 
        ? ((realSuccess / realInterviewsWithOutcome.length) * 100).toFixed(1) 
        : 0,
      mockSuccessRate: mocks.length > 0 
        ? ((mockSuccess / mocks.length) * 100).toFixed(1) 
        : 0,
      averageScore: calculateAverageScore(quarter)
    };
  });

  // Calculate improvement from mock to real
  const mockPracticeImpact = analyzeMockToRealImpact(mockInterviews, interviews);

  return {
    quarterlyPerformance,
    mockPracticeImpact,
    overallImprovement: calculateOverallImprovement(quarterlyPerformance),
    strengthAreas: identifyStrengthAreas(interviews, mockInterviews),
    improvementAreas: identifyImprovementAreas(interviews, mockInterviews)
  };
}

function analyzeByIndustry(interviews, jobs) {
  const industryMap = {};
  
  interviews.forEach(interview => {
    const job = jobs.find(j => j._id.toString() === interview.jobId?.toString());
    const industry = job?.industry || "Unknown";
    
    if (!industryMap[industry]) {
      industryMap[industry] = { total: 0, successful: 0, offers: 0 };
    }
    
    industryMap[industry].total++;
    if (interview.result === "Advanced" || interview.result === "Offer") {
      industryMap[industry].successful++;
    }
    if (interview.result === "Offer") {
      industryMap[industry].offers++;
    }
  });

  return Object.entries(industryMap)
    .map(([industry, data]) => ({
      industry,
      total: data.total,
      successful: data.successful,
      offers: data.offers,
      successRate: ((data.successful / data.total) * 100).toFixed(1),
      offerRate: ((data.offers / data.total) * 100).toFixed(1)
    }))
    .sort((a, b) => parseFloat(b.successRate) - parseFloat(a.successRate));
}

function analyzeByCulture(interviews, jobs) {
  const cultureMap = {};
  
  interviews.forEach(interview => {
    const job = jobs.find(j => j._id.toString() === interview.jobId?.toString());
    const size = job?.companySize || "Unknown";
    
    if (!cultureMap[size]) {
      cultureMap[size] = { total: 0, successful: 0 };
    }
    
    cultureMap[size].total++;
    if (interview.result === "Advanced" || interview.result === "Offer") {
      cultureMap[size].successful++;
    }
  });

  return Object.entries(cultureMap)
    .map(([companySize, data]) => ({
      companySize,
      total: data.total,
      successful: data.successful,
      successRate: ((data.successful / data.total) * 100).toFixed(1)
    }))
    .sort((a, b) => parseFloat(b.successRate) - parseFloat(a.successRate));
}

function analyzeFeedbackThemes(interviews, mockInterviews) {
  const themes = {};
  const improvementAreas = [];

  // Analyze real interview feedback
  interviews.forEach(interview => {
    if (interview.notes) {
      extractThemes(interview.notes, themes);
    }
    if (interview.feedback) {
      extractThemes(interview.feedback, themes);
    }
  });

  // Analyze mock interview feedback
  mockInterviews.forEach(mock => {
    if (mock.summary?.improvementAreas) {
      mock.summary.improvementAreas.forEach(area => {
        improvementAreas.push(area);
        extractThemes(area, themes);
      });
    }
  });

  // Get most common themes
  const commonThemes = Object.entries(themes)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([theme, count]) => ({ theme, mentions: count }));

  // Categorize improvement areas
  const categorizedAreas = categorizeFeedback(improvementAreas);

  return {
    commonThemes,
    improvementAreas: categorizedAreas,
    positiveFeedback: extractPositiveFeedback(interviews, mockInterviews),
    totalFeedbackEntries: interviews.filter(i => i.feedback || i.notes).length + 
                           mockInterviews.filter(m => m.feedback).length
  };
}

function analyzeConfidenceAndAnxiety(interviews, mockInterviews) {
  const confidenceData = [];
  const anxietyData = [];

  // Track confidence over time
  interviews.forEach(interview => {
    if (interview.scheduledDate) {
      confidenceData.push({
        date: interview.scheduledDate,
        level: interview.confidenceLevel || estimateConfidence(interview),
        type: "real"
      });
    }
  });

  mockInterviews.forEach(mock => {
    if (mock.createdAt && mock.status === "finished") {
      // Estimate confidence based on completion and performance
      const totalQuestions = mock.summary?.totalQuestions || 0;
      const avgWordCount = mock.summary?.averageWordCount || 0;
      const confidence = totalQuestions > 0 ? Math.min(50 + (totalQuestions * 5) + (avgWordCount > 100 ? 10 : 0), 90) : 50;
      
      confidenceData.push({
        date: mock.createdAt,
        level: confidence,
        type: "mock"
      });
    }
  });

  // Sort by date
  confidenceData.sort((a, b) => new Date(a.date) - new Date(b.date));
  anxietyData.sort((a, b) => new Date(a.date) - new Date(b.date));

  const averageConfidence = confidenceData.length > 0
    ? (confidenceData.reduce((sum, d) => sum + d.level, 0) / confidenceData.length).toFixed(1)
    : 50;

  const averageAnxiety = anxietyData.length > 0
    ? (anxietyData.reduce((sum, d) => sum + d.level, 0) / anxietyData.length).toFixed(1)
    : 50;

  return {
    averageConfidence: parseFloat(averageConfidence),
    averageAnxiety: parseFloat(averageAnxiety),
    confidenceTrend: calculateConfidenceTrend(confidenceData),
    anxietyTrend: calculateConfidenceTrend(anxietyData),
    timeSeriesData: confidenceData.slice(-10),
    improvementProgress: calculateImprovementProgress(confidenceData, anxietyData)
  };
}

function generateCoachingRecommendations(
  conversionRates,
  formatAnalysis,
  feedbackThemes,
  confidenceTracking,
  improvementTrends
) {
  const recommendations = [];

  // Conversion rate recommendations
  if (parseFloat(conversionRates.overall) < 15) {
    recommendations.push({
      category: "Conversion Rate",
      priority: "high",
      title: "Focus on Interview Success Rate",
      issue: `Your overall conversion rate is ${conversionRates.overall}%, which is below the typical 15-20% benchmark.`,
      recommendation: "Practice more mock interviews and focus on storytelling techniques using the STAR method.",
      actionItems: [
        "Complete 2-3 mock interviews per week",
        "Record yourself answering common questions",
        "Get feedback from peers or mentors",
        "Study successful interview patterns"
      ]
    });
  }

  // Format-specific recommendations
  formatAnalysis.forEach(format => {
    if (parseFloat(format.successRate) < 20 && format.total >= 3) {
      recommendations.push({
        category: "Interview Format",
        priority: "medium",
        title: `Improve ${format.format} Interview Performance`,
        issue: `Success rate in ${format.format} interviews is ${format.successRate}%`,
        recommendation: `Practice specifically for ${format.format} format with attention to technical setup and communication style.`,
        actionItems: getFormatSpecificTips(format.format)
      });
    }
  });

  // Confidence recommendations
  if (confidenceTracking.averageConfidence < 60) {
    recommendations.push({
      category: "Confidence",
      priority: "high",
      title: "Build Interview Confidence",
      issue: `Average confidence level is ${confidenceTracking.averageConfidence}/100`,
      recommendation: "Increase preparation and practice to build confidence naturally.",
      actionItems: [
        "Prepare 2-3 strong stories for each competency",
        "Practice power poses before interviews",
        "Review past successes before each interview",
        "Join interview practice groups"
      ]
    });
  }

  // Feedback-based recommendations
  if (feedbackThemes.improvementAreas.length > 0) {
    const topArea = feedbackThemes.improvementAreas[0];
    recommendations.push({
      category: "Skill Development",
      priority: "medium",
      title: `Focus on ${topArea.category}`,
      issue: `${topArea.category} mentioned ${topArea.count} times in feedback`,
      recommendation: topArea.suggestion,
      actionItems: topArea.actionItems || [
        "Study best practices in this area",
        "Practice with targeted exercises",
        "Seek mentorship or coaching"
      ]
    });
  }

  // Trend-based recommendations
  if (improvementTrends.overallImprovement < 0) {
    recommendations.push({
      category: "Performance Trend",
      priority: "high",
      title: "Reverse Declining Performance",
      issue: "Recent interviews show declining success rates",
      recommendation: "Take a step back to reassess your preparation strategy and identify what changed.",
      actionItems: [
        "Review recent interview recordings",
        "Identify pattern changes in questions or format",
        "Refresh your core stories and examples",
        "Consider working with an interview coach"
      ]
    });
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

function generateBenchmarking(interviews, mockInterviews, conversionRates) {
  const industryBenchmarks = {
    conversionRate: 18, // Industry average
    interviewsToOffer: 5.5,
    phoneScreenPassRate: 45,
    technicalPassRate: 35,
    finalRoundOfferRate: 60
  };

  const userStats = {
    conversionRate: parseFloat(conversionRates.overall),
    phoneScreenPassRate: parseFloat(conversionRates.byStage.phoneScreen.rate),
    technicalPassRate: parseFloat(conversionRates.byStage.technical.rate),
    finalRoundOfferRate: parseFloat(conversionRates.byStage.finalRound.rate)
  };

  const comparison = {
    overallConversion: {
      user: userStats.conversionRate,
      benchmark: industryBenchmarks.conversionRate,
      difference: (userStats.conversionRate - industryBenchmarks.conversionRate).toFixed(1),
      status: userStats.conversionRate >= industryBenchmarks.conversionRate ? "above" : "below"
    },
    phoneScreen: {
      user: userStats.phoneScreenPassRate,
      benchmark: industryBenchmarks.phoneScreenPassRate,
      difference: (userStats.phoneScreenPassRate - industryBenchmarks.phoneScreenPassRate).toFixed(1),
      status: userStats.phoneScreenPassRate >= industryBenchmarks.phoneScreenPassRate ? "above" : "below"
    },
    technical: {
      user: userStats.technicalPassRate,
      benchmark: industryBenchmarks.technicalPassRate,
      difference: (userStats.technicalPassRate - industryBenchmarks.technicalPassRate).toFixed(1),
      status: userStats.technicalPassRate >= industryBenchmarks.technicalPassRate ? "above" : "below"
    },
    finalRound: {
      user: userStats.finalRoundOfferRate,
      benchmark: industryBenchmarks.finalRoundOfferRate,
      difference: (userStats.finalRoundOfferRate - industryBenchmarks.finalRoundOfferRate).toFixed(1),
      status: userStats.finalRoundOfferRate >= industryBenchmarks.finalRoundOfferRate ? "above" : "below"
    }
  };

  return {
    comparison,
    strengthAreas: Object.entries(comparison)
      .filter(([, data]) => data.status === "above")
      .map(([key]) => key),
    improvementAreas: Object.entries(comparison)
      .filter(([, data]) => data.status === "below")
      .map(([key]) => key),
    overallRanking: calculateOverallRanking(comparison)
  };
}

// Additional helper functions

function extractThemes(text, themes) {
  const keywords = [
    "communication", "technical", "leadership", "problem-solving", "teamwork",
    "confidence", "preparation", "experience", "questions", "clarity",
    "enthusiasm", "culture fit", "follow-up", "body language", "examples"
  ];

  const lowerText = text.toLowerCase();
  keywords.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      themes[keyword] = (themes[keyword] || 0) + 1;
    }
  });
}

function categorizeFeedback(areas) {
  const categories = {
    "Technical Skills": { count: 0, items: [] },
    "Communication": { count: 0, items: [] },
    "Behavioral": { count: 0, items: [] },
    "Preparation": { count: 0, items: [] }
  };

  areas.forEach(area => {
    if (area.includes("technical") || area.includes("coding") || area.includes("system")) {
      categories["Technical Skills"].count++;
      categories["Technical Skills"].items.push(area);
    } else if (area.includes("communication") || area.includes("clarity") || area.includes("explain")) {
      categories["Communication"].count++;
      categories["Communication"].items.push(area);
    } else if (area.includes("example") || area.includes("story") || area.includes("experience")) {
      categories["Behavioral"].count++;
      categories["Behavioral"].items.push(area);
    } else {
      categories["Preparation"].count++;
      categories["Preparation"].items.push(area);
    }
  });

  return Object.entries(categories)
    .filter(([, data]) => data.count > 0)
    .map(([category, data]) => ({
      category,
      count: data.count,
      items: data.items.slice(0, 3),
      suggestion: getCategorySuggestion(category),
      actionItems: getCategoryActionItems(category)
    }))
    .sort((a, b) => b.count - a.count);
}

function getCategorySuggestion(category) {
  const suggestions = {
    "Technical Skills": "Strengthen your technical knowledge through regular practice and study",
    "Communication": "Practice explaining complex topics simply and clearly",
    "Behavioral": "Develop strong STAR-method stories for common behavioral questions",
    "Preparation": "Increase your preparation time and research about companies"
  };
  return suggestions[category] || "Continue improving in this area";
}

function getCategoryActionItems(category) {
  const items = {
    "Technical Skills": [
      "Complete coding challenges daily",
      "Review fundamental concepts",
      "Practice system design problems"
    ],
    "Communication": [
      "Practice the 'Explain Like I'm 5' technique",
      "Record and review your explanations",
      "Work on active listening skills"
    ],
    "Behavioral": [
      "Prepare 5-10 core STAR stories",
      "Practice storytelling with peers",
      "Align examples with company values"
    ],
    "Preparation": [
      "Research company and role thoroughly",
      "Prepare thoughtful questions",
      "Review job description carefully"
    ]
  };
  return items[category] || [];
}

function extractPositiveFeedback(interviews, mockInterviews) {
  const positive = [];
  
  interviews.forEach(interview => {
    if (interview.result === "Advanced" || interview.result === "Offer") {
      if (interview.feedback) {
        positive.push({ source: "interview", feedback: interview.feedback });
      }
    }
  });

  mockInterviews.forEach(mock => {
    if (mock.summary?.strengths) {
      mock.summary.strengths.forEach(strength => {
        positive.push({ source: "mock", feedback: strength });
      });
    }
  });

  return positive.slice(0, 10);
}

function estimateConfidence(interview) {
  const result = interview.outcome?.result;
  if (result === "Offer Extended") return 85;
  if (result === "Moved to Next Round" || result === "Passed") return 70;
  if (result === "Failed") return 40;
  return 60;
}

function calculateConfidenceTrend(data) {
  if (data.length < 2) return "stable";
  
  const recent = data.slice(-3).reduce((sum, d) => sum + d.level, 0) / Math.min(3, data.length);
  const earlier = data.slice(0, 3).reduce((sum, d) => sum + d.level, 0) / Math.min(3, data.length);
  
  if (recent > earlier + 10) return "improving";
  if (recent < earlier - 10) return "declining";
  return "stable";
}

function calculateImprovementProgress(confidenceData, anxietyData) {
  if (confidenceData.length === 0) return 0;
  
  const confImprovement = confidenceData.length > 1
    ? confidenceData[confidenceData.length - 1].level - confidenceData[0].level
    : 0;
  
  const anxReduction = anxietyData.length > 1
    ? anxietyData[0].level - anxietyData[anxietyData.length - 1].level
    : 0;
  
  return ((confImprovement + anxReduction) / 2).toFixed(1);
}

function splitIntoQuarters(allInterviews) {
  const quarters = [[], [], [], []];
  const quarterSize = Math.ceil(allInterviews.length / 4);
  
  allInterviews.forEach((interview, index) => {
    const quarterIndex = Math.min(Math.floor(index / quarterSize), 3);
    quarters[quarterIndex].push(interview);
  });
  
  return quarters.filter(q => q.length > 0);
}

function calculateAverageScore(interviews) {
  const scores = interviews
    .map(i => {
      // Check if it's a real interview or mock session
      if (i.outcome?.result) {
        // Real interview
        const result = i.outcome.result;
        return result === "Moved to Next Round" || result === "Passed" ? 70 : result === "Offer Extended" ? 85 : 50;
      } else if (i.summary) {
        // Mock interview session - estimate score from completion
        const totalQ = i.summary.totalQuestions || 0;
        const avgWords = i.summary.averageWordCount || 0;
        return totalQ > 0 ? Math.min(50 + (totalQ * 4) + (avgWords > 150 ? 15 : avgWords > 100 ? 10 : 0), 85) : 50;
      }
      return 50;
    })
    .filter(s => s > 0);
  
  return scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 0;
}

function analyzeMockToRealImpact(mockInterviews, realInterviews) {
  // Check if mock practice correlates with real success
  const mockCount = mockInterviews.length;
  const realSuccessRate = realInterviews.filter(i => 
    i.outcome?.result === "Moved to Next Round" || i.outcome?.result === "Offer Extended" || i.outcome?.result === "Passed"
  ).length / Math.max(realInterviews.length, 1);

  return {
    totalMockPractice: mockCount,
    realInterviewsAfterPractice: realInterviews.length,
    correlationStrength: mockCount > 5 ? "strong" : mockCount > 2 ? "moderate" : "weak",
    estimatedImpact: mockCount > 0 ? ((realSuccessRate * 100).toFixed(1) + "% success with practice") : "No mock practice data",
    recommendation: mockCount < 5 ? "Increase mock interview practice for better results" : "Continue regular mock practice"
  };
}

function calculateOverallImprovement(quarterlyPerformance) {
  if (quarterlyPerformance.length < 2) return 0;
  
  // Find first quarter with actual interviews for more meaningful comparison
  let firstIndex = 0;
  for (let i = 0; i < quarterlyPerformance.length; i++) {
    if (quarterlyPerformance[i].realInterviews > 0) {
      firstIndex = i;
      break;
    }
  }
  
  // Find last quarter with actual interviews
  let lastIndex = quarterlyPerformance.length - 1;
  for (let i = quarterlyPerformance.length - 1; i >= 0; i--) {
    if (quarterlyPerformance[i].realInterviews > 0) {
      lastIndex = i;
      break;
    }
  }
  
  // If same quarter or no interviews at all, return 0
  if (firstIndex >= lastIndex) return 0;
  
  const first = parseFloat(quarterlyPerformance[firstIndex].realSuccessRate) || 0;
  const last = parseFloat(quarterlyPerformance[lastIndex].realSuccessRate) || 0;
  
  // Return percentage points difference (more intuitive for success rate improvement)
  // e.g., going from 50% to 60% shows as +10, not +20%
  return (last - first).toFixed(1);
}

function identifyStrengthAreas(interviews, mockInterviews) {
  const strengths = [];
  
  // Check format strengths
  const videoSuccess = interviews.filter(i => (i.interviewType === "Video Call" || i.interviewType === "Video") && 
    (i.outcome?.result === "Moved to Next Round" || i.outcome?.result === "Offer Extended" || i.outcome?.result === "Passed")).length;
  const videoTotal = interviews.filter(i => i.interviewType === "Video Call" || i.interviewType === "Video").length;
  
  if (videoTotal > 0 && (videoSuccess / videoTotal) > 0.6) {
    strengths.push("Strong video interview performance");
  }

  // Check type strengths
  const behavioralSuccess = interviews.filter(i => i.interviewType === "Behavioral" && 
    (i.outcome?.result === "Moved to Next Round" || i.outcome?.result === "Offer Extended" || i.outcome?.result === "Passed")).length;
  const behavioralTotal = interviews.filter(i => i.interviewType === "Behavioral").length;
  
  if (behavioralTotal > 0 && (behavioralSuccess / behavioralTotal) > 0.6) {
    strengths.push("Excellent behavioral interview skills");
  }

  return strengths;
}

function identifyImprovementAreas(interviews, mockInterviews) {
  const areas = [];
  
  // Check format weaknesses
  const phoneSuccess = interviews.filter(i => (i.interviewType === "Phone Screen" || i.interviewType === "Phone") && 
    (i.outcome?.result === "Moved to Next Round" || i.outcome?.result === "Offer Extended" || i.outcome?.result === "Passed")).length;
  const phoneTotal = interviews.filter(i => i.interviewType === "Phone Screen" || i.interviewType === "Phone").length;
  
  if (phoneTotal >= 3 && (phoneSuccess / phoneTotal) < 0.4) {
    areas.push("Phone screen conversion needs improvement");
  }

  const technicalSuccess = interviews.filter(i => i.interviewType === "Technical" && 
    (i.outcome?.result === "Moved to Next Round" || i.outcome?.result === "Offer Extended" || i.outcome?.result === "Passed")).length;
  const technicalTotal = interviews.filter(i => i.interviewType === "Technical").length;
  
  if (technicalTotal >= 3 && (technicalSuccess / technicalTotal) < 0.3) {
    areas.push("Technical interview performance needs focus");
  }

  return areas;
}

function calculateAveragePreparation(interviews) {
  const withNotes = interviews.filter(i => i.notes && i.notes.length > 50);
  return ((withNotes.length / Math.max(interviews.length, 1)) * 100).toFixed(0) + "% prepared";
}

function getFormatSpecificTips(format) {
  const tips = {
    "Video": [
      "Test your camera and microphone before interviews",
      "Maintain eye contact by looking at the camera",
      "Ensure good lighting and professional background",
      "Practice with video recording tools"
    ],
    "Phone": [
      "Use a quiet space with good reception",
      "Have notes and resume visible",
      "Stand or sit up straight for better voice projection",
      "Smile while speaking to improve tone"
    ],
    "In-Person": [
      "Arrive 10-15 minutes early",
      "Practice firm handshake and body language",
      "Dress professionally and appropriately",
      "Bring multiple copies of your resume"
    ]
  };
  return tips[format] || [];
}

function calculateOverallRanking(comparison) {
  const scores = Object.values(comparison).filter(c => typeof c.difference === 'string');
  const aboveCount = scores.filter(s => s.status === "above").length;
  const total = scores.length;
  
  const percentage = (aboveCount / total) * 100;
  
  if (percentage >= 75) return "Top Performer";
  if (percentage >= 50) return "Above Average";
  if (percentage >= 25) return "Average";
  return "Needs Improvement";
}

function calculateDetailedTrends(interviews, mockInterviews, period) {
  // Implementation for detailed trends
  const periodMonths = period === "3months" ? 3 : period === "12months" ? 12 : 6;
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - periodMonths);

  const recentInterviews = interviews.filter(i => new Date(i.scheduledDate) >= cutoffDate);
  const recentMocks = mockInterviews.filter(m => new Date(m.createdAt) >= cutoffDate);

  return {
    period,
    realInterviews: recentInterviews.length,
    mockInterviews: recentMocks.length,
    successTrend: calculateMonthlyConversion(recentInterviews),
    improvementRate: calculateOverallImprovement(splitIntoQuarters(recentInterviews))
  };
}

function generateDetailedCoachingPlan(interviews, mockInterviews) {
  const conversionRates = calculateConversionRates(interviews, []);
  const formatAnalysis = analyzeByFormat(interviews);
  const feedbackThemes = analyzeFeedbackThemes(interviews, mockInterviews);
  const confidenceTracking = analyzeConfidenceAndAnxiety(interviews, mockInterviews);
  const improvementTrends = analyzeImprovementTrends(interviews, mockInterviews);

  return generateCoachingRecommendations(
    conversionRates,
    formatAnalysis,
    feedbackThemes,
    confidenceTracking,
    improvementTrends
  );
}

function calculateComprehensiveBenchmarks(interviews, mockInterviews, allJobs) {
  const conversionRates = calculateConversionRates(interviews, allJobs);
  return generateBenchmarking(interviews, mockInterviews, conversionRates);
}
