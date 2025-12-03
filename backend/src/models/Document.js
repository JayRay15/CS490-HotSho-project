import mongoose from "mongoose";

// Version schema for tracking document history
const versionSchema = new mongoose.Schema({
  versionNumber: { type: Number, required: true },
  fileName: { type: String, required: true },
  fileSize: { type: Number },
  fileUrl: { type: String },
  fileData: { type: String }, // Base64 encoded for small files
  mimeType: { type: String },
  notes: { type: String, maxlength: 500 },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: String } // Clerk user ID
});

// Main document schema
const documentSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  category: {
    type: String,
    required: true,
    enum: [
      'resume',
      'cover_letter',
      'certificate',
      'transcript',
      'portfolio',
      'reference_letter',
      'writing_sample',
      'presentation',
      'other'
    ],
    default: 'other'
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  // Current/active version
  currentVersion: {
    type: Number,
    default: 1
  },
  // Version history
  versions: [versionSchema],
  // Linked entities
  linkedJobs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  }],
  linkedApplications: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application'
  }],
  // Source reference (if imported from resume/cover letter system)
  sourceType: {
    type: String,
    enum: ['upload', 'resume_system', 'cover_letter_system', 'imported'],
    default: 'upload'
  },
  sourceId: {
    type: mongoose.Schema.Types.ObjectId
  },
  // Metadata
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active'
  },
  lastAccessedAt: { type: Date },
  // File info for current version (denormalized for quick access)
  currentFileName: { type: String },
  currentFileSize: { type: Number },
  currentMimeType: { type: String },
  // Favorite flag
  isFavorite: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Indexes for performance
documentSchema.index({ userId: 1, category: 1 });
documentSchema.index({ userId: 1, status: 1 });
documentSchema.index({ userId: 1, tags: 1 });
documentSchema.index({ userId: 1, createdAt: -1 });
documentSchema.index({ userId: 1, isFavorite: 1 });

// Virtual for version count
documentSchema.virtual('versionCount').get(function() {
  return this.versions?.length || 0;
});

// Method to add a new version
documentSchema.methods.addVersion = function(versionData) {
  const newVersionNumber = this.currentVersion + 1;
  
  this.versions.push({
    versionNumber: newVersionNumber,
    fileName: versionData.fileName,
    fileSize: versionData.fileSize,
    fileUrl: versionData.fileUrl,
    fileData: versionData.fileData,
    mimeType: versionData.mimeType,
    notes: versionData.notes,
    createdBy: versionData.createdBy
  });
  
  this.currentVersion = newVersionNumber;
  this.currentFileName = versionData.fileName;
  this.currentFileSize = versionData.fileSize;
  this.currentMimeType = versionData.mimeType;
  
  return this;
};

// Method to get specific version
documentSchema.methods.getVersion = function(versionNumber) {
  return this.versions.find(v => v.versionNumber === versionNumber);
};

// Method to get current version data
documentSchema.methods.getCurrentVersion = function() {
  return this.versions.find(v => v.versionNumber === this.currentVersion);
};

// Static method to get documents by category
documentSchema.statics.findByCategory = function(userId, category) {
  return this.find({ userId, category, status: 'active' }).sort({ updatedAt: -1 });
};

// Static method to search documents
documentSchema.statics.search = function(userId, query) {
  const searchRegex = new RegExp(query, 'i');
  return this.find({
    userId,
    status: 'active',
    $or: [
      { name: searchRegex },
      { description: searchRegex },
      { tags: searchRegex }
    ]
  }).sort({ updatedAt: -1 });
};

// Pre-save hook to update lastAccessedAt
documentSchema.pre('save', function(next) {
  if (this.isNew) {
    this.lastAccessedAt = new Date();
  }
  next();
});

// Ensure virtuals are included in JSON
documentSchema.set('toJSON', { virtuals: true });
documentSchema.set('toObject', { virtuals: true });

export const Document = mongoose.model('Document', documentSchema);
export default Document;
