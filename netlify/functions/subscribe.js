// Import Netlify Blobs client
const { getStore } = require('@netlify/blobs');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Define the Blob store name (should match what's enabled in Netlify UI/config)
const storeName = 'subscriptions'; 

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
      headers: { 'Allow': 'POST' },
    };
  }

  let store;
  try {
    // Get the Blob store instance
    store = getStore(storeName);
  } catch (setupError) {
      console.error('Error accessing Blob store:', setupError);
      return {
          statusCode: 500,
          body: JSON.stringify({ message: 'Could not access subscription store.' }),
      };
  }

  // IP Blacklist check
  const ip = event.headers['x-forwarded-for']?.split(',')[0].trim() || 'unknown';
  const blacklistKey = `blacklist-${ip}`;
  try {
    const isBlacklisted = await store.get(blacklistKey);
    if (isBlacklisted) {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: 'Access denied.' }),
      };
    }
  } catch (err) {
    console.error('Blacklist check failed:', err);
    // Fail open: allow request if blacklist check fails
  }

  // Basic IP-based rate limiting
  const rateLimitKey = `rate-limit-${ip}`;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = 5;

  try {
    const record = await store.get(rateLimitKey, { type: 'json' }) || { count: 0, startTime: now };
    if (now - record.startTime < windowMs) {
      if (record.count >= maxRequests) {
        return {
          statusCode: 429,
          body: JSON.stringify({ message: 'Too many requests. Please try again later.' }),
        };
      } else {
        record.count++;
      }
    } else {
      // Reset window
      record.count = 1;
      record.startTime = now;
    }
    await store.set(rateLimitKey, JSON.stringify(record));
  } catch (err) {
    console.error('Rate limit check failed:', err);
    // Fail open: allow request if rate limit check fails
  }

  try {
    // Parse the incoming request body
    const body = JSON.parse(event.body);
    let { email, selectedTithis, website } = body;

    // Honeypot check
    if (website && website.trim() !== '') {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Bot detected.' }),
      };
    }


    // Basic server-side validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid email address provided.' }),
      };
    }


    // Normalize email to lowercase to use as a consistent key
    email = email.toLowerCase();

    if (!selectedTithis || !Array.isArray(selectedTithis) || selectedTithis.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'At least one Tithi must be selected.' }),
      };
    }
    // Ensure Tithi names are consistent (e.g., trim whitespace)
    selectedTithis = selectedTithis.map(t => String(t).trim()).filter(t => t.length > 0);
    if (selectedTithis.length === 0) {
       return {
         statusCode: 400,
         body: JSON.stringify({ message: 'Valid Tithi selection is required.' }),
       };
    }

    // Save/Update subscription in Netlify Blobs
    // Use email as the key
    // Store the array of selected Tithis directly as JSON
    await store.setJSON(email, selectedTithis, { 
        metadata: { subscribedAt: new Date().toISOString() } 
    });

    console.log(`Subscription saved/updated for ${email}`);

    // Return success response
    return {
      statusCode: 200, // 200 OK for set (creates or updates)
      body: JSON.stringify({ message: 'Subscription successful!' }),
    };

  } catch (error) {
    console.error('Error processing subscription:', error);

    // Check if the error is from JSON parsing
    const isJsonError = error instanceof SyntaxError;
    let statusCode = 500;
    let message = 'Error processing subscription';

    if (isJsonError) {
      statusCode = 400;
      message = 'Invalid request body.';
    } 
    // Note: Netlify Blobs errors might not have a specific statusCode property like Airtable's client
    // Check error type or message if more specific handling is needed
    else {
        message = `Error saving subscription: ${error.message}`;
    }

    return {
      statusCode: statusCode,
      body: JSON.stringify({ 
        message: message,
        // error: process.env.NODE_ENV === 'development' ? error.message : undefined 
      }),
    };
  }
}; 