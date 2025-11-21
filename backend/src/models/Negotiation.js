import mongoose from "mongoose";

/**
 * UC-083: Salary Negotiation Guidance and Tools
 * 
 * This model stores salary negotiation sessions, talking points, scenarios,
 * and outcomes to help users track their negotiation progress and strategies.
 */

const negotiationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: false // Allow negotiations not tied to specific job
  },
  
  // Offer Details
  offerDetails: {
    company: {
      type: String,
      required: true
    },
    position: {
      type: String,
      required: true
    },
    location: String,
    receivedDate: Date,
    deadlineDate: Date,
    
    // Initial Offer
    initialOffer: {
      baseSalary: Number,
      signingBonus: Number,
      equityValue: Number,
      performanceBonus: Number,
      benefits: String,
      otherPerks: String,
      totalCompensation: Number
    },
    
    // Market Research
    marketData: {
      medianSalary: Number,
      minSalary: Number,
      maxSalary: Number,
      percentile: Number, // Where the offer falls in market range
      source: String
    }
  },
  
  // Personal Context
  context: {
    currentSalary: Number,
    desiredSalary: Number,
    minimumAcceptable: Number,
    yearsExperience: Number,
    specializations: [String],
    certifications: [String],
    uniqueSkills: [String],
    achievements: [String],
    competingOffers: [{
      company: String,
      baseSalary: Number,
      totalComp: Number
    }]
  },
  
  // Generated Talking Points
  talkingPoints: [{
    category: {
      type: String,
      enum: [
        'experience',
        'skills',
        'achievements',
        'market_data',
        'competing_offers',
        'unique_value',
        'cost_of_living',
        'role_responsibilities',
        'team_impact',
        'revenue_impact'
      ]
    },
    point: String,
    supporting_data: String,
    confidence: {
      type: String,
      enum: ['high', 'medium', 'low']
    },
    isUsed: {
      type: Boolean,
      default: false
    }
  }],
  
  // Negotiation Scripts/Scenarios
  scenarios: [{
    type: {
      type: String,
      enum: [
        'initial_counter',
        'salary_only',
        'total_comp_focus',
        'equity_emphasis',
        'benefits_negotiation',
        'timeline_extension',
        'competing_offer',
        'final_decision'
      ]
    },
    title: String,
    script: String,
    whenToUse: String,
    expectedResponse: String,
    nextSteps: String,
    isPracticed: {
      type: Boolean,
      default: false
    }
  }],
  
  // Total Compensation Framework
  compensationFramework: {
    baseSalaryWeight: {
      type: Number,
      default: 0.4
    },
    bonusWeight: {
      type: Number,
      default: 0.2
    },
    equityWeight: {
      type: Number,
      default: 0.2
    },
    benefitsWeight: {
      type: Number,
      default: 0.2
    },
    priorityOrder: [{
      component: String,
      importance: Number
    }],
    nonNegotiables: [String]
  },
  
  // Timing Strategy
  timingStrategy: {
    recommendedApproach: String,
    bestTimeToNegotiate: String,
    responseDeadline: Date,
    followUpSchedule: [{
      date: Date,
      action: String,
      completed: Boolean
    }],
    milestones: [{
      name: String,
      targetDate: Date,
      status: {
        type: String,
        enum: ['pending', 'completed', 'missed']
      }
    }]
  },
  
  // Confidence Building
  preparationChecklist: [{
    item: String,
    category: {
      type: String,
      enum: ['research', 'practice', 'documentation', 'mindset', 'logistics']
    },
    isCompleted: {
      type: Boolean,
      default: false
    },
    notes: String
  }],
  
  confidenceLevel: {
    type: Number,
    min: 1,
    max: 10,
    default: 5
  },
  
  confidenceExercises: [{
    exercise: String,
    description: String,
    isCompleted: {
      type: Boolean,
      default: false
    },
    completedDate: Date,
    reflection: String
  }],
  
  // Counteroffer Evaluation
  counteroffers: [{
    submittedDate: Date,
    requestedSalary: Number,
    requestedBonus: Number,
    requestedEquity: Number,
    otherRequests: String,
    
    employerResponse: {
      receivedDate: Date,
      revisedSalary: Number,
      revisedBonus: Number,
      revisedEquity: Number,
      additionalPerks: String,
      notes: String
    },
    
    evaluation: {
      meetsMinimum: Boolean,
      gapFromDesired: Number,
      strengthsOfOffer: [String],
      weaknessesOfOffer: [String],
      recommendation: String,
      shouldAccept: Boolean
    }
  }],
  
  // Negotiation Conversations
  conversations: [{
    date: Date,
    type: {
      type: String,
      enum: ['phone', 'video', 'email', 'in-person']
    },
    participants: [String],
    summary: String,
    keyPoints: [String],
    outcomeOrNextSteps: String,
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative']
    }
  }],
  
  // Final Outcome
  outcome: {
    status: {
      type: String,
      enum: ['in_progress', 'accepted', 'declined', 'withdrawn', 'expired'],
      default: 'in_progress'
    },
    decisionDate: Date,
    
    finalOffer: {
      baseSalary: Number,
      signingBonus: Number,
      equityValue: Number,
      performanceBonus: Number,
      benefits: String,
      otherPerks: String,
      totalCompensation: Number
    },
    
    improvementFromInitial: {
      salaryIncrease: Number,
      salaryIncreasePercent: Number,
      totalCompIncrease: Number,
      totalCompIncreasePercent: Number
    },
    
    lessonLearned: [String],
    whatWorked: [String],
    whatDidntWork: [String],
    adviceForFuture: String,
    overallSatisfaction: {
      type: Number,
      min: 1,
      max: 10
    }
  },
  
  // Salary Progression Tracking
  salaryHistory: [{
    date: Date,
    company: String,
    position: String,
    salary: Number,
    totalComp: Number,
    changeFromPrevious: Number,
    changePercent: Number,
    reasonForChange: String
  }],
  
  // Notes and Resources
  notes: String,
  resources: [{
    title: String,
    url: String,
    type: {
      type: String,
      enum: ['article', 'video', 'tool', 'template', 'book']
    }
  }],
  
  // Metadata
  isArchived: {
    type: Boolean,
    default: false
  },
  tags: [String]
}, {
  timestamps: true
});

// Indexes for efficient queries
negotiationSchema.index({ userId: 1, createdAt: -1 });
negotiationSchema.index({ userId: 1, 'outcome.status': 1 });
negotiationSchema.index({ userId: 1, 'offerDetails.company': 1 });
negotiationSchema.index({ userId: 1, isArchived: 1 });

// Virtual for age of negotiation
negotiationSchema.virtual('age').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24)); // days
});

// Calculate improvement metrics when final offer is set
negotiationSchema.methods.calculateImprovement = function() {
  const initial = this.offerDetails?.initialOffer;
  const final = this.outcome?.finalOffer;
  
  if (!initial || !final) return null;
  
  const salaryIncrease = final.baseSalary - initial.baseSalary;
  const totalCompIncrease = final.totalCompensation - initial.totalCompensation;
  
  this.outcome.improvementFromInitial = {
    salaryIncrease,
    salaryIncreasePercent: initial.baseSalary ? (salaryIncrease / initial.baseSalary * 100).toFixed(2) : 0,
    totalCompIncrease,
    totalCompIncreasePercent: initial.totalCompensation ? (totalCompIncrease / initial.totalCompensation * 100).toFixed(2) : 0
  };
  
  return this.outcome.improvementFromInitial;
};

export const Negotiation = mongoose.model("Negotiation", negotiationSchema);
