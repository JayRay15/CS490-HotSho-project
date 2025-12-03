import mongoose from 'mongoose';

const informationalInterviewSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  contactId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact',
    default: null
  },
  candidateName: {
    type: String,
    required: true
  },
  targetRole: {
    type: String,
    required: true
  },
  targetCompany: {
    type: String,
    required: true
  },
  candidateEmail: {
    type: String,
    default: ''
  },
  candidateLinkedIn: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Identified', 'Outreach Sent', 'Scheduled', 'Completed', 'Follow-up Sent'],
    default: 'Identified'
  },
  outreachContent: {
    type: String,
    default: ''
  },
  preparationNotes: {
    questions: [{
      type: String
    }],
    researchTopics: [{
      type: String
    }],
    conversationTips: [{
      type: String
    }],
    userNotes: {
      type: String,
      default: ''
    }
  },
  outcomes: {
    keyLearnings: {
      type: String,
      default: ''
    },
    industryInsights: {
      type: String,
      default: ''
    },
    referralObtained: {
      type: Boolean,
      default: false
    },
    referralDetails: {
      type: String,
      default: ''
    },
    futureOpportunities: {
      type: String,
      default: ''
    },
    connectionQuality: {
      type: String,
      enum: ['Weak', 'Moderate', 'Strong', ''],
      default: ''
    }
  },
  impactScore: {
    type: Number,
    min: 0,
    max: 10,
    default: 0
  },
  dates: {
    outreachDate: {
      type: Date,
      default: null
    },
    interviewDate: {
      type: Date,
      default: null
    },
    followUpDate: {
      type: Date,
      default: null
    }
  },
  followUpContent: {
    type: String,
    default: ''
  },
  tags: [{
    type: String
  }],
  archived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient querying
informationalInterviewSchema.index({ userId: 1, status: 1 });
informationalInterviewSchema.index({ userId: 1, 'dates.interviewDate': 1 });

// Virtual for calculating days until interview
informationalInterviewSchema.virtual('daysUntilInterview').get(function() {
  if (!this.dates.interviewDate) return null;
  const now = new Date();
  const interviewDate = new Date(this.dates.interviewDate);
  const diffTime = interviewDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Method to calculate impact score based on outcomes
informationalInterviewSchema.methods.calculateImpactScore = function() {
  let score = 0;
  
  // Referral obtained: +4 points
  if (this.outcomes.referralObtained) {
    score += 4;
  }
  
  // Connection quality: 1-3 points
  if (this.outcomes.connectionQuality === 'Strong') {
    score += 3;
  } else if (this.outcomes.connectionQuality === 'Moderate') {
    score += 2;
  } else if (this.outcomes.connectionQuality === 'Weak') {
    score += 1;
  }
  
  // Has key learnings: +2 points
  if (this.outcomes.keyLearnings && this.outcomes.keyLearnings.length > 50) {
    score += 2;
  }
  
  // Has industry insights: +1 point
  if (this.outcomes.industryInsights && this.outcomes.industryInsights.length > 30) {
    score += 1;
  }
  
  this.impactScore = Math.min(10, score);
  return this.impactScore;
};

export const InformationalInterview = mongoose.model('InformationalInterview', informationalInterviewSchema);
export default InformationalInterview;
