import axios from 'axios';

/**
 * UC-112: Salary Data Integration - Bureau of Labor Statistics Service
 * 
 * This service provides salary benchmark data from the US Bureau of Labor Statistics (BLS)
 * using their published Occupational Employment and Wage Statistics (OES) data.
 * 
 * Data Source: BLS OES May 2023 National Occupational Employment and Wage Estimates
 * Note: BLS OES data is published annually and is not available via their standard timeseries API.
 * This implementation uses the official published data tables.
 * 
 * Documentation: https://www.bls.gov/oes/tables.htm
 */

const BLS_API_BASE_URL = 'https://api.bls.gov/publicAPI/v2';
const getBLSAPIKey = () => process.env.LABOR_STATISTICS_KEY;

/**
 * Static BLS OES May 2023 National Data
 * Source: https://www.bls.gov/oes/current/oes_nat.htm
 */
const BLS_OES_DATA = {
  '15-1252': { // Software Developers
    title: 'Software Developers',
    median: 130160,
    mean: 138110,
    percentile10: 77020,
    percentile25: 102280,
    percentile75: 168570,
    percentile90: 208620,
    year: 2023
  },
  '15-1254': { // Web Developers
    title: 'Web Developers and Digital Interface Designers',
    median: 84960,
    mean: 98110,
    percentile10: 44450,
    percentile25: 62260,
    percentile75: 119520,
    percentile90: 156570,
    year: 2023
  },
  '15-2051': { // Data Scientists
    title: 'Data Scientists',
    median: 108020,
    mean: 119710,
    percentile10: 62080,
    percentile25: 80670,
    percentile75: 143860,
    percentile90: 184090,
    year: 2023
  },
  '15-1242': { // Database Administrators
    title: 'Database Administrators',
    median: 101510,
    mean: 110790,
    percentile10: 53050,
    percentile25: 73910,
    percentile75: 133550,
    percentile90: 167380,
    year: 2023
  },
  '15-1241': { // Computer Network Architects
    title: 'Computer Network Architects',
    median: 126900,
    mean: 134470,
    percentile10: 73770,
    percentile25: 92970,
    percentile75: 164770,
    percentile90: 204660,
    year: 2023
  },
  '15-1212': { // Information Security Analysts
    title: 'Information Security Analysts',
    median: 120360,
    mean: 125380,
    percentile10: 68470,
    percentile25: 90900,
    percentile75: 154370,
    percentile90: 182370,
    year: 2023
  },
  '15-1211': { // Computer Systems Analysts
    title: 'Computer Systems Analysts',
    median: 102240,
    mean: 108710,
    percentile10: 60660,
    percentile25: 78490,
    percentile75: 130360,
    percentile90: 161310,
    year: 2023
  },
  '15-1253': { // Software Quality Assurance
    title: 'Software Quality Assurance Analysts and Testers',
    median: 101800,
    mean: 109710,
    percentile10: 58570,
    percentile25: 78990,
    percentile75: 130450,
    percentile90: 161350,
    year: 2023
  },
  '11-3021': { // Computer and IS Managers
    title: 'Computer and Information Systems Managers',
    median: 169510,
    mean: 180720,
    percentile10: 100620,
    percentile25: 131040,
    percentile75: 217830,
    percentile90: 267370,
    year: 2023
  },
  '13-2051': { // Financial Analysts
    title: 'Financial Analysts',
    median: 99890,
    mean: 112540,
    percentile10: 59390,
    percentile25: 75730,
    percentile75: 135740,
    percentile90: 172630,
    year: 2023
  },
  '29-1141': { // Registered Nurses
    title: 'Registered Nurses',
    median: 86070,
    mean: 89010,
    percentile10: 61870,
    percentile25: 72040,
    percentile75: 103340,
    percentile90: 123960,
    year: 2023
  }
};

/**
 * Common occupation codes (SOC - Standard Occupational Classification)
 */
export const OCCUPATION_CODES = {
  // Technology
  'SOFTWARE_DEVELOPER': '15-1252',
  'WEB_DEVELOPER': '15-1254',
  'DATA_SCIENTIST': '15-2051',
  'DATABASE_ADMIN': '15-1242',
  'NETWORK_ARCHITECT': '15-1241',
  'INFORMATION_SECURITY': '15-1212',
  'COMPUTER_SYSTEMS_ANALYST': '15-1211',
  'SOFTWARE_QA': '15-1253',
  
  // Management
  'COMPUTER_MANAGER': '11-3021',
  'MARKETING_MANAGER': '11-2021',
  'FINANCIAL_MANAGER': '11-3031',
  'HR_MANAGER': '11-3121',
  'OPERATIONS_MANAGER': '11-1021',
  
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
  'SALES_MANAGER': '11-2022',
  'PUBLIC_RELATIONS': '27-3031',
  
  // Default fallback
  'ALL_OCCUPATIONS': '00-0000'
};

/**
 * Map common job titles to BLS occupation codes
 */
export const mapJobTitleToOccupationCode = (jobTitle) => {
  const titleLower = jobTitle.toLowerCase();
  
  // Technology roles
  // AI/ML roles - map to Data Scientist or Software Developer
  if (titleLower.includes('ai engineer') || titleLower.includes('artificial intelligence')) {
    return OCCUPATION_CODES.DATA_SCIENTIST; // AI Engineers are similar to Data Scientists
  }
  if (titleLower.includes('ml engineer') || titleLower.includes('machine learning engineer')) {
    return OCCUPATION_CODES.DATA_SCIENTIST;
  }
  if (titleLower.includes('data scientist') || titleLower.includes('machine learning')) {
    return OCCUPATION_CODES.DATA_SCIENTIST;
  }
  
  // Software Engineering roles
  if (titleLower.includes('software developer') || titleLower.includes('software engineer') || titleLower.includes('engineer')) {
    return OCCUPATION_CODES.SOFTWARE_DEVELOPER;
  }
  if (titleLower.includes('web developer') || titleLower.includes('frontend') || titleLower.includes('backend') || titleLower.includes('full stack')) {
    return OCCUPATION_CODES.WEB_DEVELOPER;
  }
  if (titleLower.includes('developer')) {
    return OCCUPATION_CODES.SOFTWARE_DEVELOPER;
  }
  
  // Other tech roles
  if (titleLower.includes('database') || titleLower.includes('dba')) {
    return OCCUPATION_CODES.DATABASE_ADMIN;
  }
  if (titleLower.includes('security') || titleLower.includes('cybersecurity')) {
    return OCCUPATION_CODES.INFORMATION_SECURITY;
  }
  if (titleLower.includes('qa') || titleLower.includes('quality assurance') || titleLower.includes('test')) {
    return OCCUPATION_CODES.SOFTWARE_QA;
  }
  if (titleLower.includes('systems analyst') || titleLower.includes('business analyst')) {
    return OCCUPATION_CODES.COMPUTER_SYSTEMS_ANALYST;
  }
  
  // Management roles
  if (titleLower.includes('it manager') || titleLower.includes('engineering manager')) {
    return OCCUPATION_CODES.COMPUTER_MANAGER;
  }
  if (titleLower.includes('marketing manager')) {
    return OCCUPATION_CODES.MARKETING_MANAGER;
  }
  if (titleLower.includes('financial manager') || titleLower.includes('finance manager')) {
    return OCCUPATION_CODES.FINANCIAL_MANAGER;
  }
  if (titleLower.includes('hr manager') || titleLower.includes('human resources')) {
    return OCCUPATION_CODES.HR_MANAGER;
  }
  
  // Finance roles
  if (titleLower.includes('financial analyst') || titleLower.includes('investment analyst')) {
    return OCCUPATION_CODES.FINANCIAL_ANALYST;
  }
  if (titleLower.includes('accountant') || titleLower.includes('cpa')) {
    return OCCUPATION_CODES.ACCOUNTANT;
  }
  
  // Healthcare roles
  if (titleLower.includes('nurse') || titleLower.includes('rn')) {
    return OCCUPATION_CODES.REGISTERED_NURSE;
  }
  if (titleLower.includes('physician') || titleLower.includes('doctor')) {
    return OCCUPATION_CODES.PHYSICIAN;
  }
  
  // Engineering roles
  if (titleLower.includes('mechanical engineer')) {
    return OCCUPATION_CODES.MECHANICAL_ENGINEER;
  }
  if (titleLower.includes('civil engineer')) {
    return OCCUPATION_CODES.CIVIL_ENGINEER;
  }
  if (titleLower.includes('electrical engineer')) {
    return OCCUPATION_CODES.ELECTRICAL_ENGINEER;
  }
  
  // Marketing roles
  if (titleLower.includes('market research') || titleLower.includes('market analyst')) {
    return OCCUPATION_CODES.MARKET_RESEARCH_ANALYST;
  }
  if (titleLower.includes('sales manager')) {
    return OCCUPATION_CODES.SALES_MANAGER;
  }
  
  // Default fallback
  return OCCUPATION_CODES.ALL_OCCUPATIONS;
};

/**
 * Map location to BLS area code
 * M = Metropolitan area, S = State, N = National
 */
export const mapLocationToAreaCode = (location) => {
  // Handle empty, null, undefined, or whitespace-only locations
  if (!location || !location.trim || location.trim() === '') return '0000000'; // National
  
  const locationLower = location.toLowerCase();
  
  // Metropolitan Statistical Areas (MSA)
  const msaCodes = {
    'new york': '0003556', // New York-Newark-Jersey City
    'nyc': '0003556', // NYC abbreviation
    'manhattan': '0003556',
    'brooklyn': '0003556',
    'queens': '0003556',
    'bronx': '0003556',
    'los angeles': '0003182', // Los Angeles-Long Beach-Anaheim
    'la': '0003182',
    'chicago': '0001692', // Chicago-Naperville-Elgin
    'dallas': '0001922', // Dallas-Fort Worth-Arlington
    'houston': '0002646', // Houston-The Woodlands-Sugar Land
    'washington': '0004798', // Washington-Arlington-Alexandria
    'dc': '0004798',
    'miami': '0003366', // Miami-Fort Lauderdale-West Palm Beach
    'philadelphia': '0003718', // Philadelphia-Camden-Wilmington
    'philly': '0003718',
    'atlanta': '0000520', // Atlanta-Sandy Springs-Roswell
    'boston': '0001148', // Boston-Cambridge-Nashua
    'san francisco': '0004186', // San Francisco-Oakland-Hayward
    'phoenix': '0003800', // Phoenix-Mesa-Scottsdale
    'seattle': '0004240', // Seattle-Tacoma-Bellevue
    'detroit': '0001922', // Detroit-Warren-Dearborn
    'san diego': '0004166', // San Diego-Carlsbad
    'denver': '0001968', // Denver-Aurora-Lakewood
    'austin': '0000560', // Austin-Round Rock
  };
  
  // Check for MSA match
  for (const [city, code] of Object.entries(msaCodes)) {
    if (locationLower.includes(city)) {
      return code;
    }
  }
  
  // State codes (if no MSA match)
  const stateCodes = {
    'california': '0600000',
    'new york': '3600000',
    'texas': '4800000',
    'florida': '1200000',
    'illinois': '1700000',
    'pennsylvania': '4200000',
    'ohio': '3900000',
    'georgia': '1300000',
    'north carolina': '3700000',
    'michigan': '2600000',
    'virginia': '5100000',
    'washington': '5300000',
    'massachusetts': '2500000',
    'colorado': '0800000',
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
 * Build BLS series ID for occupational employment and wages
 * Format: OEUM[STATE][AREA][INDUSTRY][OCC][DATA_TYPE]
 * DATA_TYPE: 03 = mean wage, 04 = median wage, 11 = 25th percentile, 12 = 75th percentile
 */
const buildSeriesId = (occupationCode, areaCode, dataType) => {
  // Remove hyphens from occupation code
  const cleanOccCode = occupationCode.replace(/-/g, '');
  
  // OEUM format: OEUM + STATE(2) + AREA(5) + INDUSTRY(6) + OCC(6) + DATA_TYPE(2)
  // Using 000000 for all industries
  return `OEUM${areaCode}000000${cleanOccCode}${dataType}`;
};

/**
 * Get location multiplier for regional salary adjustments
 * Based on cost of living indices
 */
const getLocationMultiplier = (location) => {
  if (!location || !location.trim || location.trim() === '') return 1.0;
  
  const loc = location.toLowerCase();
  
  // High cost metros (30%+ above national)
  if (loc.includes('san francisco') || loc.includes('bay area')) return 1.45;
  if (loc.includes('new york') || loc.includes('nyc') || loc.includes('manhattan')) return 1.35;
  if (loc.includes('seattle')) return 1.30;
  if (loc.includes('boston')) return 1.28;
  if (loc.includes('washington') || loc.includes('dc')) return 1.25;
  if (loc.includes('los angeles') || loc.includes('la')) return 1.23;
  if (loc.includes('san diego')) return 1.20;
  
  // Medium cost metros (10-20% above national)
  if (loc.includes('denver')) return 1.15;
  if (loc.includes('austin')) return 1.15;
  if (loc.includes('portland')) return 1.15;
  if (loc.includes('chicago')) return 1.12;
  if (loc.includes('philadelphia')) return 1.10;
  if (loc.includes('miami')) return 1.10;
  if (loc.includes('atlanta')) return 1.08;
  
  // Default to national average
  return 1.0;
};

/**
 * Fetch salary data from BLS OES static data
 * @param {string} jobTitle - Job title to search for
 * @param {string} location - Location (city, state, or empty for national)
 * @returns {Promise<Object>} Salary data with percentiles
 */
export const fetchBLSSalaryData = async (jobTitle, location = '') => {
  try {
    // Map job title to occupation code
    const occupationCode = mapJobTitleToOccupationCode(jobTitle);
    const locationMultiplier = getLocationMultiplier(location);
    
    console.log(`[BLS] Fetching data for: ${jobTitle} in ${location || 'National'}`);
    console.log(`[BLS] Mapped to occupation code: ${occupationCode}`);
    console.log(`[BLS] Location multiplier: ${locationMultiplier}x`);

    // Get static OES data for this occupation
    const oesData = BLS_OES_DATA[occupationCode];
    
    if (!oesData) {
      console.warn(`[BLS] No OES data available for occupation code: ${occupationCode}`);
      return null;
    }

    // Apply location adjustment
    const adjustedData = {
      median: Math.round(oesData.median * locationMultiplier),
      mean: Math.round(oesData.mean * locationMultiplier),
      percentile10: Math.round(oesData.percentile10 * locationMultiplier),
      percentile25: Math.round(oesData.percentile25 * locationMultiplier),
      percentile75: Math.round(oesData.percentile75 * locationMultiplier),
      percentile90: Math.round(oesData.percentile90 * locationMultiplier),
      year: oesData.year,
      occupationCode,
      occupationTitle: oesData.title,
      areaCode: '0000000', // National base data
      location: location || 'National',
      locationAdjusted: locationMultiplier !== 1.0,
      locationMultiplier
    };

    console.log(`[BLS] Successfully retrieved OES data for ${oesData.title}`);
    console.log(`[BLS] Median salary: $${adjustedData.median.toLocaleString()}`);

    return adjustedData;
  } catch (error) {
    console.error('[BLS] Error fetching BLS salary data:', error.message);
    throw error;
  }
};

/**
 * Format BLS salary data for display
 * @param {Object} blsData - Raw BLS data
 * @returns {Object} Formatted salary data
 */
export const formatBLSData = (blsData) => {
  if (!blsData) return null;

  return {
    source: 'US Bureau of Labor Statistics',
    dataYear: blsData.year,
    location: blsData.location,
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
    metadata: {
      occupationCode: blsData.occupationCode,
      areaCode: blsData.areaCode,
      lastUpdated: new Date(),
    },
  };
};

export default {
  fetchBLSSalaryData,
  formatBLSData,
  mapJobTitleToOccupationCode,
  mapLocationToAreaCode,
};
