import { Job } from "../models/Job.js";
import { Interview } from "../models/Interview.js";
import { User } from "../models/User.js";
import { successResponse, errorResponse, sendResponse, ERROR_CODES } from "../utils/responseFormat.js";
import { asyncHandler } from "../middleware/errorHandler.js";

// ============================================================================
// UC-104: Competitive Analysis and Benchmarking
// ============================================================================

// Anonymous peer benchmarks - aggregated industry data
const PEER_BENCHMARKS = {
    Technology: {
        avgApplicationsPerMonth: 25,
        avgResponseRate: 22,
        avgInterviewRate: 15,
        avgOfferRate: 8,
        avgTimeToOffer: 42,
        topPerformerResponseRate: 35,
        topPerformerInterviewRate: 28,
        topPerformerOfferRate: 15,
        avgSkillsCount: 12,
        avgExperienceYears: 5,
        avgProjectsCount: 6,
        avgCertificationsCount: 3,
    },
    Healthcare: {
        avgApplicationsPerMonth: 20,
        avgResponseRate: 28,
        avgInterviewRate: 18,
        avgOfferRate: 10,
        avgTimeToOffer: 35,
        topPerformerResponseRate: 40,
        topPerformerInterviewRate: 30,
        topPerformerOfferRate: 18,
        avgSkillsCount: 10,
        avgExperienceYears: 6,
        avgProjectsCount: 4,
        avgCertificationsCount: 5,
    },
    Finance: {
        avgApplicationsPerMonth: 22,
        avgResponseRate: 20,
        avgInterviewRate: 12,
        avgOfferRate: 6,
        avgTimeToOffer: 50,
        topPerformerResponseRate: 32,
        topPerformerInterviewRate: 22,
        topPerformerOfferRate: 12,
        avgSkillsCount: 14,
        avgExperienceYears: 7,
        avgProjectsCount: 5,
        avgCertificationsCount: 4,
    },
    Education: {
        avgApplicationsPerMonth: 15,
        avgResponseRate: 30,
        avgInterviewRate: 20,
        avgOfferRate: 12,
        avgTimeToOffer: 30,
        topPerformerResponseRate: 45,
        topPerformerInterviewRate: 35,
        topPerformerOfferRate: 22,
        avgSkillsCount: 8,
        avgExperienceYears: 8,
        avgProjectsCount: 3,
        avgCertificationsCount: 6,
    },
    Manufacturing: {
        avgApplicationsPerMonth: 18,
        avgResponseRate: 25,
        avgInterviewRate: 16,
        avgOfferRate: 9,
        avgTimeToOffer: 38,
        topPerformerResponseRate: 38,
        topPerformerInterviewRate: 26,
        topPerformerOfferRate: 16,
        avgSkillsCount: 10,
        avgExperienceYears: 6,
        avgProjectsCount: 4,
        avgCertificationsCount: 3,
    },
    Retail: {
        avgApplicationsPerMonth: 30,
        avgResponseRate: 32,
        avgInterviewRate: 22,
        avgOfferRate: 14,
        avgTimeToOffer: 25,
        topPerformerResponseRate: 48,
        topPerformerInterviewRate: 35,
        topPerformerOfferRate: 24,
        avgSkillsCount: 8,
        avgExperienceYears: 4,
        avgProjectsCount: 3,
        avgCertificationsCount: 2,
    },
    Marketing: {
        avgApplicationsPerMonth: 28,
        avgResponseRate: 24,
        avgInterviewRate: 16,
        avgOfferRate: 9,
        avgTimeToOffer: 35,
        topPerformerResponseRate: 38,
        topPerformerInterviewRate: 28,
        topPerformerOfferRate: 16,
        avgSkillsCount: 11,
        avgExperienceYears: 5,
        avgProjectsCount: 8,
        avgCertificationsCount: 3,
    },
    Consulting: {
        avgApplicationsPerMonth: 20,
        avgResponseRate: 18,
        avgInterviewRate: 10,
        avgOfferRate: 5,
        avgTimeToOffer: 55,
        topPerformerResponseRate: 30,
        topPerformerInterviewRate: 18,
        topPerformerOfferRate: 10,
        avgSkillsCount: 15,
        avgExperienceYears: 8,
        avgProjectsCount: 7,
        avgCertificationsCount: 5,
    },
    Other: {
        avgApplicationsPerMonth: 22,
        avgResponseRate: 25,
        avgInterviewRate: 15,
        avgOfferRate: 8,
        avgTimeToOffer: 40,
        topPerformerResponseRate: 38,
        topPerformerInterviewRate: 25,
        topPerformerOfferRate: 14,
        avgSkillsCount: 10,
        avgExperienceYears: 5,
        avgProjectsCount: 5,
        avgCertificationsCount: 3,
    },
};

// Experience level multipliers for benchmarks
const EXPERIENCE_LEVEL_MULTIPLIERS = {
    Entry: { responseRate: 0.8, interviewRate: 0.7, offerRate: 0.6, skills: 0.6 },
    Mid: { responseRate: 1.0, interviewRate: 1.0, offerRate: 1.0, skills: 1.0 },
    Senior: { responseRate: 1.2, interviewRate: 1.3, offerRate: 1.4, skills: 1.3 },
    Executive: { responseRate: 1.3, interviewRate: 1.5, offerRate: 1.6, skills: 1.5 },
};

// In-demand skills by industry for skill gap analysis
const IN_DEMAND_SKILLS = {
    Technology: [
        "JavaScript", "Python", "React", "Node.js", "TypeScript", "AWS", "Docker",
        "Kubernetes", "SQL", "Git", "Agile", "CI/CD", "REST APIs", "GraphQL", "MongoDB"
    ],
    Healthcare: [
        "HIPAA Compliance", "EHR Systems", "Medical Terminology", "Patient Care",
        "Clinical Research", "Data Analysis", "Healthcare IT", "EMR", "Telemedicine"
    ],
    Finance: [
        "Financial Modeling", "Excel", "SQL", "Python", "Risk Management", "Bloomberg Terminal",
        "Regulatory Compliance", "Accounting", "Data Analysis", "VBA", "Financial Analysis"
    ],
    Education: [
        "Curriculum Development", "Educational Technology", "Assessment", "LMS",
        "Classroom Management", "Student Engagement", "Online Teaching", "Pedagogy"
    ],
    Manufacturing: [
        "Lean Manufacturing", "Six Sigma", "Quality Control", "CAD", "ERP Systems",
        "Supply Chain", "Process Improvement", "Safety Compliance", "PLC Programming"
    ],
    Retail: [
        "Customer Service", "Point of Sale", "Inventory Management", "Visual Merchandising",
        "Sales", "CRM", "E-commerce", "Supply Chain", "Loss Prevention"
    ],
    Marketing: [
        "Digital Marketing", "SEO", "Google Analytics", "Social Media", "Content Marketing",
        "Email Marketing", "PPC", "Marketing Automation", "CRM", "Adobe Creative Suite"
    ],
    Consulting: [
        "Problem Solving", "Data Analysis", "PowerPoint", "Excel", "Project Management",
        "Client Relations", "Strategic Planning", "Business Development", "Communication"
    ],
    Other: [
        "Communication", "Project Management", "Problem Solving", "Data Analysis",
        "Microsoft Office", "Teamwork", "Time Management", "Leadership"
    ],
};

// Career progression patterns
const CAREER_PROGRESSION_PATTERNS = {
    Entry: {
        typicalTimeToPromotion: 18, // months
        skillsRequired: 6,
        projectsRequired: 3,
        certificationBonus: 15, // % increase in success rate
        successPatterns: [
            "Build technical portfolio",
            "Gain hands-on experience",
            "Develop mentorship relationships",
            "Contribute to open source or side projects"
        ]
    },
    Mid: {
        typicalTimeToPromotion: 24,
        skillsRequired: 10,
        projectsRequired: 5,
        certificationBonus: 12,
        successPatterns: [
            "Lead small team projects",
            "Develop specialized expertise",
            "Build cross-functional relationships",
            "Mentor junior colleagues"
        ]
    },
    Senior: {
        typicalTimeToPromotion: 36,
        skillsRequired: 14,
        projectsRequired: 8,
        certificationBonus: 10,
        successPatterns: [
            "Drive strategic initiatives",
            "Build thought leadership",
            "Develop executive presence",
            "Create organizational impact"
        ]
    },
    Executive: {
        typicalTimeToPromotion: 48,
        skillsRequired: 18,
        projectsRequired: 12,
        certificationBonus: 8,
        successPatterns: [
            "Define company strategy",
            "Build executive network",
            "Demonstrate business impact",
            "Develop industry reputation"
        ]
    },
};

/**
 * GET /api/competitive-analysis
 * Get comprehensive competitive analysis data
 */
export const getCompetitiveAnalysis = asyncHandler(async (req, res) => {
    const userId = req.auth?.userId || req.auth?.payload?.sub;

    if (!userId) {
        const { response, statusCode } = errorResponse(
            "Unauthorized: missing authentication credentials",
            401,
            ERROR_CODES.UNAUTHORIZED
        );
        return sendResponse(res, response, statusCode);
    }

    // Fetch user profile
    const user = await User.findOne({ auth0Id: userId });
    if (!user) {
        const { response, statusCode } = errorResponse(
            "User not found",
            404,
            ERROR_CODES.NOT_FOUND
        );
        return sendResponse(res, response, statusCode);
    }

    // Fetch user's jobs and interviews
    const jobs = await Job.find({ userId }).sort({ createdAt: -1 });
    const interviews = await Interview.find({ userId });

    // Get user's industry (default to Technology if not set)
    const industry = user.industry || "Technology";
    const experienceLevel = user.experienceLevel || "Mid";
    const benchmarks = PEER_BENCHMARKS[industry] || PEER_BENCHMARKS.Other;
    const multipliers = EXPERIENCE_LEVEL_MULTIPLIERS[experienceLevel] || EXPERIENCE_LEVEL_MULTIPLIERS.Mid;

    // Calculate user's performance metrics
    const userMetrics = calculateUserMetrics(jobs, interviews, user);

    // Compare against peer benchmarks
    const peerComparison = compareToPeerBenchmarks(userMetrics, benchmarks, multipliers);

    // Analyze competitive positioning
    const positioning = analyzeCompetitivePositioning(user, userMetrics, benchmarks, multipliers);

    // Calculate skill gap compared to top performers
    const skillGapAnalysis = analyzeSkillGaps(user, industry);

    // Generate career progression analysis
    const careerProgressionAnalysis = analyzeCareerProgression(user, userMetrics, experienceLevel);

    // Generate recommendations
    const recommendations = generateCompetitiveRecommendations(
        userMetrics,
        peerComparison,
        positioning,
        skillGapAnalysis,
        careerProgressionAnalysis
    );

    // Generate differentiation strategies
    const differentiationStrategies = generateDifferentiationStrategies(user, positioning, skillGapAnalysis);

    // Market positioning suggestions
    const marketPositioning = generateMarketPositioningSuggestions(user, positioning, industry);

    const data = {
        overview: {
            industry,
            experienceLevel,
            competitiveScore: calculateCompetitiveScore(peerComparison, positioning, skillGapAnalysis),
            lastUpdated: new Date().toISOString(),
        },
        userMetrics,
        peerBenchmarks: {
            industry: benchmarks,
            adjustedForExperience: getAdjustedBenchmarks(benchmarks, multipliers),
        },
        peerComparison,
        positioning,
        skillGapAnalysis,
        careerProgressionAnalysis,
        recommendations,
        differentiationStrategies,
        marketPositioning,
    };

    const { response, statusCode } = successResponse(
        "Competitive analysis retrieved successfully",
        data
    );
    return sendResponse(res, response, statusCode);
});

/**
 * GET /api/competitive-analysis/skill-gaps
 * Get detailed skill gap analysis compared to top performers
 */
export const getSkillGapAnalysis = asyncHandler(async (req, res) => {
    const userId = req.auth?.userId || req.auth?.payload?.sub;

    if (!userId) {
        const { response, statusCode } = errorResponse(
            "Unauthorized",
            401,
            ERROR_CODES.UNAUTHORIZED
        );
        return sendResponse(res, response, statusCode);
    }

    const user = await User.findOne({ auth0Id: userId });
    if (!user) {
        const { response, statusCode } = errorResponse(
            "User not found",
            404,
            ERROR_CODES.NOT_FOUND
        );
        return sendResponse(res, response, statusCode);
    }

    const industry = user.industry || "Technology";
    const skillGapAnalysis = analyzeSkillGaps(user, industry);

    const { response, statusCode } = successResponse(
        "Skill gap analysis retrieved successfully",
        skillGapAnalysis
    );
    return sendResponse(res, response, statusCode);
});

/**
 * GET /api/competitive-analysis/positioning
 * Get market positioning recommendations
 */
export const getMarketPositioning = asyncHandler(async (req, res) => {
    const userId = req.auth?.userId || req.auth?.payload?.sub;

    if (!userId) {
        const { response, statusCode } = errorResponse(
            "Unauthorized",
            401,
            ERROR_CODES.UNAUTHORIZED
        );
        return sendResponse(res, response, statusCode);
    }

    const user = await User.findOne({ auth0Id: userId });
    if (!user) {
        const { response, statusCode } = errorResponse(
            "User not found",
            404,
            ERROR_CODES.NOT_FOUND
        );
        return sendResponse(res, response, statusCode);
    }

    const jobs = await Job.find({ userId });
    const interviews = await Interview.find({ userId });

    const industry = user.industry || "Technology";
    const experienceLevel = user.experienceLevel || "Mid";
    const benchmarks = PEER_BENCHMARKS[industry] || PEER_BENCHMARKS.Other;
    const multipliers = EXPERIENCE_LEVEL_MULTIPLIERS[experienceLevel];

    const userMetrics = calculateUserMetrics(jobs, interviews, user);
    const positioning = analyzeCompetitivePositioning(user, userMetrics, benchmarks, multipliers);
    const skillGapAnalysis = analyzeSkillGaps(user, industry);
    const marketPositioning = generateMarketPositioningSuggestions(user, positioning, industry);

    const { response, statusCode } = successResponse(
        "Market positioning analysis retrieved successfully",
        {
            positioning,
            marketPositioning,
            skillGapAnalysis,
        }
    );
    return sendResponse(res, response, statusCode);
});

/**
 * GET /api/competitive-analysis/career-progression
 * Get career progression patterns and analysis
 */
export const getCareerProgressionAnalysis = asyncHandler(async (req, res) => {
    const userId = req.auth?.userId || req.auth?.payload?.sub;

    if (!userId) {
        const { response, statusCode } = errorResponse(
            "Unauthorized",
            401,
            ERROR_CODES.UNAUTHORIZED
        );
        return sendResponse(res, response, statusCode);
    }

    const user = await User.findOne({ auth0Id: userId });
    if (!user) {
        const { response, statusCode } = errorResponse(
            "User not found",
            404,
            ERROR_CODES.NOT_FOUND
        );
        return sendResponse(res, response, statusCode);
    }

    const jobs = await Job.find({ userId });
    const interviews = await Interview.find({ userId });

    const experienceLevel = user.experienceLevel || "Mid";
    const userMetrics = calculateUserMetrics(jobs, interviews, user);
    const careerProgressionAnalysis = analyzeCareerProgression(user, userMetrics, experienceLevel);

    const { response, statusCode } = successResponse(
        "Career progression analysis retrieved successfully",
        careerProgressionAnalysis
    );
    return sendResponse(res, response, statusCode);
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateUserMetrics(jobs, interviews, user) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

    const recentJobs = jobs.filter(j => new Date(j.createdAt) >= thirtyDaysAgo);
    const totalJobs = jobs.length;

    // Calculate rates
    const responded = jobs.filter(j => !['Interested', 'Applied', 'Ghosted'].includes(j.status)).length;
    const interviewed = jobs.filter(j => ['Interview', 'Offer', 'Accepted', 'Phone Screen'].includes(j.status)).length;
    const offers = jobs.filter(j => ['Offer', 'Accepted'].includes(j.status)).length;

    // Time metrics
    const jobsWithResponse = jobs.filter(j => j.statusHistory?.length > 1);
    const responseTimes = jobsWithResponse.map(j => {
        const applied = j.statusHistory.find(s => s.status === 'Applied');
        const responded = j.statusHistory.find(s => !['Interested', 'Applied'].includes(s.status));
        if (applied && responded) {
            return (new Date(responded.timestamp) - new Date(applied.timestamp)) / (1000 * 60 * 60 * 24);
        }
        return null;
    }).filter(t => t !== null);

    const avgTimeToResponse = responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : null;

    // User profile metrics
    const skillsCount = user.skills?.length || 0;
    const projectsCount = user.projects?.length || 0;
    const certificationsCount = user.certifications?.length || 0;

    // Calculate experience years from employment history
    const experienceYears = calculateExperienceYears(user.employment);

    return {
        applicationsThisMonth: recentJobs.length,
        totalApplications: totalJobs,
        responseRate: totalJobs > 0 ? ((responded / totalJobs) * 100).toFixed(1) : 0,
        interviewRate: totalJobs > 0 ? ((interviewed / totalJobs) * 100).toFixed(1) : 0,
        offerRate: totalJobs > 0 ? ((offers / totalJobs) * 100).toFixed(1) : 0,
        interviewToOfferRate: interviewed > 0 ? ((offers / interviewed) * 100).toFixed(1) : 0,
        avgTimeToResponse: avgTimeToResponse ? avgTimeToResponse.toFixed(1) : null,
        skillsCount,
        projectsCount,
        certificationsCount,
        experienceYears,
        totalInterviews: interviews.length,
        completedInterviews: interviews.filter(i => i.status === 'Completed').length,
        successfulInterviews: interviews.filter(i => i.outcome?.result === 'Advanced' || i.outcome?.result === 'Offer').length,
    };
}

function calculateExperienceYears(employment) {
    if (!employment || employment.length === 0) return 0;

    let totalMonths = 0;
    employment.forEach(job => {
        const start = new Date(job.startDate);
        const end = job.isCurrentPosition ? new Date() : new Date(job.endDate);
        const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
        totalMonths += Math.max(0, months);
    });

    return Math.round(totalMonths / 12 * 10) / 10; // Round to 1 decimal
}

function compareToPeerBenchmarks(userMetrics, benchmarks, multipliers) {
    const adjustedBenchmarks = getAdjustedBenchmarks(benchmarks, multipliers);

    const compareMetric = (userValue, benchmarkValue, topValue) => {
        const user = parseFloat(userValue) || 0;
        const benchmark = benchmarkValue || 0;
        const top = topValue || benchmarkValue;

        const vsBenchmark = benchmark > 0 ? ((user - benchmark) / benchmark * 100).toFixed(1) : 0;
        const vsTop = top > 0 ? ((user - top) / top * 100).toFixed(1) : 0;

        let status;
        if (user >= top) status = 'top_performer';
        else if (user >= benchmark) status = 'above_average';
        else if (user >= benchmark * 0.8) status = 'average';
        else status = 'below_average';

        return {
            user,
            benchmark,
            topPerformer: top,
            vsBenchmark: parseFloat(vsBenchmark),
            vsTopPerformer: parseFloat(vsTop),
            status,
            percentile: calculatePercentile(user, benchmark, top),
        };
    };

    return {
        applicationVolume: compareMetric(
            userMetrics.applicationsThisMonth,
            adjustedBenchmarks.avgApplicationsPerMonth,
            adjustedBenchmarks.avgApplicationsPerMonth * 1.5
        ),
        responseRate: compareMetric(
            userMetrics.responseRate,
            adjustedBenchmarks.avgResponseRate,
            adjustedBenchmarks.topPerformerResponseRate
        ),
        interviewRate: compareMetric(
            userMetrics.interviewRate,
            adjustedBenchmarks.avgInterviewRate,
            adjustedBenchmarks.topPerformerInterviewRate
        ),
        offerRate: compareMetric(
            userMetrics.offerRate,
            adjustedBenchmarks.avgOfferRate,
            adjustedBenchmarks.topPerformerOfferRate
        ),
        skillsCount: compareMetric(
            userMetrics.skillsCount,
            adjustedBenchmarks.avgSkillsCount,
            adjustedBenchmarks.avgSkillsCount * 1.5
        ),
        projectsCount: compareMetric(
            userMetrics.projectsCount,
            adjustedBenchmarks.avgProjectsCount,
            adjustedBenchmarks.avgProjectsCount * 1.5
        ),
        certificationsCount: compareMetric(
            userMetrics.certificationsCount,
            adjustedBenchmarks.avgCertificationsCount,
            adjustedBenchmarks.avgCertificationsCount * 2
        ),
    };
}

function getAdjustedBenchmarks(benchmarks, multipliers) {
    return {
        avgApplicationsPerMonth: benchmarks.avgApplicationsPerMonth,
        avgResponseRate: benchmarks.avgResponseRate * multipliers.responseRate,
        avgInterviewRate: benchmarks.avgInterviewRate * multipliers.interviewRate,
        avgOfferRate: benchmarks.avgOfferRate * multipliers.offerRate,
        avgTimeToOffer: benchmarks.avgTimeToOffer,
        topPerformerResponseRate: benchmarks.topPerformerResponseRate * multipliers.responseRate,
        topPerformerInterviewRate: benchmarks.topPerformerInterviewRate * multipliers.interviewRate,
        topPerformerOfferRate: benchmarks.topPerformerOfferRate * multipliers.offerRate,
        avgSkillsCount: Math.round(benchmarks.avgSkillsCount * multipliers.skills),
        avgExperienceYears: benchmarks.avgExperienceYears,
        avgProjectsCount: benchmarks.avgProjectsCount,
        avgCertificationsCount: benchmarks.avgCertificationsCount,
    };
}

function calculatePercentile(value, average, topPerformer) {
    if (value >= topPerformer) return 95;
    if (value >= average * 1.2) return 80;
    if (value >= average) return 60;
    if (value >= average * 0.8) return 40;
    if (value >= average * 0.5) return 25;
    return 10;
}

function analyzeCompetitivePositioning(user, userMetrics, benchmarks, multipliers) {
    const adjustedBenchmarks = getAdjustedBenchmarks(benchmarks, multipliers);

    // Calculate strength areas
    const strengths = [];
    const weaknesses = [];

    if (parseFloat(userMetrics.responseRate) >= adjustedBenchmarks.topPerformerResponseRate) {
        strengths.push({ area: 'Response Rate', value: userMetrics.responseRate, description: 'Your response rate is in the top tier' });
    } else if (parseFloat(userMetrics.responseRate) < adjustedBenchmarks.avgResponseRate * 0.8) {
        weaknesses.push({ area: 'Response Rate', value: userMetrics.responseRate, description: 'Your response rate needs improvement' });
    }

    if (parseFloat(userMetrics.interviewRate) >= adjustedBenchmarks.topPerformerInterviewRate) {
        strengths.push({ area: 'Interview Rate', value: userMetrics.interviewRate, description: 'Excellent interview conversion' });
    } else if (parseFloat(userMetrics.interviewRate) < adjustedBenchmarks.avgInterviewRate * 0.8) {
        weaknesses.push({ area: 'Interview Rate', value: userMetrics.interviewRate, description: 'Interview rate below average' });
    }

    if (userMetrics.skillsCount >= adjustedBenchmarks.avgSkillsCount * 1.3) {
        strengths.push({ area: 'Skills Portfolio', value: userMetrics.skillsCount, description: 'Diverse and comprehensive skill set' });
    } else if (userMetrics.skillsCount < adjustedBenchmarks.avgSkillsCount * 0.7) {
        weaknesses.push({ area: 'Skills Portfolio', value: userMetrics.skillsCount, description: 'Consider expanding your skill set' });
    }

    if (userMetrics.projectsCount >= adjustedBenchmarks.avgProjectsCount * 1.3) {
        strengths.push({ area: 'Project Experience', value: userMetrics.projectsCount, description: 'Strong project portfolio' });
    } else if (userMetrics.projectsCount < adjustedBenchmarks.avgProjectsCount * 0.5) {
        weaknesses.push({ area: 'Project Experience', value: userMetrics.projectsCount, description: 'Build more project experience' });
    }

    if (userMetrics.certificationsCount >= adjustedBenchmarks.avgCertificationsCount * 1.5) {
        strengths.push({ area: 'Certifications', value: userMetrics.certificationsCount, description: 'Well-credentialed professional' });
    }

    // Calculate unique value proposition
    const uniqueValueProposition = generateUniqueValueProposition(user, strengths);

    return {
        strengths,
        weaknesses,
        uniqueValueProposition,
        overallPosition: calculateOverallPosition(strengths, weaknesses),
        competitiveAdvantages: identifyCompetitiveAdvantages(user, strengths),
        areasForImprovement: weaknesses.map(w => w.area),
    };
}

function calculateOverallPosition(strengths, weaknesses) {
    const strengthScore = strengths.length * 2;
    const weaknessScore = weaknesses.length;
    const netScore = strengthScore - weaknessScore;

    if (netScore >= 4) return { level: 'Strong', description: 'You are well-positioned competitively' };
    if (netScore >= 2) return { level: 'Good', description: 'You have solid competitive standing' };
    if (netScore >= 0) return { level: 'Average', description: 'You are on par with peers' };
    return { level: 'Developing', description: 'Focus on strengthening your competitive position' };
}

function identifyCompetitiveAdvantages(user, strengths) {
    const advantages = [];

    if (strengths.find(s => s.area === 'Response Rate')) {
        advantages.push('Strong application materials that stand out');
    }
    if (strengths.find(s => s.area === 'Interview Rate')) {
        advantages.push('Excellent at converting interest into interviews');
    }
    if (strengths.find(s => s.area === 'Skills Portfolio')) {
        advantages.push('Comprehensive technical/professional skill set');
    }
    if (strengths.find(s => s.area === 'Project Experience')) {
        advantages.push('Demonstrable hands-on project experience');
    }
    if (strengths.find(s => s.area === 'Certifications')) {
        advantages.push('Industry-recognized credentials');
    }

    // Check for unique combinations
    if (user.skills?.some(s => s.level === 'Expert')) {
        advantages.push('Expert-level proficiency in specialized areas');
    }

    return advantages;
}

function generateUniqueValueProposition(user, strengths) {
    const uvpComponents = [];

    // Experience-based UVP
    if (user.experienceLevel === 'Senior' || user.experienceLevel === 'Executive') {
        uvpComponents.push('seasoned professional');
    } else if (user.experienceLevel === 'Entry') {
        uvpComponents.push('fresh perspective');
    }

    // Skills-based UVP
    const expertSkills = user.skills?.filter(s => s.level === 'Expert') || [];
    if (expertSkills.length > 0) {
        uvpComponents.push(`expertise in ${expertSkills.slice(0, 2).map(s => s.name).join(' and ')}`);
    }

    // Strength-based UVP
    if (strengths.length > 0) {
        uvpComponents.push(strengths[0].description.toLowerCase());
    }

    return {
        summary: uvpComponents.length > 0
            ? `A ${uvpComponents.join(' with ')}`
            : 'Developing unique professional identity',
        keyDifferentiators: strengths.map(s => s.description),
        developmentOpportunities: strengths.length < 3
            ? ['Consider building more demonstrable strengths to differentiate yourself']
            : [],
    };
}

function analyzeSkillGaps(user, industry) {
    const inDemandSkills = IN_DEMAND_SKILLS[industry] || IN_DEMAND_SKILLS.Other;
    const userSkillNames = (user.skills || []).map(s => s.name.toLowerCase());

    const missingSkills = [];
    const matchingSkills = [];
    const partialMatches = [];

    inDemandSkills.forEach((skill, index) => {
        const skillLower = skill.toLowerCase();
        const hasExact = userSkillNames.some(us => us === skillLower);
        const hasPartial = userSkillNames.some(us =>
            us.includes(skillLower) || skillLower.includes(us)
        );

        if (hasExact) {
            const userSkill = user.skills.find(s => s.name.toLowerCase() === skillLower);
            matchingSkills.push({
                skill,
                level: userSkill?.level || 'Unknown',
                priority: index < 5 ? 'High' : index < 10 ? 'Medium' : 'Low',
            });
        } else if (hasPartial) {
            partialMatches.push({
                skill,
                relatedUserSkill: userSkillNames.find(us =>
                    us.includes(skillLower) || skillLower.includes(us)
                ),
                priority: index < 5 ? 'High' : index < 10 ? 'Medium' : 'Low',
            });
        } else {
            missingSkills.push({
                skill,
                priority: index < 5 ? 'High' : index < 10 ? 'Medium' : 'Low',
                recommendation: getSkillRecommendation(skill),
            });
        }
    });

    // Calculate skill match score
    const totalSkills = inDemandSkills.length;
    const matchScore = ((matchingSkills.length + partialMatches.length * 0.5) / totalSkills * 100).toFixed(1);

    return {
        matchScore: parseFloat(matchScore),
        matchingSkills,
        partialMatches,
        missingSkills,
        topPriorityGaps: missingSkills.filter(s => s.priority === 'High'),
        learningPath: generateLearningPath(missingSkills.slice(0, 5)),
        estimatedTimeToClose: calculateTimeToCloseGaps(missingSkills.filter(s => s.priority === 'High')),
    };
}

function getSkillRecommendation(skill) {
    const recommendations = {
        'JavaScript': 'Complete freeCodeCamp JavaScript Algorithms and Data Structures',
        'Python': 'Take Python for Everybody on Coursera',
        'React': 'Build projects with React documentation tutorial',
        'Node.js': 'Complete The Odin Project Node.js curriculum',
        'AWS': 'Get AWS Cloud Practitioner certification',
        'Docker': 'Complete Docker Getting Started tutorial',
        'SQL': 'Practice on SQLZoo and LeetCode SQL problems',
        'Git': 'Complete GitHub Skills courses',
        'TypeScript': 'TypeScript Handbook and practical projects',
        'default': 'Find online courses on Coursera, Udemy, or LinkedIn Learning',
    };

    return recommendations[skill] || recommendations.default;
}

function generateLearningPath(missingSkills) {
    return missingSkills.map((skill, index) => ({
        order: index + 1,
        skill: skill.skill,
        timeEstimate: skill.priority === 'High' ? '2-4 weeks' : '1-2 weeks',
        resources: [skill.recommendation],
        milestones: [
            'Complete introductory course',
            'Build a small project',
            'Add to portfolio',
        ],
    }));
}

function calculateTimeToCloseGaps(priorityGaps) {
    // Assume 2-4 weeks per high-priority skill
    const weeksPerSkill = 3;
    const totalWeeks = priorityGaps.length * weeksPerSkill;

    if (totalWeeks <= 4) return '1 month';
    if (totalWeeks <= 12) return '2-3 months';
    if (totalWeeks <= 24) return '4-6 months';
    return '6+ months';
}

function analyzeCareerProgression(user, userMetrics, experienceLevel) {
    const patterns = CAREER_PROGRESSION_PATTERNS[experienceLevel] || CAREER_PROGRESSION_PATTERNS.Mid;
    const nextLevel = getNextLevel(experienceLevel);
    const nextLevelPatterns = nextLevel ? CAREER_PROGRESSION_PATTERNS[nextLevel] : null;

    // Calculate readiness for next level
    const readinessFactors = [];

    // Skills readiness
    const skillsReady = userMetrics.skillsCount >= (nextLevelPatterns?.skillsRequired || patterns.skillsRequired);
    readinessFactors.push({
        factor: 'Skills',
        ready: skillsReady,
        current: userMetrics.skillsCount,
        required: nextLevelPatterns?.skillsRequired || patterns.skillsRequired,
        gap: Math.max(0, (nextLevelPatterns?.skillsRequired || patterns.skillsRequired) - userMetrics.skillsCount),
    });

    // Projects readiness
    const projectsReady = userMetrics.projectsCount >= (nextLevelPatterns?.projectsRequired || patterns.projectsRequired);
    readinessFactors.push({
        factor: 'Projects',
        ready: projectsReady,
        current: userMetrics.projectsCount,
        required: nextLevelPatterns?.projectsRequired || patterns.projectsRequired,
        gap: Math.max(0, (nextLevelPatterns?.projectsRequired || patterns.projectsRequired) - userMetrics.projectsCount),
    });

    // Calculate overall readiness score
    const readyFactors = readinessFactors.filter(f => f.ready).length;
    const readinessScore = (readyFactors / readinessFactors.length * 100).toFixed(0);

    return {
        currentLevel: experienceLevel,
        nextLevel,
        readinessScore: parseFloat(readinessScore),
        readinessFactors,
        successPatterns: patterns.successPatterns,
        typicalTimeToPromotion: patterns.typicalTimeToPromotion,
        certificationBonus: patterns.certificationBonus,
        recommendations: generateProgressionRecommendations(readinessFactors, patterns),
        milestones: generateCareerMilestones(experienceLevel, user),
    };
}

function getNextLevel(currentLevel) {
    const levels = ['Entry', 'Mid', 'Senior', 'Executive'];
    const currentIndex = levels.indexOf(currentLevel);
    return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;
}

function generateProgressionRecommendations(readinessFactors, patterns) {
    const recommendations = [];

    readinessFactors.forEach(factor => {
        if (!factor.ready) {
            if (factor.factor === 'Skills') {
                recommendations.push({
                    priority: 'High',
                    action: `Develop ${factor.gap} more skills`,
                    impact: 'Critical for career advancement',
                    timeline: '3-6 months',
                });
            } else if (factor.factor === 'Projects') {
                recommendations.push({
                    priority: 'Medium',
                    action: `Complete ${factor.gap} more significant projects`,
                    impact: 'Demonstrates practical experience',
                    timeline: '6-12 months',
                });
            }
        }
    });

    patterns.successPatterns.forEach(pattern => {
        recommendations.push({
            priority: 'Low',
            action: pattern,
            impact: 'Proven success pattern',
            timeline: 'Ongoing',
        });
    });

    return recommendations;
}

function generateCareerMilestones(experienceLevel, user) {
    const milestones = {
        Entry: [
            { milestone: 'Land first role in target field', status: user.employment?.length > 0 ? 'completed' : 'pending' },
            { milestone: 'Build foundational skills (5+)', status: user.skills?.length >= 5 ? 'completed' : 'pending' },
            { milestone: 'Complete first major project', status: user.projects?.length > 0 ? 'completed' : 'pending' },
            { milestone: 'Earn first certification', status: user.certifications?.length > 0 ? 'completed' : 'pending' },
        ],
        Mid: [
            { milestone: 'Lead a team project', status: 'pending' },
            { milestone: 'Develop specialized expertise', status: user.skills?.some(s => s.level === 'Expert') ? 'completed' : 'pending' },
            { milestone: 'Mentor a junior colleague', status: 'pending' },
            { milestone: 'Build industry network', status: 'pending' },
        ],
        Senior: [
            { milestone: 'Drive strategic initiative', status: 'pending' },
            { milestone: 'Build thought leadership', status: 'pending' },
            { milestone: 'Develop executive presence', status: 'pending' },
            { milestone: 'Create organizational impact', status: 'pending' },
        ],
        Executive: [
            { milestone: 'Define company strategy', status: 'pending' },
            { milestone: 'Build executive network', status: 'pending' },
            { milestone: 'Demonstrate P&L impact', status: 'pending' },
            { milestone: 'Develop industry reputation', status: 'pending' },
        ],
    };

    return milestones[experienceLevel] || milestones.Mid;
}

function generateCompetitiveRecommendations(userMetrics, peerComparison, positioning, skillGapAnalysis, careerProgression) {
    const recommendations = [];

    // Response rate recommendations
    if (peerComparison.responseRate.status === 'below_average') {
        recommendations.push({
            category: 'Application Quality',
            priority: 'High',
            title: 'Improve Application Materials',
            description: 'Your response rate is below average. Focus on tailoring your resume and cover letter for each application.',
            actions: [
                'Customize resume keywords for each job posting',
                'Write personalized cover letters highlighting relevant experience',
                'Apply within 48 hours of job posting',
                'Research company before applying',
            ],
            expectedImpact: '+10-15% response rate improvement',
            timeframe: '2-4 weeks',
        });
    }

    // Interview rate recommendations
    if (peerComparison.interviewRate.status === 'below_average') {
        recommendations.push({
            category: 'Interview Conversion',
            priority: 'High',
            title: 'Enhance Interview Readiness',
            description: 'Your interview conversion rate needs improvement.',
            actions: [
                'Practice common interview questions',
                'Prepare company-specific talking points',
                'Work on your personal pitch',
                'Follow up professionally after applying',
            ],
            expectedImpact: '+5-10% interview rate improvement',
            timeframe: '2-4 weeks',
        });
    }

    // Skills recommendations
    if (skillGapAnalysis.topPriorityGaps.length > 0) {
        recommendations.push({
            category: 'Skill Development',
            priority: 'Medium',
            title: 'Close Priority Skill Gaps',
            description: `You're missing ${skillGapAnalysis.topPriorityGaps.length} high-priority skills for your industry.`,
            actions: skillGapAnalysis.topPriorityGaps.slice(0, 3).map(gap =>
                `Learn ${gap.skill}: ${gap.recommendation}`
            ),
            expectedImpact: '+15-20% competitiveness improvement',
            timeframe: skillGapAnalysis.estimatedTimeToClose,
        });
    }

    // Portfolio recommendations
    if (peerComparison.projectsCount.status === 'below_average') {
        recommendations.push({
            category: 'Portfolio Development',
            priority: 'Medium',
            title: 'Build Project Portfolio',
            description: 'Expand your project experience to demonstrate practical skills.',
            actions: [
                'Complete a personal project in your target area',
                'Contribute to open source projects',
                'Document projects with case studies',
                'Share projects on professional platforms',
            ],
            expectedImpact: 'Stronger competitive positioning',
            timeframe: '1-3 months',
        });
    }

    // Certification recommendations
    if (peerComparison.certificationsCount.status === 'below_average') {
        recommendations.push({
            category: 'Credentials',
            priority: 'Low',
            title: 'Earn Relevant Certifications',
            description: 'Industry certifications can give you a competitive edge.',
            actions: [
                'Research top certifications in your field',
                'Start with foundational certifications',
                'Maintain active certifications',
            ],
            expectedImpact: `+${careerProgression.certificationBonus}% success rate bonus`,
            timeframe: '2-6 months',
        });
    }

    return recommendations.sort((a, b) => {
        const priorityOrder = { 'High': 0, 'Medium': 1, 'Low': 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
}

function generateDifferentiationStrategies(user, positioning, skillGapAnalysis) {
    const strategies = [];

    // Leverage strengths
    positioning.strengths.forEach(strength => {
        strategies.push({
            type: 'leverage_strength',
            title: `Capitalize on ${strength.area}`,
            description: strength.description,
            tactics: getDifferentiationTactics(strength.area),
        });
    });

    // Expert skills differentiation
    const expertSkills = user.skills?.filter(s => s.level === 'Expert') || [];
    if (expertSkills.length > 0) {
        strategies.push({
            type: 'specialization',
            title: 'Position as Specialist',
            description: `Leverage your expert-level skills in ${expertSkills.map(s => s.name).join(', ')}`,
            tactics: [
                'Create content demonstrating expertise',
                'Seek roles requiring specialized skills',
                'Build reputation in niche communities',
                'Offer to speak at industry events',
            ],
        });
    }

    // Unique combination strategy
    if (positioning.strengths.length >= 2) {
        strategies.push({
            type: 'combination',
            title: 'Unique Skill Combination',
            description: 'Position yourself at the intersection of multiple strengths',
            tactics: [
                'Highlight cross-functional experience',
                'Target roles requiring multiple competencies',
                'Create projects showcasing skill combinations',
            ],
        });
    }

    return strategies;
}

function getDifferentiationTactics(area) {
    const tactics = {
        'Response Rate': [
            'Share application success tips with network',
            'Optimize LinkedIn profile for visibility',
            'Build personal brand around professionalism',
        ],
        'Interview Rate': [
            'Develop signature interview stories',
            'Create video introduction content',
            'Build referral network',
        ],
        'Skills Portfolio': [
            'Create skill demonstration projects',
            'Contribute to industry publications',
            'Teach or mentor others',
        ],
        'Project Experience': [
            'Document project case studies',
            'Present at meetups or conferences',
            'Create portfolio website',
        ],
        'Certifications': [
            'Feature credentials prominently',
            'Share certification journey',
            'Stay current with renewals',
        ],
    };

    return tactics[area] || ['Develop visibility in this area', 'Create related content', 'Build network around this strength'];
}

function generateMarketPositioningSuggestions(user, positioning, industry) {
    const suggestions = {
        targetRoles: [],
        positioningStatement: '',
        keyMessages: [],
        networkingStrategy: [],
        contentStrategy: [],
    };

    // Target role suggestions based on strengths
    if (positioning.strengths.length >= 2) {
        suggestions.targetRoles = [
            'Roles that value your unique combination of strengths',
            'Positions requiring specialized expertise',
            'Leadership roles if you have strong track record',
        ];
    } else {
        suggestions.targetRoles = [
            'Build experience before targeting senior roles',
            'Consider adjacent roles to develop skills',
            'Look for growth-oriented positions',
        ];
    }

    // Positioning statement
    const headline = user.headline || `${user.experienceLevel || 'Professional'} in ${industry}`;
    suggestions.positioningStatement = positioning.uniqueValueProposition.summary ||
        `${headline} with ${positioning.strengths.length > 0 ? 'proven ' + positioning.strengths[0].area.toLowerCase() : 'growing expertise'}`;

    // Key messages
    suggestions.keyMessages = [
        `Highlight: ${positioning.competitiveAdvantages[0] || 'Your unique background'}`,
        'Quantify achievements with metrics',
        'Connect your experience to target role requirements',
    ];

    // Networking strategy
    suggestions.networkingStrategy = [
        'Connect with professionals in target companies',
        'Join industry-specific communities',
        'Attend relevant meetups and conferences',
        'Engage with industry thought leaders',
    ];

    // Content strategy
    suggestions.contentStrategy = [
        'Share insights related to your expertise',
        'Comment thoughtfully on industry trends',
        'Create portfolio content showcasing work',
        'Write about lessons learned',
    ];

    return suggestions;
}

function calculateCompetitiveScore(peerComparison, positioning, skillGapAnalysis) {
    let score = 50; // Base score

    // Peer comparison contributions (max +/- 20)
    const comparisonMetrics = ['responseRate', 'interviewRate', 'offerRate', 'skillsCount'];
    comparisonMetrics.forEach(metric => {
        if (peerComparison[metric]?.status === 'top_performer') score += 5;
        else if (peerComparison[metric]?.status === 'above_average') score += 3;
        else if (peerComparison[metric]?.status === 'below_average') score -= 3;
    });

    // Positioning contributions (max +/- 15)
    score += positioning.strengths.length * 3;
    score -= positioning.weaknesses.length * 2;

    // Skill gap contributions (max +/- 15)
    if (skillGapAnalysis.matchScore >= 80) score += 10;
    else if (skillGapAnalysis.matchScore >= 60) score += 5;
    else if (skillGapAnalysis.matchScore < 40) score -= 5;

    // Clamp to 0-100
    return Math.max(0, Math.min(100, Math.round(score)));
}
