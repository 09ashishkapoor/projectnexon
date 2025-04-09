/**
 * This script simplifies all tithi names in the JSON file to just their basic form
 * - Removes all month names
 * - Removes all special festival names
 * - Uses consistent naming across all entries
 */

const fs = require('fs');
const path = require('path');

// Read the current JSON file
const filePath = path.join(__dirname, 'tithis_2024_2030_basic.json');
const outputPath = path.join(__dirname, 'tithis_2024_2030_basic.json');
let tithisData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Function to simplify a tithi name to its most basic form
function simplifyTithiName(fullName, tithiType) {
  // For Purnima and Amavasya, use just the simple name without any prefix
  if (tithiType === 'Purnima') {
    return 'Purnima';
  } else if (tithiType === 'Amavasya') {
    return 'Amavasya';
  }
  
  // For all other tithis, extract just the paksha
  const krishnaMatch = fullName.includes('Krishna');
  const shuklaMatch = fullName.includes('Shukla');
  
  if (krishnaMatch) {
    return `Krishna ${tithiType}`;
  } else if (shuklaMatch) {
    return `Shukla ${tithiType}`;
  }
  
  // If no paksha found, just return the tithi type
  return tithiType;
}

// Keep track of entries that are missing dates
const missingDates = [];

// Process each year
for (const year in tithisData) {
  console.log(`Processing year: ${year}`);
  
  // Process each tithi type
  for (const tithiType in tithisData[year]) {
    // Process each occurrence of this tithi
    tithisData[year][tithiType].forEach((entry, index) => {
      // Check if this entry has a date
      if (!entry.date) {
        missingDates.push(`Year ${year}, ${tithiType} #${index}`);
      }
      
      // Simplify the name
      if (entry.full_name) {
        entry.full_name = simplifyTithiName(entry.full_name, tithiType);
      }
    });
    
    // Filter out entries that don't have dates
    tithisData[year][tithiType] = tithisData[year][tithiType].filter(entry => entry.date);
  }
}

// Write the modified data back to a new file
fs.writeFileSync(outputPath, JSON.stringify(tithisData, null, 2), 'utf8');
console.log(`Simplified tithi names written to ${outputPath}`);

// Report on entries without dates
if (missingDates.length > 0) {
  console.log(`\nWarning: ${missingDates.length} entries were missing date properties:`);
  missingDates.forEach(entry => console.log(` - ${entry}`));
}