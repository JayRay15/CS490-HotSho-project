import mongoose from "mongoose";

const coverLetterSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: "CoverLetterTemplate" },
    name: { type: String, required: true, trim: true },
    content: { type: String, required: true }, // Actual cover letter content
    style: { 
      type: String, 
      enum: ["formal", "casual", "enthusiastic", "analytical", "creative", "technical", "executive"], 
      default: "formal"
    },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job" }, // Optional: link to job application (legacy)
    linkedJobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job" }, // UC-62: Link to job application for performance tracking
    metadata: { type: Object, default: {} }, // { clonedFrom?, clonedAt?, tailoredForJob?, etc. }
    isDefault: { type: Boolean, default: false }, // Mark default cover letter
    isArchived: { type: Boolean, default: false, index: true }, // Archive functionality
    // UC-060: Edit history for version tracking during editing sessions
    editHistory: [{
      content: { type: String, required: true },
      note: { type: String },
      timestamp: { type: Date, default: Date.now }
    }]
  },
  { timestamps: true }
);

coverLetterSchema.index({ userId: 1, createdAt: -1 });
coverLetterSchema.index({ userId: 1, isArchived: 1 }); // Index for filtering archived cover letters

export const CoverLetter = mongoose.model("CoverLetter", coverLetterSchema);
