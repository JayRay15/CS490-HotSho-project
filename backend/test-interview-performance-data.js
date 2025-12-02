import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Interview } from './src/models/Interview.js';
import { Job } from './src/models/Job.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

async function testData() {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    await mongoose.connect(uri);
    console.log('Connected to MongoDB\n');
    
    const userId = 'user_2oNz02iNkcx2sROF8yFjnCEGfNa';
    
    // Get all interviews
    const interviews = await Interview.find({ userId }).sort({ scheduledDate: 1 });
    console.log(`Total interviews: ${interviews.length}\n`);
    
    // Analyze by type
    console.log('=== BY TYPE ===');
    const types = ["Phone Screen", "Technical", "Behavioral", "Final Round"];
    types.forEach(type => {
      const typeInterviews = interviews.filter(i => i.interviewType === type);
      const withOutcome = typeInterviews.filter(i => i.outcome?.result);
      const successful = typeInterviews.filter(i => 
        i.outcome?.result === "Moved to Next Round" || 
        i.outcome?.result === "Offer Extended" || 
        i.outcome?.result === "Passed"
      );
      
      const rate = withOutcome.length > 0 ? ((successful.length / withOutcome.length) * 100).toFixed(1) : 0;
      
      console.log(`${type}:`);
      console.log(`  Total: ${typeInterviews.length}`);
      console.log(`  With outcome: ${withOutcome.length}`);
      console.log(`  Successful: ${successful.length}`);
      console.log(`  Rate: ${rate}%`);
      console.log();
    });
    
    // Analyze overall
    console.log('=== OVERALL ===');
    const withOutcome = interviews.filter(i => i.outcome?.result && 
      i.outcome.result !== "Pending" && 
      i.outcome.result !== "Waiting for Feedback");
    const successful = interviews.filter(i => 
      i.outcome?.result === "Moved to Next Round" || 
      i.outcome?.result === "Offer Extended" || 
      i.outcome?.result === "Passed"
    );
    const overallRate = withOutcome.length > 0 ? ((successful.length / withOutcome.length) * 100).toFixed(1) : 0;
    
    console.log(`Total interviews: ${interviews.length}`);
    console.log(`With outcome (not pending): ${withOutcome.length}`);
    console.log(`Successful: ${successful.length}`);
    console.log(`Overall rate: ${overallRate}%\n`);
    
    // Show all outcomes
    console.log('=== ALL INTERVIEW OUTCOMES ===');
    interviews.forEach((interview, index) => {
      console.log(`${index + 1}. ${interview.interviewType} - ${interview.scheduledDate.toISOString().split('T')[0]} - Outcome: ${interview.outcome?.result || 'null'}`);
    });
    
    // Check jobs
    console.log('\n=== JOB STATUS ===');
    const jobs = await Job.find({ userId });
    const offers = jobs.filter(j => j.status === "Offer" || j.status === "Accepted");
    console.log(`Total jobs: ${jobs.length}`);
    console.log(`Offers: ${offers.length}`);
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testData();
