/**
 * Test script for Company News API
 * Tests news fetching, categorization, relevance scoring, and export
 */

import fetch from 'node-fetch';

const API_BASE = process.env.API_URL || 'http://localhost:3000';
const TEST_COMPANIES = ['Google', 'Microsoft', 'Apple', 'Amazon', 'Tesla'];

console.log('🧪 Testing Company News API\n');
console.log('='.repeat(60));

/**
 * Test 1: Fetch company news
 */
async function testFetchNews(company) {
    console.log(`\n📰 Test 1: Fetching news for ${company}`);
    console.log('-'.repeat(60));

    try {
        const response = await fetch(`${API_BASE}/api/companies/news?company=${company}&limit=5`);
        const data = await response.json();

        if (data.success) {
            console.log(`✅ Success! Retrieved ${data.data.news.length} news items`);
            console.log(`\n📊 Summary: ${data.data.summary.summary}`);

            if (data.data.summary.highlights.length > 0) {
                console.log(`\n🌟 Highlights:`);
                data.data.summary.highlights.forEach(h => console.log(`  ${h}`));
            }

            console.log(`\n📋 News Items:`);
            data.data.news.forEach((item, idx) => {
                console.log(`\n${idx + 1}. ${item.title}`);
                console.log(`   Category: ${item.category}`);
                console.log(`   Sentiment: ${item.sentiment}`);
                console.log(`   Relevance: ${item.relevanceScore}/10`);
                console.log(`   Date: ${new Date(item.date).toLocaleDateString()}`);
                console.log(`   Source: ${item.source}`);
                if (item.keyPoints && item.keyPoints.length > 0) {
                    console.log(`   Key Points: ${item.keyPoints.length}`);
                }
                if (item.tags && item.tags.length > 0) {
                    console.log(`   Tags: ${item.tags.join(', ')}`);
                }
            });

            return true;
        } else {
            console.log(`❌ Failed: ${data.message}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        return false;
    }
}

/**
 * Test 2: Filter news by category
 */
async function testCategoryFilter(company, category) {
    console.log(`\n🔍 Test 2: Filtering ${company} news by category: ${category}`);
    console.log('-'.repeat(60));

    try {
        const response = await fetch(`${API_BASE}/api/companies/news?company=${company}&category=${category}`);
        const data = await response.json();

        if (data.success) {
            console.log(`✅ Success! Found ${data.data.news.length} ${category} news items`);

            // Verify all items match category
            const allMatch = data.data.news.every(item => item.category === category);
            if (allMatch) {
                console.log(`✅ All items correctly categorized as "${category}"`);
            } else {
                console.log(`❌ Some items have incorrect category`);
            }

            return allMatch;
        } else {
            console.log(`❌ Failed: ${data.message}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        return false;
    }
}

/**
 * Test 3: Test relevance filtering
 */
async function testRelevanceFilter(company, minRelevance) {
    console.log(`\n⭐ Test 3: Filtering ${company} news with min relevance: ${minRelevance}`);
    console.log('-'.repeat(60));

    try {
        const response = await fetch(`${API_BASE}/api/companies/news?company=${company}&minRelevance=${minRelevance}`);
        const data = await response.json();

        if (data.success) {
            console.log(`✅ Success! Found ${data.data.news.length} items with relevance ≥ ${minRelevance}`);

            // Verify all items meet minimum relevance
            const allMeetMin = data.data.news.every(item => item.relevanceScore >= minRelevance);
            if (allMeetMin) {
                console.log(`✅ All items meet minimum relevance threshold`);

                // Show relevance distribution
                const scores = data.data.news.map(item => item.relevanceScore);
                console.log(`   Score range: ${Math.min(...scores)} - ${Math.max(...scores)}`);
                console.log(`   Average: ${(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)}`);
            } else {
                console.log(`❌ Some items don't meet minimum relevance`);
            }

            return allMeetMin;
        } else {
            console.log(`❌ Failed: ${data.message}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        return false;
    }
}

/**
 * Test 4: Export news summary (text format)
 */
async function testExportText(company) {
    console.log(`\n📄 Test 4: Exporting ${company} news summary (text)`);
    console.log('-'.repeat(60));

    try {
        const response = await fetch(`${API_BASE}/api/companies/news/export?company=${company}&format=text`);

        if (response.ok) {
            const text = await response.text();
            const lines = text.split('\n');

            console.log(`✅ Success! Generated ${lines.length} lines of text`);
            console.log(`\n📋 Preview (first 10 lines):`);
            console.log(lines.slice(0, 10).join('\n'));
            console.log('...');

            // Verify key sections exist
            const hasTitle = text.includes('COMPANY NEWS SUMMARY');
            const hasOverview = text.includes('OVERVIEW:');
            const hasHighlights = text.includes('KEY HIGHLIGHTS:');
            const hasNews = text.includes('RECENT NEWS');

            console.log(`\n📊 Content verification:`);
            console.log(`   Title section: ${hasTitle ? '✅' : '❌'}`);
            console.log(`   Overview: ${hasOverview ? '✅' : '❌'}`);
            console.log(`   Highlights: ${hasHighlights ? '✅' : '❌'}`);
            console.log(`   News items: ${hasNews ? '✅' : '❌'}`);

            return hasTitle && hasOverview && hasNews;
        } else {
            console.log(`❌ Failed: ${response.status} ${response.statusText}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        return false;
    }
}

/**
 * Test 5: Export news summary (JSON format)
 */
async function testExportJSON(company) {
    console.log(`\n📊 Test 5: Exporting ${company} news summary (JSON)`);
    console.log('-'.repeat(60));

    try {
        const response = await fetch(`${API_BASE}/api/companies/news/export?company=${company}&format=json`);

        if (response.ok) {
            const data = await response.json();

            console.log(`✅ Success! Generated JSON export`);
            console.log(`\n📋 Export structure:`);
            console.log(`   Company: ${data.company}`);
            console.log(`   Export Date: ${data.exportDate}`);
            console.log(`   News Items: ${data.news.length}`);
            console.log(`   Total Items: ${data.metadata.totalItems}`);
            console.log(`   Categories: ${data.metadata.categories.join(', ')}`);
            console.log(`   Avg Relevance: ${data.metadata.averageRelevance}`);

            // Verify structure
            const hasCompany = !!data.company;
            const hasNews = Array.isArray(data.news) && data.news.length > 0;
            const hasSummary = !!data.summary;
            const hasMetadata = !!data.metadata;

            console.log(`\n📊 Structure verification:`);
            console.log(`   Company field: ${hasCompany ? '✅' : '❌'}`);
            console.log(`   News array: ${hasNews ? '✅' : '❌'}`);
            console.log(`   Summary object: ${hasSummary ? '✅' : '❌'}`);
            console.log(`   Metadata: ${hasMetadata ? '✅' : '❌'}`);

            return hasCompany && hasNews && hasSummary && hasMetadata;
        } else {
            console.log(`❌ Failed: ${response.status} ${response.statusText}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        return false;
    }
}

/**
 * Test 6: Categorization accuracy
 */
async function testCategorization() {
    console.log(`\n🏷️  Test 6: Testing categorization accuracy`);
    console.log('-'.repeat(60));

    const expectedCategories = [
        'funding', 'product_launch', 'hiring', 'acquisition',
        'partnership', 'leadership', 'awards', 'general'
    ];

    try {
        const response = await fetch(`${API_BASE}/api/companies/news?company=Google&limit=10`);
        const data = await response.json();

        if (data.success) {
            const categories = [...new Set(data.data.news.map(item => item.category))];
            console.log(`✅ Found ${categories.length} unique categories: ${categories.join(', ')}`);

            // Check if all categories are valid
            const allValid = categories.every(cat => expectedCategories.includes(cat));
            if (allValid) {
                console.log(`✅ All categories are valid`);
            } else {
                console.log(`❌ Some categories are invalid`);
            }

            // Show category distribution
            console.log(`\n📊 Category distribution:`);
            const distribution = {};
            data.data.news.forEach(item => {
                distribution[item.category] = (distribution[item.category] || 0) + 1;
            });
            Object.entries(distribution).forEach(([cat, count]) => {
                console.log(`   ${cat}: ${count} items`);
            });

            return allValid;
        } else {
            console.log(`❌ Failed: ${data.message}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        return false;
    }
}

/**
 * Test 7: Sentiment analysis
 */
async function testSentimentAnalysis() {
    console.log(`\n😊 Test 7: Testing sentiment analysis`);
    console.log('-'.repeat(60));

    const expectedSentiments = ['positive', 'neutral', 'negative'];

    try {
        const response = await fetch(`${API_BASE}/api/companies/news?company=Google&limit=10`);
        const data = await response.json();

        if (data.success) {
            const sentiments = [...new Set(data.data.news.map(item => item.sentiment))];
            console.log(`✅ Found ${sentiments.length} sentiment types: ${sentiments.join(', ')}`);

            // Check if all sentiments are valid
            const allValid = sentiments.every(sent => expectedSentiments.includes(sent));
            if (allValid) {
                console.log(`✅ All sentiments are valid`);
            } else {
                console.log(`❌ Some sentiments are invalid`);
            }

            // Show sentiment distribution
            console.log(`\n📊 Sentiment distribution:`);
            const distribution = {};
            data.data.news.forEach(item => {
                distribution[item.sentiment] = (distribution[item.sentiment] || 0) + 1;
            });
            Object.entries(distribution).forEach(([sent, count]) => {
                const emoji = sent === 'positive' ? '😊' : sent === 'negative' ? '😟' : '😐';
                console.log(`   ${emoji} ${sent}: ${count} items`);
            });

            return allValid;
        } else {
            console.log(`❌ Failed: ${data.message}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        return false;
    }
}

/**
 * Run all tests
 */
async function runAllTests() {
    console.log(`\n🚀 Starting Company News API Test Suite\n`);
    console.log(`API Base URL: ${API_BASE}`);
    console.log(`Test Companies: ${TEST_COMPANIES.join(', ')}\n`);

    const results = [];

    // Test basic fetch for first company
    results.push(await testFetchNews(TEST_COMPANIES[0]));

    // Test category filtering
    results.push(await testCategoryFilter(TEST_COMPANIES[0], 'product_launch'));

    // Test relevance filtering
    results.push(await testRelevanceFilter(TEST_COMPANIES[0], 7));

    // Test text export
    results.push(await testExportText(TEST_COMPANIES[1]));

    // Test JSON export
    results.push(await testExportJSON(TEST_COMPANIES[2]));

    // Test categorization
    results.push(await testCategorization());

    // Test sentiment analysis
    results.push(await testSentimentAnalysis());

    // Summary
    console.log('\n\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));

    const passed = results.filter(r => r).length;
    const total = results.length;
    const percentage = ((passed / total) * 100).toFixed(1);

    console.log(`\nTotal Tests: ${total}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${total - passed} ❌`);
    console.log(`Success Rate: ${percentage}%`);

    if (passed === total) {
        console.log('\n🎉 ALL TESTS PASSED! 🎉');
        console.log('\nThe Company News API is working perfectly!');
    } else {
        console.log('\n⚠️  SOME TESTS FAILED');
        console.log('\nPlease review the failures above and fix the issues.');
    }

    console.log('\n' + '='.repeat(60));
}

// Run tests
runAllTests().catch(error => {
    console.error('\n❌ Fatal error running tests:', error);
    process.exit(1);
});
