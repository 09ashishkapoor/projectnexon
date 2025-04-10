// filepath: c:\Users\meowKrbhva\Documents\Jai Ma Adya\ProjectNexon\netlify\functions\dailyMaintenance.js
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configure logging
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

function logMessage(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(path.join(logDir, 'scheduler.log'), logMessage);
  console.log(logMessage);
}

// This function replaces the daily operations task from scheduler.js
exports.handler = async function(event, context) {
  try {
    logMessage('Running scheduled task: Daily operations');
    
    // Determine the correct API URL based on environment
    const baseUrl = process.env.URL || 'http://localhost:3000';
    const response = await axios.get(`${baseUrl}/api/cron/daily`);
    
    logMessage(`Task completed with status: ${response.status}`);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Daily maintenance completed successfully',
        status: response.status
      })
    };
  } catch (error) {
    logMessage(`Error executing daily task: ${error.message}`);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        message: 'Error during daily maintenance',
        error: error.message
      })
    };
  }
};

// Export schedule configuration
exports.config = {
  schedule: "0 0 * * *" // run at midnight every day
};