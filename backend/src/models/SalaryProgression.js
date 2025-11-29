import mongoose from "mongoose";

/**
 * UC-100: Salary Progression and Market Positioning Model
 * 
 * Tracks salary offers, negotiation outcomes, career progression data,
 * and market positioning over time for analytics and recommendations.
 */

const salaryOfferSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  jobTitle: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  industry: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  offerDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  // Compensation breakdown
  baseSalary: {
    type: Number,
    required: true,
    min: 0
  },
  signingBonus: {
    type: Number,
    default: 0,
    min: 0
  },
  performanceBonus: {
    type: Number,
    default: 0,
    min: 0
  },
  equityValue: {
    type: Number,
    default: 0,
    min: 0
  },
  benefitsValue: {
    type: Number,
    default: 0,
    min: 0
  },
  totalCompensation: {
    type: Number,
    required: true,
    min: 0
  },
  // Negotiation details
  wasNegotiated: {
    type: Boolean,
    default: false
  },
  initialOffer: {
    type: Number,
    min: 0
  },
  finalOffer: {
    type: Number,
    min: 0
  },
  negotiationRounds: {
    type: Number,
    default: 0,
    min: 0
  },
  increaseFromInitial: {
    amount: Number,
    percentage: Number
  },
  negotiationOutcome: {
    type: String,
    enum: ['Accepted', 'Declined', 'Pending', ''],
    default: ''
  },
  offerStatus: {
    type: String,
    enum: ['Active', 'Accepted', 'Declined', 'Expired'],
    default: 'Active'
  },
  // Market context
  marketMedian: {
    type: Number,
    min: 0
  },
  marketPosition: {
    type: String,
    enum: ['Below Market', 'At Market', 'Above Market', ''],
    default: ''
  },
  percentileRank: {
    type: Number,
    min: 0,
    max: 100
  },
  // Additional details
  experienceLevel: {
    type: String,
    enum: ['Entry', 'Mid', 'Senior', 'Executive', '']
  },
  yearsOfExperience: {
    type: Number,
    min: 0
  },
  benefits: {
    healthInsurance: Boolean,
    dentalInsurance: Boolean,
    visionInsurance: Boolean,
    retirement401k: Boolean,
    retirementMatch: String,
    paidTimeOff: Number,
    remoteWork: {
      type: String,
      enum: ['Full', 'Hybrid', 'None', '']
    },
    stockOptions: Boolean,
    other: [String]
  },
  notes: {
    type: String,
    maxlength: 1000
  }
}, { timestamps: true });

const careerProgressionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  // Salary offers and outcomes
  salaryOffers: [salaryOfferSchema],
  
  // Career milestones
  careerMilestones: [{
    date: {
      type: Date,
      required: true
    },
    type: {
      type: String,
      enum: ['Job Change', 'Promotion', 'Raise', 'Bonus', 'Performance Review', 'Skill Acquisition', 'Certification', 'Other'],
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    company: String,
    description: {
      type: String,
      maxlength: 500
    },
    salaryImpact: {
      type: Number
    },
    compensationBefore: Number,
    compensationAfter: Number
  }],
  
  // Negotiation success tracking
  negotiationHistory: [{
    negotiationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalaryNegotiation'
    },
    date: Date,
    jobTitle: String,
    company: String,
    targetSalary: Number,
    achievedSalary: Number,
    success: Boolean,
    successRate: Number, // How close to target (percentage)
    strategyUsed: String,
    lessonsLearned: [String]
  }],
  
  // Market positioning over time
  marketPositioning: [{
    assessmentDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    currentSalary: Number,
    marketMedian: Number,
    marketMin: Number,
    marketMax: Number,
    percentileRank: Number,
    position: {
      type: String,
      enum: ['Below Market', 'At Market', 'Above Market']
    },
    industry: String,
    location: String,
    experienceLevel: String,
    gapFromMarket: Number,
    gapPercentage: Number
  }],
  
  // Total compensation evolution
  compensationHistory: [{
    date: {
      type: Date,
      required: true
    },
    baseSalary: Number,
    bonuses: Number,
    equity: Number,
    benefits: Number,
    totalCompensation: Number,
    source: {
      type: String,
      enum: ['Job Offer', 'Annual Review', 'Promotion', 'Manual Entry']
    },
    company: String,
    title: String
  }],
  
  // Benefits tracking over time
  benefitsTrends: [{
    date: Date,
    healthInsurance: Boolean,
    dentalVision: Boolean,
    retirement401k: Boolean,
    retirementMatch: String,
    paidTimeOff: Number,
    remoteWork: String,
    professionalDevelopment: Number,
    stockOptions: Boolean,
    estimatedValue: Number
  }],
  
  // Recommendations and insights
  advancementRecommendations: [{
    generatedDate: {
      type: Date,
      default: Date.now
    },
    recommendationType: {
      type: String,
      enum: ['Job Change', 'Negotiation', 'Skill Development', 'Certification', 'Industry Switch', 'Location Change', 'Other']
    },
    title: String,
    description: String,
    potentialImpact: {
      salaryIncrease: Number,
      percentage: Number
    },
    timeframe: String,
    priority: {
      type: String,
      enum: ['High', 'Medium', 'Low']
    },
    actionItems: [String],
    marketData: mongoose.Schema.Types.Mixed
  }],
  
  // Analytics metadata
  analytics: {
    totalOffersReceived: {
      type: Number,
      default: 0
    },
    totalOffersAccepted: {
      type: Number,
      default: 0
    },
    totalOffersDeclined: {
      type: Number,
      default: 0
    },
    averageNegotiationIncrease: {
      type: Number,
      default: 0
    },
    negotiationSuccessRate: {
      type: Number,
      default: 0
    },
    totalCompensationGrowth: {
      type: Number,
      default: 0
    },
    yearOverYearGrowth: [{
      year: Number,
      growth: Number,
      percentage: Number
    }],
    averageTimeToSalaryIncrease: Number, // in months
    careerVelocity: String // 'Slow', 'Steady', 'Fast', 'Accelerating'
  }
}, { timestamps: true });

// Indexes for efficient querying
careerProgressionSchema.index({ userId: 1 });
careerProgressionSchema.index({ 'salaryOffers.offerDate': -1 });
careerProgressionSchema.index({ 'careerMilestones.date': -1 });
careerProgressionSchema.index({ 'marketPositioning.assessmentDate': -1 });
careerProgressionSchema.index({ 'compensationHistory.date': -1 });

// Method to add salary offer
careerProgressionSchema.methods.addSalaryOffer = function(offerData) {
  this.salaryOffers.push(offerData);
  
  // Update analytics
  this.analytics.totalOffersReceived = this.salaryOffers.length;
  this.analytics.totalOffersAccepted = this.salaryOffers.filter(o => o.offerStatus === 'Accepted').length;
  this.analytics.totalOffersDeclined = this.salaryOffers.filter(o => o.offerStatus === 'Declined').length;
  
  // Calculate negotiation success rate
  const negotiatedOffers = this.salaryOffers.filter(o => o.wasNegotiated);
  if (negotiatedOffers.length > 0) {
    // Count successful negotiations (those with positive increase)
    const successfulNegotiations = negotiatedOffers.filter(o => 
      o.increaseFromInitial && o.increaseFromInitial.percentage > 0
    );
    this.analytics.negotiationSuccessRate = (successfulNegotiations.length / negotiatedOffers.length) * 100;
  } else {
    this.analytics.negotiationSuccessRate = 0;
  }
  
  // Calculate average negotiation increase (only from successful negotiations)
  const successfulNegotiations = this.salaryOffers.filter(o => 
    o.wasNegotiated && o.increaseFromInitial && o.increaseFromInitial.percentage > 0
  );
  if (successfulNegotiations.length > 0) {
    const totalIncrease = successfulNegotiations.reduce((sum, o) => sum + parseFloat(o.increaseFromInitial.percentage), 0);
    this.analytics.averageNegotiationIncrease = totalIncrease / successfulNegotiations.length;
  } else {
    this.analytics.averageNegotiationIncrease = 0;
  }
  
  // Calculate total compensation growth from salary offers
  const sortedOffers = this.salaryOffers
    .filter(o => o.totalCompensation && o.offerDate)
    .sort((a, b) => new Date(a.offerDate) - new Date(b.offerDate));
  
  if (sortedOffers.length >= 2) {
    const earliest = sortedOffers[0];
    const latest = sortedOffers[sortedOffers.length - 1];
    this.analytics.totalCompensationGrowth = 
      ((latest.totalCompensation - earliest.totalCompensation) / earliest.totalCompensation) * 100;
  } else if (sortedOffers.length === 1 && this.compensationHistory.length > 0) {
    // If only one offer but we have compensation history, compare with history
    const historyComp = this.compensationHistory[this.compensationHistory.length - 1];
    if (historyComp.totalCompensation) {
      this.analytics.totalCompensationGrowth = 
        ((sortedOffers[0].totalCompensation - historyComp.totalCompensation) / historyComp.totalCompensation) * 100;
    }
  } else {
    this.analytics.totalCompensationGrowth = 0;
  }
  
  return this.save();
};

// Method to add career milestone
careerProgressionSchema.methods.addCareerMilestone = function(milestoneData) {
  this.careerMilestones.push(milestoneData);
  
  // Sort by date descending
  this.careerMilestones.sort((a, b) => b.date - a.date);
  
  return this.save();
};

// Method to add market positioning assessment
careerProgressionSchema.methods.addMarketAssessment = function(assessmentData) {
  this.marketPositioning.push(assessmentData);
  
  // Sort by date descending
  this.marketPositioning.sort((a, b) => b.assessmentDate - a.assessmentDate);
  
  return this.save();
};

// Method to add compensation snapshot
careerProgressionSchema.methods.addCompensationSnapshot = function(compensationData) {
  this.compensationHistory.push(compensationData);
  
  // Sort by date descending
  this.compensationHistory.sort((a, b) => b.date - a.date);
  
  // Calculate year-over-year growth
  this.calculateYearOverYearGrowth();
  
  return this.save();
};

// Method to calculate year-over-year growth
careerProgressionSchema.methods.calculateYearOverYearGrowth = function() {
  const history = this.compensationHistory.slice().sort((a, b) => a.date - b.date);
  const yearlyGrowth = [];
  
  for (let i = 1; i < history.length; i++) {
    const current = history[i];
    const previous = history[i - 1];
    
    const currentYear = new Date(current.date).getFullYear();
    const previousYear = new Date(previous.date).getFullYear();
    
    if (currentYear !== previousYear && current.totalCompensation && previous.totalCompensation) {
      const growth = current.totalCompensation - previous.totalCompensation;
      const percentage = (growth / previous.totalCompensation) * 100;
      
      yearlyGrowth.push({
        year: currentYear,
        growth,
        percentage: parseFloat(percentage.toFixed(2))
      });
    }
  }
  
  this.analytics.yearOverYearGrowth = yearlyGrowth;
  
  // Calculate total growth
  if (history.length >= 2) {
    const earliest = history[0];
    const latest = history[history.length - 1];
    if (earliest.totalCompensation && latest.totalCompensation) {
      this.analytics.totalCompensationGrowth = 
        ((latest.totalCompensation - earliest.totalCompensation) / earliest.totalCompensation) * 100;
    }
  }
};

// Method to add advancement recommendation
careerProgressionSchema.methods.addRecommendation = function(recommendation) {
  this.advancementRecommendations.push(recommendation);
  
  // Keep only the most recent 10 recommendations
  if (this.advancementRecommendations.length > 10) {
    this.advancementRecommendations = this.advancementRecommendations
      .sort((a, b) => b.generatedDate - a.generatedDate)
      .slice(0, 10);
  }
  
  return this.save();
};

// Method to track negotiation outcome
careerProgressionSchema.methods.addNegotiationOutcome = function(outcomeData) {
  this.negotiationHistory.push(outcomeData);
  
  // Calculate success rate
  const total = this.negotiationHistory.length;
  const successful = this.negotiationHistory.filter(n => n.success).length;
  this.analytics.negotiationSuccessRate = total > 0 ? (successful / total) * 100 : 0;
  
  return this.save();
};

// Method to calculate career velocity
careerProgressionSchema.methods.calculateCareerVelocity = function() {
  const milestones = this.careerMilestones.filter(m => 
    ['Job Change', 'Promotion', 'Raise'].includes(m.type)
  );
  
  if (milestones.length < 2) {
    this.analytics.careerVelocity = 'Steady';
    return;
  }
  
  // Sort by date
  const sorted = milestones.slice().sort((a, b) => a.date - b.date);
  
  // Calculate time between milestones in months
  const intervals = [];
  for (let i = 1; i < sorted.length; i++) {
    const months = (sorted[i].date - sorted[i - 1].date) / (1000 * 60 * 60 * 24 * 30);
    intervals.push(months);
  }
  
  const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
  
  // Determine velocity
  if (avgInterval < 12) {
    this.analytics.careerVelocity = 'Fast';
  } else if (avgInterval < 24) {
    this.analytics.careerVelocity = 'Steady';
  } else if (avgInterval < 36) {
    this.analytics.careerVelocity = 'Slow';
  } else {
    this.analytics.careerVelocity = 'Slow';
  }
  
  // Check if accelerating
  if (intervals.length >= 3) {
    const recent = intervals.slice(-2).reduce((sum, val) => sum + val, 0) / 2;
    const older = intervals.slice(0, -2).reduce((sum, val) => sum + val, 0) / (intervals.length - 2);
    
    if (recent < older * 0.75) {
      this.analytics.careerVelocity = 'Accelerating';
    }
  }
  
  this.analytics.averageTimeToSalaryIncrease = avgInterval;
};

export const SalaryProgression = mongoose.model("SalaryProgression", careerProgressionSchema);
