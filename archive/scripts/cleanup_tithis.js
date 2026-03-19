/**
 * This script helps manage and clean up tithi JSON files
 * It can archive unused files and update the main JSON file
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Create a folder for archive if it doesn't exist
const archiveDir = path.join(__dirname, 'archive');
if (!fs.existsSync(archiveDir)) {
  fs.mkdirSync(archiveDir);
}

// Define the main JSON file and all related files
const MAIN_JSON_FILE = 'tithis_2024_2030_basic.json';
const tithiFiles = [
  'tithis_2024_2030_accurate.json',
  'tithis_2024_2030_backup.json',
  'tithis_2024_2030_basic.json',
  'tithis_2024_2030_simplified.json'
];

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to archive a file
function archiveFile(filename) {
  try {
    if (fs.existsSync(filename)) {
      const destPath = path.join(archiveDir, path.basename(filename));
      fs.copyFileSync(filename, destPath);
      fs.unlinkSync(filename);
      console.log(`✅ Archived ${filename} to ${destPath}`);
      return true;
    }
  } catch (err) {
    console.error(`❌ Error archiving ${filename}: ${err.message}`);
  }
  return false;
}

// Function to replace main JSON with a different version
function replaceMainJson(replacementFile) {
  try {
    if (fs.existsSync(replacementFile)) {
      // Make backup of current main file if it doesn't exist already
      const backupFile = 'tithis_2024_2030_backup.json';
      if (!fs.existsSync(backupFile)) {
        fs.copyFileSync(MAIN_JSON_FILE, backupFile);
        console.log(`✅ Backed up current main JSON to ${backupFile}`);
      }
      
      // Replace the main file
      fs.copyFileSync(replacementFile, MAIN_JSON_FILE);
      console.log(`✅ Updated ${MAIN_JSON_FILE} with contents from ${replacementFile}`);
      
      // Archive the replacement file
      return archiveFile(replacementFile);
    } else {
      console.error(`❌ Replacement file ${replacementFile} not found`);
      return false;
    }
  } catch (err) {
    console.error(`❌ Error replacing main JSON: ${err.message}`);
    return false;
  }
}

// Function to check if a file is in use
function checkFileUsage() {
  const scriptContent = fs.readFileSync('script.js', 'utf8');
  const regex = /fetch\(['"]([^'"]+)['"]\)/;
  const match = scriptContent.match(regex);
  if (match) {
    console.log(`📝 Current JSON file used in script.js: ${match[1]}`);
    return match[1];
  }
  return null;
}

// Main menu
function showMenu() {
  console.log('\n===== TITHI JSON FILES MANAGEMENT =====');
  console.log('1. Archive all unused JSON files');
  console.log('2. Replace main JSON with simplified version');
  console.log('3. Replace main JSON with basic version');
  console.log('4. Fix April 2025 dates manually');
  console.log('5. List all tithi JSON files');
  console.log('0. Exit');
  
  rl.question('Select an option: ', (answer) => {
    switch (answer) {
      case '1':
        archiveUnusedFiles();
        break;
      case '2':
        replaceMainJson('tithis_2024_2030_simplified.json');
        showMenu();
        break;
      case '3':
        replaceMainJson('tithis_2024_2030_basic.json');
        showMenu();
        break;
      case '4':
        fixAprilDates();
        break;
      case '5':
        listTithiFiles();
        break;
      case '0':
        rl.close();
        return;
      default:
        console.log('Invalid option. Please try again.');
        showMenu();
    }
  });
}

// Archive all unused files
function archiveUnusedFiles() {
  console.log('\nArchiving unused JSON files...');
  
  let count = 0;
  tithiFiles.forEach(file => {
    if (archiveFile(file)) {
      count++;
    }
  });
  
  console.log(`\nArchived ${count} files to ${archiveDir}`);
  showMenu();
}

// Fix specific dates in April 2025
function fixAprilDates() {
  try {
    console.log('\nFixing April 2025 dates...');
    
    // Read the current JSON file
    const jsonData = JSON.parse(fs.readFileSync(MAIN_JSON_FILE, 'utf8'));
    
    // Make backup
    const backupFile = 'tithis_2024_2030_backup.json';
    if (!fs.existsSync(backupFile)) {
      fs.writeFileSync(backupFile, JSON.stringify(jsonData, null, 2));
      console.log(`✅ Backup created at ${backupFile}`);
    }
    
    // Fix April 10, 2025 (should be Purnima)
    let foundApr10 = false;
    for (const entry of jsonData["2025"]["Purnima"]) {
      if (entry.date === "2025-04-10") {
        entry.full_name = "Purnima";
        foundApr10 = true;
        break;
      }
    }
    
    if (!foundApr10) {
      console.log("Adding April 10, 2025 as Purnima");
      jsonData["2025"]["Purnima"].push({
        "date": "2025-04-10",
        "full_name": "Purnima"
      });
    }
    
    // Remove incorrect April 13, 2025 Purnima entry if it exists
    jsonData["2025"]["Purnima"] = jsonData["2025"]["Purnima"].filter(
      entry => entry.date !== "2025-04-13"
    );
    
    // Fix April 7, 2025 (should be Dwadashi)
    let foundApr07 = false;
    for (const entry of jsonData["2025"]["Dwadashi"]) {
      if (entry.date === "2025-04-07") {
        entry.full_name = "Shukla Dwadashi";
        foundApr07 = true;
        break;
      }
    }
    
    if (!foundApr07) {
      console.log("Adding April 7, 2025 as Dwadashi");
      jsonData["2025"]["Dwadashi"].push({
        "date": "2025-04-07",
        "full_name": "Shukla Dwadashi"
      });
    }
    
    // Remove incorrect April 10, 2025 Dwadashi entry if it exists
    jsonData["2025"]["Dwadashi"] = jsonData["2025"]["Dwadashi"].filter(
      entry => entry.date !== "2025-04-10"
    );
    
    // Save the changes
    fs.writeFileSync(MAIN_JSON_FILE, JSON.stringify(jsonData, null, 2));
    console.log("✅ Successfully fixed April 2025 dates in main JSON file");
    
  } catch (err) {
    console.error(`❌ Error fixing dates: ${err.message}`);
  }
  
  showMenu();
}

// List all tithi-related JSON files
function listTithiFiles() {
  console.log('\nTithi JSON files in this directory:');
  
  // Get all JSON files in current directory
  const files = fs.readdirSync(__dirname)
    .filter(file => file.endsWith('.json') && file.includes('tithi'));
    
  files.forEach(file => {
    const stats = fs.statSync(file);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`- ${file} (${sizeInMB} MB)`);
  });
  
  // Check if archive folder has files
  if (fs.existsSync(archiveDir)) {
    const archiveFiles = fs.readdirSync(archiveDir)
      .filter(file => file.endsWith('.json') && file.includes('tithi'));
      
    if (archiveFiles.length > 0) {
      console.log('\nArchived tithi JSON files:');
      archiveFiles.forEach(file => {
        const stats = fs.statSync(path.join(archiveDir, file));
        const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`- ${file} (${sizeInMB} MB)`);
      });
    }
  }
  
  checkFileUsage();
  showMenu();
}

console.log("===== Tithi JSON Files Cleanup Tool =====");
showMenu();