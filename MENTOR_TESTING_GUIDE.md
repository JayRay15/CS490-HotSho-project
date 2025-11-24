# 🧪 Mentor Feature - Testing Guide & Scenarios

## Testing Overview

This guide provides comprehensive testing scenarios for the Mentor Collaboration feature.

---

## ✅ Frontend Verification Checklist

### 1. Invite Mentor Flow

#### Test Case 1.1: Open Invite Modal
**Steps:**
1. Login to HotSho
2. Navigate to Mentor Hub
3. Click "+ Invite Mentor" button

**Expected Result:**
- Modal appears with title "Invite a Mentor"
- Email input field is focused
- Focus areas visible
- Shared data checkboxes visible
- "Send Invitation" button disabled (empty form)

**Pass/Fail**: ___

#### Test Case 1.2: Email Validation
**Steps:**
1. Try entering invalid emails:
   - "notanemail"
   - "user@"
   - "@example.com"
2. Try entering valid email

**Expected Result:**
- Invalid emails show error or are rejected by HTML5
- Valid email accepted

**Pass/Fail**: ___

#### Test Case 1.3: Focus Areas Selection
**Steps:**
1. Toggle different focus areas on/off
2. Verify visual feedback

**Expected Result:**
- Checkboxes toggle visually
- Multiple selections allowed
- Selection state persists when toggling others

**Pass/Fail**: ___

#### Test Case 1.4: Shared Data Preferences
**Steps:**
1. Uncheck "Resume"
2. Uncheck "Cover Letters"
3. Keep others checked

**Expected Result:**
- Checkboxes reflect current state
- Can mix checked/unchecked items

**Pass/Fail**: ___

#### Test Case 1.5: Personal Message
**Steps:**
1. Type message longer than 500 characters

**Expected Result:**
- Character counter shows "500/500" or similar limit
- Cannot type beyond 500 characters

**Pass/Fail**: ___

#### Test Case 1.6: Submit Successful Invitation
**Steps:**
1. Enter valid mentor email: "mentor@example.com"
2. Select at least one focus area
3. Click "Send Invitation"

**Expected Result:**
- Loading state shown ("Sending...")
- Success message displayed
- Modal closes after 2 seconds
- MentorDashboard refreshes

**Pass/Fail**: ___

#### Test Case 1.7: Submit with Errors
**Steps:**
1. Try submitting without email
2. Try submitting to already-invited mentor

**Expected Result:**
- Appropriate error message shown
- Modal stays open for correction

**Pass/Fail**: ___

### 2. Mentor Dashboard

#### Test Case 2.1: Load Dashboard
**Steps:**
1. Navigate to Mentor Hub (after inviting mentor)

**Expected Result:**
- Page loads without errors
- Tabs visible: My Mentors, Feedback, Recommendations
- Current mentors list displayed

**Pass/Fail**: ___

#### Test Case 2.2: Tab Navigation
**Steps:**
1. Click each tab: My Mentors → Feedback → Recommendations
2. Verify content changes

**Expected Result:**
- Tab styling updates
- Content refreshes appropriately
- No visual glitches

**Pass/Fail**: ___

#### Test Case 2.3: Mentor Card Display
**Steps:**
1. View connected mentor in "My Mentors" tab

**Expected Result:**
- Shows mentor's name, email, profile picture
- Shows relationship status (Connected)
- Shows focus areas as badges

**Pass/Fail**: ___

#### Test Case 2.4: Feedback Card Display
**Steps:**
1. (Assuming mentor provided feedback)
2. Click "Feedback" tab
3. View feedback cards

**Expected Result:**
- Shows feedback type
- Shows star rating (if provided)
- Shows feedback content
- Shows suggestions list
- "Acknowledge" button present

**Pass/Fail**: ___

#### Test Case 2.5: Acknowledge Feedback
**Steps:**
1. Click "Acknowledge" on feedback card

**Expected Result:**
- Button changes to checkmark or "Acknowledged"
- Visual indication of acknowledgment
- No error messages

**Pass/Fail**: ___

#### Test Case 2.6: Recommendation Display
**Steps:**
1. View recommendations tab
2. Check multiple recommendations

**Expected Result:**
- Shows title and description
- Shows priority (High/Medium/Low)
- Shows target date
- Shows current status
- Status change buttons visible

**Pass/Fail**: ___

#### Test Case 2.7: Update Recommendation Status
**Steps:**
1. Click "In Progress" button on pending recommendation
2. Add progress notes: "Started updating resume"
3. Later: Click "Completed"

**Expected Result:**
- Status updates immediately
- Progress notes saved
- Visual indication of new status

**Pass/Fail**: ___

### 3. Progress Sharing

#### Test Case 3.1: Load Progress Sharing Page
**Steps:**
1. Navigate to /mentors/progress

**Expected Result:**
- Page loads without errors
- Mentor list displayed (if mentors exist)
- "Generate Report" button visible for each mentor

**Pass/Fail**: ___

#### Test Case 3.2: Generate Monthly Report
**Steps:**
1. Select a mentor
2. Click "Generate Report"
3. Choose "Monthly"
4. Click "Generate & Share"

**Expected Result:**
- Modal closes
- Success message shown
- Page refreshes to show new report
- Report appears in "Recent Reports" section

**Pass/Fail**: ___

#### Test Case 3.3: View Report Metrics
**Steps:**
1. View generated report card

**Expected Result:**
- Shows applications count
- Shows interviews count
- Shows offers count
- Shows progress score (0-100)
- Shows date range

**Pass/Fail**: ___

#### Test Case 3.4: Report Status
**Steps:**
1. Generate report
2. (Wait for mentor to review, or check initial state)

**Expected Result:**
- Shows "Reviewed" badge if mentor reviewed
- Shows as "Not Reviewed" initially

**Pass/Fail**: ___

### 4. Mentor Messaging

#### Test Case 4.1: Load Messaging Page
**Steps:**
1. Navigate to /mentors/messages

**Expected Result:**
- Page loads without errors
- Mentor list on left sidebar
- No messages if conversation hasn't started

**Pass/Fail**: ___

#### Test Case 4.2: Select Mentor
**Steps:**
1. Click on mentor in list

**Expected Result:**
- Mentor highlighted in sidebar
- Chat header shows mentor's name
- Chat history loads
- Message input becomes active

**Pass/Fail**: ___

#### Test Case 4.3: Send Message
**Steps:**
1. Type: "Thanks for your feedback!"
2. Click "Send" button

**Expected Result:**
- Message appears in chat on right side
- Message shows as sent
- Input clears
- Message timestamp shown

**Pass/Fail**: ___

#### Test Case 4.4: Receive Message (if testing with real mentor)
**Steps:**
1. Have mentor send message from their account
2. Mentee account should see it appear

**Expected Result:**
- Message appears on left side of chat
- Sender name shown
- Timestamp displayed
- Auto-scrolls to show new message

**Pass/Fail**: ___

#### Test Case 4.5: Message History
**Steps:**
1. Send multiple messages
2. Reload page

**Expected Result:**
- Previous messages still visible
- Full conversation history shown
- Messages in correct order
- Correct timestamps

**Pass/Fail**: ___

---

## 🧬 Backend API Testing

### Prerequisites
- API running on http://localhost:5000
- MongoDB running
- Valid JWT token for testing

### 1. Relationship Endpoints

#### Test 1.1: POST /api/mentors/invite
```bash
curl -X POST http://localhost:5000/api/mentors/invite \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "mentorEmail": "mentor@example.com",
    "relationshipType": "mentor",
    "invitationMessage": "I would love your guidance",
    "focusAreas": ["resume_review", "interview_prep"],
    "sharedData": {
      "shareResume": true,
      "shareCoverLetters": true,
      "shareApplications": true,
      "shareInterviewPrep": true,
      "shareGoals": true,
      "shareSkillGaps": true,
      "shareProgress": true
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Mentor invitation sent successfully",
  "data": {
    "relationshipId": "507f...",
    "status": "pending"
  }
}
```

**Pass/Fail**: ___

#### Test 1.2: GET /api/mentors/my-mentors
```bash
curl -X GET http://localhost:5000/api/mentors/my-mentors \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f...",
      "menteeId": "...",
      "mentorId": {
        "firstName": "John",
        "lastName": "Doe",
        "email": "mentor@example.com"
      },
      "status": "accepted",
      "focusAreas": ["resume_review", "interview_prep"]
    }
  ]
}
```

**Pass/Fail**: ___

#### Test 1.3: POST /api/mentors/accept/:relationshipId
```bash
curl -X POST http://localhost:5000/api/mentors/accept/<RELATIONSHIP_ID> \
  -H "Authorization: Bearer <MENTOR_JWT_TOKEN>" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Mentor invitation accepted",
  "data": {
    "status": "accepted",
    "acceptedAt": "2025-11-24T..."
  }
}
```

**Pass/Fail**: ___

### 2. Feedback Endpoints

#### Test 2.1: POST /api/mentors/feedback
```bash
curl -X POST http://localhost:5000/api/mentors/feedback \
  -H "Authorization: Bearer <MENTOR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "relationshipId": "507f...",
    "type": "resume",
    "content": "Your resume looks great overall, but could use better action verbs",
    "rating": 4,
    "suggestions": [
      {
        "title": "Use stronger action verbs",
        "description": "Replace 'worked on' with 'led', 'developed', etc.",
        "priority": "high"
      }
    ]
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Feedback added successfully",
  "data": {
    "_id": "507f...",
    "status": "pending",
    "acknowledged": false
  }
}
```

**Pass/Fail**: ___

#### Test 2.2: GET /api/mentors/feedback/received
```bash
curl -X GET http://localhost:5000/api/mentors/feedback/received \
  -H "Authorization: Bearer <MENTEE_JWT_TOKEN>"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f...",
      "type": "resume",
      "content": "Your resume looks great...",
      "rating": 4,
      "mentorId": {...},
      "acknowledged": false
    }
  ]
}
```

**Pass/Fail**: ___

#### Test 2.3: PUT /api/mentors/feedback/:feedbackId/acknowledge
```bash
curl -X PUT http://localhost:5000/api/mentors/feedback/<FEEDBACK_ID>/acknowledge \
  -H "Authorization: Bearer <MENTEE_JWT_TOKEN>" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Feedback acknowledged",
  "data": {
    "acknowledged": true,
    "acknowledgedAt": "2025-11-24T..."
  }
}
```

**Pass/Fail**: ___

### 3. Recommendation Endpoints

#### Test 3.1: POST /api/mentors/recommendations
```bash
curl -X POST http://localhost:5000/api/mentors/recommendations \
  -H "Authorization: Bearer <MENTOR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "relationshipId": "507f...",
    "title": "Update resume summary",
    "description": "Make your professional summary more compelling and specific to your target roles",
    "category": "resume_update",
    "priority": "high",
    "targetDate": "2025-12-01T00:00:00Z"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Recommendation added successfully",
  "data": {
    "_id": "507f...",
    "status": "pending",
    "priority": "high"
  }
}
```

**Pass/Fail**: ___

#### Test 3.2: PUT /api/mentors/recommendations/:recommendationId
```bash
curl -X PUT http://localhost:5000/api/mentors/recommendations/<REC_ID> \
  -H "Authorization: Bearer <MENTEE_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress",
    "progressNotes": "Started revising summary with action-oriented language"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Recommendation updated",
  "data": {
    "status": "in_progress",
    "progressNotes": "Started revising..."
  }
}
```

**Pass/Fail**: ___

### 4. Message Endpoints

#### Test 4.1: POST /api/mentors/messages
```bash
curl -X POST http://localhost:5000/api/mentors/messages \
  -H "Authorization: Bearer <SENDER_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "relationshipId": "507f...",
    "recipientId": "507f...",
    "content": "Thanks for the feedback! I will update my resume this week.",
    "type": "text"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "_id": "507f...",
    "isRead": false,
    "createdAt": "2025-11-24T..."
  }
}
```

**Pass/Fail**: ___

#### Test 4.2: GET /api/mentors/messages/:relationshipId
```bash
curl -X GET http://localhost:5000/api/mentors/messages/<RELATIONSHIP_ID> \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f...",
      "senderId": {...},
      "content": "Thanks for the feedback!",
      "isRead": true,
      "createdAt": "2025-11-24T..."
    }
  ]
}
```

**Pass/Fail**: ___

### 5. Progress Report Endpoints

#### Test 5.1: POST /api/mentors/progress-reports
```bash
curl -X POST http://localhost:5000/api/mentors/progress-reports \
  -H "Authorization: Bearer <MENTEE_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "relationshipId": "507f...",
    "reportType": "monthly"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Progress report generated",
  "data": {
    "_id": "507f...",
    "reportType": "monthly",
    "metrics": {
      "jobsAppliedTo": 15,
      "interviewsScheduled": 3,
      "offersReceived": 0
    }
  }
}
```

**Pass/Fail**: ___

#### Test 5.2: GET /api/mentors/progress-reports
```bash
curl -X GET http://localhost:5000/api/mentors/progress-reports \
  -H "Authorization: Bearer <MENTOR_JWT_TOKEN>"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f...",
      "reportType": "monthly",
      "progressScore": 65,
      "metrics": {...}
    }
  ]
}
```

**Pass/Fail**: ___

---

## 🔒 Security Testing

### Authorization Tests

#### Test Auth 1: Unauthorized Access
```bash
# Without JWT token
curl -X GET http://localhost:5000/api/mentors/my-mentors

# Expected: 401 Unauthorized
```

**Pass/Fail**: ___

#### Test Auth 2: Invalid Token
```bash
curl -X GET http://localhost:5000/api/mentors/my-mentors \
  -H "Authorization: Bearer invalid_token_123"

# Expected: 401 Unauthorized
```

**Pass/Fail**: ___

#### Test Auth 3: Cross-User Access Prevention
```bash
# Mentee A tries to access Mentee B's mentors
# Using Mentee A's JWT but requesting for non-existent relationship

# Expected: 403 Forbidden or 404 Not Found
```

**Pass/Fail**: ___

#### Test Auth 4: Mentor Can't Modify as Mentee
```bash
# Mentor tries to update recommendation as if mentee accepted it
# Using mentor's JWT on endpoint that requires mentee authorization

# Expected: 403 Forbidden
```

**Pass/Fail**: ___

---

## 🐛 Error Handling Tests

#### Test Error 1: Duplicate Invitation
**Steps:**
1. Invite same mentor twice

**Expected Result:**
```json
{
  "success": false,
  "message": "Pending invitation already exists for this mentor"
}
```

**Pass/Fail**: ___

#### Test Error 2: Accept Expired Invitation
**Steps:**
1. Wait for invitation to expire (30 days)
2. Try to accept

**Expected Result:**
```json
{
  "success": false,
  "message": "Invitation has expired"
}
```

**Pass/Fail**: ___

#### Test Error 3: Invalid Email
```bash
curl -X POST http://localhost:5000/api/mentors/invite \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "mentorEmail": "not-an-email"
  }'

# Expected: Error about invalid email
```

**Pass/Fail**: ___

---

## 📊 Performance Testing

#### Test Perf 1: Load Many Mentors
**Steps:**
1. Create 50+ mentor relationships
2. Load MentorDashboard

**Expected Result:**
- Page loads in < 2 seconds
- Smooth scrolling through list
- No UI freezing

**Pass/Fail**: ___

#### Test Perf 2: Load Many Messages
**Steps:**
1. Send 500+ messages in a relationship
2. Load MentorMessaging

**Expected Result:**
- Initial load in < 3 seconds
- Auto-scroll smooth
- No memory issues

**Pass/Fail**: ___

---

## 📧 Email Testing

#### Test Email 1: Invitation Email
**Steps:**
1. Invite a new mentor
2. Check email account

**Expected Result:**
- Email received within 1 minute
- Subject: "[Name] has invited you to be their mentor"
- Contains accept/reject links
- Professional formatting

**Pass/Fail**: ___

#### Test Email 2: Feedback Notification
**Steps:**
1. Mentor provides feedback
2. Check mentee's email

**Expected Result:**
- Email received within 1 minute
- Subject includes feedback type
- Actionable call-to-action
- Contains login link

**Pass/Fail**: ___

#### Test Email 3: Recommendation Notification
**Steps:**
1. Mentor adds recommendation
2. Check mentee's email

**Expected Result:**
- Email received with recommendation title
- Encourages action
- Contains dashboard link

**Pass/Fail**: ___

---

## ✅ Final Verification Checklist

### Functionality
- [ ] All CRUD operations working (Create, Read, Update, Delete)
- [ ] All API endpoints responding correctly
- [ ] All frontend components rendering
- [ ] All user workflows end-to-end functional

### UI/UX
- [ ] Forms validate correctly
- [ ] Error messages helpful and clear
- [ ] Success messages shown appropriately
- [ ] Loading states indicated
- [ ] Responsive on mobile/tablet/desktop

### Performance
- [ ] Pages load in < 3 seconds
- [ ] No console errors
- [ ] No memory leaks
- [ ] Database queries optimized

### Security
- [ ] JWT authentication working
- [ ] Authorization checks in place
- [ ] No unauthorized access possible
- [ ] Input validation on all fields

### Data
- [ ] Data persists after page reload
- [ ] Historical data maintained
- [ ] Timestamps accurate
- [ ] Relationships tracked correctly

### Email
- [ ] Invitations sending
- [ ] Notifications sending
- [ ] No spam issues
- [ ] Professional formatting

---

**Testing Complete!** ✅

Once all tests pass, the feature is ready for production deployment.
