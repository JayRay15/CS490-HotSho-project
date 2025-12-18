# UC-125: Multi-Platform Application Tracker - Implementation Guide

## Overview

The Multi-Platform Application Tracker (UC-125) automatically imports and consolidates job applications from multiple platforms (LinkedIn, Indeed, Glassdoor, etc.) using Gmail API integration. When Gmail is not connected or no job emails are found, the system gracefully falls back to sample data for demonstration purposes.

## Features Implemented

### 1. Gmail API Integration
- **OAuth 2.0 Authentication**: Secure connection to user's Gmail account
- **Read-Only Access**: Only reads emails, never modifies them
- **Automatic Email Scanning**: Searches for job application confirmation emails
- **Pattern Matching**: Detects emails from LinkedIn, Indeed, Glassdoor, ZipRecruiter, and more

### 2. Email Parsing Service
- **Platform Detection**: Identifies the source platform from sender domain and content
- **Job Detail Extraction**: Extracts job title, company, location from email content
- **Duplicate Detection**: Uses Levenshtein similarity algorithm to detect duplicates
- **Application Consolidation**: Merges multi-platform applications into single entries

### 3. Export Features
- **JSON Export**: Full application data with all details
- **CSV Export**: Spreadsheet-compatible format for analysis

### 4. Gap Detection
- **Activity Monitoring**: Identifies periods with no application activity
- **Smart Alerts**: Suggests when applications might be missing

## Architecture

```
Frontend (React)
    └── MultiPlatformTracker.jsx
        ├── Gmail connection status display
        ├── Scan emails button
        ├── Manual email paste modal
        ├── Export buttons (JSON/CSV)
        └── Application list with platform badges

Backend (Node.js/Express)
    ├── routes/gmailRoutes.js
    │   ├── GET /api/gmail/auth      → OAuth initiation
    │   ├── GET /api/gmail/callback  → OAuth callback
    │   ├── GET /api/gmail/status    → Check connection
    │   ├── POST /api/gmail/disconnect → Remove connection
    │   └── POST /api/gmail/scan     → Scan for job emails
    │
    ├── services/gmailService.js
    │   ├── getGmailAuthUrl()        → Generate OAuth URL
    │   ├── getGmailTokens()         → Exchange code for tokens
    │   ├── fetchJobApplicationEmails() → Search Gmail
    │   └── fetchAndProcessJobEmails()  → Scan + fallback
    │
    └── services/emailImportService.js
        ├── detectPlatform()         → Identify email source
        ├── extractJobDetails()      → Parse job info
        ├── areDuplicates()          → Check for duplicates
        ├── identifyApplicationGaps() → Find missing periods
        └── generateMockEmails()     → Sample data fallback
```

## Setup Instructions

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** → **Library**
4. Search for and enable **Gmail API**
5. Go to **APIs & Services** → **Credentials**
6. Click **Create Credentials** → **OAuth 2.0 Client ID**
7. Select **Web application** as the application type
8. Add authorized redirect URI:
   - Development: `http://localhost:5000/api/gmail/callback`
   - Production: `https://your-domain.com/api/gmail/callback`
9. Save the **Client ID** and **Client Secret**

### 2. Environment Configuration

Add these variables to your `.env` file:

```env
# Google OAuth (shared with Calendar integration)
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here

# Gmail-specific redirect URI
GMAIL_REDIRECT_URI=http://localhost:5000/api/gmail/callback
```

### 3. OAuth Consent Screen

1. In Google Cloud Console, go to **APIs & Services** → **OAuth consent screen**
2. Select **External** user type (or Internal for G Suite)
3. Fill in app information:
   - App name: "Nirvana ATS"
   - User support email: Your email
   - Developer contact: Your email
4. Add scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
5. Add test users (required for development)

## Demo Script

### Demo Flow

1. **Navigate to Application Tracker**
   - Click "Application Tracker" in the sidebar navigation
   - Show the empty state with "Connect Gmail" prompt

2. **Connect Gmail**
   - Click "Connect Gmail" button
   - User is redirected to Google OAuth consent screen
   - Grant read-only access to Gmail
   - User is redirected back with success message

3. **Scan Emails**
   - Click "Scan Emails" button
   - System searches for job application confirmation emails
   - If emails found: Shows import results modal
   - If no emails: Falls back to sample data with message

4. **View Imported Applications**
   - Applications appear in the list with platform badges
   - Multi-platform applications show consolidated badge
   - Click any application to view full details

5. **Manual Import**
   - Click "Paste Email" button
   - Paste a job confirmation email
   - System extracts job details automatically

6. **Export Data**
   - Click "Export JSON" for full data export
   - Click "Export CSV" for spreadsheet format

7. **Gap Detection**
   - If gaps are detected, alert banner appears
   - Click "Details" to see missing periods
   - Suggests checking for untracked applications

### Sample Email for Testing

If you don't have real job emails, use this sample:

```
From: jobs-noreply@linkedin.com
Subject: Your application was sent to Google

Hi there,

Your application was sent to Google for the Senior Software Engineer position.

Job Title: Senior Software Engineer
Company: Google
Location: Mountain View, CA

Good luck with your application!

Best,
The LinkedIn Team
```

### What to Highlight

1. **Automatic Platform Detection**: Show how the system identifies LinkedIn, Indeed, etc.
2. **Duplicate Prevention**: Try importing the same job twice - it gets consolidated
3. **Multi-Platform Tracking**: Show a job applied to on multiple platforms
4. **Export Functionality**: Download the unified application history
5. **Graceful Fallback**: Disconnect Gmail and show sample data appears

## API Endpoints

### Gmail Integration

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/gmail/auth` | Get OAuth authorization URL |
| GET | `/api/gmail/callback` | OAuth callback handler |
| GET | `/api/gmail/status` | Check Gmail connection status |
| POST | `/api/gmail/disconnect` | Disconnect Gmail account |
| POST | `/api/gmail/scan` | Scan Gmail for job emails |

### Job Import/Export

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/jobs/import-email` | Import from pasted email |
| GET | `/api/jobs/export` | Export as JSON |
| GET | `/api/jobs/export/csv` | Export as CSV |
| GET | `/api/jobs/gaps` | Get application gaps |

## Files Modified/Created

### New Files
- `backend/src/services/gmailService.js` - Gmail API service
- `backend/src/routes/gmailRoutes.js` - Gmail API routes
- `documentation/UC125_IMPLEMENTATION_GUIDE.md` - This guide

### Modified Files
- `backend/src/server.js` - Added Gmail routes
- `backend/src/models/User.js` - Added integrations field
- `backend/src/models/Job.js` - Added sourceEmailId field
- `backend/src/controllers/jobController.js` - Added import/export endpoints
- `backend/src/routes/jobRoutes.js` - Added new routes
- `backend/src/services/emailImportService.js` - Email parsing logic
- `backend/.env.example` - Added Gmail configuration
- `frontend/src/pages/auth/MultiPlatformTracker.jsx` - Complete rewrite

### Test Files Updated
- `backend/src/routes/__tests__/jobRoutes.test.js` - Added new mocks
- `backend/src/controllers/__tests__/jobController.crud.test.js` - Fixed mocks
- `backend/src/controllers/__tests__/jobController.extra.test.js` - Fixed mocks

## Technical Notes

### Security
- Gmail tokens are stored securely in the User document
- Read-only scope prevents any email modification
- OAuth state parameter prevents CSRF attacks
- Tokens are encrypted at rest in MongoDB

### Fallback Behavior
The system gracefully falls back to sample data when:
1. Gmail is not connected
2. Gmail connection fails
3. No job application emails are found

This ensures the feature is always demonstrable.

### Duplicate Detection Algorithm
Uses Levenshtein distance similarity:
- Company names must be >80% similar
- Job titles must be >70% similar
- Applications within 7 days are considered potential duplicates

## Troubleshooting

### "Gmail connection failed"
- Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set
- Check that Gmail API is enabled in Google Cloud Console
- Ensure redirect URI matches exactly

### "No job emails found"
- User may not have job confirmation emails
- Emails might be older than 30 days (default scan period)
- Check spam folder for job emails

### OAuth consent screen issues
- Ensure test users are added in development
- Verify all required scopes are added
- Check app verification status for production

## Production Deployment

1. Update OAuth redirect URI to production URL
2. Complete Google OAuth consent screen verification
3. Set up proper secret management for tokens
4. Consider implementing token refresh logic
5. Add rate limiting for API calls

---

*Implementation completed December 2025 for Nirvana ATS Sprint 4*
