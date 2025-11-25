import { google } from 'googleapis';
import { User } from '../models/User.js';

// Initialize OAuth2 client
const getOAuth2Client = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
};

/**
 * Refresh access token if expired
 * @param {Object} user - User document
 * @returns {Promise<string>} - Valid access token
 */
export const refreshGoogleAccessToken = async (user) => {
  if (!user.calendarSettings?.google?.refreshToken) {
    throw new Error('No Google refresh token found');
  }

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    refresh_token: user.calendarSettings.google.refreshToken
  });

  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    
    // Update user with new access token and expiry
    user.calendarSettings.google.accessToken = credentials.access_token;
    user.calendarSettings.google.tokenExpiry = new Date(credentials.expiry_date);
    await user.save();

    return credentials.access_token;
  } catch (error) {
    console.error('Error refreshing Google access token:', error);
    throw new Error('Failed to refresh Google access token');
  }
};

/**
 * Get valid access token (refresh if needed)
 * @param {Object} user - User document
 * @returns {Promise<string>} - Valid access token
 */
export const getValidGoogleAccessToken = async (user) => {
  const now = new Date();
  const tokenExpiry = user.calendarSettings?.google?.tokenExpiry;

  // If token is expired or about to expire (5 minutes buffer), refresh it
  if (!tokenExpiry || now >= new Date(tokenExpiry.getTime() - 5 * 60 * 1000)) {
    return await refreshGoogleAccessToken(user);
  }

  return user.calendarSettings.google.accessToken;
};

/**
 * Create a Google Calendar event for an interview
 * @param {Object} interview - Interview document
 * @param {Object} user - User document with Google calendar connected
 * @returns {Promise<string>} - Google Calendar event ID
 */
export const createGoogleCalendarEvent = async (interview, user) => {
  if (!user.calendarSettings?.google?.connected) {
    throw new Error('Google Calendar not connected');
  }

  try {
    const accessToken = await getValidGoogleAccessToken(user);
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Calculate end time
    const startDate = new Date(interview.scheduledDate);
    const endDate = new Date(startDate.getTime() + interview.duration * 60000);

    // Build event description
    let description = `Interview for ${interview.title} position at ${interview.company}\n\n`;
    
    if (interview.interviewer?.name) {
      description += `Interviewer: ${interview.interviewer.name}\n`;
      if (interview.interviewer.email) description += `Email: ${interview.interviewer.email}\n`;
      if (interview.interviewer.phone) description += `Phone: ${interview.interviewer.phone}\n`;
    }
    
    if (interview.notes) {
      description += `\nNotes:\n${interview.notes}`;
    }

    // Build event object
    const event = {
      summary: `${interview.interviewType} Interview - ${interview.company}`,
      description: description.trim(),
      location: interview.location || interview.meetingLink || '',
      start: {
        dateTime: startDate.toISOString(),
        timeZone: 'America/New_York' // TODO: Use user's timezone preference
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: 'America/New_York'
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 1440 }, // 24 hours
          { method: 'popup', minutes: 120 },  // 2 hours
          { method: 'popup', minutes: 60 }    // 1 hour
        ]
      },
      colorId: '11' // Red color for interviews
    };

    // Add meeting link as conferenceData if it's a known platform
    if (interview.meetingLink) {
      const link = interview.meetingLink.toLowerCase();
      if (link.includes('zoom') || link.includes('meet.google') || link.includes('teams.microsoft')) {
        event.conferenceData = {
          entryPoints: [{
            entryPointType: 'video',
            uri: interview.meetingLink,
            label: 'Join Video Call'
          }]
        };
      } else {
        event.description += `\n\nMeeting Link: ${interview.meetingLink}`;
      }
    }

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      sendNotifications: true
    });

    console.log(`✅ Created Google Calendar event: ${response.data.id}`);
    return response.data.id;
  } catch (error) {
    console.error('Error creating Google Calendar event:', error.message);
    throw error;
  }
};

/**
 * Update a Google Calendar event
 * @param {string} eventId - Google Calendar event ID
 * @param {Object} interview - Updated interview document
 * @param {Object} user - User document with Google calendar connected
 * @returns {Promise<string>} - Updated event ID
 */
export const updateGoogleCalendarEvent = async (eventId, interview, user) => {
  if (!user.calendarSettings?.google?.connected) {
    throw new Error('Google Calendar not connected');
  }

  if (!eventId) {
    // If no event ID exists, create new event instead
    return await createGoogleCalendarEvent(interview, user);
  }

  try {
    const accessToken = await getValidGoogleAccessToken(user);
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Calculate end time
    const startDate = new Date(interview.scheduledDate);
    const endDate = new Date(startDate.getTime() + interview.duration * 60000);

    // Build event description
    let description = `Interview for ${interview.title} position at ${interview.company}\n\n`;
    
    if (interview.interviewer?.name) {
      description += `Interviewer: ${interview.interviewer.name}\n`;
      if (interview.interviewer.email) description += `Email: ${interview.interviewer.email}\n`;
      if (interview.interviewer.phone) description += `Phone: ${interview.interviewer.phone}\n`;
    }
    
    if (interview.notes) {
      description += `\nNotes:\n${interview.notes}`;
    }

    // Build event object
    const event = {
      summary: `${interview.interviewType} Interview - ${interview.company}`,
      description: description.trim(),
      location: interview.location || interview.meetingLink || '',
      start: {
        dateTime: startDate.toISOString(),
        timeZone: 'America/New_York'
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: 'America/New_York'
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 1440 },
          { method: 'popup', minutes: 120 },
          { method: 'popup', minutes: 60 }
        ]
      }
    };

    if (interview.meetingLink) {
      const link = interview.meetingLink.toLowerCase();
      if (link.includes('zoom') || link.includes('meet.google') || link.includes('teams.microsoft')) {
        event.conferenceData = {
          entryPoints: [{
            entryPointType: 'video',
            uri: interview.meetingLink,
            label: 'Join Video Call'
          }]
        };
      } else {
        event.description += `\n\nMeeting Link: ${interview.meetingLink}`;
      }
    }

    const response = await calendar.events.update({
      calendarId: 'primary',
      eventId: eventId,
      resource: event,
      sendNotifications: true
    });

    console.log(`✅ Updated Google Calendar event: ${response.data.id}`);
    return response.data.id;
  } catch (error) {
    console.error('Error updating Google Calendar event:', error.message);
    
    // If event not found, create new one
    if (error.code === 404) {
      console.log('Event not found, creating new event...');
      return await createGoogleCalendarEvent(interview, user);
    }
    
    throw error;
  }
};

/**
 * Delete a Google Calendar event
 * @param {string} eventId - Google Calendar event ID
 * @param {Object} user - User document with Google calendar connected
 * @returns {Promise<boolean>} - Success status
 */
export const deleteGoogleCalendarEvent = async (eventId, user) => {
  if (!user.calendarSettings?.google?.connected) {
    throw new Error('Google Calendar not connected');
  }

  if (!eventId) {
    console.log('No event ID provided, skipping deletion');
    return true;
  }

  try {
    const accessToken = await getValidGoogleAccessToken(user);
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
      sendNotifications: true
    });

    console.log(`✅ Deleted Google Calendar event: ${eventId}`);
    return true;
  } catch (error) {
    // If event not found, consider it already deleted
    if (error.code === 404) {
      console.log('Event not found, likely already deleted');
      return true;
    }
    
    console.error('Error deleting Google Calendar event:', error.message);
    throw error;
  }
};

/**
 * Disconnect Google Calendar
 * @param {Object} user - User document
 * @returns {Promise<void>}
 */
export const disconnectGoogleCalendar = async (user) => {
  try {
    // Revoke the refresh token
    if (user.calendarSettings?.google?.refreshToken) {
      const oauth2Client = getOAuth2Client();
      oauth2Client.setCredentials({
        refresh_token: user.calendarSettings.google.refreshToken
      });
      
      try {
        await oauth2Client.revokeCredentials();
      } catch (error) {
        console.error('Error revoking Google credentials:', error.message);
        // Continue even if revocation fails
      }
    }

    // Clear calendar settings
    user.calendarSettings.google = {
      connected: false,
      refreshToken: undefined,
      accessToken: undefined,
      tokenExpiry: undefined,
      email: undefined
    };
    
    await user.save();
    console.log('✅ Google Calendar disconnected');
  } catch (error) {
    console.error('Error disconnecting Google Calendar:', error);
    throw error;
  }
};
