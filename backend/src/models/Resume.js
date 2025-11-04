import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: "ResumeTemplate" },
    name: { type: String, required: true, trim: true },
    sections: { type: Object, default: {} }, // { summary, experience, skills, education, projects }
    metadata: { type: Object, default: {} }, // { versionTag?, clonedFrom?, clonedAt?, tailoredForJob?, etc. }
    sectionCustomization: { 
      type: Object, 
      default: {} 
    }, // { order: [], visible: [], formatting: {}, jobType: 'general' }
    isDefault: { type: Boolean, default: false }, // UC-52: Mark default resume
    isArchived: { type: Boolean, default: false, index: true }, // UC-52: Archive functionality
  },
  { timestamps: true }
);

resumeSchema.index({ userId: 1, createdAt: -1 });
resumeSchema.index({ userId: 1, isArchived: 1 }); // UC-52: Index for filtering archived resumes

export const Resume = mongoose.model("Resume", resumeSchema);
