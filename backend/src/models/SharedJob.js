import mongoose from "mongoose";

// Comment schema for shared job discussions
const commentSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userRole: {
    type: String,
    enum: ["owner", "admin", "mentor", "coach", "candidate", "viewer"],
    default: "candidate"
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  type: {
    type: String,
    enum: ["comment", "recommendation", "feedback", "question", "tip"],
    default: "comment"
  },
  // For threaded replies
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  reactions: [{
    userId: String,
    type: {
      type: String,
      enum: ["like", "helpful", "insightful", "celebrate"]
    },
    createdAt: { type: Date, default: Date.now }
  }],
  isEdited: { type: Boolean, default: false },
  editedAt: { type: Date }
}, { timestamps: true });

// Shared Job schema
const sharedJobSchema = new mongoose.Schema({
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
    required: true,
    index: true
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
    required: true
  },
  // Snapshot of job data at time of sharing (for reference)
  jobSnapshot: {
    title: String,
    company: String,
    location: String,
    description: String,
    salary: String,
    status: String,
    url: String
  },
  // Who shared the job
  sharedBy: {
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    role: { type: String }
  },
  // Share message/context
  message: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  // Share category
  category: {
    type: String,
    enum: ["opportunity", "discussion", "feedback_request", "success_story", "learning"],
    default: "opportunity"
  },
  // Priority/urgency
  priority: {
    type: String,
    enum: ["low", "normal", "high", "urgent"],
    default: "normal"
  },
  // Tags
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  // Comments
  comments: [commentSchema],
  // Members who can see this (empty = all team members)
  visibleTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "TeamMember"
  }],
  // Statistics
  stats: {
    viewCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    lastActivityAt: { type: Date, default: Date.now }
  },
  // Status
  status: {
    type: String,
    enum: ["active", "archived", "resolved"],
    default: "active"
  },
  // Pin to top
  isPinned: { type: Boolean, default: false },
  pinnedAt: { type: Date },
  pinnedBy: { type: String }
}, {
  timestamps: true
});

// Indexes
sharedJobSchema.index({ teamId: 1, status: 1, createdAt: -1 });
sharedJobSchema.index({ teamId: 1, isPinned: -1, createdAt: -1 });
sharedJobSchema.index({ teamId: 1, category: 1 });
sharedJobSchema.index({ "sharedBy.userId": 1 });

// Methods
sharedJobSchema.methods.addComment = function(commentData) {
  this.comments.push(commentData);
  this.stats.commentCount = this.comments.length;
  this.stats.lastActivityAt = new Date();
  return this;
};

sharedJobSchema.methods.incrementViews = function() {
  this.stats.viewCount += 1;
  return this;
};

// Virtuals
sharedJobSchema.virtual('totalReactions').get(function() {
  return this.comments.reduce((total, comment) => {
    return total + (comment.reactions?.length || 0);
  }, 0);
});

sharedJobSchema.set('toJSON', { virtuals: true });
sharedJobSchema.set('toObject', { virtuals: true });

export const SharedJob = mongoose.model('SharedJob', sharedJobSchema);
export default SharedJob;
