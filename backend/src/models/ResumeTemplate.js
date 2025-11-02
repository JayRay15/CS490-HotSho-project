import mongoose from "mongoose";

const themeSchema = new mongoose.Schema(
  {
    colors: {
      type: Object,
      default: { primary: "#4F5348", text: "#222", muted: "#666" },
    },
    fonts: {
      type: Object,
      default: { body: "Inter, sans-serif", heading: "Inter, sans-serif" },
    },
    spacing: { type: Number, default: 8 },
  },
  { _id: false }
);

const layoutSchema = new mongoose.Schema(
  {
    sectionsOrder: { type: [String], default: ["summary", "experience", "skills", "education", "projects"] },
    sectionStyles: { type: Object, default: {} },
  },
  { _id: false }
);

const resumeTemplateSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true }, // owner
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["chronological", "functional", "hybrid"], required: true },
    layout: { type: layoutSchema, default: () => ({}) },
    theme: { type: themeSchema, default: () => ({}) },
    isDefault: { type: Boolean, default: false },
    isShared: { type: Boolean, default: false },
    sharedWith: { type: [String], default: [] }, // optional list of userIds
  },
  { timestamps: true }
);

resumeTemplateSchema.index({ userId: 1, isDefault: 1 });

export const ResumeTemplate = mongoose.model("ResumeTemplate", resumeTemplateSchema);
