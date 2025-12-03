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

// @desc    Discover new contacts based on filters
// @route   GET /api/contacts/discover
// @access  Private
export const discoverContactsController = async (req, res) => {
  try {
    const { discoverContacts } = await import('../utils/contactDiscoveryService.js');
    
    const {
      industry,
      company,
      role,
      location,
      connectionType,
      university,
      q,
      page = 1,
      limit = 12,
      source = 'all' // 'all', 'mock', 'external'
    } = req.query;

    const results = await discoverContacts({
      industry,
      company,
      role,
      location,
      connectionType,
      university,
      q,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    // If requesting external sources, also fetch from APIs
    if (source === 'all' || source === 'external') {
      try {
        const { discoverExternalContacts } = await import('../utils/externalContactDiscoveryService.js');
        const externalResults = await discoverExternalContacts({
          query: q,
          industry,
          company,
          role,
          limit: Math.ceil(parseInt(limit) / 2)
        });

        // Merge external contacts with mock data
        if (externalResults.contacts && externalResults.contacts.length > 0) {
          // Add source badge to external contacts
          const externalContacts = externalResults.contacts.map(c => ({
            ...c,
            isExternal: true,
            sourceApi: c.source
          }));

          // Combine and sort by match score
          results.data = [...results.data, ...externalContacts]
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, parseInt(limit));

          // Add source info to response
          results.externalSources = externalResults.sources;
          results.externalErrors = externalResults.errors;
        }
      } catch (externalError) {
        console.error('External discovery error (non-fatal):', externalError.message);
        // Continue with mock data if external APIs fail
      }
    }

    res.status(200).json(results);
  } catch (error) {
    console.error('Error discovering contacts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to discover contacts',
      error: error.message
    });
  }
};

// @desc    Discover contacts from external APIs only (OpenAlex, Wikidata, Wikipedia)
// @route   GET /api/contacts/discover/external
// @access  Private
export const discoverExternalContactsController = async (req, res) => {
  try {
    const { discoverExternalContacts, searchOpenAlexAuthors, searchWikidataPersons } = 
      await import('../utils/externalContactDiscoveryService.js');
    
    const {
      query,
      industry,
      company,
      role,
      source, // 'openalex', 'wikidata', 'wikipedia', or undefined for all
      limit = 20
    } = req.query;

    let results;

    if (source === 'openalex') {
      const contacts = await searchOpenAlexAuthors({
        query,
        topic: industry,
        institution: company,
        limit: parseInt(limit)
      });
      results = { contacts, sources: ['OpenAlex'], errors: [] };
    } else if (source === 'wikidata') {
      const contacts = await searchWikidataPersons({
        occupation: role,
        company,
        industry,
        limit: parseInt(limit)
      });
      results = { contacts, sources: ['Wikidata'], errors: [] };
    } else {
      // Search all sources
      results = await discoverExternalContacts({
        query,
        industry,
        company,
        role,
        limit: parseInt(limit)
      });
    }

    res.status(200).json({
      success: true,
      data: results.contacts,
      sources: results.sources,
      errors: results.errors,
      pagination: {
        total: results.contacts.length,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error discovering external contacts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to discover external contacts',
      error: error.message
    });
  }
};

// @desc    Get discovery filter options
// @route   GET /api/contacts/discover/filters
// @access  Private
export const getDiscoveryFiltersController = async (req, res) => {
  try {
    const { getDiscoveryFilters } = await import('../utils/contactDiscoveryService.js');
    const filters = await getDiscoveryFilters();
    res.status(200).json(filters);
  } catch (error) {
    console.error('Error fetching discovery filters:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch discovery filters',
      error: error.message
    });
  }
};

// @desc    Get personalized contact suggestions
// @route   GET /api/contacts/discover/suggestions
// @access  Private
export const getSuggestedContactsController = async (req, res) => {
  try {
    const { getSuggestedContacts } = await import('../utils/contactDiscoveryService.js');
    const { Job } = await import('../models/Job.js');
    
    // Get user's target companies and industries from their job applications
    const jobs = await Job.find({ userId: req.auth.userId })
      .select('company industry jobTitle')
      .limit(20);

    const targetCompanies = [...new Set(jobs.map(j => j.company).filter(Boolean))];
    const targetIndustries = [...new Set(jobs.map(j => j.industry).filter(Boolean))];
    const targetRoles = [...new Set(jobs.map(j => j.jobTitle).filter(Boolean))];

    // TODO: Get user's university from profile when available
    const university = req.query.university || null;

    const suggestions = await getSuggestedContacts({
      targetCompanies,
      targetIndustries,
      targetRoles,
      university
    });

    res.status(200).json(suggestions);
  } catch (error) {
    console.error('Error fetching contact suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact suggestions',
      error: error.message
    });
  }
};

// @desc    Track discovery success (when user adds a discovered contact)
// @route   POST /api/contacts/discover/track
// @access  Private
export const trackDiscoverySuccess = async (req, res) => {
  try {
    const { discoveredContactId, action, notes } = req.body;

    // In a real implementation, this would store analytics data
    // For now, we just acknowledge the tracking
    console.log(`Discovery tracked: ${action} for contact ${discoveredContactId}`);

    res.status(200).json({
      success: true,
      message: 'Discovery action tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking discovery:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track discovery',
      error: error.message
    });
  }
};

// @desc    Find connection paths to a target contact/company
// @route   GET /api/contacts/connection-paths
// @access  Private
export const findConnectionPaths = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { targetCompany, targetPerson, targetRole } = req.query;

    if (!targetCompany && !targetPerson) {
      return res.status(400).json({
        success: false,
        message: 'Target company or person is required'
      });
    }

    // Get user's existing contacts
    const userContacts = await Contact.find({ userId })
      .lean();

    // Find direct connections (1st degree)
    const directConnections = userContacts.filter(contact => {
      if (targetCompany && contact.company?.toLowerCase().includes(targetCompany.toLowerCase())) {
        return true;
      }
      if (targetPerson) {
        const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
        if (fullName.includes(targetPerson.toLowerCase())) {
          return true;
        }
      }
      return false;
    });

    // Find potential paths through existing contacts
    const connectionPaths = [];

    // 1. Direct connections
    for (const contact of directConnections) {
      connectionPaths.push({
        pathType: 'direct',
        degree: 1,
        strength: 'strong',
        path: [
          {
            type: 'you',
            name: 'You',
            relationship: 'self'
          },
          {
            type: 'contact',
            id: contact._id,
            name: `${contact.firstName} ${contact.lastName}`,
            company: contact.company,
            role: contact.jobTitle,
            relationship: contact.relationshipType,
            lastContact: contact.lastContactDate
          }
        ],
        recommendation: `You have a direct connection to ${contact.firstName} at ${contact.company}. This is your strongest path.`,
        actionItems: [
          `Reach out to ${contact.firstName} directly`,
          `Ask for an introduction or insight about ${targetCompany || targetRole || 'the company'}`
        ]
      });
    }

    // 2. Indirect connections through shared companies/industries
    const potentialBridges = userContacts.filter(contact => {
      // Find contacts in related industries or with similar roles
      return contact.industry && !directConnections.find(d => d._id.toString() === contact._id.toString());
    });

    // Group by company for referral potential
    const companyGroups = {};
    for (const contact of userContacts) {
      if (contact.company) {
        if (!companyGroups[contact.company]) {
          companyGroups[contact.company] = [];
        }
        companyGroups[contact.company].push(contact);
      }
    }

    // Find 2nd degree connections (simulated)
    // In a real implementation, this would query external networks
    for (const contact of potentialBridges.slice(0, 5)) {
      // Check if contact might know someone at target company
      const hasRelatedIndustry = contact.industry && 
        targetCompany?.toLowerCase().includes(contact.industry.toLowerCase());
      
      if (hasRelatedIndustry || contact.relationshipType === 'Colleague' || contact.relationshipType === 'Mentor') {
        connectionPaths.push({
          pathType: 'indirect',
          degree: 2,
          strength: contact.relationshipType === 'Mentor' ? 'medium' : 'weak',
          path: [
            {
              type: 'you',
              name: 'You',
              relationship: 'self'
            },
            {
              type: 'contact',
              id: contact._id,
              name: `${contact.firstName} ${contact.lastName}`,
              company: contact.company,
              role: contact.jobTitle,
              relationship: contact.relationshipType
            },
            {
              type: 'potential',
              name: 'Potential Connection',
              company: targetCompany || 'Target Company',
              role: targetRole || 'Employee',
              relationship: 'unknown'
            }
          ],
          recommendation: `${contact.firstName} may know someone at ${targetCompany || 'your target company'}. Ask if they have any connections.`,
          actionItems: [
            `Check if ${contact.firstName} is connected to anyone at ${targetCompany || 'the target'}`,
            `Ask ${contact.firstName} for a warm introduction`
          ],
          probability: contact.relationshipType === 'Mentor' ? 0.7 : 0.4
        });
      }
    }

    // 3. Mock alumni/industry network paths
    const mockNetworkPaths = generateMockNetworkPaths(targetCompany, targetPerson, targetRole);
    
    // Combine and sort by degree/strength
    const allPaths = [...connectionPaths, ...mockNetworkPaths]
      .sort((a, b) => {
        if (a.degree !== b.degree) return a.degree - b.degree;
        const strengthOrder = { strong: 0, medium: 1, weak: 2 };
        return strengthOrder[a.strength] - strengthOrder[b.strength];
      });

    res.status(200).json({
      success: true,
      data: {
        target: {
          company: targetCompany,
          person: targetPerson,
          role: targetRole
        },
        pathsFound: allPaths.length,
        paths: allPaths,
        summary: {
          directConnections: directConnections.length,
          indirectPaths: allPaths.filter(p => p.degree > 1).length,
          strongestPath: allPaths[0] || null
        },
        recommendations: generateConnectionRecommendations(allPaths, targetCompany)
      }
    });
  } catch (error) {
    console.error('Error finding connection paths:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to find connection paths',
      error: error.message
    });
  }
};

// Helper function to generate mock network paths
function generateMockNetworkPaths(targetCompany, targetPerson, targetRole) {
  const mockPaths = [];
  
  if (targetCompany) {
    // Alumni network path
    mockPaths.push({
      pathType: 'alumni_network',
      degree: 2,
      strength: 'medium',
      path: [
        { type: 'you', name: 'You', relationship: 'self' },
        { type: 'network', name: 'Alumni Network', relationship: 'member' },
        { type: 'potential', name: 'Alumni at Company', company: targetCompany, role: 'Employee', relationship: 'alumni' }
      ],
      recommendation: `Check your university alumni network for connections at ${targetCompany}.`,
      actionItems: [
        'Search LinkedIn for alumni at the target company',
        'Reach out through alumni association channels',
        'Attend virtual networking events'
      ],
      probability: 0.5,
      source: 'alumni_network'
    });

    // Industry group path
    mockPaths.push({
      pathType: 'industry_group',
      degree: 2,
      strength: 'weak',
      path: [
        { type: 'you', name: 'You', relationship: 'self' },
        { type: 'network', name: 'Industry Group', relationship: 'member' },
        { type: 'potential', name: 'Group Member', company: targetCompany, relationship: 'group_member' }
      ],
      recommendation: `Join relevant industry groups where ${targetCompany} employees participate.`,
      actionItems: [
        'Join relevant LinkedIn groups',
        'Participate in industry forums',
        'Attend industry conferences or webinars'
      ],
      probability: 0.3,
      source: 'industry_network'
    });
  }

  return mockPaths;
}

// Helper function to generate recommendations
function generateConnectionRecommendations(paths, targetCompany) {
  const recommendations = [];

  if (paths.some(p => p.degree === 1)) {
    recommendations.push({
      priority: 'high',
      type: 'direct_outreach',
      title: 'Leverage Your Direct Connection',
      description: `You have direct connections to ${targetCompany || 'your target'}. Start there!`,
      icon: '🎯'
    });
  }

  if (paths.some(p => p.pathType === 'alumni_network')) {
    recommendations.push({
      priority: 'medium',
      type: 'alumni_network',
      title: 'Tap Into Your Alumni Network',
      description: 'Alumni are often willing to help fellow graduates. Check your school\'s network.',
      icon: '🎓'
    });
  }

  recommendations.push({
    priority: 'low',
    type: 'cold_outreach',
    title: 'Consider Thoughtful Cold Outreach',
    description: 'If other paths aren\'t available, a well-crafted cold message can still work.',
    icon: '💌'
  });

  return recommendations;
}
