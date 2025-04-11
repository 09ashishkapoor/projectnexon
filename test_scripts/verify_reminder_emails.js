/**
 * verify_reminder_emails.js
 * 
 * A comprehensive test script to verify that the reminder system correctly sends emails
 * to subscribers based on their preferences and upcoming tithis.
 * 
 * This script:
 * 1. Creates a test subscriber in Firebase
 * 2. Mocks the Date object to simulate specific dates with known tithis
 * 3. Mocks the Brevo email API to capture outgoing emails
 * 4. Runs the sendReminders function
 * 5. Verifies that emails would be sent to the correct subscribers
 */

// Import required modules
const { handler } = require('../netlify/functions/sendReminders');
const { subscriptionStore } = require('../config/firebase');
const SibApiV3Sdk = require('@getbrevo/brevo');

// Test configuration
const TEST_EMAIL = 'test_subscriber@example.com';
const TEST_TITHI_PREFERENCES = ['Ekadashi', 'Purnima']; // The tithis our test subscriber is interested in

// Store original Date constructor for later restoration
const RealDate = global.Date;

// Mock the current date to test specific scenarios
function mockDate(dateString) {
  const fakeDate = new Date(dateString);
  console.log(`🕒 Mocking current date as: ${fakeDate.toISOString().split('T')[0]}`);
  
  // Replace global Date with our mock
  global.Date = class extends RealDate {
    constructor(...args) {
      if (args.length === 0) {
        return new RealDate(dateString);
      }
      return new RealDate(...args);
    }
    
    static now() {
      return new RealDate(dateString).getTime();
    }
  };
}

// Restore the original Date
function restoreDate() {
  global.Date = RealDate;
}

// Mock the Brevo API to capture email sending attempts
function mockBrevoAPI() {
  const sentEmails = [];
  
  // Store original sendTransacEmail method
  const originalSendTransacEmail = SibApiV3Sdk.TransactionalEmailsApi.prototype.sendTransacEmail;
  
  // Replace with mock that captures emails
  SibApiV3Sdk.TransactionalEmailsApi.prototype.sendTransacEmail = function(emailData) {
    console.log('📧 Email would be sent via Brevo API:');
    console.log(`   From: ${emailData.sender.name} <${emailData.sender.email}>`);
    console.log(`   To: ${emailData.to[0].email}`);
    console.log(`   Subject: ${emailData.subject}`);
    
    // Capture email data for verification
    sentEmails.push({
      to: emailData.to[0].email,
      subject: emailData.subject,
      html: emailData.htmlContent
    });
    
    // Simulate successful API response
    return Promise.resolve({
      messageId: `mock-email-${Math.random().toString(36).substring(7)}`
    });
  };
  
  return {
    sentEmails,
    restore: () => {
      SibApiV3Sdk.TransactionalEmailsApi.prototype.sendTransacEmail = originalSendTransacEmail;
    }
  };
}

// Create a test subscriber in Firebase
async function createTestSubscriber() {
  console.log(`👤 Creating test subscriber: ${TEST_EMAIL}`);
  try {
    // Using the correct method 'set' instead of 'put'
    await subscriptionStore.set(TEST_EMAIL, JSON.stringify(TEST_TITHI_PREFERENCES));
    console.log('✅ Test subscriber created successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to create test subscriber:', error);
    return false;
  }
}

// Remove the test subscriber after tests
async function cleanupTestSubscriber() {
  console.log(`🧹 Removing test subscriber: ${TEST_EMAIL}`);
  try {
    await subscriptionStore.delete(TEST_EMAIL);
    console.log('✅ Test subscriber removed successfully');
  } catch (error) {
    console.error('❌ Failed to remove test subscriber:', error);
  }
}

// Run a test for a specific date
async function runTest(testDate, leadDays = '2', expectedTithiInResult = true) {
  console.log('\n' + '='.repeat(80));
  console.log(`🧪 RUNNING TEST: Date=${testDate}, LeadDays=${leadDays}`);
  console.log('='.repeat(80));
  
  // Set the mock date
  mockDate(testDate);
  
  // Set the reminder lead days environment variable
  process.env.REMINDER_LEAD_DAYS = leadDays;
  
  // Mock the Brevo API
  const brevoMock = mockBrevoAPI();
  
  try {
    console.log('▶️ Running sendReminders function...');
    const result = await handler();
    
    // Print the function result
    console.log(`🔍 Function result (status ${result.statusCode}):`);
    console.log(result.body);
    
    // Calculate expected target date
    const targetDate = new Date(testDate);
    targetDate.setDate(targetDate.getDate() + parseInt(leadDays, 10));
    const targetDateString = targetDate.toISOString().split('T')[0];
    
    // Verify if emails were sent as expected
    if (expectedTithiInResult) {
      // We expect emails to be sent
      if (brevoMock.sentEmails.length > 0) {
        console.log(`\n✅ SUCCESS: ${brevoMock.sentEmails.length} email(s) would be sent!`);
        
        // Check if our test subscriber received an email
        const emailToTestUser = brevoMock.sentEmails.find(e => e.to === TEST_EMAIL);
        if (emailToTestUser) {
          console.log(`✅ SUCCESS: Test subscriber would receive an email!`);
          console.log(`   Subject: ${emailToTestUser.subject}`);
          
          // Extract tithi names from email content
          const tithiMatches = emailToTestUser.html.match(/-\s+([^(]+)/g);
          if (tithiMatches) {
            console.log('\n📆 Tithis mentioned in email:');
            tithiMatches.forEach(match => {
              console.log(`   ${match.replace(/^-\s+/, '').trim()}`);
            });
          }
        } else {
          console.log(`❌ FAIL: Test subscriber would NOT receive an email despite matching preferences!`);
        }
      } else {
        console.log(`❌ FAIL: No emails would be sent despite tithis on ${targetDateString}!`);
      }
    } else {
      // We don't expect emails to be sent
      if (brevoMock.sentEmails.length === 0) {
        console.log(`✅ SUCCESS: No emails sent as expected (no tithis on ${targetDateString})`);
      } else {
        console.log(`❌ FAIL: ${brevoMock.sentEmails.length} email(s) would be sent despite no expected tithis!`);
      }
    }
  } catch (error) {
    console.error('❌ ERROR during test:', error);
  } finally {
    // Restore original Date and API
    restoreDate();
    brevoMock.restore();
  }
}

// Main function to run the verification tests
async function verifyReminderSystem() {
  console.log('🚀 Starting reminder system verification...');
  
  // Ensure environment variables are set
  if (!process.env.BREVO_API_KEY) {
    console.log('⚠️ BREVO_API_KEY not set, using placeholder for testing');
    process.env.BREVO_API_KEY = 'test-api-key';
  }
  
  if (!process.env.SENDER_EMAIL) {
    process.env.SENDER_EMAIL = 'test@example.com';
  }
  
  if (!process.env.SENDER_NAME) {
    process.env.SENDER_NAME = 'Tithi Reminder Test';
  }
  
  // Create test subscriber
  const subscriberCreated = await createTestSubscriber();
  if (!subscriberCreated) {
    console.error('❌ Cannot proceed with tests due to subscriber creation failure');
    return;
  }
  
  try {
    // Test 1: Day before Kamada Ekadashi (April 6, 2025 with 2 days lead time)
    // Should send email about Kamada Ekadashi on April 8, 2025
    await runTest('2025-04-06T12:00:00Z', '2', true);
    
    // Test 2: Day before Chaitra Purnima (April 11, 2025 with 2 days lead time)
    // Should send email about Chaitra Purnima on April 13, 2025
    await runTest('2025-04-11T12:00:00Z', '2', true);
    
    // Test 3: Test with date that has no tithis (April 10, 2025)
    // Should NOT send any emails
    await runTest('2025-04-10T12:00:00Z', '2', false);
    
    // Test 4: Test with different lead time (April 12, 2025 with 1 day lead time - looking at April 13 Chaitra Purnima)
    await runTest('2025-04-12T12:00:00Z', '1', true);
  } finally {
    // Clean up test subscriber
    await cleanupTestSubscriber();
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('🏁 Reminder system verification complete!');
  console.log('='.repeat(80));
}

// Run the verification
verifyReminderSystem()
  .catch(error => {
    console.error('❌ Fatal error during verification:', error);
  });