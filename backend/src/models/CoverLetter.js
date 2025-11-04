import mongoose from "mongoose";

const coverLetterSchema = new mongoose.Schema(
  {
    userId: { 
      type: String, 
      required: true, 
      index: true 
    },
    name: { 
      type: String, 
      required: true, 
      trim: true,
      maxlength: 200
    },
    content: { 
      type: String, 
      required: true,
      maxlength: 10000
    },
    metadata: { 
      type: Object, 
      default: {} 
    }, // { versionTag?, clonedFrom?, clonedAt?, tailoredForJob?, jobTitle?, companyName? }
    isDefault: { 
      type: Boolean, 
      default: false 
    }, // Mark default cover letter
    isArchived: { 
      type: Boolean, 
      default: false, 
      index: true 
    }, // Archive functionality
  },
  { timestamps: true }
);

// Indexes for efficient querying
coverLetterSchema.index({ userId: 1, createdAt: -1 });
coverLetterSchema.index({ userId: 1, isArchived: 1 });
coverLetterSchema.index({ userId: 1, isDefault: 1 });

// Ensure only one default cover letter per user
coverLetterSchema.pre('save', async function(next) {
  if (this.isDefault && this.isModified('isDefault')) {
    // Remove default flag from other cover letters
    await mongoose.model('CoverLetter').updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { $set: { isDefault: false } }
    );
  }
  next();
});

export const CoverLetter = mongoose.model("CoverLetter", coverLetterSchema);
