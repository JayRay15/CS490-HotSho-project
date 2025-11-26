import mongoose from "mongoose";

const reportConfigurationSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    isTemplate: {
      type: Boolean,
      default: false,
      index: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    templateCategory: {
      type: String,
      enum: ["Activity", "Pipeline", "Performance", "Custom"],
      default: "Custom",
    },
    // Date range configuration
    dateRange: {
      type: {
        type: String,
        enum: ["custom", "last7days", "last30days", "last90days", "thisMonth", "lastMonth", "thisYear", "allTime"],
        default: "last30days",
      },
      startDate: Date,
      endDate: Date,
    },
    // Metrics to include in the report
    metrics: {
      totalApplications: { type: Boolean, default: true },
      applicationsByStatus: { type: Boolean, default: true },
      applicationsByIndustry: { type: Boolean, default: false },
      applicationsByCompany: { type: Boolean, default: false },
      interviewConversionRate: { type: Boolean, default: true },
      offerConversionRate: { type: Boolean, default: true },
      averageResponseTime: { type: Boolean, default: false },
      applicationTrend: { type: Boolean, default: true },
      interviewTrend: { type: Boolean, default: false },
      topCompanies: { type: Boolean, default: false },
      topIndustries: { type: Boolean, default: false },
      statusDistribution: { type: Boolean, default: true },
      ghostedApplications: { type: Boolean, default: false },
      followUpNeeded: { type: Boolean, default: false },
    },
    // Filters
    filters: {
      companies: [String],
      industries: [String],
      roles: [String],
      statuses: [String],
      locations: [String],
      excludeArchived: { type: Boolean, default: true },
      excludeGhosted: { type: Boolean, default: false },
    },
    // Visualization preferences
    visualizations: {
      showCharts: { type: Boolean, default: true },
      chartTypes: {
        statusBreakdown: { type: String, enum: ["pie", "bar", "donut"], default: "pie" },
        applicationTrend: { type: String, enum: ["line", "area", "bar"], default: "line" },
        industryDistribution: { type: String, enum: ["pie", "bar", "horizontal-bar"], default: "bar" },
      },
      colorScheme: {
        type: String,
        enum: ["default", "professional", "vibrant", "monochrome"],
        default: "default",
      },
    },
    // AI Insights configuration
    includeAIInsights: {
      type: Boolean,
      default: true,
    },
    insightsFocus: {
      type: [String],
      enum: ["trends", "recommendations", "strengths", "improvements", "patterns"],
      default: ["trends", "recommendations"],
    },
    // Report metadata
    lastGenerated: Date,
    generationCount: {
      type: Number,
      default: 0,
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
reportConfigurationSchema.index({ userId: 1, createdAt: -1 });
reportConfigurationSchema.index({ userId: 1, isTemplate: 1 });
reportConfigurationSchema.index({ userId: 1, isFavorite: 1 });
reportConfigurationSchema.index({ isTemplate: 1, isPublic: 1 });

export const ReportConfiguration = mongoose.model("ReportConfiguration", reportConfigurationSchema);
