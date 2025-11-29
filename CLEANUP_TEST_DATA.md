# Clean Up Test Data

## The Problem
Your test database has corrupted mentor relationships from earlier testing with the buggy code. This causes:
- Your mentors to show under "My Mentees" 
- Incorrect counts in the dashboard
- Confusion about who is mentoring whom

## Solution: Clean Up Database

### Option 1: Delete All Test Relationships (Recommended)
```javascript
// In MongoDB Compass or mongosh:
// Connect to your database and run:

db.mentorrelationships.deleteMany({
  $or: [
    { menteeId: ObjectId("690f76d56884caf5dd0ade8a") }, // Your user ID
    { mentorId: ObjectId("690f76d56884caf5dd0ade8a") }  // Your user ID
  ]
})
```

### Option 2: Delete Just the Problematic Ones
```javascript
// Delete the two specific relationships:
db.mentorrelationships.deleteMany({
  _id: { $in: [
    ObjectId("692b676f80e53a555aa33258"),
    ObjectId("692b67a380e53a555aa333d8")
  ]}
})
```

### Option 3: Start Fresh with New Test Users
1. Create a completely new test account (Account A)
2. Create another test account (Account B)
3. Log in as Account A
4. Invite Account B as a mentor
5. Log in as Account B
6. Go to `/mentors` - see pending invitation!
7. Accept it
8. Both accounts now have correct relationship

## After Cleanup
1. Refresh your browser at `/mentors`
2. You should see:
   - "My Mentors (0)" - because you deleted the test data
   - No "My Mentees" tab - because you're not mentoring anyone
   - Clean slate to test the feature properly!

## Test the Fixed Feature
1. **As Mentee**: Invite someone to be your mentor
2. **As Mentor**: 
   - Check email for invitation
   - Click "View Invitation"  
   - See yellow banner ✅
   - See "Pending Invitations" tab ✅
   - Accept or decline ✅
3. Relationship created correctly!
