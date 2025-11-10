import cron from 'node-cron';
import { ApplicationPackage } from '../models/ApplicationPackage.js';
import { Job } from '../models/Job.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create email transporter (same configuration as deadline/interview reminders)
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
 * Process scheduled applications
 * Checks every hour for packages ready to be submitted
 */
const processScheduledApplications = async () => {
  try {
    const now = new Date();
    
    // Find packages scheduled for submission that are due
    const duePackages = await ApplicationPackage.find({
      status: 'scheduled',
      scheduledFor: { $lte: now }
    }).populate('jobId').populate('userId', 'email name');

    console.log(`[Application Scheduler] Found ${duePackages.length} applications ready for submission`);

    for (const pkg of duePackages) {
      try {
        // Update package status to submitted
        pkg.status = 'submitted';
        pkg.submittedAt = now;
        await pkg.save();

        // Update job status
        if (pkg.jobId) {
          await Job.findByIdAndUpdate(pkg.jobId._id, {
            status: 'Applied',
            applicationDate: now
          });
        }

        // Send notification email to user
        if (pkg.metadata?.autoSubmit && process.env.SMTP_USER) {
          const user = pkg.userId;
          const job = pkg.jobId;
          
          try {
            await transporter.sendMail({
              from: process.env.SMTP_FROM || process.env.SMTP_USER,
              to: user.email,
              subject: `Application Submitted: ${job.title} at ${job.company}`,
              html: `
                <h2>Your Application Has Been Submitted 🎉</h2>
                <p>Hi ${user.name || 'there'},</p>
                <p>Your scheduled application has been successfully submitted:</p>
                <ul>
                  <li><strong>Position:</strong> ${job.title}</li>
                  <li><strong>Company:</strong> ${job.company}</li>
                  <li><strong>Submitted:</strong> ${now.toLocaleString()}</li>
                </ul>
                ${pkg.metadata.applicationUrl ? `<p><a href="${pkg.metadata.applicationUrl}">View Application</a></p>` : ''}
                <p>Good luck with your application! 🍀</p>
                <p><em>This is an automated notification from HotSho Job Application Tracker.</em></p>
              `
            });
            console.log(`[Application Scheduler] Notification sent to ${user.email}`);
          } catch (emailError) {
            console.error(`[Application Scheduler] Failed to send notification: ${emailError.message}`);
          }
        }

        console.log(`[Application Scheduler] Submitted application for ${pkg.metadata?.jobTitle} at ${pkg.metadata?.companyName}`);
      } catch (error) {
        console.error(`[Application Scheduler] Error processing package ${pkg._id}:`, error.message);
        // Mark as failed
        pkg.status = 'failed';
        pkg.metadata.failureReason = error.message;
        await pkg.save();
      }
    }
  } catch (error) {
    console.error('[Application Scheduler] Error in scheduled job:', error.message);
  }
};

/**
 * Send follow-up reminders
 * Checks for submitted applications that need follow-ups
 */
const sendFollowUpReminders = async () => {
  try {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Find applications submitted 1 or 2 weeks ago that haven't received follow-up
    const packagesNeedingFollowUp = await ApplicationPackage.find({
      status: 'submitted',
      submittedAt: {
        $gte: twoWeeksAgo,
        $lte: oneWeekAgo
      },
      'metadata.followUpSent': { $ne: true }
    }).populate('jobId').populate('userId', 'email name');

    console.log(`[Follow-Up Scheduler] Found ${packagesNeedingFollowUp.length} applications needing follow-up`);

    for (const pkg of packagesNeedingFollowUp) {
      try {
        const user = pkg.userId;
        const job = pkg.jobId;
        const daysSinceSubmission = Math.floor((now - pkg.submittedAt) / (1000 * 60 * 60 * 24));

        if (process.env.SMTP_USER) {
          await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: user.email,
            subject: `Reminder: Follow up on your application to ${job.company}`,
            html: `
              <h2>Time to Follow Up! 📧</h2>
              <p>Hi ${user.name || 'there'},</p>
              <p>It's been <strong>${daysSinceSubmission} days</strong> since you applied to:</p>
              <ul>
                <li><strong>Position:</strong> ${job.title}</li>
                <li><strong>Company:</strong> ${job.company}</li>
                <li><strong>Applied:</strong> ${pkg.submittedAt.toLocaleDateString()}</li>
              </ul>
              <p>Consider sending a follow-up email to express your continued interest and ask about the status of your application.</p>
              <h3>📝 Template Follow-Up Email:</h3>
              <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
                <p><strong>Subject:</strong> Following Up: [Position Title] Application</p>
                <p>Dear Hiring Manager,</p>
                <p>I hope this email finds you well. I wanted to follow up on my application for the ${job.title} position at ${job.company}, which I submitted on ${pkg.submittedAt.toLocaleDateString()}.</p>
                <p>I remain very interested in this opportunity and would welcome the chance to discuss how my skills and experience align with your needs. Please let me know if you need any additional information from me.</p>
                <p>Thank you for your time and consideration.</p>
                <p>Best regards,<br/>${user.name}</p>
              </div>
              ${pkg.metadata.applicationUrl ? `<p><a href="${pkg.metadata.applicationUrl}">View Original Application</a></p>` : ''}
              <p><em>This is an automated reminder from HotSho Job Application Tracker.</em></p>
            `
          });

          // Mark follow-up as sent
          pkg.metadata.followUpSent = true;
          pkg.metadata.followUpSentAt = now;
          await pkg.save();

          console.log(`[Follow-Up Scheduler] Reminder sent to ${user.email} for ${job.title} at ${job.company}`);
        }
      } catch (error) {
        console.error(`[Follow-Up Scheduler] Error processing package ${pkg._id}:`, error.message);
      }
    }
  } catch (error) {
    console.error('[Follow-Up Scheduler] Error in scheduled job:', error.message);
  }
};

/**
 * Start the application scheduler
 * Runs hourly to check for scheduled applications
 */
export const startApplicationScheduler = () => {
  if (process.env.ENABLE_APPLICATION_SCHEDULER !== 'true') {
    console.log('⏸️  Application scheduler is disabled (ENABLE_APPLICATION_SCHEDULER != true)');
    return;
  }

  // Run every hour at minute 0 (e.g., 9:00, 10:00, 11:00)
  cron.schedule('0 * * * *', processScheduledApplications, {
    scheduled: true,
    timezone: process.env.TZ || 'America/New_York'
  });

  console.log('✅ Application scheduler started (runs every hour)');
  
  // Optionally run once on startup for immediate processing
  if (process.env.RUN_SCHEDULER_ON_STARTUP === 'true') {
    processScheduledApplications();
  }
};

/**
 * Start the follow-up reminder scheduler
 * Runs daily at 10 AM to send follow-up reminders
 */
export const startFollowUpScheduler = () => {
  if (process.env.ENABLE_FOLLOWUP_SCHEDULER !== 'true') {
    console.log('⏸️  Follow-up scheduler is disabled (ENABLE_FOLLOWUP_SCHEDULER != true)');
    return;
  }

  // Run daily at 10:00 AM
  cron.schedule('0 10 * * *', sendFollowUpReminders, {
    scheduled: true,
    timezone: process.env.TZ || 'America/New_York'
  });

  console.log('✅ Follow-up reminder scheduler started (runs daily at 10 AM)');
  
  // Optionally run once on startup
  if (process.env.RUN_SCHEDULER_ON_STARTUP === 'true') {
    sendFollowUpReminders();
  }
};
