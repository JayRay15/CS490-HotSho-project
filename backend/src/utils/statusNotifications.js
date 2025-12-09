import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { User } from '../models/User.js';

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
 * Send status change notification
 * @param {string} userId - User's Clerk ID
 * @param {Object} applicationStatus - ApplicationStatus document
 * @param {string} changeSource - 'user' | 'email-detection' | 'automation'
 */
export const sendStatusChangeNotification = async (userId, applicationStatus, changeSource) => {
  try {
    if (!process.env.SMTP_USER) {
      console.log('[Status Notifications] SMTP not configured, skipping email');
      return;
    }

    // Get user email
    const user = await User.findOne({ auth0Id: userId });
    if (!user || !user.email) {
      console.log('[Status Notifications] User email not found');
      return;
    }

    await applicationStatus.populate('jobId', 'title company url');
    const job = applicationStatus.jobId;

    const statusHistory = applicationStatus.statusHistory;
    const latestChange = statusHistory[statusHistory.length - 1];
    const previousStatus = latestChange.previousStatus || 'Unknown';
    const newStatus = latestChange.status;

    let sourceText = '';
    if (changeSource === 'email-detection') {
      sourceText = '🤖 <em>(Auto-detected from email)</em>';
    } else if (changeSource === 'automation') {
      sourceText = '⚙️ <em>(Automatically updated)</em>';
    }

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Application Status Update</h2>
        ${sourceText}
        
        <p>Hello <strong>${user.name || 'there'}</strong>,</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${job.title}</h3>
          <p style="color: #6b7280; margin: 5px 0;"><strong>${job.company}</strong></p>
        </div>

        <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Status Changed:</strong></p>
          <p style="font-size: 18px; margin: 10px 0;">
            <span style="color: #6b7280;">${previousStatus}</span> 
            → 
            <span style="color: #10b981; font-weight: bold;">${newStatus}</span>
          </p>
        </div>

        ${latestChange.notes ? `
          <div style="background: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;"><strong>📝 Notes:</strong></p>
            <p style="margin: 10px 0 0 0;">${latestChange.notes}</p>
          </div>
        ` : ''}

        ${changeSource === 'email-detection' && latestChange.sourceEmail ? `
          <div style="background: #dbeafe; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;"><strong>📧 Detected from email:</strong></p>
            <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px;">
              <strong>From:</strong> ${latestChange.sourceEmail.from}<br/>
              <strong>Subject:</strong> ${latestChange.sourceEmail.subject}
            </p>
          </div>
        ` : ''}

        <div style="margin: 30px 0;">
          <h4>📊 Application Metrics</h4>
          <ul style="list-style: none; padding: 0;">
            <li style="margin: 10px 0;">⏱️ Days in current status: <strong>${applicationStatus.metrics.daysInCurrentStatus}</strong></li>
            <li style="margin: 10px 0;">📅 Total days in process: <strong>${applicationStatus.metrics.totalDaysInProcess}</strong></li>
            ${applicationStatus.responseTime ? `
              <li style="margin: 10px 0;">⚡ Response time: <strong>${applicationStatus.responseTime} days</strong></li>
            ` : ''}
          </ul>
        </div>

        ${getStatusRecommendation(newStatus)}

        ${job.url ? `
          <p style="text-align: center; margin: 30px 0;">
            <a href="${job.url}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Job Posting
            </a>
          </p>
        ` : ''}

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
        
        <p style="color: #6b7280; font-size: 12px; text-align: center;">
          <em>This is an automated notification from HotSho Application Tracker</em><br/>
          <a href="#" style="color: #2563eb;">Manage notification preferences</a>
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: user.email,
      subject: `Application Update: ${job.title} at ${job.company} - ${newStatus}`,
      html: emailContent
    });

    console.log(`[Status Notifications] Sent status change notification to ${user.email}`);
  } catch (error) {
    console.error('[Status Notifications] Error sending notification:', error.message);
  }
};

/**
 * Send follow-up reminder notification
 * @param {string} userId - User's Clerk ID
 * @param {Object} applicationStatus - ApplicationStatus document
 */
export const sendFollowUpReminder = async (userId, applicationStatus) => {
  try {
    if (!process.env.SMTP_USER) return;

    const user = await User.findOne({ auth0Id: userId });
    if (!user || !user.email) return;

    await applicationStatus.populate('jobId', 'title company url');
    const job = applicationStatus.jobId;

    const daysSinceStatusChange = applicationStatus.daysSinceStatusChange;
    const suggestion = getSuggestedFollowUp(applicationStatus.currentStatus);

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">⏰ Follow-Up Reminder</h2>
        
        <p>Hello <strong>${user.name || 'there'}</strong>,</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${job.title}</h3>
          <p style="color: #6b7280; margin: 5px 0;"><strong>${job.company}</strong></p>
          <p style="color: #6b7280; margin: 5px 0;">Status: <strong>${applicationStatus.currentStatus}</strong></p>
        </div>

        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;">It's been <strong>${daysSinceStatusChange} days</strong> since your last status update.</p>
        </div>

        ${suggestion ? `
          <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin-top: 0;">💡 Suggested Action</h4>
            <p>${suggestion}</p>
          </div>
        ` : ''}

        <div style="margin: 30px 0;">
          <h4>📧 Follow-Up Email Template</h4>
          <div style="background: #f9fafb; padding: 15px; border-radius: 5px; border: 1px solid #e5e7eb;">
            <p><strong>Subject:</strong> Following Up: ${job.title} Application</p>
            <p style="margin-top: 15px;">Dear Hiring Manager,</p>
            <p>I hope this email finds you well. I wanted to follow up on my application for the ${job.title} position at ${job.company}.</p>
            <p>I remain very interested in this opportunity and would welcome any updates on the hiring process. Please let me know if you need any additional information from me.</p>
            <p>Thank you for your time and consideration.</p>
            <p>Best regards,<br/>${user.name || 'Your Name'}</p>
          </div>
        </div>

        ${job.url ? `
          <p style="text-align: center; margin: 30px 0;">
            <a href="${job.url}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Job Details
            </a>
          </p>
        ` : ''}

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
        
        <p style="color: #6b7280; font-size: 12px; text-align: center;">
          <em>This is an automated reminder from HotSho Application Tracker</em>
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: user.email,
      subject: `Reminder: Follow up on ${job.title} at ${job.company}`,
      html: emailContent
    });

    console.log(`[Status Notifications] Sent follow-up reminder to ${user.email}`);
  } catch (error) {
    console.error('[Status Notifications] Error sending follow-up reminder:', error.message);
  }
};

/**
 * Send stalled application alert
 * @param {string} userId - User's Clerk ID
 * @param {Array} stalledApplications - Array of stalled ApplicationStatus documents
 */
export const sendStalledApplicationsAlert = async (userId, stalledApplications) => {
  try {
    if (!process.env.SMTP_USER || stalledApplications.length === 0) return;

    const user = await User.findOne({ auth0Id: userId });
    if (!user || !user.email) return;

    const applicationsList = stalledApplications.map(app => `
      <li style="margin: 15px 0; padding: 15px; background: #fef3c7; border-radius: 5px;">
        <strong>${app.jobId.title}</strong> at ${app.jobId.company}<br/>
        <span style="color: #6b7280; font-size: 14px;">
          Status: ${app.currentStatus} | 
          ${app.daysSinceStatusChange} days without update
        </span>
      </li>
    `).join('');

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">⚠️ Stalled Applications Alert</h2>
        
        <p>Hello <strong>${user.name || 'there'}</strong>,</p>
        
        <p>You have <strong>${stalledApplications.length}</strong> application(s) that haven't been updated in over 14 days:</p>

        <ul style="list-style: none; padding: 0;">
          ${applicationsList}
        </ul>

        <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 30px 0;">
          <h4 style="margin-top: 0;">💡 Recommended Actions</h4>
          <ul>
            <li>Send a follow-up email to express continued interest</li>
            <li>Check the company's career portal for updates</li>
            <li>Reach out to your network connections at the company</li>
            <li>Consider moving the application to "Ghosted" status if no response</li>
          </ul>
        </div>

        <p style="text-align: center; margin: 30px 0;">
          <a href="#" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Review Applications
          </a>
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
        
        <p style="color: #6b7280; font-size: 12px; text-align: center;">
          <em>This is an automated alert from HotSho Application Tracker</em>
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: user.email,
      subject: `⚠️ ${stalledApplications.length} Stalled Application(s) Need Attention`,
      html: emailContent
    });

    console.log(`[Status Notifications] Sent stalled applications alert to ${user.email}`);
  } catch (error) {
    console.error('[Status Notifications] Error sending stalled alert:', error.message);
  }
};

// Helper functions

function getStatusRecommendation(status) {
  const recommendations = {
    'Applied': `
      <div style="background: #dbeafe; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h4 style="margin-top: 0;">💡 Next Steps</h4>
        <p>Consider following up in 7-10 days if you haven't heard back.</p>
      </div>
    `,
    'Phone Screen': `
      <div style="background: #dbeafe; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h4 style="margin-top: 0;">💡 Next Steps</h4>
        <p>Send a thank-you email within 24 hours. Prepare for potential technical interview.</p>
      </div>
    `,
    'Technical Interview': `
      <div style="background: #dbeafe; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h4 style="margin-top: 0;">💡 Next Steps</h4>
        <p>Send thank-you note. Review your solutions and be ready to discuss your approach.</p>
      </div>
    `,
    'Offer Extended': `
      <div style="background: #d1fae5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h4 style="margin-top: 0;">🎉 Congratulations!</h4>
        <p>Review the offer carefully. Don't hesitate to negotiate compensation and benefits.</p>
      </div>
    `,
    'Rejected': `
      <div style="background: #fee2e2; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h4 style="margin-top: 0;">💪 Keep Going</h4>
        <p>Every rejection is a learning opportunity. Consider requesting feedback and keep applying!</p>
      </div>
    `
  };

  return recommendations[status] || '';
}

function getSuggestedFollowUp(status) {
  const suggestions = {
    'Applied': 'Send a brief follow-up email reiterating your interest and qualifications.',
    'Under Review': 'Check in on the status of your application and express continued interest.',
    'Phone Screen': 'Send a thank-you note and ask about the timeline for next steps.',
    'Technical Interview': 'Follow up on the interview and request feedback.',
    'Onsite Interview': 'Send thank-you notes to all interviewers and ask about decision timeline.',
    'Final Interview': 'Inquire about the final decision timeline.'
  };

  return suggestions[status] || 'Consider reaching out to check on your application status.';
}

export default {
  sendStatusChangeNotification,
  sendFollowUpReminder,
  sendStalledApplicationsAlert
};
