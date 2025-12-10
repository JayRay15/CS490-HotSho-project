import mongoose from "mongoose";

/**
 * UC-120: A/B Test Model
 * Tracks experiments comparing different versions of resumes and cover letters
 */

const versionSchema = new mongoose.Schema({
  materialId: { type: mongoose.Schema.Types.ObjectId, required: true },
  materialType: { type: String, enum: ["resume", "coverLetter"], required: true },
  versionLabel: { type: String, required: true }, // e.g., "Version A", "Version B"
  materialName: { type: String }, // Name of the resume/cover letter
  // Element analysis fields
  analysis: {
    format: { type: String }, // e.g., "Traditional", "Modern", "Creative"
    wordCount: { type: Number },
    sectionCount: { type: Number },
    hasSummary: { type: Boolean },
    hasSkillsSection: { type: Boolean },
    bulletPointCount: { type: Number },
    keywordsCount: { type: Number },
  },
  // Performance tracking
  applicationsAssigned: { type: Number, default: 0 },
  responses: { type: Number, default: 0 },
  interviews: { type: Number, default: 0 },
  offers: { type: Number, default: 0 },
  rejections: { type: Number, default: 0 },
  noResponse: { type: Number, default: 0 },
  // Time metrics (in days)
  totalResponseTime: { type: Number, default: 0 }, // Sum of all response times
  responseCount: { type: Number, default: 0 }, // Count for calculating average
}, { _id: false });

const abTestSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    materialType: { type: String, enum: ["resume", "coverLetter"], required: true },
    status: {
      type: String,
      enum: ["active", "paused", "completed", "archived"],
      default: "active"
    },
    // Test versions (typically 2, but can support more)
    versions: [versionSchema],
    // Target for minimum applications per version
    minSampleSize: { type: Number, default: 10 },
    targetSampleSize: { type: Number, default: 20 },
    // Random assignment settings
    assignmentStrategy: {
      type: String,
      enum: ["random", "alternating", "weighted"],
      default: "random"
    },
    // Industry/role targeting for fair comparison
    targetIndustries: [String],
    targetRoles: [String],
    // Winner determination
    winningVersionIndex: { type: Number, default: null },
    winnerDeclaredAt: { type: Date },
    winnerDeclaredReason: { type: String },
    // Test dates
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    // Metadata
    notes: { type: String },
  },
  { timestamps: true }
);

// Indexes for efficient querying
abTestSchema.index({ userId: 1, status: 1 });
abTestSchema.index({ userId: 1, createdAt: -1 });
abTestSchema.index({ userId: 1, materialType: 1 });

// Virtual for calculating if test has reached minimum sample size
abTestSchema.virtual("hasMinimumSample").get(function() {
  return this.versions.every(v => v.applicationsAssigned >= this.minSampleSize);
});

// Virtual for total applications across all versions
abTestSchema.virtual("totalApplications").get(function() {
  return this.versions.reduce((sum, v) => sum + v.applicationsAssigned, 0);
});

export const ABTest = mongoose.model("ABTest", abTestSchema);
