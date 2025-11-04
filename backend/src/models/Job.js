import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
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
    status: {
      type: String,
      required: true,
      enum: ["Interested", "Applied", "Phone Screen", "Interview", "Offer", "Rejected"],
      default: "Interested",
    },
    location: {
      type: String,
      trim: true,
    },
    salary: {
      min: Number,
      max: Number,
      currency: {
        type: String,
        default: "USD",
      },
    },
    jobType: {
      type: String,
      enum: ["Full-time", "Part-time", "Contract", "Internship", "Temporary"],
    },
    industry: {
      type: String,
      enum: ["Technology", "Healthcare", "Finance", "Education", "Manufacturing", "Retail", "Marketing", "Consulting", "Other"],
    },
    workMode: {
      type: String,
      enum: ["Remote", "Hybrid", "On-site"],
    },
    description: {
      type: String,
    },
    requirements: [String],
    applicationDate: {
      type: Date,
    },
    deadline: {
      type: Date,
    },
    url: {
      type: String,
      trim: true,
    },
    statusHistory: [
      {
        status: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        notes: String,
      },
    ],
    notes: {
      type: String,
    },
    interviewNotes: {
      type: String,
    },
    salaryNegotiationNotes: {
      type: String,
    },
    contacts: [
      {
        name: String,
        email: String,
        phone: String,
        role: String,
        notes: String,
      },
    ],
    materials: {
      resume: String,
      coverLetter: String,
      portfolio: String,
      other: [String],
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    tags: [String],
    archived: {
      type: Boolean,
      default: false,
    },
    archivedAt: {
      type: Date,
    },
    archiveReason: {
      type: String,
      enum: ["Completed", "Rejected", "Not Interested", "Position Filled", "Company Issue", "Timing", "Other"],
    },
    archiveNotes: {
      type: String,
    },
    autoArchived: {
      type: Boolean,
      default: false,
    },
    // UC-52: Link resume to job application
    linkedResumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
jobSchema.index({ userId: 1, status: 1 });
jobSchema.index({ userId: 1, archived: 1 });
jobSchema.index({ userId: 1, createdAt: -1 });

// Virtual for days in current stage
jobSchema.virtual("daysInStage").get(function () {
  if (!this.statusHistory || this.statusHistory.length === 0) {
    return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
  }
  const lastStatusChange = this.statusHistory[this.statusHistory.length - 1].timestamp;
  return Math.floor((Date.now() - lastStatusChange) / (1000 * 60 * 60 * 24));
});

// Ensure virtuals are included in JSON
jobSchema.set("toJSON", { virtuals: true });
jobSchema.set("toObject", { virtuals: true });

// Middleware to add status history when status changes
jobSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
    });
  }
  next();
});

export const Job = mongoose.model("Job", jobSchema);
