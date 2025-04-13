const axios = require('axios');

// Use this when running locally with Netlify dev
const BASE_URL = process.env.NETLIFY_DEV 
  ? 'http://localhost:8888/.netlify/functions' 
  : 'https://simpletithireminder.netlify.app/.netlify/functions';

async function testCronJobs() {
  try {
    console.log('Testing cron job functionality...');
    console.log('=================================');
    
    // Test sendReminders function
    console.log('\n1. Testing sendReminders function:');
    try {
      // Simulate scheduled function request body with next_run
      const remindersResponse = await axios.post(`${BASE_URL}/sendReminders`, {
        next_run: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour from now
      });
      console.log(`Status: ${remindersResponse.status}`);
      console.log('Response:', JSON.stringify(remindersResponse.data, null, 2));
    } catch (error) {
      console.error('Error testing sendReminders:', error.response?.data || error.message);
    }
    
    // Test cronStatus function to check if logging works
    console.log('\n2. Testing cronStatus function:');
    try {
      // Simulate scheduled function request body with next_run
      const statusResponse = await axios.get(`${BASE_URL}/cronStatus`);
      console.log(`Status: ${statusResponse.status}`);
      console.log('Response:', JSON.stringify(statusResponse.data, null, 2));
    } catch (error) {
      console.error('Error testing cronStatus:', error.response?.data || error.message);
    }
    
    // Wait a moment to let logs settle
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if our executions were logged
    console.log('\n3. Checking execution logs:');
    try {
      const logsResponse = await axios.get(`${BASE_URL}/cronStatus`);
      console.log('Cron execution logs:');
      if (logsResponse.data.cronJobs && logsResponse.data.cronJobs.length > 0) {
        logsResponse.data.cronJobs.forEach(job => {
          console.log(`- ${job.functionName}: Last run at ${job.lastRun ? new Date(job.lastRun._seconds * 1000).toISOString() : 'unknown'}, Status: ${job.status}`);
        });
      } else {
        console.log('No execution logs found. The logging system may not be working correctly.');
      }
    } catch (error) {
      console.error('Error checking logs:', error.response?.data || error.message);
    }
    
    console.log('\nAll tests completed!');
    
  } catch (error) {
    console.error('Testing failed:', error);
  }
}

// Run the tests
testCronJobs();