import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

// Import models
import './src/models/Mentor.js';

const MentorRelationship = mongoose.model('MentorRelationship');

async function deleteCorruptedRelationships() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Delete the two specific corrupted relationships
        const result = await MentorRelationship.deleteMany({
            _id: { 
                $in: [
                    '692b676f80e53a555aa33258',
                    '692b67a380e53a555aa333d8'
                ]
            }
        });

        console.log('\n🗑️  Deleted', result.deletedCount, 'corrupted relationships');

        // Show remaining relationships for this user
        const remaining = await MentorRelationship.find({
            $or: [
                { menteeId: '690f76d56884caf5dd0ade8a' },
                { mentorId: '690f76d56884caf5dd0ade8a' }
            ]
        });

        console.log('\n📊 Remaining relationships for your account:', remaining.length);
        
        if (remaining.length > 0) {
            console.log('\nRemaining relationships:');
            remaining.forEach((rel, idx) => {
                console.log(`${idx + 1}. ID: ${rel._id}, Status: ${rel.status}, Email: ${rel.mentorEmail}`);
            });
        }

        await mongoose.disconnect();
        console.log('\n✅ Cleanup completed! Refresh your browser to see the changes.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

deleteCorruptedRelationships();
