import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Interview } from './src/models/Interview.js';

dotenv.config();

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const counts = await Interview.aggregate([
      { $group: { _id: '$userId', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('Interview counts by user:');
    for (const c of counts) {
      console.log(`${c._id} - ${c.count} interviews`);
    }
    
    if (counts.length > 0) {
      console.log(`\n=== Checking first user with data ===`);
      const firstUser = counts[0]._id;
      const interviews = await Interview.find({ userId: firstUser }).sort({ scheduledDate: 1 });
      
      console.log(`Total interviews for ${firstUser}: ${interviews.length}\n`);
      
      interviews.forEach((interview, index) => {
        console.log(`${index + 1}. ${interview.interviewType} - ${interview.scheduledDate.toISOString().split('T')[0]} - Outcome: ${interview.outcome?.result || 'null'}`);
      });
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUsers();
