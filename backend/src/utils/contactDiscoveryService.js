/**
 * Contact Discovery Service
 * 
 * This service provides mock contact discovery functionality for demonstration.
 * In a production environment, this would integrate with:
 * - LinkedIn API for professional connections
 * - Alumni databases
 * - Conference speaker databases
 * - Industry directories
 * 
 * For now, we generate realistic mock data to demonstrate the feature.
 */

// Mock data for generating realistic contacts
const FIRST_NAMES = [
  'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
  'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa',
  'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley',
  'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle',
  'Aisha', 'Wei', 'Priya', 'Carlos', 'Fatima', 'Hiroshi', 'Olga', 'Ahmed',
  'Mei', 'Raj', 'Sofia', 'Chen', 'Amara', 'Kenji', 'Elena', 'Omar'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
  'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill',
  'Chen', 'Patel', 'Kim', 'Singh', 'Kumar', 'Wong', 'Zhang', 'Tanaka',
  'Müller', 'Johansson', 'Dubois', 'Rossi', 'Santos', 'Okonkwo', 'Ali', 'Khan'
];

const COMPANIES_BY_INDUSTRY = {
  'Technology': [
    'Google', 'Microsoft', 'Apple', 'Amazon', 'Meta', 'Netflix', 'Salesforce',
    'Adobe', 'Intel', 'NVIDIA', 'Oracle', 'IBM', 'Cisco', 'VMware', 'Zoom',
    'Stripe', 'Shopify', 'Datadog', 'MongoDB', 'Snowflake', 'Confluent',
    'Twilio', 'Okta', 'CrowdStrike', 'Palantir', 'Databricks', 'Figma'
  ],
  'Finance': [
    'Goldman Sachs', 'JP Morgan', 'Morgan Stanley', 'Bank of America', 'Citigroup',
    'BlackRock', 'Fidelity', 'Vanguard', 'Charles Schwab', 'Capital One',
    'American Express', 'Visa', 'Mastercard', 'PayPal', 'Square', 'Robinhood'
  ],
  'Healthcare': [
    'Johnson & Johnson', 'Pfizer', 'UnitedHealth', 'CVS Health', 'Anthem',
    'Merck', 'AbbVie', 'Bristol-Myers Squibb', 'Eli Lilly', 'Amgen',
    'Gilead Sciences', 'Regeneron', 'Moderna', 'Biogen', 'Vertex'
  ],
  'Consulting': [
    'McKinsey & Company', 'Boston Consulting Group', 'Bain & Company',
    'Deloitte', 'PwC', 'EY', 'KPMG', 'Accenture', 'Booz Allen Hamilton',
    'Oliver Wyman', 'Roland Berger', 'A.T. Kearney', 'Strategy&'
  ],
  'Retail': [
    'Walmart', 'Target', 'Costco', 'Home Depot', 'Lowe\'s', 'Best Buy',
    'Nike', 'Starbucks', 'McDonald\'s', 'Chipotle', 'Lululemon'
  ],
  'Media & Entertainment': [
    'Disney', 'Warner Bros', 'NBCUniversal', 'Paramount', 'Sony Pictures',
    'Spotify', 'Netflix', 'YouTube', 'TikTok', 'Snap Inc', 'Pinterest'
  ],
  'Manufacturing': [
    'General Electric', 'Boeing', 'Lockheed Martin', 'Caterpillar', '3M',
    'Honeywell', 'Raytheon', 'Northrop Grumman', 'General Dynamics'
  ]
};

const ROLES_BY_INDUSTRY = {
  'Technology': [
    'Software Engineer', 'Senior Software Engineer', 'Staff Engineer', 'Principal Engineer',
    'Engineering Manager', 'VP of Engineering', 'CTO', 'Product Manager', 'Senior Product Manager',
    'Director of Product', 'VP of Product', 'Data Scientist', 'ML Engineer', 'DevOps Engineer',
    'Solutions Architect', 'Technical Program Manager', 'UX Designer', 'Product Designer'
  ],
  'Finance': [
    'Investment Analyst', 'Portfolio Manager', 'Financial Advisor', 'Risk Analyst',
    'Quantitative Analyst', 'Investment Banking Associate', 'VP of Finance', 'CFO',
    'Wealth Manager', 'Compliance Officer', 'Credit Analyst', 'Equity Research Analyst'
  ],
  'Healthcare': [
    'Clinical Research Associate', 'Medical Director', 'Healthcare Consultant',
    'Pharmaceutical Sales Rep', 'Regulatory Affairs Manager', 'Clinical Operations Manager',
    'Health IT Specialist', 'Medical Science Liaison', 'VP of R&D'
  ],
  'Consulting': [
    'Consultant', 'Senior Consultant', 'Manager', 'Senior Manager', 'Principal',
    'Partner', 'Managing Director', 'Strategy Consultant', 'Management Consultant'
  ],
  'Retail': [
    'Store Manager', 'District Manager', 'Retail Operations Manager', 'Merchandising Manager',
    'E-commerce Manager', 'Supply Chain Manager', 'VP of Retail Operations'
  ],
  'Media & Entertainment': [
    'Content Producer', 'Creative Director', 'Marketing Manager', 'Brand Manager',
    'Social Media Manager', 'Entertainment Executive', 'VP of Content'
  ],
  'Manufacturing': [
    'Operations Manager', 'Plant Manager', 'Quality Engineer', 'Supply Chain Manager',
    'Manufacturing Engineer', 'Lean Six Sigma Black Belt', 'VP of Operations'
  ]
};

const UNIVERSITIES = [
  'MIT', 'Stanford University', 'Harvard University', 'UC Berkeley', 'Carnegie Mellon',
  'Georgia Tech', 'University of Michigan', 'Cornell University', 'Princeton University',
  'Yale University', 'Columbia University', 'UCLA', 'University of Texas at Austin',
  'University of Washington', 'Northwestern University', 'Duke University', 'NYU',
  'University of Illinois', 'University of Pennsylvania', 'Caltech', 'NJIT',
  'Rutgers University', 'Boston University', 'USC', 'University of Chicago'
];

const LOCATIONS = [
  'New York, NY', 'San Francisco, CA', 'Seattle, WA', 'Boston, MA', 'Austin, TX',
  'Los Angeles, CA', 'Chicago, IL', 'Denver, CO', 'Atlanta, GA', 'Miami, FL',
  'Washington, DC', 'Dallas, TX', 'San Diego, CA', 'Portland, OR', 'Phoenix, AZ',
  'Philadelphia, PA', 'Minneapolis, MN', 'Detroit, MI', 'Raleigh, NC', 'Salt Lake City, UT'
];

const CONNECTION_TYPES = [
  { type: '2nd Degree', description: 'Connected through mutual contacts' },
  { type: '3rd Degree', description: 'Extended network connection' },
  { type: 'Alumni', description: 'Shared educational background' },
  { type: 'Industry Leader', description: 'Thought leader in your target industry' },
  { type: 'Conference Speaker', description: 'Speaker at industry events' },
  { type: 'Company Employee', description: 'Works at your target company' },
  { type: 'Diversity Network', description: 'Member of professional diversity groups' }
];

const INTERESTS = [
  'Machine Learning', 'Cloud Computing', 'Data Analytics', 'Product Strategy',
  'Leadership Development', 'Digital Transformation', 'Sustainability',
  'Innovation', 'Entrepreneurship', 'Mentorship', 'Diversity & Inclusion',
  'Remote Work', 'Agile Methodologies', 'Customer Experience', 'Growth Hacking',
  'Blockchain', 'IoT', 'Cybersecurity', 'UI/UX Design', 'Public Speaking'
];

const DIVERSITY_GROUPS = [
  'Women in Tech', 'Black Professionals Network', 'Hispanic/Latino Leadership',
  'LGBTQ+ in Business', 'Asian American Professionals', 'Veterans in Tech',
  'Parents in Tech', 'Accessibility Advocates', 'First-Gen Professionals'
];

/**
 * Generate a random element from an array
 */
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

/**
 * Generate multiple random elements from an array
 */
const randomChoices = (arr, count) => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, arr.length));
};

/**
 * Generate a unique ID for mock contacts
 */
const generateId = () => `disc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

/**
 * Generate mock mutual connections
 */
const generateMutualConnections = (count = 2) => {
  const connections = [];
  for (let i = 0; i < count; i++) {
    connections.push(`${randomChoice(FIRST_NAMES)} ${randomChoice(LAST_NAMES)}`);
  }
  return connections;
};

/**
 * Generate a single mock discovered contact
 */
const generateMockContact = (filters = {}) => {
  const industry = filters.industry || randomChoice(Object.keys(COMPANIES_BY_INDUSTRY));
  const companies = COMPANIES_BY_INDUSTRY[industry] || COMPANIES_BY_INDUSTRY['Technology'];
  const roles = ROLES_BY_INDUSTRY[industry] || ROLES_BY_INDUSTRY['Technology'];
  
  const firstName = randomChoice(FIRST_NAMES);
  const lastName = randomChoice(LAST_NAMES);
  const company = filters.company || randomChoice(companies);
  const role = filters.role || randomChoice(roles);
  const connectionType = filters.connectionType 
    ? CONNECTION_TYPES.find(c => c.type === filters.connectionType) || randomChoice(CONNECTION_TYPES)
    : randomChoice(CONNECTION_TYPES);
  
  const mutualConnectionCount = connectionType.type === '2nd Degree' ? Math.floor(Math.random() * 5) + 1 : 
                                 connectionType.type === '3rd Degree' ? 0 :
                                 Math.floor(Math.random() * 3);
  
  return {
    id: generateId(),
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
    company,
    jobTitle: role,
    industry,
    location: filters.location || randomChoice(LOCATIONS),
    linkedInUrl: `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}-${Math.random().toString(36).substr(2, 5)}`,
    connectionType: connectionType.type,
    connectionDescription: connectionType.description,
    mutualConnections: generateMutualConnections(mutualConnectionCount),
    mutualConnectionCount,
    university: connectionType.type === 'Alumni' ? (filters.university || randomChoice(UNIVERSITIES)) : randomChoice(UNIVERSITIES),
    interests: randomChoices(INTERESTS, Math.floor(Math.random() * 4) + 2),
    diversityGroups: connectionType.type === 'Diversity Network' ? randomChoices(DIVERSITY_GROUPS, Math.floor(Math.random() * 2) + 1) : [],
    yearsExperience: Math.floor(Math.random() * 20) + 2,
    isVerified: Math.random() > 0.3,
    lastActive: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
    profileStrength: Math.floor(Math.random() * 30) + 70, // 70-100
    matchScore: Math.floor(Math.random() * 40) + 60, // 60-100 relevance score
    suggestedOutreach: generateOutreachSuggestion(connectionType.type, firstName),
    speakerTopics: connectionType.type === 'Conference Speaker' ? randomChoices(INTERESTS, 3) : [],
    recentActivity: generateRecentActivity()
  };
};

/**
 * Generate outreach suggestion based on connection type
 */
const generateOutreachSuggestion = (connectionType, firstName) => {
  const suggestions = {
    '2nd Degree': `Ask your mutual connection to introduce you to ${firstName}`,
    '3rd Degree': `Connect with shared interests in your outreach message`,
    'Alumni': `Mention your shared alma mater when reaching out`,
    'Industry Leader': `Reference their recent article or talk in your message`,
    'Conference Speaker': `Mention a specific talk of theirs that resonated with you`,
    'Company Employee': `Ask about their experience at the company`,
    'Diversity Network': `Connect through shared community and professional interests`
  };
  return suggestions[connectionType] || 'Send a personalized connection request';
};

/**
 * Generate recent activity for the contact
 */
const generateRecentActivity = () => {
  const activities = [
    'Posted about industry trends',
    'Shared an article on leadership',
    'Commented on a tech discussion',
    'Celebrated a work anniversary',
    'Started a new position',
    'Published a blog post',
    'Spoke at a conference',
    'Received a promotion',
    'Joined a professional group'
  ];
  return randomChoice(activities);
};

/**
 * Search for discovered contacts based on filters
 * @param {Object} searchParams - Search parameters
 * @param {string} searchParams.industry - Target industry
 * @param {string} searchParams.company - Target company
 * @param {string} searchParams.role - Target role/job title
 * @param {string} searchParams.location - Target location
 * @param {string} searchParams.connectionType - Type of connection
 * @param {string} searchParams.university - Alumni university
 * @param {string} searchParams.q - Search query
 * @param {number} searchParams.page - Page number
 * @param {number} searchParams.limit - Results per page
 * @returns {Promise<Object>} Search results with contacts
 */
export const discoverContacts = async (searchParams = {}) => {
  const {
    industry,
    company,
    role,
    location,
    connectionType,
    university,
    q,
    page = 1,
    limit = 12
  } = searchParams;

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 400));

  // Generate a pool of contacts
  const totalContacts = 48; // Simulated total
  const contacts = [];

  for (let i = 0; i < totalContacts; i++) {
    const contact = generateMockContact({
      industry,
      company,
      role,
      location,
      connectionType,
      university
    });
    contacts.push(contact);
  }

  // Filter by search query if provided
  let filteredContacts = contacts;
  if (q) {
    const searchLower = q.toLowerCase();
    filteredContacts = contacts.filter(contact =>
      contact.fullName.toLowerCase().includes(searchLower) ||
      contact.company.toLowerCase().includes(searchLower) ||
      contact.jobTitle.toLowerCase().includes(searchLower) ||
      contact.industry.toLowerCase().includes(searchLower) ||
      contact.interests.some(interest => interest.toLowerCase().includes(searchLower))
    );
  }

  // Sort by match score
  filteredContacts.sort((a, b) => b.matchScore - a.matchScore);

  // Paginate
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedContacts = filteredContacts.slice(start, end);

  return {
    success: true,
    data: paginatedContacts,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(filteredContacts.length / limit),
      totalContacts: filteredContacts.length,
      hasMore: end < filteredContacts.length
    },
    filters: {
      industries: Object.keys(COMPANIES_BY_INDUSTRY),
      connectionTypes: CONNECTION_TYPES.map(c => c.type),
      universities: UNIVERSITIES,
      locations: LOCATIONS
    }
  };
};

/**
 * Get filter options for the discovery interface
 */
export const getDiscoveryFilters = async () => {
  return {
    success: true,
    data: {
      industries: Object.keys(COMPANIES_BY_INDUSTRY),
      connectionTypes: CONNECTION_TYPES,
      universities: UNIVERSITIES,
      locations: LOCATIONS,
      diversityGroups: DIVERSITY_GROUPS
    }
  };
};

/**
 * Get suggested contacts based on user's profile and job applications
 * This would normally use the user's data to personalize suggestions
 */
export const getSuggestedContacts = async (userContext = {}) => {
  const { targetCompanies = [], targetRoles = [], targetIndustries = [], university } = userContext;

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));

  const suggestions = [];

  // Generate contacts for target companies
  for (const company of targetCompanies.slice(0, 2)) {
    for (let i = 0; i < 3; i++) {
      suggestions.push(generateMockContact({ company, connectionType: 'Company Employee' }));
    }
  }

  // Generate alumni connections
  if (university) {
    for (let i = 0; i < 4; i++) {
      suggestions.push(generateMockContact({ university, connectionType: 'Alumni' }));
    }
  }

  // Generate industry leaders
  for (const industry of targetIndustries.slice(0, 2)) {
    for (let i = 0; i < 2; i++) {
      suggestions.push(generateMockContact({ industry, connectionType: 'Industry Leader' }));
    }
  }

  // Add diversity network suggestions
  for (let i = 0; i < 3; i++) {
    suggestions.push(generateMockContact({ connectionType: 'Diversity Network' }));
  }

  // Sort by match score and return top results
  suggestions.sort((a, b) => b.matchScore - a.matchScore);

  return {
    success: true,
    data: suggestions.slice(0, 12),
    categories: [
      { name: 'At Your Target Companies', count: Math.min(targetCompanies.length * 3, 6) },
      { name: 'Alumni Network', count: university ? 4 : 0 },
      { name: 'Industry Leaders', count: Math.min(targetIndustries.length * 2, 4) },
      { name: 'Diversity Networks', count: 3 }
    ]
  };
};

export default {
  discoverContacts,
  getDiscoveryFilters,
  getSuggestedContacts
};
