import nodemailer from 'nodemailer';
import { User } from '../models/User.js';
import { FollowUpReminder } from '../models/FollowUpReminder.js';
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
 * Send reminder notification email
 * @param {string} userId - User's Clerk ID
 * @param {Object} reminder - FollowUpReminder document
 */
export const sendReminderEmail = async (userId, reminder) => {
  try {
    if (!process.env.SMTP_USER) {
      console.log('[Reminder Emails] SMTP not configured, skipping email');
      return;
    }

    const user = await User.findOne({ auth0Id: userId });
    if (!user || !user.email) {
      console.log('[Reminder Emails] User email not found');
      return;
    }

    await reminder.populate('jobId', 'title company url status');
    const job = reminder.jobId;

    if (!job) {
      console.log('[Reminder Emails] Job not found for reminder');
      return;
    }

    const isOverdue = new Date(reminder.scheduledDate) < new Date();
    const daysInfo = isOverdue 
      ? `Overdue by ${Math.ceil((new Date() - new Date(reminder.scheduledDate)) / (1000 * 60 * 60 * 24))} day(s)`
      : `Due ${new Date(reminder.scheduledDate).toLocaleDateString()}`;

    // Get etiquette tips HTML
    const etiquetteTipsHtml = reminder.etiquetteTips && reminder.etiquetteTips.length > 0
      ? `
        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #0369a1;">💡 Follow-Up Etiquette Tips</h4>
          <ul style="margin: 10px 0; padding-left: 20px;">
            ${reminder.etiquetteTips.map(tip => `
              <li style="margin: 8px 0;">
                ${tip.importance === 'critical' ? '🔴' : tip.importance === 'important' ? '🟡' : '🟢'} 
                <strong>${tip.tip}</strong>
              </li>
            `).join('')}
          </ul>
        </div>
      `
      : '';

    // Responsiveness info
    const responsivenessHtml = reminder.companyResponsiveness?.responsiveness !== 'unknown'
      ? `
        <div style="background: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0;"><strong>📊 Company Responsiveness:</strong> ${reminder.companyResponsiveness.responsiveness.replace('-', ' ')}</p>
          ${reminder.companyResponsiveness.avgResponseTime 
            ? `<p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">Typically responds in ${Math.round(reminder.companyResponsiveness.avgResponseTime)} days</p>`
            : ''
          }
        </div>
      `
      : '';

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${isOverdue ? '#dc2626' : '#f59e0b'};">
          ${isOverdue ? '⚠️ Overdue' : '⏰'} Follow-Up Reminder
        </h2>
        
        <p>Hello <strong>${user.name || 'there'}</strong>,</p>
        
        <p>You have a follow-up reminder for your job application:</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${job.title}</h3>
          <p style="color: #6b7280; margin: 5px 0;"><strong>${job.company}</strong></p>
          <p style="color: #6b7280; margin: 5px 0;">Current Status: <strong>${job.status}</strong></p>
        </div>

        <div style="background: ${isOverdue ? '#fee2e2' : '#fef3c7'}; border-left: 4px solid ${isOverdue ? '#dc2626' : '#f59e0b'}; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>${reminder.title}</strong></p>
          ${reminder.description ? `<p style="margin: 10px 0 0 0; color: #4b5563;">${reminder.description}</p>` : ''}
          <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px;">${daysInfo}</p>
        </div>

        ${responsivenessHtml}

        ${etiquetteTipsHtml}

        <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin-top: 0;">📧 Next Steps</h4>
          <ol style="margin: 10px 0; padding-left: 20px;">
            <li style="margin: 8px 0;">Review the etiquette tips above</li>
            <li style="margin: 8px 0;">Generate a personalized email template from your dashboard</li>
            <li style="margin: 8px 0;">Customize the template with specific details</li>
            <li style="margin: 8px 0;">Send your follow-up and mark the reminder complete</li>
          </ol>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_ORIGIN || 'http://localhost:5173'}/jobs" 
             style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Reminders Dashboard
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
        
        <p style="color: #6b7280; font-size: 12px; text-align: center;">
          <em>This is an automated reminder from HotSho Application Tracker</em><br/>
          You can snooze or dismiss this reminder from your dashboard.
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: user.email,
      subject: `${isOverdue ? '⚠️ Overdue' : '⏰'} Follow-Up Reminder: ${job.title} at ${job.company}`,
      html: emailContent
    });

    console.log(`[Reminder Emails] Sent reminder email to ${user.email} for ${job.title}`);
    
    // Update reminder to mark email sent
    reminder.emailNotificationSent = true;
    reminder.lastEmailSentAt = new Date();
    await reminder.save();
    
  } catch (error) {
    console.error('[Reminder Emails] Error sending reminder email:', error.message);
  }
};

/**
 * Send batch reminder emails for all due reminders
 * This should be called by a scheduler (daily or every few hours)
 */
export const sendDueReminderEmails = async () => {
  try {
    if (!process.env.SMTP_USER) {
      console.log('[Reminder Emails] SMTP not configured, skipping');
      return { sent: 0, skipped: 0 };
    }

    const now = new Date();
    
    // Find all pending/snoozed reminders that are due and haven't been emailed yet
    const dueReminders = await FollowUpReminder.find({
      status: { $in: ['pending', 'snoozed'] },
      scheduledDate: { $lte: now },
      $or: [
        { emailNotificationSent: { $exists: false } },
        { emailNotificationSent: false },
        // Re-send for overdue reminders that haven't been emailed in 24 hours
        {
          emailNotificationSent: true,
          scheduledDate: { $lt: new Date(now - 24 * 60 * 60 * 1000) },
          lastEmailSentAt: { $lt: new Date(now - 24 * 60 * 60 * 1000) }
        }
      ]
    }).populate('jobId', 'title company url status');

    console.log(`[Reminder Emails] Found ${dueReminders.length} due reminders to email`);

    let sent = 0;
    let skipped = 0;

    for (const reminder of dueReminders) {
      try {
        if (!reminder.jobId) {
          skipped++;
          continue;
        }
        
        await sendReminderEmail(reminder.userId, reminder);
        sent++;
        
        // Small delay to avoid overwhelming SMTP server
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`[Reminder Emails] Failed to send email for reminder ${reminder._id}:`, error.message);
        skipped++;
      }
    }

    console.log(`[Reminder Emails] Batch complete: ${sent} sent, ${skipped} skipped`);
    return { sent, skipped, total: dueReminders.length };
  } catch (error) {
    console.error('[Reminder Emails] Error in batch sending:', error);
    return { sent: 0, skipped: 0, error: error.message };
  }
};

export default {
  sendReminderEmail,
  sendDueReminderEmails
};
