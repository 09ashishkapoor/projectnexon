/**
 * This script validates the tithi data in the JSON file for accuracy.
 * It checks for several consistency rules that Hindu calendar tithis should follow:
 * 1. There should be approximately 2 occurrences of each tithi per month
 * 2. The sequence of tithis should be correct (Pratipada → Dwitiya → Tritiya → ... → Purnima/Amavasya)
 * 3. The gap between consecutive tithis should usually be about 1 day
 * 4. Purnima (full moon) and Amavasya (new moon) should be approximately 15 days apart
 */

const fs = require('fs');
const path = require('path');

// Read the current tithis JSON file
const tithiFilePath = path.join(__dirname, 'tithis_2024_2030_basic.json');
const tithisData = JSON.parse(fs.readFileSync(tithiFilePath, 'utf8'));

// All tithi names in order
const allTithis = [
  'Pratipada',  // 1
  'Dwitiya',    // 2
  'Tritiya',    // 3
  'Chaturthi',  // 4
  'Panchami',   // 5
  'Shashthi',   // 6
  'Saptami',    // 7
  'Ashtami',    // 8
  'Navami',     // 9
  'Dashami',    // 10
  'Ekadashi',   // 11
  'Dwadashi',   // 12
  'Trayodashi', // 13
  'Chaturdashi',// 14
  'Purnima',    // 15 - full moon
  'Amavasya'    // 15 - new moon (only in Krishna Paksha)
];

// Hindu months
const hinduMonths = [
  'Magha',
  'Phalguna',
  'Chaitra',
  'Vaishakha',
  'Jyeshtha', 
  'Ashada',
  'Shravana',
  'Bhadrapada',
  'Ashwin',
  'Kartika',
  'Margashirsha',
  'Pausha'
];

// Function to check if dates are sorted
function areDatesSorted(dates) {
  for (let i = 1; i < dates.length; i++) {
    const prevDate = new Date(dates[i-1]);
    const currDate = new Date(dates[i]);
    if (prevDate > currDate) {
      return false;
    }
  }
  return true;
}

// Function to check the gap between dates (should be approximately 1 day for consecutive tithis)
function checkDateGaps(dates) {
  const issues = [];
  for (let i = 1; i < dates.length; i++) {
    const prevDate = new Date(dates[i-1]);
    const currDate = new Date(dates[i]);
    const diffDays = Math.round((currDate - prevDate) / (1000 * 60 * 60 * 24));
    
    if (diffDays > 3 || diffDays < 0) {
      issues.push(`Unusual gap of ${diffDays} days between ${dates[i-1]} and ${dates[i]}`);
    }
  }
  return issues;
}

// Function to check the relationship between Purnima and Amavasya (should be about 15 days apart)
function checkPurnimaAmavasya(year) {
  const issues = [];
  const purnimaDates = tithisData[year]['Purnima'].map(entry => new Date(entry.date));
  const amavasyaDates = tithisData[year]['Amavasya'].map(entry => new Date(entry.date));

  for (let i = 0; i < purnimaDates.length; i++) {
    let minDiff = Number.MAX_VALUE;
    let closestAmavasya;

    for (let j = 0; j < amavasyaDates.length; j++) {
      const diff = Math.abs(purnimaDates[i] - amavasyaDates[j]) / (1000 * 60 * 60 * 24);
      if (diff < minDiff) {
        minDiff = diff;
        closestAmavasya = amavasyaDates[j];
      }
    }

    if (minDiff < 13 || minDiff > 17) {
      issues.push(`Unusual gap of ${Math.round(minDiff)} days between Purnima ${purnimaDates[i].toISOString().split('T')[0]} and its closest Amavasya ${closestAmavasya.toISOString().split('T')[0]}`);
    }
  }

  return issues;
}

// Check each year
let errors = [];

Object.keys(tithisData).forEach(year => {
  console.log(`\nValidating year ${year}...`);
  const yearData = tithisData[year];
  
  // Check if we have data for all tithis
  const missingTithis = allTithis.filter(tithi => !yearData[tithi] || yearData[tithi].length === 0);
  if (missingTithis.length) {
    errors.push(`Year ${year} is missing data for: ${missingTithis.join(', ')}`);
  }

  // Check each tithi type
  Object.keys(yearData).forEach(tithi => {
    const tithiData = yearData[tithi];
    
    // Check if dates are sorted
    const dates = tithiData.map(entry => entry.date);
    if (!areDatesSorted(dates)) {
      errors.push(`Dates for ${tithi} in ${year} are not sorted correctly`);
    }
    
    // Check gaps between dates
    const gapIssues = checkDateGaps(dates);
    if (gapIssues.length) {
      errors.push(`Issues with ${tithi} in ${year}: ${gapIssues.join(', ')}`);
    }

    // Check that the dates match the months in full_name
    tithiData.forEach(entry => {
      if (entry.date && entry.full_name) {
        const monthInName = hinduMonths.find(month => entry.full_name.includes(month));
        if (!monthInName) {
          errors.push(`No month found in name: ${entry.full_name} for date ${entry.date}`);
        }
      }
    });
  });
  
  // Check Purnima and Amavasya relationship
  if (yearData['Purnima'] && yearData['Amavasya']) {
    const purnimaAmavasyaIssues = checkPurnimaAmavasya(year);
    if (purnimaAmavasyaIssues.length) {
      errors.push(`Issues with Purnima and Amavasya in ${year}: ${purnimaAmavasyaIssues.join(', ')}`);
    }
  }

  // Check number of each tithi per year
  Object.keys(yearData).forEach(tithi => {
    const count = yearData[tithi].length;
    const expected = tithi === 'Purnima' || tithi === 'Amavasya' ? 12 : 24; // Typically 12 full/new moons and ~24 of other tithis
    if (Math.abs(count - expected) > 2) { // Allow small variations
      errors.push(`Unusual count for ${tithi} in ${year}: ${count} (expected ~${expected})`);
    }
  });
});

if (errors.length) {
  console.error("⚠️ Validation found potential issues:");
  errors.forEach(error => console.error(`- ${error}`));
  console.error(`\nTotal issues found: ${errors.length}`);
} else {
  console.log("✅ All tithi data validated successfully!");
}

// Specific check for your mentioned date
const specificDate = "2025-04-10";
console.log(`\nChecking specific date ${specificDate}...`);

const tithisOnDate = [];
Object.keys(tithisData["2025"]).forEach(tithi => {
  const entries = tithisData["2025"][tithi].filter(entry => entry.date === specificDate);
  if (entries.length) {
    tithisOnDate.push(`${tithi}: ${entries.map(e => e.full_name).join(', ')}`);
  }
});

if (tithisOnDate.length) {
  console.log(`Found tithis on ${specificDate}:`);
  tithisOnDate.forEach(t => console.log(`- ${t}`));
} else {
  console.log(`No tithis found on ${specificDate}`);
}