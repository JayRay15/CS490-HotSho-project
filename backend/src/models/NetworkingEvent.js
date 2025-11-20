import mongoose from 'mongoose';

const connectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  contactId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact'
  },
  notes: String,
  followUpCompleted: {
    type: Boolean,
    default: false
  },
  followUpDate: Date
}, { _id: true });

const networkingEventSchema = new mongoose.Schema({
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
  eventDate: {
    type: Date,
    required: true
  },
  endDate: Date,
  location: {
    type: String,
    trim: true
  },
  eventType: {
    type: String,
    enum: ['Conference', 'Meetup', 'Career Fair', 'Workshop', 'Webinar', 'Social Event', 'Industry Mixer', 'Other'],
    default: 'Other'
  },
  isVirtual: {
    type: Boolean,
    default: false
  },
  virtualLink: String,
  industry: {
    type: String,
    trim: true
  },
  description: String,
  attendanceStatus: {
    type: String,
    enum: ['Planning to Attend', 'Registered', 'Attended', 'Missed', 'Cancelled'],
    default: 'Planning to Attend'
  },
  // Pre-event preparation
  preparationNotes: String,
  preparationCompleted: {
    type: Boolean,
    default: false
  },
  // Networking goals
  goals: [{
    description: String,
    achieved: {
      type: Boolean,
      default: false
    }
  }],
  targetConnectionCount: {
    type: Number,
    min: 0
  },
  // Post-event tracking
  connectionsGained: {
    type: Number,
    default: 0,
    min: 0
  },
  connections: [connectionSchema],
  keyTakeaways: String,
  postEventNotes: String,
  followUpActions: [{
    action: String,
    completed: {
      type: Boolean,
      default: false
    },
    dueDate: Date
  }],
  // ROI and outcome tracking
  jobLeadsGenerated: {
    type: Number,
    default: 0,
    min: 0
  },
  linkedJobApplications: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  }],
  roiRating: {
    type: Number,
    min: 1,
    max: 5
  },
  // Additional fields
  organizer: String,
  website: String,
  cost: Number,
  tags: [String]
}, {
  timestamps: true
});

// Index for efficient queries
networkingEventSchema.index({ userId: 1, eventDate: -1 });
networkingEventSchema.index({ userId: 1, attendanceStatus: 1 });
networkingEventSchema.index({ userId: 1, industry: 1 });

// Virtual for checking if event is upcoming
networkingEventSchema.virtual('isUpcoming').get(function() {
  return this.eventDate > new Date() && this.attendanceStatus !== 'Cancelled';
});

// Virtual for checking if event is past
networkingEventSchema.virtual('isPast').get(function() {
  return this.eventDate <= new Date();
});

// Calculate goal completion percentage
networkingEventSchema.virtual('goalCompletionRate').get(function() {
  if (!this.goals || this.goals.length === 0) return 0;
  const achieved = this.goals.filter(g => g.achieved).length;
  return Math.round((achieved / this.goals.length) * 100);
});

// Ensure virtuals are included in JSON
networkingEventSchema.set('toJSON', { virtuals: true });
networkingEventSchema.set('toObject', { virtuals: true });

const NetworkingEvent = mongoose.model('NetworkingEvent', networkingEventSchema);

export default NetworkingEvent;
