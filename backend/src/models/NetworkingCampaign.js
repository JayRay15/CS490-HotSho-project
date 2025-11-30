import mongoose from 'mongoose';

/**
 * UC-094: Networking Campaign Management
 * 
 * Schema for managing targeted networking campaigns to systematically
 * build relationships in specific areas/industries/companies.
 */
const outreachSchema = new mongoose.Schema({
  contactId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact'
  },
  contactName: {
    type: String,
    required: true
  },
  contactCompany: String,
  contactRole: String,
  method: {
    type: String,
    enum: ['LinkedIn', 'Email', 'Phone', 'In-person', 'Event', 'Other'],
    default: 'LinkedIn'
  },
  messageTemplate: {
    type: String,
    enum: ['A', 'B', 'Control'],
    default: 'Control'
  },
  status: {
    type: String,
    enum: ['Pending', 'Sent', 'Responded', 'Meeting Scheduled', 'Connected', 'No Response', 'Declined'],
    default: 'Pending'
  },
  sentAt: Date,
  respondedAt: Date,
  notes: String,
  outcome: {
    type: String,
    enum: ['Positive', 'Neutral', 'Negative', null],
    default: null
  },
  linkedJobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  }
}, { timestamps: true });

const abTestSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  templateA: {
    subject: String,
    message: {
      type: String,
      required: true
    },
    sentCount: {
      type: Number,
      default: 0
    },
    responseCount: {
      type: Number,
      default: 0
    },
    meetingCount: {
      type: Number,
      default: 0
    }
  },
  templateB: {
    subject: String,
    message: {
      type: String,
      required: true
    },
    sentCount: {
      type: Number,
      default: 0
    },
    responseCount: {
      type: Number,
      default: 0
    },
    meetingCount: {
      type: Number,
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['Active', 'Completed', 'Paused'],
    default: 'Active'
  },
  winner: {
    type: String,
    enum: ['A', 'B', 'Tie', null],
    default: null
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date
});

const networkingCampaignSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  campaignType: {
    type: String,
    enum: ['Company Targeting', 'Industry Networking', 'Role-based', 'Event Follow-up', 'Alumni Outreach', 'Custom'],
    default: 'Custom'
  },
  
  // Target settings
  targetCompanies: [{
    type: String,
    trim: true
  }],
  targetIndustries: [{
    type: String,
    trim: true
  }],
  targetRoles: [{
    type: String,
    trim: true
  }],
  
  // Goals
  goals: {
    totalOutreach: {
      type: Number,
      default: 20
    },
    responseRate: {
      type: Number,
      default: 30 // percentage
    },
    meetingsScheduled: {
      type: Number,
      default: 5
    },
    connectionsGained: {
      type: Number,
      default: 10
    },
    referralsObtained: {
      type: Number,
      default: 2
    }
  },
  
  // Timeline
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  
  // Status
  status: {
    type: String,
    enum: ['Planning', 'Active', 'Paused', 'Completed', 'Archived'],
    default: 'Planning'
  },
  
  // Metrics (auto-calculated from outreaches)
  metrics: {
    totalOutreach: {
      type: Number,
      default: 0
    },
    sent: {
      type: Number,
      default: 0
    },
    responses: {
      type: Number,
      default: 0
    },
    positiveResponses: {
      type: Number,
      default: 0
    },
    meetings: {
      type: Number,
      default: 0
    },
    connections: {
      type: Number,
      default: 0
    },
    referrals: {
      type: Number,
      default: 0
    },
    responseRate: {
      type: Number,
      default: 0
    },
    conversionRate: {
      type: Number,
      default: 0
    }
  },
  
  // Outreach tracking
  outreaches: [outreachSchema],
  
  // A/B Testing
  abTests: [abTestSchema],
  
  // Job search connection
  linkedJobs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  }],
  jobOutcomes: {
    interviewsScheduled: {
      type: Number,
      default: 0
    },
    offersReceived: {
      type: Number,
      default: 0
    }
  },
  
  // Strategy notes
  strategy: {
    approach: String,
    keyMessages: [String],
    followUpSchedule: {
      type: String,
      enum: ['3 days', '1 week', '2 weeks', 'Custom'],
      default: '1 week'
    },
    customFollowUpDays: Number
  },
  
  notes: String
}, {
  timestamps: true
});

// Index for user queries
networkingCampaignSchema.index({ userId: 1, status: 1 });
networkingCampaignSchema.index({ userId: 1, createdAt: -1 });

// Calculate metrics before saving
networkingCampaignSchema.pre('save', function(next) {
  if (this.outreaches && this.outreaches.length > 0) {
    const sent = this.outreaches.filter(o => o.status !== 'Pending').length;
    const responses = this.outreaches.filter(o => ['Responded', 'Meeting Scheduled', 'Connected'].includes(o.status)).length;
    const positiveResponses = this.outreaches.filter(o => o.outcome === 'Positive').length;
    const meetings = this.outreaches.filter(o => o.status === 'Meeting Scheduled').length;
    const connections = this.outreaches.filter(o => o.status === 'Connected').length;
    
    this.metrics.totalOutreach = this.outreaches.length;
    this.metrics.sent = sent;
    this.metrics.responses = responses;
    this.metrics.positiveResponses = positiveResponses;
    this.metrics.meetings = meetings;
    this.metrics.connections = connections;
    this.metrics.responseRate = sent > 0 ? Math.round((responses / sent) * 100) : 0;
    this.metrics.conversionRate = sent > 0 ? Math.round((connections / sent) * 100) : 0;
  }
  next();
});

// Virtual for progress percentage
networkingCampaignSchema.virtual('progress').get(function() {
  if (!this.goals.totalOutreach || this.goals.totalOutreach === 0) return 0;
  return Math.min(100, Math.round((this.metrics.totalOutreach / this.goals.totalOutreach) * 100));
});

// Virtual for days remaining
networkingCampaignSchema.virtual('daysRemaining').get(function() {
  if (!this.endDate) return null;
  const now = new Date();
  const diffTime = this.endDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
});

// Virtual for campaign health score
networkingCampaignSchema.virtual('healthScore').get(function() {
  let score = 0;
  const goalMet = (current, target) => target > 0 ? Math.min(100, (current / target) * 100) : 0;
  
  // Weight different metrics
  score += goalMet(this.metrics.responseRate, this.goals.responseRate) * 0.3;
  score += goalMet(this.metrics.meetings, this.goals.meetingsScheduled) * 0.3;
  score += goalMet(this.metrics.connections, this.goals.connectionsGained) * 0.25;
  score += goalMet(this.metrics.totalOutreach, this.goals.totalOutreach) * 0.15;
  
  return Math.round(score);
});

// Ensure virtuals are included in JSON
networkingCampaignSchema.set('toJSON', { virtuals: true });
networkingCampaignSchema.set('toObject', { virtuals: true });

export const NetworkingCampaign = mongoose.model('NetworkingCampaign', networkingCampaignSchema);
