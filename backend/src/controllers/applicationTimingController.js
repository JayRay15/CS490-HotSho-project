import { ApplicationTiming } from '../models/ApplicationTiming.js';
import { Job } from '../models/Job.js';
import applicationTimingService from '../services/applicationTimingService.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

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

    console.log('Job details for timing:', {
      title: job.title,
      company: job.company,
      industry: job.industry,
      jobDataIndustry: jobData.industry,
      workMode: job.workMode
    });

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

    console.log('📅 Received schedule request:', { scheduledTime, autoSubmit, type: typeof scheduledTime });

    if (!scheduledTime) {
      return res.status(400).json({ error: 'Scheduled time is required' });
    }

    // Parse and validate the date
    let parsedDate;
    try {
      // Handle both ISO string and datetime-local format (YYYY-MM-DDTHH:MM)
      if (typeof scheduledTime === 'string') {
        // If it's in format YYYY-MM-DDTHH:MM, add seconds
        const dateStr = scheduledTime.length === 16 ? `${scheduledTime}:00` : scheduledTime;
        parsedDate = new Date(dateStr);
      } else {
        parsedDate = new Date(scheduledTime);
      }

      // Check if date is valid
      if (isNaN(parsedDate.getTime())) {
        console.error('Invalid date parsed:', { scheduledTime, parsedDate });
        return res.status(400).json({ error: 'Invalid date format' });
      }

      // Check if date is in the future
      if (parsedDate <= new Date()) {
        return res.status(400).json({ error: 'Scheduled time must be in the future' });
      }

      console.log('✅ Parsed date successfully:', parsedDate.toISOString());
    } catch (error) {
      console.error('Error parsing date:', error);
      return res.status(400).json({ error: 'Failed to parse date: ' + error.message });
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
    await timingRecord.scheduleSubmission(parsedDate, autoSubmit);

    console.log('📅 Submission scheduled:', {
      jobTitle: job.title,
      company: job.company,
      scheduledTime: parsedDate.toISOString(),
      autoSubmit,
      willAutoSubmit: autoSubmit ? 'YES - will auto-submit' : 'NO - reminder only'
    });

    // Send confirmation message (scheduler will handle actual submission/reminder)
    const scheduledDate = new Date(scheduledTime);
    const message = autoSubmit 
      ? `✅ Auto-submit scheduled for ${scheduledDate.toLocaleString()}. The application will be automatically submitted at that time.`
      : `✅ Reminder scheduled for ${scheduledDate.toLocaleString()}. You'll receive a notification to submit the application.`;

    res.json({
      success: true,
      message,
      scheduledTime: timingRecord.scheduledSubmission.scheduledTime,
      autoSubmit: timingRecord.scheduledSubmission.autoSubmit,
      note: process.env.ENABLE_APPLICATION_SCHEDULER !== 'true' 
        ? 'Note: Background scheduler is currently disabled. Enable it in .env with ENABLE_APPLICATION_SCHEDULER=true'
        : 'Scheduler is active and will process this at the scheduled time'
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

/**
 * UC-124: Get comprehensive timing insights with industry benchmarks
 * Returns insights even when user has no data by using industry patterns
 */
export const getComprehensiveInsights = async (req, res) => {
  try {
    const userId = req.auth?.payload?.sub || req.auth?.userId;

    // Get user's actual data
    const userTimings = await ApplicationTiming.find({ userId });
    
    // Calculate user-specific correlations
    const userCorrelations = {
      byDayOfWeek: {},
      byHourOfDay: {},
      byIndustry: {}
    };

    let totalUserSubmissions = 0;
    let totalUserResponses = 0;

    userTimings.forEach(timing => {
      timing.submissionHistory.forEach(submission => {
        totalUserSubmissions++;
        
        // Day of week
        const day = submission.dayOfWeek || 'Unknown';
        if (!userCorrelations.byDayOfWeek[day]) {
          userCorrelations.byDayOfWeek[day] = { total: 0, responses: 0, rate: 0 };
        }
        userCorrelations.byDayOfWeek[day].total += 1;
        if (submission.responseReceived && submission.responseType === 'positive') {
          userCorrelations.byDayOfWeek[day].responses += 1;
          totalUserResponses++;
        }

        // Hour of day
        const hour = submission.hourOfDay?.toString() || 'Unknown';
        if (!userCorrelations.byHourOfDay[hour]) {
          userCorrelations.byHourOfDay[hour] = { total: 0, responses: 0, rate: 0 };
        }
        userCorrelations.byHourOfDay[hour].total += 1;
        if (submission.responseReceived && submission.responseType === 'positive') {
          userCorrelations.byHourOfDay[hour].responses += 1;
        }
      });
    });

    // Calculate rates
    Object.keys(userCorrelations.byDayOfWeek).forEach(day => {
      const data = userCorrelations.byDayOfWeek[day];
      data.rate = data.total > 0 ? (data.responses / data.total) * 100 : 0;
    });
    
    Object.keys(userCorrelations.byHourOfDay).forEach(hour => {
      const data = userCorrelations.byHourOfDay[hour];
      data.rate = data.total > 0 ? (data.responses / data.total) * 100 : 0;
    });

    // Generate industry benchmark insights (always available)
    const industryBenchmarks = {
      Technology: {
        bestDays: ['Tuesday', 'Wednesday', 'Thursday'],
        bestHours: ['9 AM', '10 AM', '11 AM', '2 PM'],
        avgResponseRate: 8.5,
        avgResponseTime: 72,
        insights: [
          'Tech companies typically review applications mid-week',
          'Morning submissions (9-11 AM) get 15% more views',
          'Avoid Friday afternoon submissions - they may sit over the weekend'
        ]
      },
      Finance: {
        bestDays: ['Tuesday', 'Wednesday'],
        bestHours: ['8 AM', '9 AM', '10 AM'],
        avgResponseRate: 6.2,
        avgResponseTime: 120,
        insights: [
          'Finance recruiters start early - submit by 9 AM',
          'Avoid month-end and quarter-end submissions',
          'Tuesday submissions have highest response rates'
        ]
      },
      Healthcare: {
        bestDays: ['Tuesday', 'Wednesday', 'Thursday'],
        bestHours: ['9 AM', '10 AM', '2 PM'],
        avgResponseRate: 12.1,
        avgResponseTime: 96,
        insights: [
          'Healthcare has higher response rates overall',
          'Avoid Monday - staff catching up on patient care',
          'Mid-week applications perform best'
        ]
      },
      Consulting: {
        bestDays: ['Monday', 'Tuesday', 'Wednesday'],
        bestHours: ['10 AM', '11 AM', '2 PM'],
        avgResponseRate: 5.8,
        avgResponseTime: 168,
        insights: [
          'Consulting has longer response times due to project cycles',
          'Early week submissions align with project planning',
          'Late afternoon submissions often get next-day review'
        ]
      },
      default: {
        bestDays: ['Tuesday', 'Wednesday', 'Thursday'],
        bestHours: ['9 AM', '10 AM', '11 AM', '2 PM'],
        avgResponseRate: 7.5,
        avgResponseTime: 96,
        insights: [
          'Mid-week submissions generally perform best',
          'Morning applications get more immediate attention',
          'Avoid weekends and holidays for submissions'
        ]
      }
    };

    // Generate actionable recommendations
    const recommendations = [];
    
    if (totalUserSubmissions === 0) {
      recommendations.push({
        type: 'get_started',
        title: 'Start Tracking Your Applications',
        description: 'Use our timing recommendations when submitting applications to build your personal analytics.',
        priority: 'high'
      });
    } else {
      // Find best performing day
      const bestDay = Object.entries(userCorrelations.byDayOfWeek)
        .filter(([_, data]) => data.total >= 2)
        .sort((a, b) => b[1].rate - a[1].rate)[0];
      
      if (bestDay && bestDay[1].rate > 0) {
        recommendations.push({
          type: 'best_day',
          title: `${bestDay[0]} Works Best for You`,
          description: `You have a ${bestDay[1].rate.toFixed(1)}% success rate on ${bestDay[0]}s. Consider submitting more applications on this day.`,
          priority: 'high'
        });
      }

      // Overall success rate feedback
      const overallRate = totalUserSubmissions > 0 ? (totalUserResponses / totalUserSubmissions) * 100 : 0;
      if (overallRate < 5) {
        recommendations.push({
          type: 'improvement',
          title: 'Try Optimal Timing',
          description: 'Your response rate is below average. Try following our timing recommendations more closely.',
          priority: 'medium'
        });
      } else if (overallRate > 15) {
        recommendations.push({
          type: 'success',
          title: 'Great Job!',
          description: `Your ${overallRate.toFixed(1)}% response rate is above average. Keep using these timing strategies!`,
          priority: 'low'
        });
      }
    }

    res.json({
      success: true,
      userStats: {
        totalSubmissions: totalUserSubmissions,
        totalResponses: totalUserResponses,
        overallRate: totalUserSubmissions > 0 ? (totalUserResponses / totalUserSubmissions) * 100 : 0
      },
      correlations: userCorrelations,
      industryBenchmarks,
      recommendations,
      hasData: totalUserSubmissions > 0
    });
  } catch (error) {
    console.error('Error getting comprehensive insights:', error);
    res.status(500).json({ error: 'Failed to get comprehensive insights' });
  }
};
