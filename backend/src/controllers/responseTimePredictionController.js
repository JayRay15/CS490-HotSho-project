import { ResponseTimePrediction } from '../models/ResponseTimePrediction.js';
import { Job } from '../models/Job.js';
import responseTimePredictionService from '../services/responseTimePredictionService.js';

/**
 * Get response time prediction for a specific job
 */
export const getPrediction = async (req, res) => {
  try {
    const userId = req.auth?.payload?.sub || req.auth?.userId;
    const { jobId } = req.params;

    if (!jobId) {
      return res.status(400).json({ error: 'Job ID is required' });
    }

    const result = await responseTimePredictionService.createOrUpdatePrediction(userId, jobId);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error getting response time prediction:', error);
    res.status(500).json({ error: error.message || 'Failed to get prediction' });
  }
};

/**
 * Get predictions for all user's applied jobs
 */
export const getAllPredictions = async (req, res) => {
  try {
    const userId = req.auth?.payload?.sub || req.auth?.userId;

    // Get all jobs that have been applied to
    const jobs = await Job.find({
      userId,
      status: { $in: ['Applied', 'Phone Screen', 'Interview'] },
      archived: { $ne: true }
    });

    const predictions = [];
    for (const job of jobs) {
      try {
        const result = await responseTimePredictionService.createOrUpdatePrediction(userId, job._id);
        predictions.push({
          jobId: job._id,
          ...result
        });
      } catch (err) {
        console.error(`Error getting prediction for job ${job._id}:`, err);
      }
    }

    res.json({
      success: true,
      predictions,
      count: predictions.length
    });
  } catch (error) {
    console.error('Error getting all predictions:', error);
    res.status(500).json({ error: 'Failed to get predictions' });
  }
};

/**
 * Get overdue applications
 */
export const getOverdueApplications = async (req, res) => {
  try {
    const userId = req.auth?.payload?.sub || req.auth?.userId;

    // First update overdue status for all predictions
    await responseTimePredictionService.updateOverdueStatus(userId);

    // Then get all overdue applications
    const overdueApps = await responseTimePredictionService.getOverdueApplications(userId);

    res.json({
      success: true,
      overdueApplications: overdueApps,
      count: overdueApps.length
    });
  } catch (error) {
    console.error('Error getting overdue applications:', error);
    res.status(500).json({ error: 'Failed to get overdue applications' });
  }
};

/**
 * Record actual response for a job application
 */
export const recordResponse = async (req, res) => {
  try {
    const userId = req.auth?.payload?.sub || req.auth?.userId;
    const { jobId } = req.params;
    const { responseDate, responseType } = req.body;

    if (!responseDate || !responseType) {
      return res.status(400).json({ error: 'Response date and type are required' });
    }

    const validTypes = ['interview_invite', 'rejection', 'follow_up_needed', 'ghosted', 'offer', 'other'];
    if (!validTypes.includes(responseType)) {
      return res.status(400).json({ error: 'Invalid response type' });
    }

    const result = await responseTimePredictionService.recordActualResponse(
      userId,
      jobId,
      new Date(responseDate),
      responseType
    );

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error recording response:', error);
    res.status(500).json({ error: error.message || 'Failed to record response' });
  }
};

/**
 * Get follow-up suggestions for a job
 */
export const getFollowUpSuggestions = async (req, res) => {
  try {
    const userId = req.auth?.payload?.sub || req.auth?.userId;
    const { jobId } = req.params;

    // Ensure prediction exists
    await responseTimePredictionService.createOrUpdatePrediction(userId, jobId);

    const suggestions = await responseTimePredictionService.getFollowUpSuggestions(userId, jobId);

    if (!suggestions) {
      return res.status(404).json({ error: 'No prediction found for this job' });
    }

    res.json({
      success: true,
      ...suggestions
    });
  } catch (error) {
    console.error('Error getting follow-up suggestions:', error);
    res.status(500).json({ error: 'Failed to get follow-up suggestions' });
  }
};

/**
 * Get user's prediction accuracy statistics
 */
export const getPredictionAccuracy = async (req, res) => {
  try {
    const userId = req.auth?.payload?.sub || req.auth?.userId;

    const accuracy = await responseTimePredictionService.getUserPredictionAccuracy(userId);

    if (!accuracy) {
      return res.json({
        success: true,
        message: 'No completed predictions yet',
        accuracy: null
      });
    }

    res.json({
      success: true,
      accuracy
    });
  } catch (error) {
    console.error('Error getting prediction accuracy:', error);
    res.status(500).json({ error: 'Failed to get prediction accuracy' });
  }
};

/**
 * Get industry benchmarks
 */
export const getIndustryBenchmarks = async (req, res) => {
  try {
    const { industry } = req.query;

    if (industry) {
      const benchmark = await responseTimePredictionService.getIndustryBenchmark(industry);
      return res.json({
        success: true,
        industry,
        benchmark
      });
    }

    const benchmarks = await responseTimePredictionService.getAllIndustryBenchmarks();

    res.json({
      success: true,
      benchmarks
    });
  } catch (error) {
    console.error('Error getting industry benchmarks:', error);
    res.status(500).json({ error: 'Failed to get industry benchmarks' });
  }
};

/**
 * Mark overdue alert as sent
 */
export const markOverdueAlertSent = async (req, res) => {
  try {
    const userId = req.auth?.payload?.sub || req.auth?.userId;
    const { jobId } = req.params;

    const prediction = await ResponseTimePrediction.findOneAndUpdate(
      { userId, jobId },
      {
        $set: {
          overdueAlertSent: true,
          overdueAlertSentAt: new Date()
        }
      },
      { new: true }
    );

    if (!prediction) {
      return res.status(404).json({ error: 'Prediction not found' });
    }

    res.json({
      success: true,
      message: 'Overdue alert marked as sent'
    });
  } catch (error) {
    console.error('Error marking overdue alert:', error);
    res.status(500).json({ error: 'Failed to mark overdue alert' });
  }
};

/**
 * Mark follow-up reminder as sent
 */
export const markFollowUpReminderSent = async (req, res) => {
  try {
    const userId = req.auth?.payload?.sub || req.auth?.userId;
    const { jobId } = req.params;

    const prediction = await ResponseTimePrediction.findOneAndUpdate(
      { userId, jobId },
      {
        $set: {
          followUpReminderSent: true,
          followUpReminderSentAt: new Date()
        }
      },
      { new: true }
    );

    if (!prediction) {
      return res.status(404).json({ error: 'Prediction not found' });
    }

    res.json({
      success: true,
      message: 'Follow-up reminder marked as sent'
    });
  } catch (error) {
    console.error('Error marking follow-up reminder:', error);
    res.status(500).json({ error: 'Failed to mark follow-up reminder' });
  }
};

/**
 * Get dashboard summary for response time predictions
 */
export const getDashboardSummary = async (req, res) => {
  try {
    const userId = req.auth?.payload?.sub || req.auth?.userId;

    // First, ensure predictions exist for all applied jobs
    const jobs = await Job.find({
      userId,
      status: { $in: ['Applied', 'Phone Screen', 'Interview'] },
      archived: { $ne: true }
    });

    // Create/update predictions for all applied jobs
    for (const job of jobs) {
      try {
        await responseTimePredictionService.createOrUpdatePrediction(userId, job._id);
      } catch (err) {
        console.error(`Error creating prediction for job ${job._id}:`, err);
      }
    }

    // Update overdue status
    await responseTimePredictionService.updateOverdueStatus(userId);

    // Get all pending predictions (now they should exist)
    const pendingPredictions = await ResponseTimePrediction.find({
      userId,
      status: 'pending'
    }).populate('jobId');

    // Get overdue count
    const overdueCount = pendingPredictions.filter(p => p.currentPrediction?.isOverdue).length;

    // Get applications needing follow-up (past suggested follow-up date but not overdue)
    const needFollowUp = pendingPredictions.filter(p => {
      if (!p.currentPrediction?.suggestedFollowUpDate) return false;
      const followUpDate = new Date(p.currentPrediction.suggestedFollowUpDate);
      return followUpDate <= new Date() && !p.currentPrediction.isOverdue;
    }).length;

    // Get prediction accuracy
    const accuracy = await responseTimePredictionService.getUserPredictionAccuracy(userId);

    // Calculate average expected wait time for pending applications
    let totalExpectedDays = 0;
    let countWithPredictions = 0;
    
    pendingPredictions.forEach(p => {
      if (p.currentPrediction?.predictedDaysMedian) {
        const appDate = new Date(p.applicationDate);
        const expectedResponseDate = new Date(appDate);
        expectedResponseDate.setDate(expectedResponseDate.getDate() + p.currentPrediction.predictedDaysMedian);
        
        const daysRemaining = Math.max(0, Math.ceil((expectedResponseDate - new Date()) / (1000 * 60 * 60 * 24)));
        totalExpectedDays += daysRemaining;
        countWithPredictions++;
      }
    });

    const avgExpectedWait = countWithPredictions > 0 
      ? Math.round(totalExpectedDays / countWithPredictions) 
      : null;

    res.json({
      success: true,
      summary: {
        totalPending: pendingPredictions.length,
        overdueCount,
        needFollowUp,
        avgExpectedWaitDays: avgExpectedWait,
        predictionAccuracy: accuracy,
        pendingApplications: pendingPredictions.map(p => ({
          jobId: p.jobId?._id,
          jobTitle: p.jobId?.title,
          companyName: p.companyName,
          applicationDate: p.applicationDate,
          prediction: p.currentPrediction,
          daysSinceApplication: p.applicationDate 
            ? Math.floor((new Date() - new Date(p.applicationDate)) / (1000 * 60 * 60 * 24))
            : null
        }))
      }
    });
  } catch (error) {
    console.error('Error getting dashboard summary:', error);
    res.status(500).json({ error: 'Failed to get dashboard summary' });
  }
};

/**
 * Withdraw/mark application as not waiting for response
 */
export const withdrawApplication = async (req, res) => {
  try {
    const userId = req.auth?.payload?.sub || req.auth?.userId;
    const { jobId } = req.params;

    const prediction = await ResponseTimePrediction.findOneAndUpdate(
      { userId, jobId },
      { $set: { status: 'withdrawn' } },
      { new: true }
    );

    if (!prediction) {
      return res.status(404).json({ error: 'Prediction not found' });
    }

    res.json({
      success: true,
      message: 'Application marked as withdrawn'
    });
  } catch (error) {
    console.error('Error withdrawing application:', error);
    res.status(500).json({ error: 'Failed to withdraw application' });
  }
};
