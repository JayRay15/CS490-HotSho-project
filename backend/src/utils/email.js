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
  const subject = '🗑️ Your HotSho Account Has Been Permanently Deleted';
  
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
            
            <p>This email confirms that your HotSho account (<strong>${toEmail}</strong>) and all associated data have been <strong>permanently deleted</strong> from our systems as of <strong>${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</strong>.</p>
            
            <div class="alert-box">
              <strong>⚠️ Important Information:</strong>
              <ul>
                <li>Your account has been <strong>immediately and permanently deleted</strong></li>
                <li>You have been logged out and can no longer access your account</li>
                <li>All associated data has been removed from our systems</li>
              </ul>
            </div>

            <div class="info-box">
              <strong>�️ What was deleted:</strong>
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

            <p>If you did not request this deletion, please contact our support team <strong>immediately</strong> at <a href="mailto:support@hotshoprofile.com">support@hotshoprofile.com</a></p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="mailto:support@hotshoprofile.com" class="button">Contact Support</a>
            </div>

            <p>If you wish to use HotSho in the future, you will need to create a new account from scratch.</p>

            <p>Thank you for using HotSho. We're sorry to see you go and wish you all the best!</p>
            
            <p>Best regards,<br><strong>The HotSho Team</strong></p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} HotSho. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const textContent = `Hello ${fullName || 'there'},\n\n` +
    `This email confirms that your HotSho account (${toEmail}) and all associated data have been permanently deleted from our systems as of ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}.\n\n` +
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
    `If you did not request this deletion, please contact support immediately at support@hotshoprofile.com\n\n` +
    `If you wish to use HotSho in the future, you will need to create a new account.\n\n` +
    `Thank you for using HotSho. We're sorry to see you go and wish you all the best!\n\n` +
    `Best regards,\nThe HotSho Team\n\n` +
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
      from: process.env.SMTP_FROM || '"HotSho" <no-reply@hotshoprofile.com>',
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
  const subject = '🗑️ Your HotSho Account Has Been Permanently Deleted';
  
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
            
            <p>This email confirms that your HotSho account (<strong>${toEmail}</strong>) and all associated data have been <strong>permanently deleted</strong> from our systems as of <strong>${new Date().toLocaleDateString()}</strong>.</p>
            
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

            <p>If you wish to use HotSho in the future, you will need to create a new account from scratch.</p>

            <p>Thank you for being part of our community. We wish you all the best in your future endeavors!</p>
            
            <p>Best regards,<br><strong>The HotSho Team</strong></p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} HotSho. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const textContent = `Hello ${fullName || 'there'},\n\n` +
    `This email confirms that your HotSho account (${toEmail}) and all associated data have been permanently deleted from our systems as of ${new Date().toLocaleDateString()}.\n\n` +
    `WHAT WAS DELETED:\n` +
    `- All profile information\n` +
    `- Employment and education history\n` +
    `- Skills, certifications, and projects\n` +
    `- Uploaded documents and images\n` +
    `- Account credentials and settings\n\n` +
    `This action is permanent and cannot be undone.\n\n` +
    `If you wish to use HotSho in the future, you will need to create a new account.\n\n` +
    `Thank you for being part of our community. We wish you all the best!\n\n` +
    `Best regards,\nThe HotSho Team\n\n` +
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
      from: process.env.SMTP_FROM || '"HotSho" <no-reply@hotshoprofile.com>',
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

export default { sendDeletionEmail, sendFinalDeletionEmail };
