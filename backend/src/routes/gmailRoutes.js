/**
 * UC-125: Gmail Integration Routes
 * 
 * Handles Gmail OAuth authentication and email import for job applications.
 */

import express from 'express';
import { checkJwt } from '../middleware/checkJwt.js';
import { User } from '../models/User.js';
import {
  getGmailAuthUrl,
  getGmailTokens,
  isGmailConnected,
  getGmailProfile,
  fetchAndProcessJobEmails,
} from '../services/gmailService.js';

const router = express.Router();

/**
 * GET /api/gmail/auth
 * Initiate Gmail OAuth flow
 */
router.get('/auth', checkJwt, async (req, res) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Generate state with user ID for security
    const state = Buffer.from(JSON.stringify({ userId })).toString('base64');
    const authUrl = getGmailAuthUrl(state);

    res.json({
      success: true,
      data: { authUrl },
    });
  } catch (error) {
    console.error('Gmail auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate Gmail authorization URL',
    });
  }
});

/**
 * GET /api/gmail/callback
 * Handle Gmail OAuth callback
 */
router.get('/callback', async (req, res) => {
  try {
    const { code, state, error: authError } = req.query;

    if (authError) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/multi-platform-tracker?gmail_error=${encodeURIComponent(authError)}`
      );
    }

    if (!code || !state) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/multi-platform-tracker?gmail_error=missing_params`
      );
    }

    // Decode state to get user ID
    let userId;
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      userId = stateData.userId;
    } catch {
      return res.redirect(
        `${process.env.FRONTEND_URL}/multi-platform-tracker?gmail_error=invalid_state`
      );
    }

    // Exchange code for tokens
    const tokens = await getGmailTokens(code);

    // Store tokens in user document
    await User.findOneAndUpdate(
      { auth0Id: userId },
      {
        $set: {
          'integrations.gmail': {
            connected: true,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            expiresAt: new Date(Date.now() + (tokens.expiry_date || 3600000)),
            connectedAt: new Date(),
          },
        },
      },
      { upsert: true }
    );

    // Redirect back to tracker with success
    res.redirect(`${process.env.FRONTEND_URL}/multi-platform-tracker?gmail_connected=true`);
  } catch (error) {
    console.error('Gmail callback error:', error);
    res.redirect(
      `${process.env.FRONTEND_URL}/multi-platform-tracker?gmail_error=${encodeURIComponent(error.message)}`
    );
  }
});

/**
 * GET /api/gmail/status
 * Check Gmail connection status
 */
router.get('/status', checkJwt, async (req, res) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const user = await User.findOne({ auth0Id: userId });
    const gmailConfig = user?.integrations?.gmail;

    if (!gmailConfig?.connected || !gmailConfig?.accessToken) {
      return res.json({
        success: true,
        data: {
          connected: false,
          email: null,
        },
      });
    }

    // Verify token is still valid
    const tokens = {
      access_token: gmailConfig.accessToken,
      refresh_token: gmailConfig.refreshToken,
    };

    const connected = await isGmailConnected(tokens);
    
    let email = null;
    if (connected) {
      try {
        const profile = await getGmailProfile(tokens);
        email = profile.emailAddress;
      } catch (err) {
        console.error('Error getting Gmail profile:', err.message);
      }
    }

    res.json({
      success: true,
      data: {
        connected,
        email,
        connectedAt: gmailConfig.connectedAt,
      },
    });
  } catch (error) {
    console.error('Gmail status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check Gmail status',
    });
  }
});

/**
 * POST /api/gmail/disconnect
 * Disconnect Gmail integration
 */
router.post('/disconnect', checkJwt, async (req, res) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    await User.findOneAndUpdate(
      { auth0Id: userId },
      {
        $set: {
          'integrations.gmail': {
            connected: false,
            accessToken: null,
            refreshToken: null,
            expiresAt: null,
            connectedAt: null,
          },
        },
      }
    );

    res.json({
      success: true,
      message: 'Gmail disconnected successfully',
    });
  } catch (error) {
    console.error('Gmail disconnect error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disconnect Gmail',
    });
  }
});

/**
 * POST /api/gmail/scan
 * Scan Gmail for job application emails
 */
router.post('/scan', checkJwt, async (req, res) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { daysBack = 30, maxResults = 50 } = req.body;

    const user = await User.findOne({ auth0Id: userId });
    const gmailConfig = user?.integrations?.gmail;

    let tokens = null;
    if (gmailConfig?.connected && gmailConfig?.accessToken) {
      tokens = {
        access_token: gmailConfig.accessToken,
        refresh_token: gmailConfig.refreshToken,
      };
    }

    // This will use Gmail if connected, or fall back to sample data
    const result = await fetchAndProcessJobEmails(tokens, {
      daysBack,
      maxResults,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Gmail scan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to scan emails',
    });
  }
});

export default router;
