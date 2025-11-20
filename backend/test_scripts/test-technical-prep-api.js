import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';
const AUTH_TOKEN = 'your-jwt-token-here'; // Replace with actual token

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Authorization': `Bearer ${AUTH_TOKEN}`
  }
});

async function testTechnicalPrepAPI() {
  console.log('🚀 Testing Technical Prep API Endpoints\n');

  try {
    // Test 1: Get coding challenges
    console.log('1️⃣ Testing: GET /technical-prep/coding-challenges');
    const challenges = await api.get('/technical-prep/coding-challenges');
    console.log(`✅ Found ${challenges.data.total} coding challenges`);
    console.log(`   Sample: ${challenges.data.challenges[0]?.title}\n`);

    // Test 2: Get specific challenge
    if (challenges.data.challenges.length > 0) {
      const challengeId = challenges.data.challenges[0]._id;
      console.log(`2️⃣ Testing: GET /technical-prep/coding-challenges/${challengeId}`);
      const challenge = await api.get(`/technical-prep/coding-challenges/${challengeId}`);
      console.log(`✅ Loaded challenge: ${challenge.data.title}`);
      console.log(`   Difficulty: ${challenge.data.difficulty}`);
      console.log(`   Category: ${challenge.data.category}\n`);

      // Test 3: Submit solution
      console.log(`3️⃣ Testing: POST /technical-prep/coding-challenges/${challengeId}/submit`);
      const submission = await api.post(`/technical-prep/coding-challenges/${challengeId}/submit`, {
        code: 'function solution() { return []; }',
        language: 'javascript',
        timeSpent: 10,
        hintsUsed: []
      });
      console.log(`✅ Submission received`);
      console.log(`   Score: ${submission.data.results.passed}/${submission.data.results.total}`);
      console.log(`   Feedback: ${submission.data.results.feedback.substring(0, 60)}...\n`);
    }

    // Test 4: Get system design questions
    console.log('4️⃣ Testing: GET /technical-prep/system-design');
    const systemDesign = await api.get('/technical-prep/system-design');
    console.log(`✅ Found ${systemDesign.data.total} system design questions`);
    if (systemDesign.data.questions.length > 0) {
      console.log(`   Sample: ${systemDesign.data.questions[0]?.title}\n`);
    }

    // Test 5: Get case studies
    console.log('5️⃣ Testing: GET /technical-prep/case-studies');
    const caseStudies = await api.get('/technical-prep/case-studies');
    console.log(`✅ Found ${caseStudies.data.total} case studies`);
    if (caseStudies.data.caseStudies.length > 0) {
      console.log(`   Sample: ${caseStudies.data.caseStudies[0]?.title}\n`);
    }

    // Test 6: Get performance analytics
    console.log('6️⃣ Testing: GET /technical-prep/performance');
    const performance = await api.get('/technical-prep/performance');
    console.log(`✅ Performance data retrieved`);
    if (performance.data.performance) {
      console.log(`   Completed: ${performance.data.performance.totalChallengesCompleted}`);
      console.log(`   Average Score: ${Math.round(performance.data.performance.averageScore)}%\n`);
    }

    // Test 7: Bookmark a challenge
    if (challenges.data.challenges.length > 0) {
      console.log('7️⃣ Testing: POST /technical-prep/bookmark');
      const bookmark = await api.post('/technical-prep/bookmark', {
        challengeType: 'coding',
        challengeId: challenges.data.challenges[0]._id
      });
      console.log(`✅ Bookmark toggled: ${bookmark.data.bookmarked ? 'Added' : 'Removed'}\n`);
    }

    // Test 8: Get bookmarks
    console.log('8️⃣ Testing: GET /technical-prep/bookmarks');
    const bookmarks = await api.get('/technical-prep/bookmarks');
    console.log(`✅ Found ${bookmarks.data.challenges.length} bookmarked challenges\n`);

    // Test 9: Get technical prep profile
    console.log('9️⃣ Testing: GET /technical-prep/profile');
    const profile = await api.get('/technical-prep/profile');
    console.log(`✅ Profile retrieved`);
    console.log(`   Submissions: ${profile.data.submissions?.length || 0}\n`);

    console.log('✅ All API tests passed!\n');
    console.log('📊 Summary:');
    console.log(`   - Coding Challenges: ${challenges.data.total}`);
    console.log(`   - System Design: ${systemDesign.data.total}`);
    console.log(`   - Case Studies: ${caseStudies.data.total}`);
    console.log(`   - Bookmarks: ${bookmarks.data.challenges.length}`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

// Run tests
testTechnicalPrepAPI();
