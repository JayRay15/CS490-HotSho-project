import { Interview } from "../models/Interview.js";
import { Job } from "../models/Job.js";
import { successResponse, errorResponse, sendResponse, ERROR_CODES, validationErrorResponse } from "../utils/responseFormat.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { sendInterviewConfirmationEmail, sendInterviewReminderEmail, sendInterviewCancellationEmail, sendInterviewRescheduledEmail } from "../utils/email.js";

// GET /api/interviews - Get all interviews for the current user
export const getInterviews = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  
  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const { status, from, to, jobId } = req.query;
  const filter = { userId };

  // Filter by status
  if (status) {
    filter.status = status;
  }

  // Filter by date range
  if (from || to) {
    filter.scheduledDate = {};
    if (from) filter.scheduledDate.$gte = new Date(from);
    if (to) filter.scheduledDate.$lte = new Date(to);
  }

  // Filter by job
  if (jobId) {
    filter.jobId = jobId;
  }

  const interviews = await Interview.find(filter)
    .populate("jobId", "title company status")
    .sort({ scheduledDate: 1 });

  const { response, statusCode } = successResponse("Interviews retrieved successfully", {
    interviews,
    count: interviews.length,
  });
  return sendResponse(res, response, statusCode);
});

// GET /api/interviews/:interviewId - Get a single interview
export const getInterview = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { interviewId } = req.params;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const interview = await Interview.findOne({ _id: interviewId, userId })
    .populate("jobId", "title company status location");

  if (!interview) {
    const { response, statusCode } = errorResponse(
      "Interview not found or you don't have permission to view it",
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  const { response, statusCode } = successResponse("Interview retrieved successfully", { interview });
  return sendResponse(res, response, statusCode);
});

// POST /api/interviews - Create/Schedule a new interview
export const scheduleInterview = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  
  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const { 
    jobId, 
    title, 
    company, 
    interviewType, 
    scheduledDate, 
    duration,
    location, 
    meetingLink, 
    interviewer, 
    notes,
    questions,
    requirements,
    generateTasks,
  } = req.body;

  // Validate required fields
  const errors = [];

  if (!jobId) {
    errors.push({ field: "jobId", message: "Job ID is required", value: jobId });
  }

  if (!title?.trim()) {
    errors.push({ field: "title", message: "Interview title is required", value: title });
  }

  if (!company?.trim()) {
    errors.push({ field: "company", message: "Company name is required", value: company });
  }

  if (!scheduledDate) {
    errors.push({ field: "scheduledDate", message: "Interview date and time is required", value: scheduledDate });
  }

  if (!interviewType) {
    errors.push({ field: "interviewType", message: "Interview type is required", value: interviewType });
  }

  if (errors.length > 0) {
    const { response, statusCode } = validationErrorResponse(
      "Please fix the following errors before submitting",
      errors
    );
    return sendResponse(res, response, statusCode);
  }

  // Verify the job exists and belongs to the user
  const job = await Job.findOne({ _id: jobId, userId });
  if (!job) {
    const { response, statusCode } = errorResponse(
      "Job not found or you don't have permission to schedule interviews for it",
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  // Create interview
  const interviewData = {
    userId,
    jobId,
    title: title.trim(),
    company: company.trim(),
    interviewType,
    scheduledDate: new Date(scheduledDate),
    duration: duration || 60,
    location: location?.trim(),
    meetingLink: meetingLink?.trim(),
    interviewer,
    notes,
    questions,
    requirements,
    status: "Scheduled",
    history: [{
      action: "Created",
      timestamp: new Date(),
      notes: "Interview scheduled",
    }],
  };

  const interview = await Interview.create(interviewData);

  // Check for conflicts
  await interview.checkConflict();

  // Generate preparation tasks if requested
  if (generateTasks) {
    interview.generatePreparationTasks();
  }

  await interview.save();

  // TODO: Send confirmation email
  // await sendInterviewConfirmationEmail(userId, interview);

  const { response, statusCode } = successResponse("Interview scheduled successfully", { 
    interview,
    hasConflict: interview.conflictWarning.hasConflict,
    conflictDetails: interview.conflictWarning.conflictDetails,
  });
  return sendResponse(res, response, statusCode);
});

// PUT /api/interviews/:interviewId - Update an interview
export const updateInterview = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { interviewId } = req.params;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const interview = await Interview.findOne({ _id: interviewId, userId });

  if (!interview) {
    const { response, statusCode } = errorResponse(
      "Interview not found or you don't have permission to update it",
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  // Update allowed fields
  const allowedUpdates = [
    "title",
    "interviewType",
    "location",
    "meetingLink",
    "interviewer",
    "notes",
    "questions",
    "requirements",
    "duration",
  ];

  allowedUpdates.forEach((field) => {
    if (req.body[field] !== undefined) {
      interview[field] = req.body[field];
    }
  });

  // Add to history
  interview.history.push({
    action: "Updated",
    timestamp: new Date(),
    notes: "Interview details updated",
  });

  await interview.save();

  const { response, statusCode } = successResponse("Interview updated successfully", { interview });
  return sendResponse(res, response, statusCode);
});

// PUT /api/interviews/:interviewId/reschedule - Reschedule an interview
export const rescheduleInterview = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { interviewId } = req.params;
  const { newDate, reason } = req.body;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  if (!newDate) {
    const { response, statusCode } = errorResponse(
      "New date and time is required",
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
    return sendResponse(res, response, statusCode);
  }

  const interview = await Interview.findOne({ _id: interviewId, userId });

  if (!interview) {
    const { response, statusCode } = errorResponse(
      "Interview not found or you don't have permission to reschedule it",
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  const previousDate = interview.scheduledDate;
  interview.scheduledDate = new Date(newDate);
  interview.status = "Rescheduled";

  // Add to history
  interview.history.push({
    action: "Rescheduled",
    timestamp: new Date(),
    previousDate,
    notes: reason || "Interview rescheduled",
  });

  // Check for conflicts with new time
  await interview.checkConflict();

  // Update preparation task due dates
  if (interview.preparationTasks && interview.preparationTasks.length > 0) {
    interview.preparationTasks.forEach(task => {
      if (task.dueDate && !task.completed) {
        // Adjust task due date proportionally
        const timeDiff = new Date(newDate) - previousDate;
        task.dueDate = new Date(task.dueDate.getTime() + timeDiff);
      }
    });
  }

  await interview.save();

  // TODO: Send rescheduled email notification
  // await sendInterviewRescheduledEmail(userId, interview, previousDate);

  const { response, statusCode } = successResponse("Interview rescheduled successfully", { 
    interview,
    previousDate,
    hasConflict: interview.conflictWarning.hasConflict,
    conflictDetails: interview.conflictWarning.conflictDetails,
  });
  return sendResponse(res, response, statusCode);
});

// PUT /api/interviews/:interviewId/cancel - Cancel an interview
export const cancelInterview = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { interviewId } = req.params;
  const { reason, cancelledBy } = req.body;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const interview = await Interview.findOne({ _id: interviewId, userId });

  if (!interview) {
    const { response, statusCode } = errorResponse(
      "Interview not found or you don't have permission to cancel it",
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  if (interview.cancelled.isCancelled) {
    const { response, statusCode } = errorResponse(
      "Interview is already cancelled",
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
    return sendResponse(res, response, statusCode);
  }

  interview.status = "Cancelled";
  interview.cancelled = {
    isCancelled: true,
    cancelledAt: new Date(),
    reason: reason || "No reason provided",
    cancelledBy: cancelledBy || "User",
  };

  // Add to history
  interview.history.push({
    action: "Cancelled",
    timestamp: new Date(),
    notes: reason || "Interview cancelled",
  });

  await interview.save();

  // TODO: Send cancellation email notification
  // await sendInterviewCancellationEmail(userId, interview);

  const { response, statusCode } = successResponse("Interview cancelled successfully", { interview });
  return sendResponse(res, response, statusCode);
});

// PUT /api/interviews/:interviewId/outcome - Record interview outcome
export const recordOutcome = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { interviewId } = req.params;
  const { result, notes, feedback, rating, followUpRequired, followUpDate } = req.body;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  if (!result) {
    const { response, statusCode } = errorResponse(
      "Interview result is required",
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
    return sendResponse(res, response, statusCode);
  }

  const interview = await Interview.findOne({ _id: interviewId, userId });

  if (!interview) {
    const { response, statusCode } = errorResponse(
      "Interview not found or you don't have permission to update it",
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  interview.outcome = {
    result,
    notes,
    feedback,
    rating,
    followUpRequired: followUpRequired || false,
    followUpDate: followUpDate ? new Date(followUpDate) : undefined,
  };

  interview.status = "Completed";

  // Add to history
  interview.history.push({
    action: "Outcome Recorded",
    timestamp: new Date(),
    notes: `Interview outcome: ${result}`,
  });

  await interview.save();

  // Update job status if needed
  if (result === "Moved to Next Round" || result === "Offer Extended") {
    const job = await Job.findById(interview.jobId);
    if (job && job.userId === userId) {
      if (result === "Offer Extended") {
        job.status = "Offer";
      } else if (result === "Moved to Next Round") {
        job.status = "Interview";
      }
      job.interviewNotes = (job.interviewNotes || "") + `\n${interview.title} - ${result}: ${notes || ""}`;
      await job.save();
    }
  }

  const { response, statusCode } = successResponse("Interview outcome recorded successfully", { interview });
  return sendResponse(res, response, statusCode);
});

// PUT /api/interviews/:interviewId/confirm - Confirm an interview
export const confirmInterview = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { interviewId } = req.params;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const interview = await Interview.findOne({ _id: interviewId, userId });

  if (!interview) {
    const { response, statusCode } = errorResponse(
      "Interview not found or you don't have permission to confirm it",
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  interview.status = "Confirmed";

  // Add to history
  interview.history.push({
    action: "Confirmed",
    timestamp: new Date(),
    notes: "Interview confirmed by user",
  });

  await interview.save();

  const { response, statusCode } = successResponse("Interview confirmed successfully", { interview });
  return sendResponse(res, response, statusCode);
});

// PUT /api/interviews/:interviewId/tasks/:taskId - Update a preparation task
export const updatePreparationTask = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { interviewId, taskId } = req.params;
  const { completed, title, description, priority, dueDate } = req.body;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const interview = await Interview.findOne({ _id: interviewId, userId });

  if (!interview) {
    const { response, statusCode } = errorResponse(
      "Interview not found or you don't have permission to update it",
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  const task = interview.preparationTasks.id(taskId);

  if (!task) {
    const { response, statusCode } = errorResponse(
      "Preparation task not found",
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  // Update task fields
  if (completed !== undefined) task.completed = completed;
  if (title) task.title = title;
  if (description !== undefined) task.description = description;
  if (priority) task.priority = priority;
  if (dueDate) task.dueDate = new Date(dueDate);

  await interview.save();

  const { response, statusCode } = successResponse("Preparation task updated successfully", { 
    interview,
    task,
  });
  return sendResponse(res, response, statusCode);
});

// POST /api/interviews/:interviewId/tasks - Add a preparation task
export const addPreparationTask = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { interviewId } = req.params;
  const { title, description, priority, dueDate } = req.body;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  if (!title) {
    const { response, statusCode } = errorResponse(
      "Task title is required",
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
    return sendResponse(res, response, statusCode);
  }

  const interview = await Interview.findOne({ _id: interviewId, userId });

  if (!interview) {
    const { response, statusCode } = errorResponse(
      "Interview not found or you don't have permission to update it",
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  const newTask = {
    title,
    description,
    priority: priority || "Medium",
    dueDate: dueDate ? new Date(dueDate) : undefined,
    completed: false,
  };

  interview.preparationTasks.push(newTask);
  await interview.save();

  const { response, statusCode } = successResponse("Preparation task added successfully", { 
    interview,
    task: interview.preparationTasks[interview.preparationTasks.length - 1],
  });
  return sendResponse(res, response, statusCode);
});

// DELETE /api/interviews/:interviewId/tasks/:taskId - Delete a preparation task
export const deletePreparationTask = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { interviewId, taskId } = req.params;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const interview = await Interview.findOne({ _id: interviewId, userId });

  if (!interview) {
    const { response, statusCode } = errorResponse(
      "Interview not found or you don't have permission to update it",
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  const task = interview.preparationTasks.id(taskId);

  if (!task) {
    const { response, statusCode } = errorResponse(
      "Preparation task not found",
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  task.remove();
  await interview.save();

  const { response, statusCode } = successResponse("Preparation task deleted successfully", { interview });
  return sendResponse(res, response, statusCode);
});

// POST /api/interviews/:interviewId/generate-tasks - Generate preparation tasks
export const generatePreparationTasks = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { interviewId } = req.params;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const interview = await Interview.findOne({ _id: interviewId, userId });

  if (!interview) {
    const { response, statusCode } = errorResponse(
      "Interview not found or you don't have permission to update it",
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  // Generate tasks based on interview type
  const tasks = interview.generatePreparationTasks();
  await interview.save();

  const { response, statusCode } = successResponse("Preparation tasks generated successfully", { 
    interview,
    tasks,
    count: tasks.length,
  });
  return sendResponse(res, response, statusCode);
});

// GET /api/interviews/upcoming - Get upcoming interviews
export const getUpcomingInterviews = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  
  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const { days = 7 } = req.query;
  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const interviews = await Interview.find({
    userId,
    scheduledDate: {
      $gte: now,
      $lte: futureDate,
    },
    status: { $in: ["Scheduled", "Confirmed", "Rescheduled"] },
  })
    .populate("jobId", "title company status")
    .sort({ scheduledDate: 1 });

  const { response, statusCode } = successResponse("Upcoming interviews retrieved successfully", {
    interviews,
    count: interviews.length,
    days,
  });
  return sendResponse(res, response, statusCode);
});

// GET /api/interviews/conflicts - Check for interview conflicts
export const checkConflicts = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  
  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const { date, duration = 60, excludeId } = req.query;

  if (!date) {
    const { response, statusCode } = errorResponse(
      "Date is required to check conflicts",
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
    return sendResponse(res, response, statusCode);
  }

  const checkDate = new Date(date);
  const startBuffer = new Date(checkDate.getTime() - 60 * 60 * 1000);
  const endBuffer = new Date(checkDate.getTime() + duration * 60 * 1000 + 60 * 60 * 1000);

  const filter = {
    userId,
    status: { $in: ["Scheduled", "Confirmed"] },
    scheduledDate: {
      $gte: startBuffer,
      $lte: endBuffer,
    },
  };

  if (excludeId) {
    filter._id = { $ne: excludeId };
  }

  const conflicts = await Interview.find(filter)
    .populate("jobId", "title company")
    .sort({ scheduledDate: 1 });

  const { response, statusCode } = successResponse("Conflict check completed", {
    hasConflicts: conflicts.length > 0,
    conflicts,
    count: conflicts.length,
  });
  return sendResponse(res, response, statusCode);
});

// DELETE /api/interviews/:interviewId - Delete an interview
export const deleteInterview = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { interviewId } = req.params;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const interview = await Interview.findOneAndDelete({ _id: interviewId, userId });

  if (!interview) {
    const { response, statusCode } = errorResponse(
      "Interview not found or you don't have permission to delete it",
      404,
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  const { response, statusCode } = successResponse("Interview deleted successfully");
  return sendResponse(res, response, statusCode);
});
