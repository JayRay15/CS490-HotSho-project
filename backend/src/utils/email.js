import nodemailer from 'nodemailer';

/**
 * sendDeletionEmail - Sends account deletion confirmation email
 * Falls back to console.log when SMTP not configured
 */
export const sendDeletionEmail = async (toEmail, fullName, deletionDate) => {
  const subject = 'Account deletion scheduled';
  const text = `Hello ${fullName || ''},\n\nYour account has been scheduled for permanent deletion on ${deletionDate.toUTCString()}. ` +
    `You have 30 days to cancel if this was a mistake. All your personal data will be removed permanently after that date.\n\nIf you did not request this, please contact support.`;

  // Use SMTP if configured via environment variables (e.g., SENDGRID_SMTP_HOST etc.)
  const smtpHost = process.env.SMTP_HOST;
  if (!smtpHost) {
    console.log('Deletion email (not sent, no SMTP configured):', { toEmail, subject, text });
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    } : undefined
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'no-reply@example.com',
    to: toEmail,
    subject,
    text
  });
};

export default { sendDeletionEmail };
