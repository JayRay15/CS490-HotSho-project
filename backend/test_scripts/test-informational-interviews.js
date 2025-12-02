/**
 * Test script for Informational Interview endpoints
 * Run with: node test_scripts/test-informational-interviews.js
 */

import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const TEST_TOKEN = process.env.TEST_CLERK_TOKEN || 'your_test_token_here';

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: {
    'Authorization': `Bearer ${TEST_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

async function testInformationalInterviews() {
  console.log('🧪 Testing Informational Interview Feature\n');

  try {
    // Test 1: Create an informational interview
    console.log('1️⃣ Creating informational interview...');
    const createResponse = await api.post('/informational-interviews', {
      candidateName: 'John Doe',
      targetRole: 'Senior Software Engineer',
      targetCompany: 'Tech Corp',
      candidateEmail: 'john@techcorp.com',
      status: 'Identified'
    });
    console.log('✅ Created:', createResponse.data.data.interview._id);
    const interviewId = createResponse.data.data.interview._id;

    // Test 2: Generate outreach email
    console.log('\n2️⃣ Generating outreach email...');
    const outreachResponse = await api.post('/informational-interviews/generate-outreach', {
      candidateName: 'John Doe',
      targetRole: 'Senior Software Engineer',
      targetCompany: 'Tech Corp',
      userBackground: 'Recent CS graduate',
      userGoal: 'Learn about career path in software engineering'
    });
    console.log('✅ Outreach generated:', outreachResponse.data.data.outreachContent.substring(0, 100) + '...');

    // Test 3: Generate preparation framework
    console.log('\n3️⃣ Generating preparation framework...');
    const prepResponse = await api.post('/informational-interviews/generate-preparation', {
      targetRole: 'Senior Software Engineer',
      targetCompany: 'Tech Corp',
      candidateName: 'John Doe'
    });
    console.log('✅ Preparation generated:', prepResponse.data.data.preparation);

    // Test 4: Update with interview date
    console.log('\n4️⃣ Scheduling interview...');
    const scheduleResponse = await api.put(`/informational-interviews/${interviewId}`, {
      status: 'Scheduled',
      dates: {
        interviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      }
    });
    console.log('✅ Interview scheduled');

    // Test 5: Record outcomes
    console.log('\n5️⃣ Recording outcomes...');
    const outcomeResponse = await api.put(`/informational-interviews/${interviewId}`, {
      status: 'Completed',
      outcomes: {
        keyLearnings: 'Learned about career progression in software engineering',
        industryInsights: 'AI and cloud computing are key trends',
        referralObtained: true,
        referralDetails: 'Referred to hiring manager for open position',
        connectionQuality: 'Strong'
      }
    });
    console.log('✅ Outcomes recorded, Impact Score:', outcomeResponse.data.data.interview.impactScore);

    // Test 6: Generate follow-up email
    console.log('\n6️⃣ Generating follow-up email...');
    const followUpResponse = await api.post('/informational-interviews/generate-follow-up', {
      candidateName: 'John Doe',
      targetRole: 'Senior Software Engineer',
      keyLearnings: 'Career progression insights',
      referralObtained: true
    });
    console.log('✅ Follow-up generated:', followUpResponse.data.data.followUpContent.substring(0, 100) + '...');

    // Test 7: Get all interviews
    console.log('\n7️⃣ Fetching all interviews...');
    const listResponse = await api.get('/informational-interviews');
    console.log('✅ Found', listResponse.data.data.interviews.length, 'interviews');

    // Test 8: Get analytics
    console.log('\n8️⃣ Fetching analytics...');
    const analyticsResponse = await api.get('/informational-interviews/analytics');
    console.log('✅ Analytics:', analyticsResponse.data.data.analytics);

    // Test 9: Delete interview
    console.log('\n9️⃣ Deleting test interview...');
    await api.delete(`/informational-interviews/${interviewId}`);
    console.log('✅ Interview deleted');

    console.log('\n🎉 All tests passed!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    console.error('Error details:', error.response?.data?.error || error.stack);
  }
}

// Run tests
testInformationalInterviews();
