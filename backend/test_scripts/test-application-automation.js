/**
 * Test script for Application Automation features
 * 
 * Prerequisites:
 * 1. Backend server running (npm start)
 * 2. MongoDB connected
 * 3. Valid Clerk authentication token
 * 4. At least one user, job, resume, and cover letter in the database
 * 
 * Usage:
 *   node backend/test_scripts/test-application-automation.js
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000';

// IMPORTANT: Replace with a valid Clerk JWT token
// You can get this from your browser's developer tools when logged in
const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN || 'YOUR_CLERK_JWT_TOKEN_HERE';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${AUTH_TOKEN}`
};

// Test data storage
let testData = {
  jobId: null,
  packageId: null,
  ruleId: null,
  templateId: null,
  checklistId: null
};

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

async function makeRequest(method, endpoint, body = null) {
  try {
    const options = {
      method,
      headers
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}`);
    }
    
    return data;
  } catch (error) {
    throw new Error(`${method} ${endpoint}: ${error.message}`);
  }
}

// Test 1: Generate Application Package
async function testGeneratePackage() {
  logInfo('Test 1: Generate Application Package');
  
  try {
    // First, get a job to use
    const jobsData = await makeRequest('GET', '/api/jobs');
    const jobs = jobsData.data || [];
    
    if (jobs.length === 0) {
      logWarning('No jobs found. Please create a job first.');
      return false;
    }
    
    testData.jobId = jobs[0]._id;
    logInfo(`Using job: ${jobs[0].title} at ${jobs[0].company}`);
    
    // Generate package
    const packageData = await makeRequest('POST', '/api/applications/packages', {
      jobId: testData.jobId,
      autoTailor: true
    });
    
    testData.packageId = packageData.data._id;
    logSuccess(`Package generated: ${packageData.data._id}`);
    logInfo(`Status: ${packageData.data.status}`);
    
    return true;
  } catch (error) {
    logError(error.message);
    return false;
  }
}

// Test 2: Schedule Application
async function testScheduleApplication() {
  logInfo('\nTest 2: Schedule Application');
  
  if (!testData.packageId) {
    logWarning('Skipping (no package ID from previous test)');
    return false;
  }
  
  try {
    // Schedule for tomorrow at 10 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    
    const scheduleData = await makeRequest('POST', '/api/applications/schedule', {
      packageId: testData.packageId,
      scheduledFor: tomorrow.toISOString(),
      autoSubmit: false
    });
    
    logSuccess(`Application scheduled for ${new Date(scheduleData.data.scheduledFor).toLocaleString()}`);
    logInfo(`Package status: ${scheduleData.data.status}`);
    
    return true;
  } catch (error) {
    logError(error.message);
    return false;
  }
}

// Test 3: Create Automation Rule
async function testCreateAutomationRule() {
  logInfo('\nTest 3: Create Automation Rule');
  
  try {
    const ruleData = await makeRequest('POST', '/api/applications/automation/rules', {
      name: 'Auto-apply to remote jobs',
      description: 'Automatically generate packages for remote job opportunities',
      active: true,
      triggers: {
        onJobAdded: true,
        onStatusChange: [],
        onScheduledDate: false
      },
      actions: {
        generatePackage: true,
        scheduleApplication: false,
        sendFollowUp: false,
        updateChecklist: false
      },
      filters: {
        workMode: ['Remote']
      }
    });
    
    testData.ruleId = ruleData.data._id;
    logSuccess(`Automation rule created: ${ruleData.data.name}`);
    logInfo(`Rule ID: ${ruleData.data._id}`);
    
    return true;
  } catch (error) {
    logError(error.message);
    return false;
  }
}

// Test 4: Get Automation Rules
async function testGetAutomationRules() {
  logInfo('\nTest 4: Get Automation Rules');
  
  try {
    const rulesData = await makeRequest('GET', '/api/applications/automation/rules');
    const rules = rulesData.data || [];
    
    logSuccess(`Found ${rules.length} automation rule(s)`);
    rules.forEach(rule => {
      logInfo(`  - ${rule.name} (${rule.active ? 'active' : 'inactive'})`);
    });
    
    return true;
  } catch (error) {
    logError(error.message);
    return false;
  }
}

// Test 5: Create Application Template
async function testCreateTemplate() {
  logInfo('\nTest 5: Create Application Template');
  
  try {
    const templateData = await makeRequest('POST', '/api/applications/templates', {
      name: 'Software Engineer Cover Letter Intro',
      category: 'cover-letter-intro',
      content: `Dear Hiring Manager at {{companyName}},\n\nI am excited to apply for the {{jobTitle}} position. With my background in software development and passion for innovative technology, I believe I would be a great fit for your team.`,
      variables: [
        { name: 'companyName', placeholder: '{{companyName}}', description: 'Company name' },
        { name: 'jobTitle', placeholder: '{{jobTitle}}', description: 'Job title' }
      ],
      tags: ['cover-letter', 'intro', 'software-engineer']
    });
    
    testData.templateId = templateData.data._id;
    logSuccess(`Template created: ${templateData.data.name}`);
    logInfo(`Category: ${templateData.data.category}`);
    
    return true;
  } catch (error) {
    logError(error.message);
    return false;
  }
}

// Test 6: Get Application Templates
async function testGetTemplates() {
  logInfo('\nTest 6: Get Application Templates');
  
  try {
    const templatesData = await makeRequest('GET', '/api/applications/templates');
    const templates = templatesData.data || [];
    
    logSuccess(`Found ${templates.length} template(s)`);
    templates.forEach(template => {
      logInfo(`  - ${template.name} (${template.category})`);
    });
    
    return true;
  } catch (error) {
    logError(error.message);
    return false;
  }
}

// Test 7: Bulk Apply
async function testBulkApply() {
  logInfo('\nTest 7: Bulk Apply');
  
  try {
    // Get multiple jobs
    const jobsData = await makeRequest('GET', '/api/jobs');
    const jobs = jobsData.data || [];
    
    if (jobs.length < 2) {
      logWarning('Need at least 2 jobs for bulk apply test. Skipping.');
      return false;
    }
    
    const jobIds = jobs.slice(0, Math.min(3, jobs.length)).map(job => job._id);
    logInfo(`Applying to ${jobIds.length} jobs...`);
    
    const bulkData = await makeRequest('POST', '/api/applications/bulk-apply', {
      jobIds,
      scheduleDaysOffset: 0,
      autoTailor: true
    });
    
    const { successful, failed } = bulkData.data;
    logSuccess(`Bulk apply completed: ${successful.length} successful, ${failed.length} failed`);
    
    successful.forEach(result => {
      logInfo(`  ✓ ${result.jobTitle}`);
    });
    
    if (failed.length > 0) {
      failed.forEach(result => {
        logWarning(`  ✗ ${result.jobId}: ${result.reason}`);
      });
    }
    
    return true;
  } catch (error) {
    logError(error.message);
    return false;
  }
}

// Test 8: Create Application Checklist
async function testCreateChecklist() {
  logInfo('\nTest 8: Create Application Checklist');
  
  if (!testData.jobId) {
    logWarning('Skipping (no job ID from previous test)');
    return false;
  }
  
  try {
    const checklistData = await makeRequest('POST', '/api/applications/checklists', {
      jobId: testData.jobId,
      items: [
        { task: 'Tailor resume', priority: 'high' },
        { task: 'Write cover letter', priority: 'high' },
        { task: 'Research company', priority: 'medium' },
        { task: 'Prepare portfolio', priority: 'medium' },
        { task: 'Submit application', priority: 'high' }
      ]
    });
    
    testData.checklistId = checklistData.data._id;
    logSuccess(`Checklist created with ${checklistData.data.items.length} items`);
    logInfo(`Progress: ${checklistData.data.progress}%`);
    
    return true;
  } catch (error) {
    logError(error.message);
    return false;
  }
}

// Test 9: Update Checklist Item
async function testUpdateChecklistItem() {
  logInfo('\nTest 9: Update Checklist Item');
  
  if (!testData.jobId || !testData.checklistId) {
    logWarning('Skipping (no checklist from previous test)');
    return false;
  }
  
  try {
    // Get the checklist first
    const checklistData = await makeRequest('GET', `/api/applications/checklists/${testData.jobId}`);
    const checklist = checklistData.data;
    
    if (checklist.items.length === 0) {
      logWarning('No checklist items to update');
      return false;
    }
    
    const firstItemId = checklist.items[0]._id;
    
    // Mark first item as completed
    const updatedData = await makeRequest('PUT', 
      `/api/applications/checklists/${testData.jobId}/items/${firstItemId}`,
      { completed: true }
    );
    
    logSuccess(`Checklist item marked as completed`);
    logInfo(`New progress: ${updatedData.data.progress}%`);
    
    return true;
  } catch (error) {
    logError(error.message);
    return false;
  }
}

// Test 10: Get All Application Packages
async function testGetAllPackages() {
  logInfo('\nTest 10: Get All Application Packages');
  
  try {
    const packagesData = await makeRequest('GET', '/api/applications/packages');
    const packages = packagesData.data || [];
    
    logSuccess(`Found ${packages.length} application package(s)`);
    
    const statusCounts = {};
    packages.forEach(pkg => {
      statusCounts[pkg.status] = (statusCounts[pkg.status] || 0) + 1;
    });
    
    Object.entries(statusCounts).forEach(([status, count]) => {
      logInfo(`  - ${status}: ${count}`);
    });
    
    return true;
  } catch (error) {
    logError(error.message);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  log('\n' + '='.repeat(60), 'blue');
  log('APPLICATION AUTOMATION TEST SUITE', 'blue');
  log('='.repeat(60) + '\n', 'blue');
  
  if (AUTH_TOKEN === 'YOUR_CLERK_JWT_TOKEN_HERE') {
    logError('Please set a valid AUTH_TOKEN in the script or TEST_AUTH_TOKEN environment variable');
    process.exit(1);
  }
  
  const tests = [
    testGeneratePackage,
    testScheduleApplication,
    testCreateAutomationRule,
    testGetAutomationRules,
    testCreateTemplate,
    testGetTemplates,
    testBulkApply,
    testCreateChecklist,
    testUpdateChecklistItem,
    testGetAllPackages
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test();
      if (result) passed++;
      else failed++;
    } catch (error) {
      logError(`Unexpected error: ${error.message}`);
      failed++;
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  log('\n' + '='.repeat(60), 'blue');
  log('TEST SUMMARY', 'blue');
  log('='.repeat(60), 'blue');
  logSuccess(`Passed: ${passed}`);
  if (failed > 0) {
    logError(`Failed: ${failed}`);
  }
  log('='.repeat(60) + '\n', 'blue');
}

// Run tests
runAllTests().catch(error => {
  logError(`Fatal error: ${error.message}`);
  process.exit(1);
});
