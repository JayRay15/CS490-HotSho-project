import mongoose from "mongoose";

/**
 * UC-083: Salary Negotiation Preparation Model
 * 
 * Stores user's negotiation preparations, talking points, scenarios,
 * offers/counteroffers, and outcomes for tracking salary negotiations.
 */

const talkingPointSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['Achievement', 'Market Value', 'Unique Skills', 'Education', 'Certifications', 'Leadership', 'Impact', 'Other'],
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  evidence: {
    type: String,
    trim: true,
    maxlength: 500
  },
  strength: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium'
  }
}, { timestamps: true });

const negotiationScriptSchema = new mongoose.Schema({
  scenario: {
    type: String,
    enum: ['Initial Offer Too Low', 'Benefits Negotiation', 'Equity Discussion', 'Remote Work', 'Sign-on Bonus', 'Performance Review', 'Promotion', 'Counter Offer', 'Custom'],
    required: true
  },
  customScenario: String,
  opening: {
    type: String,
    required: true,
    maxlength: 1000
  },
  keyPoints: [{
    type: String,
    maxlength: 500
  }],
  closingStatement: {
    type: String,
    maxlength: 1000
  },
  alternativeResponses: [{
    situation: String,
    response: String
  }]
}, { timestamps: true });

const offerSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Initial', 'Counter', 'Final'],
    required: true
  },
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
  equity: {
    type: String,
    trim: true
  },
  benefits: {
    healthInsurance: { type: Boolean, default: false },
    dentalInsurance: { type: Boolean, default: false },
    visionInsurance: { type: Boolean, default: false },
    retirement401k: { type: Boolean, default: false },
    retirementMatch: { type: String, trim: true },
    paidTimeOff: { type: Number, min: 0 },
    sickDays: { type: Number, min: 0 },
    remoteWork: { type: String, enum: ['Full', 'Hybrid', 'None', ''], default: '' },
    flexibleSchedule: { type: Boolean, default: false },
    professionalDevelopment: { type: String, trim: true },
    other: [{ 
      name: String, 
      value: String 
    }]
  },
  totalCompensation: {
    type: Number,
    required: true
  },
  notes: {
    type: String,
    maxlength: 1000
  },
  receivedDate: {
    type: Date,
    default: Date.now
  },
  responseDeadline: Date
}, { timestamps: true });

const confidenceExerciseSchema = new mongoose.Schema({
  exerciseType: {
    type: String,
    enum: ['Power Posing', 'Visualization', 'Affirmations', 'Mock Negotiation', 'Research Review', 'Value Reflection', 'Custom'],
    required: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedDate: Date,
  notes: {
    type: String,
    maxlength: 500
  }
}, { timestamps: true });

const outcomeSchema = new mongoose.Schema({
  finalSalary: {
    type: Number,
    required: true,
    min: 0
  },
  totalCompensation: {
    type: Number,
    required: true,
    min: 0
  },
  agreedBenefits: [{
    name: String,
    value: String
  }],
  increaseFromInitial: {
    amount: Number,
    percentage: Number
  },
  compareToTarget: {
    targetSalary: Number,
    difference: Number,
    metTarget: Boolean
  },
  negotiationDuration: {
    type: String,
    trim: true
  },
  numberOfCounters: {
    type: Number,
    default: 0,
    min: 0
  },
  satisfaction: {
    type: String,
    enum: ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very Dissatisfied'],
    required: true
  },
  lessonsLearned: [{
    type: String,
    maxlength: 500
  }],
  wouldRecommendStrategy: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const salaryNegotiationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
    index: true
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
  status: {
    type: String,
    enum: ['Preparing', 'In Negotiation', 'Completed', 'Declined'],
    default: 'Preparing'
  },
  
  // Preparation Phase
  targetSalary: {
    type: Number,
    required: true,
    min: 0
  },
  minimumAcceptable: {
    type: Number,
    required: true,
    min: 0
  },
  idealSalary: {
    type: Number,
    min: 0
  },
  
  // Market Research Summary
  marketResearch: {
    industryMedian: Number,
    locationAdjusted: Number,
    experienceLevel: String,
    researched: { type: Boolean, default: false }
  },
  
  // Negotiation Tools
  talkingPoints: [talkingPointSchema],
  scripts: [negotiationScriptSchema],
  confidenceExercises: [confidenceExerciseSchema],
  
  // Offers & Counteroffers
  offers: [offerSchema],
  
  // Timeline
  preparationStartDate: {
    type: Date,
    default: Date.now
  },
  negotiationStartDate: Date,
  completionDate: Date,
  
  // Outcome
  outcome: outcomeSchema,
  
  // Strategy & Notes
  negotiationStrategy: {
    type: String,
    enum: ['Collaborative', 'Competitive', 'Accommodating', 'Compromise', 'Custom'],
    default: 'Collaborative'
  },
  prioritizedBenefits: [{
    benefit: String,
    priority: { type: String, enum: ['High', 'Medium', 'Low'] }
  }],
  dealBreakers: [{
    type: String,
    maxlength: 200
  }],
  notes: {
    type: String,
    maxlength: 2000
  }
}, { timestamps: true });

// Indexes for efficient querying
salaryNegotiationSchema.index({ userId: 1, createdAt: -1 });
salaryNegotiationSchema.index({ jobId: 1 });
salaryNegotiationSchema.index({ status: 1 });

// Virtual for negotiation progress
salaryNegotiationSchema.virtual('progress').get(function () {
  let progress = 0;
  let total = 6;
  
  if (this.marketResearch?.researched) progress++;
  if (this.talkingPoints && this.talkingPoints.length > 0) progress++;
  if (this.scripts && this.scripts.length > 0) progress++;
  if (this.confidenceExercises && this.confidenceExercises.some(ex => ex.completed)) progress++;
  if (this.offers && this.offers.length > 0) progress++;
  if (this.outcome) progress++;
  
  return Math.round((progress / total) * 100);
});

// Method to add talking point
salaryNegotiationSchema.methods.addTalkingPoint = function(talkingPoint) {
  this.talkingPoints.push(talkingPoint);
  return this.save();
};

// Method to add negotiation script
salaryNegotiationSchema.methods.addScript = function(script) {
  this.scripts.push(script);
  return this.save();
};

// Method to add offer
salaryNegotiationSchema.methods.addOffer = function(offer) {
  this.offers.push(offer);
  if (offer.type === 'Initial' && !this.negotiationStartDate) {
    this.negotiationStartDate = new Date();
    this.status = 'In Negotiation';
  }
  return this.save();
};

// Method to complete negotiation
salaryNegotiationSchema.methods.completeNegotiation = function(outcome) {
  this.outcome = outcome;
  this.status = 'Completed';
  this.completionDate = new Date();
  
  // Calculate metrics
  const initialOffer = this.offers.find(o => o.type === 'Initial');
  if (initialOffer) {
    this.outcome.increaseFromInitial = {
      amount: outcome.finalSalary - initialOffer.baseSalary,
      percentage: ((outcome.finalSalary - initialOffer.baseSalary) / initialOffer.baseSalary * 100).toFixed(2)
    };
  }
  
  this.outcome.compareToTarget = {
    targetSalary: this.targetSalary,
    difference: outcome.finalSalary - this.targetSalary,
    metTarget: outcome.finalSalary >= this.targetSalary
  };
  
  this.outcome.numberOfCounters = this.offers.filter(o => o.type === 'Counter').length;
  
  return this.save();
};

export const SalaryNegotiation = mongoose.model("SalaryNegotiation", salaryNegotiationSchema);
