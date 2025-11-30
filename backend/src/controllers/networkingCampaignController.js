import { NetworkingCampaign } from '../models/NetworkingCampaign.js';
import { Job } from '../models/Job.js';
import { 
  successResponse, 
  errorResponse, 
  sendResponse, 
  ERROR_CODES, 
  validationErrorResponse
} from '../utils/responseFormat.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// ============================================================================
// UC-094: Networking Campaign Management
// ============================================================================

/**
 * @desc    Create a new networking campaign
 * @route   POST /api/networking-campaigns
 * @access  Protected
 */
export const createCampaign = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  
  if (!userId) {
    const { response, statusCode } = errorResponse(
      'Unauthorized: missing authentication credentials',
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const {
    name,
    description,
    campaignType,
    targetCompanies,
    targetIndustries,
    targetRoles,
    goals,
    startDate,
    endDate,
    strategy,
    notes
  } = req.body;

  // Validate required fields
  if (!name) {
    const { response, statusCode } = validationErrorResponse(
      'Campaign name is required',
      [{ field: 'name', message: 'Please provide a campaign name' }]
    );
    return sendResponse(res, response, statusCode);
  }

  const campaign = await NetworkingCampaign.create({
    userId,
    name,
    description,
    campaignType: campaignType || 'Custom',
    targetCompanies: targetCompanies || [],
    targetIndustries: targetIndustries || [],
    targetRoles: targetRoles || [],
    goals: goals || {},
    startDate: startDate || new Date(),
    endDate,
    strategy: strategy || {},
    notes,
    status: 'Planning'
  });

  const { response, statusCode } = successResponse(
    'Networking campaign created successfully',
    { campaign },
    201
  );
  return sendResponse(res, response, statusCode);
});

/**
 * @desc    Get all campaigns for user
 * @route   GET /api/networking-campaigns
 * @access  Protected
 */
export const getCampaigns = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  
  if (!userId) {
    const { response, statusCode } = errorResponse(
      'Unauthorized: missing authentication credentials',
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const { status, campaignType, page = 1, limit = 10 } = req.query;
  
  const filter = { userId };
  if (status && status !== 'all') filter.status = status;
  if (campaignType && campaignType !== 'all') filter.campaignType = campaignType;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const [campaigns, total] = await Promise.all([
    NetworkingCampaign.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    NetworkingCampaign.countDocuments(filter)
  ]);

  // Calculate summary stats
  const allCampaigns = await NetworkingCampaign.find({ userId });
  const summary = {
    total: allCampaigns.length,
    active: allCampaigns.filter(c => c.status === 'Active').length,
    completed: allCampaigns.filter(c => c.status === 'Completed').length,
    totalOutreach: allCampaigns.reduce((sum, c) => sum + (c.metrics?.totalOutreach || 0), 0),
    totalResponses: allCampaigns.reduce((sum, c) => sum + (c.metrics?.responses || 0), 0),
    totalMeetings: allCampaigns.reduce((sum, c) => sum + (c.metrics?.meetings || 0), 0)
  };

  const payload = {
    campaigns,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total
    },
    summary
  };

  const { response, statusCode } = successResponse('Campaigns retrieved successfully', payload);
  return sendResponse(res, response, statusCode);
});

/**
 * @desc    Get single campaign by ID
 * @route   GET /api/networking-campaigns/:id
 * @access  Protected
 */
export const getCampaign = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { id } = req.params;
  
  if (!userId) {
    const { response, statusCode } = errorResponse(
      'Unauthorized: missing authentication credentials',
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const campaign = await NetworkingCampaign.findOne({ _id: id, userId })
    .populate('linkedJobs', 'title company status');
  
  if (!campaign) {
    const { response, statusCode } = errorResponse(
      'Campaign not found',
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  const { response, statusCode } = successResponse(
    'Campaign retrieved successfully',
    { campaign }
  );
  return sendResponse(res, response, statusCode);
});

/**
 * @desc    Update campaign
 * @route   PUT /api/networking-campaigns/:id
 * @access  Protected
 */
export const updateCampaign = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { id } = req.params;
  
  if (!userId) {
    const { response, statusCode } = errorResponse(
      'Unauthorized: missing authentication credentials',
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const campaign = await NetworkingCampaign.findOne({ _id: id, userId });
  
  if (!campaign) {
    const { response, statusCode } = errorResponse(
      'Campaign not found',
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  const allowedUpdates = [
    'name', 'description', 'campaignType', 'targetCompanies', 
    'targetIndustries', 'targetRoles', 'goals', 'startDate', 
    'endDate', 'status', 'strategy', 'notes'
  ];

  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      campaign[field] = req.body[field];
    }
  });

  await campaign.save();

  const { response, statusCode } = successResponse(
    'Campaign updated successfully',
    { campaign }
  );
  return sendResponse(res, response, statusCode);
});

/**
 * @desc    Delete campaign
 * @route   DELETE /api/networking-campaigns/:id
 * @access  Protected
 */
export const deleteCampaign = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { id } = req.params;
  
  if (!userId) {
    const { response, statusCode } = errorResponse(
      'Unauthorized: missing authentication credentials',
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const campaign = await NetworkingCampaign.findOneAndDelete({ _id: id, userId });
  
  if (!campaign) {
    const { response, statusCode } = errorResponse(
      'Campaign not found',
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  const { response, statusCode } = successResponse('Campaign deleted successfully');
  return sendResponse(res, response, statusCode);
});

// ============================================================================
// Outreach Management
// ============================================================================

/**
 * @desc    Add outreach to campaign
 * @route   POST /api/networking-campaigns/:id/outreach
 * @access  Protected
 */
export const addOutreach = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { id } = req.params;
  
  if (!userId) {
    const { response, statusCode } = errorResponse(
      'Unauthorized: missing authentication credentials',
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const campaign = await NetworkingCampaign.findOne({ _id: id, userId });
  
  if (!campaign) {
    const { response, statusCode } = errorResponse(
      'Campaign not found',
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  const {
    contactId,
    contactName,
    contactCompany,
    contactRole,
    method,
    messageTemplate,
    status,
    notes,
    linkedJobId
  } = req.body;

  if (!contactName) {
    const { response, statusCode } = validationErrorResponse(
      'Contact name is required',
      [{ field: 'contactName', message: 'Please provide a contact name' }]
    );
    return sendResponse(res, response, statusCode);
  }

  const outreach = {
    contactId,
    contactName,
    contactCompany,
    contactRole,
    method: method || 'LinkedIn',
    messageTemplate: messageTemplate || 'Control',
    status: status || 'Pending',
    notes,
    linkedJobId,
    sentAt: status === 'Sent' ? new Date() : undefined
  };

  campaign.outreaches.push(outreach);
  await campaign.save();

  const { response, statusCode } = successResponse(
    'Outreach added successfully',
    { 
      outreach: campaign.outreaches[campaign.outreaches.length - 1],
      metrics: campaign.metrics
    },
    201
  );
  return sendResponse(res, response, statusCode);
});

/**
 * @desc    Update outreach status
 * @route   PUT /api/networking-campaigns/:id/outreach/:outreachId
 * @access  Protected
 */
export const updateOutreach = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { id, outreachId } = req.params;
  
  if (!userId) {
    const { response, statusCode } = errorResponse(
      'Unauthorized: missing authentication credentials',
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const campaign = await NetworkingCampaign.findOne({ _id: id, userId });
  
  if (!campaign) {
    const { response, statusCode } = errorResponse(
      'Campaign not found',
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  const outreach = campaign.outreaches.id(outreachId);
  
  if (!outreach) {
    const { response, statusCode } = errorResponse(
      'Outreach not found',
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  const { status, outcome, notes, respondedAt } = req.body;

  if (status) {
    outreach.status = status;
    if (status === 'Sent' && !outreach.sentAt) {
      outreach.sentAt = new Date();
    }
    if (['Responded', 'Meeting Scheduled', 'Connected'].includes(status) && !outreach.respondedAt) {
      outreach.respondedAt = respondedAt || new Date();
    }
  }
  if (outcome) outreach.outcome = outcome;
  if (notes !== undefined) outreach.notes = notes;

  // Update A/B test metrics if applicable
  if (outreach.messageTemplate && outreach.messageTemplate !== 'Control') {
    const abTest = campaign.abTests.find(t => t.status === 'Active');
    if (abTest) {
      const template = outreach.messageTemplate === 'A' ? abTest.templateA : abTest.templateB;
      if (status === 'Sent') template.sentCount++;
      if (['Responded', 'Meeting Scheduled', 'Connected'].includes(status)) template.responseCount++;
      if (status === 'Meeting Scheduled') template.meetingCount++;
    }
  }

  await campaign.save();

  const { response, statusCode } = successResponse(
    'Outreach updated successfully',
    { 
      outreach,
      metrics: campaign.metrics
    }
  );
  return sendResponse(res, response, statusCode);
});

/**
 * @desc    Delete outreach
 * @route   DELETE /api/networking-campaigns/:id/outreach/:outreachId
 * @access  Protected
 */
export const deleteOutreach = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { id, outreachId } = req.params;
  
  if (!userId) {
    const { response, statusCode } = errorResponse(
      'Unauthorized: missing authentication credentials',
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const campaign = await NetworkingCampaign.findOne({ _id: id, userId });
  
  if (!campaign) {
    const { response, statusCode } = errorResponse(
      'Campaign not found',
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  campaign.outreaches.pull(outreachId);
  await campaign.save();

  const { response, statusCode } = successResponse(
    'Outreach deleted successfully',
    { metrics: campaign.metrics }
  );
  return sendResponse(res, response, statusCode);
});

// ============================================================================
// A/B Testing
// ============================================================================

/**
 * @desc    Create A/B test for campaign
 * @route   POST /api/networking-campaigns/:id/ab-test
 * @access  Protected
 */
export const createABTest = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { id } = req.params;
  
  if (!userId) {
    const { response, statusCode } = errorResponse(
      'Unauthorized: missing authentication credentials',
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const campaign = await NetworkingCampaign.findOne({ _id: id, userId });
  
  if (!campaign) {
    const { response, statusCode } = errorResponse(
      'Campaign not found',
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  const { name, templateA, templateB } = req.body;

  if (!name || !templateA?.message || !templateB?.message) {
    const { response, statusCode } = validationErrorResponse(
      'A/B test name and both templates are required',
      [{ field: 'templates', message: 'Please provide name and both template messages' }]
    );
    return sendResponse(res, response, statusCode);
  }

  // Pause any existing active tests
  campaign.abTests.forEach(test => {
    if (test.status === 'Active') test.status = 'Paused';
  });

  const abTest = {
    name,
    templateA: {
      subject: templateA.subject || '',
      message: templateA.message,
      sentCount: 0,
      responseCount: 0,
      meetingCount: 0
    },
    templateB: {
      subject: templateB.subject || '',
      message: templateB.message,
      sentCount: 0,
      responseCount: 0,
      meetingCount: 0
    },
    status: 'Active',
    startedAt: new Date()
  };

  campaign.abTests.push(abTest);
  await campaign.save();

  const { response, statusCode } = successResponse(
    'A/B test created successfully',
    { abTest: campaign.abTests[campaign.abTests.length - 1] },
    201
  );
  return sendResponse(res, response, statusCode);
});

/**
 * @desc    Complete A/B test and determine winner
 * @route   PUT /api/networking-campaigns/:id/ab-test/:testId/complete
 * @access  Protected
 */
export const completeABTest = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { id, testId } = req.params;
  
  if (!userId) {
    const { response, statusCode } = errorResponse(
      'Unauthorized: missing authentication credentials',
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const campaign = await NetworkingCampaign.findOne({ _id: id, userId });
  
  if (!campaign) {
    const { response, statusCode } = errorResponse(
      'Campaign not found',
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  const abTest = campaign.abTests.id(testId);
  
  if (!abTest) {
    const { response, statusCode } = errorResponse(
      'A/B test not found',
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  // Calculate response rates
  const rateA = abTest.templateA.sentCount > 0 
    ? abTest.templateA.responseCount / abTest.templateA.sentCount 
    : 0;
  const rateB = abTest.templateB.sentCount > 0 
    ? abTest.templateB.responseCount / abTest.templateB.sentCount 
    : 0;

  let winner = 'Tie';
  if (rateA > rateB + 0.05) winner = 'A';
  else if (rateB > rateA + 0.05) winner = 'B';

  abTest.status = 'Completed';
  abTest.winner = winner;
  abTest.completedAt = new Date();

  await campaign.save();

  const { response, statusCode } = successResponse(
    'A/B test completed',
    { 
      abTest,
      analysis: {
        templateAResponseRate: Math.round(rateA * 100),
        templateBResponseRate: Math.round(rateB * 100),
        winner,
        recommendation: winner === 'Tie' 
          ? 'Both templates performed similarly. Consider testing different approaches.'
          : `Template ${winner} performed better. Consider using it as your primary outreach message.`
      }
    }
  );
  return sendResponse(res, response, statusCode);
});

// ============================================================================
// Campaign Analytics
// ============================================================================

/**
 * @desc    Get campaign performance analytics
 * @route   GET /api/networking-campaigns/:id/analytics
 * @access  Protected
 */
export const getCampaignAnalytics = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { id } = req.params;
  
  if (!userId) {
    const { response, statusCode } = errorResponse(
      'Unauthorized: missing authentication credentials',
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const campaign = await NetworkingCampaign.findOne({ _id: id, userId });
  
  if (!campaign) {
    const { response, statusCode } = errorResponse(
      'Campaign not found',
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  // Goal progress
  const goalProgress = {
    outreach: {
      current: campaign.metrics.totalOutreach,
      target: campaign.goals.totalOutreach,
      percentage: campaign.goals.totalOutreach > 0 
        ? Math.min(100, Math.round((campaign.metrics.totalOutreach / campaign.goals.totalOutreach) * 100))
        : 0
    },
    responseRate: {
      current: campaign.metrics.responseRate,
      target: campaign.goals.responseRate,
      percentage: campaign.goals.responseRate > 0
        ? Math.min(100, Math.round((campaign.metrics.responseRate / campaign.goals.responseRate) * 100))
        : 0
    },
    meetings: {
      current: campaign.metrics.meetings,
      target: campaign.goals.meetingsScheduled,
      percentage: campaign.goals.meetingsScheduled > 0
        ? Math.min(100, Math.round((campaign.metrics.meetings / campaign.goals.meetingsScheduled) * 100))
        : 0
    },
    connections: {
      current: campaign.metrics.connections,
      target: campaign.goals.connectionsGained,
      percentage: campaign.goals.connectionsGained > 0
        ? Math.min(100, Math.round((campaign.metrics.connections / campaign.goals.connectionsGained) * 100))
        : 0
    }
  };

  // Outreach by method breakdown
  const byMethod = {};
  campaign.outreaches.forEach(o => {
    if (!byMethod[o.method]) {
      byMethod[o.method] = { total: 0, responded: 0, connected: 0 };
    }
    byMethod[o.method].total++;
    if (['Responded', 'Meeting Scheduled', 'Connected'].includes(o.status)) {
      byMethod[o.method].responded++;
    }
    if (o.status === 'Connected') {
      byMethod[o.method].connected++;
    }
  });

  // Outreach by company breakdown
  const byCompany = {};
  campaign.outreaches.forEach(o => {
    const company = o.contactCompany || 'Unknown';
    if (!byCompany[company]) {
      byCompany[company] = { total: 0, responded: 0 };
    }
    byCompany[company].total++;
    if (['Responded', 'Meeting Scheduled', 'Connected'].includes(o.status)) {
      byCompany[company].responded++;
    }
  });

  // Timeline data
  const timelineData = [];
  const sortedOutreaches = [...campaign.outreaches].sort((a, b) => 
    new Date(a.createdAt) - new Date(b.createdAt)
  );
  
  let cumulative = { sent: 0, responses: 0 };
  sortedOutreaches.forEach(o => {
    cumulative.sent++;
    if (['Responded', 'Meeting Scheduled', 'Connected'].includes(o.status)) {
      cumulative.responses++;
    }
    timelineData.push({
      date: o.createdAt,
      cumulativeSent: cumulative.sent,
      cumulativeResponses: cumulative.responses,
      responseRate: cumulative.sent > 0 ? Math.round((cumulative.responses / cumulative.sent) * 100) : 0
    });
  });

  // A/B test results
  const abTestResults = campaign.abTests.map(test => ({
    name: test.name,
    status: test.status,
    winner: test.winner,
    templateA: {
      ...test.templateA,
      responseRate: test.templateA.sentCount > 0 
        ? Math.round((test.templateA.responseCount / test.templateA.sentCount) * 100)
        : 0
    },
    templateB: {
      ...test.templateB,
      responseRate: test.templateB.sentCount > 0 
        ? Math.round((test.templateB.responseCount / test.templateB.sentCount) * 100)
        : 0
    }
  }));

  const { response, statusCode } = successResponse(
    'Campaign analytics retrieved',
    {
      campaign: {
        _id: campaign._id,
        name: campaign.name,
        status: campaign.status,
        metrics: campaign.metrics,
        healthScore: campaign.healthScore,
        progress: campaign.progress,
        daysRemaining: campaign.daysRemaining
      },
      goalProgress,
      byMethod,
      byCompany: Object.entries(byCompany)
        .map(([company, data]) => ({ company, ...data }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10),
      timeline: timelineData,
      abTestResults
    }
  );
  return sendResponse(res, response, statusCode);
});

/**
 * @desc    Get aggregate analytics across all campaigns
 * @route   GET /api/networking-campaigns/analytics/overview
 * @access  Protected
 */
export const getOverviewAnalytics = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  
  if (!userId) {
    const { response, statusCode } = errorResponse(
      'Unauthorized: missing authentication credentials',
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const campaigns = await NetworkingCampaign.find({ userId });

  // Aggregate metrics
  const totals = campaigns.reduce((acc, c) => ({
    campaigns: acc.campaigns + 1,
    activeCampaigns: acc.activeCampaigns + (c.status === 'Active' ? 1 : 0),
    totalOutreach: acc.totalOutreach + (c.metrics?.totalOutreach || 0),
    totalResponses: acc.totalResponses + (c.metrics?.responses || 0),
    totalMeetings: acc.totalMeetings + (c.metrics?.meetings || 0),
    totalConnections: acc.totalConnections + (c.metrics?.connections || 0)
  }), {
    campaigns: 0,
    activeCampaigns: 0,
    totalOutreach: 0,
    totalResponses: 0,
    totalMeetings: 0,
    totalConnections: 0
  });

  totals.overallResponseRate = totals.totalOutreach > 0 
    ? Math.round((totals.totalResponses / totals.totalOutreach) * 100)
    : 0;

  // Campaign performance ranking
  const campaignPerformance = campaigns
    .filter(c => c.metrics?.totalOutreach > 0)
    .map(c => ({
      _id: c._id,
      name: c.name,
      status: c.status,
      responseRate: c.metrics.responseRate,
      healthScore: c.healthScore
    }))
    .sort((a, b) => b.responseRate - a.responseRate);

  // Best performing methods across all campaigns
  const methodStats = {};
  campaigns.forEach(c => {
    c.outreaches.forEach(o => {
      if (!methodStats[o.method]) {
        methodStats[o.method] = { total: 0, responses: 0 };
      }
      methodStats[o.method].total++;
      if (['Responded', 'Meeting Scheduled', 'Connected'].includes(o.status)) {
        methodStats[o.method].responses++;
      }
    });
  });

  const methodPerformance = Object.entries(methodStats)
    .map(([method, data]) => ({
      method,
      total: data.total,
      responses: data.responses,
      responseRate: data.total > 0 ? Math.round((data.responses / data.total) * 100) : 0
    }))
    .sort((a, b) => b.responseRate - a.responseRate);

  const { response, statusCode } = successResponse(
    'Overview analytics retrieved',
    {
      totals,
      campaignPerformance: campaignPerformance.slice(0, 5),
      methodPerformance,
      recommendations: generateRecommendations(totals, methodPerformance)
    }
  );
  return sendResponse(res, response, statusCode);
});

/**
 * @desc    Link job to campaign
 * @route   POST /api/networking-campaigns/:id/link-job
 * @access  Protected
 */
export const linkJobToCampaign = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { id } = req.params;
  const { jobId } = req.body;
  
  if (!userId) {
    const { response, statusCode } = errorResponse(
      'Unauthorized: missing authentication credentials',
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const campaign = await NetworkingCampaign.findOne({ _id: id, userId });
  
  if (!campaign) {
    const { response, statusCode } = errorResponse(
      'Campaign not found',
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  // Verify job exists and belongs to user
  const job = await Job.findOne({ _id: jobId, userId });
  
  if (!job) {
    const { response, statusCode } = errorResponse(
      'Job not found',
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  if (!campaign.linkedJobs.includes(jobId)) {
    campaign.linkedJobs.push(jobId);
    await campaign.save();
  }

  const { response, statusCode } = successResponse(
    'Job linked to campaign',
    { linkedJobs: campaign.linkedJobs }
  );
  return sendResponse(res, response, statusCode);
});

// Helper function to generate recommendations
function generateRecommendations(totals, methodPerformance) {
  const recommendations = [];

  if (totals.totalOutreach === 0) {
    recommendations.push({
      type: 'action',
      priority: 'high',
      message: 'Start your first networking campaign to build relationships systematically.'
    });
    return recommendations;
  }

  if (totals.overallResponseRate < 20) {
    recommendations.push({
      type: 'improvement',
      priority: 'high',
      message: 'Your overall response rate is below 20%. Consider personalizing your outreach messages more.'
    });
  }

  if (methodPerformance.length > 0) {
    const bestMethod = methodPerformance[0];
    if (bestMethod.responseRate > 30) {
      recommendations.push({
        type: 'insight',
        priority: 'medium',
        message: `${bestMethod.method} is your most effective outreach method with ${bestMethod.responseRate}% response rate. Focus more efforts there.`
      });
    }
  }

  if (totals.totalMeetings < totals.totalResponses * 0.3) {
    recommendations.push({
      type: 'improvement',
      priority: 'medium',
      message: 'Try to convert more responses into meetings. Consider following up with a specific ask for a call.'
    });
  }

  if (totals.activeCampaigns === 0 && totals.campaigns > 0) {
    recommendations.push({
      type: 'action',
      priority: 'medium',
      message: 'You have no active campaigns. Consider starting a new campaign or reactivating an existing one.'
    });
  }

  return recommendations;
}
