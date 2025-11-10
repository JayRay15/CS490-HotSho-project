# UC-063: Testing Guide for Job Matching UI

## Quick Start Testing

### Prerequisites
1. Backend server running on http://localhost:5000
2. Frontend dev server running
3. User logged in with Clerk authentication
4. At least one job added to the system
5. User profile with skills, experience, and education

---

## Test Suite

### Test 1: View Match Score Button Appears ✓

**Steps:**
1. Navigate to Jobs page (/)
2. Ensure you have at least one non-archived job
3. Locate any job card in the pipeline

**Expected Result:**
- Job card shows "✨ Match Score" button
- Button has green background (bg-green-100)
- Button is positioned after "🎯 Skill Gaps" button
- Hover changes background to lighter green

**Pass Criteria:**
- ✅ Button is visible
- ✅ Button has correct styling
- ✅ Button does NOT appear on archived jobs

---

### Test 2: Match Score Modal Opens ✓

**Steps:**
1. Click "✨ Match Score" on any job card

**Expected Result:**
- Modal opens with backdrop blur
- Modal title shows "Job Match Analysis"
- Close button (×) appears in top right
- Modal is centered on screen
- Content area is scrollable

**Pass Criteria:**
- ✅ Modal opens smoothly
- ✅ No console errors
- ✅ Modal is responsive (try resizing window)
- ✅ Background is blurred/dimmed

---

### Test 3: Match Score Calculation Works ✓

**Steps:**
1. Open match score modal (may take a few seconds first time)
2. Wait for calculation to complete

**Expected Result:**
- Loading spinner appears while calculating
- Overall match score displays (0-100%)
- Match grade shows (Excellent/Good/Fair/Poor)
- Four category scores display:
  - Skills with progress bar
  - Experience with progress bar
  - Education with progress bar
  - Additional with progress bar

**Pass Criteria:**
- ✅ Score calculates successfully
- ✅ All categories show percentages
- ✅ Progress bars match percentages
- ✅ Grade matches score range

---

### Test 4: Match Score Tabs Work ✓

**Steps:**
1. In match score modal, click each tab:
   - Overview
   - Strengths
   - Gaps
   - Suggestions

**Expected Result:**
- **Overview Tab:**
  - Shows overall score
  - Shows 4 category breakdowns
  - Shows matched/missing skills
  - Shows experience details
  
- **Strengths Tab:**
  - Lists competitive advantages
  - Shows impact level (high/medium/low)
  - Color-coded badges
  
- **Gaps Tab:**
  - Lists areas for improvement
  - Shows severity (critical/important/minor)
  - Includes suggestions for each gap
  
- **Suggestions Tab:**
  - Lists improvement recommendations
  - Shows priority (high/medium/low)
  - Includes estimated impact
  - Links to learning resources

**Pass Criteria:**
- ✅ All tabs switch properly
- ✅ Content displays correctly in each tab
- ✅ No layout issues
- ✅ Resource links work (open in new tab)

---

### Test 5: Close Match Score Modal ✓

**Steps:**
1. Open match score modal
2. Try each method to close:
   - Click × button in header
   - Click "Close" button in footer
   - Click outside modal (on backdrop)

**Expected Result:**
- Modal closes
- State resets
- Background becomes interactive again
- No memory leaks

**Pass Criteria:**
- ✅ All close methods work
- ✅ Modal can be reopened
- ✅ No console errors after closing

---

### Test 6: Compare Matches Button Appears ✓

**Steps:**
1. View Jobs page with active (non-archived) jobs

**Expected Result:**
- "Compare Matches" button appears in controls section
- Button is positioned between "Auto-Archive" and "Add Job"
- Button has gray/secondary styling

**Pass Criteria:**
- ✅ Button is visible when viewing active jobs
- ✅ Button is hidden when viewing archived jobs
- ✅ Button is properly styled

---

### Test 7: Compare Matches Modal Opens ✓

**Steps:**
1. Click "Compare Matches" button

**Expected Result:**
- Modal opens showing job comparison
- Modal title shows "Compare Job Matches"
- Close button (×) appears
- Summary statistics display at top
- List of jobs shows below

**Pass Criteria:**
- ✅ Modal opens smoothly
- ✅ Content loads automatically
- ✅ No console errors

---

### Test 8: Job Comparison Calculates ✓

**Steps:**
1. Open comparison modal
2. Wait for calculations to complete

**Expected Result:**
- Loading indicator shows while calculating
- Summary statistics appear:
  - Total jobs count
  - Best match (job + score)
  - Average score
  - Good matches count
- Jobs list appears ranked by score
- Each job shows:
  - Rank number
  - Job title and company
  - Overall score and grade
  - Category mini-breakdowns
  - Quick stats (strengths, gaps, suggestions count)

**Pass Criteria:**
- ✅ All jobs calculated
- ✅ Statistics are accurate
- ✅ Jobs sorted by score (highest first)
- ✅ All data displays correctly

---

### Test 9: Comparison Sorting/Filtering ✓

**Steps:**
1. In comparison modal, try sorting options
2. Try filtering by score range

**Expected Result:**
- Jobs re-sort based on selection
- Filters update the list
- Count updates correctly

**Pass Criteria:**
- ✅ Sorting works
- ✅ Filtering works
- ✅ Results update instantly

---

### Test 10: Multiple Jobs Work ✓

**Steps:**
1. Add 3-5 different jobs with varying requirements
2. Open comparison modal
3. Verify each shows different scores

**Expected Result:**
- Each job has unique match score
- Jobs with more matching skills score higher
- Jobs with matching experience score higher
- Scores make logical sense

**Pass Criteria:**
- ✅ Scores vary appropriately
- ✅ Algorithm logic seems correct
- ✅ No duplicate scores incorrectly

---

## Edge Case Testing

### Edge Case 1: No Profile Data

**Steps:**
1. Use account with minimal/no profile data
2. Try to view match score

**Expected Result:**
- Lower scores due to missing profile data
- Gaps highlight missing profile information
- Suggestions recommend completing profile

**Pass Criteria:**
- ✅ Doesn't crash
- ✅ Shows reasonable scores (likely low)
- ✅ Clear messaging about missing data

---

### Edge Case 2: No Jobs

**Steps:**
1. Archive all jobs
2. View Jobs page

**Expected Result:**
- "Compare Matches" button is hidden
- "✨ Match Score" buttons don't appear (no active jobs)

**Pass Criteria:**
- ✅ No errors with empty job list
- ✅ Appropriate buttons hidden

---

### Edge Case 3: Archived Jobs

**Steps:**
1. Archive a job
2. Switch to archived view
3. Look at job cards

**Expected Result:**
- "✨ Match Score" button does NOT appear on archived jobs
- Only "Restore" and "Delete" buttons show

**Pass Criteria:**
- ✅ Match score button hidden for archived jobs
- ✅ Feature only available for active jobs

---

### Edge Case 4: Very Long Job Lists

**Steps:**
1. Add 20+ jobs
2. Open comparison modal

**Expected Result:**
- Modal shows scrollable list
- Performance remains acceptable
- All jobs load (may paginate)

**Pass Criteria:**
- ✅ Doesn't freeze/crash
- ✅ Scrolling works smoothly
- ✅ All jobs eventually visible

---

### Edge Case 5: Network Errors

**Steps:**
1. Stop backend server
2. Try to calculate match score

**Expected Result:**
- Error message displays
- User is informed of issue
- App doesn't crash

**Pass Criteria:**
- ✅ Graceful error handling
- ✅ Clear error message
- ✅ Can retry after backend restarts

---

## Browser Testing

### Recommended Browsers:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

**Test each browser for:**
1. Modal rendering
2. Button interactions
3. Progress bar displays
4. Responsive layouts

---

## Responsive Testing

### Desktop (1920x1080):
- ✅ Modals centered properly
- ✅ All buttons visible
- ✅ Content readable
- ✅ No horizontal scroll

### Laptop (1366x768):
- ✅ Modals fit screen
- ✅ Scrolling works
- ✅ Buttons accessible

### Tablet (768x1024):
- ✅ Modals responsive
- ✅ Touch-friendly buttons
- ✅ Content reflows properly

### Mobile (375x667):
- ✅ Modals full-width
- ✅ Buttons stack vertically
- ✅ Text remains readable
- ✅ Scrolling smooth

---

## Performance Testing

### Metrics to Check:
1. **Initial Load Time**
   - First match calculation: < 3 seconds
   - Subsequent loads: < 1 second (cached)

2. **Modal Open Time**
   - Should open instantly
   - No lag or stutter

3. **Comparison Calculation**
   - 5 jobs: < 5 seconds
   - 10 jobs: < 10 seconds
   - 20+ jobs: May need optimization

4. **Memory Usage**
   - No memory leaks after opening/closing modals
   - Check with browser dev tools

---

## Accessibility Testing

### Keyboard Navigation:
1. Tab through all buttons
2. Press Enter/Space to activate
3. Use Escape to close modals

### Screen Reader Testing:
1. Use VoiceOver (Mac) or NVDA (Windows)
2. Verify all elements are announced
3. Check button labels are descriptive

### Color Contrast:
1. All text meets WCAG AA standards
2. Progress bars are distinguishable
3. Color-blind friendly (don't rely only on color)

---

## Integration Testing

### With Other Features:

**Test with Skill Gap Analysis:**
1. Open skill gap analysis for a job
2. Note the gaps
3. Open match score for same job
4. Verify gaps align

**Test with Job Editing:**
1. Edit a job's requirements
2. Recalculate match score
3. Verify score updates appropriately

**Test with Archive/Restore:**
1. Archive a job
2. Verify match score button disappears
3. Restore the job
4. Verify match score button reappears

---

## User Acceptance Testing

### Scenarios:

**Scenario 1: Job Seeker Evaluating Opportunities**
- User has 3 job applications
- Uses comparison to identify best match
- Focuses effort on highest-scoring job
- ✅ Feature helps prioritize applications

**Scenario 2: Identifying Skill Gaps**
- User sees low match score (55%)
- Reviews gaps tab
- Identifies 3 missing skills
- Uses suggestions to find learning resources
- ✅ Feature helps identify improvement areas

**Scenario 3: Custom Weighting**
- User values skills over experience
- Adjusts weights (Skills: 60%, Experience: 20%)
- Recalculates match
- Sees different score
- ✅ Feature allows personalization

---

## Regression Testing

After any code changes, re-test:
1. All existing job tracker features still work
2. Match score feature doesn't break other functionality
3. No console errors introduced
4. Performance hasn't degraded

---

## Bug Report Template

If issues found:

```markdown
**Bug Title:** [Short description]

**Severity:** Critical / High / Medium / Low

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happens]

**Screenshots:**
[Attach if applicable]

**Browser/Device:**
[Chrome 120 / iPhone 13 / etc.]

**Console Errors:**
[Paste any errors]

**Additional Notes:**
[Any other relevant info]
```

---

## Sign-Off Checklist

Before marking testing complete:

### Functionality:
- [ ] All 10 primary tests pass
- [ ] All 5 edge cases handled
- [ ] No console errors
- [ ] No network errors

### Cross-Browser:
- [ ] Works in Chrome
- [ ] Works in Firefox
- [ ] Works in Safari
- [ ] Works in Edge

### Responsive:
- [ ] Works on desktop
- [ ] Works on tablet
- [ ] Works on mobile
- [ ] No layout issues

### Performance:
- [ ] Load times acceptable
- [ ] No memory leaks
- [ ] Smooth interactions
- [ ] Efficient calculations

### Accessibility:
- [ ] Keyboard accessible
- [ ] Screen reader friendly
- [ ] High contrast
- [ ] Touch-friendly

### Integration:
- [ ] Works with skill gap analysis
- [ ] Works with job editing
- [ ] Works with archive feature
- [ ] Doesn't break existing features

---

## Success Criteria

The feature is ready for production when:
- ✅ All tests pass
- ✅ No critical or high severity bugs
- ✅ Works across browsers
- ✅ Responsive on all devices
- ✅ Meets accessibility standards
- ✅ Performance is acceptable
- ✅ User feedback is positive

---

## Testing Completed By

- **Tester Name:** _______________
- **Date:** _______________
- **Sign-Off:** _______________

**Notes:**
[Any additional observations or recommendations]
