// test_functions_locally.js
// A script to test Netlify functions directly without using netlify dev

// Import just the tithiData from sendReminders to test tithi detection
const path = require('path');
const fs = require('fs');
const sendRemindersPath = path.join(__dirname, 'netlify', 'functions', 'sendReminders.js');
const sendRemindersContent = fs.readFileSync(sendRemindersPath, 'utf8');

// Extract the tithiData from sendReminders.js
let tithiData;
try {
  // This is a bit hacky but allows us to extract the embedded tithi data
  const tithiDataMatch = sendRemindersContent.match(/const tithiData = ({[\s\S]*?});/);
  if (tithiDataMatch && tithiDataMatch[1]) {
    // Safely evaluate the extracted JSON string
    tithiData = eval('(' + tithiDataMatch[1] + ')');
  }
} catch (error) {
  console.error('Error extracting tithi data:', error);
}

// Mock date for testing
function setTestDate(dateString) {
  const testDate = new Date(dateString);
  console.log(`Setting test date to: ${testDate.toISOString().split('T')[0]}`);
  return testDate;
}

// Function to find tithis for a given date
function findTithisForDate(date, leadDays = 2) {
  const targetDate = new Date(date);
  targetDate.setDate(targetDate.getDate() + parseInt(leadDays, 10));
  
  const targetDateStr = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD format
  const year = targetDate.getFullYear().toString();
  
  console.log(`Checking Tithis for ${targetDateStr} (${leadDays} days ahead)`);
  
  if (!tithiData || !tithiData[year]) {
    console.log(`No tithi data available for year ${year}`);
    return [];
  }
  
  // Find all tithis that match the target date
  const matchingTithis = [];
  
  for (const [tithiName, tithiList] of Object.entries(tithiData[year])) {
    for (const tithi of tithiList) {
      if (tithi.date === targetDateStr) {
        matchingTithis.push({
          name: tithiName,
          full_name: tithi.full_name,
          date: tithi.date
        });
      }
    }
  }
  
  return matchingTithis;
}

// Function to test tithi detection for various dates
function testTithiDetection(dateString, leadDays = 2) {
  const testDate = setTestDate(dateString);
  const matchingTithis = findTithisForDate(testDate, leadDays);
  
  console.log('Results:');
  if (matchingTithis.length === 0) {
    console.log('No Tithis found for target date.');
  } else {
    console.log(`Found ${matchingTithis.length} Tithis:`);
    matchingTithis.forEach(tithi => {
      console.log(`- ${tithi.full_name} (${tithi.date})`);
    });
  }
  console.log('-----------------------------------');
}

console.log('🔍 Testing Tithi Detection Logic\n');

// Test current date (April 10, 2025) with 2-day lead time (April 12, 2025)
testTithiDetection('2025-04-10', 2);

// Test a date we know has Kamada Ekadashi (April 6, 2025 with 2-day lead looking at April 8th)
testTithiDetection('2025-04-06', 2);

// Test a date with Chaitra Purnima (April 11, 2025 with 2-day lead looking at April 13th)
testTithiDetection('2025-04-11', 2);

// Test some other dates with potentially important tithis
testTithiDetection('2025-05-08', 2); // May 10th
testTithiDetection('2025-06-05', 2); // June 7th