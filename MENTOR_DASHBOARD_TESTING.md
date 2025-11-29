# UC-109: Mentor Dashboard - Testing & Verification Guide

## Overview
This guide provides step-by-step instructions to verify all features of the specialized mentor dashboard functionality.

---

## Prerequisites

### Test Users Setup
You need at least 2 test accounts:

1. **Mentor Account** (mentor@test.com)
   - Will act as the mentor/coach
   - Should have accepted mentor invitation from mentee

2. **Mentee Account** (mentee@test.com)
   - Will be the job seeker receiving coaching
   - Should have some data (applications, goals, resumes)

### Test Data Setup
For the mentee account, ensure:
- ✅ At least 5-10 job applications with various statuses
- ✅ At least 3-5 goals (some completed, some in progress)
- ✅ At least 1-2 uploaded resumes
- ✅ At least 1-2 scheduled interviews
- ✅ Mentor relationship is "accepted" status

---

## Test Scenarios

### Test 1: Access Mentor Dashboard
**User:** Mentor Account

**Steps:**
1. Log in as mentor
2. Navigate to `/mentors` or click "Mentor Hub" in navigation
3. Verify you see the "My Mentees" tab (if you have mentees)

**Expected Results:**
- ✅ Dashboard loads without errors
- ✅ See list of mentees you're mentoring
- ✅ Dashboard shows overview statistics:
  - Total Mentees count
  - Unread Messages count
  - Pending Recommendations count
  - Recent Feedback count
- ✅ Recent Activity section shows latest mentor actions
- ✅ Each mentee card shows:
  - Profile picture or initials
  - Name and email
  - Relationship type
  - Focus areas (tags)
  - "View Progress" button
  - "Message" button

**Screenshot Location:** Test the dashboard overview

---

### Test 2: View Mentee Progress Summary
**User:** Mentor Account

**Steps:**
1. From the mentor dashboard
2. Click "View Progress" on any mentee card
3. Verify the mentee detail modal opens
4. Stay on the "Overview" tab

**Expected Results:**
- ✅ Modal opens with mentee details
- ✅ Header shows mentee name, email, profile picture
- ✅ Four tabs visible: Overview, Progress, Insights, Materials
- ✅ KPI cards display:
  - Applications count (with recent change indicator)
  - Interviews count (with recent change indicator)
  - Goal completion percentage and ratio
- ✅ Engagement Score widget shows:
  - Circular progress indicator (0-100)
  - Rating (Excellent/Good/Fair/Needs Attention)
  - Breakdown metrics:
    - Message count
    - Feedback acknowledgment rate
    - Recommendation completion rate
  - Last active timestamp
- ✅ Mentee summary/bio displayed (if available)

**Screenshot Location:** Overview tab with KPIs

---

### Test 3: Review Mentee Progress Details
**User:** Mentor Account

**Steps:**
1. In the mentee detail modal
2. Click the "Progress" tab
3. Review goal progress, milestones, and trends

**Expected Results:**
- ✅ Goal Progress section shows:
  - Count by status (completed, in_progress, not_started)
  - Visual breakdown
- ✅ Recent Milestones Achieved section displays:
  - Trophy icon for each milestone
  - Milestone title
  - Associated goal title
  - Completion date
- ✅ Activity Trends section shows:
  - Applications trend (Increasing/Stable with emoji)
  - Interviews trend (Increasing/Stable with emoji)
- ✅ All data is properly formatted and readable

**Screenshot Location:** Progress tab with trends

---

### Test 4: View Coaching Insights
**User:** Mentor Account

**Steps:**
1. In the mentee detail modal
2. Click the "Insights" tab
3. Review AI-generated insights

**Expected Results:**
- ✅ **Strengths Section** (green cards):
  - Shows areas where mentee excels
  - Each strength has area, description, and impact level
  - Impact badge displayed (high/medium/low)
- ✅ **Areas for Improvement Section** (yellow cards):
  - Identifies areas needing attention
  - Each area has description and impact level
- ✅ **Actionable Recommendations Section** (bordered cards):
  - Specific, actionable advice
  - Priority badge (high/medium/low)
  - Estimated impact statement
  - Well-formatted and clear
- ✅ **Achievement Patterns Section**:
  - Identifies behavioral patterns
  - Provides insights based on patterns
  - Shows average metrics (e.g., goal completion time)

**Screenshot Location:** Insights tab with recommendations

---

### Test 5: Access Mentee Materials
**User:** Mentor Account

**Steps:**
1. In the mentee detail modal
2. Click the "Materials" tab
3. Review shared materials

**Expected Results:**
- ✅ **Resumes Section** (if shared):
  - Lists all mentee's resumes
  - Shows file name and update date
  - "View" button for each resume
- ✅ **Recent Applications Section** (if shared):
  - Lists up to 10 recent applications
  - Shows job title, company, and status badge
  - Status color-coded appropriately
- ✅ **Active Goals Section** (if shared):
  - Lists mentee's goals
  - Shows title and target date
  - Status badge (completed/in_progress/not_started)
- ✅ **Interview Schedule Section** (if shared):
  - Lists upcoming/past interviews
  - Shows title, company, and scheduled date/time
- ✅ Only sections with data are displayed
- ✅ Sections without permission show "Not shared" or are hidden

**Screenshot Location:** Materials tab with shared content

---

### Test 6: Verify Engagement Metrics
**User:** Mentor Account

**Steps:**
1. Open mentee detail view
2. On Overview tab, examine engagement score
3. Compare metrics with actual mentee activity

**Expected Results:**
- ✅ Engagement Score (0-100) is calculated correctly
- ✅ Rating matches score:
  - 80-100: Excellent
  - 60-79: Good
  - 40-59: Fair
  - 0-39: Needs Attention
- ✅ Message count reflects actual messages sent by mentee
- ✅ Acknowledgment rate is accurate (% of feedback acknowledged)
- ✅ Recommendation completion rate is accurate
- ✅ Last active date is recent if mentee has been active

**Validation:** Cross-reference with actual data

---

### Test 7: Dashboard Activity Timeline
**User:** Mentor Account

**Steps:**
1. View the "My Mentees" tab on dashboard
2. Review the Recent Activity section

**Expected Results:**
- ✅ Shows last 5 activities
- ✅ Activities include:
  - Feedback provided (with mentee name)
  - Recommendations added (with title)
- ✅ Each activity shows:
  - Icon (📝 for feedback, 💡 for recommendation)
  - Description
  - Date and time
- ✅ Activities sorted by date (most recent first)
- ✅ No errors or missing data

**Screenshot Location:** Recent Activity timeline

---

### Test 8: Multiple Mentee Management
**User:** Mentor Account with 2+ mentees

**Steps:**
1. View dashboard with multiple mentees
2. Open detail view for different mentees
3. Verify data is correctly filtered per mentee

**Expected Results:**
- ✅ Dashboard shows correct count of mentees
- ✅ All mentees listed on dashboard
- ✅ Each mentee has independent data
- ✅ Opening different mentee details shows their specific:
  - Progress metrics
  - Insights
  - Materials
  - Engagement score
- ✅ No data mixing between mentees
- ✅ Can switch between mentees without errors

**Validation:** Compare data for at least 2 mentees

---

### Test 9: Empty State Handling
**User:** Mentor Account with new/minimal mentee

**Steps:**
1. View dashboard with a mentee who has minimal data
2. Open their detail view
3. Check all tabs

**Expected Results:**
- ✅ Dashboard doesn't crash with empty data
- ✅ Overview shows 0 or minimal values appropriately
- ✅ Progress tab displays gracefully when no goals/milestones
- ✅ Insights tab shows "No insights available" or generates basic insights
- ✅ Materials tab shows "No materials available" or empty sections
- ✅ Engagement score can be calculated even with minimal data
- ✅ UI remains functional and informative

**Validation:** Mentee should have <3 applications, 0-1 goals

---

### Test 10: Mobile Responsiveness
**User:** Mentor Account

**Steps:**
1. Open mentor dashboard on mobile device or resize browser to mobile width
2. Navigate through mentee detail view tabs
3. Verify all features are accessible

**Expected Results:**
- ✅ Dashboard is readable on mobile (320px+)
- ✅ Mentee cards stack vertically
- ✅ Statistics cards adjust to mobile layout (stack or 2-column)
- ✅ Detail modal is scrollable and fits screen
- ✅ Tabs are accessible on mobile
- ✅ All buttons and links are tappable
- ✅ Text doesn't overflow or get cut off
- ✅ Charts/progress indicators scale appropriately

**Test Devices:** iPhone, Android, tablet, or browser DevTools

---

### Test 11: Permission Validation
**User:** Non-mentor trying to access mentor features

**Steps:**
1. Log in as a user who is NOT a mentor
2. Try to navigate to `/mentors`
3. Try to access mentee detail endpoints directly

**Expected Results:**
- ✅ Mentor dashboard shows "No mentees yet" or similar
- ✅ Cannot view "My Mentees" tab without mentees
- ✅ Direct API calls to mentee endpoints return 403 Forbidden
- ✅ Cannot view details of users they don't mentor
- ✅ Proper error messages displayed

**Security Test:** Verify authorization checks

---

### Test 12: Real-time Data Accuracy
**User:** Mentor Account

**Steps:**
1. As mentee, add new applications/goals
2. As mentor, refresh dashboard
3. Verify new data appears in mentee details

**Expected Results:**
- ✅ Dashboard reflects updated mentee data
- ✅ KPIs update with new activities
- ✅ Progress metrics include new items
- ✅ Insights adjust based on new data
- ✅ Materials section shows newly shared items
- ✅ Engagement metrics update with new interactions

**Validation:** Compare before/after adding mentee data

---

### Test 13: Performance with Large Datasets
**User:** Mentor Account

**Setup:** Mentee with 50+ applications, 20+ goals

**Steps:**
1. Open mentee detail view
2. Switch between all tabs
3. Monitor loading times

**Expected Results:**
- ✅ Dashboard loads in <3 seconds
- ✅ Detail modal opens in <2 seconds
- ✅ Tab switches are instant (<500ms)
- ✅ No browser freezing or lag
- ✅ Pagination or limits applied where needed (e.g., "Recent Applications" limited to 10)
- ✅ All data renders correctly

**Performance Test:** Use browser DevTools Network/Performance tabs

---

### Test 14: Error Handling
**User:** Mentor Account

**Steps:**
1. Disconnect from internet
2. Try to open mentee detail view
3. Reconnect and retry
4. Simulate 500 error by breaking API temporarily

**Expected Results:**
- ✅ Loading indicator shows during fetch
- ✅ Clear error message on network failure
- ✅ "Failed to load mentee details" or similar message
- ✅ Retry mechanism or instructions provided
- ✅ No unhandled errors in console
- ✅ Dashboard remains functional after error
- ✅ Can close modal and retry

**Error Scenarios:** Network error, 404, 500

---

## Acceptance Criteria Verification

### ✅ View mentee progress summary and key performance indicators
- **Test Coverage:** Tests 1, 2, 3, 12
- **Verified:** Dashboard shows applications, interviews, goals metrics with trends

### ✅ Access mentee job search materials for review and feedback
- **Test Coverage:** Test 5
- **Verified:** Can view resumes, applications, goals, interviews based on sharing permissions

### ✅ Provide feedback and recommendations on applications and interview preparation
- **Test Coverage:** Tests 4, 7
- **Verified:** Insights provide actionable recommendations, activity tracked

### ✅ Track mentee goal progress and achievement patterns
- **Test Coverage:** Tests 3, 4
- **Verified:** Goal completion rates, milestones, and patterns analyzed

### ✅ Generate coaching insights and development recommendations
- **Test Coverage:** Test 4
- **Verified:** AI-powered insights identify strengths, weaknesses, and action items

### ✅ Include communication tools for mentee interaction
- **Test Coverage:** Tests 1, 7
- **Verified:** Message counts, activity timeline, message buttons available

### ✅ Monitor mentee engagement and activity levels
- **Test Coverage:** Tests 2, 6
- **Verified:** Engagement score (0-100) with rating and breakdown metrics

### ✅ Provide accountability tracking and milestone management
- **Test Coverage:** Test 3
- **Verified:** Milestone achievements tracked with dates and associated goals

---

## Bug Reporting Template

If you encounter issues during testing, report them using this template:

```
**Test:** [Test number and name]
**User:** [Mentor/Mentee account]
**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Result:**

**Actual Result:**

**Screenshot:** [Attach if applicable]

**Console Errors:** [Check browser console]

**Priority:** [High/Medium/Low]
```

---

## Sign-off

Once all tests pass, complete this checklist:

- [ ] All 14 tests executed successfully
- [ ] All 8 acceptance criteria verified
- [ ] No critical bugs found
- [ ] Performance is acceptable (<3s load times)
- [ ] Mobile responsive design works
- [ ] Error handling is user-friendly
- [ ] Security/permissions validated
- [ ] Documentation reviewed and accurate

**Tester Name:** ___________________

**Date:** ___________________

**Signature:** ___________________

---

## Additional Notes

### Browser Compatibility
Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Screen Resolutions
Test on:
- [ ] Mobile (320px - 767px)
- [ ] Tablet (768px - 1023px)
- [ ] Desktop (1024px+)
- [ ] Large Desktop (1920px+)

### Network Conditions
Test with:
- [ ] Fast 4G/WiFi
- [ ] Slow 3G (throttled)
- [ ] Offline mode
