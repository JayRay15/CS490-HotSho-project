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
    // PDF template storage for pixel-perfect generation
    // Note: MongoDB has a 16MB document size limit
    // For large PDFs, consider using GridFS or external storage
    originalPdf: { 
      type: Buffer, 
      required: false,
      select: false // Don't include in queries by default (too large)
    }, // Store original PDF file buffer
    pdfLayout: { 
      type: mongoose.Schema.Types.Mixed, 
      default: null 
    }, // Detailed layout metadata from extractPdfLayout
    sectionMapping: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }, // Mapping of text regions to resume sections
    // DOCX template storage for content replacement generation
    originalDocx: {
      type: Buffer,
      required: false,
      select: false // Exclude by default due to size
    },
    docxPlaceholders: {
      type: mongoose.Schema.Types.Mixed,
      default: null // Optional: record placeholder schema (e.g., keys used)
    },
    hasDocx: { type: Boolean, default: false }
  },
  { timestamps: true }
);

resumeTemplateSchema.index({ userId: 1, isDefault: 1 });

export const ResumeTemplate = mongoose.model("ResumeTemplate", resumeTemplateSchema);
