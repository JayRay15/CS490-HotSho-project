import nodemailer from 'nodemailer';

/**
 * Create nodemailer transporter with SMTP configuration
 * Falls back to console logging if SMTP is not configured
 */
const createTransporter = () => {
  const smtpHost = process.env.SMTP_HOST;
  
  if (!smtpHost) {
    console.warn('⚠️  SMTP not configured. Emails will be logged to console only.');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: process.env.SMTP_USER ? {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    } : undefined
  });
};

/**
 * sendDeletionEmail - Sends account deletion confirmation email (immediate permanent deletion)
 * @param {string} toEmail - User's email address
 * @param {string} fullName - User's full name
 */
export const sendDeletionEmail = async (toEmail, fullName) => {
  const subject = '🗑️ Your Nirvana Account Has Been Permanently Deleted';
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #EF4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 8px 8px; }
          .alert-box { background-color: #fee; border-left: 4px solid #EF4444; padding: 15px; margin: 20px 0; }
          .info-box { background-color: #d1ecf1; border-left: 4px solid #0c5460; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
          .button { display: inline-block; padding: 12px 24px; background-color: #777C6D; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
          ul { margin: 10px 0; padding-left: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🗑️ Account Permanently Deleted</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${fullName || 'there'}</strong>,</p>
            
            <p>This email confirms that your Nirvana account (<strong>${toEmail}</strong>) and all associated data have been <strong>permanently deleted</strong> from our systems as of <strong>${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</strong>.</p>
            
            <div class="alert-box">
              <strong>⚠️ Important Information:</strong>
              <ul>
                <li>Your account has been <strong>immediately and permanently deleted</strong></li>
                <li>You have been logged out and can no longer access your account</li>
                <li>All associated data has been removed from our systems</li>
              </ul>
            </div>

            <div class="info-box">
              <strong>🗑️ What was deleted:</strong>
              <ul>
                <li>All profile information (name, email, phone, location)</li>
                <li>Employment history and work experience</li>
                <li>Education records and achievements</li>
                <li>Skills and proficiency levels</li>
                <li>Certifications and documents</li>
                <li>Projects and portfolio items</li>
                <li>All uploaded files and images</li>
                <li>Account credentials and settings</li>
              </ul>
            </div>

            <p><strong>This action is permanent and cannot be undone.</strong></p>

            <p>If you did not request this deletion, please contact our support team <strong>immediately</strong> at <a href="mailto:support@nirvanaprofile.com">support@nirvanaprofile.com</a></p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="mailto:support@nirvanaprofile.com" class="button">Contact Support</a>
            </div>

            <p>If you wish to use Nirvana in the future, you will need to create a new account from scratch.</p>

            <p>Thank you for using Nirvana. We're sorry to see you go and wish you all the best!</p>
            
            <p>Best regards,<br><strong>The Nirvana Team</strong></p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} Nirvana. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const textContent = `Hello ${fullName || 'there'},\n\n` +
    `This email confirms that your Nirvana account (${toEmail}) and all associated data have been permanently deleted from our systems as of ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}.\n\n` +
    `⚠️ IMPORTANT INFORMATION:\n` +
    `- Your account has been immediately and permanently deleted\n` +
    `- You have been logged out and can no longer access your account\n` +
    `- All associated data has been removed from our systems\n\n` +
    `WHAT WAS DELETED:\n` +
    `- All profile information (name, email, phone, location)\n` +
    `- Employment history and work experience\n` +
    `- Education records and achievements\n` +
    `- Skills and proficiency levels\n` +
    `- Certifications and documents\n` +
    `- Projects and portfolio items\n` +
    `- All uploaded files and images\n` +
    `- Account credentials and settings\n\n` +
    `This action is permanent and cannot be undone.\n\n` +
    `If you did not request this deletion, please contact support immediately at support@nirvanaprofile.com\n\n` +
    `If you wish to use Nirvana in the future, you will need to create a new account.\n\n` +
    `Thank you for using Nirvana. We're sorry to see you go and wish you all the best!\n\n` +
    `Best regards,\nThe Nirvana Team\n\n` +
    `This is an automated message. Please do not reply to this email.`;

  const transporter = createTransporter();

  if (!transporter) {
    console.log('📧 [MOCK EMAIL] Account Permanently Deleted:');
    console.log(`   To: ${toEmail}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Text Content:\n${textContent}\n`);
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Nirvana" <no-reply@nirvanaprofile.com>',
      to: toEmail,
      subject,
      text: textContent,
      html: htmlContent
    });

    console.log('✅ Deletion confirmation email sent to:', toEmail);
    console.log('   Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ Failed to send deletion email:', error.message);
    throw error;
  }
};

/**
 * sendFinalDeletionEmail - Sends final notification when account is permanently deleted
 * @param {string} toEmail - User's email address
 * @param {string} fullName - User's full name
 */
export const sendFinalDeletionEmail = async (toEmail, fullName) => {
  const subject = '🗑️ Your Nirvana Account Has Been Permanently Deleted';
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #EF4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 8px 8px; }
          .info-box { background-color: #fee; border-left: 4px solid #EF4444; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
          ul { margin: 10px 0; padding-left: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🗑️ Account Permanently Deleted</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${fullName || 'there'}</strong>,</p>
            
            <p>This email confirms that your Nirvana account (<strong>${toEmail}</strong>) and all associated data have been <strong>permanently deleted</strong> from our systems as of <strong>${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</strong>.</p>
            
            <div class="info-box">
              <strong>🗑️ What was deleted:</strong>
              <ul>
                <li>All profile information (name, email, phone, location)</li>
                <li>Employment and education history</li>
                <li>Skills, certifications, and proficiency levels</li>
                <li>Projects and portfolio items</li>
                <li>Uploaded documents and images</li>
                <li>Account credentials and settings</li>
              </ul>
            </div>

            <p><strong>This action is permanent and cannot be undone.</strong></p>

            <p>If you wish to use Nirvana in the future, you will need to create a new account from scratch.</p>

            <p>Thank you for being part of our community. We wish you all the best in your future endeavors!</p>
            
            <p>Best regards,<br><strong>The Nirvana Team</strong></p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} Nirvana. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const textContent = `Hello ${fullName || 'there'},\n\n` +
    `This email confirms that your Nirvana account (${toEmail}) and all associated data have been permanently deleted from our systems as of ${new Date().toLocaleDateString()}.\n\n` +
    `WHAT WAS DELETED:\n` +
    `- All profile information\n` +
    `- Employment and education history\n` +
    `- Skills, certifications, and projects\n` +
    `- Uploaded documents and images\n` +
    `- Account credentials and settings\n\n` +
    `This action is permanent and cannot be undone.\n\n` +
    `If you wish to use Nirvana in the future, you will need to create a new account.\n\n` +
    `Thank you for being part of our community. We wish you all the best!\n\n` +
    `Best regards,\nThe Nirvana Team\n\n` +
    `This is an automated message. Please do not reply to this email.`;

  const transporter = createTransporter();

  if (!transporter) {
    console.log('📧 [MOCK EMAIL] Account Permanently Deleted:');
    console.log(`   To: ${toEmail}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Text Content:\n${textContent}\n`);
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Nirvana" <no-reply@nirvanaprofile.com>',
      to: toEmail,
      subject,
      text: textContent,
      html: htmlContent
    });

    console.log('✅ Final deletion email sent to:', toEmail);
    console.log('   Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ Failed to send final deletion email:', error.message);
    throw error;
  }
};

/**
 * sendDeadlineReminderEmail - Sends a consolidated reminder email for upcoming/overdue job deadlines
 * @param {string} toEmail - Recipient email
 * @param {string} fullName - Recipient name
 * @param {Array<{title:string, company?:string, deadline?:Date, days:number}>} items - Jobs with deadline metadata
 */
export const sendDeadlineReminderEmail = async (toEmail, fullName, items = []) => {
  const subject = '⏰ Job application deadline reminders';

  const rowsHtml = items.map((it) => {
    const dueText = it.days < 0
      ? `Overdue ${Math.abs(it.days)}d`
      : it.days === 0
        ? 'Due today'
        : `${it.days}d left`;
    const deadlineDate = it.deadline ? new Date(it.deadline).toLocaleDateString() : '—';
    return `<tr>
      <td style="padding:6px 8px; border-bottom:1px solid #eee; font-weight:600;">${it.title}</td>
      <td style="padding:6px 8px; border-bottom:1px solid #eee; color:#555;">${it.company || ''}</td>
      <td style="padding:6px 8px; border-bottom:1px solid #eee; color:#555;">${deadlineDate}</td>
      <td style="padding:6px 8px; border-bottom:1px solid #eee;"><strong>${dueText}</strong></td>
    </tr>`;
  }).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 640px; margin: 0 auto; padding: 20px; }
          .header { background-color: #777C6D; color: white; padding: 16px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #ffffff; padding: 24px; border: 1px solid #ddd; border-radius: 0 0 8px 8px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
          table { width: 100%; border-collapse: collapse; }
          th { text-align: left; background:#f8f8f8; padding:8px; border-bottom:1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Upcoming Job Deadlines</h2>
          </div>
          <div class="content">
            <p>Hello <strong>${fullName || 'there'}</strong>,</p>
            <p>Here are your upcoming application deadlines that need attention:</p>
            <table>
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Company</th>
                  <th>Deadline</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
            <p style="margin-top:16px;">You can review or update these directly from your Jobs dashboard.</p>
            <div style="text-align:center; margin-top: 16px;">
              <a href="${process.env.FRONTEND_ORIGIN || 'http://localhost:5173'}/jobs" style="display:inline-block; padding:10px 18px; background:#777C6D; color:#fff; text-decoration:none; border-radius:4px;">Open Jobs</a>
            </div>
          </div>
          <div class="footer">
            <p>This is an automated reminder from Nirvana.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const textContent = [
    `Hello ${fullName || 'there'},`,
    `\nUpcoming Job Deadlines:`,
    ...items.map((it) => {
      const dueText = it.days < 0 ? `Overdue ${Math.abs(it.days)}d` : (it.days === 0 ? 'Due today' : `${it.days}d left`);
      const dl = it.deadline ? new Date(it.deadline).toLocaleDateString() : '—';
      return ` - ${it.title}${it.company ? ' @ ' + it.company : ''} | ${dl} | ${dueText}`;
    }),
    `\nOpen Jobs: ${(process.env.FRONTEND_ORIGIN || 'http://localhost:5173') + '/jobs'}`
  ].join('\n');

  const transporter = createTransporter();
  if (!transporter) {
    console.log('📧 [MOCK EMAIL] Deadline Reminders:');
    console.log(`   To: ${toEmail}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Text Content:\n${textContent}\n`);
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'Nirvana <no-reply@nirvanaprofile.com>',
      to: toEmail,
      subject,
      text: textContent,
      html: htmlContent
    });
    console.log('✅ Deadline reminder email sent to:', toEmail, 'Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ Failed to send deadline reminder email:', error.message);
    throw error;
  }
};

/**
 * sendInterviewConfirmationEmail - Sends interview confirmation email
 * @param {string} toEmail - Recipient email
 * @param {string} fullName - Recipient name
 * @param {Object} interview - Interview details
 */
export const sendInterviewConfirmationEmail = async (toEmail, fullName, interview) => {
  const subject = `✅ Interview Scheduled: ${interview.title} at ${interview.company}`;
  
  const interviewDate = new Date(interview.scheduledDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  const interviewTime = new Date(interview.scheduledDate).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
  
  const locationDetails = interview.meetingLink 
    ? `<strong>Video Meeting:</strong> <a href="${interview.meetingLink}">${interview.meetingLink}</a>`
    : interview.location 
    ? `<strong>Location:</strong> ${interview.location}`
    : '<strong>Location:</strong> To be confirmed';
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #777C6D; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 8px 8px; }
          .info-box { background-color: #e8f4f8; border-left: 4px solid #777C6D; padding: 15px; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 24px; background-color: #777C6D; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
          ul { margin: 10px 0; padding-left: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Interview Confirmed</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${fullName || 'there'}</strong>,</p>
            
            <p>Your interview has been successfully scheduled!</p>
            
            <div class="info-box">
              <h3>${interview.title}</h3>
              <p><strong>Company:</strong> ${interview.company}</p>
              <p><strong>Date:</strong> ${interviewDate}</p>
              <p><strong>Time:</strong> ${interviewTime}</p>
              <p><strong>Duration:</strong> ${interview.duration || 60} minutes</p>
              <p><strong>Type:</strong> ${interview.interviewType}</p>
              <p>${locationDetails}</p>
            </div>

            ${interview.interviewer?.name ? `
            <p><strong>Interviewer:</strong> ${interview.interviewer.name}${interview.interviewer.title ? ` (${interview.interviewer.title})` : ''}</p>
            ` : ''}

            ${interview.preparationTasks && interview.preparationTasks.length > 0 ? `
            <h3>📝 Preparation Tasks</h3>
            <ul>
              ${interview.preparationTasks.slice(0, 5).map(task => `<li>${task.title}</li>`).join('')}
            </ul>
            ` : ''}

            <p>We'll send you reminder emails before your interview to help you prepare.</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_ORIGIN || 'http://localhost:5173'}/jobs" class="button">View Interview Details</a>
            </div>

            <p>Good luck with your interview!</p>
            
            <p>Best regards,<br><strong>The Nirvana Team</strong></p>
          </div>
          <div class="footer">
            <p>This is an automated message from Nirvana.</p>
            <p>&copy; ${new Date().getFullYear()} Nirvana. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const textContent = `Hello ${fullName || 'there'},\n\n` +
    `Your interview has been successfully scheduled!\n\n` +
    `${interview.title}\n` +
    `Company: ${interview.company}\n` +
    `Date: ${interviewDate}\n` +
    `Time: ${interviewTime}\n` +
    `Duration: ${interview.duration || 60} minutes\n` +
    `Type: ${interview.interviewType}\n` +
    `${interview.location ? `Location: ${interview.location}` : ''}\n` +
    `${interview.meetingLink ? `Meeting Link: ${interview.meetingLink}` : ''}\n\n` +
    `We'll send you reminder emails before your interview to help you prepare.\n\n` +
    `Good luck with your interview!\n\n` +
    `Best regards,\nThe Nirvana Team`;

  const transporter = createTransporter();
  if (!transporter) {
    console.log('📧 [MOCK EMAIL] Interview Confirmation:');
    console.log(`   To: ${toEmail}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Text Content:\n${textContent}\n`);
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'Nirvana <no-reply@nirvanaprofile.com>',
      to: toEmail,
      subject,
      text: textContent,
      html: htmlContent
    });
    console.log('✅ Interview confirmation email sent to:', toEmail, 'Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ Failed to send interview confirmation email:', error.message);
    throw error;
  }
};

/**
 * sendInterviewReminderEmail - Sends interview reminder email
 * @param {string} toEmail - Recipient email
 * @param {string} fullName - Recipient name
 * @param {Object} interview - Interview details
 * @param {number} hoursUntil - Hours until interview
 */
export const sendInterviewReminderEmail = async (toEmail, fullName, interview, hoursUntil) => {
  const timeText = hoursUntil === 24 ? '24 hours' : hoursUntil === 2 ? '2 hours' : `${hoursUntil} hours`;
  const subject = `⏰ Interview Reminder: ${interview.title} in ${timeText}`;
  
  const interviewDate = new Date(interview.scheduledDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  const interviewTime = new Date(interview.scheduledDate).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
  
  const incompleteTasks = interview.preparationTasks?.filter(t => !t.completed) || [];
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #F59E0B; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 8px 8px; }
          .warning-box { background-color: #fef3c7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 24px; background-color: #777C6D; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
          ul { margin: 10px 0; padding-left: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Interview in ${timeText}</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${fullName || 'there'}</strong>,</p>
            
            <p>This is a reminder that you have an interview coming up in <strong>${timeText}</strong>.</p>
            
            <div class="warning-box">
              <h3>${interview.title}</h3>
              <p><strong>Company:</strong> ${interview.company}</p>
              <p><strong>Date:</strong> ${interviewDate}</p>
              <p><strong>Time:</strong> ${interviewTime}</p>
              <p><strong>Type:</strong> ${interview.interviewType}</p>
              ${interview.meetingLink ? `<p><strong>Link:</strong> <a href="${interview.meetingLink}">${interview.meetingLink}</a></p>` : ''}
              ${interview.location ? `<p><strong>Location:</strong> ${interview.location}</p>` : ''}
            </div>

            ${incompleteTasks.length > 0 ? `
            <h3>📋 Incomplete Preparation Tasks</h3>
            <ul>
              ${incompleteTasks.slice(0, 5).map(task => `<li>${task.title}</li>`).join('')}
            </ul>
            ` : '<p>✅ All preparation tasks completed! Great job!</p>'}

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_ORIGIN || 'http://localhost:5173'}/jobs" class="button">View Interview Details</a>
            </div>

            <p>Good luck!</p>
            
            <p>Best regards,<br><strong>The Nirvana Team</strong></p>
          </div>
          <div class="footer">
            <p>This is an automated reminder from Nirvana.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const textContent = `Hello ${fullName || 'there'},\n\n` +
    `This is a reminder that you have an interview coming up in ${timeText}.\n\n` +
    `${interview.title}\n` +
    `Company: ${interview.company}\n` +
    `Date: ${interviewDate}\n` +
    `Time: ${interviewTime}\n` +
    `Type: ${interview.interviewType}\n\n` +
    `${incompleteTasks.length > 0 ? `Incomplete tasks:\n${incompleteTasks.slice(0, 5).map(t => `- ${t.title}`).join('\n')}` : 'All preparation tasks completed!'}\n\n` +
    `Good luck!\n\n` +
    `Best regards,\nThe Nirvana Team`;

  const transporter = createTransporter();
  if (!transporter) {
    console.log('📧 [MOCK EMAIL] Interview Reminder:');
    console.log(`   To: ${toEmail}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Text Content:\n${textContent}\n`);
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'Nirvana <no-reply@nirvanaprofile.com>',
      to: toEmail,
      subject,
      text: textContent,
      html: htmlContent
    });
    console.log('✅ Interview reminder email sent to:', toEmail, 'Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ Failed to send interview reminder email:', error.message);
    throw error;
  }
};

/**
 * sendInterviewCancellationEmail - Sends interview cancellation email
 * @param {string} toEmail - Recipient email
 * @param {string} fullName - Recipient name
 * @param {Object} interview - Interview details
 */
export const sendInterviewCancellationEmail = async (toEmail, fullName, interview) => {
  const subject = `❌ Interview Cancelled: ${interview.title} at ${interview.company}`;
  
  const interviewDate = new Date(interview.scheduledDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  const interviewTime = new Date(interview.scheduledDate).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #EF4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 8px 8px; }
          .info-box { background-color: #fee; border-left: 4px solid #EF4444; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Interview Cancelled</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${fullName || 'there'}</strong>,</p>
            
            <p>Your interview has been cancelled.</p>
            
            <div class="info-box">
              <h3>${interview.title}</h3>
              <p><strong>Company:</strong> ${interview.company}</p>
              <p><strong>Was scheduled for:</strong> ${interviewDate} at ${interviewTime}</p>
              ${interview.cancelled?.reason ? `<p><strong>Reason:</strong> ${interview.cancelled.reason}</p>` : ''}
            </div>

            <p>You will no longer receive reminders for this interview.</p>
            
            <p>Best regards,<br><strong>The Nirvana Team</strong></p>
          </div>
          <div class="footer">
            <p>This is an automated message from Nirvana.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const textContent = `Hello ${fullName || 'there'},\n\n` +
    `Your interview has been cancelled.\n\n` +
    `${interview.title}\n` +
    `Company: ${interview.company}\n` +
    `Was scheduled for: ${interviewDate} at ${interviewTime}\n` +
    `${interview.cancelled?.reason ? `Reason: ${interview.cancelled.reason}\n` : ''}\n` +
    `You will no longer receive reminders for this interview.\n\n` +
    `Best regards,\nThe Nirvana Team`;

  const transporter = createTransporter();
  if (!transporter) {
    console.log('📧 [MOCK EMAIL] Interview Cancellation:');
    console.log(`   To: ${toEmail}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Text Content:\n${textContent}\n`);
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'Nirvana <no-reply@nirvanaprofile.com>',
      to: toEmail,
      subject,
      text: textContent,
      html: htmlContent
    });
    console.log('✅ Interview cancellation email sent to:', toEmail, 'Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ Failed to send interview cancellation email:', error.message);
    throw error;
  }
};

/**
 * sendInterviewRescheduledEmail - Sends interview rescheduled email
 * @param {string} toEmail - Recipient email
 * @param {string} fullName - Recipient name
 * @param {Object} interview - Interview details
 * @param {Date} previousDate - Previous interview date
 */
export const sendInterviewRescheduledEmail = async (toEmail, fullName, interview, previousDate) => {
  const subject = `📅 Interview Rescheduled: ${interview.title} at ${interview.company}`;
  
  const oldDate = new Date(previousDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  const oldTime = new Date(previousDate).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
  
  const newDate = new Date(interview.scheduledDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  const newTime = new Date(interview.scheduledDate).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #3B82F6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 8px 8px; }
          .info-box { background-color: #e8f4f8; border-left: 4px solid #3B82F6; padding: 15px; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 24px; background-color: #777C6D; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📅 Interview Rescheduled</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${fullName || 'there'}</strong>,</p>
            
            <p>Your interview has been rescheduled to a new date and time.</p>
            
            <div class="info-box">
              <h3>${interview.title}</h3>
              <p><strong>Company:</strong> ${interview.company}</p>
              <p><strong>Previous Date:</strong> ${oldDate} at ${oldTime}</p>
              <p><strong>New Date:</strong> ${newDate} at ${newTime}</p>
              <p><strong>Type:</strong> ${interview.interviewType}</p>
            </div>

            ${interview.conflictWarning?.hasConflict ? `
            <p style="color: #F59E0B;">⚠️ Warning: ${interview.conflictWarning.conflictDetails}</p>
            ` : ''}

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_ORIGIN || 'http://localhost:5173'}/jobs" class="button">View Interview Details</a>
            </div>

            <p>We'll send you reminder emails before your new interview time.</p>
            
            <p>Best regards,<br><strong>The Nirvana Team</strong></p>
          </div>
          <div class="footer">
            <p>This is an automated message from Nirvana.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const textContent = `Hello ${fullName || 'there'},\n\n` +
    `Your interview has been rescheduled to a new date and time.\n\n` +
    `${interview.title}\n` +
    `Company: ${interview.company}\n` +
    `Previous Date: ${oldDate} at ${oldTime}\n` +
    `New Date: ${newDate} at ${newTime}\n` +
    `Type: ${interview.interviewType}\n\n` +
    `We'll send you reminder emails before your new interview time.\n\n` +
    `Best regards,\nThe Nirvana Team`;

  const transporter = createTransporter();
  if (!transporter) {
    console.log('📧 [MOCK EMAIL] Interview Rescheduled:');
    console.log(`   To: ${toEmail}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Text Content:\n${textContent}\n`);
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'Nirvana <no-reply@nirvanaprofile.com>',
      to: toEmail,
      subject,
      text: textContent,
      html: htmlContent
    });
    console.log('✅ Interview rescheduled email sent to:', toEmail, 'Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ Failed to send interview rescheduled email:', error.message);
    throw error;
  }
};

/**
 * sendThankYouReminderEmail - Sends a reminder to send a thank-you note after interview completion
 * @param {string} toEmail - Recipient email
 * @param {string} fullName - Recipient name
 * @param {Object} interview - Interview details
 */
export const sendThankYouReminderEmail = async (toEmail, fullName, interview) => {
  const subject = `🙏 Don't Forget Your Thank-You Note: ${interview.title} at ${interview.company}`;

  const interviewDate = new Date(interview.scheduledDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 8px 8px; }
          .info-box { background-color: #ecfdf5; border-left: 4px solid #10B981; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
          .button { display:inline-block; padding:12px 20px; background:#10B981; color:#fff; text-decoration:none; border-radius:4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🙏 Thank-You Follow-Up</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${fullName || 'there'}</strong>,</p>
            <p>Your interview for <strong>${interview.title}</strong> at <strong>${interview.company}</strong> (${interviewDate}) has been marked completed.</p>
            <div class="info-box">
              <p>Sending a concise, sincere thank-you note within 24 hours reinforces your interest and professionalism.</p>
              <p><strong>Tip:</strong> Reference a specific topic from the conversation and restate your enthusiasm.</p>
            </div>
            <div style="text-align:center; margin:28px 0;">
              <a class="button" href="${process.env.FRONTEND_ORIGIN || 'http://localhost:5173'}/jobs">Write Thank-You Note</a>
            </div>
            <p>If you've already sent a note, you can mark it as sent in the interview record to dismiss future reminders.</p>
            <p>Best regards,<br><strong>The Nirvana Team</strong></p>
          </div>
          <div class="footer">
            <p>This is an automated message from Nirvana.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const textContent = `Hello ${fullName || 'there'},\n\n` +
    `Your interview for ${interview.title} at ${interview.company} (${interviewDate}) has been marked completed.\n\n` +
    `Send a concise thank-you within 24 hours referencing something specific you discussed.\n\n` +
    `Write Thank-You: ${(process.env.FRONTEND_ORIGIN || 'http://localhost:5173') + '/jobs'}\n\n` +
    `Best regards,\nThe Nirvana Team`;

  const transporter = createTransporter();
  if (!transporter) {
    console.log('📧 [MOCK EMAIL] Thank-You Reminder:');
    console.log(`   To: ${toEmail}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Text Content:\n${textContent}\n`);
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'Nirvana <no-reply@nirvanaprofile.com>',
      to: toEmail,
      subject,
      text: textContent,
      html: htmlContent
    });
    console.log('✅ Thank-you reminder email sent to:', toEmail, 'Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ Failed to send thank-you reminder email:', error.message);
  }
};

export default { 
  sendDeletionEmail, 
  sendFinalDeletionEmail, 
  sendDeadlineReminderEmail,
  sendInterviewConfirmationEmail,
  sendInterviewReminderEmail,
  sendInterviewCancellationEmail,
  sendInterviewRescheduledEmail,
  sendThankYouReminderEmail,
};
