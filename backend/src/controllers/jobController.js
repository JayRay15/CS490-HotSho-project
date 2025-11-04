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

  const { title, company, status, location, salary, jobType, industry, workMode, description, requirements, applicationDate, deadline, url, notes, contacts, materials, priority, tags, interviewNotes, salaryNegotiationNotes } = req.body;

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
  const { status, notes } = req.body;

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

  const { response, statusCode} = successResponse("Resume linked to job successfully", { job });
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
