import { ApplicationStatus } from '../models/ApplicationStatus.js';
import { Job } from '../models/Job.js';
import { successResponse, errorResponse, sendResponse, ERROR_CODES, validationErrorResponse } from '../utils/responseFormat.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { detectStatusFromEmail } from '../utils/emailStatusDetector.js';
import { sendStatusChangeNotification } from '../utils/statusNotifications.js';

// ===============================================
// Application Status Tracking
// ===============================================

/**
 * Get application status for a specific job
 * GET /api/status/:jobId
 */
export const getApplicationStatus = asyncHandler(async (req, res) => {
  const sub = req.auth?.payload?.sub || req.auth?.userId;
  const { jobId } = req.params;

  let status = await ApplicationStatus.findOne({ userId: sub, jobId })
    .populate('jobId', 'title company url location');

  // If no status exists, create default
  if (!status) {
    const job = await Job.findOne({ _id: jobId, userId: sub });
    if (!job) {
      const { response, statusCode } = errorResponse('Job not found', 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }

    status = await ApplicationStatus.create({
      userId: sub,
      jobId,
      currentStatus: job.status === 'Applied' ? 'Applied' : 'Not Applied',
      appliedAt: job.applicationDate
    });
    
    status = await status.populate('jobId', 'title company url location');
  }

  const { response, statusCode } = successResponse('Application status retrieved', status);
  return sendResponse(res, response, statusCode);
});

/**
 * Get all application statuses for user
 * GET /api/status
 */
export const getAllApplicationStatuses = asyncHandler(async (req, res) => {
  const sub = req.auth?.payload?.sub || req.auth?.userId;
  const { status: filterStatus, sortBy = 'lastStatusChange', order = 'desc' } = req.query;

  const query = { userId: sub };
  if (filterStatus) {
    query.currentStatus = filterStatus;
  }

  const sortOrder = order === 'asc' ? 1 : -1;
  const sortField = sortBy || 'lastStatusChange';

  const statuses = await ApplicationStatus.find(query)
    .populate('jobId', 'title company url location salary')
    .sort({ [sortField]: sortOrder });

  const { response, statusCode } = successResponse('Application statuses retrieved', statuses);
  return sendResponse(res, response, statusCode);
});

/**
 * Update application status manually
 * PUT /api/status/:jobId
 */
export const updateApplicationStatus = asyncHandler(async (req, res) => {
  const sub = req.auth?.payload?.sub || req.auth?.userId;
  const { jobId } = req.params;
  const { status: newStatus, notes, nextAction, nextActionDate, tags, priority } = req.body;

  if (!newStatus) {
    const { response, statusCode } = validationErrorResponse('Status is required', [
      { field: 'status', message: 'Status is required' }
    ]);
    return sendResponse(res, response, statusCode);
  }

  let status = await ApplicationStatus.findOne({ userId: sub, jobId });

  if (!status) {
    // Create new status entry
    const job = await Job.findOne({ _id: jobId, userId: sub });
    if (!job) {
      const { response, statusCode } = errorResponse('Job not found', 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }

    status = new ApplicationStatus({
      userId: sub,
      jobId,
      currentStatus: newStatus,
      appliedAt: newStatus === 'Applied' ? new Date() : null
    });
  }

  // Update status using model method (handles history automatically)
  status.updateStatus(newStatus, {
    changedBy: 'user',
    notes: notes || ''
  });

  // Update optional fields
  if (nextAction !== undefined) status.nextAction = nextAction;
  if (nextActionDate !== undefined) status.nextActionDate = nextActionDate;
  if (tags !== undefined) status.tags = tags;
  if (priority !== undefined) status.priority = priority;

  // Set appliedAt if status changed to Applied
  if (newStatus === 'Applied' && !status.appliedAt) {
    status.appliedAt = new Date();
  }

  await status.save();

  // Update Job model status for consistency
  await Job.findByIdAndUpdate(jobId, {
    status: newStatus,
    ...(newStatus === 'Applied' && { applicationDate: new Date() })
  });

  // Send notification if enabled
  if (status.notifications.statusChangeAlert) {
    await sendStatusChangeNotification(sub, status, 'user');
  }

  const populatedStatus = await ApplicationStatus.findById(status._id)
    .populate('jobId', 'title company url location');

  const { response, statusCode } = successResponse('Application status updated', populatedStatus);
  return sendResponse(res, response, statusCode);
});

/**
 * Get status history and timeline for a job
 * GET /api/status/:jobId/timeline
 */
export const getStatusTimeline = asyncHandler(async (req, res) => {
  const sub = req.auth?.payload?.sub || req.auth?.userId;
  const { jobId } = req.params;

  const status = await ApplicationStatus.findOne({ userId: sub, jobId })
    .populate('jobId', 'title company');

  if (!status) {
    const { response, statusCode } = errorResponse('Application status not found', 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  const timeline = {
    currentStatus: status.currentStatus,
    appliedAt: status.appliedAt,
    lastStatusChange: status.lastStatusChange,
    statusHistory: status.statusHistory.sort((a, b) => b.changedAt - a.changedAt),
    timeline: status.timeline.sort((a, b) => b.timestamp - a.timestamp),
    metrics: status.metrics,
    job: status.jobId
  };

  const { response, statusCode } = successResponse('Timeline retrieved', timeline);
  return sendResponse(res, response, statusCode);
});

/**
 * Add custom timeline event
 * POST /api/status/:jobId/timeline
 */
export const addTimelineEvent = asyncHandler(async (req, res) => {
  const sub = req.auth?.payload?.sub || req.auth?.userId;
  const { jobId } = req.params;
  const { eventType, description, metadata } = req.body;

  if (!eventType || !description) {
    const errors = [];
    if (!eventType) errors.push({ field: 'eventType', message: 'Event type is required' });
    if (!description) errors.push({ field: 'description', message: 'Description is required' });
    const { response, statusCode } = validationErrorResponse('Missing required fields', errors);
    return sendResponse(res, response, statusCode);
  }

  const status = await ApplicationStatus.findOne({ userId: sub, jobId });

  if (!status) {
    const { response, statusCode } = errorResponse('Application status not found', 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  status.addTimelineEvent(eventType, description, metadata);
  await status.save();

  const { response, statusCode } = successResponse('Timeline event added', status.timeline[status.timeline.length - 1]);
  return sendResponse(res, response, statusCode);
});

/**
 * Bulk update application statuses
 * PUT /api/status/bulk
 */
export const bulkUpdateStatuses = asyncHandler(async (req, res) => {
  const sub = req.auth?.payload?.sub || req.auth?.userId;
  const { jobIds, status: newStatus, notes } = req.body;

  if (!jobIds || !Array.isArray(jobIds) || jobIds.length === 0) {
    const { response, statusCode } = validationErrorResponse('Job IDs array is required', [
      { field: 'jobIds', message: 'Provide at least one job ID' }
    ]);
    return sendResponse(res, response, statusCode);
  }

  if (!newStatus) {
    const { response, statusCode } = validationErrorResponse('Status is required', [
      { field: 'status', message: 'Status is required' }
    ]);
    return sendResponse(res, response, statusCode);
  }

  const results = {
    successful: [],
    failed: []
  };

  for (const jobId of jobIds) {
    try {
      let status = await ApplicationStatus.findOne({ userId: sub, jobId });

      if (!status) {
        // Create if doesn't exist
        const job = await Job.findOne({ _id: jobId, userId: sub });
        if (!job) {
          results.failed.push({ jobId, reason: 'Job not found' });
          continue;
        }

        status = new ApplicationStatus({
          userId: sub,
          jobId,
          currentStatus: newStatus,
          appliedAt: newStatus === 'Applied' ? new Date() : null
        });
      }

      status.updateStatus(newStatus, {
        changedBy: 'user',
        notes: notes || 'Bulk status update'
      });

      if (newStatus === 'Applied' && !status.appliedAt) {
        status.appliedAt = new Date();
      }

      await status.save();

      // Update Job model
      await Job.findByIdAndUpdate(jobId, { status: newStatus });

      results.successful.push({ jobId, status: newStatus });
    } catch (error) {
      results.failed.push({ jobId, reason: error.message });
    }
  }

  const { response, statusCode } = successResponse(
    `Bulk update completed. ${results.successful.length} successful, ${results.failed.length} failed.`,
    results
  );
  return sendResponse(res, response, statusCode);
});

/**
 * Get status statistics for user
 * GET /api/status/stats
 */
export const getStatusStatistics = asyncHandler(async (req, res) => {
  const sub = req.auth?.payload?.sub || req.auth?.userId;

  const stats = await ApplicationStatus.getStatusStats(sub);
  
  // Additional aggregations
  const totalApplications = await ApplicationStatus.countDocuments({ userId: sub });
  const appliedCount = await ApplicationStatus.countDocuments({ 
    userId: sub, 
    currentStatus: 'Applied' 
  });
  const interviewCount = await ApplicationStatus.countDocuments({
    userId: sub,
    currentStatus: { $in: ['Phone Screen', 'Technical Interview', 'Onsite Interview', 'Final Interview'] }
  });
  const offerCount = await ApplicationStatus.countDocuments({
    userId: sub,
    currentStatus: { $in: ['Offer Extended', 'Offer Accepted'] }
  });
  const rejectedCount = await ApplicationStatus.countDocuments({
    userId: sub,
    currentStatus: 'Rejected'
  });

  // Calculate average response time
  const responseTimeAgg = await ApplicationStatus.aggregate([
    { $match: { userId: sub, responseTime: { $exists: true, $ne: null } } },
    { $group: { _id: null, avgResponseTime: { $avg: '$responseTime' } } }
  ]);

  const avgResponseTime = responseTimeAgg.length > 0 ? responseTimeAgg[0].avgResponseTime : 0;

  // Get stalled applications (no status change in 14+ days)
  const stalledApplications = await ApplicationStatus.find({
    userId: sub,
    currentStatus: { $in: ['Applied', 'Under Review', 'Phone Screen'] },
    lastStatusChange: { $lte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) }
  }).populate('jobId', 'title company');

  const statistics = {
    total: totalApplications,
    byStatus: stats,
    summary: {
      applied: appliedCount,
      interviews: interviewCount,
      offers: offerCount,
      rejected: rejectedCount
    },
    metrics: {
      avgResponseTime: Math.round(avgResponseTime * 10) / 10,
      conversionRate: appliedCount > 0 ? Math.round((interviewCount / appliedCount) * 100) : 0,
      offerRate: appliedCount > 0 ? Math.round((offerCount / appliedCount) * 100) : 0
    },
    stalledApplications: stalledApplications.length,
    stalledApplicationsList: stalledApplications
  };

  const { response, statusCode } = successResponse('Status statistics retrieved', statistics);
  return sendResponse(res, response, statusCode);
});

/**
 * Process email for status detection (manual trigger)
 * POST /api/status/:jobId/detect-from-email
 */
export const detectStatusFromEmailEndpoint = asyncHandler(async (req, res) => {
  const sub = req.auth?.payload?.sub || req.auth?.userId;
  const { jobId } = req.params;
  const { emailSubject, emailBody, emailFrom, receivedAt } = req.body;

  if (!emailSubject || !emailBody) {
    const errors = [];
    if (!emailSubject) errors.push({ field: 'emailSubject', message: 'Email subject is required' });
    if (!emailBody) errors.push({ field: 'emailBody', message: 'Email body is required' });
    const { response, statusCode } = validationErrorResponse('Missing required fields', errors);
    return sendResponse(res, response, statusCode);
  }

  // Detect status from email first (don't require ApplicationStatus to exist)
  console.log('Detecting status from email:', { emailSubject, emailBody: emailBody.substring(0, 100) });
  const detection = await detectStatusFromEmail(emailSubject, emailBody);
  console.log('Detection result:', detection);

  let status = await ApplicationStatus.findOne({ userId: sub, jobId });

  if (!status) {
    console.log('No ApplicationStatus found for job, returning detection only');
    // Return detection result even without ApplicationStatus
    const result = {
      detectedStatus: detection.status,
      confidence: detection.confidence,
      reason: detection.reason,
      matchedKeywords: detection.matchedKeywords,
      applied: false,
      requiresConfirmation: true,
      currentStatus: null
    };

    const { response, statusCode } = successResponse(
      detection.confidence >= 60 ? 'Status detection completed' : 'Low confidence detection',
      result
    );
    return sendResponse(res, response, statusCode);
  }

  if (detection.status && detection.confidence >= 60) {
    const requireConfirmation = status.automation.autoStatusDetection.requireConfirmation;

    if (!requireConfirmation) {
      // Auto-apply status
      status.updateStatus(detection.status, {
        changedBy: 'email-detection',
        notes: `Auto-detected from email: ${detection.reason}`,
        detectionConfidence: detection.confidence,
        sourceEmail: {
          subject: emailSubject,
          from: emailFrom,
          snippet: emailBody.substring(0, 200),
          receivedAt: receivedAt || new Date()
        }
      });

      await status.save();

      // Send notification
      if (status.notifications.statusChangeAlert) {
        await sendStatusChangeNotification(sub, status, 'email-detection');
      }
    }

    const result = {
      detectedStatus: detection.status,
      confidence: detection.confidence,
      reason: detection.reason,
      matchedKeywords: detection.matchedKeywords,
      applied: !requireConfirmation,
      requiresConfirmation: requireConfirmation,
      currentStatus: status.currentStatus
    };

    const { response, statusCode } = successResponse('Status detection completed', result);
    return sendResponse(res, response, statusCode);
  } else {
    const { response, statusCode } = successResponse('No clear status detected from email', {
      detectedStatus: detection.status,
      confidence: detection.confidence,
      reason: detection.reason || 'Confidence too low',
      matchedKeywords: detection.matchedKeywords || [],
      applied: false,
      requiresConfirmation: true,
      currentStatus: status.currentStatus
    });
    return sendResponse(res, response, statusCode);
  }
});

/**
 * Confirm auto-detected status
 * POST /api/status/:jobId/confirm-detection
 */
export const confirmStatusDetection = asyncHandler(async (req, res) => {
  const sub = req.auth?.payload?.sub || req.auth?.userId;
  const { jobId } = req.params;
  const { detectedStatus, notes } = req.body;

  if (!detectedStatus) {
    const { response, statusCode } = validationErrorResponse('Detected status is required', [
      { field: 'detectedStatus', message: 'Status is required' }
    ]);
    return sendResponse(res, response, statusCode);
  }

  const status = await ApplicationStatus.findOne({ userId: sub, jobId });

  if (!status) {
    const { response, statusCode } = errorResponse('Application status not found', 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  status.updateStatus(detectedStatus, {
    changedBy: 'user',
    notes: notes || 'Confirmed auto-detected status'
  });

  await status.save();

  const { response, statusCode } = successResponse('Status confirmed and updated', status);
  return sendResponse(res, response, statusCode);
});

/**
 * Update automation settings
 * PUT /api/status/:jobId/automation
 */
export const updateAutomationSettings = asyncHandler(async (req, res) => {
  const sub = req.auth?.payload?.sub || req.auth?.userId;
  const { jobId } = req.params;
  const { automation } = req.body;

  const status = await ApplicationStatus.findOne({ userId: sub, jobId });

  if (!status) {
    const { response, statusCode } = errorResponse('Application status not found', 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  if (automation) {
    status.automation = { ...status.automation, ...automation };
  }

  await status.save();

  const { response, statusCode } = successResponse('Automation settings updated', status);
  return sendResponse(res, response, statusCode);
});

/**
 * Delete application status
 * DELETE /api/status/:jobId
 */
export const deleteApplicationStatus = asyncHandler(async (req, res) => {
  const sub = req.auth?.payload?.sub || req.auth?.userId;
  const { jobId } = req.params;

  const status = await ApplicationStatus.findOneAndDelete({ userId: sub, jobId });

  if (!status) {
    const { response, statusCode } = errorResponse('Application status not found', 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  const { response, statusCode } = successResponse('Application status deleted');
  return sendResponse(res, response, statusCode);
});
