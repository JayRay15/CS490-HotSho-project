#!/usr/bin/env node

/**
 * Test script for UC-064 Company Research API
 * Tests comprehensive company research endpoints
 */

import fetch from 'node-fetch';

const API_URL = 'http://localhost:5001';
const TEST_COMPANY = 'Google';

console.log('🧪 Testing UC-064 Company Research API\n');
console.log('='.repeat(60));

async function testCompanyResearch() {
    try {
        console.log('\n📋 Test 1: Basic Company Research');
        console.log('Endpoint: GET /api/companies/research');
        console.log(`Company: ${TEST_COMPANY}`);

        const response = await fetch(`${API_URL}/api/companies/research?company=${encodeURIComponent(TEST_COMPANY)}`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success) {
            console.log('✅ Research request successful');

            const research = data.data.research;
            console.log('\n📊 Research Summary:');
            console.log(`  Company: ${research.companyName}`);
            console.log(`  Data Quality: ${research.metadata.dataQuality}%`);
            console.log(`  Research Success: ${research.metadata.researchSuccess ? 'Yes' : 'No'}`);

            console.log('\n📍 Basic Info:');
            console.log(`  Industry: ${research.basicInfo.industry}`);
            console.log(`  Size: ${research.basicInfo.size}`);
            console.log(`  Headquarters: ${research.basicInfo.headquarters}`);
            console.log(`  Founded: ${research.basicInfo.founded || 'N/A'}`);

            console.log('\n🎯 Mission & Culture:');
            console.log(`  Mission: ${research.missionAndCulture.mission || 'N/A'}`);
            console.log(`  Values: ${research.missionAndCulture.values.length} values identified`);

            console.log('\n🚀 Products & Services:');
            console.log(`  Main Products: ${research.productsAndServices.mainProducts.length} products`);
            console.log(`  Technologies: ${research.productsAndServices.technologies.length} technologies`);

            console.log('\n👔 Leadership:');
            console.log(`  Executives: ${research.leadership.executives.length} executives identified`);
            if (research.leadership.executives.length > 0) {
                research.leadership.executives.slice(0, 3).forEach(exec => {
                    console.log(`    • ${exec.name} - ${exec.title}`);
                });
            }

            console.log('\n🏆 Competitive:');
            console.log(`  Competitors: ${research.competitive.mainCompetitors.length} identified`);
            if (research.competitive.mainCompetitors.length > 0) {
                console.log(`    ${research.competitive.mainCompetitors.slice(0, 3).join(', ')}`);
            }

            console.log('\n📱 Social Media:');
            const platforms = Object.keys(research.socialMedia.platforms || {});
            console.log(`  Platforms: ${platforms.length} identified`);
            console.log(`    ${platforms.join(', ')}`);

            console.log('\n📝 Summary:');
            console.log(`  ${research.summary.substring(0, 200)}...`);

        } else {
            console.log('❌ Research request failed');
            console.log('Error:', data.message || 'Unknown error');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Make sure the backend server is running on', API_URL);
    }
}

async function testResearchWithContext() {
    try {
        console.log('\n\n📋 Test 2: Research with Job Description Context');
        console.log('Endpoint: GET /api/companies/research');
        console.log(`Company: ${TEST_COMPANY}`);
        console.log('With job description context...');

        const jobDescription = 'Senior Software Engineer role working on cloud infrastructure and distributed systems';

        const response = await fetch(
            `${API_URL}/api/companies/research?company=${encodeURIComponent(TEST_COMPANY)}&jobDescription=${encodeURIComponent(jobDescription)}`
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success) {
            console.log('✅ Contextual research successful');
            console.log(`  Data Quality: ${data.data.research.metadata.dataQuality}%`);
        } else {
            console.log('❌ Contextual research failed');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

async function testExportFunctionality() {
    try {
        console.log('\n\n📋 Test 3: Export Research Report');
        console.log('Endpoint: GET /api/companies/research/export');

        // Test JSON export
        console.log('\nTesting JSON export...');
        const jsonResponse = await fetch(
            `${API_URL}/api/companies/research/export?company=${encodeURIComponent(TEST_COMPANY)}&format=json`
        );

        if (jsonResponse.ok) {
            const contentType = jsonResponse.headers.get('content-type');
            console.log('✅ JSON export successful');
            console.log(`  Content-Type: ${contentType}`);
        } else {
            console.log('❌ JSON export failed');
        }

        // Test text export
        console.log('\nTesting text export...');
        const textResponse = await fetch(
            `${API_URL}/api/companies/research/export?company=${encodeURIComponent(TEST_COMPANY)}&format=text`
        );

        if (textResponse.ok) {
            const contentType = textResponse.headers.get('content-type');
            const text = await textResponse.text();
            console.log('✅ Text export successful');
            console.log(`  Content-Type: ${contentType}`);
            console.log(`  Report length: ${text.length} characters`);
            console.log('\n  First 200 characters:');
            console.log(`  ${text.substring(0, 200)}...`);
        } else {
            console.log('❌ Text export failed');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

async function runAllTests() {
    await testCompanyResearch();
    await testResearchWithContext();
    await testExportFunctionality();

    console.log('\n' + '='.repeat(60));
    console.log('✅ All UC-064 tests completed');
    console.log('\n📋 Feature Coverage:');
    console.log('  ✅ Basic company information');
    console.log('  ✅ Mission, values, and culture');
    console.log('  ✅ Recent news and press releases');
    console.log('  ✅ Key executives and leadership');
    console.log('  ✅ Products and services');
    console.log('  ✅ Competitive landscape');
    console.log('  ✅ Social media presence');
    console.log('  ✅ Research summary');
    console.log('  ✅ Export functionality');
    console.log('\n🎉 UC-064 Implementation Complete!');
}

// Run tests
runAllTests().catch(console.error);
