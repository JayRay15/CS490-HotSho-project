import mongoose from "mongoose";

const companyResearchSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    interviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interview',
      default: null,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    // Company Profile
    profile: {
      overview: String,
      history: String,
      mission: String,
      values: [String],
      culture: String,
      industry: String,
      workMode: String,
      location: String,
      size: String,
      founded: String,
      headquarters: String,
      website: String,
    },
    // Leadership Team
    leadership: [
      {
        name: String,
        title: String,
        bio: String,
        linkedIn: String,
        imageUrl: String,
      },
    ],
    // Potential Interviewers
    interviewers: [
      {
        name: String,
        title: String,
        email: String,
        notes: String,
      },
    ],
    // Competitive Landscape
    competitive: {
      industry: String,
      marketPosition: String,
      competitors: [String],
      differentiators: [String],
      challenges: [String],
      opportunities: [String],
    },
    // Recent News & Developments
    news: [
      {
        title: String,
        summary: String,
        date: Date,
        source: String,
        url: String,
        category: {
          type: String,
          enum: ['funding', 'product', 'leadership', 'expansion', 'partnership', 'other'],
        },
      },
    ],
    // Talking Points
    talkingPoints: [
      {
        topic: String,
        points: [String],
        questions: [String],
      },
    ],
    // Generated Questions
    intelligentQuestions: [
      {
        question: String,
        category: {
          type: String,
          enum: ['company', 'role', 'team', 'culture', 'growth', 'strategy'],
        },
        reasoning: String,
      },
    ],
    // Metadata
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    dataSource: {
      type: String,
      enum: ['auto', 'manual', 'hybrid'],
      default: 'auto',
    },
    completeness: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    exported: {
      type: Boolean,
      default: false,
    },
    exportedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
companyResearchSchema.index({ userId: 1, jobId: 1 });
companyResearchSchema.index({ userId: 1, companyName: 1 });
companyResearchSchema.index({ userId: 1, interviewId: 1 });

export const CompanyResearch = mongoose.model("CompanyResearch", companyResearchSchema);
