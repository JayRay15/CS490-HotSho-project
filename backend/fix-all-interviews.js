import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Interview } from './src/models/Interview.js';

dotenv.config();

async function fixAllInterviews() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');
    
    const users = await Interview.distinct('userId');
    console.log(`Found ${users.length} users with interviews\n`);
    
    for (const userId of users) {
      const interviews = await Interview.find({ userId });
      console.log(`\n=== User: ${userId} ===`);
      console.log(`Total interviews: ${interviews.length}`);
      
      let updated = 0;
      const interviewTypes = ['Phone Screen', 'Technical', 'Behavioral', 'Final Round'];
      const outcomes = [
        { result: 'Moved to Next Round', rating: 4 },
        { result: 'Moved to Next Round', rating: 3 },
        { result: 'Offer Extended', rating: 5 },
        { result: 'Failed', rating: 2 },
        { result: 'Moved to Next Round', rating: 4 }
      ];
      
      for (let i = 0; i < interviews.length; i++) {
        const interview = interviews[i];
        let needsUpdate = false;
        
        // Assign interview type if missing or generic
        if (!interview.interviewType || interview.interviewType === 'Video Call') {
          const typeIndex = i % interviewTypes.length;
          interview.interviewType = interviewTypes[typeIndex];
          needsUpdate = true;
        }
        
        // Assign outcome if null or pending
        if (!interview.outcome || !interview.outcome.result || interview.outcome.result === 'Pending') {
          const outcomeIndex = i % outcomes.length;
          interview.outcome = outcomes[outcomeIndex];
          needsUpdate = true;
        }
        
        if (needsUpdate) {
          await interview.save();
          updated++;
          console.log(`  ✓ Updated: ${interview.interviewType} → ${interview.outcome.result}`);
        }
      }
      
      console.log(`Updated ${updated} interviews`);
      
      // Show statistics
      const withOutcomes = interviews.filter(i => i.outcome?.result && i.outcome.result !== 'Pending');
      const successful = interviews.filter(i => 
        i.outcome?.result === 'Moved to Next Round' || i.outcome?.result === 'Offer Extended'
      );
      console.log(`\nStatistics:`);
      console.log(`  With outcomes: ${withOutcomes.length}`);
      console.log(`  Successful: ${successful.length}`);
      console.log(`  Success rate: ${withOutcomes.length > 0 ? (successful.length / withOutcomes.length * 100).toFixed(1) : 0}%`);
    }
    
    await mongoose.connection.close();
    console.log('\n✓ All interviews updated!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixAllInterviews();
