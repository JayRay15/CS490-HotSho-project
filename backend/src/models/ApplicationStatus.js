import mongoose from 'mongoose';

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: [
      'Not Applied',
      'Applied',
      'Under Review',
      'Phone Screen',
      'Technical Interview',
      'Onsite Interview',
      'Final Interview',
      'Offer Extended',
      'Offer Accepted',
      'Offer Declined',
      'Rejected',
      'Withdrawn',
      'Ghosted'
    ],
    required: true
  },
  previousStatus: {
    type: String
  },
  changedAt: {
    type: Date,
    default: Date.now
  },
  changedBy: {
    type: String,
    enum: ['user', 'email-detection', 'automation', 'system'],
    default: 'user'
  },
  notes: {
    type: String,
    trim: true
  },
  detectionConfidence: {
    type: Number, // 0-100, for email auto-detection
    min: 0,
    max: 100
  },
  sourceEmail: {
    subject: String,
    from: String,
    snippet: String,
    receivedAt: Date
  }
}, { _id: true });

const timelineEventSchema = new mongoose.Schema({
  eventType: {
    type: String,
    enum: [
      'status_change',
      'email_received',
      'follow_up_sent',
      'interview_scheduled',
      'offer_received',
      'deadline_set',
      'note_added',
      'document_submitted'
    ],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed // Flexible field for event-specific data
  },
  isSystemGenerated: {
    type: Boolean,
    default: false
  }
}, { _id: true });

const applicationStatusSchema = new mongoose.Schema({
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
  currentStatus: {
    type: String,
    enum: [
      'Not Applied',
      'Applied',
      'Under Review',
      'Phone Screen',
      'Technical Interview',
      'Onsite Interview',
      'Final Interview',
      'Offer Extended',
      'Offer Accepted',
      'Offer Declined',
      'Rejected',
      'Withdrawn',
      'Ghosted'
    ],
    default: 'Not Applied'
  },
  appliedAt: {
    type: Date
  },
  lastStatusChange: {
    type: Date,
    default: Date.now
  },
  responseTime: {
    type: Number, // Days between application and first response
  },
  statusHistory: [statusHistorySchema],
  timeline: [timelineEventSchema],
  
  // Email monitoring
  emailMonitoring: {
    enabled: {
      type: Boolean,
      default: true
    },
    lastChecked: Date,
    emailThreadId: String, // Gmail thread ID or similar
    companyEmailDomains: [String] // e.g., ['company.com', 'recruiter.company.com']
  },
  
  // Automation settings
  automation: {
    autoFollowUp: {
      enabled: {
        type: Boolean,
        default: false
      },
      daysAfterApplication: {
        type: Number,
        default: 7
      },
      lastFollowUpSent: Date
    },
    autoStatusDetection: {
      enabled: {
        type: Boolean,
        default: true
      },
      requireConfirmation: {
        type: Boolean,
        default: true // User must confirm auto-detected status changes
      }
    }
  },
  
  // Tracking metrics
  metrics: {
    daysInCurrentStatus: {
      type: Number,
      default: 0
    },
    totalDaysInProcess: {
      type: Number,
      default: 0
    },
    followUpCount: {
      type: Number,
      default: 0
    },
    interviewCount: {
      type: Number,
      default: 0
    }
  },
  
  // Notifications
  notifications: {
    statusChangeAlert: {
      type: Boolean,
      default: true
    },
    followUpReminder: {
      type: Boolean,
      default: true
    },
    stalledApplicationAlert: {
      type: Boolean,
      default: true
    },
    lastNotificationSent: Date
  },
  
  // Additional tracking
  nextAction: {
    type: String,
    trim: true
  },
  nextActionDate: {
    type: Date
  },
  tags: [String],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
applicationStatusSchema.index({ userId: 1, currentStatus: 1 });
applicationStatusSchema.index({ userId: 1, jobId: 1 }, { unique: true });
applicationStatusSchema.index({ lastStatusChange: 1 });
applicationStatusSchema.index({ 'appliedAt': 1 });
applicationStatusSchema.index({ 'emailMonitoring.enabled': 1 });

// Virtual for days since last status change
applicationStatusSchema.virtual('daysSinceStatusChange').get(function() {
  if (!this.lastStatusChange) return 0;
  return Math.floor((Date.now() - this.lastStatusChange) / (1000 * 60 * 60 * 24));
});

// Virtual for days since application
applicationStatusSchema.virtual('daysSinceApplication').get(function() {
  if (!this.appliedAt) return 0;
  return Math.floor((Date.now() - this.appliedAt) / (1000 * 60 * 60 * 24));
});

// Method to update status with history tracking
applicationStatusSchema.methods.updateStatus = function(newStatus, options = {}) {
  const {
    changedBy = 'user',
    notes = '',
    detectionConfidence = null,
    sourceEmail = null
  } = options;

  // Add to history
  this.statusHistory.push({
    status: newStatus,
    previousStatus: this.currentStatus,
    changedAt: new Date(),
    changedBy,
    notes,
    detectionConfidence,
    sourceEmail
  });

  // Add to timeline
  this.timeline.push({
    eventType: 'status_change',
    timestamp: new Date(),
    description: `Status changed from ${this.currentStatus} to ${newStatus}`,
    metadata: {
      previousStatus: this.currentStatus,
      newStatus,
      changedBy,
      notes
    },
    isSystemGenerated: changedBy !== 'user'
  });

  // Update current status
  const previousStatus = this.currentStatus;
  this.currentStatus = newStatus;
  this.lastStatusChange = new Date();

  // Calculate response time if first response after application
  if (previousStatus === 'Applied' && newStatus !== 'Applied' && this.appliedAt && !this.responseTime) {
    this.responseTime = Math.floor((Date.now() - this.appliedAt) / (1000 * 60 * 60 * 24));
  }

  // Update metrics
  this.metrics.daysInCurrentStatus = 0;
  if (newStatus.includes('Interview')) {
    this.metrics.interviewCount += 1;
  }

  return this;
};

// Method to add timeline event
applicationStatusSchema.methods.addTimelineEvent = function(eventType, description, metadata = {}) {
  this.timeline.push({
    eventType,
    timestamp: new Date(),
    description,
    metadata,
    isSystemGenerated: false
  });
  return this;
};

// Static method to get status statistics for user
applicationStatusSchema.statics.getStatusStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: '$currentStatus',
        count: { $sum: 1 },
        avgResponseTime: { $avg: '$responseTime' },
        avgDaysInStatus: { $avg: '$metrics.daysInCurrentStatus' }
      }
    }
  ]);
  return stats;
};

// Pre-save middleware to update metrics
applicationStatusSchema.pre('save', function(next) {
  if (this.appliedAt) {
    this.metrics.totalDaysInProcess = Math.floor((Date.now() - this.appliedAt) / (1000 * 60 * 60 * 24));
  }
  if (this.lastStatusChange) {
    this.metrics.daysInCurrentStatus = Math.floor((Date.now() - this.lastStatusChange) / (1000 * 60 * 60 * 24));
  }
  next();
});

export const ApplicationStatus = mongoose.model('ApplicationStatus', applicationStatusSchema);
