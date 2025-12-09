/**
 * UC-124: Job Application Timing Optimizer - Test Script
 * 
 * This script tests the timing optimization functionality
 */

import axios from 'axios';

const API_BASE_URL = process.env.BACKEND_URL || 'http://localhost:5000/api';

// Get auth token from command line or environment
const AUTH_TOKEN = process.argv[2] || process.env.TEST_AUTH_TOKEN;

if (!AUTH_TOKEN) {
  console.error('❌ Please provide an auth token as argument or TEST_AUTH_TOKEN env variable');
  console.error('Usage: node test-timing-optimizer.js <auth-token>');
  process.exit(1);
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

async function testTimingOptimizer() {
  console.log('🧪 Testing UC-124: Job Application Timing Optimizer\n');

  try {
    // Step 1: Get user's jobs
    console.log('1️⃣ Fetching user jobs...');
    const jobsResponse = await api.get('/jobs');
    const jobs = jobsResponse.data;
    
    if (!jobs || jobs.length === 0) {
      console.error('❌ No jobs found. Please create a job first.');
      return;
    }

    const testJob = jobs[0];
    console.log(`✅ Found job: ${testJob.title} at ${testJob.company}`);
    console.log(`   Industry: ${testJob.industry || 'Not specified'}`);
    console.log(`   Company Size: ${testJob.companyInfo?.size || 'Not specified'}\n`);

    // Step 2: Get timing recommendation
    console.log('2️⃣ Getting timing recommendation...');
    const recResponse = await api.get(`/application-timing/recommendation/${testJob._id}`);
    const recommendation = recResponse.data.recommendation;
    
    console.log('✅ Recommendation received:');
    console.log(`   Recommended Time: ${new Date(recommendation.recommendedTime).toLocaleString()}`);
    console.log(`   Day: ${recommendation.dayOfWeek}`);
    console.log(`   Hour: ${recommendation.hourOfDay}:00`);
    console.log(`   Confidence: ${recommendation.confidence}%`);
    console.log(`   Reasoning: ${recommendation.reasoning}\n`);

    if (recommendation.factors && recommendation.factors.length > 0) {
      console.log('   Factors:');
      recommendation.factors.forEach(factor => {
        console.log(`   - ${factor.factor}: ${factor.impact} (weight: ${factor.weight}/10)`);
      });
      console.log('');
    }

    if (recommendation.warnings && recommendation.warnings.length > 0) {
      console.log('   ⚠️  Warnings:');
      recommendation.warnings.forEach(warning => {
        console.log(`   - [${warning.severity.toUpperCase()}] ${warning.message}`);
      });
      console.log('');
    }

    // Step 3: Get real-time recommendation
    console.log('3️⃣ Getting real-time recommendation...');
    const realtimeResponse = await api.post(`/application-timing/realtime/${testJob._id}`, {
      userTimezone: 'EST'
    });
    
    console.log('✅ Real-time recommendation:');
    console.log(`   Action: ${realtimeResponse.data.action}`);
    console.log(`   Message: ${realtimeResponse.data.message}`);
    console.log(`   Hours until optimal: ${realtimeResponse.data.hoursUntilOptimal}\n`);

    // Step 4: Schedule a submission
    console.log('4️⃣ Scheduling submission...');
    const scheduledTime = new Date(recommendation.recommendedTime);
    const scheduleResponse = await api.post(`/application-timing/schedule/${testJob._id}`, {
      scheduledTime: scheduledTime.toISOString(),
      autoSubmit: false
    });
    
    console.log('✅ Submission scheduled:');
    console.log(`   Scheduled for: ${new Date(scheduleResponse.data.scheduledTime).toLocaleString()}`);
    console.log(`   Auto-submit: ${scheduleResponse.data.autoSubmit}\n`);

    // Step 5: Get metrics
    console.log('5️⃣ Getting timing metrics...');
    const metricsResponse = await api.get(`/application-timing/metrics/${testJob._id}`);
    
    if (metricsResponse.data.metrics) {
      const metrics = metricsResponse.data.metrics;
      console.log('✅ Metrics:');
      console.log(`   Total Submissions: ${metrics.totalSubmissions}`);
      console.log(`   Response Rate: ${metrics.responseRate.toFixed(1)}%`);
      console.log(`   Avg Response Time: ${Math.round(metrics.averageResponseTime)}h`);
      console.log(`   Optimal Time Success: ${metrics.optimalTimeSuccessRate.toFixed(1)}%`);
      console.log(`   Non-Optimal Success: ${metrics.nonOptimalTimeSuccessRate.toFixed(1)}%\n`);
    } else {
      console.log('ℹ️  No metrics available yet\n');
    }

    // Step 6: Get A/B test results
    console.log('6️⃣ Getting A/B test results...');
    const abTestResponse = await api.get('/application-timing/ab-test-results');
    
    console.log('✅ A/B Test Results:');
    Object.entries(abTestResponse.data.results).forEach(([group, data]) => {
      console.log(`   ${group.replace(/_/g, ' ')}: ${data.rate.toFixed(1)}% (${data.submissions} submissions)`);
    });
    console.log('');

    // Step 7: Get correlations
    console.log('7️⃣ Getting correlation data...');
    const corrResponse = await api.get('/application-timing/correlations');
    
    if (corrResponse.data.correlations.byDayOfWeek && 
        Object.keys(corrResponse.data.correlations.byDayOfWeek).length > 0) {
      console.log('✅ Success Rate by Day of Week:');
      Object.entries(corrResponse.data.correlations.byDayOfWeek)
        .sort((a, b) => b[1].rate - a[1].rate)
        .forEach(([day, data]) => {
          console.log(`   ${day}: ${data.rate.toFixed(1)}% (${data.total} applications)`);
        });
      console.log('');
    } else {
      console.log('ℹ️  No correlation data available yet\n');
    }

    // Step 8: Get scheduled submissions
    console.log('8️⃣ Getting scheduled submissions...');
    const scheduledResponse = await api.get('/application-timing/scheduled');
    
    console.log('✅ Scheduled Submissions:');
    if (scheduledResponse.data.scheduled && scheduledResponse.data.scheduled.length > 0) {
      scheduledResponse.data.scheduled.forEach(item => {
        console.log(`   - ${item.jobTitle} at ${item.jobCompany}`);
        console.log(`     Scheduled for: ${new Date(item.scheduledTime).toLocaleString()}`);
        console.log(`     Auto-submit: ${item.autoSubmit}`);
      });
    } else {
      console.log('   No scheduled submissions');
    }
    console.log('');

    // Step 9: Cancel the scheduled submission (cleanup)
    console.log('9️⃣ Cancelling scheduled submission (cleanup)...');
    await api.delete(`/application-timing/schedule/${testJob._id}`, {
      data: { reason: 'Test cleanup' }
    });
    console.log('✅ Scheduled submission cancelled\n');

    // Step 10: Record a test submission
    console.log('🔟 Recording test submission...');
    const submissionResponse = await api.post(`/application-timing/record-submission/${testJob._id}`, {
      submittedAt: new Date(),
      followedRecommendation: true
    });
    console.log('✅ Submission recorded');
    console.log(`   Updated metrics: ${JSON.stringify(submissionResponse.data.metrics)}\n`);

    console.log('✅ All tests completed successfully!');
    console.log('\n📊 Summary:');
    console.log('   ✓ Timing recommendation generated');
    console.log('   ✓ Real-time recommendation retrieved');
    console.log('   ✓ Submission scheduled and cancelled');
    console.log('   ✓ Metrics retrieved');
    console.log('   ✓ A/B test results retrieved');
    console.log('   ✓ Correlations analyzed');
    console.log('   ✓ Scheduled submissions listed');
    console.log('   ✓ Test submission recorded');

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.error('💡 Tip: Make sure your auth token is valid');
    }
    process.exit(1);
  }
}

// Run the tests
testTimingOptimizer().catch(console.error);
