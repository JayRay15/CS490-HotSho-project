import mongoose from "mongoose";

const resumeFeedbackSchema = new mongoose.Schema(
  {
    resumeId: { type: mongoose.Schema.Types.ObjectId, ref: "Resume", required: true, index: true },
    shareToken: { type: String, required: true, index: true }, // Link token used to access
    authorUserId: { type: String }, // If authenticated reviewer
    authorEmail: { type: String, trim: true, lowercase: true }, // Fallback identifier
    authorName: { type: String, trim: true },
    comment: { type: String, required: true, maxlength: 4000 },
    status: { type: String, enum: ["open", "resolved"], default: "open", index: true },
    resolutionNote: { type: String, trim: true },
    resolvedBy: { type: String }, // userId of owner who resolved
    resolvedAt: { type: Date },
    versionNumber: { type: Number }, // snapshot of version when comment made (optional)
    appliedInResumeVersionId: { type: mongoose.Schema.Types.ObjectId, ref: "Resume" }, // if incorporated & cloned
  },
  { timestamps: true }
);

resumeFeedbackSchema.index({ resumeId: 1, shareToken: 1, createdAt: -1 });
resumeFeedbackSchema.index({ shareToken: 1, status: 1 });

export const ResumeFeedback = mongoose.model("ResumeFeedback", resumeFeedbackSchema);
