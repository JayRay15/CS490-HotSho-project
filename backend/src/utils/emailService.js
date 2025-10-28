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
    subject: "Account Deletion Requested",
    html: `<h2>Account Deletion Requested</h2>
      <p>Hi ${name || "User"},</p>
      <p>Your account deletion request has been received. Your data will be retained for 30 days before permanent removal. You will be unable to log in during this period.</p>
      <p>If you did not request this, please contact support immediately.</p>
      <p>Thank you,<br/>HotSho Team</p>`
  };

  await transporter.sendMail(mailOptions);
}
