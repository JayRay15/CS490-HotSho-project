import { Job } from "../models/Job.js";
import { User } from "../models/User.js";
import { SalaryProgression } from "../models/SalaryProgression.js";
import { successResponse, errorResponse, sendResponse, ERROR_CODES } from "../utils/responseFormat.js";
import { asyncHandler } from "../middleware/errorHandler.js";

/**
 * UC-127: Offer Evaluation & Comparison Tool Controller
 * 
 * Provides comprehensive job offer comparison features including:
 * - Side-by-side offer comparison matrix
 * - Total compensation calculation with benefits valuation
 * - Cost of living adjustments by location
 * - Non-financial factor scoring (culture, growth, work-life balance)
 * - Weighted score calculations
 * - Negotiation recommendations
 * - Scenario analysis (what-if calculations)
 * - Archive declined offers with reasons
 */

// Cost of living index by major cities (US average = 100)
const COST_OF_LIVING_INDEX = {
  "San Francisco": 180,
  "New York": 170,
  "Los Angeles": 150,
  "Seattle": 145,
  "Boston": 140,
  "Washington DC": 135,
  "San Diego": 130,
  "Denver": 115,
  "Chicago": 110,
  "Austin": 105,
  "Portland": 105,
  "Atlanta": 100,
  "Dallas": 100,
  "Phoenix": 95,
  "Houston": 95,
  "Miami": 95,
  "Minneapolis": 95,
  "Philadelphia": 100,
  "Remote": 100,
  "National Average": 100
};

// Benefits valuation estimates (annual value)
const BENEFITS_VALUES = {
  healthInsurance: {
    premium: 7500,      // Employer-paid premium value
    excellent: 10000,   // Excellent coverage
    good: 7500,         // Good coverage
    basic: 5000         // Basic coverage
  },
  dentalInsurance: 500,
  visionInsurance: 200,
  retirement401k: {
    // Value is calculated as match percentage * salary
    noMatch: 0,
    threePercent: 0.03,
    fourPercent: 0.04,
    sixPercent: 0.06,
    full: 0.06
  },
  pto: {
    perDay: 300  // Value per PTO day (based on ~$75k salary / 250 work days)
  },
  remoteWork: {
    full: 5000,   // Savings from full remote (commute, lunch, wardrobe)
    hybrid: 2500,
    none: 0
  },
  flexibleSchedule: 1500,
  professionalDevelopment: {
    excellent: 5000,
    good: 2500,
    basic: 1000,
    none: 0
  },
  stockOptions: 0, // Calculated separately based on equity value
  lifeInsurance: 500,
  disability: 1000,
  parentalLeave: 2000,  // Value for 12+ weeks
  gym: 600,
  commuter: 1500
};

// Default weights for scoring factors
const DEFAULT_WEIGHTS = {
  totalCompensation: 0.35,
  baseSalary: 0.15,
  benefits: 0.15,
  culturefit: 0.10,
  growthOpportunities: 0.10,
  workLifeBalance: 0.10,
  location: 0.05
};

/**
 * Helper: Get cost of living index for a location
 */
const getCostOfLivingIndex = (location) => {
  if (!location) return 100;
  
  const locationLower = location.toLowerCase();
  
  // Check for exact matches
  for (const [city, index] of Object.entries(COST_OF_LIVING_INDEX)) {
    if (locationLower.includes(city.toLowerCase())) {
      return index;
    }
  }
  
  // Check for state-level defaults
  if (locationLower.includes('california')) return 140;
  if (locationLower.includes('new york')) return 130;
  if (locationLower.includes('massachusetts')) return 125;
  if (locationLower.includes('washington')) return 120;
  if (locationLower.includes('texas')) return 95;
  if (locationLower.includes('florida')) return 100;
  
  return 100; // Default to national average
};

/**
 * Helper: Calculate total benefits value
 */
const calculateBenefitsValue = (benefits, baseSalary) => {
  let totalValue = 0;
  
  if (!benefits) return 0;
  
  // Health insurance
  if (benefits.healthInsurance) {
    const quality = benefits.healthInsuranceQuality || 'good';
    totalValue += BENEFITS_VALUES.healthInsurance[quality] || BENEFITS_VALUES.healthInsurance.good;
  }
  
  // Dental and Vision
  if (benefits.dentalInsurance) totalValue += BENEFITS_VALUES.dentalInsurance;
  if (benefits.visionInsurance) totalValue += BENEFITS_VALUES.visionInsurance;
  
  // 401k match
  if (benefits.retirement401k && benefits.retirementMatch) {
    const matchPercentage = parseFloat(benefits.retirementMatch) / 100 || 0.04;
    totalValue += baseSalary * matchPercentage;
  }
  
  // PTO
  if (benefits.paidTimeOff) {
    totalValue += benefits.paidTimeOff * BENEFITS_VALUES.pto.perDay;
  }
  
  // Remote work
  if (benefits.remoteWork) {
    totalValue += BENEFITS_VALUES.remoteWork[benefits.remoteWork.toLowerCase()] || 0;
  }
  
  // Flexible schedule
  if (benefits.flexibleSchedule) {
    totalValue += BENEFITS_VALUES.flexibleSchedule;
  }
  
  // Professional development
  if (benefits.professionalDevelopment) {
    if (typeof benefits.professionalDevelopment === 'string') {
      const level = benefits.professionalDevelopment.toLowerCase();
      if (level.includes('excellent') || level.includes('unlimited')) {
        totalValue += BENEFITS_VALUES.professionalDevelopment.excellent;
      } else if (level.includes('good') || parseInt(benefits.professionalDevelopment) >= 2500) {
        totalValue += BENEFITS_VALUES.professionalDevelopment.good;
      } else {
        totalValue += BENEFITS_VALUES.professionalDevelopment.basic;
      }
    } else if (typeof benefits.professionalDevelopment === 'number') {
      totalValue += benefits.professionalDevelopment;
    }
  }
  
  // Other benefits
  if (benefits.lifeInsurance) totalValue += BENEFITS_VALUES.lifeInsurance;
  if (benefits.disability) totalValue += BENEFITS_VALUES.disability;
  if (benefits.parentalLeave) totalValue += BENEFITS_VALUES.parentalLeave;
  if (benefits.gym) totalValue += BENEFITS_VALUES.gym;
  if (benefits.commuter) totalValue += BENEFITS_VALUES.commuter;
  
  return Math.round(totalValue);
};

/**
 * Helper: Calculate weighted score for an offer
 */
const calculateWeightedScore = (offer, weights = DEFAULT_WEIGHTS, maxValues = {}) => {
  const scores = {};
  let totalScore = 0;
  
  // Normalize values to 0-100 scale based on max values across all offers
  const normalize = (value, max) => {
    if (!max || max === 0) return 50;
    return Math.min(100, (value / max) * 100);
  };
  
  // Financial scores
  scores.totalCompensation = {
    raw: offer.totalCompensation || 0,
    normalized: normalize(offer.totalCompensation, maxValues.totalCompensation),
    weight: weights.totalCompensation
  };
  
  scores.baseSalary = {
    raw: offer.baseSalary || 0,
    normalized: normalize(offer.baseSalary, maxValues.baseSalary),
    weight: weights.baseSalary
  };
  
  scores.benefits = {
    raw: offer.benefitsValue || 0,
    normalized: normalize(offer.benefitsValue, maxValues.benefitsValue),
    weight: weights.benefits
  };
  
  // Non-financial scores (1-10 scale, converted to 0-100)
  scores.cultureFit = {
    raw: offer.nonFinancialFactors?.cultureFit || 5,
    normalized: (offer.nonFinancialFactors?.cultureFit || 5) * 10,
    weight: weights.culturefit
  };
  
  scores.growthOpportunities = {
    raw: offer.nonFinancialFactors?.growthOpportunities || 5,
    normalized: (offer.nonFinancialFactors?.growthOpportunities || 5) * 10,
    weight: weights.growthOpportunities
  };
  
  scores.workLifeBalance = {
    raw: offer.nonFinancialFactors?.workLifeBalance || 5,
    normalized: (offer.nonFinancialFactors?.workLifeBalance || 5) * 10,
    weight: weights.workLifeBalance
  };
  
  scores.location = {
    raw: offer.nonFinancialFactors?.locationDesirability || 5,
    normalized: (offer.nonFinancialFactors?.locationDesirability || 5) * 10,
    weight: weights.location
  };
  
  // Calculate weighted total
  for (const [key, value] of Object.entries(scores)) {
    totalScore += value.normalized * value.weight;
  }
  
  return {
    scores,
    totalScore: Math.round(totalScore * 10) / 10,
    maxPossible: 100
  };
};

/**
 * Helper: Generate negotiation recommendations for an offer
 */
const generateNegotiationRecommendations = (offer, marketData, allOffers) => {
  const recommendations = [];
  
  // Compare to market median
  if (marketData?.median && offer.baseSalary < marketData.median) {
    const gap = marketData.median - offer.baseSalary;
    const gapPercentage = ((gap / offer.baseSalary) * 100).toFixed(1);
    recommendations.push({
      category: 'Base Salary',
      priority: 'High',
      recommendation: `Your offer is ${gapPercentage}% below market median. Consider negotiating for $${marketData.median.toLocaleString()} or higher.`,
      potentialGain: gap
    });
  }
  
  // Compare to other offers
  if (allOffers && allOffers.length > 1) {
    const highestOffer = Math.max(...allOffers.map(o => o.totalCompensation || 0));
    if (offer.totalCompensation < highestOffer) {
      const gap = highestOffer - offer.totalCompensation;
      recommendations.push({
        category: 'Total Compensation',
        priority: 'Medium',
        recommendation: `This offer is $${gap.toLocaleString()} less in total compensation than your best offer. Use competing offers as leverage.`,
        potentialGain: gap
      });
    }
  }
  
  // Signing bonus recommendation
  if (!offer.signingBonus || offer.signingBonus === 0) {
    recommendations.push({
      category: 'Signing Bonus',
      priority: 'Medium',
      recommendation: 'No signing bonus included. Consider requesting 5-15% of base salary as a signing bonus.',
      potentialGain: Math.round(offer.baseSalary * 0.10)
    });
  }
  
  // Remote work recommendation
  if (offer.benefits?.remoteWork === 'None' || offer.benefits?.remoteWork === '') {
    recommendations.push({
      category: 'Remote Work',
      priority: 'Medium',
      recommendation: 'No remote work option. Consider negotiating for at least hybrid flexibility, worth ~$2,500/year in savings.',
      potentialGain: 2500
    });
  }
  
  // PTO recommendation
  if (!offer.benefits?.paidTimeOff || offer.benefits.paidTimeOff < 15) {
    const currentPTO = offer.benefits?.paidTimeOff || 10;
    recommendations.push({
      category: 'PTO',
      priority: 'Low',
      recommendation: `Current PTO (${currentPTO} days) is below average. Consider negotiating for 15-20 days.`,
      potentialGain: (20 - currentPTO) * BENEFITS_VALUES.pto.perDay
    });
  }
  
  // Professional development
  if (!offer.benefits?.professionalDevelopment) {
    recommendations.push({
      category: 'Professional Development',
      priority: 'Low',
      recommendation: 'No professional development budget mentioned. Request $2,500-5,000 annual budget for conferences and courses.',
      potentialGain: 2500
    });
  }
  
  // Calculate total potential gain
  const totalPotentialGain = recommendations.reduce((sum, rec) => sum + (rec.potentialGain || 0), 0);
  
  return {
    recommendations,
    totalPotentialGain,
    summary: `${recommendations.length} negotiation opportunities identified with potential gain of $${totalPotentialGain.toLocaleString()}`
  };
};

/**
 * POST /api/offers/compare - Compare multiple job offers side-by-side
 */
export const compareOffers = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { offers, weights } = req.body;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  if (!offers || !Array.isArray(offers) || offers.length < 2) {
    const { response, statusCode } = errorResponse(
      "At least 2 offers are required for comparison",
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
    return sendResponse(res, response, statusCode);
  }

  // Process each offer
  const processedOffers = offers.map((offer, index) => {
    // Calculate benefits value
    const benefitsValue = calculateBenefitsValue(offer.benefits, offer.baseSalary);
    
    // Calculate total compensation
    const totalCompensation = 
      (offer.baseSalary || 0) +
      (offer.signingBonus || 0) +
      (offer.performanceBonus || 0) +
      (offer.equityValue || 0) +
      benefitsValue;
    
    // Get cost of living index
    const colIndex = getCostOfLivingIndex(offer.location);
    
    // Calculate COL-adjusted compensation (normalized to national average)
    const colAdjustedCompensation = Math.round(totalCompensation * (100 / colIndex));
    
    return {
      id: offer.id || `offer-${index + 1}`,
      company: offer.company,
      title: offer.title,
      location: offer.location,
      baseSalary: offer.baseSalary || 0,
      signingBonus: offer.signingBonus || 0,
      performanceBonus: offer.performanceBonus || 0,
      equityValue: offer.equityValue || 0,
      benefits: offer.benefits || {},
      benefitsValue,
      totalCompensation,
      costOfLiving: {
        index: colIndex,
        adjustedCompensation: colAdjustedCompensation,
        adjustment: colIndex !== 100 ? `${colIndex > 100 ? '+' : ''}${colIndex - 100}%` : 'Average'
      },
      nonFinancialFactors: offer.nonFinancialFactors || {
        cultureFit: 5,
        growthOpportunities: 5,
        workLifeBalance: 5,
        locationDesirability: 5,
        jobSecurity: 5,
        companyReputation: 5
      },
      remotePolicy: offer.remotePolicy || offer.benefits?.remoteWork || 'Unknown'
    };
  });

  // Calculate max values for normalization
  const maxValues = {
    totalCompensation: Math.max(...processedOffers.map(o => o.totalCompensation)),
    baseSalary: Math.max(...processedOffers.map(o => o.baseSalary)),
    benefitsValue: Math.max(...processedOffers.map(o => o.benefitsValue)),
    colAdjustedCompensation: Math.max(...processedOffers.map(o => o.costOfLiving.adjustedCompensation))
  };

  // Calculate weighted scores
  const customWeights = weights || DEFAULT_WEIGHTS;
  const scoredOffers = processedOffers.map(offer => {
    const scoring = calculateWeightedScore(offer, customWeights, maxValues);
    const negotiations = generateNegotiationRecommendations(offer, null, processedOffers);
    
    return {
      ...offer,
      scoring,
      negotiations
    };
  });

  // Sort by weighted score
  scoredOffers.sort((a, b) => b.scoring.totalScore - a.scoring.totalScore);

  // Generate comparison matrix
  const comparisonMatrix = {
    categories: [
      'Base Salary',
      'Total Compensation',
      'COL-Adjusted Comp',
      'Benefits Value',
      'Culture Fit',
      'Growth Opportunities',
      'Work-Life Balance',
      'Location Score',
      'Weighted Score'
    ],
    data: scoredOffers.map(offer => ({
      company: offer.company,
      values: [
        `$${offer.baseSalary.toLocaleString()}`,
        `$${offer.totalCompensation.toLocaleString()}`,
        `$${offer.costOfLiving.adjustedCompensation.toLocaleString()}`,
        `$${offer.benefitsValue.toLocaleString()}`,
        `${offer.nonFinancialFactors.cultureFit}/10`,
        `${offer.nonFinancialFactors.growthOpportunities}/10`,
        `${offer.nonFinancialFactors.workLifeBalance}/10`,
        `${offer.nonFinancialFactors.locationDesirability}/10`,
        `${offer.scoring.totalScore}/100`
      ],
      rawValues: [
        offer.baseSalary,
        offer.totalCompensation,
        offer.costOfLiving.adjustedCompensation,
        offer.benefitsValue,
        offer.nonFinancialFactors.cultureFit,
        offer.nonFinancialFactors.growthOpportunities,
        offer.nonFinancialFactors.workLifeBalance,
        offer.nonFinancialFactors.locationDesirability,
        offer.scoring.totalScore
      ]
    }))
  };

  // Winner summary
  const winner = scoredOffers[0];
  const runnerUp = scoredOffers[1];

  const { response, statusCode } = successResponse("Offers compared successfully", {
    offers: scoredOffers,
    comparisonMatrix,
    winner: {
      company: winner.company,
      title: winner.title,
      score: winner.scoring.totalScore,
      totalCompensation: winner.totalCompensation,
      advantage: winner.scoring.totalScore - runnerUp.scoring.totalScore
    },
    weights: customWeights,
    maxValues,
    summary: {
      totalOffers: scoredOffers.length,
      highestTotalComp: maxValues.totalCompensation,
      highestBaseSalary: maxValues.baseSalary,
      bestCOLAdjusted: maxValues.colAdjustedCompensation
    }
  });
  return sendResponse(res, response, statusCode);
});

/**
 * POST /api/offers/scenario-analysis - Analyze "what-if" negotiation scenarios
 */
export const scenarioAnalysis = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { offer, scenarios } = req.body;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  if (!offer) {
    const { response, statusCode } = errorResponse(
      "Offer data is required",
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
    return sendResponse(res, response, statusCode);
  }

  // Default scenarios if none provided
  const defaultScenarios = [
    { name: '5% Salary Increase', salaryIncrease: 0.05 },
    { name: '10% Salary Increase', salaryIncrease: 0.10 },
    { name: '15% Salary Increase', salaryIncrease: 0.15 },
    { name: '$10k Signing Bonus', signingBonusIncrease: 10000 },
    { name: '$20k Signing Bonus', signingBonusIncrease: 20000 },
    { name: 'Add Remote Work', remoteWork: 'Full' },
    { name: '5 Extra PTO Days', ptoIncrease: 5 }
  ];

  const scenariosToAnalyze = scenarios || defaultScenarios;
  
  // Calculate base offer values
  const baseBenefitsValue = calculateBenefitsValue(offer.benefits, offer.baseSalary);
  const baseTotalCompensation = 
    (offer.baseSalary || 0) +
    (offer.signingBonus || 0) +
    (offer.performanceBonus || 0) +
    (offer.equityValue || 0) +
    baseBenefitsValue;

  // Analyze each scenario
  const analyzedScenarios = scenariosToAnalyze.map(scenario => {
    let newBaseSalary = offer.baseSalary || 0;
    let newSigningBonus = offer.signingBonus || 0;
    let newBenefits = { ...offer.benefits };
    
    // Apply salary increase
    if (scenario.salaryIncrease) {
      newBaseSalary = Math.round(newBaseSalary * (1 + scenario.salaryIncrease));
    }
    
    // Apply signing bonus increase
    if (scenario.signingBonusIncrease) {
      newSigningBonus += scenario.signingBonusIncrease;
    }
    
    // Apply remote work change
    if (scenario.remoteWork) {
      newBenefits.remoteWork = scenario.remoteWork;
    }
    
    // Apply PTO increase
    if (scenario.ptoIncrease) {
      newBenefits.paidTimeOff = (newBenefits.paidTimeOff || 10) + scenario.ptoIncrease;
    }
    
    // Apply equity increase
    let newEquityValue = offer.equityValue || 0;
    if (scenario.equityIncrease) {
      newEquityValue += scenario.equityIncrease;
    }
    
    // Calculate new benefits value
    const newBenefitsValue = calculateBenefitsValue(newBenefits, newBaseSalary);
    
    // Calculate new total compensation
    const newTotalCompensation = 
      newBaseSalary +
      newSigningBonus +
      (offer.performanceBonus || 0) +
      newEquityValue +
      newBenefitsValue;
    
    const increase = newTotalCompensation - baseTotalCompensation;
    const percentageIncrease = ((increase / baseTotalCompensation) * 100).toFixed(1);
    
    return {
      scenario: scenario.name,
      changes: scenario,
      original: {
        baseSalary: offer.baseSalary,
        signingBonus: offer.signingBonus,
        totalCompensation: baseTotalCompensation
      },
      projected: {
        baseSalary: newBaseSalary,
        signingBonus: newSigningBonus,
        benefitsValue: newBenefitsValue,
        totalCompensation: newTotalCompensation
      },
      impact: {
        absoluteIncrease: increase,
        percentageIncrease: parseFloat(percentageIncrease),
        formatted: `+$${increase.toLocaleString()} (+${percentageIncrease}%)`
      },
      negotiationDifficulty: getScenarioDifficulty(scenario),
      recommendation: getScenarioRecommendation(scenario, increase)
    };
  });

  // Sort by impact
  analyzedScenarios.sort((a, b) => b.impact.absoluteIncrease - a.impact.absoluteIncrease);

  const { response, statusCode } = successResponse("Scenario analysis completed", {
    baseOffer: {
      company: offer.company,
      title: offer.title,
      baseSalary: offer.baseSalary,
      totalCompensation: baseTotalCompensation
    },
    scenarios: analyzedScenarios,
    bestScenario: analyzedScenarios[0],
    summary: {
      totalScenarios: analyzedScenarios.length,
      maxPotentialGain: analyzedScenarios[0]?.impact.absoluteIncrease || 0,
      easiestWin: analyzedScenarios.find(s => s.negotiationDifficulty === 'Easy')
    }
  });
  return sendResponse(res, response, statusCode);
});

/**
 * Helper: Get scenario difficulty rating
 */
const getScenarioDifficulty = (scenario) => {
  if (scenario.salaryIncrease) {
    if (scenario.salaryIncrease <= 0.05) return 'Easy';
    if (scenario.salaryIncrease <= 0.10) return 'Medium';
    return 'Hard';
  }
  if (scenario.signingBonusIncrease) {
    if (scenario.signingBonusIncrease <= 10000) return 'Easy';
    if (scenario.signingBonusIncrease <= 20000) return 'Medium';
    return 'Hard';
  }
  if (scenario.remoteWork) return 'Medium';
  if (scenario.ptoIncrease) {
    if (scenario.ptoIncrease <= 5) return 'Easy';
    return 'Medium';
  }
  return 'Medium';
};

/**
 * Helper: Get scenario recommendation
 */
const getScenarioRecommendation = (scenario, impact) => {
  if (scenario.salaryIncrease) {
    const pct = (scenario.salaryIncrease * 100).toFixed(0);
    return `Request a ${pct}% salary increase by highlighting your unique skills and market value. Impact: +$${impact.toLocaleString()}`;
  }
  if (scenario.signingBonusIncrease) {
    return `Negotiate a signing bonus to offset transition costs or as compensation for unvested equity. Impact: +$${impact.toLocaleString()}`;
  }
  if (scenario.remoteWork) {
    return `Request remote work flexibility for better work-life balance and reduced commute costs. Impact: +$${impact.toLocaleString()} annually`;
  }
  if (scenario.ptoIncrease) {
    return `Ask for additional PTO days, especially if salary negotiation has limited flexibility. Impact: +$${impact.toLocaleString()} in value`;
  }
  return `Consider this negotiation option for additional value. Impact: +$${impact.toLocaleString()}`;
};

/**
 * GET /api/offers/cost-of-living - Get cost of living comparison between locations
 */
export const getCostOfLivingComparison = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { locations, baseSalary } = req.query;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const locationList = locations ? locations.split(',') : Object.keys(COST_OF_LIVING_INDEX);
  const salary = parseInt(baseSalary) || 100000;

  const comparisons = locationList.map(location => {
    const index = getCostOfLivingIndex(location.trim());
    const adjustedSalary = Math.round(salary * (100 / index));
    const equivalentInNational = Math.round(salary * (index / 100));
    
    return {
      location: location.trim(),
      colIndex: index,
      baseSalary: salary,
      adjustedPurchasingPower: adjustedSalary,
      equivalentInThisLocation: equivalentInNational,
      difference: adjustedSalary - salary,
      percentageDifference: (((100 / index) - 1) * 100).toFixed(1)
    };
  });

  // Sort by purchasing power
  comparisons.sort((a, b) => b.adjustedPurchasingPower - a.adjustedPurchasingPower);

  const { response, statusCode } = successResponse("Cost of living comparison retrieved", {
    baseSalary: salary,
    comparisons,
    allLocations: Object.keys(COST_OF_LIVING_INDEX),
    notes: [
      "Index is relative to US national average (100)",
      "Adjusted purchasing power shows equivalent buying power normalized to national average",
      "Higher index = higher cost of living = lower purchasing power"
    ]
  });
  return sendResponse(res, response, statusCode);
});

/**
 * POST /api/offers/archive - Archive a declined offer with reason
 */
export const archiveDeclinedOffer = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { offer, declineReason, declineNotes, futureConsideration } = req.body;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  if (!offer || !declineReason) {
    const { response, statusCode } = errorResponse(
      "Offer data and decline reason are required",
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
    return sendResponse(res, response, statusCode);
  }

  // Get or create user's salary progression document
  let progression = await SalaryProgression.findOne({ userId });
  
  if (!progression) {
    progression = new SalaryProgression({
      userId,
      salaryOffers: [],
      careerMilestones: [],
      negotiationHistory: [],
      archivedOffers: []
    });
  }

  // Initialize archivedOffers array if it doesn't exist
  if (!progression.archivedOffers) {
    progression.archivedOffers = [];
  }

  // Create archived offer entry
  const archivedOffer = {
    company: offer.company,
    title: offer.title,
    location: offer.location,
    baseSalary: offer.baseSalary,
    totalCompensation: offer.totalCompensation || offer.baseSalary,
    benefits: offer.benefits,
    offerDate: offer.offerDate || new Date(),
    declinedDate: new Date(),
    declineReason: declineReason,
    declineNotes: declineNotes || '',
    futureConsideration: futureConsideration || false,
    nonFinancialFactors: offer.nonFinancialFactors || {}
  };

  // Add to archived offers
  progression.archivedOffers.push(archivedOffer);
  await progression.save();

  // If there's a linked job, update its status
  if (offer.jobId) {
    try {
      const job = await Job.findOne({ _id: offer.jobId, userId });
      if (job) {
        job.status = 'Rejected';
        job.archived = true;
        job.archivedAt = new Date();
        job.archiveReason = 'Not Interested';
        job.archiveNotes = `Offer declined: ${declineReason}. ${declineNotes || ''}`;
        await job.save();
      }
    } catch (err) {
      console.log('Could not update linked job:', err.message);
    }
  }

  const { response, statusCode } = successResponse("Offer archived successfully", {
    archivedOffer,
    totalArchivedOffers: progression.archivedOffers.length
  });
  return sendResponse(res, response, statusCode);
});

/**
 * GET /api/offers/archived - Get all archived/declined offers
 */
export const getArchivedOffers = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const progression = await SalaryProgression.findOne({ userId });
  
  const archivedOffers = progression?.archivedOffers || [];

  // Sort by declined date, most recent first
  archivedOffers.sort((a, b) => new Date(b.declinedDate) - new Date(a.declinedDate));

  // Group by decline reason for insights
  const reasonCounts = {};
  archivedOffers.forEach(offer => {
    reasonCounts[offer.declineReason] = (reasonCounts[offer.declineReason] || 0) + 1;
  });

  const { response, statusCode } = successResponse("Archived offers retrieved", {
    count: archivedOffers.length,
    offers: archivedOffers,
    insights: {
      reasonCounts,
      averageDeclinedSalary: archivedOffers.length > 0 
        ? Math.round(archivedOffers.reduce((sum, o) => sum + (o.baseSalary || 0), 0) / archivedOffers.length)
        : 0,
      futureConsiderationCount: archivedOffers.filter(o => o.futureConsideration).length
    }
  });
  return sendResponse(res, response, statusCode);
});

/**
 * POST /api/offers/calculate-benefits - Calculate total benefits value
 */
export const calculateTotalBenefits = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { benefits, baseSalary } = req.body;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const salary = baseSalary || 100000;
  
  // Calculate detailed breakdown
  const breakdown = {
    healthInsurance: benefits?.healthInsurance ? 
      (BENEFITS_VALUES.healthInsurance[benefits.healthInsuranceQuality] || BENEFITS_VALUES.healthInsurance.good) : 0,
    dentalInsurance: benefits?.dentalInsurance ? BENEFITS_VALUES.dentalInsurance : 0,
    visionInsurance: benefits?.visionInsurance ? BENEFITS_VALUES.visionInsurance : 0,
    retirement401k: benefits?.retirement401k && benefits?.retirementMatch ? 
      Math.round(salary * (parseFloat(benefits.retirementMatch) / 100 || 0.04)) : 0,
    paidTimeOff: benefits?.paidTimeOff ? benefits.paidTimeOff * BENEFITS_VALUES.pto.perDay : 0,
    remoteWork: benefits?.remoteWork ? 
      (BENEFITS_VALUES.remoteWork[benefits.remoteWork.toLowerCase()] || 0) : 0,
    flexibleSchedule: benefits?.flexibleSchedule ? BENEFITS_VALUES.flexibleSchedule : 0,
    professionalDevelopment: benefits?.professionalDevelopment ? 
      (typeof benefits.professionalDevelopment === 'number' ? benefits.professionalDevelopment : 2500) : 0,
    other: 0
  };

  // Add other benefits
  if (benefits?.lifeInsurance) breakdown.other += BENEFITS_VALUES.lifeInsurance;
  if (benefits?.disability) breakdown.other += BENEFITS_VALUES.disability;
  if (benefits?.parentalLeave) breakdown.other += BENEFITS_VALUES.parentalLeave;
  if (benefits?.gym) breakdown.other += BENEFITS_VALUES.gym;
  if (benefits?.commuter) breakdown.other += BENEFITS_VALUES.commuter;

  const totalValue = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

  const { response, statusCode } = successResponse("Benefits value calculated", {
    baseSalary: salary,
    benefits: benefits,
    breakdown,
    totalBenefitsValue: totalValue,
    totalCompensation: salary + totalValue,
    percentOfSalary: ((totalValue / salary) * 100).toFixed(1)
  });
  return sendResponse(res, response, statusCode);
});
