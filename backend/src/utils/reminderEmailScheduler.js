import cron from 'node-cron';
import { sendDueReminderEmails } from './reminderEmailService.js';
import dotenv from 'dotenv';

dotenv.config();

let schedulerRunning = false;

/**
 * Start the reminder email scheduler
 * Runs twice daily at 9 AM and 3 PM to send reminder emails
 */
export const startReminderEmailScheduler = () => {
  // Check if scheduler should be enabled
  const enabled = process.env.ENABLE_REMINDER_EMAILS === 'true';
  
  if (!enabled) {
    console.log('⏸️  Reminder email scheduler is disabled (ENABLE_REMINDER_EMAILS != true)');
    return;
  }

  if (schedulerRunning) {
    console.log('⚠️  Reminder email scheduler is already running');
    return;
  }

  // Run twice daily: 9 AM and 3 PM
  // Cron pattern: minute hour day month day-of-week
  // 0 9,15 * * * = At minute 0 past hour 9 and 15 (9 AM and 3 PM)
  const schedule = cron.schedule('0 9,15 * * *', async () => {
    console.log('[Reminder Email Scheduler] Running scheduled reminder email check...');
    try {
      const result = await sendDueReminderEmails();
      console.log(`[Reminder Email Scheduler] Completed: ${result.sent} sent, ${result.skipped} skipped`);
    } catch (error) {
      console.error('[Reminder Email Scheduler] Error:', error.message);
    }
  }, {
    scheduled: true,
    timezone: process.env.SCHEDULER_TIMEZONE || 'America/New_York'
  });

  schedulerRunning = true;
  console.log('✅ Reminder email scheduler started (runs at 9 AM and 3 PM daily)');

  // Run initial check on startup (but wait 30 seconds to let server fully initialize)
  setTimeout(async () => {
    console.log('[Reminder Email Scheduler] Running initial reminder email check...');
    try {
      const result = await sendDueReminderEmails();
      console.log(`[Reminder Email Scheduler] Initial check complete: ${result.sent} sent, ${result.skipped} skipped`);
    } catch (error) {
      console.error('[Reminder Email Scheduler] Initial check error:', error.message);
    }
  }, 30000);

  return schedule;
};

/**
 * Stop the scheduler (for testing or graceful shutdown)
 */
export const stopReminderEmailScheduler = (schedule) => {
  if (schedule) {
    schedule.stop();
    schedulerRunning = false;
    console.log('🛑 Reminder email scheduler stopped');
  }
};

export default {
  startReminderEmailScheduler,
  stopReminderEmailScheduler
};
