/**
 * UC-125: Email Import Service
 * 
 * This service handles parsing of forwarded job application confirmation emails
 * to automatically import applications from LinkedIn, Indeed, Glassdoor, etc.
 * 
 * For demo purposes, this uses pattern matching on email content.
 * In production, this could integrate with Gmail API (UC-113) for real email scanning.
 */

// Platform detection patterns based on sender domains and email content
const PLATFORM_PATTERNS = {
  LinkedIn: {
    senderDomains: ['linkedin.com', 'linkedin.email.com', 'e.linkedin.com'],
    contentPatterns: [
      /linkedin/i,
      /your application was sent/i,
      /you applied to/i,
      /application submitted.*linkedin/i,
    ],
    extractors: {
      // LinkedIn email format: "You applied to [Job Title] at [Company]"
      jobTitle: [
        /you applied to\s+([^at]+)\s+at/i,
        /application for\s+([^at]+)\s+at/i,
        /applied for the\s+([^at]+)\s+position/i,
      ],
      company: [
        /at\s+([^.!\n]+?)(?:\.|!|\n|$)/i,
        /position at\s+([^.!\n]+)/i,
        /company:\s*([^.!\n]+)/i,
      ],
      location: [
        /location:\s*([^.!\n]+)/i,
        /in\s+([A-Z][a-z]+(?:,?\s*[A-Z]{2})?)/,
      ],
    },
  },
  Indeed: {
    senderDomains: ['indeed.com', 'indeedemail.com', 'indeed.email'],
    contentPatterns: [
      /indeed/i,
      /you applied on indeed/i,
      /application received/i,
      /your indeed application/i,
    ],
    extractors: {
      jobTitle: [
        /applied for\s+([^at]+)\s+at/i,
        /application for:\s*([^-\n]+)/i,
        /job title:\s*([^.!\n]+)/i,
      ],
      company: [
        /at\s+([^.!\n]+?)(?:\.|!|\n|$)/i,
        /company:\s*([^.!\n]+)/i,
        /employer:\s*([^.!\n]+)/i,
      ],
      location: [
        /location:\s*([^.!\n]+)/i,
        /job location:\s*([^.!\n]+)/i,
      ],
    },
  },
  Glassdoor: {
    senderDomains: ['glassdoor.com', 'glassdoor.email.com', 'mail.glassdoor.com'],
    contentPatterns: [
      /glassdoor/i,
      /application submitted via glassdoor/i,
      /you applied through glassdoor/i,
    ],
    extractors: {
      jobTitle: [
        /applied for\s+([^at]+)\s+at/i,
        /position:\s*([^.!\n]+)/i,
        /role:\s*([^.!\n]+)/i,
      ],
      company: [
        /at\s+([^.!\n]+?)(?:\.|!|\n|$)/i,
        /company:\s*([^.!\n]+)/i,
      ],
      location: [
        /location:\s*([^.!\n]+)/i,
      ],
    },
  },
  ZipRecruiter: {
    senderDomains: ['ziprecruiter.com', 'mail.ziprecruiter.com'],
    contentPatterns: [
      /ziprecruiter/i,
      /you applied via ziprecruiter/i,
    ],
    extractors: {
      jobTitle: [
        /applied for\s+([^at]+)\s+at/i,
        /job:\s*([^.!\n]+)/i,
      ],
      company: [
        /at\s+([^.!\n]+?)(?:\.|!|\n|$)/i,
        /company:\s*([^.!\n]+)/i,
      ],
      location: [
        /location:\s*([^.!\n]+)/i,
      ],
    },
  },
};

/**
 * Detect which platform an email is from based on sender and content
 * @param {string} senderEmail - The sender's email address
 * @param {string} emailContent - The email body text
 * @returns {string|null} - Platform name or null if not detected
 */
export function detectPlatform(senderEmail, emailContent) {
  const senderLower = (senderEmail || '').toLowerCase();
  const contentLower = (emailContent || '').toLowerCase();

  for (const [platform, config] of Object.entries(PLATFORM_PATTERNS)) {
    // Check sender domain
    const domainMatch = config.senderDomains.some(domain => 
      senderLower.includes(domain)
    );
    
    if (domainMatch) {
      return platform;
    }

    // Check content patterns
    const contentMatch = config.contentPatterns.some(pattern => 
      pattern.test(contentLower)
    );

    if (contentMatch) {
      return platform;
    }
  }

  return null;
}

/**
 * Extract job details from email content using platform-specific patterns
 * @param {string} platform - The detected platform
 * @param {string} emailContent - The email body text
 * @returns {Object} - Extracted job details
 */
export function extractJobDetails(platform, emailContent) {
  const config = PLATFORM_PATTERNS[platform];
  const result = {
    title: null,
    company: null,
    location: null,
  };

  if (!config || !emailContent) {
    return result;
  }

  // Try each extractor pattern for job title
  for (const pattern of config.extractors.jobTitle) {
    const match = emailContent.match(pattern);
    if (match && match[1]) {
      result.title = match[1].trim();
      break;
    }
  }

  // Try each extractor pattern for company
  for (const pattern of config.extractors.company) {
    const match = emailContent.match(pattern);
    if (match && match[1]) {
      result.company = match[1].trim();
      break;
    }
  }

  // Try each extractor pattern for location
  for (const pattern of config.extractors.location) {
    const match = emailContent.match(pattern);
    if (match && match[1]) {
      result.location = match[1].trim();
      break;
    }
  }

  return result;
}

/**
 * Parse a forwarded email and extract application details
 * @param {Object} emailData - Email data object
 * @param {string} emailData.sender - Sender email address
 * @param {string} emailData.subject - Email subject
 * @param {string} emailData.body - Email body text
 * @param {string} emailData.receivedDate - Date email was received
 * @returns {Object} - Parsed application data
 */
export function parseApplicationEmail(emailData) {
  const { sender, subject, body, receivedDate } = emailData;
  
  // Combine subject and body for better extraction
  const fullContent = `${subject || ''}\n${body || ''}`;
  
  // Detect platform
  const platform = detectPlatform(sender, fullContent);
  
  if (!platform) {
    return {
      success: false,
      error: 'Could not detect platform from email',
      platform: null,
      jobDetails: null,
    };
  }

  // Extract job details
  const jobDetails = extractJobDetails(platform, fullContent);

  // Try to extract from subject if body extraction failed
  if (!jobDetails.title && subject) {
    const subjectMatch = subject.match(/(?:application|applied).*?(?:for|to)\s+([^at-]+)/i);
    if (subjectMatch) {
      jobDetails.title = subjectMatch[1].trim();
    }
  }

  return {
    success: true,
    platform,
    jobDetails: {
      title: jobDetails.title || 'Unknown Position',
      company: jobDetails.company || 'Unknown Company',
      location: jobDetails.location || '',
      appliedDate: receivedDate || new Date().toISOString(),
    },
    sourceEmailId: emailData.messageId || null,
  };
}

/**
 * Check if two job applications are duplicates based on similarity
 * @param {Object} job1 - First job object
 * @param {Object} job2 - Second job object
 * @param {number} dateWindowDays - Number of days for date comparison window
 * @returns {boolean} - True if jobs are duplicates
 */
export function areDuplicates(job1, job2, dateWindowDays = 7) {
  // Normalize strings for comparison
  const normalize = (str) => (str || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  
  const title1 = normalize(job1.title);
  const title2 = normalize(job2.title);
  const company1 = normalize(job1.company);
  const company2 = normalize(job2.company);

  // Check company similarity (must match or be very similar)
  const companySimilar = company1 === company2 || 
    company1.includes(company2) || 
    company2.includes(company1) ||
    levenshteinSimilarity(company1, company2) > 0.8;

  if (!companySimilar) {
    return false;
  }

  // Check title similarity
  const titleSimilar = title1 === title2 || 
    title1.includes(title2) || 
    title2.includes(title1) ||
    levenshteinSimilarity(title1, title2) > 0.7;

  if (!titleSimilar) {
    return false;
  }

  // Check date window if dates are provided
  if (job1.appliedDate && job2.appliedDate) {
    const date1 = new Date(job1.appliedDate);
    const date2 = new Date(job2.appliedDate);
    const daysDiff = Math.abs(date1 - date2) / (1000 * 60 * 60 * 24);
    
    if (daysDiff > dateWindowDays) {
      return false;
    }
  }

  return true;
}

/**
 * Calculate Levenshtein similarity ratio between two strings
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Similarity ratio (0-1)
 */
function levenshteinSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 1;

  const len1 = str1.length;
  const len2 = str2.length;
  const maxLen = Math.max(len1, len2);

  if (maxLen === 0) return 1;

  // Create distance matrix
  const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[len1][len2];
  return 1 - distance / maxLen;
}

/**
 * Identify gaps in application history
 * Looks for periods with low application activity
 * @param {Array} applications - Array of application objects
 * @param {number} gapDays - Number of days without activity to consider a gap
 * @returns {Array} - Array of gap periods
 */
export function identifyApplicationGaps(applications, gapDays = 7) {
  if (!applications || applications.length < 2) {
    return [];
  }

  // Sort by application date
  const sorted = [...applications]
    .filter(app => app.applicationDate || app.appliedDate || app.createdAt)
    .sort((a, b) => {
      const dateA = new Date(a.applicationDate || a.appliedDate || a.createdAt);
      const dateB = new Date(b.applicationDate || b.appliedDate || b.createdAt);
      return dateA - dateB;
    });

  const gaps = [];
  
  for (let i = 1; i < sorted.length; i++) {
    const prevDate = new Date(sorted[i - 1].applicationDate || sorted[i - 1].appliedDate || sorted[i - 1].createdAt);
    const currDate = new Date(sorted[i].applicationDate || sorted[i].appliedDate || sorted[i].createdAt);
    const daysDiff = Math.floor((currDate - prevDate) / (1000 * 60 * 60 * 24));

    if (daysDiff >= gapDays) {
      gaps.push({
        startDate: prevDate.toISOString(),
        endDate: currDate.toISOString(),
        daysMissing: daysDiff,
        suggestion: `No applications logged for ${daysDiff} days. Did you forget to track some applications?`,
      });
    }
  }

  return gaps;
}

/**
 * Generate mock email data for demo purposes
 * Simulates receiving confirmation emails from various platforms
 * @returns {Array} - Array of mock email objects
 */
export function generateMockEmails() {
  return [
    {
      messageId: 'mock-linkedin-001',
      sender: 'jobs-noreply@linkedin.com',
      subject: 'Your application was sent to Google',
      body: `Hi there,

Your application was sent to Google for the Senior Software Engineer position.

Job Title: Senior Software Engineer
Company: Google
Location: Mountain View, CA

Good luck with your application!

Best,
The LinkedIn Team`,
      receivedDate: '2025-12-10T10:30:00Z',
    },
    {
      messageId: 'mock-indeed-001',
      sender: 'noreply@indeed.com',
      subject: 'Application Received - Full Stack Developer at Microsoft',
      body: `Thank you for applying on Indeed!

You applied for Full Stack Developer at Microsoft.

Job Title: Full Stack Developer
Company: Microsoft
Location: Redmond, WA

We've forwarded your resume to the employer.

- Indeed Team`,
      receivedDate: '2025-12-12T14:15:00Z',
    },
    {
      messageId: 'mock-glassdoor-001',
      sender: 'applications@glassdoor.com',
      subject: 'Application submitted via Glassdoor',
      body: `Your application has been submitted through Glassdoor.

Position: Frontend Engineer
Company: Meta
Location: Menlo Park, CA

Track your application status on Glassdoor.

Glassdoor Team`,
      receivedDate: '2025-12-14T09:45:00Z',
    },
    {
      messageId: 'mock-linkedin-002',
      sender: 'jobs-noreply@linkedin.com',
      subject: 'Application sent - Backend Developer at Amazon',
      body: `Your application to Amazon has been submitted!

You applied to Backend Developer at Amazon.
Location: Seattle, WA

Good luck!
LinkedIn`,
      receivedDate: '2025-12-15T16:20:00Z',
    },
    {
      messageId: 'mock-indeed-002',
      sender: 'noreply@indeedemail.com',
      subject: 'Indeed Application: DevOps Engineer - Netflix',
      body: `Application Received

You applied for DevOps Engineer at Netflix
Location: Los Gatos, CA

Your application has been sent to the employer.`,
      receivedDate: '2025-12-16T11:00:00Z',
    },
    // Duplicate application - same job on different platform
    {
      messageId: 'mock-glassdoor-002',
      sender: 'mail@glassdoor.com',
      subject: 'Glassdoor Application Confirmation',
      body: `Application Submitted!

Role: Full Stack Developer
Company: Microsoft
Location: Redmond, WA

Your application via Glassdoor is complete.`,
      receivedDate: '2025-12-13T10:00:00Z',
    },
  ];
}

export default {
  detectPlatform,
  extractJobDetails,
  parseApplicationEmail,
  areDuplicates,
  identifyApplicationGaps,
  generateMockEmails,
};
