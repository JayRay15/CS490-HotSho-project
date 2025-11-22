import Contact from '../models/Contact.js';
import { Job } from '../models/Job.js';

// @desc    Get all contacts for authenticated user
// @route   GET /api/contacts
// @access  Private
export const getContacts = async (req, res) => {
  try {
    const { search, relationshipType, company, sortBy } = req.query;

    // Build query
    const query = { userId: req.auth.userId };

    // Search filter
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { jobTitle: { $regex: search, $options: 'i' } }
      ];
    }

    // Relationship type filter
    if (relationshipType && relationshipType !== 'All') {
      query.relationshipType = relationshipType;
    }

    // Company filter
    if (company) {
      query.company = { $regex: company, $options: 'i' };
    }

    // Build sort
    let sort = {};
    switch (sortBy) {
      case 'name':
        sort = { lastName: 1, firstName: 1 };
        break;
      case 'company':
        sort = { company: 1, lastName: 1 };
        break;
      case 'lastContact':
        sort = { lastContactDate: -1 };
        break;
      case 'nextFollowUp':
        sort = { nextFollowUpDate: 1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

    const contacts = await Contact.find(query)
      .sort(sort)
      .populate('linkedJobIds', 'company jobTitle');

    res.status(200).json({
      success: true,
      count: contacts.length,
      data: contacts
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contacts',
      error: error.message
    });
  }
};

// @desc    Get single contact by ID
// @route   GET /api/contacts/:id
// @access  Private
export const getContactById = async (req, res) => {
  try {
    const contact = await Contact.findOne({
      _id: req.params.id,
      userId: req.auth.userId
    }).populate('linkedJobIds', 'company jobTitle status');

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    res.status(200).json({
      success: true,
      data: contact
    });
  } catch (error) {
    console.error('Error fetching contact:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact',
      error: error.message
    });
  }
};

// @desc    Create new contact
// @route   POST /api/contacts
// @access  Private
export const createContact = async (req, res) => {
  try {
    const contactData = {
      ...req.body,
      userId: req.auth.userId
    };

    // Set lastContactDate to now if first interaction exists
    if (contactData.interactions && contactData.interactions.length > 0) {
      contactData.lastContactDate = contactData.interactions[0].date || new Date();
    }

    const contact = await Contact.create(contactData);

    res.status(201).json({
      success: true,
      message: 'Contact created successfully',
      data: contact
    });
  } catch (error) {
    console.error('Error creating contact:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create contact',
      error: error.message
    });
  }
};

// @desc    Update contact
// @route   PUT /api/contacts/:id
// @access  Private
export const updateContact = async (req, res) => {
  try {
    const contact = await Contact.findOne({
      _id: req.params.id,
      userId: req.auth.userId
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      contact[key] = req.body[key];
    });

    // Update lastContactDate if interactions were modified
    if (req.body.interactions && req.body.interactions.length > 0) {
      const sortedInteractions = [...req.body.interactions].sort((a, b) =>
        new Date(b.date) - new Date(a.date)
      );
      contact.lastContactDate = sortedInteractions[0].date;
    }

    await contact.save();

    res.status(200).json({
      success: true,
      message: 'Contact updated successfully',
      data: contact
    });
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update contact',
      error: error.message
    });
  }
};

// @desc    Delete contact
// @route   DELETE /api/contacts/:id
// @access  Private
export const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findOneAndDelete({
      _id: req.params.id,
      userId: req.auth.userId
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Contact deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete contact',
      error: error.message
    });
  }
};

// @desc    Add interaction to contact
// @route   POST /api/contacts/:id/interactions
// @access  Private
export const addInteraction = async (req, res) => {
  try {
    const contact = await Contact.findOne({
      _id: req.params.id,
      userId: req.auth.userId
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    const interaction = {
      date: req.body.date || new Date(),
      type: req.body.type,
      notes: req.body.notes,
      jobId: req.body.jobId
    };

    contact.interactions.push(interaction);
    contact.lastContactDate = interaction.date;

    await contact.save();

    res.status(200).json({
      success: true,
      message: 'Interaction added successfully',
      data: contact
    });
  } catch (error) {
    console.error('Error adding interaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add interaction',
      error: error.message
    });
  }
};

// @desc    Get contacts with upcoming follow-ups
// @route   GET /api/contacts/follow-ups/upcoming
// @access  Private
export const getUpcomingFollowUps = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    futureDate.setHours(23, 59, 59, 999);

    const contacts = await Contact.find({
      userId: req.auth.userId,
      reminderEnabled: true,
      nextFollowUpDate: {
        $gte: today,
        $lte: futureDate
      }
    }).sort({ nextFollowUpDate: 1 });

    res.status(200).json({
      success: true,
      count: contacts.length,
      data: contacts
    });
  } catch (error) {
    console.error('Error fetching upcoming follow-ups:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upcoming follow-ups',
      error: error.message
    });
  }
};

// @desc    Get contact statistics
// @route   GET /api/contacts/stats
// @access  Private
export const getContactStats = async (req, res) => {
  try {
    const contacts = await Contact.find({ userId: req.auth.userId });

    const stats = {
      total: contacts.length,
      byRelationshipType: {},
      byRelationshipStrength: {},
      withUpcomingFollowUps: 0,
      recentInteractions: 0
    };

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    contacts.forEach(contact => {
      // Count by relationship type
      stats.byRelationshipType[contact.relationshipType] =
        (stats.byRelationshipType[contact.relationshipType] || 0) + 1;

      // Count by relationship strength
      stats.byRelationshipStrength[contact.relationshipStrength] =
        (stats.byRelationshipStrength[contact.relationshipStrength] || 0) + 1;

      // Count upcoming follow-ups
      if (contact.nextFollowUpDate && contact.nextFollowUpDate >= new Date()) {
        stats.withUpcomingFollowUps++;
      }

      // Count recent interactions
      if (contact.lastContactDate && contact.lastContactDate >= thirtyDaysAgo) {
        stats.recentInteractions++;
      }

      // Reference stats
      if (contact.isReference) {
        stats.totalReferences = (stats.totalReferences || 0) + 1;

        // Count reference interactions
        contact.interactions.forEach(interaction => {
          if (interaction.type === 'Reference Request') {
            stats.referenceRequests = (stats.referenceRequests || 0) + 1;
          }
          if (interaction.type === 'Reference Feedback') {
            stats.referenceFeedback = (stats.referenceFeedback || 0) + 1;
          }
        });
      }
    });

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching contact stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact statistics',
      error: error.message
    });
  }
};

// @desc    Link contact to job
// @route   POST /api/contacts/:id/link-job/:jobId
// @access  Private
export const linkContactToJob = async (req, res) => {
  try {
    const contact = await Contact.findOne({
      _id: req.params.id,
      userId: req.auth.userId
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    const job = await Job.findOne({
      _id: req.params.jobId,
      userId: req.auth.userId
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Add job to contact's linkedJobIds if not already present
    if (!contact.linkedJobIds.includes(req.params.jobId)) {
      contact.linkedJobIds.push(req.params.jobId);
      await contact.save();
    }

    res.status(200).json({
      success: true,
      message: 'Contact linked to job successfully',
      data: contact
    });
  } catch (error) {
    console.error('Error linking contact to job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to link contact to job',
      error: error.message
    });
  }
};

// @desc    Batch create contacts
// @route   POST /api/contacts/batch
// @access  Private
export const batchCreateContacts = async (req, res) => {
  try {
    const contacts = req.body.contacts;

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No contacts provided'
      });
    }

    // Add userId to each contact
    const contactsWithUser = contacts.map(contact => ({
      ...contact,
      userId: req.auth.userId,
      // Ensure defaults
      relationshipType: contact.relationshipType || 'Other',
      relationshipStrength: contact.relationshipStrength || 'New'
    }));

    // Filter out duplicates based on email if provided
    // This is a simple check, a more robust one would check against DB
    // For now, we rely on the client to handle duplicates or let MongoDB handle unique constraints if any (email is not unique in schema)

    const createdContacts = await Contact.insertMany(contactsWithUser);

    res.status(201).json({
      success: true,
      message: `Successfully imported ${createdContacts.length} contacts`,
      data: createdContacts
    });
  } catch (error) {
    console.error('Error batch creating contacts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import contacts',
      error: error.message
    });
  }
};

// @desc    Generate reference request email
// @route   POST /api/contacts/reference-request
// @access  Private
export const generateReferenceRequest = async (req, res) => {
  try {
    const { referenceId, jobId } = req.body;

    if (!referenceId || !jobId) {
      return res.status(400).json({
        success: false,
        message: 'Reference ID and Job ID are required'
      });
    }

    // Fetch the reference contact
    const reference = await Contact.findOne({
      _id: referenceId,
      userId: req.auth.userId
    });

    if (!reference) {
      return res.status(404).json({
        success: false,
        message: 'Reference contact not found'
      });
    }

    // Fetch the job
    const job = await Job.findOne({
      _id: jobId,
      userId: req.auth.userId
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job application not found'
      });
    }

    // Fetch user profile (we'll need to import User model or get data from elsewhere)
    // For now, we'll create a minimal profile from available data
    const userProfile = {
      employment: [],
      headline: '',
      // In a real implementation, fetch from User/Profile model
    };

    // Generate the reference request using Gemini
    const { generateReferenceRequestEmail } = await import('../utils/geminiService.js');
    const requestData = await generateReferenceRequestEmail(reference, job, userProfile);

    // Track this usage
    const interaction = {
      date: new Date(),
      type: 'Reference Request',
      notes: `Generated reference request for ${job.jobTitle} at ${job.company}`,
      jobId: job._id
    };

    reference.interactions.push(interaction);
    reference.lastContactDate = interaction.date;

    // Ensure job is linked
    if (!reference.linkedJobIds.includes(job._id)) {
      reference.linkedJobIds.push(job._id);
    }

    await reference.save();

    res.status(200).json({
      success: true,
      data: requestData
    });
  } catch (error) {
    console.error('Error generating reference request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate reference request',
      error: error.message
    });
  }
};
