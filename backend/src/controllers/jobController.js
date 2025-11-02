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
