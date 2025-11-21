import { CompanyResearch } from "../models/CompanyResearch.js";
import { Interview } from "../models/Interview.js";
import { Job } from "../models/Job.js";
import { successResponse, errorResponse, sendResponse, ERROR_CODES } from "../utils/responseFormat.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const getUserId = (req) => {
  const auth = typeof req.auth === 'function' ? req.auth() : req.auth;
  return auth?.userId || auth?.payload?.sub;
};

// POST /api/company-research/generate - Generate company research for an interview
export const generateCompanyResearch = asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const { jobId, interviewId, companyName } = req.body;

  if (!userId) {
    const { response, statusCode } = errorResponse("Unauthorized", 401, ERROR_CODES.UNAUTHORIZED);
    return sendResponse(res, response, statusCode);
  }

  if (!jobId || !companyName) {
    const { response, statusCode } = errorResponse("Job ID and company name are required", 400, ERROR_CODES.VALIDATION_ERROR);
    return sendResponse(res, response, statusCode);
  }

  // Verify job belongs to user
  const job = await Job.findOne({ _id: jobId, userId });
  if (!job) {
    const { response, statusCode } = errorResponse("Job not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  // Verify interview if provided
  let interviewDoc = null;
  if (interviewId) {
    interviewDoc = await Interview.findOne({ _id: interviewId, userId });
    if (!interviewDoc) {
      const { response, statusCode } = errorResponse("Interview not found", 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }
  }

  // Check if research already exists
  let research = await CompanyResearch.findOne({ userId, jobId });

  if (research) {
    // Update existing research
    research.lastUpdated = new Date();
    research.interviewId = interviewId || research.interviewId;
  } else {
    // Create new research document
    research = new CompanyResearch({
      userId,
      jobId,
      interviewId,
      companyName,
      profile: {
        overview: `${companyName} is a company in the ${job.industry || 'technology'} industry.`,
        industry: job.industry || 'Technology',
        location: job.location || 'Multiple locations',
        website: job.url || '',
      },
      completeness: 10,
    });
  }

  // Generate company profile
  await generateCompanyProfile(research, job);

  // Generate leadership research
  await generateLeadershipInfo(research, companyName);

  // Generate competitive analysis
  await generateCompetitiveAnalysis(research, job);

  // Generate recent news
  await generateRecentNews(research, companyName);

  // Generate talking points and questions
  await generateTalkingPoints(research, job);
  await generateIntelligentQuestions(research, job);

  // Populate potential interviewers from interview data if available
  if (interviewDoc?.interviewer?.name) {
    research.interviewers = [
      {
        name: interviewDoc.interviewer.name,
        title: interviewDoc.interviewer.title || '',
        email: interviewDoc.interviewer.email || '',
        notes: interviewDoc.interviewer.notes || '',
      },
    ];
  }

  // Calculate completeness
  research.completeness = calculateCompleteness(research);

  await research.save();

  const { response, statusCode } = successResponse("Company research generated successfully", { research });
  return sendResponse(res, response, statusCode);
});

// GET /api/company-research/interview/:interviewId - Get research for an interview
export const getResearchByInterview = asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const { interviewId } = req.params;

  if (!userId) {
    const { response, statusCode } = errorResponse("Unauthorized", 401, ERROR_CODES.UNAUTHORIZED);
    return sendResponse(res, response, statusCode);
  }

  const research = await CompanyResearch.findOne({ userId, interviewId })
    .populate('jobId', 'title company status')
    .populate('interviewId', 'date type stage');

  if (!research) {
    console.log(`[company-research] 404 research not found`, { userId, interviewId });
    const { response, statusCode } = errorResponse("Company research not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  console.log(`[company-research] 200 research found`, { id: research._id.toString() });
  const { response, statusCode } = successResponse("Company research retrieved successfully", { research });
  return sendResponse(res, response, statusCode);
});

// GET /api/company-research/job/:jobId - Get research for a job
export const getResearchByJob = asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const { jobId } = req.params;

  if (!userId) {
    const { response, statusCode } = errorResponse("Unauthorized", 401, ERROR_CODES.UNAUTHORIZED);
    return sendResponse(res, response, statusCode);
  }

  const research = await CompanyResearch.findOne({ userId, jobId })
    .populate('jobId', 'title company status')
    .populate('interviewId', 'date type stage');

  if (!research) {
    const { response, statusCode } = errorResponse("Company research not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  const { response, statusCode } = successResponse("Company research retrieved successfully", { research });
  return sendResponse(res, response, statusCode);
});

// GET /api/company-research - Get all research for user
export const getAllResearch = asyncHandler(async (req, res) => {
  const userId = getUserId(req);

  if (!userId) {
    const { response, statusCode } = errorResponse("Unauthorized", 401, ERROR_CODES.UNAUTHORIZED);
    return sendResponse(res, response, statusCode);
  }

  const research = await CompanyResearch.find({ userId })
    .populate('jobId', 'title company status')
    .populate('interviewId', 'date type stage')
    .sort({ lastUpdated: -1 });

  const { response, statusCode } = successResponse("Company research retrieved successfully", { research, total: research.length });
  return sendResponse(res, response, statusCode);
});

// PUT /api/company-research/:id - Update research manually
export const updateResearch = asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const { id } = req.params;
  const updates = req.body;

  if (!userId) {
    const { response, statusCode } = errorResponse("Unauthorized", 401, ERROR_CODES.UNAUTHORIZED);
    return sendResponse(res, response, statusCode);
  }

  const research = await CompanyResearch.findOne({ _id: id, userId });

  if (!research) {
    const { response, statusCode } = errorResponse("Company research not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  // Update fields
  Object.keys(updates).forEach(key => {
    if (key !== 'userId' && key !== 'jobId' && key !== '_id') {
      research[key] = updates[key];
    }
  });

  research.lastUpdated = new Date();
  research.dataSource = 'hybrid';

  await research.save();

  const { response, statusCode } = successResponse("Company research updated successfully", { research });
  return sendResponse(res, response, statusCode);
});

// POST /api/company-research/:id/export - Export research summary
export const exportResearch = asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const { id } = req.params;
  const { format = 'pdf' } = req.body;

  if (!userId) {
    const { response, statusCode } = errorResponse("Unauthorized", 401, ERROR_CODES.UNAUTHORIZED);
    return sendResponse(res, response, statusCode);
  }

  const research = await CompanyResearch.findOne({ _id: id, userId })
    .populate('jobId', 'title company status')
    .populate('interviewId', 'date type stage');

  if (!research) {
    const { response, statusCode } = errorResponse("Company research not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  // Mark as exported
  research.exported = true;
  research.exportedAt = new Date();
  await research.save();

  // Generate export content
  const exportData = generateExportData(research, format);

  const { response, statusCode } = successResponse("Research exported successfully", { exportData, format });
  return sendResponse(res, response, statusCode);
});

// DELETE /api/company-research/:id - Delete research
export const deleteResearch = asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const { id } = req.params;

  if (!userId) {
    const { response, statusCode } = errorResponse("Unauthorized", 401, ERROR_CODES.UNAUTHORIZED);
    return sendResponse(res, response, statusCode);
  }

  const research = await CompanyResearch.findOneAndDelete({ _id: id, userId });

  if (!research) {
    const { response, statusCode } = errorResponse("Company research not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  const { response, statusCode } = successResponse("Company research deleted successfully", { id });
  return sendResponse(res, response, statusCode);
});

// Helper Functions

async function generateCompanyProfile(research, job) {
  const industry = job.industry || 'Technology';
  const location = job.location || 'Multiple locations';
  const workMode = job.workMode || 'Hybrid';
  
  research.profile = {
    overview: `${research.companyName} is a leading company in the ${industry.toLowerCase()} sector. They are currently hiring for ${job.title} positions, indicating growth and expansion in key areas.`,
    history: `${research.companyName} has established itself as a key player in the ${industry.toLowerCase()} industry through continuous innovation and strategic growth. The company has evolved over the years to meet changing market demands while maintaining its core values and commitment to excellence.`,
    industry: industry,
    workMode: workMode,
    location: location,
    mission: `${research.companyName}'s mission is to deliver innovative solutions and create value for their customers and stakeholders.`,
    values: ['Innovation', 'Excellence', 'Collaboration', 'Integrity', 'Customer Focus'],
    culture: `${research.companyName} fosters a collaborative and innovative work environment that values employee growth and work-life balance.`,
    founded: 'Established industry player',
    headquarters: location,
    website: job.url || '',
  };
}

async function generateLeadershipInfo(research, companyName) {
  // This would integrate with external APIs like LinkedIn, Crunchbase in production
  research.leadership = [
    {
      name: 'Executive Leadership',
      title: 'Chief Executive Officer',
      bio: `Visionary leader at ${companyName} with extensive industry experience and a track record of driving innovation and growth. Focus on strategic initiatives and company culture.`,
    },
    {
      name: 'Leadership Team',
      title: 'Chief Technology Officer',
      bio: `Technology leader overseeing product development and engineering teams at ${companyName}. Expert in emerging technologies and digital transformation.`,
    },
    {
      name: 'Operations Leadership',
      title: 'Chief Operating Officer',
      bio: `Operations expert managing day-to-day business activities and strategic partnerships at ${companyName}. Focus on operational excellence and scalability.`,
    },
  ];
}

async function generateCompetitiveAnalysis(research, job) {
  research.competitive = {
    industry: job.industry || 'Technology',
    marketPosition: `${research.companyName} is positioned as a competitive player in the ${job.industry || 'technology'} market.`,
    competitors: ['Competitor 1', 'Competitor 2', 'Competitor 3'],
    differentiators: [
      'Strong technical capabilities',
      'Innovative product offerings',
      'Excellent company culture',
      'Competitive compensation packages',
    ],
    challenges: [
      'Market competition',
      'Talent acquisition',
      'Rapid technology changes',
    ],
    opportunities: [
      'Market expansion',
      'New product development',
      'Strategic partnerships',
    ],
  };
}

async function generateRecentNews(research, companyName) {
  // This would integrate with news APIs like NewsAPI, Google News in production
  const currentDate = new Date();
  const lastMonth = new Date(currentDate.setMonth(currentDate.getMonth() - 1));
  const twoMonthsAgo = new Date(currentDate.setMonth(currentDate.getMonth() - 1));
  
  research.news = [
    {
      title: `${companyName} Announces Strategic Growth Initiative`,
      summary: `${companyName} has announced strategic initiatives to expand market presence and drive innovation. The company is investing in new technologies and talent acquisition to support future growth.`,
      date: new Date(),
      source: 'Company Press Release',
      category: 'expansion',
    },
    {
      title: `${companyName} Secures Funding for Innovation`,
      summary: 'Recent funding announcements indicate strong investor confidence and support for expansion plans.',
      date: lastMonth,
      source: 'Industry News',
      category: 'funding',
    },
    {
      title: `${companyName} Launches New Product Features`,
      summary: 'Company unveils innovative product developments that enhance customer value and competitive positioning.',
      date: twoMonthsAgo,
      source: 'Tech News',
      category: 'product',
    },
  ];
}

async function generateTalkingPoints(research, job) {
  research.talkingPoints = [
    {
      topic: 'Company Growth and Vision',
      points: [
        `Expanding team with ${job.title} role indicates company growth`,
        'Strong market position in the industry',
        'Commitment to innovation and excellence',
      ],
      questions: [
        'What are the company\'s growth plans for the next 2-3 years?',
        'How does this role contribute to the company\'s strategic objectives?',
      ],
    },
    {
      topic: 'Role and Team',
      points: [
        `${job.title} role aligned with my skills and experience`,
        'Opportunity to make significant impact',
        'Collaborative team environment',
      ],
      questions: [
        'Can you describe the team structure and dynamics?',
        'What are the key challenges this role will tackle in the first 6 months?',
      ],
    },
    {
      topic: 'Technology and Innovation',
      points: [
        'Modern tech stack and tools',
        'Focus on innovation and continuous improvement',
        'Investment in employee development',
      ],
      questions: [
        'What technologies does the team currently use?',
        'How does the company approach innovation and experimentation?',
      ],
    },
  ];
}

async function generateIntelligentQuestions(research, job) {
  research.intelligentQuestions = [
    {
      question: `What does success look like for someone in the ${job.title} role after 6 months?`,
      category: 'role',
      reasoning: 'Shows interest in performance expectations and accountability',
    },
    {
      question: 'How would you describe the company culture and what makes it unique?',
      category: 'culture',
      reasoning: 'Demonstrates interest in cultural fit and team dynamics',
    },
    {
      question: 'What are the biggest challenges the company/team is facing right now?',
      category: 'company',
      reasoning: 'Shows strategic thinking and problem-solving mindset',
    },
    {
      question: 'How does the company support professional development and career growth?',
      category: 'growth',
      reasoning: 'Indicates long-term commitment and desire for continuous learning',
    },
    {
      question: 'What is the company\'s approach to work-life balance and remote work?',
      category: 'culture',
      reasoning: 'Relevant for modern work arrangements and personal priorities',
    },
    {
      question: `How does this ${job.title} role contribute to the company's strategic objectives?`,
      category: 'strategy',
      reasoning: 'Demonstrates understanding of bigger picture and strategic alignment',
    },
  ];
}

function calculateCompleteness(research) {
  let score = 0;
  let total = 0;

  // Profile (20 points)
  total += 20;
  if (research.profile?.overview) score += 4;
  if (research.profile?.history) score += 4;
  if (research.profile?.mission) score += 4;
  if (research.profile?.values?.length > 0) score += 4;
  if (research.profile?.culture) score += 4;

  // Leadership (15 points)
  total += 15;
  if (research.leadership?.length > 0) score += 15;

  // Competitive (20 points)
  total += 20;
  if (research.competitive?.marketPosition) score += 5;
  if (research.competitive?.competitors?.length > 0) score += 5;
  if (research.competitive?.differentiators?.length > 0) score += 5;
  if (research.competitive?.opportunities?.length > 0) score += 5;

  // News (15 points)
  total += 15;
  if (research.news?.length > 0) score += 15;

  // Talking Points (15 points)
  total += 15;
  if (research.talkingPoints?.length > 0) score += 15;

  // Questions (15 points)
  total += 15;
  if (research.intelligentQuestions?.length > 0) score += 15;

  return Math.round((score / total) * 100);
}

function generateExportData(research, format) {
  const data = {
    title: `Company Research: ${research.companyName}`,
    generatedAt: research.generatedAt,
    completeness: research.completeness,
    sections: {
      profile: research.profile,
      leadership: research.leadership,
      interviewers: research.interviewers,
      competitive: research.competitive,
      news: research.news,
      talkingPoints: research.talkingPoints,
      questions: research.intelligentQuestions,
    },
  };

  if (format === 'json') {
    return data;
  }

  if (format === 'markdown') {
    return generateMarkdownExport(data);
  }

  if (format === 'pdf') {
    return {
      content: data,
      instructions: 'PDF generation would be handled by frontend or separate service',
    };
  }

  return data;
}

function generateMarkdownExport(data) {
  let markdown = `# ${data.title}\n\n`;
  markdown += `**Generated:** ${new Date(data.generatedAt).toLocaleDateString()}\n`;
  markdown += `**Completeness:** ${data.completeness}%\n\n`;

  markdown += `## Company Profile\n\n`;
  markdown += `${data.sections.profile?.overview || 'N/A'}\n\n`;
  
  if (data.sections.profile?.history) {
    markdown += `### History\n\n`;
    markdown += `${data.sections.profile.history}\n\n`;
  }
  
  markdown += `**Mission:** ${data.sections.profile?.mission || 'N/A'}\n\n`;
  
  if (data.sections.profile?.values?.length > 0) {
    markdown += `**Values:**\n`;
    data.sections.profile.values.forEach(v => markdown += `- ${v}\n`);
    markdown += `\n`;
  }

  markdown += `## Leadership Team\n\n`;
  if (data.sections.leadership?.length > 0) {
    data.sections.leadership.forEach(leader => {
      markdown += `### ${leader.name} - ${leader.title}\n`;
      markdown += `${leader.bio || ''}\n\n`;
    });
  }

  if (data.sections.interviewers?.length > 0) {
    markdown += `## Potential Interviewers\n\n`;
    data.sections.interviewers.forEach(iv => {
      markdown += `- **${iv.name}**${iv.title ? `, ${iv.title}` : ''}${iv.email ? ` • ${iv.email}` : ''}\n`;
      if (iv.notes) markdown += `  - ${iv.notes}\n`;
    });
    markdown += `\n`;
  }

  markdown += `## Competitive Analysis\n\n`;
  markdown += `**Market Position:** ${data.sections.competitive?.marketPosition || 'N/A'}\n\n`;
  if (data.sections.competitive?.differentiators?.length > 0) {
    markdown += `**Key Differentiators:**\n`;
    data.sections.competitive.differentiators.forEach(d => markdown += `- ${d}\n`);
    markdown += `\n`;
  }
  if (data.sections.competitive?.competitors?.length > 0) {
    markdown += `**Competitors:**\n`;
    data.sections.competitive.competitors.forEach(c => markdown += `- ${c}\n`);
    markdown += `\n`;
  }
  if (data.sections.competitive?.challenges?.length > 0) {
    markdown += `**Challenges:**\n`;
    data.sections.competitive.challenges.forEach(ch => markdown += `- ${ch}\n`);
    markdown += `\n`;
  }
  if (data.sections.competitive?.opportunities?.length > 0) {
    markdown += `**Opportunities:**\n`;
    data.sections.competitive.opportunities.forEach(o => markdown += `- ${o}\n`);
    markdown += `\n`;
  }

  markdown += `## Talking Points\n\n`;
  if (data.sections.talkingPoints?.length > 0) {
    data.sections.talkingPoints.forEach(tp => {
      markdown += `### ${tp.topic}\n`;
      tp.points?.forEach(p => markdown += `- ${p}\n`);
      markdown += `\n**Questions to Ask:**\n`;
      tp.questions?.forEach(q => markdown += `- ${q}\n`);
      markdown += `\n`;
    });
  }

  markdown += `## Intelligent Questions\n\n`;
  if (data.sections.questions?.length > 0) {
    data.sections.questions.forEach(q => {
      markdown += `- **${q.question}** (${q.category})\n`;
      markdown += `  *${q.reasoning}*\n\n`;
    });
  }

  return markdown;
}
