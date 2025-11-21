import mongoose from 'mongoose';

const milestoneSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  targetDate: {
    type: Date,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedDate: {
    type: Date
  },
  metrics: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { timestamps: true });

const progressUpdateSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  value: {
    type: Number,
    required: true,
    min: 0
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  metrics: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { timestamps: true });

const goalSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  
  // SMART Goal Criteria
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  
  // Specific - What exactly do you want to accomplish?
  specific: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  
  // Measurable - How will you measure progress?
  measurable: {
    metric: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    currentValue: {
      type: Number,
      required: true,
      default: 0
    },
    targetValue: {
      type: Number,
      required: true,
      min: 0
    },
    unit: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    }
  },
  
  // Achievable - Is this goal realistic?
  achievable: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  
  // Relevant - Why is this goal important?
  relevant: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  
  // Time-bound - When will you achieve this?
  timeBound: {
    startDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    targetDate: {
      type: Date,
      required: true,
      validate: {
        validator: function(v) {
          return v > this.timeBound.startDate;
        },
        message: 'Target date must be after start date'
      }
    },
    completedDate: {
      type: Date
    }
  },
  
  // Goal categorization
  category: {
    type: String,
    required: true,
    enum: [
      'Job Search',
      'Skill Development',
      'Networking',
      'Career Advancement',
      'Salary Negotiation',
      'Work-Life Balance',
      'Professional Certification',
      'Industry Knowledge',
      'Leadership',
      'Custom'
    ]
  },
  
  type: {
    type: String,
    required: true,
    enum: ['Short-term', 'Long-term', 'Milestone'],
    default: 'Short-term'
  },
  
  priority: {
    type: String,
    required: true,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  
  status: {
    type: String,
    required: true,
    enum: ['Not Started', 'In Progress', 'On Track', 'At Risk', 'Completed', 'Abandoned'],
    default: 'Not Started'
  },
  
  // Progress tracking
  progressUpdates: [progressUpdateSchema],
  
  milestones: [milestoneSchema],
  
  // Impact tracking
  impactMetrics: {
    jobApplications: {
      type: Number,
      default: 0
    },
    interviewsSecured: {
      type: Number,
      default: 0
    },
    offersReceived: {
      type: Number,
      default: 0
    },
    skillsAcquired: {
      type: Number,
      default: 0
    },
    connectionsGained: {
      type: Number,
      default: 0
    },
    customMetrics: {
      type: Map,
      of: Number,
      default: {}
    }
  },
  
  // Accountability features
  accountability: {
    shareWithOthers: {
      type: Boolean,
      default: false
    },
    publicVisibility: {
      type: Boolean,
      default: false
    },
    reminderFrequency: {
      type: String,
      enum: ['None', 'Daily', 'Weekly', 'Bi-weekly', 'Monthly'],
      default: 'Weekly'
    },
    lastReminderSent: {
      type: Date
    }
  },
  
  // AI recommendations and insights
  recommendations: [{
    type: {
      type: String,
      enum: ['Adjustment', 'Strategy', 'Resource', 'Motivation'],
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium'
    },
    implemented: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  insights: [{
    category: {
      type: String,
      enum: ['Progress', 'Pattern', 'Risk', 'Opportunity', 'Achievement'],
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    data: {
      type: Map,
      of: mongoose.Schema.Types.Mixed
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Success patterns
  successFactors: [{
    factor: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    impact: {
      type: String,
      enum: ['Positive', 'Negative', 'Neutral'],
      required: true
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500
    }
  }],
  
  // Related entities
  relatedJobs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  }],
  
  relatedApplications: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ApplicationStatus'
  }],
  
  // Celebration tracking
  celebrated: {
    type: Boolean,
    default: false
  },
  
  celebrationDate: {
    type: Date
  },
  
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  
  notes: {
    type: String,
    trim: true,
    maxlength: 5000
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
goalSchema.index({ userId: 1, status: 1 });
goalSchema.index({ userId: 1, category: 1 });
goalSchema.index({ userId: 1, 'timeBound.targetDate': 1 });
goalSchema.index({ userId: 1, priority: 1 });

// Virtual for progress percentage
goalSchema.virtual('progressPercentage').get(function() {
  if (!this.measurable || this.measurable.targetValue === 0) {
    return 0;
  }
  const progress = (this.measurable.currentValue / this.measurable.targetValue) * 100;
  return Math.min(Math.round(progress), 100);
});

// Virtual for days remaining
goalSchema.virtual('daysRemaining').get(function() {
  if (!this.timeBound.targetDate) {
    return null;
  }
  const now = new Date();
  const target = new Date(this.timeBound.targetDate);
  const diff = target - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Virtual for duration
goalSchema.virtual('duration').get(function() {
  const start = new Date(this.timeBound.startDate);
  const end = new Date(this.timeBound.targetDate);
  const diff = end - start;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Virtual for milestone completion rate
goalSchema.virtual('milestoneCompletionRate').get(function() {
  if (!this.milestones || this.milestones.length === 0) {
    return 0;
  }
  const completed = this.milestones.filter(m => m.completed).length;
  return Math.round((completed / this.milestones.length) * 100);
});

// Virtual for on-track status
goalSchema.virtual('isOnTrack').get(function() {
  if (this.status === 'Completed') {
    return true;
  }
  
  const totalDays = this.duration;
  const daysElapsed = totalDays - this.daysRemaining;
  const expectedProgress = (daysElapsed / totalDays) * 100;
  const actualProgress = this.progressPercentage;
  
  // On track if actual progress is within 10% of expected progress
  return actualProgress >= (expectedProgress - 10);
});

// Pre-save middleware to update status based on progress
goalSchema.pre('save', function(next) {
  // Auto-update status based on progress
  if (this.progressPercentage >= 100 && this.status !== 'Completed') {
    this.status = 'Completed';
    this.timeBound.completedDate = new Date();
  } else if (this.progressPercentage > 0 && this.status === 'Not Started') {
    this.status = 'In Progress';
  }
  
  // Update status based on on-track calculation
  if (this.status === 'In Progress' && !this.isOnTrack && this.daysRemaining > 0) {
    this.status = 'At Risk';
  } else if (this.status === 'At Risk' && this.isOnTrack) {
    this.status = 'On Track';
  }
  
  next();
});

// Method to add progress update
goalSchema.methods.addProgressUpdate = function(value, notes = '', metrics = {}) {
  this.progressUpdates.push({
    date: new Date(),
    value,
    notes,
    metrics
  });
  if (typeof this.measurable.currentValue === 'number') {
    this.measurable.currentValue += value;
  } else {
    this.measurable.currentValue = value;
  }
  return this.save();
};

// Method to complete milestone
goalSchema.methods.completeMilestone = function(milestoneId) {
  const milestone = this.milestones.id(milestoneId);
  if (milestone) {
    milestone.completed = true;
    milestone.completedDate = new Date();
  }
  return this.save();
};

// Method to add recommendation
goalSchema.methods.addRecommendation = function(type, title, description, priority = 'Medium') {
  this.recommendations.push({
    type,
    title,
    description,
    priority,
    createdAt: new Date()
  });
  return this.save();
};

// Method to add insight
goalSchema.methods.addInsight = function(category, message, data = {}) {
  this.insights.push({
    category,
    message,
    data,
    createdAt: new Date()
  });
  return this.save();
};

// Static method to get user statistics
goalSchema.statics.getUserStats = async function(userId) {
  const goals = await this.find({ userId });
  
  const total = goals.length;
  const completed = goals.filter(g => g.status === 'Completed').length;
  const inProgress = goals.filter(g => g.status === 'In Progress' || g.status === 'On Track').length;
  const atRisk = goals.filter(g => g.status === 'At Risk').length;
  const abandoned = goals.filter(g => g.status === 'Abandoned').length;
  
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return {
    total,
    completed,
    inProgress,
    atRisk,
    abandoned,
    completionRate,
    byCategory: goals.reduce((acc, goal) => {
      acc[goal.category] = (acc[goal.category] || 0) + 1;
      return acc;
    }, {}),
    byType: goals.reduce((acc, goal) => {
      acc[goal.type] = (acc[goal.type] || 0) + 1;
      return acc;
    }, {})
  };
};

const Goal = mongoose.model('Goal', goalSchema);

export default Goal;
