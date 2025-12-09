/**
 * UC-128: Career Path Simulation Service
 * 
 * Handles career trajectory modeling and outcome predictions
 */

/**
 * Industry growth rates (annual averages)
 */
const INDUSTRY_GROWTH_RATES = {
  'Technology': 0.12,
  'Finance': 0.06,
  'Healthcare': 0.08,
  'Education': 0.03,
  'Manufacturing': 0.04,
  'Retail': 0.02,
  'Consulting': 0.07,
  'Energy': 0.05,
  'Media': 0.03,
  'Real Estate': 0.04
};

/**
 * Career level progression probabilities and timelines
 */
const LEVEL_PROGRESSION = {
  'Entry': {
    next: 'Mid',
    minYears: 2,
    typicalYears: 3,
    maxYears: 5,
    salaryGrowth: 0.25
  },
  'Mid': {
    next: 'Senior',
    minYears: 3,
    typicalYears: 4,
    maxYears: 7,
    salaryGrowth: 0.35
  },
  'Senior': {
    next: 'Lead',
    minYears: 3,
    typicalYears: 5,
    maxYears: 8,
    salaryGrowth: 0.30
  },
  'Lead': {
    next: 'Principal',
    minYears: 3,
    typicalYears: 4,
    maxYears: 6,
    salaryGrowth: 0.25
  },
  'Principal': {
    next: 'Executive',
    minYears: 4,
    typicalYears: 6,
    maxYears: 10,
    salaryGrowth: 0.40
  },
  'Executive': {
    next: null,
    minYears: null,
    typicalYears: null,
    maxYears: null,
    salaryGrowth: 0.15
  }
};

/**
 * Company stage impact on career growth
 */
const COMPANY_STAGE_MULTIPLIERS = {
  'startup': {
    growthSpeed: 1.4,
    risk: 0.7,
    salaryGrowth: 1.3,
    stability: 0.5
  },
  'growth': {
    growthSpeed: 1.2,
    risk: 0.5,
    salaryGrowth: 1.15,
    stability: 0.7
  },
  'mature': {
    growthSpeed: 0.9,
    risk: 0.3,
    salaryGrowth: 1.05,
    stability: 0.9
  },
  'enterprise': {
    growthSpeed: 0.8,
    risk: 0.2,
    salaryGrowth: 1.08,
    stability: 0.95
  }
};

/**
 * Calculate career trajectory for a given path
 */
export const simulateCareerPath = (startingRole, targetRole, timeHorizon, marketFactors) => {
  const scenarios = {
    optimistic: generateScenario(startingRole, targetRole, timeHorizon, marketFactors, 'optimistic'),
    realistic: generateScenario(startingRole, targetRole, timeHorizon, marketFactors, 'realistic'),
    pessimistic: generateScenario(startingRole, targetRole, timeHorizon, marketFactors, 'pessimistic')
  };
  
  // Calculate expected lifetime earnings (weighted average)
  const expectedLifetimeEarnings = 
    scenarios.realistic.totalEarnings * 0.6 +
    scenarios.optimistic.totalEarnings * 0.25 +
    scenarios.pessimistic.totalEarnings * 0.15;
  
  return {
    scenarios,
    expectedLifetimeEarnings
  };
};

/**
 * Generate a specific scenario (optimistic/realistic/pessimistic)
 */
const generateScenario = (startingRole, targetRole, timeHorizon, marketFactors, scenarioType) => {
  const milestones = [];
  const keyDecisionPoints = [];
  
  let currentYear = 0;
  let currentLevel = startingRole.level;
  let currentSalary = startingRole.salary;
  let currentTitle = startingRole.title;
  let totalEarnings = 0;
  
  // Scenario multipliers
  const multipliers = {
    optimistic: { progression: 0.8, salary: 1.15, probability: 0.75 },
    realistic: { progression: 1.0, salary: 1.0, probability: 0.5 },
    pessimistic: { progression: 1.3, salary: 0.90, probability: 0.25 }
  };
  
  const mult = multipliers[scenarioType];
  
  // Get industry growth rate
  const industryGrowth = INDUSTRY_GROWTH_RATES[startingRole.industry] || 0.05;
  
  // Simulate year by year
  while (currentYear < timeHorizon) {
    currentYear++;
    
    // Add annual earnings
    totalEarnings += currentSalary;
    
    // Annual raise (CoL + performance)
    const annualRaise = currentSalary * (0.03 + (Math.random() * 0.02)) * mult.salary;
    currentSalary += annualRaise;
    
    // Check for level progression
    const progression = LEVEL_PROGRESSION[currentLevel];
    if (progression && progression.next) {
      const yearsInLevel = milestones.filter(m => m.level === currentLevel).length;
      const progressionYears = Math.round(progression.typicalYears * mult.progression);
      
      if (yearsInLevel >= progressionYears) {
        // Level up!
        currentLevel = progression.next;
        currentSalary = Math.round(currentSalary * (1 + progression.salaryGrowth * mult.salary));
        currentTitle = getNextTitle(currentTitle, currentLevel);
        
        keyDecisionPoints.push({
          year: currentYear,
          decision: `Promotion to ${currentLevel}`,
          impact: `Salary increase to $${currentSalary.toLocaleString()}`,
          alternativePath: 'Stay at current level or switch companies'
        });
      }
    }
    
    // Check for job switches (higher probability in optimistic scenario)
    const switchProbability = scenarioType === 'optimistic' ? 0.25 : scenarioType === 'realistic' ? 0.15 : 0.08;
    if (Math.random() < switchProbability && currentYear >= 2) {
      const switchBonus = 0.15 * mult.salary;
      currentSalary = Math.round(currentSalary * (1 + switchBonus));
      
      keyDecisionPoints.push({
        year: currentYear,
        decision: 'Job switch opportunity',
        impact: `${Math.round(switchBonus * 100)}% salary increase`,
        alternativePath: 'Stay with current employer'
      });
    }
    
    // Apply market factors
    const marketAdjustment = calculateMarketImpact(marketFactors, currentYear);
    currentSalary = Math.round(currentSalary * marketAdjustment);
    
    // Record milestone
    milestones.push({
      year: currentYear,
      title: currentTitle,
      level: currentLevel,
      salary: currentSalary,
      company: startingRole.company,
      industry: startingRole.industry,
      probability: mult.probability
    });
  }
  
  return {
    scenarioType,
    totalEarnings: Math.round(totalEarnings),
    finalTitle: currentTitle,
    finalSalary: currentSalary,
    yearsToGoal: targetRole ? calculateYearsToGoal(milestones, targetRole) : null,
    milestones,
    keyDecisionPoints
  };
};

/**
 * Calculate market impact on salary
 */
const calculateMarketImpact = (marketFactors, year) => {
  if (!marketFactors) return 1.0;
  
  let impact = 1.0;
  
  // Economic cycle impact
  const economicImpact = {
    'recession': 0.97,
    'recovery': 1.0,
    'growth': 1.02,
    'boom': 1.05
  };
  impact *= economicImpact[marketFactors.economicCondition] || 1.0;
  
  // Industry trend impact
  const trendImpact = {
    'declining': 0.98,
    'stable': 1.0,
    'growing': 1.03,
    'explosive': 1.08
  };
  impact *= trendImpact[marketFactors.demandTrend] || 1.0;
  
  return impact;
};

/**
 * Get next title based on level progression
 */
const getNextTitle = (currentTitle, newLevel) => {
  const levelTitles = {
    'Entry': ['Junior', 'Associate', 'Analyst'],
    'Mid': ['', 'II', 'Specialist'],
    'Senior': ['Senior', 'Sr.', 'Lead'],
    'Lead': ['Lead', 'Staff', 'Principal I'],
    'Principal': ['Principal', 'Distinguished', 'Architect'],
    'Executive': ['Director', 'VP', 'SVP', 'C-Level']
  };
  
  const titles = levelTitles[newLevel] || [''];
  const baseTitle = currentTitle.replace(/^(Junior|Senior|Lead|Principal|Sr\.|Staff|Associate|Analyst)\s*/i, '');
  
  return `${titles[0]} ${baseTitle}`.trim();
};

/**
 * Calculate years to reach target role
 */
const calculateYearsToGoal = (milestones, targetRole) => {
  if (!targetRole) return null;
  
  for (let i = 0; i < milestones.length; i++) {
    if (milestones[i].level === targetRole.level || milestones[i].salary >= targetRole.salary) {
      return i + 1;
    }
  }
  
  return null; // Goal not reached within time horizon
};

/**
 * Calculate path characteristics
 */
export const calculatePathCharacteristics = (path, marketFactors) => {
  const scenarios = path.scenarios;
  
  // Stability: lower variance = more stable
  const salaryVariance = calculateVariance([
    scenarios.optimistic.finalSalary,
    scenarios.realistic.finalSalary,
    scenarios.pessimistic.finalSalary
  ]);
  const stabilityScore = Math.max(0, 100 - (salaryVariance / 1000));
  
  // Growth potential: optimistic vs pessimistic spread
  const growthPotential = 
    ((scenarios.optimistic.finalSalary - scenarios.pessimistic.finalSalary) / 
    scenarios.pessimistic.finalSalary) * 100;
  
  // Learning curve: based on level progressions
  const levelChanges = scenarios.realistic.keyDecisionPoints
    .filter(dp => dp.decision.includes('Promotion')).length;
  const learningCurve = Math.min(100, levelChanges * 20);
  
  // Work-life balance: inversely related to growth speed
  const workLifeBalance = Math.max(30, 100 - growthPotential);
  
  // Market demand: based on market factors
  const demandScore = {
    'declining': 30,
    'stable': 60,
    'growing': 80,
    'explosive': 95
  };
  const marketDemand = demandScore[marketFactors?.demandTrend] || 60;
  
  return {
    stabilityScore: Math.round(stabilityScore),
    growthPotential: Math.round(Math.min(100, growthPotential)),
    learningCurve: Math.round(learningCurve),
    workLifeBalance: Math.round(workLifeBalance),
    marketDemand: Math.round(marketDemand)
  };
};

/**
 * Calculate success score based on user criteria
 */
export const calculateSuccessScore = (path, successCriteria) => {
  let score = 0;
  
  // Salary component
  if (successCriteria.targetSalary) {
    const salaryRatio = path.scenarios.realistic.finalSalary / successCriteria.targetSalary;
    const salaryScore = Math.min(100, salaryRatio * 100);
    score += salaryScore * 0.4; // 40% weight on salary
  }
  
  // Work-life balance component
  if (successCriteria.workLifeBalanceWeight > 0) {
    score += path.pathCharacteristics.workLifeBalance * successCriteria.workLifeBalanceWeight;
  }
  
  // Learning opportunities component
  if (successCriteria.learningOpportunitiesWeight > 0) {
    score += path.pathCharacteristics.learningCurve * successCriteria.learningOpportunitiesWeight;
  }
  
  // Impact component (approximated by level reached)
  if (successCriteria.impactWeight > 0) {
    const impactScore = getLevelImpactScore(path.scenarios.realistic.finalTitle);
    score += impactScore * successCriteria.impactWeight;
  }
  
  return Math.round(Math.min(100, score));
};

/**
 * Get impact score for a given level/title
 */
const getLevelImpactScore = (title) => {
  if (!title) return 50;
  
  const titleLower = title.toLowerCase();
  if (titleLower.includes('director') || titleLower.includes('vp') || titleLower.includes('executive')) return 95;
  if (titleLower.includes('principal') || titleLower.includes('distinguished')) return 85;
  if (titleLower.includes('lead') || titleLower.includes('staff')) return 70;
  if (titleLower.includes('senior')) return 60;
  return 45;
};

/**
 * Calculate variance
 */
const calculateVariance = (values) => {
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
};

/**
 * Calculate risk score
 */
export const calculateRiskScore = (path, marketFactors) => {
  let riskScore = 50; // Base risk
  
  // Salary variability risk
  const salarySpread = path.scenarios.optimistic.finalSalary - path.scenarios.pessimistic.finalSalary;
  const variabilityRisk = (salarySpread / path.scenarios.realistic.finalSalary) * 50;
  riskScore += Math.min(30, variabilityRisk);
  
  // Market risk
  if (marketFactors) {
    if (marketFactors.automationRisk > 0.5) riskScore += 15;
    if (marketFactors.demandTrend === 'declining') riskScore += 20;
    if (marketFactors.economicCondition === 'recession') riskScore += 10;
  }
  
  // Level progression risk (faster = riskier)
  const progressionSpeed = path.scenarios.realistic.keyDecisionPoints
    .filter(dp => dp.decision.includes('Promotion')).length;
  if (progressionSpeed > 3) riskScore += 10;
  
  return Math.round(Math.min(100, Math.max(0, riskScore)));
};

/**
 * Determine company stage from company name/data
 */
export const inferCompanyStage = (companyName, industry) => {
  // In production, this would use external data
  // For now, use heuristics
  
  if (!companyName) return 'mature';
  
  const nameLower = companyName.toLowerCase();
  
  // Known large companies
  const enterprises = ['google', 'microsoft', 'amazon', 'apple', 'meta', 'facebook', 
                       'netflix', 'tesla', 'oracle', 'ibm', 'salesforce', 'adobe'];
  if (enterprises.some(e => nameLower.includes(e))) return 'enterprise';
  
  // Indicators of startup
  if (nameLower.includes('labs') || nameLower.includes('ventures')) return 'startup';
  
  // Default to growth stage
  return 'growth';
};

/**
 * Get market factors for an industry
 */
export const getMarketFactors = (industry) => {
  const industryData = {
    'Technology': {
      industryGrowthRate: 0.12,
      economicCondition: 'growth',
      automationRisk: 0.3,
      demandTrend: 'growing'
    },
    'Finance': {
      industryGrowthRate: 0.06,
      economicCondition: 'stable',
      automationRisk: 0.4,
      demandTrend: 'stable'
    },
    'Healthcare': {
      industryGrowthRate: 0.08,
      economicCondition: 'growth',
      automationRisk: 0.2,
      demandTrend: 'growing'
    },
    'Education': {
      industryGrowthRate: 0.03,
      economicCondition: 'recovery',
      automationRisk: 0.35,
      demandTrend: 'stable'
    },
    'Manufacturing': {
      industryGrowthRate: 0.04,
      economicCondition: 'recovery',
      automationRisk: 0.6,
      demandTrend: 'stable'
    }
  };
  
  return industryData[industry] || {
    industryGrowthRate: 0.05,
    economicCondition: 'stable',
    automationRisk: 0.4,
    demandTrend: 'stable'
  };
};
