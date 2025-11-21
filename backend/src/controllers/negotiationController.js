import { Negotiation } from "../models/Negotiation.js";
import { Job } from "../models/Job.js";
import { User } from "../models/User.js";
import { successResponse, errorResponse, sendResponse, ERROR_CODES } from "../utils/responseFormat.js";
import { asyncHandler } from "../middleware/errorHandler.js";

/**
 * UC-083: Salary Negotiation Guidance and Tools
 * 
 * This controller provides comprehensive salary negotiation features including:
 * - Market data research for specific offers
 * - Automated talking point generation based on experience and achievements
 * - Total compensation evaluation frameworks
 * - Negotiation scripts for different scenarios
 * - Timing strategies for optimal salary discussions
 * - Counteroffer evaluation templates
 * - Confidence building exercises
 * - Outcome tracking and salary progression analysis
 */

/**
 * POST /api/negotiations - Create a new negotiation session
 */
export const createNegotiation = asyncHandler(async (req, res) => {
  const auth = req.auth();
  const userId = auth?.userId || auth?.payload?.sub;
  const { jobId, offerDetails, context } = req.body;

  console.log('Create negotiation request:', { userId, jobId, offerDetails: offerDetails?.company, context: context?.yearsExperience });

  if (!userId) {
    console.error('Unauthorized: No userId found');
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  if (!offerDetails?.company || !offerDetails?.position) {
    console.error('Validation error: Missing company or position', { company: offerDetails?.company, position: offerDetails?.position });
    const { response, statusCode } = errorResponse(
      "Company and position are required",
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
    return sendResponse(res, response, statusCode);
  }

  // Get user profile for context
  const user = await User.findOne({ auth0Id: userId });
  
  // Ensure context has default values for arrays
  const contextWithDefaults = {
    uniqueSkills: [],
    certifications: [],
    specializations: [],
    achievements: [],
    competingOffers: [],
    ...context
  };
  
  try {
    console.log('Generating talking points and scenarios...');
    
    // Generate initial talking points and scenarios
    const talkingPoints = await generateTalkingPoints(offerDetails, contextWithDefaults, user);
    const scenarios = generateNegotiationScenarios(offerDetails, contextWithDefaults);
    const timingStrategy = generateTimingStrategy(offerDetails);
    const preparationChecklist = generatePreparationChecklist();
    const confidenceExercises = generateConfidenceExercises();

    console.log('Creating negotiation document...');
    
    const negotiation = await Negotiation.create({
      userId,
      jobId: jobId || undefined,
      offerDetails,
      context: contextWithDefaults,
      talkingPoints,
      scenarios,
      timingStrategy,
      preparationChecklist,
      confidenceExercises,
      compensationFramework: generateCompensationFramework(contextWithDefaults)
    });

    console.log('Negotiation created successfully:', negotiation._id);

    const { response, statusCode } = successResponse(
      "Negotiation session created successfully",
      { negotiation }
    );
    return sendResponse(res, response, statusCode);
  } catch (error) {
    console.error('Error in createNegotiation:', error);
    console.error('Error stack:', error.stack);
    throw error; // Re-throw to be caught by asyncHandler
  }
});

/**
 * GET /api/negotiations - Get all negotiation sessions for user
 */
export const getNegotiations = asyncHandler(async (req, res) => {
  const auth = req.auth();
  const userId = auth?.userId || auth?.payload?.sub;
  const { status, includeArchived } = req.query;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const query = { userId };
  
  if (status) {
    query['outcome.status'] = status;
  }
  
  if (includeArchived !== 'true') {
    query.isArchived = false;
  }

  const negotiations = await Negotiation.find(query)
    .sort({ createdAt: -1 })
    .lean();

  const { response, statusCode } = successResponse(
    "Negotiations retrieved successfully",
    { 
      count: negotiations.length,
      negotiations 
    }
  );
  return sendResponse(res, response, statusCode);
});

/**
 * GET /api/negotiations/:id - Get specific negotiation session
 */
export const getNegotiationById = asyncHandler(async (req, res) => {
  const auth = req.auth();
  const userId = auth?.userId || auth?.payload?.sub;
  const { id } = req.params;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const negotiation = await Negotiation.findOne({ _id: id, userId });
  
  if (!negotiation) {
    const { response, statusCode } = errorResponse(
      "Negotiation session not found or you don't have permission to access it",
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  const { response, statusCode } = successResponse(
    "Negotiation retrieved successfully",
    { negotiation }
  );
  return sendResponse(res, response, statusCode);
});

/**
 * PUT /api/negotiations/:id - Update negotiation session
 */
export const updateNegotiation = asyncHandler(async (req, res) => {
  const auth = req.auth();
  const userId = auth?.userId || auth?.payload?.sub;
  const { id } = req.params;
  const updates = req.body;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const negotiation = await Negotiation.findOne({ _id: id, userId });
  
  if (!negotiation) {
    const { response, statusCode } = errorResponse(
      "Negotiation session not found or you don't have permission to access it",
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  // Update fields
  Object.keys(updates).forEach(key => {
    if (key !== '_id' && key !== 'userId') {
      negotiation[key] = updates[key];
    }
  });

  // Calculate improvement if final offer is being set
  if (updates.outcome?.finalOffer) {
    negotiation.calculateImprovement();
  }

  await negotiation.save();

  const { response, statusCode } = successResponse(
    "Negotiation updated successfully",
    { negotiation }
  );
  return sendResponse(res, response, statusCode);
});

/**
 * DELETE /api/negotiations/:id - Delete negotiation session
 */
export const deleteNegotiation = asyncHandler(async (req, res) => {
  const auth = req.auth();
  const userId = auth?.userId || auth?.payload?.sub;
  const { id } = req.params;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const negotiation = await Negotiation.findOneAndDelete({ _id: id, userId });
  
  if (!negotiation) {
    const { response, statusCode } = errorResponse(
      "Negotiation session not found or you don't have permission to delete it",
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  const { response, statusCode } = successResponse(
    "Negotiation deleted successfully",
    { id }
  );
  return sendResponse(res, response, statusCode);
});

/**
 * POST /api/negotiations/:id/talking-points - Generate or regenerate talking points
 */
export const generateTalkingPointsForNegotiation = asyncHandler(async (req, res) => {
  const auth = req.auth();
  const userId = auth?.userId || auth?.payload?.sub;
  const { id } = req.params;
  const { additionalContext } = req.body;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const negotiation = await Negotiation.findOne({ _id: id, userId });
  
  if (!negotiation) {
    const { response, statusCode } = errorResponse(
      "Negotiation session not found",
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  const user = await User.findOne({ auth0Id: userId });
  const mergedContext = { ...negotiation.context, ...additionalContext };
  
  const talkingPoints = await generateTalkingPoints(
    negotiation.offerDetails,
    mergedContext,
    user
  );

  negotiation.talkingPoints = talkingPoints;
  await negotiation.save();

  const { response, statusCode } = successResponse(
    "Talking points generated successfully",
    { talkingPoints }
  );
  return sendResponse(res, response, statusCode);
});

/**
 * POST /api/negotiations/:id/counteroffer - Add counteroffer evaluation
 */
export const addCounteroffer = asyncHandler(async (req, res) => {
  const auth = req.auth();
  const userId = auth?.userId || auth?.payload?.sub;
  const { id } = req.params;
  const counterofferData = req.body;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const negotiation = await Negotiation.findOne({ _id: id, userId });
  
  if (!negotiation) {
    const { response, statusCode } = errorResponse(
      "Negotiation session not found",
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  // Generate evaluation if employer response exists
  if (counterofferData.employerResponse) {
    counterofferData.evaluation = evaluateCounteroffer(
      counterofferData,
      negotiation.context,
      negotiation.offerDetails.initialOffer
    );
  }

  negotiation.counteroffers.push(counterofferData);
  await negotiation.save();

  const { response, statusCode } = successResponse(
    "Counteroffer added successfully",
    { counteroffer: counterofferData }
  );
  return sendResponse(res, response, statusCode);
});

/**
 * POST /api/negotiations/:id/conversation - Log a negotiation conversation
 */
export const addConversation = asyncHandler(async (req, res) => {
  const auth = req.auth();
  const userId = auth?.userId || auth?.payload?.sub;
  const { id } = req.params;
  const conversationData = req.body;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const negotiation = await Negotiation.findOne({ _id: id, userId });
  
  if (!negotiation) {
    const { response, statusCode } = errorResponse(
      "Negotiation session not found",
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  negotiation.conversations.push({
    ...conversationData,
    date: conversationData.date || new Date()
  });
  await negotiation.save();

  const { response, statusCode } = successResponse(
    "Conversation logged successfully",
    { conversation: conversationData }
  );
  return sendResponse(res, response, statusCode);
});

/**
 * GET /api/negotiations/progression - Get salary progression history
 */
export const getSalaryProgression = asyncHandler(async (req, res) => {
  const auth = req.auth();
  const userId = auth?.userId || auth?.payload?.sub;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  // Get all completed negotiations
  const negotiations = await Negotiation.find({
    userId,
    'outcome.status': 'accepted'
  }).sort({ 'outcome.decisionDate': 1 });

  // Extract salary history
  const progression = negotiations.map(neg => ({
    date: neg.outcome.decisionDate,
    company: neg.offerDetails.company,
    position: neg.offerDetails.position,
    baseSalary: neg.outcome.finalOffer?.baseSalary,
    totalComp: neg.outcome.finalOffer?.totalCompensation,
    improvement: neg.outcome.improvementFromInitial
  }));

  // Calculate growth metrics
  const metrics = {
    totalNegotiations: negotiations.length,
    averageIncrease: negotiations.reduce((sum, neg) => 
      sum + (neg.outcome.improvementFromInitial?.salaryIncreasePercent || 0), 0
    ) / negotiations.length || 0,
    totalCompGrowth: progression.length > 1 ? 
      ((progression[progression.length - 1].totalComp - progression[0].totalComp) / progression[0].totalComp * 100).toFixed(2) : 0
  };

  const { response, statusCode } = successResponse(
    "Salary progression retrieved successfully",
    { 
      progression,
      metrics 
    }
  );
  return sendResponse(res, response, statusCode);
});

/**
 * GET /api/negotiations/analytics - Get negotiation analytics
 */
export const getNegotiationAnalytics = asyncHandler(async (req, res) => {
  const auth = req.auth();
  const userId = auth?.userId || auth?.payload?.sub;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const negotiations = await Negotiation.find({ userId });

  const analytics = {
    total: negotiations.length,
    byStatus: {
      inProgress: negotiations.filter(n => n.outcome.status === 'in_progress').length,
      accepted: negotiations.filter(n => n.outcome.status === 'accepted').length,
      declined: negotiations.filter(n => n.outcome.status === 'declined').length,
      withdrawn: negotiations.filter(n => n.outcome.status === 'withdrawn').length,
      expired: negotiations.filter(n => n.outcome.status === 'expired').length
    },
    successRate: negotiations.length > 0 ? 
      (negotiations.filter(n => n.outcome.status === 'accepted').length / negotiations.length * 100).toFixed(1) : 0,
    averageConfidence: negotiations.length > 0 ?
      (negotiations.reduce((sum, n) => sum + n.confidenceLevel, 0) / negotiations.length).toFixed(1) : 0,
    averageSatisfaction: negotiations.filter(n => n.outcome.overallSatisfaction).length > 0 ?
      (negotiations.filter(n => n.outcome.overallSatisfaction).reduce((sum, n) => 
        sum + n.outcome.overallSatisfaction, 0) / 
        negotiations.filter(n => n.outcome.overallSatisfaction).length).toFixed(1) : 0,
    totalSalaryGained: negotiations
      .filter(n => n.outcome.status === 'accepted')
      .reduce((sum, n) => sum + (n.outcome.improvementFromInitial?.salaryIncrease || 0), 0)
  };

  const { response, statusCode } = successResponse(
    "Negotiation analytics retrieved successfully",
    { analytics }
  );
  return sendResponse(res, response, statusCode);
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate personalized talking points based on context
 */
async function generateTalkingPoints(offerDetails, context, user) {
  const points = [];

  // Experience-based points
  if (context.yearsExperience) {
    points.push({
      category: 'experience',
      point: `${context.yearsExperience} years of relevant experience in the field`,
      supporting_data: `Industry standard for this experience level is $${offerDetails.marketData?.medianSalary?.toLocaleString() || 'N/A'}`,
      confidence: 'high'
    });
  }

  // Skills-based points
  if (context.uniqueSkills?.length > 0) {
    context.uniqueSkills.forEach(skill => {
      points.push({
        category: 'unique_value',
        point: `Specialized expertise in ${skill}`,
        supporting_data: 'This skill is in high demand and commands premium compensation',
        confidence: 'high'
      });
    });
  }

  // Achievements
  if (context.achievements?.length > 0) {
    context.achievements.forEach(achievement => {
      points.push({
        category: 'achievements',
        point: achievement,
        supporting_data: 'Demonstrated track record of delivering results',
        confidence: 'high'
      });
    });
  }

  // Certifications
  if (context.certifications?.length > 0) {
    context.certifications.forEach(cert => {
      points.push({
        category: 'skills',
        point: `Certified in ${cert}`,
        supporting_data: 'Professional certification demonstrates commitment and expertise',
        confidence: 'high'
      });
    });
  }

  // Market data
  if (offerDetails.marketData?.medianSalary && offerDetails.initialOffer?.baseSalary) {
    const gap = offerDetails.marketData.medianSalary - offerDetails.initialOffer.baseSalary;
    if (gap > 0) {
      points.push({
        category: 'market_data',
        point: `Market research shows median salary is $${offerDetails.marketData.medianSalary.toLocaleString()}`,
        supporting_data: `Current offer is ${((gap / offerDetails.marketData.medianSalary) * 100).toFixed(1)}% below market median`,
        confidence: 'high'
      });
    }
  }

  // Competing offers
  if (context.competingOffers?.length > 0) {
    context.competingOffers.forEach(offer => {
      points.push({
        category: 'competing_offers',
        point: `Comparable offer from ${offer.company}`,
        supporting_data: `Total compensation package of $${offer.totalComp?.toLocaleString()}`,
        confidence: 'high'
      });
    });
  }

  // Cost of living
  if (offerDetails.location) {
    points.push({
      category: 'cost_of_living',
      point: `Position requires relocation to ${offerDetails.location}`,
      supporting_data: 'Compensation should account for cost of living in this area',
      confidence: 'medium'
    });
  }

  return points;
}

/**
 * Generate negotiation scenario scripts
 */
function generateNegotiationScenarios(offerDetails, context) {
  const scenarios = [];

  // Initial counter
  scenarios.push({
    type: 'initial_counter',
    title: 'Initial Counter Offer',
    script: `Thank you for the offer. I'm excited about the opportunity to join ${offerDetails.company} as ${offerDetails.position}. After reviewing the compensation package and researching market rates, I was hoping we could discuss the base salary. Based on my ${context.yearsExperience || 'X'} years of experience and the market data I've reviewed, I was expecting a base salary in the range of $${context.desiredSalary?.toLocaleString() || 'X'}. Is there flexibility in the current offer?`,
    whenToUse: 'Use this as your first response after receiving the initial offer',
    expectedResponse: 'They may ask for your justification or offer a slight increase',
    nextSteps: 'Be prepared to share your talking points and market research'
  });

  // Total comp focus
  scenarios.push({
    type: 'total_comp_focus',
    title: 'Focus on Total Compensation',
    script: `I appreciate the base salary offer. I'd like to discuss the total compensation package, including equity, bonuses, and benefits. Can we explore options to increase the overall package value? For instance, would there be flexibility in signing bonus or equity allocation if base salary has constraints?`,
    whenToUse: 'When base salary is less flexible but other components might be',
    expectedResponse: 'Discussion of alternative compensation components',
    nextSteps: 'Prioritize which components matter most to you'
  });

  // Competing offer
  if (context.competingOffers?.length > 0) {
    scenarios.push({
      type: 'competing_offer',
      title: 'Discuss Competing Offer',
      script: `I want to be transparent with you - I have another offer with a total compensation package of $${context.competingOffers[0].totalComp?.toLocaleString()}. However, I'm genuinely more interested in ${offerDetails.company} because of [specific reason]. Is there any way we can get closer to that competitive offer?`,
      whenToUse: 'When you have a strong competing offer and want to use it as leverage',
      expectedResponse: 'They may ask for details or match/beat the offer',
      nextSteps: 'Be honest and ready to show competing offer letter if requested'
    });
  }

  // Benefits negotiation
  scenarios.push({
    type: 'benefits_negotiation',
    title: 'Negotiate Benefits and Perks',
    script: `I appreciate the compensation package. Could we discuss additional benefits such as remote work flexibility, professional development budget, additional vacation time, or flexible work hours? These are important factors for my work-life balance and professional growth.`,
    whenToUse: 'When salary is fixed but you want to improve overall package value',
    expectedResponse: 'Discussion of non-monetary benefits',
    nextSteps: 'Be specific about which benefits matter most to you'
  });

  // Timeline extension
  scenarios.push({
    type: 'timeline_extension',
    title: 'Request More Time',
    script: `Thank you for the offer. I'm very interested in this opportunity and want to give it the thorough consideration it deserves. Would it be possible to extend the decision deadline by [X days/week]? This would allow me to [complete other interviews/discuss with family/review details thoroughly].`,
    whenToUse: 'When you need more time to make a decision or wait for other offers',
    expectedResponse: 'Usually granted if reasonable timeframe',
    nextSteps: 'Use the time productively - don\'t just wait'
  });

  // Final decision
  scenarios.push({
    type: 'final_decision',
    title: 'Accept or Walk Away',
    script: `I've given this careful thought. [IF ACCEPTING:] I'm excited to accept the offer and join the team. When would you like me to start? [IF DECLINING:] After careful consideration, I've decided to pursue another opportunity that's a better fit for my career goals at this time. I appreciate your time and the offer, and I hope we can work together in the future.`,
    whenToUse: 'When you\'ve reached your final decision',
    expectedResponse: 'Acceptance: Next steps for onboarding. Decline: They may make final counter',
    nextSteps: 'Be clear and confident in your decision'
  });

  return scenarios;
}

/**
 * Generate timing strategy
 */
function generateTimingStrategy(offerDetails) {
  const receivedDate = offerDetails.receivedDate ? new Date(offerDetails.receivedDate) : new Date();
  const deadlineDate = offerDetails.deadlineDate ? new Date(offerDetails.deadlineDate) : null;
  
  return {
    recommendedApproach: 'Wait 24-48 hours before responding to show consideration, but respond within 3-5 days to show enthusiasm',
    bestTimeToNegotiate: 'After receiving written offer but before accepting. They have made their decision but terms are not final.',
    responseDeadline: deadlineDate,
    followUpSchedule: [
      {
        date: new Date(receivedDate.getTime() + 24 * 60 * 60 * 1000),
        action: 'Acknowledge receipt and express interest',
        completed: false
      },
      {
        date: new Date(receivedDate.getTime() + 3 * 24 * 60 * 60 * 1000),
        action: 'Present counteroffer with talking points',
        completed: false
      },
      {
        date: new Date(receivedDate.getTime() + 7 * 24 * 60 * 60 * 1000),
        action: 'Follow up if no response received',
        completed: false
      }
    ],
    milestones: [
      {
        name: 'Initial offer received',
        targetDate: receivedDate,
        status: 'completed'
      },
      {
        name: 'Counteroffer submitted',
        targetDate: new Date(receivedDate.getTime() + 3 * 24 * 60 * 60 * 1000),
        status: 'pending'
      },
      {
        name: 'Final decision',
        targetDate: deadlineDate,
        status: 'pending'
      }
    ]
  };
}

/**
 * Generate preparation checklist
 */
function generatePreparationChecklist() {
  return [
    // Research
    { item: 'Research market salary data for role and location', category: 'research', isCompleted: false },
    { item: 'Review company financial health and compensation philosophy', category: 'research', isCompleted: false },
    { item: 'Understand industry salary trends', category: 'research', isCompleted: false },
    { item: 'Check Glassdoor, Levels.fyi, and Payscale for data', category: 'research', isCompleted: false },
    
    // Documentation
    { item: 'List all achievements with quantifiable results', category: 'documentation', isCompleted: false },
    { item: 'Document unique skills and certifications', category: 'documentation', isCompleted: false },
    { item: 'Prepare references who can speak to your value', category: 'documentation', isCompleted: false },
    { item: 'Gather competing offer letters (if applicable)', category: 'documentation', isCompleted: false },
    
    // Practice
    { item: 'Practice negotiation conversation with friend/mentor', category: 'practice', isCompleted: false },
    { item: 'Rehearse talking points out loud', category: 'practice', isCompleted: false },
    { item: 'Prepare responses to common pushback', category: 'practice', isCompleted: false },
    { item: 'Practice saying your desired number confidently', category: 'practice', isCompleted: false },
    
    // Mindset
    { item: 'Remember: negotiation is expected and respected', category: 'mindset', isCompleted: false },
    { item: 'Frame it as finding mutual value, not confrontation', category: 'mindset', isCompleted: false },
    { item: 'Be prepared to walk away if offer doesn\'t meet minimum', category: 'mindset', isCompleted: false },
    { item: 'Stay positive and professional throughout', category: 'mindset', isCompleted: false },
    
    // Logistics
    { item: 'Choose appropriate communication channel (usually email first)', category: 'logistics', isCompleted: false },
    { item: 'Schedule call if in-person negotiation preferred', category: 'logistics', isCompleted: false },
    { item: 'Prepare quiet space for negotiation call', category: 'logistics', isCompleted: false },
    { item: 'Have notes and data readily accessible', category: 'logistics', isCompleted: false }
  ];
}

/**
 * Generate confidence building exercises
 */
function generateConfidenceExercises() {
  return [
    {
      exercise: 'Power Posing',
      description: 'Stand in a power pose (hands on hips, chest out) for 2 minutes before your negotiation call. Research shows this increases confidence and reduces stress.',
      isCompleted: false
    },
    {
      exercise: 'Visualization',
      description: 'Close your eyes and visualize a successful negotiation conversation. Imagine yourself speaking confidently, the positive response from the employer, and celebrating the outcome.',
      isCompleted: false
    },
    {
      exercise: 'Positive Self-Talk',
      description: 'Write down 5 reasons why you deserve this compensation. Read them aloud daily leading up to the negotiation. Examples: "I have unique skills that solve their problems" or "I bring X years of proven results".',
      isCompleted: false
    },
    {
      exercise: 'Practice Your Number',
      description: 'Stand in front of a mirror and practice saying your desired salary number out loud 10 times. Say it with confidence, without apologizing or hedging. Get comfortable with the number.',
      isCompleted: false
    },
    {
      exercise: 'Rejection Rehearsal',
      description: 'Practice responding to "no" or pushback. Have a friend challenge your requests so you can practice staying calm and pivoting to alternative solutions.',
      isCompleted: false
    },
    {
      exercise: 'Success Inventory',
      description: 'Create a detailed list of your professional achievements, major projects, and positive feedback. Review this before negotiations to remind yourself of your value.',
      isCompleted: false
    },
    {
      exercise: 'Calm Breathing',
      description: 'Practice box breathing (4 counts in, 4 hold, 4 out, 4 hold) for 5 minutes. Use this technique right before your negotiation to reduce anxiety.',
      isCompleted: false
    },
    {
      exercise: 'Mentor Consultation',
      description: 'Talk to someone who has successfully negotiated offers. Hearing their stories and advice will normalize the process and boost your confidence.',
      isCompleted: false
    }
  ];
}

/**
 * Generate compensation framework
 */
function generateCompensationFramework(context) {
  // Determine priorities based on context
  const priorityOrder = [];
  
  if (context.desiredSalary) {
    priorityOrder.push({ component: 'Base Salary', importance: 10 });
  }
  
  priorityOrder.push(
    { component: 'Performance Bonus', importance: 8 },
    { component: 'Equity/Stock Options', importance: 7 },
    { component: 'Health Insurance', importance: 9 },
    { component: 'Retirement Match', importance: 7 },
    { component: 'PTO/Vacation', importance: 8 },
    { component: 'Remote Work Flexibility', importance: 8 },
    { component: 'Professional Development Budget', importance: 6 },
    { component: 'Signing Bonus', importance: 5 }
  );

  return {
    baseSalaryWeight: 0.4,
    bonusWeight: 0.2,
    equityWeight: 0.2,
    benefitsWeight: 0.2,
    priorityOrder,
    nonNegotiables: context.nonNegotiables || []
  };
}

/**
 * Evaluate counteroffer
 */
function evaluateCounteroffer(counteroffer, context, initialOffer) {
  const requested = {
    salary: counteroffer.requestedSalary || 0,
    bonus: counteroffer.requestedBonus || 0,
    equity: counteroffer.requestedEquity || 0
  };

  const response = counteroffer.employerResponse;
  const received = {
    salary: response.revisedSalary || initialOffer.baseSalary,
    bonus: response.revisedBonus || initialOffer.performanceBonus,
    equity: response.revisedEquity || initialOffer.equityValue
  };

  const meetsMinimum = context.minimumAcceptable ? 
    received.salary >= context.minimumAcceptable : true;

  const gapFromDesired = context.desiredSalary ? 
    context.desiredSalary - received.salary : 0;

  const strengthsOfOffer = [];
  const weaknessesOfOffer = [];

  if (received.salary > initialOffer.baseSalary) {
    strengthsOfOffer.push(`Base salary increased by $${(received.salary - initialOffer.baseSalary).toLocaleString()}`);
  } else {
    weaknessesOfOffer.push('No increase in base salary');
  }

  if (received.bonus > (initialOffer.performanceBonus || 0)) {
    strengthsOfOffer.push('Improved bonus structure');
  }

  if (response.additionalPerks) {
    strengthsOfOffer.push(`Additional perks: ${response.additionalPerks}`);
  }

  if (gapFromDesired > 0) {
    weaknessesOfOffer.push(`Still $${gapFromDesired.toLocaleString()} below desired salary`);
  }

  const shouldAccept = meetsMinimum && gapFromDesired <= (context.desiredSalary * 0.1); // Within 10% of desired

  const recommendation = shouldAccept ?
    'This offer meets your minimum requirements and is close to your desired salary. Consider accepting or making one final counter for the remaining gap.' :
    'This offer does not meet your stated minimum or is significantly below your desired compensation. Consider whether you\'re willing to compromise or if you should decline.';

  return {
    meetsMinimum,
    gapFromDesired,
    strengthsOfOffer,
    weaknessesOfOffer,
    recommendation,
    shouldAccept
  };
}
