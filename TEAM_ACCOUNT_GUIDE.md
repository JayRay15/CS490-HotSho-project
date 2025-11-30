# Team Account Functionality - Complete Guide

## Overview
This comprehensive team account system allows career coaches and mentors to support multiple candidates simultaneously with robust permission management, analytics, and collaboration tools.

## Table of Contents
1. [Features](#features)
2. [Architecture](#architecture)
3. [API Endpoints](#api-endpoints)
4. [Database Models](#database-models)
5. [Frontend Components](#frontend-components)
6. [Testing Guide](#testing-guide)
7. [Role-Based Permissions](#role-based-permissions)
8. [Subscription Plans](#subscription-plans)

## Features

### Core Functionality
- ✅ **Team Creation & Management** - Create and configure teams with custom branding
- ✅ **Multi-Role Support** - Owner, Admin, Mentor, Coach, Candidate, and Viewer roles
- ✅ **Granular Permissions** - Fine-grained access control for data and actions
- ✅ **Member Invitations** - Email-based invitation system with tokens
- ✅ **Team Dashboard** - Aggregate metrics and progress tracking
- ✅ **Candidate Progress Tracking** - View individual candidate applications, interviews, and goals
- ✅ **Activity Logging** - Complete audit trail of team actions
- ✅ **Subscription Management** - Tiered plans with usage limits
- ✅ **Data Sharing Controls** - Candidates control what data is shared
- ✅ **Team Analytics** - Aggregate reporting across all candidates

### Permission System
Each role has default permissions that can be customized per member:
- View/manage candidates
- View/edit resumes, applications, interviews
- View analytics and reports
- Invite/remove members
- Manage roles and team settings
- Access billing information

## Architecture

### Backend Structure
```
backend/src/
├── models/
│   └── Team.js                 # Team, TeamMember, TeamSubscription, TeamActivityLog models
├── controllers/
│   ├── teamController.js       # Team CRUD, members, dashboard, analytics
│   └── teamSubscriptionController.js  # Billing and subscription management
├── middleware/
│   └── teamMiddleware.js       # Auth, permissions, limits verification
└── routes/
    └── teamRoutes.js           # All team-related API routes
```

### Frontend Structure
```
frontend/src/
├── api/
│   └── teams.js                # API client for team operations
└── pages/
    ├── TeamsPage.jsx           # List all teams, create new team
    └── TeamDashboardPage.jsx   # Team dashboard with metrics and members
```

## API Endpoints

### Team Management
```
POST   /api/teams                          # Create team
GET    /api/teams                          # Get user's teams
GET    /api/teams/:identifier              # Get team by ID or slug
PUT    /api/teams/:teamId                  # Update team
DELETE /api/teams/:teamId                  # Delete team (soft delete)
```

### Member Management
```
POST   /api/teams/:teamId/members/invite              # Invite member
POST   /api/teams/invitations/:token/accept           # Accept invitation
GET    /api/teams/:teamId/members                     # Get team members
PUT    /api/teams/:teamId/members/:memberId           # Update member role/permissions
DELETE /api/teams/:teamId/members/:memberId           # Remove member
```

### Analytics & Dashboard
```
GET    /api/teams/:teamId/dashboard                   # Team dashboard with metrics
GET    /api/teams/:teamId/candidates/:candidateId/progress  # Candidate progress
GET    /api/teams/:teamId/activity                    # Team activity log
```

### Subscription & Billing
```
GET    /api/teams/:teamId/subscription               # Get subscription details
PUT    /api/teams/:teamId/subscription               # Update subscription
POST   /api/teams/:teamId/subscription/cancel        # Cancel subscription
GET    /api/teams/:teamId/subscription/usage         # Get usage metrics
POST   /api/teams/:teamId/subscription/coupon        # Apply coupon code
```

## Database Models

### Team Schema
```javascript
{
  name: String,                    // Team name
  slug: String,                    // URL-friendly identifier
  description: String,             // Team description
  teamType: String,                // career_coaching, mentorship, etc.
  ownerId: ObjectId,               // Team owner (creator)
  settings: {
    isPublic: Boolean,
    allowMemberInvites: Boolean,
    requireApproval: Boolean,
    enableMessaging: Boolean,
    defaultDataSharing: { ... }
  },
  stats: {
    totalMembers: Number,
    activeCandidates: Number,
    totalApplications: Number,
    totalInterviews: Number
  },
  subscriptionId: ObjectId,        // Reference to subscription
  status: String,                  // active, suspended, cancelled, trial
  trialEndsAt: Date
}
```

### TeamMember Schema
```javascript
{
  teamId: ObjectId,                // Team reference
  userId: ObjectId,                // User reference (null if pending)
  email: String,                   // Email for invitation
  role: String,                    // owner, admin, mentor, coach, candidate, viewer
  status: String,                  // pending, active, suspended, removed
  invitedBy: ObjectId,
  invitationToken: String,
  invitationExpiresAt: Date,
  joinedAt: Date,
  permissions: {                   // Custom permissions override role defaults
    viewCandidates: Boolean,
    manageCandidates: Boolean,
    viewResumes: Boolean,
    // ... more permissions
  },
  dataSharing: {                   // For candidates - what data to share
    shareResume: Boolean,
    shareApplications: Boolean,
    shareInterviews: Boolean,
    // ... more sharing options
  },
  focusAreas: [String]             // For mentor-candidate relationships
}
```

### TeamSubscription Schema
```javascript
{
  teamId: ObjectId,
  plan: String,                    // free, starter, professional, enterprise
  billingCycle: String,            // monthly, annual
  price: Number,
  limits: {
    maxMembers: Number,
    maxCandidates: Number,
    maxMentors: Number,
    maxStorage: Number,
    maxReportsPerMonth: Number
  },
  usage: {                         // Current usage tracking
    currentMembers: Number,
    currentCandidates: Number,
    currentMentors: Number,
    currentStorage: Number,
    reportsThisMonth: Number
  },
  status: String,                  // active, past_due, cancelled, trialing
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  stripeCustomerId: String,
  stripeSubscriptionId: String
}
```

### TeamActivityLog Schema
```javascript
{
  teamId: ObjectId,
  actorId: ObjectId,
  actorName: String,
  actorRole: String,
  action: String,                  // team_created, member_invited, etc.
  targetType: String,              // team, member, candidate, subscription
  targetId: ObjectId,
  details: Mixed,                  // Action-specific details
  ipAddress: String,
  userAgent: String,
  createdAt: Date
}
```

## Frontend Components

### TeamsPage
**Purpose**: List all teams and create new teams

**Features**:
- Display all teams user is a member of
- Show role badge for each team
- Create new team with name, description, and type
- Navigate to team dashboard

**Key Functions**:
- `fetchTeams()` - Load user's teams
- `handleCreateTeam()` - Create new team
- `getRoleIcon()` - Display role-specific icons
- `getRoleBadgeColor()` - Color code role badges

### TeamDashboardPage
**Purpose**: Main team management interface

**Features**:
- Team metrics overview (members, candidates, applications, interviews)
- Member list with roles and status
- Invite new members
- Manage member permissions
- View recent team activity
- Navigate to team settings

**Key Functions**:
- `fetchTeamData()` - Load team, dashboard, and members
- `handleInviteMember()` - Send invitation to new member
- `handleRemoveMember()` - Remove member from team
- `canInviteMembers` - Check invitation permission
- `canManageMembers` - Check management permission

## Testing Guide

### 1. Create Team Account

**Test Steps**:
1. Navigate to Teams page (`/teams`)
2. Click "Create Team" button
3. Fill in:
   - Team Name: "Test Coaching Team"
   - Description: "Team for testing career coaching features"
   - Team Type: "Career Coaching"
4. Click "Create Team"

**Expected Results**:
- ✅ Team is created with status "trial"
- ✅ User is added as team owner
- ✅ Free subscription is created
- ✅ Redirected to team dashboard
- ✅ Team appears in teams list

### 2. Invite Team Members

**Test Steps**:
1. From team dashboard, click "Invite Member"
2. Fill in:
   - Email: test-candidate@example.com
   - Role: Candidate
   - Message: "Join our coaching team!"
3. Click "Send Invitation"
4. Repeat for:
   - test-mentor@example.com (Role: Mentor)
   - test-admin@example.com (Role: Admin)

**Expected Results**:
- ✅ Invitations are created with unique tokens
- ✅ Members appear in list with "Pending" status
- ✅ Email notifications sent (if configured)
- ✅ Activity log shows "member_invited" actions

### 3. Accept Invitation

**Test Steps**:
1. Log in as invited user
2. Navigate to invitation link with token
3. Click "Accept Invitation"

**Expected Results**:
- ✅ Membership status changes to "active"
- ✅ User can access team dashboard
- ✅ Team stats updated
- ✅ Subscription usage incremented
- ✅ Activity log shows "member_joined"

### 4. Manage Permissions

**Test Steps**:
1. As team owner, go to team dashboard
2. Click menu (⋮) next to a member
3. Select "Change Role" or "Edit Permissions"
4. Update role or specific permissions
5. Save changes

**Expected Results**:
- ✅ Member role updated
- ✅ Permissions reflect new role defaults
- ✅ Custom permissions override role defaults
- ✅ Activity log shows "member_role_changed"

### 5. View Candidate Progress

**Test Steps**:
1. As mentor/coach/admin, go to team dashboard
2. Click on a candidate member
3. View their progress data

**Expected Results**:
- ✅ Only shared data is visible
- ✅ Applications, interviews, and goals displayed
- ✅ Respect candidate's data sharing settings
- ✅ Non-shared data shows permission message

### 6. View Team Analytics

**Test Steps**:
1. Navigate to team dashboard
2. Review metrics cards
3. Check recent activity log

**Expected Results**:
- ✅ Total members count is accurate
- ✅ Active candidates count is correct
- ✅ Application count aggregated from all candidates
- ✅ Interview count aggregated from all candidates
- ✅ Activity log shows recent actions with timestamps

### 7. Manage Subscription

**Test Steps**:
1. As team owner, navigate to subscription settings
2. View current plan and usage
3. Try to upgrade plan
4. Apply coupon code (e.g., "WELCOME20")
5. Check subscription limits

**Expected Results**:
- ✅ Current plan details displayed
- ✅ Usage bars show current vs. limits
- ✅ Plan upgrade updates limits
- ✅ Coupon applies discount
- ✅ Over-limit actions are blocked

### 8. Remove Team Member

**Test Steps**:
1. As admin/owner, go to team dashboard
2. Click menu (⋮) next to a member
3. Select "Remove Member"
4. Confirm removal

**Expected Results**:
- ✅ Member marked as removed (soft delete)
- ✅ Member can no longer access team
- ✅ Team stats decremented
- ✅ Subscription usage decremented
- ✅ Activity log shows "member_removed"

## Role-Based Permissions

### Owner (Team Creator)
**Can**:
- ✅ All admin permissions
- ✅ Delete team
- ✅ Transfer ownership
- ✅ Manage billing and subscription
- ✅ Cannot be removed

### Admin
**Can**:
- ✅ View all candidates
- ✅ Manage candidates
- ✅ View resumes, applications, interviews
- ✅ View analytics
- ✅ Invite members
- ✅ Remove members (except owner)
- ✅ Update team settings
- ✅ Create reports and share feedback

**Cannot**:
- ❌ Manage billing
- ❌ Change team owner
- ❌ Delete team

### Mentor / Coach
**Can**:
- ✅ View assigned candidates
- ✅ View candidate resumes and applications
- ✅ View candidate interviews
- ✅ View candidate analytics
- ✅ Send messages
- ✅ Create reports
- ✅ Share feedback

**Cannot**:
- ❌ Manage team members
- ❌ Invite new members
- ❌ Update team settings
- ❌ Manage billing

### Candidate
**Can**:
- ✅ View own data (resumes, applications, interviews)
- ✅ Edit own data
- ✅ View own analytics
- ✅ Send messages
- ✅ Control data sharing settings

**Cannot**:
- ❌ View other candidates
- ❌ Manage team members
- ❌ Access team settings

### Viewer
**Can**:
- ✅ View team dashboard
- ✅ View aggregate analytics
- ✅ View candidate list (names only)

**Cannot**:
- ❌ View candidate details
- ❌ Send messages
- ❌ Manage members
- ❌ Edit any data

## Subscription Plans

### Free Plan
- 5 members max
- 5 candidates max
- 1 mentor max
- 1GB storage
- 10 reports per month
- 14-day trial

### Starter ($29/month or $290/year)
- 15 members max
- 10 candidates max
- 3 mentors max
- 5GB storage
- 50 reports per month

### Professional ($99/month or $990/year)
- 50 members max
- 40 candidates max
- 10 mentors max
- 20GB storage
- 200 reports per month

### Enterprise ($299/month or $2990/year)
- 999 members max
- 500 candidates max
- 50 mentors max
- 100GB storage
- Unlimited reports
- Custom features

## Advanced Features

### Data Sharing Controls
Candidates can control what data is shared with team:
- Resume visibility
- Cover letter access
- Application history
- Interview preparation
- Goals and progress
- Skill gap analysis
- Analytics and reports

### Activity Logging
All team actions are logged:
- Team creation/updates
- Member invitations/joins/removals
- Role changes
- Permission updates
- Data access
- Report generation
- Subscription changes

### Team Settings
Configurable team options:
- Public/private team
- Allow member invites
- Require admin approval
- Enable messaging
- Enable shared reports
- Default data sharing
- Notification preferences
- Branding (logo, colors)

## Troubleshooting

### Common Issues

**1. Invitation not working**
- Check email address is correct
- Verify invitation hasn't expired (7 days)
- Ensure team hasn't reached member limit
- Check user isn't already a member

**2. Permission denied errors**
- Verify user role has required permission
- Check custom permissions haven't overridden defaults
- Ensure team is active (not suspended/cancelled)
- Confirm user membership is active

**3. Subscription limit reached**
- Review current usage in subscription settings
- Upgrade plan to increase limits
- Remove inactive members
- Contact support for custom limits

**4. Data not visible**
- Check candidate data sharing settings
- Verify your role has view permission
- Ensure candidate has shared specific data type
- Confirm team membership is active

## API Usage Examples

### Create Team
```javascript
const team = await createTeam({
  name: "My Coaching Team",
  description: "Career coaching for tech professionals",
  teamType: "career_coaching"
});
```

### Invite Member
```javascript
const invitation = await inviteMember(teamId, {
  email: "mentor@example.com",
  role: "mentor",
  invitationMessage: "Join our coaching team!",
  focusAreas: ["resume_review", "interview_prep"]
});
```

### Get Dashboard
```javascript
const dashboard = await getTeamDashboard(teamId);
// Returns: { metrics, team, subscription, recentActivity }
```

### Update Subscription
```javascript
const updated = await updateSubscription(teamId, {
  plan: "professional",
  billingCycle: "annual"
});
```

## Security Considerations

1. **Authentication**: All routes require Clerk authentication
2. **Authorization**: Middleware verifies team membership and permissions
3. **Data Access**: Respects candidate data sharing settings
4. **Soft Deletes**: Teams and members soft deleted, not permanently removed
5. **Audit Trail**: Complete activity logging for compliance
6. **Token Expiration**: Invitation tokens expire after 7 days
7. **Subscription Limits**: Enforced at middleware level

## Future Enhancements

- Real-time messaging between team members
- Video call integration for coaching sessions
- Advanced analytics and reporting
- Custom report templates
- Bulk member import
- SSO integration
- Mobile app support
- API webhooks for integrations
- Advanced calendar scheduling
- Document collaboration
- Goal templates and best practices

## Support

For issues or questions:
1. Check this documentation
2. Review API endpoint responses for error details
3. Check browser console for frontend errors
4. Review server logs for backend errors
5. Contact development team

---

**Last Updated**: November 30, 2025
**Version**: 1.0.0
**Status**: Production Ready ✅
