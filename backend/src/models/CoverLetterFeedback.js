import mongoose from "mongoose";

/**
 * UC-110: Collaborative Resume and Cover Letter Review
 * CoverLetterFeedback model for storing reviewer comments and suggestions
 */
const coverLetterFeedbackSchema = new mongoose.Schema(
  {
    coverLetterId: { type: mongoose.Schema.Types.ObjectId, ref: "CoverLetter", required: true, index: true },
    shareToken: { type: String, required: true, index: true }, // Link token used to access
    authorUserId: { type: String }, // If authenticated reviewer
    authorEmail: { type: String, trim: true, lowercase: true }, // Fallback identifier for external reviewers
    authorName: { type: String, trim: true },
    comment: { type: String, required: true, maxlength: 4000 },
    // Comment positioning for inline suggestions
    selectionStart: { type: Number }, // Character position where selection starts
    selectionEnd: { type: Number }, // Character position where selection ends
    selectedText: { type: String }, // The text that was selected when commenting
    suggestionType: {
      type: String,
      enum: ["general", "grammar", "content", "tone", "structure", "formatting"],
      default: "general"
    },
    status: { type: String, enum: ["open", "resolved", "dismissed"], default: "open", index: true },
    resolutionNote: { type: String, trim: true },
    resolvedBy: { type: String }, // userId of owner who resolved
    resolvedAt: { type: Date },
    versionNumber: { type: Number }, // snapshot of version when comment made (optional)
    appliedInCoverLetterVersionId: { type: mongoose.Schema.Types.ObjectId, ref: "CoverLetter" }, // if incorporated & cloned
    // UC-110: Track feedback themes
    feedbackTheme: {
      type: String,
      enum: ["clarity", "impact", "relevance", "professionalism", "customization", "other"],
      default: "other"
    },
  },
  { timestamps: true }
);

coverLetterFeedbackSchema.index({ coverLetterId: 1, shareToken: 1, createdAt: -1 });
coverLetterFeedbackSchema.index({ shareToken: 1, status: 1 });
coverLetterFeedbackSchema.index({ authorEmail: 1 });

export const CoverLetterFeedback = mongoose.model("CoverLetterFeedback", coverLetterFeedbackSchema);
