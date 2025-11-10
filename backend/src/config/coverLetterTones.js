/**
 * Cover Letter Tone and Style Configuration
 * Comprehensive settings for tone, industry, company culture, length, and writing style
 */

export const TONE_OPTIONS = {
  formal: {
    name: 'Formal',
    description: 'Professional, traditional, and respectful tone',
    characteristics: [
      'Traditional business language',
      'Respectful and professional vocabulary',
      'Structured and organized format',
      'Conservative expressions',
      'Third-person or neutral perspective where appropriate'
    ],
    guidelines: 'Use formal language, avoid contractions, maintain professional distance, use complete sentences, and follow traditional business letter conventions.'
  },
  casual: {
    name: 'Casual',
    description: 'Friendly, approachable, and conversational tone',
    characteristics: [
      'Conversational language',
      'Approachable and personable',
      'Some contractions acceptable',
      'Warm and friendly expressions',
      'First-person narrative'
    ],
    guidelines: 'Write in a friendly, conversational manner while maintaining professionalism. Use contractions naturally, show personality, and create a connection with the reader.'
  },
  enthusiastic: {
    name: 'Enthusiastic',
    description: 'Energetic, passionate, and highly motivated tone',
    characteristics: [
      'Energetic and vibrant language',
      'Passionate expressions of interest',
      'Strong positive vocabulary',
      'Dynamic action verbs',
      'Excitement about opportunities'
    ],
    guidelines: 'Express genuine excitement and passion for the role and company. Use energetic language, show enthusiasm through word choice, and convey strong motivation without being overly casual.'
  },
  analytical: {
    name: 'Analytical',
    description: 'Data-driven, logical, and detail-oriented tone',
    characteristics: [
      'Data-driven statements',
      'Quantifiable achievements',
      'Logical progression of ideas',
      'Technical precision',
      'Results-focused language'
    ],
    guidelines: 'Focus on metrics, data, and concrete results. Use precise language, include quantifiable achievements, emphasize analytical thinking, and provide specific examples with numbers and outcomes.'
  },
  creative: {
    name: 'Creative',
    description: 'Expressive, engaging, and personality-driven tone',
    characteristics: [
      'Unique and memorable expressions',
      'Storytelling elements',
      'Creative metaphors or analogies',
      'Personal brand emphasis',
      'Engaging narrative flow'
    ],
    guidelines: 'Tell a compelling story, use creative expressions while maintaining professionalism, show unique personality, and craft memorable opening and closing statements.'
  },
  technical: {
    name: 'Technical',
    description: 'Precise, detail-oriented, with technical terminology',
    characteristics: [
      'Technical terminology and jargon',
      'Specific tools and technologies',
      'Methodologies and frameworks',
      'Detailed technical explanations',
      'Industry-specific language'
    ],
    guidelines: 'Use appropriate technical terminology, reference specific technologies and methodologies, demonstrate technical depth, and show expertise through precise language.'
  },
  executive: {
    name: 'Executive',
    description: 'Strategic, leadership-focused, and high-level tone',
    characteristics: [
      'Strategic vision and thinking',
      'Leadership accomplishments',
      'High-level business impact',
      'Organization-wide perspective',
      'Decision-making authority'
    ],
    guidelines: 'Focus on strategic impact, leadership experience, business outcomes, and organizational vision. Use executive-level language and emphasize high-level decision making.'
  }
};

export const INDUSTRY_SETTINGS = {
  technology: {
    name: 'Technology',
    keywords: ['innovation', 'scalability', 'agile', 'development', 'digital transformation', 'cutting-edge', 'optimization'],
    terminology: ['API', 'framework', 'architecture', 'deployment', 'infrastructure', 'integration', 'algorithm'],
    focus: 'Technical skills, innovation, problem-solving, and adaptability to emerging technologies'
  },
  finance: {
    name: 'Finance',
    keywords: ['compliance', 'risk management', 'analysis', 'regulatory', 'strategic planning', 'portfolio', 'stakeholder'],
    terminology: ['ROI', 'P&L', 'forecasting', 'analytics', 'due diligence', 'audit', 'fiduciary'],
    focus: 'Analytical skills, attention to detail, regulatory knowledge, and financial acumen'
  },
  healthcare: {
    name: 'Healthcare',
    keywords: ['patient care', 'clinical', 'compliance', 'quality improvement', 'evidence-based', 'collaborative', 'compassionate'],
    terminology: ['EHR', 'HIPAA', 'protocols', 'outcomes', 'treatment', 'diagnosis', 'interdisciplinary'],
    focus: 'Patient outcomes, clinical expertise, regulatory compliance, and collaborative care'
  },
  marketing: {
    name: 'Marketing',
    keywords: ['brand', 'campaign', 'engagement', 'creative', 'data-driven', 'storytelling', 'audience'],
    terminology: ['ROI', 'conversion', 'analytics', 'segmentation', 'attribution', 'KPI', 'funnel'],
    focus: 'Creativity, data analysis, brand awareness, and measurable business impact'
  },
  education: {
    name: 'Education',
    keywords: ['learning', 'student-centered', 'curriculum', 'development', 'assessment', 'inclusive', 'mentorship'],
    terminology: ['pedagogy', 'differentiation', 'outcomes', 'engagement', 'standards', 'assessment', 'intervention'],
    focus: 'Teaching excellence, student success, curriculum development, and educational innovation'
  },
  sales: {
    name: 'Sales',
    keywords: ['revenue', 'relationships', 'pipeline', 'growth', 'targets', 'closing', 'client-focused'],
    terminology: ['quota', 'forecasting', 'prospecting', 'CRM', 'pipeline', 'territory', 'upselling'],
    focus: 'Results achievement, relationship building, revenue growth, and client satisfaction'
  },
  consulting: {
    name: 'Consulting',
    keywords: ['strategy', 'solutions', 'transformation', 'advisory', 'implementation', 'stakeholder', 'insights'],
    terminology: ['deliverables', 'engagement', 'frameworks', 'analysis', 'recommendations', 'methodology', 'stakeholder management'],
    focus: 'Problem-solving, strategic thinking, client impact, and business transformation'
  },
  engineering: {
    name: 'Engineering',
    keywords: ['design', 'optimization', 'efficiency', 'precision', 'testing', 'quality', 'systems'],
    terminology: ['specifications', 'prototyping', 'CAD', 'testing', 'validation', 'tolerances', 'manufacturing'],
    focus: 'Technical expertise, problem-solving, quality standards, and engineering principles'
  },
  creative: {
    name: 'Creative/Design',
    keywords: ['innovative', 'visual', 'brand', 'user-centered', 'aesthetic', 'storytelling', 'concept'],
    terminology: ['UX/UI', 'portfolio', 'mockups', 'wireframes', 'brand identity', 'typography', 'composition'],
    focus: 'Creative vision, portfolio work, design thinking, and user experience'
  },
  general: {
    name: 'General/Other',
    keywords: ['professional', 'collaborative', 'results-driven', 'organized', 'adaptable', 'skilled', 'dedicated'],
    terminology: [],
    focus: 'Professional skills, adaptability, teamwork, and achievement-oriented mindset'
  }
};

export const COMPANY_CULTURE = {
  startup: {
    name: 'Startup',
    description: 'Fast-paced, innovative, entrepreneurial environment',
    characteristics: [
      'Agility and adaptability',
      'Wearing multiple hats',
      'Innovation and creativity',
      'Risk-taking and experimentation',
      'Fast decision-making',
      'Collaborative and flat hierarchy'
    ],
    language: 'Emphasize adaptability, innovation, entrepreneurial mindset, ability to work in ambiguity, multi-tasking capabilities, and passion for building something new.'
  },
  corporate: {
    name: 'Corporate',
    description: 'Established, structured, process-oriented environment',
    characteristics: [
      'Established processes and procedures',
      'Professional development',
      'Clear roles and responsibilities',
      'Cross-functional collaboration',
      'Long-term strategic planning',
      'Organizational excellence'
    ],
    language: 'Emphasize professionalism, experience with established processes, cross-functional collaboration, strategic thinking, and ability to work within organizational structures.'
  },
  enterprise: {
    name: 'Enterprise',
    description: 'Large-scale operations, global presence, complex systems',
    characteristics: [
      'Scale and complexity',
      'Global perspective',
      'Enterprise-wide impact',
      'System integration',
      'Stakeholder management',
      'Governance and compliance'
    ],
    language: 'Emphasize experience with large-scale systems, global perspective, managing complexity, stakeholder alignment, and enterprise-level impact.'
  },
  agency: {
    name: 'Agency',
    description: 'Client-focused, project-based, deadline-driven environment',
    characteristics: [
      'Client relationship management',
      'Multiple simultaneous projects',
      'Deadline management',
      'Creative problem-solving',
      'Presentation and communication',
      'Diverse industry exposure'
    ],
    language: 'Emphasize client management skills, ability to juggle multiple projects, creative solutions, deadline-driven performance, and diverse experience.'
  },
  nonprofit: {
    name: 'Nonprofit',
    description: 'Mission-driven, community-focused, impact-oriented',
    characteristics: [
      'Mission alignment',
      'Community impact',
      'Resource optimization',
      'Stakeholder engagement',
      'Passion for cause',
      'Measurable social impact'
    ],
    language: 'Emphasize mission alignment, community impact, resourcefulness, passion for the cause, and commitment to making a difference.'
  },
  remote: {
    name: 'Remote-First',
    description: 'Distributed team, digital collaboration, autonomous work',
    characteristics: [
      'Self-motivation',
      'Digital communication',
      'Time management',
      'Remote collaboration tools',
      'Asynchronous work',
      'Results-oriented'
    ],
    language: 'Emphasize self-motivation, remote work experience, digital collaboration skills, time management, and results-driven performance.'
  }
};

export const LENGTH_OPTIONS = {
  brief: {
    name: 'Brief',
    description: 'Concise and to the point (250-300 words)',
    wordCount: { min: 250, max: 300 },
    paragraphs: 3,
    guidelines: 'Keep it concise. Focus on the most impactful points only. Each paragraph should be short and punchy. Eliminate any redundant information.'
  },
  standard: {
    name: 'Standard',
    description: 'Balanced coverage of qualifications (300-400 words)',
    wordCount: { min: 300, max: 400 },
    paragraphs: 4,
    guidelines: 'Provide comprehensive coverage of key qualifications. Include specific examples and achievements. Balance between detail and brevity.'
  },
  detailed: {
    name: 'Detailed',
    description: 'Comprehensive with extensive examples (400-500 words)',
    wordCount: { min: 400, max: 500 },
    paragraphs: 5,
    guidelines: 'Provide detailed coverage of qualifications with multiple examples. Include comprehensive achievements and specific metrics. Allow for deeper exploration of relevant experience.'
  }
};

export const WRITING_STYLE = {
  direct: {
    name: 'Direct',
    description: 'Straightforward, clear, action-oriented statements',
    characteristics: [
      'Clear and concise sentences',
      'Active voice predominant',
      'Strong action verbs',
      'Minimal adjectives',
      'Gets to the point quickly'
    ],
    guidelines: 'Use short, punchy sentences. Start sentences with strong action verbs. Avoid flowery language. State facts and achievements directly.'
  },
  narrative: {
    name: 'Narrative',
    description: 'Story-driven, contextual, journey-focused',
    characteristics: [
      'Storytelling elements',
      'Context and background',
      'Career journey',
      'Connecting experiences',
      'Flow and progression'
    ],
    guidelines: 'Tell a cohesive story of your career journey. Connect experiences with narrative flow. Provide context for achievements. Show progression and growth.'
  },
  hybrid: {
    name: 'Hybrid',
    description: 'Combination of narrative and direct elements',
    characteristics: [
      'Balance of story and facts',
      'Context with clear statements',
      'Achievements with narrative',
      'Varied sentence structure',
      'Engaging yet concise'
    ],
    guidelines: 'Combine storytelling with direct statements. Provide context where needed but keep statements clear. Use varied sentence structure for engagement.'
  }
};

/**
 * Validate tone consistency and provide warnings
 */
export function validateToneConsistency(tone, industry, companyCulture) {
  const warnings = [];
  
  // Formal tone warnings
  if (tone === 'formal') {
    if (companyCulture === 'startup') {
      warnings.push('Formal tone with startup culture: Consider using a more casual or enthusiastic tone for better cultural fit.');
    }
  }
  
  // Casual tone warnings
  if (tone === 'casual') {
    if (industry === 'finance' || industry === 'healthcare') {
      warnings.push('Casual tone in conservative industry: Consider using a more formal or professional tone.');
    }
    if (companyCulture === 'corporate' || companyCulture === 'enterprise') {
      warnings.push('Casual tone with corporate culture: Consider balancing with professional language.');
    }
  }
  
  // Creative tone warnings
  if (tone === 'creative') {
    if (industry === 'finance' || industry === 'engineering') {
      warnings.push('Creative tone in technical industry: Ensure technical credibility is still emphasized.');
    }
  }
  
  // Technical tone warnings
  if (tone === 'technical') {
    if (companyCulture === 'startup' && industry !== 'technology') {
      warnings.push('Highly technical tone with startup culture: Consider adding enthusiasm and personality.');
    }
  }
  
  return warnings;
}

/**
 * Get recommended tone based on industry and company culture
 */
export function getRecommendedTone(industry, companyCulture) {
  // Technology + Startup = Enthusiastic or Casual
  if (industry === 'technology' && companyCulture === 'startup') {
    return 'enthusiastic';
  }
  
  // Finance/Healthcare + Corporate = Formal or Analytical
  if ((industry === 'finance' || industry === 'healthcare') && 
      (companyCulture === 'corporate' || companyCulture === 'enterprise')) {
    return 'formal';
  }
  
  // Creative industry = Creative tone
  if (industry === 'creative') {
    return 'creative';
  }
  
  // Technical roles = Technical or Analytical
  if (industry === 'technology' || industry === 'engineering') {
    return 'technical';
  }
  
  // Executive roles = Executive tone
  if (companyCulture === 'enterprise' || companyCulture === 'corporate') {
    return 'executive';
  }
  
  // Default to professional formal
  return 'formal';
}

export default {
  TONE_OPTIONS,
  INDUSTRY_SETTINGS,
  COMPANY_CULTURE,
  LENGTH_OPTIONS,
  WRITING_STYLE,
  validateToneConsistency,
  getRecommendedTone
};
