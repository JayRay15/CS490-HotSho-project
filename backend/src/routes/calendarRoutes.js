import express from 'express';
import { google } from 'googleapis';
import { User } from '../models/User.js';
import { checkJwt } from '../middleware/checkJwt.js';

const router = express.Router();

// Initialize OAuth2 client
const getGoogleOAuth2Client = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
};

// Get Microsoft OAuth URL
const getMicrosoftAuthUrl = () => {
  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID,
    response_type: 'code',
    redirect_uri: process.env.MICROSOFT_REDIRECT_URI,
    response_mode: 'query',
    scope: 'Calendars.ReadWrite offline_access User.Read',
    state: 'microsoft_oauth' // Can include user ID for verification
  });
  
  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
};

/**
 * @route   GET /api/calendar/google/auth
 * @desc    Initiate Google Calendar OAuth flow
 * @access  Protected
 */
router.get('/google/auth', checkJwt, (req, res) => {
  try {
    const oauth2Client = getGoogleOAuth2Client();
    
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline', // Get refresh token
      scope: ['https://www.googleapis.com/auth/calendar.events'],
      prompt: 'consent', // Force consent screen to get refresh token
      state: req.auth.userId // Pass user ID for verification in callback
    });

    res.json({ authUrl });
  } catch (error) {
    console.error('Error generating Google auth URL:', error);
    res.status(500).json({ message: 'Failed to generate authorization URL' });
  }
});

/**
 * @route   GET /api/calendar/google/callback
 * @desc    Handle Google Calendar OAuth callback
 * @access  Public (OAuth callback)
 */
router.get('/google/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    console.error('Google OAuth error:', error);
    return res.redirect(`${process.env.FRONTEND_URL}/settings?calendar_error=${error}`);
  }

  if (!code) {
    return res.redirect(`${process.env.FRONTEND_URL}/settings?calendar_error=no_code`);
  }

  try {
    const oauth2Client = getGoogleOAuth2Client();
    
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    
    // Get user info to verify and store email
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    // Find user by auth0Id (state parameter contains userId)
    const userId = state;
    const user = await User.findOne({ auth0Id: userId });

    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL}/settings?calendar_error=user_not_found`);
    }

    // Update user with calendar tokens
    user.calendarSettings = user.calendarSettings || {};
    user.calendarSettings.google = {
      connected: true,
      refreshToken: tokens.refresh_token,
      accessToken: tokens.access_token,
      tokenExpiry: new Date(tokens.expiry_date),
      email: userInfo.data.email
    };
    
    // Set as default calendar if none selected
    if (!user.calendarSettings.preferences?.defaultCalendar || 
        user.calendarSettings.preferences.defaultCalendar === 'none') {
      user.calendarSettings.preferences = user.calendarSettings.preferences || {};
      user.calendarSettings.preferences.defaultCalendar = 'google';
    }

    await user.save();

    res.redirect(`${process.env.FRONTEND_URL}/settings?calendar_connected=google`);
  } catch (error) {
    console.error('Error handling Google OAuth callback:', error);
    res.redirect(`${process.env.FRONTEND_URL}/settings?calendar_error=callback_failed`);
  }
});

/**
 * @route   GET /api/calendar/outlook/auth
 * @desc    Initiate Outlook Calendar OAuth flow
 * @access  Protected
 */
router.get('/outlook/auth', checkJwt, (req, res) => {
  try {
    // Store user ID in session or use JWT state parameter
    const authUrl = getMicrosoftAuthUrl() + `&state=${req.auth.userId}`;
    res.json({ authUrl });
  } catch (error) {
    console.error('Error generating Outlook auth URL:', error);
    res.status(500).json({ message: 'Failed to generate authorization URL' });
  }
});

/**
 * @route   GET /api/calendar/outlook/callback
 * @desc    Handle Outlook Calendar OAuth callback
 * @access  Public (OAuth callback)
 */
router.get('/outlook/callback', async (req, res) => {
  const { code, state, error, error_description } = req.query;

  if (error) {
    console.error('Outlook OAuth error:', error, error_description);
    return res.redirect(`${process.env.FRONTEND_URL}/settings?calendar_error=${error}`);
  }

  if (!code) {
    return res.redirect(`${process.env.FRONTEND_URL}/settings?calendar_error=no_code`);
  }

  try {
    // Exchange code for tokens
    const params = new URLSearchParams({
      client_id: process.env.MICROSOFT_CLIENT_ID,
      client_secret: process.env.MICROSOFT_CLIENT_SECRET,
      code: code,
      redirect_uri: process.env.MICROSOFT_REDIRECT_URI,
      grant_type: 'authorization_code'
    });

    const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      return res.redirect(`${process.env.FRONTEND_URL}/settings?calendar_error=token_exchange_failed`);
    }

    const tokens = await tokenResponse.json();

    // Get user info
    const userInfoResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`
      }
    });

    const userInfo = await userInfoResponse.json();

    // Find user by auth0Id (state parameter contains userId)
    const userId = state;
    const user = await User.findOne({ auth0Id: userId });

    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL}/settings?calendar_error=user_not_found`);
    }

    // Update user with calendar tokens
    user.calendarSettings = user.calendarSettings || {};
    user.calendarSettings.outlook = {
      connected: true,
      refreshToken: tokens.refresh_token,
      accessToken: tokens.access_token,
      tokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
      email: userInfo.userPrincipalName || userInfo.mail
    };

    // Set as default calendar if none selected
    if (!user.calendarSettings.preferences?.defaultCalendar || 
        user.calendarSettings.preferences.defaultCalendar === 'none') {
      user.calendarSettings.preferences = user.calendarSettings.preferences || {};
      user.calendarSettings.preferences.defaultCalendar = 'outlook';
    }

    await user.save();

    res.redirect(`${process.env.FRONTEND_URL}/settings?calendar_connected=outlook`);
  } catch (error) {
    console.error('Error handling Outlook OAuth callback:', error);
    res.redirect(`${process.env.FRONTEND_URL}/settings?calendar_error=callback_failed`);
  }
});

/**
 * @route   POST /api/calendar/disconnect/:provider
 * @desc    Disconnect a calendar provider
 * @access  Protected
 */
router.post('/disconnect/:provider', checkJwt, async (req, res) => {
  try {
    const { provider } = req.params;
    const userId = req.auth.userId;

    if (!['google', 'outlook'].includes(provider)) {
      return res.status(400).json({ message: 'Invalid calendar provider' });
    }

    const user = await User.findOne({ auth0Id: userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Clear calendar settings for the provider
    if (!user.calendarSettings) {
      user.calendarSettings = {};
    }

    user.calendarSettings[provider] = {
      connected: false,
      refreshToken: undefined,
      accessToken: undefined,
      tokenExpiry: undefined,
      email: undefined
    };

    // Reset default if this was the default calendar
    if (user.calendarSettings.preferences?.defaultCalendar === provider) {
      user.calendarSettings.preferences.defaultCalendar = 'none';
    }

    await user.save();

    res.json({ 
      message: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Calendar disconnected successfully`,
      calendarSettings: {
        google: user.calendarSettings.google?.connected || false,
        outlook: user.calendarSettings.outlook?.connected || false,
        defaultCalendar: user.calendarSettings.preferences?.defaultCalendar || 'none'
      }
    });
  } catch (error) {
    console.error('Error disconnecting calendar:', error);
    res.status(500).json({ message: 'Failed to disconnect calendar' });
  }
});

/**
 * @route   GET /api/calendar/status
 * @desc    Get calendar connection status
 * @access  Protected
 */
router.get('/status', checkJwt, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const user = await User.findOne({ auth0Id: userId }).select('calendarSettings');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const status = {
      google: {
        connected: user.calendarSettings?.google?.connected || false,
        email: user.calendarSettings?.google?.email || null
      },
      outlook: {
        connected: user.calendarSettings?.outlook?.connected || false,
        email: user.calendarSettings?.outlook?.email || null
      },
      preferences: {
        autoSync: user.calendarSettings?.preferences?.autoSync !== false,
        defaultCalendar: user.calendarSettings?.preferences?.defaultCalendar || 'none',
        reminderMinutes: user.calendarSettings?.preferences?.reminderMinutes || [1440, 120]
      }
    };

    res.json(status);
  } catch (error) {
    console.error('Error getting calendar status:', error);
    res.status(500).json({ message: 'Failed to get calendar status' });
  }
});

/**
 * @route   PUT /api/calendar/preferences
 * @desc    Update calendar preferences
 * @access  Protected
 */
router.put('/preferences', checkJwt, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { autoSync, defaultCalendar, reminderMinutes } = req.body;

    const user = await User.findOne({ auth0Id: userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.calendarSettings) {
      user.calendarSettings = {};
    }

    if (!user.calendarSettings.preferences) {
      user.calendarSettings.preferences = {};
    }

    // Update preferences
    if (typeof autoSync === 'boolean') {
      user.calendarSettings.preferences.autoSync = autoSync;
    }

    if (defaultCalendar && ['google', 'outlook', 'none'].includes(defaultCalendar)) {
      user.calendarSettings.preferences.defaultCalendar = defaultCalendar;
    }

    if (Array.isArray(reminderMinutes)) {
      user.calendarSettings.preferences.reminderMinutes = reminderMinutes;
    }

    await user.save();

    res.json({ 
      message: 'Calendar preferences updated',
      preferences: user.calendarSettings.preferences
    });
  } catch (error) {
    console.error('Error updating calendar preferences:', error);
    res.status(500).json({ message: 'Failed to update calendar preferences' });
  }
});

export default router;
