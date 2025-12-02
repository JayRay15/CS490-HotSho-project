import InformationalInterview from '../models/InformationalInterview.js';
import { errorResponse, successResponse, sendResponse, ERROR_CODES } from '../utils/responseFormat.js';
import { generateText } from '../utils/geminiService.js';

const getUserId = (req) => {
  const auth = typeof req.auth === 'function' ? req.auth() : req.auth;
  return auth?.userId || auth?.payload?.sub;
};

/**
 * Create a new informational interview
 */
export const createInterview = async (req, res) => {
  try {
    const userId = getUserId(req);
    const interviewData = {
      ...req.body,
      userId
    };

    const interview = await InformationalInterview.create(interviewData);
    
    const { response, statusCode } = successResponse('Informational interview created successfully', { interview });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error('Failed to create informational interview:', err);
    const { response, statusCode } = errorResponse('Failed to create informational interview', 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

/**
 * Get all informational interviews for a user
 */
export const getInterviews = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { status, archived } = req.query;
    
    const filter = { userId };
    if (status) filter.status = status;
    if (archived !== undefined) filter.archived = archived === 'true';
    
    const interviews = await InformationalInterview.find(filter)
      .populate('contactId', 'name email company role')
      .sort({ 'dates.interviewDate': -1, createdAt: -1 })
      .lean();
    
    const { response, statusCode } = successResponse('Informational interviews fetched successfully', { interviews });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error('Failed to fetch informational interviews:', err);
    const { response, statusCode } = errorResponse('Failed to fetch informational interviews', 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

/**
 * Get a single informational interview by ID
 */
export const getInterviewById = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    
    const interview = await InformationalInterview.findOne({ _id: id, userId })
      .populate('contactId', 'name email company role')
      .lean();
    
    if (!interview) {
      const { response, statusCode } = errorResponse('Informational interview not found', 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }
    
    const { response, statusCode } = successResponse('Informational interview fetched successfully', { interview });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error('Failed to fetch informational interview:', err);
    const { response, statusCode } = errorResponse('Failed to fetch informational interview', 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

/**
 * Update an informational interview
 */
export const updateInterview = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const updates = req.body;
    
    const interview = await InformationalInterview.findOne({ _id: id, userId });
    
    if (!interview) {
      const { response, statusCode } = errorResponse('Informational interview not found', 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }
    
    // Apply updates
    Object.keys(updates).forEach(key => {
      if (key !== 'userId' && key !== '_id') {
        interview[key] = updates[key];
      }
    });
    
    // Recalculate impact score if outcomes were updated
    if (updates.outcomes) {
      interview.calculateImpactScore();
    }
    
    await interview.save();
    
    const { response, statusCode } = successResponse('Informational interview updated successfully', { interview });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error('Failed to update informational interview:', err);
    const { response, statusCode } = errorResponse('Failed to update informational interview', 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

/**
 * Delete an informational interview
 */
export const deleteInterview = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    
    const interview = await InformationalInterview.findOneAndDelete({ _id: id, userId });
    
    if (!interview) {
      const { response, statusCode } = errorResponse('Informational interview not found', 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }
    
    const { response, statusCode } = successResponse('Informational interview deleted successfully', { id });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error('Failed to delete informational interview:', err);
    const { response, statusCode } = errorResponse('Failed to delete informational interview', 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

/**
 * Generate outreach email template
 */
export const generateOutreach = async (req, res) => {
  try {
    const { candidateName, targetRole, targetCompany, userBackground, userGoal } = req.body;
    
    if (!candidateName || !targetRole || !targetCompany) {
      const { response, statusCode } = errorResponse('Missing required fields', 400, ERROR_CODES.VALIDATION_ERROR);
      return sendResponse(res, response, statusCode);
    }
    
    const prompt = `Generate a professional and personalized cold outreach email for an informational interview request.

Context:
- Candidate Name: ${candidateName}
- Their Role: ${targetRole}
- Their Company: ${targetCompany}
- My Background: ${userBackground || 'Job seeker looking to learn about the industry'}
- My Goal: ${userGoal || 'Learn about their career path and get industry insights'}

Requirements:
- Keep it concise (150-200 words)
- Professional but warm tone
- Show genuine interest in their work
- Be specific about what you want to learn
- Suggest a 20-30 minute call
- Make it easy to say yes
- Include a clear call-to-action

Format the email with:
Subject: [Subject line]

Body: [Email content]`;

    const generatedContent = await generateText(prompt);
    
    const { response, statusCode } = successResponse('Outreach email generated successfully', { 
      outreachContent: generatedContent 
    });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error('Failed to generate outreach email:', err);
    const { response, statusCode } = errorResponse('Failed to generate outreach email', 500, ERROR_CODES.AI_SERVICE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

/**
 * Generate preparation framework
 */
export const generatePreparation = async (req, res) => {
  try {
    const { targetRole, targetCompany, candidateName, userGoals } = req.body;
    
    if (!targetRole || !targetCompany) {
      const { response, statusCode } = errorResponse('Missing required fields', 400, ERROR_CODES.VALIDATION_ERROR);
      return sendResponse(res, response, statusCode);
    }
    
    const prompt = `Generate an informational interview preparation framework.

Interview Details:
- Person: ${candidateName || 'Professional'}
- Their Role: ${targetRole}
- Their Company: ${targetCompany}
- My Goals: ${userGoals || 'Learn about their career path and industry insights'}

Generate:

1. STRATEGIC QUESTIONS (5 questions):
   - Open-ended questions about their career journey
   - Questions about industry trends
   - Questions about their company culture
   - Questions about skills needed for success
   - Questions about challenges in the role

2. RESEARCH CHECKLIST (5-7 items):
   - Company background to research
   - Industry trends to understand
   - Recent news or achievements
   - Common technologies/skills in the role

3. CONVERSATION TIPS (3-4 tips):
   - How to build rapport
   - What to avoid
   - How to make it valuable for them too

Format as JSON with keys: questions (array), researchTopics (array), conversationTips (array)`;

    const generatedContent = await generateText(prompt);
    
    // Parse the JSON response
    let preparation;
    try {
      // Try to extract JSON from the response
      const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        preparation = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: parse it manually if not in JSON format
        preparation = {
          questions: [],
          researchTopics: [],
          conversationTips: []
        };
      }
    } catch (parseErr) {
      // If parsing fails, return the raw content
      preparation = {
        questions: ['What inspired you to pursue a career in this field?'],
        researchTopics: [`Research ${targetCompany}'s recent projects and initiatives`],
        conversationTips: ['Be genuinely curious and listen actively'],
        rawContent: generatedContent
      };
    }
    
    const { response, statusCode } = successResponse('Preparation framework generated successfully', { 
      preparation 
    });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error('Failed to generate preparation framework:', err);
    const { response, statusCode } = errorResponse('Failed to generate preparation framework', 500, ERROR_CODES.AI_SERVICE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

/**
 * Generate follow-up email template
 */
export const generateFollowUp = async (req, res) => {
  try {
    const { candidateName, targetRole, keyLearnings, referralObtained } = req.body;
    
    if (!candidateName) {
      const { response, statusCode } = errorResponse('Candidate name is required', 400, ERROR_CODES.VALIDATION_ERROR);
      return sendResponse(res, response, statusCode);
    }
    
    const prompt = `Generate a professional thank-you and follow-up email after an informational interview.

Context:
- Person's Name: ${candidateName}
- Their Role: ${targetRole || 'Professional'}
- Key Learnings: ${keyLearnings || 'Valuable insights about the industry'}
- Referral Obtained: ${referralObtained ? 'Yes' : 'No'}

Requirements:
- Express genuine gratitude
- Reference specific insights they shared
- Mention how you'll apply what you learned
${referralObtained ? '- Thank them for the referral/introduction' : '- Keep the door open for future connection'}
- Offer to reciprocate help in the future
- Keep it concise (100-150 words)

Format with:
Subject: [Subject line]

Body: [Email content]`;

    const generatedContent = await generateText(prompt);
    
    const { response, statusCode } = successResponse('Follow-up email generated successfully', { 
      followUpContent: generatedContent 
    });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error('Failed to generate follow-up email:', err);
    const { response, statusCode } = errorResponse('Failed to generate follow-up email', 500, ERROR_CODES.AI_SERVICE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

/**
 * Get analytics/insights about informational interviews
 */
export const getAnalytics = async (req, res) => {
  try {
    const userId = getUserId(req);
    
    const interviews = await InformationalInterview.find({ userId, archived: false });
    
    const analytics = {
      total: interviews.length,
      byStatus: {
        Identified: interviews.filter(i => i.status === 'Identified').length,
        'Outreach Sent': interviews.filter(i => i.status === 'Outreach Sent').length,
        Scheduled: interviews.filter(i => i.status === 'Scheduled').length,
        Completed: interviews.filter(i => i.status === 'Completed').length,
        'Follow-up Sent': interviews.filter(i => i.status === 'Follow-up Sent').length
      },
      completed: interviews.filter(i => i.status === 'Completed' || i.status === 'Follow-up Sent').length,
      averageImpactScore: interviews.filter(i => i.impactScore > 0).reduce((sum, i) => sum + i.impactScore, 0) / interviews.filter(i => i.impactScore > 0).length || 0,
      referralsObtained: interviews.filter(i => i.outcomes.referralObtained).length,
      upcomingInterviews: interviews.filter(i => i.dates.interviewDate && new Date(i.dates.interviewDate) > new Date()).length,
      strongConnections: interviews.filter(i => i.outcomes.connectionQuality === 'Strong').length
    };
    
    const { response, statusCode } = successResponse('Analytics fetched successfully', { analytics });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error('Failed to fetch analytics:', err);
    const { response, statusCode } = errorResponse('Failed to fetch analytics', 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};
