import InformationalInterview from '../models/InformationalInterview.js';
import { errorResponse, successResponse, sendResponse, ERROR_CODES } from '../utils/responseFormat.js';
import { generateText } from '../utils/geminiService.js';
import { Job } from '../models/Job.js';

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
 * Generate candidate suggestions for informational interviews
 */
export const suggestCandidates = async (req, res) => {
  try {
    const { targetRole, targetCompany, targetIndustry, userBackground, careerGoals } = req.body;
    
    if (!targetRole && !targetCompany && !targetIndustry) {
      const { response, statusCode } = errorResponse('At least one of targetRole, targetCompany, or targetIndustry is required', 400, ERROR_CODES.VALIDATION_ERROR);
      return sendResponse(res, response, statusCode);
    }
    
    const prompt = `Generate 5 specific types of professionals to target for informational interviews.

Context:
- Target Role: ${targetRole || 'Not specified'}
- Target Company: ${targetCompany || 'Not specified'}  
- Target Industry: ${targetIndustry || 'Not specified'}
- User Background: ${userBackground || 'Job seeker looking to transition into this field'}
- Career Goals: ${careerGoals || 'Learn about the industry and explore opportunities'}

For each candidate type, provide:
1. Job Title - specific role to look for
2. Why This Person - why they'd be valuable to talk to
3. Key Questions - 2-3 specific questions to ask them
4. Where to Find - platforms/methods to find this type of person
5. Outreach Tip - one specific tip for reaching out

Format as JSON array with 5 objects containing: jobTitle, whyThisPerson, keyQuestions (array), whereToFind, outreachTip`;

    const generatedContent = await generateText(prompt);
    
    // Parse the JSON response
    let suggestions;
    try {
      const jsonMatch = generatedContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      } else {
        suggestions = [{
          jobTitle: `${targetRole || 'Professional'} at ${targetCompany || 'target company'}`,
          whyThisPerson: 'Direct experience in your target role',
          keyQuestions: ['What does a typical day look like?', 'What skills are most important?'],
          whereToFind: 'LinkedIn search, company website',
          outreachTip: 'Reference shared connections or interests'
        }];
      }
    } catch (parseErr) {
      suggestions = [{
        jobTitle: `${targetRole || 'Professional'} at ${targetCompany || 'target company'}`,
        whyThisPerson: 'Direct experience in your target role',
        keyQuestions: ['What does a typical day look like?', 'What skills are most important?'],
        whereToFind: 'LinkedIn search, company website',
        outreachTip: 'Reference shared connections or interests',
        rawContent: generatedContent
      }];
    }
    
    const { response, statusCode } = successResponse('Candidate suggestions generated successfully', { suggestions });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error('Failed to generate candidate suggestions:', err);
    const { response, statusCode } = errorResponse('Failed to generate candidate suggestions', 500, ERROR_CODES.AI_SERVICE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

/**
 * Generate aggregated insights from completed informational interviews
 */
export const generateInsights = async (req, res) => {
  try {
    const userId = getUserId(req);
    
    // Get all completed interviews with outcomes
    const completedInterviews = await InformationalInterview.find({
      userId,
      status: { $in: ['Completed', 'Follow-up Sent'] },
      'outcomes.keyLearnings': { $ne: '' }
    }).lean();
    
    if (completedInterviews.length === 0) {
      const { response, statusCode } = successResponse('No completed interviews with insights found', { 
        insights: null,
        message: 'Complete some informational interviews and record outcomes to generate insights'
      });
      return sendResponse(res, response, statusCode);
    }
    
    // Aggregate data for the prompt
    const interviewSummaries = completedInterviews.map(i => ({
      role: i.targetRole,
      company: i.targetCompany,
      keyLearnings: i.outcomes.keyLearnings,
      industryInsights: i.outcomes.industryInsights || '',
      futureOpportunities: i.outcomes.futureOpportunities || ''
    }));
    
    const prompt = `Analyze these informational interview insights and generate actionable intelligence.

Interview Data:
${JSON.stringify(interviewSummaries, null, 2)}

Generate comprehensive insights including:

1. INDUSTRY TRENDS (3-5 key trends)
   - What patterns emerge across conversations?
   - What direction is the industry heading?

2. SKILL PRIORITIES (ranked list)
   - What skills are most valued?
   - Any emerging skills mentioned?

3. COMPANY CULTURE PATTERNS
   - What do these companies value?
   - Common challenges mentioned?

4. CAREER PATH INSIGHTS
   - Common paths into these roles?
   - Advice patterns from professionals?

5. ACTIONABLE RECOMMENDATIONS (3-5 specific actions)
   - Based on insights, what should the job seeker do next?

6. NETWORKING OPPORTUNITIES
   - Any mentioned connections to pursue?
   - Events or communities to join?

Format as JSON with keys: industryTrends (array), skillPriorities (array), culturalPatterns (array), careerPaths (array), recommendations (array), networkingOpportunities (array)`;

    const generatedContent = await generateText(prompt);
    
    let insights;
    try {
      const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        insights = JSON.parse(jsonMatch[0]);
      } else {
        insights = {
          industryTrends: ['Analyze more interviews for trend insights'],
          skillPriorities: ['Continue conducting interviews to identify skill patterns'],
          culturalPatterns: [],
          careerPaths: [],
          recommendations: ['Record detailed outcomes from your interviews'],
          networkingOpportunities: []
        };
      }
    } catch (parseErr) {
      insights = {
        industryTrends: [],
        skillPriorities: [],
        culturalPatterns: [],
        careerPaths: [],
        recommendations: [],
        networkingOpportunities: [],
        rawContent: generatedContent
      };
    }
    
    insights.basedOnInterviews = completedInterviews.length;
    insights.generatedAt = new Date();
    
    const { response, statusCode } = successResponse('Insights generated successfully', { insights });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error('Failed to generate insights:', err);
    const { response, statusCode } = errorResponse('Failed to generate insights', 500, ERROR_CODES.AI_SERVICE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

/**
 * Connect informational interviews to job opportunities
 */
export const connectToOpportunities = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { interviewId } = req.params;
    const { jobId } = req.body;
    
    // Get the interview
    const interview = await InformationalInterview.findOne({ _id: interviewId, userId });
    
    if (!interview) {
      const { response, statusCode } = errorResponse('Informational interview not found', 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }
    
    // If jobId provided, link to specific job
    if (jobId) {
      const job = await Job.findOne({ _id: jobId, userId });
      if (!job) {
        const { response, statusCode } = errorResponse('Job not found', 404, ERROR_CODES.NOT_FOUND);
        return sendResponse(res, response, statusCode);
      }
      
      // Add reference to interview in job notes if not already there
      const interviewNote = `Connected from informational interview with ${interview.candidateName} (${interview.targetRole} at ${interview.targetCompany})`;
      if (!job.notes?.includes(interviewNote)) {
        job.notes = job.notes ? `${job.notes}\n\n${interviewNote}` : interviewNote;
        await job.save();
      }
      
      // Store the connection in the interview
      if (!interview.outcomes.futureOpportunities) {
        interview.outcomes.futureOpportunities = '';
      }
      interview.outcomes.futureOpportunities += `\nLinked to job: ${job.company} - ${job.title}`;
      await interview.save();
      
      const { response, statusCode } = successResponse('Interview connected to job', { 
        interview,
        job: { _id: job._id, company: job.company, title: job.title }
      });
      return sendResponse(res, response, statusCode);
    }
    
    // Otherwise, find potential matching opportunities
    const potentialMatches = await Job.find({
      userId,
      $or: [
        { company: { $regex: interview.targetCompany, $options: 'i' } },
        { title: { $regex: interview.targetRole, $options: 'i' } }
      ]
    }).select('company title status createdAt').limit(10).lean();
    
    const { response, statusCode } = successResponse('Potential opportunities found', { 
      interview: { 
        _id: interview._id, 
        candidateName: interview.candidateName,
        targetCompany: interview.targetCompany,
        targetRole: interview.targetRole
      },
      potentialMatches
    });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error('Failed to connect to opportunities:', err);
    const { response, statusCode } = errorResponse('Failed to connect to opportunities', 500, ERROR_CODES.DATABASE_ERROR);
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
