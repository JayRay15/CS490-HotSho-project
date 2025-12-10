/**
 * Seed script for Response Time Prediction data
 * Generates sample historical data to test the prediction algorithms
 * 
 * Usage: node test_scripts/seed-response-time-data.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { ResponseTimePrediction } from '../src/models/ResponseTimePrediction.js';
import { Job } from '../src/models/Job.js';
import { User } from '../src/models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hotsho';

// Sample company sizes with their typical response times
const companySizeData = {
  '1-10': { avgDays: 4, stdDev: 2 },
  '11-50': { avgDays: 7, stdDev: 3 },
  '51-200': { avgDays: 12, stdDev: 5 },
  '201-500': { avgDays: 16, stdDev: 6 },
  '501-1000': { avgDays: 20, stdDev: 7 },
  '1001-5000': { avgDays: 24, stdDev: 8 },
  '5001-10000': { avgDays: 28, stdDev: 10 },
  '10000+': { avgDays: 30, stdDev: 12 }
};

// Industry multipliers
const industryMultipliers = {
  'Technology': 0.85,
  'Healthcare': 1.3,
  'Finance': 1.2,
  'Education': 1.4,
  'Manufacturing': 1.1,
  'Retail': 0.9,
  'Marketing': 0.95,
  'Consulting': 1.15,
  'Other': 1.0
};

// Job levels with adjustments
const jobLevelAdjustments = {
  'entry': -3,
  'mid': 0,
  'senior': 5,
  'lead': 7,
  'manager': 10,
  'director': 14,
  'executive': 21
};

function randomNormal(mean, stdDev) {
  // Box-Muller transform for normal distribution
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.round(mean + z * stdDev);
}

function generateResponseTime(companySize, industry, jobLevel) {
  const baseData = companySizeData[companySize] || companySizeData['51-200'];
  const industryMult = industryMultipliers[industry] || 1.0;
  const levelAdj = jobLevelAdjustments[jobLevel] || 0;
  
  const baseDays = randomNormal(baseData.avgDays, baseData.stdDev);
  const adjustedDays = Math.max(1, Math.round(baseDays * industryMult + levelAdj));
  
  return adjustedDays;
}

async function seedResponseTimeData() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get a test user
    const user = await User.findOne();
    if (!user) {
      console.log('❌ No users found. Please create a user first.');
      process.exit(1);
    }

    console.log(`📊 Seeding response time data for user: ${user.clerkId}`);

    // Get user's jobs that have been applied to
    const jobs = await Job.find({
      userId: user.clerkId,
      status: { $in: ['Applied', 'Phone Screen', 'Interview', 'Offer', 'Rejected'] }
    });

    console.log(`📋 Found ${jobs.length} applied jobs`);

    const responseTypes = ['interview_invite', 'rejection', 'follow_up_needed', 'ghosted', 'offer'];
    const companySizes = Object.keys(companySizeData);
    const industries = Object.keys(industryMultipliers);
    const jobLevels = Object.keys(jobLevelAdjustments);

    let created = 0;
    let updated = 0;

    for (const job of jobs) {
      const companySize = job.companyInfo?.size || companySizes[Math.floor(Math.random() * companySizes.length)];
      const industry = job.industry || industries[Math.floor(Math.random() * industries.length)];
      const jobLevel = jobLevels[Math.floor(Math.random() * jobLevels.length)];
      
      const applicationDate = job.applicationDate || new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000);
      
      // Generate response time based on patterns
      const actualDays = generateResponseTime(companySize, industry, jobLevel);
      const responseDate = new Date(applicationDate);
      responseDate.setDate(responseDate.getDate() + actualDays);
      
      // Determine response type based on job status
      let responseType;
      const hasResponded = job.status !== 'Applied';
      
      if (job.status === 'Rejected') {
        responseType = 'rejection';
      } else if (['Phone Screen', 'Interview'].includes(job.status)) {
        responseType = 'interview_invite';
      } else if (job.status === 'Offer') {
        responseType = 'offer';
      } else {
        responseType = null; // Still pending
      }

      const predictionData = {
        userId: user.clerkId,
        jobId: job._id,
        companySize,
        industry,
        jobLevel,
        companyName: job.company,
        applicationDate,
        status: hasResponded ? (responseType === 'ghosted' ? 'ghosted' : 'responded') : 'pending',
        currentPrediction: {
          predictedDaysMin: Math.max(1, actualDays - 5),
          predictedDaysMax: actualDays + 10,
          predictedDaysMedian: actualDays,
          confidenceLevel: 75,
          suggestedFollowUpDate: new Date(applicationDate.getTime() + (actualDays + 3) * 24 * 60 * 60 * 1000),
          isOverdue: false,
          daysOverdue: 0,
          factors: [
            { factor: 'company_size', impact: companySize === '1-10' || companySize === '11-50' ? 'faster' : 'slower', description: `${companySize} company size` },
            { factor: 'industry', impact: industryMultipliers[industry] < 1 ? 'faster' : 'slower', description: `${industry} industry` }
          ],
          industryBenchmark: {
            averageDays: Math.round(14 * (industryMultipliers[industry] || 1)),
            percentile25: Math.round(7 * (industryMultipliers[industry] || 1)),
            percentile75: Math.round(21 * (industryMultipliers[industry] || 1)),
            sampleSize: Math.floor(Math.random() * 100) + 10
          }
        }
      };

      // Add actual response data if responded
      if (hasResponded && responseType) {
        predictionData.actualResponseDate = responseDate;
        predictionData.actualDaysToResponse = actualDays;
        predictionData.responseType = responseType;
        predictionData.predictionAccuracy = {
          wasAccurate: Math.abs(actualDays - predictionData.currentPrediction.predictedDaysMedian) <= 3,
          errorDays: actualDays - predictionData.currentPrediction.predictedDaysMedian,
          wasWithinConfidenceInterval: actualDays >= predictionData.currentPrediction.predictedDaysMin && 
                                       actualDays <= predictionData.currentPrediction.predictedDaysMax
        };
      }

      // Check if prediction exists
      const existing = await ResponseTimePrediction.findOne({ userId: user.clerkId, jobId: job._id });
      
      if (existing) {
        await ResponseTimePrediction.findOneAndUpdate(
          { userId: user.clerkId, jobId: job._id },
          { $set: predictionData }
        );
        updated++;
      } else {
        await ResponseTimePrediction.create(predictionData);
        created++;
      }
    }

    // Also generate some additional historical data for better predictions
    console.log('\n📈 Generating additional historical data...');
    
    const additionalRecords = 50;
    for (let i = 0; i < additionalRecords; i++) {
      const companySize = companySizes[Math.floor(Math.random() * companySizes.length)];
      const industry = industries[Math.floor(Math.random() * industries.length)];
      const jobLevel = jobLevels[Math.floor(Math.random() * jobLevels.length)];
      
      const applicationDate = new Date(Date.now() - (30 + Math.random() * 180) * 24 * 60 * 60 * 1000);
      const actualDays = generateResponseTime(companySize, industry, jobLevel);
      const responseDate = new Date(applicationDate);
      responseDate.setDate(responseDate.getDate() + actualDays);
      
      const responseType = responseTypes[Math.floor(Math.random() * responseTypes.length)];

      await ResponseTimePrediction.create({
        userId: `historical_${i}`,
        jobId: new mongoose.Types.ObjectId(),
        companySize,
        industry,
        jobLevel,
        companyName: `Company ${i}`,
        applicationDate,
        actualResponseDate: responseDate,
        actualDaysToResponse: actualDays,
        responseType,
        status: responseType === 'ghosted' ? 'ghosted' : 'responded',
        currentPrediction: {
          predictedDaysMin: Math.max(1, actualDays - 5),
          predictedDaysMax: actualDays + 10,
          predictedDaysMedian: actualDays,
          confidenceLevel: 70,
          suggestedFollowUpDate: new Date(applicationDate.getTime() + (actualDays + 3) * 24 * 60 * 60 * 1000),
          isOverdue: false,
          daysOverdue: 0,
          factors: [],
          industryBenchmark: { averageDays: 14, percentile25: 7, percentile75: 21, sampleSize: 100 }
        },
        predictionAccuracy: {
          wasAccurate: true,
          errorDays: 0,
          wasWithinConfidenceInterval: true
        }
      });
    }

    console.log(`\n✅ Seeding complete!`);
    console.log(`   - Created: ${created} predictions for user jobs`);
    console.log(`   - Updated: ${updated} existing predictions`);
    console.log(`   - Generated: ${additionalRecords} historical records`);

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

seedResponseTimeData();
