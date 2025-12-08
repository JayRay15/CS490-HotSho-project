import { FollowUpReminder } from '../models/FollowUpReminder.js';
import { Job } from '../models/Job.js';
import { ApplicationStatus } from '../models/ApplicationStatus.js';
import FollowUp from '../models/FollowUp.js';

/**
 * Timing configurations for different application stages
 * All values in days unless otherwise specified
 */
const FOLLOW_UP_TIMING = {
  'Applied': {
    type: 'application-follow-up',
    days: 7,
    title: 'Follow up on your application',
    description: 'It\'s been a week since you applied. Consider sending a polite status inquiry.',
    suggestedTemplate: 'status-inquiry',
    priority: 'medium',
    etiquetteTips: [
      { tip: 'Keep it brief and professional', importance: 'critical' },
      { tip: 'Reference your original application date', importance: 'important' },
      { tip: 'Reiterate your interest without being pushy', importance: 'important' },
      { tip: 'Don\'t follow up more than once per week', importance: 'critical' }
    ]
  },
  'Phone Screen': {
    type: 'post-interview-thank-you',
    days: 1, // 24 hours
    title: 'Send thank you note after phone screen',
    description: 'Send a thank you note within 24 hours of your phone screen.',
    suggestedTemplate: 'thank-you',
    priority: 'high',
    etiquetteTips: [
      { tip: 'Send within 24 hours of the interview', importance: 'critical' },
      { tip: 'Reference specific topics discussed', importance: 'important' },
      { tip: 'Keep it concise - 3-4 paragraphs max', importance: 'helpful' },
      { tip: 'Personalize for each interviewer', importance: 'important' }
    ]
  },
  'Technical Interview': {
    type: 'post-interview-thank-you',
    days: 1,
    title: 'Send thank you note after technical interview',
    description: 'Send a thank you note within 24 hours of your technical interview.',
    suggestedTemplate: 'thank-you',
    priority: 'high',
    etiquetteTips: [
      { tip: 'Send within 24 hours of the interview', importance: 'critical' },
      { tip: 'Mention the technical challenges discussed', importance: 'important' },
      { tip: 'Reference how your skills align with their tech stack', importance: 'helpful' },
      { tip: 'Keep technical jargon appropriate to the discussion', importance: 'helpful' }
    ]
  },
  'Onsite Interview': {
    type: 'post-interview-thank-you',
    days: 1,
    title: 'Send thank you notes after onsite interview',
    description: 'Send personalized thank you notes to each interviewer.',
    suggestedTemplate: 'thank-you',
    priority: 'high',
    etiquetteTips: [
      { tip: 'Send individual notes to each interviewer', importance: 'critical' },
      { tip: 'Reference unique aspects of each conversation', importance: 'important' },
      { tip: 'Send within 24 hours', importance: 'critical' },
      { tip: 'Coordinate timing if sending to multiple people', importance: 'helpful' }
    ]
  },
  'Final Interview': {
    type: 'post-interview-thank-you',
    days: 1,
    title: 'Send thank you note after final interview',
    description: 'This is a crucial follow-up. Express your strong interest in the role.',
    suggestedTemplate: 'thank-you',
    priority: 'high',
    etiquetteTips: [
      { tip: 'This is your last chance to make an impression', importance: 'critical' },
      { tip: 'Express genuine enthusiasm for the opportunity', importance: 'critical' },
      { tip: 'Summarize why you\'re the right fit', importance: 'important' },
      { tip: 'Ask about next steps if not already discussed', importance: 'helpful' }
    ]
  },
  'Under Review': {
    type: 'status-inquiry',
    days: 7,
    title: 'Check on application status',
    description: 'Your application is under review. Consider a polite status check.',
    suggestedTemplate: 'status-inquiry',
    priority: 'low',
    etiquetteTips: [
      { tip: 'Be patient - review processes vary by company', importance: 'important' },
      { tip: 'One follow-up per week maximum', importance: 'critical' },
      { tip: 'Keep your message brief and respectful', importance: 'important' },
      { tip: 'Use this time to continue your job search', importance: 'helpful' }
    ]
  },
  'Offer Extended': {
    type: 'offer-response',
    days: 3,
    title: 'Respond to job offer',
    description: 'You have a pending offer. Make sure to respond in a timely manner.',
    suggestedTemplate: 'thank-you',
    priority: 'high',
    etiquetteTips: [
      { tip: 'Respond promptly, even if asking for more time', importance: 'critical' },
      { tip: 'Be professional regardless of your decision', importance: 'critical' },
      { tip: 'If negotiating, be specific and reasonable', importance: 'important' },
      { tip: 'Get verbal agreements in writing', importance: 'important' }
    ]
  },
  'Rejected': {
    type: 'feedback-request',
    days: 3,
    title: 'Request feedback (optional)',
    description: 'Consider requesting feedback to improve for future opportunities.',
    suggestedTemplate: 'feedback-request',
    priority: 'low',
    etiquetteTips: [
      { tip: 'Keep it brief and gracious', importance: 'critical' },
      { tip: 'Don\'t argue or try to change their decision', importance: 'critical' },
      { tip: 'Express interest in future opportunities', importance: 'helpful' },
      { tip: 'This is optional - not all companies provide feedback', importance: 'helpful' }
    ]
  }
};

// Secondary follow-up timing (after initial follow-up)
const SECONDARY_FOLLOW_UP = {
  'post-interview': {
    type: 'status-inquiry',
    days: 3, // 3 days after interview if no response
    title: 'Follow up on interview status',
    description: 'No response yet? Send a polite status inquiry.',
    suggestedTemplate: 'status-inquiry',
    priority: 'medium',
    etiquetteTips: [
      { tip: 'Wait at least 3 days after the interview', importance: 'critical' },
      { tip: 'Reference your previous thank you note', importance: 'helpful' },
      { tip: 'Keep it shorter than your initial follow-up', importance: 'important' },
      { tip: 'Consider this your last follow-up unless they request otherwise', importance: 'important' }
    ]
  }
};

/**
 * Responsiveness-based timing adjustments
 */
const RESPONSIVENESS_ADJUSTMENTS = {
  'highly-responsive': { multiplier: 0.75, description: 'Company responds quickly, follow up sooner' },
  'responsive': { multiplier: 1.0, description: 'Normal timing' },
  'slow': { multiplier: 1.5, description: 'Company is slow to respond, allow more time' },
  'unresponsive': { multiplier: 2.0, description: 'Company rarely responds, consider fewer follow-ups' },
  'unknown': { multiplier: 1.0, description: 'No data yet, use default timing' }
};

/**
 * Get company responsiveness based on past follow-ups
 */
export const getCompanyResponsiveness = async (userId, company) => {
  try {
    // Find all follow-ups for this company
    const followUps = await FollowUp.find({ userId })
      .populate('jobId', 'company')
      .lean();
    
    const companyFollowUps = followUps.filter(f => 
      f.jobId?.company?.toLowerCase() === company?.toLowerCase()
    );
    
    if (companyFollowUps.length === 0) {
      return { responsiveness: 'unknown', avgResponseTime: null, sampleSize: 0 };
    }
    
    const responded = companyFollowUps.filter(f => f.responseReceived);
    const responseRate = responded.length / companyFollowUps.length;
    
    // Calculate average response time for those that responded
    let avgResponseTime = null;
    if (responded.length > 0) {
      const responseTimes = responded
        .filter(f => f.responseReceivedAt && f.sentAt)
        .map(f => {
          const sent = new Date(f.sentAt);
          const received = new Date(f.responseReceivedAt);
          return Math.ceil((received - sent) / (1000 * 60 * 60 * 24));
        });
      
      if (responseTimes.length > 0) {
        avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      }
    }
    
    // Determine responsiveness level
    let responsiveness = 'unknown';
    if (companyFollowUps.length >= 2) {
      if (responseRate >= 0.8 && avgResponseTime && avgResponseTime <= 2) {
        responsiveness = 'highly-responsive';
      } else if (responseRate >= 0.5) {
        responsiveness = avgResponseTime && avgResponseTime <= 5 ? 'responsive' : 'slow';
      } else {
        responsiveness = 'unresponsive';
      }
    }
    
    return {
      responsiveness,
      avgResponseTime,
      sampleSize: companyFollowUps.length,
      responseRate: Math.round(responseRate * 100)
    };
  } catch (error) {
    console.error('Error getting company responsiveness:', error);
    return { responsiveness: 'unknown', avgResponseTime: null, sampleSize: 0 };
  }
};

/**
 * Create a follow-up reminder for a job
 */
export const createFollowUpReminder = async (userId, jobId, options = {}) => {
  try {
    const job = await Job.findOne({ _id: jobId, userId });
    if (!job) {
      throw new Error('Job not found');
    }
    
    // Get application status
    let appStatus = await ApplicationStatus.findOne({ userId, jobId });
    const currentStage = appStatus?.currentStatus || job.status || 'Applied';
    
    // Check if there's already a pending reminder for this stage
    const existingReminder = await FollowUpReminder.findOne({
      userId,
      jobId,
      applicationStage: currentStage,
      status: { $in: ['pending', 'snoozed'] }
    });
    
    if (existingReminder && !options.force) {
      return { existing: true, reminder: existingReminder };
    }
    
    // Get timing configuration for this stage
    const timingConfig = FOLLOW_UP_TIMING[currentStage];
    if (!timingConfig) {
      return { skipped: true, reason: `No follow-up configured for stage: ${currentStage}` };
    }
    
    // Skip reminders for rejected applications (unless explicitly requested)
    if (['Rejected', 'Withdrawn', 'Ghosted'].includes(currentStage) && !options.includeRejected) {
      // Only create feedback request reminder if it's a recent rejection
      if (currentStage === 'Rejected' && !options.feedbackRequest) {
        return { skipped: true, reason: 'Reminders disabled for rejected applications' };
      }
    }
    
    // Get company responsiveness to adjust timing
    const companyResponsiveness = await getCompanyResponsiveness(userId, job.company);
    const adjustment = RESPONSIVENESS_ADJUSTMENTS[companyResponsiveness.responsiveness];
    
    // Calculate adjusted days
    const originalDays = options.days || timingConfig.days;
    const adjustedDays = Math.round(originalDays * adjustment.multiplier);
    
    // Calculate scheduled date
    const scheduledDate = new Date();
    const baseDate = options.baseDate ? new Date(options.baseDate) : new Date();
    scheduledDate.setTime(baseDate.getTime());
    scheduledDate.setDate(scheduledDate.getDate() + adjustedDays);
    
    // Create the reminder
    const reminder = new FollowUpReminder({
      userId,
      jobId,
      applicationStage: currentStage,
      reminderType: options.type || timingConfig.type,
      scheduledDate,
      title: options.title || timingConfig.title,
      description: options.description || timingConfig.description,
      suggestedTemplateType: timingConfig.suggestedTemplate,
      priority: options.priority || timingConfig.priority,
      etiquetteTips: timingConfig.etiquetteTips,
      companyResponsiveness: {
        previousFollowUpCount: await FollowUp.countDocuments({ userId, jobId }),
        responsiveness: companyResponsiveness.responsiveness,
        avgResponseTime: companyResponsiveness.avgResponseTime
      },
      autoGenerated: options.autoGenerated !== false,
      adjustedFrequency: {
        originalDays,
        adjustedDays,
        adjustmentReason: adjustment.description
      }
    });
    
    await reminder.save();
    
    return { created: true, reminder };
  } catch (error) {
    console.error('Error creating follow-up reminder:', error);
    throw error;
  }
};

/**
 * Create secondary follow-up reminder (after interview, if no response)
 */
export const createSecondaryFollowUpReminder = async (userId, jobId, type = 'post-interview') => {
  try {
    const job = await Job.findOne({ _id: jobId, userId });
    if (!job) {
      throw new Error('Job not found');
    }
    
    const config = SECONDARY_FOLLOW_UP[type];
    if (!config) {
      throw new Error(`Invalid secondary follow-up type: ${type}`);
    }
    
    // Check if there's already a secondary reminder
    const existingReminder = await FollowUpReminder.findOne({
      userId,
      jobId,
      reminderType: config.type,
      status: { $in: ['pending', 'snoozed'] }
    });
    
    if (existingReminder) {
      return { existing: true, reminder: existingReminder };
    }
    
    // Get company responsiveness
    const companyResponsiveness = await getCompanyResponsiveness(userId, job.company);
    const adjustment = RESPONSIVENESS_ADJUSTMENTS[companyResponsiveness.responsiveness];
    
    const adjustedDays = Math.round(config.days * adjustment.multiplier);
    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + adjustedDays);
    
    const reminder = new FollowUpReminder({
      userId,
      jobId,
      applicationStage: job.status,
      reminderType: config.type,
      scheduledDate,
      title: config.title,
      description: config.description,
      suggestedTemplateType: config.suggestedTemplate,
      priority: config.priority,
      etiquetteTips: config.etiquetteTips,
      companyResponsiveness: {
        previousFollowUpCount: await FollowUp.countDocuments({ userId, jobId }),
        responsiveness: companyResponsiveness.responsiveness
      },
      autoGenerated: true,
      adjustedFrequency: {
        originalDays: config.days,
        adjustedDays,
        adjustmentReason: adjustment.description
      }
    });
    
    await reminder.save();
    
    return { created: true, reminder };
  } catch (error) {
    console.error('Error creating secondary follow-up reminder:', error);
    throw error;
  }
};

/**
 * Auto-create reminders when application status changes
 */
export const handleStatusChange = async (userId, jobId, newStatus, previousStatus) => {
  try {
    // Disable old reminders for this job if status changed significantly
    if (previousStatus && previousStatus !== newStatus) {
      await FollowUpReminder.updateMany(
        {
          userId,
          jobId,
          status: { $in: ['pending', 'snoozed'] }
        },
        {
          $set: {
            status: 'expired',
            completionNotes: `Status changed from ${previousStatus} to ${newStatus}`
          }
        }
      );
    }
    
    // Don't create new reminders for terminal states (except rejected for feedback)
    if (['Offer Accepted', 'Offer Declined', 'Withdrawn'].includes(newStatus)) {
      return { skipped: true, reason: 'Terminal status, no follow-up needed' };
    }
    
    // Create new reminder for the new status
    const result = await createFollowUpReminder(userId, jobId, {
      includeRejected: newStatus === 'Rejected',
      feedbackRequest: newStatus === 'Rejected'
    });
    
    return result;
  } catch (error) {
    console.error('Error handling status change for reminders:', error);
    throw error;
  }
};

/**
 * Mark reminder as completed when a follow-up is sent
 */
export const markReminderComplete = async (userId, jobId, followUpId) => {
  try {
    const reminder = await FollowUpReminder.findOne({
      userId,
      jobId,
      status: { $in: ['pending', 'snoozed'] }
    }).sort({ scheduledDate: 1 });
    
    if (reminder) {
      reminder.complete('email-sent', 'Follow-up sent', followUpId);
      await reminder.save();
      
      // Create a secondary follow-up reminder if this was a thank-you
      if (reminder.reminderType === 'post-interview-thank-you') {
        await createSecondaryFollowUpReminder(userId, jobId, 'post-interview');
      }
      
      return reminder;
    }
    
    return null;
  } catch (error) {
    console.error('Error marking reminder complete:', error);
    throw error;
  }
};

/**
 * Update company responsiveness when response is received
 */
export const updateResponsivenessOnResponse = async (userId, jobId) => {
  try {
    const reminders = await FollowUpReminder.find({
      userId,
      jobId,
      status: 'completed',
      'companyResponsiveness.responseReceived': false
    });
    
    for (const reminder of reminders) {
      const responseTime = Math.ceil(
        (Date.now() - new Date(reminder.completedAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      reminder.updateResponsiveness(true, responseTime);
      await reminder.save();
    }
    
    return reminders.length;
  } catch (error) {
    console.error('Error updating responsiveness:', error);
    throw error;
  }
};

/**
 * Get all etiquette tips for a specific reminder type
 */
export const getEtiquetteTips = (reminderType) => {
  const tips = {
    'application-follow-up': [
      { tip: 'Wait at least 1-2 weeks after applying before following up', importance: 'critical' },
      { tip: 'Reference your application date and the specific position', importance: 'important' },
      { tip: 'Keep your message concise - 3-4 sentences max', importance: 'important' },
      { tip: 'Don\'t follow up more than twice on the same application', importance: 'critical' },
      { tip: 'Be patient - hiring processes can take time', importance: 'helpful' }
    ],
    'post-interview-thank-you': [
      { tip: 'Send within 24 hours of the interview', importance: 'critical' },
      { tip: 'Reference specific topics discussed in the interview', importance: 'important' },
      { tip: 'Personalize each thank you note for different interviewers', importance: 'important' },
      { tip: 'Keep it professional but warm', importance: 'helpful' },
      { tip: 'Proofread carefully - typos look careless', importance: 'critical' }
    ],
    'post-interview-follow-up': [
      { tip: 'Wait 3-5 business days after your thank you note', importance: 'critical' },
      { tip: 'Keep it brief - you\'re just checking in', importance: 'important' },
      { tip: 'Don\'t sound desperate or pushy', importance: 'critical' },
      { tip: 'Reference the timeline they gave you, if any', importance: 'helpful' },
      { tip: 'One follow-up is usually enough', importance: 'important' }
    ],
    'status-inquiry': [
      { tip: 'Be respectful of their time', importance: 'critical' },
      { tip: 'Express continued interest without being pushy', importance: 'important' },
      { tip: 'Offer to provide additional information if needed', importance: 'helpful' },
      { tip: 'Accept that some companies don\'t respond', importance: 'helpful' },
      { tip: 'Know when to move on - don\'t over-follow-up', importance: 'critical' }
    ],
    'feedback-request': [
      { tip: 'Thank them for the opportunity regardless of outcome', importance: 'critical' },
      { tip: 'Be gracious - don\'t argue with their decision', importance: 'critical' },
      { tip: 'Frame feedback request as growth-oriented', importance: 'important' },
      { tip: 'Not all companies provide feedback - don\'t take it personally', importance: 'helpful' },
      { tip: 'Keep the door open for future opportunities', importance: 'helpful' }
    ],
    'offer-response': [
      { tip: 'Respond promptly, even if you need more time to decide', importance: 'critical' },
      { tip: 'Be professional regardless of your decision', importance: 'critical' },
      { tip: 'If negotiating, be specific and reasonable', importance: 'important' },
      { tip: 'Get any verbal agreements in writing', importance: 'important' },
      { tip: 'Don\'t burn bridges - you never know the future', importance: 'helpful' }
    ],
    'networking-follow-up': [
      { tip: 'Focus on building the relationship, not asking for favors', importance: 'critical' },
      { tip: 'Be genuine in your interest in their work', importance: 'important' },
      { tip: 'Offer value before asking for anything', importance: 'important' },
      { tip: 'Connect on LinkedIn for long-term networking', importance: 'helpful' },
      { tip: 'Follow up periodically to maintain the connection', importance: 'helpful' }
    ]
  };
  
  return tips[reminderType] || tips['status-inquiry'];
};

export default {
  createFollowUpReminder,
  createSecondaryFollowUpReminder,
  handleStatusChange,
  markReminderComplete,
  updateResponsivenessOnResponse,
  getCompanyResponsiveness,
  getEtiquetteTips,
  FOLLOW_UP_TIMING,
  RESPONSIVENESS_ADJUSTMENTS
};
