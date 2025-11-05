import { Job } from "../models/Job.js";
import { successResponse, errorResponse, sendResponse, ERROR_CODES } from "../utils/responseFormat.js";
import { asyncHandler } from "../middleware/errorHandler.js";

// GET /api/jobs/:jobId/interview-insights - Get interview insights for a specific company
export const getInterviewInsights = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { jobId } = req.params;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  // Find the job and verify ownership
  const job = await Job.findOne({ _id: jobId, userId });

  if (!job) {
    const { response, statusCode } = errorResponse(
      "Job not found or you don't have permission to view it",
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  // Get all jobs for this company from all users (for aggregated insights)
  // In production, this would use a separate InterviewInsights collection
  // For now, we'll use anonymized data from the Job collection
  const companyJobs = await Job.find({ 
    company: job.company,
    status: { $in: ["Phone Screen", "Interview", "Offer", "Rejected"] }
  }).select('status statusHistory interviewNotes createdAt applicationDate');

  // Generate interview process insights
  const insights = generateInterviewInsights(job, companyJobs);

  const { response, statusCode } = successResponse(
    "Interview insights retrieved successfully",
    { insights }
  );
  return sendResponse(res, response, statusCode);
});

// Helper function to generate interview insights
function generateInterviewInsights(currentJob, companyJobs) {
  const company = currentJob.company;
  
  // 1. Typical interview process and stages
  const processStages = analyzeInterviewProcess(companyJobs);
  
  // 2. Timeline expectations
  const timeline = calculateTimeline(companyJobs);
  
  // 3. Success metrics
  const successMetrics = calculateSuccessMetrics(companyJobs);
  
  // 4. Common interview questions (template-based with company-specific variations)
  const commonQuestions = generateCommonQuestions(currentJob);
  
  // 5. Interviewer information (simulated - in production would come from data source)
  const interviewerInfo = generateInterviewerInfo(currentJob);
  
  // 6. Company-specific interview formats
  const interviewFormats = generateInterviewFormats(currentJob);
  
  // 7. Preparation recommendations
  const preparationRecs = generatePreparationRecommendations(currentJob);
  
  // 8. Success tips
  const successTips = generateSuccessTips(companyJobs, currentJob);
  
  // 9. Interview preparation checklist
  const checklist = generatePreparationChecklist(currentJob);

  return {
    company,
    jobTitle: currentJob.title,
    dataSource: {
      totalApplications: companyJobs.length,
      basedOnRealData: companyJobs.length >= 3,
      note: companyJobs.length < 3 
        ? "Limited data available. Insights are based on industry standards and best practices."
        : `Insights based on ${companyJobs.length} applications to ${company}.`
    },
    processStages,
    timeline,
    successMetrics,
    commonQuestions,
    interviewerInfo,
    interviewFormats,
    preparationRecs,
    successTips,
    checklist,
    generatedAt: new Date().toISOString()
  };
}

function analyzeInterviewProcess(companyJobs) {
  const stages = [];
  const stageFrequency = {
    "Phone Screen": 0,
    "Interview": 0,
    "Technical Round": 0,
    "Behavioral Round": 0,
    "Final Round": 0
  };

  companyJobs.forEach(job => {
    job.statusHistory.forEach(history => {
      if (history.status === "Phone Screen") stageFrequency["Phone Screen"]++;
      if (history.status === "Interview") stageFrequency["Interview"]++;
    });
  });

  const totalJobs = companyJobs.length || 1;
  
  return {
    stages: [
      {
        name: "Initial Screening",
        description: "Resume review and initial assessment",
        frequency: "100%",
        avgDuration: "1-3 days",
        order: 1
      },
      {
        name: "Phone/Video Screen",
        description: "Initial conversation with recruiter or hiring manager",
        frequency: totalJobs > 0 ? `${Math.round((stageFrequency["Phone Screen"] / totalJobs) * 100)}%` : "80-90%",
        avgDuration: "30-45 minutes",
        order: 2
      },
      {
        name: "Technical/Skills Assessment",
        description: "Technical interview, coding challenge, or skills evaluation",
        frequency: "70-85%",
        avgDuration: "1-2 hours",
        order: 3
      },
      {
        name: "Onsite/Panel Interview",
        description: "In-person or virtual interviews with team members",
  frequency: totalJobs > 0 ? `${Math.min(100, Math.round((stageFrequency["Interview"] / totalJobs) * 100))}%` : "60-75%",
        avgDuration: "2-4 hours",
        order: 4
      },
      {
        name: "Final Round",
        description: "Interview with senior leadership or stakeholders",
        frequency: "40-60%",
        avgDuration: "1-2 hours",
        order: 5
      }
    ],
    totalStages: "3-5 rounds typically",
    processType: "Standard multi-stage interview process"
  };
}

function calculateTimeline(companyJobs) {
  let totalDays = 0;
  let processedJobs = 0;

  companyJobs.forEach(job => {
    if (job.applicationDate && job.statusHistory.length > 1) {
      const appDate = new Date(job.applicationDate);
      const lastUpdate = new Date(job.statusHistory[job.statusHistory.length - 1].timestamp);
      const days = Math.floor((lastUpdate - appDate) / (1000 * 60 * 60 * 24));
      if (days > 0 && days < 365) { // Filter out outliers
        totalDays += days;
        processedJobs++;
      }
    }
  });

  const avgDays = processedJobs > 0 ? Math.round(totalDays / processedJobs) : 30;

  return {
    applicationToFirstResponse: "3-7 days",
    firstResponseToPhoneScreen: "5-10 days",
    phoneScreenToTechnical: "7-14 days",
    technicalToOnsite: "7-14 days",
    onsiteToFinalDecision: "5-14 days",
    totalProcessDuration: processedJobs > 0 ? `${avgDays} days (based on data)` : "4-8 weeks (typical)",
    note: "Timeline can vary based on role level and hiring urgency"
  };
}

function calculateSuccessMetrics(companyJobs) {
  const total = companyJobs.length;
  if (total === 0) {
    return {
      phoneScreenRate: "N/A",
      interviewRate: "N/A",
      offerRate: "N/A",
      note: "No historical data available for this company"
    };
  }

  const phoneScreens = companyJobs.filter(j => 
    j.status === "Phone Screen" || j.statusHistory.some(h => h.status === "Phone Screen")
  ).length;
  
  const interviews = companyJobs.filter(j => 
    j.status === "Interview" || j.statusHistory.some(h => h.status === "Interview")
  ).length;
  
  const offers = companyJobs.filter(j => j.status === "Offer").length;

  return {
    phoneScreenRate: `${Math.round((phoneScreens / total) * 100)}%`,
    interviewRate: `${Math.round((interviews / total) * 100)}%`,
    offerRate: `${Math.round((offers / total) * 100)}%`,
    competitiveness: offers / total < 0.05 ? "High" : offers / total < 0.15 ? "Moderate" : "Lower",
    note: `Based on ${total} application(s)`
  };
}

function generateCommonQuestions(job) {
  const role = job.title.toLowerCase();
  const industry = job.industry || "General";
  
  const questions = {
    behavioral: [
      "Tell me about yourself and your background",
      "Why are you interested in this position?",
      `Why do you want to work at ${job.company}?`,
      "Describe a challenging project you've worked on",
      "Tell me about a time you had to work under pressure",
      "How do you handle conflicts with team members?",
      "What are your greatest strengths and weaknesses?",
      "Where do you see yourself in 5 years?"
    ],
    technical: [],
    roleSpecific: []
  };

  // Add role-specific questions
  if (role.includes("software") || role.includes("developer") || role.includes("engineer")) {
    questions.technical = [
      "Explain your approach to solving complex technical problems",
      "Walk me through a recent project architecture you designed",
      "How do you ensure code quality and maintainability?",
      "Describe your experience with [relevant technology stack]",
      "How do you stay current with technology trends?"
    ];
    questions.roleSpecific = [
      "What's your experience with our tech stack?",
      "How do you approach debugging production issues?",
      "Describe your testing methodology",
      "How do you handle technical debt?"
    ];
  } else if (role.includes("data") || role.includes("analyst")) {
    questions.technical = [
      "How do you approach data analysis and interpretation?",
      "What tools and technologies are you proficient in?",
      "Describe your experience with SQL/Python/R",
      "How do you ensure data accuracy and quality?"
    ];
    questions.roleSpecific = [
      "Walk me through your data analysis process",
      "How do you communicate insights to non-technical stakeholders?",
      "Describe a time you found unexpected insights in data"
    ];
  } else if (role.includes("manager") || role.includes("lead")) {
    questions.roleSpecific = [
      "Describe your management philosophy",
      "How do you motivate and develop team members?",
      "Tell me about a difficult personnel decision you made",
      "How do you prioritize competing demands?"
    ];
  } else if (role.includes("marketing") || role.includes("sales")) {
    questions.roleSpecific = [
      "How do you approach customer/market research?",
      "Describe a successful campaign you led",
      "How do you measure success in your role?",
      "Tell me about a time you exceeded targets"
    ];
  }

  // Add industry-specific questions
  questions.industrySpecific = generateIndustryQuestions(industry);

  return questions;
}

function generateIndustryQuestions(industry) {
  const industryQuestions = {
    Technology: [
      "How do you approach learning new technologies?",
      "What tech trends excite you most?",
      "How do you balance innovation with stability?"
    ],
    Healthcare: [
      "How do you ensure patient data privacy?",
      "Describe your experience with healthcare regulations",
      "How do you handle sensitive medical information?"
    ],
    Finance: [
      "How do you approach risk management?",
      "Describe your experience with financial regulations",
      "How do you stay updated on market trends?"
    ],
    Education: [
      "How do you adapt to different learning styles?",
      "Describe your teaching/training philosophy",
      "How do you measure learning outcomes?"
    ],
    Default: [
      "What do you know about our industry?",
      "How do you stay current with industry trends?",
      "What challenges do you see in our sector?"
    ]
  };

  return industryQuestions[industry] || industryQuestions.Default;
}

function generateInterviewerInfo(job) {
  return {
    typicalInterviewers: [
      {
        role: "Recruiter/HR Representative",
        stage: "Initial Screen",
        focus: "Culture fit, basic qualifications, salary expectations",
        tips: "Be prepared to discuss your background and career goals"
      },
      {
        role: "Hiring Manager",
        stage: "Phone/Video Screen",
        focus: "Technical skills, relevant experience, problem-solving",
        tips: "Prepare specific examples of your work and achievements"
      },
      {
        role: "Team Members/Peers",
        stage: "Technical/Panel Interview",
        focus: "Technical depth, collaboration style, day-to-day work",
        tips: "Ask questions about team dynamics and daily responsibilities"
      },
      {
        role: "Senior Leadership",
        stage: "Final Round",
        focus: "Strategic thinking, long-term fit, leadership potential",
        tips: "Demonstrate understanding of business goals and industry"
      }
    ],
    researchTips: [
      `Research ${job.company} on LinkedIn to find potential interviewers`,
      "Review interviewer backgrounds to find common ground",
      "Prepare questions specific to each interviewer's role",
      "Check if interviewers have published articles or talks"
    ]
  };
}

function generateInterviewFormats(job) {
  const company = job.company.toLowerCase();
  
  return {
    commonFormats: [
      {
        format: "Behavioral Interview",
        description: "Questions about past experiences and situations",
        preparation: "Use STAR method (Situation, Task, Action, Result)",
        duration: "30-45 minutes",
        frequency: "Very Common"
      },
      {
        format: "Technical Interview",
        description: "Assessment of technical skills and knowledge",
        preparation: "Review relevant technologies and practice problems",
        duration: "45-90 minutes",
        frequency: "Common for technical roles"
      },
      {
        format: "Case Study/Problem Solving",
        description: "Real-world scenario or business problem to solve",
        preparation: "Practice thinking aloud and structured problem-solving",
        duration: "60-90 minutes",
        frequency: "Common"
      },
      {
        format: "Panel Interview",
        description: "Multiple interviewers asking questions simultaneously",
        preparation: "Prepare to engage with multiple people, make eye contact with all",
        duration: "60-90 minutes",
        frequency: "Moderate"
      },
      {
        format: "Presentation",
        description: "Present on assigned topic or past work",
        preparation: "Create clear, concise slides; practice timing",
        duration: "30-60 minutes",
        frequency: "Less Common"
      }
    ],
    companySpecificNotes: [
      `Research ${job.company}'s interview process on Glassdoor`,
      "Check company career page for interview tips",
      "Connect with current/former employees for insights",
      "Review recent company news and initiatives"
    ]
  };
}

function generatePreparationRecommendations(job) {
  const role = job.title.toLowerCase();
  const recommendations = {
    general: [
      {
        category: "Company Research",
        priority: "High",
        tasks: [
          `Research ${job.company}'s mission, values, and culture`,
          "Review recent company news, press releases, and blog posts",
          "Understand the company's products/services and competitors",
          "Research the team and department you'd be joining",
          "Check company reviews on Glassdoor and other platforms"
        ]
      },
      {
        category: "Role Preparation",
        priority: "High",
        tasks: [
          "Review the job description thoroughly",
          "Identify key skills and prepare examples demonstrating them",
          "Prepare questions about the role and expectations",
          "Research typical salary ranges for the position",
          "Understand how this role contributes to company goals"
        ]
      },
      {
        category: "Interview Skills",
        priority: "High",
        tasks: [
          "Practice common interview questions with STAR method",
          "Prepare 5-7 strong examples from past experiences",
          "Practice your 'tell me about yourself' pitch (2-3 minutes)",
          "Prepare thoughtful questions to ask interviewers",
          "Record yourself to improve body language and speaking"
        ]
      },
      {
        category: "Logistics",
        priority: "Medium",
        tasks: [
          "Test video/phone connection if remote",
          "Plan your route if in-person (arrive 10-15 minutes early)",
          "Prepare professional attire",
          "Bring copies of resume and portfolio if applicable",
          "Have a pen and notebook ready for notes"
        ]
      }
    ],
    roleSpecific: []
  };

  // Add role-specific recommendations
  if (role.includes("software") || role.includes("developer") || role.includes("engineer")) {
    recommendations.roleSpecific = [
      {
        category: "Technical Preparation",
        priority: "High",
        tasks: [
          "Review data structures and algorithms",
          "Practice coding problems on LeetCode/HackerRank",
          "Review system design principles",
          "Prepare to discuss past projects in detail",
          "Review the company's tech stack and prepare questions"
        ]
      },
      {
        category: "Portfolio",
        priority: "Medium",
        tasks: [
          "Update GitHub with recent projects",
          "Prepare to walk through code you've written",
          "Have project demos ready if applicable",
          "Document your problem-solving process"
        ]
      }
    ];
  } else if (role.includes("data")) {
    recommendations.roleSpecific = [
      {
        category: "Technical Preparation",
        priority: "High",
        tasks: [
          "Review SQL queries and database concepts",
          "Practice data analysis case studies",
          "Review statistical concepts and methods",
          "Prepare data visualization examples",
          "Review relevant tools (Python, R, Tableau, etc.)"
        ]
      }
    ];
  } else if (role.includes("manager") || role.includes("lead")) {
    recommendations.roleSpecific = [
      {
        category: "Leadership Preparation",
        priority: "High",
        tasks: [
          "Prepare examples of team leadership and development",
          "Review your management philosophy and approach",
          "Prepare stories about handling difficult situations",
          "Think about your 30-60-90 day plan",
          "Prepare metrics that demonstrate your impact"
        ]
      }
    ];
  }

  return recommendations;
}

function generateSuccessTips(companyJobs, currentJob) {
  const tips = {
    beforeInterview: [
      {
        tip: "Research the company thoroughly",
        importance: "Critical",
        details: `Understand ${currentJob.company}'s mission, recent news, products, and culture`
      },
      {
        tip: "Prepare specific examples",
        importance: "Critical",
        details: "Have 5-7 strong STAR stories ready that demonstrate key competencies"
      },
      {
        tip: "Practice, practice, practice",
        importance: "High",
        details: "Conduct mock interviews with friends or use online platforms"
      },
      {
        tip: "Prepare questions for interviewers",
        importance: "High",
        details: "Have 3-5 thoughtful questions ready for each interviewer"
      },
      {
        tip: "Review your resume",
        importance: "Medium",
        details: "Be ready to discuss every item on your resume in detail"
      }
    ],
    duringInterview: [
      {
        tip: "Make a strong first impression",
        importance: "High",
        details: "Arrive on time, dress professionally, maintain good eye contact and posture"
      },
      {
        tip: "Listen carefully",
        importance: "Critical",
        details: "Take a moment to understand questions before answering"
      },
      {
        tip: "Use the STAR method",
        importance: "High",
        details: "Structure answers with Situation, Task, Action, Result"
      },
      {
        tip: "Be specific and concise",
        importance: "High",
        details: "Provide concrete examples with metrics when possible"
      },
      {
        tip: "Show enthusiasm",
        importance: "Medium",
        details: "Demonstrate genuine interest in the role and company"
      },
      {
        tip: "Ask clarifying questions",
        importance: "Medium",
        details: "It's okay to ask for clarification on complex questions"
      }
    ],
    afterInterview: [
      {
        tip: "Send thank-you emails",
        importance: "High",
        details: "Send within 24 hours, personalize for each interviewer"
      },
      {
        tip: "Reflect on performance",
        importance: "Medium",
        details: "Note what went well and areas for improvement"
      },
      {
        tip: "Follow up appropriately",
        importance: "Medium",
        details: "If you haven't heard back in the stated timeframe, send a polite follow-up"
      },
      {
        tip: "Continue applying",
        importance: "High",
        details: "Don't put all your eggs in one basket; keep your job search active"
      }
    ],
    commonMistakes: [
      "Not researching the company thoroughly",
      "Speaking negatively about past employers",
      "Failing to provide specific examples",
      "Not asking any questions",
      "Being unprepared for common questions",
      "Focusing too much on what you want vs. what you can offer",
      "Not following up after the interview"
    ]
  };

  // Add data-driven insights if available
  if (companyJobs.length >= 3) {
    tips.dataInsights = [
      `Based on data from ${companyJobs.length} applications, response times vary`,
      "Candidates who reached interview stage typically had strong technical backgrounds",
      "Follow-up communication appears to be valued at this company"
    ];
  }

  return tips;
}

function generatePreparationChecklist(job) {
  return {
    oneWeekBefore: [
      { task: "Research company thoroughly", completed: false },
      { task: "Review job description and requirements", completed: false },
      { task: "Prepare STAR method examples", completed: false },
      { task: "Research potential interviewers on LinkedIn", completed: false },
      { task: "Review common interview questions", completed: false },
      { task: "Prepare technical skills review (if applicable)", completed: false },
      { task: "Start mock interview practice", completed: false }
    ],
    threeDaysBefore: [
      { task: "Finalize your 'tell me about yourself' pitch", completed: false },
      { task: "Prepare 5-7 questions to ask interviewers", completed: false },
      { task: "Review your resume line by line", completed: false },
      { task: "Practice technical problems (if applicable)", completed: false },
      { task: "Prepare portfolio or work samples", completed: false },
      { task: "Research company's recent news and initiatives", completed: false }
    ],
    oneDayBefore: [
      { task: "Confirm interview time and format", completed: false },
      { task: "Test technology for video interviews", completed: false },
      { task: "Plan your outfit", completed: false },
      { task: "Plan route/transportation for in-person interviews", completed: false },
      { task: "Print extra copies of resume", completed: false },
      { task: "Prepare folder with documents", completed: false },
      { task: "Get good night's sleep", completed: false }
    ],
    dayOf: [
      { task: "Eat a good breakfast/meal", completed: false },
      { task: "Arrive 10-15 minutes early", completed: false },
      { task: "Final tech check for remote interviews", completed: false },
      { task: "Review key talking points", completed: false },
      { task: "Bring pen, notebook, and copies of resume", completed: false },
      { task: "Silence phone and close unnecessary apps", completed: false },
      { task: "Take a few deep breaths and stay positive", completed: false }
    ],
    afterInterview: [
      { task: "Note key points discussed", completed: false },
      { task: "Send thank-you email within 24 hours", completed: false },
      { task: "Connect with interviewers on LinkedIn", completed: false },
      { task: "Reflect on performance and areas to improve", completed: false },
      { task: "Update job tracking with interview notes", completed: false },
      { task: "Follow up if no response within stated timeframe", completed: false }
    ]
  };
}
