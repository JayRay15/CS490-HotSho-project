/**
 * Email Status Detector
 * Analyzes email content to automatically detect application status changes
 */

const STATUS_PATTERNS = {
  'Rejected': {
    keywords: [
      'regret to inform',
      'unfortunately',
      'not moving forward',
      'decided to pursue',
      'other candidates',
      'not selected',
      'position has been filled',
      'we will not be',
      'thank you for your interest, however',
      'unable to offer',
      'not the right fit',
      'move forward with other',
      'will not be progressing',
      'decided not to proceed'
    ],
    weight: 10
  },
  'Phone Screen': {
    keywords: [
      'phone screen',
      'phone interview',
      'initial call',
      'brief call',
      'phone conversation',
      'preliminary phone',
      'schedule a call',
      'phone chat',
      'introductory call'
    ],
    weight: 9
  },
  'Technical Interview': {
    keywords: [
      'technical interview',
      'coding interview',
      'technical assessment',
      'coding challenge',
      'technical round',
      'technical screen',
      'live coding',
      'take-home assignment',
      'technical test',
      'show up',
      'come in',
      'your interview',
      'the interview',
      'for interview',
      'interview on',
      'interview at'
    ],
    weight: 9
  },
  'Onsite Interview': {
    keywords: [
      'onsite interview',
      'in-person interview',
      'visit our office',
      'come in for',
      'on-site',
      'meet the team',
      'interview day',
      'office visit'
    ],
    weight: 9
  },
  'Final Interview': {
    keywords: [
      'final interview',
      'final round',
      'last interview',
      'final stage',
      'meet with',
      'executive interview',
      'leadership interview'
    ],
    weight: 9
  },
  'Offer Extended': {
    keywords: [
      'offer letter',
      'pleased to offer',
      'extend an offer',
      'job offer',
      'offer of employment',
      'would like to offer you',
      'delighted to offer',
      'happy to offer',
      'compensation package',
      'congratulations',
      'welcome to the team'
    ],
    weight: 10
  },
  'Under Review': {
    keywords: [
      'received your application',
      'under review',
      'reviewing your',
      'application is being',
      'thank you for applying',
      'we have received',
      'reviewing applications',
      'application received'
    ],
    weight: 7
  },
  'Ghosted': {
    // This would be detected by the scheduler based on time, not email content
    keywords: [],
    weight: 0
  }
};

const INTERVIEW_KEYWORDS = [
  'interview',
  'schedule',
  'available',
  'meet',
  'discuss',
  'next steps',
  'conversation',
  'show up',
  'come in',
  'visit us',
  'appointment'
];

const POSITIVE_KEYWORDS = [
  'excited',
  'impressed',
  'pleased',
  'delighted',
  'congratulations',
  'happy',
  'moving forward',
  'next steps'
];

const NEGATIVE_KEYWORDS = [
  'unfortunately',
  'regret',
  'unable',
  'not selected',
  'other candidates',
  'decided not',
  'no longer',
  'position filled'
];

/**
 * Map detailed status to simplified pipeline status
 * @param {string} detectedStatus - Detailed status from pattern matching
 * @returns {string} - Simplified pipeline status
 */
const mapToPipelineStatus = (detectedStatus) => {
  const statusMap = {
    'Phone Screen': 'Phone Screen',
    'Technical Interview': 'Interview',
    'Onsite Interview': 'Interview',
    'Final Interview': 'Interview',
    'Offer Extended': 'Offer',
    'Under Review': 'Applied',
    'Rejected': 'Rejected',
    'Ghosted': 'Phone Screen' // Default ghosted back to phone screen
  };
  
  return statusMap[detectedStatus] || detectedStatus;
};

/**
 * Detect application status from email content
 * @param {string} subject - Email subject line
 * @param {string} body - Email body content
 * @returns {Object} { status, confidence, reason, keywords }
 */
export const detectStatusFromEmail = async (subject, body) => {
  const text = `${subject.toLowerCase()} ${body.toLowerCase()}`;
  
  let bestMatch = {
    status: null,
    confidence: 0,
    reason: '',
    matchedKeywords: []
  };

  // Check each status pattern
  for (const [status, pattern] of Object.entries(STATUS_PATTERNS)) {
    if (pattern.keywords.length === 0) continue; // Skip patterns with no keywords
    
    const matches = pattern.keywords.filter(keyword => text.includes(keyword.toLowerCase()));
    
    if (matches.length > 0) {
      // Calculate confidence score with minimum baseline
      const keywordScore = (matches.length / pattern.keywords.length) * 100;
      const weightedScore = Math.min((keywordScore * pattern.weight) / 10, 100);
      
      // Boost confidence if multiple keywords match, or if it's a strong single match
      const multiMatchBoost = matches.length > 1 ? 15 : 5;
      const finalConfidence = Math.max(Math.min(weightedScore + multiMatchBoost, 100), 35); // Minimum 35% if keywords match
      
      if (finalConfidence > bestMatch.confidence) {
        bestMatch = {
          status,
          confidence: Math.round(finalConfidence),
          reason: `Detected based on keywords: ${matches.slice(0, 3).join(', ')}`,
          matchedKeywords: matches
        };
      }
    }
  }

  // Additional heuristics for interviews
  const interviewKeywordCount = INTERVIEW_KEYWORDS.filter(k => text.includes(k)).length;
  
  // If we found "interview" in the text but no strong match yet
  if (text.includes('interview') && bestMatch.confidence < 60) {
    // Check for specific interview types
    if (text.includes('phone') || text.includes('call')) {
      bestMatch = {
        status: 'Phone Screen',
        confidence: 75,
        reason: 'Detected interview scheduling with phone/call context',
        matchedKeywords: ['phone', 'interview']
      };
    } else if (text.includes('technical') || text.includes('coding')) {
      bestMatch = {
        status: 'Technical Interview',
        confidence: 75,
        reason: 'Detected technical interview scheduling',
        matchedKeywords: ['technical', 'interview']
      };
    } else if (text.includes('onsite') || text.includes('office') || text.includes('in-person')) {
      bestMatch = {
        status: 'Onsite Interview',
        confidence: 75,
        reason: 'Detected onsite interview invitation',
        matchedKeywords: ['onsite', 'interview']
      };
    } else if (text.includes('final') || text.includes('last')) {
      bestMatch = {
        status: 'Final Interview',
        confidence: 75,
        reason: 'Detected final interview scheduling',
        matchedKeywords: ['final', 'interview']
      };
    } else if (interviewKeywordCount >= 1) {
      // Generic interview invitation
      bestMatch = {
        status: 'Technical Interview',
        confidence: 70,
        reason: 'Detected interview invitation',
        matchedKeywords: ['interview']
      };
    }
  }

  // Sentiment analysis boost
  const positiveCount = POSITIVE_KEYWORDS.filter(k => text.includes(k)).length;
  const negativeCount = NEGATIVE_KEYWORDS.filter(k => text.includes(k)).length;
  
  if (negativeCount > 2 && bestMatch.status === 'Rejected') {
    bestMatch.confidence = Math.min(bestMatch.confidence + 10, 100);
  } else if (positiveCount > 2 && bestMatch.status === 'Offer Extended') {
    bestMatch.confidence = Math.min(bestMatch.confidence + 10, 100);
  }

  // Map the detected status to pipeline status
  if (bestMatch.status) {
    const originalStatus = bestMatch.status;
    bestMatch.status = mapToPipelineStatus(bestMatch.status);
    
    // Update reason if status was mapped
    if (originalStatus !== bestMatch.status) {
      bestMatch.reason = `Detected as ${originalStatus}, mapped to ${bestMatch.status}. ${bestMatch.reason}`;
    }
  }

  return bestMatch;
};

/**
 * Analyze email sender to determine if it's from company/recruiter
 * @param {string} emailFrom - Sender email address
 * @param {Array<string>} companyDomains - Known company email domains
 * @returns {boolean}
 */
export const isCompanyEmail = (emailFrom, companyDomains = []) => {
  if (!emailFrom) return false;
  
  const emailLower = emailFrom.toLowerCase();
  
  // Check against known company domains
  for (const domain of companyDomains) {
    if (emailLower.includes(domain.toLowerCase())) {
      return true;
    }
  }
  
  // Common recruiter/HR email patterns
  const recruiterPatterns = [
    'recruit',
    'talent',
    'hiring',
    'hr',
    'careers',
    'jobs',
    'employment'
  ];
  
  return recruiterPatterns.some(pattern => emailLower.includes(pattern));
};

/**
 * Extract company name from email
 * @param {string} emailFrom - Sender email address
 * @returns {string|null}
 */
export const extractCompanyFromEmail = (emailFrom) => {
  if (!emailFrom) return null;
  
  // Extract domain
  const match = emailFrom.match(/@([^>]+)/);
  if (!match) return null;
  
  const domain = match[1].toLowerCase();
  
  // Remove common TLDs and subdomains
  let company = domain
    .replace(/\.(com|org|net|io|co|gov|edu).*$/i, '')
    .replace(/^(mail|smtp|email|noreply|no-reply|recruit|talent|hr|careers)\./i, '')
    .split('.')[0];
  
  // Capitalize first letter
  company = company.charAt(0).toUpperCase() + company.slice(1);
  
  return company;
};

/**
 * Suggest next action based on status
 * @param {string} status - Current application status
 * @param {number} daysSinceLastUpdate - Days since last status change
 * @returns {Object} { action, daysToWait }
 */
export const suggestNextAction = (status, daysSinceLastUpdate) => {
  const suggestions = {
    'Applied': {
      action: 'Send a follow-up email expressing continued interest',
      daysToWait: 7
    },
    'Under Review': {
      action: 'Check in on application status',
      daysToWait: 10
    },
    'Phone Screen': {
      action: 'Send thank-you note and request next steps timeline',
      daysToWait: 3
    },
    'Technical Interview': {
      action: 'Send thank-you note and ask about timeline',
      daysToWait: 5
    },
    'Onsite Interview': {
      action: 'Send thank-you notes to all interviewers',
      daysToWait: 5
    },
    'Final Interview': {
      action: 'Follow up on decision timeline',
      daysToWait: 7
    },
    'Offer Extended': {
      action: 'Review offer and negotiate if needed',
      daysToWait: 0
    }
  };
  
  const suggestion = suggestions[status];
  
  if (!suggestion) {
    return {
      action: 'No action needed',
      daysToWait: 0,
      shouldAct: false
    };
  }
  
  return {
    ...suggestion,
    shouldAct: daysSinceLastUpdate >= suggestion.daysToWait
  };
};

/**
 * Categorize email urgency
 * @param {string} subject - Email subject
 * @param {string} body - Email body
 * @returns {string} 'high' | 'medium' | 'low'
 */
export const categorizeEmailUrgency = (subject, body) => {
  const text = `${subject.toLowerCase()} ${body.toLowerCase()}`;
  
  const highUrgencyKeywords = [
    'urgent',
    'immediate',
    'asap',
    'deadline',
    'expire',
    'respond by',
    'decision needed',
    'offer expires'
  ];
  
  const mediumUrgencyKeywords = [
    'interview',
    'schedule',
    'available',
    'please respond',
    'next steps'
  ];
  
  if (highUrgencyKeywords.some(k => text.includes(k))) {
    return 'high';
  } else if (mediumUrgencyKeywords.some(k => text.includes(k))) {
    return 'medium';
  } else {
    return 'low';
  }
};

export default {
  detectStatusFromEmail,
  isCompanyEmail,
  extractCompanyFromEmail,
  suggestNextAction,
  categorizeEmailUrgency
};
