import mongoose from "mongoose";

const coverLetterTemplateSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true }, // owner
    name: { type: String, required: true, trim: true },
    industry: { 
      type: String, 
      enum: ["general", "technology", "business", "healthcare"], 
      default: "general"
    },
    style: { 
      type: String, 
      enum: ["formal", "modern", "creative", "technical", "executive"], 
      default: "formal"
    },
    content: { type: String, required: true }, // Template content with placeholders
    description: { type: String, trim: true },
    isDefault: { type: Boolean, default: false },
    isShared: { type: Boolean, default: false },
    sharedWith: { type: [String], default: [] }, // optional list of userIds
    usageCount: { type: Number, default: 0 }, // Track how many times template is used
  },
  { timestamps: true }
);

coverLetterTemplateSchema.index({ userId: 1, isDefault: 1 });
coverLetterTemplateSchema.index({ industry: 1, style: 1 });

export const CoverLetterTemplate = mongoose.model("CoverLetterTemplate", coverLetterTemplateSchema);
