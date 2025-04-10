// filepath: c:\Users\meowKrbhva\Documents\Jai Ma Adya\ProjectNexon\netlify\functions\hourlyOperations.js
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

// This function replaces the hourly operations task from scheduler.js
exports.handler = async function(event, context) {
  try {
    logMessage('Running scheduled task: Hourly operations');
    
    // Determine the correct API URL based on environment
    const baseUrl = process.env.URL || 'http://localhost:3000';
    const response = await axios.get(`${baseUrl}/api/cron/hourly`);
    
    logMessage(`Task completed with status: ${response.status}`);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Hourly operations completed successfully',
        status: response.status
      })
    };
  } catch (error) {
    logMessage(`Error executing hourly task: ${error.message}`);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        message: 'Error during hourly operations',
        error: error.message
      })
    };
  }
};

// Export schedule configuration
exports.config = {
  schedule: "0 * * * *" // run at the top of every hour
};