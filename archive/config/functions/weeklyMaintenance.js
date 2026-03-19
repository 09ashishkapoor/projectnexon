// filepath: c:\Users\meowKrbhva\Documents\Jai Ma Adya\ProjectNexon\netlify\functions\weeklyMaintenance.js
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

// This function replaces the weekly maintenance task from scheduler.js
exports.handler = async function(event, context) {
  try {
    logMessage('Running scheduled task: Weekly maintenance');
    
    // Determine the correct API URL based on environment
    const baseUrl = process.env.URL || 'http://localhost:8888';
    
    // Check Firebase database health
    const response = await axios.get(`${baseUrl}/.netlify/functions/checkStatus`);
    logMessage(`Maintenance task completed with status: ${response.status}`);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Weekly maintenance completed successfully',
        status: response.status,
        healthCheckResult: response.data
      })
    };
  } catch (error) {
    logMessage(`Error executing maintenance task: ${error.message}`);
    
    // More detailed error logging
    if (error.response) {
      logMessage(`Error response data: ${JSON.stringify(error.response.data)}`);
    }
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        message: 'Error during weekly maintenance',
        error: error.message
      })
    };
  }
};

// Export schedule configuration
exports.config = {
  schedule: "0 1 * * 0" // run at 1 AM UTC every Sunday
};