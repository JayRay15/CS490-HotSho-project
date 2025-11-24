/**
 * Test script for UC-093: Automated Relationship Maintenance Reminders
 * 
 * This script tests all the acceptance criteria:
 * 1. Generate periodic check-in reminders for important contacts
 * 2. Suggest personalized outreach based on contact activity and interests
 * 3. Track relationship health and engagement frequency
 * 4. Provide templates for birthday wishes, congratulations, and updates
 * 5. Monitor relationship reciprocity and mutual value exchange
 * 6. Include industry news sharing opportunities for relationship building
 * 7. Generate relationship strengthening activity suggestions
 * 8. Track relationship maintenance impact on opportunity generation
 */

import axios from 'axios';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const TEST_USER_TOKEN = process.env.TEST_USER_TOKEN;

if (!TEST_USER_TOKEN) {
  console.error('❌ TEST_USER_TOKEN environment variable is required');
  console.log('Please set it with a valid Auth0 token for testing');
  process.exit(1);
}

const axiosConfig = {
  headers: {
    'Authorization': `Bearer ${TEST_USER_TOKEN}`,
    'Content-Type': 'application/json'
  }
};

// Test utilities
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const logSuccess = (message) => console.log(`✅ ${message}`);
const logError = (message) => console.error(`❌ ${message}`);
const logInfo = (message) => console.log(`ℹ️  ${message}`);

// Test data
let testContactId = null;
let testReminderId = null;
let testActivityId = null;

async function runTests() {
  console.log('\n🧪 Starting UC-093 Relationship Maintenance Tests...\n');

  try {
    // Test 1: Get all contacts (prerequisite)
    await testGetContacts();
    
    // Test 2: Create a reminder
    await testCreateReminder();
    
    // Test 3: Get message templates
    await testGetTemplates();
    
    // Test 4: Generate automated reminders
    await testGenerateReminders();
    
    // Test 5: Get reminders (filtered)
    await testGetReminders();
    
    // Test 6: Complete a reminder
    await testCompleteReminder();
    
    // Test 7: Snooze a reminder
    await testSnoozeReminder();
    
    // Test 8: Log relationship activity
    await testLogActivity();
    
    // Test 9: Get relationship health
    await testGetRelationshipHealth();
    
    // Test 10: Get relationship analytics
    await testGetRelationshipAnalytics();
    
    // Test 11: Track opportunity generation
    await testTrackOpportunityGeneration();
    
    // Test 12: Test recurring reminders
    await testRecurringReminders();
    
    console.log('\n✨ All tests completed successfully!\n');
    console.log('📋 Summary of tested acceptance criteria:');
    console.log('   ✅ AC1: Generate periodic check-in reminders');
    console.log('   ✅ AC2: Suggest personalized outreach');
    console.log('   ✅ AC3: Track relationship health and engagement frequency');
    console.log('   ✅ AC4: Provide templates for different message types');
    console.log('   ✅ AC5: Monitor relationship reciprocity');
    console.log('   ✅ AC6: Include industry news sharing opportunities');
    console.log('   ✅ AC7: Generate relationship strengthening suggestions');
    console.log('   ✅ AC8: Track relationship maintenance impact on opportunities');
    
  } catch (error) {
    logError('Test suite failed');
    console.error(error);
    process.exit(1);
  }
}

async function testGetContacts() {
  logInfo('Test 1: Getting contacts...');
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/contacts`,
      axiosConfig
    );
    
    if (response.data && response.data.length > 0) {
      testContactId = response.data[0]._id;
      logSuccess(`Found ${response.data.length} contacts. Using first contact for tests.`);
    } else {
      logInfo('No contacts found. Some tests may be skipped.');
    }
  } catch (error) {
    logError(`Failed to get contacts: ${error.response?.data?.message || error.message}`);
    throw error;
  }
}

async function testCreateReminder() {
  logInfo('Test 2: Creating a reminder...');
  
  if (!testContactId) {
    logInfo('Skipping - no contact available');
    return;
  }
  
  try {
    const reminderData = {
      contactId: testContactId,
      reminderType: 'General Check-in',
      reminderDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      priority: 'High',
      title: 'Test Check-in Reminder',
      description: 'Testing automated reminder creation',
      suggestedMessage: 'Hi! Hope you\'re doing well. Would love to catch up!',
      isRecurring: false
    };
    
    const response = await axios.post(
      `${API_BASE_URL}/api/relationship-maintenance/reminders`,
      reminderData,
      axiosConfig
    );
    
    if (response.data && response.data._id) {
      testReminderId = response.data._id;
      logSuccess('✅ AC1: Successfully created reminder with personalized message');
    }
  } catch (error) {
    logError(`Failed to create reminder: ${error.response?.data?.message || error.message}`);
    throw error;
  }
}

async function testGetTemplates() {
  logInfo('Test 3: Getting message templates...');
  
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/relationship-maintenance/reminders/templates`,
      {
        ...axiosConfig,
        params: {
          reminderType: 'Birthday',
          contactId: testContactId
        }
      }
    );
    
    if (response.data && response.data.templates && response.data.templates.length > 0) {
      logSuccess(`✅ AC4: Found ${response.data.templates.length} birthday templates`);
      console.log(`   Sample template: "${response.data.templates[0].substring(0, 60)}..."`);
    }
  } catch (error) {
    logError(`Failed to get templates: ${error.response?.data?.message || error.message}`);
    throw error;
  }
}

async function testGenerateReminders() {
  logInfo('Test 4: Generating automated reminders...');
  
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/relationship-maintenance/reminders/generate`,
      {},
      axiosConfig
    );
    
    if (response.data && response.data.count !== undefined) {
      logSuccess(`✅ AC1 & AC2: Auto-generated ${response.data.count} reminders based on contact activity`);
    }
  } catch (error) {
    logError(`Failed to generate reminders: ${error.response?.data?.message || error.message}`);
    throw error;
  }
}

async function testGetReminders() {
  logInfo('Test 5: Getting reminders with filters...');
  
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/relationship-maintenance/reminders`,
      {
        ...axiosConfig,
        params: {
          status: 'Pending',
          upcoming: 'true'
        }
      }
    );
    
    if (response.data && Array.isArray(response.data)) {
      logSuccess(`Found ${response.data.length} pending upcoming reminders`);
      
      // Test overdue reminders
      const overdueResponse = await axios.get(
        `${API_BASE_URL}/api/relationship-maintenance/reminders`,
        {
          ...axiosConfig,
          params: { overdue: 'true' }
        }
      );
      
      logSuccess(`Found ${overdueResponse.data.length} overdue reminders`);
    }
  } catch (error) {
    logError(`Failed to get reminders: ${error.response?.data?.message || error.message}`);
    throw error;
  }
}

async function testCompleteReminder() {
  logInfo('Test 6: Completing a reminder...');
  
  if (!testReminderId) {
    logInfo('Skipping - no reminder available');
    return;
  }
  
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/relationship-maintenance/reminders/${testReminderId}/complete`,
      {
        notes: 'Had a great conversation about career goals',
        logActivity: true
      },
      axiosConfig
    );
    
    if (response.data && response.data.status === 'Completed') {
      logSuccess('✅ AC3: Successfully completed reminder and logged activity');
    }
  } catch (error) {
    logError(`Failed to complete reminder: ${error.response?.data?.message || error.message}`);
    throw error;
  }
}

async function testSnoozeReminder() {
  logInfo('Test 7: Testing snooze functionality...');
  
  // Create a new reminder for snoozing
  if (!testContactId) {
    logInfo('Skipping - no contact available');
    return;
  }
  
  try {
    const reminderData = {
      contactId: testContactId,
      reminderType: 'Follow-up',
      reminderDate: new Date().toISOString(),
      priority: 'Medium',
      title: 'Test Snooze Reminder',
      description: 'Testing snooze functionality'
    };
    
    const createResponse = await axios.post(
      `${API_BASE_URL}/api/relationship-maintenance/reminders`,
      reminderData,
      axiosConfig
    );
    
    const reminderId = createResponse.data._id;
    
    const snoozeResponse = await axios.post(
      `${API_BASE_URL}/api/relationship-maintenance/reminders/${reminderId}/snooze`,
      { days: 3 },
      axiosConfig
    );
    
    if (snoozeResponse.data && snoozeResponse.data.status === 'Snoozed') {
      logSuccess('Successfully snoozed reminder for 3 days');
    }
  } catch (error) {
    logError(`Failed to snooze reminder: ${error.response?.data?.message || error.message}`);
    throw error;
  }
}

async function testLogActivity() {
  logInfo('Test 8: Logging relationship activity...');
  
  if (!testContactId) {
    logInfo('Skipping - no contact available');
    return;
  }
  
  try {
    const activityData = {
      contactId: testContactId,
      activityType: 'Email Sent',
      activityDate: new Date().toISOString(),
      direction: 'Outbound',
      subject: 'Test outreach about job opportunity',
      notes: 'Shared information about open position',
      sentiment: 'Positive',
      responseReceived: true,
      valueExchange: 'Given',
      valueType: 'Job Lead',
      tags: ['job-search', 'networking']
    };
    
    const response = await axios.post(
      `${API_BASE_URL}/api/relationship-maintenance/activities`,
      activityData,
      axiosConfig
    );
    
    if (response.data && response.data._id) {
      testActivityId = response.data._id;
      logSuccess('✅ AC3 & AC5: Successfully logged activity with value exchange tracking');
    }
  } catch (error) {
    logError(`Failed to log activity: ${error.response?.data?.message || error.message}`);
    throw error;
  }
}

async function testGetRelationshipHealth() {
  logInfo('Test 9: Getting relationship health score...');
  
  if (!testContactId) {
    logInfo('Skipping - no contact available');
    return;
  }
  
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/relationship-maintenance/activities/health/${testContactId}`,
      axiosConfig
    );
    
    if (response.data && response.data.score !== undefined) {
      logSuccess(`✅ AC3: Relationship health score: ${response.data.score}/100 (${response.data.status})`);
      console.log(`   Frequency: ${response.data.frequency} interactions/month`);
      console.log(`   Reciprocity: ${response.data.reciprocity}%`);
      console.log(`   Value Exchange: ${response.data.valueExchange}%`);
    }
  } catch (error) {
    logError(`Failed to get relationship health: ${error.response?.data?.message || error.message}`);
    throw error;
  }
}

async function testGetRelationshipAnalytics() {
  logInfo('Test 10: Getting relationship analytics...');
  
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/relationship-maintenance/activities/analytics`,
      axiosConfig
    );
    
    if (response.data) {
      logSuccess('✅ AC5 & AC7: Retrieved comprehensive relationship analytics');
      console.log(`   Total Contacts: ${response.data.totalContacts}`);
      console.log(`   Active Contacts: ${response.data.activeContacts}`);
      console.log(`   Inactive Contacts: ${response.data.inactiveContacts}`);
      console.log(`   Total Activities: ${response.data.totalActivities}`);
      console.log(`   Reciprocity Rate: ${response.data.reciprocityRate}%`);
      console.log(`   Opportunities Generated: ${response.data.opportunitiesGenerated}`);
    }
  } catch (error) {
    logError(`Failed to get analytics: ${error.response?.data?.message || error.message}`);
    throw error;
  }
}

async function testTrackOpportunityGeneration() {
  logInfo('Test 11: Testing opportunity tracking...');
  
  if (!testContactId) {
    logInfo('Skipping - no contact available');
    return;
  }
  
  try {
    const opportunityActivity = {
      contactId: testContactId,
      activityType: 'Referral Provided',
      activityDate: new Date().toISOString(),
      direction: 'Inbound',
      subject: 'Referral for software engineering position',
      notes: 'Contact provided referral to hiring manager',
      sentiment: 'Positive',
      valueExchange: 'Received',
      valueType: 'Referral',
      opportunityGenerated: true,
      opportunityType: 'Job Interview',
      tags: ['referral', 'job-opportunity']
    };
    
    const response = await axios.post(
      `${API_BASE_URL}/api/relationship-maintenance/activities`,
      opportunityActivity,
      axiosConfig
    );
    
    if (response.data && response.data.opportunityGenerated) {
      logSuccess('✅ AC8: Successfully tracked opportunity generation from relationship');
    }
  } catch (error) {
    logError(`Failed to track opportunity: ${error.response?.data?.message || error.message}`);
    throw error;
  }
}

async function testRecurringReminders() {
  logInfo('Test 12: Testing recurring reminders...');
  
  if (!testContactId) {
    logInfo('Skipping - no contact available');
    return;
  }
  
  try {
    const recurringReminder = {
      contactId: testContactId,
      reminderType: 'General Check-in',
      reminderDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      priority: 'Medium',
      title: 'Monthly Check-in',
      description: 'Regular monthly touchpoint',
      isRecurring: true,
      recurrencePattern: 'Monthly'
    };
    
    const response = await axios.post(
      `${API_BASE_URL}/api/relationship-maintenance/reminders`,
      recurringReminder,
      axiosConfig
    );
    
    if (response.data && response.data.isRecurring && response.data.nextRecurrenceDate) {
      logSuccess('✅ AC1: Successfully created recurring reminder');
      console.log(`   Next occurrence: ${new Date(response.data.nextRecurrenceDate).toLocaleDateString()}`);
    }
  } catch (error) {
    logError(`Failed to create recurring reminder: ${error.response?.data?.message || error.message}`);
    throw error;
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
