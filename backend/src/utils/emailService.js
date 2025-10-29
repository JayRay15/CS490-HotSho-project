import nodemailer from "nodemailer";

export async function sendAccountDeletionEmail(email, name) {
  // Configure your SMTP transport here
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your Nirvana Account Has Been Permanently Deleted",
    html: `<h2>Account Permanently Deleted</h2>
      <p>Hi ${name || "User"},</p>
      <p>Your account deletion request has been completed. Your account and all associated data have been <strong>immediately and permanently removed</strong> from our systems.</p>
      <p><strong>This action cannot be undone.</strong></p>
      <p>If you did not request this deletion, please contact support immediately at support@nirvanaprofile.com</p>
      <p>If you wish to use Nirvana in the future, you will need to create a new account.</p>
      <p>Thank you for using Nirvana. We're sorry to see you go!</p>
      <p>Best regards,<br/>The Nirvana Team</p>`
  };

  await transporter.sendMail(mailOptions);
}
