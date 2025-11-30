/**
 * Inject fake job data for testing UC-096 Performance Dashboard
 * Run with: node test_scripts/inject-test-data.js <userId>
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { Job } from '../src/models/Job.js';

// Use provided userId or default to test user
const TARGET_USER_ID = process.argv[2] || 'user_34nWcTOlilYGCxkhwWomjaQZ2jK';

const companies = [
  { name: 'Google', location: 'Mountain View, CA' },
  { name: 'Meta', location: 'Menlo Park, CA' },
  { name: 'Amazon', location: 'Seattle, WA' },
  { name: 'Microsoft', location: 'Redmond, WA' },
  { name: 'Apple', location: 'Cupertino, CA' },
  { name: 'Netflix', location: 'Los Gatos, CA' },
  { name: 'Stripe', location: 'San Francisco, CA' },
  { name: 'Airbnb', location: 'San Francisco, CA' },
  { name: 'Uber', location: 'San Francisco, CA' },
  { name: 'Salesforce', location: 'San Francisco, CA' },
  { name: 'LinkedIn', location: 'Sunnyvale, CA' },
  { name: 'Twitter', location: 'San Francisco, CA' },
  { name: 'Spotify', location: 'New York, NY' },
  { name: 'Adobe', location: 'San Jose, CA' },
  { name: 'Nvidia', location: 'Santa Clara, CA' },
  { name: 'Tesla', location: 'Palo Alto, CA' },
  { name: 'Coinbase', location: 'San Francisco, CA' },
  { name: 'Shopify', location: 'Remote' },
  { name: 'Datadog', location: 'New York, NY' },
  { name: 'Snowflake', location: 'Bozeman, MT' },
];

const titles = [
  'Software Engineer',
  'Senior Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Engineer',
  'ML Engineer',
  'Data Engineer',
  'DevOps Engineer',
  'Site Reliability Engineer',
  'Product Manager',
];

const statuses = ['Interested', 'Applied', 'Phone Screen', 'Interview', 'Offer', 'Rejected'];

function randomDate(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  return date;
}

function generateStatusHistory(finalStatus, applicationDate) {
  const history = [];
  const statusOrder = ['Interested', 'Applied', 'Phone Screen', 'Interview', 'Offer'];
  const finalIndex = statusOrder.indexOf(finalStatus);
  
  let currentDate = new Date(applicationDate);
  
  // Always start with Interested
  history.push({
    status: 'Interested',
    timestamp: new Date(currentDate),
    notes: 'Found this opportunity'
  });
  
  // Add Applied
  if (finalIndex >= 1 || finalStatus === 'Applied' || finalStatus === 'Rejected') {
    currentDate.setDate(currentDate.getDate() + Math.floor(Math.random() * 3));
    history.push({
      status: 'Applied',
      timestamp: new Date(currentDate),
      notes: 'Submitted application'
    });
  }
  
  // Progress through statuses
  if (finalStatus === 'Rejected') {
    // Random rejection point
    const rejectAt = Math.floor(Math.random() * 3) + 1; // 1-3
    for (let i = 2; i <= Math.min(rejectAt, 4); i++) {
      if (statusOrder[i]) {
        currentDate.setDate(currentDate.getDate() + Math.floor(Math.random() * 7) + 3);
        history.push({
          status: statusOrder[i],
          timestamp: new Date(currentDate),
          notes: `Progressed to ${statusOrder[i]}`
        });
      }
    }
    currentDate.setDate(currentDate.getDate() + Math.floor(Math.random() * 5) + 1);
    history.push({
      status: 'Rejected',
      timestamp: new Date(currentDate),
      notes: 'Received rejection'
    });
  } else {
    // Normal progression
    for (let i = 2; i <= finalIndex; i++) {
      currentDate.setDate(currentDate.getDate() + Math.floor(Math.random() * 7) + 3);
      history.push({
        status: statusOrder[i],
        timestamp: new Date(currentDate),
        notes: `Progressed to ${statusOrder[i]}`
      });
    }
  }
  
  return history;
}

function generateJobs(userId, count) {
  const jobs = [];
  
  // Distribution: More applied/rejected, fewer offers (no Ghosted)
  const statusDistribution = [
    { status: 'Applied', count: Math.floor(count * 0.35) },
    { status: 'Rejected', count: Math.floor(count * 0.25) },
    { status: 'Phone Screen', count: Math.floor(count * 0.15) },
    { status: 'Interview', count: Math.floor(count * 0.12) },
    { status: 'Interested', count: Math.floor(count * 0.08) },
    { status: 'Offer', count: Math.floor(count * 0.05) },
  ];
  
  let jobIndex = 0;
  
  for (const { status, count: statusCount } of statusDistribution) {
    for (let i = 0; i < statusCount && jobIndex < count; i++) {
      const company = companies[jobIndex % companies.length];
      const title = titles[Math.floor(Math.random() * titles.length)];
      const applicationDate = randomDate(90); // Within last 90 days
      const statusHistory = generateStatusHistory(status, applicationDate);
      
      const salary = {
        min: 80000 + Math.floor(Math.random() * 80000),
        max: 0,
        currency: 'USD'
      };
      salary.max = salary.min + 20000 + Math.floor(Math.random() * 30000);
      
      jobs.push({
        userId,
        title,
        company: company.name,
        location: company.location,
        url: `https://careers.${company.name.toLowerCase().replace(/\s/g, '')}.com/jobs/${jobIndex}`,
        salary,
        status,
        statusHistory,
        applicationDate,
        notes: `Applied for ${title} position at ${company.name}`,
        skills: ['JavaScript', 'Python', 'React', 'Node.js', 'SQL'].slice(0, Math.floor(Math.random() * 4) + 2),
        archived: false,
        createdAt: applicationDate,
        updatedAt: statusHistory[statusHistory.length - 1].timestamp
      });
      
      jobIndex++;
    }
  }
  
  return jobs;
}

async function main() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected!');
    
    console.log(`\n📊 Generating 30 test jobs for user: ${TARGET_USER_ID}`);
    const jobs = generateJobs(TARGET_USER_ID, 30);
    
    // Count by status
    const statusCounts = {};
    jobs.forEach(j => {
      statusCounts[j.status] = (statusCounts[j.status] || 0) + 1;
    });
    console.log('\n📈 Job distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });
    
    console.log('\n💾 Inserting jobs into database...');
    const result = await Job.insertMany(jobs);
    console.log(`✅ Successfully inserted ${result.length} jobs!`);
    
    // Verify
    const totalJobs = await Job.countDocuments({ userId: TARGET_USER_ID });
    console.log(`\n📊 Total jobs for user: ${totalJobs}`);
    
    await mongoose.disconnect();
    console.log('\n✅ Done! You can now test the Performance Dashboard.');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
