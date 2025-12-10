import axios from 'axios';

/**
 * UC-112: Salary Data Integration - Bureau of Labor Statistics Service
 * 
 * This service provides salary benchmark data from the US Bureau of Labor Statistics (BLS)
 * using their published Occupational Employment and Wage Statistics (OES) data.
 * 
 * Data Source: BLS OES May 2024 National Occupational Employment and Wage Estimates
 * API Documentation: https://www.bls.gov/developers/api_signature_v2.htm
 * OES Data: https://www.bls.gov/oes/tables.htm
 * 
 * The BLS API v2 provides access to various data series including OES wage data.
 * Series ID format for OES: OEUM[AREA][INDUSTRY][OCC][DATATYPE]
 */

const BLS_API_BASE_URL = 'https://api.bls.gov/publicAPI/v2';
const getBLSAPIKey = () => process.env.LABOR_STATISTICS_KEY || process.env.BLS_API_KEY;

// Rate limiting for BLS API (max 500 requests per day for registered, 25 for unregistered)
let lastApiCall = 0;
const API_CALL_DELAY_MS = 1000; // 1 second between calls

/**
 * BLS OES Data - Updated with latest available data (May 2024)
 * These are official BLS Occupational Employment and Wage Statistics
 * Source: https://www.bls.gov/oes/current/oes_nat.htm
 * 
 * This serves as fallback data when API calls fail and as a reference for mapping
 */
const BLS_OES_DATA = {
  '15-1252': { // Software Developers
    title: 'Software Developers',
    median: 132270,
    mean: 140080,
    percentile10: 78440,
    percentile25: 103610,
    percentile75: 171140,
    percentile90: 212440,
    year: 2024,
    employment: 1795300
  },
  '15-1254': { // Web Developers
    title: 'Web Developers and Digital Interface Designers',
    median: 87890,
    mean: 101300,
    percentile10: 45580,
    percentile25: 64110,
    percentile75: 123380,
    percentile90: 162310,
    year: 2024,
    employment: 216300
  },
  '15-2051': { // Data Scientists
    title: 'Data Scientists',
    median: 112590,
    mean: 124420,
    percentile10: 64180,
    percentile25: 83500,
    percentile75: 148940,
    percentile90: 191110,
    year: 2024,
    employment: 202400
  },
  '15-1242': { // Database Administrators
    title: 'Database Administrators and Architects',
    median: 105380,
    mean: 115020,
    percentile10: 55160,
    percentile25: 76860,
    percentile75: 138610,
    percentile90: 173970,
    year: 2024,
    employment: 168200
  },
  '15-1241': { // Computer Network Architects
    title: 'Computer Network Architects',
    median: 131110,
    mean: 138870,
    percentile10: 76540,
    percentile25: 96180,
    percentile75: 170380,
    percentile90: 211700,
    year: 2024,
    employment: 167600
  },
  '15-1212': { // Information Security Analysts
    title: 'Information Security Analysts',
    median: 124520,
    mean: 129970,
    percentile10: 70880,
    percentile25: 94150,
    percentile75: 159830,
    percentile90: 188860,
    year: 2024,
    employment: 175300
  },
  '15-1211': { // Computer Systems Analysts
    title: 'Computer Systems Analysts',
    median: 106030,
    mean: 112630,
    percentile10: 62920,
    percentile25: 81360,
    percentile75: 135180,
    percentile90: 167200,
    year: 2024,
    employment: 545300
  },
  '15-1253': { // Software Quality Assurance
    title: 'Software Quality Assurance Analysts and Testers',
    median: 105860,
    mean: 113930,
    percentile10: 60800,
    percentile25: 82030,
    percentile75: 135470,
    percentile90: 167560,
    year: 2024,
    employment: 212600
  },
  '11-3021': { // Computer and IS Managers
    title: 'Computer and Information Systems Managers',
    median: 175350,
    mean: 187170,
    percentile10: 104440,
    percentile25: 135930,
    percentile75: 225670,
    percentile90: 277120,
    year: 2024,
    employment: 538300
  },
  '13-2051': { // Financial Analysts
    title: 'Financial Analysts',
    median: 103500,
    mean: 116650,
    percentile10: 61560,
    percentile25: 78450,
    percentile75: 140660,
    percentile90: 178930,
    year: 2024,
    employment: 343700
  },
  '29-1141': { // Registered Nurses
    title: 'Registered Nurses',
    median: 89010,
    mean: 92090,
    percentile10: 63860,
    percentile25: 74400,
    percentile75: 106810,
    percentile90: 128270,
    year: 2024,
    employment: 3175200
  },
  '15-1255': { // Web and Digital Interface Designers
    title: 'Web and Digital Interface Designers',
    median: 98930,
    mean: 111460,
    percentile10: 51050,
    percentile25: 68940,
    percentile75: 133800,
    percentile90: 175230,
    year: 2024,
    employment: 81200
  },
  '15-1232': { // Computer User Support Specialists
    title: 'Computer User Support Specialists',
    median: 60190,
    mean: 63770,
    percentile10: 37840,
    percentile25: 46130,
    percentile75: 77800,
    percentile90: 96920,
    year: 2024,
    employment: 699200
  },
  '15-1231': { // Computer Network Support Specialists
    title: 'Computer Network Support Specialists',
    median: 71130,
    mean: 74320,
    percentile10: 43360,
    percentile25: 55010,
    percentile75: 91160,
    percentile90: 111310,
    year: 2024,
    employment: 179600
  },
  '15-1299': { // Computer Occupations, All Other
    title: 'Computer Occupations, All Other',
    median: 100960,
    mean: 109520,
    percentile10: 51480,
    percentile25: 71350,
    percentile75: 137660,
    percentile90: 172540,
    year: 2024,
    employment: 324100
  },
  '11-2021': { // Marketing Managers
    title: 'Marketing Managers',
    median: 166650,
    mean: 183900,
    percentile10: 90530,
    percentile25: 121270,
    percentile75: 222480,
    percentile90: 0, // Wages above $239,200
    year: 2024,
    employment: 337300
  },
  '11-3031': { // Financial Managers
    title: 'Financial Managers',
    median: 156100,
    mean: 173980,
    percentile10: 86030,
    percentile25: 114190,
    percentile75: 208620,
    percentile90: 0, // Wages above $239,200
    year: 2024,
    employment: 742800
  },
  '11-3121': { // Human Resources Managers
    title: 'Human Resources Managers',
    median: 136350,
    mean: 148970,
    percentile10: 80640,
    percentile25: 101960,
    percentile75: 180340,
    percentile90: 224940,
    year: 2024,
    employment: 195200
  },
  '13-2011': { // Accountants and Auditors
    title: 'Accountants and Auditors',
    median: 83980,
    mean: 93450,
    percentile10: 49870,
    percentile25: 63830,
    percentile75: 108310,
    percentile90: 143070,
    year: 2024,
    employment: 1370200
  },
  '17-2141': { // Mechanical Engineers
    title: 'Mechanical Engineers',
    median: 99510,
    mean: 104090,
    percentile10: 63810,
    percentile25: 79700,
    percentile75: 124400,
    percentile90: 149730,
    year: 2024,
    employment: 292400
  },
  '17-2051': { // Civil Engineers
    title: 'Civil Engineers',
    median: 95890,
    mean: 99850,
    percentile10: 61830,
    percentile25: 76440,
    percentile75: 119070,
    percentile90: 142870,
    year: 2024,
    employment: 306200
  },
  '17-2071': { // Electrical Engineers
    title: 'Electrical Engineers',
    median: 109500,
    mean: 115390,
    percentile10: 67300,
    percentile25: 86110,
    percentile75: 138550,
    percentile90: 167640,
    year: 2024,
    employment: 192600
  },
  '13-1161': { // Market Research Analysts
    title: 'Market Research Analysts and Marketing Specialists',
    median: 74680,
    mean: 84200,
    percentile10: 43640,
    percentile25: 54770,
    percentile75: 101320,
    percentile90: 136280,
    year: 2024,
    employment: 796900
  },
  '11-2022': { // Sales Managers
    title: 'Sales Managers',
    median: 135160,
    mean: 154620,
    percentile10: 68320,
    percentile25: 93010,
    percentile75: 192530,
    percentile90: 239200,
    year: 2024,
    employment: 474000
  },
  '00-0000': { // All Occupations
    title: 'All Occupations',
    median: 48060,
    mean: 65470,
    percentile10: 24250,
    percentile25: 32770,
    percentile75: 80740,
    percentile90: 116980,
    year: 2024,
    employment: 161000000
  }
};

/**
 * Common occupation codes (SOC - Standard Occupational Classification)
 * SOC 2018 classification system used by BLS
 */
export const OCCUPATION_CODES = {
  // Technology - Software & Development
  'SOFTWARE_DEVELOPER': '15-1252',
  'WEB_DEVELOPER': '15-1254',
  'DATA_SCIENTIST': '15-2051',
  'DATABASE_ADMIN': '15-1242',
  'NETWORK_ARCHITECT': '15-1241',
  'INFORMATION_SECURITY': '15-1212',
  'COMPUTER_SYSTEMS_ANALYST': '15-1211',
  'SOFTWARE_QA': '15-1253',
  'WEB_DESIGNER': '15-1255',
  'USER_SUPPORT': '15-1232',
  'NETWORK_SUPPORT': '15-1231',
  'COMPUTER_OTHER': '15-1299',
  
  // Management
  'COMPUTER_MANAGER': '11-3021',
  'MARKETING_MANAGER': '11-2021',
  'FINANCIAL_MANAGER': '11-3031',
  'HR_MANAGER': '11-3121',
  'OPERATIONS_MANAGER': '11-1021',
  'SALES_MANAGER': '11-2022',
  
  // Finance
  'FINANCIAL_ANALYST': '13-2051',
  'ACCOUNTANT': '13-2011',
  'BUDGET_ANALYST': '13-2031',
  
  // Healthcare
  'REGISTERED_NURSE': '29-1141',
  'PHYSICIAN': '29-1215',
  'MEDICAL_SCIENTIST': '19-1042',
  
  // Engineering
  'MECHANICAL_ENGINEER': '17-2141',
  'CIVIL_ENGINEER': '17-2051',
  'ELECTRICAL_ENGINEER': '17-2071',
  
  // Marketing & Sales
  'MARKET_RESEARCH_ANALYST': '13-1161',
  'PUBLIC_RELATIONS': '27-3031',
  
  // Default fallback
  'ALL_OCCUPATIONS': '00-0000'
};

/**
 * Enhanced job title to occupation code mapping with more comprehensive matching
 */
export const mapJobTitleToOccupationCode = (jobTitle) => {
  if (!jobTitle) return OCCUPATION_CODES.ALL_OCCUPATIONS;
  
  const titleLower = jobTitle.toLowerCase().trim();
  
  // AI/ML roles - high demand category
  if (titleLower.includes('ai engineer') || 
      titleLower.includes('artificial intelligence') ||
      titleLower.includes('ml engineer') || 
      titleLower.includes('machine learning engineer') ||
      titleLower.includes('deep learning')) {
    return OCCUPATION_CODES.DATA_SCIENTIST;
  }
  
  // Data roles
  if (titleLower.includes('data scientist') || 
      titleLower.includes('data analyst') ||
      titleLower.includes('machine learning') ||
      titleLower.includes('nlp engineer') ||
      titleLower.includes('analytics engineer')) {
    return OCCUPATION_CODES.DATA_SCIENTIST;
  }
  
  // Software Engineering roles - most common
  if (titleLower.includes('software developer') || 
      titleLower.includes('software engineer') || 
      titleLower.includes('sde') ||
      titleLower.includes('backend developer') ||
      titleLower.includes('java developer') ||
      titleLower.includes('python developer') ||
      titleLower.includes('c++ developer') ||
      titleLower.includes('.net developer') ||
      titleLower.includes('application developer')) {
    return OCCUPATION_CODES.SOFTWARE_DEVELOPER;
  }
  
  // Web/Frontend roles
  if (titleLower.includes('web developer') || 
      titleLower.includes('frontend') || 
      titleLower.includes('front end') ||
      titleLower.includes('front-end') ||
      titleLower.includes('react developer') ||
      titleLower.includes('vue developer') ||
      titleLower.includes('angular developer') ||
      titleLower.includes('javascript developer') ||
      titleLower.includes('ui developer')) {
    return OCCUPATION_CODES.WEB_DEVELOPER;
  }
  
  // Full stack roles
  if (titleLower.includes('full stack') || 
      titleLower.includes('fullstack')) {
    return OCCUPATION_CODES.SOFTWARE_DEVELOPER;
  }
  
  // Generic developer fallback
  if (titleLower.includes('developer') || titleLower.includes('programmer')) {
    return OCCUPATION_CODES.SOFTWARE_DEVELOPER;
  }
  
  // DevOps and Cloud
  if (titleLower.includes('devops') || 
      titleLower.includes('site reliability') ||
      titleLower.includes('sre') ||
      titleLower.includes('cloud engineer') ||
      titleLower.includes('platform engineer')) {
    return OCCUPATION_CODES.SOFTWARE_DEVELOPER;
  }
  
  // Database roles
  if (titleLower.includes('database') || 
      titleLower.includes('dba') ||
      titleLower.includes('data engineer')) {
    return OCCUPATION_CODES.DATABASE_ADMIN;
  }
  
  // Security roles
  if (titleLower.includes('security') || 
      titleLower.includes('cybersecurity') ||
      titleLower.includes('infosec') ||
      titleLower.includes('penetration') ||
      titleLower.includes('ethical hacker')) {
    return OCCUPATION_CODES.INFORMATION_SECURITY;
  }
  
  // QA roles
  if (titleLower.includes('qa') || 
      titleLower.includes('quality assurance') || 
      titleLower.includes('test engineer') ||
      titleLower.includes('sdet') ||
      titleLower.includes('automation engineer')) {
    return OCCUPATION_CODES.SOFTWARE_QA;
  }
  
  // Business/Systems Analyst
  if (titleLower.includes('systems analyst') || 
      titleLower.includes('business analyst') ||
      titleLower.includes('technical analyst')) {
    return OCCUPATION_CODES.COMPUTER_SYSTEMS_ANALYST;
  }
  
  // IT Support
  if (titleLower.includes('support specialist') ||
      titleLower.includes('help desk') ||
      titleLower.includes('it support') ||
      titleLower.includes('technical support')) {
    return OCCUPATION_CODES.USER_SUPPORT;
  }
  
  // Network roles
  if (titleLower.includes('network engineer') ||
      titleLower.includes('network admin')) {
    return OCCUPATION_CODES.NETWORK_ARCHITECT;
  }
  
  // Management roles
  if (titleLower.includes('it manager') || 
      titleLower.includes('engineering manager') ||
      titleLower.includes('technical manager') ||
      titleLower.includes('director of engineering') ||
      titleLower.includes('vp of engineering') ||
      titleLower.includes('cto')) {
    return OCCUPATION_CODES.COMPUTER_MANAGER;
  }
  if (titleLower.includes('marketing manager') ||
      titleLower.includes('head of marketing') ||
      titleLower.includes('cmo')) {
    return OCCUPATION_CODES.MARKETING_MANAGER;
  }
  if (titleLower.includes('financial manager') || 
      titleLower.includes('finance manager') ||
      titleLower.includes('cfo')) {
    return OCCUPATION_CODES.FINANCIAL_MANAGER;
  }
  if (titleLower.includes('hr manager') || 
      titleLower.includes('human resources') ||
      titleLower.includes('people manager') ||
      titleLower.includes('talent manager')) {
    return OCCUPATION_CODES.HR_MANAGER;
  }
  if (titleLower.includes('sales manager') ||
      titleLower.includes('head of sales')) {
    return OCCUPATION_CODES.SALES_MANAGER;
  }
  
  // Finance roles
  if (titleLower.includes('financial analyst') || 
      titleLower.includes('investment analyst') ||
      titleLower.includes('equity analyst')) {
    return OCCUPATION_CODES.FINANCIAL_ANALYST;
  }
  if (titleLower.includes('accountant') || 
      titleLower.includes('cpa') ||
      titleLower.includes('auditor')) {
    return OCCUPATION_CODES.ACCOUNTANT;
  }
  
  // Healthcare roles
  if (titleLower.includes('nurse') || titleLower.includes('rn')) {
    return OCCUPATION_CODES.REGISTERED_NURSE;
  }
  if (titleLower.includes('physician') || titleLower.includes('doctor') || titleLower.includes('md')) {
    return OCCUPATION_CODES.PHYSICIAN;
  }
  
  // Engineering roles
  if (titleLower.includes('mechanical engineer')) {
    return OCCUPATION_CODES.MECHANICAL_ENGINEER;
  }
  if (titleLower.includes('civil engineer')) {
    return OCCUPATION_CODES.CIVIL_ENGINEER;
  }
  if (titleLower.includes('electrical engineer') ||
      titleLower.includes('electronics engineer')) {
    return OCCUPATION_CODES.ELECTRICAL_ENGINEER;
  }
  
  // Generic engineer - map to software since it's most common in tech
  if (titleLower.includes('engineer')) {
    return OCCUPATION_CODES.SOFTWARE_DEVELOPER;
  }
  
  // Marketing roles
  if (titleLower.includes('market research') || 
      titleLower.includes('marketing analyst') ||
      titleLower.includes('marketing specialist')) {
    return OCCUPATION_CODES.MARKET_RESEARCH_ANALYST;
  }
  
  // Default fallback
  return OCCUPATION_CODES.ALL_OCCUPATIONS;
};

/**
 * Map location to BLS area code
 * M = Metropolitan area, S = State, N = National
 * Area codes are FIPS-based codes used by BLS
 */
export const mapLocationToAreaCode = (location) => {
  // Handle empty, null, undefined, or whitespace-only locations
  if (!location || !location.trim || location.trim() === '') return '0000000'; // National
  
  const locationLower = location.toLowerCase().trim();
  
  // Metropolitan Statistical Areas (MSA) - Major Tech Hubs
  const msaCodes = {
    // California
    'san francisco': 'M0004186', // San Francisco-Oakland-Hayward
    'bay area': 'M0004186',
    'silicon valley': 'M0004186',
    'san jose': 'M0004174', // San Jose-Sunnyvale-Santa Clara
    'los angeles': 'M0003182', // Los Angeles-Long Beach-Anaheim
    'la': 'M0003182',
    'san diego': 'M0004166',
    'sacramento': 'M0004046',
    
    // New York Area
    'new york': 'M0003556', // New York-Newark-Jersey City
    'nyc': 'M0003556',
    'manhattan': 'M0003556',
    'brooklyn': 'M0003556',
    'queens': 'M0003556',
    'bronx': 'M0003556',
    'jersey city': 'M0003556',
    
    // Texas
    'austin': 'M0000560', // Austin-Round Rock
    'dallas': 'M0001922', // Dallas-Fort Worth-Arlington
    'dfw': 'M0001922',
    'houston': 'M0002646', // Houston-The Woodlands-Sugar Land
    'san antonio': 'M0004102',
    
    // Washington
    'seattle': 'M0004240', // Seattle-Tacoma-Bellevue
    
    // Other Major Tech Hubs
    'boston': 'M0001148', // Boston-Cambridge-Nashua
    'chicago': 'M0001692', // Chicago-Naperville-Elgin
    'denver': 'M0001968', // Denver-Aurora-Lakewood
    'atlanta': 'M0000520', // Atlanta-Sandy Springs-Roswell
    'miami': 'M0003366', // Miami-Fort Lauderdale-West Palm Beach
    'phoenix': 'M0003800', // Phoenix-Mesa-Scottsdale
    'portland': 'M0003890', // Portland-Vancouver-Hillsboro
    'raleigh': 'M0003958', // Raleigh-Cary
    'washington': 'M0004798', // Washington-Arlington-Alexandria
    'dc': 'M0004798',
    'philadelphia': 'M0003718', // Philadelphia-Camden-Wilmington
    'philly': 'M0003718',
    'detroit': 'M0001974', // Detroit-Warren-Dearborn
    'minneapolis': 'M0003358', // Minneapolis-St. Paul-Bloomington
    'charlotte': 'M0001656', // Charlotte-Concord-Gastonia
    'nashville': 'M0003474', // Nashville-Davidson-Murfreesboro
    'salt lake city': 'M0004090', // Salt Lake City
    
    // Remote work indicators - use national
    'remote': '0000000',
    'hybrid': '0000000',
    'anywhere': '0000000'
  };
  
  // Check for MSA match
  for (const [city, code] of Object.entries(msaCodes)) {
    if (locationLower.includes(city)) {
      return code;
    }
  }
  
  // State codes (if no MSA match) - use national data with state adjustments
  const stateCodes = {
    'california': 'S0600000',
    'ca': 'S0600000',
    'new york': 'S3600000',
    'ny': 'S3600000',
    'texas': 'S4800000',
    'tx': 'S4800000',
    'florida': 'S1200000',
    'fl': 'S1200000',
    'illinois': 'S1700000',
    'il': 'S1700000',
    'pennsylvania': 'S4200000',
    'pa': 'S4200000',
    'ohio': 'S3900000',
    'georgia': 'S1300000',
    'north carolina': 'S3700000',
    'nc': 'S3700000',
    'michigan': 'S2600000',
    'virginia': 'S5100000',
    'va': 'S5100000',
    'washington': 'S5300000',
    'wa': 'S5300000',
    'massachusetts': 'S2500000',
    'ma': 'S2500000',
    'colorado': 'S0800000',
    'co': 'S0800000',
    'arizona': 'S0400000',
    'az': 'S0400000',
    'oregon': 'S4100000',
    'or': 'S4100000'
  };
  
  for (const [state, code] of Object.entries(stateCodes)) {
    if (locationLower.includes(state)) {
      return code;
    }
  }
  
  // Default to national
  return '0000000';
};

/**
 * Get location multiplier for regional salary adjustments
 * Based on BLS geographic wage differentials and cost of living indices
 */
const getLocationMultiplier = (location) => {
  if (!location || !location.trim || location.trim() === '') return 1.0;
  
  const loc = location.toLowerCase().trim();
  
  // High cost metros (30%+ above national) - Major Tech Hubs
  if (loc.includes('san francisco') || loc.includes('bay area') || loc.includes('silicon valley')) return 1.45;
  if (loc.includes('san jose') || loc.includes('sunnyvale') || loc.includes('palo alto')) return 1.42;
  if (loc.includes('new york') || loc.includes('nyc') || loc.includes('manhattan')) return 1.38;
  if (loc.includes('seattle') || loc.includes('bellevue') || loc.includes('redmond')) return 1.32;
  if (loc.includes('boston') || loc.includes('cambridge')) return 1.30;
  if (loc.includes('washington') || loc.includes('dc') || loc.includes('arlington')) return 1.28;
  if (loc.includes('los angeles') || loc.includes('la') || loc.includes('pasadena')) return 1.25;
  if (loc.includes('san diego')) return 1.22;
  
  // Medium-high cost metros (15-25% above national)
  if (loc.includes('denver') || loc.includes('boulder')) return 1.18;
  if (loc.includes('austin')) return 1.17;
  if (loc.includes('portland') || loc.includes('oregon')) return 1.16;
  if (loc.includes('chicago')) return 1.14;
  if (loc.includes('philadelphia') || loc.includes('philly')) return 1.12;
  if (loc.includes('miami')) return 1.12;
  if (loc.includes('minneapolis')) return 1.10;
  if (loc.includes('raleigh') || loc.includes('durham')) return 1.10;
  
  // Medium cost metros (5-15% above national)
  if (loc.includes('atlanta')) return 1.08;
  if (loc.includes('dallas') || loc.includes('dfw')) return 1.06;
  if (loc.includes('houston')) return 1.05;
  if (loc.includes('phoenix')) return 1.05;
  if (loc.includes('charlotte')) return 1.04;
  if (loc.includes('nashville')) return 1.04;
  if (loc.includes('salt lake')) return 1.04;
  if (loc.includes('detroit')) return 1.02;
  
  // Below average cost
  if (loc.includes('san antonio')) return 0.98;
  if (loc.includes('indianapolis')) return 0.95;
  if (loc.includes('columbus') && loc.includes('ohio')) return 0.96;
  
  // Remote - slight premium for flexibility
  if (loc.includes('remote') || loc.includes('hybrid') || loc.includes('anywhere')) return 1.05;
  
  // Default to national average
  return 1.0;
};

/**
 * Attempt to fetch live salary data from BLS API
 * Falls back to static data if API call fails
 * @param {string} occupationCode - SOC occupation code
 * @param {string} areaCode - BLS area code
 * @returns {Promise<Object|null>} Live BLS data or null
 */
const fetchLiveBLSData = async (occupationCode, areaCode = '0000000') => {
  const apiKey = getBLSAPIKey();
  
  // Rate limiting
  const now = Date.now();
  if (now - lastApiCall < API_CALL_DELAY_MS) {
    await new Promise(resolve => setTimeout(resolve, API_CALL_DELAY_MS - (now - lastApiCall)));
  }
  lastApiCall = Date.now();
  
  try {
    // Build series IDs for OES data
    // Format: OEUS[AREA][SOC][DATATYPE]
    // DATATYPE: 01 = Employment, 03 = Mean wage, 04 = Median wage
    const cleanOcc = occupationCode.replace('-', '');
    const seriesIds = [
      `OEUS${areaCode}${cleanOcc}03`, // Mean
      `OEUS${areaCode}${cleanOcc}04`, // Median
    ];
    
    const requestBody = {
      seriesid: seriesIds,
      startyear: '2023',
      endyear: '2024'
    };
    
    // Add API key if available for higher rate limits
    if (apiKey) {
      requestBody.registrationkey = apiKey;
    }
    
    console.log(`[BLS API] Fetching live data for occupation ${occupationCode}...`);
    
    const response = await axios.post(
      `${BLS_API_BASE_URL}/timeseries/data/`,
      requestBody,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000 // 10 second timeout
      }
    );
    
    if (response.data?.status === 'REQUEST_SUCCEEDED' && response.data?.Results?.series) {
      const seriesData = response.data.Results.series;
      
      // Extract wage data from response
      const wageData = {};
      seriesData.forEach(series => {
        if (series.data && series.data.length > 0) {
          const latestData = series.data[0];
          const dataType = series.seriesID.slice(-2);
          
          if (dataType === '03') wageData.mean = parseFloat(latestData.value);
          if (dataType === '04') wageData.median = parseFloat(latestData.value);
        }
      });
      
      if (wageData.median || wageData.mean) {
        console.log(`[BLS API] Successfully retrieved live data: median=$${wageData.median}, mean=$${wageData.mean}`);
        return wageData;
      }
    }
    
    console.log('[BLS API] No valid data in response, using fallback data');
    return null;
    
  } catch (error) {
    console.log(`[BLS API] API call failed: ${error.message}. Using fallback data.`);
    return null;
  }
};

/**
 * Fetch salary data from BLS
 * Attempts live API call first, falls back to comprehensive static OES data
 * @param {string} jobTitle - Job title to search for
 * @param {string} location - Location (city, state, or empty for national)
 * @returns {Promise<Object>} Salary data with percentiles
 */
export const fetchBLSSalaryData = async (jobTitle, location = '') => {
  try {
    // Map job title to occupation code
    const occupationCode = mapJobTitleToOccupationCode(jobTitle);
    const areaCode = mapLocationToAreaCode(location);
    const locationMultiplier = getLocationMultiplier(location);
    
    console.log(`[BLS] Fetching data for: "${jobTitle}" in "${location || 'National'}"`);
    console.log(`[BLS] Mapped to occupation code: ${occupationCode}, area code: ${areaCode}`);
    console.log(`[BLS] Location multiplier: ${locationMultiplier}x`);

    // First, try to fetch live data from BLS API
    let liveData = null;
    const apiKey = getBLSAPIKey();
    if (apiKey) {
      console.log('[BLS] API key found, attempting live data fetch...');
      liveData = await fetchLiveBLSData(occupationCode, areaCode);
    } else {
      console.log('[BLS] No API key configured, using static OES data');
    }

    // Get static OES data for this occupation (always available as backup/supplement)
    const oesData = BLS_OES_DATA[occupationCode];
    
    if (!oesData && !liveData) {
      console.warn(`[BLS] No data available for occupation code: ${occupationCode}`);
      // Try to return ALL_OCCUPATIONS as a fallback
      const fallbackData = BLS_OES_DATA['00-0000'];
      if (fallbackData) {
        console.log('[BLS] Using ALL_OCCUPATIONS fallback data');
        return {
          median: Math.round(fallbackData.median * locationMultiplier),
          mean: Math.round(fallbackData.mean * locationMultiplier),
          percentile10: Math.round(fallbackData.percentile10 * locationMultiplier),
          percentile25: Math.round(fallbackData.percentile25 * locationMultiplier),
          percentile75: Math.round(fallbackData.percentile75 * locationMultiplier),
          percentile90: Math.round(fallbackData.percentile90 * locationMultiplier),
          year: fallbackData.year,
          occupationCode: '00-0000',
          occupationTitle: 'All Occupations (Average)',
          areaCode: areaCode,
          location: location || 'National',
          locationAdjusted: locationMultiplier !== 1.0,
          locationMultiplier,
          dataSource: 'BLS OES Static Data (Fallback)',
          note: `No specific data found for "${jobTitle}". Showing national average for all occupations.`
        };
      }
      return null;
    }

    // Combine live data with static data (live takes precedence where available)
    const baseData = oesData || {};
    const combinedData = {
      median: liveData?.median || baseData.median,
      mean: liveData?.mean || baseData.mean,
      percentile10: baseData.percentile10,
      percentile25: baseData.percentile25,
      percentile75: baseData.percentile75,
      percentile90: baseData.percentile90,
      year: liveData ? 2024 : (baseData.year || 2024),
      employment: baseData.employment
    };

    // Apply location adjustment to all salary figures
    const adjustedData = {
      median: Math.round(combinedData.median * locationMultiplier),
      mean: Math.round(combinedData.mean * locationMultiplier),
      percentile10: Math.round(combinedData.percentile10 * locationMultiplier),
      percentile25: Math.round(combinedData.percentile25 * locationMultiplier),
      percentile75: Math.round(combinedData.percentile75 * locationMultiplier),
      percentile90: combinedData.percentile90 ? Math.round(combinedData.percentile90 * locationMultiplier) : Math.round(combinedData.percentile75 * 1.3 * locationMultiplier),
      year: combinedData.year,
      occupationCode,
      occupationTitle: baseData.title || jobTitle,
      areaCode: areaCode,
      location: location || 'National',
      locationAdjusted: locationMultiplier !== 1.0,
      locationMultiplier,
      employment: combinedData.employment,
      dataSource: liveData ? 'BLS API Live Data' : 'BLS OES Official Data'
    };

    console.log(`[BLS] Successfully retrieved data for ${adjustedData.occupationTitle}`);
    console.log(`[BLS] Median salary: $${adjustedData.median.toLocaleString()} (${adjustedData.dataSource})`);
    console.log(`[BLS] Salary range: $${adjustedData.percentile10.toLocaleString()} - $${adjustedData.percentile90.toLocaleString()}`);

    return adjustedData;
  } catch (error) {
    console.error('[BLS] Error fetching BLS salary data:', error.message);
    throw error;
  }
};

/**
 * Format BLS salary data for display
 * @param {Object} blsData - Raw BLS data
 * @returns {Object} Formatted salary data with comprehensive structure
 */
export const formatBLSData = (blsData) => {
  if (!blsData) return null;

  return {
    source: 'US Bureau of Labor Statistics',
    dataSource: blsData.dataSource || 'BLS OES Official Data',
    dataYear: blsData.year,
    location: blsData.location,
    occupationTitle: blsData.occupationTitle,
    salaryRange: {
      min: blsData.percentile10 || blsData.percentile25,
      max: blsData.percentile90 || blsData.percentile75,
      median: blsData.median,
      mean: blsData.mean,
    },
    percentiles: {
      p10: blsData.percentile10,
      p25: blsData.percentile25,
      p50: blsData.median,
      p75: blsData.percentile75,
      p90: blsData.percentile90,
    },
    employment: blsData.employment,
    metadata: {
      occupationCode: blsData.occupationCode,
      areaCode: blsData.areaCode,
      locationAdjusted: blsData.locationAdjusted,
      locationMultiplier: blsData.locationMultiplier,
      lastUpdated: new Date(),
    },
    note: blsData.note
  };
};

/**
 * Get salary insights and comparisons
 * @param {Object} blsData - BLS salary data
 * @param {number} providedSalary - Salary from job posting (optional)
 * @returns {Object} Insights and recommendations
 */
export const getSalaryInsights = (blsData, providedSalary = null) => {
  if (!blsData) return null;
  
  const insights = {
    marketPosition: null,
    percentileRank: null,
    recommendations: [],
    warnings: []
  };
  
  if (providedSalary && blsData.median) {
    const percentDiff = ((providedSalary - blsData.median) / blsData.median) * 100;
    
    if (providedSalary < blsData.percentile10) {
      insights.marketPosition = 'below_market';
      insights.percentileRank = '<10th';
      insights.warnings.push('This salary is significantly below market average (bottom 10%)');
      insights.recommendations.push('Consider negotiating for a higher salary or seeking other opportunities');
    } else if (providedSalary < blsData.percentile25) {
      insights.marketPosition = 'below_average';
      insights.percentileRank = '10th-25th';
      insights.warnings.push('This salary is below the market average');
      insights.recommendations.push('You may have room to negotiate up to the median');
    } else if (providedSalary < blsData.median) {
      insights.marketPosition = 'slightly_below_average';
      insights.percentileRank = '25th-50th';
      insights.recommendations.push('Consider negotiating to reach the median');
    } else if (providedSalary < blsData.percentile75) {
      insights.marketPosition = 'above_average';
      insights.percentileRank = '50th-75th';
      insights.recommendations.push('This is a competitive offer');
    } else if (providedSalary < blsData.percentile90) {
      insights.marketPosition = 'well_above_average';
      insights.percentileRank = '75th-90th';
      insights.recommendations.push('Excellent offer! This is in the top quartile');
    } else {
      insights.marketPosition = 'top_market';
      insights.percentileRank = '>90th';
      insights.recommendations.push('Outstanding offer! Top 10% in the market');
    }
    
    insights.percentageDifference = percentDiff.toFixed(1);
  }
  
  return insights;
};

export default {
  fetchBLSSalaryData,
  formatBLSData,
  getSalaryInsights,
  mapJobTitleToOccupationCode,
  mapLocationToAreaCode,
  OCCUPATION_CODES,
  BLS_OES_DATA
};
