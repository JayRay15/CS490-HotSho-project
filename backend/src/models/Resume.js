import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: "ResumeTemplate" },
    name: { type: String, required: true, trim: true },
    sections: { type: Object, default: {} }, // { summary, experience, skills, education, projects }
    metadata: { type: Object, default: {} }, // { versionTag?, clonedFrom?, clonedAt?, tailoredForJob?, appliedFeedbackIds?: [] }
    sectionCustomization: {
      type: Object,
      default: {}
    }, // { order: [], visible: [], formatting: {}, jobType: 'general' }
    isDefault: { type: Boolean, default: false }, // UC-52: Mark default resume
    isArchived: { type: Boolean, default: false, index: true }, // UC-52: Archive functionality
    // UC-054: Shareable links with privacy controls
    shares: [
      new mongoose.Schema(
        {
          token: { type: String, required: true, unique: true, index: true },
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
          createdBy: { type: String, required: true }, // owner userId
        },
        { timestamps: true, _id: false }
      ),
    ],
  },
  { timestamps: true }
);

resumeSchema.index({ userId: 1, createdAt: -1 });
resumeSchema.index({ userId: 1, isArchived: 1 }); // UC-52: Index for filtering archived resumes
resumeSchema.index({ "shares.token": 1 });

export const Resume = mongoose.model("Resume", resumeSchema);
