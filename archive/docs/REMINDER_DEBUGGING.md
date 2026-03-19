# Tithi Reminder System Debugging Guide

This document provides documentation for debugging tools and processes for the Tithi Reminder System.

## Table of Contents
- [Debug Functions](#debug-functions)
- [Testing Tools](#testing-tools)
- [Common Issues](#common-issues)
- [Environment Variables](#environment-variables)
- [Monitoring and Logs](#monitoring-and-logs)
- [File Path Issues](#file-path-issues)

## Debug Functions

### debugReminders.js

The `debugReminders.js` function is a wrapper around the main `sendReminders.js` function that provides detailed logging for debugging purposes. It helps identify issues with the tithi reminder system in the production environment.

#### Function Overview

```javascript
const { handler } = require('./sendReminders');

exports.handler = async (event, context) => {
  // Debug logging and functionality
  // ...
};
```

#### What It Does

1. **Logs environment variables** (important for email delivery):
   - BREVO_API_KEY (existence check only, not the actual key)
   - SENDER_EMAIL
   - SENDER_NAME
   - REMINDER_LEAD_DAYS

2. **Calculates and logs date information**:
   - Current date
   - Target date for tithi calculation based on lead days

3. **Calls the actual reminder function** and logs its result

4. **Provides detailed error information** if the function fails

#### How to Access

This function is deployed to Netlify as a serverless function and can be accessed at:

```
https://simpletithireminder.netlify.app/.netlify/functions/debugReminders
```

## Testing Tools

### test_reminders.js

This script allows you to manually trigger both the debug and regular reminder functions to test if they're working properly.

#### Script Overview

```javascript
const axios = require('axios');

async function testReminders() {
  // Testing functionality
  // ...
}

// Execute the tests
testReminders();
```

#### What It Does

1. **Tests the Debug Function**:
   - Makes a POST request to the debugReminders function
   - Logs the response status and data

2. **Tests the Regular Reminder Function**:
   - Makes a POST request to the sendReminders function
   - Logs the response status and data

3. **Provides error handling** with detailed information about any issues

#### How to Use

Run the script using Node.js:

```bash
node test_reminders.js
```

## Common Issues

### No Emails Being Received

If subscribers are not receiving tithi reminder emails, check the following:

1. **Environment variables** are correctly set in Netlify:
   - BREVO_API_KEY
   - SENDER_EMAIL
   - SENDER_NAME

2. **Lead days setting** - If set too high, there may not be any tithis within that period:
   - Try setting REMINDER_LEAD_DAYS to 1 to increase chances of finding upcoming tithis

3. **Scheduled function execution** - Check if the function is running as scheduled:
   - Check Netlify function logs
   - The function is configured to run every 4 hours (can be adjusted)

4. **Email delivery issues** - Check if emails are being sent but not delivered:
   - Check Brevo dashboard for bounces or rejections
   - Check spam folders

### Function Errors

If the functions are failing, use the debugReminders function to get detailed information:

1. Run `node test_reminders.js` to check for any errors
2. Check Netlify function logs for error messages
3. Verify data consistency in your Firebase database

## File Path Issues

### Tithi Data File Not Found

A common error in the Netlify serverless environment is:

```
Error loading tithi data from file: Error: ENOENT: no such file or directory, open '/var/task/tithis_2024_2030_basic.json'
```

This occurs because the file path in the serverless environment (`/var/task/`) is different from your local environment.

#### How to Fix

1. **Modify the file path in sendReminders.js**:

   Instead of:
   ```javascript
   const tithiDataPath = path.join(__dirname, '..', '..', 'tithis_2024_2030_basic.json');
   ```

   Use:
   ```javascript
   // Handle both local development and Netlify serverless environments
   const tithiDataPath = process.env.NETLIFY 
     ? path.join(__dirname, 'tithis_2024_2030_basic.json')  // Netlify serverless path
     : path.join(__dirname, '..', '..', 'tithis_2024_2030_basic.json'); // Local dev path
   ```

2. **Include the file in the function bundle**:
   
   Update your `netlify.toml` to include the tithi data file in the function bundle:

   ```toml
   [functions]
     directory = "netlify/functions"
     included_files = ["tithis_2024_2030_basic.json"]
   ```

3. **Testing the fix**:
   
   After deploying these changes, run:
   ```bash
   node test_reminders.js
   ```
   
   This should now be able to access the tithi data file correctly.

### Alternative Solution: Bundle Data

If the above solution doesn't work, an alternative is to bundle the tithi data directly in the code:

1. Convert the JSON file to a JavaScript module:
   ```javascript
   // Create a file named tithiData.js
   module.exports = {
     2024: { ... },
     2025: { ... },
     // etc.
   };
   ```

2. Import this module in sendReminders.js instead of reading from the file system:
   ```javascript
   const tithiData = require('./tithiData');
   ```

## Environment Variables

The following environment variables should be set in your Netlify dashboard:

| Variable | Purpose | Notes |
|----------|---------|-------|
| BREVO_API_KEY | API key for sending emails | Required for email delivery |
| SENDER_EMAIL | Email address used as sender | Should be verified in Brevo |
| SENDER_NAME | Name displayed as sender | User-friendly name |
| REMINDER_LEAD_DAYS | Days ahead to check for tithis | Default is 2, try 1 if no emails |

## Monitoring and Logs

### Netlify Logs

To view detailed logs for your functions:

1. Go to Netlify dashboard
2. Navigate to Functions
3. Select the function you want to check (e.g., sendReminders, debugReminders)
4. Click on "Logs" to see execution details

### Cron Job Status

Netlify scheduled functions do not have a built-in dashboard for cron job status. To monitor the status of your scheduled functions:

#### Option 1: View Function Invocation Logs

1. Go to the Netlify dashboard
2. Navigate to **Site settings** > **Functions** > **Scheduled functions**
3. Here you can see all your scheduled functions and their execution schedule
4. To check if they're running as expected, look at the **Function logs**

#### Option 2: Implement Status Reporting

Add status reporting to your system:

1. Modify your scheduled functions to write to a status database (Firebase) when they run
   ```javascript
   // In your scheduled function:
   const timestamp = new Date().toISOString();
   await db.collection('cronStatus').doc('sendReminders').set({
     lastRun: timestamp,
     status: 'success' // or 'error' with error details
   });
   ```

2. Create a simple status dashboard function that reads this information:
   ```javascript
   // Create a new function called cronStatus.js
   exports.handler = async () => {
     const statuses = await db.collection('cronStatus').get();
     return {
       statusCode: 200,
       body: JSON.stringify(statuses.docs.map(doc => ({
         function: doc.id,
         lastRun: doc.data().lastRun,
         status: doc.data().status
       })))
     };
   };
   ```

3. Access this endpoint to check when your cron jobs last ran:
   ```
   https://simpletithireminder.netlify.app/.netlify/functions/cronStatus
   ```

#### Option 3: Use External Monitoring

Set up external monitoring:

1. Use a service like UptimeRobot, Pingdom, or StatusCake
2. Create a monitoring endpoint in your app that checks when functions last ran
3. Have the monitoring service periodically check this endpoint
4. Set up alerts if functions haven't run in the expected timeframe

### Running Schedule

The reminder function is configured to run on the following schedule:

```javascript
exports.config = {
  // Run every 4 hours (6 times per day)
  schedule: "0 */4 * * *" 
};
```

You can adjust this schedule as needed once you confirm the system is working properly.

### Manual Testing of Cron Jobs

You can manually trigger your scheduled functions to verify they're working correctly:

```bash
# Run this command to test if the reminders function works properly
node test_reminders.js
```

After running this test, check the function logs in Netlify to confirm execution details and any errors that may have occurred.