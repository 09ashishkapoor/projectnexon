const fs = require('fs');
const path = require('path');

// Read the current tithis JSON file
const tithiFilePath = path.join(__dirname, 'tithis_2024_2030.json');
const tithisData = JSON.parse(fs.readFileSync(tithiFilePath, 'utf8'));

// All tithi names in order
const allTithis = [
  'Pratipada',
  'Dwitiya',
  'Tritiya',
  'Chaturthi',
  'Panchami',
  'Shashthi',
  'Saptami',
  'Ashtami',
  'Navami',
  'Dashami',
  'Ekadashi',
  'Dwadashi',
  'Trayodashi',
  'Chaturdashi',
  'Purnima', // This is only in Shukla Paksha (bright half)
  'Amavasya'  // This is only in Krishna Paksha (dark half)
];

// The tithis we need to add (we already have some in the file)
const tithisToAdd = [
  'Pratipada',
  'Dwitiya',
  'Tritiya',
  'Panchami',
  'Shashthi',
  'Saptami',
  'Dashami',
  'Dwadashi',
  'Trayodashi',
  'Chaturdashi'
];

// Helper function to add days to a date
function addDays(dateStr, days) {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0]; // Return in YYYY-MM-DD format
}

// Helper function to subtract days from a date
function subtractDays(dateStr, days) {
  return addDays(dateStr, -days);
}

// Function to get paksha (lunar phase) based on tithi name
function getPaksha(fullName) {
  if (fullName.includes('Krishna')) {
    return 'Krishna';
  }
  if (fullName.includes('Shukla')) {
    return 'Shukla';
  }
  
  // For special named tithis, we need to infer the paksha
  const specialTithis = {
    'Durga Ashtami': 'Shukla',
    'Ram Navami': 'Shukla',
    'Ekadashi': 'Shukla', // Default for named ekadashis
    'Krishna Janmashtami': 'Krishna',
    'Vinayaka Chaturthi': 'Shukla',
    'Ganesh Chaturthi': 'Shukla',
    'Maha Navami': 'Shukla'
  };
  
  // Look for known words in the name
  for (const [name, paksha] of Object.entries(specialTithis)) {
    if (fullName.includes(name)) {
      return paksha;
    }
  }
  
  // If we can't determine, assume Shukla by default
  return 'Shukla';
}

// Function to get month name from full tithi name
function getMonthFromFullName(fullName) {
  const months = [
    'Magha', 'Phalguna', 'Chaitra', 'Vaishakha', 'Jyeshtha', 
    'Ashada', 'Shravana', 'Bhadrapada', 'Ashwin', 'Kartika',
    'Margashirsha', 'Pausha'
  ];
  
  for (const month of months) {
    if (fullName.includes(month)) {
      return month;
    }
  }
  
  return null; // Month not found in name
}

// Process each year
Object.keys(tithisData).forEach(year => {
  const yearData = tithisData[year];
  
  // For each tithi type we already have (like Ashtami, Ekadashi, etc.)
  Object.keys(yearData).forEach(existingTithi => {
    const tithiIndex = allTithis.indexOf(existingTithi);
    if (tithiIndex === -1) return;
    
    // For each entry of this tithi
    yearData[existingTithi].forEach(tithiEntry => {
      const date = tithiEntry.date;
      const fullName = tithiEntry.full_name;
      const paksha = getPaksha(fullName);
      const month = getMonthFromFullName(fullName);
      
      if (!month) return; // Skip if we can't determine the month
      
      // Calculate other tithis based on this one
      tithisToAdd.forEach(newTithi => {
        const newTithiIndex = allTithis.indexOf(newTithi);
        if (newTithiIndex === -1) return;
        
        let daysOffset;
        if (paksha === 'Shukla') {
          daysOffset = newTithiIndex - tithiIndex;
        } else {
          // For Krishna paksha, the order is reversed
          daysOffset = tithiIndex - newTithiIndex;
        }
        
        // Calculate the new date
        const newDate = daysOffset > 0 ? 
          addDays(date, daysOffset) : 
          subtractDays(date, Math.abs(daysOffset));
        
        // Create the full name
        const newFullName = `${month} ${paksha} ${newTithi}`;
        
        // Add to the year data if it doesn't exist
        if (!yearData[newTithi]) {
          yearData[newTithi] = [];
        }
        
        // Check if this date already exists in this tithi's entries to avoid duplicates
        const exists = yearData[newTithi].some(entry => entry.date === newDate);
        if (!exists) {
          yearData[newTithi].push({
            date: newDate,
            full_name: newFullName
          });
        }
      });
    });
  });
  
  // Sort each tithi's entries by date
  Object.keys(yearData).forEach(tithi => {
    yearData[tithi].sort((a, b) => {
      return new Date(a.date) - new Date(b.date);
    });
  });
});

// Write the updated data back to the file
fs.writeFileSync(tithiFilePath, JSON.stringify(tithisData, null, 2));
console.log('All tithis have been added to the JSON file!');