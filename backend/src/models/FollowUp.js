import mongoose from 'mongoose';

const followUpSchema = new mongoose.Schema({
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
  templateType: {
    type: String,
    enum: ['thank-you', 'status-inquiry', 'feedback-request', 'networking'],
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  interviewDetails: {
    interviewer: {
      name: String,
      email: String,
      title: String
    },
    interviewDate: Date,
    specificTopics: [String],
    companyProjects: [String],
    interviewNotes: String
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  responseReceived: {
    type: Boolean,
    default: false
  },
  responseReceivedAt: Date
}, {
  timestamps: true
});

// Index for efficient queries
followUpSchema.index({ userId: 1, jobId: 1, sentAt: -1 });

export default mongoose.model('FollowUp', followUpSchema);
