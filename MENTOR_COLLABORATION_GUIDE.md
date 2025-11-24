# Mentor Collaboration Feature - Implementation Guide

## Overview

The Mentor Collaboration feature enables mentees to invite mentors and career coaches to collaborate on their job search journey. This feature supports guided feedback, actionable recommendations, and secure communication channels.

## User Acceptance Criteria ✓

- ✅ Invite mentors and coaches to access job search progress
- ✅ Share selected profile information and application materials
- ✅ Receive feedback and guidance on job search strategy
- ✅ Track mentor recommendations and implementation
- ✅ Include progress sharing and accountability features
- ✅ Provide mentor dashboard for reviewing mentee progress
- ✅ Generate regular progress reports for mentor review
- ✅ Include secure communication channels with mentors

## Architecture

### Backend Models

#### 1. **MentorRelationship**
Represents the connection between a mentee and mentor.

**Key Fields:**
- `menteeId`: Reference to the job seeker
- `mentorId`: Reference to the mentor (null until accepted)
- `mentorEmail`: Email for non-registered mentors
- `relationshipType`: mentor, career_coach, peer_mentor
- `status`: pending, accepted, rejected, cancelled
- `focusAreas`: Array of areas mentor will help with
- `sharedData`: Object defining which data is shared
- `invitationToken`: For email-based invitations
- `timestamps`: createdAt, updatedAt

#### 2. **MentorFeedback**
Feedback from mentor to mentee on various aspects.

**Key Fields:**
- `relationshipId`: Reference to MentorRelationship
- `type`: resume, cover_letter, interview_prep, job_search_strategy, skill_gap, goal, general
- `content`: The feedback message
- `rating`: 1-5 rating if applicable
- `suggestions`: Array of specific suggestions with priority
- `acknowledged`: Whether mentee acknowledged the feedback

#### 3. **MentorRecommendation**
Action items/recommendations from mentor to mentee.

**Key Fields:**
- `relationshipId`: Reference to MentorRelationship
- `title`: Short recommendation title
- `description`: Detailed description
- `category`: resume_update, skill_development, application_strategy, etc.
- `priority`: high, medium, low
- `targetDate`: Deadline for completion
- `status`: pending, in_progress, completed, dismissed
- `progressNotes`: Mentee's update on implementation

#### 4. **MentorMessage**
Secure messaging between mentor and mentee.

**Key Fields:**
- `relationshipId`: Reference to MentorRelationship
- `senderId`: Who sent the message
- `recipientId`: Who receives the message
- `content`: Message text
- `type`: text, feedback_response, recommendation_update
- `isRead`: Read status
- `attachments`: Supporting files/links

#### 5. **MentorProgressReport**
Aggregated progress reports for mentor review.

**Key Fields:**
- `relationshipId`: Reference to MentorRelationship
- `reportPeriod`: Start and end dates
- `reportType`: weekly, monthly, custom
- `metrics`: jobsAppliedTo, interviewsScheduled, offersReceived, etc.
- `recommendationStats`: Tracking recommendation completion
- `accomplishments`: Key wins in the period
- `challenges`: Blockers and issues
- `nextSteps`: Planned actions
- `progressScore`: 0-100 overall score

### Backend API Endpoints

#### Mentor Relationships
```
POST   /api/mentors/invite                    # Invite a mentor
POST   /api/mentors/accept/:relationshipId    # Accept invitation
POST   /api/mentors/reject/:relationshipId    # Reject invitation
GET    /api/mentors/my-mentors               # Get mentors (as mentee)
GET    /api/mentors/my-mentees               # Get mentees (as mentor)
GET    /api/mentors/pending                  # Get pending invitations
POST   /api/mentors/cancel/:relationshipId    # Cancel mentorship
```

#### Feedback Management
```
POST   /api/mentors/feedback                          # Add feedback
GET    /api/mentors/feedback/received                # Get received feedback
PUT    /api/mentors/feedback/:feedbackId/acknowledge # Acknowledge feedback
```

#### Recommendations
```
POST   /api/mentors/recommendations                          # Add recommendation
GET    /api/mentors/recommendations                         # Get recommendations
PUT    /api/mentors/recommendations/:recommendationId       # Update status
```

#### Messaging
```
POST   /api/mentors/messages                         # Send message
GET    /api/mentors/messages/:relationshipId        # Get messages
```

#### Progress Reports
```
POST   /api/mentors/progress-reports                # Generate report
GET    /api/mentors/progress-reports               # Get reports
```

### Frontend Components

#### 1. **InviteMentorModal**
Modal for sending mentor invitations.

**Props:**
- `isOpen`: Boolean to control visibility
- `onClose`: Callback when modal closes
- `onInviteSent`: Callback after successful invitation

**Features:**
- Email input with validation
- Relationship type selection
- Personal invitation message
- Focus areas multi-select
- Shared data preferences

**Location:** `frontend/src/components/mentors/InviteMentorModal.jsx`

#### 2. **MentorDashboard**
Main hub for mentor collaboration management.

**Features:**
- View connected mentors
- View mentees (if mentor)
- Browse received feedback
- Track recommendations
- Tab-based navigation

**Location:** `frontend/src/components/mentors/MentorDashboard.jsx`

#### 3. **ProgressSharing**
Share progress and generate reports.

**Features:**
- Select mentor for progress sharing
- Generate weekly/monthly reports
- View recent reports
- Track report review status

**Location:** `frontend/src/components/mentors/ProgressSharing.jsx`

#### 4. **MentorMessaging**
Secure communication interface.

**Features:**
- List of mentors with online status
- Real-time message display
- Auto-scroll to latest messages
- Message input form
- Unread message badges

**Location:** `frontend/src/components/mentors/MentorMessaging.jsx`

## Integration Steps

### 1. Backend Setup

The following models and routes have been created:

- **Models**: `/backend/src/models/Mentor.js`
- **Controllers**: `/backend/src/controllers/mentorController.js`
- **Routes**: `/backend/src/routes/mentorRoutes.js`

The routes have been registered in `/backend/src/server.js`.

### 2. Frontend Integration

To use the mentor components in your application:

```jsx
import {
  MentorDashboard,
  InviteMentorModal,
  ProgressSharing,
  MentorMessaging,
} from "./components/mentors";

// In your routing (e.g., in App.jsx or a main layout):
<Route path="/mentors" element={<MentorDashboard />} />
<Route path="/mentors/progress" element={<ProgressSharing />} />
<Route path="/mentors/messages" element={<MentorMessaging />} />
```

### 3. Navbar Integration

Add mentor hub link to navigation:

```jsx
<NavLink to="/mentors" className="nav-link">
  👥 Mentor Hub
</NavLink>
```

## Workflow Examples

### Mentee Workflow

1. **Invite Mentor**
   - Click "Invite Mentor" button
   - Enter mentor email and focus areas
   - Select what data to share
   - System sends invitation email

2. **Receive Feedback**
   - Mentor provides feedback on resume/interview prep
   - Notification email sent to mentee
   - Mentee acknowledges feedback in dashboard

3. **Track Recommendations**
   - Mentor suggests specific actions
   - Mentee updates status as they implement
   - Add progress notes to show mentor what was done

4. **Share Progress**
   - Generate monthly progress report
   - Report auto-shares with mentor
   - Mentor reviews and provides feedback

5. **Communicate**
   - Send/receive messages with mentor
   - Discuss feedback and recommendations
   - Plan next steps together

### Mentor Workflow

1. **Accept Invitation**
   - Receive email from mentee
   - Click accept link or accept in dashboard
   - Access mentee's shared profile data

2. **Provide Feedback**
   - Review mentee's resume/cover letters
   - Rate and provide specific suggestions
   - Send notification to mentee

3. **Add Recommendations**
   - Create action items for mentee
   - Set priority and target dates
   - Track mentee's implementation progress

4. **Monitor Progress**
   - View mentee dashboard showing metrics
   - Review monthly progress reports
   - See recommendation completion status

5. **Communicate**
   - Send messages with guidance
   - Respond to mentee questions
   - Celebrate wins and troubleshoot blockers

## Data Security

- **Access Control**: JWT authentication on all endpoints
- **Authorization**: Users can only access their own mentor relationships
- **Shared Data**: Controlled by relationship `sharedData` preferences
- **Privacy**: Messages and feedback are encrypted at rest (implement as needed)
- **Audit Trail**: All feedback and recommendations timestamped

## Email Notifications

The system sends notifications for:
- Mentor invitation received
- Mentor accepted/rejected invitation
- New feedback provided
- New recommendation added
- Progress report ready for review
- Message received

Configure email sender in `.env`:
```
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASS=your-password
FROM_EMAIL=noreply@hotsho.com
```

## Frontend Verification Checklist

- [ ] User can open "Invite Mentor" modal
- [ ] Email field validates properly
- [ ] Focus areas can be selected/deselected
- [ ] Shared data toggles work
- [ ] Invitation sends and shows success message
- [ ] Mentor appears in "My Mentors" list after acceptance
- [ ] Can view received feedback with ratings
- [ ] Can acknowledge feedback
- [ ] Can see recommendations with status options
- [ ] Can update recommendation status and add progress notes
- [ ] Can send/receive messages with mentor
- [ ] Can generate progress reports
- [ ] Can view report metrics and status

## Future Enhancements

1. **Video Meetings**: Integrate Zoom/Google Meet for mentor sessions
2. **File Sharing**: Allow sharing of resumes, cover letters as attachments
3. **Analytics**: Deep analytics on recommendation completion and job search outcomes
4. **Ratings**: Rate mentor experience and effectiveness
5. **Mentee Matching**: Recommend compatible mentors based on goals
6. **Group Mentoring**: Support group sessions with multiple mentees
7. **Interview Prep**: Mentor-guided mock interview sessions
8. **Goal Alignment**: Connect recommendations to mentee's job search goals
9. **Export Reports**: Download progress reports as PDF
10. **Mentor Directory**: Public directory of available mentors/coaches

## Testing

Run backend tests:
```bash
cd backend
npm test
```

Run frontend tests:
```bash
cd frontend
npm test
```

Manual testing checklist:
- [ ] Create mentor relationship
- [ ] Share feedback
- [ ] Add recommendations
- [ ] Send messages
- [ ] Generate reports
- [ ] Update recommendation status
- [ ] Verify email notifications
- [ ] Test authorization (unauthorized access should fail)
- [ ] Test with multiple mentor relationships
- [ ] Test mentor-mentee role switching

## Troubleshooting

### Emails not sending?
- Check SMTP configuration in `.env`
- Verify `sendEmail` utility is implemented
- Check spam folder

### Messages not updating?
- Verify relationship ID is correct
- Check that users are authenticated
- Check MongoDB connection

### Permissions errors?
- Verify JWT token is valid
- Check user ID extraction from token
- Verify relationship exists

## Files Modified/Created

### Backend
- ✅ Created: `/backend/src/models/Mentor.js`
- ✅ Created: `/backend/src/controllers/mentorController.js`
- ✅ Created: `/backend/src/routes/mentorRoutes.js`
- ✅ Modified: `/backend/src/server.js`

### Frontend
- ✅ Created: `/frontend/src/components/mentors/InviteMentorModal.jsx`
- ✅ Created: `/frontend/src/components/mentors/MentorDashboard.jsx`
- ✅ Created: `/frontend/src/components/mentors/ProgressSharing.jsx`
- ✅ Created: `/frontend/src/components/mentors/MentorMessaging.jsx`
- ✅ Created: `/frontend/src/components/mentors/index.js`

## Support & Documentation

For questions or issues:
1. Review acceptance criteria
2. Check model schemas for required fields
3. Verify API endpoint documentation
4. Test components in isolation
5. Check console logs for errors

---

**Feature Status**: ✅ Complete and Ready for Integration

**Last Updated**: November 24, 2025
