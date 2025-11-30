import { User } from "../models/User.js";
import { successResponse, errorResponse, sendResponse, ERROR_CODES, validationErrorResponse } from "../utils/responseFormat.js";
import { asyncHandler } from "../middleware/errorHandler.js";

// ============================================================================
// UC-089: LinkedIn Profile Integration & Networking Guidance
// ============================================================================

// POST /api/linkedin/save-profile - Save LinkedIn profile URL
export const saveLinkedInProfile = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { linkedinUrl } = req.body;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  // Validate LinkedIn URL format
  if (linkedinUrl && !/^(https?:\/\/)?(www\.)?linkedin\.com\/(in|company)\/[\w-]+\/?$/.test(linkedinUrl)) {
    const { response, statusCode } = validationErrorResponse(
      "Invalid LinkedIn URL format",
      [{ field: 'linkedinUrl', message: 'Please enter a valid LinkedIn profile URL (e.g., https://linkedin.com/in/yourname)', value: linkedinUrl }]
    );
    return sendResponse(res, response, statusCode);
  }

  const user = await User.findOneAndUpdate(
    { auth0Id: userId },
    { 
      $set: { 
        linkedin: linkedinUrl,
        'linkedinSettings.lastSynced': new Date()
      }
    },
    { new: true, runValidators: true }
  );

  if (!user) {
    const { response, statusCode } = errorResponse("User not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  const { response, statusCode } = successResponse("LinkedIn profile saved successfully", {
    linkedin: user.linkedin,
    linkedinSettings: user.linkedinSettings
  });
  return sendResponse(res, response, statusCode);
});

// GET /api/linkedin/profile - Get current LinkedIn profile info
export const getLinkedInProfile = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const user = await User.findOne({ auth0Id: userId });

  if (!user) {
    const { response, statusCode } = errorResponse("User not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  const { response, statusCode } = successResponse("LinkedIn profile retrieved", {
    linkedin: user.linkedin,
    linkedinSettings: user.linkedinSettings || {},
    name: user.name,
    headline: user.headline,
    picture: user.picture
  });
  return sendResponse(res, response, statusCode);
});

// POST /api/linkedin/networking-templates - Generate networking message templates
export const generateNetworkingTemplates = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { templateType, targetRole, targetCompany, context } = req.body;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const user = await User.findOne({ auth0Id: userId });
  if (!user) {
    const { response, statusCode } = errorResponse("User not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  // Generate templates based on type
  const templates = generateTemplatesByType(templateType, {
    userName: user.name,
    userHeadline: user.headline || 'Professional',
    targetRole,
    targetCompany,
    context,
    userIndustry: user.industry,
    userExperience: user.experienceLevel
  });

  const { response, statusCode } = successResponse("Networking templates generated", {
    templates,
    templateType,
    generatedAt: new Date()
  });
  return sendResponse(res, response, statusCode);
});

// GET /api/linkedin/optimization-suggestions - Get profile optimization tips
export const getOptimizationSuggestions = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const user = await User.findOne({ auth0Id: userId });
  if (!user) {
    const { response, statusCode } = errorResponse("User not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  // Analyze profile and generate suggestions
  const suggestions = generateProfileSuggestions(user);

  const { response, statusCode } = successResponse("Optimization suggestions generated", {
    suggestions,
    profileCompleteness: calculateProfileCompleteness(user),
    generatedAt: new Date()
  });
  return sendResponse(res, response, statusCode);
});

// GET /api/linkedin/content-strategies - Get content sharing strategies
export const getContentStrategies = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const user = await User.findOne({ auth0Id: userId });
  if (!user) {
    const { response, statusCode } = errorResponse("User not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  const strategies = generateContentStrategies(user);

  const { response, statusCode } = successResponse("Content strategies generated", {
    strategies,
    industry: user.industry,
    experienceLevel: user.experienceLevel
  });
  return sendResponse(res, response, statusCode);
});

// POST /api/linkedin/campaigns - Create a networking campaign
export const createNetworkingCampaign = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { name, targetCompanies, targetRoles, goals, duration, notes } = req.body;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  // Validate required fields
  if (!name) {
    const { response, statusCode } = validationErrorResponse(
      "Campaign name is required",
      [{ field: 'name', message: 'Please provide a campaign name', value: null }]
    );
    return sendResponse(res, response, statusCode);
  }

  const campaign = {
    name,
    targetCompanies: targetCompanies || [],
    targetRoles: targetRoles || [],
    goals: goals || '',
    duration: duration || 30, // days
    notes: notes || '',
    status: 'active',
    metrics: {
      connectionsSent: 0,
      connectionsAccepted: 0,
      messagesSent: 0,
      responses: 0,
      meetings: 0
    },
    startedAt: new Date()
  };

  const user = await User.findOneAndUpdate(
    { auth0Id: userId },
    { $push: { 'linkedinSettings.networkingCampaigns': campaign } },
    { new: true, runValidators: true }
  );

  if (!user) {
    const { response, statusCode } = errorResponse("User not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  const { response, statusCode } = successResponse("Networking campaign created", {
    campaign: user.linkedinSettings.networkingCampaigns.slice(-1)[0],
    totalCampaigns: user.linkedinSettings.networkingCampaigns.length
  }, 201);
  return sendResponse(res, response, statusCode);
});

// GET /api/linkedin/campaigns - Get all networking campaigns
export const getNetworkingCampaigns = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const user = await User.findOne({ auth0Id: userId });
  if (!user) {
    const { response, statusCode } = errorResponse("User not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  const campaigns = user.linkedinSettings?.networkingCampaigns || [];

  const { response, statusCode } = successResponse("Networking campaigns retrieved", {
    campaigns,
    totalActive: campaigns.filter(c => c.status === 'active').length,
    totalCompleted: campaigns.filter(c => c.status === 'completed').length
  });
  return sendResponse(res, response, statusCode);
});

// PUT /api/linkedin/campaigns/:campaignId - Update campaign metrics
export const updateCampaignMetrics = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { campaignId } = req.params;
  const { metrics, status, notes } = req.body;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const user = await User.findOne({ auth0Id: userId });
  if (!user) {
    const { response, statusCode } = errorResponse("User not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  const campaignIndex = user.linkedinSettings?.networkingCampaigns?.findIndex(
    c => c._id.toString() === campaignId
  );

  if (campaignIndex === -1) {
    const { response, statusCode } = errorResponse("Campaign not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  // Update campaign
  if (metrics) {
    Object.assign(user.linkedinSettings.networkingCampaigns[campaignIndex].metrics, metrics);
  }
  if (status) {
    user.linkedinSettings.networkingCampaigns[campaignIndex].status = status;
    if (status === 'completed') {
      user.linkedinSettings.networkingCampaigns[campaignIndex].completedAt = new Date();
    }
  }
  if (notes !== undefined) {
    user.linkedinSettings.networkingCampaigns[campaignIndex].notes = notes;
  }

  await user.save();

  const { response, statusCode } = successResponse("Campaign updated", {
    campaign: user.linkedinSettings.networkingCampaigns[campaignIndex]
  });
  return sendResponse(res, response, statusCode);
});

// DELETE /api/linkedin/campaigns/:campaignId - Delete a campaign
export const deleteCampaign = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { campaignId } = req.params;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const user = await User.findOneAndUpdate(
    { auth0Id: userId },
    { $pull: { 'linkedinSettings.networkingCampaigns': { _id: campaignId } } },
    { new: true }
  );

  if (!user) {
    const { response, statusCode } = errorResponse("User not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  const { response, statusCode } = successResponse("Campaign deleted successfully");
  return sendResponse(res, response, statusCode);
});

// ============================================================================
// Helper Functions - Template Generation
// ============================================================================

function generateTemplatesByType(type, context) {
  const { userName, userHeadline, targetRole, targetCompany, userIndustry } = context;
  const firstName = userName?.split(' ')[0] || 'there';

  const templates = {
    connectionRequest: [
      {
        title: "Professional Introduction",
        message: `Hi! I came across your profile and was impressed by your work in ${targetRole || 'your field'}. As a ${userHeadline}, I'm always looking to connect with professionals who share similar interests. I'd love to add you to my network and perhaps exchange insights about ${userIndustry || 'our industry'}. Looking forward to connecting!`,
        bestFor: "General networking with professionals in your field"
      },
      {
        title: "Company Interest",
        message: `Hello! I've been following ${targetCompany || 'your company'}'s work and find it fascinating. As someone passionate about ${userIndustry || 'this industry'}, I'd love to connect and learn more about your experience there. Would you be open to a brief conversation?`,
        bestFor: "Connecting with employees at target companies"
      },
      {
        title: "Alumni/Shared Background",
        message: `Hi! I noticed we share some common ground in our professional backgrounds. I'm currently working as a ${userHeadline} and would love to connect with fellow professionals in the space. Always great to expand the network with like-minded individuals!`,
        bestFor: "Connecting with alumni or those with similar backgrounds"
      }
    ],
    followUp: [
      {
        title: "Post-Connection Thank You",
        message: `Thank you for accepting my connection request! I'm excited to be part of your network. I'm particularly interested in ${targetRole || 'your expertise'}. Would you be open to a 15-minute virtual coffee chat sometime? I'd love to hear about your journey.`,
        bestFor: "Right after someone accepts your connection"
      },
      {
        title: "After Event/Webinar",
        message: `Hi! It was great attending ${context.context || 'the recent event'} where I learned about your insights. I wanted to follow up and continue the conversation. Your perspective on [topic] really resonated with me. Would you have time for a quick call?`,
        bestFor: "Following up after meeting at an event"
      },
      {
        title: "Gentle Reminder",
        message: `Hi! I reached out a couple of weeks ago about [topic]. I understand you're busy, but I wanted to gently follow up. I'm still very interested in learning from your experience in ${targetRole || 'your field'}. Let me know if you'd be open to a brief chat at your convenience.`,
        bestFor: "When following up after no initial response"
      }
    ],
    informationalInterview: [
      {
        title: "Career Advice Request",
        message: `Hi ${firstName}! I've been following your career journey and I'm impressed by your path to ${targetRole || 'your current role'}. As someone looking to grow in ${userIndustry || 'this field'}, I would greatly value your insights. Would you have 20 minutes for a brief informational interview? I promise to be respectful of your time.`,
        bestFor: "Requesting career guidance from senior professionals"
      },
      {
        title: "Industry Insights",
        message: `Hello! I'm researching career paths in ${userIndustry || 'our industry'} and your experience at ${targetCompany || 'your company'} caught my attention. I'd love to learn more about the skills and experiences that have been most valuable in your journey. Would you be open to a quick chat?`,
        bestFor: "Learning about industry-specific insights"
      }
    ],
    referral: [
      {
        title: "Job Referral Request",
        message: `Hi! I hope this message finds you well. I noticed that ${targetCompany || 'your company'} has an opening for ${targetRole || 'a position'} that aligns perfectly with my background. As we've connected before, I wanted to reach out to see if you might be willing to refer me for this role or point me to the right person to speak with. I'd be happy to share my resume and discuss how I could contribute to the team.`,
        bestFor: "Asking for job referrals from connections"
      },
      {
        title: "Soft Referral Ask",
        message: `Hello! I've been exploring opportunities at ${targetCompany || 'your company'} and thought of reaching out to you. I'm not sure if you're able to help directly, but I'd love any advice on how to best position myself for roles there. Any insights you could share would be incredibly valuable.`,
        bestFor: "More casual referral request"
      }
    ],
    thankYou: [
      {
        title: "Post-Interview Thank You",
        message: `Dear [Name], Thank you so much for taking the time to speak with me today about the ${targetRole || 'opportunity'} at ${targetCompany || 'your company'}. I really enjoyed learning more about the role and the team. Our conversation reinforced my enthusiasm for the position, particularly [specific thing discussed]. I look forward to hearing from you about next steps.`,
        bestFor: "After job interviews"
      },
      {
        title: "Advice Thank You",
        message: `Thank you so much for sharing your insights and advice with me! Your perspective on ${context.context || 'the topic we discussed'} was incredibly helpful. I'm going to implement your suggestions about [specific advice]. I really appreciate you taking the time to help me grow professionally.`,
        bestFor: "After receiving career advice"
      }
    ]
  };

  return templates[type] || templates.connectionRequest;
}

function generateProfileSuggestions(user) {
  const suggestions = [];
  const priorities = { high: [], medium: [], low: [] };

  // Check headline
  if (!user.headline || user.headline.length < 30) {
    priorities.high.push({
      category: "Headline",
      title: "Optimize Your Headline",
      description: "Your headline is prime real estate. Instead of just your job title, include your value proposition.",
      example: `${user.name} | ${user.industry || 'Industry'} Professional | Driving [Result] through [Skill]`,
      impact: "Headlines appear in search results and are crucial for first impressions"
    });
  }

  // Check bio/summary
  if (!user.bio || user.bio.length < 100) {
    priorities.high.push({
      category: "About Section",
      title: "Write a Compelling Summary",
      description: "Your About section should tell your professional story in 3-5 paragraphs.",
      tips: [
        "Start with a hook - what drives you professionally?",
        "Highlight 3-5 key achievements with metrics",
        "Include your career goals and what you're looking for",
        "End with a call to action (how to reach you)"
      ],
      impact: "A strong summary increases profile views by up to 40%"
    });
  }

  // Check skills
  if (!user.skills || user.skills.length < 5) {
    priorities.medium.push({
      category: "Skills",
      title: "Add More Skills",
      description: "LinkedIn allows up to 50 skills. Add relevant skills to improve searchability.",
      recommendation: "Add at least 10-15 skills relevant to your target roles",
      tip: "Order matters - your top 3 skills are shown by default"
    });
  }

  // Check education
  if (!user.education || user.education.length === 0) {
    priorities.medium.push({
      category: "Education",
      title: "Add Education Details",
      description: "Include relevant coursework, projects, and achievements from your education.",
      tip: "Alumni networks are powerful - having your school listed helps connections find you"
    });
  }

  // Check employment
  if (!user.employment || user.employment.length === 0) {
    priorities.high.push({
      category: "Experience",
      title: "Add Work Experience",
      description: "Detail your professional experience with bullet points focusing on achievements.",
      tips: [
        "Use action verbs to start each bullet point",
        "Include quantifiable results (numbers, percentages)",
        "Add media like presentations or projects",
        "Get recommendations from colleagues"
      ]
    });
  }

  // Check profile picture
  if (!user.picture) {
    priorities.high.push({
      category: "Photo",
      title: "Add a Professional Photo",
      description: "Profiles with photos get 14x more views than those without.",
      tips: [
        "Use a high-quality headshot",
        "Dress professionally",
        "Ensure good lighting and a clean background",
        "Smile naturally - approachability matters"
      ]
    });
  }

  // Check projects
  if (!user.projects || user.projects.length < 2) {
    priorities.low.push({
      category: "Projects",
      title: "Showcase Your Projects",
      description: "Add projects to demonstrate hands-on experience and initiative.",
      tip: "Include links to GitHub repos, live demos, or case studies"
    });
  }

  // Check certifications
  if (!user.certifications || user.certifications.length === 0) {
    priorities.low.push({
      category: "Certifications",
      title: "Add Certifications",
      description: "Relevant certifications boost credibility and searchability.",
      suggestion: `Consider certifications in ${user.industry || 'your industry'} to stand out`
    });
  }

  // Check LinkedIn URL
  if (!user.linkedin) {
    priorities.high.push({
      category: "LinkedIn URL",
      title: "Link Your LinkedIn Profile",
      description: "Connect your LinkedIn URL to enable full integration features.",
      tip: "Customize your LinkedIn URL for a cleaner look (linkedin.com/in/yourname)"
    });
  }

  return {
    highPriority: priorities.high,
    mediumPriority: priorities.medium,
    lowPriority: priorities.low,
    totalSuggestions: priorities.high.length + priorities.medium.length + priorities.low.length
  };
}

function calculateProfileCompleteness(user) {
  const weights = {
    name: 5,
    headline: 10,
    bio: 15,
    picture: 10,
    linkedin: 5,
    employment: 20,
    education: 10,
    skills: 10,
    projects: 10,
    certifications: 5
  };

  let score = 0;
  let maxScore = Object.values(weights).reduce((a, b) => a + b, 0);

  if (user.name) score += weights.name;
  if (user.headline && user.headline.length >= 30) score += weights.headline;
  if (user.bio && user.bio.length >= 100) score += weights.bio;
  if (user.picture) score += weights.picture;
  if (user.linkedin) score += weights.linkedin;
  if (user.employment && user.employment.length > 0) score += weights.employment;
  if (user.education && user.education.length > 0) score += weights.education;
  if (user.skills && user.skills.length >= 5) score += weights.skills;
  if (user.projects && user.projects.length >= 2) score += weights.projects;
  if (user.certifications && user.certifications.length > 0) score += weights.certifications;

  return {
    score: Math.round((score / maxScore) * 100),
    level: score >= 80 ? 'All-Star' : score >= 60 ? 'Expert' : score >= 40 ? 'Advanced' : 'Beginner'
  };
}

function generateContentStrategies(user) {
  const industry = user.industry || 'General';
  const experienceLevel = user.experienceLevel || 'Mid';

  const strategies = {
    postingFrequency: {
      recommendation: experienceLevel === 'Entry' ? '2-3 posts per week' : '3-5 posts per week',
      bestTimes: ['Tuesday 8-10 AM', 'Wednesday 8-10 AM', 'Thursday 8-10 AM'],
      description: "Consistency matters more than volume. Start with what's sustainable."
    },
    contentTypes: [
      {
        type: "Industry Insights",
        description: "Share your take on industry news, trends, or developments",
        example: "I noticed [trend] in ${industry}. Here's what I think it means for professionals...",
        engagement: "High - positions you as a thought leader"
      },
      {
        type: "Career Journey Posts",
        description: "Share your experiences, lessons learned, and career milestones",
        example: "3 years ago, I made a career pivot that changed everything. Here's what I learned...",
        engagement: "Very High - personal stories resonate deeply"
      },
      {
        type: "How-To Content",
        description: "Share practical tips and tutorials in your area of expertise",
        example: "5 steps I use to [accomplish something] in ${industry}...",
        engagement: "High - provides immediate value"
      },
      {
        type: "Celebrating Others",
        description: "Highlight team wins, colleague achievements, or industry peers",
        example: "Shoutout to [person] for [achievement]. Here's why it matters...",
        engagement: "Medium-High - builds goodwill and expands reach"
      },
      {
        type: "Behind the Scenes",
        description: "Share what your day-to-day work looks like",
        example: "Here's what a typical day looks like as a ${user.headline || 'professional'}...",
        engagement: "Medium - humanizes your profile"
      }
    ],
    engagementTips: [
      "Comment on others' posts before expecting engagement on yours",
      "Ask questions at the end of your posts to encourage discussion",
      "Respond to every comment within the first hour",
      "Use 3-5 relevant hashtags per post",
      "Tag people and companies when relevant (but don't overdo it)",
      "Use line breaks and emojis to make posts scannable"
    ],
    hashtagStrategy: {
      recommended: getHashtagsForIndustry(industry),
      tip: "Mix popular hashtags (100K+ followers) with niche ones for best reach"
    },
    contentCalendarTemplate: {
      monday: "Industry news or trends",
      tuesday: "How-to or educational content",
      wednesday: "Personal story or career insight",
      thursday: "Engage heavily with others' content",
      friday: "Casual or celebratory post"
    }
  };

  return strategies;
}

function getHashtagsForIndustry(industry) {
  const hashtags = {
    Technology: ['#Tech', '#Innovation', '#SoftwareDevelopment', '#AI', '#TechCareers', '#Programming', '#DigitalTransformation'],
    Healthcare: ['#Healthcare', '#MedicalInnovation', '#HealthTech', '#PatientCare', '#HealthcareLeadership', '#Wellness'],
    Finance: ['#Finance', '#FinTech', '#Investment', '#Banking', '#FinancialServices', '#WealthManagement'],
    Education: ['#Education', '#EdTech', '#Learning', '#Teaching', '#HigherEducation', '#ProfessionalDevelopment'],
    Construction: ['#Construction', '#Infrastructure', '#Engineering', '#ProjectManagement', '#BuildingIndustry'],
    'Real Estate': ['#RealEstate', '#Property', '#CommercialRealEstate', '#Housing', '#RealEstateInvesting']
  };

  return hashtags[industry] || ['#Career', '#ProfessionalDevelopment', '#Networking', '#JobSearch', '#Leadership'];
}
