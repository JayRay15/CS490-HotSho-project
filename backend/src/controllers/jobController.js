import { Job } from "../models/Job.js";
import { successResponse, errorResponse, sendResponse, ERROR_CODES, validationErrorResponse } from "../utils/responseFormat.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { sendDeadlineRemindersNow } from "../utils/deadlineReminders.js";

// GET /api/jobs - Get all jobs for the current user
export const getJobs = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  // Support filtering by status and archived state
  const { status, archived, search } = req.query;
  const filter = { userId };

  if (status) {
    filter.status = status;
  }

  if (archived !== undefined) {
    filter.archived = archived === "true";
  }

  // Search across title, company, and location
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { company: { $regex: search, $options: "i" } },
      { location: { $regex: search, $options: "i" } },
    ];
  }

  const jobs = await Job.find(filter).sort({ createdAt: -1 });

  const { response, statusCode } = successResponse("Jobs retrieved successfully", {
    jobs,
    count: jobs.length,
  });
  return sendResponse(res, response, statusCode);
});

// POST /api/jobs - Create a new job
export const addJob = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const { title, company, status, location, salary, jobType, industry, workMode, description, requirements, applicationDate, deadline, url, notes, contacts, materials, priority, tags, interviewNotes, salaryNegotiationNotes, companyInfo } = req.body;

  console.log("ADD JOB - Received data:", req.body);
  console.log("ADD JOB - Industry field:", industry);

  // Validate required fields
  const errors = [];

  if (!title?.trim()) {
    errors.push({ field: "title", message: "Job title is required", value: title });
  }

  if (!company?.trim()) {
    errors.push({ field: "company", message: "Company name is required", value: company });
  }

  if (errors.length > 0) {
    const { response, statusCode } = validationErrorResponse(
      "Please fix the following errors before submitting",
      errors
    );
    return sendResponse(res, response, statusCode);
  }

  // Create job entry
  const jobData = {
    userId,
    title: title.trim(),
    company: company.trim(),
    status: status || "Interested",
    location: location?.trim(),
    salary,
    jobType,
    industry,
    workMode,
    description,
    requirements,
    applicationDate,
    deadline,
    url,
    notes,
    interviewNotes,
    salaryNegotiationNotes,
    contacts,
    materials,
    priority: priority || "Medium",
    tags,
    companyInfo, // UC-062: Company information
    statusHistory: [
      {
        status: status || "Interested",
        timestamp: new Date(),
        notes: "Job created",
      },
    ],
  };

  const job = await Job.create(jobData);

  console.log("ADD JOB - Created job with industry:", job.industry);

  const { response, statusCode } = successResponse("Job added successfully", { job });
  return sendResponse(res, response, statusCode);
});

// PUT /api/jobs/:jobId - Update a job
export const updateJob = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { jobId } = req.params;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  if (!jobId) {
    const { response, statusCode } = errorResponse(
      "Job ID is required",
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
    return sendResponse(res, response, statusCode);
  }

  // Find job and verify ownership
  const job = await Job.findOne({ _id: jobId, userId });

  if (!job) {
    const { response, statusCode } = errorResponse(
      "Job not found or you don't have permission to update it",
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  // Update allowed fields
  const allowedUpdates = [
    "title",
    "company",
    "location",
    "salary",
    "jobType",
    "industry",
    "workMode",
    "description",
    "requirements",
    "applicationDate",
    "deadline",
    "url",
    "notes",
    "interviewNotes",
    "salaryNegotiationNotes",
    "contacts",
    "materials",
    "priority",
    "tags",
    "archived",
    "companyInfo", // UC-062: Company information
    "nextAction",
    "nextActionDate",
  ];

  console.log("UPDATE JOB - Received data:", req.body);
  console.log("UPDATE JOB - Industry field:", req.body.industry);

  allowedUpdates.forEach((field) => {
    if (req.body[field] !== undefined) {
      job[field] = req.body[field];
    }
  });

  await job.save();

  console.log("UPDATE JOB - Saved job industry:", job.industry);

  const { response, statusCode } = successResponse("Job updated successfully", { job });
  return sendResponse(res, response, statusCode);
});

// PUT /api/jobs/:jobId/status - Update job status (separate endpoint for status changes)
export const updateJobStatus = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { jobId } = req.params;
  const { status, notes, nextAction, nextActionDate } = req.body;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  if (!status) {
    const { response, statusCode } = errorResponse(
      "Status is required",
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
    return sendResponse(res, response, statusCode);
  }

  const validStatuses = ["Interested", "Applied", "Phone Screen", "Interview", "Offer", "Rejected"];
  if (!validStatuses.includes(status)) {
    const { response, statusCode } = errorResponse(
      `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
    return sendResponse(res, response, statusCode);
  }

  // Find job and verify ownership
  const job = await Job.findOne({ _id: jobId, userId });

  if (!job) {
    const { response, statusCode } = errorResponse(
      "Job not found or you don't have permission to update it",
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  // Update status (this will trigger the pre-save middleware to add to statusHistory)
  job.status = status;

  // Add notes to the latest status history entry if provided
  if (notes) {
    job.statusHistory[job.statusHistory.length - 1].notes = notes;
  }

  // Update next action fields
  if (nextAction !== undefined) {
    job.nextAction = nextAction || null;
  }
  if (nextActionDate !== undefined) {
    job.nextActionDate = nextActionDate || null;
  }

  await job.save();

  const { response, statusCode } = successResponse("Job status updated successfully", { job });
  return sendResponse(res, response, statusCode);
});

// POST /api/jobs/bulk-update-deadline - Bulk deadline updates (set specific date or shift days)
export const bulkUpdateDeadline = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { jobIds, setDate, shiftDays } = req.body;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  if (!Array.isArray(jobIds) || jobIds.length === 0) {
    const { response, statusCode } = validationErrorResponse("No job IDs provided", [
      { field: "jobIds", message: "Provide an array of job IDs to update" },
    ]);
    return sendResponse(res, response, statusCode);
  }

  if (!setDate && (shiftDays === undefined || shiftDays === null)) {
    const { response, statusCode } = validationErrorResponse("No deadline update provided", [
      { field: "setDate|shiftDays", message: "Provide setDate (ISO) or shiftDays (integer)" },
    ]);
    return sendResponse(res, response, statusCode);
  }

  const updates = [];
  for (const id of jobIds) {
    const job = await Job.findOne({ _id: id, userId });
    if (!job) continue;
    if (setDate) {
      job.deadline = new Date(setDate);
    } else if (typeof shiftDays === 'number') {
      const base = job.deadline ? new Date(job.deadline) : new Date();
      base.setDate(base.getDate() + shiftDays);
      job.deadline = base;
    }
    await job.save();
    updates.push(job._id);
  }

  const { response, statusCode } = successResponse("Deadlines updated", { updated: updates.length });
  return sendResponse(res, response, statusCode);
});

// POST /api/jobs/bulk-update-status - Bulk update status for multiple jobs
export const bulkUpdateStatus = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { jobIds, status, notes } = req.body;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  if (!jobIds || !Array.isArray(jobIds) || jobIds.length === 0) {
    const { response, statusCode } = errorResponse(
      "Job IDs array is required",
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
    return sendResponse(res, response, statusCode);
  }

  if (!status) {
    const { response, statusCode } = errorResponse(
      "Status is required",
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
    return sendResponse(res, response, statusCode);
  }

  const validStatuses = ["Interested", "Applied", "Phone Screen", "Interview", "Offer", "Rejected"];
  if (!validStatuses.includes(status)) {
    const { response, statusCode } = errorResponse(
      `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
    return sendResponse(res, response, statusCode);
  }

  // Find all jobs and verify ownership
  const jobs = await Job.find({ _id: { $in: jobIds }, userId });

  if (jobs.length === 0) {
    const { response, statusCode } = errorResponse(
      "No jobs found or you don't have permission to update them",
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  // Update each job
  const updatedJobs = [];
  for (const job of jobs) {
    job.status = status;
    if (notes) {
      job.statusHistory[job.statusHistory.length - 1].notes = notes;
    }
    await job.save();
    updatedJobs.push(job);
  }

  const { response, statusCode } = successResponse(
    `${updatedJobs.length} job(s) updated successfully`,
    { jobs: updatedJobs, count: updatedJobs.length }
  );
  return sendResponse(res, response, statusCode);
});

// POST /api/jobs/send-deadline-reminders - Manually trigger deadline reminders (for testing)
export const sendDeadlineReminders = asyncHandler(async (req, res) => {
  const result = await sendDeadlineRemindersNow();
  const { response, statusCode } = successResponse("Deadline reminders processed", result);
  return sendResponse(res, response, statusCode);
});

// DELETE /api/jobs/:jobId - Delete a job
export const deleteJob = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { jobId } = req.params;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  if (!jobId) {
    const { response, statusCode } = errorResponse(
      "Job ID is required",
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
    return sendResponse(res, response, statusCode);
  }

  // Find and delete job
  const job = await Job.findOneAndDelete({ _id: jobId, userId });

  if (!job) {
    const { response, statusCode } = errorResponse(
      "Job not found or you don't have permission to delete it",
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  const { response, statusCode } = successResponse("Job deleted successfully");
  return sendResponse(res, response, statusCode);
});

// GET /api/jobs/stats - Get job statistics
export const getJobStats = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  // Get counts by status
  const statuses = ["Interested", "Applied", "Phone Screen", "Interview", "Offer", "Rejected"];
  const stats = {};

  for (const status of statuses) {
    stats[status] = await Job.countDocuments({ userId, status, archived: false });
  }

  const totalActive = await Job.countDocuments({ userId, archived: false });
  const totalArchived = await Job.countDocuments({ userId, archived: true });

  const { response, statusCode } = successResponse("Job statistics retrieved successfully", {
    byStatus: stats,
    totalActive,
    totalArchived,
  });
  return sendResponse(res, response, statusCode);
});

// GET /api/jobs/analytics - Get detailed job analytics
export const getJobAnalytics = asyncHandler(async (req, res) => {
  try {
    const userId = req.auth?.userId || req.auth?.payload?.sub;

    if (!userId) {
      const { response, statusCode } = errorResponse(
        "Unauthorized: missing authentication credentials",
        401,
        ERROR_CODES.UNAUTHORIZED
      );
      return sendResponse(res, response, statusCode);
    }

    // Fetch all jobs (both active and archived) for comprehensive analytics
    const allJobs = await Job.find({ userId });
    const activeJobs = allJobs.filter(job => !job.archived);

    // 1. Total jobs tracked by status
    const statuses = ["Interested", "Applied", "Phone Screen", "Interview", "Offer", "Rejected"];
    const statusCounts = {};
    statuses.forEach(status => {
      statusCounts[status] = activeJobs.filter(job => job.status === status).length;
    });

    // 2. Application response rate percentage
    const appliedJobs = activeJobs.filter(job => job.status === "Applied" ||
      ["Phone Screen", "Interview", "Offer", "Rejected"].includes(job.status));
    const respondedJobs = activeJobs.filter(job =>
      ["Phone Screen", "Interview", "Offer", "Rejected"].includes(job.status));
    const responseRate = appliedJobs.length > 0
      ? ((respondedJobs.length / appliedJobs.length) * 100).toFixed(1)
      : 0;

    // 3. Average time in each pipeline stage
    const avgTimeByStage = {};
    for (const status of statuses) {
      const jobsInStage = allJobs.filter(job =>
        job.statusHistory.some(h => h.status === status)
      );

      if (jobsInStage.length > 0) {
        let totalDays = 0;
        jobsInStage.forEach(job => {
          const statusEntries = job.statusHistory.filter(h => h.status === status);
          statusEntries.forEach((entry, idx) => {
            const startTime = new Date(entry.timestamp);
            const endTime = idx < statusEntries.length - 1
              ? new Date(statusEntries[idx + 1].timestamp)
              : job.statusHistory.find(h => h.timestamp > entry.timestamp)
                ? new Date(job.statusHistory.find(h => new Date(h.timestamp) > startTime).timestamp)
                : new Date();
            const days = Math.floor((endTime - startTime) / (1000 * 60 * 60 * 24));
            totalDays += days;
          });
        });
        avgTimeByStage[status] = (totalDays / jobsInStage.length).toFixed(1);
      } else {
        avgTimeByStage[status] = 0;
      }
    }

    // 4. Monthly application volume chart (last 12 months)
    const now = new Date();
    const monthlyVolume = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      const count = allJobs.filter(job => {
        const createdDate = new Date(job.createdAt);
        return createdDate >= monthStart && createdDate <= monthEnd;
      }).length;

      monthlyVolume.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        count,
        timestamp: monthStart.getTime()
      });
    }

    // 5. Application deadline adherence tracking
    const jobsWithDeadlines = activeJobs.filter(job => job.deadline);
    const metDeadlines = jobsWithDeadlines.filter(job => {
      if (!job.applicationDate) return false;
      return new Date(job.applicationDate) <= new Date(job.deadline);
    }).length;
    const missedDeadlines = jobsWithDeadlines.filter(job => {
      if (!job.applicationDate) {
        return new Date() > new Date(job.deadline);
      }
      return new Date(job.applicationDate) > new Date(job.deadline);
    }).length;
    const upcomingDeadlines = jobsWithDeadlines.filter(job => {
      const deadlineDate = new Date(job.deadline);
      const daysUntil = Math.floor((deadlineDate - new Date()) / (1000 * 60 * 60 * 24));
      return !job.applicationDate && daysUntil >= 0;
    }).length;

    const deadlineAdherence = jobsWithDeadlines.length > 0
      ? ((metDeadlines / jobsWithDeadlines.length) * 100).toFixed(1)
      : 0;

    // 6. Time-to-offer analytics
    const offerJobs = allJobs.filter(job => job.status === "Offer" ||
      job.statusHistory.some(h => h.status === "Offer"));

    let avgTimeToOffer = 0;
    if (offerJobs.length > 0) {
      let totalDays = 0;
      offerJobs.forEach(job => {
        const firstEntry = job.statusHistory[0];
        const offerEntry = job.statusHistory.find(h => h.status === "Offer");
        if (firstEntry && offerEntry) {
          const days = Math.floor((new Date(offerEntry.timestamp) - new Date(firstEntry.timestamp)) / (1000 * 60 * 60 * 24));
          totalDays += days;
        }
      });
      avgTimeToOffer = (totalDays / offerJobs.length).toFixed(1);
    }

    // Additional metrics
    const totalApplications = allJobs.length;
    const offerRate = appliedJobs.length > 0
      ? ((allJobs.filter(job => job.status === "Offer").length / appliedJobs.length) * 100).toFixed(1)
      : 0;
    const interviewRate = appliedJobs.length > 0
      ? ((activeJobs.filter(job => ["Interview", "Offer"].includes(job.status)).length / appliedJobs.length) * 100).toFixed(1)
      : 0;

    // Status distribution for charts
    const statusDistribution = statuses.map(status => ({
      status,
      count: statusCounts[status],
      percentage: totalApplications > 0 ? ((statusCounts[status] / totalApplications) * 100).toFixed(1) : 0
    }));

    // 7. Application funnel analytics (applied → phone screen → interview → offer)
    // Each stage counts only jobs currently at that exact stage
    const funnelData = {
      applied: allJobs.length,
      phoneScreen: allJobs.filter(job => job.status === "Phone Screen").length,
      interview: allJobs.filter(job => job.status === "Interview").length,
      offer: allJobs.filter(job => job.status === "Offer").length,
      conversionRates: {
        applyToScreen: allJobs.length > 0
          ? ((allJobs.filter(job => job.status === "Phone Screen").length / allJobs.length) * 100).toFixed(1)
          : 0,
        screenToInterview: allJobs.filter(job => job.status === "Phone Screen").length > 0
          ? ((allJobs.filter(job => job.status === "Interview").length / allJobs.filter(job => job.status === "Phone Screen").length) * 100).toFixed(1)
          : 0,
        interviewToOffer: allJobs.filter(job => job.status === "Interview").length > 0
          ? ((allJobs.filter(job => job.status === "Offer").length / allJobs.filter(job => job.status === "Interview").length) * 100).toFixed(1)
          : 0,
      }
    };

    // 8. Time-to-response tracking by company
    const companyResponseTimes = {};
    allJobs.forEach(job => {
      if (job.applicationDate && job.statusHistory.length > 1) {
        const appDate = new Date(job.applicationDate);
        // Find first response (any status change after Applied)
        const responseEntry = job.statusHistory.find(h =>
          h.status !== "Interested" && h.status !== "Applied" && new Date(h.timestamp) > appDate
        );

        if (responseEntry) {
          const responseTime = Math.floor((new Date(responseEntry.timestamp) - appDate) / (1000 * 60 * 60 * 24));
          if (!companyResponseTimes[job.company]) {
            companyResponseTimes[job.company] = { times: [], total: 0, count: 0 };
          }
          companyResponseTimes[job.company].times.push(responseTime);
          companyResponseTimes[job.company].total += responseTime;
          companyResponseTimes[job.company].count += 1;
        }
      }
    });

    // Build company analytics - include ALL companies, even without response time data
    const companyStats = {};
    allJobs.forEach(job => {
      if (job.company) {
        if (!companyStats[job.company]) {
          companyStats[job.company] = { jobs: [], successCount: 0 };
        }
        companyStats[job.company].jobs.push(job);
        if (["Interview", "Offer", "Accepted"].includes(job.status)) {
          companyStats[job.company].successCount++;
        }
      }
    });

    const companyAnalytics = Object.entries(companyStats)
      .map(([company, data]) => ({
        company,
        avgResponseTime: companyResponseTimes[company]
          ? (companyResponseTimes[company].total / companyResponseTimes[company].count).toFixed(1)
          : 'N/A',
        applications: data.jobs.length,
        successRate: data.jobs.length > 0
          ? ((data.successCount / data.jobs.length) * 100).toFixed(1)
          : 0
      }))
      .sort((a, b) => b.applications - a.applications)
      .slice(0, 10); // Top 10 companies

    // 9. Time-to-response tracking by industry
    const industryResponseTimes = {};
    allJobs.forEach(job => {
      if (job.industry && job.applicationDate && job.statusHistory.length > 1) {
        const appDate = new Date(job.applicationDate);
        const responseEntry = job.statusHistory.find(h =>
          h.status !== "Interested" && h.status !== "Applied" && new Date(h.timestamp) > appDate
        );

        if (responseEntry) {
          const responseTime = Math.floor((new Date(responseEntry.timestamp) - appDate) / (1000 * 60 * 60 * 24));
          if (!industryResponseTimes[job.industry]) {
            industryResponseTimes[job.industry] = { times: [], total: 0, count: 0 };
          }
          industryResponseTimes[job.industry].times.push(responseTime);
          industryResponseTimes[job.industry].total += responseTime;
          industryResponseTimes[job.industry].count += 1;
        }
      }
    });

    // Build industry analytics - include ALL industries, even without response time data
    const industryStats = {};
    allJobs.forEach(job => {
      if (job.industry) {
        if (!industryStats[job.industry]) {
          industryStats[job.industry] = { jobs: [], successCount: 0 };
        }
        industryStats[job.industry].jobs.push(job);
        if (["Interview", "Offer", "Accepted"].includes(job.status)) {
          industryStats[job.industry].successCount++;
        }
      }
    });

    const industryAnalytics = Object.entries(industryStats)
      .map(([industry, data]) => ({
        industry,
        avgResponseTime: industryResponseTimes[industry]
          ? (industryResponseTimes[industry].total / industryResponseTimes[industry].count).toFixed(1)
          : 'N/A',
        applications: data.jobs.length,
        successRate: data.jobs.length > 0
          ? ((data.successCount / data.jobs.length) * 100).toFixed(1)
          : 0
      }))
      .sort((a, b) => b.applications - a.applications);

    // 10. Success rate by application approach (based on work mode)
    const approachAnalytics = {};
    ["Remote", "Hybrid", "On-site"].forEach(mode => {
      const modeJobs = allJobs.filter(j => j.workMode === mode);
      if (modeJobs.length > 0) {
        approachAnalytics[mode] = {
          applications: modeJobs.length,
          responseRate: modeJobs.filter(j => j.status !== "Interested" && j.status !== "Applied").length > 0
            ? ((modeJobs.filter(j => j.status !== "Interested" && j.status !== "Applied").length / modeJobs.length) * 100).toFixed(1)
            : 0,
          interviewRate: modeJobs.length > 0
            ? ((modeJobs.filter(j => ["Interview", "Offer"].includes(j.status)).length / modeJobs.length) * 100).toFixed(1)
            : 0,
          offerRate: modeJobs.length > 0
            ? ((modeJobs.filter(j => j.status === "Offer").length / modeJobs.length) * 100).toFixed(1)
            : 0
        };
      }
    });

    // 11. Application frequency trends (last 4 weeks)
    const weeklyTrends = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i * 7 + 7));
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - (i * 7));
      weekEnd.setHours(23, 59, 59, 999);

      const weekJobs = allJobs.filter(job => {
        const createdDate = new Date(job.createdAt);
        return createdDate >= weekStart && createdDate <= weekEnd;
      });

      weeklyTrends.push({
        week: `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        applications: weekJobs.length,
        responses: weekJobs.filter(j => j.status !== "Interested" && j.status !== "Applied").length
      });
    }

    // 12. Performance benchmarking against industry standards
    // NOTE: Industry averages are reference benchmarks based on job search industry research
    // These are static standards for comparison, not user-specific data
    const benchmarks = {
      industryAverages: {
        responseRate: 25, // Industry standard: 25% response rate
        interviewRate: 15, // Industry standard: 15% interview rate
        offerRate: 5, // Industry standard: 5% offer rate
        avgTimeToOffer: 45, // Industry standard: 45 days to offer
        avgResponseTime: 14 // Industry standard: 14 days response time
      },
      userPerformance: {
        responseRate: parseFloat(responseRate),
        interviewRate: parseFloat(interviewRate),
        offerRate: parseFloat(offerRate),
        avgTimeToOffer: parseFloat(avgTimeToOffer),
        avgResponseTime: companyAnalytics.length > 0
          ? (companyAnalytics.reduce((sum, c) => sum + parseFloat(c.avgResponseTime), 0) / companyAnalytics.length).toFixed(1)
          : 0
      },
      comparison: {
        responseRate: parseFloat(responseRate) >= 25 ? 'above' : parseFloat(responseRate) >= 20 ? 'average' : 'below',
        interviewRate: parseFloat(interviewRate) >= 15 ? 'above' : parseFloat(interviewRate) >= 10 ? 'average' : 'below',
        offerRate: parseFloat(offerRate) >= 5 ? 'above' : parseFloat(offerRate) >= 3 ? 'average' : 'below'
      }
    };

    // 13. Optimization recommendations based on data
    const recommendations = [];

    if (parseFloat(responseRate) < 20) {
      recommendations.push({
        type: 'critical',
        category: 'Response Rate',
        message: 'Your response rate is below average. Consider tailoring your applications more to each job.',
        action: 'Review and customize your resume and cover letter for each application'
      });
    }

    if (parseFloat(interviewRate) < 10 && appliedJobs.length >= 10) {
      recommendations.push({
        type: 'warning',
        category: 'Interview Conversion',
        message: 'Your interview rate could be improved. Focus on quality over quantity.',
        action: 'Apply to fewer but more relevant positions and enhance your application materials'
      });
    }

    if (weeklyTrends[3]?.applications < 5) {
      recommendations.push({
        type: 'info',
        category: 'Application Volume',
        message: 'Your application volume is low. Increase your weekly applications to improve chances.',
        action: 'Set a goal to apply to at least 5-10 positions per week'
      });
    }

    if (companyAnalytics.length > 0) {
      const fastCompanies = companyAnalytics.filter(c => parseFloat(c.avgResponseTime) < 7);
      if (fastCompanies.length > 0) {
        recommendations.push({
          type: 'success',
          category: 'Quick Responders',
          message: `${fastCompanies.map(c => c.company).join(', ')} respond quickly. Consider prioritizing similar companies.`,
          action: 'Research and apply to companies known for fast hiring processes'
        });
      }
    }

    if (industryAnalytics.length > 0) {
      const topIndustry = industryAnalytics[0];
      if (parseFloat(topIndustry.successRate) > 20) {
        recommendations.push({
          type: 'success',
          category: 'Industry Match',
          message: `You have ${topIndustry.successRate}% success rate in ${topIndustry.industry}. This could be your sweet spot!`,
          action: `Focus more applications in the ${topIndustry.industry} industry`
        });
      }
    }

    // 14. Goal tracking metrics
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthStart = new Date(currentYear, currentMonth, 1);
    // 14. Monthly goal tracking - system defaults
    // NOTE: Goals are currently system-wide defaults. Future enhancement: allow users to set custom goals in User model
    const monthlyGoals = {
      applications: {
        goal: 20, // System default: 20 applications per month
        current: allJobs.filter(j => new Date(j.createdAt) >= monthStart).length,
        percentage: (allJobs.filter(j => new Date(j.createdAt) >= monthStart).length / 20 * 100).toFixed(0)
      },
      interviews: {
        goal: 5, // System default: 5 interviews per month
        current: allJobs.filter(j => new Date(j.createdAt) >= monthStart && ["Interview", "Offer", "Accepted"].includes(j.status)).length,
        percentage: (allJobs.filter(j => new Date(j.createdAt) >= monthStart && ["Interview", "Offer", "Accepted"].includes(j.status)).length / 5 * 100).toFixed(0)
      },
      offers: {
        goal: 1, // System default: 1 offer per month
        current: allJobs.filter(j => new Date(j.createdAt) >= monthStart && ["Offer", "Accepted"].includes(j.status)).length,
        percentage: (allJobs.filter(j => new Date(j.createdAt) >= monthStart && ["Offer", "Accepted"].includes(j.status)).length / 1 * 100).toFixed(0)
      }
    };

    const { response, statusCode } = successResponse("Job analytics retrieved successfully", {
      overview: {
        totalApplications,
        activeApplications: activeJobs.length,
        archivedApplications: allJobs.length - activeJobs.length,
        responseRate: parseFloat(responseRate),
        offerRate: parseFloat(offerRate),
        interviewRate: parseFloat(interviewRate),
      },
      statusCounts,
      statusDistribution,
      avgTimeByStage,
      monthlyVolume,
      deadlineTracking: {
        total: jobsWithDeadlines.length,
        met: metDeadlines,
        missed: missedDeadlines,
        upcoming: upcomingDeadlines,
        adherenceRate: parseFloat(deadlineAdherence),
      },
      timeToOffer: {
        average: parseFloat(avgTimeToOffer),
        count: offerJobs.length,
      },
      funnelAnalytics: funnelData,
      companyAnalytics,
      industryAnalytics,
      approachAnalytics,
      weeklyTrends,
      benchmarks,
      recommendations,
      goalTracking: monthlyGoals,
    });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Error in getJobAnalytics:", err);
    const { response, statusCode } = errorResponse(
      err.message || "Failed to retrieve job analytics",
      500,
      ERROR_CODES.INTERNAL_ERROR
    );
    return sendResponse(res, response, statusCode);
  }
});

// UC-52: PUT /api/jobs/:jobId/link-resume - Link a resume to a job application
export const linkResumeToJob = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { jobId } = req.params;
  const { resumeId } = req.body;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  if (!jobId || !resumeId) {
    const { response, statusCode } = errorResponse(
      "Job ID and Resume ID are required",
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
    return sendResponse(res, response, statusCode);
  }

  // Find job and verify ownership
  const job = await Job.findOne({ _id: jobId, userId });
  if (!job) {
    const { response, statusCode } = errorResponse(
      "Job not found or you don't have permission to update it",
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  // Update job with linked resume
  job.linkedResumeId = resumeId;
  await job.save();

  const { response, statusCode } = successResponse("Resume linked to job successfully", { job });
  return sendResponse(res, response, statusCode);
});

// POST /api/jobs/:jobId/archive - Archive a single job
export const archiveJob = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { jobId } = req.params;
  const { reason, notes } = req.body;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const job = await Job.findOne({ _id: jobId, userId });
  if (!job) {
    const { response, statusCode } = errorResponse(
      "Job not found or you don't have permission to archive it",
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  if (job.archived) {
    const { response, statusCode } = errorResponse(
      "Job is already archived",
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
    return sendResponse(res, response, statusCode);
  }

  job.archived = true;
  job.archivedAt = new Date();
  job.archiveReason = reason;
  job.archiveNotes = notes;
  job.autoArchived = false;
  await job.save();

  const { response, statusCode } = successResponse("Job archived successfully", { job });
  return sendResponse(res, response, statusCode);
});

// POST /api/jobs/:jobId/restore - Restore an archived job
export const restoreJob = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { jobId } = req.params;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const job = await Job.findOne({ _id: jobId, userId });
  if (!job) {
    const { response, statusCode } = errorResponse(
      "Job not found or you don't have permission to restore it",
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  if (!job.archived) {
    const { response, statusCode } = errorResponse(
      "Job is not archived",
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
    return sendResponse(res, response, statusCode);
  }

  job.archived = false;
  job.archivedAt = undefined;
  job.archiveReason = undefined;
  job.archiveNotes = undefined;
  job.autoArchived = false;
  await job.save();

  const { response, statusCode } = successResponse("Job restored successfully", { job });
  return sendResponse(res, response, statusCode);
});

// POST /api/jobs/bulk-archive - Bulk archive jobs
export const bulkArchiveJobs = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { jobIds, reason, notes } = req.body;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  if (!jobIds || !Array.isArray(jobIds) || jobIds.length === 0) {
    const { response, statusCode } = errorResponse(
      "Job IDs array is required",
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
    return sendResponse(res, response, statusCode);
  }

  const jobs = await Job.find({ _id: { $in: jobIds }, userId, archived: false });

  if (jobs.length === 0) {
    const { response, statusCode } = errorResponse(
      "No active jobs found to archive",
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  const archivedJobs = [];
  for (const job of jobs) {
    job.archived = true;
    job.archivedAt = new Date();
    job.archiveReason = reason;
    job.archiveNotes = notes;
    job.autoArchived = false;
    await job.save();
    archivedJobs.push(job);
  }

  const { response, statusCode } = successResponse(
    `${archivedJobs.length} job(s) archived successfully`,
    { jobs: archivedJobs, count: archivedJobs.length }
  );
  return sendResponse(res, response, statusCode);
});

// POST /api/jobs/bulk-restore - Bulk restore archived jobs
export const bulkRestoreJobs = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { jobIds } = req.body;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  if (!jobIds || !Array.isArray(jobIds) || jobIds.length === 0) {
    const { response, statusCode } = errorResponse(
      "Job IDs array is required",
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
    return sendResponse(res, response, statusCode);
  }

  const jobs = await Job.find({ _id: { $in: jobIds }, userId, archived: true });

  if (jobs.length === 0) {
    const { response, statusCode } = errorResponse(
      "No archived jobs found to restore",
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  const restoredJobs = [];
  for (const job of jobs) {
    job.archived = false;
    job.archivedAt = undefined;
    job.archiveReason = undefined;
    job.archiveNotes = undefined;
    job.autoArchived = false;
    await job.save();
    restoredJobs.push(job);
  }

  const { response, statusCode } = successResponse(
    `${restoredJobs.length} job(s) restored successfully`,
    { jobs: restoredJobs, count: restoredJobs.length }
  );
  return sendResponse(res, response, statusCode);
});

// POST /api/jobs/auto-archive - Auto-archive old jobs based on criteria
export const autoArchiveJobs = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { daysInactive, statuses } = req.body;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const daysThreshold = daysInactive || 90; // Default 90 days
  const targetStatuses = statuses || ["Rejected", "Offer"];
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);

  const jobs = await Job.find({
    userId,
    archived: false,
    status: { $in: targetStatuses },
    updatedAt: { $lt: cutoffDate },
  });

  const archivedJobs = [];
  for (const job of jobs) {
    job.archived = true;
    job.archivedAt = new Date();
    job.archiveReason = "Other";
    job.archiveNotes = `Auto-archived after ${daysThreshold} days of inactivity`;
    job.autoArchived = true;
    await job.save();
    archivedJobs.push(job);
  }

  const { response, statusCode } = successResponse(
    `${archivedJobs.length} job(s) auto-archived`,
    {
      jobs: archivedJobs,
      count: archivedJobs.length,
      criteria: { daysInactive: daysThreshold, statuses: targetStatuses }
    }
  );
  return sendResponse(res, response, statusCode);
});
