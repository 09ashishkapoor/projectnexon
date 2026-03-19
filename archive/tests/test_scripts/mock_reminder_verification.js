/**
 * mock_reminder_verification.js
 * 
 * A simpler verification script that fully mocks Firebase and Brevo
 * to test only the core reminder logic without external dependencies.
 */

const fs = require('fs');
const path = require('path');

// Mock system date for testing specific dates
const RealDate = global.Date;

// Load tithi data from the main JSON file to match production behavior
let tithiData = {};
try {
  const tithiDataPath = path.join(__dirname, '..', 'tithis_2024_2030_basic.json');
  const tithiDataRaw = fs.readFileSync(tithiDataPath, 'utf8');
  tithiData = JSON.parse(tithiDataRaw);
  console.log('Loaded complete tithi data for testing');
} catch (error) {
  console.error('Error loading tithi data from file:', error);
  // Fallback to minimal test data
  tithiData = {
    2025: {
      "Ekadashi": [
        { "date": "2025-04-08", "full_name": "Kamada Ekadashi" }
      ],
      "Purnima": [
        { "date": "2025-04-12", "full_name": "Chaitra Purnima", "special": "Hanuman Jayanti" }
      ]
    }
  };
}

// Mock subscribers database
const mockSubscribers = {
  "test1@example.com": ["Ekadashi", "Purnima"],
  "test2@example.com": ["Purnima"],
  "test3@example.com": ["Ekadashi"],
  "test4@example.com": ["Amavasya"]  // This user won't get emails in our test cases
};

// Mock date for testing
function mockDate(dateString) {
  const fakeDate = new Date(dateString);
  console.log(`🕒 Testing with date: ${fakeDate.toISOString().split('T')[0]}`);
  
  // Replace global Date with mock
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

// Restore original Date
function restoreDate() {
  global.Date = RealDate;
}

// Find upcoming tithis for a specific date
function findUpcomingTithis(testDate, leadDays) {
  // Parse the test date
  const targetDate = new Date(testDate);
  targetDate.setDate(targetDate.getDate() + parseInt(leadDays, 10));
  
  const targetDateStr = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD format
  const year = targetDate.getFullYear().toString();
  
  console.log(`Looking for tithis on: ${targetDateStr} (${leadDays} days ahead)`);
  
  // Find all tithis that match the target date
  const upcomingTithis = [];
  
  if (tithiData[year]) {
    for (const [tithiName, dates] of Object.entries(tithiData[year])) {
      for (const entry of dates) {
        if (entry.date === targetDateStr) {
          upcomingTithis.push({
            name: tithiName,
            fullName: entry.full_name,
            date: entry.date,
          });
        }
      }
    }
  }
  
  return upcomingTithis;
}

// Find which subscribers should be notified about upcoming tithis
function findSubscribersToNotify(upcomingTithis) {
  if (!upcomingTithis.length) {
    console.log('No tithis found for target date.');
    return [];
  }
  
  console.log(`Found ${upcomingTithis.length} tithis for target date:`);
  upcomingTithis.forEach(tithi => {
    console.log(`- ${tithi.fullName} (${tithi.name}) on ${tithi.date}`);
  });
  
  const subscribersToNotify = [];
  
  // Find subscribers who are interested in the upcoming tithis
  for (const [email, preferences] of Object.entries(mockSubscribers)) {
    const matchingTithis = upcomingTithis.filter(tithi => 
      preferences.includes(tithi.name)
    );
    
    if (matchingTithis.length > 0) {
      subscribersToNotify.push({
        email,
        tithis: matchingTithis
      });
    }
  }
  
  return subscribersToNotify;
}

// Simulate sending emails
function simulateSendingEmails(subscribersToNotify, leadDays) {
  if (!subscribersToNotify.length) {
    console.log('No subscribers to notify');
    return [];
  }
  
  console.log(`\n✉️ Would send emails to ${subscribersToNotify.length} subscribers:`);
  
  const sentEmails = [];
  
  subscribersToNotify.forEach(({ email, tithis }) => {
    const tithiListString = tithis
      .map(t => `- ${t.fullName} (${t.name}) on ${t.date}`)
      .join('\n');
    
    console.log(`\n📧 Email to: ${email}`);
    console.log(`Subject: Upcoming Tithi Reminder (in ${leadDays} days)`);
    console.log('Tithis in email:');
    console.log(tithiListString);
    
    sentEmails.push({
      to: email,
      subject: `Upcoming Tithi Reminder for ${tithis[0].date}`,
      tithis: tithis.map(t => t.name)
    });
  });
  
  return sentEmails;
}

// Run a test case
function runTest(testDate, leadDays) {
  console.log('\n' + '='.repeat(80));
  console.log(`🧪 TEST CASE: Date=${testDate}, LeadDays=${leadDays}`);
  console.log('='.repeat(80));
  
  try {
    // Set the mock date
    mockDate(testDate);
    
    // Find upcoming tithis
    const upcomingTithis = findUpcomingTithis(testDate, leadDays);
    
    // Find subscribers to notify
    const subscribersToNotify = findSubscribersToNotify(upcomingTithis);
    
    // Simulate sending emails
    const sentEmails = simulateSendingEmails(subscribersToNotify, leadDays);
    
    // Test summary
    console.log('\n📊 TEST SUMMARY:');
    console.log(`- Date tested: ${testDate}`);
    console.log(`- Target date (${leadDays} days ahead): ${new Date(new Date(testDate).setDate(new Date(testDate).getDate() + parseInt(leadDays))).toISOString().split('T')[0]}`);
    console.log(`- Tithis found: ${upcomingTithis.length}`);
    console.log(`- Subscribers notified: ${subscribersToNotify.length}`);
    console.log(`- Emails that would be sent: ${sentEmails.length}`);
    
    // Test result
    if (upcomingTithis.length > 0 && sentEmails.length > 0) {
      console.log('✅ SUCCESS: Subscribers would be notified about upcoming tithis!');
    } else if (upcomingTithis.length > 0 && sentEmails.length === 0) {
      console.log('❌ FAILURE: Tithis found but no emails would be sent!');
    } else {
      console.log('ℹ️ INFO: No tithis found for this date, so no emails would be sent.');
    }
  } catch (error) {
    console.error('❌ TEST ERROR:', error);
  } finally {
    // Restore the real Date
    restoreDate();
  }
}

// Main verification function
function verifyReminderSystem() {
  console.log('🔍 Tithi Reminder System Verification');
  console.log('====================================');
  
  // Test scenarios
  
  // Test 1: Date with Kamada Ekadashi (April 6 + 2 days = April 8, 2025)
  runTest('2025-04-06T12:00:00Z', 2);
  
  // Test 2: Date with Chaitra Purnima (April 10 + 2 days = April 12, 2025)
  runTest('2025-04-10T12:00:00Z', 2);
  
  // Test 3: Current date with no tithis (April 9 + 2 days = April 11, 2025)
  runTest('2025-04-09T12:00:00Z', 2);
  
  // Test 4: Different lead time (April 11 + 1 day = April 12, 2025 - Chaitra Purnima)
  runTest('2025-04-11T12:00:00Z', 1);
  
  console.log('\n' + '='.repeat(80));
  console.log('🏁 Verification complete!');
  console.log('='.repeat(80));
}

// Run the verification
verifyReminderSystem();