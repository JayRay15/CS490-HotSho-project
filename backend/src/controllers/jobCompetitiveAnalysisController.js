import { Job } from "../models/Job.js";
import { User } from "../models/User.js";
import { successResponse, errorResponse, sendResponse, ERROR_CODES } from "../utils/responseFormat.js";
import { asyncHandler } from "../middleware/errorHandler.js";

// ============================================================================
// UC-123: Job-Specific Competitive Analysis
// Analyze user's competitiveness for a specific job posting
// ============================================================================

// Company size to estimated applicants mapping
const COMPANY_SIZE_APPLICANTS = {
    "1-10": { base: 15, variance: 5 },
    "11-50": { base: 35, variance: 15 },
    "51-200": { base: 75, variance: 30 },
    "201-500": { base: 150, variance: 50 },
    "501-1000": { base: 250, variance: 80 },
    "1001-5000": { base: 400, variance: 120 },
    "5001-10000": { base: 600, variance: 200 },
    "10000+": { base: 800, variance: 300 },
    "10,000+ employees": { base: 800, variance: 300 },
    "": { base: 100, variance: 50 },
};

// Industry demand multipliers for applicant estimates
const INDUSTRY_DEMAND_MULTIPLIERS = {
    Technology: 1.5,
    Finance: 1.3,
    Healthcare: 1.2,
    Consulting: 1.4,
    Marketing: 1.1,
    Education: 0.9,
    Manufacturing: 0.85,
    Retail: 0.8,
    Other: 1.0,
};

// Typical hired candidate profiles by experience level
const TYPICAL_HIRED_PROFILES = {
    Entry: {
        minExperienceYears: 0,
        maxExperienceYears: 2,
        avgSkillsCount: 6,
        avgProjectsCount: 3,
        avgCertifications: 1,
        preferredSkillLevel: "Intermediate",
        keyAttributes: [
            "Strong foundational skills",
            "Demonstrated eagerness to learn",
            "Relevant internship or project experience",
            "Good communication skills",
            "Cultural fit"
        ]
    },
    Mid: {
        minExperienceYears: 3,
        maxExperienceYears: 6,
        avgSkillsCount: 10,
        avgProjectsCount: 6,
        avgCertifications: 2,
        preferredSkillLevel: "Advanced",
        keyAttributes: [
            "Solid technical expertise",
            "Project leadership experience",
            "Problem-solving abilities",
            "Collaboration skills",
            "Industry knowledge"
        ]
    },
    Senior: {
        minExperienceYears: 7,
        maxExperienceYears: 12,
        avgSkillsCount: 14,
        avgProjectsCount: 10,
        avgCertifications: 3,
        preferredSkillLevel: "Expert",
        keyAttributes: [
            "Deep technical expertise",
            "Strategic thinking",
            "Mentorship capabilities",
            "Cross-functional leadership",
            "Business acumen"
        ]
    },
    Executive: {
        minExperienceYears: 12,
        maxExperienceYears: 25,
        avgSkillsCount: 16,
        avgProjectsCount: 15,
        avgCertifications: 4,
        preferredSkillLevel: "Expert",
        keyAttributes: [
            "Visionary leadership",
            "Executive presence",
            "P&L responsibility",
            "Stakeholder management",
            "Industry thought leadership"
        ]
    }
};

/**
 * GET /api/jobs/:jobId/competitive-analysis
 * Get competitive analysis for a specific job
 */
export const getJobCompetitiveAnalysis = asyncHandler(async (req, res) => {
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

    // Fetch job
    const job = await Job.findOne({ _id: jobId, userId });
    if (!job) {
        const { response, statusCode } = errorResponse(
            "Job not found",
            404,
            ERROR_CODES.NOT_FOUND
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

    // Calculate all competitive analysis metrics
    const applicantEstimate = estimateApplicants(job);
    const competitiveScore = calculateCompetitiveScore(user, job);
    const competitiveAdvantages = identifyAdvantages(user, job);
    const competitiveDisadvantages = identifyDisadvantages(user, job);
    const interviewLikelihood = estimateInterviewLikelihood(competitiveScore, job);
    const differentiationStrategies = generateDifferentiationStrategies(user, job, competitiveAdvantages, competitiveDisadvantages);
    const typicalHiredProfile = getTypicalHiredProfile(job, user);
    const applicationPriority = calculateApplicationPriority(competitiveScore, job, interviewLikelihood);

    const data = {
        jobId: job._id,
        jobTitle: job.title,
        company: job.company,
        analyzedAt: new Date().toISOString(),
        
        // Applicant Estimation
        applicantEstimate,
        
        // Competitive Score (0-100)
        competitiveScore,
        
        // Advantages & Disadvantages
        competitiveAdvantages,
        competitiveDisadvantages,
        
        // Interview Likelihood
        interviewLikelihood,
        
        // Differentiation Strategies
        differentiationStrategies,
        
        // Typical Hired Candidate Profile
        typicalHiredProfile,
        
        // Application Priority
        applicationPriority,
        
        // Summary
        summary: generateSummary(competitiveScore, interviewLikelihood, applicationPriority),
    };

    const { response, statusCode } = successResponse(
        "Job competitive analysis retrieved successfully",
        data
    );
    return sendResponse(res, response, statusCode);
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Estimate number of applicants based on posting age, company size, and platform
 */
function estimateApplicants(job) {
    const companySize = job.companyInfo?.size || "";
    const sizeData = COMPANY_SIZE_APPLICANTS[companySize] || COMPANY_SIZE_APPLICANTS[""];
    
    // Base applicants from company size
    let baseApplicants = sizeData.base;
    
    // Adjust for posting age (days since posted)
    const postingDate = job.createdAt || new Date();
    const daysSincePosted = Math.floor((Date.now() - new Date(postingDate)) / (1000 * 60 * 60 * 24));
    
    // More applicants accumulate over time, but rate slows after 2 weeks
    let ageFactor = 1;
    if (daysSincePosted <= 3) {
        ageFactor = 0.5; // Early stage, fewer applicants
    } else if (daysSincePosted <= 7) {
        ageFactor = 0.8;
    } else if (daysSincePosted <= 14) {
        ageFactor = 1.0;
    } else if (daysSincePosted <= 30) {
        ageFactor = 1.3;
    } else {
        ageFactor = 1.5; // Older postings have accumulated more
    }
    
    // Adjust for industry demand
    const industry = job.industry || "Other";
    const industryMultiplier = INDUSTRY_DEMAND_MULTIPLIERS[industry] || 1.0;
    
    // Job type adjustments
    let jobTypeMultiplier = 1.0;
    if (job.jobType === "Internship") jobTypeMultiplier = 2.0;
    if (job.jobType === "Part-time") jobTypeMultiplier = 0.7;
    if (job.workMode === "Remote") jobTypeMultiplier *= 1.5; // Remote jobs get more applicants
    
    // Calculate estimated applicants
    const estimated = Math.round(baseApplicants * ageFactor * industryMultiplier * jobTypeMultiplier);
    const minEstimate = Math.max(10, Math.round(estimated - sizeData.variance));
    const maxEstimate = Math.round(estimated + sizeData.variance);
    
    // Estimate competitive pool (candidates who meet basic requirements)
    // Use job title complexity to vary this - senior roles have fewer qualified candidates
    const jobTitle = (job.title || '').toLowerCase();
    let baseCompetitivePercent = 30;
    if (jobTitle.includes('senior') || jobTitle.includes('lead') || jobTitle.includes('principal')) {
        baseCompetitivePercent = 20; // Fewer qualified for senior roles
    } else if (jobTitle.includes('junior') || jobTitle.includes('entry') || jobTitle.includes('intern')) {
        baseCompetitivePercent = 45; // More qualified for entry roles
    } else if (jobTitle.includes('director') || jobTitle.includes('vp') || jobTitle.includes('chief')) {
        baseCompetitivePercent = 10; // Very few qualified for executive roles
    }
    
    const competitivePool = Math.round(estimated * (baseCompetitivePercent / 100));
    
    return {
        estimated,
        range: { min: minEstimate, max: maxEstimate },
        competitivePool,
        competitivePoolPercentage: baseCompetitivePercent,
        daysSincePosted,
        factors: {
            companySize: companySize || "Unknown",
            industryDemand: industry,
            postingAge: daysSincePosted <= 7 ? "Fresh" : daysSincePosted <= 14 ? "Active" : daysSincePosted <= 30 ? "Moderate" : "Aging",
            workMode: job.workMode || "Not specified",
        },
        insight: getApplicantInsight(estimated, daysSincePosted, job),
    };
}

function getApplicantInsight(estimated, daysSincePosted, job) {
    const jobTitle = (job.title || '').toLowerCase();
    const isRemote = job.workMode === 'Remote';
    
    if (daysSincePosted <= 3) {
        return "This is a fresh posting - applying early gives you an advantage as fewer candidates have applied yet.";
    } else if (daysSincePosted <= 7) {
        return "Good timing - the posting is still recent. Apply soon to stay competitive.";
    } else if (estimated < 100) {
        if (jobTitle.includes('senior') || jobTitle.includes('specialist') || jobTitle.includes('expert')) {
            return "Lower applicant volume for this specialized role - your niche expertise will stand out more.";
        }
        return "Lower applicant volume suggests this may be a niche role - highlight your specialized skills.";
    } else if (estimated > 300) {
        if (isRemote) {
            return "High applicant volume for this remote position - ensure your application stands out with tailored materials and early submission.";
        }
        return "High applicant volume - ensure your application stands out with tailored materials and strong opening statement.";
    } else {
        return "Moderate competition - focus on demonstrating clear value alignment with the role requirements.";
    }
}

/**
 * Calculate user's competitive score (0-100) based on skills, experience, and requirements match
 */
function calculateCompetitiveScore(user, job) {
    let score = 50; // Base score
    const scoreBreakdown = {};
    
    // Skills match (max +25 points)
    const skillsMatch = calculateSkillsMatch(user, job);
    score += skillsMatch.points;
    scoreBreakdown.skills = {
        score: skillsMatch.points,
        maxScore: 25,
        details: skillsMatch.details,
    };
    
    // Experience match (max +20 points)
    const experienceMatch = calculateExperienceMatch(user, job);
    score += experienceMatch.points;
    scoreBreakdown.experience = {
        score: experienceMatch.points,
        maxScore: 20,
        details: experienceMatch.details,
    };
    
    // Profile completeness (max +10 points)
    const profileScore = calculateProfileCompleteness(user);
    score += profileScore.points;
    scoreBreakdown.profile = {
        score: profileScore.points,
        maxScore: 10,
        details: profileScore.details,
    };
    
    // Certifications match (max +10 points)
    const certMatch = calculateCertificationMatch(user, job);
    score += certMatch.points;
    scoreBreakdown.certifications = {
        score: certMatch.points,
        maxScore: 10,
        details: certMatch.details,
    };
    
    // Projects relevance (max +10 points)
    const projectsMatch = calculateProjectsMatch(user, job);
    score += projectsMatch.points;
    scoreBreakdown.projects = {
        score: projectsMatch.points,
        maxScore: 10,
        details: projectsMatch.details,
    };
    
    // Industry alignment (max +5 points)
    const industryMatch = user.industry === job.industry ? 5 : (user.industry ? 2 : 0);
    score += industryMatch;
    scoreBreakdown.industry = {
        score: industryMatch,
        maxScore: 5,
        details: user.industry === job.industry ? "Perfect industry match" : "Different industry background",
    };
    
    // Clamp score to 0-100
    const finalScore = Math.max(0, Math.min(100, Math.round(score)));
    
    return {
        overall: finalScore,
        breakdown: scoreBreakdown,
        level: getScoreLevel(finalScore),
        percentile: estimatePercentile(finalScore),
    };
}

function calculateSkillsMatch(user, job) {
    const userSkills = (user.skills || []).map(s => s.name.toLowerCase());
    const requirements = (job.requirements || []).join(' ').toLowerCase();
    const description = (job.description || '').toLowerCase();
    const jobTitle = (job.title || '').toLowerCase();
    
    // Common skills to look for based on job content
    const jobContent = `${requirements} ${description} ${jobTitle}`;
    let matchCount = 0;
    let totalRelevant = 0;
    const matchedSkills = [];
    const expertMatches = [];
    
    // More sophisticated skill matching
    userSkills.forEach(skill => {
        const skillVariants = [
            skill,
            skill.replace(/\./g, ''),
            skill.replace(/-/g, ' '),
            skill.split(' ')[0] // First word
        ];
        
        const hasMatch = skillVariants.some(variant => 
            jobContent.includes(variant) && variant.length > 2
        );
        
        if (hasMatch) {
            matchCount++;
            const userSkillObj = user.skills.find(s => s.name.toLowerCase() === skill);
            matchedSkills.push(skill);
            if (userSkillObj && userSkillObj.level === 'Expert') {
                expertMatches.push(skill);
            }
        }
    });
    
    // Better estimate of required skills from requirements
    // Count distinct skill-like terms in requirements
    const requirementSkills = requirements
        .split(/[,;.\n]/)
        .filter(r => r.trim().length > 2 && r.trim().length < 50)
        .map(r => r.trim().toLowerCase());
    
    totalRelevant = Math.max(5, Math.min(requirementSkills.length, 15));
    
    // Calculate match percentage more accurately
    const matchPercentage = totalRelevant > 0 ? 
        Math.min(100, (matchCount / totalRelevant) * 100) : 0;
    
    // Points calculation
    let points = Math.round((matchPercentage / 100) * 20);
    
    // Bonus for expert-level skills in relevant areas
    if (expertMatches.length > 0) {
        points += Math.min(5, expertMatches.length * 2);
    }
    
    // Penalty for very few skills overall
    if (userSkills.length < 3) {
        points = Math.floor(points * 0.7);
    }
    
    return {
        points: Math.min(25, points),
        details: {
            matchedSkills: matchedSkills.slice(0, 5),
            expertSkills: expertMatches.slice(0, 3),
            matchPercentage: Math.round(matchPercentage),
            hasExpertSkills: expertMatches.length > 0,
            totalUserSkills: userSkills.length,
            estimatedRequiredSkills: totalRelevant,
        },
    };
}

function calculateExperienceMatch(user, job) {
    const userExperience = calculateTotalExperience(user.employment);
    const userLevel = user.experienceLevel || 'Mid';
    const jobTitle = (job.title || '').toLowerCase();
    const description = (job.description || '').toLowerCase();
    const requirements = (job.requirements || []).join(' ').toLowerCase();
    
    // Infer required experience from job title and description
    let expectedLevel = 'Mid';
    let expectedYears = 3;
    
    // Check for level indicators in title
    if (jobTitle.includes('senior') || jobTitle.includes('lead') || jobTitle.includes('principal') || jobTitle.includes('staff')) {
        expectedLevel = 'Senior';
        expectedYears = 7;
    } else if (jobTitle.includes('junior') || jobTitle.includes('entry') || jobTitle.includes('associate') || jobTitle.includes('intern')) {
        expectedLevel = 'Entry';
        expectedYears = 1;
    } else if (jobTitle.includes('director') || jobTitle.includes('vp') || jobTitle.includes('vice president') || jobTitle.includes('head of') || jobTitle.includes('chief')) {
        expectedLevel = 'Executive';
        expectedYears = 12;
    }
    
    // Extract years from requirements if mentioned
    const yearsMatch = requirements.match(/(\d+)\+?\s*years?\s*(of\s*)?experience/i);
    if (yearsMatch) {
        expectedYears = parseInt(yearsMatch[1]);
        // Adjust expected level based on years
        if (expectedYears >= 10) expectedLevel = 'Senior';
        else if (expectedYears >= 5) expectedLevel = 'Mid';
        else if (expectedYears <= 2) expectedLevel = 'Entry';
    }
    
    // Calculate level match
    const levelMatch = userLevel === expectedLevel;
    const levelClose = isLevelClose(userLevel, expectedLevel);
    const overQualified = isOverQualified(userLevel, expectedLevel);
    const underQualified = isUnderQualified(userLevel, expectedLevel);
    
    // Years of experience match
    const yearsInRange = Math.abs(userExperience - expectedYears) <= 2;
    const yearsClose = Math.abs(userExperience - expectedYears) <= 4;
    
    // Calculate points
    let points = 0;
    if (levelMatch && yearsInRange) {
        points = 20; // Perfect match
    } else if (levelMatch || yearsClose) {
        points = 15; // Good match
    } else if (levelClose) {
        points = 10; // Close match
    } else if (overQualified && !jobTitle.includes('entry') && !jobTitle.includes('junior')) {
        points = 12; // Overqualified but acceptable for non-entry roles
    } else if (underQualified) {
        points = 5; // Under qualified
    } else {
        points = 7; // Mismatch but some experience
    }
    
    // Bonus for relevant employment history in similar roles
    const hasRelevantExperience = (user.employment || []).some(emp => {
        const role = (emp.position || emp.jobTitle || '').toLowerCase();
        const company = (emp.company || '').toLowerCase();
        
        // Check if role title has overlap with job title
        const jobWords = jobTitle.split(/\s+/).filter(w => w.length > 3);
        const roleWords = role.split(/\s+/).filter(w => w.length > 3);
        const hasOverlap = jobWords.some(jw => roleWords.includes(jw));
        
        // Check if same company
        const sameCompany = job.company && company.includes(job.company.toLowerCase());
        
        return hasOverlap || sameCompany;
    });
    
    if (hasRelevantExperience) {
        points = Math.min(20, points + 4);
    }
    
    // Penalty for too little experience
    if (userExperience < 1 && expectedLevel !== 'Entry') {
        points = Math.floor(points * 0.6);
    }
    
    return {
        points: Math.min(20, points),
        details: {
            userLevel,
            expectedLevel,
            yearsExperience: userExperience,
            expectedYears,
            levelMatch: levelMatch ? 'Exact match' : 
                        levelClose ? 'Close match' : 
                        overQualified ? 'Overqualified' :
                        underQualified ? 'Underqualified' : 'Different level',
            hasRelevantExperience,
            yearsMatch: yearsMatch ? 'Good match' : yearsClose ? 'Close' : 'Gap exists',
        },
    };
}

function isOverQualified(userLevel, expectedLevel) {
    const levels = ['Entry', 'Mid', 'Senior', 'Executive'];
    const userIdx = levels.indexOf(userLevel);
    const expectedIdx = levels.indexOf(expectedLevel);
    return userIdx > expectedIdx;
}

function isUnderQualified(userLevel, expectedLevel) {
    const levels = ['Entry', 'Mid', 'Senior', 'Executive'];
    const userIdx = levels.indexOf(userLevel);
    const expectedIdx = levels.indexOf(expectedLevel);
    return userIdx < expectedIdx;
}

function calculateTotalExperience(employment) {
    if (!employment || employment.length === 0) return 0;
    
    let totalMonths = 0;
    employment.forEach(job => {
        const start = new Date(job.startDate);
        const end = job.isCurrentPosition ? new Date() : new Date(job.endDate);
        const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
        totalMonths += Math.max(0, months);
    });
    
    return Math.round(totalMonths / 12 * 10) / 10;
}

function isLevelClose(userLevel, expectedLevel) {
    const levels = ['Entry', 'Mid', 'Senior', 'Executive'];
    const userIdx = levels.indexOf(userLevel);
    const expectedIdx = levels.indexOf(expectedLevel);
    return Math.abs(userIdx - expectedIdx) === 1;
}

function calculateProfileCompleteness(user) {
    let completeness = 0;
    const checks = {
        hasHeadline: !!user.headline,
        hasBio: !!user.bio,
        hasSkills: (user.skills || []).length >= 5,
        hasEmployment: (user.employment || []).length > 0,
        hasEducation: (user.education || []).length > 0,
        hasProjects: (user.projects || []).length > 0,
        hasIndustry: !!user.industry,
        hasExperienceLevel: !!user.experienceLevel,
    };
    
    const totalChecks = Object.keys(checks).length;
    const passedChecks = Object.values(checks).filter(Boolean).length;
    completeness = (passedChecks / totalChecks) * 100;
    
    const points = Math.round((completeness / 100) * 10);
    
    return {
        points,
        details: {
            completeness: Math.round(completeness),
            checks,
        },
    };
}

function calculateCertificationMatch(user, job) {
    const certs = user.certifications || [];
    const jobContent = `${job.description || ''} ${(job.requirements || []).join(' ')}`.toLowerCase();
    
    let relevantCerts = 0;
    const matchedCerts = [];
    
    certs.forEach(cert => {
        const certName = (cert.name || '').toLowerCase();
        const certOrg = (cert.organization || '').toLowerCase();
        if (jobContent.includes(certName) || 
            jobContent.includes(certOrg) ||
            certName.split(' ').some(word => word.length > 3 && jobContent.includes(word))) {
            relevantCerts++;
            matchedCerts.push(cert.name);
        }
    });
    
    // Points: base for having certs + bonus for relevant ones
    let points = Math.min(5, certs.length * 2);
    points += Math.min(5, relevantCerts * 2);
    
    return {
        points: Math.min(10, points),
        details: {
            totalCertifications: certs.length,
            relevantCertifications: relevantCerts,
            matchedCerts: matchedCerts.slice(0, 3),
        },
    };
}

function calculateProjectsMatch(user, job) {
    const projects = user.projects || [];
    const jobContent = `${job.description || ''} ${(job.requirements || []).join(' ')} ${job.title || ''}`.toLowerCase();
    
    let relevantProjects = 0;
    
    projects.forEach(project => {
        const projectContent = `${project.name || ''} ${project.description || ''} ${(project.technologies || []).join(' ')}`.toLowerCase();
        const hasOverlap = projectContent.split(' ').some(word => 
            word.length > 3 && jobContent.includes(word)
        );
        if (hasOverlap) relevantProjects++;
    });
    
    let points = Math.min(5, projects.length);
    points += Math.min(5, relevantProjects * 2);
    
    return {
        points: Math.min(10, points),
        details: {
            totalProjects: projects.length,
            relevantProjects,
        },
    };
}

function getScoreLevel(score) {
    if (score >= 85) return { label: 'Excellent', color: 'green', description: 'You are highly competitive for this role' };
    if (score >= 70) return { label: 'Strong', color: 'blue', description: 'You have a strong profile for this role' };
    if (score >= 55) return { label: 'Competitive', color: 'yellow', description: 'You are competitive with room for improvement' };
    if (score >= 40) return { label: 'Moderate', color: 'orange', description: 'Consider strengthening your application' };
    return { label: 'Building', color: 'red', description: 'Focus on key improvements before applying' };
}

function estimatePercentile(score) {
    // Rough percentile estimation
    if (score >= 90) return 95;
    if (score >= 80) return 85;
    if (score >= 70) return 70;
    if (score >= 60) return 55;
    if (score >= 50) return 40;
    if (score >= 40) return 25;
    return 15;
}

/**
 * Identify user's competitive advantages
 */
function identifyAdvantages(user, job) {
    const advantages = [];
    const jobContent = `${job.description || ''} ${(job.requirements || []).join(' ')} ${job.title || ''}`.toLowerCase();
    
    // Expert-level skills
    const expertSkills = (user.skills || []).filter(s => s.level === 'Expert');
    const relevantExpertSkills = expertSkills.filter(s => 
        jobContent.includes(s.name.toLowerCase())
    );
    if (relevantExpertSkills.length > 0) {
        advantages.push({
            type: 'expertise',
            title: 'Expert-Level Skills',
            description: `You have expert proficiency in ${relevantExpertSkills.map(s => s.name).join(', ')}`,
            impact: 'high',
            skills: relevantExpertSkills.map(s => s.name),
        });
    }
    
    // Industry alignment
    if (user.industry === job.industry) {
        advantages.push({
            type: 'industry',
            title: 'Industry Experience',
            description: `Your background in ${job.industry} gives you valuable context and understanding`,
            impact: 'high',
        });
    }
    
    // Relevant certifications
    const relevantCerts = (user.certifications || []).filter(cert => {
        const certName = (cert.name || '').toLowerCase();
        return jobContent.includes(certName) || 
               certName.split(' ').some(word => word.length > 4 && jobContent.includes(word));
    });
    if (relevantCerts.length > 0) {
        advantages.push({
            type: 'certifications',
            title: 'Relevant Certifications',
            description: `Your certifications demonstrate validated expertise`,
            impact: 'medium',
            certifications: relevantCerts.map(c => c.name),
        });
    }
    
    // Relevant project experience
    const relevantProjects = (user.projects || []).filter(project => {
        const projectContent = `${project.name || ''} ${project.description || ''} ${(project.technologies || []).join(' ')}`.toLowerCase();
        return projectContent.split(' ').some(word => 
            word.length > 3 && jobContent.includes(word)
        );
    });
    if (relevantProjects.length >= 2) {
        advantages.push({
            type: 'projects',
            title: 'Hands-on Project Experience',
            description: `You have ${relevantProjects.length} relevant projects demonstrating practical skills`,
            impact: 'medium',
            projectCount: relevantProjects.length,
        });
    }
    
    // Recent relevant employment
    const recentRelevantRole = (user.employment || []).find(emp => {
        const role = (emp.position || emp.jobTitle || '').toLowerCase();
        const company = (emp.company || '').toLowerCase();
        return job.title.toLowerCase().split(' ').some(word => 
            word.length > 3 && (role.includes(word) || job.company?.toLowerCase().includes(company))
        );
    });
    if (recentRelevantRole) {
        advantages.push({
            type: 'experience',
            title: 'Directly Relevant Experience',
            description: `Your role as ${recentRelevantRole.position || recentRelevantRole.jobTitle} at ${recentRelevantRole.company} is highly relevant`,
            impact: 'high',
        });
    }
    
    // Diverse skill set
    if ((user.skills || []).length >= 12) {
        advantages.push({
            type: 'versatility',
            title: 'Versatile Skill Set',
            description: 'Your broad skill portfolio shows adaptability and learning agility',
            impact: 'medium',
        });
    }
    
    return advantages;
}

/**
 * Identify competitive disadvantages and mitigation strategies
 */
function identifyDisadvantages(user, job) {
    const disadvantages = [];
    const jobContent = `${job.description || ''} ${(job.requirements || []).join(' ')}`.toLowerCase();
    const userSkills = (user.skills || []).map(s => s.name.toLowerCase());
    
    // Missing key skills
    const commonRequiredSkills = extractKeySkills(jobContent);
    const missingSkills = commonRequiredSkills.filter(skill => 
        !userSkills.some(us => us.includes(skill) || skill.includes(us))
    );
    if (missingSkills.length > 0) {
        disadvantages.push({
            type: 'skills_gap',
            title: 'Missing Required Skills',
            description: `You may be missing some commonly requested skills`,
            impact: missingSkills.length > 3 ? 'high' : 'medium',
            missingSkills: missingSkills.slice(0, 5),
            mitigation: [
                'Highlight transferable skills that demonstrate quick learning ability',
                'Show examples of rapidly acquiring new skills in past roles',
                'Consider completing a quick certification or course',
                'Emphasize strong foundational knowledge that enables skill acquisition',
            ],
        });
    }
    
    // Experience level mismatch
    const jobTitle = (job.title || '').toLowerCase();
    const userLevel = user.experienceLevel || 'Mid';
    let expectedLevel = 'Mid';
    if (jobTitle.includes('senior') || jobTitle.includes('lead')) expectedLevel = 'Senior';
    if (jobTitle.includes('junior') || jobTitle.includes('entry')) expectedLevel = 'Entry';
    if (jobTitle.includes('director') || jobTitle.includes('vp')) expectedLevel = 'Executive';
    
    if (userLevel !== expectedLevel && !isLevelClose(userLevel, expectedLevel)) {
        const isUnderqualified = ['Entry', 'Mid'].includes(userLevel) && ['Senior', 'Executive'].includes(expectedLevel);
        disadvantages.push({
            type: 'experience_level',
            title: isUnderqualified ? 'Experience Level Gap' : 'May Be Overqualified',
            description: isUnderqualified 
                ? `The role appears to require ${expectedLevel} level experience`
                : `Your experience level may exceed what's typically expected`,
            impact: 'medium',
            mitigation: isUnderqualified ? [
                'Emphasize leadership initiatives and stretch assignments',
                'Highlight complex projects with significant impact',
                'Demonstrate strategic thinking alongside tactical execution',
                'Show mentorship experience or team collaboration',
            ] : [
                'Express genuine interest in the specific role and company',
                'Highlight aspects that align with your career goals',
                'Emphasize hands-on work preferences if applicable',
                'Address compensation expectations proactively',
            ],
        });
    }
    
    // Different industry
    if (user.industry && job.industry && user.industry !== job.industry) {
        disadvantages.push({
            type: 'industry',
            title: 'Different Industry Background',
            description: `Your experience is in ${user.industry} while this role is in ${job.industry}`,
            impact: 'low',
            mitigation: [
                'Research industry-specific terminology and practices',
                'Highlight transferable skills and adaptability',
                'Find and mention connections between the industries',
                'Show genuine interest through industry research',
            ],
        });
    }
    
    // Limited certifications
    if ((user.certifications || []).length === 0 && jobContent.includes('certification')) {
        disadvantages.push({
            type: 'certifications',
            title: 'No Certifications Listed',
            description: 'The job mentions certifications but you haven\'t added any',
            impact: 'low',
            mitigation: [
                'Add any certifications you have to your profile',
                'Consider obtaining relevant industry certifications',
                'Highlight equivalent training or coursework',
                'Emphasize practical experience as validation of skills',
            ],
        });
    }
    
    // Profile completeness issues
    const profile = calculateProfileCompleteness(user);
    if (profile.details.completeness < 70) {
        disadvantages.push({
            type: 'profile',
            title: 'Incomplete Profile',
            description: 'Your profile is missing some information that could strengthen your application',
            impact: 'medium',
            mitigation: [
                'Complete all profile sections before applying',
                'Add a compelling headline and bio',
                'Include all relevant skills, projects, and experience',
                'Add education and certifications',
            ],
        });
    }
    
    return disadvantages;
}

function extractKeySkills(jobContent) {
    // Common skill patterns to look for
    const skillPatterns = [
        'javascript', 'python', 'java', 'react', 'node', 'sql', 'aws', 'azure',
        'docker', 'kubernetes', 'agile', 'scrum', 'git', 'ci/cd', 'typescript',
        'excel', 'powerpoint', 'salesforce', 'tableau', 'communication',
        'leadership', 'project management', 'data analysis', 'machine learning'
    ];
    
    return skillPatterns.filter(skill => jobContent.includes(skill));
}

/**
 * Estimate likelihood of interview
 */
function estimateInterviewLikelihood(competitiveScore, job) {
    const score = competitiveScore.overall;
    const jobTitle = (job.title || '').toLowerCase();
    const description = (job.description || '').toLowerCase();
    const requirements = (job.requirements || []).join(' ').toLowerCase();
    
    // Base calculation on score
    let likelihood;
    let baseConfidence;
    let explanation;
    
    if (score >= 80) {
        likelihood = 'high';
        baseConfidence = 70;
        explanation = 'Your profile is a strong match for this role. Expect a good chance of interview.';
    } else if (score >= 65) {
        likelihood = 'medium';
        baseConfidence = 45;
        explanation = 'You have a solid foundation. A tailored application could increase your chances.';
    } else if (score >= 50) {
        likelihood = 'medium';
        baseConfidence = 30;
        explanation = 'You meet some requirements. Focus on highlighting your strongest relevant experiences.';
    } else {
        likelihood = 'low';
        baseConfidence = 15;
        explanation = 'There are gaps to address. Consider if this role aligns with your current qualifications.';
    }
    
    // Adjust confidence based on job specifics (not random)
    let confidenceModifier = 0;
    
    // Posting age factor
    const daysSincePosted = Math.floor((Date.now() - new Date(job.createdAt)) / (1000 * 60 * 60 * 24));
    if (daysSincePosted <= 3) {
        confidenceModifier += 10; // Early bird advantage
        explanation += ' Early application timing works in your favor.';
    } else if (daysSincePosted > 21) {
        confidenceModifier -= 5; // Older postings may have filled pipeline
        explanation += ' Note that this is an older posting.';
    }
    
    // Job complexity factor - more requirements = harder to match everyone
    const reqCount = (job.requirements || []).length;
    if (reqCount > 10 && score >= 65) {
        confidenceModifier += 5; // Meeting complex requirements is impressive
    } else if (reqCount < 3 && score < 70) {
        confidenceModifier -= 5; // Simple jobs have more competition
    }
    
    // Remote work factor - more competition
    if (job.workMode === 'Remote' && likelihood !== 'high') {
        confidenceModifier -= 5;
    }
    
    // Senior roles are more selective
    if ((jobTitle.includes('senior') || jobTitle.includes('lead') || jobTitle.includes('director')) && score >= 70) {
        confidenceModifier += 5; // Good score for senior role means a lot
    }
    
    // Calculate final confidence
    const confidencePercentage = Math.max(5, Math.min(95, baseConfidence + confidenceModifier));
    
    return {
        likelihood,
        confidencePercentage,
        explanation,
        factors: [
            { name: 'Skills Match', impact: competitiveScore.breakdown.skills.score >= 15 ? 'positive' : 'negative' },
            { name: 'Experience Level', impact: competitiveScore.breakdown.experience.score >= 12 ? 'positive' : 'neutral' },
            { name: 'Profile Completeness', impact: competitiveScore.breakdown.profile.score >= 7 ? 'positive' : 'negative' },
        ],
    };
}

/**
 * Generate differentiation strategies
 */
function generateDifferentiationStrategies(user, job, advantages, disadvantages) {
    const strategies = [];
    
    // Leverage advantages
    if (advantages.some(a => a.type === 'expertise')) {
        strategies.push({
            category: 'Leverage Expertise',
            priority: 'high',
            strategy: 'Lead with your expert-level skills in your application and cover letter',
            tactics: [
                'Start your cover letter with a specific achievement using these skills',
                'Quantify impact where possible (e.g., "improved performance by 40%")',
                'Prepare specific examples for interview discussions',
            ],
        });
    }
    
    if (advantages.some(a => a.type === 'industry')) {
        strategies.push({
            category: 'Industry Knowledge',
            priority: 'high',
            strategy: 'Demonstrate deep understanding of industry challenges and trends',
            tactics: [
                'Reference recent industry news or trends in your cover letter',
                'Show how your experience addresses industry-specific challenges',
                'Use industry terminology appropriately',
            ],
        });
    }
    
    // Address key disadvantages
    if (disadvantages.some(d => d.type === 'skills_gap')) {
        strategies.push({
            category: 'Address Skills Gaps',
            priority: 'medium',
            strategy: 'Proactively address missing skills with transferable experiences',
            tactics: [
                'Highlight similar skills or quick learning examples',
                'Show eagerness to learn and grow',
                'Consider completing a quick relevant course before applying',
            ],
        });
    }
    
    // General differentiation strategies
    strategies.push({
        category: 'Stand Out Application',
        priority: 'high',
        strategy: 'Create a tailored, memorable application package',
        tactics: [
            'Customize your resume to mirror the job description language',
            'Write a cover letter that tells a compelling story',
            'Include a relevant portfolio piece or work sample if appropriate',
            'Research the company and reference specific initiatives',
        ],
    });
    
    strategies.push({
        category: 'Network Advantage',
        priority: 'medium',
        strategy: 'Leverage connections and referrals',
        tactics: [
            'Check if you have any LinkedIn connections at the company',
            'Ask for informational interviews with current employees',
            'Request referrals if you have mutual connections',
            'Engage with company content on social media',
        ],
    });
    
    strategies.push({
        category: 'Follow-Up Strategy',
        priority: 'medium',
        strategy: 'Plan a professional follow-up approach',
        tactics: [
            'Send a follow-up email 1 week after applying if appropriate',
            'Connect with the hiring manager on LinkedIn',
            'Prepare thoughtful questions for any phone screens',
            'Send a thank-you note after any interview',
        ],
    });
    
    return strategies;
}

/**
 * Get typical hired candidate profile for comparison
 */
function getTypicalHiredProfile(job, user) {
    const jobTitle = (job.title || '').toLowerCase();
    
    // Determine expected level
    let expectedLevel = 'Mid';
    if (jobTitle.includes('senior') || jobTitle.includes('lead') || jobTitle.includes('principal')) {
        expectedLevel = 'Senior';
    } else if (jobTitle.includes('junior') || jobTitle.includes('entry') || jobTitle.includes('associate')) {
        expectedLevel = 'Entry';
    } else if (jobTitle.includes('director') || jobTitle.includes('vp') || jobTitle.includes('head of') || jobTitle.includes('chief')) {
        expectedLevel = 'Executive';
    }
    
    const profile = TYPICAL_HIRED_PROFILES[expectedLevel];
    const userExperience = calculateTotalExperience(user.employment);
    
    // Calculate comparison
    const comparison = {
        experience: {
            typical: `${profile.minExperienceYears}-${profile.maxExperienceYears} years`,
            yours: `${userExperience} years`,
            status: userExperience >= profile.minExperienceYears ? 'meets' : 'below',
        },
        skills: {
            typical: `${profile.avgSkillsCount}+ skills`,
            yours: `${(user.skills || []).length} skills`,
            status: (user.skills || []).length >= profile.avgSkillsCount ? 'meets' : 'below',
        },
        projects: {
            typical: `${profile.avgProjectsCount}+ projects`,
            yours: `${(user.projects || []).length} projects`,
            status: (user.projects || []).length >= profile.avgProjectsCount ? 'meets' : 'below',
        },
        certifications: {
            typical: `${profile.avgCertifications}+ certifications`,
            yours: `${(user.certifications || []).length} certifications`,
            status: (user.certifications || []).length >= profile.avgCertifications ? 'meets' : 'below',
        },
    };
    
    const meetsCount = Object.values(comparison).filter(c => c.status === 'meets').length;
    
    return {
        expectedLevel,
        profile,
        comparison,
        overallMatch: meetsCount >= 3 ? 'Strong Match' : meetsCount >= 2 ? 'Partial Match' : 'Development Needed',
        meetsCount,
        totalCriteria: 4,
    };
}

/**
 * Calculate application priority
 */
function calculateApplicationPriority(competitiveScore, job, interviewLikelihood) {
    let priorityScore = 0;
    const factors = [];
    
    // Competitive score contribution (0-40)
    const scoreContribution = Math.round((competitiveScore.overall / 100) * 40);
    priorityScore += scoreContribution;
    factors.push({ factor: 'Competitiveness', contribution: scoreContribution, max: 40 });
    
    // Interview likelihood contribution (0-30)
    const likelihoodContribution = interviewLikelihood.likelihood === 'high' ? 30 :
        interviewLikelihood.likelihood === 'medium' ? 20 : 10;
    priorityScore += likelihoodContribution;
    factors.push({ factor: 'Interview Likelihood', contribution: likelihoodContribution, max: 30 });
    
    // Posting freshness contribution (0-15)
    const daysSincePosted = Math.floor((Date.now() - new Date(job.createdAt)) / (1000 * 60 * 60 * 24));
    const freshnessContribution = daysSincePosted <= 3 ? 15 : 
        daysSincePosted <= 7 ? 12 :
        daysSincePosted <= 14 ? 8 :
        daysSincePosted <= 30 ? 4 : 0;
    priorityScore += freshnessContribution;
    factors.push({ factor: 'Posting Freshness', contribution: freshnessContribution, max: 15 });
    
    // Job priority setting contribution (0-15)
    const jobPriorityContribution = job.priority === 'High' ? 15 :
        job.priority === 'Medium' ? 10 : 5;
    priorityScore += jobPriorityContribution;
    factors.push({ factor: 'Your Priority Setting', contribution: jobPriorityContribution, max: 15 });
    
    // Determine priority level
    let priority;
    if (priorityScore >= 75) priority = { level: 'Top Priority', action: 'Apply immediately' };
    else if (priorityScore >= 55) priority = { level: 'High Priority', action: 'Apply within 2-3 days' };
    else if (priorityScore >= 35) priority = { level: 'Medium Priority', action: 'Apply this week' };
    else priority = { level: 'Lower Priority', action: 'Consider strengthening application first' };
    
    return {
        score: priorityScore,
        maxScore: 100,
        priority,
        factors,
        recommendation: generatePriorityRecommendation(priorityScore, competitiveScore, job),
    };
}

function generatePriorityRecommendation(priorityScore, competitiveScore, job) {
    if (priorityScore >= 75) {
        return `This is an excellent opportunity where you have high competitive advantage. ${
            competitiveScore.overall >= 70 ? 'Your strong profile match means you should apply right away.' :
            'Despite some gaps, the timing and fit make this worth pursuing immediately.'
        }`;
    } else if (priorityScore >= 55) {
        return `This is a good opportunity worth pursuing. ${
            competitiveScore.overall >= 60 ? 'Focus on tailoring your application to maximize your chances.' :
            'Consider addressing key gaps in your application materials.'
        }`;
    } else if (priorityScore >= 35) {
        return `This opportunity has potential but consider the competitive landscape. ${
            'Invest extra time in customizing your application and highlighting transferable skills.'
        }`;
    } else {
        return `This role may not be the best current fit. Consider gaining more relevant experience or skills, ` +
               `or look for roles that better match your current profile.`;
    }
}

/**
 * Generate analysis summary
 */
function generateSummary(competitiveScore, interviewLikelihood, applicationPriority) {
    return {
        headline: getHeadline(competitiveScore.overall, interviewLikelihood.likelihood),
        keyPoints: [
            `Competitive Score: ${competitiveScore.overall}/100 (${competitiveScore.level.label})`,
            `Interview Likelihood: ${interviewLikelihood.likelihood.charAt(0).toUpperCase() + interviewLikelihood.likelihood.slice(1)} (${interviewLikelihood.confidencePercentage}% confidence)`,
            `Application Priority: ${applicationPriority.priority.level}`,
        ],
        actionableInsight: applicationPriority.recommendation,
    };
}

function getHeadline(score, likelihood) {
    if (score >= 80 && likelihood === 'high') {
        return "🌟 Excellent Match - Strong Candidate";
    } else if (score >= 65 || likelihood === 'high') {
        return "✅ Good Match - Competitive Candidate";
    } else if (score >= 50) {
        return "⚡ Moderate Match - Potential Opportunity";
    } else {
        return "📈 Building Match - Consider Preparation";
    }
}
