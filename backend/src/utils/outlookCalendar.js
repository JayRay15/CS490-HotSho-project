import { Client } from '@microsoft/microsoft-graph-client';
import { User } from '../models/User.js';
import fetch from 'node-fetch';

/**
 * Get Microsoft Graph client with valid access token
 * @param {Object} user - User document with Outlook calendar connected
 * @returns {Promise<Client>} - Microsoft Graph client
 */
const getGraphClient = async (user) => {
  const accessToken = await getValidOutlookAccessToken(user);
  
  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    }
  });
};

/**
 * Refresh Outlook access token if expired
 * @param {Object} user - User document
 * @returns {Promise<string>} - Valid access token
 */
export const refreshOutlookAccessToken = async (user) => {
  if (!user.calendarSettings?.outlook?.refreshToken) {
    throw new Error('No Outlook refresh token found');
  }

  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID,
    client_secret: process.env.MICROSOFT_CLIENT_SECRET,
    refresh_token: user.calendarSettings.outlook.refreshToken,
    grant_type: 'refresh_token',
    scope: 'Calendars.ReadWrite offline_access'
  });

  try {
    const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token refresh failed: ${errorText}`);
    }

    const data = await response.json();
    
    // Update user with new access token and expiry
    user.calendarSettings.outlook.accessToken = data.access_token;
    user.calendarSettings.outlook.tokenExpiry = new Date(Date.now() + data.expires_in * 1000);
    
    // Update refresh token if provided
    if (data.refresh_token) {
      user.calendarSettings.outlook.refreshToken = data.refresh_token;
    }
    
    await user.save();

    return data.access_token;
  } catch (error) {
    console.error('Error refreshing Outlook access token:', error);
    throw new Error('Failed to refresh Outlook access token');
  }
};

/**
 * Get valid access token (refresh if needed)
 * @param {Object} user - User document
 * @returns {Promise<string>} - Valid access token
 */
export const getValidOutlookAccessToken = async (user) => {
  const now = new Date();
  const tokenExpiry = user.calendarSettings?.outlook?.tokenExpiry;

  // If token is expired or about to expire (5 minutes buffer), refresh it
  if (!tokenExpiry || now >= new Date(tokenExpiry.getTime() - 5 * 60 * 1000)) {
    return await refreshOutlookAccessToken(user);
  }

  return user.calendarSettings.outlook.accessToken;
};

/**
 * Create an Outlook Calendar event for an interview
 * @param {Object} interview - Interview document
 * @param {Object} user - User document with Outlook calendar connected
 * @returns {Promise<string>} - Outlook Calendar event ID
 */
export const createOutlookCalendarEvent = async (interview, user) => {
  if (!user.calendarSettings?.outlook?.connected) {
    throw new Error('Outlook Calendar not connected');
  }

  try {
    const client = await getGraphClient(user);

    // Calculate end time
    const startDate = new Date(interview.scheduledDate);
    const endDate = new Date(startDate.getTime() + interview.duration * 60000);

    // Build event body
    let bodyContent = `<p>Interview for <strong>${interview.title}</strong> position at <strong>${interview.company}</strong></p>`;
    
    if (interview.interviewer?.name) {
      bodyContent += '<br/><p><strong>Interviewer Details:</strong></p><ul>';
      bodyContent += `<li>Name: ${interview.interviewer.name}</li>`;
      if (interview.interviewer.email) bodyContent += `<li>Email: ${interview.interviewer.email}</li>`;
      if (interview.interviewer.phone) bodyContent += `<li>Phone: ${interview.interviewer.phone}</li>`;
      bodyContent += '</ul>';
    }
    
    if (interview.notes) {
      bodyContent += `<br/><p><strong>Notes:</strong></p><p>${interview.notes.replace(/\n/g, '<br/>')}</p>`;
    }

    if (interview.meetingLink) {
      bodyContent += `<br/><p><strong>Meeting Link:</strong> <a href="${interview.meetingLink}">${interview.meetingLink}</a></p>`;
    }

    // Build event object
    const event = {
      subject: `${interview.interviewType} Interview - ${interview.company}`,
      body: {
        contentType: 'HTML',
        content: bodyContent
      },
      start: {
        dateTime: startDate.toISOString(),
        timeZone: 'America/New_York' // TODO: Use user's timezone preference
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: 'America/New_York'
      },
      location: {
        displayName: interview.location || interview.meetingLink || 'Virtual'
      },
      reminderMinutesBeforeStart: 120, // 2 hours
      isReminderOn: true,
      categories: ['Interview', 'Important'],
      showAs: 'busy'
    };

    // Add online meeting if it's a Teams/Zoom/Google Meet link
    if (interview.meetingLink) {
      const link = interview.meetingLink.toLowerCase();
      if (link.includes('teams.microsoft')) {
        event.isOnlineMeeting = true;
        event.onlineMeetingProvider = 'teamsForBusiness';
      } else {
        event.location.locationUri = interview.meetingLink;
      }
    }

    const response = await client
      .api('/me/events')
      .post(event);

    console.log(`✅ Created Outlook Calendar event: ${response.id}`);
    return response.id;
  } catch (error) {
    console.error('Error creating Outlook Calendar event:', error.message);
    throw error;
  }
};

/**
 * Update an Outlook Calendar event
 * @param {string} eventId - Outlook Calendar event ID
 * @param {Object} interview - Updated interview document
 * @param {Object} user - User document with Outlook calendar connected
 * @returns {Promise<string>} - Updated event ID
 */
export const updateOutlookCalendarEvent = async (eventId, interview, user) => {
  if (!user.calendarSettings?.outlook?.connected) {
    throw new Error('Outlook Calendar not connected');
  }

  if (!eventId) {
    // If no event ID exists, create new event instead
    return await createOutlookCalendarEvent(interview, user);
  }

  try {
    const client = await getGraphClient(user);

    // Calculate end time
    const startDate = new Date(interview.scheduledDate);
    const endDate = new Date(startDate.getTime() + interview.duration * 60000);

    // Build event body
    let bodyContent = `<p>Interview for <strong>${interview.title}</strong> position at <strong>${interview.company}</strong></p>`;
    
    if (interview.interviewer?.name) {
      bodyContent += '<br/><p><strong>Interviewer Details:</strong></p><ul>';
      bodyContent += `<li>Name: ${interview.interviewer.name}</li>`;
      if (interview.interviewer.email) bodyContent += `<li>Email: ${interview.interviewer.email}</li>`;
      if (interview.interviewer.phone) bodyContent += `<li>Phone: ${interview.interviewer.phone}</li>`;
      bodyContent += '</ul>';
    }
    
    if (interview.notes) {
      bodyContent += `<br/><p><strong>Notes:</strong></p><p>${interview.notes.replace(/\n/g, '<br/>')}</p>`;
    }

    if (interview.meetingLink) {
      bodyContent += `<br/><p><strong>Meeting Link:</strong> <a href="${interview.meetingLink}">${interview.meetingLink}</a></p>`;
    }

    // Build event object
    const event = {
      subject: `${interview.interviewType} Interview - ${interview.company}`,
      body: {
        contentType: 'HTML',
        content: bodyContent
      },
      start: {
        dateTime: startDate.toISOString(),
        timeZone: 'America/New_York'
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: 'America/New_York'
      },
      location: {
        displayName: interview.location || interview.meetingLink || 'Virtual'
      },
      reminderMinutesBeforeStart: 120,
      isReminderOn: true
    };

    if (interview.meetingLink) {
      const link = interview.meetingLink.toLowerCase();
      if (link.includes('teams.microsoft')) {
        event.isOnlineMeeting = true;
        event.onlineMeetingProvider = 'teamsForBusiness';
      } else {
        event.location.locationUri = interview.meetingLink;
      }
    }

    const response = await client
      .api(`/me/events/${eventId}`)
      .update(event);

    console.log(`✅ Updated Outlook Calendar event: ${response.id}`);
    return response.id;
  } catch (error) {
    console.error('Error updating Outlook Calendar event:', error.message);
    
    // If event not found, create new one
    if (error.statusCode === 404) {
      console.log('Event not found, creating new event...');
      return await createOutlookCalendarEvent(interview, user);
    }
    
    throw error;
  }
};

/**
 * Delete an Outlook Calendar event
 * @param {string} eventId - Outlook Calendar event ID
 * @param {Object} user - User document with Outlook calendar connected
 * @returns {Promise<boolean>} - Success status
 */
export const deleteOutlookCalendarEvent = async (eventId, user) => {
  if (!user.calendarSettings?.outlook?.connected) {
    throw new Error('Outlook Calendar not connected');
  }

  if (!eventId) {
    console.log('No event ID provided, skipping deletion');
    return true;
  }

  try {
    const client = await getGraphClient(user);

    await client
      .api(`/me/events/${eventId}`)
      .delete();

    console.log(`✅ Deleted Outlook Calendar event: ${eventId}`);
    return true;
  } catch (error) {
    // If event not found, consider it already deleted
    if (error.statusCode === 404) {
      console.log('Event not found, likely already deleted');
      return true;
    }
    
    console.error('Error deleting Outlook Calendar event:', error.message);
    throw error;
  }
};

/**
 * Disconnect Outlook Calendar
 * @param {Object} user - User document
 * @returns {Promise<void>}
 */
export const disconnectOutlookCalendar = async (user) => {
  try {
    // Note: Microsoft doesn't provide a simple revoke endpoint like Google
    // The token will eventually expire, but we clear it from our database
    
    // Clear calendar settings
    user.calendarSettings.outlook = {
      connected: false,
      refreshToken: undefined,
      accessToken: undefined,
      tokenExpiry: undefined,
      email: undefined
    };
    
    await user.save();
    console.log('✅ Outlook Calendar disconnected');
  } catch (error) {
    console.error('Error disconnecting Outlook Calendar:', error);
    throw error;
  }
};
