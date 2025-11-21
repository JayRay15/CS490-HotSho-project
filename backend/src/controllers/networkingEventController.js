import NetworkingEvent from '../models/NetworkingEvent.js';
import { searchEvents, getEventCategories } from '../utils/eventDiscoveryService.js';

// Get all networking events for user
export const getNetworkingEvents = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { 
      attendanceStatus, 
      industry, 
      eventType, 
      isVirtual,
      timeFilter, // 'upcoming', 'past', 'all'
      sortBy = 'eventDate',
      sortOrder = 'desc'
    } = req.query;

    // Build filter
    const filter = { userId };
    
    if (attendanceStatus) {
      filter.attendanceStatus = attendanceStatus;
    }
    
    if (industry) {
      filter.industry = industry;
    }
    
    if (eventType) {
      filter.eventType = eventType;
    }
    
    if (isVirtual !== undefined) {
      filter.isVirtual = isVirtual === 'true';
    }
    
    // Time-based filtering
    const now = new Date();
    if (timeFilter === 'upcoming') {
      filter.eventDate = { $gt: now };
      filter.attendanceStatus = { $ne: 'Cancelled' };
    } else if (timeFilter === 'past') {
      filter.eventDate = { $lte: now };
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const events = await NetworkingEvent.find(filter)
      .sort(sort)
      .populate('linkedJobApplications', 'title company')
      .populate('connections.contactId', 'firstName lastName company jobTitle');

    res.status(200).json({
      success: true,
      data: events
    });
  } catch (error) {
    console.error('Error fetching networking events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch networking events',
      error: error.message
    });
  }
};

// Get single networking event by ID
export const getNetworkingEventById = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { id } = req.params;

    const event = await NetworkingEvent.findOne({ _id: id, userId })
      .populate('linkedJobApplications', 'title company')
      .populate('connections.contactId', 'firstName lastName company jobTitle email phone');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Networking event not found'
      });
    }

    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('Error fetching networking event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch networking event',
      error: error.message
    });
  }
};

// Create new networking event
export const createNetworkingEvent = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const eventData = {
      ...req.body,
      userId
    };

    const event = await NetworkingEvent.create(eventData);

    res.status(201).json({
      success: true,
      message: 'Networking event created successfully',
      data: event
    });
  } catch (error) {
    console.error('Error creating networking event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create networking event',
      error: error.message
    });
  }
};

// Update networking event
export const updateNetworkingEvent = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { id } = req.params;

    const event = await NetworkingEvent.findOneAndUpdate(
      { _id: id, userId },
      req.body,
      { new: true, runValidators: true }
    )
      .populate('linkedJobApplications', 'title company')
      .populate('connections.contactId', 'firstName lastName company jobTitle');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Networking event not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Networking event updated successfully',
      data: event
    });
  } catch (error) {
    console.error('Error updating networking event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update networking event',
      error: error.message
    });
  }
};

// Delete networking event
export const deleteNetworkingEvent = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { id } = req.params;

    const event = await NetworkingEvent.findOneAndDelete({ _id: id, userId });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Networking event not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Networking event deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting networking event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete networking event',
      error: error.message
    });
  }
};

// Get networking statistics
export const getNetworkingStats = async (req, res) => {
  try {
    const userId = req.auth.userId;

    const now = new Date();
    
    // Total events
    const totalEvents = await NetworkingEvent.countDocuments({ userId });
    
    // Upcoming events
    const upcomingEvents = await NetworkingEvent.countDocuments({
      userId,
      eventDate: { $gt: now },
      attendanceStatus: { $ne: 'Cancelled' }
    });
    
    // Attended events
    const attendedEvents = await NetworkingEvent.countDocuments({
      userId,
      attendanceStatus: 'Attended'
    });
    
    // Total connections made
    const eventsWithConnections = await NetworkingEvent.find({ userId });
    const totalConnections = eventsWithConnections.reduce(
      (sum, event) => sum + (event.connectionsGained || 0),
      0
    );
    
    // Total job leads
    const totalJobLeads = eventsWithConnections.reduce(
      (sum, event) => sum + (event.jobLeadsGenerated || 0),
      0
    );
    
    // Average ROI rating
    const eventsWithRoi = eventsWithConnections.filter(e => e.roiRating);
    const avgRoiRating = eventsWithRoi.length > 0
      ? eventsWithRoi.reduce((sum, e) => sum + e.roiRating, 0) / eventsWithRoi.length
      : 0;
    
    // Goal completion rate
    let totalGoals = 0;
    let achievedGoals = 0;
    eventsWithConnections.forEach(event => {
      if (event.goals && event.goals.length > 0) {
        totalGoals += event.goals.length;
        achievedGoals += event.goals.filter(g => g.achieved).length;
      }
    });
    const goalCompletionRate = totalGoals > 0 
      ? Math.round((achievedGoals / totalGoals) * 100)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        totalEvents,
        upcomingEvents,
        attendedEvents,
        totalConnections,
        totalJobLeads,
        avgRoiRating: Math.round(avgRoiRating * 10) / 10,
        goalCompletionRate
      }
    });
  } catch (error) {
    console.error('Error fetching networking stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch networking statistics',
      error: error.message
    });
  }
};

// Add connection to event
export const addConnection = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { id } = req.params;
    const connectionData = req.body;

    const event = await NetworkingEvent.findOne({ _id: id, userId });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Networking event not found'
      });
    }

    event.connections.push(connectionData);
    event.connectionsGained = event.connections.length;
    await event.save();

    res.status(200).json({
      success: true,
      message: 'Connection added successfully',
      data: event
    });
  } catch (error) {
    console.error('Error adding connection:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add connection',
      error: error.message
    });
  }
};

// Update connection
export const updateConnection = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { id, connectionId } = req.params;
    const updateData = req.body;

    const event = await NetworkingEvent.findOne({ _id: id, userId });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Networking event not found'
      });
    }

    const connection = event.connections.id(connectionId);
    if (!connection) {
      return res.status(404).json({
        success: false,
        message: 'Connection not found'
      });
    }

    Object.assign(connection, updateData);
    await event.save();

    res.status(200).json({
      success: true,
      message: 'Connection updated successfully',
      data: event
    });
  } catch (error) {
    console.error('Error updating connection:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update connection',
      error: error.message
    });
  }
};

// Delete connection
export const deleteConnection = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { id, connectionId } = req.params;

    const event = await NetworkingEvent.findOne({ _id: id, userId });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Networking event not found'
      });
    }

    event.connections.pull(connectionId);
    event.connectionsGained = event.connections.length;
    await event.save();

    res.status(200).json({
      success: true,
      message: 'Connection removed successfully',
      data: event
    });
  } catch (error) {
    console.error('Error deleting connection:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete connection',
      error: error.message
    });
  }
};

// Discover events from Eventbrite
export const discoverEvents = async (req, res) => {
  try {
    const { location, q, categories, startDate, endDate, page } = req.query;

    const searchParams = {
      location,
      q,
      categories,
      startDate,
      endDate,
      page: page ? parseInt(page) : 1
    };

    const results = await searchEvents(searchParams);

    res.status(200).json({
      success: true,
      data: results.events,
      pagination: results.pagination
    });
  } catch (error) {
    console.error('Error discovering events:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to discover events',
      error: error.message
    });
  }
};

// Get event categories
export const getCategories = async (req, res) => {
  try {
    const categories = await getEventCategories();

    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event categories',
      error: error.message
    });
  }
};
