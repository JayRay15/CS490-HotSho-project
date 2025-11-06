import cron from "node-cron";
import { Interview } from "../models/Interview.js";
import { User } from "../models/User.js";
import { sendInterviewReminderEmail } from "./email.js";

/**
 * sendInterviewRemindersNow - Send interview reminders for upcoming interviews
 * This function is called by the cron job and can also be called manually
 */
export const sendInterviewRemindersNow = async () => {
  try {
    console.log("📧 Starting interview reminder check...");
    
    const now = new Date();
    const reminderThresholds = [
      { hours: 24, label: "24 hours" },
      { hours: 2, label: "2 hours" },
      { hours: 1, label: "1 hour" },
    ];
    
    let totalRemindersSent = 0;
    
    for (const threshold of reminderThresholds) {
      // Calculate the time window for this reminder
      const targetTime = new Date(now.getTime() + threshold.hours * 60 * 60 * 1000);
      const windowStart = new Date(targetTime.getTime() - 15 * 60 * 1000); // 15 minutes before
      const windowEnd = new Date(targetTime.getTime() + 15 * 60 * 1000); // 15 minutes after
      
      // Find interviews that are scheduled within this window
      const interviews = await Interview.find({
        scheduledDate: {
          $gte: windowStart,
          $lte: windowEnd,
        },
        status: { $in: ["Scheduled", "Confirmed", "Rescheduled"] },
        "reminders.enabled": true,
        cancelled: { isCancelled: false },
      }).populate("jobId", "title company");
      
      console.log(`Found ${interviews.length} interviews needing ${threshold.label} reminder`);
      
      for (const interview of interviews) {
        try {
          // Check if we've already sent this specific reminder type
          const reminderType = `${threshold.hours}h`;
          const alreadySent = interview.reminders.remindersSent?.some(
            r => r.type === reminderType && 
            new Date(r.sentAt).toDateString() === now.toDateString()
          );
          
          if (alreadySent) {
            console.log(`  ⏭️ Skipping ${reminderType} reminder for interview ${interview._id} - already sent today`);
            continue;
          }
          
          // Get user details for email
          const user = await User.findOne({ auth0Id: interview.userId });
          
          if (!user || !user.email) {
            console.log(`  ⚠️ User not found for interview ${interview._id}`);
            continue;
          }
          
          // Send reminder email
          await sendInterviewReminderEmail(
            user.email,
            user.name,
            interview,
            threshold.hours
          );
          
          // Record that we sent this reminder
          if (!interview.reminders.remindersSent) {
            interview.reminders.remindersSent = [];
          }
          
          interview.reminders.remindersSent.push({
            sentAt: now,
            type: reminderType,
          });
          
          interview.reminders.lastReminderSent = now;
          await interview.save();
          
          totalRemindersSent++;
          console.log(`  ✅ Sent ${threshold.label} reminder to ${user.email} for ${interview.title}`);
        } catch (error) {
          console.error(`  ❌ Failed to send reminder for interview ${interview._id}:`, error.message);
        }
      }
    }
    
    console.log(`✅ Interview reminder check completed. Sent ${totalRemindersSent} reminders.`);
    
    return {
      success: true,
      remindersSent: totalRemindersSent,
      timestamp: now.toISOString(),
    };
  } catch (error) {
    console.error("❌ Error in sendInterviewRemindersNow:", error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
};

/**
 * startInterviewReminderSchedule - Start the cron job for interview reminders
 * Runs every 15 minutes to check for upcoming interviews
 */
export const startInterviewReminderSchedule = () => {
  const INTERVIEW_REMINDERS_ENABLED = process.env.INTERVIEW_REMINDERS_ENABLED !== "false";
  
  if (!INTERVIEW_REMINDERS_ENABLED) {
    console.log("⏸️ Interview reminders are disabled via environment variable");
    return null;
  }
  
  console.log("⏰ Starting interview reminder schedule (runs every 15 minutes)");
  
  // Run every 15 minutes: "*/15 * * * *"
  // This gives us enough frequency to catch reminders in their time windows
  const task = cron.schedule("*/15 * * * *", async () => {
    console.log("⏰ Running scheduled interview reminder check...");
    await sendInterviewRemindersNow();
  });
  
  // Run immediately on startup (optional)
  if (process.env.RUN_REMINDERS_ON_STARTUP === "true") {
    console.log("▶️ Running initial interview reminder check on startup...");
    sendInterviewRemindersNow().catch(err => {
      console.error("❌ Failed to run initial interview reminder check:", err);
    });
  }
  
  console.log("✅ Interview reminder schedule started successfully");
  return task;
};

/**
 * checkForConflicts - Check for scheduling conflicts for a user
 * @param {string} userId - User ID
 * @param {Date} proposedDate - Proposed interview date
 * @param {number} duration - Interview duration in minutes
 * @param {string} excludeInterviewId - Interview ID to exclude from check (for rescheduling)
 * @returns {Promise<Array>} Array of conflicting interviews
 */
export const checkForConflicts = async (userId, proposedDate, duration = 60, excludeInterviewId = null) => {
  try {
    const checkDate = new Date(proposedDate);
    const startBuffer = new Date(checkDate.getTime() - 60 * 60 * 1000); // 1 hour before
    const endBuffer = new Date(checkDate.getTime() + duration * 60 * 1000 + 60 * 60 * 1000); // duration + 1 hour after
    
    const filter = {
      userId,
      status: { $in: ["Scheduled", "Confirmed", "Rescheduled"] },
      scheduledDate: {
        $gte: startBuffer,
        $lte: endBuffer,
      },
      "cancelled.isCancelled": false,
    };
    
    if (excludeInterviewId) {
      filter._id = { $ne: excludeInterviewId };
    }
    
    const conflicts = await Interview.find(filter)
      .populate("jobId", "title company")
      .sort({ scheduledDate: 1 });
    
    return conflicts;
  } catch (error) {
    console.error("Error checking for conflicts:", error);
    throw error;
  }
};

/**
 * getUpcomingInterviewSummary - Get a summary of upcoming interviews for a user
 * @param {string} userId - User ID
 * @param {number} days - Number of days to look ahead (default: 7)
 * @returns {Promise<Object>} Summary of upcoming interviews
 */
export const getUpcomingInterviewSummary = async (userId, days = 7) => {
  try {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    
    const interviews = await Interview.find({
      userId,
      scheduledDate: {
        $gte: now,
        $lte: futureDate,
      },
      status: { $in: ["Scheduled", "Confirmed", "Rescheduled"] },
      "cancelled.isCancelled": false,
    })
      .populate("jobId", "title company status")
      .sort({ scheduledDate: 1 });
    
    // Group by day
    const byDay = {};
    interviews.forEach(interview => {
      const day = new Date(interview.scheduledDate).toDateString();
      if (!byDay[day]) {
        byDay[day] = [];
      }
      byDay[day].push(interview);
    });
    
    // Calculate statistics
    const stats = {
      total: interviews.length,
      byType: {},
      byStatus: {},
      withIncompleteTasks: 0,
      withConflicts: 0,
    };
    
    interviews.forEach(interview => {
      // Count by type
      stats.byType[interview.interviewType] = (stats.byType[interview.interviewType] || 0) + 1;
      
      // Count by status
      stats.byStatus[interview.status] = (stats.byStatus[interview.status] || 0) + 1;
      
      // Count incomplete tasks
      const incompleteTasks = interview.preparationTasks?.filter(t => !t.completed).length || 0;
      if (incompleteTasks > 0) {
        stats.withIncompleteTasks++;
      }
      
      // Count conflicts
      if (interview.conflictWarning?.hasConflict) {
        stats.withConflicts++;
      }
    });
    
    return {
      interviews,
      byDay,
      stats,
      days,
    };
  } catch (error) {
    console.error("Error getting upcoming interview summary:", error);
    throw error;
  }
};

export default {
  sendInterviewRemindersNow,
  startInterviewReminderSchedule,
  checkForConflicts,
  getUpcomingInterviewSummary,
};
