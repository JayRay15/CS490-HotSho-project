import { ApplicationTiming } from '../models/ApplicationTiming.js';
import { Job } from '../models/Job.js';
import applicationTimingService from '../services/applicationTimingService.js';

/**
 * UC-124: Get timing recommendation for a job application
 */
export const getTimingRecommendation = async (req, res) => {
  try {
    const userId = req.auth?.payload?.sub || req.auth?.userId;
    const { jobId } = req.params;

    // Get job details
    const job = await Job.findOne({ _id: jobId, userId });
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Prepare job data for recommendation
    const jobData = {
      industry: job.industry || '',
      companySize: job.companyInfo?.size || '',
      location: job.location || '',
      timezone: job.timezone || 'EST',
      isRemote: job.workMode === 'Remote' || job.workMode === 'Hybrid'
    };

    const userData = {
      userId,
      userTimezone: req.query.userTimezone || 'EST'
    };

    // Generate recommendation
    const recommendation = await applicationTimingService.generateRecommendation(jobData, userData);

    // Create or update timing record using findOneAndUpdate to avoid duplicates
    const timingRecord = await ApplicationTiming.findOneAndUpdate(
      { userId, jobId },
      {
        $set: {
          userId,
          jobId,
          industry: jobData.industry,
          companySize: jobData.companySize,
          location: jobData.location,
          timezone: jobData.timezone,
          isRemote: jobData.isRemote,
          currentRecommendation: recommendation,
          lastUpdated: new Date()
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({
      success: true,
      recommendation,
      timingId: timingRecord._id
    });
  } catch (error) {
    console.error('Error generating timing recommendation:', error);
    res.status(500).json({ error: 'Failed to generate timing recommendation' });
  }
};

/**
 * UC-124: Get real-time recommendation (submit now vs wait)
 */
export const getRealtimeRecommendation = async (req, res) => {
  try {
    const userId = req.auth?.payload?.sub || req.auth?.userId;
    const { jobId } = req.params;

    // Get job details
    const job = await Job.findOne({ _id: jobId, userId });
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const jobData = {
      industry: job.industry || 'default',
      companySize: job.companyInfo?.size || 'default',
      location: job.location || '',
      timezone: job.timezone || 'EST',
      isRemote: job.workMode === 'Remote' || job.workMode === 'Hybrid'
    };

    const userData = {
      userId,
      userTimezone: req.body.userTimezone || 'EST'
    };

    const realtimeRec = await applicationTimingService.getRealtimeRecommendation(jobData, userData);

    res.json({
      success: true,
      ...realtimeRec
    });
  } catch (error) {
    console.error('Error getting realtime recommendation:', error);
    res.status(500).json({ error: 'Failed to get realtime recommendation' });
  }
};

/**
 * UC-124: Schedule application submission for optimal time
 */
export const scheduleSubmission = async (req, res) => {
  try {
    const userId = req.auth?.payload?.sub || req.auth?.userId;
    const { jobId } = req.params;
    const { scheduledTime, autoSubmit = false } = req.body;

    if (!scheduledTime) {
      return res.status(400).json({ error: 'Scheduled time is required' });
    }

    // Validate job exists
    const job = await Job.findOne({ _id: jobId, userId });
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Find or create timing record
    let timingRecord = await ApplicationTiming.findOne({ userId, jobId });
    
    if (!timingRecord) {
      const jobData = {
        industry: job.industry || 'default',
        companySize: job.companyInfo?.size || 'default',
        location: job.location || '',
        timezone: job.timezone || 'EST',
        isRemote: job.workMode === 'Remote' || job.workMode === 'Hybrid'
      };

      timingRecord = new ApplicationTiming({
        userId,
        jobId,
        industry: jobData.industry,
        companySize: jobData.companySize,
        location: jobData.location,
        timezone: jobData.timezone,
        isRemote: jobData.isRemote
      });
    }

    // Schedule the submission
    await timingRecord.scheduleSubmission(new Date(scheduledTime), autoSubmit);

    res.json({
      success: true,
      message: 'Application submission scheduled successfully',
      scheduledTime: timingRecord.scheduledSubmission.scheduledTime,
      autoSubmit: timingRecord.scheduledSubmission.autoSubmit
    });
  } catch (error) {
    console.error('Error scheduling submission:', error);
    res.status(500).json({ error: 'Failed to schedule submission' });
  }
};

/**
 * UC-124: Cancel scheduled submission
 */
export const cancelScheduledSubmission = async (req, res) => {
  try {
    const userId = req.auth?.payload?.sub || req.auth?.userId;
    const { jobId } = req.params;
    const { reason = 'User cancelled' } = req.body;

    const timingRecord = await ApplicationTiming.findOne({ userId, jobId });
    
    if (!timingRecord) {
      return res.status(404).json({ error: 'Timing record not found' });
    }

    if (!timingRecord.scheduledSubmission || timingRecord.scheduledSubmission.status !== 'scheduled') {
      return res.status(400).json({ error: 'No active scheduled submission found' });
    }

    await timingRecord.cancelScheduledSubmission(reason);

    res.json({
      success: true,
      message: 'Scheduled submission cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling scheduled submission:', error);
    res.status(500).json({ error: 'Failed to cancel scheduled submission' });
  }
};

/**
 * UC-124: Record application submission
 */
export const recordSubmission = async (req, res) => {
  try {
    const userId = req.auth?.payload?.sub || req.auth?.userId;
    const { jobId } = req.params;
    const submissionData = req.body;

    // Find timing record
    let timingRecord = await ApplicationTiming.findOne({ userId, jobId });
    
    if (!timingRecord) {
      // Get job details to create record
      const job = await Job.findOne({ _id: jobId, userId });
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      timingRecord = new ApplicationTiming({
        userId,
        jobId,
        industry: job.industry || 'default',
        companySize: job.companyInfo?.size || 'default',
        location: job.location || '',
        timezone: job.timezone || 'EST',
        isRemote: job.workMode === 'Remote' || job.workMode === 'Hybrid'
      });
    }

    // Check if submission followed recommendation
    const followedRecommendation = timingRecord.currentRecommendation
      ? Math.abs(new Date() - new Date(timingRecord.currentRecommendation.recommendedTime)) < 3600000 // Within 1 hour
      : false;

    const submissionRecord = {
      ...submissionData,
      submittedAt: submissionData.submittedAt || new Date(),
      wasScheduled: timingRecord.scheduledSubmission?.status === 'scheduled',
      followedRecommendation
    };

    await timingRecord.recordSubmission(submissionRecord);

    res.json({
      success: true,
      message: 'Submission recorded successfully',
      metrics: timingRecord.metrics
    });
  } catch (error) {
    console.error('Error recording submission:', error);
    res.status(500).json({ error: 'Failed to record submission' });
  }
};

/**
 * UC-124: Record response to application
 */
export const recordResponse = async (req, res) => {
  try {
    const userId = req.auth?.payload?.sub || req.auth?.userId;
    const { jobId } = req.params;
    const { submissionIndex, responseType, respondedAt } = req.body;

    if (submissionIndex === undefined || !responseType) {
      return res.status(400).json({ error: 'Submission index and response type are required' });
    }

    const timingRecord = await ApplicationTiming.findOne({ userId, jobId });
    
    if (!timingRecord) {
      return res.status(404).json({ error: 'Timing record not found' });
    }

    await timingRecord.recordResponse(submissionIndex, {
      responseType,
      respondedAt: respondedAt || new Date()
    });

    res.json({
      success: true,
      message: 'Response recorded successfully',
      metrics: timingRecord.metrics
    });
  } catch (error) {
    console.error('Error recording response:', error);
    res.status(500).json({ error: 'Failed to record response' });
  }
};

/**
 * UC-124: Get timing metrics for a job
 */
export const getTimingMetrics = async (req, res) => {
  try {
    const userId = req.auth?.payload?.sub || req.auth?.userId;
    const { jobId } = req.params;

    const timingRecord = await ApplicationTiming.findOne({ userId, jobId });
    
    if (!timingRecord) {
      return res.json({
        success: true,
        metrics: null,
        message: 'No timing data available yet'
      });
    }

    res.json({
      success: true,
      metrics: timingRecord.metrics,
      submissionHistory: timingRecord.submissionHistory,
      scheduledSubmission: timingRecord.scheduledSubmission
    });
  } catch (error) {
    console.error('Error getting timing metrics:', error);
    res.status(500).json({ error: 'Failed to get timing metrics' });
  }
};

/**
 * UC-124: Get A/B test results
 */
export const getABTestResults = async (req, res) => {
  try {
    const userId = req.auth?.payload?.sub || req.auth?.userId;

    const results = await applicationTimingService.getABTestResults(userId);

    res.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Error getting A/B test results:', error);
    res.status(500).json({ error: 'Failed to get A/B test results' });
  }
};

/**
 * UC-124: Get correlation data between timing and response rates
 */
export const getCorrelations = async (req, res) => {
  try {
    const userId = req.auth?.payload?.sub || req.auth?.userId;

    const correlations = await applicationTimingService.trackCorrelations(userId);

    res.json({
      success: true,
      correlations
    });
  } catch (error) {
    console.error('Error getting correlations:', error);
    res.status(500).json({ error: 'Failed to get correlations' });
  }
};

/**
 * UC-124: Get user's scheduled submissions
 */
export const getScheduledSubmissions = async (req, res) => {
  try {
    const userId = req.auth?.payload?.sub || req.auth?.userId;

    const scheduledTimings = await ApplicationTiming.find({
      userId,
      'scheduledSubmission.status': 'scheduled'
    })
    .populate('jobId', 'title company')
    .sort({ 'scheduledSubmission.scheduledTime': 1 });

    res.json({
      success: true,
      scheduled: scheduledTimings.map(timing => ({
        jobId: timing.jobId._id,
        jobTitle: timing.jobId.title,
        jobCompany: timing.jobId.company,
        scheduledTime: timing.scheduledSubmission.scheduledTime,
        autoSubmit: timing.scheduledSubmission.autoSubmit,
        reminderSent: timing.scheduledSubmission.reminderSent
      }))
    });
  } catch (error) {
    console.error('Error getting scheduled submissions:', error);
    res.status(500).json({ error: 'Failed to get scheduled submissions' });
  }
};

/**
 * UC-124: Get industry and company size statistics
 */
export const getTimingStats = async (req, res) => {
  try {
    const { industry, companySize } = req.query;

    const stats = {};

    if (industry) {
      stats.industryStats = await ApplicationTiming.getIndustryStats(industry);
    }

    if (companySize) {
      stats.companySizeStats = await ApplicationTiming.getCompanySizeStats(companySize);
    }

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting timing stats:', error);
    res.status(500).json({ error: 'Failed to get timing stats' });
  }
};
