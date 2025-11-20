import Referral from '../models/Referral.js';
import { Job } from '../models/Job.js';
import Contact from '../models/Contact.js';
import { User } from '../models/User.js';
import { generateReferralTemplate } from '../utils/geminiService.js';

/**
 * Create a new referral request
 * POST /api/referrals
 */
export const createReferral = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { jobId, contactId, status, requestContent, tone, notes, followUpDate } = req.body;

    // Validate required fields
    if (!jobId || !contactId || !requestContent) {
      return res.status(400).json({
        success: false,
        message: 'Job ID, Contact ID, and request content are required'
      });
    }

    // Verify job and contact belong to user
    const job = await Job.findOne({ _id: jobId, userId });
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    const contact = await Contact.findOne({ _id: contactId, userId });
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    // Create referral
    const referral = new Referral({
      userId,
      jobId,
      contactId,
      status: status || 'draft',
      requestContent,
      tone: tone || 'professional',
      notes,
      followUpDate: followUpDate ? new Date(followUpDate) : null,
      requestedDate: status === 'requested' ? new Date() : null
    });

    await referral.save();

    // Populate job and contact details
    await referral.populate('jobId contactId');

    res.status(201).json({
      success: true,
      message: 'Referral request created successfully',
      data: referral
    });
  } catch (error) {
    console.error('Error creating referral:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create referral request',
      error: error.message
    });
  }
};

/**
 * Get all referrals for the authenticated user
 * GET /api/referrals
 */
export const getReferrals = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { status, jobId, contactId } = req.query;

    // Build query
    const query = { userId };
    if (status) query.status = status;
    if (jobId) query.jobId = jobId;
    if (contactId) query.contactId = contactId;

    const referrals = await Referral.find(query)
      .populate('jobId', 'title company location status')
      .populate('contactId', 'firstName lastName email company jobTitle relationshipType relationshipStrength')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: referrals.length,
      data: referrals
    });
  } catch (error) {
    console.error('Error fetching referrals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch referrals',
      error: error.message
    });
  }
};

/**
 * Get a single referral by ID
 * GET /api/referrals/:id
 */
export const getReferralById = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { id } = req.params;

    const referral = await Referral.findOne({ _id: id, userId })
      .populate('jobId')
      .populate('contactId');

    if (!referral) {
      return res.status(404).json({
        success: false,
        message: 'Referral not found'
      });
    }

    res.status(200).json({
      success: true,
      data: referral
    });
  } catch (error) {
    console.error('Error fetching referral:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch referral',
      error: error.message
    });
  }
};

/**
 * Update a referral
 * PUT /api/referrals/:id
 */
export const updateReferral = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { id } = req.params;
    const updates = req.body;

    // Find referral
    const referral = await Referral.findOne({ _id: id, userId });
    if (!referral) {
      return res.status(404).json({
        success: false,
        message: 'Referral not found'
      });
    }

    // Update fields
    const allowedUpdates = [
      'status',
      'requestContent',
      'tone',
      'notes',
      'followUpDate',
      'outcome',
      'gratitudeExpressed',
      'gratitudeDate',
      'etiquetteScore',
      'timingScore'
    ];

    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        referral[field] = updates[field];
      }
    });

    // Set dates based on status changes
    if (updates.status === 'requested' && !referral.requestedDate) {
      referral.requestedDate = new Date();
    }
    if (updates.status === 'accepted' || updates.status === 'declined') {
      if (!referral.responseDate) {
        referral.responseDate = new Date();
      }
    }

    await referral.save();
    await referral.populate('jobId contactId');

    res.status(200).json({
      success: true,
      message: 'Referral updated successfully',
      data: referral
    });
  } catch (error) {
    console.error('Error updating referral:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update referral',
      error: error.message
    });
  }
};

/**
 * Delete a referral
 * DELETE /api/referrals/:id
 */
export const deleteReferral = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { id } = req.params;

    const referral = await Referral.findOneAndDelete({ _id: id, userId });

    if (!referral) {
      return res.status(404).json({
        success: false,
        message: 'Referral not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Referral deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting referral:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete referral',
      error: error.message
    });
  }
};

/**
 * Generate referral template using AI
 * POST /api/referrals/generate-template
 */
export const generateTemplate = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { jobId, contactId, tone } = req.body;

    // Validate required fields
    if (!jobId || !contactId) {
      return res.status(400).json({
        success: false,
        message: 'Job ID and Contact ID are required'
      });
    }

    // Fetch job, contact, and user profile
    const job = await Job.findOne({ _id: jobId, userId });
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    const contact = await Contact.findOne({ _id: contactId, userId });
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    const user = await User.findOne({ auth0Id: userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    // Generate template using AI
    const generatedTemplate = await generateReferralTemplate(
      job,
      contact,
      user,
      tone || 'professional'
    );

    res.status(200).json({
      success: true,
      message: 'Referral template generated successfully',
      data: generatedTemplate
    });
  } catch (error) {
    console.error('Error generating referral template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate referral template',
      error: error.message
    });
  }
};

/**
 * Get referral analytics and success metrics
 * GET /api/referrals/analytics
 */
export const getReferralAnalytics = async (req, res) => {
  try {
    const userId = req.auth.userId;

    const referrals = await Referral.find({ userId });

    // Calculate metrics
    const totalReferrals = referrals.length;
    const byStatus = {
      draft: referrals.filter(r => r.status === 'draft').length,
      requested: referrals.filter(r => r.status === 'requested').length,
      accepted: referrals.filter(r => r.status === 'accepted').length,
      declined: referrals.filter(r => r.status === 'declined').length,
      no_response: referrals.filter(r => r.status === 'no_response').length
    };

    const byOutcome = {
      led_to_interview: referrals.filter(r => r.outcome === 'led_to_interview').length,
      led_to_offer: referrals.filter(r => r.outcome === 'led_to_offer').length,
      no_impact: referrals.filter(r => r.outcome === 'no_impact').length,
      pending: referrals.filter(r => r.outcome === 'pending').length
    };

    const successRate = totalReferrals > 0 
      ? ((byStatus.accepted / (totalReferrals - byStatus.draft)) * 100).toFixed(2)
      : 0;

    const avgEtiquetteScore = referrals.length > 0
      ? (referrals.reduce((sum, r) => sum + r.etiquetteScore, 0) / referrals.length).toFixed(2)
      : 0;

    const avgTimingScore = referrals.length > 0
      ? (referrals.reduce((sum, r) => sum + r.timingScore, 0) / referrals.length).toFixed(2)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        totalReferrals,
        byStatus,
        byOutcome,
        successRate: parseFloat(successRate),
        avgEtiquetteScore: parseFloat(avgEtiquetteScore),
        avgTimingScore: parseFloat(avgTimingScore),
        gratitudeExpressedCount: referrals.filter(r => r.gratitudeExpressed).length
      }
    });
  } catch (error) {
    console.error('Error fetching referral analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch referral analytics',
      error: error.message
    });
  }
};
