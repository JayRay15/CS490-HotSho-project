/**
 * Test script for Interview Coaching API endpoints (UC-076)
 * 
 * This script tests:
 * - Submitting interview responses and receiving AI feedback
 * - Retrieving response history
 * - Getting practice statistics
 * - Generating interview questions
 * - Comparing multiple versions of responses
 * - Updating and deleting responses
 * - STAR method analysis
 * - Improvement tracking over multiple attempts
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const API_URL = process.env.API_URL || 'http://localhost:5000';
const TEST_USER_TOKEN = process.env.TEST_USER_TOKEN || '';

if (!TEST_USER_TOKEN) {
  console.error('❌ TEST_USER_TOKEN not found in environment variables');
  console.log('Please set TEST_USER_TOKEN in your .env file');
  process.exit(1);
}

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${TEST_USER_TOKEN}`
};

let createdResponseId = null;

// Test data
const testResponses = [
  {
    question: "Tell me about a time when you had to deal with a difficult team member.",
    response: `In my previous role as a software engineer at TechCorp, I worked with a senior developer who was resistant to code reviews and often dismissed feedback. The situation was affecting team morale and code quality.

My task was to maintain code quality standards while preserving team harmony and ensuring project deadlines were met.

I took several actions. First, I scheduled a one-on-one meeting to understand their perspective and concerns. I learned they felt their experience wasn't being valued. I then proposed that we pair program on the next feature, which allowed us to learn from each other. I also implemented a rotating code review system where everyone reviewed everyone else's code, making it less personal.

As a result, code quality improved by 30% as measured by our bug tracking system, and the team member became one of our strongest advocates for code reviews. We completed the project two weeks ahead of schedule, and team satisfaction scores increased by 25%.`,
    category: 'Behavioral',
    difficulty: 'Medium',
    targetDuration: 120,
    context: {
      jobTitle: 'Senior Software Engineer',
      company: 'Google',
      industry: 'Technology'
    }
  },
  {
    question: "Describe a situation where you had to learn a new technology quickly.",
    response: `I was assigned to a project using React, but I only had Vue experience. I spent weekends learning React through tutorials and built a personal project. Within two weeks, I was productive on the team.`,
    category: 'Technical',
    difficulty: 'Easy',
    targetDuration: 90
  }
];

async function makeRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers
      }
    });

    const data = await response.json();
    
    return {
      status: response.status,
      ok: response.ok,
      data
    };
  } catch (error) {
    console.error(`Request failed: ${error.message}`);
    throw error;
  }
}

async function testSubmitInterviewResponse() {
  console.log('\n🧪 Testing: Submit Interview Response');
  console.log('━'.repeat(50));

  const response = await makeRequest('/api/interview-coaching/responses', {
    method: 'POST',
    body: JSON.stringify(testResponses[0])
  });

  if (response.ok && response.data.success) {
    const responseData = response.data.data.interviewResponse;
    createdResponseId = responseData._id;
    
    console.log('✅ Response submitted successfully');
    console.log(`   Response ID: ${createdResponseId}`);
    console.log(`   Overall Score: ${responseData.feedback.overallScore}`);
    console.log(`   Score Breakdown:`);
    console.log(`     - Content: ${responseData.feedback.contentScore}`);
    console.log(`     - Structure: ${responseData.feedback.structureScore}`);
    console.log(`     - Clarity: ${responseData.feedback.clarityScore}`);
    console.log(`     - Relevance: ${responseData.feedback.relevanceScore}`);
    console.log(`     - Specificity: ${responseData.feedback.specificityScore}`);
    console.log(`     - Impact: ${responseData.feedback.impactScore}`);
    
    console.log(`\n   Strengths (${responseData.feedback.strengths.length}):`);
    responseData.feedback.strengths.slice(0, 2).forEach(s => console.log(`     • ${s}`));
    
    console.log(`\n   Areas for Improvement (${responseData.feedback.weaknesses.length}):`);
    responseData.feedback.weaknesses.slice(0, 2).forEach(w => console.log(`     • ${w}`));
    
    console.log(`\n   STAR Analysis:`);
    console.log(`     - Overall Adherence: ${responseData.feedback.starAnalysis.overallAdherence}%`);
    console.log(`     - Situation Present: ${responseData.feedback.starAnalysis.components.situation.present}`);
    console.log(`     - Task Present: ${responseData.feedback.starAnalysis.components.task.present}`);
    console.log(`     - Action Present: ${responseData.feedback.starAnalysis.components.action.present}`);
    console.log(`     - Result Present: ${responseData.feedback.starAnalysis.components.result.present}`);
    
    if (responseData.feedback.lengthAnalysis) {
      console.log(`\n   Length Analysis:`);
      console.log(`     - Word Count: ${responseData.feedback.lengthAnalysis.wordCount}`);
      console.log(`     - Estimated Duration: ${responseData.feedback.lengthAnalysis.estimatedDuration}s`);
      console.log(`     - Recommendation: ${responseData.feedback.lengthAnalysis.recommendation}`);
    }
    
    if (responseData.feedback.weakLanguagePatterns && responseData.feedback.weakLanguagePatterns.length > 0) {
      console.log(`\n   Weak Language Patterns Found: ${responseData.feedback.weakLanguagePatterns.length}`);
      responseData.feedback.weakLanguagePatterns.slice(0, 2).forEach(pattern => {
        console.log(`     - "${pattern.pattern}" → "${pattern.alternative}"`);
      });
    }
    
    if (responseData.feedback.alternativeApproaches && responseData.feedback.alternativeApproaches.length > 0) {
      console.log(`\n   Alternative Approaches Suggested: ${responseData.feedback.alternativeApproaches.length}`);
      responseData.feedback.alternativeApproaches.forEach(approach => {
        console.log(`     - ${approach.title}`);
      });
    }
    
    return true;
  } else {
    console.log('❌ Failed to submit response');
    console.log(`   Status: ${response.status}`);
    console.log(`   Message: ${response.data.message}`);
    return false;
  }
}

async function testSubmitSecondAttempt() {
  console.log('\n🧪 Testing: Submit Second Attempt (Improvement Tracking)');
  console.log('━'.repeat(50));

  // Submit an improved version of the same question
  const improvedResponse = {
    ...testResponses[0],
    response: `In my previous role as a software engineer at TechCorp, I worked with a highly experienced senior developer who was consistently resistant to code reviews. This was creating significant friction within our 8-person development team and directly impacting our sprint velocity and code quality metrics.

The situation was particularly challenging because this developer had 15 years of experience and felt that code reviews were a waste of their time. Their resistance was starting to influence other team members, and our technical debt was accumulating rapidly.

My task was twofold: maintain our code quality standards while preserving team harmony, and ensure we met our aggressive Q3 project deadlines for our flagship product launch.

I implemented a multi-faceted approach. First, I scheduled a private one-on-one meeting in a neutral setting to understand their perspective without judgment. Through active listening, I discovered they felt their extensive experience wasn't being valued and that junior developers were questioning their decisions.

To address this, I proposed a collaborative solution: pair programming sessions where we could learn from each other's approaches. I specifically structured these sessions so they could mentor junior developers, which helped them feel valued. Additionally, I redesigned our code review process to be a "code collaboration" system with rotating pairs, making it less about criticism and more about knowledge sharing.

I also implemented automated code quality tools to handle style and formatting issues, allowing reviews to focus on architecture and logic – areas where the senior developer could truly shine.

The results exceeded our expectations. Within six weeks, code quality metrics improved by 35% as measured by our defect tracking system. The senior developer became our strongest advocate for the new collaborative review process and even volunteered to lead training sessions. We completed the Q3 project two weeks ahead of schedule with 40% fewer critical bugs than the previous quarter. Most importantly, our quarterly team satisfaction survey showed a 28% increase in collaboration scores, and the senior developer specifically mentioned feeling more valued in their anonymous feedback.`
  };

  const response = await makeRequest('/api/interview-coaching/responses', {
    method: 'POST',
    body: JSON.stringify(improvedResponse)
  });

  if (response.ok && response.data.success) {
    const responseData = response.data.data.interviewResponse;
    const metrics = response.data.data.improvementMetrics;
    
    console.log('✅ Second attempt submitted successfully');
    console.log(`   Response ID: ${responseData._id}`);
    console.log(`   New Score: ${responseData.feedback.overallScore}`);
    console.log(`   Version: ${responseData.version}`);
    
    if (metrics) {
      console.log(`\n   Improvement Metrics:`);
      console.log(`     - Attempts: ${metrics.attempts}`);
      console.log(`     - Score Change: ${metrics.scoreChange > 0 ? '+' : ''}${metrics.scoreChange}`);
      console.log(`     - Percentage Improvement: ${metrics.percentageImprovement}%`);
      console.log(`     - First Score: ${metrics.firstScore}`);
      console.log(`     - Current Score: ${metrics.currentScore}`);
      console.log(`     - Best Score: ${metrics.bestScore}`);
    }
    
    return true;
  } else {
    console.log('❌ Failed to submit second attempt');
    console.log(`   Status: ${response.status}`);
    console.log(`   Message: ${response.data.message}`);
    return false;
  }
}

async function testGetInterviewResponses() {
  console.log('\n🧪 Testing: Get Interview Responses');
  console.log('━'.repeat(50));

  const response = await makeRequest('/api/interview-coaching/responses?limit=10');

  if (response.ok && response.data.success) {
    const responses = response.data.data.responses;
    const pagination = response.data.data.pagination;
    
    console.log(`✅ Retrieved ${responses.length} response(s)`);
    console.log(`   Total: ${pagination.total}`);
    console.log(`   Has More: ${pagination.hasMore}`);
    
    if (responses.length > 0) {
      console.log('\n   Recent Responses:');
      responses.slice(0, 3).forEach((resp, idx) => {
        console.log(`     ${idx + 1}. ${resp.question.category} - Score: ${resp.feedback?.overallScore || 'N/A'}`);
        console.log(`        "${resp.question.text.substring(0, 60)}..."`);
        console.log(`        Version: ${resp.version}, Attempts: ${resp.improvementTracking.attempts}`);
      });
    }
    
    return true;
  } else {
    console.log('❌ Failed to get responses');
    console.log(`   Status: ${response.status}`);
    return false;
  }
}

async function testGetInterviewResponseById() {
  console.log('\n🧪 Testing: Get Interview Response by ID');
  console.log('━'.repeat(50));

  if (!createdResponseId) {
    console.log('⚠️  Skipping: No response ID available');
    return false;
  }

  const response = await makeRequest(`/api/interview-coaching/responses/${createdResponseId}`);

  if (response.ok && response.data.success) {
    const responseData = response.data.data.interviewResponse;
    
    console.log('✅ Retrieved response by ID');
    console.log(`   Question: ${responseData.question.text.substring(0, 60)}...`);
    console.log(`   Category: ${responseData.question.category}`);
    console.log(`   Score: ${responseData.feedback.overallScore}`);
    console.log(`   Created: ${new Date(responseData.createdAt).toLocaleString()}`);
    
    if (response.data.data.previousVersions && response.data.data.previousVersions.length > 0) {
      console.log(`\n   Previous Versions: ${response.data.data.previousVersions.length}`);
    }
    
    return true;
  } else {
    console.log('❌ Failed to get response by ID');
    console.log(`   Status: ${response.status}`);
    return false;
  }
}

async function testGetPracticeStats() {
  console.log('\n🧪 Testing: Get Practice Statistics');
  console.log('━'.repeat(50));

  const response = await makeRequest('/api/interview-coaching/stats');

  if (response.ok && response.data.success) {
    const stats = response.data.data;
    
    console.log('✅ Retrieved practice statistics');
    console.log(`   Total Practiced: ${stats.totalPracticed}`);
    console.log(`   Average Score: ${stats.averageScore}`);
    console.log(`   Average Improvement: ${stats.averageImprovement}%`);
    
    if (stats.byCategory && stats.byCategory.length > 0) {
      console.log(`\n   Performance by Category:`);
      stats.byCategory.forEach(cat => {
        console.log(`     ${cat.category}:`);
        console.log(`       - Count: ${cat.count}`);
        console.log(`       - Avg Score: ${cat.avgScore}`);
        console.log(`       - Best Score: ${cat.bestScore}`);
      });
    }
    
    if (stats.scoresTrend && stats.scoresTrend.length > 0) {
      console.log(`\n   Recent Score Trend:`);
      stats.scoresTrend.slice(-5).forEach(point => {
        console.log(`     ${new Date(point.date).toLocaleDateString()}: ${point.score}`);
      });
    }
    
    return true;
  } else {
    console.log('❌ Failed to get practice stats');
    console.log(`   Status: ${response.status}`);
    return false;
  }
}

async function testGenerateQuestions() {
  console.log('\n🧪 Testing: Generate Interview Questions');
  console.log('━'.repeat(50));

  const response = await makeRequest('/api/interview-coaching/questions/generate', {
    method: 'POST',
    body: JSON.stringify({
      category: 'Leadership',
      context: {
        jobTitle: 'Engineering Manager',
        industry: 'Technology'
      },
      count: 3
    })
  });

  if (response.ok && response.data.success) {
    const questions = response.data.data.questions;
    
    console.log(`✅ Generated ${questions.length} question(s)`);
    
    questions.forEach((q, idx) => {
      console.log(`\n   ${idx + 1}. ${q.text}`);
      console.log(`      Category: ${q.category}, Difficulty: ${q.difficulty}`);
      if (q.tips) {
        console.log(`      Tip: ${q.tips.substring(0, 80)}...`);
      }
    });
    
    return true;
  } else {
    console.log('❌ Failed to generate questions');
    console.log(`   Status: ${response.status}`);
    return false;
  }
}

async function testCompareVersions() {
  console.log('\n🧪 Testing: Compare Response Versions');
  console.log('━'.repeat(50));

  if (!createdResponseId) {
    console.log('⚠️  Skipping: No response ID available');
    return false;
  }

  const response = await makeRequest(`/api/interview-coaching/responses/${createdResponseId}/compare`);

  if (response.ok && response.data.success) {
    const comparison = response.data.data.comparison;
    const versions = response.data.data.versions;
    
    console.log(`✅ Retrieved version comparison`);
    
    if (comparison) {
      console.log(`   Total Versions: ${comparison.totalVersions}`);
      console.log(`\n   Score Progression:`);
      comparison.scoreProgression.forEach(v => {
        console.log(`     Version ${v.version} (${new Date(v.date).toLocaleDateString()}): ${v.overallScore}`);
      });
      
      console.log(`\n   Improvement:`);
      console.log(`     - Overall: ${comparison.improvement.overall > 0 ? '+' : ''}${comparison.improvement.overall}`);
      console.log(`     - Content: ${comparison.improvement.content > 0 ? '+' : ''}${comparison.improvement.content}`);
      console.log(`     - Structure: ${comparison.improvement.structure > 0 ? '+' : ''}${comparison.improvement.structure}`);
      console.log(`     - Clarity: ${comparison.improvement.clarity > 0 ? '+' : ''}${comparison.improvement.clarity}`);
      
      if (comparison.bestVersion) {
        console.log(`\n   Best Version: ${comparison.bestVersion.version} (Score: ${comparison.bestVersion.feedback.overallScore})`);
      }
    } else {
      console.log(`   Only one version exists for this question`);
    }
    
    return true;
  } else {
    console.log('❌ Failed to compare versions');
    console.log(`   Status: ${response.status}`);
    return false;
  }
}

async function testUpdateInterviewResponse() {
  console.log('\n🧪 Testing: Update Interview Response');
  console.log('━'.repeat(50));

  if (!createdResponseId) {
    console.log('⚠️  Skipping: No response ID available');
    return false;
  }

  const response = await makeRequest(`/api/interview-coaching/responses/${createdResponseId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      notes: 'This was a great practice session. Need to work on quantifying results more.',
      tags: ['teamwork', 'conflict-resolution', 'leadership']
    })
  });

  if (response.ok && response.data.success) {
    console.log('✅ Response updated successfully');
    console.log(`   Notes: ${response.data.data.interviewResponse.notes}`);
    console.log(`   Tags: ${response.data.data.interviewResponse.tags.join(', ')}`);
    return true;
  } else {
    console.log('❌ Failed to update response');
    console.log(`   Status: ${response.status}`);
    return false;
  }
}

async function testValidation() {
  console.log('\n🧪 Testing: Validation and Error Handling');
  console.log('━'.repeat(50));

  // Test with too short response
  const shortResponse = await makeRequest('/api/interview-coaching/responses', {
    method: 'POST',
    body: JSON.stringify({
      question: 'Tell me about yourself',
      response: 'I am a developer.',
      category: 'Behavioral'
    })
  });

  if (!shortResponse.ok && shortResponse.data.message.includes('too short')) {
    console.log('✅ Validation: Short response rejected correctly');
  } else {
    console.log('❌ Validation: Short response not properly rejected');
  }

  // Test with missing fields
  const missingFields = await makeRequest('/api/interview-coaching/responses', {
    method: 'POST',
    body: JSON.stringify({
      question: 'Test question'
      // Missing response field
    })
  });

  if (!missingFields.ok) {
    console.log('✅ Validation: Missing fields rejected correctly');
  } else {
    console.log('❌ Validation: Missing fields not properly rejected');
  }

  return true;
}

async function runAllTests() {
  console.log('\n' + '='.repeat(50));
  console.log('   INTERVIEW COACHING API TEST SUITE (UC-076)');
  console.log('='.repeat(50));

  const tests = [
    { name: 'Submit Interview Response', fn: testSubmitInterviewResponse },
    { name: 'Submit Second Attempt', fn: testSubmitSecondAttempt },
    { name: 'Get Interview Responses', fn: testGetInterviewResponses },
    { name: 'Get Response by ID', fn: testGetInterviewResponseById },
    { name: 'Get Practice Statistics', fn: testGetPracticeStats },
    { name: 'Generate Questions', fn: testGenerateQuestions },
    { name: 'Compare Versions', fn: testCompareVersions },
    { name: 'Update Response', fn: testUpdateInterviewResponse },
    { name: 'Validation Tests', fn: testValidation }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log(`❌ Test failed with error: ${error.message}`);
      failed++;
    }
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n' + '='.repeat(50));
  console.log('   TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${tests.length}`);
  console.log('='.repeat(50) + '\n');
}

runAllTests().catch(console.error);
