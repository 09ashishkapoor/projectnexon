const fetch = require('node-fetch');
const { subscriptionStore } = require('../../config/firebase');

const ALLOWED_DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
      headers: { 'Allow': 'POST' },
    };
  }

  try {
    console.log('Using Firebase Firestore for storage');
    
    const { email, selectedTithis, website, 'g-recaptcha-response': captchaToken } = JSON.parse(event.body);

    // Honeypot check
    if (website && website.trim() !== '') {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Bot detected.' }),
      };
    }

    // Validate CAPTCHA (skip for test tokens)
    if (captchaToken !== 'test-token') {
      if (!captchaToken) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: 'CAPTCHA verification required.' }),
        };
      }

      try {
        const captchaResponse = await fetch(
          `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET}&response=${captchaToken}`
        );
        const captchaResult = await captchaResponse.json();

        if (!captchaResult.success) {
          return {
            statusCode: 400,
            body: JSON.stringify({ message: 'CAPTCHA verification failed.' }),
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

    // Domain validation (skip for test email)
    if (!email.includes('test-') && email.indexOf('@') > 0) {
      const domain = email.split('@')[1].toLowerCase();
      if (!ALLOWED_DOMAINS.includes(domain)) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: 'Please use major email providers (Gmail, Yahoo, Outlook, or Hotmail).' }),
        };
      }
    }

    if (!selectedTithis?.length) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'At least one Tithi must be selected.' }),
      };
    }

    // Normalize and validate Tithis
    const normalizedTithis = selectedTithis
      .map(t => String(t).trim())
      .filter(t => t.length > 0);

    try {
      // Use Firebase to store the subscription
      const key = email.toLowerCase();
      const value = JSON.stringify(normalizedTithis);
      
      console.log('Attempting to store subscription in Firebase:', { key, value });
      await subscriptionStore.set(key, value);
      
      console.log(`Subscription saved for ${email} with ${normalizedTithis.length} Tithis`);
      
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          message: 'Subscription successful!',
          subscribedTithis: normalizedTithis
        }),
      };
    } catch (storageError) {
      console.error('Firebase storage error:', storageError);
      throw new Error(`Failed to save subscription: ${storageError.message}`);
    }
  } catch (error) {
    console.error('Error processing subscription:', error);
    
    const statusCode = error instanceof SyntaxError ? 400 : 500;
    const message = error instanceof SyntaxError 
      ? 'Invalid request format.'
      : `Subscription failed: ${error.message}`;

    return {
      statusCode,
      body: JSON.stringify({ message }),
    };
  }
};