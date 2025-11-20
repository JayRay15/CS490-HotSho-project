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
      notes: req.body.notes
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
