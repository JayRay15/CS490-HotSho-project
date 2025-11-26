import mongoose from "mongoose";
import crypto from "crypto";

const sharedReportSchema = new mongoose.Schema(
  {
    reportConfigId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ReportConfiguration",
      required: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    uniqueToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    reportName: {
      type: String,
      required: true,
    },
    // Snapshot of the report data at time of sharing
    reportSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    // Access control
    expirationDate: {
      type: Date,
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    password: {
      type: String, // Optional password protection
    },
    allowedEmails: [String], // Optional whitelist of emails
    // Access tracking
    accessLog: [
      {
        accessedAt: {
          type: Date,
          default: Date.now,
        },
        ipAddress: String,
        userAgent: String,
        email: String, // If viewer identifies themselves
      },
    ],
    viewCount: {
      type: Number,
      default: 0,
    },
    lastAccessedAt: Date,
    // Sharing metadata
    shareMessage: String,
    sharedWith: [
      {
        name: String,
        email: String,
        relationship: {
          type: String,
          enum: ["mentor", "coach", "accountability-partner", "recruiter", "friend", "other"],
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Generate unique token before saving
sharedReportSchema.pre("save", function (next) {
  if (!this.uniqueToken) {
    this.uniqueToken = crypto.randomBytes(32).toString("hex");
  }
  next();
});

// Method to check if share is still valid
sharedReportSchema.methods.isValid = function () {
  return this.isActive && new Date() < this.expirationDate;
};

// Method to log access
sharedReportSchema.methods.logAccess = async function (accessData) {
  this.accessLog.push(accessData);
  this.viewCount += 1;
  this.lastAccessedAt = new Date();
  await this.save();
};

// Indexes
sharedReportSchema.index({ userId: 1, createdAt: -1 });
sharedReportSchema.index({ uniqueToken: 1, isActive: 1 });
sharedReportSchema.index({ expirationDate: 1, isActive: 1 });

export const SharedReport = mongoose.model("SharedReport", sharedReportSchema);
