import mongoose from 'mongoose';

const relationshipActivitySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  contactId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact',
    required: true,
    index: true
  },
  activityType: {
    type: String,
    enum: [
      'Email Sent',
      'Email Received',
      'Phone Call',
      'Meeting',
      'LinkedIn Message',
      'Coffee Chat',
      'Introduction Made',
      'Referral Requested',
      'Referral Provided',
      'Job Lead Shared',
      'Advice Requested',
      'Advice Given',
      'Birthday Wish',
      'Congratulations Sent',
      'Thank You Sent',
      'Industry News Shared',
      'Event Attended Together',
      'Other'
    ],
    required: true
  },
  activityDate: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  direction: {
    type: String,
    enum: ['Outbound', 'Inbound', 'Mutual'],
    default: 'Outbound'
  },
  subject: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  sentiment: {
    type: String,
    enum: ['Positive', 'Neutral', 'Negative'],
    default: 'Neutral'
  },
  responseReceived: {
    type: Boolean,
    default: false
  },
  responseTime: {
    type: Number // Hours until response received
  },
  valueExchange: {
    type: String,
    enum: ['Given', 'Received', 'Mutual', 'None'],
    default: 'None'
  },
  valueType: {
    type: String,
    enum: [
      'Job Lead',
      'Introduction',
      'Advice',
      'Information',
      'Referral',
      'Recommendation',
      'Mentorship',
      'Support',
      'Other'
    ]
  },
  opportunityGenerated: {
    type: Boolean,
    default: false
  },
  opportunityType: {
    type: String,
    enum: ['Job Interview', 'Job Offer', 'Referral', 'Introduction', 'Partnership', 'Other']
  },
  linkedJobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  },
  linkedReminderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RelationshipReminder'
  },
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: {
    type: Date
  },
  followUpCompleted: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String
  }]
}, {
  timestamps: true
});

// Indexes for efficient queries
relationshipActivitySchema.index({ userId: 1, contactId: 1, activityDate: -1 });
relationshipActivitySchema.index({ userId: 1, activityType: 1 });
relationshipActivitySchema.index({ userId: 1, opportunityGenerated: 1 });
relationshipActivitySchema.index({ userId: 1, followUpRequired: 1, followUpCompleted: 1 });

// Static method to calculate relationship health score
relationshipActivitySchema.statics.calculateRelationshipHealth = async function(userId, contactId) {
  const now = new Date();
  const sixMonthsAgo = new Date(now.setMonth(now.getMonth() - 6));
  
  const activities = await this.find({
    userId,
    contactId,
    activityDate: { $gte: sixMonthsAgo }
  });
  
  if (activities.length === 0) {
    return {
      score: 0,
      status: 'Inactive',
      lastActivity: null,
      frequency: 0,
      reciprocity: 0,
      valueExchange: 0
    };
  }
  
  // Calculate metrics
  const lastActivity = activities[0].activityDate;
  const daysSinceLastContact = Math.floor((new Date() - lastActivity) / (1000 * 60 * 60 * 24));
  const frequency = activities.length / 6; // Activities per month
  
  const outbound = activities.filter(a => a.direction === 'Outbound').length;
  const inbound = activities.filter(a => a.direction === 'Inbound').length;
  const reciprocity = inbound > 0 ? Math.min((inbound / outbound), 1) : 0;
  
  const valueActivities = activities.filter(a => a.valueExchange !== 'None').length;
  const valueExchange = valueActivities / activities.length;
  
  // Calculate score (0-100)
  let score = 0;
  
  // Recency (40 points)
  if (daysSinceLastContact <= 7) score += 40;
  else if (daysSinceLastContact <= 30) score += 30;
  else if (daysSinceLastContact <= 60) score += 20;
  else if (daysSinceLastContact <= 90) score += 10;
  
  // Frequency (30 points)
  if (frequency >= 4) score += 30;
  else if (frequency >= 2) score += 20;
  else if (frequency >= 1) score += 10;
  
  // Reciprocity (20 points)
  score += reciprocity * 20;
  
  // Value Exchange (10 points)
  score += valueExchange * 10;
  
  // Determine status
  let status = 'Inactive';
  if (score >= 80) status = 'Strong';
  else if (score >= 60) status = 'Healthy';
  else if (score >= 40) status = 'Moderate';
  else if (score >= 20) status = 'Weak';
  
  return {
    score: Math.round(score),
    status,
    lastActivity,
    daysSinceLastContact,
    frequency: Math.round(frequency * 10) / 10,
    reciprocity: Math.round(reciprocity * 100),
    valueExchange: Math.round(valueExchange * 100),
    totalActivities: activities.length,
    opportunitiesGenerated: activities.filter(a => a.opportunityGenerated).length
  };
};

const RelationshipActivity = mongoose.model('RelationshipActivity', relationshipActivitySchema);

export default RelationshipActivity;
