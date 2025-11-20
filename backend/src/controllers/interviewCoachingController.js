import { InterviewResponse } from '../models/InterviewResponse.js';
import { generateInterviewResponseFeedback, generateInterviewQuestions } from '../utils/geminiService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { successResponse, errorResponse, sendResponse, ERROR_CODES } from '../utils/responseFormat.js';

/**
 * Submit a practice interview response and get AI feedback
 * POST /api/interview-coaching/responses
 */
export const submitInterviewResponse = asyncHandler(async (req, res) => {
    const userId = req.auth?.userId || req.auth?.payload?.sub;
    const {
        question,
        response,
        category = 'Behavioral',
        difficulty = 'Medium',
        targetDuration = 120,
        context = {},
        tags = [],
        notes = ''
    } = req.body;

    if (!userId) {
        const { response: errorResp, statusCode } = errorResponse(
            'Unauthorized: missing authentication credentials',
            401,
            ERROR_CODES.UNAUTHORIZED
        );
        return sendResponse(res, errorResp, statusCode);
    }

    // Validation
    if (!question || !response) {
        const { response: errorResp, statusCode } = errorResponse(
            'Question and response are required',
            400,
            ERROR_CODES.VALIDATION_ERROR
        );
        return sendResponse(res, errorResp, statusCode);
    }

    if (response.trim().split(/\s+/).length < 20) {
        const { response: errorResp, statusCode } = errorResponse(
            'Response is too short. Please provide at least 20 words for meaningful feedback.',
            400,
            ERROR_CODES.VALIDATION_ERROR
        );
        return sendResponse(res, errorResp, statusCode);
    }

    try {
        // Generate AI feedback
        const feedback = await generateInterviewResponseFeedback(
            question,
            response,
            category,
            targetDuration,
            context
        );

        // Check if this is a revision of an existing response
        let previousVersionId = null;
        let version = 1;

        // Look for similar question from same user
        const similarResponse = await InterviewResponse.findOne({
            userId,
            'question.text': question,
            isArchived: false
        }).sort({ createdAt: -1 });

        if (similarResponse) {
            previousVersionId = similarResponse._id;
            version = similarResponse.version + 1;
        }

        // Create new interview response
        const interviewResponse = new InterviewResponse({
            userId,
            question: {
                text: question,
                category,
                difficulty
            },
            response,
            targetDuration,
            context,
            feedback,
            version,
            previousVersionId,
            tags,
            notes
        });

        // Update improvement tracking
        if (previousVersionId) {
            // This is a retry - update improvement tracking
            interviewResponse.improvementTracking.firstAttemptScore = similarResponse.improvementTracking.firstAttemptScore || similarResponse.feedback?.overallScore;
            interviewResponse.improvementTracking.attempts = similarResponse.improvementTracking.attempts + 1;
            interviewResponse.improvementTracking.bestScore = Math.max(
                similarResponse.improvementTracking.bestScore || 0,
                feedback.overallScore
            );

            if (interviewResponse.improvementTracking.firstAttemptScore) {
                const improvement = ((feedback.overallScore - interviewResponse.improvementTracking.firstAttemptScore) /
                    interviewResponse.improvementTracking.firstAttemptScore) * 100;
                interviewResponse.improvementTracking.overallImprovement = Math.round(improvement * 10) / 10;
            }

            // Copy score history
            interviewResponse.improvementTracking.scoreHistory = [
                ...similarResponse.improvementTracking.scoreHistory,
                { score: feedback.overallScore, date: new Date() }
            ];
        } else {
            // First attempt
            interviewResponse.improvementTracking.firstAttemptScore = feedback.overallScore;
            interviewResponse.improvementTracking.bestScore = feedback.overallScore;
            interviewResponse.improvementTracking.scoreHistory = [
                { score: feedback.overallScore, date: new Date() }
            ];
        }

        await interviewResponse.save();

        const { response: successResp, statusCode } = successResponse(
            'Interview response submitted successfully',
            {
                interviewResponse,
                improvementMetrics: interviewResponse.improvementMetrics
            }
        );
        return sendResponse(res, successResp, statusCode);

    } catch (error) {
        console.error('Submit Interview Response Error:', error);
        const { response: errorResp, statusCode } = errorResponse(
            `Failed to process interview response: ${error.message}`,
            500,
            ERROR_CODES.INTERNAL_ERROR
        );
        return sendResponse(res, errorResp, statusCode);
    }
});

/**
 * Get all interview responses for a user
 * GET /api/interview-coaching/responses
 */
export const getInterviewResponses = asyncHandler(async (req, res) => {
    const userId = req.auth?.userId || req.auth?.payload?.sub;
    const {
        category,
        includeArchived = false,
        limit = 50,
        skip = 0,
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = req.query;

    if (!userId) {
        const { response: errorResp, statusCode } = errorResponse(
            'Unauthorized: missing authentication credentials',
            401,
            ERROR_CODES.UNAUTHORIZED
        );
        return sendResponse(res, errorResp, statusCode);
    }

    try {
        const query = { userId };

        if (category) {
            query['question.category'] = category;
        }

        if (!includeArchived || includeArchived === 'false') {
            query.isArchived = false;
        }

        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const responses = await InterviewResponse.find(query)
            .sort(sort)
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        const total = await InterviewResponse.countDocuments(query);

        const { response: successResp, statusCode } = successResponse(
            'Interview responses retrieved successfully',
            {
                responses,
                pagination: {
                    total,
                    limit: parseInt(limit),
                    skip: parseInt(skip),
                    hasMore: total > (parseInt(skip) + parseInt(limit))
                }
            }
        );
        return sendResponse(res, successResp, statusCode);

    } catch (error) {
        console.error('Get Interview Responses Error:', error);
        const { response: errorResp, statusCode } = errorResponse(
            'Failed to retrieve interview responses',
            500,
            ERROR_CODES.INTERNAL_ERROR
        );
        return sendResponse(res, errorResp, statusCode);
    }
});

/**
 * Get a specific interview response by ID
 * GET /api/interview-coaching/responses/:id
 */
export const getInterviewResponseById = asyncHandler(async (req, res) => {
    const userId = req.auth?.userId || req.auth?.payload?.sub;
    const { id } = req.params;

    if (!userId) {
        const { response: errorResp, statusCode } = errorResponse(
            'Unauthorized: missing authentication credentials',
            401,
            ERROR_CODES.UNAUTHORIZED
        );
        return sendResponse(res, errorResp, statusCode);
    }

    try {
        const interviewResponse = await InterviewResponse.findOne({ _id: id, userId });

        if (!interviewResponse) {
            const { response: errorResp, statusCode } = errorResponse(
                'Interview response not found',
                404,
                ERROR_CODES.NOT_FOUND
            );
            return sendResponse(res, errorResp, statusCode);
        }

        // Get previous versions if they exist
        let previousVersions = [];
        if (interviewResponse.previousVersionId) {
            previousVersions = await InterviewResponse.find({
                userId,
                'question.text': interviewResponse.question.text,
                version: { $lt: interviewResponse.version }
            }).sort({ version: -1 });
        }

        const { response: successResp, statusCode } = successResponse(
            'Interview response retrieved successfully',
            {
                interviewResponse,
                previousVersions,
                improvementMetrics: interviewResponse.improvementMetrics
            }
        );
        return sendResponse(res, successResp, statusCode);

    } catch (error) {
        console.error('Get Interview Response Error:', error);
        const { response: errorResp, statusCode } = errorResponse(
            'Failed to retrieve interview response',
            500,
            ERROR_CODES.INTERNAL_ERROR
        );
        return sendResponse(res, errorResp, statusCode);
    }
});

/**
 * Update an interview response (add notes, tags, or archive)
 * PATCH /api/interview-coaching/responses/:id
 */
export const updateInterviewResponse = asyncHandler(async (req, res) => {
    const userId = req.auth?.userId || req.auth?.payload?.sub;
    const { id } = req.params;
    const { notes, tags, isArchived } = req.body;

    if (!userId) {
        const { response: errorResp, statusCode } = errorResponse(
            'Unauthorized: missing authentication credentials',
            401,
            ERROR_CODES.UNAUTHORIZED
        );
        return sendResponse(res, errorResp, statusCode);
    }

    try {
        const interviewResponse = await InterviewResponse.findOne({ _id: id, userId });

        if (!interviewResponse) {
            const { response: errorResp, statusCode } = errorResponse(
                'Interview response not found',
                404,
                ERROR_CODES.NOT_FOUND
            );
            return sendResponse(res, errorResp, statusCode);
        }

        // Update allowed fields
        if (notes !== undefined) interviewResponse.notes = notes;
        if (tags !== undefined) interviewResponse.tags = tags;
        if (isArchived !== undefined) interviewResponse.isArchived = isArchived;

        await interviewResponse.save();

        const { response: successResp, statusCode } = successResponse(
            'Interview response updated successfully',
            { interviewResponse }
        );
        return sendResponse(res, successResp, statusCode);

    } catch (error) {
        console.error('Update Interview Response Error:', error);
        const { response: errorResp, statusCode } = errorResponse(
            'Failed to update interview response',
            500,
            ERROR_CODES.INTERNAL_ERROR
        );
        return sendResponse(res, errorResp, statusCode);
    }
});

/**
 * Delete an interview response
 * DELETE /api/interview-coaching/responses/:id
 */
export const deleteInterviewResponse = asyncHandler(async (req, res) => {
    const userId = req.auth?.userId || req.auth?.payload?.sub;
    const { id } = req.params;

    if (!userId) {
        const { response: errorResp, statusCode } = errorResponse(
            'Unauthorized: missing authentication credentials',
            401,
            ERROR_CODES.UNAUTHORIZED
        );
        return sendResponse(res, errorResp, statusCode);
    }

    try {
        const interviewResponse = await InterviewResponse.findOneAndDelete({ _id: id, userId });

        if (!interviewResponse) {
            const { response: errorResp, statusCode } = errorResponse(
                'Interview response not found',
                404,
                ERROR_CODES.NOT_FOUND
            );
            return sendResponse(res, errorResp, statusCode);
        }

        const { response: successResp, statusCode } = successResponse(
            'Interview response deleted successfully',
            { deletedId: id }
        );
        return sendResponse(res, successResp, statusCode);

    } catch (error) {
        console.error('Delete Interview Response Error:', error);
        const { response: errorResp, statusCode } = errorResponse(
            'Failed to delete interview response',
            500,
            ERROR_CODES.INTERNAL_ERROR
        );
        return sendResponse(res, errorResp, statusCode);
    }
});

/**
 * Get practice statistics for a user
 * GET /api/interview-coaching/stats
 */
export const getPracticeStats = asyncHandler(async (req, res) => {
    const userId = req.auth?.userId || req.auth?.payload?.sub;

    if (!userId) {
        const { response: errorResp, statusCode } = errorResponse(
            'Unauthorized: missing authentication credentials',
            401,
            ERROR_CODES.UNAUTHORIZED
        );
        return sendResponse(res, errorResp, statusCode);
    }

    try {
        const stats = await InterviewResponse.getPracticeStats(userId);

        // Get recent improvement trend (last 10 responses)
        const recentResponses = await InterviewResponse.find({
            userId,
            isArchived: false,
            feedback: { $exists: true }
        })
            .sort({ createdAt: -1 })
            .limit(10)
            .select('feedback.overallScore createdAt improvementTracking');

        const scoresTrend = recentResponses.reverse().map(r => ({
            score: r.feedback.overallScore,
            date: r.createdAt
        }));

        // Calculate improvement metrics
        const improvementData = {
            totalPracticed: stats.overall.totalResponses,
            averageScore: Math.round(stats.overall.avgOverallScore * 10) / 10,
            averageImprovement: Math.round(stats.overall.avgImprovement * 10) / 10,
            scoresTrend,
            byCategory: stats.byCategory.map(cat => ({
                category: cat._id,
                count: cat.count,
                avgScore: Math.round(cat.avgScore * 10) / 10,
                bestScore: Math.round(cat.bestScore * 10) / 10,
                avgContentScore: Math.round(cat.avgContentScore * 10) / 10,
                avgStructureScore: Math.round(cat.avgStructureScore * 10) / 10,
                avgClarityScore: Math.round(cat.avgClarityScore * 10) / 10,
                avgRelevanceScore: Math.round(cat.avgRelevanceScore * 10) / 10,
                avgSpecificityScore: Math.round(cat.avgSpecificityScore * 10) / 10,
                avgImpactScore: Math.round(cat.avgImpactScore * 10) / 10
            }))
        };

        const { response: successResp, statusCode } = successResponse(
            'Practice statistics retrieved successfully',
            improvementData
        );
        return sendResponse(res, successResp, statusCode);

    } catch (error) {
        console.error('Get Practice Stats Error:', error);
        const { response: errorResp, statusCode } = errorResponse(
            'Failed to retrieve practice statistics',
            500,
            ERROR_CODES.INTERNAL_ERROR
        );
        return sendResponse(res, errorResp, statusCode);
    }
});

/**
 * Generate sample interview questions
 * POST /api/interview-coaching/questions/generate
 */
export const generateQuestions = asyncHandler(async (req, res) => {
    const userId = req.auth?.userId || req.auth?.payload?.sub;
    const {
        category = 'Behavioral',
        context = {},
        count = 5
    } = req.body;

    if (!userId) {
        const { response: errorResp, statusCode } = errorResponse(
            'Unauthorized: missing authentication credentials',
            401,
            ERROR_CODES.UNAUTHORIZED
        );
        return sendResponse(res, errorResp, statusCode);
    }

    try {
        const questions = await generateInterviewQuestions(category, context, count);

        const { response: successResp, statusCode } = successResponse(
            'Interview questions generated successfully',
            { questions }
        );
        return sendResponse(res, successResp, statusCode);

    } catch (error) {
        console.error('Generate Questions Error:', error);
        const { response: errorResp, statusCode } = errorResponse(
            `Failed to generate interview questions: ${error.message}`,
            500,
            ERROR_CODES.INTERNAL_ERROR
        );
        return sendResponse(res, errorResp, statusCode);
    }
});

/**
 * Compare multiple versions of the same response
 * GET /api/interview-coaching/responses/:id/compare
 */
export const compareVersions = asyncHandler(async (req, res) => {
    const userId = req.auth?.userId || req.auth?.payload?.sub;
    const { id } = req.params;

    if (!userId) {
        const { response: errorResp, statusCode } = errorResponse(
            'Unauthorized: missing authentication credentials',
            401,
            ERROR_CODES.UNAUTHORIZED
        );
        return sendResponse(res, errorResp, statusCode);
    }

    try {
        const currentResponse = await InterviewResponse.findOne({ _id: id, userId });

        if (!currentResponse) {
            const { response: errorResp, statusCode } = errorResponse(
                'Interview response not found',
                404,
                ERROR_CODES.NOT_FOUND
            );
            return sendResponse(res, errorResp, statusCode);
        }

        // Get all versions of this question
        const allVersions = await InterviewResponse.find({
            userId,
            'question.text': currentResponse.question.text,
            isArchived: false
        }).sort({ version: 1 });

        if (allVersions.length < 2) {
            const { response: successResp, statusCode } = successResponse(
                'Only one version exists for this question',
                {
                    versions: allVersions,
                    comparison: null
                }
            );
            return sendResponse(res, successResp, statusCode);
        }

        // Create comparison data
        const comparison = {
            question: currentResponse.question.text,
            totalVersions: allVersions.length,
            scoreProgression: allVersions.map((v, idx) => ({
                version: v.version,
                date: v.createdAt,
                overallScore: v.feedback?.overallScore || 0,
                contentScore: v.feedback?.contentScore || 0,
                structureScore: v.feedback?.structureScore || 0,
                clarityScore: v.feedback?.clarityScore || 0,
                relevanceScore: v.feedback?.relevanceScore || 0,
                specificityScore: v.feedback?.specificityScore || 0,
                impactScore: v.feedback?.impactScore || 0
            })),
            improvement: {
                overall: allVersions[allVersions.length - 1].feedback?.overallScore - allVersions[0].feedback?.overallScore,
                content: allVersions[allVersions.length - 1].feedback?.contentScore - allVersions[0].feedback?.contentScore,
                structure: allVersions[allVersions.length - 1].feedback?.structureScore - allVersions[0].feedback?.structureScore,
                clarity: allVersions[allVersions.length - 1].feedback?.clarityScore - allVersions[0].feedback?.clarityScore
            },
            bestVersion: allVersions.reduce((best, current) =>
                (current.feedback?.overallScore || 0) > (best.feedback?.overallScore || 0) ? current : best
            )
        };

        const { response: successResp, statusCode } = successResponse(
            'Version comparison retrieved successfully',
            {
                versions: allVersions,
                comparison
            }
        );
        return sendResponse(res, successResp, statusCode);

    } catch (error) {
        console.error('Compare Versions Error:', error);
        const { response: errorResp, statusCode } = errorResponse(
            'Failed to compare versions',
            500,
            ERROR_CODES.INTERNAL_ERROR
        );
        return sendResponse(res, errorResp, statusCode);
    }
});
