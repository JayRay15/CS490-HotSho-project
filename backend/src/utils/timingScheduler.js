import cron from 'node-cron';
import { ApplicationTiming } from '../models/ApplicationTiming.js';
import { Job } from '../models/Job.js';
import { User } from '../models/User.js';
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
 * Process scheduled application timing submissions
 * Checks every hour for timing records ready for submission/reminder
 */
const processScheduledTimings = async () => {
  try {
    const now = new Date();
    
    // Find timing records with scheduled submissions that are due
    const dueTimings = await ApplicationTiming.find({
      'scheduledSubmission.status': 'scheduled',
      'scheduledSubmission.scheduledTime': { $lte: now }
    });

    console.log(`[Timing Scheduler] Found ${dueTimings.length} scheduled submissions ready to process`);

    for (const timing of dueTimings) {
      try {
        const job = await Job.findById(timing.jobId);
        const user = await User.findOne({ clerkId: timing.userId });

        if (!job || !user) {
          console.log(`[Timing Scheduler] Skipping - job or user not found for timing ${timing._id}`);
          continue;
        }

        if (timing.scheduledSubmission.autoSubmit) {
          // AUTO-SUBMIT: Update job status to Applied
          await Job.findByIdAndUpdate(job._id, {
            status: 'Applied',
            applicationDate: now
          });

          // Record the submission in timing history
          await timing.recordSubmission({
            submittedAt: now,
            dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long' }),
            hourOfDay: now.getHours(),
            wasScheduled: true,
            followedRecommendation: true
          });

          // Send confirmation email
          if (process.env.SMTP_USER && user.email) {
            try {
              await transporter.sendMail({
                from: process.env.SMTP_FROM || process.env.SMTP_USER,
                to: user.email,
                subject: `✅ Application Auto-Submitted: ${job.title} at ${job.company}`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2563eb;">Application Submitted Successfully! 🎉</h2>
                    <p>Hi ${user.name || 'there'},</p>
                    <p>Your application has been automatically submitted at the optimal time:</p>
                    <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 16px 0;">
                      <p style="margin: 8px 0;"><strong>Position:</strong> ${job.title}</p>
                      <p style="margin: 8px 0;"><strong>Company:</strong> ${job.company}</p>
                      <p style="margin: 8px 0;"><strong>Submitted:</strong> ${now.toLocaleString()}</p>
                      <p style="margin: 8px 0;"><strong>Day:</strong> ${now.toLocaleDateString('en-US', { weekday: 'long' })}</p>
                      <p style="margin: 8px 0;"><strong>Time:</strong> ${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</p>
                    </div>
                    <p>✨ This submission was scheduled using our <strong>Timing Optimizer</strong> for maximum response rate.</p>
                    <p>Good luck with your application! 🍀</p>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
                    <p style="color: #6b7280; font-size: 12px;"><em>This is an automated notification from HotSho Job Application Tracker.</em></p>
                  </div>
                `
              });
              console.log(`[Timing Scheduler] Auto-submit confirmation sent to ${user.email}`);
            } catch (emailError) {
              console.error(`[Timing Scheduler] Failed to send email: ${emailError.message}`);
            }
          }

          console.log(`[Timing Scheduler] ✅ Auto-submitted application for ${job.title} at ${job.company}`);
        } else {
          // REMINDER ONLY: Send reminder email
          if (process.env.SMTP_USER && user.email && !timing.scheduledSubmission.reminderSent) {
            try {
              await transporter.sendMail({
                from: process.env.SMTP_FROM || process.env.SMTP_USER,
                to: user.email,
                subject: `⏰ Reminder: Submit Application to ${job.company}`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #f59e0b;">Time to Submit Your Application! ⏰</h2>
                    <p>Hi ${user.name || 'there'},</p>
                    <p>This is your scheduled reminder to submit your application at the optimal time:</p>
                    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 16px 0;">
                      <p style="margin: 8px 0;"><strong>Position:</strong> ${job.title}</p>
                      <p style="margin: 8px 0;"><strong>Company:</strong> ${job.company}</p>
                      <p style="margin: 8px 0;"><strong>Industry:</strong> ${job.industry || 'N/A'}</p>
                      ${job.applicationUrl ? `<p style="margin: 8px 0;"><strong>Application Link:</strong> <a href="${job.applicationUrl}" style="color: #2563eb;">${job.applicationUrl}</a></p>` : ''}
                    </div>
                    <div style="background: #dbeafe; border-radius: 8px; padding: 16px; margin: 16px 0;">
                      <h3 style="color: #1e40af; margin-top: 0;">💡 Why Submit Now?</h3>
                      <p style="margin: 8px 0;">Our Timing Optimizer has determined this is an optimal time to submit based on:</p>
                      <ul style="margin: 8px 0; padding-left: 24px;">
                        <li>Industry hiring patterns</li>
                        <li>Day of week analysis</li>
                        <li>Time of day effectiveness</li>
                        <li>Your historical success rates</li>
                      </ul>
                    </div>
                    <p><strong>📝 Quick Action:</strong> Log into HotSho and update your application status to "Applied" once submitted.</p>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
                    <p style="color: #6b7280; font-size: 12px;"><em>This is a scheduled reminder from HotSho Job Application Tracker.</em></p>
                  </div>
                `
              });

              timing.scheduledSubmission.reminderSent = true;
              await timing.save();

              console.log(`[Timing Scheduler] 📧 Reminder sent to ${user.email} for ${job.title} at ${job.company}`);
            } catch (emailError) {
              console.error(`[Timing Scheduler] Failed to send reminder: ${emailError.message}`);
            }
          }
        }

        // Update timing record status
        timing.scheduledSubmission.status = timing.scheduledSubmission.autoSubmit ? 'submitted' : 'reminded';
        timing.scheduledSubmission.submittedAt = now;
        await timing.save();

      } catch (error) {
        console.error(`[Timing Scheduler] Error processing timing ${timing._id}:`, error.message);
        
        // Mark as failed
        timing.scheduledSubmission.status = 'failed';
        timing.scheduledSubmission.failureReason = error.message;
        await timing.save();
      }
    }

    if (dueTimings.length > 0) {
      console.log(`[Timing Scheduler] ✅ Processed ${dueTimings.length} scheduled submissions`);
    }
  } catch (error) {
    console.error('[Timing Scheduler] Error in scheduled job:', error.message);
  }
};

/**
 * Start the timing scheduler
 * Runs every 15 minutes to check for scheduled submissions
 */
export const startTimingScheduler = () => {
  if (process.env.ENABLE_TIMING_SCHEDULER !== 'true') {
    console.log('⏸️  Timing scheduler is disabled (ENABLE_TIMING_SCHEDULER != true)');
    return;
  }

  // Run every 15 minutes
  cron.schedule('*/15 * * * *', processScheduledTimings, {
    scheduled: true,
    timezone: process.env.TZ || 'America/New_York'
  });

  console.log('✅ Timing scheduler started (runs every 15 minutes)');
  
  // Optionally run once on startup
  if (process.env.RUN_SCHEDULER_ON_STARTUP === 'true') {
    setTimeout(processScheduledTimings, 5000); // Run after 5 seconds
  }
};

export default { startTimingScheduler, processScheduledTimings };
