import FollowUp from '../models/FollowUp.js';
import { Job } from '../models/Job.js';

/**
 * Create a new follow-up record
 */
export const createFollowUp = async (req, res) => {
  try {
    const userId = req.auth?.userId || req.auth?.payload?.sub;
    const { jobId, templateType, subject, body, interviewDetails } = req.body;

    console.log('Creating follow-up:', { userId, jobId, templateType });
    console.log('req.auth:', req.auth);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User ID not found in authentication token'
      });
    }

    // Validate job belongs to user
    const job = await Job.findOne({ _id: jobId, userId });
    if (!job) {
      console.log('Job not found:', { jobId, userId });
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Create follow-up record
    const followUp = new FollowUp({
      userId,
      jobId,
      templateType,
      subject,
      body,
      interviewDetails,
      sentAt: new Date()
    });

    await followUp.save();

    res.status(201).json({
      success: true,
      message: 'Follow-up recorded successfully',
      data: followUp
    });
  } catch (error) {
    console.error('Error creating follow-up:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create follow-up record',
      error: error.message
    });
  }
};

/**
 * Get all follow-ups for a specific job
 */
export const getJobFollowUps = async (req, res) => {
  try {
    const userId = req.auth?.userId || req.auth?.payload?.sub;
    const { jobId } = req.params;

    // Validate job belongs to user
    const job = await Job.findOne({ _id: jobId, userId });
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    const followUps = await FollowUp.find({ userId, jobId })
      .sort({ sentAt: -1 });

    res.json({
      success: true,
      data: followUps
    });
  } catch (error) {
    console.error('Error fetching follow-ups:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch follow-ups',
      error: error.message
    });
  }
};

/**
 * Get all follow-ups for a user
 */
export const getAllFollowUps = async (req, res) => {
  try {
    const userId = req.auth?.userId || req.auth?.payload?.sub;

    const followUps = await FollowUp.find({ userId })
      .populate('jobId', 'title company')
      .sort({ sentAt: -1 });

    res.json({
      success: true,
      data: followUps
    });
  } catch (error) {
    console.error('Error fetching all follow-ups:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch follow-ups',
      error: error.message
    });
  }
};

/**
 * Update follow-up response status
 */
export const updateFollowUpResponse = async (req, res) => {
  try {
    const userId = req.auth?.userId || req.auth?.payload?.sub;
    const { followUpId } = req.params;
    const { received } = req.body;

    const followUp = await FollowUp.findOne({ _id: followUpId, userId });
    if (!followUp) {
      return res.status(404).json({
        success: false,
        message: 'Follow-up not found'
      });
    }

    followUp.responseReceived = received;
    if (received) {
      followUp.responseReceivedAt = new Date();
    } else {
      followUp.responseReceivedAt = null;
    }

    await followUp.save();

    res.json({
      success: true,
      message: 'Follow-up updated successfully',
      data: followUp
    });
  } catch (error) {
    console.error('Error updating follow-up:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update follow-up',
      error: error.message
    });
  }
};

/**
 * Get follow-up statistics for a specific job
 */
export const getJobFollowUpStats = async (req, res) => {
  try {
    const userId = req.auth?.userId || req.auth?.payload?.sub;
    const { jobId } = req.params;

    // Validate job belongs to user
    const job = await Job.findOne({ _id: jobId, userId });
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    const followUps = await FollowUp.find({ userId, jobId });
    const sent = followUps.length;
    const responded = followUps.filter(f => f.responseReceived).length;
    const responseRate = sent > 0 ? Math.round((responded / sent) * 100) : 0;

    res.json({
      success: true,
      data: {
        sent,
        responded,
        responseRate
      }
    });
  } catch (error) {
    console.error('Error fetching follow-up stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};

/**
 * Get overall follow-up statistics for user
 */
export const getOverallStats = async (req, res) => {
  try {
    const userId = req.auth?.userId || req.auth?.payload?.sub;

    const followUps = await FollowUp.find({ userId });
    const sent = followUps.length;
    const responded = followUps.filter(f => f.responseReceived).length;
    const responseRate = sent > 0 ? Math.round((responded / sent) * 100) : 0;

    // Statistics by template type
    const byType = {};
    const types = ['thank-you', 'status-inquiry', 'feedback-request', 'networking'];
    
    types.forEach(type => {
      const typeFollowUps = followUps.filter(f => f.templateType === type);
      const typeSent = typeFollowUps.length;
      const typeResponded = typeFollowUps.filter(f => f.responseReceived).length;
      byType[type] = {
        sent: typeSent,
        responded: typeResponded,
        responseRate: typeSent > 0 ? Math.round((typeResponded / typeSent) * 100) : 0
      };
    });

    res.json({
      success: true,
      data: {
        overall: {
          sent,
          responded,
          responseRate
        },
        byType
      }
    });
  } catch (error) {
    console.error('Error fetching overall stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};

/**
 * Delete a follow-up record
 */
export const deleteFollowUp = async (req, res) => {
  try {
    const userId = req.auth?.userId || req.auth?.payload?.sub;
    const { followUpId } = req.params;

    const followUp = await FollowUp.findOneAndDelete({ _id: followUpId, userId });
    if (!followUp) {
      return res.status(404).json({
        success: false,
        message: 'Follow-up not found'
      });
    }

    res.json({
      success: true,
      message: 'Follow-up deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting follow-up:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete follow-up',
      error: error.message
    });
  }
};
