import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

import { ExternalAdvisorRelationship } from '../src/models/ExternalAdvisor.js';

async function fixNames() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const relationships = await ExternalAdvisorRelationship.find({});

        for (const rel of relationships) {
            // Always use email for names since users don't have firstName/lastName set
            await ExternalAdvisorRelationship.findByIdAndUpdate(rel._id, {
                senderName: rel.senderEmail || 'Job Seeker',
                advisorName: rel.advisorEmail || 'Advisor'
            });
            console.log('Updated:', rel._id, '-> sender:', rel.senderEmail, ', advisor:', rel.advisorEmail);
        }

        console.log('Done!');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

fixNames();
