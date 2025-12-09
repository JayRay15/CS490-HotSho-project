import { CareerPathSimulation } from '../models/CareerPathSimulation.js';
import { Job } from '../models/Job.js';
import { User } from '../models/User.js';
import { successResponse, errorResponse, sendResponse, ERROR_CODES } from '../utils/responseFormat.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import {
  simulateCareerPath,
  calculatePathCharacteristics,
  calculateSuccessScore,
  calculateRiskScore,
  getMarketFactors,
  inferCompanyStage
} from '../services/careerSimulationService.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * UC-128: Career Path Simulation Controller
 */

/**
 * POST /api/career-simulation - Create new career path simulation
 */
export const createCareerSimulation = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const {
    currentRole,
    targetRoles,
    timeHorizon,
    successCriteria
  } = req.body;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      'Unauthorized: missing authentication credentials',
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  if (!currentRole || !currentRole.title || !currentRole.salary) {
    const { response, statusCode } = errorResponse(
      'Current role with title and salary is required',
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
    return sendResponse(res, response, statusCode);
  }

  try {
    // Get user data for context
    const user = await User.findOne({ auth0Id: userId });
    
    // Enrich current role with user data
    const enrichedCurrentRole = {
      ...currentRole,
      level: currentRole.level || user?.experienceLevel || 'Mid',
      industry: currentRole.industry || 'Technology',
      yearsOfExperience: currentRole.yearsOfExperience || 
        (user?.employment?.length > 0 ? calculateTotalExperience(user.employment) : 3)
    };

    // Get market factors for the industry
    const marketFactors = getMarketFactors(enrichedCurrentRole.industry);

    // Prepare target roles
    let processedTargetRoles = [];
    if (targetRoles && targetRoles.length > 0) {
      processedTargetRoles = await Promise.all(
        targetRoles.map(async (role) => {
          if (role.jobId) {
            const job = await Job.findById(role.jobId);
            if (job) {
              return {
                jobId: job._id,
                title: job.title,
                company: job.company,
                salary: job.salary?.min || job.salary?.max || enrichedCurrentRole.salary * 1.2,
                industry: job.industry || enrichedCurrentRole.industry
              };
            }
          }
          return role;
        })
      );
    }

    // Generate paths based on different scenarios
    const paths = [];
    
    // Path 1: Stay current track (same company/industry)
    const currentTrackPath = generatePath(
      'current-track',
      'Current Track',
      enrichedCurrentRole,
      null,
      timeHorizon || 10,
      marketFactors,
      successCriteria
    );
    paths.push(currentTrackPath);

    // Path 2-N: Paths for each target role
    for (const targetRole of processedTargetRoles) {
      const pathId = `target-${targetRole.jobId || uuidv4().substr(0, 8)}`;
      const pathName = `${targetRole.title} at ${targetRole.company || 'Target Company'}`;
      
      const targetPath = generatePath(
        pathId,
        pathName,
        {
          ...enrichedCurrentRole,
          title: targetRole.title,
          company: targetRole.company,
          salary: targetRole.salary,
          industry: targetRole.industry || enrichedCurrentRole.industry
        },
        targetRole,
        timeHorizon || 10,
        marketFactors,
        successCriteria
      );
      paths.push(targetPath);
    }

    // If no target roles, generate alternative industry path
    if (processedTargetRoles.length === 0) {
      const alternativeIndustry = enrichedCurrentRole.industry === 'Technology' ? 'Finance' : 'Technology';
      const industrySwitch = generatePath(
        'industry-switch',
        `Switch to ${alternativeIndustry}`,
        {
          ...enrichedCurrentRole,
          industry: alternativeIndustry,
          salary: enrichedCurrentRole.salary * 0.9 // Typical penalty for industry switch
        },
        null,
        timeHorizon || 10,
        getMarketFactors(alternativeIndustry),
        successCriteria
      );
      paths.push(industrySwitch);
    }

    // Determine recommended path
    const recommendedPath = paths.reduce((best, current) => 
      current.successScore > best.successScore ? current : best
    );

    // Create simulation
    const simulation = new CareerPathSimulation({
      userId,
      currentRole: enrichedCurrentRole,
      targetRoles: processedTargetRoles,
      timeHorizon: timeHorizon || 10,
      successCriteria: successCriteria || {
        workLifeBalanceWeight: 0.33,
        learningOpportunitiesWeight: 0.33,
        impactWeight: 0.34
      },
      paths,
      recommendedPath: {
        pathId: recommendedPath.pathId,
        reasoning: generateRecommendationReasoning(recommendedPath, paths),
        confidence: calculateConfidence(recommendedPath)
      },
      marketFactors
    });

    await simulation.save();

    const { response, statusCode } = successResponse(
      'Career path simulation created successfully',
      {
        simulation: {
          id: simulation._id,
          paths: simulation.paths,
          recommendedPath: simulation.recommendedPath,
          marketFactors: simulation.marketFactors,
          timeHorizon: simulation.timeHorizon
        }
      }
    );
    return sendResponse(res, response, statusCode);
  } catch (error) {
    console.error('Error creating career simulation:', error);
    const { response, statusCode } = errorResponse(
      `Failed to create career simulation: ${error.message}`,
      500,
      ERROR_CODES.SERVER_ERROR
    );
    return sendResponse(res, response, statusCode);
  }
});

/**
 * GET /api/career-simulation/:id - Get specific simulation
 */
export const getCareerSimulation = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { id } = req.params;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      'Unauthorized: missing authentication credentials',
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const simulation = await CareerPathSimulation.findOne({ _id: id, userId });

  if (!simulation) {
    const { response, statusCode } = errorResponse(
      'Simulation not found',
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  const { response, statusCode } = successResponse(
    'Career simulation retrieved successfully',
    { simulation }
  );
  return sendResponse(res, response, statusCode);
});

/**
 * GET /api/career-simulation - Get all user simulations
 */
export const getUserSimulations = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      'Unauthorized: missing authentication credentials',
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const simulations = await CareerPathSimulation.find({ userId })
    .sort({ simulationDate: -1 })
    .limit(10);

  const { response, statusCode } = successResponse(
    'Career simulations retrieved successfully',
    {
      count: simulations.length,
      simulations: simulations.map(sim => ({
        id: sim._id,
        currentRole: sim.currentRole,
        timeHorizon: sim.timeHorizon,
        pathCount: sim.paths.length,
        recommendedPath: sim.recommendedPath,
        simulationDate: sim.simulationDate
      }))
    }
  );
  return sendResponse(res, response, statusCode);
});

/**
 * GET /api/career-simulation/:id/path/:pathId - Get detailed path info
 */
export const getPathDetails = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { id, pathId } = req.params;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      'Unauthorized: missing authentication credentials',
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const simulation = await CareerPathSimulation.findOne({ _id: id, userId });

  if (!simulation) {
    const { response, statusCode } = errorResponse(
      'Simulation not found',
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  const path = simulation.paths.find(p => p.pathId === pathId);

  if (!path) {
    const { response, statusCode } = errorResponse(
      'Path not found in simulation',
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  // Get decision points for this path
  const decisionPoints = simulation.getDecisionPoints(pathId);

  const { response, statusCode } = successResponse(
    'Path details retrieved successfully',
    {
      path,
      decisionPoints,
      comparison: {
        vsCurrentTrack: compareWithCurrentTrack(simulation, path),
        vsRecommended: compareWithRecommended(simulation, path)
      }
    }
  );
  return sendResponse(res, response, statusCode);
});

/**
 * POST /api/career-simulation/:id/compare - Compare multiple paths
 */
export const comparePaths = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { id } = req.params;
  const { pathIds } = req.body;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      'Unauthorized: missing authentication credentials',
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const simulation = await CareerPathSimulation.findOne({ _id: id, userId });

  if (!simulation) {
    const { response, statusCode } = errorResponse(
      'Simulation not found',
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  const pathsToCompare = pathIds 
    ? simulation.paths.filter(p => pathIds.includes(p.pathId))
    : simulation.paths;

  const comparison = {
    byEarnings: pathsToCompare
      .map(p => ({
        pathId: p.pathId,
        pathName: p.pathName,
        expectedLifetimeEarnings: p.expectedLifetimeEarnings,
        finalSalary: p.scenarios.realistic.finalSalary
      }))
      .sort((a, b) => b.expectedLifetimeEarnings - a.expectedLifetimeEarnings),
    
    byRisk: pathsToCompare
      .map(p => ({
        pathId: p.pathId,
        pathName: p.pathName,
        riskScore: p.riskScore,
        stabilityScore: p.pathCharacteristics.stabilityScore
      }))
      .sort((a, b) => a.riskScore - b.riskScore),
    
    bySuccessScore: pathsToCompare
      .map(p => ({
        pathId: p.pathId,
        pathName: p.pathName,
        successScore: p.successScore,
        characteristics: p.pathCharacteristics
      }))
      .sort((a, b) => b.successScore - a.successScore)
  };

  const { response, statusCode } = successResponse(
    'Path comparison completed successfully',
    { comparison }
  );
  return sendResponse(res, response, statusCode);
});

/**
 * DELETE /api/career-simulation/:id - Delete simulation
 */
export const deleteCareerSimulation = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { id } = req.params;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      'Unauthorized: missing authentication credentials',
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const simulation = await CareerPathSimulation.findOneAndDelete({ _id: id, userId });

  if (!simulation) {
    const { response, statusCode } = errorResponse(
      'Simulation not found',
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  const { response, statusCode } = successResponse(
    'Career simulation deleted successfully',
    { deletedId: id }
  );
  return sendResponse(res, response, statusCode);
});

// Helper functions

function generatePath(pathId, pathName, startingRole, targetRole, timeHorizon, marketFactors, successCriteria) {
  const { scenarios, expectedLifetimeEarnings } = simulateCareerPath(
    startingRole,
    targetRole,
    timeHorizon,
    marketFactors
  );

  const path = {
    pathId,
    pathName,
    startingRole: startingRole.title,
    scenarios,
    expectedLifetimeEarnings: Math.round(expectedLifetimeEarnings),
    averageSalaryGrowthRate: calculateAverageSalaryGrowth(scenarios.realistic),
    yearsToTargetRole: scenarios.realistic.yearsToGoal,
    riskScore: 0,
    successScore: 0,
    pathCharacteristics: {}
  };

  path.pathCharacteristics = calculatePathCharacteristics(path, marketFactors);
  path.successScore = calculateSuccessScore(path, successCriteria);
  path.riskScore = calculateRiskScore(path, marketFactors);

  return path;
}

function calculateAverageSalaryGrowth(scenario) {
  if (!scenario.milestones || scenario.milestones.length < 2) return 0;
  
  const firstSalary = scenario.milestones[0].salary;
  const lastSalary = scenario.milestones[scenario.milestones.length - 1].salary;
  const years = scenario.milestones.length;
  
  const totalGrowth = (lastSalary - firstSalary) / firstSalary;
  const annualGrowth = Math.pow(1 + totalGrowth, 1 / years) - 1;
  
  return Math.round(annualGrowth * 1000) / 10; // Return as percentage with 1 decimal
}

function generateRecommendationReasoning(recommendedPath, allPaths) {
  const reasons = [];
  
  if (recommendedPath.successScore >= 80) {
    reasons.push(`This path scores highest (${recommendedPath.successScore}/100) on your success criteria`);
  }
  
  if (recommendedPath.expectedLifetimeEarnings === Math.max(...allPaths.map(p => p.expectedLifetimeEarnings))) {
    reasons.push(`Offers the highest expected lifetime earnings ($${(recommendedPath.expectedLifetimeEarnings / 1000000).toFixed(2)}M)`);
  }
  
  if (recommendedPath.riskScore < 50) {
    reasons.push('Provides good stability with lower risk');
  }
  
  if (recommendedPath.pathCharacteristics.growthPotential > 70) {
    reasons.push('Strong growth potential for career advancement');
  }
  
  return reasons.join('. ') + '.';
}

function calculateConfidence(path) {
  let confidence = 0.5; // Base confidence
  
  // Higher stability = higher confidence
  confidence += (path.pathCharacteristics.stabilityScore / 100) * 0.2;
  
  // Lower risk = higher confidence
  confidence += ((100 - path.riskScore) / 100) * 0.2;
  
  // Market demand increases confidence
  confidence += (path.pathCharacteristics.marketDemand / 100) * 0.1;
  
  return Math.min(1.0, confidence);
}

function compareWithCurrentTrack(simulation, path) {
  const currentTrack = simulation.paths.find(p => p.pathId === 'current-track');
  if (!currentTrack || path.pathId === 'current-track') return null;
  
  return {
    earningsDifference: path.expectedLifetimeEarnings - currentTrack.expectedLifetimeEarnings,
    earningsPercentage: ((path.expectedLifetimeEarnings - currentTrack.expectedLifetimeEarnings) / currentTrack.expectedLifetimeEarnings * 100).toFixed(1),
    riskDifference: path.riskScore - currentTrack.riskScore,
    successScoreDifference: path.successScore - currentTrack.successScore
  };
}

function compareWithRecommended(simulation, path) {
  if (simulation.recommendedPath.pathId === path.pathId) return null;
  
  const recommended = simulation.paths.find(p => p.pathId === simulation.recommendedPath.pathId);
  if (!recommended) return null;
  
  return {
    earningsDifference: path.expectedLifetimeEarnings - recommended.expectedLifetimeEarnings,
    earningsPercentage: ((path.expectedLifetimeEarnings - recommended.expectedLifetimeEarnings) / recommended.expectedLifetimeEarnings * 100).toFixed(1),
    riskDifference: path.riskScore - recommended.riskScore,
    successScoreDifference: path.successScore - recommended.successScore
  };
}

function calculateTotalExperience(employment) {
  if (!employment || employment.length === 0) return 0;
  
  let totalMonths = 0;
  employment.forEach(job => {
    const start = new Date(job.startDate);
    const end = job.endDate ? new Date(job.endDate) : new Date();
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    totalMonths += months;
  });
  
  return Math.round(totalMonths / 12);
}
