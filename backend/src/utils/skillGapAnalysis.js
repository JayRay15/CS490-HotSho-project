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
  const skillSet = new Set(); // Track unique skills

  // Extract from requirements array
  if (job.requirements && Array.isArray(job.requirements) && job.requirements.length > 0) {
    job.requirements.forEach(req => {
      if (!req || typeof req !== 'string') return; // Skip invalid requirements

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
        const skillKey = skill.toLowerCase();
        if (!skillSet.has(skillKey)) {
          skillSet.add(skillKey);
          skills.push({
            name: skill,
            importance,
            source: 'requirements'
          });
        }
      });
    });
  }

  // Extract from description
  if (job.description) {
    const descSkills = extractSkillKeywords(job.description);
    descSkills.forEach(skill => {
      const skillKey = skill.toLowerCase();
      if (!skillSet.has(skillKey)) {
        skillSet.add(skillKey);
        skills.push({
          name: skill,
          importance: 'preferred',
          source: 'description'
        });
      }
    });
  }

  // Extract from title (sometimes skills are mentioned there)
  if (job.title) {
    const titleSkills = extractSkillKeywords(job.title);
    titleSkills.forEach(skill => {
      const skillKey = skill.toLowerCase();
      if (!skillSet.has(skillKey)) {
        skillSet.add(skillKey);
        skills.push({
          name: skill,
          importance: 'required',
          source: 'title'
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
  // Comprehensive technical and professional skills dictionary
  const skillDictionary = [
    // Programming Languages
    'JavaScript', 'Python', 'Java', 'C++', 'C#', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Go', 'Rust', 'TypeScript',
    'SQL', 'R', 'Scala', 'Perl', 'MATLAB', 'Objective-C', 'Dart', 'Elixir', 'Haskell', 'Clojure', 'F#',
    'Visual Basic', 'VBA', 'Assembly', 'COBOL', 'Fortran', 'Lisp', 'Prolog', 'Groovy', 'Lua', 'Julia',
    'C', 'HTML', 'CSS', 'SASS', 'LESS', 'Bash', 'Shell', 'PowerShell',

    // Frameworks & Libraries - Frontend
    'React', 'React.js', 'Angular', 'Vue', 'Vue.js', 'Svelte', 'Next.js', 'Nuxt.js', 'Gatsby', 'Ember.js',
    'Backbone.js', 'jQuery', 'Bootstrap', 'Tailwind', 'Material-UI', 'Ant Design', 'Chakra UI',
    'Semantic UI', 'Bulma', 'Foundation', 'Alpine.js', 'Stimulus', 'Preact',

    // Frameworks & Libraries - Backend
    'Node.js', 'Express', 'Express.js', 'Django', 'Flask', 'FastAPI', 'Spring', 'Spring Boot', 'Laravel',
    '.NET', 'ASP.NET', 'Ruby on Rails', 'Rails', 'Phoenix', 'Symfony', 'CodeIgniter', 'CakePHP',
    'Nest.js', 'Koa', 'Hapi', 'Adonis.js', 'Sails.js', 'Meteor',

    // Mobile Development
    'React Native', 'Flutter', 'Ionic', 'Xamarin', 'Cordova', 'PhoneGap', 'SwiftUI', 'Android SDK',

    // Data Science & ML
    'TensorFlow', 'PyTorch', 'Keras', 'Scikit-learn', 'Pandas', 'NumPy', 'SciPy', 'Matplotlib',
    'Seaborn', 'Plotly', 'NLTK', 'spaCy', 'OpenCV', 'Jupyter', 'Apache Spark', 'Hadoop',

    // Databases - SQL
    'MySQL', 'PostgreSQL', 'Microsoft SQL Server', 'Oracle', 'SQLite', 'MariaDB', 'Amazon Aurora',

    // Databases - NoSQL
    'MongoDB', 'Cassandra', 'CouchDB', 'Redis', 'Memcached', 'DynamoDB', 'Neo4j', 'ArangoDB',
    'Couchbase', 'Elasticsearch', 'Apache Solr',

    // Cloud & Infrastructure
    'AWS', 'Amazon Web Services', 'Azure', 'Microsoft Azure', 'Google Cloud', 'GCP', 'IBM Cloud',
    'DigitalOcean', 'Heroku', 'Vercel', 'Netlify', 'Cloudflare',
    'EC2', 'S3', 'Lambda', 'RDS', 'CloudWatch', 'CloudFront', 'ECS', 'EKS',

    // DevOps & CI/CD
    'Docker', 'Kubernetes', 'K8s', 'Jenkins', 'GitLab CI', 'GitHub Actions', 'CircleCI', 'Travis CI',
    'Terraform', 'Ansible', 'Chef', 'Puppet', 'Vagrant', 'Nginx', 'Apache', 'IIS',
    'ArgoCD', 'Spinnaker', 'Bamboo', 'TeamCity',

    // Version Control
    'Git', 'GitHub', 'GitLab', 'Bitbucket', 'SVN', 'Mercurial', 'Perforce',

    // Testing
    'Jest', 'Mocha', 'Jasmine', 'Cypress', 'Selenium', 'Playwright', 'Puppeteer', 'JUnit', 'TestNG',
    'PyTest', 'RSpec', 'PHPUnit', 'Karma', 'Protractor', 'Enzyme', 'React Testing Library',

    // API & Integration
    'REST API', 'RESTful', 'GraphQL', 'SOAP', 'gRPC', 'WebSocket', 'OAuth', 'JWT', 'API Gateway',
    'Postman', 'Swagger', 'OpenAPI',

    // Project Management & Collaboration
    'Jira', 'Confluence', 'Trello', 'Asana', 'Monday.com', 'Slack', 'Microsoft Teams', 'Zoom',
    'Notion', 'ClickUp', 'Basecamp', 'Wrike',

    // Design & Prototyping
    'Figma', 'Sketch', 'Adobe XD', 'InVision', 'Zeplin', 'Abstract', 'Photoshop', 'Illustrator',
    'InDesign', 'After Effects', 'Premiere Pro', 'Lightroom', 'Canva', 'CorelDRAW',

    // Business Intelligence & Analytics
    'Tableau', 'Power BI', 'PowerBI', 'Looker', 'QlikView', 'Qlik Sense', 'Sisense', 'Domo',
    'Google Analytics', 'Mixpanel', 'Amplitude', 'Segment', 'Excel', 'Google Sheets',

    // CRM & Sales
    'Salesforce', 'HubSpot', 'Zoho', 'Pipedrive', 'Monday Sales CRM', 'SAP', 'Oracle CRM',

    // Methodologies & Practices
    'Agile', 'Scrum', 'Kanban', 'Lean', 'Waterfall', 'DevOps', 'CI/CD', 'TDD', 'BDD', 'DDD',
    'Microservices', 'Monolithic', 'Event-Driven', 'Service-Oriented Architecture', 'SOA',
    'Clean Code', 'SOLID', 'Design Patterns', 'Responsive Design', 'Mobile-First',

    // Security
    'Cybersecurity', 'Penetration Testing', 'Ethical Hacking', 'OWASP', 'SSL/TLS', 'VPN',
    'Firewall', 'Encryption', 'OAuth 2.0', 'SAML', 'Active Directory', 'LDAP', 'PKI',

    // Blockchain & Web3
    'Blockchain', 'Ethereum', 'Smart Contracts', 'Solidity', 'Web3', 'NFT', 'DeFi', 'Cryptocurrency',

    // Other Technologies
    'Linux', 'Unix', 'Windows Server', 'MacOS', 'Android', 'iOS', 'Raspberry Pi',
    'Arduino', 'IoT', 'Edge Computing', '5G', 'WebRTC', 'WebAssembly',

    // Soft Skills & Leadership
    'Communication', 'Leadership', 'Problem Solving', 'Critical Thinking', 'Teamwork',
    'Time Management', 'Adaptability', 'Creativity', 'Innovation', 'Attention to Detail',
    'Project Management', 'Stakeholder Management', 'Strategic Planning', 'Decision Making',
    'Conflict Resolution', 'Mentoring', 'Coaching', 'Presentation Skills', 'Negotiation',
    'Analytical Skills', 'Research', 'Documentation', 'Technical Writing',

    // Domain Expertise
    'Machine Learning', 'Artificial Intelligence', 'Deep Learning', 'Natural Language Processing',
    'Computer Vision', 'Data Analysis', 'Data Science', 'Big Data', 'Data Engineering',
    'Financial Analysis', 'Risk Management', 'Compliance', 'Regulatory', 'Accounting',
    'SEO', 'SEM', 'Digital Marketing', 'Content Marketing', 'Social Media Marketing',
    'Email Marketing', 'Marketing Automation', 'Content Strategy', 'Copywriting', 'Brand Management',
    'UI/UX', 'User Experience', 'User Interface', 'Product Design', 'Product Management',
    'Business Analysis', 'Requirements Gathering', 'Process Improvement', 'Six Sigma', 'Lean Six Sigma'
  ];

  const foundSkills = [];
  const textLower = text.toLowerCase();

  // Search for skills from dictionary
  skillDictionary.forEach(skill => {
    // Use word boundaries to avoid partial matches
    const regex = new RegExp(`\\b${skill.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(textLower)) {
      foundSkills.push(skill);
    }
  });

  // Also extract skills from common patterns like "Experience with X" or "Knowledge of Y"
  const patterns = [
    /(?:experience with|proficient in|skilled in|expertise in|knowledge of|familiar with|working knowledge of)\s+([A-Za-z0-9+#\s./-]+?)(?:\s*(?:and|or|,|\.|;|\n|$))/gi,
    /(?:strong|solid|deep|thorough)\s+(?:understanding|knowledge|experience)\s+(?:of|in|with)\s+([A-Za-z0-9+#\s./-]+?)(?:\s*(?:and|or|,|\.|;|\n|$))/gi,
    /(?:must have|should have|required|requires)\s+(?:experience with|knowledge of)\s+([A-Za-z0-9+#\s./-]+?)(?:\s*(?:and|or|,|\.|;|\n|$))/gi,
  ];

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const extractedSkill = match[1].trim();
      // Only add if it's not too long (likely not a sentence) and not already found
      if (extractedSkill.length > 1 && extractedSkill.length < 50 &&
        !foundSkills.some(s => s.toLowerCase() === extractedSkill.toLowerCase())) {
        // Check if it contains any known skill from dictionary
        const containsKnownSkill = skillDictionary.some(skill =>
          extractedSkill.toLowerCase().includes(skill.toLowerCase())
        );
        if (containsKnownSkill) {
          foundSkills.push(extractedSkill);
        }
      }
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
