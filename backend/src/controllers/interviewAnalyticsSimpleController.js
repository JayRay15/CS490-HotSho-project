import { Interview } from "../models/Interview.js";
import { Job } from "../models/Job.js";
import { MockInterviewSession } from "../models/MockInterviewSession.js";
import { successResponse, sendResponse } from "../utils/responseFormat.js";

// Industry benchmarks for interview performance
const INDUSTRY_BENCHMARKS = {
  successRate: 40,                    // 40% of interviews lead to success
  interviewToOfferRate: 25,          // 25% of interviews result in offers
  avgInterviewsPerOffer: 4,          // Average 4 interviews per offer
  avgPrepTime: 3,                     // 3 hours average prep time
};

/**
 * GET /api/interviews/analytics/performance
 * Comprehensive interview performance analytics
 */
export const getInterviewAnalyticsSummary = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.auth?.payload?.sub || req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const now = new Date();
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

    // Fetch all relevant data
    const [interviews, jobs, mockSessions] = await Promise.all([
      Interview.find({ userId }).populate('jobId').lean(),
      Job.find({ userId }).lean(),
      MockInterviewSession.find({ userId }).lean(),
    ]);

    // Helper functions
    const pct = (num, den) => (den > 0 ? Number(((num / den) * 100).toFixed(1)) : 0);
    const avg = (sum, count) => (count > 0 ? Number((sum / count).toFixed(1)) : null);

    // 1. OVERVIEW - Basic counts and metrics
    const completedInterviews = interviews.filter(i => i.status === "Completed");
    const successfulInterviews = interviews.filter(i => 
      i.outcome?.result === "Passed" || 
      i.outcome?.result === "Moved to Next Round" || 
      i.outcome?.result === "Offer Extended"
    );
    const offersReceived = interviews.filter(i => i.outcome?.result === "Offer Extended");
    
    const ratings = completedInterviews
      .map(i => i.outcome?.rating)
      .filter(r => typeof r === "number");
    const averageRating = avg(ratings.reduce((sum, r) => sum + r, 0), ratings.length);

    const overview = {
      totalInterviews: interviews.length,
      completedInterviews: completedInterviews.length,
      successfulInterviews: successfulInterviews.length,
      offersReceived: offersReceived.length,
      averageRating,
      scheduledUpcoming: interviews.filter(i => 
        i.status === "Scheduled" && new Date(i.scheduledDate) > now
      ).length,
    };

    // 2. CONVERSION RATES - Track interview-to-offer conversion
    const scheduledInterviews = interviews.filter(i => 
      i.status !== "Cancelled" && i.status !== "No-Show"
    );
    
    const conversionRates = {
      scheduled: scheduledInterviews.length,
      completed: completedInterviews.length,
      successful: successfulInterviews.length,
      offers: offersReceived.length,
      completionRate: pct(completedInterviews.length, scheduledInterviews.length),
      successRate: pct(successfulInterviews.length, completedInterviews.length),
      offerRate: pct(offersReceived.length, completedInterviews.length),
      progressionRate: pct(
        interviews.filter(i => i.outcome?.result === "Moved to Next Round").length,
        completedInterviews.length
      ),
      funnel: {
        scheduled: {
          count: scheduledInterviews.length,
          percentage: 100,
        },
        completed: {
          count: completedInterviews.length,
          percentage: pct(completedInterviews.length, scheduledInterviews.length),
        },
        successful: {
          count: successfulInterviews.length,
          percentage: pct(successfulInterviews.length, scheduledInterviews.length),
        },
        offers: {
          count: offersReceived.length,
          percentage: pct(offersReceived.length, scheduledInterviews.length),
        },
      },
    };

    // 3. PERFORMANCE TRENDS BY COMPANY TYPE
    const companyTypeStats = {};
    for (const interview of interviews) {
      if (!interview.jobId?.industry) continue;
      const industry = interview.jobId.industry;
      
      if (!companyTypeStats[industry]) {
        companyTypeStats[industry] = { 
          total: 0, 
          completed: 0, 
          successful: 0, 
          offers: 0, 
          ratings: [] 
        };
      }
      
      companyTypeStats[industry].total++;
      if (interview.status === "Completed") {
        companyTypeStats[industry].completed++;
        if (interview.outcome?.rating) {
          companyTypeStats[industry].ratings.push(interview.outcome.rating);
        }
      }
      if (successfulInterviews.includes(interview)) {
        companyTypeStats[industry].successful++;
      }
      if (interview.outcome?.result === "Offer Extended") {
        companyTypeStats[industry].offers++;
      }
    }

    const companyTypeAnalysis = {
      byIndustry: Object.entries(companyTypeStats).map(([industry, stats]) => ({
        industry,
        total: stats.total,
        successRate: pct(stats.successful, stats.completed),
        offerRate: pct(stats.offers, stats.completed),
        avgRating: avg(stats.ratings.reduce((sum, r) => sum + r, 0), stats.ratings.length),
      })).sort((a, b) => b.successRate - a.successRate),
    };

    // 4. STRENGTHS AND WEAKNESSES - By interview type
    const typeStats = {};
    for (const interview of interviews) {
      const type = interview.interviewType || "Other";
      
      if (!typeStats[type]) {
        typeStats[type] = { 
          total: 0, 
          completed: 0, 
          successful: 0, 
          ratings: [] 
        };
      }
      
      typeStats[type].total++;
      if (interview.status === "Completed") {
        typeStats[type].completed++;
        if (interview.outcome?.rating) {
          typeStats[type].ratings.push(interview.outcome.rating);
        }
      }
      if (successfulInterviews.includes(interview)) {
        typeStats[type].successful++;
      }
    }

    const typePerformance = Object.entries(typeStats).map(([type, stats]) => ({
      interviewType: type,
      total: stats.total,
      successRate: pct(stats.successful, stats.completed),
      avgRating: avg(stats.ratings.reduce((sum, r) => sum + r, 0), stats.ratings.length),
    })).filter(t => t.total >= 2); // Minimum sample size

    const sortedBySuccess = [...typePerformance].sort((a, b) => b.successRate - a.successRate);
    
    const strengthsWeaknesses = {
      strongest: sortedBySuccess.slice(0, 3),
      weakest: sortedBySuccess.slice(-3).reverse(),
    };

    // 5. FORMAT COMPARISON - Different interview formats
    const formatStats = {};
    const formatMapping = {
      "Phone Screen": "Phone",
      "Video Call": "Video",
      "In-Person": "In-Person",
      "Technical": "Technical",
      "Final Round": "Final Round",
      "Phone": "Phone",
      "Video": "Video",
      "Behavioral": "Behavioral",
      "Panel": "Panel",
      "Group": "Group",
      "Case Study": "Case Study",
      "Other": "Other",
    };

    for (const interview of interviews) {
      const format = formatMapping[interview.interviewType] || "Other";
      
      if (!formatStats[format]) {
        formatStats[format] = { 
          total: 0, 
          completed: 0, 
          successful: 0, 
          durations: [] 
        };
      }
      
      formatStats[format].total++;
      if (interview.status === "Completed") {
        formatStats[format].completed++;
        if (interview.duration) {
          formatStats[format].durations.push(interview.duration);
        }
      }
      if (successfulInterviews.includes(interview)) {
        formatStats[format].successful++;
      }
    }

    const formatComparison = {
      byFormat: Object.entries(formatStats).map(([format, stats]) => ({
        format,
        total: stats.total,
        successRate: pct(stats.successful, stats.completed),
        avgDuration: avg(
          stats.durations.reduce((sum, d) => sum + d, 0), 
          stats.durations.length
        ) || 60,
      })).sort((a, b) => b.total - a.total),
    };

    // 6. IMPROVEMENT TRACKING - Monitor improvement over time
    const recentInterviews = completedInterviews.filter(i => 
      new Date(i.scheduledDate) >= threeMonthsAgo
    );
    const olderInterviews = completedInterviews.filter(i => 
      new Date(i.scheduledDate) < threeMonthsAgo && 
      new Date(i.scheduledDate) >= sixMonthsAgo
    );

    const recentSuccess = recentInterviews.filter(i => successfulInterviews.includes(i));
    const olderSuccess = olderInterviews.filter(i => successfulInterviews.includes(i));

    const recentRatings = recentInterviews
      .map(i => i.outcome?.rating)
      .filter(r => typeof r === "number");
    const olderRatings = olderInterviews
      .map(i => i.outcome?.rating)
      .filter(r => typeof r === "number");

    const recentSuccessRate = pct(recentSuccess.length, recentInterviews.length);
    const olderSuccessRate = pct(olderSuccess.length, olderInterviews.length);
    const improvementScore = Number((recentSuccessRate - olderSuccessRate).toFixed(1));

    const trend = improvementScore > 5 ? "improving" :
                  improvementScore < -5 ? "declining" : "stable";

    const mockSessionsCompleted = mockSessions.filter(s => s.status === "Completed").length;
    const practiceImpact = mockSessionsCompleted > 5 ? "High practice engagement" :
                          mockSessionsCompleted > 0 ? "Some practice completed" :
                          "No practice sessions yet";

    const improvementTracking = {
      recentPerformance: {
        period: "Last 3 months",
        count: recentInterviews.length,
        successRate: recentSuccessRate,
        avgRating: avg(
          recentRatings.reduce((sum, r) => sum + r, 0), 
          recentRatings.length
        ),
      },
      olderPerformance: {
        period: "3-6 months ago",
        count: olderInterviews.length,
        successRate: olderSuccessRate,
        avgRating: avg(
          olderRatings.reduce((sum, r) => sum + r, 0), 
          olderRatings.length
        ),
      },
      improvementScore,
      trend,
      mockSessionsCompleted,
      practiceImpact,
    };

    // 7. BENCHMARKS - Compare against industry standards
    const benchmarks = {
      user: {
        successRate: pct(successfulInterviews.length, completedInterviews.length),
        offerRate: pct(offersReceived.length, completedInterviews.length),
      },
      industry: INDUSTRY_BENCHMARKS,
      comparison: {
        successRate: pct(successfulInterviews.length, completedInterviews.length) >= INDUSTRY_BENCHMARKS.successRate 
          ? "above" 
          : "below",
        offerRate: pct(offersReceived.length, completedInterviews.length) >= INDUSTRY_BENCHMARKS.interviewToOfferRate 
          ? "above" 
          : "below",
      },
    };

    // 8. INSIGHTS - Generate strategic insights
    const insights = [];

    // Insight: Best performing interview type
    if (strengthsWeaknesses.strongest.length > 0) {
      const best = strengthsWeaknesses.strongest[0];
      insights.push({
        category: "Success Pattern",
        insight: `You perform best in ${best.interviewType} interviews with a ${best.successRate}% success rate.`,
        recommendation: `Continue preparing thoroughly for ${best.interviewType} formats and apply these successful strategies to other interview types.`,
      });
    }

    // Insight: Area for improvement
    if (strengthsWeaknesses.weakest.length > 0) {
      const weakest = strengthsWeaknesses.weakest[0];
      if (weakest.total >= 2) {
        insights.push({
          category: "Improvement Area",
          insight: `${weakest.interviewType} interviews have a ${weakest.successRate}% success rate, below your overall average.`,
          recommendation: `Focus practice sessions on ${weakest.interviewType} scenarios. Consider mock interviews specifically for this format.`,
        });
      }
    }

    // Insight: Practice impact
    if (mockSessionsCompleted > 0 && improvementScore > 0) {
      insights.push({
        category: "Practice Effect",
        insight: `Your ${mockSessionsCompleted} mock interview sessions correlate with a ${Math.abs(improvementScore)}% improvement in success rate.`,
        recommendation: "Continue regular mock interview practice to maintain this positive momentum.",
      });
    } else if (mockSessionsCompleted === 0 && completedInterviews.length > 3) {
      insights.push({
        category: "Practice Opportunity",
        insight: "You haven't completed any mock interview sessions yet.",
        recommendation: "Try mock interviews to build confidence and improve performance. Practice is proven to increase success rates.",
      });
    }

    // Insight: Industry performance
    const topIndustry = companyTypeAnalysis.byIndustry[0];
    if (topIndustry && topIndustry.total >= 2) {
      insights.push({
        category: "Industry Fit",
        insight: `You have a ${topIndustry.successRate}% success rate in ${topIndustry.industry} interviews.`,
        recommendation: topIndustry.successRate >= 50 
          ? `Consider focusing more applications in the ${topIndustry.industry} sector where you excel.`
          : `Research ${topIndustry.industry}-specific interview questions and company cultures to improve performance.`,
      });
    }

    // 9. RECOMMENDATIONS - Personalized improvement recommendations
    const recommendations = [];

    // Recommendation: Completion rate
    if (conversionRates.completionRate < 80) {
      recommendations.push({
        priority: "High",
        category: "Interview Commitment",
        title: "Improve Interview Completion Rate",
        description: `Your ${conversionRates.completionRate}% completion rate is below optimal. Missing interviews can damage your reputation.`,
        actions: [
          "Set calendar reminders 24 hours and 2 hours before each interview",
          "Prepare thoroughly in advance to build confidence",
          "Clear your schedule on interview days to avoid conflicts",
        ],
        expectedImpact: "Completing more interviews increases opportunities and demonstrates reliability to employers.",
      });
    }

    // Recommendation: Success rate improvement
    if (benchmarks.comparison.successRate === "below") {
      recommendations.push({
        priority: "High",
        category: "Performance Improvement",
        title: "Increase Your Success Rate",
        description: `Your ${benchmarks.user.successRate}% success rate is below the industry average of ${INDUSTRY_BENCHMARKS.successRate}%.`,
        actions: [
          "Complete at least 2 mock interviews before real interviews",
          "Research the company and role thoroughly (30+ minutes)",
          "Prepare 5-7 thoughtful questions to ask interviewers",
          "Practice STAR method responses for behavioral questions",
        ],
        expectedImpact: "These strategies typically improve success rates by 15-25 percentage points.",
      });
    }

    // Recommendation: Specific format weakness
    if (strengthsWeaknesses.weakest.length > 0) {
      const weakFormat = strengthsWeaknesses.weakest[0];
      if (weakFormat.successRate < 30 && weakFormat.total >= 2) {
        recommendations.push({
          priority: "Medium",
          category: "Format-Specific Training",
          title: `Improve ${weakFormat.interviewType} Performance`,
          description: `Your ${weakFormat.successRate}% success rate in ${weakFormat.interviewType} interviews needs attention.`,
          actions: [
            `Schedule mock ${weakFormat.interviewType} sessions`,
            `Study common ${weakFormat.interviewType} question patterns`,
            `Review recordings or notes from past ${weakFormat.interviewType} interviews`,
          ],
          expectedImpact: `Targeted practice can improve format-specific performance by 20-30%.`,
        });
      }
    }

    // Recommendation: Practice more
    if (mockSessionsCompleted < 3 && completedInterviews.length > 5) {
      recommendations.push({
        priority: "Medium",
        category: "Practice Sessions",
        title: "Increase Mock Interview Practice",
        description: "Regular practice strongly correlates with better interview outcomes.",
        actions: [
          "Schedule 1-2 mock interviews per week",
          "Practice with peers or mentors in your field",
          "Record yourself answering common questions",
          "Get feedback on your responses and body language",
        ],
        expectedImpact: "Candidates who complete 5+ mock interviews see 20-30% higher success rates.",
      });
    }

    // Recommendation: Industry focus
    if (companyTypeAnalysis.byIndustry.length >= 3) {
      const bestIndustry = companyTypeAnalysis.byIndustry[0];
      const worstIndustry = companyTypeAnalysis.byIndustry[companyTypeAnalysis.byIndustry.length - 1];
      
      if (bestIndustry.successRate - worstIndustry.successRate >= 30) {
        recommendations.push({
          priority: "Low",
          category: "Strategic Focus",
          title: "Optimize Industry Targeting",
          description: `You have ${bestIndustry.successRate}% success in ${bestIndustry.industry} vs ${worstIndustry.successRate}% in ${worstIndustry.industry}.`,
          actions: [
            `Consider applying more frequently to ${bestIndustry.industry} roles`,
            `Research why ${bestIndustry.industry} interviews go better for you`,
            `Identify transferable skills from ${bestIndustry.industry} success`,
          ],
          expectedImpact: "Focusing on industries where you excel can increase offer rates by 15-20%.",
        });
      }
    }

    // Recommendation: Trending down
    if (trend === "declining") {
      recommendations.push({
        priority: "High",
        category: "Performance Recovery",
        title: "Address Declining Performance",
        description: `Your recent success rate (${recentSuccessRate}%) is down from ${olderSuccessRate}%.`,
        actions: [
          "Take a short break to recharge and reflect",
          "Review what worked well in earlier successful interviews",
          "Consider adjusting your preparation strategy",
          "Seek feedback from a career coach or mentor",
        ],
        expectedImpact: "Identifying and addressing the cause can restore performance levels.",
      });
    }

    // Compile final analytics payload
    const analytics = {
      overview,
      conversionRates,
      companyTypeAnalysis,
      strengthsWeaknesses,
      formatComparison,
      improvementTracking,
      benchmarks,
      insights,
      recommendations,
      generatedAt: now,
    };

    const { response, statusCode } = successResponse({ analytics }, "Interview analytics loaded successfully");
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Error generating interview analytics:", err);
    return next(err);
  }
};
