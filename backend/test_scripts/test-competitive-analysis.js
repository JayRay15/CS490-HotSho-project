/**
 * Test script for Competitive Analysis API (UC-104)
 * 
 * This script tests the competitive analysis endpoints:
 * - GET /api/competitive-analysis (main endpoint)
 * - GET /api/competitive-analysis/skill-gaps
 * - GET /api/competitive-analysis/positioning
 * - GET /api/competitive-analysis/career-progression
 */

const BASE_URL = 'http://localhost:5000';

// Replace with a valid JWT token
const AUTH_TOKEN = 'YOUR_JWT_TOKEN_HERE';

const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AUTH_TOKEN}`
};

async function testCompetitiveAnalysis() {
    console.log('\n🏆 Testing Competitive Analysis API\n');
    console.log('='.repeat(60));

    // Test 1: Get comprehensive competitive analysis
    console.log('\n📊 Test 1: Get Comprehensive Competitive Analysis');
    console.log('-'.repeat(40));

    try {
        const response = await fetch(`${BASE_URL}/api/competitive-analysis`, {
            method: 'GET',
            headers
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ Success! Status:', response.status);
            console.log('\nOverview:');
            console.log(`  - Industry: ${data.data?.overview?.industry}`);
            console.log(`  - Experience Level: ${data.data?.overview?.experienceLevel}`);
            console.log(`  - Competitive Score: ${data.data?.overview?.competitiveScore}/100`);

            console.log('\nUser Metrics:');
            console.log(`  - Applications/Month: ${data.data?.userMetrics?.applicationsThisMonth}`);
            console.log(`  - Response Rate: ${data.data?.userMetrics?.responseRate}%`);
            console.log(`  - Interview Rate: ${data.data?.userMetrics?.interviewRate}%`);
            console.log(`  - Offer Rate: ${data.data?.userMetrics?.offerRate}%`);
            console.log(`  - Skills Count: ${data.data?.userMetrics?.skillsCount}`);

            console.log('\nPositioning:');
            console.log(`  - Strengths: ${data.data?.positioning?.strengths?.length || 0}`);
            console.log(`  - Weaknesses: ${data.data?.positioning?.weaknesses?.length || 0}`);
            console.log(`  - Overall Position: ${data.data?.positioning?.overallPosition?.level}`);

            console.log('\nSkill Gap Analysis:');
            console.log(`  - Match Score: ${data.data?.skillGapAnalysis?.matchScore}%`);
            console.log(`  - Matching Skills: ${data.data?.skillGapAnalysis?.matchingSkills?.length || 0}`);
            console.log(`  - Missing Skills: ${data.data?.skillGapAnalysis?.missingSkills?.length || 0}`);

            console.log('\nRecommendations:');
            console.log(`  - Total: ${data.data?.recommendations?.length || 0}`);
            data.data?.recommendations?.slice(0, 3).forEach((rec, i) => {
                console.log(`  ${i + 1}. [${rec.priority}] ${rec.title}`);
            });
        } else {
            console.log('❌ Failed:', data.message);
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
    }

    // Test 2: Get skill gap analysis
    console.log('\n\n🎯 Test 2: Get Skill Gap Analysis');
    console.log('-'.repeat(40));

    try {
        const response = await fetch(`${BASE_URL}/api/competitive-analysis/skill-gaps`, {
            method: 'GET',
            headers
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ Success! Status:', response.status);
            console.log(`\nMatch Score: ${data.data?.matchScore}%`);
            console.log(`\nMatching Skills (${data.data?.matchingSkills?.length || 0}):`);
            data.data?.matchingSkills?.slice(0, 5).forEach(skill => {
                console.log(`  - ${skill.skill} (${skill.level}) - ${skill.priority} Priority`);
            });
            console.log(`\nTop Priority Gaps (${data.data?.topPriorityGaps?.length || 0}):`);
            data.data?.topPriorityGaps?.forEach(gap => {
                console.log(`  - ${gap.skill}`);
            });
            console.log(`\nEstimated Time to Close Gaps: ${data.data?.estimatedTimeToClose}`);
        } else {
            console.log('❌ Failed:', data.message);
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
    }

    // Test 3: Get market positioning
    console.log('\n\n📍 Test 3: Get Market Positioning');
    console.log('-'.repeat(40));

    try {
        const response = await fetch(`${BASE_URL}/api/competitive-analysis/positioning`, {
            method: 'GET',
            headers
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ Success! Status:', response.status);
            console.log('\nPositioning Statement:', data.data?.marketPositioning?.positioningStatement);
            console.log('\nKey Messages:');
            data.data?.marketPositioning?.keyMessages?.forEach((msg, i) => {
                console.log(`  ${i + 1}. ${msg}`);
            });
            console.log('\nNetworking Strategy:');
            data.data?.marketPositioning?.networkingStrategy?.forEach((strategy, i) => {
                console.log(`  ${i + 1}. ${strategy}`);
            });
        } else {
            console.log('❌ Failed:', data.message);
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
    }

    // Test 4: Get career progression analysis
    console.log('\n\n🚀 Test 4: Get Career Progression Analysis');
    console.log('-'.repeat(40));

    try {
        const response = await fetch(`${BASE_URL}/api/competitive-analysis/career-progression`, {
            method: 'GET',
            headers
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ Success! Status:', response.status);
            console.log(`\nCurrent Level: ${data.data?.currentLevel}`);
            console.log(`Next Level: ${data.data?.nextLevel}`);
            console.log(`Readiness Score: ${data.data?.readinessScore}%`);

            console.log('\nReadiness Factors:');
            data.data?.readinessFactors?.forEach(factor => {
                const status = factor.ready ? '✅' : '❌';
                console.log(`  ${status} ${factor.factor}: ${factor.current}/${factor.required}`);
            });

            console.log('\nSuccess Patterns:');
            data.data?.successPatterns?.forEach((pattern, i) => {
                console.log(`  ${i + 1}. ${pattern}`);
            });
        } else {
            console.log('❌ Failed:', data.message);
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🏁 Testing Complete!\n');
}

// Display expected data structure
function displayExpectedStructure() {
    console.log('\n📋 Expected API Response Structure');
    console.log('='.repeat(60));
    console.log(`
GET /api/competitive-analysis
{
  success: true,
  message: "Competitive analysis retrieved successfully",
  data: {
    overview: {
      industry: "Technology",
      experienceLevel: "Mid",
      competitiveScore: 65,
      lastUpdated: "2024-01-15T10:30:00.000Z"
    },
    userMetrics: {
      applicationsThisMonth: 12,
      totalApplications: 45,
      responseRate: "24.5",
      interviewRate: "12.3",
      offerRate: "5.0",
      skillsCount: 10,
      projectsCount: 5,
      certificationsCount: 2,
      experienceYears: 4.5
    },
    peerBenchmarks: {
      industry: { avgResponseRate: 22, ... },
      adjustedForExperience: { avgResponseRate: 22, ... }
    },
    peerComparison: {
      responseRate: { user: 24.5, benchmark: 22, status: "above_average", percentile: 65 },
      ...
    },
    positioning: {
      strengths: [{ area: "Response Rate", description: "..." }],
      weaknesses: [{ area: "Skills", description: "..." }],
      uniqueValueProposition: { summary: "...", keyDifferentiators: [...] },
      overallPosition: { level: "Good", description: "..." }
    },
    skillGapAnalysis: {
      matchScore: 65.5,
      matchingSkills: [...],
      missingSkills: [...],
      topPriorityGaps: [...],
      learningPath: [...]
    },
    careerProgressionAnalysis: {
      currentLevel: "Mid",
      nextLevel: "Senior",
      readinessScore: 55,
      readinessFactors: [...],
      milestones: [...]
    },
    recommendations: [...],
    differentiationStrategies: [...],
    marketPositioning: {
      positioningStatement: "...",
      keyMessages: [...],
      networkingStrategy: [...],
      contentStrategy: [...]
    }
  }
}
  `);
}

// Run tests
console.log('\n🏆 UC-104: Competitive Analysis and Benchmarking');
console.log('='.repeat(60));
displayExpectedStructure();

// Uncomment to run actual tests (requires valid auth token)
// testCompetitiveAnalysis();

console.log('\n💡 To run actual tests:');
console.log('   1. Replace AUTH_TOKEN with a valid JWT token');
console.log('   2. Uncomment the testCompetitiveAnalysis() call');
console.log('   3. Run: node test-competitive-analysis.js');
console.log('\n📍 Endpoint: GET /api/competitive-analysis');
console.log('🔒 Authentication: Required (Clerk JWT token)');
console.log('📄 Frontend page: /competitive-analysis\n');
