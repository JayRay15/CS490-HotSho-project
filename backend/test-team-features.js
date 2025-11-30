#!/usr/bin/env node

/**
 * Team Account Feature Testing Script
 * 
 * This script tests the team account functionality by making API calls
 * to verify all endpoints are working correctly.
 * 
 * Usage:
 *   node test-team-features.js <AUTH_TOKEN>
 */

import axios from 'axios';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const AUTH_TOKEN = process.argv[2];

if (!AUTH_TOKEN) {
    console.error('❌ Error: Authentication token required');
    console.log('Usage: node test-team-features.js <AUTH_TOKEN>');
    process.exit(1);
}

// Configure axios
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
    }
});

// Test results
const results = {
    passed: 0,
    failed: 0,
    tests: []
};

// Helper function to run test
async function runTest(name, testFn) {
    try {
        console.log(`\n🧪 Testing: ${name}`);
        await testFn();
        console.log(`✅ PASSED: ${name}`);
        results.passed++;
        results.tests.push({ name, status: 'PASSED' });
    } catch (error) {
        console.error(`❌ FAILED: ${name}`);
        console.error(`   Error: ${error.message}`);
        if (error.response?.data) {
            console.error(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
        }
        results.failed++;
        results.tests.push({ name, status: 'FAILED', error: error.message });
    }
}

// Store test data
let testTeamId = null;
let testMemberId = null;
let testInvitationToken = null;

// Run all tests
async function runAllTests() {
    console.log('🚀 Starting Team Account Feature Tests\n');
    console.log('='.repeat(60));

    // Test 1: Create Team
    await runTest('Create Team', async () => {
        const response = await api.post('/api/teams', {
            name: 'Test Coaching Team',
            description: 'Automated test team for feature verification',
            teamType: 'career_coaching'
        });

        if (!response.data.success) {
            throw new Error('Team creation failed');
        }

        testTeamId = response.data.data.team._id;
        console.log(`   Team ID: ${testTeamId}`);

        if (!response.data.data.subscription) {
            throw new Error('Subscription not created');
        }
    });

    // Test 2: Get My Teams
    await runTest('Get My Teams', async () => {
        const response = await api.get('/api/teams');

        if (!response.data.success) {
            throw new Error('Failed to fetch teams');
        }

        if (!Array.isArray(response.data.data)) {
            throw new Error('Teams data is not an array');
        }

        console.log(`   Found ${response.data.data.length} team(s)`);
    });

    // Test 3: Get Team Details
    await runTest('Get Team Details', async () => {
        if (!testTeamId) throw new Error('No test team ID available');

        const response = await api.get(`/api/teams/${testTeamId}`);

        if (!response.data.success) {
            throw new Error('Failed to fetch team details');
        }

        if (!response.data.data.team) {
            throw new Error('Team data missing');
        }

        console.log(`   Team: ${response.data.data.team.name}`);
        console.log(`   Role: ${response.data.data.membership.role}`);
    });

    // Test 4: Update Team
    await runTest('Update Team', async () => {
        if (!testTeamId) throw new Error('No test team ID available');

        const response = await api.put(`/api/teams/${testTeamId}`, {
            description: 'Updated test description',
            tags: ['testing', 'automation']
        });

        if (!response.data.success) {
            throw new Error('Failed to update team');
        }

        console.log(`   Updated description`);
    });

    // Test 5: Get Team Dashboard
    await runTest('Get Team Dashboard', async () => {
        if (!testTeamId) throw new Error('No test team ID available');

        const response = await api.get(`/api/teams/${testTeamId}/dashboard`);

        if (!response.data.success) {
            throw new Error('Failed to fetch dashboard');
        }

        const metrics = response.data.data.metrics;
        console.log(`   Members: ${metrics.totalMembers}`);
        console.log(`   Candidates: ${metrics.activeCandidates}`);
        console.log(`   Applications: ${metrics.totalApplications}`);
        console.log(`   Interviews: ${metrics.totalInterviews}`);
    });

    // Test 6: Invite Team Member
    await runTest('Invite Team Member', async () => {
        if (!testTeamId) throw new Error('No test team ID available');

        const response = await api.post(`/api/teams/${testTeamId}/members/invite`, {
            email: `test-candidate-${Date.now()}@example.com`,
            role: 'candidate',
            invitationMessage: 'Join our test team!'
        });

        if (!response.data.success) {
            throw new Error('Failed to invite member');
        }

        testMemberId = response.data.data._id;
        testInvitationToken = response.data.data.invitationToken;

        console.log(`   Member ID: ${testMemberId}`);
        console.log(`   Token: ${testInvitationToken?.substring(0, 20)}...`);
    });

    // Test 7: Get Team Members
    await runTest('Get Team Members', async () => {
        if (!testTeamId) throw new Error('No test team ID available');

        const response = await api.get(`/api/teams/${testTeamId}/members`);

        if (!response.data.success) {
            throw new Error('Failed to fetch members');
        }

        if (!Array.isArray(response.data.data)) {
            throw new Error('Members data is not an array');
        }

        console.log(`   Found ${response.data.data.length} member(s)`);

        // Check for pending members
        const pending = response.data.data.filter(m => m.status === 'pending');
        console.log(`   Pending: ${pending.length}`);
    });

    // Test 8: Get Subscription
    await runTest('Get Subscription', async () => {
        if (!testTeamId) throw new Error('No test team ID available');

        const response = await api.get(`/api/teams/${testTeamId}/subscription`);

        if (!response.data.success) {
            throw new Error('Failed to fetch subscription');
        }

        console.log(`   Plan: ${response.data.data.plan}`);
        console.log(`   Status: ${response.data.data.status}`);
        console.log(`   Members: ${response.data.data.usage.currentMembers}/${response.data.data.limits.maxMembers}`);
    });

    // Test 9: Get Subscription Usage
    await runTest('Get Subscription Usage', async () => {
        if (!testTeamId) throw new Error('No test team ID available');

        const response = await api.get(`/api/teams/${testTeamId}/subscription/usage`);

        if (!response.data.success) {
            throw new Error('Failed to fetch usage');
        }

        console.log(`   Members: ${response.data.data.usagePercentages.members.toFixed(1)}% used`);
        console.log(`   Candidates: ${response.data.data.usagePercentages.candidates.toFixed(1)}% used`);
    });

    // Test 10: Get Team Activity
    await runTest('Get Team Activity', async () => {
        if (!testTeamId) throw new Error('No test team ID available');

        const response = await api.get(`/api/teams/${testTeamId}/activity?limit=5`);

        if (!response.data.success) {
            throw new Error('Failed to fetch activity');
        }

        if (!Array.isArray(response.data.data)) {
            throw new Error('Activity data is not an array');
        }

        console.log(`   Recent activities: ${response.data.data.length}`);

        if (response.data.data.length > 0) {
            console.log(`   Latest: ${response.data.data[0].action}`);
        }
    });

    // Test 11: Remove Team Member
    await runTest('Remove Team Member', async () => {
        if (!testTeamId || !testMemberId) {
            throw new Error('No test team or member ID available');
        }

        const response = await api.delete(`/api/teams/${testTeamId}/members/${testMemberId}`);

        if (!response.data.success) {
            throw new Error('Failed to remove member');
        }

        console.log(`   Member removed successfully`);
    });

    // Test 12: Delete Team
    await runTest('Delete Team', async () => {
        if (!testTeamId) throw new Error('No test team ID available');

        const response = await api.delete(`/api/teams/${testTeamId}`);

        if (!response.data.success) {
            throw new Error('Failed to delete team');
        }

        console.log(`   Team deleted successfully`);
    });

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${results.passed + results.failed}`);
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

    if (results.failed > 0) {
        console.log('\n❌ Failed Tests:');
        results.tests.filter(t => t.status === 'FAILED').forEach(t => {
            console.log(`   - ${t.name}: ${t.error}`);
        });
        process.exit(1);
    } else {
        console.log('\n✅ All tests passed!');
        process.exit(0);
    }
}

// Run tests
runAllTests().catch(error => {
    console.error('\n💥 Fatal Error:', error.message);
    process.exit(1);
});
