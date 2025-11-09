/**
 * UC-054: Cover Letter Export - Test Script
 * Tests all export endpoints to verify functionality
 * 
 * Usage: node backend/src/test_scripts/test-cover-letter-export.js
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:5001';
const TEST_USER_TOKEN = process.env.TEST_AUTH_TOKEN || 'your-test-jwt-token-here';

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m'
};

const log = {
    info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
    success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
    warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
    section: (msg) => console.log(`\n${colors.magenta}━━━ ${msg} ━━━${colors.reset}\n`)
};

// Test data
const testCoverLetter = {
    name: 'Test Cover Letter',
    content: `Dear Hiring Manager,

I am writing to express my strong interest in the Software Engineer position at Tech Company. With my background in software development and proven track record of delivering high-quality applications, I am confident in my ability to contribute effectively to your team.

In my previous role at Previous Company, I successfully developed and deployed multiple web applications using modern technologies. This experience has equipped me with strong problem-solving skills and the ability to work collaboratively in fast-paced environments.

I am particularly drawn to Tech Company because of your innovative approach to technology and commitment to excellence. I am excited about the opportunity to bring my expertise to your organization and contribute to your continued success.

Thank you for considering my application. I look forward to the opportunity to discuss how my skills and experiences align with your needs.

Sincerely,
John Doe`,
    style: 'formal'
};

const testExportOptions = {
    letterhead: {
        enabled: true,
        alignment: 'left',
        name: 'John Doe',
        address: '123 Main Street, City, State 12345',
        phone: '(555) 123-4567',
        email: 'john.doe@example.com',
        website: 'https://johndoe.com'
    },
    jobDetails: {
        company: 'Tech Company',
        jobTitle: 'Software Engineer',
        hiringManager: 'Jane Smith',
        companyAddress: '456 Tech Avenue, Tech City, TC 67890'
    },
    printOptimized: true,
    includeHeader: true
};

/**
 * Helper to make authenticated API requests
 */
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const defaultHeaders = {
        'Authorization': `Bearer ${TEST_USER_TOKEN}`,
        'Content-Type': 'application/json'
    };

    const response = await fetch(url, {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers
        }
    });

    return response;
}

/**
 * Test 1: Create a test cover letter
 */
async function testCreateCoverLetter() {
    log.section('Test 1: Create Test Cover Letter');

    try {
        log.info('Creating test cover letter...');

        const response = await apiRequest('/api/cover-letters', {
            method: 'POST',
            body: JSON.stringify(testCoverLetter)
        });

        if (!response.ok) {
            const error = await response.text();
            log.error(`Failed to create cover letter: ${response.status} ${response.statusText}`);
            log.error(`Response: ${error}`);
            return null;
        }

        const data = await response.json();
        const coverLetterId = data.data?.coverLetter?._id;

        if (!coverLetterId) {
            log.error('No cover letter ID in response');
            log.error(`Response: ${JSON.stringify(data, null, 2)}`);
            return null;
        }

        log.success(`Cover letter created with ID: ${coverLetterId}`);
        return coverLetterId;
    } catch (error) {
        log.error(`Error creating cover letter: ${error.message}`);
        return null;
    }
}

/**
 * Test 2: Export as PDF
 */
async function testExportPdf(coverLetterId) {
    log.section('Test 2: Export as PDF');

    try {
        log.info('Exporting cover letter as PDF...');

        const response = await apiRequest(`/api/cover-letters/${coverLetterId}/export/pdf`, {
            method: 'POST',
            body: JSON.stringify(testExportOptions)
        });

        if (!response.ok) {
            const error = await response.text();
            log.error(`Failed to export PDF: ${response.status} ${response.statusText}`);
            log.error(`Response: ${error}`);
            return false;
        }

        const buffer = await response.arrayBuffer();
        const outputPath = path.join(__dirname, 'test-export.pdf');
        fs.writeFileSync(outputPath, Buffer.from(buffer));

        const fileSizeKB = Math.round(buffer.byteLength / 1024);
        log.success(`PDF exported successfully (${fileSizeKB} KB)`);
        log.info(`Saved to: ${outputPath}`);
        return true;
    } catch (error) {
        log.error(`Error exporting PDF: ${error.message}`);
        return false;
    }
}

/**
 * Test 3: Export as DOCX
 */
async function testExportDocx(coverLetterId) {
    log.section('Test 3: Export as DOCX');

    try {
        log.info('Exporting cover letter as DOCX...');

        const response = await apiRequest(`/api/cover-letters/${coverLetterId}/export/docx`, {
            method: 'POST',
            body: JSON.stringify(testExportOptions)
        });

        if (!response.ok) {
            const error = await response.text();
            log.error(`Failed to export DOCX: ${response.status} ${response.statusText}`);
            log.error(`Response: ${error}`);
            return false;
        }

        const buffer = await response.arrayBuffer();
        const outputPath = path.join(__dirname, 'test-export.docx');
        fs.writeFileSync(outputPath, Buffer.from(buffer));

        const fileSizeKB = Math.round(buffer.byteLength / 1024);
        log.success(`DOCX exported successfully (${fileSizeKB} KB)`);
        log.info(`Saved to: ${outputPath}`);
        return true;
    } catch (error) {
        log.error(`Error exporting DOCX: ${error.message}`);
        return false;
    }
}

/**
 * Test 4: Export as HTML
 */
async function testExportHtml(coverLetterId) {
    log.section('Test 4: Export as HTML');

    try {
        log.info('Exporting cover letter as HTML...');

        const response = await apiRequest(`/api/cover-letters/${coverLetterId}/export/html`, {
            method: 'POST',
            body: JSON.stringify(testExportOptions)
        });

        if (!response.ok) {
            const error = await response.text();
            log.error(`Failed to export HTML: ${response.status} ${response.statusString}`);
            log.error(`Response: ${error}`);
            return false;
        }

        const html = await response.text();
        const outputPath = path.join(__dirname, 'test-export.html');
        fs.writeFileSync(outputPath, html);

        const fileSizeKB = Math.round(html.length / 1024);
        log.success(`HTML exported successfully (${fileSizeKB} KB)`);
        log.info(`Saved to: ${outputPath}`);
        return true;
    } catch (error) {
        log.error(`Error exporting HTML: ${error.message}`);
        return false;
    }
}

/**
 * Test 5: Export as Plain Text
 */
async function testExportText(coverLetterId) {
    log.section('Test 5: Export as Plain Text');

    try {
        log.info('Exporting cover letter as plain text...');

        const response = await apiRequest(`/api/cover-letters/${coverLetterId}/export/text`, {
            method: 'POST',
            body: JSON.stringify(testExportOptions)
        });

        if (!response.ok) {
            const error = await response.text();
            log.error(`Failed to export text: ${response.status} ${response.statusText}`);
            log.error(`Response: ${error}`);
            return false;
        }

        const text = await response.text();
        const outputPath = path.join(__dirname, 'test-export.txt');
        fs.writeFileSync(outputPath, text);

        const lines = text.split('\n').length;
        log.success(`Plain text exported successfully (${lines} lines)`);
        log.info(`Saved to: ${outputPath}`);
        return true;
    } catch (error) {
        log.error(`Error exporting text: ${error.message}`);
        return false;
    }
}

/**
 * Test 6: Generate Email Template
 */
async function testEmailTemplate(coverLetterId) {
    log.section('Test 6: Generate Email Template');

    try {
        log.info('Generating email template...');

        const response = await apiRequest(`/api/cover-letters/${coverLetterId}/email-template`, {
            method: 'POST',
            body: JSON.stringify({ jobDetails: testExportOptions.jobDetails })
        });

        if (!response.ok) {
            const error = await response.text();
            log.error(`Failed to generate email template: ${response.status} ${response.statusText}`);
            log.error(`Response: ${error}`);
            return false;
        }

        const data = await response.json();
        const emailTemplate = data.data?.emailTemplate;

        if (!emailTemplate) {
            log.error('No email template in response');
            return false;
        }

        log.success('Email template generated successfully');
        log.info(`Subject: ${emailTemplate.subject}`);
        log.info(`Body length: ${emailTemplate.body.length} characters`);

        // Save to file for inspection
        const outputPath = path.join(__dirname, 'test-email-template.json');
        fs.writeFileSync(outputPath, JSON.stringify(emailTemplate, null, 2));
        log.info(`Saved to: ${outputPath}`);

        return true;
    } catch (error) {
        log.error(`Error generating email template: ${error.message}`);
        return false;
    }
}

/**
 * Test 7: Cleanup - Delete test cover letter
 */
async function testCleanup(coverLetterId) {
    log.section('Test 7: Cleanup');

    try {
        log.info('Deleting test cover letter...');

        const response = await apiRequest(`/api/cover-letters/${coverLetterId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const error = await response.text();
            log.warn(`Failed to delete cover letter: ${response.status} ${response.statusText}`);
            log.warn(`You may need to manually delete cover letter ID: ${coverLetterId}`);
            return false;
        }

        log.success('Test cover letter deleted successfully');
        return true;
    } catch (error) {
        log.warn(`Error deleting cover letter: ${error.message}`);
        return false;
    }
}

/**
 * Main test runner
 */
async function runTests() {
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║  UC-054: Cover Letter Export - Test Suite            ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');

    log.info(`API Base URL: ${API_BASE_URL}`);
    log.info(`Auth Token: ${TEST_USER_TOKEN.substring(0, 20)}...`);

    // Check if auth token is set
    if (TEST_USER_TOKEN === 'your-test-jwt-token-here') {
        log.error('Please set TEST_AUTH_TOKEN environment variable with a valid JWT token');
        log.info('Usage: TEST_AUTH_TOKEN=<your-token> node test-cover-letter-export.js');
        process.exit(1);
    }

    const results = {
        passed: 0,
        failed: 0,
        total: 6
    };

    // Run tests
    const coverLetterId = await testCreateCoverLetter();

    if (!coverLetterId) {
        log.error('Failed to create test cover letter. Cannot proceed with export tests.');
        process.exit(1);
    }

    const tests = [
        { name: 'Export PDF', fn: () => testExportPdf(coverLetterId) },
        { name: 'Export DOCX', fn: () => testExportDocx(coverLetterId) },
        { name: 'Export HTML', fn: () => testExportHtml(coverLetterId) },
        { name: 'Export Text', fn: () => testExportText(coverLetterId) },
        { name: 'Email Template', fn: () => testEmailTemplate(coverLetterId) }
    ];

    for (const test of tests) {
        const success = await test.fn();
        if (success) {
            results.passed++;
        } else {
            results.failed++;
        }
    }

    // Cleanup
    await testCleanup(coverLetterId);

    // Print summary
    log.section('Test Summary');
    console.log(`Total Tests: ${results.total}`);
    console.log(`${colors.green}Passed: ${results.passed}${colors.reset}`);
    console.log(`${colors.red}Failed: ${results.failed}${colors.reset}`);
    console.log(`Success Rate: ${Math.round((results.passed / results.total) * 100)}%\n`);

    if (results.failed === 0) {
        log.success('All tests passed! 🎉');
        process.exit(0);
    } else {
        log.error('Some tests failed. Please check the logs above.');
        process.exit(1);
    }
}

// Run tests
runTests().catch(error => {
    log.error(`Fatal error: ${error.message}`);
    console.error(error);
    process.exit(1);
});
