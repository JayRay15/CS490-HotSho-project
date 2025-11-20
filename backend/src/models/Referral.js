import mongoose from 'mongoose';

const referralSchema = new mongoose.Schema({
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
  contactId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'requested', 'accepted', 'declined', 'no_response'],
    default: 'draft',
    required: true
  },
  requestContent: {
    type: String,
    trim: true,
    required: true
  },
  tone: {
    type: String,
    enum: ['formal', 'friendly', 'professional', 'casual'],
    default: 'professional'
  },
  notes: {
    type: String,
    trim: true
  },
  followUpDate: {
    type: Date
  },
  requestedDate: {
    type: Date
  },
  responseDate: {
    type: Date
  },
  outcome: {
    type: String,
    enum: ['led_to_interview', 'led_to_offer', 'no_impact', 'pending'],
    default: 'pending'
  },
  gratitudeExpressed: {
    type: Boolean,
    default: false
  },
  gratitudeDate: {
    type: Date
  },
  etiquetteScore: {
    type: Number,
    min: 0,
    max: 10,
    default: 0
  },
  timingScore: {
    type: Number,
    min: 0,
    max: 10,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
referralSchema.index({ userId: 1, status: 1 });
referralSchema.index({ userId: 1, jobId: 1 });
referralSchema.index({ userId: 1, contactId: 1 });
referralSchema.index({ userId: 1, followUpDate: 1 });

// Virtual for days since request
referralSchema.virtual('daysSinceRequest').get(function() {
  if (!this.requestedDate) return null;
  return Math.floor((Date.now() - this.requestedDate) / (1000 * 60 * 60 * 24));
});

// Ensure virtuals are included in JSON
referralSchema.set('toJSON', { virtuals: true });
referralSchema.set('toObject', { virtuals: true });

const Referral = mongoose.model('Referral', referralSchema);

export default Referral;
