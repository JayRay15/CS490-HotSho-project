import mongoose from 'mongoose';

const automationRuleSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  active: {
    type: Boolean,
    default: true
  },
  triggers: {
    onJobAdded: Boolean,
    onStatusChange: [String], // e.g., ['Applied', 'Interview']
    onScheduledDate: Boolean,
    customSchedule: {
      enabled: Boolean,
      cronExpression: String,
      timezone: String
    }
  },
  actions: {
    generatePackage: {
      enabled: Boolean,
      resumeTemplate: String,
      coverLetterTemplate: String,
      includePortfolio: Boolean
    },
    scheduleApplication: {
      enabled: Boolean,
      daysOffset: Number, // apply X days after job added
      specificTime: String // e.g., "09:00"
    },
    sendFollowUp: {
      enabled: Boolean,
      daysAfterApplication: Number,
      reminderMessage: String,
      recurring: Boolean,
      recurringInterval: Number // days between follow-ups
    },
    updateChecklist: {
      enabled: Boolean,
      items: [String]
    }
  },
  filters: {
    jobStatuses: [String],
    industries: [String],
    priorities: [String],
    salaryMin: Number
  },
  statistics: {
    timesTriggered: {
      type: Number,
      default: 0
    },
    lastTriggered: Date,
    successCount: {
      type: Number,
      default: 0
    },
    failureCount: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

const applicationTemplateSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['cover-letter-intro', 'why-company', 'why-role', 'experience-summary', 'closing', 'email-subject', 'follow-up', 'thank-you', 'custom'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  variables: [{
    name: String,
    placeholder: String,
    description: String
  }],
  usageCount: {
    type: Number,
    default: 0
  },
  tags: [String]
}, {
  timestamps: true
});

const applicationChecklistSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  items: [{
    task: {
      type: String,
      required: true
    },
    completed: {
      type: Boolean,
      default: false
    },
    autoCompleted: {
      type: Boolean,
      default: false
    },
    completedAt: Date,
    dueDate: Date,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    notes: String
  }],
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  template: String
}, {
  timestamps: true
});

// Calculate progress before saving
applicationChecklistSchema.pre('save', function(next) {
  if (this.items && this.items.length > 0) {
    const completed = this.items.filter(item => item.completed).length;
    this.progress = Math.round((completed / this.items.length) * 100);
  }
  next();
});

export const ApplicationAutomation = mongoose.model('ApplicationAutomation', automationRuleSchema);
export const ApplicationTemplate = mongoose.model('ApplicationTemplate', applicationTemplateSchema);
export const ApplicationChecklist = mongoose.model('ApplicationChecklist', applicationChecklistSchema);
