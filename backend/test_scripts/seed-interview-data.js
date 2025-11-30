/**
 * Seed Interview Data Script
 * Generates realistic fake interview data for testing analytics
 * 
 * USAGE:
 * 1. Login to the app and get your userId from browser console:
 *    - Open dev tools (F12)
 *    - Type: localStorage.getItem('clerk-db-jwt')
 *    - Decode the JWT at jwt.io and copy the 'sub' field (your userId)
 * 2. Set your userId below or as environment variable
 * 3. Run: node test_scripts/seed-interview-data.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { Interview } from '../src/models/Interview.js';
import { Job } from '../src/models/Job.js';
import { MockInterviewSession } from '../src/models/MockInterviewSession.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env') });

// SET YOUR USER ID HERE (get from Clerk after logging in)
const USER_ID = process.env.TEST_USER_ID || 'YOUR_CLERK_USER_ID_HERE';

// Configuration
const CONFIG = {
  totalInterviews: 25,        // Total interviews to create
  completedPercentage: 0.75,  // 75% of interviews completed
  successPercentage: 0.45,    // 45% success rate (industry avg is 40%)
  offerPercentage: 0.30,      // 30% offer rate (industry avg is 25%)
  mockSessions: 8,            // Number of mock interview sessions
};

const COMPANIES = [
  { name: 'Google', industry: 'Technology' },
  { name: 'Microsoft', industry: 'Technology' },
  { name: 'Amazon', industry: 'Technology' },
  { name: 'Meta', industry: 'Technology' },
  { name: 'Goldman Sachs', industry: 'Finance' },
  { name: 'JPMorgan Chase', industry: 'Finance' },
  { name: 'Morgan Stanley', industry: 'Finance' },
  { name: 'McKinsey & Company', industry: 'Consulting' },
  { name: 'Boston Consulting Group', industry: 'Consulting' },
  { name: 'Deloitte', industry: 'Consulting' },
  { name: 'Mayo Clinic', industry: 'Healthcare' },
  { name: 'Kaiser Permanente', industry: 'Healthcare' },
  { name: 'Tesla', industry: 'Manufacturing' },
  { name: 'SpaceX', industry: 'Manufacturing' },
  { name: 'Nike', industry: 'Retail' },
  { name: 'Target', industry: 'Retail' },
  { name: 'Stanford University', industry: 'Education' },
  { name: 'HubSpot', industry: 'Marketing' },
];

const JOB_TITLES = {
  Technology: ['Software Engineer', 'Senior Developer', 'Full Stack Engineer', 'DevOps Engineer', 'Product Manager'],
  Finance: ['Financial Analyst', 'Investment Banker', 'Quantitative Analyst', 'Risk Manager', 'Portfolio Manager'],
  Consulting: ['Management Consultant', 'Strategy Consultant', 'Business Analyst', 'Senior Consultant'],
  Healthcare: ['Healthcare Administrator', 'Clinical Data Analyst', 'Medical Researcher', 'Health IT Specialist'],
  Manufacturing: ['Manufacturing Engineer', 'Process Engineer', 'Quality Engineer', 'Supply Chain Manager'],
  Retail: ['Store Manager', 'Merchandising Manager', 'E-commerce Manager', 'Retail Analyst'],
  Education: ['Academic Advisor', 'Curriculum Developer', 'Education Technology Specialist'],
  Marketing: ['Marketing Manager', 'Digital Marketing Specialist', 'Content Strategist', 'Marketing Analyst'],
};

const INTERVIEW_TYPES = [
  'Phone Screen',
  'Video Call',
  'In-Person',
  'Technical',
  'Behavioral',
  'Final Round',
  'Panel',
];

const OUTCOMES = {
  successful: ['Passed', 'Moved to Next Round', 'Offer Extended'],
  unsuccessful: ['Failed', 'Waiting for Feedback'],
};

const LOCATIONS = [
  'Mountain View, CA',
  'Seattle, WA',
  'New York, NY',
  'San Francisco, CA',
  'Austin, TX',
  'Boston, MA',
  'Chicago, IL',
  'Remote',
];

function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysAgo, daysFromNow = 0) {
  const start = new Date();
  start.setDate(start.getDate() - daysAgo);
  
  const end = new Date();
  end.setDate(end.getDate() + daysFromNow);
  
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function createJobs(userId) {
  console.log('\n📋 Creating job postings...');
  
  const jobs = [];
  
  for (let i = 0; i < COMPANIES.length; i++) {
    const company = COMPANIES[i];
    const titles = JOB_TITLES[company.industry];
    const title = randomItem(titles);
    
    const job = await Job.create({
      userId,
      company: company.name,
      position: title,
      status: 'Interview',
      industry: company.industry,
      location: randomItem(LOCATIONS),
      jobType: 'Full-time',
      workMode: randomItem(['Remote', 'Hybrid', 'On-site']),
      salary: {
        min: randomInt(80, 120) * 1000,
        max: randomInt(130, 200) * 1000,
        currency: 'USD',
      },
      applicationDate: randomDate(90, 0),
      url: `https://careers.${company.name.toLowerCase().replace(/\s+/g, '')}.com/jobs/${randomInt(10000, 99999)}`,
      statusHistory: [
        { status: 'Interested', timestamp: randomDate(100, 0) },
        { status: 'Applied', timestamp: randomDate(85, 0) },
        { status: 'Interview', timestamp: randomDate(60, 0) },
      ],
    });
    
    jobs.push(job);
  }
  
  console.log(`✅ Created ${jobs.length} job postings`);
  return jobs;
}

async function createMockSessions(userId) {
  console.log('\n🎭 Creating mock interview sessions...');
  
  const sessions = [];
  
  for (let i = 0; i < CONFIG.mockSessions; i++) {
    const daysAgo = randomInt(5, 120);
    const session = await MockInterviewSession.create({
      userId,
      interviewType: randomItem(['Behavioral', 'Technical', 'Case Study']),
      difficulty: randomItem(['Easy', 'Medium', 'Hard']),
      status: 'Completed',
      duration: randomInt(30, 60),
      scheduledDate: randomDate(daysAgo),
      completedDate: randomDate(daysAgo),
      feedback: {
        overallRating: randomInt(3, 5),
        strengths: ['Good communication', 'Clear thinking', 'Strong examples'],
        improvements: ['More specific answers', 'Better time management'],
        notes: 'Good progress, keep practicing!',
      },
      questions: [
        { question: 'Tell me about yourself', answered: true, rating: randomInt(3, 5) },
        { question: 'Why do you want this role?', answered: true, rating: randomInt(3, 5) },
        { question: 'Describe a challenging project', answered: true, rating: randomInt(3, 5) },
      ],
    });
    
    sessions.push(session);
  }
  
  console.log(`✅ Created ${sessions.length} mock interview sessions`);
  return sessions;
}

async function createInterviews(userId, jobs) {
  console.log('\n📅 Creating interview records...');
  
  const interviews = [];
  const totalToCreate = Math.min(CONFIG.totalInterviews, jobs.length);
  const completedCount = Math.floor(totalToCreate * CONFIG.completedPercentage);
  
  for (let i = 0; i < totalToCreate; i++) {
    const job = jobs[i % jobs.length];
    const isCompleted = i < completedCount;
    const daysAgo = isCompleted ? randomInt(5, 150) : 0;
    const scheduledDate = isCompleted ? randomDate(daysAgo) : randomDate(0, randomInt(1, 30));
    
    // Determine outcome
    let outcome = null;
    let status = 'Scheduled';
    
    if (isCompleted) {
      status = 'Completed';
      const rand = Math.random();
      
      if (rand < CONFIG.offerPercentage) {
        outcome = {
          result: 'Offer Extended',
          rating: randomInt(4, 5),
          notes: 'Excellent performance! Received offer with competitive package.',
          feedback: 'Strong technical skills and great cultural fit.',
        };
      } else if (rand < CONFIG.successPercentage) {
        outcome = {
          result: randomItem(['Passed', 'Moved to Next Round']),
          rating: randomInt(3, 5),
          notes: 'Interview went well, moving forward in the process.',
          feedback: 'Good responses, showed enthusiasm for the role.',
        };
      } else {
        outcome = {
          result: randomItem(['Failed', 'Waiting for Feedback']),
          rating: randomInt(2, 3),
          notes: 'Could improve on technical questions.',
          feedback: 'Need more preparation in certain areas.',
        };
      }
    }
    
    const interviewType = randomItem(INTERVIEW_TYPES);
    const duration = interviewType === 'Phone Screen' ? 30 : 
                    interviewType === 'Technical' ? 90 : 
                    60;
    
    const interview = await Interview.create({
      userId,
      jobId: job._id,
      title: `${interviewType} - ${job.position}`,
      company: job.company,
      interviewType,
      scheduledDate,
      duration,
      location: job.workMode === 'Remote' ? 'Remote/Virtual' : job.location,
      meetingLink: interviewType === 'Video Call' ? `https://zoom.us/j/${randomInt(1000000000, 9999999999)}` : null,
      interviewer: {
        name: `${randomItem(['Sarah', 'John', 'Emily', 'Michael', 'Lisa', 'David'])} ${randomItem(['Smith', 'Johnson', 'Williams', 'Brown', 'Jones'])}`,
        title: randomItem(['Senior Engineer', 'Engineering Manager', 'HR Manager', 'Team Lead', 'Director']),
        email: `interviewer${randomInt(1, 100)}@${job.company.toLowerCase().replace(/\s+/g, '')}.com`,
      },
      status,
      outcome,
      preparationTasks: [
        {
          title: 'Research the company',
          description: 'Review company website and recent news',
          completed: true,
          priority: 'High',
          dueDate: new Date(scheduledDate.getTime() - 2 * 24 * 60 * 60 * 1000),
        },
        {
          title: 'Review job description',
          description: 'Understand role requirements',
          completed: isCompleted,
          priority: 'High',
          dueDate: new Date(scheduledDate.getTime() - 2 * 24 * 60 * 60 * 1000),
        },
        {
          title: 'Prepare questions',
          description: 'Think of thoughtful questions to ask',
          completed: isCompleted,
          priority: 'Medium',
          dueDate: new Date(scheduledDate.getTime() - 1 * 24 * 60 * 60 * 1000),
        },
      ],
      notes: isCompleted ? 'Interview completed. See outcome for details.' : 'Looking forward to this interview!',
      history: [
        {
          action: 'Created',
          timestamp: new Date(scheduledDate.getTime() - 5 * 24 * 60 * 60 * 1000),
          notes: 'Interview scheduled',
        },
        ...(isCompleted ? [{
          action: 'Completed',
          timestamp: scheduledDate,
          notes: 'Interview completed',
        }] : []),
      ],
    });
    
    interviews.push(interview);
  }
  
  console.log(`✅ Created ${interviews.length} interview records`);
  console.log(`   - Completed: ${completedCount} (${Math.round(CONFIG.completedPercentage * 100)}%)`);
  console.log(`   - Scheduled: ${totalToCreate - completedCount}`);
  
  return interviews;
}

async function generateStatistics(interviews) {
  console.log('\n📊 Interview Statistics:');
  console.log('='.repeat(60));
  
  const completed = interviews.filter(i => i.status === 'Completed');
  const successful = completed.filter(i => 
    i.outcome?.result === 'Passed' || 
    i.outcome?.result === 'Moved to Next Round' || 
    i.outcome?.result === 'Offer Extended'
  );
  const offers = completed.filter(i => i.outcome?.result === 'Offer Extended');
  
  console.log(`Total Interviews: ${interviews.length}`);
  console.log(`Completed: ${completed.length} (${Math.round(completed.length / interviews.length * 100)}%)`);
  console.log(`Successful: ${successful.length} (${Math.round(successful.length / completed.length * 100)}% of completed)`);
  console.log(`Offers: ${offers.length} (${Math.round(offers.length / completed.length * 100)}% of completed)`);
  
  // By Type
  console.log('\nBy Interview Type:');
  const byType = {};
  interviews.forEach(i => {
    byType[i.interviewType] = (byType[i.interviewType] || 0) + 1;
  });
  Object.entries(byType).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });
  
  // By Industry
  console.log('\nBy Industry:');
  const byIndustry = {};
  for (const interview of interviews) {
    const job = await Job.findById(interview.jobId);
    if (job) {
      byIndustry[job.industry] = (byIndustry[job.industry] || 0) + 1;
    }
  }
  Object.entries(byIndustry).sort((a, b) => b[1] - a[1]).forEach(([industry, count]) => {
    console.log(`  ${industry}: ${count}`);
  });
}

async function seedData() {
  try {
    console.log('🌱 Starting Interview Data Seeding Process');
    console.log('='.repeat(60));
    
    if (USER_ID === 'YOUR_CLERK_USER_ID_HERE') {
      console.error('\n❌ ERROR: USER_ID not set!');
      console.log('\n📝 How to get your USER_ID:');
      console.log('1. Login to the app (http://localhost:5173)');
      console.log('2. Open browser dev tools (F12)');
      console.log('3. Go to Console tab');
      console.log('4. Type: localStorage.getItem("clerk-db-jwt")');
      console.log('5. Copy the JWT token');
      console.log('6. Go to https://jwt.io and paste the token');
      console.log('7. In the decoded payload, copy the "sub" field value');
      console.log('8. Set it in this script: const USER_ID = "your_sub_value_here"');
      console.log('\nOr set as environment variable: TEST_USER_ID=your_sub_value node test_scripts/seed-interview-data.js');
      process.exit(1);
    }
    
    console.log(`\n👤 User ID: ${USER_ID}`);
    console.log(`📊 Config: ${CONFIG.totalInterviews} interviews, ${CONFIG.mockSessions} mock sessions`);
    
    // Connect to MongoDB
    console.log('\n🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');
    
    // Clear existing data for this user (optional - comment out if you want to keep existing data)
    console.log('\n🗑️  Clearing existing test data...');
    await Interview.deleteMany({ userId: USER_ID });
    await Job.deleteMany({ userId: USER_ID });
    await MockInterviewSession.deleteMany({ userId: USER_ID });
    console.log('✅ Cleared old data');
    
    // Create data
    const jobs = await createJobs(USER_ID);
    const mockSessions = await createMockSessions(USER_ID);
    const interviews = await createInterviews(USER_ID, jobs);
    
    // Show statistics
    await generateStatistics(interviews);
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Data seeding completed successfully!');
    console.log('='.repeat(60));
    console.log('\n📍 Next Steps:');
    console.log('1. Go to http://localhost:5173/interviews/analytics');
    console.log('2. Explore all 5 tabs (Overview, Conversion, Performance, Insights, Recommendations)');
    console.log('3. Check different metrics and insights');
    console.log('4. View personalized recommendations');
    console.log('\n✨ Your analytics dashboard should now be populated with data!');
    
  } catch (error) {
    console.error('\n❌ Error seeding data:', error);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDB disconnected');
  }
}

// Run the seeder
seedData();
