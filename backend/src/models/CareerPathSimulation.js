import mongoose from 'mongoose';

/**
 * UC-128: Career Path Simulation Model
 * 
 * Stores career trajectory simulations with multiple scenarios and outcomes
 */

const careerMilestoneSchema = new mongoose.Schema({
  year: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  level: {
    type: String,
    enum: ['Entry', 'Mid', 'Senior', 'Lead', 'Principal', 'Executive'],
    required: true
  },
  salary: {
    type: Number,
    required: true
  },
  company: String,
  industry: String,
  probability: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.5
  }
}, { _id: false });

const scenarioOutcomeSchema = new mongoose.Schema({
  scenarioType: {
    type: String,
    enum: ['optimistic', 'realistic', 'pessimistic'],
    required: true
  },
  totalEarnings: {
    type: Number,
    required: true
  },
  finalTitle: String,
  finalSalary: Number,
  yearsToGoal: Number,
  milestones: [careerMilestoneSchema],
  keyDecisionPoints: [{
    year: Number,
    decision: String,
    impact: String,
    alternativePath: String
  }]
}, { _id: false });

const careerPathSimulationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  
  // Starting point
  currentRole: {
    title: {
      type: String,
      required: true
    },
    level: {
      type: String,
      enum: ['Entry', 'Mid', 'Senior', 'Lead', 'Principal', 'Executive'],
      required: true
    },
    salary: {
      type: Number,
      required: true
    },
    company: String,
    industry: {
      type: String,
      required: true
    },
    yearsOfExperience: Number
  },
  
  // Target/comparison roles
  targetRoles: [{
    jobId: mongoose.Schema.Types.ObjectId,
    title: String,
    company: String,
    salary: Number,
    industry: String
  }],
  
  // Simulation parameters
  timeHorizon: {
    type: Number,
    default: 10,
    min: 1,
    max: 30
  },
  
  // User-defined success criteria
  successCriteria: {
    targetSalary: Number,
    targetTitle: String,
    workLifeBalanceWeight: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.33
    },
    learningOpportunitiesWeight: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.33
    },
    impactWeight: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.34
    },
    geographicPreference: String,
    industryPreference: [String]
  },
  
  // Simulation results
  paths: [{
    pathId: String,
    pathName: String,
    startingRole: String,
    
    // Three scenarios for this path
    scenarios: {
      optimistic: scenarioOutcomeSchema,
      realistic: scenarioOutcomeSchema,
      pessimistic: scenarioOutcomeSchema
    },
    
    // Overall metrics for this path
    expectedLifetimeEarnings: Number,
    averageSalaryGrowthRate: Number,
    yearsToTargetRole: Number,
    riskScore: {
      type: Number,
      min: 0,
      max: 100
    },
    
    // Success score based on user criteria
    successScore: {
      type: Number,
      min: 0,
      max: 100
    },
    
    // Path characteristics
    pathCharacteristics: {
      stabilityScore: Number,
      growthPotential: Number,
      learningCurve: Number,
      workLifeBalance: Number,
      marketDemand: Number
    }
  }],
  
  // Recommendation
  recommendedPath: {
    pathId: String,
    reasoning: String,
    confidence: {
      type: Number,
      min: 0,
      max: 1
    }
  },
  
  // Market factors considered
  marketFactors: {
    industryGrowthRate: Number,
    economicCondition: {
      type: String,
      enum: ['recession', 'recovery', 'stable', 'growth', 'boom']
    },
    automationRisk: Number,
    demandTrend: {
      type: String,
      enum: ['declining', 'stable', 'growing', 'explosive']
    }
  },
  
  // Metadata
  simulationDate: {
    type: Date,
    default: Date.now
  },
  
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// Indexes
careerPathSimulationSchema.index({ userId: 1, simulationDate: -1 });
careerPathSimulationSchema.index({ 'currentRole.industry': 1 });

// Methods
careerPathSimulationSchema.methods.getOptimalPath = function() {
  if (!this.paths || this.paths.length === 0) return null;
  
  // Sort by success score
  const sortedPaths = [...this.paths].sort((a, b) => b.successScore - a.successScore);
  return sortedPaths[0];
};

careerPathSimulationSchema.methods.comparePathsByEarnings = function() {
  return this.paths
    .sort((a, b) => b.expectedLifetimeEarnings - a.expectedLifetimeEarnings)
    .map(path => ({
      pathName: path.pathName,
      expectedEarnings: path.expectedLifetimeEarnings,
      riskScore: path.riskScore
    }));
};

careerPathSimulationSchema.methods.getDecisionPoints = function(pathId) {
  const path = this.paths.find(p => p.pathId === pathId);
  if (!path) return [];
  
  const allDecisionPoints = [];
  ['optimistic', 'realistic', 'pessimistic'].forEach(scenario => {
    if (path.scenarios[scenario]?.keyDecisionPoints) {
      allDecisionPoints.push(...path.scenarios[scenario].keyDecisionPoints);
    }
  });
  
  // Remove duplicates and sort by year
  const uniquePoints = Array.from(
    new Map(allDecisionPoints.map(dp => [dp.year, dp])).values()
  );
  
  return uniquePoints.sort((a, b) => a.year - b.year);
};

export const CareerPathSimulation = mongoose.model('CareerPathSimulation', careerPathSimulationSchema);
