import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from backend root (scripts is inside backend)
dotenv.config({ path: join(__dirname, '..', '.env') });

// Debug: Check if MONGODB_URI is loaded
console.log('MONGO_URI loaded:', !!process.env.MONGO_URI);

import { ExternalAdvisorRelationship } from '../src/models/ExternalAdvisor.js';
import { User } from '../src/models/User.js';

async function migrate() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Update all relationships that don't have senderName
        const relationships = await ExternalAdvisorRelationship.find({}).populate('userId').populate('advisorId');

        console.log('Found', relationships.length, 'relationships to check');

        for (const rel of relationships) {
            let needsUpdate = false;
            const updates = {};

            // Update senderName if missing
            if (!rel.senderName && rel.userId) {
                const name = rel.userId.firstName && rel.userId.lastName
                    ? `${rel.userId.firstName} ${rel.userId.lastName}`.trim()
                    : rel.userId.email || 'Unknown User';
                updates.senderName = name;
                updates.senderEmail = rel.userId.email;
                needsUpdate = true;
            }

            // Update advisorName if missing and accepted
            if (!rel.advisorName && rel.advisorId && rel.status === 'accepted') {
                const name = rel.advisorId.firstName && rel.advisorId.lastName
                    ? `${rel.advisorId.firstName} ${rel.advisorId.lastName}`.trim()
                    : rel.advisorId.email || rel.advisorEmail;
                updates.advisorName = name;
                needsUpdate = true;
            }

            if (needsUpdate) {
                await ExternalAdvisorRelationship.findByIdAndUpdate(rel._id, updates);
                console.log('Updated:', rel._id, updates);
            }
        }

        console.log('Migration complete');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

migrate();
