import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Interview } from './src/models/Interview.js';
import { Job } from './src/models/Job.js';

dotenv.config();

async function seedTestData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');
    
    // Use first user with interviews
    const userId = 'user_34nWcTOlilYGCxkhwWomjaQZ2jK';
    
    console.log('=== Seeding Interview Outcomes ===\n');
    
    const interviews = await Interview.find({ userId });
    console.log(`Found ${interviews.length} interviews for user ${userId}\n`);
    
    // Define realistic outcomes mix
    const outcomes = [
      { result: 'Moved to Next Round', rating: 4, notes: 'Strong technical skills' },
      { result: 'Moved to Next Round', rating: 3, notes: 'Good communication' },
      { result: 'Offer Extended', rating: 5, notes: 'Excellent fit' },
      { result: 'Failed', rating: 2, notes: 'Need more preparation' },
      { result: 'Moved to Next Round', rating: 4, notes: 'Solid answers' },
      { result: 'Pending', rating: 3, notes: 'Waiting for feedback' }
    ];
    
    // Update interviews with outcomes
    for (let i = 0; i < Math.min(interviews.length, outcomes.length); i++) {
      const interview = interviews[i];
      const outcome = outcomes[i];
      
      interview.outcome = outcome;
      await interview.save();
      
      console.log(`✓ Updated interview ${i + 1}: ${interview.interviewType} → ${outcome.result}`);
    }
    
    console.log('\n=== Creating Job Records ===\n');
    
    // Create a job with offer status
    const jobData = {
      userId,
      company: 'Tech Company Inc',
      title: 'Senior Software Engineer',
      position: 'Senior Software Engineer',
      location: 'San Francisco, CA',
      status: 'Offer',
      dateApplied: new Date('2025-11-01'),
      salary: {
        min: 150000,
        max: 180000
      }
    };
    
    const existingJob = await Job.findOne({ userId, company: jobData.company });
    if (!existingJob) {
      await Job.create(jobData);
      console.log('✓ Created job with Offer status');
    } else {
      console.log('✓ Job already exists');
    }
    
    console.log('\n=== Verification ===\n');
    
    const updatedInterviews = await Interview.find({ userId });
    const withOutcomes = updatedInterviews.filter(i => i.outcome?.result);
    const successful = updatedInterviews.filter(i => 
      i.outcome?.result === 'Moved to Next Round' || i.outcome?.result === 'Offer Extended'
    );
    
    console.log(`Total interviews: ${updatedInterviews.length}`);
    console.log(`With outcomes: ${withOutcomes.length}`);
    console.log(`Successful: ${successful.length}`);
    console.log(`Success rate: ${withOutcomes.length > 0 ? (successful.length / withOutcomes.length * 100).toFixed(1) : 0}%`);
    
    const jobs = await Job.find({ userId });
    const offers = jobs.filter(j => j.status === 'Offer' || j.status === 'Accepted');
    console.log(`\nJobs with offers: ${offers.length}`);
    
    await mongoose.connection.close();
    console.log('\n✓ Seeding complete!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

seedTestData();
