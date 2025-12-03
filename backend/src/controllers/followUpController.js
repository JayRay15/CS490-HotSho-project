import FollowUp from '../models/FollowUp.js';
import { Job } from '../models/Job.js';
import { User } from '../models/User.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  } : undefined
});

/**
 * Create a new follow-up record and send email
 */
export const createFollowUp = async (req, res) => {
  try {
    const userId = req.auth?.userId || req.auth?.payload?.sub;
    const { jobId, templateType, subject, body, interviewDetails } = req.body;

    console.log('Creating follow-up:', { userId, jobId, templateType });

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User ID not found in authentication token'
      });
    }

    // Validate job belongs to user
    const job = await Job.findOne({ _id: jobId, userId });
    if (!job) {
      console.log('Job not found:', { jobId, userId });
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Get user information for email
    const user = await User.findOne({ auth0Id: userId });
    const userEmail = user?.email;
    const userName = user?.name || user?.firstName || 'Candidate';

    // Get interviewer email from interviewDetails
    const interviewerEmail = interviewDetails?.interviewer?.email;
    const interviewerName = interviewDetails?.interviewer?.name || 'Hiring Manager';

    // Create follow-up record (will update emailSent after sending)
    const followUp = new FollowUp({
      userId,
      jobId,
      templateType,
      subject,
      body,
      interviewDetails,
      sentAt: new Date(),
      emailSent: false
    });

    // Save the follow-up record first
    await followUp.save();

    // Send email if SMTP is configured and interviewer email is provided
    let emailSent = false;
    let emailError = null;

    if (process.env.SMTP_USER && interviewerEmail) {
      try {
        // Convert plain text body to HTML format
        const htmlBody = body.replace(/\n/g, '<br>');

        const emailContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #777C6D; color: white; padding: 16px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background-color: #ffffff; padding: 24px; border: 1px solid #ddd; border-radius: 0 0 8px 8px; }
                .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h2>Interview Follow-Up</h2>
                </div>
                <div class="content">
                  ${htmlBody}
                </div>
                <div class="footer">
                  <p>This email was sent from HotSho Application Tracker</p>
                </div>
              </div>
            </body>
          </html>
        `;

        const mailOptions = {
          from: (userEmail ? `${userName} <${userEmail}>` : process.env.SMTP_USER),
          to: interviewerEmail,
          subject: subject,
          text: body,
          html: emailContent,
          replyTo: userEmail || process.env.SMTP_USER
        };

        const info = await transporter.sendMail(mailOptions);
        emailSent = true;
        followUp.emailSent = true;
        followUp.emailError = null;
        await followUp.save();
        console.log('✅ Follow-up email sent successfully:', {
          to: interviewerEmail,
          subject: subject,
          messageId: info.messageId
        });
      } catch (emailErr) {
        emailError = emailErr.message;
        followUp.emailSent = false;
        followUp.emailError = emailErr.message;
        await followUp.save();
        console.error('❌ Failed to send follow-up email:', emailErr.message);
        // Continue even if email fails - the record is still saved
      }
    } else {
      if (!process.env.SMTP_USER) {
        console.log('⚠️  SMTP not configured, follow-up email not sent');
      }
      if (!interviewerEmail) {
        console.log('⚠️  Interviewer email not provided, follow-up email not sent');
      }
    }

    res.status(201).json({
      success: true,
      message: emailSent 
        ? 'Follow-up sent successfully' 
        : emailError 
          ? 'Follow-up recorded but email failed to send' 
          : interviewerEmail 
            ? 'Follow-up recorded (SMTP not configured)' 
            : 'Follow-up recorded (no interviewer email)',
      data: {
        ...followUp.toObject(),
        emailSent,
        emailError: emailError || undefined
      }
    });
  } catch (error) {
    console.error('Error creating follow-up:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create follow-up record',
      error: error.message
    });
  }
};

/**
 * Get all follow-ups for a specific job
 */
export const getJobFollowUps = async (req, res) => {
  try {
    const userId = req.auth?.userId || req.auth?.payload?.sub;
    const { jobId } = req.params;

    // Validate job belongs to user
    const job = await Job.findOne({ _id: jobId, userId });
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    const followUps = await FollowUp.find({ userId, jobId })
      .sort({ sentAt: -1 });

    res.json({
      success: true,
      data: followUps
    });
  } catch (error) {
    console.error('Error fetching follow-ups:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch follow-ups',
      error: error.message
    });
  }
};

/**
 * Get all follow-ups for a user
 */
export const getAllFollowUps = async (req, res) => {
  try {
    const userId = req.auth?.userId || req.auth?.payload?.sub;

    const followUps = await FollowUp.find({ userId })
      .populate('jobId', 'title company')
      .sort({ sentAt: -1 });

    res.json({
      success: true,
      data: followUps
    });
  } catch (error) {
    console.error('Error fetching all follow-ups:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch follow-ups',
      error: error.message
    });
  }
};

/**
 * Update follow-up response status
 */
export const updateFollowUpResponse = async (req, res) => {
  try {
    const userId = req.auth?.userId || req.auth?.payload?.sub;
    const { followUpId } = req.params;
    const { received } = req.body;

    const followUp = await FollowUp.findOne({ _id: followUpId, userId });
    if (!followUp) {
      return res.status(404).json({
        success: false,
        message: 'Follow-up not found'
      });
    }

    followUp.responseReceived = received;
    if (received) {
      followUp.responseReceivedAt = new Date();
    } else {
      followUp.responseReceivedAt = null;
    }

    await followUp.save();

    res.json({
      success: true,
      message: 'Follow-up updated successfully',
      data: followUp
    });
  } catch (error) {
    console.error('Error updating follow-up:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update follow-up',
      error: error.message
    });
  }
};

/**
 * Get follow-up statistics for a specific job
 */
export const getJobFollowUpStats = async (req, res) => {
  try {
    const userId = req.auth?.userId || req.auth?.payload?.sub;
    const { jobId } = req.params;

    // Validate job belongs to user
    const job = await Job.findOne({ _id: jobId, userId });
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    const followUps = await FollowUp.find({ userId, jobId });
    const sent = followUps.length;
    const responded = followUps.filter(f => f.responseReceived).length;
    const responseRate = sent > 0 ? Math.round((responded / sent) * 100) : 0;

    res.json({
      success: true,
      data: {
        sent,
        responded,
        responseRate
      }
    });
  } catch (error) {
    console.error('Error fetching follow-up stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};

/**
 * Get overall follow-up statistics for user
 */
export const getOverallStats = async (req, res) => {
  try {
    const userId = req.auth?.userId || req.auth?.payload?.sub;

    const followUps = await FollowUp.find({ userId });
    const sent = followUps.length;
    const responded = followUps.filter(f => f.responseReceived).length;
    const responseRate = sent > 0 ? Math.round((responded / sent) * 100) : 0;

    // Statistics by template type
    const byType = {};
    const types = ['thank-you', 'status-inquiry', 'feedback-request', 'networking'];
    
    types.forEach(type => {
      const typeFollowUps = followUps.filter(f => f.templateType === type);
      const typeSent = typeFollowUps.length;
      const typeResponded = typeFollowUps.filter(f => f.responseReceived).length;
      byType[type] = {
        sent: typeSent,
        responded: typeResponded,
        responseRate: typeSent > 0 ? Math.round((typeResponded / typeSent) * 100) : 0
      };
    });

    res.json({
      success: true,
      data: {
        overall: {
          sent,
          responded,
          responseRate
        },
        byType
      }
    });
  } catch (error) {
    console.error('Error fetching overall stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};

/**
 * Delete a follow-up record
 */
export const deleteFollowUp = async (req, res) => {
  try {
    const userId = req.auth?.userId || req.auth?.payload?.sub;
    const { followUpId } = req.params;

    const followUp = await FollowUp.findOneAndDelete({ _id: followUpId, userId });
    if (!followUp) {
      return res.status(404).json({
        success: false,
        message: 'Follow-up not found'
      });
    }

    res.json({
      success: true,
      message: 'Follow-up deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting follow-up:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete follow-up',
      error: error.message
    });
  }
};
