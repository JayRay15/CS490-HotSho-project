import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { ReportConfiguration } from "../src/models/ReportConfiguration.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "..", ".env") });

const systemTemplates = [
  {
    userId: "system",
    name: "Weekly Activity Report",
    description: "Track your job search activity over the past week",
    isTemplate: true,
    isPublic: true,
    templateCategory: "Activity",
    dateRange: {
      type: "last7days",
    },
    metrics: {
      totalApplications: true,
      applicationsByStatus: true,
      interviewConversionRate: true,
      applicationTrend: true,
      followUpNeeded: true,
      statusDistribution: true,
    },
    filters: {
      excludeArchived: true,
      excludeGhosted: false,
    },
    visualizations: {
      showCharts: true,
      chartTypes: {
        statusBreakdown: "pie",
        applicationTrend: "line",
        industryDistribution: "bar",
      },
      colorScheme: "default",
    },
    includeAIInsights: true,
    insightsFocus: ["trends", "recommendations"],
  },
  {
    userId: "system",
    name: "Monthly Performance Report",
    description: "Comprehensive analysis of your job search performance this month",
    isTemplate: true,
    isPublic: true,
    templateCategory: "Performance",
    dateRange: {
      type: "thisMonth",
    },
    metrics: {
      totalApplications: true,
      applicationsByStatus: true,
      applicationsByIndustry: true,
      interviewConversionRate: true,
      offerConversionRate: true,
      averageResponseTime: true,
      applicationTrend: true,
      interviewTrend: true,
      topCompanies: true,
      topIndustries: true,
      statusDistribution: true,
      ghostedApplications: true,
      followUpNeeded: true,
    },
    filters: {
      excludeArchived: true,
      excludeGhosted: false,
    },
    visualizations: {
      showCharts: true,
      chartTypes: {
        statusBreakdown: "donut",
        applicationTrend: "area",
        industryDistribution: "horizontal-bar",
      },
      colorScheme: "professional",
    },
    includeAIInsights: true,
    insightsFocus: ["trends", "recommendations", "strengths", "improvements"],
  },
  {
    userId: "system",
    name: "Pipeline Health Report",
    description: "Analyze the health of your application pipeline",
    isTemplate: true,
    isPublic: true,
    templateCategory: "Pipeline",
    dateRange: {
      type: "last30days",
    },
    metrics: {
      totalApplications: true,
      applicationsByStatus: true,
      interviewConversionRate: true,
      offerConversionRate: true,
      averageResponseTime: true,
      statusDistribution: true,
      ghostedApplications: true,
      followUpNeeded: true,
    },
    filters: {
      excludeArchived: true,
      excludeGhosted: false,
    },
    visualizations: {
      showCharts: true,
      chartTypes: {
        statusBreakdown: "bar",
        applicationTrend: "line",
        industryDistribution: "bar",
      },
      colorScheme: "vibrant",
    },
    includeAIInsights: true,
    insightsFocus: ["patterns", "recommendations", "improvements"],
  },
  {
    userId: "system",
    name: "Quarterly Summary Report",
    description: "Comprehensive overview of your job search over the past 90 days",
    isTemplate: true,
    isPublic: true,
    templateCategory: "Performance",
    dateRange: {
      type: "last90days",
    },
    metrics: {
      totalApplications: true,
      applicationsByStatus: true,
      applicationsByIndustry: true,
      applicationsByCompany: true,
      interviewConversionRate: true,
      offerConversionRate: true,
      averageResponseTime: true,
      applicationTrend: true,
      interviewTrend: true,
      topCompanies: true,
      topIndustries: true,
      statusDistribution: true,
      ghostedApplications: true,
    },
    filters: {
      excludeArchived: true,
      excludeGhosted: false,
    },
    visualizations: {
      showCharts: true,
      chartTypes: {
        statusBreakdown: "pie",
        applicationTrend: "area",
        industryDistribution: "horizontal-bar",
      },
      colorScheme: "professional",
    },
    includeAIInsights: true,
    insightsFocus: ["trends", "recommendations", "strengths", "improvements", "patterns"],
  },
  {
    userId: "system",
    name: "Industry Focus Report",
    description: "Analyze applications and performance by industry",
    isTemplate: true,
    isPublic: true,
    templateCategory: "Custom",
    dateRange: {
      type: "last30days",
    },
    metrics: {
      totalApplications: true,
      applicationsByIndustry: true,
      applicationsByStatus: true,
      interviewConversionRate: true,
      topIndustries: true,
      statusDistribution: true,
    },
    filters: {
      excludeArchived: true,
      excludeGhosted: false,
    },
    visualizations: {
      showCharts: true,
      chartTypes: {
        statusBreakdown: "pie",
        applicationTrend: "bar",
        industryDistribution: "horizontal-bar",
      },
      colorScheme: "default",
    },
    includeAIInsights: true,
    insightsFocus: ["patterns", "recommendations"],
  },
  {
    userId: "system",
    name: "Company Focus Report",
    description: "Track applications and outcomes by company",
    isTemplate: true,
    isPublic: true,
    templateCategory: "Custom",
    dateRange: {
      type: "last30days",
    },
    metrics: {
      totalApplications: true,
      applicationsByCompany: true,
      applicationsByStatus: true,
      interviewConversionRate: true,
      topCompanies: true,
      statusDistribution: true,
    },
    filters: {
      excludeArchived: true,
      excludeGhosted: false,
    },
    visualizations: {
      showCharts: true,
      chartTypes: {
        statusBreakdown: "bar",
        applicationTrend: "line",
        industryDistribution: "bar",
      },
      colorScheme: "vibrant",
    },
    includeAIInsights: true,
    insightsFocus: ["patterns", "recommendations"],
  },
];

async function seedReportTemplates() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing system templates
    await ReportConfiguration.deleteMany({ userId: "system", isTemplate: true });
    console.log("🗑️  Cleared existing system templates");

    // Insert new templates
    await ReportConfiguration.insertMany(systemTemplates);
    console.log(`✅ Inserted ${systemTemplates.length} system report templates`);

    console.log("\n📊 Report Templates Seeded Successfully!");
    console.log("\nTemplates created:");
    systemTemplates.forEach((template) => {
      console.log(`  - ${template.name} (${template.templateCategory})`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding report templates:", error);
    process.exit(1);
  }
}

seedReportTemplates();
