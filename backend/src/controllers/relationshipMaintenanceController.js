import RelationshipReminder from '../models/RelationshipReminder.js';
import RelationshipActivity from '../models/RelationshipActivity.js';
import Contact from '../models/Contact.js';

// Message templates for different reminder types
const messageTemplates = {
  'General Check-in': [
    "Hi {firstName}, it's been a while! Hope you're doing well. Would love to catch up over coffee soon.",
    "Hey {firstName}, just wanted to reach out and see how things are going with you. Let's schedule a time to connect!",
    "Hi {firstName}, thinking of you and wanted to reconnect. How have you been?",
    "Hello {firstName}, hope all is well! Would love to hear what you've been up to lately."
  ],
  'Birthday': [
    "Happy Birthday, {firstName}! Wishing you a fantastic year ahead filled with success and happiness! 🎉",
    "Happy Birthday {firstName}! Hope you have an amazing day and a wonderful year ahead! 🎂",
    "Wishing you a very Happy Birthday, {firstName}! May this year bring you great opportunities and joy! 🎈"
  ],
  'Congratulations': [
    "Congratulations on {achievement}, {firstName}! That's fantastic news and well deserved!",
    "So excited to hear about {achievement}, {firstName}! Congratulations on this amazing accomplishment!",
    "Huge congratulations, {firstName}! Your achievement with {achievement} is truly impressive!"
  ],
  'Industry News Share': [
    "Hi {firstName}, came across this article about {topic} and thought of you. Would love to hear your thoughts!",
    "Hey {firstName}, saw this interesting piece on {topic} and thought you might find it relevant given your work in {industry}.",
    "Hi {firstName}, this article about {topic} reminded me of our conversation. What do you think?"
  ],
  'Thank You': [
    "Hi {firstName}, I wanted to reach out and thank you again for {reason}. Your help made a real difference!",
    "Thank you so much, {firstName}, for {reason}. I really appreciate your support and guidance!",
    "Just wanted to say thank you again, {firstName}, for {reason}. Your assistance was invaluable!"
  ],
  'Follow-up': [
    "Hi {firstName}, wanted to follow up on our conversation about {topic}. Any updates on your end?",
    "Hey {firstName}, following up on {topic} we discussed. Let me know if you need any additional information!",
    "Hi {firstName}, just checking in regarding {topic}. Looking forward to hearing from you!"
  ],
  'Coffee Chat': [
    "Hi {firstName}, would love to grab coffee and catch up! Are you free sometime next week?",
    "Hey {firstName}, it's been too long! Want to meet up for coffee and hear what you've been working on?",
    "Hi {firstName}, I'd love to buy you a coffee and pick your brain about {topic}. When works for you?"
  ]
};

// @desc    Get all reminders for authenticated user
// @route   GET /api/relationship-reminders
// @access  Private
export const getReminders = async (req, res) => {
  try {
    const { status, reminderType, priority, contactId, upcoming, overdue } = req.query;
    
    const query = { userId: req.auth.userId };
    
    if (status) {
      query.status = status;
    }
    
    if (reminderType) {
      query.reminderType = reminderType;
    }
    
    if (priority) {
      query.priority = priority;
    }
    
    if (contactId) {
      query.contactId = contactId;
    }
    
    // Filter for upcoming reminders (next 7 days)
    if (upcoming === 'true') {
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      query.reminderDate = { $gte: now, $lte: sevenDaysFromNow };
      query.status = 'Pending';
    }
    
    // Filter for overdue reminders
    if (overdue === 'true') {
      query.reminderDate = { $lt: new Date() };
      query.status = 'Pending';
    }
    
    const reminders = await RelationshipReminder.find(query)
      .populate('contactId', 'firstName lastName company jobTitle email relationshipType relationshipStrength')
      .sort({ reminderDate: 1 });
    
    res.json(reminders);
  } catch (error) {
    console.error('Error fetching reminders:', error);
    res.status(500).json({ message: 'Server error fetching reminders' });
  }
};

// @desc    Get reminder by ID
// @route   GET /api/relationship-reminders/:id
// @access  Private
export const getReminderById = async (req, res) => {
  try {
    const reminder = await RelationshipReminder.findOne({
      _id: req.params.id,
      userId: req.auth.userId
    }).populate('contactId');
    
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }
    
    res.json(reminder);
  } catch (error) {
    console.error('Error fetching reminder:', error);
    res.status(500).json({ message: 'Server error fetching reminder' });
  }
};

// @desc    Create a new reminder
// @route   POST /api/relationship-reminders
// @access  Private
export const createReminder = async (req, res) => {
  try {
    const {
      contactId,
      reminderType,
      reminderDate,
      priority,
      title,
      description,
      suggestedMessage,
      isRecurring,
      recurrencePattern,
      recurrenceInterval
    } = req.body;
    
    // Verify contact belongs to user
    const contact = await Contact.findOne({
      _id: contactId,
      userId: req.auth.userId
    });
    
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }
    
    const reminder = new RelationshipReminder({
      userId: req.auth.userId,
      contactId,
      reminderType,
      reminderDate,
      priority: priority || 'Medium',
      title,
      description,
      suggestedMessage,
      isRecurring: isRecurring || false,
      recurrencePattern,
      recurrenceInterval
    });
    
    // Calculate next recurrence if recurring
    if (isRecurring && recurrencePattern) {
      if (recurrencePattern === 'Custom' && recurrenceInterval) {
        const next = new Date(reminderDate);
        next.setDate(next.getDate() + recurrenceInterval);
        reminder.nextRecurrenceDate = next;
      } else {
        reminder.nextRecurrenceDate = calculateNextRecurrence(reminderDate, recurrencePattern);
      }
    }
    
    await reminder.save();
    
    const populatedReminder = await RelationshipReminder.findById(reminder._id)
      .populate('contactId', 'firstName lastName company jobTitle email');
    
    res.status(201).json(populatedReminder);
  } catch (error) {
    console.error('Error creating reminder:', error);
    res.status(500).json({ message: 'Server error creating reminder' });
  }
};

// @desc    Update reminder
// @route   PUT /api/relationship-reminders/:id
// @access  Private
export const updateReminder = async (req, res) => {
  try {
    const reminder = await RelationshipReminder.findOne({
      _id: req.params.id,
      userId: req.auth.userId
    });
    
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }
    
    const allowedUpdates = [
      'reminderType',
      'reminderDate',
      'priority',
      'title',
      'description',
      'suggestedMessage',
      'isRecurring',
      'recurrencePattern',
      'recurrenceInterval'
    ];
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        reminder[field] = req.body[field];
      }
    });
    
    // Recalculate next recurrence if needed
    if (reminder.isRecurring && reminder.recurrencePattern) {
      if (reminder.recurrencePattern === 'Custom' && reminder.recurrenceInterval) {
        const next = new Date(reminder.reminderDate);
        next.setDate(next.getDate() + reminder.recurrenceInterval);
        reminder.nextRecurrenceDate = next;
      } else {
        reminder.nextRecurrenceDate = calculateNextRecurrence(reminder.reminderDate, reminder.recurrencePattern);
      }
    }
    
    await reminder.save();
    
    const populatedReminder = await RelationshipReminder.findById(reminder._id)
      .populate('contactId', 'firstName lastName company jobTitle email');
    
    res.json(populatedReminder);
  } catch (error) {
    console.error('Error updating reminder:', error);
    res.status(500).json({ message: 'Server error updating reminder' });
  }
};

// @desc    Complete reminder
// @route   POST /api/relationship-reminders/:id/complete
// @access  Private
export const completeReminder = async (req, res) => {
  try {
    const { notes, logActivity } = req.body;
    
    const reminder = await RelationshipReminder.findOne({
      _id: req.params.id,
      userId: req.auth.userId
    });
    
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }
    
    await reminder.complete(notes);
    
    // Optionally log the activity
    if (logActivity) {
      const activity = new RelationshipActivity({
        userId: req.auth.userId,
        contactId: reminder.contactId,
        activityType: getActivityTypeForReminder(reminder.reminderType),
        activityDate: new Date(),
        direction: 'Outbound',
        notes: notes || `Completed ${reminder.reminderType} reminder`,
        linkedReminderId: reminder._id
      });
      await activity.save();
      
      // Update contact's last contact date
      await Contact.findByIdAndUpdate(reminder.contactId, {
        lastContactDate: new Date()
      });
    }
    
    const populatedReminder = await RelationshipReminder.findById(reminder._id)
      .populate('contactId', 'firstName lastName company jobTitle email');
    
    res.json(populatedReminder);
  } catch (error) {
    console.error('Error completing reminder:', error);
    res.status(500).json({ message: 'Server error completing reminder' });
  }
};

// @desc    Snooze reminder
// @route   POST /api/relationship-reminders/:id/snooze
// @access  Private
export const snoozeReminder = async (req, res) => {
  try {
    const { days } = req.body;
    
    if (!days || days < 1) {
      return res.status(400).json({ message: 'Invalid snooze duration' });
    }
    
    const reminder = await RelationshipReminder.findOne({
      _id: req.params.id,
      userId: req.auth.userId
    });
    
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }
    
    await reminder.snooze(days);
    
    const populatedReminder = await RelationshipReminder.findById(reminder._id)
      .populate('contactId', 'firstName lastName company jobTitle email');
    
    res.json(populatedReminder);
  } catch (error) {
    console.error('Error snoozing reminder:', error);
    res.status(500).json({ message: 'Server error snoozing reminder' });
  }
};

// @desc    Dismiss reminder
// @route   POST /api/relationship-reminders/:id/dismiss
// @access  Private
export const dismissReminder = async (req, res) => {
  try {
    const reminder = await RelationshipReminder.findOne({
      _id: req.params.id,
      userId: req.auth.userId
    });
    
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }
    
    reminder.status = 'Dismissed';
    await reminder.save();
    
    res.json({ message: 'Reminder dismissed successfully' });
  } catch (error) {
    console.error('Error dismissing reminder:', error);
    res.status(500).json({ message: 'Server error dismissing reminder' });
  }
};

// @desc    Delete reminder
// @route   DELETE /api/relationship-reminders/:id
// @access  Private
export const deleteReminder = async (req, res) => {
  try {
    const reminder = await RelationshipReminder.findOneAndDelete({
      _id: req.params.id,
      userId: req.auth.userId
    });
    
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }
    
    res.json({ message: 'Reminder deleted successfully' });
  } catch (error) {
    console.error('Error deleting reminder:', error);
    res.status(500).json({ message: 'Server error deleting reminder' });
  }
};

// @desc    Generate automated reminders for contacts
// @route   POST /api/relationship-reminders/generate
// @access  Private
export const generateReminders = async (req, res) => {
  try {
    const contacts = await Contact.find({ userId: req.auth.userId });
    const remindersCreated = [];
    const now = new Date();
    now.setUTCHours(0, 0, 0, 0); // Set to midnight UTC for consistent date handling
    
    for (const contact of contacts) {
      // Check birthday - always check for birthday reminders
      if (contact.birthday) {
        // Skip if already has a pending birthday reminder
        const existingBirthdayReminder = await RelationshipReminder.findOne({
          userId: req.auth.userId,
          contactId: contact._id,
          reminderType: 'Birthday',
          status: 'Pending'
        });
        
        if (!existingBirthdayReminder) {
          const birthdayReminder = await generateBirthdayReminder(req.auth.userId, contact);
          if (birthdayReminder) remindersCreated.push(birthdayReminder);
        }
      }
      
      // Skip check-in reminders if already has any pending check-in reminder
      const existingCheckInReminder = await RelationshipReminder.findOne({
        userId: req.auth.userId,
        contactId: contact._id,
        reminderType: 'General Check-in',
        status: 'Pending'
      });
      
      if (existingCheckInReminder) continue;
      
      // Check last contact date for general check-in
      if (contact.lastContactDate) {
        const daysSinceContact = Math.floor((now - new Date(contact.lastContactDate)) / (1000 * 60 * 60 * 24));
        
        let reminderNeeded = false;
        let priority = 'Medium';
        
        if (contact.relationshipStrength === 'Strong' && daysSinceContact > 14) {
          reminderNeeded = true;
          priority = 'High';
        } else if (contact.relationshipStrength === 'Medium' && daysSinceContact > 30) {
          reminderNeeded = true;
          priority = 'Medium';
        } else if (contact.relationshipStrength === 'Weak' && daysSinceContact > 60) {
          reminderNeeded = true;
          priority = 'Low';
        }
        
        if (reminderNeeded) {
          const reminderDate = new Date();
          reminderDate.setUTCHours(0, 0, 0, 0); // Set to midnight UTC
          const checkInReminder = new RelationshipReminder({
            userId: req.auth.userId,
            contactId: contact._id,
            reminderType: 'General Check-in',
            reminderDate,
            priority,
            title: `Check in with ${contact.firstName} ${contact.lastName}`,
            description: `It's been ${daysSinceContact} days since your last contact`,
            suggestedMessage: generateMessage('General Check-in', contact),
            autoGenerated: true,
            generationReason: `${daysSinceContact} days since last contact`
          });
          
          await checkInReminder.save();
          remindersCreated.push(checkInReminder);
        }
      } else {
        // No contact history - create initial reach-out reminder
        const reminderDate = new Date();
        reminderDate.setUTCHours(0, 0, 0, 0); // Set to midnight UTC
        const initialReminder = new RelationshipReminder({
          userId: req.auth.userId,
          contactId: contact._id,
          reminderType: 'General Check-in',
          reminderDate,
          priority: 'Medium',
          title: `Reach out to ${contact.firstName} ${contact.lastName}`,
          description: 'Initial contact to establish relationship',
          suggestedMessage: generateMessage('General Check-in', contact),
          autoGenerated: true,
          generationReason: 'No previous contact history'
        });
        
        await initialReminder.save();
        remindersCreated.push(initialReminder);
      }
    }
    
    res.json({
      message: `Generated ${remindersCreated.length} reminders`,
      count: remindersCreated.length,
      reminders: remindersCreated
    });
  } catch (error) {
    console.error('Error generating reminders:', error);
    res.status(500).json({ message: 'Server error generating reminders' });
  }
};

// @desc    Get message templates
// @route   GET /api/relationship-reminders/templates
// @access  Private
export const getMessageTemplates = async (req, res) => {
  try {
    const { reminderType, contactId } = req.query;
    
    if (!reminderType) {
      return res.json({ templates: messageTemplates });
    }
    
    let templates = messageTemplates[reminderType] || [];
    
    // Personalize templates if contactId provided
    if (contactId) {
      const contact = await Contact.findOne({
        _id: contactId,
        userId: req.auth.userId
      });
      
      if (contact) {
        templates = templates.map(template => 
          personalizeMessage(template, contact)
        );
      }
    }
    
    res.json({ reminderType, templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ message: 'Server error fetching templates' });
  }
};

// @desc    Get relationship activities
// @route   GET /api/relationship-activities
// @access  Private
export const getActivities = async (req, res) => {
  try {
    const { contactId, activityType, startDate, endDate, limit } = req.query;
    
    const query = { userId: req.auth.userId };
    
    if (contactId) {
      query.contactId = contactId;
    }
    
    if (activityType) {
      query.activityType = activityType;
    }
    
    if (startDate || endDate) {
      query.activityDate = {};
      if (startDate) query.activityDate.$gte = new Date(startDate);
      if (endDate) query.activityDate.$lte = new Date(endDate);
    }
    
    const activities = await RelationshipActivity.find(query)
      .populate('contactId', 'firstName lastName company jobTitle email')
      .sort({ activityDate: -1 })
      .limit(limit ? parseInt(limit) : 100);
    
    res.json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ message: 'Server error fetching activities' });
  }
};

// @desc    Create activity
// @route   POST /api/relationship-activities
// @access  Private
export const createActivity = async (req, res) => {
  try {
    const {
      contactId,
      activityType,
      activityDate,
      direction,
      subject,
      notes,
      sentiment,
      responseReceived,
      valueExchange,
      valueType,
      opportunityGenerated,
      opportunityType,
      linkedJobId,
      followUpRequired,
      followUpDate,
      tags
    } = req.body;
    
    // Verify contact belongs to user
    const contact = await Contact.findOne({
      _id: contactId,
      userId: req.auth.userId
    });
    
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }
    
    const activity = new RelationshipActivity({
      userId: req.auth.userId,
      contactId,
      activityType,
      activityDate: activityDate || new Date(),
      direction: direction || 'Outbound',
      subject,
      notes,
      sentiment: sentiment || 'Neutral',
      responseReceived: responseReceived || false,
      valueExchange: valueExchange || 'None',
      valueType: valueType || undefined, // Convert empty string to undefined
      opportunityGenerated: opportunityGenerated || false,
      opportunityType: opportunityType || undefined, // Convert empty string to undefined
      linkedJobId,
      followUpRequired: followUpRequired || false,
      followUpDate: followUpDate || undefined, // Convert empty string to undefined
      tags
    });
    
    await activity.save();
    
    // Update contact's last contact date
    await Contact.findByIdAndUpdate(contactId, {
      lastContactDate: activityDate || new Date()
    });
    
    const populatedActivity = await RelationshipActivity.findById(activity._id)
      .populate('contactId', 'firstName lastName company jobTitle email');
    
    res.status(201).json(populatedActivity);
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({ message: 'Server error creating activity' });
  }
};

// @desc    Get relationship health for a contact
// @route   GET /api/relationship-activities/health/:contactId
// @access  Private
export const getRelationshipHealth = async (req, res) => {
  try {
    const contact = await Contact.findOne({
      _id: req.params.contactId,
      userId: req.auth.userId
    });
    
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }
    
    const health = await RelationshipActivity.calculateRelationshipHealth(
      req.auth.userId,
      req.params.contactId
    );
    
    res.json({
      contactId: req.params.contactId,
      contactName: `${contact.firstName} ${contact.lastName}`,
      ...health
    });
  } catch (error) {
    console.error('Error calculating relationship health:', error);
    res.status(500).json({ message: 'Server error calculating relationship health' });
  }
};

// @desc    Get relationship analytics
// @route   GET /api/relationship-activities/analytics
// @access  Private
export const getRelationshipAnalytics = async (req, res) => {
  try {
    const activities = await RelationshipActivity.find({
      userId: req.auth.userId
    });
    
    const contacts = await Contact.find({ userId: req.auth.userId });
    
    // Calculate overall metrics
    const totalActivities = activities.length;
    const opportunitiesGenerated = activities.filter(a => a.opportunityGenerated).length;
    const outboundActivities = activities.filter(a => a.direction === 'Outbound').length;
    const inboundActivities = activities.filter(a => a.direction === 'Inbound').length;
    
    const activityTypes = {};
    activities.forEach(a => {
      activityTypes[a.activityType] = (activityTypes[a.activityType] || 0) + 1;
    });
    
    const valueExchanges = {
      given: activities.filter(a => a.valueExchange === 'Given').length,
      received: activities.filter(a => a.valueExchange === 'Received').length,
      mutual: activities.filter(a => a.valueExchange === 'Mutual').length
    };
    
    // Get active vs inactive contacts
    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
    const activeContacts = contacts.filter(c => 
      c.lastContactDate && new Date(c.lastContactDate) >= thirtyDaysAgo
    ).length;
    
    res.json({
      totalContacts: contacts.length,
      activeContacts,
      inactiveContacts: contacts.length - activeContacts,
      totalActivities,
      opportunitiesGenerated,
      outboundActivities,
      inboundActivities,
      reciprocityRate: inboundActivities > 0 ? 
        Math.round((inboundActivities / outboundActivities) * 100) : 0,
      activityTypes,
      valueExchanges
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Server error fetching analytics' });
  }
};

// Helper functions

function calculateNextRecurrence(currentDate, pattern) {
  const next = new Date(currentDate);
  switch (pattern) {
    case 'Daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'Weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'Biweekly':
      next.setDate(next.getDate() + 14);
      break;
    case 'Monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'Quarterly':
      next.setMonth(next.getMonth() + 3);
      break;
    case 'Yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}

function generateMessage(reminderType, contact) {
  const templates = messageTemplates[reminderType] || [];
  if (templates.length === 0) return '';
  
  const template = templates[Math.floor(Math.random() * templates.length)];
  return personalizeMessage(template, contact);
}

function personalizeMessage(template, contact) {
  return template
    .replace(/{firstName}/g, contact.firstName)
    .replace(/{lastName}/g, contact.lastName)
    .replace(/{company}/g, contact.company || 'your company')
    .replace(/{industry}/g, contact.industry || 'the industry')
    .replace(/{jobTitle}/g, contact.jobTitle || 'your role');
}

async function generateBirthdayReminder(userId, contact) {
  if (!contact.birthday) return null;
  
  // Parse birthday - supports multiple formats: MM/DD, MM/DD/YYYY, YYYY-MM-DD
  let month, day;
  
  if (contact.birthday.includes('-')) {
    // Format: YYYY-MM-DD
    const parts = contact.birthday.split('-');
    if (parts.length === 3) {
      month = parseInt(parts[1]) - 1; // 0-indexed
      day = parseInt(parts[2]);
    } else {
      return null;
    }
  } else if (contact.birthday.includes('/')) {
    // Format: MM/DD or MM/DD/YYYY
    const parts = contact.birthday.split('/');
    if (parts.length < 2) return null;
    month = parseInt(parts[0]) - 1; // 0-indexed
    day = parseInt(parts[1]);
  } else {
    return null;
  }
  
  if (isNaN(month) || isNaN(day)) return null;
  
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0); // Start of today in UTC
  
  const thisYearBirthday = new Date(Date.UTC(now.getUTCFullYear(), month, day));
  thisYearBirthday.setUTCHours(0, 0, 0, 0);
  
  // If birthday already passed this year, schedule for next year
  if (thisYearBirthday < now) {
    thisYearBirthday.setFullYear(thisYearBirthday.getFullYear() + 1);
  }
  
  // Check if birthday is within the next 7 days
  const sevenDaysFromNow = new Date(now);
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  
  if (thisYearBirthday > sevenDaysFromNow) {
    return null; // Birthday too far in the future
  }
  
  // Create reminder for 1 day before birthday, or today if birthday is tomorrow or today
  const reminderDate = new Date(thisYearBirthday);
  reminderDate.setDate(reminderDate.getDate() - 1);
  
  // If reminder date is in the past (birthday is today/tomorrow), set reminder to today
  if (reminderDate < now) {
    reminderDate.setTime(now.getTime());
  }
  
  const daysUntilBirthday = Math.ceil((thisYearBirthday - now) / (1000 * 60 * 60 * 24));
  
  const reminder = new RelationshipReminder({
    userId,
    contactId: contact._id,
    reminderType: 'Birthday',
    reminderDate,
    priority: 'High',
    title: `${contact.firstName}'s Birthday ${daysUntilBirthday === 0 ? 'is TODAY!' : daysUntilBirthday === 1 ? 'is TOMORROW!' : `in ${daysUntilBirthday} days`}`,
    description: `Send birthday wishes to ${contact.firstName} ${contact.lastName}`,
    suggestedMessage: generateMessage('Birthday', contact),
    autoGenerated: true,
    generationReason: `Birthday ${daysUntilBirthday === 0 ? 'today' : daysUntilBirthday === 1 ? 'tomorrow' : `in ${daysUntilBirthday} days`}`,
    isRecurring: true,
    recurrencePattern: 'Yearly'
  });
  
  await reminder.save();
  return reminder;
}

function getActivityTypeForReminder(reminderType) {
  const mapping = {
    'General Check-in': 'Email Sent',
    'Birthday': 'Birthday Wish',
    'Congratulations': 'Congratulations Sent',
    'Industry News Share': 'Industry News Shared',
    'Thank You': 'Thank You Sent',
    'Follow-up': 'Email Sent',
    'Coffee Chat': 'Coffee Chat'
  };
  return mapping[reminderType] || 'Email Sent';
}

export default {
  getReminders,
  getReminderById,
  createReminder,
  updateReminder,
  completeReminder,
  snoozeReminder,
  dismissReminder,
  deleteReminder,
  generateReminders,
  getMessageTemplates,
  getActivities,
  createActivity,
  getRelationshipHealth,
  getRelationshipAnalytics
};
