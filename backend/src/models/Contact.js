import mongoose from 'mongoose';

const interactionSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  type: {
    type: String,
    enum: ['Email', 'Phone', 'Meeting', 'LinkedIn', 'Coffee Chat', 'Conference', 'Other'],
    required: true
  },
  notes: {
    type: String,
    trim: true
  }
}, { _id: true });

const contactSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: false,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  company: {
    type: String,
    trim: true
  },
  jobTitle: {
    type: String,
    trim: true
  },
  industry: {
    type: String,
    trim: true
  },
  relationshipType: {
    type: String,
    enum: ['Mentor', 'Peer', 'Recruiter', 'Manager', 'Colleague', 'Alumni', 'Industry Contact', 'Other'],
    default: 'Other'
  },
  relationshipStrength: {
    type: String,
    enum: ['Strong', 'Medium', 'Weak', 'New'],
    default: 'New'
  },
  linkedInUrl: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  personalInterests: {
    type: String,
    trim: true
  },
  professionalInterests: {
    type: String,
    trim: true
  },
  mutualConnections: [{
    type: String,
    trim: true
  }],
  tags: [{
    type: String,
    trim: true
  }],
  interactions: [interactionSchema],
  lastContactDate: {
    type: Date
  },
  nextFollowUpDate: {
    type: Date
  },
  reminderEnabled: {
    type: Boolean,
    default: false
  },
  linkedJobIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  }],
  canProvideReferral: {
    type: Boolean,
    default: false
  },
  isReference: {
    type: Boolean,
    default: false
  },
  middleName: {
    type: String,
    trim: true
  },
  phoneticFirstName: {
    type: String,
    trim: true
  },
  phoneticMiddleName: {
    type: String,
    trim: true
  },
  phoneticLastName: {
    type: String,
    trim: true
  },
  prefix: {
    type: String,
    trim: true
  },
  suffix: {
    type: String,
    trim: true
  },
  nickname: {
    type: String,
    trim: true
  },
  fileAs: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    trim: true
  },
  birthday: {
    type: String,
    trim: true
  },
  photo: {
    type: String,
    trim: true
  },
  emailLabel: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
contactSchema.index({ userId: 1, lastName: 1, firstName: 1 });
contactSchema.index({ userId: 1, company: 1 });
contactSchema.index({ userId: 1, relationshipType: 1 });
contactSchema.index({ userId: 1, nextFollowUpDate: 1 });

// Virtual for full name
contactSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtuals are included in JSON output
contactSchema.set('toJSON', { virtuals: true });
contactSchema.set('toObject', { virtuals: true });

const Contact = mongoose.model('Contact', contactSchema);

export default Contact;
