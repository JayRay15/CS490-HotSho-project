/**
 * Skill Gap Analysis Service
 * Compares user skills against job requirements and provides learning recommendations
 */

// Skill importance weights based on common industry standards
const SKILL_IMPORTANCE = {
  'required': 10,
  'preferred': 7,
  'nice-to-have': 4
};

// Learning platform integrations
const LEARNING_PLATFORMS = {
  'Coursera': 'https://www.coursera.org/search?query=',
  'Udemy': 'https://www.udemy.com/courses/search/?q=',
  'LinkedIn Learning': 'https://www.linkedin.com/learning/search?keywords=',
  'Pluralsight': 'https://www.pluralsight.com/search?q=',
  'edX': 'https://www.edx.org/search?q=',
  'Udacity': 'https://www.udacity.com/courses/all?search='
};

/**
 * Parse job requirements and extract skills
 * @param {Object} job - Job document
 * @returns {Array} Array of required skills with importance levels
 */
export function extractJobSkills(job) {
  const skills = [];
  
  // Extract from requirements array
  if (job.requirements && Array.isArray(job.requirements)) {
    job.requirements.forEach(req => {
      const reqLower = req.toLowerCase();
      
      // Determine importance based on keywords
      let importance = 'required';
      if (reqLower.includes('preferred') || reqLower.includes('nice to have') || reqLower.includes('plus')) {
        importance = 'preferred';
      } else if (reqLower.includes('bonus') || reqLower.includes('optional')) {
        importance = 'nice-to-have';
      }
      
      // Extract skill names (this is a simplified version - could be enhanced with NLP)
      const skillKeywords = extractSkillKeywords(req);
      skillKeywords.forEach(skill => {
        skills.push({
          name: skill,
          importance,
          source: 'requirements'
        });
      });
    });
  }
  
  // Extract from description
  if (job.description) {
    const descSkills = extractSkillKeywords(job.description);
    descSkills.forEach(skill => {
      if (!skills.find(s => s.name.toLowerCase() === skill.toLowerCase())) {
        skills.push({
          name: skill,
          importance: 'preferred',
          source: 'description'
        });
      }
    });
  }
  
  return skills;
}

/**
 * Extract skill keywords from text
 * @param {String} text - Text to analyze
 * @returns {Array} Array of skill names
 */
function extractSkillKeywords(text) {
  // Common technical and professional skills dictionary
  const skillDictionary = [
    // Programming Languages
    'JavaScript', 'Python', 'Java', 'C++', 'C#', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Go', 'Rust', 'TypeScript',
    'SQL', 'R', 'Scala', 'Perl', 'MATLAB', 'Objective-C', 'Dart', 'Elixir',
    
    // Frameworks & Libraries
    'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'Laravel', '.NET',
    'React Native', 'Flutter', 'TensorFlow', 'PyTorch', 'Keras', 'jQuery', 'Bootstrap', 'Tailwind',
    
    // Databases
    'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Cassandra', 'Oracle', 'Microsoft SQL Server',
    'DynamoDB', 'Firebase', 'Elasticsearch', 'Neo4j',
    
    // Cloud & DevOps
    'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'Jenkins', 'GitLab CI', 'CircleCI',
    'Terraform', 'Ansible', 'Chef', 'Puppet', 'Nginx', 'Apache',
    
    // Tools & Technologies
    'Git', 'GitHub', 'Jira', 'Confluence', 'Slack', 'Figma', 'Sketch', 'Adobe XD', 'Photoshop',
    'Illustrator', 'InDesign', 'PowerBI', 'Tableau', 'Excel', 'Salesforce',
    
    // Methodologies
    'Agile', 'Scrum', 'Kanban', 'DevOps', 'CI/CD', 'TDD', 'BDD', 'Microservices', 'REST API',
    'GraphQL', 'OAuth', 'JWT', 'Responsive Design', 'UI/UX',
    
    // Soft Skills
    'Communication', 'Leadership', 'Problem Solving', 'Critical Thinking', 'Teamwork',
    'Time Management', 'Adaptability', 'Creativity', 'Attention to Detail', 'Project Management',
    
    // Business & Domain
    'Data Analysis', 'Machine Learning', 'Artificial Intelligence', 'Blockchain', 'Cybersecurity',
    'SEO', 'SEM', 'Digital Marketing', 'Content Strategy', 'Financial Analysis', 'Risk Management'
  ];
  
  const foundSkills = [];
  const textLower = text.toLowerCase();
  
  skillDictionary.forEach(skill => {
    // Use word boundaries to avoid partial matches
    const regex = new RegExp(`\\b${skill.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(textLower)) {
      foundSkills.push(skill);
    }
  });
  
  return foundSkills;
}

/**
 * Compare user skills against job requirements
 * @param {Array} userSkills - User's skills from database
 * @param {Array} jobSkills - Required skills from job
 * @returns {Object} Skill gap analysis
 */
export function analyzeSkillGap(userSkills, jobSkills) {
  const matched = [];
  const weak = [];
  const missing = [];
  
  // Normalize user skills for comparison
  const userSkillMap = {};
  userSkills.forEach(skill => {
    userSkillMap[skill.name.toLowerCase()] = skill;
  });
  
  // Analyze each job requirement
  jobSkills.forEach(jobSkill => {
    const skillNameLower = jobSkill.name.toLowerCase();
    const userSkill = userSkillMap[skillNameLower];
    
    if (userSkill) {
      // Check if skill level is sufficient
      const levelScore = getLevelScore(userSkill.level);
      const isWeak = levelScore < 2; // Beginner level considered weak
      
      if (isWeak) {
        weak.push({
          ...jobSkill,
          userLevel: userSkill.level,
          gap: 'weak',
          priority: calculatePriority(jobSkill.importance, 'weak')
        });
      } else {
        matched.push({
          ...jobSkill,
          userLevel: userSkill.level,
          userCategory: userSkill.category
        });
      }
    } else {
      missing.push({
        ...jobSkill,
        gap: 'missing',
        priority: calculatePriority(jobSkill.importance, 'missing')
      });
    }
  });
  
  // Sort by priority (highest first)
  missing.sort((a, b) => b.priority - a.priority);
  weak.sort((a, b) => b.priority - a.priority);
  
  return {
    matched,
    weak,
    missing,
    matchPercentage: jobSkills.length > 0 
      ? Math.round((matched.length / jobSkills.length) * 100) 
      : 0,
    totalRequired: jobSkills.length,
    summary: {
      matched: matched.length,
      weak: weak.length,
      missing: missing.length
    }
  };
}

/**
 * Convert skill level to numeric score
 */
function getLevelScore(level) {
  const scores = {
    'Beginner': 1,
    'Intermediate': 2,
    'Advanced': 3,
    'Expert': 4
  };
  return scores[level] || 0;
}

/**
 * Calculate priority score for skill gap
 */
function calculatePriority(importance, gapType) {
  const importanceWeight = SKILL_IMPORTANCE[importance] || 5;
  const gapWeight = gapType === 'missing' ? 2 : 1.5;
  return importanceWeight * gapWeight;
}

/**
 * Generate learning resource suggestions
 * @param {Array} skills - Skills to find resources for
 * @returns {Array} Learning resources
 */
export function suggestLearningResources(skills) {
  const resources = [];
  
  skills.forEach(skill => {
    const skillResources = {
      skill: skill.name,
      importance: skill.importance,
      priority: skill.priority,
      resources: []
    };
    
    // Add resources from each platform
    Object.entries(LEARNING_PLATFORMS).forEach(([platform, baseUrl]) => {
      skillResources.resources.push({
        platform,
        title: `${skill.name} courses on ${platform}`,
        url: `${baseUrl}${encodeURIComponent(skill.name)}`,
        type: 'course'
      });
    });
    
    // Add documentation/official resources for technical skills
    const officialDocs = getOfficialDocumentation(skill.name);
    if (officialDocs) {
      skillResources.resources.push(officialDocs);
    }
    
    resources.push(skillResources);
  });
  
  return resources;
}

/**
 * Get official documentation links for known technologies
 */
function getOfficialDocumentation(skillName) {
  const docs = {
    'JavaScript': { title: 'MDN JavaScript Guide', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide', type: 'documentation' },
    'Python': { title: 'Python Official Documentation', url: 'https://docs.python.org/3/', type: 'documentation' },
    'React': { title: 'React Official Documentation', url: 'https://react.dev/', type: 'documentation' },
    'Node.js': { title: 'Node.js Documentation', url: 'https://nodejs.org/docs/', type: 'documentation' },
    'TypeScript': { title: 'TypeScript Handbook', url: 'https://www.typescriptlang.org/docs/', type: 'documentation' },
    'Angular': { title: 'Angular Documentation', url: 'https://angular.io/docs', type: 'documentation' },
    'Vue': { title: 'Vue.js Guide', url: 'https://vuejs.org/guide/', type: 'documentation' },
    'Django': { title: 'Django Documentation', url: 'https://docs.djangoproject.com/', type: 'documentation' },
    'Flask': { title: 'Flask Documentation', url: 'https://flask.palletsprojects.com/', type: 'documentation' },
    'AWS': { title: 'AWS Documentation', url: 'https://docs.aws.amazon.com/', type: 'documentation' },
    'Docker': { title: 'Docker Documentation', url: 'https://docs.docker.com/', type: 'documentation' },
    'Kubernetes': { title: 'Kubernetes Documentation', url: 'https://kubernetes.io/docs/', type: 'documentation' }
  };
  
  return docs[skillName] || null;
}

/**
 * Generate personalized learning path
 * @param {Array} gaps - Skill gaps (missing + weak)
 * @param {Object} userProfile - User's current skills and experience
 * @returns {Object} Learning path recommendation
 */
export function generateLearningPath(gaps, userProfile) {
  // Sort gaps by priority
  const sortedGaps = [...gaps].sort((a, b) => b.priority - a.priority);
  
  // Group into phases based on difficulty and dependencies
  const phases = {
    foundation: [],
    intermediate: [],
    advanced: []
  };
  
  sortedGaps.forEach(gap => {
    // Determine which phase based on skill type and user's experience
    const phase = determinePhase(gap, userProfile);
    phases[phase].push(gap);
  });
  
  return {
    phases,
    estimatedDuration: calculateLearningDuration(phases),
    recommendations: generatePhaseRecommendations(phases)
  };
}

/**
 * Determine which learning phase a skill belongs to
 */
function determinePhase(skill, userProfile) {
  // If user has related skills in the same category, put in intermediate
  const hasRelated = userProfile.skills?.some(s => 
    s.category === categorizeSkill(skill.name) && 
    getLevelScore(s.level) >= 2
  );
  
  if (hasRelated) {
    return skill.importance === 'required' ? 'intermediate' : 'advanced';
  }
  
  return 'foundation';
}

/**
 * Categorize a skill name
 */
function categorizeSkill(skillName) {
  const categories = {
    'Technical': ['JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'MongoDB'],
    'Cloud': ['AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes'],
    'Soft Skills': ['Communication', 'Leadership', 'Problem Solving', 'Teamwork']
  };
  
  for (const [category, skills] of Object.entries(categories)) {
    if (skills.some(s => skillName.includes(s) || s.includes(skillName))) {
      return category;
    }
  }
  
  return 'Technical';
}

/**
 * Calculate estimated learning duration
 */
function calculateLearningDuration(phases) {
  const foundationTime = phases.foundation.length * 20; // 20 hours per foundation skill
  const intermediateTime = phases.intermediate.length * 15; // 15 hours per intermediate
  const advancedTime = phases.advanced.length * 10; // 10 hours per advanced
  
  const totalHours = foundationTime + intermediateTime + advancedTime;
  
  return {
    hours: totalHours,
    weeks: Math.ceil(totalHours / 10), // Assuming 10 hours/week study time
    breakdown: {
      foundation: foundationTime,
      intermediate: intermediateTime,
      advanced: advancedTime
    }
  };
}

/**
 * Generate recommendations for each phase
 */
function generatePhaseRecommendations(phases) {
  const recommendations = [];
  
  if (phases.foundation.length > 0) {
    recommendations.push({
      phase: 'foundation',
      title: 'Build Your Foundation',
      description: 'Start with these essential skills to build a strong base',
      skills: phases.foundation.slice(0, 3).map(s => s.name),
      priority: 'high'
    });
  }
  
  if (phases.intermediate.length > 0) {
    recommendations.push({
      phase: 'intermediate',
      title: 'Develop Core Competencies',
      description: 'Strengthen your skillset with these important capabilities',
      skills: phases.intermediate.slice(0, 3).map(s => s.name),
      priority: 'medium'
    });
  }
  
  if (phases.advanced.length > 0) {
    recommendations.push({
      phase: 'advanced',
      title: 'Stand Out Skills',
      description: 'Master these advanced skills to differentiate yourself',
      skills: phases.advanced.slice(0, 3).map(s => s.name),
      priority: 'low'
    });
  }
  
  return recommendations;
}

/**
 * Analyze skill gap trends across multiple jobs
 * @param {Array} jobs - Array of job documents
 * @param {Array} userSkills - User's current skills
 * @returns {Object} Trend analysis
 */
export function analyzeSkillTrends(jobs, userSkills) {
  const skillFrequency = {};
  const skillImportance = {};
  
  // Analyze all jobs
  jobs.forEach(job => {
    const jobSkills = extractJobSkills(job);
    jobSkills.forEach(skill => {
      const skillName = skill.name.toLowerCase();
      skillFrequency[skillName] = (skillFrequency[skillName] || 0) + 1;
      
      if (!skillImportance[skillName] || SKILL_IMPORTANCE[skill.importance] > SKILL_IMPORTANCE[skillImportance[skillName]]) {
        skillImportance[skillName] = skill.importance;
      }
    });
  });
  
  // Identify trending/high-demand skills
  const trending = Object.entries(skillFrequency)
    .map(([skill, frequency]) => ({
      skill,
      frequency,
      percentage: Math.round((frequency / jobs.length) * 100),
      importance: skillImportance[skill],
      hasSkill: userSkills.some(s => s.name.toLowerCase() === skill)
    }))
    .sort((a, b) => b.frequency - a.frequency);
  
  // Identify critical gaps (high-frequency skills user doesn't have)
  const criticalGaps = trending
    .filter(t => !t.hasSkill && t.frequency >= jobs.length * 0.5)
    .slice(0, 5);
  
  return {
    totalJobsAnalyzed: jobs.length,
    trending: trending.slice(0, 10),
    criticalGaps,
    recommendations: generateTrendRecommendations(trending, userSkills)
  };
}

/**
 * Generate recommendations based on trend analysis
 */
function generateTrendRecommendations(trending, userSkills) {
  const recommendations = [];
  
  // Find skills user has that are trending
  const strengths = trending.filter(t => t.hasSkill).slice(0, 3);
  if (strengths.length > 0) {
    recommendations.push({
      type: 'strength',
      message: `Your skills in ${strengths.map(s => s.skill).join(', ')} are in high demand`,
      skills: strengths
    });
  }
  
  // Find critical gaps
  const gaps = trending.filter(t => !t.hasSkill && t.frequency >= 3).slice(0, 3);
  if (gaps.length > 0) {
    recommendations.push({
      type: 'gap',
      message: `Consider learning ${gaps.map(s => s.skill).join(', ')} - these appear frequently`,
      skills: gaps
    });
  }
  
  return recommendations;
}
