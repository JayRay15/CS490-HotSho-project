import cron from 'node-cron';
import { ApplicationStatus } from '../models/ApplicationStatus.js';
import { sendFollowUpReminder, sendStalledApplicationsAlert } from './statusNotifications.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Check for applications needing follow-up
 * Runs daily to send reminders for applications without recent updates
 */
const checkFollowUpReminders = async () => {
  try {
    console.log('[Status Automation] Checking for follow-up reminders...');

    const now = new Date();
    
    // Find applications that need follow-up based on automation settings
    const needsFollowUp = await ApplicationStatus.find({
      'automation.autoFollowUp.enabled': true,
      currentStatus: { $in: ['Applied', 'Under Review', 'Phone Screen', 'Technical Interview'] },
      $expr: {
        $gte: [
          {
            $divide: [
              { $subtract: [now, '$lastStatusChange'] },
              1000 * 60 * 60 * 24 // Convert to days
            ]
          },
          '$automation.autoFollowUp.daysAfterApplication'
        ]
      },
      $or: [
        { 'automation.autoFollowUp.lastFollowUpSent': { $exists: false } },
        {
          $expr: {
            $gte: [
              {
                $divide: [
                  { $subtract: [now, '$automation.autoFollowUp.lastFollowUpSent'] },
                  1000 * 60 * 60 * 24
                ]
              },
              7 // Send follow-up reminder every 7 days
            ]
          }
        }
      ]
    }).populate('jobId', 'title company');

    console.log(`[Status Automation] Found ${needsFollowUp.length} applications needing follow-up`);

    for (const status of needsFollowUp) {
      try {
        if (status.notifications.followUpReminder) {
          await sendFollowUpReminder(status.userId, status);
          
          // Update last follow-up sent time
          status.automation.autoFollowUp.lastFollowUpSent = now;
          status.metrics.followUpCount += 1;
          
          // Add timeline event
          status.addTimelineEvent(
            'follow_up_sent',
            'Follow-up reminder sent',
            { automated: true }
          );
          
          await status.save();
        }
      } catch (error) {
        console.error(`[Status Automation] Error sending follow-up for ${status._id}:`, error.message);
      }
    }
  } catch (error) {
    console.error('[Status Automation] Error in follow-up check:', error.message);
  }
};

/**
 * Detect and alert on stalled applications
 * Applications with no updates for 14+ days
 */
const detectStalledApplications = async () => {
  try {
    console.log('[Status Automation] Checking for stalled applications...');

    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    // Group stalled applications by user
    const stalledByUser = await ApplicationStatus.aggregate([
      {
        $match: {
          currentStatus: { $in: ['Applied', 'Under Review', 'Phone Screen', 'Technical Interview'] },
          lastStatusChange: { $lte: fourteenDaysAgo },
          'notifications.stalledApplicationAlert': true,
          $or: [
            { 'notifications.lastNotificationSent': { $exists: false } },
            { 'notifications.lastNotificationSent': { $lte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
          ]
        }
      },
      {
        $lookup: {
          from: 'jobs',
          localField: 'jobId',
          foreignField: '_id',
          as: 'jobId'
        }
      },
      {
        $unwind: '$jobId'
      },
      {
        $group: {
          _id: '$userId',
          applications: {
            $push: {
              _id: '$_id',
              jobId: '$jobId',
              currentStatus: '$currentStatus',
              lastStatusChange: '$lastStatusChange',
              daysSinceStatusChange: {
                $divide: [
                  { $subtract: [new Date(), '$lastStatusChange'] },
                  1000 * 60 * 60 * 24
                ]
              }
            }
          }
        }
      }
    ]);

    console.log(`[Status Automation] Found ${stalledByUser.length} users with stalled applications`);

    for (const userGroup of stalledByUser) {
      try {
        const userId = userGroup._id;
        const stalledApps = userGroup.applications;

        // Send alert
        await sendStalledApplicationsAlert(userId, stalledApps);

        // Update notification sent timestamp
        await ApplicationStatus.updateMany(
          { _id: { $in: stalledApps.map(a => a._id) } },
          { 'notifications.lastNotificationSent': new Date() }
        );

      } catch (error) {
        console.error(`[Status Automation] Error alerting user ${userGroup._id}:`, error.message);
      }
    }
  } catch (error) {
    console.error('[Status Automation] Error detecting stalled applications:', error.message);
  }
};

/**
 * Auto-detect "Ghosted" status
 * Mark applications as ghosted after 30 days with no response
 */
const detectGhostedApplications = async () => {
  try {
    console.log('[Status Automation] Checking for ghosted applications...');

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const potentiallyGhosted = await ApplicationStatus.find({
      currentStatus: { $in: ['Applied', 'Under Review'] },
      lastStatusChange: { $lte: thirtyDaysAgo },
      'automation.autoStatusDetection.enabled': true
    }).populate('jobId', 'title company');

    console.log(`[Status Automation] Found ${potentiallyGhosted.length} potentially ghosted applications`);

    for (const status of potentiallyGhosted) {
      try {
        const requireConfirmation = status.automation.autoStatusDetection.requireConfirmation;

        if (!requireConfirmation) {
          // Auto-update to Ghosted
          status.updateStatus('Ghosted', {
            changedBy: 'automation',
            notes: 'Automatically marked as ghosted after 30 days with no response'
          });

          await status.save();

          console.log(`[Status Automation] Auto-ghosted: ${status.jobId.title} at ${status.jobId.company}`);
        } else {
          // Send notification for user to confirm
          // This would integrate with in-app notifications
          status.addTimelineEvent(
            'note_added',
            'Application may be ghosted - no response in 30+ days',
            { requiresAction: true, automated: true }
          );

          await status.save();
        }
      } catch (error) {
        console.error(`[Status Automation] Error processing ghosted status for ${status._id}:`, error.message);
      }
    }
  } catch (error) {
    console.error('[Status Automation] Error detecting ghosted applications:', error.message);
  }
};

/**
 * Update application metrics
 * Recalculate days in status, total days in process, etc.
 */
const updateApplicationMetrics = async () => {
  try {
    console.log('[Status Automation] Updating application metrics...');

    const allStatuses = await ApplicationStatus.find({});

    for (const status of allStatuses) {
      try {
        const now = Date.now();

        if (status.lastStatusChange) {
          status.metrics.daysInCurrentStatus = Math.floor(
            (now - status.lastStatusChange) / (1000 * 60 * 60 * 24)
          );
        }

        if (status.appliedAt) {
          status.metrics.totalDaysInProcess = Math.floor(
            (now - status.appliedAt) / (1000 * 60 * 60 * 24)
          );
        }

        await status.save();
      } catch (error) {
        console.error(`[Status Automation] Error updating metrics for ${status._id}:`, error.message);
      }
    }

    console.log(`[Status Automation] Updated metrics for ${allStatuses.length} applications`);
  } catch (error) {
    console.error('[Status Automation] Error updating metrics:', error.message);
  }
};

/**
 * Generate next action suggestions
 * Update suggested next actions based on current status and time elapsed
 */
const generateNextActionSuggestions = async () => {
  try {
    console.log('[Status Automation] Generating next action suggestions...');

    const activeStatuses = await ApplicationStatus.find({
      currentStatus: { 
        $nin: ['Offer Accepted', 'Offer Declined', 'Rejected', 'Withdrawn'] 
      }
    });

    for (const status of activeStatuses) {
      try {
        const daysSinceChange = Math.floor(
          (Date.now() - status.lastStatusChange) / (1000 * 60 * 60 * 24)
        );

        let nextAction = '';
        let nextActionDate = null;

        switch (status.currentStatus) {
          case 'Applied':
            if (daysSinceChange >= 7) {
              nextAction = 'Send follow-up email expressing continued interest';
              nextActionDate = new Date();
            }
            break;

          case 'Under Review':
            if (daysSinceChange >= 10) {
              nextAction = 'Check in on application status';
              nextActionDate = new Date();
            }
            break;

          case 'Phone Screen':
            if (daysSinceChange >= 3 && daysSinceChange < 7) {
              nextAction = 'Send thank-you note and request timeline update';
              nextActionDate = new Date();
            } else if (daysSinceChange >= 7) {
              nextAction = 'Follow up on next steps';
              nextActionDate = new Date();
            }
            break;

          case 'Technical Interview':
          case 'Onsite Interview':
            if (daysSinceChange >= 5) {
              nextAction = 'Follow up on interview and request timeline';
              nextActionDate = new Date();
            }
            break;

          case 'Final Interview':
            if (daysSinceChange >= 7) {
              nextAction = 'Follow up on final decision';
              nextActionDate = new Date();
            }
            break;

          case 'Offer Extended':
            if (daysSinceChange >= 3) {
              nextAction = 'Review and respond to offer';
              nextActionDate = new Date();
            }
            break;
        }

        if (nextAction && !status.nextAction) {
          status.nextAction = nextAction;
          status.nextActionDate = nextActionDate;
          await status.save();
        }
      } catch (error) {
        console.error(`[Status Automation] Error generating suggestions for ${status._id}:`, error.message);
      }
    }

    console.log(`[Status Automation] Generated suggestions for ${activeStatuses.length} applications`);
  } catch (error) {
    console.error('[Status Automation] Error generating suggestions:', error.message);
  }
};

/**
 * Start the status automation scheduler
 */
export const startStatusAutomationScheduler = () => {
  if (process.env.ENABLE_STATUS_AUTOMATION !== 'true') {
    console.log('⏸️  Status automation scheduler is disabled (ENABLE_STATUS_AUTOMATION != true)');
    return;
  }

  // Run follow-up reminders daily at 9 AM
  cron.schedule('0 9 * * *', checkFollowUpReminders, {
    scheduled: true,
    timezone: process.env.TZ || 'America/New_York'
  });

  // Check for stalled applications daily at 10 AM
  cron.schedule('0 10 * * *', detectStalledApplications, {
    scheduled: true,
    timezone: process.env.TZ || 'America/New_York'
  });

  // Detect ghosted applications daily at 11 AM
  cron.schedule('0 11 * * *', detectGhostedApplications, {
    scheduled: true,
    timezone: process.env.TZ || 'America/New_York'
  });

  // Update metrics every 6 hours
  cron.schedule('0 */6 * * *', updateApplicationMetrics, {
    scheduled: true,
    timezone: process.env.TZ || 'America/New_York'
  });

  // Generate next action suggestions daily at 8 AM
  cron.schedule('0 8 * * *', generateNextActionSuggestions, {
    scheduled: true,
    timezone: process.env.TZ || 'America/New_York'
  });

  console.log('✅ Status automation scheduler started');
  console.log('   - Follow-up reminders: Daily at 9 AM');
  console.log('   - Stalled applications check: Daily at 10 AM');
  console.log('   - Ghosted detection: Daily at 11 AM');
  console.log('   - Metrics update: Every 6 hours');
  console.log('   - Next actions: Daily at 8 AM');

  // Optionally run once on startup
  if (process.env.RUN_STATUS_AUTOMATION_ON_STARTUP === 'true') {
    console.log('▶️  Running status automation tasks on startup...');
    updateApplicationMetrics();
    generateNextActionSuggestions();
  }
};

export default {
  startStatusAutomationScheduler,
  checkFollowUpReminders,
  detectStalledApplications,
  detectGhostedApplications,
  updateApplicationMetrics,
  generateNextActionSuggestions
};
