/**
 * Tithi Reminder Subscription Test Script
 * 
 * This script tests the following functionality:
 * 1. Making a test subscription to the Tithi Reminder service
 * 2. Verifying the subscription was stored in Netlify Blobs
 * 3. Testing the unsubscribe functionality
 * 
 * Usage:
 * node test_subscription.js
 */

const fetch = require('node-fetch');
const { execSync } = require('child_process');

// Configuration
const BASE_URL = 'https://simpletithireminder.netlify.app';
const TEST_EMAIL = `test-${Date.now()}@gmail.com`;  // Use a timestamp to ensure uniqueness
const SELECTED_TITHIS = ['Ashtami', 'Purnima'];

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

/**
 * Log a message with a color
 */
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Make a subscription request
 */
async function testSubscribe() {
  log('🧪 RUNNING SUBSCRIPTION TEST', colors.cyan);
  log(`📧 Using test email: ${TEST_EMAIL}`, colors.blue);
  log(`📅 Selected Tithis: ${SELECTED_TITHIS.join(', ')}`, colors.blue);

  try {
    // Prepare payload (no actual reCAPTCHA token for test)
    const payload = {
      email: TEST_EMAIL,
      selectedTithis: SELECTED_TITHIS,
      // For testing purposes, add a mock CAPTCHA token
      'g-recaptcha-response': 'test-token'
    };

    log('📤 Sending subscription request...', colors.yellow);
    
    // Send the subscription request
    const response = await fetch(`${BASE_URL}/.netlify/functions/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    if (response.ok) {
      log(`✅ Subscription response: ${JSON.stringify(data)}`, colors.green);
    } else {
      log(`❌ Subscription failed: ${JSON.stringify(data)}`, colors.red);
      // If there was an error, let's log more context
      log(`Response status: ${response.status}`, colors.red);
    }
    
    return response.ok;
  } catch (error) {
    log(`❌ Error making subscription request: ${error.message}`, colors.red);
    return false;
  }
}

/**
 * Verify the subscription was stored in Netlify Blobs
 */
async function verifySubscription() {
  log('\n🧪 VERIFYING SUBSCRIPTION IN NETLIFY BLOBS', colors.cyan);
  
  try {
    log('📋 Listing blobs in subscriptions store...', colors.yellow);
    const listOutput = execSync('netlify blobs:list subscriptions').toString();
    log(`📃 Blob list output: ${listOutput}`, colors.blue);
    
    // Check if our test email is in the list
    const hasEmail = listOutput.includes(TEST_EMAIL.toLowerCase());
    
    if (hasEmail) {
      log('✅ Test email found in blob store!', colors.green);
      
      // Get the specific subscription data
      log('🔍 Getting subscription data...', colors.yellow);
      const blobData = execSync(`netlify blobs:get subscriptions ${TEST_EMAIL.toLowerCase()}`).toString();
      log(`📄 Blob data: ${blobData}`, colors.blue);
      
      try {
        const parsedData = JSON.parse(blobData);
        if (Array.isArray(parsedData)) {
          const allTithisFound = SELECTED_TITHIS.every(tithi => parsedData.includes(tithi));
          if (allTithisFound) {
            log('✅ All selected Tithis found in the data!', colors.green);
            return true;
          } else {
            log('❌ Some selected Tithis are missing from the data', colors.red);
          }
        } else {
          log('❌ Blob data is not an array as expected', colors.red);
        }
      } catch (parseError) {
        log(`❌ Failed to parse blob data: ${parseError.message}`, colors.red);
      }
    } else {
      log('❌ Test email not found in blob store', colors.red);
    }
    
    return false;
  } catch (error) {
    log(`❌ Error verifying subscription: ${error.message}`, colors.red);
    return false;
  }
}

/**
 * Test the unsubscribe functionality
 */
async function testUnsubscribe() {
  log('\n🧪 TESTING UNSUBSCRIBE FUNCTIONALITY', colors.cyan);
  
  try {
    log('🗑️ Unsubscribing test email...', colors.yellow);
    
    // Send the unsubscribe request
    const response = await fetch(`${BASE_URL}/.netlify/functions/unsubscribe?email=${TEST_EMAIL.toLowerCase()}`);
    const data = await response.json();
    
    if (response.ok) {
      log(`✅ Unsubscribe response: ${JSON.stringify(data)}`, colors.green);
      
      // Verify the email was removed from the blob store
      try {
        log('🔍 Verifying email was removed from blob store...', colors.yellow);
        const listOutput = execSync('netlify blobs:list subscriptions').toString();
        const stillHasEmail = listOutput.includes(TEST_EMAIL.toLowerCase());
        
        if (stillHasEmail) {
          log('❌ Test email still found in blob store after unsubscribe', colors.red);
          return false;
        } else {
          log('✅ Test email successfully removed from blob store!', colors.green);
          return true;
        }
      } catch (error) {
        log(`❌ Error verifying unsubscribe: ${error.message}`, colors.red);
        return false;
      }
    } else {
      log(`❌ Unsubscribe failed: ${JSON.stringify(data)}`, colors.red);
      return false;
    }
  } catch (error) {
    log(`❌ Error making unsubscribe request: ${error.message}`, colors.red);
    return false;
  }
}

/**
 * Main test function
 */
async function runTests() {
  log('🚀 STARTING TITHI REMINDER SUBSCRIPTION TESTS', colors.magenta);
  
  // Step 1: Test subscription
  const subscribeSuccess = await testSubscribe();
  if (!subscribeSuccess) {
    log('❌ Subscription test failed, stopping tests', colors.red);
    return;
  }
  
  // Step 2: Verify subscription in Netlify Blobs
  const verifySuccess = await verifySubscription();
  if (!verifySuccess) {
    log('❌ Verification test failed, continuing to cleanup', colors.red);
  }
  
  // Step 3: Test unsubscribe functionality
  const unsubscribeSuccess = await testUnsubscribe();
  
  // Test summary
  log('\n📊 TEST SUMMARY', colors.magenta);
  log(`Subscription: ${subscribeSuccess ? '✅ PASS' : '❌ FAIL'}`, subscribeSuccess ? colors.green : colors.red);
  log(`Verification: ${verifySuccess ? '✅ PASS' : '❌ FAIL'}`, verifySuccess ? colors.green : colors.red);
  log(`Unsubscribe: ${unsubscribeSuccess ? '✅ PASS' : '❌ FAIL'}`, unsubscribeSuccess ? colors.green : colors.red);
  
  if (subscribeSuccess && verifySuccess && unsubscribeSuccess) {
    log('\n🎉 ALL TESTS PASSED! The Tithi Reminder subscription system is working correctly.', colors.green);
  } else {
    log('\n❌ SOME TESTS FAILED. Please check the logs above for details.', colors.red);
  }
}

// Run the tests
runTests().catch(error => {
  log(`💥 Unhandled error in tests: ${error.message}`, colors.red);
});