# External Career Advisors Feature

## Overview

The External Career Advisors feature enables users to centralize all their career support relationships by integrating external coaches, consultants, and advisors into the platform. This provides a unified hub for managing professional guidance, tracking advisory impact, handling billing, and measuring career advancement success.

## Feature Components

### Backend

#### Models (`/backend/src/models/ExternalAdvisor.js`)

1. **ExternalAdvisorRelationship** - Core relationship between client and advisor
   - Status tracking (pending, accepted, active, paused, completed, terminated)
   - Advisor types (career_coach, resume_specialist, interview_coach, networking_expert, salary_negotiator, industry_consultant, executive_coach, other)
   - Service definitions and focus areas
   - Billing preferences (free, hourly, package, retainer)
   - Shared data permissions

2. **AdvisorSession** - Session scheduling and management
   - Session types (initial_consultation, coaching, resume_review, mock_interview, strategy_session, follow_up, other)
   - Status workflow (scheduled, confirmed, in_progress, completed, cancelled, no_show)
   - Meeting links and notes
   - Ratings and feedback

3. **AdvisorBilling** - Billing agreements and rate structures
   - Hourly, package, and retainer pricing models
   - Payment method tracking
   - Active/inactive status

4. **AdvisorPayment** - Payment records
   - Amount and status tracking
   - Receipt management
   - Session linkage

5. **AdvisorReview** - Performance evaluations
   - Multi-category ratings
   - NPS scoring
   - Public/anonymous visibility options

6. **AdvisorImpactMetric** - Success tracking
   - Applications, interviews, offers metrics
   - Milestone achievements
   - Attribution to advisor guidance

#### Controller (`/backend/src/controllers/externalAdvisorController.js`)

Key functions:
- `inviteAdvisor` - Send invitation to external advisor
- `acceptAdvisorInvitation` - Accept pending invitation
- `getMyAdvisors` / `getMyClients` - List relationships
- `scheduleSession` / `completeSession` - Session management
- `createBillingAgreement` / `recordPayment` - Billing operations
- `submitReview` - Performance evaluation
- `trackImpactMetric` - Log career progress
- `getAdvisorPerformance` / `getImpactAnalysis` - Analytics

#### Routes (`/backend/src/routes/externalAdvisorRoutes.js`)

Base path: `/api/external-advisors`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/invite` | Invite external advisor |
| POST | `/accept/:id` | Accept invitation |
| GET | `/my-advisors` | Get user's advisors |
| GET | `/my-clients` | Get advisor's clients |
| POST | `/sessions` | Schedule session |
| PUT | `/sessions/:id/complete` | Complete session |
| POST | `/billing` | Create billing agreement |
| POST | `/payments` | Record payment |
| POST | `/reviews` | Submit review |
| POST | `/impact` | Track impact metric |
| GET | `/performance/:id` | Get advisor performance |
| GET | `/impact-analysis/:id` | Get impact analysis |

### Frontend Components

#### Location: `/frontend/src/components/advisors/`

1. **InviteAdvisorModal.jsx**
   - Multi-step invitation form
   - Advisor type selection
   - Services and focus area configuration
   - Billing preference setup
   - Shared data permissions

2. **AdvisorDashboard.jsx**
   - Tabbed interface (My Advisors, My Clients, Sessions, Billing, Reviews)
   - Relationship overview
   - Quick actions
   - Pending invitations management

3. **AdvisorSessionManagement.jsx**
   - Session booking form
   - Session list view
   - Status management
   - Notes and cancellation

4. **AdvisorEvaluationForm.jsx**
   - Multi-step evaluation wizard
   - Star ratings for multiple categories
   - NPS score collection
   - Qualitative feedback
   - Public/anonymous options

5. **AdvisorBillingPanel.jsx**
   - Billing agreement overview
   - Payment history
   - Record payment modal
   - Invoice management (placeholder)

6. **AdvisorImpactTracker.jsx**
   - Impact score calculation
   - Category breakdown (applications, interviews, offers, etc.)
   - Progress logging
   - Milestone tracking

#### Page: `/frontend/src/pages/AdvisorsPage.jsx`
- Main advisors hub with navigation
- View switching (dashboard, sessions, billing, impact)
- Relationship selector
- Modal integration

## User Stories Covered

### UC-081: Invite External Coaches and Advisors
✅ Users can invite external career coaches by email
✅ Specify advisor type and services
✅ Set data sharing permissions
✅ Track invitation status

### UC-082: Secure Communication Channels
✅ Session scheduling with meeting links
✅ Session notes and documentation
✅ Status tracking and notifications

### UC-083: Share Job Search Materials
✅ Configurable data sharing (profile, resume, applications, interviews)
✅ Granular permission controls
✅ Focus area specification

### UC-084: Track Advisor Recommendations
✅ Session notes for recording advice
✅ Impact metrics for tracking implementation
✅ Milestone achievements

### UC-085: Billing Integration
✅ Multiple billing models (hourly, package, retainer)
✅ Payment recording and tracking
✅ Invoice generation (placeholder)
✅ Payment status management

### UC-086: Advisor Performance Evaluation
✅ Multi-dimensional rating system
✅ NPS scoring
✅ Qualitative feedback
✅ Public/private review options

### UC-087: Scheduling Integration
✅ Session scheduling with date/time
✅ Session types and duration
✅ Meeting link management
✅ Status workflow

### UC-088: Track Advisor Impact
✅ Impact score calculation
✅ Category-based metrics
✅ Time period filtering
✅ Milestone tracking
✅ Progress logging

## Navigation

- Desktop: Career Tools dropdown → "🎓 Advisors Hub"
- Mobile: Career Tools section → "🎓 Advisors Hub"
- Direct URL: `/advisors`

## Database Collections

```javascript
// Collections created by the ExternalAdvisor models
externaladvisorrelationships
advisorsessions
advisorbillings
advisorpayments
advisorreviews
advisorimpactmetrics
```

## Security

- All routes protected with `checkJwt` middleware
- User ownership validation on all operations
- Relationship status checks before actions
- Token-based invitation system

## Testing

### API Testing

```bash
# Invite an advisor
curl -X POST http://localhost:5050/api/external-advisors/invite \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "advisorEmail": "coach@example.com",
    "advisorType": "career_coach",
    "services": ["career_planning", "interview_prep"],
    "billingPreference": "hourly",
    "hourlyRate": 150
  }'

# Get my advisors
curl http://localhost:5050/api/external-advisors/my-advisors \
  -H "Authorization: Bearer <token>"

# Schedule a session
curl -X POST http://localhost:5050/api/external-advisors/sessions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "relationshipId": "<relationship_id>",
    "sessionType": "coaching",
    "scheduledDate": "2024-02-01T14:00:00Z",
    "duration": 60
  }'
```

### Frontend Testing

1. Navigate to `/advisors`
2. Click "Invite Advisor" to test invitation flow
3. Use the tabs to navigate between views
4. Select a relationship to test session, billing, and impact features

## File Structure

```
backend/
├── src/
│   ├── models/
│   │   └── ExternalAdvisor.js
│   ├── controllers/
│   │   └── externalAdvisorController.js
│   ├── routes/
│   │   └── externalAdvisorRoutes.js
│   └── server.js (updated)

frontend/
├── src/
│   ├── components/
│   │   └── advisors/
│   │       ├── index.js
│   │       ├── InviteAdvisorModal.jsx
│   │       ├── AdvisorDashboard.jsx
│   │       ├── AdvisorSessionManagement.jsx
│   │       ├── AdvisorEvaluationForm.jsx
│   │       ├── AdvisorBillingPanel.jsx
│   │       └── AdvisorImpactTracker.jsx
│   ├── pages/
│   │   └── AdvisorsPage.jsx
│   ├── App.jsx (updated)
│   └── components/
│       └── Navbar.jsx (updated)
```

## Future Enhancements

1. **Real-time messaging** - Direct chat with advisors
2. **Calendar integration** - Sync with Google/Outlook calendars
3. **Payment processing** - Stripe/PayPal integration
4. **Video conferencing** - Built-in video calls
5. **Document sharing** - Resume/cover letter collaboration
6. **Advisor marketplace** - Find and connect with verified advisors
7. **Analytics dashboard** - Advanced ROI tracking
8. **Mobile app** - Native mobile experience
