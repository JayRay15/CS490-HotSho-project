/**
 * Test Script for Application Success Rate Dashboard
 * Creates test data, then removes it after testing
 * 
 * Usage:
 *   node test_scripts/test-success-dashboard.js create   - Create test data
 *   node test_scripts/test-success-dashboard.js cleanup  - Remove test data
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

// Import models
import { Job } from '../src/models/Job.js';
import { Resume } from '../src/models/Resume.js';
import { CoverLetter } from '../src/models/CoverLetter.js';

// Test user ID - REPLACE THIS with your actual Clerk user ID
const TEST_USER_ID = process.env.TEST_USER_ID || 'user_test_success_dashboard';

// Marker to identify test data
const TEST_MARKER = '__TEST_SUCCESS_DASHBOARD__';

const testJobs = [
  // Successful applications in Tech
  { company: `${TEST_MARKER} Google`, title: 'Software Engineer', status: 'Offer', industry: 'Technology', jobType: 'Full-time', workMode: 'Hybrid', createdAt: new Date('2024-11-01') },
  { company: `${TEST_MARKER} Microsoft`, title: 'Frontend Developer', status: 'Interview', industry: 'Technology', jobType: 'Full-time', workMode: 'Remote', createdAt: new Date('2024-11-05') },
  { company: `${TEST_MARKER} Amazon`, title: 'SDE II', status: 'Phone Screen', industry: 'Technology', jobType: 'Full-time', workMode: 'On-site', createdAt: new Date('2024-11-10') },
  { company: `${TEST_MARKER} Meta`, title: 'React Developer', status: 'Accepted', industry: 'Technology', jobType: 'Full-time', workMode: 'Remote', createdAt: new Date('2024-10-15') },
  
  // Rejected in Tech
  { company: `${TEST_MARKER} Apple`, title: 'iOS Developer', status: 'Rejected', industry: 'Technology', jobType: 'Full-time', workMode: 'On-site', createdAt: new Date('2024-10-20') },
  { company: `${TEST_MARKER} Netflix`, title: 'Backend Engineer', status: 'Rejected', industry: 'Technology', jobType: 'Full-time', workMode: 'Remote', createdAt: new Date('2024-10-25') },
  
  // Healthcare - Lower success
  { company: `${TEST_MARKER} Kaiser`, title: 'IT Analyst', status: 'Rejected', industry: 'Healthcare', jobType: 'Full-time', workMode: 'On-site', createdAt: new Date('2024-11-02') },
  { company: `${TEST_MARKER} Cigna`, title: 'Data Analyst', status: 'Rejected', industry: 'Healthcare', jobType: 'Full-time', workMode: 'Hybrid', createdAt: new Date('2024-11-08') },
  { company: `${TEST_MARKER} UnitedHealth`, title: 'Developer', status: 'Applied', industry: 'Healthcare', jobType: 'Full-time', workMode: 'Remote', createdAt: new Date('2024-11-15') },
  
  // Finance - Mixed
  { company: `${TEST_MARKER} Goldman Sachs`, title: 'Quant Developer', status: 'Interview', industry: 'Finance', jobType: 'Full-time', workMode: 'On-site', createdAt: new Date('2024-11-03') },
  { company: `${TEST_MARKER} JPMorgan`, title: 'Software Engineer', status: 'Offer', industry: 'Finance', jobType: 'Full-time', workMode: 'Hybrid', createdAt: new Date('2024-10-28') },
  { company: `${TEST_MARKER} Morgan Stanley`, title: 'Full Stack Dev', status: 'Rejected', industry: 'Finance', jobType: 'Full-time', workMode: 'On-site', createdAt: new Date('2024-11-12') },
  
  // Startups - High success
  { company: `${TEST_MARKER} TechStartup A`, title: 'Full Stack Engineer', status: 'Offer', industry: 'Technology', jobType: 'Full-time', workMode: 'Remote', createdAt: new Date('2024-11-06') },
  { company: `${TEST_MARKER} TechStartup B`, title: 'React Developer', status: 'Interview', industry: 'Technology', jobType: 'Contract', workMode: 'Remote', createdAt: new Date('2024-11-09') },
  
  // Different days of week for timing analysis
  { company: `${TEST_MARKER} Monday Corp`, title: 'Developer', status: 'Interview', industry: 'Technology', jobType: 'Full-time', workMode: 'Remote', createdAt: new Date('2024-11-04') }, // Monday
  { company: `${TEST_MARKER} Tuesday Inc`, title: 'Engineer', status: 'Offer', industry: 'Technology', jobType: 'Full-time', workMode: 'Hybrid', createdAt: new Date('2024-11-05') }, // Tuesday
  { company: `${TEST_MARKER} Wednesday LLC`, title: 'Developer', status: 'Applied', industry: 'Technology', jobType: 'Full-time', workMode: 'Remote', createdAt: new Date('2024-11-06') }, // Wednesday
  { company: `${TEST_MARKER} Thursday Co`, title: 'SWE', status: 'Rejected', industry: 'Technology', jobType: 'Full-time', workMode: 'On-site', createdAt: new Date('2024-11-07') }, // Thursday
  { company: `${TEST_MARKER} Friday Ltd`, title: 'Developer', status: 'Applied', industry: 'Technology', jobType: 'Full-time', workMode: 'Remote', createdAt: new Date('2024-11-08') }, // Friday
];

const testResumes = [
  { 
    fileName: `${TEST_MARKER} Resume_Tech_Focused.pdf`,
    content: 'Test resume focused on technology skills',
    metadata: { tailoredForJob: true },
  },
  {
    fileName: `${TEST_MARKER} Resume_General.pdf`,
    content: 'General resume for all applications',
    metadata: { tailoredForJob: false },
  },
  {
    fileName: `${TEST_MARKER} Resume_Finance_Focused.pdf`,
    content: 'Test resume focused on finance skills',
    metadata: { tailoredForJob: true },
  },
];

const testCoverLetters = [
  {
    fileName: `${TEST_MARKER} CoverLetter_Tech.pdf`,
    content: 'Cover letter for tech positions',
    metadata: { tailoredForJob: true },
  },
  {
    fileName: `${TEST_MARKER} CoverLetter_General.pdf`,
    content: 'General cover letter',
    metadata: { tailoredForJob: false },
  },
];

async function connectDB() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI not found in environment variables');
    }
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function createTestData() {
  console.log('\n📝 Creating test data for Success Dashboard...\n');
  
  // Create resumes first
  const createdResumes = [];
  for (const resume of testResumes) {
    const newResume = await Resume.create({
      userId: TEST_USER_ID,
      ...resume,
    });
    createdResumes.push(newResume);
    console.log(`  ✅ Created resume: ${resume.fileName}`);
  }
  
  // Create cover letters
  const createdCoverLetters = [];
  for (const cl of testCoverLetters) {
    const newCL = await CoverLetter.create({
      userId: TEST_USER_ID,
      ...cl,
    });
    createdCoverLetters.push(newCL);
    console.log(`  ✅ Created cover letter: ${cl.fileName}`);
  }
  
  // Create jobs with linked materials
  for (let i = 0; i < testJobs.length; i++) {
    const job = testJobs[i];
    const linkedResume = createdResumes[i % createdResumes.length];
    const linkedCoverLetter = createdCoverLetters[i % createdCoverLetters.length];
    
    await Job.create({
      userId: TEST_USER_ID,
      ...job,
      linkedResumeId: linkedResume._id,
      materials: {
        resume: linkedResume.fileName,
        coverLetter: linkedCoverLetter.fileName,
      },
      statusHistory: [
        { status: 'Interested', timestamp: new Date(job.createdAt.getTime() - 86400000) },
        { status: 'Applied', timestamp: job.createdAt },
        ...(job.status !== 'Applied' && job.status !== 'Interested' ? [{ status: job.status, timestamp: new Date(job.createdAt.getTime() + 604800000) }] : []),
      ],
    });
    console.log(`  ✅ Created job: ${job.company} - ${job.title} (${job.status})`);
  }
  
  console.log('\n✅ Test data created successfully!');
  console.log(`\n📊 Summary:`);
  console.log(`   - ${testJobs.length} jobs`);
  console.log(`   - ${testResumes.length} resumes`);
  console.log(`   - ${testCoverLetters.length} cover letters`);
  console.log(`\n🔗 User ID: ${TEST_USER_ID}`);
  console.log('\n⚠️  Remember to run "node test_scripts/test-success-dashboard.js cleanup" when done!\n');
}

async function cleanupTestData() {
  console.log('\n🧹 Cleaning up test data...\n');
  
  // Delete test jobs
  const jobResult = await Job.deleteMany({ company: { $regex: TEST_MARKER } });
  console.log(`  ✅ Deleted ${jobResult.deletedCount} test jobs`);
  
  // Delete test resumes
  const resumeResult = await Resume.deleteMany({ fileName: { $regex: TEST_MARKER } });
  console.log(`  ✅ Deleted ${resumeResult.deletedCount} test resumes`);
  
  // Delete test cover letters
  const clResult = await CoverLetter.deleteMany({ fileName: { $regex: TEST_MARKER } });
  console.log(`  ✅ Deleted ${clResult.deletedCount} test cover letters`);
  
  console.log('\n✅ Cleanup complete!\n');
}

async function main() {
  const command = process.argv[2];
  
  if (!command || !['create', 'cleanup'].includes(command)) {
    console.log(`
Usage:
  node test_scripts/test-success-dashboard.js create   - Create test data
  node test_scripts/test-success-dashboard.js cleanup  - Remove test data
    `);
    process.exit(1);
  }
  
  await connectDB();
  
  if (command === 'create') {
    await createTestData();
  } else if (command === 'cleanup') {
    await cleanupTestData();
  }
  
  await mongoose.disconnect();
  console.log('👋 Disconnected from MongoDB');
}

main().catch(console.error);
