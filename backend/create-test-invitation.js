// Quick test to create a pending invitation
// Run this with: node create-test-invitation.js YOUR_EMAIL

const email = process.argv[2];

if (!email) {
    console.log('❌ Usage: node create-test-invitation.js YOUR_EMAIL');
    console.log('Example: node create-test-invitation.js mentor@example.com');
    process.exit(1);
}

console.log(`
📝 To create a test invitation:

1. Log in to your app as a MENTEE (the person who invites)
2. Go to /mentors page
3. Click "+ Invite Mentor" button
4. Enter this email: ${email}
5. Select focus areas and click "Send Invitation"

Then:
6. Log out
7. Log in with: ${email}
8. Go to /mentors page
9. You should see the "Pending Invitations" tab!

OR if the email ${email} isn't registered yet:
- You'll get an email at ${email} with a signup link
- Sign up with that email
- Then go to /mentors

🔍 Current issue: The mentor email in the invitation must EXACTLY match
   the email you're logged in with.
`);
