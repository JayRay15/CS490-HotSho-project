import { Job } from "../models/Job.js";
import { ApplicationStatus } from "../models/ApplicationStatus.js";
import { Interview } from "../models/Interview.js";

/**
 * Data Aggregation Service for Custom Reports
 * Queries and aggregates data across Jobs, ApplicationStatus, and Interviews collections
 */

export class ReportAggregationService {
  /**
   * Parse date range configuration
   */
  static parseDateRange(dateRangeConfig) {
    const now = new Date();
    let startDate, endDate;

    switch (dateRangeConfig.type) {
      case "last7days":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case "last30days":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case "last90days":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case "thisMonth":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = now;
        break;
      case "lastMonth":
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case "thisYear":
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = now;
        break;
      case "custom":
        startDate = dateRangeConfig.startDate ? new Date(dateRangeConfig.startDate) : null;
        endDate = dateRangeConfig.endDate ? new Date(dateRangeConfig.endDate) : now;
        break;
      case "allTime":
      default:
        startDate = null;
        endDate = now;
        break;
    }

    return { startDate, endDate };
  }

  /**
   * Build query filter based on report configuration
   */
  static buildFilter(userId, config, dateField = "createdAt") {
    const filter = { userId };

    // Date range
    const { startDate, endDate } = this.parseDateRange(config.dateRange);
    if (startDate || endDate) {
      filter[dateField] = {};
      if (startDate) filter[dateField].$gte = startDate;
      if (endDate) filter[dateField].$lte = endDate;
    }

    // Company filter
    if (config.filters.companies?.length > 0) {
      filter.company = { $in: config.filters.companies };
    }

    // Industry filter
    if (config.filters.industries?.length > 0) {
      filter.industry = { $in: config.filters.industries };
    }

    // Role filter
    if (config.filters.roles?.length > 0) {
      filter.$or = config.filters.roles.map((role) => ({
        title: { $regex: role, $options: "i" },
      }));
    }

    // Status filter
    if (config.filters.statuses?.length > 0) {
      filter.status = { $in: config.filters.statuses };
    }

    // Location filter
    if (config.filters.locations?.length > 0) {
      filter.location = { $in: config.filters.locations };
    }

    // Exclude archived
    if (config.filters.excludeArchived) {
      filter.isArchived = { $ne: true };
    }

    // Exclude ghosted
    if (config.filters.excludeGhosted) {
      filter.isGhosted = { $ne: true };
    }

    return filter;
  }

  /**
   * Aggregate all report data
   */
  static async aggregateReportData(userId, config) {
    const data = {};

    // Build base filter
    const jobFilter = this.buildFilter(userId, config);

    // Fetch all jobs matching filter
    const jobs = await Job.find(jobFilter).sort({ createdAt: -1 }).lean();
    data.jobs = jobs;
    data.totalJobs = jobs.length;

    // Calculate metrics based on configuration
    if (config.metrics.totalApplications) {
      data.totalApplications = jobs.filter((j) => j.status !== "Interested").length;
    }

    if (config.metrics.applicationsByStatus) {
      data.applicationsByStatus = await this.aggregateByStatus(jobs);
    }

    if (config.metrics.applicationsByIndustry) {
      data.applicationsByIndustry = await this.aggregateByIndustry(jobs);
    }

    if (config.metrics.applicationsByCompany) {
      data.applicationsByCompany = await this.aggregateByCompany(jobs);
    }

    if (config.metrics.interviewConversionRate) {
      data.interviewConversionRate = await this.calculateInterviewConversionRate(jobs);
    }

    if (config.metrics.offerConversionRate) {
      data.offerConversionRate = await this.calculateOfferConversionRate(jobs);
    }

    if (config.metrics.averageResponseTime) {
      data.averageResponseTime = await this.calculateAverageResponseTime(userId, config);
    }

    if (config.metrics.applicationTrend) {
      data.applicationTrend = await this.calculateApplicationTrend(jobs, config);
    }

    if (config.metrics.interviewTrend) {
      data.interviewTrend = await this.calculateInterviewTrend(userId, config);
    }

    if (config.metrics.topCompanies) {
      data.topCompanies = await this.getTopCompanies(jobs, 10);
    }

    if (config.metrics.topIndustries) {
      data.topIndustries = await this.getTopIndustries(jobs, 10);
    }

    if (config.metrics.statusDistribution) {
      data.statusDistribution = await this.getStatusDistribution(jobs);
    }

    if (config.metrics.ghostedApplications) {
      data.ghostedApplications = jobs.filter((j) => j.isGhosted).length;
    }

    if (config.metrics.followUpNeeded) {
      data.followUpNeeded = jobs.filter((j) => j.needsFollowUp).length;
    }

    // Add metadata
    data.generatedAt = new Date();
    data.dateRange = this.parseDateRange(config.dateRange);
    data.reportName = config.name;

    return data;
  }

  /**
   * Aggregate jobs by status
   */
  static async aggregateByStatus(jobs) {
    const statusCounts = {};
    jobs.forEach((job) => {
      const status = job.status || "Unknown";
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: ((count / jobs.length) * 100).toFixed(1),
    }));
  }

  /**
   * Aggregate jobs by industry
   */
  static async aggregateByIndustry(jobs) {
    const industryCounts = {};
    jobs.forEach((job) => {
      const industry = job.industry || "Unknown";
      industryCounts[industry] = (industryCounts[industry] || 0) + 1;
    });

    return Object.entries(industryCounts)
      .map(([industry, count]) => ({
        industry,
        count,
        percentage: ((count / jobs.length) * 100).toFixed(1),
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Aggregate jobs by company
   */
  static async aggregateByCompany(jobs) {
    const companyCounts = {};
    jobs.forEach((job) => {
      const company = job.company || "Unknown";
      companyCounts[company] = (companyCounts[company] || 0) + 1;
    });

    return Object.entries(companyCounts)
      .map(([company, count]) => ({
        company,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Calculate interview conversion rate
   */
  static async calculateInterviewConversionRate(jobs) {
    const applied = jobs.filter((j) => j.status === "Applied" || j.status === "Interview" || j.status === "Offer").length;
    const interviews = jobs.filter((j) => j.status === "Interview" || j.status === "Offer").length;

    return {
      applied,
      interviews,
      rate: applied > 0 ? ((interviews / applied) * 100).toFixed(1) : 0,
    };
  }

  /**
   * Calculate offer conversion rate
   */
  static async calculateOfferConversionRate(jobs) {
    const applied = jobs.filter((j) => j.status === "Applied" || j.status === "Interview" || j.status === "Offer").length;
    const offers = jobs.filter((j) => j.status === "Offer").length;

    return {
      applied,
      offers,
      rate: applied > 0 ? ((offers / applied) * 100).toFixed(1) : 0,
    };
  }

  /**
   * Calculate average response time from application statuses
   */
  static async calculateAverageResponseTime(userId, config) {
    const filter = this.buildFilter(userId, config, "statusDate");
    filter.status = { $in: ["Phone Screen", "Technical Interview", "Final Interview", "Offer"] };

    const statuses = await ApplicationStatus.find(filter).lean();

    if (statuses.length === 0) return { averageDays: 0, count: 0 };

    const responseTimes = [];
    for (const status of statuses) {
      if (status.statusDate && status.createdAt) {
        const days = Math.floor((new Date(status.statusDate) - new Date(status.createdAt)) / (1000 * 60 * 60 * 24));
        if (days >= 0) responseTimes.push(days);
      }
    }

    const averageDays = responseTimes.length > 0 ? (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(1) : 0;

    return {
      averageDays,
      count: responseTimes.length,
    };
  }

  /**
   * Calculate application trend over time
   */
  static async calculateApplicationTrend(jobs, config) {
    const { startDate, endDate } = this.parseDateRange(config.dateRange);
    const jobsInRange = jobs.filter((j) => {
      const jobDate = new Date(j.createdAt);
      return (!startDate || jobDate >= startDate) && jobDate <= endDate;
    });

    // Group by week or month depending on date range
    const daysDiff = startDate ? Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) : 365;
    const groupBy = daysDiff > 90 ? "month" : "week";

    const trendData = {};
    jobsInRange.forEach((job) => {
      const date = new Date(job.createdAt);
      let key;
      if (groupBy === "month") {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      } else {
        const weekNumber = Math.floor((date - (startDate || new Date(date.getFullYear(), 0, 1))) / (7 * 24 * 60 * 60 * 1000));
        key = `Week ${weekNumber + 1}`;
      }
      trendData[key] = (trendData[key] || 0) + 1;
    });

    return Object.entries(trendData).map(([period, count]) => ({
      period,
      count,
    }));
  }

  /**
   * Calculate interview trend over time
   */
  static async calculateInterviewTrend(userId, config) {
    const filter = this.buildFilter(userId, config, "interviewDate");
    delete filter.status; // Remove status filter for interviews

    const interviews = await Interview.find(filter).lean();

    const { startDate, endDate } = this.parseDateRange(config.dateRange);
    const daysDiff = startDate ? Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) : 365;
    const groupBy = daysDiff > 90 ? "month" : "week";

    const trendData = {};
    interviews.forEach((interview) => {
      const date = new Date(interview.interviewDate);
      let key;
      if (groupBy === "month") {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      } else {
        const weekNumber = Math.floor((date - (startDate || new Date(date.getFullYear(), 0, 1))) / (7 * 24 * 60 * 60 * 1000));
        key = `Week ${weekNumber + 1}`;
      }
      trendData[key] = (trendData[key] || 0) + 1;
    });

    return Object.entries(trendData).map(([period, count]) => ({
      period,
      count,
    }));
  }

  /**
   * Get top companies by application count
   */
  static async getTopCompanies(jobs, limit = 10) {
    const companyCounts = {};
    jobs.forEach((job) => {
      const company = job.company || "Unknown";
      companyCounts[company] = (companyCounts[company] || 0) + 1;
    });

    return Object.entries(companyCounts)
      .map(([company, count]) => ({ company, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Get top industries by application count
   */
  static async getTopIndustries(jobs, limit = 10) {
    const industryCounts = {};
    jobs.forEach((job) => {
      const industry = job.industry || "Unknown";
      industryCounts[industry] = (industryCounts[industry] || 0) + 1;
    });

    return Object.entries(industryCounts)
      .map(([industry, count]) => ({ industry, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Get status distribution
   */
  static async getStatusDistribution(jobs) {
    const statusGroups = {
      Interested: 0,
      Applied: 0,
      Interview: 0,
      Offer: 0,
      Rejected: 0,
      Ghosted: 0,
      Accepted: 0,
    };

    jobs.forEach((job) => {
      const status = job.status || "Interested";
      if (statusGroups.hasOwnProperty(status)) {
        statusGroups[status]++;
      }
    });

    return Object.entries(statusGroups).map(([status, count]) => ({
      status,
      count,
      percentage: jobs.length > 0 ? ((count / jobs.length) * 100).toFixed(1) : 0,
    }));
  }
}
