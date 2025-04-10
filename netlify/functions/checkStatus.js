const { subscriptionStore } = require('../../config/firebase');
const fetch = require('node-fetch');

const RECAPTCHA_SCORE_THRESHOLD = 0.5; // Minimum score to accept (0.0 to 1.0)

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
      headers: { 'Allow': 'POST' },
    };
  }

  try {
    console.log('Checking subscription status');
    
    const { email, 'g-recaptcha-response': captchaToken } = JSON.parse(event.body);

    // Validate CAPTCHA (skip for test tokens)
    if (captchaToken !== 'test-token') {
      if (!captchaToken) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: 'CAPTCHA verification required.' }),
        };
      }

      try {
        // ReCAPTCHA v3 verification
        const captchaResponse = await fetch(
          `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET}&response=${captchaToken}`
        );
        const captchaResult = await captchaResponse.json();

        console.log('reCAPTCHA verification result:', JSON.stringify(captchaResult));

        if (!captchaResult.success) {
          return {
            statusCode: 400,
            body: JSON.stringify({ 
              message: 'CAPTCHA verification failed.',
              details: captchaResult['error-codes'] || 'Unknown error'
            }),
          };
        }

        // Check the score for v3 reCAPTCHA
        if (captchaResult.score < RECAPTCHA_SCORE_THRESHOLD) {
          console.log(`Low reCAPTCHA score: ${captchaResult.score}`);
          return {
            statusCode: 400,
            body: JSON.stringify({ 
              message: 'Our system flagged this submission as potentially automated. Please try again later.',
              score: captchaResult.score
            }),
          };
        }
      } catch (captchaError) {
        console.error('CAPTCHA verification error:', captchaError);
        return {
          statusCode: 500,
          body: JSON.stringify({ message: 'CAPTCHA verification failed. Please try again.' }),
        };
      }
    } else {
      console.log('Using test token - skipping CAPTCHA verification');
    }

    // Basic server-side validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid email address provided.' }),
      };
    }

    try {
      // Use Firebase to check subscription
      const key = email.toLowerCase();
      console.log('Fetching subscription data for email:', key);
      
      const tithiData = await subscriptionStore.get(key);
      
      if (!tithiData) {
        return {
          statusCode: 404,
          body: JSON.stringify({ message: 'No subscription found for this email address.' }),
        };
      }
      
      try {
        const tithiList = JSON.parse(tithiData);
        if (!Array.isArray(tithiList)) {
          throw new Error('Invalid subscription data format');
        }
        
        return {
          statusCode: 200,
          body: JSON.stringify({
            message: 'Subscription found',
            email: key,
            subscribedTithis: tithiList,
            active: true
          }),
        };
      } catch (parseError) {
        console.error('Error parsing subscription data:', parseError);
        return {
          statusCode: 500,
          body: JSON.stringify({ message: 'Error retrieving subscription details.' }),
        };
      }
    } catch (storageError) {
      console.error('Firebase storage error:', storageError);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Error checking subscription status.' }),
      };
    }
  } catch (error) {
    console.error('Error processing status check:', error);
    
    const statusCode = error instanceof SyntaxError ? 400 : 500;
    const message = error instanceof SyntaxError 
      ? 'Invalid request format.'
      : `Status check failed: ${error.message}`;

    return {
      statusCode,
      body: JSON.stringify({ message }),
    };
  }
};