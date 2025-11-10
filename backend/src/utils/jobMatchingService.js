/**
 * UC-063: Job Matching Service
 * Calculate match scores based on skills, experience, education, and other factors
 */

import { extractJobSkills } from './skillGapAnalysis.js';

/**
 * Calculate comprehensive job match score
 * @param {Object} job - Job posting
 * @param {Object} userProfile - User's complete profile
 * @param {Object} customWeights - Optional custom weights for categories
 * @returns {Object} Match analysis with scores and breakdowns
 */
export async function calculateJobMatch(job, userProfile, customWeights = null) {
  // Calculate each category score
  const skillsAnalysis = calculateSkillsScore(job, userProfile);
  const experienceAnalysis = calculateExperienceScore(job, userProfile);
  const educationAnalysis = calculateEducationScore(job, userProfile);
  const additionalAnalysis = calculateAdditionalScore(job, userProfile);

  // Apply weights (default or custom)
  const weights = customWeights || {
    skills: 40,
    experience: 30,
    education: 15,
    additional: 15,
  };

  // Normalize weights
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  const normalizedWeights = {};
  Object.keys(weights).forEach(key => {
    normalizedWeights[key] = (weights[key] / totalWeight) * 100;
  });

  // Calculate overall weighted score
  const overallScore = Math.round(
    (skillsAnalysis.score * normalizedWeights.skills +
      experienceAnalysis.score * normalizedWeights.experience +
      educationAnalysis.score * normalizedWeights.education +
      additionalAnalysis.score * normalizedWeights.additional) / 100
  );

  // Identify strengths and gaps
  const strengths = identifyStrengths({
    skills: skillsAnalysis,
    experience: experienceAnalysis,
    education: educationAnalysis,
    additional: additionalAnalysis,
  });

  const gaps = identifyGaps({
    skills: skillsAnalysis,
    experience: experienceAnalysis,
    education: educationAnalysis,
    additional: additionalAnalysis,
  });

  // Generate improvement suggestions
  const suggestions = generateSuggestions(gaps, userProfile, job);

  return {
    overallScore,
    categoryScores: {
      skills: {
        score: skillsAnalysis.score,
        weight: weights.skills,
        details: skillsAnalysis.details,
      },
      experience: {
        score: experienceAnalysis.score,
        weight: weights.experience,
        details: experienceAnalysis.details,
      },
      education: {
        score: educationAnalysis.score,
        weight: weights.education,
        details: educationAnalysis.details,
      },
      additional: {
        score: additionalAnalysis.score,
        weight: weights.additional,
        details: additionalAnalysis.details,
      },
    },
    strengths,
    gaps,
    suggestions,
    customWeights,
    metadata: {
      jobTitle: job.title,
      company: job.company,
      industry: job.industry,
      calculatedAt: new Date(),
      algorithVersion: '1.0',
    },
  };
}

/**
 * Calculate skills match score
 */
function calculateSkillsScore(job, userProfile) {
  const jobSkills = extractJobSkills(job);
  const userSkills = userProfile.skills || [];
  
  // If no skills were extracted, it means the job has insufficient data
  // Every job requires skills, so this is a data quality issue = 0% match
  if (jobSkills.length === 0) {
    return {
      score: 0,
      details: {
        matched: [],
        missing: ['No specific skills listed in job posting - insufficient job data'],
        weak: [],
        matchedCount: 0,
        totalRequired: 0,
      },
    };
  }

  const matched = [];
  const missing = [];
  const weak = [];

  // Normalize user skills for comparison
  const userSkillMap = {};
  userSkills.forEach(skill => {
    userSkillMap[skill.name.toLowerCase()] = skill;
  });

  // Analyze each job skill
  jobSkills.forEach(jobSkill => {
    const skillNameLower = jobSkill.name.toLowerCase();
    const userSkill = userSkillMap[skillNameLower];

    if (userSkill) {
      const levelScore = getLevelScore(userSkill.level);
      
      // Consider skill weak if user is only at Beginner level
      if (levelScore < 2) {
        weak.push({
          name: jobSkill.name,
          userLevel: userSkill.level,
          requiredLevel: 'Intermediate+',
        });
      } else {
        matched.push(jobSkill.name);
      }
    } else {
      missing.push(jobSkill.name);
    }
  });

  // Calculate score
  const requiredSkills = jobSkills.filter(s => s.importance === 'required');
  const preferredSkills = jobSkills.filter(s => s.importance !== 'required');

  // Weight required skills more heavily
  const requiredScore = requiredSkills.length > 0
    ? (matched.filter(m => requiredSkills.find(r => r.name === m)).length / requiredSkills.length) * 70
    : 70;

  const preferredScore = preferredSkills.length > 0
    ? (matched.filter(m => preferredSkills.find(r => r.name === m)).length / preferredSkills.length) * 30
    : 30;

  // Penalty for weak skills (they count as partial match)
  const weakPenalty = weak.length * 5;

  const score = Math.max(0, Math.min(100, Math.round(requiredScore + preferredScore - weakPenalty)));

  return {
    score,
    details: {
      matched,
      missing,
      weak,
      matchedCount: matched.length,
      totalRequired: jobSkills.length,
    },
  };
}

/**
 * Calculate experience match score
 */
function calculateExperienceScore(job, userProfile) {
  const userEmployment = userProfile.employment || [];
  
  if (userEmployment.length === 0) {
    return {
      score: 0,
      details: {
        yearsExperience: 0,
        yearsRequired: 0,
        relevantPositions: [],
        industryMatch: false,
        seniorityMatch: false,
      },
    };
  }

  // Calculate total years of experience
  const totalYears = calculateTotalYears(userEmployment);
  
  // Extract years required from job description/requirements
  const yearsRequired = extractYearsRequired(job);

  // Find relevant positions
  const relevantPositions = findRelevantPositions(job, userEmployment);

  // Check industry match
  const industryMatch = job.industry && userEmployment.some(emp => {
    // This is simplified - in production, you'd have industry mapping logic
    return emp.company && job.company === emp.company;
  });

  // Check seniority match
  const seniorityMatch = checkSeniorityMatch(job.title, userEmployment, totalYears);

  // Calculate score
  let score = 50; // Base score

  // Years of experience component (30 points)
  if (yearsRequired === 0 || totalYears >= yearsRequired) {
    score += 30;
  } else {
    const ratio = Math.min(1, totalYears / yearsRequired);
    score += Math.round(30 * ratio);
  }

  // Relevant positions component (40 points)
  if (relevantPositions.length > 0) {
    const relevanceScore = relevantPositions.reduce((sum, pos) => {
      if (pos.relevance === 'high') return sum + 15;
      if (pos.relevance === 'medium') return sum + 10;
      return sum + 5;
    }, 0);
    score += Math.min(40, relevanceScore);
  }

  // Industry match bonus (15 points)
  if (industryMatch) {
    score += 15;
  }

  // Seniority match bonus (15 points)
  if (seniorityMatch) {
    score += 15;
  }

  score = Math.min(100, score);

  return {
    score,
    details: {
      yearsExperience: totalYears,
      yearsRequired,
      relevantPositions,
      industryMatch,
      seniorityMatch,
    },
  };
}

/**
 * Calculate education match score
 */
function calculateEducationScore(job, userProfile) {
  const userEducation = userProfile.education || [];

  if (userEducation.length === 0) {
    return {
      score: 40, // Partial score - some jobs don't require specific education
      details: {
        degreeMatch: false,
        fieldMatch: false,
        gpaMatch: false,
        hasRequiredDegree: false,
        educationLevel: 'None',
      },
    };
  }

  // Extract education requirements from job
  const requiredDegree = extractDegreeRequirement(job);
  const requiredField = extractFieldRequirement(job);

  // Find highest education level
  const highestEducation = findHighestEducation(userEducation);
  const educationLevel = getEducationLevel(highestEducation?.degree || '');

  // Check degree match
  const degreeMatch = requiredDegree === 'None' || educationLevel >= requiredDegree;

  // Check field match
  const fieldMatch = !requiredField || userEducation.some(edu => 
    edu.fieldOfStudy && edu.fieldOfStudy.toLowerCase().includes(requiredField.toLowerCase())
  );

  // Check GPA (if relevant)
  const hasGoodGPA = userEducation.some(edu => 
    edu.gpa && !edu.gpaPrivate && edu.gpa >= 3.0
  );

  let score = 50; // Base score

  // Degree level match (30 points)
  if (degreeMatch) {
    score += 30;
  } else if (requiredDegree !== 'None') {
    score -= 20; // Penalty for not meeting requirement
  }

  // Field match (30 points)
  if (fieldMatch) {
    score += 30;
  }

  // GPA bonus (20 points max)
  if (hasGoodGPA) {
    const highestGPA = Math.max(...userEducation.filter(e => e.gpa).map(e => e.gpa));
    if (highestGPA >= 3.7) score += 20;
    else if (highestGPA >= 3.5) score += 15;
    else if (highestGPA >= 3.0) score += 10;
  }

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    details: {
      degreeMatch,
      fieldMatch,
      gpaMatch: hasGoodGPA,
      hasRequiredDegree: degreeMatch,
      educationLevel: educationLevel >= 4 ? 'Graduate' : educationLevel >= 3 ? 'Bachelor' : educationLevel >= 2 ? 'Associate' : 'High School',
    },
  };
}

/**
 * Calculate additional factors score
 */
function calculateAdditionalScore(job, userProfile) {
  let score = 50; // Base score

  // Location match (25 points)
  const locationMatch = checkLocationMatch(job.location, userProfile.location, job.workMode);
  if (locationMatch) score += 25;

  // Work mode match (25 points)
  const workModeMatch = !job.workMode || job.workMode === 'Remote' || userProfile.location;
  if (workModeMatch) score += 25;

  // Salary expectation match (20 points)
  const salaryMatch = checkSalaryMatch(job.salary, userProfile);
  if (salaryMatch) score += 20;

  // Certifications (15 points)
  const certCount = userProfile.certifications?.length || 0;
  if (certCount > 0) {
    score += Math.min(15, certCount * 5);
  }

  // Projects (15 points)
  const projectCount = userProfile.projects?.length || 0;
  if (projectCount > 0) {
    score += Math.min(15, projectCount * 3);
  }

  score = Math.min(100, score);

  return {
    score,
    details: {
      locationMatch,
      workModeMatch,
      salaryExpectationMatch: salaryMatch,
      certifications: certCount,
      projects: projectCount,
    },
  };
}

/**
 * Helper functions
 */

function getLevelScore(level) {
  const scores = {
    'Beginner': 1,
    'Intermediate': 2,
    'Advanced': 3,
    'Expert': 4,
  };
  return scores[level] || 0;
}

function calculateTotalYears(employment) {
  let totalMonths = 0;
  
  employment.forEach(job => {
    const start = new Date(job.startDate);
    const end = job.isCurrentPosition ? new Date() : new Date(job.endDate);
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    totalMonths += Math.max(0, months);
  });

  return Math.round((totalMonths / 12) * 10) / 10; // Round to 1 decimal
}

function extractYearsRequired(job) {
  const text = `${job.description || ''} ${job.requirements?.join(' ') || ''}`.toLowerCase();
  
  // Common patterns for experience requirements
  const patterns = [
    /(\d+)\+?\s*years?\s*(?:of)?\s*experience/i,
    /(\d+)\+?\s*years?\s*(?:in|with)/i,
    /minimum\s*(?:of)?\s*(\d+)\s*years?/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return parseInt(match[1]);
    }
  }

  return 0; // No specific requirement found
}

function findRelevantPositions(job, employment) {
  const jobTitleLower = job.title.toLowerCase();
  const jobDescLower = (job.description || '').toLowerCase();
  const keywords = extractKeywords(jobTitleLower);

  return employment.map(emp => {
    const position = emp.position || emp.jobTitle || '';
    const positionLower = position.toLowerCase();
    const description = (emp.description || '').toLowerCase();

    // Calculate relevance
    let relevance = 'low';
    let matchScore = 0;

    // Check title similarity
    keywords.forEach(keyword => {
      if (positionLower.includes(keyword)) matchScore += 2;
      if (description.includes(keyword)) matchScore += 1;
    });

    if (matchScore >= 4) relevance = 'high';
    else if (matchScore >= 2) relevance = 'medium';

    const start = new Date(emp.startDate);
    const end = emp.isCurrentPosition ? new Date() : new Date(emp.endDate);
    const duration = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());

    return {
      title: position,
      company: emp.company,
      duration,
      relevance,
    };
  }).filter(pos => pos.relevance !== 'low' || pos.duration >= 6); // Include only relevant or long-term positions
}

function checkSeniorityMatch(jobTitle, employment, totalYears) {
  const jobSeniority = determineSeniority(jobTitle, totalYears);
  const userSeniority = determineUserSeniority(employment, totalYears);

  // Match if user seniority >= job seniority
  const seniorityLevels = ['entry', 'mid', 'senior', 'lead', 'executive'];
  const jobLevel = seniorityLevels.indexOf(jobSeniority);
  const userLevel = seniorityLevels.indexOf(userSeniority);

  return userLevel >= jobLevel;
}

function determineSeniority(title, years) {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('chief') || titleLower.includes('vp') || titleLower.includes('director')) {
    return 'executive';
  }
  if (titleLower.includes('lead') || titleLower.includes('principal') || titleLower.includes('architect')) {
    return 'lead';
  }
  if (titleLower.includes('senior') || titleLower.includes('sr.')) {
    return 'senior';
  }
  if (titleLower.includes('junior') || titleLower.includes('jr.') || titleLower.includes('entry')) {
    return 'entry';
  }

  // Base on years if no clear indicator
  if (years >= 8) return 'senior';
  if (years >= 4) return 'mid';
  return 'entry';
}

function determineUserSeniority(employment, totalYears) {
  // Check most recent positions for seniority titles
  const recentPositions = employment
    .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
    .slice(0, 2);

  for (const pos of recentPositions) {
    const title = (pos.position || pos.jobTitle || '').toLowerCase();
    if (title.includes('chief') || title.includes('vp') || title.includes('director')) {
      return 'executive';
    }
    if (title.includes('lead') || title.includes('principal')) {
      return 'lead';
    }
    if (title.includes('senior') || title.includes('sr.')) {
      return 'senior';
    }
  }

  // Fall back to years
  if (totalYears >= 8) return 'senior';
  if (totalYears >= 4) return 'mid';
  return 'entry';
}

function extractDegreeRequirement(job) {
  const text = `${job.description || ''} ${job.requirements?.join(' ') || ''}`.toLowerCase();

  if (text.includes('phd') || text.includes('doctorate')) return 'PhD';
  if (text.includes('master') || text.includes('mba') || text.includes('ms')) return 'Master';
  if (text.includes('bachelor') || text.includes('bs') || text.includes('ba')) return 'Bachelor';
  if (text.includes('associate')) return 'Associate';

  return 'None';
}

function extractFieldRequirement(job) {
  const text = `${job.description || ''} ${job.requirements?.join(' ') || ''}`.toLowerCase();

  const fields = [
    'computer science', 'engineering', 'software', 'information technology',
    'mathematics', 'physics', 'business', 'finance', 'marketing', 'healthcare',
    'education', 'design', 'data science', 'artificial intelligence',
  ];

  for (const field of fields) {
    if (text.includes(field)) return field;
  }

  return null;
}

function findHighestEducation(education) {
  const levels = {
    'PhD': 5,
    'Doctorate': 5,
    'Master': 4,
    'MBA': 4,
    'Bachelor': 3,
    'Associate': 2,
    'High School': 1,
  };

  let highest = null;
  let highestLevel = 0;

  education.forEach(edu => {
    const degree = edu.degree || '';
    for (const [key, level] of Object.entries(levels)) {
      if (degree.includes(key) && level > highestLevel) {
        highestLevel = level;
        highest = edu;
      }
    }
  });

  return highest;
}

function getEducationLevel(degree) {
  const degreeLower = degree.toLowerCase();
  
  if (degreeLower.includes('phd') || degreeLower.includes('doctorate')) return 5;
  if (degreeLower.includes('master') || degreeLower.includes('mba')) return 4;
  if (degreeLower.includes('bachelor')) return 3;
  if (degreeLower.includes('associate')) return 2;
  
  return 1;
}

function checkLocationMatch(jobLocation, userLocation, workMode) {
  // Remote jobs always match
  if (workMode === 'Remote') return true;

  // If no specific location required
  if (!jobLocation) return true;

  // If no user location provided
  if (!userLocation) return false;

  // Simple string matching (in production, use geolocation or city/state matching)
  const jobLoc = jobLocation.toLowerCase();
  const userLoc = userLocation.toLowerCase();

  return userLoc.includes(jobLoc) || jobLoc.includes(userLoc);
}

function checkSalaryMatch(jobSalary, userProfile) {
  // If no salary info, assume it's fine
  if (!jobSalary || (!jobSalary.min && !jobSalary.max)) return true;

  // In production, you'd have user's salary expectations in profile
  // For now, use simple heuristics based on experience
  const userYears = userProfile.employment ? calculateTotalYears(userProfile.employment) : 0;
  
  // Rough salary expectations based on years (in thousands)
  const expectedMin = 40 + (userYears * 8);

  if (jobSalary.min && jobSalary.min < expectedMin * 0.8) return false;
  
  return true;
}

function extractKeywords(text) {
  // Remove common words
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'];
  const words = text.split(/\s+/).filter(w => w.length > 2 && !stopWords.includes(w));
  return [...new Set(words)]; // Unique words
}

/**
 * Identify strengths from category analyses
 */
function identifyStrengths(analyses) {
  const strengths = [];

  // Skills strengths
  if (analyses.skills.score >= 80) {
    strengths.push({
      category: 'skills',
      description: `Strong skill match with ${analyses.skills.details.matchedCount} out of ${analyses.skills.details.totalRequired} required skills`,
      impact: 'high',
    });
  }

  if (analyses.skills.details.matched.length > 0) {
    const topSkills = analyses.skills.details.matched.slice(0, 3).join(', ');
    strengths.push({
      category: 'skills',
      description: `Key skills: ${topSkills}`,
      impact: 'medium',
    });
  }

  // Experience strengths
  if (analyses.experience.score >= 80) {
    const years = analyses.experience.details.yearsExperience;
    strengths.push({
      category: 'experience',
      description: `${years} years of relevant experience exceeds requirements`,
      impact: 'high',
    });
  }

  if (analyses.experience.details.relevantPositions.filter(p => p.relevance === 'high').length > 0) {
    strengths.push({
      category: 'experience',
      description: `Highly relevant previous positions`,
      impact: 'high',
    });
  }

  if (analyses.experience.details.industryMatch) {
    strengths.push({
      category: 'experience',
      description: `Industry experience matches job requirements`,
      impact: 'medium',
    });
  }

  // Education strengths
  if (analyses.education.score >= 80) {
    strengths.push({
      category: 'education',
      description: `Education background aligns well with requirements`,
      impact: 'medium',
    });
  }

  if (analyses.education.details.gpaMatch) {
    strengths.push({
      category: 'education',
      description: `Strong academic performance (GPA 3.0+)`,
      impact: 'low',
    });
  }

  // Additional strengths
  if (analyses.additional.details.certifications > 0) {
    strengths.push({
      category: 'additional',
      description: `${analyses.additional.details.certifications} professional certification(s)`,
      impact: 'medium',
    });
  }

  if (analyses.additional.details.projects > 2) {
    strengths.push({
      category: 'additional',
      description: `Strong project portfolio with ${analyses.additional.details.projects} projects`,
      impact: 'medium',
    });
  }

  return strengths;
}

/**
 * Identify gaps from category analyses
 */
function identifyGaps(analyses) {
  const gaps = [];

  // Skills gaps
  if (analyses.skills.details.missing.length > 0) {
    const criticalMissing = analyses.skills.details.missing.slice(0, 3);
    gaps.push({
      category: 'skills',
      description: `Missing required skills: ${criticalMissing.join(', ')}`,
      severity: analyses.skills.score < 50 ? 'critical' : 'important',
      suggestion: `Consider gaining experience in ${criticalMissing[0]} through courses or projects`,
    });
  }

  if (analyses.skills.details.weak.length > 0) {
    gaps.push({
      category: 'skills',
      description: `Skills need strengthening: ${analyses.skills.details.weak.map(w => w.name).slice(0, 3).join(', ')}`,
      severity: 'important',
      suggestion: `Advance from ${analyses.skills.details.weak[0].userLevel} to Intermediate level`,
    });
  }

  // Experience gaps
  if (analyses.experience.details.yearsRequired > analyses.experience.details.yearsExperience) {
    const gap = analyses.experience.details.yearsRequired - analyses.experience.details.yearsExperience;
    gaps.push({
      category: 'experience',
      description: `${gap} more years of experience recommended`,
      severity: gap > 2 ? 'critical' : 'important',
      suggestion: `Emphasize relevant project work and internships to demonstrate practical experience`,
    });
  }

  if (analyses.experience.details.relevantPositions.length === 0) {
    gaps.push({
      category: 'experience',
      description: `No directly relevant previous positions`,
      severity: 'important',
      suggestion: `Highlight transferable skills and related project experience`,
    });
  }

  // Education gaps
  if (!analyses.education.details.hasRequiredDegree) {
    gaps.push({
      category: 'education',
      description: `Degree requirement not met`,
      severity: 'critical',
      suggestion: `Consider pursuing the required degree or highlighting equivalent experience`,
    });
  }

  if (!analyses.education.details.fieldMatch) {
    gaps.push({
      category: 'education',
      description: `Field of study doesn't match job requirements`,
      severity: 'minor',
      suggestion: `Obtain relevant certifications or complete specialized coursework`,
    });
  }

  // Additional gaps
  if (!analyses.additional.details.locationMatch) {
    gaps.push({
      category: 'additional',
      description: `Location doesn't match job requirements`,
      severity: 'minor',
      suggestion: `Be prepared to relocate or address location in cover letter`,
    });
  }

  return gaps;
}

/**
 * Generate improvement suggestions
 */
function generateSuggestions(gaps, userProfile, job) {
  const suggestions = [];

  gaps.forEach(gap => {
    if (gap.category === 'skills' && gap.severity === 'critical') {
      // Parse missing skills from gap description
      const match = gap.description.match(/Missing required skills: (.+)/);
      if (match) {
        const skills = match[1].split(', ');
        skills.slice(0, 2).forEach(skill => {
          suggestions.push({
            type: 'skill',
            priority: 'high',
            title: `Learn ${skill}`,
            description: `${skill} is a critical skill for this position. Focus on this first.`,
            estimatedImpact: 10,
            resources: [
              {
                title: `${skill} course on Coursera`,
                url: `https://www.coursera.org/search?query=${encodeURIComponent(skill)}`,
                platform: 'Coursera',
              },
              {
                title: `${skill} tutorials on Udemy`,
                url: `https://www.udemy.com/courses/search/?q=${encodeURIComponent(skill)}`,
                platform: 'Udemy',
              },
            ],
          });
        });
      }
    }

    if (gap.category === 'skills' && gap.description.includes('need strengthening')) {
      suggestions.push({
        type: 'skill',
        priority: 'medium',
        title: 'Strengthen Existing Skills',
        description: 'Move from Beginner to Intermediate level in your weak skills through practice and projects',
        estimatedImpact: 6,
        resources: [
          {
            title: 'Practice projects on GitHub',
            url: 'https://github.com/topics/beginner-friendly',
            platform: 'GitHub',
          },
        ],
      });
    }

    if (gap.category === 'experience' && gap.severity === 'critical') {
      suggestions.push({
        type: 'experience',
        priority: 'medium',
        title: 'Gain Relevant Experience',
        description: 'Consider internships, freelance projects, or open-source contributions to build experience',
        estimatedImpact: 8,
        resources: [],
      });
    }

    if (gap.category === 'education') {
      suggestions.push({
        type: 'education',
        priority: gap.severity === 'critical' ? 'high' : 'low',
        title: 'Educational Enhancement',
        description: gap.suggestion,
        estimatedImpact: gap.severity === 'critical' ? 10 : 4,
        resources: [],
      });
    }
  });

  // Add profile optimization suggestions
  if (!userProfile.headline || userProfile.headline.length < 20) {
    suggestions.push({
      type: 'profile',
      priority: 'low',
      title: 'Complete Your Profile',
      description: 'Add a compelling headline that highlights your key skills and experience',
      estimatedImpact: 3,
      resources: [],
    });
  }

  if (!userProfile.projects || userProfile.projects.length < 2) {
    suggestions.push({
      type: 'profile',
      priority: 'medium',
      title: 'Build Your Portfolio',
      description: 'Add at least 2-3 relevant projects to demonstrate your skills',
      estimatedImpact: 5,
      resources: [],
    });
  }

  // Sort by priority and estimated impact
  const priorityOrder = { high: 3, medium: 2, low: 1 };
  suggestions.sort((a, b) => {
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    return b.estimatedImpact - a.estimatedImpact;
  });

  return suggestions.slice(0, 10); // Return top 10 suggestions
}

/**
 * Compare match scores across multiple jobs
 * @param {Array} jobs - Array of jobs with their match data
 * @returns {Object} Comparison analysis
 */
export function compareJobMatches(jobs) {
  if (jobs.length === 0) {
    return {
      totalJobs: 0,
      averageScore: 0,
      bestMatch: null,
      worstMatch: null,
      recommendations: [],
    };
  }

  // Sort by overall score
  const sortedJobs = [...jobs].sort((a, b) => b.overallScore - a.overallScore);

  const bestMatch = sortedJobs[0];
  const worstMatch = sortedJobs[sortedJobs.length - 1];
  const averageScore = Math.round(
    jobs.reduce((sum, job) => sum + job.overallScore, 0) / jobs.length
  );

  // Generate comparison recommendations
  const recommendations = [];

  if (bestMatch.overallScore >= 75) {
    recommendations.push({
      type: 'action',
      message: `${bestMatch.metadata.jobTitle} at ${bestMatch.metadata.company} is your best match (${bestMatch.overallScore}%). Prioritize this application.`,
    });
  }

  if (averageScore < 60) {
    recommendations.push({
      type: 'warning',
      message: `Your average match score is ${averageScore}%. Consider broadening your search or improving your skills.`,
    });
  }

  const skillWeakJobs = jobs.filter(j => j.categoryScores.skills.score < 50);
  if (skillWeakJobs.length > jobs.length / 2) {
    recommendations.push({
      type: 'improvement',
      message: `Many jobs show low skill matches. Focus on developing key skills in demand.`,
    });
  }

  return {
    totalJobs: jobs.length,
    averageScore,
    bestMatch: {
      job: `${bestMatch.metadata.jobTitle} at ${bestMatch.metadata.company}`,
      score: bestMatch.overallScore,
      id: bestMatch.jobId,
    },
    worstMatch: {
      job: `${worstMatch.metadata.jobTitle} at ${worstMatch.metadata.company}`,
      score: worstMatch.overallScore,
      id: worstMatch.jobId,
    },
    recommendations,
    scoreDistribution: {
      excellent: jobs.filter(j => j.overallScore >= 85).length,
      good: jobs.filter(j => j.overallScore >= 70 && j.overallScore < 85).length,
      fair: jobs.filter(j => j.overallScore >= 55 && j.overallScore < 70).length,
      poor: jobs.filter(j => j.overallScore < 55).length,
    },
  };
}
