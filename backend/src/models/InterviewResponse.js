import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
  contentScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  structureScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  clarityScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  relevanceScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  specificityScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  impactScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  overallScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  strengths: [{
    type: String,
    trim: true
  }],
  weaknesses: [{
    type: String,
    trim: true
  }],
  suggestions: [{
    type: String,
    trim: true
  }],
  weakLanguagePatterns: [{
    pattern: {
      type: String,
      trim: true
    },
    context: {
      type: String,
      trim: true
    },
    alternative: {
      type: String,
      trim: true
    },
    reason: {
      type: String,
      trim: true
    }
  }],
  lengthAnalysis: {
    wordCount: {
      type: Number,
      required: true
    },
    estimatedDuration: {
      type: Number, // in seconds
      required: true
    },
    recommendation: {
      type: String,
      enum: ['Too Short', 'Optimal', 'Too Long', 'Slightly Short', 'Slightly Long'],
      required: true
    },
    idealRange: {
      min: Number,
      max: Number
    },
    adjustmentSuggestion: {
      type: String,
      trim: true
    }
  },
  starAnalysis: {
    hasStructure: {
      type: Boolean,
      required: true
    },
    components: {
      situation: {
        present: Boolean,
        score: {
          type: Number,
          min: 0,
          max: 100
        },
        feedback: String
      },
      task: {
        present: Boolean,
        score: {
          type: Number,
          min: 0,
          max: 100
        },
        feedback: String
      },
      action: {
        present: Boolean,
        score: {
          type: Number,
          min: 0,
          max: 100
        },
        feedback: String
      },
      result: {
        present: Boolean,
        score: {
          type: Number,
          min: 0,
          max: 100
        },
        feedback: String
      }
    },
    overallAdherence: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    },
    recommendations: [{
      type: String,
      trim: true
    }]
  },
  alternativeApproaches: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    example: {
      type: String,
      required: true
    },
    whenToUse: {
      type: String,
      trim: true
    }
  }],
  generatedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const interviewResponseSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  question: {
    text: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      enum: ['Behavioral', 'Technical', 'Situational', 'Leadership', 'Teamwork', 'Problem-Solving', 'Other'],
      default: 'Behavioral'
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Medium'
    }
  },
  response: {
    type: String,
    required: true,
    trim: true
  },
  targetDuration: {
    type: Number, // in seconds (e.g., 120 for 2 minutes)
    default: 120
  },
  context: {
    jobTitle: String,
    company: String,
    industry: String
  },
  feedback: {
    type: feedbackSchema,
    required: false
  },
  version: {
    type: Number,
    default: 1
  },
  previousVersionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InterviewResponse',
    default: null
  },
  improvementTracking: {
    overallImprovement: {
      type: Number,
      default: 0 // percentage improvement from first attempt
    },
    attempts: {
      type: Number,
      default: 1
    },
    firstAttemptScore: {
      type: Number,
      default: null
    },
    bestScore: {
      type: Number,
      default: null
    },
    scoreHistory: [{
      score: Number,
      date: Date
    }]
  },
  tags: [{
    type: String,
    trim: true
  }],
  notes: {
    type: String,
    trim: true
  },
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
interviewResponseSchema.index({ userId: 1, createdAt: -1 });
interviewResponseSchema.index({ userId: 1, 'question.category': 1 });
interviewResponseSchema.index({ userId: 1, isArchived: 1 });
interviewResponseSchema.index({ 'question.text': 'text', 'response': 'text' });

// Virtual for improvement metrics
interviewResponseSchema.virtual('improvementMetrics').get(function() {
  if (!this.improvementTracking.firstAttemptScore || !this.feedback) {
    return null;
  }

  const improvement = this.feedback.overallScore - this.improvementTracking.firstAttemptScore;
  const improvementPercentage = (improvement / this.improvementTracking.firstAttemptScore) * 100;

  return {
    scoreChange: improvement,
    percentageImprovement: Math.round(improvementPercentage * 10) / 10,
    attempts: this.improvementTracking.attempts,
    currentScore: this.feedback.overallScore,
    firstScore: this.improvementTracking.firstAttemptScore,
    bestScore: this.improvementTracking.bestScore
  };
});

// Method to update improvement tracking
interviewResponseSchema.methods.updateImprovementTracking = function(newScore) {
  // Set first attempt score if this is the first time
  if (this.improvementTracking.firstAttemptScore === null) {
    this.improvementTracking.firstAttemptScore = newScore;
  }

  // Update best score
  if (this.improvementTracking.bestScore === null || newScore > this.improvementTracking.bestScore) {
    this.improvementTracking.bestScore = newScore;
  }

  // Update attempts
  this.improvementTracking.attempts += 1;

  // Calculate overall improvement
  if (this.improvementTracking.firstAttemptScore > 0) {
    const improvement = ((newScore - this.improvementTracking.firstAttemptScore) / this.improvementTracking.firstAttemptScore) * 100;
    this.improvementTracking.overallImprovement = Math.round(improvement * 10) / 10;
  }

  // Add to score history
  this.improvementTracking.scoreHistory.push({
    score: newScore,
    date: new Date()
  });

  // Keep only last 20 scores
  if (this.improvementTracking.scoreHistory.length > 20) {
    this.improvementTracking.scoreHistory = this.improvementTracking.scoreHistory.slice(-20);
  }
};

// Method to get practice statistics
interviewResponseSchema.statics.getPracticeStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { userId, isArchived: false, feedback: { $exists: true } } },
    {
      $group: {
        _id: '$question.category',
        count: { $sum: 1 },
        avgScore: { $avg: '$feedback.overallScore' },
        bestScore: { $max: '$feedback.overallScore' },
        avgContentScore: { $avg: '$feedback.contentScore' },
        avgStructureScore: { $avg: '$feedback.structureScore' },
        avgClarityScore: { $avg: '$feedback.clarityScore' },
        avgRelevanceScore: { $avg: '$feedback.relevanceScore' },
        avgSpecificityScore: { $avg: '$feedback.specificityScore' },
        avgImpactScore: { $avg: '$feedback.impactScore' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Calculate overall stats
  const overallStats = await this.aggregate([
    { $match: { userId, isArchived: false, feedback: { $exists: true } } },
    {
      $group: {
        _id: null,
        totalResponses: { $sum: 1 },
        avgOverallScore: { $avg: '$feedback.overallScore' },
        totalAttempts: { $sum: '$improvementTracking.attempts' },
        avgImprovement: { $avg: '$improvementTracking.overallImprovement' }
      }
    }
  ]);

  return {
    byCategory: stats,
    overall: overallStats[0] || {
      totalResponses: 0,
      avgOverallScore: 0,
      totalAttempts: 0,
      avgImprovement: 0
    }
  };
};

// Ensure virtuals are included in JSON
interviewResponseSchema.set('toJSON', { virtuals: true });
interviewResponseSchema.set('toObject', { virtuals: true });

export const InterviewResponse = mongoose.model('InterviewResponse', interviewResponseSchema);
