# UC-080 Interview Performance Analytics - Testing Guide

## Quick Start Testing

### Prerequisites
1. Backend server running on port 3001
2. Frontend server running on port 5173
3. User logged in with Clerk authentication
4. At least 3-5 completed interviews with outcomes in database

## Test Scenarios

### 1. Basic Navigation Test
**Objective**: Verify all navigation paths work

**Steps**:
1. Log into application
2. Click "Career Tools" dropdown in navbar
3. Click "📊 Interview Analytics"
4. **Expected**: Navigate to `/interviews/analytics` with loading spinner
5. **Expected**: Analytics dashboard loads with 5 tabs

**Alternative Path**:
1. Navigate to `/interviews` page
2. Look for "View Analytics" card (top right, 4th card)
3. Click the card
4. **Expected**: Navigate to analytics page

### 2. Empty State Test
**Objective**: Test behavior with no interview data

**Steps**:
1. Use test account with 0 interviews
2. Navigate to `/interviews/analytics`
3. **Expected**: Dashboard loads but shows:
   - 0 total interviews
   - "No Matching Interviews" or empty state messages
   - "Complete more interviews" messages in recommendations tab

### 3. Overview Tab Test
**Objective**: Verify key metrics calculation

**Setup**: User with 10 interviews (5 completed, 3 successful, 1 offer)

**Steps**:
1. Navigate to Overview tab
2. **Verify Metric Cards**:
   - Total Interviews: 10
   - Completed: 5
   - Success Rate: 60% (3/5)
   - Avg Rating: X.X (if ratings present)
3. **Verify Conversion Funnel**:
   - Scheduled: 10 (100%)
   - Completed: 5 (50%)
   - Successful: 3 (30%)
   - Offers: 1 (10%)
4. **Verify Improvement Trend**:
   - Shows recent vs older performance
   - Displays trend indicator (📈/📉/➡️)
   - Shows mock interview count

### 4. Conversion Tab Test
**Objective**: Verify conversion rate calculations and benchmarks

**Steps**:
1. Navigate to Conversion tab
2. **Verify "Your Rates" Card**:
   - Completion Rate = (completed / scheduled) × 100
   - Success Rate = (successful / completed) × 100
   - Offer Rate = (offers / completed) × 100
   - Progression Rate displayed
3. **Verify "Industry Benchmarks" Card**:
   - Shows 40% industry success rate
   - Shows 25% industry offer rate
   - Shows 4 avg interviews per offer
   - Shows 8 hours avg prep time
4. **Verify Comparison**:
   - Check "above"/"below"/"on par with" indicators
   - Should match calculation logic
5. **Verify Visual Funnel**:
   - Color bars match percentages
   - Counts displayed correctly

### 5. Performance Tab Test
**Objective**: Verify strength/weakness analysis and format comparison

**Setup**: User with mixed interview types (Technical, Behavioral, Phone Screen)

**Steps**:
1. Navigate to Performance tab
2. **Verify Strengths Section** (green cards):
   - Shows top 3 performing interview types
   - Success rate displayed
   - Interview count shown
   - Avg rating shown (if available)
3. **Verify Weaknesses Section** (orange cards):
   - Shows bottom 3 performing interview types
   - Lower success rates than strengths
4. **Verify Format Comparison**:
   - All interview formats listed
   - Progress bars match success rates
   - Average duration displayed
5. **Verify Industry Table**:
   - Industries listed with data
   - Success rate color-coded (green ≥50%, yellow ≥30%, red <30%)
   - Offer rate displayed
   - Avg rating shown

### 6. Insights Tab Test
**Objective**: Verify strategic insights generation

**Setup**: User with 8+ interviews (4 recent, 4 older)

**Steps**:
1. Navigate to Insights tab
2. **Verify Strategic Insights Section**:
   - At least 1 insight card displayed (blue gradient)
   - Insight shows category (Preparation/Progress/Follow-up)
   - Recommendation text present
3. **Verify Recent Performance Card**:
   - Shows "Last 3 months"
   - Interview count displayed
   - Success rate calculated
   - Avg rating shown (if available)
4. **Verify Historical Performance Card**:
   - Shows "3-6 months ago"
   - Interview count displayed
   - Success rate calculated
5. **Verify Practice Impact**:
   - Mock interview count displayed
   - Trend shown (Improving/Declining/Stable)
   - Improvement score (± points)

### 7. Recommendations Tab Test
**Objective**: Verify personalized recommendations

**Scenarios to Test**:

**Scenario A: Low Offer Rate (<20%)**
- Should see "Boost Your Offer Rate" recommendation
- Priority: High
- Category: Conversion
- 4 action steps listed
- Expected impact shown

**Scenario B: Weak Interview Type**
- Should see "Improve [Type] Performance" recommendation
- Priority: High
- Category: Skill Development
- Type-specific actions listed

**Scenario C: Declining Trend**
- Should see "Reverse Declining Performance" recommendation
- Priority: High
- Category: Recovery
- Recovery actions listed

**Scenario D: Few Mock Interviews (<3)**
- Should see "Increase Mock Interview Practice" recommendation
- Priority: Medium
- Category: Practice
- Practice suggestions listed

**Scenario E: Strong Area**
- Should see "Leverage Your Strengths" recommendation
- Priority: Low
- Category: Strategy
- Leverage suggestions listed

**Steps**:
1. Navigate to Recommendations tab
2. **Verify Priority Badges**:
   - High: red badge
   - Medium: yellow badge
   - Low: blue badge
3. **Verify Action Steps**:
   - Each recommendation has 3-4 action items
   - Checkmark icons present
4. **Verify Expected Impact**:
   - Each recommendation shows impact statement
5. **Verify Sorting**:
   - High priority recommendations appear first

### 8. Tab Switching Test
**Objective**: Verify tab navigation works smoothly

**Steps**:
1. Load analytics page (starts on Overview)
2. Click "Conversion Rates" tab
3. **Expected**: Tab highlighted, content changes
4. Click "Performance" tab
5. **Expected**: Tab highlighted, content changes
6. Continue through all 5 tabs
7. **Expected**: No errors, smooth transitions

### 9. Responsive Design Test
**Objective**: Verify mobile/tablet layouts

**Steps**:
1. Open browser developer tools
2. Toggle device toolbar (mobile view)
3. Navigate to `/interviews/analytics`
4. **Verify**:
   - Tabs scroll horizontally on mobile
   - Metric cards stack vertically
   - Tables scroll horizontally
   - Recommendation cards display properly
5. Test tablet view (768px)
6. Test desktop view (1024px+)

### 10. Data Update Test
**Objective**: Verify analytics update with new data

**Steps**:
1. Note current analytics values
2. Schedule new interview via `/jobs`
3. Return to `/interviews/analytics`
4. **Expected**: Total interviews count increased
5. Complete the interview with outcome
6. Refresh analytics page
7. **Expected**: 
   - Completed count increased
   - Success rate recalculated
   - Funnel updated
   - New recommendations may appear

### 11. Error Handling Test
**Objective**: Verify graceful error handling

**Steps**:
1. Stop backend server
2. Navigate to `/interviews/analytics`
3. **Expected**: Loading spinner, then error state
4. **Expected**: "Unable to Load Analytics" message
5. **Expected**: "Try Again" button displayed
6. Start backend server
7. Click "Try Again"
8. **Expected**: Analytics load successfully

### 12. Performance Test
**Objective**: Verify page loads quickly with large datasets

**Setup**: User with 50+ interviews

**Steps**:
1. Navigate to `/interviews/analytics`
2. **Measure**:
   - Time to first render (should be <2 seconds)
   - Time to full data load (should be <5 seconds)
3. Switch between tabs
4. **Expected**: Tab switches are instant (<100ms)

## Sample Test Data Setup

### Create Test Interviews via MongoDB:
```javascript
// 5 successful technical interviews
db.interviews.insertMany([
  { userId: "user123", interviewType: "Technical", status: "Completed", outcome: { result: "Passed", rating: 4 }},
  { userId: "user123", interviewType: "Technical", status: "Completed", outcome: { result: "Passed", rating: 5 }},
  // ... 3 more
]);

// 3 failed behavioral interviews
db.interviews.insertMany([
  { userId: "user123", interviewType: "Behavioral", status: "Completed", outcome: { result: "Failed", rating: 2 }},
  // ... 2 more
]);

// 1 offer extended
db.interviews.insertOne({
  userId: "user123", 
  interviewType: "Final Round", 
  status: "Completed", 
  outcome: { result: "Offer Extended", rating: 5 }
});
```

## Expected Calculation Examples

### Example 1: 10 Interviews Total
- Scheduled: 10
- Completed: 7
- Successful (Passed + Next Round + Offer): 4
- Offers: 1

**Expected Analytics**:
- Completion Rate: 70%
- Success Rate: 57% (4/7)
- Offer Rate: 14% (1/7)
- Progression Rate: varies

### Example 2: Improvement Trend
- Recent (3mo): 5 interviews, 4 successful = 80%
- Older (3-6mo): 5 interviews, 2 successful = 40%

**Expected**:
- Trend: "Improving" (80% > 40% + 10%)
- Improvement Score: +40 points

## Common Issues & Solutions

### Issue: "No analytics data"
**Solution**: Ensure user has completed interviews with recorded outcomes

### Issue: "Loading forever"
**Solution**: Check backend server is running and MongoDB is connected

### Issue: "Recommendations not showing"
**Solution**: User may have excellent performance (no recommendations needed)

### Issue: "Strengths/Weaknesses empty"
**Solution**: Requires at least 2 interviews per type for analysis

### Issue: "Trend shows 'Insufficient Data'"
**Solution**: Requires 4+ completed interviews (2 in each period)

## Acceptance Criteria Verification

Use this checklist to verify all UC-080 acceptance criteria:

- [ ] ✅ Interview-to-offer conversion rates tracked and displayed
- [ ] ✅ Performance trends across company types analyzed
- [ ] ✅ Strongest and weakest interview areas identified
- [ ] ✅ Performance compared across interview formats
- [ ] ✅ Improvement over time monitored with practice sessions
- [ ] ✅ Strategic insights on optimal interview strategies generated
- [ ] ✅ Performance benchmarked against industry standards
- [ ] ✅ Personalized improvement recommendations provided
- [ ] ✅ View interview analytics dashboard (frontend verification)
- [ ] ✅ Verify trend analysis and improvement insights

## Demo Checklist

Before demoing to stakeholders:

1. [ ] Create demo account with 10-15 diverse interviews
2. [ ] Include mix of successful and unsuccessful outcomes
3. [ ] Complete 2-3 mock interview sessions
4. [ ] Ensure ratings are added to completed interviews
5. [ ] Test all navigation paths
6. [ ] Prepare talking points for each tab
7. [ ] Have backup account with different data patterns
8. [ ] Test on multiple browsers (Chrome, Firefox, Safari)
9. [ ] Verify mobile view works

## Automated Testing (Future)

Consider adding:
- Jest unit tests for calculation functions
- Cypress E2E tests for user flows
- API integration tests for backend endpoint
- Snapshot tests for UI components

## Conclusion

This testing guide covers all major scenarios for UC-080 Interview Performance Analytics. Follow these steps to ensure the feature works correctly before deploying to production or demoing to users.
