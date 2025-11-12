/**
 * Experience Analyzer for Cover Letters
 * Analyzes job requirements against user experience and highlights relevant experiences
 */

/**
 * Calculate relevance score between experience and job requirements
 * @param {Object} experience - User's work experience
 * @param {Object} job - Job posting details
 * @param {Array} userSkills - User's skills
 * @returns {Object} Relevance analysis
 */
export const analyzeExperienceRelevance = (experience, job, userSkills = []) => {
  let relevanceScore = 0;
  const matchedKeywords = [];
  const matchedSkills = [];
  const reasons = [];

  // Extract job keywords from description and requirements
  const jobText = `${job.title || ''} ${job.description || ''} ${(job.requirements || []).join(' ')}`.toLowerCase();
  const jobKeywords = extractKeywords(jobText);

  // Experience text
  const expText = `${experience.title || ''} ${experience.company || ''} ${experience.description || ''} ${(experience.achievements || []).join(' ')}`.toLowerCase();

  // 1. Title similarity (25 points)
  const titleScore = calculateTitleSimilarity(experience.title, job.title);
  relevanceScore += titleScore * 25;
  if (titleScore > 0.3) {
    reasons.push(`Job title similarity: ${Math.round(titleScore * 100)}%`);
  }

  // 2. Keyword matching (30 points)
  jobKeywords.forEach(keyword => {
    if (expText.includes(keyword)) {
      matchedKeywords.push(keyword);
      relevanceScore += 30 / jobKeywords.length;
    }
  });
  if (matchedKeywords.length > 0) {
    reasons.push(`Matched ${matchedKeywords.length} job keywords`);
  }

  // 3. Skills matching (25 points)
  const jobRequiredSkills = extractSkillsFromText(jobText);
  const experienceSkills = extractSkillsFromText(expText);
  
  experienceSkills.forEach(skill => {
    if (jobRequiredSkills.includes(skill)) {
      matchedSkills.push(skill);
      relevanceScore += 25 / Math.max(jobRequiredSkills.length, 1);
    }
  });
  if (matchedSkills.length > 0) {
    reasons.push(`Matched ${matchedSkills.length} required skills`);
  }

  // 4. Industry/domain match (10 points)
  if (job.industry && experience.industry === job.industry) {
    relevanceScore += 10;
    reasons.push('Same industry experience');
  }

  // 5. Recency bonus (10 points) - more recent = more relevant
  const yearsSinceEnd = experience.endDate 
    ? (new Date().getFullYear() - new Date(experience.endDate).getFullYear())
    : 0;
  const recencyScore = Math.max(0, 10 - yearsSinceEnd);
  relevanceScore += recencyScore;
  if (recencyScore > 5) {
    reasons.push('Recent experience');
  }

  return {
    score: Math.min(Math.round(relevanceScore), 100),
    matchedKeywords: matchedKeywords.slice(0, 10),
    matchedSkills: matchedSkills.slice(0, 10),
    reasons,
    priority: relevanceScore >= 70 ? 'high' : relevanceScore >= 40 ? 'medium' : 'low'
  };
};

/**
 * Select most relevant experiences for a job
 * @param {Array} experiences - All user experiences
 * @param {Object} job - Job posting
 * @param {Array} userSkills - User's skills
 * @param {Number} maxExperiences - Maximum experiences to return
 * @returns {Array} Ranked experiences with relevance data
 */
export const selectRelevantExperiences = (experiences, job, userSkills = [], maxExperiences = 3) => {
  if (!experiences || experiences.length === 0) {
    return [];
  }

  // Analyze each experience
  const analyzedExperiences = experiences.map(exp => {
    const analysis = analyzeExperienceRelevance(exp, job, userSkills);
    return {
      ...exp,
      relevance: analysis
    };
  });

  // Sort by relevance score (descending)
  analyzedExperiences.sort((a, b) => b.relevance.score - a.relevance.score);

  // Return top experiences
  return analyzedExperiences.slice(0, maxExperiences);
};

/**
 * Generate compelling narrative for an experience
 * @param {Object} experience - Work experience
 * @param {Object} job - Job posting
 * @param {Object} relevance - Relevance analysis
 * @returns {Object} Narrative variations
 */
export const generateExperienceNarrative = (experience, job, relevance) => {
  const narratives = [];
  const topSkills = relevance.matchedSkills.slice(0, 3).join(', ');
  const hasSkills = relevance.matchedSkills.length > 0;

  // 1. Achievement-focused narrative with skills integration
  if (experience.achievements && experience.achievements.length > 0) {
    const topAchievements = quantifyAchievements(experience.achievements, relevance);
    if (topAchievements.length > 0) {
      const achievementText = topAchievements.slice(0, 2).join(' and ');
      const skillsText = hasSkills ? `, demonstrating expertise in ${topSkills} that directly matches your requirements` : '';
      narratives.push({
        style: 'achievement-focused',
        text: `In my role as ${experience.title} at ${experience.company}, I ${achievementText}${skillsText}.`,
        strength: 'high'
      });
    }
  }

  // 2. Skills-focused narrative with job requirement emphasis
  if (hasSkills) {
    const jobRequirements = job.requirements && job.requirements.length > 0 
      ? ` These capabilities are essential for the key responsibilities you've outlined, including ${job.requirements[0]?.toLowerCase() || 'delivering exceptional results'}.`
      : ' These skills position me to make immediate contributions to your team.';
    narratives.push({
      style: 'skills-focused',
      text: `During my tenure as ${experience.title} at ${experience.company}, I honed my abilities in ${topSkills}.${jobRequirements}`,
      strength: 'high'
    });
  }

  // 3. Problem-solution narrative with matched skills
  const skillsContext = hasSkills 
    ? `utilizing ${topSkills}` 
    : 'applying proven methodologies';
  narratives.push({
    style: 'problem-solution',
    text: `As ${experience.title} at ${experience.company}, I tackled complex challenges ${skillsContext}, gaining experience highly relevant to the ${job.title} role at ${job.company}.`,
    strength: 'medium'
  });

  // 4. Impact-focused narrative with quantification
  const quantifiedAchievements = experience.achievements?.filter(a => hasQuantification(a)) || [];
  if (quantifiedAchievements.length > 0) {
    const skillsHighlight = hasSkills ? ` through my proficiency in ${relevance.matchedSkills[0]}` : '';
    narratives.push({
      style: 'impact-focused',
      text: `At ${experience.company}, ${quantifiedAchievements[0]}${skillsHighlight}. This experience has prepared me to deliver similar results in your ${job.title} position.`,
      strength: 'high'
    });
  }

  // 5. Requirement-alignment narrative (new)
  if (job.requirements && job.requirements.length > 0 && hasSkills) {
    narratives.push({
      style: 'requirement-aligned',
      text: `My experience as ${experience.title} has equipped me with the ${topSkills} skills explicitly mentioned in your job requirements. At ${experience.company}, I applied these capabilities daily, making me well-prepared to meet your expectations.`,
      strength: 'high'
    });
  }

  return narratives;
};

/**
 * Quantify achievements where possible
 * @param {Array} achievements - List of achievements
 * @param {Object} relevance - Relevance data
 * @returns {Array} Quantified achievement statements
 */
export const quantifyAchievements = (achievements, relevance) => {
  return achievements
    .filter(achievement => {
      // Prefer achievements that mention matched keywords or have numbers
      const hasKeywords = relevance.matchedKeywords.some(kw => 
        achievement.toLowerCase().includes(kw)
      );
      const hasNumbers = /\d+/.test(achievement);
      return hasKeywords || hasNumbers;
    })
    .map(achievement => {
      // Ensure achievement starts with action verb
      if (!startsWithActionVerb(achievement)) {
        return `achieved ${achievement}`;
      }
      return achievement.toLowerCase();
    })
    .slice(0, 3);
};

/**
 * Connect experiences to specific job requirements
 * @param {Array} experiences - Selected experiences
 * @param {Object} job - Job posting
 * @returns {Array} Requirement-experience mappings
 */
export const connectToJobRequirements = (experiences, job) => {
  const connections = [];
  const requirements = job.requirements || [];

  requirements.forEach(requirement => {
    const matchingExperiences = experiences.filter(exp => {
      const expText = `${exp.title} ${exp.description} ${(exp.achievements || []).join(' ')}`.toLowerCase();
      const reqKeywords = extractKeywords(requirement.toLowerCase());
      const skillMatches = exp.relevance?.matchedSkills || [];
      
      // Check if keywords or skills match the requirement
      return reqKeywords.some(kw => expText.includes(kw)) || 
             skillMatches.some(skill => requirement.toLowerCase().includes(skill.toLowerCase()));
    });

    if (matchingExperiences.length > 0) {
      // Get specific achievements that relate to this requirement
      const relevantAchievements = [];
      matchingExperiences.forEach(exp => {
        if (exp.achievements) {
          exp.achievements.forEach(achievement => {
            const reqKeywords = extractKeywords(requirement.toLowerCase());
            if (reqKeywords.some(kw => achievement.toLowerCase().includes(kw))) {
              relevantAchievements.push({
                achievement,
                experience: exp.title,
                company: exp.company
              });
            }
          });
        }
      });

      connections.push({
        requirement,
        experiences: matchingExperiences.map(e => ({
          title: e.title,
          company: e.company,
          relevanceScore: e.relevance?.score || 0,
          matchedSkills: e.relevance?.matchedSkills || []
        })),
        relevantAchievements: relevantAchievements.slice(0, 2),
        strength: matchingExperiences.length > 1 ? 'strong' : 'moderate'
      });
    }
  });

  // Sort by strength and relevance
  return connections.sort((a, b) => {
    if (a.strength === 'strong' && b.strength !== 'strong') return -1;
    if (b.strength === 'strong' && a.strength !== 'strong') return 1;
    return b.experiences.length - a.experiences.length;
  });
};

/**
 * Suggest additional relevant experiences from user profile
 * @param {Array} allExperiences - All user experiences
 * @param {Array} selectedExperiences - Already selected experiences
 * @param {Object} job - Job posting
 * @returns {Array} Additional experience suggestions
 */
export const suggestAdditionalExperiences = (allExperiences, selectedExperiences, job) => {
  const selectedIds = new Set(selectedExperiences.map(e => e._id || e.id));
  
  const suggestions = allExperiences
    .filter(exp => !selectedIds.has(exp._id || exp.id))
    .map(exp => {
      const analysis = analyzeExperienceRelevance(exp, job);
      return {
        experience: exp,
        relevance: analysis,
        reason: analysis.reasons[0] || 'General experience relevance'
      };
    })
    .filter(s => s.relevance.score >= 30) // Only suggest if somewhat relevant
    .sort((a, b) => b.relevance.score - a.relevance.score)
    .slice(0, 3);

  return suggestions;
};

/**
 * Score overall experience package relevance
 * @param {Array} experiences - Selected experiences
 * @param {Object} job - Job posting
 * @returns {Object} Overall scoring
 */
export const scoreExperiencePackage = (experiences, job) => {
  if (!experiences || experiences.length === 0) {
    return {
      overallScore: 0,
      coverage: 0,
      strengths: [],
      gaps: [],
      recommendation: 'Add relevant work experiences'
    };
  }

  // Calculate average relevance
  const avgRelevance = experiences.reduce((sum, exp) => sum + (exp.relevance?.score || 0), 0) / experiences.length;

  // Calculate requirement coverage
  const requirements = job.requirements || [];
  const coveredRequirements = connectToJobRequirements(experiences, job);
  const coveragePercent = requirements.length > 0 
    ? (coveredRequirements.length / requirements.length) * 100 
    : 0;

  // Identify strengths
  const strengths = [];
  experiences.forEach(exp => {
    if (exp.relevance?.score >= 70) {
      strengths.push(`Strong ${exp.title} experience at ${exp.company}`);
    }
  });

  // Identify gaps
  const gaps = [];
  const allMatchedSkills = new Set(
    experiences.flatMap(e => e.relevance?.matchedSkills || [])
  );
  const jobSkills = extractSkillsFromText(`${job.description || ''} ${(job.requirements || []).join(' ')}`);
  jobSkills.forEach(skill => {
    if (!allMatchedSkills.has(skill)) {
      gaps.push(skill);
    }
  });

  return {
    overallScore: Math.round(avgRelevance),
    coverage: Math.round(coveragePercent),
    strengths: strengths.slice(0, 3),
    gaps: gaps.slice(0, 5),
    recommendation: avgRelevance >= 70 
      ? 'Excellent experience match - emphasize in cover letter'
      : avgRelevance >= 50
      ? 'Good experience match - highlight transferable skills'
      : 'Consider emphasizing transferable skills and growth potential'
  };
};

// Helper functions

function extractKeywords(text) {
  // Remove common words and extract meaningful keywords
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'can', 'this', 'that', 'these', 'those']);
  
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.has(word));
  
  // Return unique keywords
  return [...new Set(words)];
}

function extractSkillsFromText(text) {
  // Expanded technical and soft skills with variations
  const skillPatterns = [
    // Programming languages
    'javascript', 'typescript', 'python', 'java', 'c\\+\\+', 'c#', 'ruby', 'php', 'swift', 'kotlin', 'go', 'rust',
    // Frontend frameworks/libraries
    'react', 'angular', 'vue', 'svelte', 'jquery', 'next\\.js', 'gatsby', 'nuxt',
    // Backend frameworks
    'node\\.js', 'express', 'django', 'flask', 'spring', 'laravel', 'rails', 'asp\\.net',
    // Databases
    'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'oracle', 'dynamodb', 'cassandra', 'elasticsearch',
    // Cloud & DevOps
    'aws', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'jenkins', 'ci/cd', 'terraform', 'ansible',
    // Testing
    'jest', 'mocha', 'junit', 'selenium', 'cypress', 'testing', 'unit test', 'integration test', 'test automation',
    // Methodologies
    'agile', 'scrum', 'kanban', 'waterfall', 'devops', 'ci/cd',
    // Data & Analytics
    'data analysis', 'machine learning', 'deep learning', 'ai', 'artificial intelligence', 'data science',
    'analytics', 'big data', 'hadoop', 'spark', 'tableau', 'power bi',
    // Soft skills
    'leadership', 'management', 'communication', 'teamwork', 'collaboration', 'problem solving',
    'project management', 'time management', 'critical thinking', 'adaptability', 'creativity',
    // Web technologies
    'html', 'css', 'sass', 'less', 'tailwind', 'bootstrap', 'rest api', 'graphql', 'websocket',
    // Mobile
    'ios', 'android', 'react native', 'flutter', 'mobile development',
    // Other
    'git', 'github', 'gitlab', 'jira', 'confluence', 'microservices', 'api', 'rest', 'graphql',
    'security', 'oauth', 'authentication', 'frontend', 'backend', 'full stack', 'debugging', 'optimization'
  ];
  
  const foundSkills = [];
  const textLower = text.toLowerCase();
  
  skillPatterns.forEach(pattern => {
    // Use regex for more flexible matching
    const regex = new RegExp(`\\b${pattern}\\b`, 'i');
    if (regex.test(textLower)) {
      // Store the clean skill name (without regex special chars)
      const cleanSkill = pattern.replace(/\\+/g, '+').replace(/\\./g, '.');
      if (!foundSkills.includes(cleanSkill)) {
        foundSkills.push(cleanSkill);
      }
    }
  });
  
  return foundSkills;
}

function calculateTitleSimilarity(title1, title2) {
  if (!title1 || !title2) return 0;
  
  const words1 = new Set(title1.toLowerCase().split(/\s+/));
  const words2 = new Set(title2.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

function hasQuantification(text) {
  // Check if text contains numbers or percentages
  return /\d+/.test(text) || /percent|%/.test(text.toLowerCase());
}

function startsWithActionVerb(text) {
  const actionVerbs = ['achieved', 'led', 'managed', 'developed', 'created', 'implemented', 'improved', 'increased', 'decreased', 'launched', 'designed', 'built', 'delivered', 'coordinated', 'optimized', 'reduced', 'generated', 'established', 'drove', 'executed'];
  const firstWord = text.toLowerCase().split(/\s+/)[0];
  return actionVerbs.includes(firstWord);
}

/**
 * Generate alternative experience presentations
 * @param {Object} experience - Work experience
 * @param {Object} job - Job posting
 * @returns {Array} Different presentation styles
 */
export const generateAlternativePresentations = (experience, job) => {
  const presentations = [];

  // 1. Chronological format
  presentations.push({
    format: 'chronological',
    title: `${experience.title} at ${experience.company}`,
    content: `${formatDateRange(experience.startDate, experience.endDate)}\n${experience.description || ''}`,
    bestFor: 'Traditional applications'
  });

  // 2. Skills-first format
  const relevance = analyzeExperienceRelevance(experience, job);
  presentations.push({
    format: 'skills-first',
    title: relevance.matchedSkills.slice(0, 3).join(' • '),
    content: `${experience.title}, ${experience.company}\n${(experience.achievements || []).slice(0, 2).join('\n')}`,
    bestFor: 'Technical roles'
  });

  // 3. Achievement-focused format
  presentations.push({
    format: 'achievement-focused',
    title: `Key Achievements - ${experience.company}`,
    content: (experience.achievements || []).slice(0, 3).join('\n• '),
    bestFor: 'Results-driven roles'
  });

  // 4. Story format
  presentations.push({
    format: 'story',
    title: `${experience.title} Journey`,
    content: `Joined ${experience.company} to ${experience.description?.split('.')[0] || 'contribute to the team'}. ${(experience.achievements || [])[0] || 'Delivered exceptional results'}.`,
    bestFor: 'Creative/narrative applications'
  });

  return presentations;
};

function formatDateRange(startDate, endDate) {
  const start = startDate ? new Date(startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';
  const end = endDate ? new Date(endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Present';
  return `${start} - ${end}`;
}
