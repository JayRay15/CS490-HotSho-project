/**
 * Profile Completeness Calculation Utility
 * Calculates profile completion percentage, provides suggestions, and awards badges
 */

// Industry benchmarks for profile completeness
export const INDUSTRY_BENCHMARKS = {
  Technology: { average: 75, excellent: 90 },
  Healthcare: { average: 70, excellent: 85 },
  Finance: { average: 72, excellent: 88 },
  Education: { average: 68, excellent: 82 },
  Construction: { average: 65, excellent: 80 },
  'Real Estate': { average: 67, excellent: 83 }
};

// Section weights (total must equal 100)
const SECTION_WEIGHTS = {
  basicInfo: 20,
  professionalInfo: 15,
  employment: 20,
  education: 15,
  skills: 15,
  projects: 10,
  certifications: 5
};

// Tips and best practices for each section
export const SECTION_TIPS = {
  basicInfo: {
    title: 'Basic Information',
    tips: [
      'Use a professional profile picture with good lighting',
      'Provide a valid phone number for better networking opportunities',
      'Include your city and state to help with local opportunities',
      'Add professional social media links (LinkedIn, GitHub, personal website)'
    ]
  },
  professionalInfo: {
    title: 'Professional Information',
    tips: [
      'Craft a compelling headline that summarizes your expertise (e.g., "Senior Full-Stack Developer | React & Node.js Expert")',
      'Write a bio that highlights your unique value proposition in 2-3 sentences',
      'Select the industry that best matches your expertise',
      'Be honest about your experience level - it helps with matching opportunities'
    ]
  },
  employment: {
    title: 'Employment History',
    tips: [
      'List at least 2-3 recent positions for a complete work history',
      'Include detailed descriptions of your responsibilities and achievements',
      'Use action verbs and quantify accomplishments when possible',
      'Keep current position marked as "Current Position" for accuracy'
    ]
  },
  education: {
    title: 'Education',
    tips: [
      'Add at least one education entry, even if self-taught',
      'Include relevant coursework, honors, and achievements',
      'If you have a strong GPA (3.5+), consider making it public',
      'List online certifications and bootcamps under education'
    ]
  },
  skills: {
    title: 'Skills',
    tips: [
      'Aim for 8-12 skills to show breadth without overwhelming',
      'Organize skills by category (Technical, Soft Skills, Languages)',
      'Be honest about proficiency levels - they help set expectations',
      'Include both hard skills (technical) and soft skills (communication, leadership)'
    ]
  },
  projects: {
    title: 'Projects',
    tips: [
      'Showcase 2-4 of your best projects to demonstrate practical experience',
      'Include project descriptions, technologies used, and your role',
      'Add live demo links or GitHub repositories when available',
      'Highlight projects that align with your career goals'
    ]
  },
  certifications: {
    title: 'Certifications',
    tips: [
      'Add industry-recognized certifications to boost credibility',
      'Keep certifications up-to-date and renew before expiration',
      'Include certification IDs for verification purposes',
      'Upload certificate documents for authenticity'
    ]
  }
};

// Achievement badges
export const BADGES = [
  {
    id: 'profile-starter',
    name: 'Profile Starter',
    description: 'Complete your basic profile information',
    threshold: 25,
    icon: '🌱'
  },
  {
    id: 'halfway-there',
    name: 'Halfway There',
    description: 'Reach 50% profile completion',
    threshold: 50,
    icon: '📈'
  },
  {
    id: 'almost-complete',
    name: 'Almost Complete',
    description: 'Reach 75% profile completion',
    threshold: 75,
    icon: '🎯'
  },
  {
    id: 'profile-master',
    name: 'Profile Master',
    description: 'Complete your entire profile (90%+)',
    threshold: 90,
    icon: '🏆'
  },
  {
    id: 'work-history',
    name: 'Work History Pro',
    description: 'Add at least 3 employment entries',
    threshold: 'custom',
    check: (data) => (data.employment?.length || 0) >= 3,
    icon: '💼'
  },
  {
    id: 'skill-master',
    name: 'Skill Master',
    description: 'Add at least 10 skills',
    threshold: 'custom',
    check: (data) => (data.skills?.length || 0) >= 10,
    icon: '⚡'
  },
  {
    id: 'project-showcase',
    name: 'Project Showcase',
    description: 'Add at least 3 projects',
    threshold: 'custom',
    check: (data) => {
      try {
        const projects = JSON.parse(localStorage.getItem('projects') || '[]');
        return projects.length >= 3;
      } catch {
        return false;
      }
    },
    icon: '🚀'
  },
  {
    id: 'certified-professional',
    name: 'Certified Professional',
    description: 'Add at least 2 certifications',
    threshold: 'custom',
    check: (data) => {
      try {
        const certs = JSON.parse(localStorage.getItem('certifications') || '[]');
        return certs.length >= 2;
      } catch {
        return false;
      }
    },
    icon: '📜'
  }
];

/**
 * Calculate basic information completeness
 */
function calculateBasicInfoScore(userData) {
  const fields = [
    { key: 'name', weight: 30, required: true },
    { key: 'email', weight: 30, required: true },
    { key: 'picture', weight: 15, required: false },
    { key: 'phone', weight: 10, required: false },
    { key: 'location', weight: 10, required: false },
    { key: 'linkedin', weight: 2.5, required: false },
    { key: 'github', weight: 2.5, required: false },
    { key: 'website', weight: 5, required: false }
  ];

  let score = 0;
  const missing = [];
  const optional = [];

  fields.forEach(field => {
    const value = userData[field.key];
    const hasValue = value && value.toString().trim().length > 0;
    
    if (hasValue) {
      score += field.weight;
    } else {
      if (field.required) {
        missing.push({ field: field.key, weight: field.weight });
      } else {
        optional.push({ field: field.key, weight: field.weight });
      }
    }
  });

  return { score, missing, optional };
}

/**
 * Calculate professional information completeness
 */
function calculateProfessionalInfoScore(userData) {
  const fields = [
    { key: 'headline', weight: 35, required: true },
    { key: 'industry', weight: 25, required: true },
    { key: 'experienceLevel', weight: 25, required: true },
    { key: 'bio', weight: 15, required: false }
  ];

  let score = 0;
  const missing = [];
  const optional = [];

  fields.forEach(field => {
    const value = userData[field.key];
    const hasValue = value && value.toString().trim().length > 0;
    
    if (hasValue) {
      score += field.weight;
    } else {
      if (field.required) {
        missing.push({ field: field.key, weight: field.weight });
      } else {
        optional.push({ field: field.key, weight: field.weight });
      }
    }
  });

  return { score, missing, optional };
}

/**
 * Calculate employment history completeness
 */
function calculateEmploymentScore(userData) {
  const employment = userData.employment || [];
  
  if (employment.length === 0) {
    return {
      score: 0,
      missing: [{ field: 'employment', weight: 100 }],
      optional: []
    };
  }

  // Base score for having employment entries
  let score = 40;
  const optional = [];

  // Additional points for multiple entries (up to 3)
  if (employment.length >= 2) score += 20;
  if (employment.length >= 3) score += 15;

  // Points for detailed descriptions
  const withDescriptions = employment.filter(e => e.description && e.description.length > 50);
  score += Math.min(25, (withDescriptions.length / employment.length) * 25);

  // Check if optional fields are missing
  const missingDescriptions = employment.length - withDescriptions.length;
  if (missingDescriptions > 0) {
    optional.push({ 
      field: 'employment descriptions', 
      count: missingDescriptions,
      weight: 25 
    });
  }

  if (employment.length < 2) {
    optional.push({ field: 'additional employment entries', count: 2 - employment.length, weight: 20 });
  }

  return { score: Math.min(100, score), missing: [], optional };
}

/**
 * Calculate education completeness
 */
function calculateEducationScore(userData) {
  const education = userData.education || [];
  
  if (education.length === 0) {
    return {
      score: 0,
      missing: [{ field: 'education', weight: 100 }],
      optional: []
    };
  }

  let score = 60; // Base score for having at least one entry
  const optional = [];

  // Additional points for multiple entries
  if (education.length >= 2) score += 20;

  // Points for detailed information
  const withAchievements = education.filter(e => e.achievements && e.achievements.length > 20);
  score += Math.min(20, (withAchievements.length / education.length) * 20);

  // Check optional fields
  if (education.length < 2) {
    optional.push({ field: 'additional education entries', count: 2 - education.length, weight: 20 });
  }

  const missingAchievements = education.length - withAchievements.length;
  if (missingAchievements > 0) {
    optional.push({ 
      field: 'education achievements/honors', 
      count: missingAchievements,
      weight: 20 
    });
  }

  return { score: Math.min(100, score), missing: [], optional };
}

/**
 * Calculate skills completeness
 */
function calculateSkillsScore(userData) {
  const skills = userData.skills || [];
  
  if (skills.length === 0) {
    return {
      score: 0,
      missing: [{ field: 'skills', weight: 100 }],
      optional: []
    };
  }

  let score = 30; // Base score for having skills
  const optional = [];

  // Progressive scoring based on number of skills
  if (skills.length >= 5) score += 20;
  if (skills.length >= 8) score += 20;
  if (skills.length >= 12) score += 15;

  // Points for skill diversity (multiple categories)
  const categories = new Set(skills.map(s => s.category));
  score += Math.min(15, categories.size * 5);

  // Check if optimal number is reached
  if (skills.length < 8) {
    optional.push({ field: 'skills', count: 8 - skills.length, weight: 40 });
  }

  if (categories.size < 3) {
    optional.push({ field: 'skill categories', count: 3 - categories.size, weight: 15 });
  }

  return { score: Math.min(100, score), missing: [], optional };
}

/**
 * Calculate projects completeness
 */
function calculateProjectsScore() {
  try {
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    
    if (projects.length === 0) {
      return {
        score: 0,
        missing: [],
        optional: [{ field: 'projects', weight: 100 }]
      };
    }

    let score = 40; // Base score
    const optional = [];

    if (projects.length >= 2) score += 30;
    if (projects.length >= 3) score += 20;

    // Points for detailed projects (with URLs)
    const withUrls = projects.filter(p => p.projectUrl && p.projectUrl.length > 0);
    score += Math.min(10, (withUrls.length / projects.length) * 10);

    if (projects.length < 3) {
      optional.push({ field: 'additional projects', count: 3 - projects.length, weight: 50 });
    }

    return { score: Math.min(100, score), missing: [], optional };
  } catch {
    return { score: 0, missing: [], optional: [{ field: 'projects', weight: 100 }] };
  }
}

/**
 * Calculate certifications completeness
 */
function calculateCertificationsScore() {
  try {
    const certifications = JSON.parse(localStorage.getItem('certifications') || '[]');
    
    if (certifications.length === 0) {
      return {
        score: 0,
        missing: [],
        optional: [{ field: 'certifications', weight: 100 }]
      };
    }

    let score = 50; // Base score
    const optional = [];

    if (certifications.length >= 2) score += 30;
    if (certifications.length >= 3) score += 20;

    if (certifications.length < 2) {
      optional.push({ field: 'additional certifications', count: 2 - certifications.length, weight: 50 });
    }

    return { score: Math.min(100, score), missing: [], optional };
  } catch {
    return { score: 0, missing: [], optional: [{ field: 'certifications', weight: 100 }] };
  }
}

/**
 * Main function to calculate overall profile completeness
 */
export function calculateProfileCompleteness(userData) {
  const sections = {
    basicInfo: calculateBasicInfoScore(userData),
    professionalInfo: calculateProfessionalInfoScore(userData),
    employment: calculateEmploymentScore(userData),
    education: calculateEducationScore(userData),
    skills: calculateSkillsScore(userData),
    projects: calculateProjectsScore(),
    certifications: calculateCertificationsScore()
  };

  // Calculate weighted overall score
  let overallScore = 0;
  Object.keys(sections).forEach(key => {
    overallScore += (sections[key].score / 100) * SECTION_WEIGHTS[key];
  });

  // Generate suggestions
  const suggestions = generateSuggestions(sections);

  // Check earned badges
  const earnedBadges = BADGES.filter(badge => {
    if (badge.threshold === 'custom') {
      return badge.check(userData);
    }
    return overallScore >= badge.threshold;
  });

  // Calculate industry comparison
  const industry = userData.industry || 'Technology';
  const benchmark = INDUSTRY_BENCHMARKS[industry] || INDUSTRY_BENCHMARKS.Technology;
  
  let industryComparison = 'Below Average';
  if (overallScore >= benchmark.excellent) {
    industryComparison = 'Excellent';
  } else if (overallScore >= benchmark.average) {
    industryComparison = 'Above Average';
  }

  return {
    overallScore: Math.round(overallScore),
    sections,
    suggestions,
    earnedBadges,
    industryComparison,
    benchmark
  };
}

/**
 * Generate prioritized suggestions for profile improvement
 */
function generateSuggestions(sections) {
  const suggestions = [];

  Object.keys(sections).forEach(sectionKey => {
    const section = sections[sectionKey];
    const sectionName = SECTION_TIPS[sectionKey]?.title || sectionKey;

    // Add suggestions for missing required fields
    section.missing.forEach(item => {
      suggestions.push({
        priority: 'high',
        section: sectionKey,
        message: `Add ${item.field} (Required)`,
        impact: Math.round((item.weight / 100) * SECTION_WEIGHTS[sectionKey] * 10) / 10
      });
    });

    // Add suggestions for optional fields
    section.optional.forEach(item => {
      const fieldName = item.count ? `${item.count} more ${item.field}` : item.field;
      suggestions.push({
        priority: 'medium',
        section: sectionKey,
        message: `Add ${fieldName} (Optional)`,
        impact: Math.round((item.weight / 100) * SECTION_WEIGHTS[sectionKey] * 10) / 10
      });
    });
  });

  // Sort by impact (highest first)
  return suggestions.sort((a, b) => {
    if (a.priority === 'high' && b.priority !== 'high') return -1;
    if (a.priority !== 'high' && b.priority === 'high') return 1;
    return b.impact - a.impact;
  });
}

/**
 * Get profile strength label based on score
 */
export function getProfileStrength(score) {
  if (score >= 90) return { label: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' };
  if (score >= 75) return { label: 'Strong', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' };
  if (score >= 50) return { label: 'Good', color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' };
  if (score >= 25) return { label: 'Fair', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' };
  return { label: 'Needs Work', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' };
}

/**
 * Format field name for display
 */
export function formatFieldName(field) {
  const fieldMap = {
    'name': 'Full Name',
    'email': 'Email Address',
    'picture': 'Profile Picture',
    'phone': 'Phone Number',
    'location': 'Location',
    'headline': 'Professional Headline',
    'bio': 'Professional Bio',
    'industry': 'Industry',
    'experienceLevel': 'Experience Level',
    'linkedin': 'LinkedIn Profile',
    'github': 'GitHub Profile',
    'website': 'Personal Website',
    'employment': 'Employment History',
    'education': 'Education',
    'skills': 'Skills',
    'projects': 'Projects',
    'certifications': 'Certifications'
  };
  
  return fieldMap[field] || field;
}
