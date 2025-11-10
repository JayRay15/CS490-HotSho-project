import mongoose from "mongoose";

const coverLetterSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    sections: {
      intro: String,
      body: String,
      closing: String,
      signature: String,
    },
    metadata: {
      targetCompany: String,
      targetRole: String,
      version: String,
    },
    isDefault: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

coverLetterSchema.index({ userId: 1, createdAt: -1 });
coverLetterSchema.index({ userId: 1, isArchived: 1 });

export const CoverLetter = mongoose.model("CoverLetter", coverLetterSchema);
