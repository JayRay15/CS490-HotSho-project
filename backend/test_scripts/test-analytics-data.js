// Debug script to test analytics endpoint data structure
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Job } from '../src/models/Job.js';

dotenv.config();

async function testAnalyticsData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get a test user ID from existing jobs
    const sampleJob = await Job.findOne();
    if (!sampleJob) {
      console.log('⚠️  No jobs found in database');
      return;
    }

    const userId = sampleJob.userId;
    console.log(`\n📊 Testing analytics for user: ${userId}\n`);

    // Fetch all jobs for this user
    const allJobs = await Job.find({ userId }).sort({ createdAt: -1 });
    console.log(`Total jobs found: ${allJobs.length}`);

    // Test funnel data calculation
    const appliedJobs = allJobs.filter(j => j.status !== "Archived");
    const screenJobs = allJobs.filter(j => ["Phone Screen", "Interview", "Offer", "Accepted", "Rejected"].includes(j.status));
    const interviewJobs = allJobs.filter(j => ["Interview", "Offer", "Accepted", "Rejected"].includes(j.status));
    const offerJobs = allJobs.filter(j => ["Offer", "Accepted"].includes(j.status));

    console.log('\n🔀 FUNNEL DATA:');
    console.log(`Applied: ${appliedJobs.length}`);
    console.log(`Phone Screen: ${screenJobs.length}`);
    console.log(`Interview: ${interviewJobs.length}`);
    console.log(`Offer: ${offerJobs.length}`);

    // Test company analytics
    const companyCounts = {};
    allJobs.forEach(job => {
      if (job.company) {
        if (!companyCounts[job.company]) {
          companyCounts[job.company] = { count: 0, jobs: [] };
        }
        companyCounts[job.company].count++;
        companyCounts[job.company].jobs.push(job);
      }
    });

    console.log('\n🏢 COMPANY DATA:');
    console.log(`Unique companies: ${Object.keys(companyCounts).length}`);
    Object.entries(companyCounts).slice(0, 5).forEach(([company, data]) => {
      console.log(`  ${company}: ${data.count} applications`);
    });

    // Test industry analytics
    const industryCounts = {};
    allJobs.forEach(job => {
      if (job.industry) {
        if (!industryCounts[job.industry]) {
          industryCounts[job.industry] = { count: 0 };
        }
        industryCounts[job.industry].count++;
      }
    });

    console.log('\n🏭 INDUSTRY DATA:');
    console.log(`Unique industries: ${Object.keys(industryCounts).length}`);
    Object.entries(industryCounts).slice(0, 5).forEach(([industry, data]) => {
      console.log(`  ${industry}: ${data.count} applications`);
    });

    // Test work mode (approach) analytics
    const workModeCounts = {};
    allJobs.forEach(job => {
      const mode = job.workMode || 'Unknown';
      if (!workModeCounts[mode]) {
        workModeCounts[mode] = { count: 0 };
      }
      workModeCounts[mode].count++;
    });

    console.log('\n💼 WORK MODE DATA:');
    Object.entries(workModeCounts).forEach(([mode, data]) => {
      console.log(`  ${mode}: ${data.count} applications`);
    });

    // Check sample job structure
    console.log('\n📝 SAMPLE JOB STRUCTURE:');
    const job = allJobs[0];
    console.log({
      company: job.company,
      jobTitle: job.jobTitle,
      industry: job.industry,
      workMode: job.workMode,
      status: job.status,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

testAnalyticsData();
