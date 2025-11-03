import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: "ResumeTemplate" },
    name: { type: String, required: true, trim: true },
    sections: { type: Object, default: {} }, // { summary, experience, skills, education, projects }
    metadata: { type: Object, default: {} }, // { versionTag? }
    sectionCustomization: { 
      type: Object, 
      default: {} 
    }, // { order: [], visible: [], formatting: {}, jobType: 'general' }
  },
  { timestamps: true }
);

resumeSchema.index({ userId: 1, createdAt: -1 });

export const Resume = mongoose.model("Resume", resumeSchema);
