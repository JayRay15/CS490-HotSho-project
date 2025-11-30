# Team Account Feature - Quick Testing Guide

## Prerequisites
- Backend server running on `http://localhost:5000`
- Frontend running on `http://localhost:5173`
- Valid Clerk authentication token
- MongoDB connection established

## Quick Start - Frontend Testing

### 1. Access Teams Page
```
Navigate to: http://localhost:5173/teams
```

### 2. Create a Team
1. Click "Create Team" button
2. Fill in details:
   - **Name**: "My Coaching Team"
   - **Description**: "Career coaching for job seekers"
   - **Type**: "Career Coaching"
3. Click "Create Team"
4. You should be redirected to the team dashboard

### 3. Invite Team Members
1. From team dashboard, click "Invite Member"
2. Add a **Candidate**:
   - Email: `candidate@test.com`
   - Role: Candidate
   - Message: "Join our coaching team!"
3. Add a **Mentor**:
   - Email: `mentor@test.com`
   - Role: Mentor
   - Message: "Help candidates succeed!"
4. Add an **Admin**:
   - Email: `admin@test.com`
   - Role: Admin

### 4. Verify Dashboard Metrics
Check that the dashboard shows:
- ✅ Total Members: 4 (owner + 3 invited)
- ✅ Active Candidates: 0 (pending invitation)
- ✅ Total Applications: 0
- ✅ Total Interviews: 0

### 5. Test Member Management
1. Click menu (⋮) next to a member
2. Options should appear:
   - View Profile
   - Remove Member
3. Test removing a member (they can be re-invited)

### 6. Check Team Settings
1. Click "Settings" button
2. Verify you can access:
   - Team information
   - Member permissions
   - Subscription details

## Backend API Testing

### Using the Test Script

```bash
# Navigate to backend directory
cd backend

# Get your Clerk auth token from browser
# Open browser dev tools > Application > Local Storage
# Find your Clerk token

# Run the test script
node test-team-features.js YOUR_AUTH_TOKEN_HERE
```

### Expected Output
```
🚀 Starting Team Account Feature Tests

============================================================
🧪 Testing: Create Team
   Team ID: 674b5c8d9e1234567890abcd
✅ PASSED: Create Team

🧪 Testing: Get My Teams
   Found 1 team(s)
✅ PASSED: Get My Teams

🧪 Testing: Get Team Details
   Team: Test Coaching Team
   Role: owner
✅ PASSED: Get Team Details

[... more tests ...]

============================================================
📊 TEST SUMMARY
============================================================
Total Tests: 12
✅ Passed: 12
❌ Failed: 0
Success Rate: 100.0%

✅ All tests passed!
```

## Manual API Testing with cURL

### 1. Create Team
```bash
curl -X POST http://localhost:5000/api/teams \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Team",
    "description": "Testing team features",
    "teamType": "career_coaching"
  }'
```

### 2. Get Teams
```bash
curl -X GET http://localhost:5000/api/teams \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Invite Member
```bash
curl -X POST http://localhost:5000/api/teams/TEAM_ID/members/invite \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "role": "candidate",
    "invitationMessage": "Join our team!"
  }'
```

### 4. Get Dashboard
```bash
curl -X GET http://localhost:5000/api/teams/TEAM_ID/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Testing Scenarios

### Scenario 1: Career Coach with Multiple Candidates

**Setup**:
1. Create team as coach
2. Invite 3-5 candidates
3. Candidates accept invitations
4. Candidates add applications and interviews

**Test**:
- Dashboard shows aggregate metrics
- Can view each candidate's progress
- Data sharing settings are respected
- Activity log tracks all actions

### Scenario 2: Permission Management

**Setup**:
1. Create team
2. Invite admin, mentor, and candidate
3. Test each role's permissions

**Test**:
- Admin can manage members: ✅
- Mentor can view candidates: ✅
- Mentor cannot remove members: ❌
- Candidate can only see own data: ✅
- Viewer has limited access: ✅

### Scenario 3: Subscription Limits

**Setup**:
1. Create free plan team (5 member limit)
2. Invite 5 members
3. Try to invite 6th member

**Test**:
- 5th invitation succeeds: ✅
- 6th invitation fails with limit error: ✅
- Upgrade to starter plan: ✅
- Can now invite more members: ✅

### Scenario 4: Data Sharing Controls

**Setup**:
1. Create team with mentor and candidate
2. Candidate sets data sharing preferences
3. Mentor tries to view candidate data

**Test**:
- Shared data is visible: ✅
- Non-shared data shows permission message: ✅
- Candidate can update sharing settings: ✅
- Changes reflect immediately: ✅

## Common Issues and Solutions

### Issue 1: "Team not found"
**Solution**: 
- Verify team ID is correct
- Check user is a member of the team
- Ensure team hasn't been deleted

### Issue 2: "Permission denied"
**Solution**:
- Check user role has required permission
- Verify membership is active
- Ensure team is not suspended

### Issue 3: "Subscription limit reached"
**Solution**:
- Check current usage in dashboard
- Remove inactive members
- Upgrade subscription plan

### Issue 4: 401 Unauthorized
**Solution**:
- Verify Clerk token is valid
- Check token is properly set in headers
- Re-authenticate if token expired

## Verification Checklist

### Backend
- [ ] All models created and indexed
- [ ] All controllers implemented
- [ ] Middleware properly validates permissions
- [ ] Routes registered in server.js
- [ ] Activity logging works
- [ ] Subscription limits enforced

### Frontend
- [ ] Teams page displays all teams
- [ ] Can create new team
- [ ] Dashboard shows correct metrics
- [ ] Can invite members
- [ ] Member list updates in real-time
- [ ] Role badges display correctly
- [ ] Permission checks work
- [ ] Navigation between pages works

### Database
- [ ] Teams collection created
- [ ] TeamMembers collection created
- [ ] TeamSubscriptions collection created
- [ ] TeamActivityLogs collection created
- [ ] Indexes properly set up
- [ ] Relationships work correctly

### Features
- [ ] Team creation works
- [ ] Member invitations sent
- [ ] Invitations can be accepted
- [ ] Dashboard metrics accurate
- [ ] Activity log tracks actions
- [ ] Subscription management works
- [ ] Permission system enforced
- [ ] Data sharing respected
- [ ] Team deletion works (soft delete)

## Performance Testing

### Load Test: Multiple Teams
1. Create 10 teams
2. Each team has 5 members
3. Check dashboard loads quickly (<2s)

### Stress Test: Large Team
1. Create team with 50 members
2. Add 100 applications per candidate
3. Verify dashboard metrics calculate correctly
4. Check query performance

### Concurrent Users
1. Simulate 10 concurrent users
2. Each user creates a team
3. Each user invites members
4. Verify no race conditions

## Next Steps

After basic testing:
1. ✅ Test all CRUD operations
2. ✅ Verify permission system
3. ✅ Test subscription limits
4. ✅ Validate data sharing
5. ✅ Check activity logging
6. ⏭️ Add real-time features
7. ⏭️ Integrate messaging
8. ⏭️ Add advanced analytics
9. ⏭️ Build mobile support
10. ⏭️ Add API webhooks

## Support

If you encounter issues:
1. Check browser console for errors
2. Review server logs
3. Verify MongoDB collections exist
4. Check API responses in Network tab
5. Refer to TEAM_ACCOUNT_GUIDE.md

## Success Criteria

Testing is successful when:
- ✅ All automated tests pass
- ✅ Frontend pages load without errors
- ✅ All role permissions work correctly
- ✅ Subscription limits are enforced
- ✅ Data sharing settings are respected
- ✅ Activity log captures all actions
- ✅ Dashboard metrics are accurate
- ✅ Member management works smoothly

---

**Happy Testing!** 🎉
