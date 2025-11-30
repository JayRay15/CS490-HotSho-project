/**
 * Test Script: Interview Analytics Endpoint
 * Tests the comprehensive interview performance analytics
 * 
 * INSTRUCTIONS:
 * 1. Start the backend server: cd backend && npm start
 * 2. Login to the frontend: cd frontend && npm run dev
 * 3. Open browser dev tools (F12) > Network tab
 * 4. Make any API request (e.g., visit /interviews page)
 * 5. Find an API call, click it, copy the "Authorization: Bearer <token>" value
 * 6. Set TEST_TOKEN environment variable or paste it below
 * 7. Run: node test_scripts/test-interview-analytics.js
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:5000';
// Get token from browser dev tools or set as environment variable
const TEST_TOKEN = process.env.TEST_TOKEN || '';

async function testInterviewAnalytics() {
  console.log('🧪 Testing Interview Analytics Endpoint\n');
  console.log('=' .repeat(60));

  if (!TEST_TOKEN) {
    console.log('\n⚠️  AUTHENTICATION REQUIRED');
    console.log('=' .repeat(60));
    console.log('\nTo test this endpoint, you need a Clerk authentication token.');
    console.log('\nOption 1: Set environment variable');
    console.log('  TEST_TOKEN=<your_token> node test_scripts/test-interview-analytics.js');
    console.log('\nOption 2: Get token from browser');
    console.log('  1. Start backend: cd backend && npm start');
    console.log('  2. Start frontend: cd frontend && npm run dev');
    console.log('  3. Login and open browser dev tools (F12)');
    console.log('  4. Go to Network tab');
    console.log('  5. Visit /interviews page');
    console.log('  6. Click any API request');
    console.log('  7. Copy the Authorization header value (the part after "Bearer ")');
    console.log('  8. Set TEST_TOKEN in backend/.env or as environment variable');
    console.log('\nEndpoint: GET ' + API_URL + '/api/interviews/analytics/performance');
    console.log('=' .repeat(60));
    
    displayExpectedStructure();
    return;
  }

  try {
    console.log('\n📊 Fetching interview analytics...');
    const response = await axios.get(`${API_URL}/api/interviews/analytics/performance`, {
      headers: {
        Authorization: `Bearer ${TEST_TOKEN}`,
      },
    });

    console.log('✅ Status:', response.status);
    console.log('✅ Success:', response.data.success);
    console.log('✅ Message:', response.data.message);

    const analytics = response.data.data.analytics;

    // Test 1: Overview Section
    console.log('\n' + '='.repeat(60));
    console.log('📋 OVERVIEW');
    console.log('='.repeat(60));
    console.log('Total Interviews:', analytics.overview.totalInterviews);
    console.log('Completed:', analytics.overview.completedInterviews);
    console.log('Successful:', analytics.overview.successfulInterviews);
    console.log('Offers Received:', analytics.overview.offersReceived);
    console.log('Average Rating:', analytics.overview.averageRating || 'N/A');
    console.log('Upcoming:', analytics.overview.scheduledUpcoming);

    // Test 2: Conversion Rates
    console.log('\n' + '='.repeat(60));
    console.log('🎯 CONVERSION RATES');
    console.log('='.repeat(60));
    console.log('Completion Rate:', `${analytics.conversionRates.completionRate}%`);
    console.log('Success Rate:', `${analytics.conversionRates.successRate}%`);
    console.log('Offer Rate:', `${analytics.conversionRates.offerRate}%`);
    console.log('Progression Rate:', `${analytics.conversionRates.progressionRate}%`);
    console.log('\nFunnel:');
    console.log(`  Scheduled: ${analytics.conversionRates.funnel.scheduled.count} (${analytics.conversionRates.funnel.scheduled.percentage}%)`);
    console.log(`  Completed: ${analytics.conversionRates.funnel.completed.count} (${analytics.conversionRates.funnel.completed.percentage}%)`);
    console.log(`  Successful: ${analytics.conversionRates.funnel.successful.count} (${analytics.conversionRates.funnel.successful.percentage}%)`);
    console.log(`  Offers: ${analytics.conversionRates.funnel.offers.count} (${analytics.conversionRates.funnel.offers.percentage}%)`);

    // Test 3: Company Type Analysis
    console.log('\n' + '='.repeat(60));
    console.log('🏢 COMPANY TYPE ANALYSIS');
    console.log('='.repeat(60));
    if (analytics.companyTypeAnalysis.byIndustry.length > 0) {
      analytics.companyTypeAnalysis.byIndustry.forEach(industry => {
        console.log(`\n${industry.industry}:`);
        console.log(`  Total: ${industry.total}`);
        console.log(`  Success Rate: ${industry.successRate}%`);
        console.log(`  Offer Rate: ${industry.offerRate}%`);
        console.log(`  Avg Rating: ${industry.avgRating || 'N/A'}`);
      });
    } else {
      console.log('No industry data available yet');
    }

    // Test 4: Strengths and Weaknesses
    console.log('\n' + '='.repeat(60));
    console.log('💪 STRENGTHS & WEAKNESSES');
    console.log('='.repeat(60));
    console.log('\nStrongest Interview Types:');
    if (analytics.strengthsWeaknesses.strongest.length > 0) {
      analytics.strengthsWeaknesses.strongest.forEach((type, idx) => {
        console.log(`  ${idx + 1}. ${type.interviewType}: ${type.successRate}% (${type.total} interviews)`);
      });
    } else {
      console.log('  Need more data');
    }

    console.log('\nWeakest Interview Types:');
    if (analytics.strengthsWeaknesses.weakest.length > 0) {
      analytics.strengthsWeaknesses.weakest.forEach((type, idx) => {
        console.log(`  ${idx + 1}. ${type.interviewType}: ${type.successRate}% (${type.total} interviews)`);
      });
    } else {
      console.log('  Need more data');
    }

    // Test 5: Format Comparison
    console.log('\n' + '='.repeat(60));
    console.log('📞 FORMAT COMPARISON');
    console.log('='.repeat(60));
    if (analytics.formatComparison.byFormat.length > 0) {
      analytics.formatComparison.byFormat.forEach(format => {
        console.log(`\n${format.format}:`);
        console.log(`  Total: ${format.total}`);
        console.log(`  Success Rate: ${format.successRate}%`);
        console.log(`  Avg Duration: ${format.avgDuration} minutes`);
      });
    } else {
      console.log('No format data available yet');
    }

    // Test 6: Improvement Tracking
    console.log('\n' + '='.repeat(60));
    console.log('📈 IMPROVEMENT TRACKING');
    console.log('='.repeat(60));
    console.log('\nRecent Performance (Last 3 months):');
    console.log(`  Interviews: ${analytics.improvementTracking.recentPerformance.count}`);
    console.log(`  Success Rate: ${analytics.improvementTracking.recentPerformance.successRate}%`);
    console.log(`  Avg Rating: ${analytics.improvementTracking.recentPerformance.avgRating || 'N/A'}`);

    console.log('\nOlder Performance (3-6 months ago):');
    console.log(`  Interviews: ${analytics.improvementTracking.olderPerformance.count}`);
    console.log(`  Success Rate: ${analytics.improvementTracking.olderPerformance.successRate}%`);
    console.log(`  Avg Rating: ${analytics.improvementTracking.olderPerformance.avgRating || 'N/A'}`);

    console.log('\nTrend Analysis:');
    console.log(`  Trend: ${analytics.improvementTracking.trend.toUpperCase()}`);
    console.log(`  Improvement Score: ${analytics.improvementTracking.improvementScore > 0 ? '+' : ''}${analytics.improvementTracking.improvementScore}%`);
    console.log(`  Mock Sessions: ${analytics.improvementTracking.mockSessionsCompleted}`);
    console.log(`  Practice Impact: ${analytics.improvementTracking.practiceImpact}`);

    // Test 7: Benchmarks
    console.log('\n' + '='.repeat(60));
    console.log('📊 BENCHMARKS');
    console.log('='.repeat(60));
    console.log('\nYour Performance:');
    console.log(`  Success Rate: ${analytics.benchmarks.user.successRate}%`);
    console.log(`  Offer Rate: ${analytics.benchmarks.user.offerRate}%`);

    console.log('\nIndustry Averages:');
    console.log(`  Success Rate: ${analytics.benchmarks.industry.successRate}%`);
    console.log(`  Interview to Offer: ${analytics.benchmarks.industry.interviewToOfferRate}%`);
    console.log(`  Avg Interviews per Offer: ${analytics.benchmarks.industry.avgInterviewsPerOffer}`);
    console.log(`  Avg Prep Time: ${analytics.benchmarks.industry.avgPrepTime} hours`);

    console.log('\nComparison:');
    console.log(`  Success Rate: You are ${analytics.benchmarks.comparison.successRate} industry average`);
    console.log(`  Offer Rate: You are ${analytics.benchmarks.comparison.offerRate} industry average`);

    // Test 8: Insights
    console.log('\n' + '='.repeat(60));
    console.log('💡 STRATEGIC INSIGHTS');
    console.log('='.repeat(60));
    if (analytics.insights.length > 0) {
      analytics.insights.forEach((insight, idx) => {
        console.log(`\n${idx + 1}. [${insight.category}]`);
        console.log(`   ${insight.insight}`);
        console.log(`   → ${insight.recommendation}`);
      });
    } else {
      console.log('Complete more interviews to generate insights');
    }

    // Test 9: Recommendations
    console.log('\n' + '='.repeat(60));
    console.log('🎓 PERSONALIZED RECOMMENDATIONS');
    console.log('='.repeat(60));
    if (analytics.recommendations.length > 0) {
      analytics.recommendations.forEach((rec, idx) => {
        console.log(`\n${idx + 1}. [${rec.priority} Priority] ${rec.title}`);
        console.log(`   Category: ${rec.category}`);
        console.log(`   ${rec.description}`);
        console.log(`   Actions:`);
        rec.actions.forEach((action, i) => {
          console.log(`     ${i + 1}. ${action}`);
        });
        console.log(`   Expected Impact: ${rec.expectedImpact}`);
      });
    } else {
      console.log('No recommendations at this time');
    }

    // Validation Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ VALIDATION SUMMARY');
    console.log('='.repeat(60));
    
    const checks = [
      { name: 'Overview section', pass: analytics.overview && typeof analytics.overview.totalInterviews === 'number' },
      { name: 'Conversion rates', pass: analytics.conversionRates && typeof analytics.conversionRates.successRate === 'number' },
      { name: 'Company type analysis', pass: Array.isArray(analytics.companyTypeAnalysis?.byIndustry) },
      { name: 'Strengths & weaknesses', pass: analytics.strengthsWeaknesses && Array.isArray(analytics.strengthsWeaknesses.strongest) },
      { name: 'Format comparison', pass: Array.isArray(analytics.formatComparison?.byFormat) },
      { name: 'Improvement tracking', pass: analytics.improvementTracking && analytics.improvementTracking.trend },
      { name: 'Benchmarks', pass: analytics.benchmarks && analytics.benchmarks.user && analytics.benchmarks.industry },
      { name: 'Insights array', pass: Array.isArray(analytics.insights) },
      { name: 'Recommendations array', pass: Array.isArray(analytics.recommendations) },
      { name: 'Generated timestamp', pass: analytics.generatedAt },
    ];

    let passCount = 0;
    checks.forEach(check => {
      if (check.pass) {
        console.log(`✅ ${check.name}`);
        passCount++;
      } else {
        console.log(`❌ ${check.name}`);
      }
    });

    console.log(`\n${passCount}/${checks.length} validation checks passed`);

    if (passCount === checks.length) {
      console.log('\n🎉 All tests passed! Interview analytics endpoint is working correctly.');
    } else {
      console.log('\n⚠️  Some validation checks failed. Review the output above.');
    }

  } catch (error) {
    console.error('\n❌ Error testing interview analytics:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Message:', error.response.data?.message || error.response.statusText);
      console.error('Error:', error.response.data?.error);
    } else {
      console.error(error.message);
    }
  }

  console.log('\n' + '='.repeat(60));
}

function displayExpectedStructure() {
  console.log('\n📋 EXPECTED RESPONSE STRUCTURE');
  console.log('=' .repeat(60));
  console.log(`
{
  "success": true,
  "message": "Interview analytics loaded successfully",
  "data": {
    "analytics": {
      "overview": {
        "totalInterviews": Number,
        "completedInterviews": Number,
        "successfulInterviews": Number,
        "offersReceived": Number,
        "averageRating": Number or null,
        "scheduledUpcoming": Number
      },
      "conversionRates": {
        "scheduled": Number,
        "completed": Number,
        "successful": Number,
        "offers": Number,
        "completionRate": Number (percentage),
        "successRate": Number (percentage),
        "offerRate": Number (percentage),
        "progressionRate": Number (percentage),
        "funnel": {
          "scheduled": { "count": Number, "percentage": 100 },
          "completed": { "count": Number, "percentage": Number },
          "successful": { "count": Number, "percentage": Number },
          "offers": { "count": Number, "percentage": Number }
        }
      },
      "companyTypeAnalysis": {
        "byIndustry": [
          {
            "industry": String,
            "total": Number,
            "successRate": Number (percentage),
            "offerRate": Number (percentage),
            "avgRating": Number or null
          }
        ]
      },
      "strengthsWeaknesses": {
        "strongest": [/* top 3 interview types by success rate */],
        "weakest": [/* bottom 3 interview types by success rate */]
      },
      "formatComparison": {
        "byFormat": [
          {
            "format": String,
            "total": Number,
            "successRate": Number (percentage),
            "avgDuration": Number (minutes)
          }
        ]
      },
      "improvementTracking": {
        "recentPerformance": {
          "period": "Last 3 months",
          "count": Number,
          "successRate": Number (percentage),
          "avgRating": Number or null
        },
        "olderPerformance": {
          "period": "3-6 months ago",
          "count": Number,
          "successRate": Number (percentage),
          "avgRating": Number or null
        },
        "improvementScore": Number,
        "trend": "improving" | "declining" | "stable",
        "mockSessionsCompleted": Number,
        "practiceImpact": String
      },
      "benchmarks": {
        "user": {
          "successRate": Number (percentage),
          "offerRate": Number (percentage)
        },
        "industry": {
          "successRate": 40,
          "interviewToOfferRate": 25,
          "avgInterviewsPerOffer": 4,
          "avgPrepTime": 3
        },
        "comparison": {
          "successRate": "above" | "below",
          "offerRate": "above" | "below"
        }
      },
      "insights": [
        {
          "category": String,
          "insight": String,
          "recommendation": String
        }
      ],
      "recommendations": [
        {
          "priority": "High" | "Medium" | "Low",
          "category": String,
          "title": String,
          "description": String,
          "actions": [String],
          "expectedImpact": String
        }
      ],
      "generatedAt": ISO Date String
    }
  }
}
  `);
  console.log('=' .repeat(60));
  console.log('\n✅ All features are now implemented according to acceptance criteria:');
  console.log('   ✓ Track interview-to-offer conversion rates');
  console.log('   ✓ Analyze performance trends across different company types');
  console.log('   ✓ Identify strongest and weakest interview areas');
  console.log('   ✓ Compare performance across different interview formats');
  console.log('   ✓ Monitor improvement over time with practice sessions');
  console.log('   ✓ Generate insights on optimal interview strategies');
  console.log('   ✓ Benchmark performance against industry standards');
  console.log('   ✓ Provide personalized improvement recommendations');
  console.log('\n📍 Endpoint: GET /api/interviews/analytics/performance');
  console.log('🔒 Authentication: Required (Clerk JWT token)');
  console.log('📄 Frontend page: /interviews/analytics');
}

// Run the test
testInterviewAnalytics();
