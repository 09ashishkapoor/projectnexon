const { subscriptionStore } = require('../../config/firebase');

exports.handler = async (event, context) => {
  const { email } = event.queryStringParameters;

  if (!email) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Email address is required.' }),
    };
  }

  try {
    await subscriptionStore.delete(email.toLowerCase());
    
    console.log(`Subscription deleted for ${email}`);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'You have been successfully unsubscribed.' }),
    };
  } catch (error) {
    console.error('Error deleting subscription:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error unsubscribing. Please try again later.' }),
    };
  }
};