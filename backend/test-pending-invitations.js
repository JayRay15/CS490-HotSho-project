import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

// Import models
import './src/models/Mentor.js';
import './src/models/User.js';

const MentorRelationship = mongoose.model('MentorRelationship');
const User = mongoose.model('User');

async function testPendingInvitations() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find all pending invitations
        const allPending = await MentorRelationship.find({ status: 'pending' })
            .populate('menteeId', 'firstName lastName email')
            .populate('mentorId', 'firstName lastName email');

        console.log('\n📬 ALL PENDING INVITATIONS:');
        console.log('Total count:', allPending.length);
        
        if (allPending.length === 0) {
            console.log('❌ No pending invitations found in database');
        } else {
            allPending.forEach((inv, idx) => {
                console.log(`\n--- Invitation ${idx + 1} ---`);
                console.log('ID:', inv._id);
                console.log('Mentee:', inv.menteeId ? `${inv.menteeId.firstName} ${inv.menteeId.lastName} (${inv.menteeId.email})` : 'Not populated');
                console.log('Mentor Email:', inv.mentorEmail);
                console.log('Mentor ID:', inv.mentorId ? `${inv.mentorId.firstName} ${inv.mentorId.lastName}` : 'null (not registered)');
                console.log('Status:', inv.status);
                console.log('Relationship Type:', inv.relationshipType);
                console.log('Focus Areas:', inv.focusAreas);
                console.log('Invitation Message:', inv.invitationMessage || 'None');
                console.log('Created:', inv.createdAt);
            });
        }

        // Check if there are any users that match the mentor emails
        console.log('\n🔍 CHECKING USER EMAILS:');
        const allUsers = await User.find({}, 'firstName lastName email');
        console.log('Total users:', allUsers.length);
        
        allPending.forEach(inv => {
            const matchingUser = allUsers.find(u => u.email.toLowerCase() === inv.mentorEmail.toLowerCase());
            if (matchingUser) {
                console.log(`✅ User exists for ${inv.mentorEmail}: ${matchingUser.firstName} ${matchingUser.lastName}`);
            } else {
                console.log(`❌ No user found for ${inv.mentorEmail}`);
            }
        });

        await mongoose.disconnect();
        console.log('\n✅ Test completed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testPendingInvitations();
