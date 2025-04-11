const { handler } = require('./sendReminders');

// Debug wrapper handler
exports.handler = async (event, context) => {
  console.log('DEBUG: Starting debugReminders function at', new Date().toISOString());
  
  try {
    // Log important environment variables (sanitized)
    console.log('DEBUG: BREVO_API_KEY exists:', !!process.env.BREVO_API_KEY);
    console.log('DEBUG: SENDER_EMAIL:', process.env.SENDER_EMAIL || 'not set');
    console.log('DEBUG: SENDER_NAME:', process.env.SENDER_NAME || 'not set');
    console.log('DEBUG: REMINDER_LEAD_DAYS:', process.env.REMINDER_LEAD_DAYS || 'not set (using default 2)');
    
    // Calculate target date
    const leadDays = parseInt(process.env.REMINDER_LEAD_DAYS || '2', 10);
    const targetDate = new Date();
    targetDate.setUTCDate(targetDate.getUTCDate() + leadDays);
    console.log('DEBUG: Current date:', new Date().toISOString());
    console.log('DEBUG: Target date for tithis:', targetDate.toISOString());
    
    // Call the actual handler
    const result = await handler(event, context);
    
    // Log the result
    console.log('DEBUG: Function result:', result);
    console.log('DEBUG: Response body:', result.body);
    
    return result;
  } catch (error) {
    console.error('DEBUG: Error in debugReminders:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Debug error in reminder function',
        error: error.message,
        stack: error.stack
      })
    };
  }
};