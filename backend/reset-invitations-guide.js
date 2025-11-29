// Reset test invitations back to pending status
// This is just for testing - run this to clean up your test data

console.log(`
To reset your invitations for testing:

Option 1: Use MongoDB Compass or mongosh
----------------------------------------
1. Connect to your MongoDB
2. Find the "mentorrelationships" collection
3. Find documents with:
   - mentorEmail: "tirthpatel619@gmail.com" or "pateltirth619@gmail.com"
   - status: "accepted"
4. Update them:
   - Set status: "pending"
   - Set mentorId: null
   - Set acceptedAt: null

Option 2: Delete and recreate
------------------------------
1. Delete the existing invitations
2. Have someone invite you again
3. Now you'll see them in "Pending Invitations"

Option 3: Test with a fresh invitation
--------------------------------------
1. Create a new test email account
2. Invite that email as a mentor
3. Log in with that email
4. You'll see the pending invitation!

The issue was: When you invited yourself earlier, the system
automatically marked those as "accepted" by setting the mentorId.
We've now fixed that behavior for new invitations.
`);
