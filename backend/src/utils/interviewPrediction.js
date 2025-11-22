import { Interview } from "../models/Interview.js";
import { Job } from "../models/Job.js";
import { CompanyResearch } from "../models/CompanyResearch.js";
import { MockInterviewSession } from "../models/MockInterviewSession.js";
import { JobMatch } from "../models/JobMatch.js";
import { InterviewPrediction } from "../models/InterviewPrediction.js";

/**
 * Calculate the role match score based on job match data and skills alignment
 * @param {Object} job - The job object
 * @param {String} userId - The user ID
 * @returns {Promise<Number>} Role match score (0-100)
 */
async function calculateRoleMatchScore(job, userId) {
  try {
    // Check if there's a job match record
    const jobMatch = await JobMatch.findOne({ jobId: job._id, userId });
    
    if (jobMatch && jobMatch.matchScore !== undefined) {
      return Math.round(jobMatch.matchScore);
    }
    
    // Fallback: Basic calculation based on job status progression
    const statusScores = {
      "Interested": 40,
      "Applied": 50,
      "Phone Screen": 65,
      "Interview": 75,
      "Offer": 90,
      "Rejected": 30,
    };
    
    return statusScores[job.status] || 50;
  } catch (error) {
    console.error("Error calculating role match score:", error);
    return 50; // Default middle score
  }
}

/**
 * Calculate company research completeness score
 * @param {String} interviewId - The interview ID
 * @param {String} jobId - The job ID
 * @param {String} userId - The user ID
 * @returns {Promise<Object>} Research completion data
 */
async function calculateCompanyResearchScore(interviewId, jobId, userId) {
  try {
    const research = await CompanyResearch.findOne({
      userId,
      $or: [
        { interviewId },
        { jobId }
      ]
    });
    
    if (!research) {
      return {
        completed: false,
        completeness: 0,
      };
    }
    
    // Calculate completeness based on filled sections
    let completedSections = 0;
    const totalSections = 10;
    
    // Check profile sections
    if (research.profile?.overview) completedSections++;
    if (research.profile?.mission) completedSections++;
    if (research.profile?.culture) completedSections++;
    
    // Check leadership
    if (research.leadership && research.leadership.length > 0) completedSections++;
    
    // Check interviewers
    if (research.potentialInterviewers && research.potentialInterviewers.length > 0) completedSections++;
    
    // Check products/services
    if (research.products && research.products.length > 0) completedSections++;
    
    // Check recent news
    if (research.recentNews && research.recentNews.length > 0) completedSections++;
    
    // Check competitors
    if (research.competitors && research.competitors.length > 0) completedSections++;
    
    // Check interview tips
    if (research.interviewTips && research.interviewTips.length > 0) completedSections++;
    
    // Check questions to ask
    if (research.questionsToAsk && research.questionsToAsk.length > 0) completedSections++;
    
    const completeness = Math.round((completedSections / totalSections) * 100);
    
    return {
      completed: completeness >= 60, // Consider complete if 60%+ done
      completeness,
    };
  } catch (error) {
    console.error("Error calculating company research score:", error);
    return {
      completed: false,
      completeness: 0,
    };
  }
}

/**
 * Calculate practice hours from mock interviews and preparation tasks
 * @param {String} userId - The user ID
 * @param {String} jobId - The job ID
 * @param {Object} interview - The interview object
 * @returns {Promise<Number>} Total practice hours
 */
async function calculatePracticeHours(userId, jobId, interview) {
  try {
    let totalMinutes = 0;
    
    // Get mock interview sessions for this job
    const mockSessions = await MockInterviewSession.find({
      userId,
      jobId,
    });
    
    // Each mock interview session counts as practice time
    mockSessions.forEach(session => {
      if (session.responses && session.responses.length > 0) {
        // Sum up duration of all responses
        const sessionMinutes = session.responses.reduce((sum, response) => {
          return sum + (response.durationSeconds || 0) / 60;
        }, 0);
        totalMinutes += sessionMinutes;
      } else {
        // Default to 30 minutes per session if no response data
        totalMinutes += 30;
      }
    });
    
    // Add time from preparation tasks (estimate 15 min per completed task)
    if (interview.preparationTasks && interview.preparationTasks.length > 0) {
      const completedTasks = interview.preparationTasks.filter(task => task.completed).length;
      totalMinutes += completedTasks * 15;
    }
    
    return Math.round(totalMinutes / 60 * 10) / 10; // Round to 1 decimal place
  } catch (error) {
    console.error("Error calculating practice hours:", error);
    return 0;
  }
}

/**
 * Calculate technical preparation score
 * @param {String} userId - The user ID
 * @param {String} jobId - The job ID
 * @returns {Promise<Number>} Technical prep score (0-100)
 */
async function calculateTechnicalPrepScore(userId, jobId) {
  try {
    // Get technical mock interviews
    const technicalSessions = await MockInterviewSession.find({
      userId,
      jobId,
      formats: "Technical",
    });
    
    if (technicalSessions.length === 0) return 0;
    
    let totalScore = 0;
    let sessionCount = 0;
    
    technicalSessions.forEach(session => {
      if (session.responses && session.responses.length > 0 && session.questions) {
        // Calculate completion rate
        const completionRate = (session.responses.length / session.questions.length) * 100;
        totalScore += completionRate;
        sessionCount++;
      }
    });
    
    return sessionCount > 0 ? Math.round(totalScore / sessionCount) : 0;
  } catch (error) {
    console.error("Error calculating technical prep score:", error);
    return 0;
  }
}

/**
 * Calculate behavioral preparation score
 * @param {String} userId - The user ID
 * @param {String} jobId - The job ID
 * @returns {Promise<Number>} Behavioral prep score (0-100)
 */
async function calculateBehavioralPrepScore(userId, jobId) {
  try {
    // Get behavioral mock interviews
    const behavioralSessions = await MockInterviewSession.find({
      userId,
      jobId,
      formats: "Behavioral",
    });
    
    if (behavioralSessions.length === 0) return 0;
    
    let totalScore = 0;
    let sessionCount = 0;
    
    behavioralSessions.forEach(session => {
      if (session.responses && session.responses.length > 0 && session.questions) {
        // Calculate completion rate and quality metrics
        const completionRate = (session.responses.length / session.questions.length) * 100;
        
        // Bonus for using STAR method (if tracked in summary)
        let qualityBonus = 0;
        if (session.summary?.analysisMetrics?.starCompletionRate) {
          qualityBonus = session.summary.analysisMetrics.starCompletionRate * 0.2; // Up to 20% bonus
        }
        
        totalScore += Math.min(completionRate + qualityBonus, 100);
        sessionCount++;
      }
    });
    
    return sessionCount > 0 ? Math.round(totalScore / sessionCount) : 0;
  } catch (error) {
    console.error("Error calculating behavioral prep score:", error);
    return 0;
  }
}

/**
 * Analyze historical performance patterns
 * @param {String} userId - The user ID
 * @returns {Promise<Object>} Performance pattern data
 */
async function analyzeHistoricalPerformance(userId) {
  try {
    // Get completed interviews
    const completedInterviews = await Interview.find({
      userId,
      status: "Completed",
      "outcome.result": { $exists: true, $ne: "Pending" },
    }).sort({ scheduledDate: -1 });
    
    if (completedInterviews.length === 0) {
      return {
        previousInterviewCount: 0,
        successRate: 0,
        averageRating: 0,
        strongestInterviewType: "None",
        improvementTrend: "Insufficient Data",
      };
    }
    
    // Calculate success rate
    const successfulOutcomes = ["Passed", "Moved to Next Round", "Offer Extended"];
    const successCount = completedInterviews.filter(
      interview => successfulOutcomes.includes(interview.outcome.result)
    ).length;
    const successRate = Math.round((successCount / completedInterviews.length) * 100);
    
    // Calculate average rating
    const ratedInterviews = completedInterviews.filter(i => i.outcome.rating);
    const averageRating = ratedInterviews.length > 0
      ? Math.round(
          (ratedInterviews.reduce((sum, i) => sum + i.outcome.rating, 0) / ratedInterviews.length) * 10
        ) / 10
      : 0;
    
    // Find strongest interview type
    const typePerformance = {};
    completedInterviews.forEach(interview => {
      const type = interview.interviewType || "Other";
      if (!typePerformance[type]) {
        typePerformance[type] = { success: 0, total: 0 };
      }
      typePerformance[type].total++;
      if (successfulOutcomes.includes(interview.outcome.result)) {
        typePerformance[type].success++;
      }
    });
    
    let strongestType = "None";
    let highestRate = 0;
    Object.entries(typePerformance).forEach(([type, stats]) => {
      const rate = stats.success / stats.total;
      if (rate > highestRate && stats.total >= 2) { // Require at least 2 interviews
        highestRate = rate;
        strongestType = type;
      }
    });
    
    // Analyze improvement trend (compare recent vs older interviews)
    let improvementTrend = "Insufficient Data";
    if (completedInterviews.length >= 4) {
      const midpoint = Math.floor(completedInterviews.length / 2);
      const recentInterviews = completedInterviews.slice(0, midpoint);
      const olderInterviews = completedInterviews.slice(midpoint);
      
      const recentSuccess = recentInterviews.filter(i => 
        successfulOutcomes.includes(i.outcome.result)
      ).length / recentInterviews.length;
      
      const olderSuccess = olderInterviews.filter(i => 
        successfulOutcomes.includes(i.outcome.result)
      ).length / olderInterviews.length;
      
      if (recentSuccess > olderSuccess + 0.1) {
        improvementTrend = "Improving";
      } else if (recentSuccess < olderSuccess - 0.1) {
        improvementTrend = "Declining";
      } else {
        improvementTrend = "Stable";
      }
    }
    
    return {
      previousInterviewCount: completedInterviews.length,
      successRate,
      averageRating,
      strongestInterviewType: strongestType,
      improvementTrend,
    };
  } catch (error) {
    console.error("Error analyzing historical performance:", error);
    return {
      previousInterviewCount: 0,
      successRate: 0,
      averageRating: 0,
      strongestInterviewType: "None",
      improvementTrend: "Insufficient Data",
    };
  }
}

/**
 * Calculate the overall success probability score
 * @param {Object} preparationFactors - Preparation factors data
 * @param {Object} performancePattern - Historical performance data
 * @param {Object} weights - Factor weights
 * @param {Array} completedRecommendations - Previously completed recommendations
 * @returns {Number} Success probability (0-100)
 */
function calculateSuccessProbability(preparationFactors, performancePattern, weights, completedRecommendations = []) {
  // Normalize practice hours (cap at 10 hours = 100%)
  const practiceScore = Math.min((preparationFactors.practiceHours / 10) * 100, 100);
  
  // Normalize mock interviews (5+ = 100%)
  const mockInterviewScore = Math.min((preparationFactors.mockInterviewsCompleted / 5) * 100, 100);
  
  // Task completion percentage
  const taskCompletionScore = preparationFactors.totalPreparationTasks > 0
    ? (preparationFactors.preparationTasksCompleted / preparationFactors.totalPreparationTasks) * 100
    : 50; // Default to 50 if no tasks
  
  // Company research score
  const researchScore = preparationFactors.companyResearchCompleteness;
  
  // Historical performance score
  const historicalScore = performancePattern.previousInterviewCount > 0
    ? performancePattern.successRate
    : 50; // Default to 50 if no history
  
  // Calculate weighted average
  const weightedScore = 
    (preparationFactors.roleMatchScore * weights.roleMatch +
     researchScore * weights.companyResearch +
     practiceScore * weights.practiceHours +
     mockInterviewScore * weights.mockInterviews +
     preparationFactors.technicalPrepScore * weights.technicalPrep +
     preparationFactors.behavioralPrepScore * weights.behavioralPrep +
     historicalScore * weights.historicalPerformance) / 100;
  
  // Add bonuses for extra preparation
  let bonus = 0;
  if (preparationFactors.resumeTailored) bonus += 3;
  if (preparationFactors.coverLetterSubmitted) bonus += 2;
  if (taskCompletionScore === 100) bonus += 5;
  
  // Add bonus for completed recommendations
  if (completedRecommendations && completedRecommendations.length > 0) {
    console.log('🎯 Completed recommendations:', completedRecommendations.length);
    console.log('🎯 Completed recommendations data:', JSON.stringify(completedRecommendations, null, 2));
    
    const completedBonus = completedRecommendations.reduce((total, rec) => {
      const impact = rec.estimatedImpact || 0;
      console.log(`  - ${rec.title}: +${impact}%`);
      return total + impact;
    }, 0);
    
    console.log('🎯 Total completed bonus (before cap):', completedBonus);
    
    // Cap the bonus at 15% to prevent over-inflation
    const cappedBonus = Math.min(completedBonus, 15);
    bonus += cappedBonus;
    console.log('🎯 Capped bonus added:', cappedBonus);
  } else {
    console.log('🎯 No completed recommendations to apply bonus');
  }
  
  console.log('🎯 Weighted score:', weightedScore);
  console.log('🎯 Total bonus:', bonus);
  console.log('🎯 Final score:', Math.min(Math.round(weightedScore + bonus), 100));
  
  // Final score capped at 100
  return Math.min(Math.round(weightedScore + bonus), 100);
}

/**
 * Calculate confidence score based on data completeness
 * @param {Object} preparationFactors - Preparation factors data
 * @param {Object} performancePattern - Historical performance data
 * @returns {Number} Confidence score (0-100)
 */
function calculateConfidenceScore(preparationFactors, performancePattern) {
  let confidence = 0;
  const maxConfidence = 100;
  
  // Data availability factors
  if (preparationFactors.roleMatchScore > 0) confidence += 15;
  if (preparationFactors.companyResearchCompleted) confidence += 15;
  if (preparationFactors.practiceHours > 0) confidence += 10;
  if (preparationFactors.mockInterviewsCompleted > 0) confidence += 15;
  if (preparationFactors.totalPreparationTasks > 0) confidence += 10;
  
  // Historical data availability
  if (performancePattern.previousInterviewCount >= 1) confidence += 10;
  if (performancePattern.previousInterviewCount >= 3) confidence += 10;
  if (performancePattern.previousInterviewCount >= 5) confidence += 15;
  
  return Math.min(confidence, maxConfidence);
}

/**
 * Generate recommendations based on preparation gaps
 * @param {Object} preparationFactors - Preparation factors data
 * @param {Object} performancePattern - Historical performance data
 * @param {Object} interview - The interview object
 * @returns {Array} Array of recommendations
 */
function generateRecommendations(preparationFactors, performancePattern, interview) {
  const recommendations = [];
  
  // Company research recommendation - only if not complete
  if (preparationFactors.companyResearchCompleteness < 80) {
    recommendations.push({
      category: "Company Research",
      priority: preparationFactors.companyResearchCompleteness < 50 ? "High" : "Medium",
      title: "Complete Company Research",
      description: `Your company research is ${preparationFactors.companyResearchCompleteness}% complete. Research the company's mission, recent news, products, and culture to show genuine interest.`,
      estimatedImpact: 15,
      estimatedTimeMinutes: 45,
      completed: false,
      completedAt: null,
    });
  }
  
  // Practice hours recommendation - only if not enough
  if (preparationFactors.practiceHours < 3) {
    recommendations.push({
      category: "Mock Interviews",
      priority: "High",
      title: "Increase Practice Time",
      description: `You've practiced ${preparationFactors.practiceHours.toFixed(1)} hours. Aim for at least 3-5 hours of mock interview practice to improve confidence and delivery.`,
      estimatedImpact: 20,
      estimatedTimeMinutes: 120,
      completed: false,
      completedAt: null,
    });
  }
  
  // Mock interviews recommendation - only if not enough
  if (preparationFactors.mockInterviewsCompleted < 2) {
    recommendations.push({
      category: "Mock Interviews",
      priority: "High",
      title: "Complete Mock Interviews",
      description: `You've completed ${preparationFactors.mockInterviewsCompleted} mock interview(s). Complete at least 2-3 mock interviews to simulate real conditions.`,
      estimatedImpact: 18,
      estimatedTimeMinutes: 90,
      completed: false,
      completedAt: null,
    });
  }
  
  // Technical prep recommendation - only if score is low
  if (preparationFactors.technicalPrepScore < 60 && interview.interviewType === "Technical") {
    recommendations.push({
      category: "Technical Skills",
      priority: "High",
      title: "Improve Technical Preparation",
      description: "Your technical preparation score is below 60%. Review key technical concepts, practice coding problems, and understand the tech stack.",
      estimatedImpact: 25,
      estimatedTimeMinutes: 180,
      completed: false,
      completedAt: null,
    });
  }
  
  // Behavioral prep recommendation - only if score is low
  if (preparationFactors.behavioralPrepScore < 60) {
    recommendations.push({
      category: "Behavioral Practice",
      priority: "Medium",
      title: "Practice Behavioral Questions",
      description: "Prepare structured answers using the STAR method for common behavioral questions. Focus on specific examples from your experience.",
      estimatedImpact: 15,
      estimatedTimeMinutes: 60,
      completed: false,
      completedAt: null,
    });
  }
  
  // Resume tailoring recommendation
  if (!preparationFactors.resumeTailored) {
    recommendations.push({
      category: "Resume",
      priority: "Medium",
      title: "Tailor Your Resume",
      description: "Customize your resume to highlight skills and experiences most relevant to this role. Match keywords from the job description.",
      estimatedImpact: 10,
      estimatedTimeMinutes: 30,
      completed: false,
      completedAt: null,
    });
  }
  
  // Cover letter recommendation (only if not already submitted)
  if (!preparationFactors.coverLetterSubmitted) {
    recommendations.push({
      category: "Resume",
      priority: "Low",
      title: "Submit Cover Letter",
      description: "Create a compelling cover letter that explains your interest in the role and highlights your relevant experience.",
      estimatedImpact: 5,
      estimatedTimeMinutes: 30,
      completed: false,
      completedAt: null,
    });
  }
  
  // Preparation tasks recommendation - only if not complete
  if (preparationFactors.totalPreparationTasks > 0) {
    const completionRate = (preparationFactors.preparationTasksCompleted / preparationFactors.totalPreparationTasks) * 100;
    if (completionRate < 80) {
      recommendations.push({
        category: "General Preparation",
        priority: "Medium",
        title: "Complete Preparation Tasks",
        description: `You've completed ${preparationFactors.preparationTasksCompleted} of ${preparationFactors.totalPreparationTasks} preparation tasks (${Math.round(completionRate)}%). Focus on completing the remaining high-priority tasks.`,
        estimatedImpact: 12,
        estimatedTimeMinutes: 45,
        completed: false,
        completedAt: null,
      });
    }
  }
  
  // Performance-based recommendations
  if (performancePattern.improvementTrend === "Declining") {
    recommendations.push({
      category: "General Preparation",
      priority: "High",
      title: "Review Past Interview Feedback",
      description: "Your recent interview performance shows a declining trend. Review feedback from past interviews and identify areas for improvement.",
      estimatedImpact: 15,
      estimatedTimeMinutes: 30,
      completed: false, // This is an action-based recommendation
      completedAt: null,
    });
  }
  
  // Interview type specific recommendation
  if (performancePattern.strongestInterviewType !== "None" && 
      performancePattern.strongestInterviewType !== interview.interviewType) {
    recommendations.push({
      category: "General Preparation",
      priority: "Medium",
      title: `Focus on ${interview.interviewType} Interview Skills`,
      description: `Your strongest interview type is ${performancePattern.strongestInterviewType}, but this is a ${interview.interviewType} interview. Practice this format specifically.`,
      estimatedImpact: 10,
      estimatedTimeMinutes: 60,
      completed: false, // This is an action-based recommendation
      completedAt: null,
    });
  }
  
  // Sort by priority and impact
  const priorityOrder = { "High": 0, "Medium": 1, "Low": 2 };
  recommendations.sort((a, b) => {
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return b.estimatedImpact - a.estimatedImpact;
  });
  
  // Return top 6 recommendations
  return recommendations.slice(0, 6);
}

/**
 * Main function to calculate interview success prediction
 * @param {String} interviewId - The interview ID
 * @param {String} userId - The user ID
 * @returns {Promise<Object>} Complete prediction data
 */
export async function calculateInterviewPrediction(interviewId, userId) {
  try {
    // Fetch the interview
    const interview = await Interview.findOne({ _id: interviewId, userId })
      .populate('jobId');
    
    if (!interview) {
      throw new Error("Interview not found");
    }
    
    const job = interview.jobId;
    
    // Calculate all preparation factors
    const [
      roleMatchScore,
      companyResearchData,
      practiceHours,
      mockInterviewsCompleted,
      technicalPrepScore,
      behavioralPrepScore,
      performancePattern,
    ] = await Promise.all([
      calculateRoleMatchScore(job, userId),
      calculateCompanyResearchScore(interviewId, job._id, userId),
      calculatePracticeHours(userId, job._id, interview),
      MockInterviewSession.countDocuments({ userId, jobId: job._id }),
      calculateTechnicalPrepScore(userId, job._id),
      calculateBehavioralPrepScore(userId, job._id),
      analyzeHistoricalPerformance(userId),
    ]);
    
    // Check for resume and cover letter
    const resumeTailored = !!(job.linkedResumeId || job.materials?.resume);
    const coverLetterSubmitted = !!(job.materials?.coverLetter);
    
    console.log('📄 Resume/Cover Letter Check:', {
      linkedResumeId: job.linkedResumeId,
      materialsResume: job.materials?.resume,
      materialsCoverLetter: job.materials?.coverLetter,
      resumeTailored,
      coverLetterSubmitted
    });
    
    // Preparation tasks
    const preparationTasksCompleted = interview.preparationTasks?.filter(t => t.completed).length || 0;
    const totalPreparationTasks = interview.preparationTasks?.length || 0;
    
    const preparationFactors = {
      roleMatchScore,
      companyResearchCompleted: companyResearchData.completed,
      companyResearchCompleteness: companyResearchData.completeness,
      practiceHours,
      mockInterviewsCompleted,
      technicalPrepScore,
      behavioralPrepScore,
      preparationTasksCompleted,
      totalPreparationTasks,
      resumeTailored,
      coverLetterSubmitted,
    };
    
    // Default weights
    const weights = {
      roleMatch: 20,
      companyResearch: 15,
      practiceHours: 15,
      mockInterviews: 15,
      technicalPrep: 10,
      behavioralPrep: 10,
      historicalPerformance: 15,
    };
    
    // Generate recommendations (only for uncompleted items)
    const recommendations = generateRecommendations(preparationFactors, performancePattern, interview);
    
    // Calculate success probability (bonuses are calculated inside based on preparationFactors)
    const successProbability = calculateSuccessProbability(preparationFactors, performancePattern, weights, []);
    const confidenceScore = calculateConfidenceScore(preparationFactors, performancePattern);
    
    return {
      userId,
      interviewId,
      jobId: job._id,
      successProbability,
      confidenceScore,
      preparationFactors,
      performancePattern,
      factorWeights: weights,
      recommendations,
    };
  } catch (error) {
    console.error("Error calculating interview prediction:", error);
    throw error;
  }
}

export default {
  calculateInterviewPrediction,
  calculateRoleMatchScore,
  calculateCompanyResearchScore,
  calculatePracticeHours,
  analyzeHistoricalPerformance,
};
