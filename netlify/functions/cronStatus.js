const { subscriptionStore } = require('../../config/firebase');
const admin = require('firebase-admin');

// Check if already initialized to prevent multiple initialization errors
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
  }
}

const db = admin.firestore();

// Function to log cron job execution to Firestore
const logCronExecution = async (functionName, status, details) => {
  try {
    await db.collection('cronExecutions').doc(functionName).set({
      lastRun: admin.firestore.FieldValue.serverTimestamp(),
      status: status || 'success',
      details: details || {},
      functionName
    }, { merge: true });
    console.log(`Logged cron execution for ${functionName}`);
    return true;
  } catch (error) {
    console.error(`Failed to log cron execution for ${functionName}:`, error);
    return false;
  }
};

// Export the logging function so other modules can use it
exports.logCronExecution = logCronExecution;

// Main handler for the cronStatus endpoint
const handler = async (event, context) => {
  // For scheduled runs, log the next run time
  try {
    // Handle both event formats (Netlify scheduled function and direct HTTP request)
    const body = event.body ? JSON.parse(event.body) : event;
    
    if (body && body.next_run) {
      console.log(`CronStatus next scheduled run at: ${body.next_run}`);
      
      // Log this heartbeat to Firestore
      await logCronExecution('cronStatus', 'heartbeat', { 
        nextRun: body.next_run,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    // Ignore JSON parsing errors
  }

  try {
    const snapshot = await db.collection('cronExecutions').get();
    
    const results = [];
    snapshot.forEach(doc => {
      results.push({
        functionName: doc.id,
        ...doc.data()
      });
    });
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Cron job statuses retrieved successfully',
        cronJobs: results
      }),
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (error) {
    console.error('Error retrieving cron job statuses:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to retrieve cron job statuses',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
      }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};

// Export the handler for CommonJS compatibility
exports.handler = handler;

// Set up a schedule for this function itself to ensure at least this one runs
exports.config = {
  schedule: "@daily" // Run once a day as a heartbeat check
};