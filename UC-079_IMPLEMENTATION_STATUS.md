# UC-079: Interview Scheduling Integration - Implementation Status

## Overview
Analysis of current implementation status for UC-079 (Interview Scheduling Integration). This document identifies what's already built vs. what needs to be implemented.

---

## ✅ ALREADY IMPLEMENTED

### Backend Infrastructure (COMPLETE)

#### 1. **Interview Model** (`backend/src/models/Interview.js`)
- ✅ Comprehensive schema with all required fields:
  - Basic info: `title`, `company`, `interviewType`, `scheduledDate`, `duration`
  - Location/meeting: `location`, `meetingLink`
  - Interviewer details: `name`, `email`, `phone`, `title`, `notes`
  - Status tracking: `Scheduled`, `Confirmed`, `Rescheduled`, `Cancelled`, `Completed`, `No-Show`
  - Outcome recording: `passed`, `feedback`, `nextSteps`, `offerReceived`, `offerDetails`
  - Job application linkage: `jobId` reference
- ✅ **Reminders system**:
  - `reminders.enabled` boolean
  - `reminders.reminderTimes` array (defaults: [24, 2] hours)
  - `reminders.lastReminderSent` timestamp
  - `reminders.remindersSent` tracking array
- ✅ **Preparation tasks**:
  - `preparationTasks` array with schema: `title`, `description`, `completed`, `dueDate`, `priority`
  - Auto-generation method: `generatePreparationTasks()` creates type-specific tasks
- ✅ **Conflict detection**:
  - `checkConflict()` method finds overlapping interviews
  - `conflictWarning` field to flag scheduling issues
- ✅ History tracking: `history` array logs all changes
- ✅ Indexed queries: `userId`, `scheduledDate`, `status`

#### 2. **Reminder Automation** (`backend/src/utils/interviewReminders.js`)
- ✅ **Cron scheduler**:
  - Runs every 15 minutes via `node-cron`
  - Checks for interviews in 24h, 2h, and 1h windows
  - Prevents duplicate sends (15-minute tolerance)
- ✅ **Email integration**:
  - `sendInterviewRemindersNow()` sends via `sendInterviewReminderEmail()`
  - Records sent status: `lastReminderSent`, `remindersSent` array
- ✅ **Conflict detection**:
  - `checkForConflicts()` finds overlapping interviews with 1-hour buffer
- ✅ **Dashboard data**:
  - `getUpcomingInterviewSummary()` provides stats for UI

#### 3. **API Endpoints** (`backend/src/routes/interviewRoutes.js`)
- ✅ **CRUD operations**:
  - `POST /api/interviews` - Schedule new interview
  - `GET /api/interviews` - List all user interviews
  - `GET /api/interviews/:id` - Get single interview
  - `PUT /api/interviews/:id` - Update interview
  - `DELETE /api/interviews/:id` - Delete interview
- ✅ **Specialized operations**:
  - `PUT /api/interviews/:id/reschedule` - Reschedule with reason
  - `PUT /api/interviews/:id/cancel` - Cancel with reason
  - `PUT /api/interviews/:id/confirm` - Confirm attendance
  - `PUT /api/interviews/:id/outcome` - Record interview outcome
  - `POST /api/interviews/:id/generate-tasks` - Auto-generate prep tasks
  - `GET /api/interviews/upcoming` - Get upcoming interviews (configurable days)
  - `GET /api/interviews/conflicts` - Check for scheduling conflicts
- ✅ **Prep task management**:
  - `POST /api/interviews/:id/tasks` - Add prep task
  - `PUT /api/interviews/:id/tasks/:taskId` - Update prep task
  - `DELETE /api/interviews/:id/tasks/:taskId` - Delete prep task
- ✅ JWT authentication middleware on all routes

#### 4. **Email System**
- ✅ `sendInterviewReminderEmail()` utility exists (referenced in reminders.js)
- ✅ Nodemailer integration configured
- ✅ Template system for reminder emails

### Frontend Infrastructure (MOSTLY COMPLETE)

#### 1. **Interview Scheduler Component** (`frontend/src/components/InterviewScheduler.jsx`)
- ✅ Full form for scheduling/editing interviews
- ✅ Fields: title, company, type, date/time, duration, location, meeting link
- ✅ Interviewer details section (expandable)
- ✅ Requirements section: dress code, documents, preparation notes
- ✅ Questions array input
- ✅ **Real-time conflict detection**: Checks as user types date/time
- ✅ Visual conflict warnings with details
- ✅ Auto-generate prep tasks toggle
- ✅ Edit mode support (pre-populate from existing interview)
- ✅ Form validation
- ✅ Integration with Jobs page

#### 2. **Interview Display Components**
- ✅ `InterviewCard.jsx` - Display interview details with actions
- ✅ Used in Jobs page to show scheduled interviews
- ✅ Actions: Reschedule, Cancel, Confirm, Record Outcome

#### 3. **API Client** (`frontend/src/api/interviews.js`)
- ✅ Complete API wrapper functions for all backend endpoints
- ✅ Retry logic via `retryRequest()`
- ✅ Functions: `scheduleInterview`, `updateInterview`, `rescheduleInterview`, `cancelInterview`, `confirmInterview`, `recordOutcome`, `getUpcomingInterviews`, `checkConflicts`, `deleteInterview`, prep task CRUD, `generatePreparationTasks`

#### 4. **Integration Points**
- ✅ **Jobs page** (`frontend/src/pages/auth/Jobs.jsx`):
  - "Schedule Interview" button on job cards (Interview/Phone Screen status)
  - Opens InterviewScheduler modal
  - Links interviews to job applications via `jobId`
  - Displays scheduled interviews count
  - Shows InterviewCard components for scheduled interviews
- ✅ **Navigation**: Links exist to mock interview features

#### 5. **Related Features**
- ✅ **InterviewChecklist.jsx**: Pre/during/post-interview checklist
  - Includes "Send thank-you email within 24 hours" item
- ✅ **FollowUpTemplates.jsx**: Thank-you note system
  - Template types: Thank You, Status Inquiry, Feedback Request, Networking
  - Timing suggestions (24h for thank-you, 7-10 days for status, etc.)
  - Personalization fields: interviewer, interview date, specific topics, company projects
  - Integration with job data
- ✅ **CompanyResearch.jsx**: Research page linked to interviews (accepts `interviewId` param)

---

## ❌ NEEDS IMPLEMENTATION

### 1. **Calendar Sync (CRITICAL MISSING PIECE)**

#### Google Calendar Integration
- ❌ **OAuth 2.0 setup**:
  - No Google API credentials configured
  - Need to add `googleapis` npm package
  - Backend: Create OAuth flow routes (`/api/calendar/google/auth`, `/api/calendar/google/callback`)
  - Store refresh tokens in User model
- ❌ **Event creation/update**:
  - Backend utility: `createGoogleCalendarEvent(interview, accessToken)`
  - Backend utility: `updateGoogleCalendarEvent(eventId, updates, accessToken)`
  - Backend utility: `deleteGoogleCalendarEvent(eventId, accessToken)`
- ❌ **Sync logic**:
  - Store `googleCalendarEventId` in Interview model
  - Auto-create calendar event on interview schedule
  - Auto-update calendar event on interview reschedule
  - Auto-delete calendar event on interview cancellation
- ❌ **Frontend UI**:
  - "Connect Google Calendar" button in settings/profile
  - Toggle in InterviewScheduler: "Add to Google Calendar"
  - Status indicator: "Synced to Google Calendar" badge

#### Outlook Calendar Integration
- ❌ **Microsoft Graph API setup**:
  - No Microsoft app registration
  - Need to add `@microsoft/microsoft-graph-client` package
  - Backend: OAuth flow routes (`/api/calendar/outlook/auth`, `/api/calendar/outlook/callback`)
  - Store refresh tokens in User model
- ❌ **Event creation/update**:
  - Backend utility: `createOutlookCalendarEvent(interview, accessToken)`
  - Backend utility: `updateOutlookCalendarEvent(eventId, updates, accessToken)`
  - Backend utility: `deleteOutlookCalendarEvent(eventId, accessToken)`
- ❌ **Sync logic**:
  - Store `outlookCalendarEventId` in Interview model
  - Auto-create calendar event on interview schedule
  - Auto-update calendar event on interview reschedule
  - Auto-delete calendar event on interview cancellation
- ❌ **Frontend UI**:
  - "Connect Outlook Calendar" button in settings/profile
  - Toggle in InterviewScheduler: "Add to Outlook Calendar"
  - Status indicator: "Synced to Outlook" badge

#### iCalendar Export (Alternative)
- ❌ **ICS file generation**:
  - Backend utility: `generateICSFile(interview)`
  - Endpoint: `GET /api/interviews/:id/download-ics`
- ❌ **Frontend UI**:
  - "Download .ics file" button in InterviewScheduler
  - Works with any calendar app (Apple Calendar, Thunderbird, etc.)

### 2. **Thank-You Note Integration Enhancement**

While FollowUpTemplates.jsx exists, it needs tighter integration:

- ❌ **Auto-trigger after interview**:
  - Backend job: 24 hours after interview marked "Completed", create notification
  - Frontend: Notification banner: "Don't forget to send a thank-you note to [Interviewer]"
  - Direct link to pre-populated thank-you template with interview details
- ❌ **Interview outcome integration**:
  - When recording outcome, offer to generate thank-you note
  - Pre-populate template with interview-specific notes/topics
- ❌ **Email tracking**:
  - Store sent thank-you note status in Interview model
  - `thankYouNoteSent` boolean field
  - `thankYouNoteSentDate` timestamp
- ❌ **Frontend UI**:
  - "Send Thank-You Note" action button on InterviewCard
  - Checkmark indicator when thank-you note sent

### 3. **Dedicated Interview Management Page**

Currently interviews are only visible in Jobs page. Need centralized view:

- ❌ **New route**: `/interviews` page
- ❌ **Features**:
  - Calendar view (monthly/weekly) showing all scheduled interviews
  - List view with filters: Upcoming, Past, Cancelled, By Company, By Type
  - Quick actions: Reschedule, Cancel, Confirm, Record Outcome
  - Prep task checklist for each interview
  - Integration with CompanyResearch (button to research company)
  - Integration with MockInterviewStart (button to practice for interview)
- ❌ **Navigation**:
  - Add "Interviews" link to Navbar
  - Dashboard widget showing next 3 upcoming interviews

### 4. **Dashboard Integration**

Dashboard.jsx currently doesn't show interviews:

- ❌ **Upcoming interviews widget**:
  - Fetch via `getUpcomingInterviews(7)`
  - Display next 3 interviews with countdown timers
  - Quick actions: View Details, Prepare, Research Company
- ❌ **Statistics**:
  - Total interviews this month
  - Success rate (offers received / interviews completed)
  - Average preparation task completion rate

### 5. **Enhanced Prep Task Features**

Basic structure exists, needs UI:

- ❌ **Task management UI**:
  - Expandable checklist in InterviewCard
  - Add/edit/delete tasks inline
  - Mark tasks complete with checkboxes
  - Due date indicators with urgency colors (red for overdue, yellow for today, green for future)
- ❌ **Task notifications**:
  - Email reminder for incomplete prep tasks (24h before interview)
  - Browser notifications for overdue tasks
- ❌ **Progress tracking**:
  - Progress bar showing % of prep tasks completed
  - "Ready" badge when all tasks completed

### 6. **Mobile Responsiveness**

- ❌ **InterviewScheduler.jsx**: Test and optimize for mobile (long form may need scrolling/tabs)
- ❌ **Calendar view**: Mobile-friendly date picker and conflict display
- ❌ **Interview list**: Card layout for mobile screens

### 7. **Testing**

- ❌ **Backend tests**:
  - Interview controller tests
  - Reminder cron job tests (mock timers)
  - Conflict detection edge cases
  - Calendar sync utilities (mock API calls)
- ❌ **Frontend tests**:
  - InterviewScheduler component tests
  - Conflict detection UI tests
  - Calendar integration flow tests

---

## IMPLEMENTATION PRIORITY

### Phase 1: Calendar Sync (HIGHEST PRIORITY)
1. **Google Calendar OAuth** (2-3 days)
   - Add `googleapis` package
   - Create OAuth routes and token storage
   - Implement event CRUD utilities
   - Update Interview model to store `googleCalendarEventId`
   - Add sync logic to interview controller (create/update/delete events)
   - Frontend: "Connect Google Calendar" flow
   - Frontend: Toggle in InterviewScheduler

2. **Outlook Calendar OAuth** (2-3 days)
   - Add `@microsoft/microsoft-graph-client` package
   - Create OAuth routes and token storage
   - Implement event CRUD utilities
   - Update Interview model to store `outlookCalendarEventId`
   - Add sync logic to interview controller
   - Frontend: "Connect Outlook" flow
   - Frontend: Toggle in InterviewScheduler

3. **iCalendar Export** (1 day)
   - Add `ical-generator` package
   - Create ICS generation utility
   - Add download endpoint
   - Frontend: "Download .ics" button

### Phase 2: Dedicated Interview Page (HIGH PRIORITY)
1. **Create `/interviews` route** (3-4 days)
   - Calendar view component (use `react-calendar` or similar)
   - List view with filters
   - Integration with existing InterviewCard
   - Prep task checklist UI
   - Quick action buttons
   - Add to Navbar

2. **Dashboard Integration** (1-2 days)
   - Upcoming interviews widget
   - Statistics cards
   - Quick links to interview management

### Phase 3: Enhanced Features (MEDIUM PRIORITY)
1. **Thank-You Note Automation** (2 days)
   - Auto-trigger notifications 24h after interview
   - Add thank-you status fields to Interview model
   - Pre-populate templates with interview data
   - "Send Thank-You" button on InterviewCard

2. **Prep Task UI** (2 days)
   - Inline task management in InterviewCard
   - Due date indicators and urgency colors
   - Progress tracking UI
   - Task notification system

### Phase 4: Polish & Testing (LOW PRIORITY)
1. **Mobile Responsiveness** (2 days)
   - Optimize InterviewScheduler for mobile
   - Test calendar view on small screens
   - Responsive card layouts

2. **Comprehensive Testing** (3-4 days)
   - Backend unit tests
   - Frontend component tests
   - Integration tests for calendar sync
   - E2E tests for full scheduling flow

---

## ESTIMATED TIMELINE

- **Phase 1 (Calendar Sync)**: 5-7 days
- **Phase 2 (Interview Page)**: 4-6 days
- **Phase 3 (Enhanced Features)**: 4 days
- **Phase 4 (Polish & Testing)**: 5-6 days

**Total**: 18-23 days (3-4 weeks)

---

## TECHNICAL NOTES

### Calendar Sync Implementation Details

#### Google Calendar OAuth Flow
```javascript
// backend/src/routes/calendarRoutes.js
const { google } = require('googleapis');
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

router.get('/google/auth', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.events']
  });
  res.redirect(authUrl);
});

router.get('/google/callback', async (req, res) => {
  const { code } = req.query;
  const { tokens } = await oauth2Client.getToken(code);
  // Store tokens in User model
  await User.findByIdAndUpdate(req.userId, {
    'calendarSettings.google.refreshToken': tokens.refresh_token,
    'calendarSettings.google.accessToken': tokens.access_token
  });
  res.redirect('/settings?calendar=connected');
});
```

#### Calendar Event Creation
```javascript
// backend/src/utils/googleCalendar.js
async function createGoogleCalendarEvent(interview, accessToken) {
  oauth2Client.setCredentials({ access_token: accessToken });
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  
  const event = {
    summary: interview.title,
    description: `Interview with ${interview.company}\nInterviewer: ${interview.interviewer.name}`,
    location: interview.location || interview.meetingLink,
    start: {
      dateTime: interview.scheduledDate,
      timeZone: 'America/New_York' // Use user's timezone
    },
    end: {
      dateTime: new Date(new Date(interview.scheduledDate).getTime() + interview.duration * 60000),
      timeZone: 'America/New_York'
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },
        { method: 'popup', minutes: 120 }
      ]
    }
  };
  
  const response = await calendar.events.insert({
    calendarId: 'primary',
    resource: event
  });
  
  return response.data.id; // Store this in interview.googleCalendarEventId
}
```

#### User Model Updates
```javascript
// backend/src/models/User.js
calendarSettings: {
  google: {
    connected: { type: Boolean, default: false },
    refreshToken: String,
    accessToken: String,
    tokenExpiry: Date
  },
  outlook: {
    connected: { type: Boolean, default: false },
    refreshToken: String,
    accessToken: String,
    tokenExpiry: Date
  }
}
```

#### Interview Model Updates
```javascript
// backend/src/models/Interview.js (add fields)
googleCalendarEventId: String,
outlookCalendarEventId: String,
thankYouNoteSent: { type: Boolean, default: false },
thankYouNoteSentDate: Date
```

---

## ACCEPTANCE CRITERIA CHECKLIST

Based on UC-079 requirements:

- ✅ Users can schedule interviews linked to job applications
- ✅ System sends automated reminders (24h, 2h, 1h before)
- ❌ Calendar sync: Google Calendar integration
- ❌ Calendar sync: Outlook integration
- ❌ Calendar sync: iCalendar export option
- ✅ Users can reschedule or cancel interviews
- ✅ System tracks interview outcomes
- ✅ Preparation task generation and management (backend exists, needs UI)
- ❌ Thank-you note auto-trigger after interview
- ✅ Conflict detection and warnings
- ❌ Dedicated interview management page
- ❌ Dashboard integration showing upcoming interviews

**Current Progress**: 7/12 acceptance criteria completed (58%)

---

## CONCLUSION

**STRENGTHS**: 
- Robust backend infrastructure already in place (model, reminders, API)
- Basic frontend scheduling UI exists and is functional
- Email system configured
- Prep task generation logic implemented
- Thank-you note template system exists

**GAPS**: 
- **Calendar sync is the critical missing piece** - no OAuth flows or external calendar integration
- No dedicated interview management page (currently buried in Jobs page)
- Dashboard doesn't show upcoming interviews
- Prep task UI needs building
- Thank-you note system not auto-triggered

**RECOMMENDATION**: 
Prioritize calendar sync (Google + Outlook + iCalendar) first, as this is the core requirement for UC-079. Then build dedicated interview management page to surface all this functionality to users. Finally, add polish with auto-triggered thank-you notes and prep task UI enhancements.
