import mongoose from "mongoose";

// Schema for tracking preparation factors
const preparationFactorsSchema = new mongoose.Schema({
  roleMatchScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  companyResearchCompleted: {
    type: Boolean,
    default: false,
  },
  companyResearchCompleteness: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  practiceHours: {
    type: Number,
    min: 0,
    default: 0,
  },
  mockInterviewsCompleted: {
    type: Number,
    min: 0,
    default: 0,
  },
  technicalPrepScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  behavioralPrepScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  preparationTasksCompleted: {
    type: Number,
    min: 0,
    default: 0,
  },
  totalPreparationTasks: {
    type: Number,
    min: 0,
    default: 0,
  },
  resumeTailored: {
    type: Boolean,
    default: false,
  },
  coverLetterSubmitted: {
    type: Boolean,
    default: false,
  },
}, { _id: false });

// Schema for historical performance patterns
const performancePatternSchema = new mongoose.Schema({
  previousInterviewCount: {
    type: Number,
    min: 0,
    default: 0,
  },
  successRate: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  averageRating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
  },
  strongestInterviewType: {
    type: String,
    enum: ["Phone Screen", "Video Call", "In-Person", "Technical", "Final Round", "Other", "None"],
    default: "None",
  },
  improvementTrend: {
    type: String,
    enum: ["Improving", "Stable", "Declining", "Insufficient Data"],
    default: "Insufficient Data",
  },
}, { _id: false });

// Schema for improvement recommendations
const recommendationSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ["Company Research", "Technical Skills", "Behavioral Practice", "Mock Interviews", "Resume", "General Preparation"],
  },
  priority: {
    type: String,
    required: true,
    enum: ["High", "Medium", "Low"],
    default: "Medium",
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  estimatedImpact: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  estimatedTimeMinutes: {
    type: Number,
    min: 0,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  completedAt: {
    type: Date,
  },
  allowManualCompletion: {
    type: Boolean,
    default: false,
  },
  manuallyCompleted: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

// Schema for tracking prediction accuracy
const predictionOutcomeSchema = new mongoose.Schema({
  actualResult: {
    type: String,
    enum: ["Passed", "Failed", "Moved to Next Round", "Offer Extended", "Pending"],
    default: "Pending",
  },
  actualRating: {
    type: Number,
    min: 1,
    max: 5,
  },
  predictionAccuracy: {
    type: Number,
    min: 0,
    max: 100,
  },
  recordedAt: {
    type: Date,
  },
}, { _id: false });

const interviewPredictionSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    interviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Interview",
      required: true,
      unique: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    
    // Success Probability Metrics
    successProbability: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 50,
    },
    confidenceScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 50,
    },
    
    // Detailed Factor Breakdown
    preparationFactors: {
      type: preparationFactorsSchema,
      required: true,
    },
    performancePattern: {
      type: performancePatternSchema,
      required: true,
    },
    
    // Factor Weights Used in Calculation
    factorWeights: {
      roleMatch: { type: Number, default: 20 },
      companyResearch: { type: Number, default: 15 },
      practiceHours: { type: Number, default: 15 },
      mockInterviews: { type: Number, default: 15 },
      technicalPrep: { type: Number, default: 10 },
      behavioralPrep: { type: Number, default: 10 },
      historicalPerformance: { type: Number, default: 15 },
    },
    
    // Recommendations
    recommendations: [recommendationSchema],
    
    // Comparison Data
    comparisonData: {
      rankAmongUpcoming: {
        type: Number,
        min: 1,
      },
      totalUpcomingInterviews: {
        type: Number,
        min: 0,
        default: 0,
      },
      percentile: {
        type: Number,
        min: 0,
        max: 100,
      },
    },
    
    // Outcome Tracking
    outcome: predictionOutcomeSchema,
    
    // Metadata
    calculatedAt: {
      type: Date,
      default: Date.now,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    version: {
      type: Number,
      default: 1,
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for efficient queries
interviewPredictionSchema.index({ userId: 1, calculatedAt: -1 });
interviewPredictionSchema.index({ userId: 1, successProbability: -1 });
interviewPredictionSchema.index({ jobId: 1 });

// Virtual for preparation completeness percentage
interviewPredictionSchema.virtual('preparationCompleteness').get(function() {
  if (this.preparationFactors.totalPreparationTasks === 0) return 0;
  return Math.round(
    (this.preparationFactors.preparationTasksCompleted / this.preparationFactors.totalPreparationTasks) * 100
  );
});

// Virtual for high priority recommendations count
interviewPredictionSchema.virtual('highPriorityRecommendationsCount').get(function() {
  return this.recommendations.filter(r => r.priority === 'High' && !r.completed).length;
});

// Method to update preparation factors
interviewPredictionSchema.methods.updatePreparationFactors = function(factors) {
  this.preparationFactors = { ...this.preparationFactors, ...factors };
  this.lastUpdated = Date.now();
  return this.save();
};

// Method to mark recommendation as completed
interviewPredictionSchema.methods.completeRecommendation = function(recommendationId) {
  const recommendation = this.recommendations.id(recommendationId);
  if (recommendation) {
    recommendation.completed = true;
    recommendation.completedAt = Date.now();
    this.lastUpdated = Date.now();
    return this.save();
  }
  throw new Error('Recommendation not found');
};

// Method to uncomplete a recommendation
interviewPredictionSchema.methods.uncompleteRecommendation = function(recommendationId) {
  const recommendation = this.recommendations.id(recommendationId);
  if (recommendation) {
    recommendation.completed = false;
    recommendation.completedAt = null;
    this.lastUpdated = Date.now();
    return this.save();
  }
  throw new Error('Recommendation not found');
};

// Method to record actual outcome
interviewPredictionSchema.methods.recordOutcome = function(actualResult, actualRating) {
  this.outcome.actualResult = actualResult;
  if (actualRating) {
    this.outcome.actualRating = actualRating;
  }
  this.outcome.recordedAt = Date.now();
  
  // Calculate prediction accuracy based on result mapping
  const resultScores = {
    'Offer Extended': 100,
    'Moved to Next Round': 85,
    'Passed': 75,
    'Failed': 0,
  };
  
  if (resultScores[actualResult] !== undefined) {
    const actualScore = resultScores[actualResult];
    this.outcome.predictionAccuracy = 100 - Math.abs(this.successProbability - actualScore);
  }
  
  return this.save();
};

// Static method to calculate average prediction accuracy for a user
interviewPredictionSchema.statics.getAverageAccuracy = async function(userId) {
  const predictions = await this.find({
    userId,
    'outcome.predictionAccuracy': { $exists: true, $ne: null },
  });
  
  if (predictions.length === 0) return null;
  
  const totalAccuracy = predictions.reduce((sum, pred) => sum + pred.outcome.predictionAccuracy, 0);
  return Math.round(totalAccuracy / predictions.length);
};

export const InterviewPrediction = mongoose.model("InterviewPrediction", interviewPredictionSchema);
