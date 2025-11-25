import mongoose from "mongoose";

const preparationTaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  dueDate: {
    type: Date,
  },
  priority: {
    type: String,
    enum: ["Low", "Medium", "High"],
    default: "Medium",
  },
}, { timestamps: true });

const interviewSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    interviewType: {
      type: String,
      required: true,
      enum: ["Phone Screen", "Video Call", "In-Person", "Technical", "Final Round", "Other", 
             // Legacy support for old values
             "Phone", "Video", "Behavioral", "Panel", "Group", "Case Study"],
      default: "Video Call",
    },
    scheduledDate: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number, // Duration in minutes
      default: 60,
    },
    location: {
      type: String,
      trim: true,
    },
    meetingLink: {
      type: String,
      trim: true,
    },
    interviewer: {
      name: String,
      email: String,
      phone: String,
      title: String,
      notes: String,
    },
    status: {
      type: String,
      enum: ["Scheduled", "Confirmed", "Rescheduled", "Cancelled", "Completed", "No-Show"],
      default: "Scheduled",
    },
    outcome: {
      result: {
        type: String,
        enum: ["Pending", "Passed", "Failed", "Moved to Next Round", "Waiting for Feedback", "Offer Extended"],
      },
      notes: String,
      feedback: String,
      followUpRequired: Boolean,
      followUpDate: Date,
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
    },
    preparationTasks: [preparationTaskSchema],
    reminders: {
      enabled: {
        type: Boolean,
        default: true,
      },
      reminderTimes: [{
        type: Number, // Hours before interview
        default: [24, 2], // 24 hours and 2 hours before
      }],
      lastReminderSent: Date,
      remindersSent: [{
        sentAt: Date,
        type: String, // "confirmation", "24h", "2h", "1h", "custom"
      }],
    },
    notes: {
      type: String,
    },
    questions: [{
      question: String,
      notes: String,
    }],
    requirements: {
      dressCode: String,
      documentsNeeded: [String],
      preparation: [String],
    },
    history: [{
      action: {
        type: String,
        enum: ["Created", "Scheduled", "Confirmed", "Rescheduled", "Cancelled", "Completed", "Outcome Recorded", "Updated"],
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
      previousDate: Date,
      notes: String,
      performedBy: String,
    }],
    cancelled: {
      isCancelled: {
        type: Boolean,
        default: false,
      },
      cancelledAt: Date,
      reason: String,
      cancelledBy: {
        type: String,
        enum: ["User", "Company", "System"],
      },
    },
    conflictWarning: {
      hasConflict: {
        type: Boolean,
        default: false,
      },
      conflictDetails: String,
    },
    
    // UC-079: Calendar sync integration
    googleCalendarEventId: {
      type: String,
      index: true
    },
    outlookCalendarEventId: {
      type: String,
      index: true
    },
    calendarSyncStatus: {
      type: String,
      enum: ['synced', 'pending', 'failed', 'not_synced'],
      default: 'not_synced'
    },
    calendarSyncError: {
      type: String
    },
    lastSyncedAt: {
      type: Date
    },
    
    // UC-079: Thank-you note tracking
    thankYouNoteSent: {
      type: Boolean,
      default: false
    },
    thankYouNoteSentDate: {
      type: Date
    },
    thankYouNoteReminder: {
      sent: { type: Boolean, default: false },
      sentAt: { type: Date }
    }
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
interviewSchema.index({ userId: 1, scheduledDate: -1 });
interviewSchema.index({ userId: 1, status: 1 });
interviewSchema.index({ jobId: 1 });
interviewSchema.index({ scheduledDate: 1 });

// Virtual for time until interview
interviewSchema.virtual("timeUntilInterview").get(function () {
  const now = new Date();
  const diffMs = this.scheduledDate - now;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMs < 0) {
    return { isPast: true, hours: 0, days: 0 };
  }
  
  return {
    isPast: false,
    hours: diffHours,
    days: diffDays,
    minutes: Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)),
  };
});

// Virtual for formatted interview date
interviewSchema.virtual("formattedDate").get(function () {
  if (!this.scheduledDate) return null;
  return this.scheduledDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
});

// Ensure virtuals are included in JSON
interviewSchema.set("toJSON", { virtuals: true });
interviewSchema.set("toObject", { virtuals: true });

// Middleware to track history on status changes
interviewSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    this.history.push({
      action: this.status === "Rescheduled" ? "Rescheduled" : "Updated",
      timestamp: new Date(),
      notes: `Status changed to ${this.status}`,
    });
  }
  
  if (this.isModified("scheduledDate") && !this.isNew) {
    this.history.push({
      action: "Rescheduled",
      timestamp: new Date(),
      previousDate: this.scheduledDate,
      notes: "Interview rescheduled",
    });
  }
  
  next();
});

// Method to check for calendar conflicts
interviewSchema.methods.checkConflict = async function () {
  const Interview = mongoose.model("Interview");
  
  // Find interviews within 1 hour of this interview
  const startBuffer = new Date(this.scheduledDate.getTime() - 60 * 60 * 1000);
  const endBuffer = new Date(this.scheduledDate.getTime() + this.duration * 60 * 1000 + 60 * 60 * 1000);
  
  const conflicts = await Interview.find({
    userId: this.userId,
    _id: { $ne: this._id },
    status: { $in: ["Scheduled", "Confirmed"] },
    scheduledDate: {
      $gte: startBuffer,
      $lte: endBuffer,
    },
  });
  
  if (conflicts.length > 0) {
    this.conflictWarning.hasConflict = true;
    this.conflictWarning.conflictDetails = `You have ${conflicts.length} other interview(s) scheduled around this time`;
    return true;
  }
  
  this.conflictWarning.hasConflict = false;
  this.conflictWarning.conflictDetails = "";
  return false;
};

// Method to generate preparation tasks based on interview type
interviewSchema.methods.generatePreparationTasks = function () {
  const baseTasks = [
    {
      title: "Research the company",
      description: "Review the company website, recent news, and culture",
      priority: "High",
      dueDate: new Date(this.scheduledDate.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days before
    },
    {
      title: "Review job description",
      description: "Understand the role requirements and responsibilities",
      priority: "High",
      dueDate: new Date(this.scheduledDate.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      title: "Prepare questions to ask",
      description: "Prepare 3-5 thoughtful questions about the role and company",
      priority: "Medium",
      dueDate: new Date(this.scheduledDate.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day before
    },
    {
      title: "Test technology",
      description: "Ensure your internet, camera, and microphone work properly",
      priority: "High",
      dueDate: new Date(this.scheduledDate.getTime() - 2 * 60 * 60 * 1000), // 2 hours before
    },
  ];
  
  // Add type-specific tasks
  const typeTasks = {
    Technical: [
      {
        title: "Review technical concepts",
        description: "Brush up on relevant programming languages, algorithms, and data structures",
        priority: "High",
        dueDate: new Date(this.scheduledDate.getTime() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Practice coding problems",
        description: "Solve practice problems on platforms like LeetCode or HackerRank",
        priority: "High",
        dueDate: new Date(this.scheduledDate.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
    ],
    Behavioral: [
      {
        title: "Prepare STAR stories",
        description: "Prepare examples using the STAR method (Situation, Task, Action, Result)",
        priority: "High",
        dueDate: new Date(this.scheduledDate.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Review common behavioral questions",
        description: "Practice answers to common questions about teamwork, conflict, leadership",
        priority: "Medium",
        dueDate: new Date(this.scheduledDate.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
    ],
    "Phone Screen": [
      {
        title: "Find a quiet location",
        description: "Ensure you have a quiet, distraction-free space for the call",
        priority: "High",
        dueDate: new Date(this.scheduledDate.getTime() - 1 * 60 * 60 * 1000),
      },
    ],
    Phone: [ // Legacy support
      {
        title: "Find a quiet location",
        description: "Ensure you have a quiet, distraction-free space for the call",
        priority: "High",
        dueDate: new Date(this.scheduledDate.getTime() - 1 * 60 * 60 * 1000),
      },
    ],
    "Video Call": [
      {
        title: "Prepare your environment",
        description: "Choose a professional background and ensure good lighting",
        priority: "Medium",
        dueDate: new Date(this.scheduledDate.getTime() - 2 * 60 * 60 * 1000),
      },
    ],
    Video: [ // Legacy support
      {
        title: "Prepare your environment",
        description: "Choose a professional background and ensure good lighting",
        priority: "Medium",
        dueDate: new Date(this.scheduledDate.getTime() - 2 * 60 * 60 * 1000),
      },
    ],
    "Final Round": [
      {
        title: "Review all previous interviews",
        description: "Go over notes from previous interview rounds",
        priority: "High",
        dueDate: new Date(this.scheduledDate.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Prepare executive-level questions",
        description: "Prepare thoughtful questions about company vision and strategy",
        priority: "High",
        dueDate: new Date(this.scheduledDate.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Review offer negotiation points",
        description: "Prepare your salary expectations and other negotiation points",
        priority: "Medium",
        dueDate: new Date(this.scheduledDate.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
    ],
    "In-Person": [
      {
        title: "Plan your route",
        description: "Map out directions and plan to arrive 10-15 minutes early",
        priority: "High",
        dueDate: new Date(this.scheduledDate.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Prepare professional attire",
        description: "Select and prepare appropriate interview clothing",
        priority: "Medium",
        dueDate: new Date(this.scheduledDate.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Print documents",
        description: "Print extra copies of your resume and any required documents",
        priority: "Medium",
        dueDate: new Date(this.scheduledDate.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
    ],
    "Case Study": [
      {
        title: "Review case frameworks",
        description: "Study common case study frameworks and approaches",
        priority: "High",
        dueDate: new Date(this.scheduledDate.getTime() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Practice calculations",
        description: "Practice mental math and estimation techniques",
        priority: "Medium",
        dueDate: new Date(this.scheduledDate.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
    ],
  };
  
  const allTasks = [...baseTasks];
  
  if (typeTasks[this.interviewType]) {
    allTasks.push(...typeTasks[this.interviewType]);
  }
  
  this.preparationTasks = allTasks;
  return allTasks;
};

export const Interview = mongoose.model("Interview", interviewSchema);
