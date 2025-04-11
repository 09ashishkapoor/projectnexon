const axios = require('axios');

async function testReminders() {
  try {
    console.log('Testing Tithi reminder functions...');
    
    // Testing the debug function
    console.log('\n===== Testing Debug Reminders =====');
    const debugUrl = 'https://simpletithireminder.netlify.app/.netlify/functions/debugReminders';
    const debugResponse = await axios.post(debugUrl);
    console.log('Debug Status:', debugResponse.status);
    console.log('Debug Response:', debugResponse.data);
    
    // Testing the regular function
    console.log('\n===== Testing Regular Reminders =====');
    const regularUrl = 'https://simpletithireminder.netlify.app/.netlify/functions/sendReminders';
    const regularResponse = await axios.post(regularUrl);
    console.log('Regular Status:', regularResponse.status);
    console.log('Regular Response:', regularResponse.data);
    
    console.log('\nTests completed successfully!');
  } catch (error) {
    console.error('Error during testing:');
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
  }
}

// Execute the tests
testReminders();