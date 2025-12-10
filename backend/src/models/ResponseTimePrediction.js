import mongoose from 'mongoose';

// Schema for tracking historical response data
const historicalResponseSchema = new mongoose.Schema({
  companySize: {
    type: String,
    enum: ["1-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5001-10000", "10000+", "unknown"],
  },
  industry: {
    type: String,
    enum: ["Technology", "Healthcare", "Finance", "Education", "Manufacturing", "Retail", "Marketing", "Consulting", "Other", "unknown"],
  },
  jobLevel: {
    type: String,
    enum: ["entry", "mid", "senior", "lead", "manager", "director", "executive", "unknown"],
    default: "unknown"
  },
  applicationDate: {
    type: Date,
    required: true
  },
  responseDate: {
    type: Date
  },
  daysToResponse: {
    type: Number // Calculated from applicationDate to responseDate
  },
  responseType: {
    type: String,
    enum: ["interview_invite", "rejection", "follow_up_needed", "ghosted", "offer", "other"],
  },
  dayOfWeekApplied: {
    type: Number, // 0-6 (Sunday-Saturday)
    min: 0,
    max: 6
  },
  monthApplied: {
    type: Number, // 1-12
    min: 1,
    max: 12
  },
  wasHolidaySeason: {
    type: Boolean,
    default: false
  },
  wasFiscalQuarterEnd: {
    type: Boolean,
    default: false
  }
}, { _id: false });

// Schema for prediction results
const predictionResultSchema = new mongoose.Schema({
  predictedDaysMin: {
    type: Number,
    required: true
  },
  predictedDaysMax: {
    type: Number,
    required: true
  },
  predictedDaysMedian: {
    type: Number,
    required: true
  },
  confidenceLevel: {
    type: Number, // Percentage (e.g., 80)
    min: 0,
    max: 100,
    default: 80
  },
  suggestedFollowUpDate: {
    type: Date
  },
  isOverdue: {
    type: Boolean,
    default: false
  },
  daysOverdue: {
    type: Number,
    default: 0
  },
  factors: [{
    factor: {
      type: String,
      enum: [
        'company_size',
        'industry',
        'job_level',
        'day_of_week',
        'seasonality',
        'holiday_period',
        'fiscal_quarter',
        'historical_accuracy'
      ],
      required: true
    },
    impact: {
      type: String,
      enum: ['faster', 'slower', 'neutral'],
      required: true
    },
    description: String,
    adjustmentDays: Number
  }],
  industryBenchmark: {
    averageDays: Number,
    percentile25: Number,
    percentile75: Number,
    sampleSize: Number
  }
}, { _id: false });

// Main Response Time Prediction Schema
const responseTimePredictionSchema = new mongoose.Schema({
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
  // Job context for prediction
  companySize: {
    type: String,
    enum: ["1-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5001-10000", "10000+", "unknown"],
    default: "unknown"
  },
  industry: {
    type: String,
    enum: ["Technology", "Healthcare", "Finance", "Education", "Manufacturing", "Retail", "Marketing", "Consulting", "Other", "unknown"],
    default: "unknown"
  },
  jobLevel: {
    type: String,
    enum: ["entry", "mid", "senior", "lead", "manager", "director", "executive", "unknown"],
    default: "unknown"
  },
  companyName: {
    type: String
  },
  // Application details
  applicationDate: {
    type: Date
  },
  // Current prediction
  currentPrediction: predictionResultSchema,
  // Actual response tracking
  actualResponseDate: {
    type: Date
  },
  actualDaysToResponse: {
    type: Number
  },
  responseType: {
    type: String,
    enum: ["interview_invite", "rejection", "follow_up_needed", "ghosted", "offer", "other"]
  },
  // Prediction accuracy tracking
  predictionAccuracy: {
    wasAccurate: {
      type: Boolean
    },
    errorDays: {
      type: Number // Difference between predicted median and actual
    },
    wasWithinConfidenceInterval: {
      type: Boolean
    }
  },
  // Notification tracking
  overdueAlertSent: {
    type: Boolean,
    default: false
  },
  overdueAlertSentAt: {
    type: Date
  },
  followUpReminderSent: {
    type: Boolean,
    default: false
  },
  followUpReminderSentAt: {
    type: Date
  },
  // Status
  status: {
    type: String,
    enum: ['pending', 'responded', 'ghosted', 'withdrawn'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Compound indexes for efficient querying
responseTimePredictionSchema.index({ userId: 1, jobId: 1 }, { unique: true });
responseTimePredictionSchema.index({ userId: 1, status: 1 });
responseTimePredictionSchema.index({ industry: 1, companySize: 1 });
responseTimePredictionSchema.index({ 'currentPrediction.isOverdue': 1, overdueAlertSent: 1 });

// Static method to get aggregated response time data by industry
responseTimePredictionSchema.statics.getIndustryStats = async function(industry) {
  const stats = await this.aggregate([
    { 
      $match: { 
        industry: industry || { $exists: true },
        actualDaysToResponse: { $exists: true, $ne: null },
        status: 'responded'
      } 
    },
    {
      $group: {
        _id: '$industry',
        avgDays: { $avg: '$actualDaysToResponse' },
        minDays: { $min: '$actualDaysToResponse' },
        maxDays: { $max: '$actualDaysToResponse' },
        count: { $sum: 1 },
        responses: { $push: '$actualDaysToResponse' }
      }
    }
  ]);
  
  return stats;
};

// Static method to get response time stats by company size
responseTimePredictionSchema.statics.getCompanySizeStats = async function(companySize) {
  const stats = await this.aggregate([
    { 
      $match: { 
        companySize: companySize || { $exists: true },
        actualDaysToResponse: { $exists: true, $ne: null },
        status: 'responded'
      } 
    },
    {
      $group: {
        _id: '$companySize',
        avgDays: { $avg: '$actualDaysToResponse' },
        minDays: { $min: '$actualDaysToResponse' },
        maxDays: { $max: '$actualDaysToResponse' },
        count: { $sum: 1 },
        responses: { $push: '$actualDaysToResponse' }
      }
    }
  ]);
  
  return stats;
};

// Static method to get combined statistics for prediction
responseTimePredictionSchema.statics.getPredictionStats = async function(filters = {}) {
  const match = {
    actualDaysToResponse: { $exists: true, $ne: null },
    status: 'responded'
  };
  
  if (filters.industry) match.industry = filters.industry;
  if (filters.companySize) match.companySize = filters.companySize;
  if (filters.jobLevel) match.jobLevel = filters.jobLevel;
  
  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        avgDays: { $avg: '$actualDaysToResponse' },
        minDays: { $min: '$actualDaysToResponse' },
        maxDays: { $max: '$actualDaysToResponse' },
        stdDev: { $stdDevPop: '$actualDaysToResponse' },
        count: { $sum: 1 },
        responses: { $push: '$actualDaysToResponse' }
      }
    }
  ]);
  
  if (stats.length === 0) return null;
  
  const result = stats[0];
  // Calculate percentiles
  const sorted = result.responses.sort((a, b) => a - b);
  result.percentile10 = sorted[Math.floor(sorted.length * 0.1)] || result.minDays;
  result.percentile25 = sorted[Math.floor(sorted.length * 0.25)] || result.minDays;
  result.percentile50 = sorted[Math.floor(sorted.length * 0.5)] || result.avgDays;
  result.percentile75 = sorted[Math.floor(sorted.length * 0.75)] || result.maxDays;
  result.percentile90 = sorted[Math.floor(sorted.length * 0.9)] || result.maxDays;
  
  delete result.responses;
  return result;
};

// Static method to get overdue applications
responseTimePredictionSchema.statics.getOverdueApplications = async function(userId) {
  return this.find({
    userId,
    status: 'pending',
    'currentPrediction.isOverdue': true
  }).populate('jobId');
};

// Method to update prediction accuracy after response received
responseTimePredictionSchema.methods.recordResponse = function(responseDate, responseType) {
  this.actualResponseDate = responseDate;
  this.responseType = responseType;
  this.status = responseType === 'ghosted' ? 'ghosted' : 'responded';
  
  if (this.applicationDate) {
    this.actualDaysToResponse = Math.floor(
      (new Date(responseDate) - new Date(this.applicationDate)) / (1000 * 60 * 60 * 24)
    );
    
    // Calculate prediction accuracy
    if (this.currentPrediction) {
      const predictedMedian = this.currentPrediction.predictedDaysMedian;
      this.predictionAccuracy = {
        wasAccurate: Math.abs(this.actualDaysToResponse - predictedMedian) <= 3,
        errorDays: this.actualDaysToResponse - predictedMedian,
        wasWithinConfidenceInterval: 
          this.actualDaysToResponse >= this.currentPrediction.predictedDaysMin &&
          this.actualDaysToResponse <= this.currentPrediction.predictedDaysMax
      };
    }
  }
  
  return this;
};

export const ResponseTimePrediction = mongoose.model('ResponseTimePrediction', responseTimePredictionSchema);
