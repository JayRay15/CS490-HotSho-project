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
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job" }, // Optional: link to job application
    metadata: { type: Object, default: {} }, // { clonedFrom?, clonedAt?, tailoredForJob?, etc. }
    isDefault: { type: Boolean, default: false }, // Mark default cover letter
    isArchived: { type: Boolean, default: false, index: true }, // Archive functionality
    // UC-060: Edit history for version tracking during editing sessions
    editHistory: [{
      content: { type: String, required: true },
      note: { type: String },
      timestamp: { type: Date, default: Date.now }
    }],
    // UC-110: Shareable links with privacy controls for collaborative review
    shares: [
      new mongoose.Schema(
        {
          token: { type: String, required: true, unique: true },
          privacy: { type: String, enum: ["unlisted", "private"], default: "unlisted" },
          note: { type: String, trim: true },
          allowComments: { type: Boolean, default: true },
          canViewContact: { type: Boolean, default: false },
          allowedReviewers: [
            new mongoose.Schema(
              {
                email: { type: String, trim: true, lowercase: true },
                name: { type: String, trim: true },
                role: { type: String, trim: true, default: "Reviewer" },
              },
              { _id: false }
            ),
          ],
          status: { type: String, enum: ["active", "revoked"], default: "active" },
          expiresAt: { type: Date },
          deadline: { type: Date }, // UC-110: Deadline management for review completion
          createdBy: { type: String, required: true }, // owner userId
        },
        { timestamps: true, _id: false }
      ),
    ],
    // UC-110: Approval workflow for finalized application materials
    approvalStatus: {
      type: String,
      enum: ["draft", "pending_review", "changes_requested", "approved"],
      default: "draft"
    },
    approvedBy: { type: String }, // userId of approver
    approvedAt: { type: Date },
  },
  { timestamps: true }
);

coverLetterSchema.index({ userId: 1, createdAt: -1 });
coverLetterSchema.index({ userId: 1, isArchived: 1 }); // Index for filtering archived cover letters
coverLetterSchema.index({ "shares.token": 1 }); // UC-110: Index for share token lookup

export const CoverLetter = mongoose.model("CoverLetter", coverLetterSchema);
