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
    // UC-062: Company information for job opportunities
    companyInfo: {
      size: {
        type: String,
        enum: ["1-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5001-10000", "10000+", "10,000+ employees", ""],
        default: "",
      },
      website: {
        type: String,
        trim: true,
      },
      description: {
        type: String,
        trim: true,
      },
      mission: {
        type: String,
        trim: true,
      },
      logo: {
        type: String,
        trim: true,
      },
      contactInfo: {
        email: String,
        phone: String,
        address: String,
      },
      glassdoorRating: {
        rating: {
          type: Number,
          min: 0,
          max: 5,
        },
        reviewCount: Number,
        url: String,
      },
      recentNews: [
        {
          title: String,
          summary: String,
          url: String,
          date: Date,
          source: String, // News source (e.g., "TechCrunch", "Reuters")
          category: {
            type: String,
            enum: ["funding", "product_launch", "hiring", "acquisition", "partnership", "leadership", "awards", "general"],
            default: "general",
          },
          relevanceScore: {
            type: Number,
            min: 0,
            max: 10,
            default: 5,
          },
          keyPoints: [String], // Extracted key points from the article
          sentiment: {
            type: String,
            enum: ["positive", "neutral", "negative"],
            default: "neutral",
          },
          tags: [String], // Keywords/tags for filtering
        },
      ],
      newsAlerts: {
        enabled: {
          type: Boolean,
          default: false,
        },
        lastChecked: Date,
        frequency: {
          type: String,
          enum: ["daily", "weekly", "never"],
          default: "never",
        },
      },
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
    // Geocoded coordinates for map display and commute calculations
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
    // Full geocoded address details
    geocodedLocation: {
      displayName: { type: String },
      city: { type: String },
      state: { type: String },
      country: { type: String },
      postalCode: { type: String },
      timezone: {
        name: { type: String },
        offset: { type: Number },
      },
      geocodedAt: { type: Date },
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
    // UC-042: Link cover letter to job application
    linkedCoverLetterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CoverLetter',
      default: null,
    },
    // Additional documents for application package
    linkedAdditionalDocuments: [{
      name: {
        type: String,
        required: true,
      },
      documentType: {
        type: String,
        enum: ['certificate', 'portfolio', 'reference', 'transcript', 'other'],
        default: 'other',
      },
      fileName: String,
      fileData: String, // Base64 data URL
      notes: String,
      addedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    // Status tracking fields
    nextAction: {
      type: String,
      trim: true,
    },
    nextActionDate: {
      type: Date,
    },
    // UC-125: Multi-Platform Application Tracker
    // Track applications across multiple job platforms
    applicationPlatforms: [{
      name: {
        type: String,
        enum: ['LinkedIn', 'Indeed', 'Glassdoor', 'Company Website', 'ZipRecruiter', 'Monster', 'CareerBuilder', 'AngelList', 'Other'],
        required: true,
      },
      status: {
        type: String,
        enum: ['Applied', 'Viewed', 'In Review', 'Interview Scheduled', 'Rejected', 'No Response'],
        default: 'Applied',
      },
      url: {
        type: String,
        trim: true,
      },
      externalId: {
        type: String,
        trim: true,
      },
      dateApplied: {
        type: Date,
        default: Date.now,
      },
      dateImported: {
        type: Date,
        default: Date.now,
      },
      notes: {
        type: String,
        trim: true,
      },
    }],
    // Primary platform used for this application
    primaryPlatform: {
      type: String,
      enum: ['LinkedIn', 'Indeed', 'Glassdoor', 'Company Website', 'ZipRecruiter', 'Monster', 'CareerBuilder', 'AngelList', 'Other', ''],
      default: '',
    },
    // UC-125: Source email ID for imported applications
    sourceEmailId: {
      type: String,
      trim: true,
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
