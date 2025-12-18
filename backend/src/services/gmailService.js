/**
 * UC-125: Gmail API Service
 * 
 * This service handles Gmail OAuth authentication and email fetching
 * for automatically importing job application confirmations.
 * 
 * Uses Google Gmail API with read-only access to scan for job application emails.
 */

import { google } from 'googleapis';
import { parseApplicationEmail, generateMockEmails } from './emailImportService.js';

// OAuth2 client configuration
const getOAuth2Client = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI
  );
};

// Gmail API scopes - read-only access
const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
];

/**
 * Generate Gmail OAuth authorization URL
 * @param {string} state - State parameter for security
 * @returns {string} - Authorization URL
 */
export function getGmailAuthUrl(state = '') {
  const oauth2Client = getOAuth2Client();
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: GMAIL_SCOPES,
    state,
    prompt: 'consent', // Force consent to get refresh token
  });
}

/**
 * Exchange authorization code for tokens
 * @param {string} code - Authorization code from callback
 * @returns {Object} - Tokens object
 */
export async function getGmailTokens(code) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

/**
 * Refresh access token using refresh token
 * @param {string} refreshToken - Refresh token
 * @returns {Object} - New tokens
 */
export async function refreshGmailToken(refreshToken) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  
  const { credentials } = await oauth2Client.refreshAccessToken();
  return credentials;
}

/**
 * Get authenticated Gmail client
 * @param {Object} tokens - OAuth tokens (access_token, refresh_token)
 * @returns {Object} - Gmail API client
 */
function getGmailClient(tokens) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials(tokens);
  
  return google.gmail({ version: 'v1', auth: oauth2Client });
}

/**
 * Search patterns for job application emails
 */
const JOB_EMAIL_SEARCH_QUERIES = [
  'from:linkedin.com subject:(application OR applied)',
  'from:indeed.com subject:(application OR applied)',
  'from:glassdoor.com subject:(application OR submitted)',
  'from:ziprecruiter.com subject:(application OR applied)',
  'subject:"your application" OR subject:"application received" OR subject:"application submitted"',
  'subject:"you applied" OR subject:"application was sent"',
];

/**
 * Fetch job application emails from Gmail
 * @param {Object} tokens - OAuth tokens
 * @param {Object} options - Search options
 * @returns {Array} - Array of parsed email objects
 */
export async function fetchJobApplicationEmails(tokens, options = {}) {
  const {
    maxResults = 50,
    daysBack = 30,
    afterDate = null,
  } = options;

  try {
    const gmail = getGmailClient(tokens);
    
    // Calculate date filter
    const after = afterDate 
      ? new Date(afterDate) 
      : new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
    const afterTimestamp = Math.floor(after.getTime() / 1000);
    
    // Build search query
    const dateFilter = `after:${afterTimestamp}`;
    const combinedQuery = `(${JOB_EMAIL_SEARCH_QUERIES.join(' OR ')}) ${dateFilter}`;
    
    // Search for emails
    const listResponse = await gmail.users.messages.list({
      userId: 'me',
      q: combinedQuery,
      maxResults,
    });

    const messages = listResponse.data.messages || [];
    
    if (messages.length === 0) {
      return { emails: [], count: 0, source: 'gmail' };
    }

    // Fetch full message details
    const emails = [];
    for (const message of messages) {
      try {
        const fullMessage = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'full',
        });

        const email = parseGmailMessage(fullMessage.data);
        if (email) {
          emails.push(email);
        }
      } catch (err) {
        console.error(`Error fetching message ${message.id}:`, err.message);
      }
    }

    return { 
      emails, 
      count: emails.length, 
      source: 'gmail',
      totalFound: messages.length,
    };
  } catch (error) {
    console.error('Error fetching Gmail messages:', error.message);
    throw error;
  }
}

/**
 * Parse a Gmail message into our email format
 * @param {Object} message - Gmail API message object
 * @returns {Object|null} - Parsed email object or null
 */
function parseGmailMessage(message) {
  try {
    const headers = message.payload?.headers || [];
    
    const getHeader = (name) => {
      const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
      return header?.value || '';
    };

    const sender = getHeader('From');
    const subject = getHeader('Subject');
    const date = getHeader('Date');
    
    // Extract body
    let body = '';
    if (message.payload?.body?.data) {
      body = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
    } else if (message.payload?.parts) {
      // Multi-part message
      const textPart = message.payload.parts.find(
        part => part.mimeType === 'text/plain' || part.mimeType === 'text/html'
      );
      if (textPart?.body?.data) {
        body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
      }
    }

    // Strip HTML tags if present
    body = body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

    return {
      messageId: message.id,
      threadId: message.threadId,
      sender,
      subject,
      body,
      receivedDate: new Date(date).toISOString(),
      snippet: message.snippet,
    };
  } catch (error) {
    console.error('Error parsing Gmail message:', error.message);
    return null;
  }
}

/**
 * Check if Gmail is connected for a user
 * @param {Object} tokens - OAuth tokens
 * @returns {boolean} - Whether Gmail is connected
 */
export async function isGmailConnected(tokens) {
  if (!tokens?.access_token) {
    return false;
  }

  try {
    const gmail = getGmailClient(tokens);
    await gmail.users.getProfile({ userId: 'me' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get Gmail profile information
 * @param {Object} tokens - OAuth tokens
 * @returns {Object} - Profile info
 */
export async function getGmailProfile(tokens) {
  const gmail = getGmailClient(tokens);
  const response = await gmail.users.getProfile({ userId: 'me' });
  return response.data;
}

/**
 * Process fetched emails and extract job applications
 * @param {Array} emails - Array of email objects
 * @returns {Object} - Processed applications
 */
export function processJobEmails(emails) {
  const applications = [];
  const failed = [];

  for (const email of emails) {
    try {
      const parsed = parseApplicationEmail(email);
      
      if (parsed.success && parsed.jobDetails) {
        applications.push({
          ...parsed.jobDetails,
          sourceEmailId: email.messageId,
          receivedDate: email.receivedDate,
          platform: parsed.platform,
        });
      } else {
        failed.push({
          messageId: email.messageId,
          subject: email.subject,
          reason: 'Could not extract job details',
        });
      }
    } catch (error) {
      failed.push({
        messageId: email.messageId,
        subject: email.subject,
        reason: error.message,
      });
    }
  }

  return { applications, failed };
}

/**
 * Fetch and process job applications from Gmail
 * Falls back to mock data if no emails found or Gmail not connected
 * @param {Object} tokens - OAuth tokens (optional)
 * @param {Object} options - Fetch options
 * @returns {Object} - Applications and metadata
 */
export async function fetchAndProcessJobEmails(tokens, options = {}) {
  // Check if Gmail is available
  const gmailAvailable = tokens && await isGmailConnected(tokens);

  if (gmailAvailable) {
    try {
      const { emails, count, source } = await fetchJobApplicationEmails(tokens, options);
      
      if (count > 0) {
        const { applications, failed } = processJobEmails(emails);
        return {
          applications,
          failed,
          source: 'gmail',
          emailsScanned: count,
          message: `Found ${applications.length} job application emails from your Gmail`,
        };
      }
      
      // Gmail connected but no job emails found - use mock data
      console.log('Gmail connected but no job emails found, using sample data');
      const mockEmails = generateMockEmails();
      const { applications, failed } = processJobEmails(mockEmails);
      
      return {
        applications,
        failed,
        source: 'sample',
        emailsScanned: 0,
        message: 'No job application emails found in Gmail. Showing sample applications.',
      };
    } catch (error) {
      console.error('Gmail fetch error, falling back to sample data:', error.message);
      const mockEmails = generateMockEmails();
      const { applications, failed } = processJobEmails(mockEmails);
      
      return {
        applications,
        failed,
        source: 'sample',
        emailsScanned: 0,
        message: 'Could not access Gmail. Showing sample applications.',
      };
    }
  }

  // Gmail not connected - use mock data
  console.log('Gmail not connected, using sample data');
  const mockEmails = generateMockEmails();
  const { applications, failed } = processJobEmails(mockEmails);
  
  return {
    applications,
    failed,
    source: 'sample',
    emailsScanned: 0,
    message: 'Connect your Gmail account to import real job applications.',
  };
}

export default {
  getGmailAuthUrl,
  getGmailTokens,
  refreshGmailToken,
  fetchJobApplicationEmails,
  isGmailConnected,
  getGmailProfile,
  processJobEmails,
  fetchAndProcessJobEmails,
};
