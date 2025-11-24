// Test script to verify interview prediction calculation fixes
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { MockInterviewSession } from './src/models/MockInterviewSession.js';
import { Interview } from './src/models/Interview.js';
import { Job } from './src/models/Job.js';
import { calculateInterviewPrediction } from './src/utils/interviewPrediction.js';

dotenv.config();

async function testPrediction() {
  try {
    console.log('🔌 Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected!\n');

    const userId = 'user_34g1tadCH6EapHT5gzS9rsTSJ8J';
    
    // Count mock interviews
    const totalMockInterviews = await MockInterviewSession.countDocuments({ userId, status: "finished" });
    console.log('📊 Total finished mock interviews for user:', totalMockInterviews);
    
    // Get an interview to test
    const interview = await Interview.findOne({ userId }).populate('jobId');
    if (!interview) {
      console.log('❌ No interviews found for user');
      await mongoose.disconnect();
      return;
    }
    
    console.log('\n🎯 Testing interview:', interview._id);
    console.log('Job:', interview.jobId?.title, 'at', interview.jobId?.company);
    
    // Check job materials
    const job = interview.jobId;
    console.log('\n📄 Job Materials:');
    console.log('  - linkedResumeId:', job.linkedResumeId);
    console.log('  - materials.resume:', job.materials?.resume);
    console.log('  - materials.coverLetter:', job.materials?.coverLetter);
    
    // Calculate prediction
    console.log('\n🔮 Calculating prediction...');
    const prediction = await calculateInterviewPrediction(interview._id, userId);
    
    console.log('\n✨ Prediction Results:');
    console.log('  - Success Probability:', prediction.successProbability + '%');
    console.log('  - Confidence Score:', prediction.confidenceScore + '%');
    console.log('\n📋 Preparation Factors:');
    console.log('  - Mock Interviews Completed:', prediction.preparationFactors.mockInterviewsCompleted);
    console.log('  - Practice Hours:', prediction.preparationFactors.practiceHours);
    console.log('  - Resume Tailored:', prediction.preparationFactors.resumeTailored);
    console.log('  - Cover Letter Submitted:', prediction.preparationFactors.coverLetterSubmitted);
    console.log('  - Company Research Completed:', prediction.preparationFactors.companyResearchCompleted);
    console.log('  - Role Match Score:', prediction.preparationFactors.roleMatchScore);
    
    console.log('\n💡 Recommendations:');
    prediction.recommendations.forEach((rec, i) => {
      console.log(`  ${i+1}. [${rec.priority}] ${rec.title}`);
      console.log(`     ${rec.description}`);
      console.log(`     Impact: +${rec.estimatedImpact}%`);
    });
    
    await mongoose.disconnect();
    console.log('\n✅ Test complete!');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

testPrediction();
