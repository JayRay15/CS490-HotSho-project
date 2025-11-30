import { Interview } from "../models/Interview.js";
import { Job } from "../models/Job.js";
import { MockInterviewSession } from "../models/MockInterviewSession.js";
import { successResponse, errorResponse, sendResponse, ERROR_CODES } from "../utils/responseFormat.js";
import { asyncHandler } from "../middleware/errorHandler.js";

/**
 * GET /api/interviews/analytics/performance
 * Get comprehensive interview performance analytics
 */
export const getInterviewPerformanceAnalytics = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  
  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  // Fetch all interviews for the user
  const interviews = await Interview.find({ userId })
    .populate('jobId', 'company industry workMode title')
    .sort({ scheduledDate: -1 });

  const completedInterviews = interviews.filter(i => 
    i.status === 'Completed' && i.outcome?.result && i.outcome.result !== 'Pending'
  );

  // 1. Interview-to-Offer Conversion Rates
  const conversionRates = calculateConversionRates(interviews, completedInterviews);

  // 2. Performance Trends Across Company Types
  const companyTypeAnalysis = analyzeCompanyTypePerformance(completedInterviews);

  // 3. Strongest and Weakest Interview Areas
  const strengthsWeaknesses = identifyStrengthsWeaknesses(completedInterviews);

  // 4. Performance Across Interview Formats
  const formatComparison = compareInterviewFormats(completedInterviews);

  // 5. Improvement Over Time with Practice Sessions
  const improvementTracking = await trackImprovement(userId, completedInterviews);

  // 6. Optimal Interview Strategies
  const insights = generateStrategicInsights(completedInterviews, improvementTracking);

  // 7. Industry Benchmarks
  const benchmarks = calculateIndustryBenchmarks(completedInterviews);

  // 8. Personalized Recommendations
  const recommendations = generatePersonalizedRecommendations(
    conversionRates,
    strengthsWeaknesses,
    formatComparison,
    improvementTracking
  );

  const { response, statusCode } = successResponse(
    "Interview performance analytics retrieved successfully",
    {
      analytics: {
        overview: {
          totalInterviews: interviews.length,
          completedInterviews: completedInterviews.length,
          upcomingInterviews: interviews.filter(i => 
            new Date(i.scheduledDate) > new Date() && 
            ['Scheduled', 'Confirmed'].includes(i.status)
          ).length,
          averageRating: calculateAverageRating(completedInterviews),
        },
        conversionRates,
        companyTypeAnalysis,
        strengthsWeaknesses,
        formatComparison,
        improvementTracking,
        insights,
        benchmarks,
        recommendations,
      }
    }
  );
  return sendResponse(res, response, statusCode);
});

/**
 * Calculate interview-to-offer conversion rates
 */
function calculateConversionRates(allInterviews, completedInterviews) {
  const scheduled = allInterviews.length;
  const completed = completedInterviews.length;
  
  const successfulOutcomes = ['Passed', 'Moved to Next Round', 'Offer Extended'];
  const successful = completedInterviews.filter(i => 
    successfulOutcomes.includes(i.outcome.result)
  ).length;
  
  const offers = completedInterviews.filter(i => 
    i.outcome.result === 'Offer Extended'
  ).length;
  
  const movedToNextRound = completedInterviews.filter(i => 
    i.outcome.result === 'Moved to Next Round'
  ).length;

  return {
    scheduled,
    completed,
    successful,
    offers,
    completionRate: scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0,
    successRate: completed > 0 ? Math.round((successful / completed) * 100) : 0,
    offerRate: completed > 0 ? Math.round((offers / completed) * 100) : 0,
    progressionRate: completed > 0 ? Math.round((movedToNextRound / completed) * 100) : 0,
    funnel: {
      scheduled: { count: scheduled, percentage: 100 },
      completed: { count: completed, percentage: scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0 },
      successful: { count: successful, percentage: scheduled > 0 ? Math.round((successful / scheduled) * 100) : 0 },
      offers: { count: offers, percentage: scheduled > 0 ? Math.round((offers / scheduled) * 100) : 0 },
    }
  };
}

/**
 * Analyze performance trends across different company types
 */
function analyzeCompanyTypePerformance(completedInterviews) {
  const companyTypeStats = {};
  const successfulOutcomes = ['Passed', 'Moved to Next Round', 'Offer Extended'];

  completedInterviews.forEach(interview => {
    const industry = interview.jobId?.industry || 'Unknown';
    
    if (!companyTypeStats[industry]) {
      companyTypeStats[industry] = {
        total: 0,
        successful: 0,
        offers: 0,
        avgRating: 0,
        totalRating: 0,
        ratedCount: 0,
      };
    }
    
    const stats = companyTypeStats[industry];
    stats.total++;
    
    if (successfulOutcomes.includes(interview.outcome.result)) {
      stats.successful++;
    }
    
    if (interview.outcome.result === 'Offer Extended') {
      stats.offers++;
    }
    
    if (interview.outcome.rating) {
      stats.totalRating += interview.outcome.rating;
      stats.ratedCount++;
    }
  });

  // Calculate rates and format results
  const analysis = Object.entries(companyTypeStats).map(([industry, stats]) => ({
    industry,
    total: stats.total,
    successRate: stats.total > 0 ? Math.round((stats.successful / stats.total) * 100) : 0,
    offerRate: stats.total > 0 ? Math.round((stats.offers / stats.total) * 100) : 0,
    avgRating: stats.ratedCount > 0 ? (stats.totalRating / stats.ratedCount).toFixed(1) : null,
  })).sort((a, b) => b.successRate - a.successRate);

  return {
    byIndustry: analysis,
    topPerforming: analysis[0] || null,
    needsImprovement: analysis[analysis.length - 1] || null,
  };
}

/**
 * Identify strongest and weakest interview areas
 */
function identifyStrengthsWeaknesses(completedInterviews) {
  const typeStats = {};
  const successfulOutcomes = ['Passed', 'Moved to Next Round', 'Offer Extended'];

  completedInterviews.forEach(interview => {
    const type = interview.interviewType || 'Other';
    
    if (!typeStats[type]) {
      typeStats[type] = {
        total: 0,
        successful: 0,
        avgRating: 0,
        totalRating: 0,
        ratedCount: 0,
        feedback: [],
      };
    }
    
    const stats = typeStats[type];
    stats.total++;
    
    if (successfulOutcomes.includes(interview.outcome.result)) {
      stats.successful++;
    }
    
    if (interview.outcome.rating) {
      stats.totalRating += interview.outcome.rating;
      stats.ratedCount++;
    }
    
    if (interview.outcome.feedback) {
      stats.feedback.push(interview.outcome.feedback);
    }
  });

  const analysis = Object.entries(typeStats)
    .filter(([_, stats]) => stats.total >= 2) // Only include types with 2+ interviews
    .map(([type, stats]) => ({
      interviewType: type,
      total: stats.total,
      successRate: Math.round((stats.successful / stats.total) * 100),
      avgRating: stats.ratedCount > 0 ? (stats.totalRating / stats.ratedCount).toFixed(1) : null,
      commonFeedback: extractCommonThemes(stats.feedback),
    }))
    .sort((a, b) => b.successRate - a.successRate);

  return {
    byType: analysis,
    strongest: analysis.slice(0, 3),
    weakest: analysis.slice(-3).reverse(),
  };
}

/**
 * Compare performance across different interview formats
 */
function compareInterviewFormats(completedInterviews) {
  const formatStats = {
    'Phone Screen': { total: 0, successful: 0, avgDuration: 0, totalDuration: 0 },
    'Video Call': { total: 0, successful: 0, avgDuration: 0, totalDuration: 0 },
    'In-Person': { total: 0, successful: 0, avgDuration: 0, totalDuration: 0 },
    'Technical': { total: 0, successful: 0, avgDuration: 0, totalDuration: 0 },
    'Final Round': { total: 0, successful: 0, avgDuration: 0, totalDuration: 0 },
  };

  const successfulOutcomes = ['Passed', 'Moved to Next Round', 'Offer Extended'];

  completedInterviews.forEach(interview => {
    const format = interview.interviewType;
    
    if (formatStats[format]) {
      formatStats[format].total++;
      if (successfulOutcomes.includes(interview.outcome.result)) {
        formatStats[format].successful++;
      }
      if (interview.duration) {
        formatStats[format].totalDuration += interview.duration;
      }
    }
  });

  const comparison = Object.entries(formatStats)
    .filter(([_, stats]) => stats.total > 0)
    .map(([format, stats]) => ({
      format,
      total: stats.total,
      successRate: Math.round((stats.successful / stats.total) * 100),
      avgDuration: stats.total > 0 ? Math.round(stats.totalDuration / stats.total) : 0,
    }))
    .sort((a, b) => b.successRate - a.successRate);

  return {
    byFormat: comparison,
    mostSuccessful: comparison[0] || null,
    leastSuccessful: comparison[comparison.length - 1] || null,
  };
}

/**
 * Track improvement over time with practice sessions
 */
async function trackImprovement(userId, completedInterviews) {
  // Get mock interview sessions
  const mockSessions = await MockInterviewSession.find({ 
    userId, 
    status: 'finished' 
  }).sort({ createdAt: 1 });

  const successfulOutcomes = ['Passed', 'Moved to Next Round', 'Offer Extended'];

  // Analyze interviews by time periods
  const now = new Date();
  const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

  const recent = completedInterviews.filter(i => 
    new Date(i.scheduledDate) >= threeMonthsAgo
  );
  const older = completedInterviews.filter(i => 
    new Date(i.scheduledDate) < threeMonthsAgo && new Date(i.scheduledDate) >= sixMonthsAgo
  );

  const recentSuccess = recent.length > 0 
    ? Math.round((recent.filter(i => successfulOutcomes.includes(i.outcome.result)).length / recent.length) * 100)
    : 0;
  
  const olderSuccess = older.length > 0
    ? Math.round((older.filter(i => successfulOutcomes.includes(i.outcome.result)).length / older.length) * 100)
    : 0;

  const recentAvgRating = calculateAverageRating(recent);
  const olderAvgRating = calculateAverageRating(older);

  // Calculate trend
  let trend = 'stable';
  if (recent.length >= 2 && older.length >= 2) {
    if (recentSuccess > olderSuccess + 10) trend = 'improving';
    else if (recentSuccess < olderSuccess - 10) trend = 'declining';
  }

  return {
    mockSessionsCompleted: mockSessions.length,
    recentPerformance: {
      count: recent.length,
      successRate: recentSuccess,
      avgRating: recentAvgRating,
      period: 'Last 3 months',
    },
    olderPerformance: {
      count: older.length,
      successRate: olderSuccess,
      avgRating: olderAvgRating,
      period: '3-6 months ago',
    },
    trend,
    improvementScore: recentSuccess - olderSuccess,
    practiceImpact: mockSessions.length > 0 ? 
      `Completed ${mockSessions.length} mock interview${mockSessions.length > 1 ? 's' : ''}` : 
      'No mock interviews completed',
  };
}

/**
 * Generate strategic insights on optimal interview strategies
 */
function generateStrategicInsights(completedInterviews, improvementTracking) {
  const insights = [];
  const successfulOutcomes = ['Passed', 'Moved to Next Round', 'Offer Extended'];

  // Insight 1: Best time preparation correlation
  const preparedInterviews = completedInterviews.filter(i => {
    const completedTasks = i.preparationTasks?.filter(t => t.completed).length || 0;
    const totalTasks = i.preparationTasks?.length || 0;
    return totalTasks > 0 && (completedTasks / totalTasks) >= 0.75;
  });

  if (preparedInterviews.length >= 3) {
    const prepSuccessRate = Math.round(
      (preparedInterviews.filter(i => successfulOutcomes.includes(i.outcome.result)).length / preparedInterviews.length) * 100
    );
    insights.push({
      category: 'Preparation',
      insight: `You have ${prepSuccessRate}% success rate when completing 75%+ of preparation tasks`,
      recommendation: prepSuccessRate > 60 ? 
        'Continue your thorough preparation approach' : 
        'Focus on quality over quantity in preparation',
    });
  }

  // Insight 2: Improvement trend
  if (improvementTracking.trend === 'improving') {
    insights.push({
      category: 'Progress',
      insight: `Your success rate improved by ${improvementTracking.improvementScore} percentage points`,
      recommendation: 'Keep up the great work! Your practice is paying off.',
    });
  } else if (improvementTracking.trend === 'declining') {
    insights.push({
      category: 'Progress',
      insight: `Recent performance declined by ${Math.abs(improvementTracking.improvementScore)} percentage points`,
      recommendation: 'Consider scheduling mock interviews to rebuild confidence',
    });
  }

  // Insight 3: Response time impact
  const quickResponses = completedInterviews.filter(i => {
    if (i.thankYouNoteSent && i.thankYouNoteSentDate && i.scheduledDate) {
      const hoursToResponse = (new Date(i.thankYouNoteSentDate) - new Date(i.scheduledDate)) / (1000 * 60 * 60);
      return hoursToResponse <= 24;
    }
    return false;
  });

  if (quickResponses.length >= 3) {
    const quickResponseSuccess = Math.round(
      (quickResponses.filter(i => successfulOutcomes.includes(i.outcome.result)).length / quickResponses.length) * 100
    );
    insights.push({
      category: 'Follow-up',
      insight: `${quickResponseSuccess}% success rate when sending thank-you notes within 24 hours`,
      recommendation: quickResponseSuccess > 60 ?
        'Your prompt follow-ups are effective' :
        'Consider personalizing your thank-you notes more',
    });
  }

  return insights;
}

/**
 * Calculate industry benchmarks
 */
function calculateIndustryBenchmarks(completedInterviews) {
  const successfulOutcomes = ['Passed', 'Moved to Next Round', 'Offer Extended'];
  const userSuccess = completedInterviews.length > 0
    ? Math.round((completedInterviews.filter(i => successfulOutcomes.includes(i.outcome.result)).length / completedInterviews.length) * 100)
    : 0;

  const userOfferRate = completedInterviews.length > 0
    ? Math.round((completedInterviews.filter(i => i.outcome.result === 'Offer Extended').length / completedInterviews.length) * 100)
    : 0;

  // Industry standard benchmarks (based on 2024 data)
  const industryStandards = {
    interviewToOfferRate: 25, // 25% of interviews result in offers
    successRate: 40, // 40% move forward in process
    avgInterviewsPerOffer: 4, // Takes ~4 interviews to get 1 offer
    avgPrepTime: 8, // 8 hours of prep per interview
  };

  return {
    user: {
      successRate: userSuccess,
      offerRate: userOfferRate,
      avgRating: calculateAverageRating(completedInterviews),
      totalInterviews: completedInterviews.length,
    },
    industry: industryStandards,
    comparison: {
      successRate: compareToIndustry(userSuccess, industryStandards.successRate),
      offerRate: compareToIndustry(userOfferRate, industryStandards.interviewToOfferRate),
    },
  };
}

/**
 * Generate personalized improvement recommendations
 */
function generatePersonalizedRecommendations(conversionRates, strengthsWeaknesses, formatComparison, improvementTracking) {
  const recommendations = [];

  // Recommendation 1: Based on conversion rates
  if (conversionRates.offerRate < 20) {
    recommendations.push({
      priority: 'High',
      category: 'Conversion',
      title: 'Boost Your Offer Rate',
      description: `Your current offer rate is ${conversionRates.offerRate}%. Industry average is 25%.`,
      actions: [
        'Practice negotiation skills in mock interviews',
        'Research company culture and values before interviews',
        'Prepare stronger closing statements',
        'Follow up within 24 hours with personalized thank-you notes',
      ],
      expectedImpact: 'Could increase offer rate by 5-10%',
    });
  }

  // Recommendation 2: Based on weakest interview type
  if (strengthsWeaknesses.weakest.length > 0) {
    const weakest = strengthsWeaknesses.weakest[0];
    recommendations.push({
      priority: 'High',
      category: 'Skill Development',
      title: `Improve ${weakest.interviewType} Performance`,
      description: `Your ${weakest.interviewType} success rate is ${weakest.successRate}%, your lowest performing area.`,
      actions: [
        `Schedule mock ${weakest.interviewType} sessions`,
        `Study common ${weakest.interviewType} questions`,
        'Review feedback from past interviews',
        'Consider professional interview coaching',
      ],
      expectedImpact: 'Could improve success rate by 15-20%',
    });
  }

  // Recommendation 3: Based on improvement trend
  if (improvementTracking.trend === 'declining') {
    recommendations.push({
      priority: 'High',
      category: 'Recovery',
      title: 'Reverse Declining Performance',
      description: `Your performance has declined by ${Math.abs(improvementTracking.improvementScore)} percentage points recently.`,
      actions: [
        'Schedule 2-3 mock interviews this week',
        'Review and learn from recent unsuccessful interviews',
        'Take a short break to avoid burnout',
        'Update your interview preparation routine',
      ],
      expectedImpact: 'Could restore previous performance levels',
    });
  } else if (improvementTracking.mockSessionsCompleted < 3) {
    recommendations.push({
      priority: 'Medium',
      category: 'Practice',
      title: 'Increase Mock Interview Practice',
      description: `You've completed ${improvementTracking.mockSessionsCompleted} mock interview(s). More practice builds confidence.`,
      actions: [
        'Schedule at least 2 mock interviews per week',
        'Practice with different interview formats',
        'Record yourself and review performance',
        'Focus on areas identified as weaknesses',
      ],
      expectedImpact: 'Could improve confidence and success rate by 10-15%',
    });
  }

  // Recommendation 4: Based on format performance
  if (formatComparison.leastSuccessful && formatComparison.leastSuccessful.successRate < 40) {
    recommendations.push({
      priority: 'Medium',
      category: 'Format Mastery',
      title: `Master ${formatComparison.leastSuccessful.format} Interviews`,
      description: `Your ${formatComparison.leastSuccessful.format} success rate is ${formatComparison.leastSuccessful.successRate}%.`,
      actions: [
        `Practice specifically for ${formatComparison.leastSuccessful.format} format`,
        'Research best practices for this format',
        'Test technology and setup beforehand',
        'Study successful examples',
      ],
      expectedImpact: 'Could improve format-specific performance by 20%',
    });
  }

  // Recommendation 5: Leverage strengths
  if (strengthsWeaknesses.strongest.length > 0) {
    const strongest = strengthsWeaknesses.strongest[0];
    recommendations.push({
      priority: 'Low',
      category: 'Strategy',
      title: 'Leverage Your Strengths',
      description: `You excel at ${strongest.interviewType} with ${strongest.successRate}% success rate.`,
      actions: [
        `Request ${strongest.interviewType} format when possible`,
        'Highlight this strength in applications',
        'Mentor others in this interview type',
        'Use this confidence to improve weaker areas',
      ],
      expectedImpact: 'Maintain competitive advantage',
    });
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { High: 0, Medium: 1, Low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

// Helper functions
function calculateAverageRating(interviews) {
  const rated = interviews.filter(i => i.outcome?.rating);
  if (rated.length === 0) return null;
  return (rated.reduce((sum, i) => sum + i.outcome.rating, 0) / rated.length).toFixed(1);
}

function compareToIndustry(userRate, industryRate) {
  const diff = userRate - industryRate;
  if (diff >= 10) return 'significantly above';
  if (diff >= 5) return 'above';
  if (diff <= -10) return 'significantly below';
  if (diff <= -5) return 'below';
  return 'on par with';
}

function extractCommonThemes(feedbackArray) {
  if (feedbackArray.length === 0) return [];
  
  // Simple keyword extraction (in production, use NLP)
  const keywords = ['technical', 'communication', 'experience', 'questions', 'preparation', 'confident', 'nervous'];
  const themes = [];
  
  feedbackArray.forEach(feedback => {
    const lower = feedback.toLowerCase();
    keywords.forEach(keyword => {
      if (lower.includes(keyword) && !themes.includes(keyword)) {
        themes.push(keyword);
      }
    });
  });
  
  return themes.slice(0, 3);
}

export default {
  getInterviewPerformanceAnalytics,
};
