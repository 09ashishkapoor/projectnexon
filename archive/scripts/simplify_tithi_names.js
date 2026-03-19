/**
 * This script simplifies tithi names in the JSON file by removing the month names
 * and using just the paksha (Shukla/Krishna) and tithi type
 */

const fs = require('fs');
const path = require('path');

// Read the current JSON file
const filePath = path.join(__dirname, 'tithis_2024_2030_basic.json');
const outputPath = path.join(__dirname, 'tithis_2024_2030_simplified.json');
let tithisData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Special cases where we want to keep the full name
const specialTithis = [
  "Thai Pongal",
  "Vasant Panchami",
  "Holi",
  "Maha Shivaratri",
  "Ugadi/Gudi Padwa",
  "Gudi Padwa/Ugadi",
  "Ram Navami",
  "Krishna Janmashtami",
  "Ganesh Chaturthi",
  "Durga Ashtami",
  "Maha Navami",
  "Vijaya Dashami (Dussehra)",
  "Dussehra",
  "Diwali (Deepavali)",
  "Chhath Puja",
  "Buddha Purnima",
  "Vaishakha Purnima (Buddha Purnima)",
  "Hanuman Jayanti",
  "Chaitra Purnima (Hanuman Jayanti)",
  "Sharad Purnima",
  "Mahalaya Amavasya"
];

// Function to simplify a tithi name
function simplifyTithiName(fullName) {
  // Check if it's a special case that we want to preserve
  for (const special of specialTithis) {
    if (fullName.includes(special)) {
      return special;
    }
  }
  
  // Otherwise, extract just the paksha and tithi
  const krishnaMatch = fullName.match(/Krishna\s+(\w+)/);
  const shuklaMatch = fullName.match(/Shukla\s+(\w+)/);
  
  if (krishnaMatch) {
    return `Krishna ${krishnaMatch[1]}`;
  } else if (shuklaMatch) {
    return `Shukla ${shuklaMatch[1]}`;
  } else if (fullName.includes("Purnima")) {
    // Purnima is always in Shukla Paksha
    return "Purnima";
  } else if (fullName.includes("Amavasya")) {
    // Amavasya is always at the end of Krishna Paksha
    return "Amavasya";
  }
  
  // If no pattern matched, return the original name
  return fullName;
}

// Process each year
for (const year in tithisData) {
  // Process each tithi type
  for (const tithiType in tithisData[year]) {
    // Process each occurrence of this tithi
    tithisData[year][tithiType].forEach(entry => {
      if (entry.full_name) {
        entry.full_name = simplifyTithiName(entry.full_name);
      }
    });
  }
}

// Write the modified data back to a new file
fs.writeFileSync(outputPath, JSON.stringify(tithisData, null, 2), 'utf8');
console.log(`Simplified tithi names written to ${outputPath}`);