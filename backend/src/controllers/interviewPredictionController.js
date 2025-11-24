import { InterviewPrediction } from "../models/InterviewPrediction.js";
import { Interview } from "../models/Interview.js";
import { calculateInterviewPrediction } from "../utils/interviewPrediction.js";
import { successResponse, errorResponse, sendResponse, ERROR_CODES } from "../utils/responseFormat.js";
import { asyncHandler } from "../middleware/errorHandler.js";

/**
 * GET /api/interview-predictions/:interviewId - Get or calculate prediction for an interview
 */
export const getPrediction = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { interviewId } = req.params;
  
  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }
  
  // Check if prediction already exists
  let prediction = await InterviewPrediction.findOne({ interviewId, userId })
    .populate('interviewId', 'title company scheduledDate interviewType status')
    .populate('jobId', 'title company status');
  
  // If prediction doesn't exist or is older than 1 hour, recalculate
  const shouldRecalculate = !prediction || 
    (Date.now() - new Date(prediction.lastUpdated).getTime()) > 60 * 60 * 1000;
  
  if (shouldRecalculate) {
    try {
      // Calculate new prediction
      const predictionData = await calculateInterviewPrediction(interviewId, userId);
      
      if (prediction) {
        // Update existing prediction
        Object.assign(prediction, predictionData);
        prediction.lastUpdated = Date.now();
        prediction.version += 1;
        await prediction.save();
      } else {
        // Create new prediction
        prediction = await InterviewPrediction.create(predictionData);
        await prediction.populate('interviewId', 'title company scheduledDate interviewType status');
        await prediction.populate('jobId', 'title company status');
      }
    } catch (error) {
      console.error("Error calculating prediction:", error);
      const { response, statusCode } = errorResponse(
        "Failed to calculate interview prediction",
        500,
        ERROR_CODES.INTERNAL_ERROR
      );
      return sendResponse(res, response, statusCode);
    }
  }
  
  const { response, statusCode } = successResponse(
    "Interview prediction retrieved successfully",
    { prediction }
  );
  return sendResponse(res, response, statusCode);
});

/**
 * GET /api/interview-predictions/user/all - Get all predictions for the current user
 */
export const getAllUserPredictions = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  
  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }
  
  const { status, sortBy = 'successProbability', order = 'desc' } = req.query;
  
  // Build filter
  const filter = { userId };
  
  // Optionally filter by interview status
  if (status) {
    const interviews = await Interview.find({ userId, status }).select('_id');
    const interviewIds = interviews.map(i => i._id);
    filter.interviewId = { $in: interviewIds };
  }
  
  // Build sort
  const sortOptions = {};
  sortOptions[sortBy] = order === 'asc' ? 1 : -1;
  
  const predictions = await InterviewPrediction.find(filter)
    .populate('interviewId', 'title company scheduledDate interviewType status')
    .populate('jobId', 'title company status')
    .sort(sortOptions);
  
  // Calculate comparison data
  if (predictions.length > 0) {
    predictions.forEach((prediction, index) => {
      prediction.comparisonData = {
        rankAmongUpcoming: index + 1,
        totalUpcomingInterviews: predictions.length,
        percentile: Math.round(((predictions.length - index) / predictions.length) * 100),
      };
    });
    
    // Save updated predictions
    await Promise.all(predictions.map(p => p.save()));
  }
  
  const { response, statusCode } = successResponse(
    "Interview predictions retrieved successfully",
    {
      predictions,
      count: predictions.length,
      averageSuccessProbability: predictions.length > 0
        ? Math.round(predictions.reduce((sum, p) => sum + p.successProbability, 0) / predictions.length)
        : 0,
    }
  );
  return sendResponse(res, response, statusCode);
});

/**
 * GET /api/interview-predictions/upcoming - Get predictions for upcoming interviews
 */
export const getUpcomingPredictions = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  
  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }
  
  // Get upcoming interviews (scheduled in the future)
  const upcomingInterviews = await Interview.find({
    userId,
    scheduledDate: { $gte: new Date() },
    status: { $in: ["Scheduled", "Confirmed", "Rescheduled"] },
  }).select('_id').sort({ scheduledDate: 1 });
  
  const interviewIds = upcomingInterviews.map(i => i._id);
  
  // Get or create predictions for upcoming interviews
  const predictions = [];
  for (const interviewId of interviewIds) {
    let prediction = await InterviewPrediction.findOne({ interviewId, userId })
      .populate('interviewId', 'title company scheduledDate interviewType status')
      .populate('jobId', 'title company status');
    
    // Calculate if doesn't exist or is stale
    if (!prediction || (Date.now() - new Date(prediction.lastUpdated).getTime()) > 24 * 60 * 60 * 1000) {
      try {
        // Get completed recommendations to pass to calculation
        const completedRecommendations = prediction 
          ? prediction.recommendations.filter(r => r.completed)
          : [];
        
        const predictionData = await calculateInterviewPrediction(interviewId, userId, completedRecommendations);
        
        if (prediction) {
          // Preserve completed recommendations
          const existingRecommendations = prediction.recommendations;
          const newRecommendations = predictionData.recommendations.map(newRec => {
            const existing = existingRecommendations.find(
              existingRec => existingRec.title === newRec.title && existingRec.category === newRec.category
            );
            if (existing && existing.completed) {
              return {
                ...newRec,
                _id: existing._id,
                completed: true,
                completedAt: existing.completedAt
              };
            }
            return newRec;
          });
          
          Object.assign(prediction, {
            ...predictionData,
            recommendations: newRecommendations
          });
          prediction.lastUpdated = Date.now();
          prediction.version += 1;
          await prediction.save();
        } else {
          prediction = await InterviewPrediction.create(predictionData);
          await prediction.populate('interviewId', 'title company scheduledDate interviewType status');
          await prediction.populate('jobId', 'title company status');
        }
      } catch (error) {
        console.error(`Error calculating prediction for interview ${interviewId}:`, error);
        continue;
      }
    }
    
    predictions.push(prediction);
  }
  
  // Sort by success probability descending
  predictions.sort((a, b) => b.successProbability - a.successProbability);
  
  // Add comparison data
  predictions.forEach((prediction, index) => {
    prediction.comparisonData = {
      rankAmongUpcoming: index + 1,
      totalUpcomingInterviews: predictions.length,
      percentile: Math.round(((predictions.length - index) / predictions.length) * 100),
    };
  });
  
  const { response, statusCode } = successResponse(
    "Upcoming interview predictions retrieved successfully",
    {
      predictions,
      count: predictions.length,
      highestProbability: predictions.length > 0 ? predictions[0].successProbability : null,
      lowestProbability: predictions.length > 0 ? predictions[predictions.length - 1].successProbability : null,
    }
  );
  return sendResponse(res, response, statusCode);
});

/**
 * POST /api/interview-predictions/:interviewId/recalculate - Force recalculation of prediction
 */
export const recalculatePrediction = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { interviewId } = req.params;
  
  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }
  
  // Verify interview exists and belongs to user
  const interview = await Interview.findOne({ _id: interviewId, userId });
  if (!interview) {
    const { response, statusCode } = errorResponse(
      "Interview not found or you don't have permission to access it",
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }
  
  try {
    // Get existing prediction to preserve completed recommendations
    let prediction = await InterviewPrediction.findOne({ interviewId, userId });
    
    const completedRecommendations = prediction 
      ? prediction.recommendations.filter(r => r.completed)
      : [];
    
    // Calculate new prediction with completed recommendations for bonus
    const predictionData = await calculateInterviewPrediction(interviewId, userId, completedRecommendations);
    
    // Update or create prediction
    if (prediction) {
      // Preserve completed recommendations
      const existingRecommendations = prediction.recommendations;
      const newRecommendations = predictionData.recommendations.map(newRec => {
        const existing = existingRecommendations.find(
          existingRec => existingRec.title === newRec.title && existingRec.category === newRec.category
        );
        if (existing && existing.completed) {
          return {
            ...newRec,
            _id: existing._id,
            completed: true,
            completedAt: existing.completedAt
          };
        }
        return newRec;
      });
      
      Object.assign(prediction, {
        ...predictionData,
        recommendations: newRecommendations
      });
      prediction.lastUpdated = Date.now();
      prediction.version += 1;
      await prediction.save();
    } else {
      prediction = await InterviewPrediction.create(predictionData);
    }
    
    await prediction.populate('interviewId', 'title company scheduledDate interviewType status');
    await prediction.populate('jobId', 'title company status');
    
    const { response, statusCode } = successResponse(
      "Interview prediction recalculated successfully",
      { prediction }
    );
    return sendResponse(res, response, statusCode);
  } catch (error) {
    console.error("Error recalculating prediction:", error);
    const { response, statusCode } = errorResponse(
      "Failed to recalculate interview prediction",
      500,
      ERROR_CODES.INTERNAL_ERROR
    );
    return sendResponse(res, response, statusCode);
  }
});

/**
 * PUT /api/interview-predictions/:interviewId/recommendations/:recommendationId/complete
 * Mark a recommendation as completed
 */
export const completeRecommendation = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { interviewId, recommendationId } = req.params;
  
  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }
  
  const prediction = await InterviewPrediction.findOne({ interviewId, userId });
  
  if (!prediction) {
    const { response, statusCode } = errorResponse(
      "Prediction not found",
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }
  
  try {
    await prediction.completeRecommendation(recommendationId);
    
    // Get completed recommendations to pass to calculation for bonus
    const completedRecommendations = prediction.recommendations.filter(r => r.completed);
    console.log('✅ Marking recommendation complete. Total completed:', completedRecommendations.length);
    console.log('✅ Completed recommendations:', completedRecommendations.map(r => ({ 
      title: r.title, 
      estimatedImpact: r.estimatedImpact,
      completed: r.completed 
    })));
    
    // Recalculate prediction with completed recommendations for bonus
    const predictionData = await calculateInterviewPrediction(interviewId, userId, completedRecommendations);
    
    // Preserve completed status of existing recommendations
    const existingRecommendations = prediction.recommendations;
    const newRecommendations = predictionData.recommendations.map(newRec => {
      // Find if this recommendation was already completed
      const existing = existingRecommendations.find(
        existingRec => existingRec.title === newRec.title && existingRec.category === newRec.category
      );
      if (existing && existing.completed) {
        return {
          ...newRec,
          _id: existing._id,
          completed: true,
          completedAt: existing.completedAt
        };
      }
      return newRec;
    });
    
    // Update prediction with preserved recommendations
    Object.assign(prediction, {
      ...predictionData,
      recommendations: newRecommendations
    });
    prediction.lastUpdated = Date.now();
    await prediction.save();
    
    await prediction.populate('interviewId', 'title company scheduledDate interviewType status');
    await prediction.populate('jobId', 'title company status');
    
    const { response, statusCode } = successResponse(
      "Recommendation marked as completed",
      { prediction }
    );
    return sendResponse(res, response, statusCode);
  } catch (error) {
    console.error("Error completing recommendation:", error);
    const { response, statusCode } = errorResponse(
      error.message || "Failed to complete recommendation",
      400,
      ERROR_CODES.BAD_REQUEST
    );
    return sendResponse(res, response, statusCode);
  }
});

/**
 * DELETE /api/interview-predictions/:interviewId/recommendations/:recommendationId/complete - Undo completed recommendation
 */
export const uncompleteRecommendation = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { interviewId, recommendationId } = req.params;
  
  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }
  
  const prediction = await InterviewPrediction.findOne({ interviewId, userId });
  
  if (!prediction) {
    const { response, statusCode } = errorResponse(
      "Prediction not found",
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }
  
  try {
    await prediction.uncompleteRecommendation(recommendationId);
    
    // Get remaining completed recommendations to pass to calculation
    const completedRecommendations = prediction.recommendations.filter(r => r.completed);
    console.log('↩️  Unmarking recommendation. Total completed:', completedRecommendations.length);
    
    // Recalculate prediction without this recommendation's bonus
    const predictionData = await calculateInterviewPrediction(interviewId, userId, completedRecommendations);
    
    // Preserve completed status of existing recommendations
    const existingRecommendations = prediction.recommendations;
    const newRecommendations = predictionData.recommendations.map(newRec => {
      const existing = existingRecommendations.find(
        existingRec => existingRec.title === newRec.title && existingRec.category === newRec.category
      );
      if (existing && existing.completed) {
        return {
          ...newRec,
          _id: existing._id,
          completed: true,
          completedAt: existing.completedAt
        };
      }
      return newRec;
    });
    
    // Update prediction with preserved recommendations
    Object.assign(prediction, {
      ...predictionData,
      recommendations: newRecommendations
    });
    prediction.lastUpdated = Date.now();
    await prediction.save();
    
    await prediction.populate('interviewId', 'title company scheduledDate interviewType status');
    await prediction.populate('jobId', 'title company status');
    
    const { response, statusCode } = successResponse(
      "Recommendation unmarked",
      { prediction }
    );
    return sendResponse(res, response, statusCode);
  } catch (error) {
    console.error("Error uncompleting recommendation:", error);
    const { response, statusCode } = errorResponse(
      error.message || "Failed to uncomplete recommendation",
      400,
      ERROR_CODES.BAD_REQUEST
    );
    return sendResponse(res, response, statusCode);
  }
});

/**
 * POST /api/interview-predictions/:interviewId/outcome - Record actual interview outcome
 */
export const recordOutcome = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { interviewId } = req.params;
  const { actualResult, actualRating } = req.body;
  
  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }
  
  if (!actualResult) {
    const { response, statusCode } = errorResponse(
      "actualResult is required",
      400,
      ERROR_CODES.BAD_REQUEST
    );
    return sendResponse(res, response, statusCode);
  }
  
  const prediction = await InterviewPrediction.findOne({ interviewId, userId });
  
  if (!prediction) {
    const { response, statusCode } = errorResponse(
      "Prediction not found",
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }
  
  try {
    await prediction.recordOutcome(actualResult, actualRating);
    await prediction.populate('interviewId', 'title company scheduledDate interviewType status');
    await prediction.populate('jobId', 'title company status');
    
    const { response, statusCode } = successResponse(
      "Interview outcome recorded successfully",
      { 
        prediction,
        accuracy: prediction.outcome.predictionAccuracy,
      }
    );
    return sendResponse(res, response, statusCode);
  } catch (error) {
    console.error("Error recording outcome:", error);
    const { response, statusCode } = errorResponse(
      "Failed to record interview outcome",
      500,
      ERROR_CODES.INTERNAL_ERROR
    );
    return sendResponse(res, response, statusCode);
  }
});

/**
 * GET /api/interview-predictions/analytics - Get prediction accuracy analytics
 */
export const getAnalytics = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  
  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }
  
  // Get all predictions with outcomes
  const predictionsWithOutcomes = await InterviewPrediction.find({
    userId,
    'outcome.actualResult': { $exists: true, $ne: 'Pending' },
  }).populate('interviewId', 'title company scheduledDate interviewType');
  
  // Calculate overall accuracy
  const averageAccuracy = await InterviewPrediction.getAverageAccuracy(userId);
  
  // Calculate accuracy by interview type
  const accuracyByType = {};
  predictionsWithOutcomes.forEach(prediction => {
    const type = prediction.interviewId?.interviewType || 'Other';
    if (!accuracyByType[type]) {
      accuracyByType[type] = { total: 0, count: 0 };
    }
    if (prediction.outcome.predictionAccuracy !== null && prediction.outcome.predictionAccuracy !== undefined) {
      accuracyByType[type].total += prediction.outcome.predictionAccuracy;
      accuracyByType[type].count += 1;
    }
  });
  
  const accuracyByTypeFormatted = {};
  Object.entries(accuracyByType).forEach(([type, data]) => {
    accuracyByTypeFormatted[type] = data.count > 0 
      ? Math.round(data.total / data.count) 
      : 0;
  });
  
  // Calculate success rate (actual outcomes vs predictions)
  const successfulOutcomes = predictionsWithOutcomes.filter(p => 
    ['Passed', 'Moved to Next Round', 'Offer Extended'].includes(p.outcome.actualResult)
  );
  
  const actualSuccessRate = predictionsWithOutcomes.length > 0
    ? Math.round((successfulOutcomes.length / predictionsWithOutcomes.length) * 100)
    : 0;
  
  const predictedSuccessRate = predictionsWithOutcomes.length > 0
    ? Math.round(
        predictionsWithOutcomes.reduce((sum, p) => sum + p.successProbability, 0) / 
        predictionsWithOutcomes.length
      )
    : 0;
  
  // Get recent trends (last 5 predictions)
  const recentPredictions = predictionsWithOutcomes
    .sort((a, b) => new Date(b.calculatedAt) - new Date(a.calculatedAt))
    .slice(0, 5);
  
  const { response, statusCode } = successResponse(
    "Prediction analytics retrieved successfully",
    {
      averageAccuracy,
      accuracyByType: accuracyByTypeFormatted,
      totalPredictions: predictionsWithOutcomes.length,
      actualSuccessRate,
      predictedSuccessRate,
      calibrationDifference: Math.abs(actualSuccessRate - predictedSuccessRate),
      recentPredictions: recentPredictions.map(p => ({
        interview: p.interviewId?.title,
        company: p.interviewId?.company,
        predicted: p.successProbability,
        actual: p.outcome.actualResult,
        accuracy: p.outcome.predictionAccuracy,
      })),
    }
  );
  return sendResponse(res, response, statusCode);
});

/**
 * GET /api/interview-predictions/comparison - Compare success probabilities across interviews
 */
export const compareInterviews = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { interviewIds } = req.query; // Comma-separated interview IDs
  
  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }
  
  if (!interviewIds) {
    const { response, statusCode } = errorResponse(
      "interviewIds query parameter is required",
      400,
      ERROR_CODES.BAD_REQUEST
    );
    return sendResponse(res, response, statusCode);
  }
  
  const ids = interviewIds.split(',');
  
  // Get predictions for specified interviews
  const predictions = await InterviewPrediction.find({
    userId,
    interviewId: { $in: ids },
  })
    .populate('interviewId', 'title company scheduledDate interviewType')
    .populate('jobId', 'title company status')
    .sort({ successProbability: -1 });
  
  // Build comparison data
  const comparison = predictions.map((prediction, index) => ({
    interview: {
      id: prediction.interviewId._id,
      title: prediction.interviewId.title,
      company: prediction.interviewId.company,
      type: prediction.interviewId.interviewType,
      scheduledDate: prediction.interviewId.scheduledDate,
    },
    successProbability: prediction.successProbability,
    confidenceScore: prediction.confidenceScore,
    rank: index + 1,
    strengthsCount: prediction.recommendations.filter(r => r.estimatedImpact < 10).length,
    improvementAreasCount: prediction.recommendations.filter(r => r.priority === 'High').length,
    preparationCompleteness: prediction.preparationCompleteness,
  }));
  
  const { response, statusCode } = successResponse(
    "Interview comparison retrieved successfully",
    {
      comparison,
      bestPrepared: comparison[0] || null,
      needsMostWork: comparison[comparison.length - 1] || null,
    }
  );
  return sendResponse(res, response, statusCode);
});

export default {
  getPrediction,
  getAllUserPredictions,
  getUpcomingPredictions,
  recalculatePrediction,
  completeRecommendation,
  uncompleteRecommendation,
  recordOutcome,
  getAnalytics,
  compareInterviews,
};
