# Tithi Reminder System Debugging Guide

This document provides documentation for debugging tools and processes for the Tithi Reminder System.

## Table of Contents
- [Debug Functions](#debug-functions)
- [Testing Tools](#testing-tools)
- [Common Issues](#common-issues)
- [Environment Variables](#environment-variables)
- [Monitoring and Logs](#monitoring-and-logs)

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

### Running Schedule

The reminder function is configured to run on the following schedule:

```javascript
exports.config = {
  // Run every 4 hours (6 times per day)
  schedule: "0 */4 * * *" 
};
```

You can adjust this schedule as needed once you confirm the system is working properly.