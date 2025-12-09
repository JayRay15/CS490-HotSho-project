import mongoose from 'mongoose';

const timingRecommendationSchema = new mongoose.Schema({
  recommendedTime: {
    type: Date,
    required: true
  },
  dayOfWeek: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true
  },
  hourOfDay: {
    type: Number,
    min: 0,
    max: 23,
    required: true
  },
  confidence: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  reasoning: {
    type: String,
    required: true
  },
  factors: [{
    factor: {
      type: String,
      enum: [
        'day_of_week',
        'time_of_day',
        'timezone',
        'industry_pattern',
        'company_size',
        'holiday',
        'fiscal_period',
        'historical_success',
        'response_time_pattern'
      ],
      required: true
    },
    impact: {
      type: String,
      enum: ['positive', 'negative', 'neutral'],
      required: true
    },
    weight: {
      type: Number,
      min: 0,
      max: 10,
      default: 5
    },
    description: String
  }],
  warnings: [{
    type: {
      type: String,
      enum: ['bad_timing', 'holiday', 'weekend', 'fiscal_quarter_end', 'late_friday', 'early_monday'],
      required: true
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    message: {
      type: String,
      required: true
    }
  }]
}, { _id: false });

const scheduledSubmissionSchema = new mongoose.Schema({
  scheduledTime: {
    type: Date,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'submitted', 'reminded', 'cancelled', 'failed'],
    default: 'scheduled',
    required: true
  },
  submittedAt: Date,
  cancelledAt: Date,
  failureReason: String,
  reminderSent: {
    type: Boolean,
    default: false
  },
  autoSubmit: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const applicationTimingSchema = new mongoose.Schema({
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
  industry: {
    type: String,
    trim: true,
    index: true
  },
  companySize: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5001-10000', '10000+', ''],
    default: ''
  },
  location: {
    type: String,
    trim: true
  },
  timezone: {
    type: String,
    trim: true
  },
  isRemote: {
    type: Boolean,
    default: false
  },
  currentRecommendation: timingRecommendationSchema,
  scheduledSubmission: scheduledSubmissionSchema,
  submissionHistory: [{
    submittedAt: {
      type: Date,
      required: true
    },
    dayOfWeek: String,
    hourOfDay: Number,
    responseReceived: {
      type: Boolean,
      default: false
    },
    responseTime: Number, // hours until response
    responseType: {
      type: String,
      enum: ['positive', 'negative', 'neutral', 'no_response'],
      default: 'no_response'
    },
    wasScheduled: {
      type: Boolean,
      default: false
    },
    followedRecommendation: {
      type: Boolean,
      default: false
    }
  }],
  abTestGroup: {
    type: String,
    enum: ['optimal_time', 'random_time', 'user_choice', 'control'],
    default: 'user_choice'
  },
  metrics: {
    totalSubmissions: {
      type: Number,
      default: 0
    },
    responseRate: {
      type: Number,
      default: 0
    },
    averageResponseTime: {
      type: Number,
      default: 0
    },
    optimalTimeSuccessRate: {
      type: Number,
      default: 0
    },
    nonOptimalTimeSuccessRate: {
      type: Number,
      default: 0
    }
  },
  lastCalculated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
applicationTimingSchema.index({ userId: 1, jobId: 1 }, { unique: true });
applicationTimingSchema.index({ 'scheduledSubmission.scheduledTime': 1, 'scheduledSubmission.status': 1 });
applicationTimingSchema.index({ industry: 1, companySize: 1 });
applicationTimingSchema.index({ 'submissionHistory.submittedAt': 1 });

// Methods
applicationTimingSchema.methods.updateRecommendation = function(recommendation) {
  this.currentRecommendation = recommendation;
  this.lastCalculated = new Date();
  return this.save();
};

applicationTimingSchema.methods.scheduleSubmission = function(scheduledTime, autoSubmit = false) {
  this.scheduledSubmission = {
    scheduledTime,
    status: 'scheduled',
    autoSubmit,
    reminderSent: false
  };
  return this.save();
};

applicationTimingSchema.methods.cancelScheduledSubmission = function(reason) {
  if (this.scheduledSubmission) {
    this.scheduledSubmission.status = 'cancelled';
    this.scheduledSubmission.cancelledAt = new Date();
    this.scheduledSubmission.failureReason = reason;
  }
  return this.save();
};

applicationTimingSchema.methods.recordSubmission = function(submissionData) {
  const submission = {
    submittedAt: submissionData.submittedAt || new Date(),
    dayOfWeek: submissionData.dayOfWeek || new Date().toLocaleDateString('en-US', { weekday: 'long' }),
    hourOfDay: submissionData.hourOfDay || new Date().getHours(),
    wasScheduled: submissionData.wasScheduled || false,
    followedRecommendation: submissionData.followedRecommendation || false,
    responseReceived: false,
    responseType: 'no_response'
  };

  this.submissionHistory.push(submission);
  this.metrics.totalSubmissions += 1;

  if (this.scheduledSubmission && this.scheduledSubmission.status === 'scheduled') {
    this.scheduledSubmission.status = 'submitted';
    this.scheduledSubmission.submittedAt = submission.submittedAt;
  }

  return this.save();
};

applicationTimingSchema.methods.recordResponse = function(submissionIndex, responseData) {
  if (submissionIndex >= 0 && submissionIndex < this.submissionHistory.length) {
    const submission = this.submissionHistory[submissionIndex];
    submission.responseReceived = true;
    submission.responseType = responseData.responseType || 'neutral';
    
    const submittedAt = new Date(submission.submittedAt);
    const respondedAt = new Date(responseData.respondedAt || Date.now());
    submission.responseTime = (respondedAt - submittedAt) / (1000 * 60 * 60); // hours

    this.updateMetrics();
  }
  return this.save();
};

applicationTimingSchema.methods.updateMetrics = function() {
  const submissions = this.submissionHistory;
  
  if (submissions.length === 0) {
    return;
  }

  // Calculate response rate
  const responsesReceived = submissions.filter(s => s.responseReceived).length;
  this.metrics.responseRate = (responsesReceived / submissions.length) * 100;

  // Calculate average response time
  const responseTimes = submissions
    .filter(s => s.responseReceived && s.responseTime)
    .map(s => s.responseTime);
  
  if (responseTimes.length > 0) {
    this.metrics.averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  }

  // Calculate optimal vs non-optimal success rates
  const optimalSubmissions = submissions.filter(s => s.followedRecommendation);
  const nonOptimalSubmissions = submissions.filter(s => !s.followedRecommendation);

  if (optimalSubmissions.length > 0) {
    const optimalResponses = optimalSubmissions.filter(s => s.responseReceived && s.responseType === 'positive').length;
    this.metrics.optimalTimeSuccessRate = (optimalResponses / optimalSubmissions.length) * 100;
  }

  if (nonOptimalSubmissions.length > 0) {
    const nonOptimalResponses = nonOptimalSubmissions.filter(s => s.responseReceived && s.responseType === 'positive').length;
    this.metrics.nonOptimalTimeSuccessRate = (nonOptimalResponses / nonOptimalSubmissions.length) * 100;
  }
};

// Statics
applicationTimingSchema.statics.getIndustryStats = async function(industry) {
  const timings = await this.find({ industry });
  
  const dayStats = {};
  const hourStats = {};

  timings.forEach(timing => {
    timing.submissionHistory.forEach(submission => {
      if (submission.responseReceived && submission.responseType === 'positive') {
        // Day of week stats
        if (!dayStats[submission.dayOfWeek]) {
          dayStats[submission.dayOfWeek] = { count: 0, responses: 0 };
        }
        dayStats[submission.dayOfWeek].count += 1;
        dayStats[submission.dayOfWeek].responses += 1;

        // Hour of day stats
        if (!hourStats[submission.hourOfDay]) {
          hourStats[submission.hourOfDay] = { count: 0, responses: 0 };
        }
        hourStats[submission.hourOfDay].count += 1;
        hourStats[submission.hourOfDay].responses += 1;
      }
    });
  });

  return { dayStats, hourStats };
};

applicationTimingSchema.statics.getCompanySizeStats = async function(companySize) {
  const timings = await this.find({ companySize });
  
  let totalResponseRate = 0;
  let count = 0;

  timings.forEach(timing => {
    if (timing.metrics.responseRate > 0) {
      totalResponseRate += timing.metrics.responseRate;
      count += 1;
    }
  });

  return {
    averageResponseRate: count > 0 ? totalResponseRate / count : 0,
    sampleSize: count
  };
};

applicationTimingSchema.statics.getPendingScheduled = async function() {
  const now = new Date();
  return this.find({
    'scheduledSubmission.status': 'scheduled',
    'scheduledSubmission.scheduledTime': { $lte: now }
  });
};

export const ApplicationTiming = mongoose.model('ApplicationTiming', applicationTimingSchema);
