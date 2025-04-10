const schedule = require('node-schedule');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configure logging
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

function logMessage(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(path.join(logDir, 'scheduler.log'), logMessage);
  console.log(logMessage);
}

// Schedule tasks
// Run every day at midnight
schedule.scheduleJob('0 0 * * *', async () => {
  try {
    logMessage('Running scheduled task: Daily operations');
    const response = await axios.get('http://localhost:3000/api/cron/daily');
    logMessage(`Task completed with status: ${response.status}`);
  } catch (error) {
    logMessage(`Error executing daily task: ${error.message}`);
  }
});

// Run every hour
schedule.scheduleJob('0 * * * *', async () => {
  try {
    logMessage('Running scheduled task: Hourly operations');
    const response = await axios.get('http://localhost:3000/api/cron/hourly');
    logMessage(`Task completed with status: ${response.status}`);
  } catch (error) {
    logMessage(`Error executing hourly task: ${error.message}`);
  }
});

// Run tithi reminder sending task every day at 9 AM
schedule.scheduleJob('0 9 * * *', async () => {
  try {
    logMessage('Running scheduled task: Sending tithi reminders');
    const apiUrl = process.env.NODE_ENV === 'production' 
      ? 'https://simpletithireminder.netlify.app/.netlify/functions/sendReminders'
      : 'http://localhost:8888/.netlify/functions/sendReminders';
    
    const response = await axios.post(apiUrl);
    const resultData = response.data;
    
    logMessage(`Reminder task completed with status: ${response.status}`);
    logMessage(`Reminder summary: ${resultData.message}`);
    
    if (resultData.totalSubscribers) {
      logMessage(`Total subscribers notified: ${resultData.totalSubscribers}`);
    }
  } catch (error) {
    logMessage(`Error executing tithi reminder task: ${error.message}`);
    
    // More detailed error logging
    if (error.response) {
      logMessage(`Error response data: ${JSON.stringify(error.response.data)}`);
    }
  }
});

// Weekly maintenance task - run every Sunday at 1 AM
schedule.scheduleJob('0 1 * * 0', async () => {
  try {
    logMessage('Running scheduled task: Weekly maintenance');
    // Check Firebase database health
    const healthCheckUrl = process.env.NODE_ENV === 'production'
      ? 'https://simpletithireminder.netlify.app/.netlify/functions/checkStatus'
      : 'http://localhost:8888/.netlify/functions/checkStatus';
    
    const response = await axios.get(healthCheckUrl);
    logMessage(`Maintenance task completed with status: ${response.status}`);
  } catch (error) {
    logMessage(`Error executing maintenance task: ${error.message}`);
  }
});

logMessage('Scheduler started successfully');

// Export for testing purposes
module.exports = {
  logMessage
};
